// Schadenspipeline (Spieler ↔ Monster), Kills, XP/Gold/Beute.
import { Entity, EntityDamageCause, EntityHealthComponent, EquipmentSlot, ItemStack, Player, system, world } from "@minecraft/server";
import { MOB_DMG_BASE_MULT, mobDmgScale, mobGold, mobXp } from "../data/balance";
import { classById } from "../data/classes";
import { DamageKind, weaponTypeDef } from "../data/items";
import { emit } from "../core/bus";
import { pdata, markDirty, stat } from "../core/store";
import { V, isValid, msg, particle, rand, randInt, sound } from "../core/util";
import { CLASS_WEAPONS, createGear, getEquip, getGear, randomGearFor, weaponDamage, weaponOf } from "./gear";
import { MobInfo, assignLevel, forgetMob, getInfo, isHostile, mobDef, peekInfo, totalHpScale } from "./mobs";
import { addGold, addXp } from "./progression";
import { getShield, healRpg, setShield, stats, tempBuff } from "./stats";

const lastAttack = new Map<string, number>(); // Spieler → Tick
const lastHit = new Map<string, { pid: string; t: number }>(); // Ziel → letzter Spieler-Treffer
const pending = new Map<string, number>(); // Ziel → vorberechneter Vanilla-Schaden (Script-Schaden)
const forcedCrit = new Set<string>();
export const targetInfo = new Map<string, { id: string; t: number }>(); // Spieler → zuletzt getroffenes Ziel
const procQueue: (() => void)[] = [];

type ProcFn = (p: Player, target: Entity, rpg: number, crit: boolean) => void;
const uniqueProcs = new Map<string, ProcFn>();
export function registerProc(effect: string, fn: ProcFn): void {
  uniqueProcs.set(effect, fn);
}

export function forceCrit(p: Player): void {
  forcedCrit.add(p.id);
}

export function kindMultiplier(p: Player, kind: DamageKind, now: number): number {
  const s = stats(p, now);
  const m = s.mods;
  let mult = 1 + (m["dmg%"] ?? 0);
  switch (kind) {
    case "melee_str":
      mult += s.attrs.str * 0.03 + (m["melee%"] ?? 0);
      break;
    case "melee_dex":
      mult += s.attrs.dex * 0.03 + (m["melee%"] ?? 0);
      break;
    case "ranged":
      mult += s.attrs.dex * 0.03 + (m["ranged%"] ?? 0);
      break;
    case "magic":
      mult += s.attrs.int * 0.035 + (m["magic%"] ?? 0);
      break;
  }
  return mult;
}

/** Waffengrundschaden des Spielers (mit Stufen-/Klassenstrafe). */
export function weaponBase(p: Player): { dmg: number; kind: DamageKind; typeId?: string; penalty?: string } {
  const item = getEquip(p, EquipmentSlot.Mainhand);
  const w = weaponOf(item?.typeId);
  if (!w || !item) return { dmg: 4, kind: "melee_str" };
  const t = weaponTypeDef(w.type)!;
  let dmg = weaponDamage(w, getGear(item));
  let penalty: string | undefined;
  const d = pdata(p);
  const lvl = stats(p).level;
  if (lvl < w.reqLevel) {
    dmg *= 0.3;
    penalty = `§cBenötigt Stufe ${w.reqLevel}`;
  } else if (d.cls && !(CLASS_WEAPONS[d.cls] ?? []).includes(w.type)) {
    dmg *= 0.6;
    penalty = `§7${classById(d.cls)?.name ?? ""} beherrscht diese Waffe nicht (60 % Schaden)`;
  }
  return { dmg, kind: t.kind, typeId: item.typeId, penalty };
}

export function rollCrit(p: Player, now: number, bonus = 0): { crit: boolean; mult: number } {
  const s = stats(p, now);
  if (forcedCrit.has(p.id)) {
    forcedCrit.delete(p.id);
    return { crit: true, mult: s.critDmg + 0.25 };
  }
  const crit = Math.random() < s.crit + bonus;
  return { crit, mult: crit ? s.critDmg : 1 };
}

/** Script-Schaden eines Spielers an einem Ziel (RPG-Einheiten). */
export function dealDamage(p: Player, target: Entity, rpg: number, opts: { kind?: DamageKind; noCrit?: boolean; ability?: string } = {}): number {
  if (!isValid(target) || target.typeId === "minecraft:player" || !isHostile(target)) return 0;
  const now = system.currentTick;
  let dmg = rpg;
  if (opts.ability) dmg *= 1 + (stats(p, now).mods[`ability:${opts.ability}%`] ?? 0);
  let crit = false;
  if (!opts.noCrit) {
    const c = rollCrit(p, now);
    crit = c.crit;
    dmg *= c.mult;
  }
  const mi = getInfo(target);
  const vanilla = Math.max(0.05, dmg / totalHpScale(mi));
  pending.set(target.id, vanilla);
  lastHit.set(target.id, { pid: p.id, t: now });
  targetInfo.set(p.id, { id: target.id, t: now });
  try {
    target.applyDamage(vanilla, { cause: EntityDamageCause.override, damagingEntity: p });
  } catch {
    pending.delete(target.id);
  }
  pending.delete(target.id);
  if (crit) particle(target.dimension, "minecraft:critical_hit_emitter", V.add(target.location, { x: 0, y: 1, z: 0 }));
  lifesteal(p, dmg);
  return dmg;
}

function lifesteal(p: Player, dmg: number): void {
  const ls = stats(p).lifesteal;
  if (ls > 0) healRpg(p, dmg * ls);
}

/** Alle feindlichen Monster im Umkreis. */
export function enemiesNear(dim: Entity["dimension"], loc: { x: number; y: number; z: number }, radius: number): Entity[] {
  try {
    return dim.getEntities({ location: loc, maxDistance: radius, families: ["monster"] }).filter((e) => e.typeId !== "minecraft:player");
  } catch {
    return [];
  }
}

function attackerOf(src: { damagingEntity?: Entity; damagingProjectile?: Entity }): Entity | undefined {
  return src.damagingEntity;
}

export function initCombat(): void {
  // ---------- Schaden umrechnen ----------
  world.beforeEvents.entityHurt.subscribe((ev) => {
    const target = ev.hurtEntity;
    const src = ev.damageSource;
    const pre = pending.get(target.id);
    if (pre !== undefined) {
      ev.damage = pre;
      return;
    }
    const attacker = attackerOf(src);
    const now = system.currentTick;

    // --- Spieler wird verletzt ---
    if (target.typeId === "minecraft:player") {
      const p = target as Player;
      if (!attacker || attacker.typeId === "minecraft:player") return; // Umwelt & PvP unverändert
      const mi = peekInfo(attacker);
      const lvl = mi?.lvl ?? 1;
      let rpg = ev.damage * MOB_DMG_BASE_MULT * mobDmgScale(lvl) * (mi?.dmgMult ?? 1);
      const diff = pdata(p).settings.diff;
      rpg *= diff === 0 ? 0.7 : diff === 2 ? 1.35 : 1;
      const s = stats(p, now);
      rpg *= 1 - s.resist;
      if (tempBuff(p, "wall", now) > 0) rpg *= 0.5;
      const sh = getShield(p);
      if (sh > 0) {
        const absorbed = Math.min(sh, rpg);
        rpg -= absorbed;
        setShield(p, sh - absorbed);
        if (rpg <= 0) {
          ev.cancel = true;
          return;
        }
      }
      const h = p.getComponent("minecraft:health") as EntityHealthComponent | undefined;
      const vmax = h?.effectiveMax ?? 20;
      ev.damage = Math.max(0.1, (rpg / s.maxHp) * vmax);
      return;
    }

    // --- Monster wird verletzt ---
    const proj = src.damagingProjectile;
    let player: Player | undefined;
    if (attacker?.typeId === "minecraft:player") player = attacker as Player;
    let rpg: number | undefined;
    let crit = false;

    if (proj && player) {
      const stored = proj.getDynamicProperty("cdw:d");
      if (typeof stored === "number") {
        rpg = stored;
        const c = rollCrit(player, now, (proj.getDynamicProperty("cdw:c") as number) ?? 0);
        crit = c.crit;
        rpg *= c.mult;
      } else {
        // Vanilla-Bogen/Armbrust/Dreizack
        const c = rollCrit(player, now);
        crit = c.crit;
        rpg = ev.damage * kindMultiplier(player, "ranged", now) * c.mult;
      }
    } else if (player && (src.cause === EntityDamageCause.entityAttack || src.cause === EntityDamageCause.maceSmash)) {
      const wb = weaponBase(player);
      const charge = chargeFactor(player, wb.typeId, now);
      const base = wb.typeId ? wb.dmg : Math.max(ev.damage, 1) * 1.0;
      const c = rollCrit(player, now);
      crit = c.crit;
      rpg = base * charge * kindMultiplier(player, wb.kind, now) * c.mult;
      const pl = player;
      if (wb.penalty && Math.random() < 0.2) procQueue.push(() => pl.onScreenDisplay.setActionBar(wb.penalty!));
      const w = weaponOf(wb.typeId);
      if (w?.unique) {
        const fn = uniqueProcs.get(w.unique.effect);
        const tgt = target;
        const r = rpg;
        const cr = crit;
        if (fn) procQueue.push(() => fn(pl, tgt, r, cr));
      }
    } else if (attacker && attacker.typeId === "cdw:geisterwolf") {
      const owner = attacker.getDynamicProperty("cdw:o");
      const op = typeof owner === "string" ? world.getEntity(owner) : undefined;
      if (op?.typeId === "minecraft:player") {
        player = op as Player;
        rpg = 6 * (1 + 0.22 * (stats(player, now).level - 1)) * kindMultiplier(player, "magic", now) * 0.6;
      }
    }

    if (rpg === undefined || !player) return;
    const mi = peekInfo(target);
    ev.damage = Math.max(0.05, rpg / totalHpScale(mi));
    lastHit.set(target.id, { pid: player.id, t: now });
    targetInfo.set(player.id, { id: target.id, t: now });
    const pl = player;
    const finalRpg = rpg;
    const tgt = target;
    procQueue.push(() => {
      lifesteal(pl, finalRpg);
      if (crit && isValid(tgt)) {
        particle(tgt.dimension, "minecraft:critical_hit_emitter", V.add(tgt.location, { x: 0, y: 1, z: 0 }));
        sound(pl, "random.anvil_land", undefined, 1.9, 0.25);
      }
      if (!mi && isValid(tgt)) assignLevel(tgt);
    });
  });

  system.runInterval(() => {
    while (procQueue.length) {
      const fn = procQueue.shift()!;
      try {
        fn();
      } catch {
        /* ignorieren */
      }
    }
  }, 1);

  // ---------- Kills ----------
  world.afterEvents.entityDie.subscribe((ev) => {
    const dead = ev.deadEntity;
    let id: string;
    try {
      id = dead.id;
    } catch {
      return;
    }
    if (dead.typeId === "minecraft:player") {
      onPlayerDeath(dead as Player);
      return;
    }
    const mi = getInfo(dead);
    let killer: Player | undefined;
    const src = ev.damageSource;
    if (src.damagingEntity?.typeId === "minecraft:player") killer = src.damagingEntity as Player;
    if (!killer) {
      const lh = lastHit.get(id);
      if (lh && system.currentTick - lh.t < 300) {
        const e = world.getEntity(lh.pid);
        if (e?.typeId === "minecraft:player") killer = e as Player;
      }
    }
    lastHit.delete(id);
    forgetMob(id);
    if (!killer || !mi) return;
    onKill(killer, dead, mi);
  });

  world.afterEvents.entityRemove.subscribe((ev) => {
    forgetMob(ev.removedEntityId);
    lastHit.delete(ev.removedEntityId);
  });
}

function chargeFactor(p: Player, typeId: string | undefined, now: number): number {
  const w = weaponOf(typeId);
  const speed = w ? weaponTypeDef(w.type)?.speed ?? 10 : 10;
  const last = lastAttack.get(p.id) ?? -1000;
  lastAttack.set(p.id, now);
  if (speed <= 0) return 1;
  const f = (now - last) / speed;
  return Math.max(0.25, Math.min(1, f));
}

function onKill(killer: Player, dead: Entity, mi: MobInfo): void {
  const def = mi.def;
  const loc = { x: dead.location.x, y: dead.location.y, z: dead.location.z };
  const dim = dead.dimension;
  let families: string[] = [];
  try {
    const tf = dead.getComponent("minecraft:type_family") as unknown as { getTypeFamilies(): string[] } | undefined;
    families = tf?.getTypeFamilies() ?? [];
  } catch {
    /* ignorieren */
  }
  const xpMult = (def?.xpMult ?? 1) * (mi.elite ? 3 : 1);
  const goldMult = (def?.goldMult ?? 1) * (mi.elite ? 3 : 1);
  const party = dim.getPlayers({ location: loc, maxDistance: 48 });
  if (!party.some((p) => p.id === killer.id)) party.push(killer);
  for (const p of party) {
    const plvl = stats(p).level;
    const diff = plvl - mi.lvl;
    const pen = diff > 6 ? Math.max(0.1, 1 - (diff - 6) * 0.15) : 1;
    addXp(p, mobXp(mi.lvl, xpMult) * pen);
    addGold(p, mobGold(mi.lvl, goldMult) * (0.6 + Math.random() * 0.8));
    stat(p, "kills");
    if (mi.elite) stat(p, "eliteKills");
    if (def?.boss) {
      const d = pdata(p);
      d.bossKills[def.id] = (d.bossKills[def.id] ?? 0) + 1;
      markDirty(p);
    }
    emit("kill", { player: p, entity: dead, typeId: dead.typeId, families, info: mi, location: loc });
  }
  // Beute
  if (def) {
    for (const drop of def.drops) {
      if (Math.random() < drop.chance * (mi.elite ? 1.5 : 1)) {
        const id = drop.item.includes(":") ? drop.item : `cdw:${drop.item}`;
        const n = randInt(drop.min ?? 1, drop.max ?? 1);
        try {
          dim.spawnItem(new ItemStack(id, n), loc);
        } catch {
          /* ignorieren */
        }
      }
    }
  }
  const luck = stats(killer).luck;
  let gearChance = def?.boss ? 1 : mi.elite ? 0.35 : def ? 0.035 : 0.02;
  gearChance *= 1 + luck;
  const rolls = def?.boss ? 2 + party.length - 1 : 1;
  for (let i = 0; i < rolls; i++) {
    if (Math.random() >= gearChance) continue;
    const owner = party[i % party.length];
    const typeId = randomGearFor(mi.lvl, pdata(owner).cls);
    const minR = def?.boss ? 2 : mi.elite ? 1 : 0;
    try {
      const item = createGear(typeId, undefined, luck);
      const g = getGear(item);
      if (g && g.r < minR) {
        const better = createGear(typeId, minR);
        dim.spawnItem(better, loc);
      } else dim.spawnItem(item, loc);
      particle(dim, "minecraft:totem_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
    } catch {
      /* ignorieren */
    }
  }
  if (Math.random() < (def ? 0.06 : 0.03)) {
    try {
      dim.spawnItem(new ItemStack(Math.random() < 0.5 ? "cdw:heiltrank_klein" : "cdw:manatrank_klein"), loc);
    } catch {
      /* ignorieren */
    }
  }
  if (mi.lvl >= 15 && Math.random() < 0.04) {
    try {
      dim.spawnItem(new ItemStack("cdw:runenstaub"), loc);
    } catch {
      /* ignorieren */
    }
  }
}

function onPlayerDeath(p: Player): void {
  stat(p, "deaths");
  msg(p, "§7Deine Ausrüstung, Runen und das Abenteuerbuch bleiben dir erhalten.");
}

export function getLastHitPlayer(targetId: string): string | undefined {
  return lastHit.get(targetId)?.pid;
}

export function randomOffset(r: number): { x: number; y: number; z: number } {
  return { x: rand(-r, r), y: 0, z: rand(-r, r) };
}

export function isBossEntity(e: Entity): boolean {
  return !!mobDef(e)?.boss;
}
