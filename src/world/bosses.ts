// Bossmechaniken: Flächenangriffe mit Vorwarnung, Helfer, Wut-Phase, Leine, Phasenwechsel.
import { Entity, EntityDamageCause, EntityHealthComponent, Player, system, Vector3, world } from "@minecraft/server";
import { mobById } from "../data/mobs";
import { emit } from "../core/bus";
import { markWorldDirty, wdata } from "../core/store";
import { V, isValid, log, particle, pick, players, rand, ring, sound, title } from "../core/util";
import { assignLevel } from "../systems/mobs";
import { spawnProjectileFromMob } from "./mobfx";

interface BossRun {
  id: string; // Boss-Typ (ohne Namespace)
  entity: string; // Entity-ID
  center: Vector3;
  tag: string;
  heroic: boolean;
  onDefeat: () => void;
  t: number;
  enraged: boolean;
  lastSeen: number;
}

const runs = new Map<string, BossRun>(); // entityId → Run

export function startBoss(bossId: string, center: Vector3, tag: string, heroic: boolean, onDefeat: () => void): Entity | undefined {
  const def = mobById(bossId);
  if (!def?.boss) return undefined;
  const dim = world.getDimension("minecraft:overworld");
  try {
    const e = dim.spawnEntity(`cdw:${bossId}`, V.add(center, { x: 0.5, y: 0.2, z: 0.5 }));
    e.addTag(tag);
    e.addTag("cdw_boss");
    const n = dim.getPlayers({ location: center, maxDistance: 64 }).length;
    e.setDynamicProperty("cdw:l", heroic ? 52 : def.boss.fixedLevel);
    e.setDynamicProperty("cdw:hm", (heroic ? 1.8 : 1) * (1 + 0.6 * Math.max(0, n - 1)));
    if (heroic) e.setDynamicProperty("cdw:dm", 1.3);
    e.nameTag = `§l${heroic ? "§6[Heroisch] " : ""}§c${def.boss.title}`;
    assignLevel(e);
    runs.set(e.id, { id: bossId, entity: e.id, center, tag, heroic, onDefeat, t: 0, enraged: false, lastSeen: system.currentTick });
    for (const p of dim.getPlayers({ location: center, maxDistance: 64 })) {
      title(p, `§c${def.boss.title}`, heroic ? "§6Heroischer Wächter" : "§7erwacht!", 10, 60, 20);
      sound(p, "mob.wither.spawn", undefined, 0.8, 0.6);
    }
    for (let r = 1; r < 6; r++) ring(dim, "minecraft:large_smoke_particle", center, r, r * 4);
    return e;
  } catch (err) {
    log("Boss-Spawn fehlgeschlagen:", bossId, String(err));
    return undefined;
  }
}

function bossHp(e: Entity): number {
  const h = e.getComponent("minecraft:health") as EntityHealthComponent | undefined;
  return h ? h.currentValue / h.effectiveMax : 1;
}

function hurtPlayer(boss: Entity, p: Player, base: number): void {
  try {
    p.applyDamage(base, { cause: EntityDamageCause.entityAttack, damagingEntity: boss });
  } catch {
    /* ignorieren */
  }
}

/** Telegrafierter Flächenangriff. */
function slam(boss: Entity, radius: number, base: number, color = "minecraft:basic_flame_particle"): void {
  const c = boss.location;
  const dim = boss.dimension;
  for (let i = 0; i < 3; i++) system.runTimeout(() => ring(dim, color, V.add(c, { x: 0, y: 0.2, z: 0 }), radius, Math.round(radius * 4)), i * 8);
  sound(dim, "mob.ravager.roar", c, 0.7, 1);
  system.runTimeout(() => {
    if (!isValid(boss)) return;
    particle(dim, "minecraft:huge_explosion_emitter", c);
    sound(dim, "random.explode", c, 0.8, 1);
    for (const p of dim.getPlayers({ location: c, maxDistance: radius })) {
      hurtPlayer(boss, p, base);
      const d = V.flat(V.sub(p.location, c));
      p.applyKnockback({ x: d.x * 1.2, z: d.z * 1.2 }, 0.45);
    }
  }, 30);
}

function summonAdds(boss: Entity, run: BossRun): void {
  const def = mobById(run.id);
  const adds = def?.boss?.adds ?? [];
  if (!adds.length) return;
  const dim = boss.dimension;
  const alive = dim.getEntities({ tags: [`${run.tag}:add`] }).length;
  if (alive >= 6) return;
  const n = run.enraged ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const loc = V.add(run.center, { x: rand(-7, 7), y: 0.2, z: rand(-7, 7) });
    try {
      const e = dim.spawnEntity(`cdw:${pick(adds)}`, loc);
      e.addTag(`${run.tag}:add`);
      e.addTag("cdw_dungeon");
      e.setDynamicProperty("cdw:l", (run.heroic ? 50 : def?.boss?.fixedLevel ?? 10) - 2);
      assignLevel(e);
      particle(dim, "minecraft:large_smoke_particle", loc);
    } catch {
      /* ignorieren */
    }
  }
  sound(dim, "mob.evocation_illager.prepare_summon", boss.location, 1, 1);
}

function volley(boss: Entity, run: BossRun): void {
  const def = mobById(run.id);
  const proj = def?.projectile ?? "blight_bolt_big";
  const targets = boss.dimension.getPlayers({ location: boss.location, maxDistance: 30 });
  for (const p of targets) {
    for (let i = 0; i < (run.enraged ? 3 : 2); i++) {
      system.runTimeout(() => {
        if (isValid(boss) && isValid(p)) spawnProjectileFromMob(boss, proj, p.getHeadLocation());
      }, i * 6);
    }
  }
}

function tick(): void {
  for (const [eid, run] of runs) {
    const e = world.getEntity(eid);
    if (!e || !isValid(e)) continue; // Tod wird über entityDie behandelt; Entladen → später wieder gefunden
    run.t++;
    const dim = e.dimension;
    const near = dim.getPlayers({ location: run.center, maxDistance: 40 });
    if (near.length) run.lastSeen = system.currentTick;
    else if (system.currentTick - run.lastSeen > 1200) {
      // Zurücksetzen, wenn alle gegangen sind
      const h = e.getComponent("minecraft:health") as EntityHealthComponent | undefined;
      h?.resetToMaxValue();
      e.teleport(V.add(run.center, { x: 0.5, y: 0.2, z: 0.5 }));
      run.enraged = false;
      continue;
    }
    if (V.dist2d(e.location, run.center) > 24) e.teleport(V.add(run.center, { x: 0.5, y: 0.5, z: 0.5 }));
    const hp = bossHp(e);
    if (!run.enraged && hp < 0.5) {
      run.enraged = true;
      e.addEffect("speed", 20 * 600, { amplifier: 0, showParticles: false });
      e.addEffect("strength", 20 * 600, { amplifier: 0, showParticles: false });
      for (const p of near) title(p, "", "§cDer Wächter rast vor Zorn!", 5, 40, 10);
      sound(dim, "mob.enderdragon.growl", e.location, 1, 1);
      summonAdds(e, run);
    }
    const def = mobById(run.id);
    const base = (def?.damage ?? 6) * 1.2;
    const period = run.enraged ? 7 : 10;
    if (run.t % period === 0) slam(e, run.id === "boss_wurzelwyrm" ? 7 : 5, base, run.id.includes("frost") || run.id === "boss_hrimgar" ? "minecraft:snowflake_particle" : "minecraft:basic_flame_particle");
    if (run.t % (run.enraged ? 12 : 18) === 5) summonAdds(e, run);
    if ((def?.arch === "boss_ranged" || run.id === "boss_kristallmutter" || run.id === "boss_glutkoenigin") && run.t % 4 === 2) volley(e, run);
  }
}

export function initBosses(): void {
  system.runInterval(tick, 20);
  world.afterEvents.entityDie.subscribe((ev) => {
    let id: string;
    try {
      id = ev.deadEntity.id;
    } catch {
      return;
    }
    const run = runs.get(id);
    if (!run) return;
    runs.delete(id);
    const center = run.center;
    // Helfer entfernen
    try {
      for (const a of ev.deadEntity.dimension.getEntities({ tags: [`${run.tag}:add`] })) a.kill();
    } catch {
      /* ignorieren */
    }
    emit("flag", { key: `boss:${run.id}` });
    for (const p of players()) if (V.dist(p.location, center) < 80) title(p, "§6Sieg!", `§f${mobById(run.id)?.boss?.title ?? ""} ist gefallen`, 10, 60, 20);
    if (run.id === "boss_morvath") {
      // Phase 2
      system.runTimeout(() => {
        const dim = world.getDimension("minecraft:overworld");
        for (let r = 1; r < 8; r++) ring(dim, "minecraft:soul_particle", center, r, r * 4);
        sound(dim, "mob.wither.spawn", center, 0.6, 1);
        startBoss("boss_welkenbestie", center, run.tag, run.heroic, run.onDefeat);
      }, 60);
      return;
    }
    try {
      run.onDefeat();
    } catch (e) {
      log("Boss-Abschluss:", String(e));
    }
  });
  // Bosse nach Neustart wieder aufnehmen
  world.afterEvents.entityLoad.subscribe((ev) => {
    const e = ev.entity;
    if (!isValid(e) || !e.hasTag("cdw_boss") || runs.has(e.id)) return;
    const tag = e.getTags().find((t) => t.startsWith("cdw_dg:")) ?? "cdw_dg:world";
    const bossId = e.typeId.slice(4);
    runs.set(e.id, { id: bossId, entity: e.id, center: e.location, tag, heroic: false, onDefeat: () => resumeDefeat(tag), t: 0, enraged: false, lastSeen: system.currentTick });
  });
}

function resumeDefeat(tag: string): void {
  // tag = cdw_dg:<dungeon>:<room>
  const parts = tag.split(":");
  const st = wdata().dungeons[parts[1]];
  if (st) {
    st.boss = true;
    st.stage = Math.max(st.stage, Number(parts[2]) + 1);
    markWorldDirty();
  }
}

export function activeBossCount(): number {
  return runs.size;
}
