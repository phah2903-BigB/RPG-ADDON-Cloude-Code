// Fähigkeiten (Runen), Waffenfähigkeiten, Projektile, Einzigartige Effekte.
import { Entity, EntityProjectileComponent, Player, system, Vector3, world } from "@minecraft/server";
import { ABILITIES, AbilityDef } from "../data/classes";
import { DamageKind, weaponTypeDef } from "../data/items";
import { pdata } from "../core/store";
import { V, isValid, later, msg, particle, rand, ring, sound } from "../core/util";
import { dealDamage, enemiesNear, forceCrit, kindMultiplier, registerProc, weaponBase } from "./combat";
import { getEquip, weaponOf } from "./gear";
import { addTempBuff, getMana, healPct, setShield, spendMana, stats } from "./stats";
import { EquipmentSlot } from "@minecraft/server";
import { emit } from "../core/bus";

const abilityById = new Map(ABILITIES.map((a) => [a.id, a]));
const lastCast = new Map<string, number>();
/** Eigene Abklingzeiten (die Engine startet die Item-Abklingzeit bereits beim Benutzen). */
const readyAt = new Map<string, number>();
function onCooldown(p: Player, key: string): boolean {
  return (readyAt.get(`${p.id}:${key}`) ?? 0) > now();
}
function setCooldown(p: Player, key: string, category: string, ticks: number): void {
  readyAt.set(`${p.id}:${key}`, now() + ticks);
  try {
    p.startItemCooldown(category, ticks);
  } catch {
    /* ignorieren */
  }
}
function clearCooldown(p: Player, category: string): void {
  try {
    p.startItemCooldown(category, 1);
  } catch {
    /* ignorieren */
  }
}
const wolves = new Map<string, { id: string; until: number }>();

function now(): number {
  return system.currentTick;
}

/** Waffengrundschaden × Attributmultiplikator. */
function power(p: Player, kind?: DamageKind): { dmg: number; kind: DamageKind } {
  const wb = weaponBase(p);
  const k = kind ?? wb.kind;
  return { dmg: wb.dmg * kindMultiplier(p, k, now()), kind: k };
}

function magicPower(p: Player): number {
  // Magier/Druiden: Stab-Grundschaden, sonst Stufen-basiert
  const wb = weaponBase(p);
  const base = wb.kind === "magic" ? wb.dmg : 5 + stats(p).level * 0.55;
  return base * kindMultiplier(p, "magic", now());
}

export function spawnProjectile(p: Player, id: string, rpg: number, opts: { dir?: Vector3; from?: Vector3; power?: number; ability?: string; critBonus?: number; spread?: number } = {}): Entity | undefined {
  const dir = opts.dir ?? p.getViewDirection();
  const head = p.getHeadLocation();
  const from = opts.from ?? V.add(head, V.mul(V.norm(dir), 1.1));
  try {
    const e = p.dimension.spawnEntity(`cdw:${id}`, from);
    e.setDynamicProperty("cdw:d", rpg * (1 + (opts.ability ? stats(p).mods[`ability:${opts.ability}%`] ?? 0 : 0)));
    if (opts.critBonus) e.setDynamicProperty("cdw:c", opts.critBonus);
    if (opts.ability) e.setDynamicProperty("cdw:a", opts.ability);
    const pc = e.getComponent("minecraft:projectile") as EntityProjectileComponent | undefined;
    if (pc) {
      pc.owner = p;
      let d = V.norm(dir);
      if (opts.spread) d = V.norm(V.add(d, { x: rand(-opts.spread, opts.spread), y: rand(-opts.spread / 2, opts.spread / 2), z: rand(-opts.spread, opts.spread) }));
      pc.shoot(V.mul(d, opts.power ?? 2));
    }
    return e;
  } catch {
    return undefined;
  }
}

function cooldownTicks(p: Player, a: { id: string; cooldown: number }): number {
  const s = stats(p);
  const flat = s.mods[`cd:${a.id}`] ?? 0;
  return Math.max(10, Math.round((a.cooldown - flat) * 20 * (1 - s.cdr)));
}

function manaCost(p: Player, base: number): number {
  return Math.round(base * (1 - (stats(p).mods["manacost%"] ?? 0)));
}

// ------------------- Runen -------------------
export function castRune(p: Player, abilityId: string): void {
  const a = abilityById.get(abilityId);
  if (!a) return;
  const d = pdata(p);
  if (d.cls !== a.cls) {
    msg(p, "§cDiese Rune gehört zu einer anderen Klasse.");
    return;
  }
  if (stats(p).level < a.level) {
    msg(p, `§cBenötigt Stufe ${a.level}.`);
    return;
  }
  if (onCooldown(p, a.id)) return;
  const cost = manaCost(p, a.mana);
  if (getMana(p) < cost) {
    p.onScreenDisplay.setActionBar("§9Nicht genug Mana!");
    sound(p, "note.bass", undefined, 0.6);
    clearCooldown(p, `cdw_${a.id}`);
    return;
  }
  const ok = runAbility(p, a);
  if (ok === false) {
    clearCooldown(p, `cdw_${a.id}`);
    return;
  }
  spendMana(p, cost);
  setCooldown(p, a.id, `cdw_${a.id}`, cooldownTicks(p, a));
  lastCast.set(p.id, now());
  emit("flag", { key: "ability_used", player: p });
}

function runAbility(p: Player, a: AbilityDef): boolean | void {
  const dim = p.dimension;
  const loc = p.location;
  switch (a.id) {
    // ---- Krieger ----
    case "wirbelschlag": {
      const pw = power(p);
      ring(dim, "minecraft:critical_hit_emitter", V.add(loc, { x: 0, y: 1, z: 0 }), 2.5, 14);
      ring(dim, "minecraft:knockback_roar_particle", V.add(loc, { x: 0, y: 0.5, z: 0 }), 1.5, 6);
      sound(dim, "mob.ravager.roar", loc, 1.6, 0.6);
      for (const e of enemiesNear(dim, loc, 4)) {
        dealDamage(p, e, pw.dmg * 1.6, { kind: pw.kind, ability: a.id });
        knockFrom(e, loc, 0.6, 0.25);
      }
      return;
    }
    case "schildwall": {
      addTempBuff(p, "wall", 1, 120, now());
      p.addEffect("resistance", 120, { amplifier: 0, showParticles: false });
      p.addEffect("slowness", 120, { amplifier: 0, showParticles: false });
      sound(dim, "item.shield.block", loc, 0.8, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1, z: 0 }), 1.2, 12);
      return;
    }
    case "sturmangriff": {
      dash(p, 2.6, 0.15, 8, (e) => {
        dealDamage(p, e, power(p).dmg * 1.3, { ability: a.id });
        e.addEffect("slowness", 60, { amplifier: 2 });
      });
      sound(dim, "mob.ravager.stun", loc, 1.4, 0.7);
      return;
    }
    case "kampfschrei": {
      sound(dim, "raid.horn", loc, 1.4, 0.5);
      for (const ally of dim.getPlayers({ location: loc, maxDistance: 12 })) {
        addTempBuff(ally, "dmg%", 0.2, 240, now());
        ally.addEffect("strength", 240, { amplifier: 0, showParticles: true });
      }
      for (const e of enemiesNear(dim, loc, 8)) e.addEffect("weakness", 200, { amplifier: 1 });
      ring(dim, "minecraft:villager_angry", V.add(loc, { x: 0, y: 1.8, z: 0 }), 1.5, 10);
      return;
    }
    case "titanenhieb": {
      p.applyKnockback({ x: 0, z: 0 }, 0.7);
      later(10, () => {
        if (!isValid(p)) return;
        const l = p.location;
        sound(dim, "random.explode", l, 0.7, 1);
        for (let r = 1; r <= 6; r += 1.25) ring(dim, "minecraft:huge_explosion_emitter", l, r, Math.round(r * 2));
        const pw = power(p);
        for (const e of enemiesNear(dim, l, 6)) {
          dealDamage(p, e, pw.dmg * 4.2, { kind: pw.kind, ability: a.id });
          stun(e, 60);
        }
      });
      return;
    }
    // ---- Waldläufer ----
    case "salve": {
      const pw = power(p, "ranged");
      const dir = p.getViewDirection();
      for (let i = -2; i <= 2; i++) spawnProjectile(p, "ranger_arrow", pw.dmg * 0.7, { dir: V.rotY(dir, i * 9), power: 2.6, ability: a.id });
      sound(dim, "random.bow", loc, 0.9, 1);
      return;
    }
    case "rueckwaertssprung": {
      const back = V.mul(V.flat(p.getViewDirection()), -1);
      p.applyKnockback({ x: back.x * 2.2, z: back.z * 2.2 }, 0.55);
      for (const e of enemiesNear(dim, loc, 5)) e.addEffect("slowness", 80, { amplifier: 2 });
      particle(dim, "minecraft:large_explosion", loc);
      sound(dim, "mob.phantom.flap", loc, 1.2, 1);
      return;
    }
    case "giftpfeil": {
      const pw = power(p, "ranged");
      spawnProjectile(p, "poison_arrow", pw.dmg * 0.8, { power: 2.8, ability: a.id });
      sound(dim, "random.bow", loc, 0.7, 1);
      return;
    }
    case "falkenauge": {
      addTempBuff(p, "crit", 0.3, 200, now());
      p.addEffect("speed", 200, { amplifier: 1, showParticles: false });
      sound(dim, "mob.parrot.fly", loc, 1, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1.9, z: 0 }), 0.6, 8);
      return;
    }
    case "pfeilregen": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 32 });
      const center = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 10));
      const pw = power(p, "ranged");
      let n = 0;
      const id = system.runInterval(() => {
        if (!isValid(p) || n++ > 24) {
          system.clearRun(id);
          return;
        }
        for (let i = 0; i < 3; i++) {
          const from = V.add(center, { x: rand(-5, 5), y: 14, z: rand(-5, 5) });
          spawnProjectile(p, "ranger_arrow", pw.dmg * 0.55, { from, dir: { x: rand(-0.05, 0.05), y: -1, z: rand(-0.05, 0.05) }, power: 2.4, ability: a.id });
        }
      }, 5);
      ring(dim, "minecraft:villager_happy", center, 5, 20);
      return;
    }
    // ---- Magier ----
    case "feuerball": {
      spawnProjectile(p, "fireball", magicPower(p) * 1.8, { power: 1.6, ability: a.id });
      sound(dim, "mob.ghast.fireball", loc, 1.1, 0.8);
      return;
    }
    case "frostlanze": {
      spawnProjectile(p, "frost_lance", magicPower(p) * 1.5, { power: 2.8, ability: a.id });
      sound(dim, "random.glass", loc, 1.5, 0.6);
      return;
    }
    case "blinzeln": {
      const dir = V.norm(p.getViewDirection());
      const hit = p.dimension.getBlockFromRay(p.getHeadLocation(), dir, { maxDistance: 8, includeLiquidBlocks: false, includePassableBlocks: false });
      const dist = hit ? Math.max(0, V.dist(p.getHeadLocation(), V.add(hit.block.location, hit.faceLocation)) - 1.2) : 8;
      const dest = V.add(loc, V.mul(dir, dist));
      particle(dim, "minecraft:portal_reverse_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
      p.teleport(dest, { checkForBlocks: true, keepVelocity: false });
      particle(dim, "minecraft:portal_reverse_particle", V.add(dest, { x: 0, y: 1, z: 0 }));
      sound(dim, "mob.endermen.portal", dest, 1.2, 1);
      return;
    }
    case "arkanschild": {
      setShield(p, stats(p).maxHp * 0.3);
      sound(dim, "beacon.power", loc, 1.6, 1);
      ring(dim, "minecraft:obsidian_glow_dust_particle", V.add(loc, { x: 0, y: 1, z: 0 }), 1, 16);
      msg(p, "§5Arkanschild aktiv.");
      return;
    }
    case "meteor": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 40 });
      const target = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 12));
      ring(dim, "minecraft:basic_flame_particle", target, 3, 18);
      ring(dim, "minecraft:basic_flame_particle", target, 5, 24);
      const dmg = magicPower(p) * 5;
      later(30, () => {
        if (!isValid(p)) return;
        spawnProjectile(p, "meteor", dmg, { from: V.add(target, { x: -4, y: 18, z: 0 }), dir: V.norm({ x: 4, y: -18, z: 0 }), power: 1.6, ability: a.id });
      });
      sound(dim, "mob.blaze.shoot", loc, 0.5, 1);
      return;
    }
    // ---- Druide ----
    case "heilbluete": {
      const healMult = 1 + (stats(p).mods["heal%"] ?? 0) + stats(p).attrs.wis * 0.03;
      const allies = dim.getPlayers({ location: loc, maxDistance: 8 });
      let ticks = 0;
      const id = system.runInterval(() => {
        if (ticks++ >= 5) {
          system.clearRun(id);
          return;
        }
        for (const al of allies) {
          if (!isValid(al)) continue;
          healPct(al, 0.06 * healMult * (1 + (stats(p).mods["ability:heilbluete%"] ?? 0)));
          particle(al.dimension, "minecraft:heart_particle", V.add(al.location, { x: 0, y: 2, z: 0 }));
        }
      }, 20);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 0.3, z: 0 }), 3, 16);
      sound(dim, "random.orb", loc, 1.5, 1);
      return;
    }
    case "dornenranken": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 20 });
      const c = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 6));
      ring(dim, "minecraft:villager_happy", c, 3.5, 18);
      sound(dim, "dig.grass", c, 0.6, 1);
      for (const e of enemiesNear(dim, c, 4)) {
        dealDamage(p, e, magicPower(p) * 1.4, { ability: a.id });
        stun(e, 80);
      }
      return;
    }
    case "wolfsgeist": {
      const old = wolves.get(p.id);
      if (old) safeRemove(old.id);
      try {
        const w = dim.spawnEntity("cdw:geisterwolf", V.add(loc, V.mul(V.flat(p.getViewDirection()), 1.5)));
        w.setDynamicProperty("cdw:o", p.id);
        wolves.set(p.id, { id: w.id, until: now() + 800 });
        particle(dim, "minecraft:soul_particle", w.location);
        sound(dim, "mob.wolf.howl", loc, 1.2, 0.8);
      } catch {
        return false;
      }
      return;
    }
    case "rindenhaut": {
      for (const al of dim.getPlayers({ location: loc, maxDistance: 10 })) {
        al.addEffect("resistance", 200, { amplifier: 1, showParticles: true });
        al.addEffect("regeneration", 200, { amplifier: 0, showParticles: true });
      }
      sound(dim, "dig.wood", loc, 0.6, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1, z: 0 }), 2, 12);
      return;
    }
    case "segen": {
      for (const al of dim.getPlayers({ location: loc, maxDistance: 16 })) {
        healPct(al, 1);
        al.removeEffect("poison");
        al.removeEffect("wither");
        al.addEffect("regeneration", 200, { amplifier: 1 });
        title(al, "", "§aSegen des Ylvaris");
      }
      for (const e of enemiesNear(dim, loc, 12)) {
        const blight = e.matches({ families: ["cdw_blight"] });
        dealDamage(p, e, magicPower(p) * (blight ? 4 : 1.5), { ability: a.id });
      }
      for (let r = 2; r <= 12; r += 2) ring(dim, "minecraft:totem_particle", V.add(loc, { x: 0, y: 0.5, z: 0 }), r, r * 3);
      sound(dim, "random.totem", loc, 1, 0.8);
      return;
    }
  }
}

function title(p: Player, t: string, sub: string): void {
  try {
    p.onScreenDisplay.setTitle(t, { subtitle: sub, fadeInDuration: 5, stayDuration: 30, fadeOutDuration: 10 });
  } catch {
    /* ignorieren */
  }
}

function safeRemove(id: string): void {
  try {
    world.getEntity(id)?.remove();
  } catch {
    /* ignorieren */
  }
}

export function stun(e: Entity, ticks: number): void {
  try {
    e.addEffect("slowness", ticks, { amplifier: 10, showParticles: false });
    e.addEffect("weakness", ticks, { amplifier: 10, showParticles: false });
    particle(e.dimension, "minecraft:villager_angry", V.add(e.location, { x: 0, y: 2, z: 0 }));
  } catch {
    /* ignorieren */
  }
}

function knockFrom(e: Entity, from: Vector3, h: number, v: number): void {
  try {
    const d = V.flat(V.sub(e.location, from));
    e.applyKnockback({ x: d.x * h, z: d.z * h }, v);
  } catch {
    /* ignorieren */
  }
}

/** Sprint-Angriff: stößt den Spieler vorwärts und trifft Gegner entlang des Wegs. */
function dash(p: Player, strength: number, up: number, ticks: number, onHit: (e: Entity) => void): void {
  const dir = V.flat(p.getViewDirection());
  p.applyKnockback({ x: dir.x * strength, z: dir.z * strength }, up);
  const hit = new Set<string>();
  let n = 0;
  const id = system.runInterval(() => {
    if (!isValid(p) || n++ > ticks) {
      system.clearRun(id);
      return;
    }
    particle(p.dimension, "minecraft:large_explosion", V.add(p.location, { x: 0, y: 0.6, z: 0 }));
    for (const e of enemiesNear(p.dimension, p.location, 2.2)) {
      if (hit.has(e.id)) continue;
      hit.add(e.id);
      onHit(e);
    }
  }, 1);
}

// ------------------- Waffenfähigkeiten -------------------
export function useWeapon(p: Player, typeId: string): void {
  const w = weaponOf(typeId);
  if (!w) return;
  const t = weaponTypeDef(w.type)!;
  const cat = `cdw_w_${t.id}`;
  if (onCooldown(p, cat)) return;
  const cost = manaCost(p, t.abilityMana);
  if (getMana(p) < cost) {
    p.onScreenDisplay.setActionBar("§9Nicht genug Mana!");
    clearCooldown(p, cat);
    return;
  }
  const dim = p.dimension;
  const loc = p.location;
  const pw = power(p);
  switch (t.id) {
    case "schwert":
      dash(p, 1.4, 0.05, 6, (e) => dealDamage(p, e, pw.dmg * 1.3));
      sound(dim, "item.trident.riptide_1", loc, 1.5, 0.6);
      break;
    case "zweihaender":
      ring(dim, "minecraft:critical_hit_emitter", V.add(loc, { x: 0, y: 1, z: 0 }), 2.2, 12);
      for (const e of enemiesNear(dim, loc, 3.5)) {
        dealDamage(p, e, pw.dmg * 1.2);
        knockFrom(e, loc, 0.8, 0.3);
      }
      sound(dim, "mob.ravager.attack", loc, 1.2, 0.8);
      break;
    case "dolch": {
      const target = p.getEntitiesFromViewDirection({ maxDistance: 8, families: ["monster"] })[0]?.entity;
      if (!target) {
        msg(p, "§7Kein Ziel in Sicht.");
        clearCooldown(p, cat);
        return;
      }
      const behind = V.add(target.location, V.mul(V.flat(target.getViewDirection()), -1.4));
      particle(dim, "minecraft:large_smoke_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
      p.teleport(behind, { facingLocation: target.location, checkForBlocks: true });
      forceCrit(p);
      sound(dim, "mob.endermen.portal", behind, 1.8, 0.6);
      break;
    }
    case "streitaxt": {
      const target = p.getEntitiesFromViewDirection({ maxDistance: 4, families: ["monster"] })[0]?.entity;
      if (!target) {
        msg(p, "§7Kein Ziel in Reichweite.");
        clearCooldown(p, cat);
        return;
      }
      dealDamage(p, target, pw.dmg * 2);
      target.addEffect("weakness", 120, { amplifier: 1 });
      sound(dim, "random.anvil_land", loc, 0.7, 0.6);
      break;
    }
    case "kriegshammer":
      for (const e of enemiesNear(dim, loc, 4.5)) {
        dealDamage(p, e, pw.dmg * 1.1);
        stun(e, 40);
      }
      ring(dim, "minecraft:huge_explosion_emitter", loc, 2.5, 6);
      sound(dim, "random.explode", loc, 1.4, 0.6);
      break;
    case "speer":
      dash(p, 2.0, 0.1, 8, (e) => dealDamage(p, e, pw.dmg * 1.4));
      sound(dim, "item.trident.throw", loc, 1, 1);
      break;
    case "armbrust":
      spawnProjectile(p, "ranger_arrow", pw.dmg * 1.0, { power: 3.6, critBonus: 0.1 });
      sound(dim, "crossbow.shoot", loc, 1, 1);
      break;
    case "zauberstab": {
      spawnProjectile(p, w.unique?.effect === "frostnova" ? "frost_lance" : "arcane_bolt", magicPower(p) * 1.0, { power: 2.2 });
      sound(dim, "mob.evocation_illager.cast_spell", loc, 1.8, 0.4);
      break;
    }
    case "naturstab": {
      spawnProjectile(p, "thorn_bolt", magicPower(p) * 0.9, { power: 2.1 });
      const healMult = (w.unique?.effect === "bloom" ? 2 : 1) * (1 + (stats(p).mods["heal%"] ?? 0));
      for (const al of dim.getPlayers({ location: loc, maxDistance: 6 })) if (al.id !== p.id) healPct(al, 0.02 * healMult);
      healPct(p, 0.01 * healMult);
      sound(dim, "dig.grass", loc, 1.4, 0.6);
      break;
    }
    default:
      return;
  }
  spendMana(p, cost);
  if (t.abilityCd > 0) setCooldown(p, cat, cat, Math.max(4, Math.round(t.abilityCd * 20 * (1 - stats(p).cdr * 0.5))));
}

/** Langbogen: Loslassen nach Spannen. */
const starfallCount = new Map<string, number>();
export function releaseBow(p: Player, typeId: string, useDuration: number): void {
  const w = weaponOf(typeId);
  if (!w || w.type !== "langbogen") return;
  // useDuration = verbleibende Ticks; Spanndauer = max - verbleibend
  const drawn = Math.max(0, 72000 - useDuration);
  const charge = Math.min(1, drawn / 20);
  if (charge < 0.2) return;
  const pw = power(p, "ranged");
  spawnProjectile(p, "ranger_arrow", pw.dmg * (0.4 + charge * 0.8), { power: 1.2 + charge * 2.2, critBonus: charge >= 1 ? 0.1 : 0 });
  sound(p.dimension, "random.bow", p.location, 1 + (1 - charge) * 0.3, 1);
  if (w.unique?.effect === "starfall") {
    const n = (starfallCount.get(p.id) ?? 0) + 1;
    starfallCount.set(p.id, n);
    if (n % 4 === 0) {
      const t = p.getEntitiesFromViewDirection({ maxDistance: 40, families: ["monster"] })[0]?.entity;
      if (t) {
        const tl = t.location;
        particle(p.dimension, "minecraft:totem_particle", V.add(tl, { x: 0, y: 3, z: 0 }));
        later(10, () => {
          if (isValid(t)) {
            for (const e of enemiesNear(t.dimension, tl, 3)) dealDamage(p, e, pw.dmg * 2);
            particle(t.dimension, "minecraft:huge_explosion_emitter", tl);
          }
        });
      }
    }
  }
}

// ------------------- Projektil-Treffer -------------------
function onProjectileImpact(proj: Entity, loc: Vector3, hitEntity?: Entity): void {
  const ownerComp = proj.getComponent("minecraft:projectile") as EntityProjectileComponent | undefined;
  const owner = ownerComp?.owner;
  if (!owner || owner.typeId !== "minecraft:player") return;
  const p = owner as Player;
  const rpg = (proj.getDynamicProperty("cdw:d") as number) ?? 0;
  const dim = proj.dimension;
  switch (proj.typeId) {
    case "cdw:fireball":
      particle(dim, "minecraft:huge_explosion_emitter", loc);
      sound(dim, "random.explode", loc, 1.3, 0.7);
      for (const e of enemiesNear(dim, loc, 3)) {
        if (hitEntity && e.id === hitEntity.id) continue;
        dealDamage(p, e, rpg * 0.6, { noCrit: false });
        e.setOnFire(3, true);
      }
      if (hitEntity) hitEntity.setOnFire(4, true);
      break;
    case "cdw:meteor":
      particle(dim, "minecraft:huge_explosion_emitter", loc);
      ring(dim, "minecraft:huge_explosion_emitter", loc, 3, 6);
      sound(dim, "random.explode", loc, 0.6, 1);
      for (const e of enemiesNear(dim, loc, 6)) {
        dealDamage(p, e, rpg, { ability: "meteor" });
        e.setOnFire(6, true);
      }
      break;
    case "cdw:frost_lance":
      if (hitEntity) {
        hitEntity.addEffect("slowness", 100, { amplifier: 3 });
        particle(dim, "minecraft:snowflake_particle", V.add(hitEntity.location, { x: 0, y: 1, z: 0 }));
        const w = weaponOf(getEquip(p, EquipmentSlot.Mainhand)?.typeId);
        if (w?.unique?.effect === "frostnova" && Math.random() < 0.15) {
          ring(dim, "minecraft:snowflake_particle", loc, 3, 16);
          for (const e of enemiesNear(dim, loc, 4)) {
            dealDamage(p, e, rpg * 0.6);
            e.addEffect("slowness", 80, { amplifier: 5 });
          }
        }
      }
      break;
    case "cdw:poison_arrow":
      if (hitEntity) {
        let n = 0;
        const target = hitEntity;
        const id = system.runInterval(() => {
          if (!isValid(target) || !isValid(p) || n++ >= 6) {
            system.clearRun(id);
            return;
          }
          dealDamage(p, target, rpg * 0.4 * (1 + (stats(p).mods["ability:giftpfeil%"] ?? 0)), { noCrit: true });
          particle(target.dimension, "minecraft:mobspell_emitter", V.add(target.location, { x: 0, y: 1, z: 0 }));
        }, 20);
      }
      break;
  }
}

// ------------------- Einzigartige Waffen -------------------
function initUniques(): void {
  registerProc("rootburst", (p, t, rpg) => {
    if (Math.random() > 0.2 || !isValid(t)) return;
    const l = t.location;
    ring(t.dimension, "minecraft:villager_happy", l, 2, 10);
    for (const e of enemiesNear(t.dimension, l, 3)) dealDamage(p, e, rpg * 1.5, { noCrit: true });
  });
  registerProc("shadowcrit", (p, _t, _rpg, crit) => {
    if (crit) p.addEffect("invisibility", 40, { showParticles: false });
  });
  registerProc("quake", (p, t) => {
    if (Math.random() < 0.15 && isValid(t)) stun(t, 40);
    healPct(p, 0.03);
  });
}

// ------------------- Geisterwolf -------------------
function tickWolves(): void {
  for (const [pid, w] of wolves) {
    const wolf = world.getEntity(w.id);
    const owner = world.getEntity(pid) as Player | undefined;
    if (!wolf || !owner || now() > w.until) {
      if (wolf) {
        particle(wolf.dimension, "minecraft:soul_particle", wolf.location);
        safeRemove(w.id);
      }
      wolves.delete(pid);
      continue;
    }
    if (wolf.dimension.id !== owner.dimension.id || V.dist(wolf.location, owner.location) > 18) {
      wolf.teleport(owner.location, { dimension: owner.dimension });
    }
  }
}

export function initAbilities(): void {
  initUniques();
  world.afterEvents.projectileHitEntity.subscribe((ev) => {
    const proj = ev.projectile;
    if (!isValid(proj) || !proj.typeId.startsWith("cdw:")) return;
    const hit = ev.getEntityHit()?.entity;
    onProjectileImpact(proj, ev.location, hit);
  });
  world.afterEvents.projectileHitBlock.subscribe((ev) => {
    const proj = ev.projectile;
    if (!isValid(proj) || !proj.typeId.startsWith("cdw:")) return;
    onProjectileImpact(proj, ev.location);
  });
  world.afterEvents.itemReleaseUse.subscribe((ev) => {
    if (ev.itemStack && ev.itemStack.typeId.startsWith("cdw:")) releaseBow(ev.source, ev.itemStack.typeId, ev.useDuration);
  });
  system.runInterval(tickWolves, 20);
}

