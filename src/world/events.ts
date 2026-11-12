// Welt-Ereignisse: Verteidigungswellen am Hain, Zonen-Spawner um Dungeons, Goblin-Lager, Fäulnis-Risse, Weltboss.
import { Player, system, Vector3, world } from "@minecraft/server";
import { emit } from "../core/bus";
import { flag, markWorldDirty, setFlag, wdata } from "../core/store";
import { V, broadcast, isValid, log, particle, pick, players, rand, ring, sound, title, weekNumber } from "../core/util";
import { assignLevel } from "../systems/mobs";
import { Builder, surfaceY, withLoadedArea } from "./builder";
import { DUNGEONS, dungeonDef } from "./dungeons";
import { startBoss } from "./bosses";
import { hubPos, HUB_SPOTS } from "./hub";
import { addGold, addXp } from "../systems/progression";
import { giveItem } from "../systems/quests";
import { createGear, randomGearFor } from "../systems/gear";
import { level } from "../systems/stats";
import { pdata } from "../core/store";

// ------------------- Spawn-Helfer -------------------
export function spawnMobAt(id: string, loc: Vector3, lvl?: number, tags: string[] = []): boolean {
  try {
    const dim = world.getDimension("minecraft:overworld");
    const s = surfaceY(dim, Math.floor(loc.x), Math.floor(loc.z));
    const y = s ? s.y + 1 : loc.y;
    const e = dim.spawnEntity(`cdw:${id}`, { x: loc.x, y, z: loc.z });
    for (const t of tags) e.addTag(t);
    if (lvl !== undefined) e.setDynamicProperty("cdw:l", lvl);
    assignLevel(e);
    particle(dim, "minecraft:large_smoke_particle", { x: loc.x, y: y + 1, z: loc.z });
    return true;
  } catch {
    return false;
  }
}

/** Aktion "spawn:<mob>:<anzahl>:<ort>" */
export function spawnAction(mob: string, n: number, where: string, extra?: string): void {
  let center: Vector3 | undefined;
  if (where === "hub") center = hubPos();
  else if (where === "camp") center = campPos();
  else if (where === "dungeon" && extra) {
    const st = wdata().dungeons[extra];
    if (st) center = { x: st.x, y: st.y, z: st.z };
  }
  if (!center) return;
  const c = center;
  // nur spawnen, wenn ein Spieler in der Nähe ist – sonst später nachholen
  const pending = () => {
    const near = players().some((p) => V.dist2d(p.location, c) < 64);
    if (!near) return false;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = where === "hub" ? 14 + Math.random() * 8 : 8 + Math.random() * 10;
      spawnMobAt(mob, { x: c.x + Math.cos(a) * r, y: c.y, z: c.z + Math.sin(a) * r }, undefined, ["cdw_quest"]);
    }
    return true;
  };
  if (!pending()) {
    const id = system.runInterval(() => {
      if (pending()) system.clearRun(id);
    }, 40);
  }
}

// ------------------- Kaels Lager -------------------
export function campPos(): Vector3 | undefined {
  const f = wdata().flags;
  if (f.camp_x === undefined) return undefined;
  return { x: f.camp_x, y: f.camp_y, z: f.camp_z };
}

export function setupCamp(): void {
  const hub = hubPos();
  if (!hub || campPos()) return;
  const def = dungeonDef("dornenhain")!;
  const ang = ((def.angle + (hub.x % 30)) * Math.PI) / 180;
  const dist = def.ring * 0.6;
  const f = wdata().flags;
  f.camp_x = Math.round(hub.x + Math.cos(ang) * dist);
  f.camp_z = Math.round(hub.z + Math.sin(ang) * dist);
  f.camp_y = hub.y;
  f.npc_kael_x = f.camp_x + 2.5;
  f.npc_kael_y = hub.y + 1;
  f.npc_kael_z = f.camp_z + 0.5;
  markWorldDirty();
}

function tickCamp(): void {
  const c = campPos();
  const f = wdata().flags;
  if (!c || f.camp_built) return;
  const dim = world.getDimension("minecraft:overworld");
  if (!players().some((p) => p.dimension.id === dim.id && V.dist2d(p.location, c) < 72)) return;
  f.camp_built = 1;
  markWorldDirty();
  void withLoadedArea("camp", dim, V.add(c, { x: -8, y: 0, z: -8 }), V.add(c, { x: 8, y: 0, z: 8 }), () => {
    return new Promise<void>((resolve) => {
      const s = surfaceY(dim, c.x, c.z);
      const y = s?.y ?? c.y;
      f.camp_y = y;
      f.npc_kael_y = y + 1;
      const b = new Builder(dim, { x: c.x, y, z: c.z }, 77);
      b.disc(0, 0, 0, 4, "minecraft:coarse_dirt");
      for (let yy = 1; yy < 6; yy++) b.disc(0, yy, 0, 4, "minecraft:air");
      b.set(0, 1, 0, { id: "minecraft:campfire", states: { extinguished: false } });
      for (const [x, z] of [[-3, -2], [-3, 2], [-1, -2], [-1, 2]]) b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
      b.box(-3, 3, -2, -1, 3, 2, "minecraft:green_wool");
      b.set(2, 1, -2, "minecraft:barrel").set(3, 1, 2, { id: "minecraft:spruce_log", states: { pillar_axis: "x" } });
      b.run(() => resolve(), 40);
    });
  });
}

// ------------------- Verteidigung -------------------
interface DefenseDef {
  key: string;
  level: number;
  waves: { mob: string; n: number }[][];
}
const DEFENSES: Record<string, DefenseDef> = {
  hain: {
    key: "defense:hain",
    level: 3,
    waves: [
      [{ mob: "moosling", n: 5 }],
      [{ mob: "moosling", n: 4 }, { mob: "dornenwolf", n: 2 }],
      [{ mob: "dornenwolf", n: 3 }, { mob: "rindenschreck_setzling", n: 1 }],
    ],
  },
  final: {
    key: "defense:final",
    level: 37,
    waves: [
      [{ mob: "faeulnisgeist", n: 4 }, { mob: "moorschlurfer", n: 3 }],
      [{ mob: "glutskorpion", n: 3 }, { mob: "eiskobold", n: 4 }],
      [{ mob: "frosttroll", n: 1 }, { mob: "schattenkriecher", n: 3 }],
      [{ mob: "wurzelgolem", n: 2 }, { mob: "seufzergeist", n: 2 }],
      [{ mob: "wurzelgolem", n: 1 }, { mob: "faeulnisgeist", n: 5 }, { mob: "frosttroll", n: 1 }],
    ],
  },
};

export function startDefense(id: string): void {
  setFlag(`def_${id}_wave`, 1);
  setFlag(`def_${id}_active`, 1);
  setFlag(`def_${id}_spawned`, 0);
}

function tickDefense(): void {
  const hub = hubPos();
  if (!hub) return;
  for (const [id, def] of Object.entries(DEFENSES)) {
    if (!flag(`def_${id}_active`)) continue;
    const near = players().filter((p) => V.dist2d(p.location, hub) < 48);
    if (!near.length) continue;
    const wave = flag(`def_${id}_wave`);
    const tag = `cdw_def:${id}`;
    const dim = world.getDimension("minecraft:overworld");
    const alive = dim.getEntities({ tags: [tag] }).filter((e) => isValid(e));
    if (!flag(`def_${id}_spawned`)) {
      const w = def.waves[wave - 1];
      if (!w) continue;
      for (const p of near) {
        title(p, `§cWelle ${wave}/${def.waves.length}`, "§7Verteidige den Hain!", 5, 40, 10);
        sound(p, "raid.horn", undefined, 1, 0.6);
      }
      const extra = Math.max(0, near.length - 1);
      for (const g of w) {
        for (let i = 0; i < g.n + extra; i++) {
          const a = Math.random() * Math.PI * 2;
          spawnMobAt(g.mob, { x: hub.x + Math.cos(a) * 19, y: hub.y, z: hub.z + Math.sin(a) * 19 }, def.level + wave, [tag]);
        }
      }
      setFlag(`def_${id}_spawned`, 1);
      continue;
    }
    // Monster zum Zentrum lenken
    for (const e of alive) {
      if (V.dist2d(e.location, hub) > 34) e.teleport({ x: hub.x + rand(-15, 15), y: hub.y + 2, z: hub.z + rand(-15, 15) });
    }
    if (alive.length === 0) {
      if (wave >= def.waves.length) {
        setFlag(`def_${id}_active`, 0);
        for (const p of near) title(p, "§aDer Hain hält stand!", "§7Alle Wellen abgewehrt", 10, 60, 20);
        emit("flag", { key: def.key });
      } else {
        setFlag(`def_${id}_wave`, wave + 1);
        setFlag(`def_${id}_spawned`, 0);
      }
    }
  }
}

// ------------------- Zonen um Dungeons -------------------
function tickZones(): void {
  const act = wdata().main.idx;
  const dim = world.getDimension("minecraft:overworld");
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st || !flag(`zone_${def.id}`)) continue;
    const center = { x: st.x, y: st.y, z: st.z };
    const near = players().filter((p) => p.dimension.id === dim.id && V.dist2d(p.location, center) < 110);
    if (!near.length) continue;
    const count = dim.getEntities({ location: center, maxDistance: 90, tags: [`cdw_zone:${def.id}`] }).length;
    if (count >= 6 + near.length * 2) continue;
    const p = pick(near);
    const a = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 14;
    const loc = { x: p.location.x + Math.cos(a) * r, y: p.location.y, z: p.location.z + Math.sin(a) * r };
    if (V.dist2d(loc, center) > 100) continue;
    spawnMobAt(pick(def.mobs.filter((m) => m !== "wurzelgolem" || Math.random() < 0.3)), loc, undefined, [`cdw_zone:${def.id}`]);
    void act;
  }
}

// ------------------- Goblin-Lager & Fäulnis-Risse -------------------
interface Camp {
  x: number;
  z: number;
  t: number;
  id: string;
}

function tickWorldEvents(): void {
  const w = wdata();
  if (!w.hub || w.main.idx < 4) return;
  const now = Date.now();
  // alte Lager aufräumen
  w.camps = w.camps.filter((c) => now - c.t < 3600000);
  if (w.camps.length >= 2) return;
  if (now - (flag("last_event") * 1000) < 20 * 60000) return;
  const ps = players().filter((p) => p.dimension.id === "minecraft:overworld");
  if (!ps.length) return;
  const p = pick(ps);
  if (hubPos() && V.dist2d(p.location, hubPos()!) < 60) return;
  setFlag("last_event", Math.floor(now / 1000));
  const a = Math.random() * Math.PI * 2;
  const loc = { x: Math.round(p.location.x + Math.cos(a) * 55), y: p.location.y, z: Math.round(p.location.z + Math.sin(a) * 55) };
  const kind = Math.random() < 0.55 ? "lager" : "riss";
  const c: Camp = { x: loc.x, z: loc.z, t: now, id: `${kind}_${now}` };
  w.camps.push(c);
  markWorldDirty();
  buildEvent(c, kind, level(p));
  for (const pl of ps) {
    if (V.dist2d(pl.location, { x: loc.x, y: 0, z: loc.z }) < 150) {
      title(pl, kind === "lager" ? "§6Goblin-Lager entdeckt!" : "§5Ein Fäulnis-Riss öffnet sich!", "§7In der Nähe – folge dem Rauch", 10, 60, 20);
      pl.sendMessage(`§7Ereignis bei §f${loc.x}, ${loc.z}§7. Besiege alle Gegner für eine Belohnung.`);
    }
  }
}

function buildEvent(c: Camp, kind: string, lvl: number): void {
  const dim = world.getDimension("minecraft:overworld");
  void withLoadedArea(`ev_${c.id}`.slice(0, 24), dim, { x: c.x - 8, y: 0, z: c.z - 8 }, { x: c.x + 8, y: 0, z: c.z + 8 }, () => {
    return new Promise<void>((resolve) => {
      const s = surfaceY(dim, c.x, c.z);
      if (!s || s.water) {
        resolve();
        return;
      }
      const b = new Builder(dim, { x: c.x, y: s.y, z: c.z }, c.t % 1000);
      const tag = `cdw_ev:${c.id}`;
      if (kind === "lager") {
        b.disc(0, 0, 0, 5, "minecraft:coarse_dirt");
        for (let y = 1; y < 5; y++) b.disc(0, y, 0, 5, "minecraft:air");
        b.set(0, 1, 0, { id: "minecraft:campfire", states: { extinguished: false } });
        for (const [x, z] of [[-4, -1], [3, 2]]) {
          b.box(x, 1, z, x + 1, 2, z + 1, "minecraft:spruce_fence");
          b.box(x - 1, 3, z - 1, x + 2, 3, z + 2, "minecraft:brown_wool");
        }
        b.set(2, 1, -3, "minecraft:barrel").set(-2, 1, 3, "minecraft:hay_block");
        b.then(() => {
          for (let i = 0; i < 4; i++) spawnMobAt(i < 3 ? "goblin_pluenderer" : "goblin_schuetze", { x: c.x + rand(-4, 4), y: s.y + 1, z: c.z + rand(-4, 4) }, Math.max(2, lvl), [tag]);
        });
      } else {
        b.disc(0, 0, 0, 4, [{ b: "minecraft:crying_obsidian", w: 1 }, { b: "cdw:faeulnis", w: 3 }, { b: "minecraft:soul_soil", w: 1 }]);
        b.set(0, 1, 0, "minecraft:soul_fire");
        b.then(() => {
          for (let i = 0; i < 4; i++) spawnMobAt(pick(["faeulnisgeist", "moosling", "seufzergeist"]), { x: c.x + rand(-4, 4), y: s.y + 1, z: c.z + rand(-4, 4) }, Math.max(2, lvl + 1), [tag]);
        });
      }
      b.run(() => resolve(), 40);
    });
  });
}

function tickEventCompletion(): void {
  const w = wdata();
  const dim = world.getDimension("minecraft:overworld");
  for (const c of [...w.camps]) {
    const near = players().filter((p) => V.dist2d(p.location, { x: c.x, y: 0, z: c.z }) < 40);
    if (!near.length) continue;
    if (Date.now() - c.t < 15000) continue;
    const alive = dim.getEntities({ tags: [`cdw_ev:${c.id}`] }).length;
    if (alive > 0) continue;
    w.camps = w.camps.filter((x) => x.id !== c.id);
    markWorldDirty();
    const isCamp = c.id.startsWith("lager");
    for (const p of near) {
      title(p, isCamp ? "§aLager geräumt!" : "§aRiss geschlossen!", "§7Belohnung erhalten", 5, 40, 10);
      addXp(p, 80 + level(p) * 25, "(Ereignis)");
      addGold(p, 20 + level(p) * 3, "(Ereignis)");
      if (Math.random() < 0.6) giveItem(p, createGear(randomGearFor(level(p), pdata(p).cls), 1 + (Math.random() < 0.3 ? 1 : 0)));
      emit("flag", { key: isCamp ? "camp_cleared" : "rift_closed", player: p });
    }
    if (!isCamp) {
      // Riss versiegeln
      const s = surfaceY(dim, c.x, c.z);
      if (s) {
        try {
          dim.runCommand(`fill ${c.x - 4} ${s.y} ${c.z - 4} ${c.x + 4} ${s.y} ${c.z + 4} moss_block replace cdw:faeulnis`);
          dim.runCommand(`fill ${c.x} ${s.y + 1} ${c.z} ${c.x} ${s.y + 1} ${c.z} air replace soul_fire`);
        } catch {
          /* ignorieren */
        }
        ring(dim, "minecraft:totem_particle", { x: c.x, y: s.y + 1, z: c.z }, 3, 16);
      }
    }
  }
}

// ------------------- Weltboss -------------------
export function summonWorldBoss(p: Player): string | undefined {
  const w = wdata();
  if (w.main.idx < 26) return "Der Altar schweigt noch.";
  const hub = hubPos();
  if (!hub) return "Kein Hain.";
  if (flag("wyrm_active")) return "Der Uralte ist bereits erwacht!";
  const center = { x: hub.x + HUB_SPOTS.altar.x, y: hub.y + 1, z: hub.z + HUB_SPOTS.altar.z - 14 };
  const e = startBoss("boss_wurzelwyrm", center, "cdw_wb", false, () => {
    setFlag("wyrm_active", 0);
    const week = weekNumber();
    for (const pl of players()) {
      if (V.dist(pl.location, center) > 80) continue;
      const d = pdata(pl);
      const first = (d.stats.wyrmWeek ?? 0) !== week;
      d.stats.wyrmWeek = week;
      addXp(pl, 20000, "(Weltboss)");
      if (first) {
        giveItem(pl, createGear(randomGearFor(50, d.cls, 0.5), 4));
        pl.sendMessage("§6✦ Wöchentliche Beute des Uralten erhalten!");
      } else pl.sendMessage("§7Die wöchentliche Beute hast du bereits erhalten. Nächste Woche wieder!");
    }
    broadcast("§6✦ Der Uralte Wurzelwyrm wurde bezwungen!");
  });
  if (!e) return "Beschwörung fehlgeschlagen.";
  setFlag("wyrm_active", 1);
  void p;
  return undefined;
}

export function initEvents(): void {
  system.runInterval(() => {
    try {
      tickDefense();
      tickCamp();
    } catch (e) {
      log("Event-Tick:", String(e));
    }
  }, 20);
  system.runInterval(() => {
    try {
      tickZones();
      tickEventCompletion();
    } catch (e) {
      log("Zonen-Tick:", String(e));
    }
  }, 60);
  system.runInterval(() => {
    try {
      tickWorldEvents();
    } catch (e) {
      log("Welt-Event:", String(e));
    }
  }, 1200);
}
