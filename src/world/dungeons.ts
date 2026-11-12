// Dungeons: Platzierung beim Annähern, Räume mit Wellen, Runenrätsel, Bossarena, Wurzelherz, Heroisch.
import { Entity, Player, system, Vector3, world, BlockPermutation, ItemStack, BlockInventoryComponent } from "@minecraft/server";
import { DUNGEON_RINGS } from "../data/balance";
import { mobById } from "../data/mobs";
import { emit } from "../core/bus";
import { DungeonState, markDirty, markWorldDirty, pdata, wdata } from "../core/store";
import { V, broadcast, isValid, log, particle, pick, players, rand, ring, sound, title } from "../core/util";
import { Builder, Palette, perm, surfaceY, withLoadedArea } from "./builder";
import { registerWaystone } from "./waystones";
import { assignLevel } from "../systems/mobs";
import { startBoss } from "./bosses";
import { choice } from "../systems/ui";
import { giveItem } from "../systems/quests";
import { cinematic } from "./cinematics";
import { createGear, randomGearFor } from "../systems/gear";

export interface Theme {
  wall: Palette;
  floor: Palette;
  ceil: Palette;
  pillar: Palette;
  accent: Palette;
  light: Palette;
  deco: Palette;
  surface: Palette;
}

export interface DungeonDef {
  id: string;
  name: string;
  act: number;
  ring: number;
  angle: number; // Grad, Richtung vom Hain
  level: number;
  mobs: string[];
  elite: string;
  boss: string;
  theme: Theme;
  tower?: boolean; // Zitadelle: nach oben statt nach unten
}

const T = {
  forest: {
    wall: [{ b: "minecraft:mossy_stone_bricks", w: 4 }, { b: "minecraft:stone_bricks", w: 2 }, { b: "minecraft:cracked_stone_bricks", w: 1 }, { b: "minecraft:moss_block", w: 1 }],
    floor: [{ b: "minecraft:moss_block", w: 3 }, { b: "minecraft:mossy_cobblestone", w: 2 }, { b: "minecraft:dirt_with_roots", w: 1 }],
    ceil: [{ b: "minecraft:mossy_stone_bricks", w: 3 }, { b: "minecraft:moss_block", w: 2 }],
    pillar: { id: "minecraft:oak_log", states: { pillar_axis: "y" } },
    accent: "minecraft:chiseled_stone_bricks",
    light: "minecraft:ochre_froglight",
    deco: [{ b: "minecraft:moss_carpet", w: 3 }, { b: "minecraft:short_grass", w: 1 }, { b: "minecraft:fern", w: 1 }],
    surface: [{ b: "minecraft:mossy_stone_bricks", w: 3 }, { b: "minecraft:mossy_cobblestone", w: 2 }],
  },
  swamp: {
    wall: [{ b: "minecraft:mud_bricks", w: 4 }, { b: "minecraft:packed_mud", w: 2 }, { b: "minecraft:mossy_cobblestone", w: 1 }],
    floor: [{ b: "minecraft:mud", w: 3 }, { b: "minecraft:muddy_mangrove_roots", w: 1 }, { b: "minecraft:mud_bricks", w: 2 }],
    ceil: [{ b: "minecraft:mangrove_roots", w: 2 }, { b: "minecraft:mud_bricks", w: 3 }],
    pillar: { id: "minecraft:mangrove_log", states: { pillar_axis: "y" } },
    accent: "minecraft:mangrove_planks",
    light: "minecraft:verdant_froglight",
    deco: [{ b: "minecraft:moss_carpet", w: 2 }, { b: "minecraft:brown_mushroom", w: 1 }],
    surface: [{ b: "minecraft:mud_bricks", w: 3 }, { b: "minecraft:mangrove_planks", w: 1 }],
  },
  desert: {
    wall: [{ b: "minecraft:cut_sandstone", w: 3 }, { b: "minecraft:smooth_sandstone", w: 2 }, { b: "minecraft:chiseled_sandstone", w: 1 }],
    floor: [{ b: "minecraft:smooth_sandstone", w: 3 }, { b: "minecraft:sand", w: 1 }, { b: "minecraft:orange_terracotta", w: 1 }],
    ceil: [{ b: "minecraft:cut_red_sandstone", w: 2 }, { b: "minecraft:smooth_sandstone", w: 2 }],
    pillar: "minecraft:chiseled_red_sandstone",
    accent: "minecraft:gold_block",
    light: "minecraft:pearlescent_froglight",
    deco: [{ b: "minecraft:deadbush", w: 2 }, { b: "minecraft:sand", w: 1 }],
    surface: [{ b: "minecraft:cut_sandstone", w: 3 }, { b: "minecraft:sandstone", w: 2 }],
  },
  frost: {
    wall: [{ b: "minecraft:deepslate_tiles", w: 3 }, { b: "minecraft:packed_ice", w: 2 }, { b: "minecraft:polished_deepslate", w: 1 }],
    floor: [{ b: "minecraft:packed_ice", w: 3 }, { b: "minecraft:snow", w: 2 }, { b: "minecraft:deepslate_tiles", w: 1 }],
    ceil: [{ b: "minecraft:blue_ice", w: 2 }, { b: "minecraft:deepslate_tiles", w: 3 }],
    pillar: "minecraft:polished_deepslate",
    accent: "minecraft:blue_ice",
    light: "minecraft:sea_lantern",
    deco: [{ b: "minecraft:snow_layer", w: 3 }],
    surface: [{ b: "minecraft:deepslate_tiles", w: 2 }, { b: "minecraft:packed_ice", w: 1 }, { b: "minecraft:snow", w: 2 }],
  },
  deep: {
    wall: [{ b: "minecraft:deepslate_bricks", w: 3 }, { b: "minecraft:cracked_deepslate_bricks", w: 1 }, { b: "minecraft:tuff_bricks", w: 1 }],
    floor: [{ b: "minecraft:polished_deepslate", w: 3 }, { b: "minecraft:sculk", w: 1 }, { b: "minecraft:amethyst_block", w: 0.5 }],
    ceil: [{ b: "minecraft:deepslate_bricks", w: 3 }, { b: "minecraft:amethyst_block", w: 1 }],
    pillar: "minecraft:chiseled_deepslate",
    accent: "minecraft:amethyst_block",
    light: "minecraft:pearlescent_froglight",
    deco: [{ b: "minecraft:small_amethyst_bud", w: 1 }, { b: "minecraft:sculk_vein", w: 1 }],
    surface: [{ b: "minecraft:cobbled_deepslate", w: 2 }, { b: "minecraft:deepslate_bricks", w: 2 }],
  },
  citadel: {
    wall: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:cracked_polished_blackstone_bricks", w: 1 }, { b: "minecraft:crimson_hyphae", w: 1 }],
    floor: [{ b: "minecraft:polished_blackstone", w: 3 }, { b: "minecraft:crimson_nylium", w: 1 }],
    ceil: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:nether_wart_block", w: 1 }],
    pillar: { id: "minecraft:crimson_stem", states: { pillar_axis: "y" } },
    accent: "minecraft:crying_obsidian",
    light: "minecraft:shroomlight",
    deco: [{ b: "minecraft:crimson_roots", w: 2 }, { b: "minecraft:weeping_vines", w: 0 }],
    surface: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:blackstone", w: 1 }],
  },
} satisfies Record<string, Theme>;

export const DUNGEONS: DungeonDef[] = [
  { id: "dornenhain", name: "Der Dornenhain", act: 1, ring: DUNGEON_RINGS[0], angle: 35, level: 7, mobs: ["moosling", "dornenwolf", "rindenschreck_setzling"], elite: "dornenwolf", boss: "boss_rindenschreck", theme: T.forest },
  { id: "seufzermoor", name: "Das Seufzermoor", act: 2, ring: DUNGEON_RINGS[1], angle: 145, level: 14, mobs: ["moorschlurfer", "schlammkroete", "seufzergeist"], elite: "moorschlurfer", boss: "boss_moorschlund", theme: T.swamp },
  { id: "glutsand", name: "Tempel der Glut", act: 3, ring: DUNGEON_RINGS[2], angle: 250, level: 21, mobs: ["glutskorpion", "verdorrter_priester", "glutgeist"], elite: "verdorrter_priester", boss: "boss_glutkoenigin", theme: T.desert },
  { id: "frostkrone", name: "Frostkrone-Feste", act: 4, ring: DUNGEON_RINGS[3], angle: 320, level: 28, mobs: ["eiskobold", "frosttroll", "reifkraehe"], elite: "frosttroll", boss: "boss_hrimgar", theme: T.frost },
  { id: "schattenwurzel", name: "Die Schattenwurzel", act: 5, ring: DUNGEON_RINGS[4], angle: 200, level: 35, mobs: ["kristallspinne", "schattenkriecher", "wurzelgolem"], elite: "schattenkriecher", boss: "boss_kristallmutter", theme: T.deep },
  { id: "zitadelle", name: "Zitadelle des Welkens", act: 6, ring: DUNGEON_RINGS[5], angle: 95, level: 39, mobs: ["faeulnisgeist", "wurzelgolem", "schattenkriecher", "seufzergeist"], elite: "wurzelgolem", boss: "boss_morvath", theme: T.citadel, tower: true },
];

export function dungeonDef(id: string): DungeonDef | undefined {
  return DUNGEONS.find((d) => d.id === id);
}

// ---------- Layout (relativ zum Eingang; Norden = -z) ----------
interface RoomLayout {
  kind: "wave" | "puzzle" | "boss" | "heart";
  min: Vector3;
  max: Vector3;
  door: { min: Vector3; max: Vector3 }; // Ausgang (Barriere)
}

const D = -14; // Tiefe der Räume
function layout(def: DungeonDef): RoomLayout[] {
  if (def.tower) {
    // Etagen nach oben: jeweils 15 hoch
    const rooms: RoomLayout[] = [];
    const kinds: RoomLayout["kind"][] = ["wave", "wave", "puzzle", "wave", "boss"];
    for (let i = 0; i < kinds.length; i++) {
      const y = 1 + i * 9;
      rooms.push({ kind: kinds[i], min: { x: -9, y, z: -18 }, max: { x: 9, y: y + 7, z: 0 }, door: { min: { x: -1, y: y + 8, z: -2 }, max: { x: 1, y: y + 8, z: 0 } } });
    }
    return rooms;
  }
  return [
    { kind: "wave", min: { x: -7, y: D, z: -32 }, max: { x: 7, y: D + 7, z: -18 }, door: { min: { x: -2, y: D, z: -33 }, max: { x: 2, y: D + 4, z: -33 } } },
    { kind: "puzzle", min: { x: -7, y: D, z: -52 }, max: { x: 7, y: D + 7, z: -38 }, door: { min: { x: -2, y: D, z: -53 }, max: { x: 2, y: D + 4, z: -53 } } },
    { kind: "wave", min: { x: -7, y: D, z: -72 }, max: { x: 7, y: D + 7, z: -58 }, door: { min: { x: -2, y: D, z: -73 }, max: { x: 2, y: D + 4, z: -73 } } },
    { kind: "boss", min: { x: -12, y: D, z: -102 }, max: { x: 12, y: D + 12, z: -78 }, door: { min: { x: -2, y: D, z: -103 }, max: { x: 2, y: D + 4, z: -103 } } },
    { kind: "heart", min: { x: -4, y: D, z: -114 }, max: { x: 4, y: D + 6, z: -106 }, door: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } },
  ];
}

function bossCenter(def: DungeonDef): Vector3 {
  return def.tower ? { x: 0, y: 1 + 4 * 9 + 1, z: -9 } : { x: 0, y: D + 1, z: -90 };
}
function heartPos(def: DungeonDef): Vector3 {
  return def.tower ? { x: 0, y: 1 + 4 * 9 + 1, z: -16 } : { x: 0, y: D + 2, z: -112 };
}

// ---------- Ort bestimmen ----------
export function dungeonState(id: string): DungeonState | undefined {
  return wdata().dungeons[id];
}

export function ensureLocation(id: string): DungeonState | undefined {
  const def = dungeonDef(id);
  const hub = wdata().hub;
  if (!def || !hub) return undefined;
  let st = wdata().dungeons[id];
  if (st) return st;
  const ang = ((def.angle + (hub.x % 30)) * Math.PI) / 180;
  st = { x: Math.round(hub.x + Math.cos(ang) * def.ring), y: hub.y, z: Math.round(hub.z + Math.sin(ang) * def.ring), built: false, stage: 0, boss: false, heart: false, rerolls: 0 };
  wdata().dungeons[id] = st;
  markWorldDirty();
  return st;
}

export function reroll(id: string): boolean {
  const st = wdata().dungeons[id];
  const def = dungeonDef(id);
  const hub = wdata().hub;
  if (!st || !def || !hub || st.built) return false;
  st.rerolls++;
  const ang = ((def.angle + st.rerolls * 47 + (hub.x % 30)) * Math.PI) / 180;
  const ring = def.ring + (st.rerolls % 2) * 60;
  st.x = Math.round(hub.x + Math.cos(ang) * ring);
  st.z = Math.round(hub.z + Math.sin(ang) * ring);
  markWorldDirty();
  return true;
}

export function dungeonUnlocked(def: DungeonDef): boolean {
  const idx = wdata().main.idx;
  const unlockAt: Record<string, number> = { dornenhain: 4, seufzermoor: 9, glutsand: 14, frostkrone: 17, schattenwurzel: 21, zitadelle: 24 };
  return idx >= (unlockAt[def.id] ?? 99) || !!wdata().dungeons[def.id];
}

// ---------- Bauen ----------
const buildingNow = new Set<string>();

function buildDungeon(def: DungeonDef, st: DungeonState): void {
  buildDungeonImpl(def, st, () => undefined, false);
}

export function testBuildDungeon(id: string, at: { x: number; z: number }): Promise<DungeonState> {
  const def = dungeonDef(id);
  if (!def) return Promise.reject(new Error("unbekannt"));
  const st: DungeonState = { x: at.x, y: 64, z: at.z, built: false, stage: 0, boss: false, heart: false, rerolls: 0 };
  return new Promise<DungeonState>((res) => buildDungeonImpl(def, st, () => res(st), true));
}

function buildDungeonImpl(def: DungeonDef, st: DungeonState, done: () => void, test: boolean): void {
  const key = test ? `test_${def.id}` : def.id;
  if (buildingNow.has(key)) return;
  buildingNow.add(key);
  const dim = world.getDimension("minecraft:overworld");
  const from = { x: st.x - 20, y: 0, z: st.z - 120 };
  const to = { x: st.x + 20, y: 0, z: st.z + 12 };
  void withLoadedArea(`dg_${key}`, dim, from, to, () => {
    return new Promise<void>((resolve) => {
      // Oberfläche bestimmen (Land suchen)
      let surf = surfaceY(dim, st.x, st.z);
      for (let i = 0; i < 6 && surf?.water; i++) {
        const nx = st.x + Math.round(rand(-30, 30));
        const nz = st.z + Math.round(rand(-30, 30));
        const s2 = surfaceY(dim, nx, nz);
        if (s2 && !s2.water) {
          st.x = nx;
          st.z = nz;
          surf = s2;
        }
      }
      const y = Math.max(-40, Math.min(250, surf?.y ?? wdata().hub?.y ?? 64));
      st.y = y;
      const origin = { x: st.x, y, z: st.z };
      const b = new Builder(dim, origin, st.x * 7 + st.z * 13);
      if (def.tower) buildTower(b, def, !!surf?.water);
      else buildUnderground(b, def, !!surf?.water);
      b.then(() => {
        if (test) return;
        registerWaystone(`dg_${def.id}`, { x: origin.x + 4, y: origin.y + 1, z: origin.z + 5 }, "minecraft:overworld", def.name);
        if (def.id === "seufzermoor" && wdata().flags.npc_morgra_x !== undefined) {
          wdata().flags.npc_morgra_x = origin.x - 10.5;
          wdata().flags.npc_morgra_y = origin.y + 1;
          wdata().flags.npc_morgra_z = origin.z + 6.5;
        }
        st.built = true;
        markWorldDirty();
        for (const p of dim.getPlayers({ location: origin, maxDistance: 120 })) title(p, `§6${def.name}`, "§7Ein uralter Ort erhebt sich", 10, 60, 20);
        sound(dim, "ambient.weather.thunder", origin, 0.5, 1);
      });
      b.run(() => {
        buildingNow.delete(key);
        resolve();
        done();
      }, 50);
    });
  });
}

function buildUnderground(b: Builder, def: DungeonDef, water: boolean): void {
  const t = def.theme;
  const rooms = layout(def);
  // 1) Räume zuerst (ihre Wände dürfen später von Gängen durchbrochen werden)
  rooms.forEach((r) => {
    if (r.kind === "boss") arena(b, t, r);
    else chamber(b, t, r);
  });
  // 2) Oberfläche: Ruine + Plattform
  if (water) b.box(-7, -3, -7, 7, 0, 9, t.surface);
  b.box(-6, 0, -6, 6, 0, 8, t.surface);
  b.box(-6, 1, -6, 6, 8, 8, "minecraft:air");
  for (const [x, z] of [[-5, -5], [5, -5], [-5, 7], [5, 7]]) {
    const h = 2 + Math.floor(b.rnd() * 5);
    b.box(x, 1, z, x, h, z, t.pillar);
  }
  b.box(-3, 1, -6, -3, 5, -6, t.wall).box(3, 1, -6, 3, 5, -6, t.wall).box(-3, 6, -6, 3, 6, -6, t.wall);
  b.set(0, 7, -6, t.accent);
  b.set(-3, 6, -5, t.light).set(3, 6, -5, t.light);
  b.set(4, 1, 5, "cdw:wegstein");
  if (def.id === "seufzermoor") {
    // Morgras Hütte
    b.box(-14, 0, 3, -8, 0, 9, "minecraft:mangrove_planks");
    b.box(-14, 1, 3, -8, 4, 9, [{ b: "minecraft:mud_bricks", w: 3 }, { b: "minecraft:mangrove_planks", w: 1 }]);
    b.box(-13, 1, 4, -9, 4, 8, "minecraft:air");
    b.box(-8, 1, 6, -8, 2, 6, "minecraft:air");
    b.box(-15, 5, 2, -7, 5, 10, "minecraft:mangrove_roots");
    b.set(-12, 1, 4, "minecraft:cauldron").set(-13, 1, 8, "minecraft:brewing_stand").set(-10, 3, 6, { id: "minecraft:lantern", states: { hanging: false } });
  }
  // 3) Treppe nach unten (Norden) bis in den ersten Raum
  const first = rooms[0];
  const wallZ = first.max.z + 1; // Südwand des ersten Raums
  for (let i = 0; i <= -D; i++) {
    const z = -6 - i;
    const yTop = -i;
    if (z >= wallZ) {
      b.box(-3, yTop - 1, z, 3, yTop + 5, z, t.wall);
      b.box(-2, yTop, z, 2, yTop + 4, z, "minecraft:air");
      b.box(-2, yTop - 1, z, 2, yTop - 1, z, t.floor);
      if (i % 4 === 2) b.set(-3, yTop + 2, z, t.light).set(3, yTop + 2, z, t.light);
      if (z === wallZ) b.box(-2, first.min.y, z, 2, yTop + 4, z, "minecraft:air");
    } else if (yTop - 1 >= first.min.y) {
      b.box(-2, yTop - 1, z, 2, yTop - 1, z, t.floor); // Stufen im Raum
    }
  }
  // 4) Gänge zwischen den Räumen (durch beide Wände) und Türen
  rooms.forEach((r, i) => {
    const next = rooms[i + 1];
    if (next) corridor(b, t, r.min.z - 1, next.max.z + 1);
    if (r.kind !== "heart") b.box(r.door.min.x, r.door.min.y, r.door.min.z, r.door.max.x, r.door.max.y, r.door.max.z, "cdw:barriere");
    roomDecor(b, def, r, i);
  });
}

function buildTower(b: Builder, def: DungeonDef, water: boolean): void {
  const t = def.theme;
  if (water) b.box(-12, -3, -22, 12, 0, 4, t.surface);
  b.box(-11, 0, -21, 11, 0, 3, t.surface);
  b.box(-11, 1, -21, 11, 50, 3, "minecraft:air");
  b.set(4, 1, 2, "cdw:wegstein");
  const rooms = layout(def);
  // Außenhülle
  b.box(-10, 0, -19, 10, 1 + rooms.length * 9 + 2, 1, t.wall);
  b.box(-9, 1, -18, 9, 1 + rooms.length * 9 + 1, 0, "minecraft:air");
  // Eingang
  b.box(-1, 1, 1, 1, 4, 1, "minecraft:air");
  // 1) Alle Böden zuerst
  rooms.forEach((r, i) => {
    const y = r.min.y;
    if (i > 0) b.box(-9, y - 1, -18, 9, y - 1, 0, t.floor);
    else b.box(-9, 0, -18, 9, 0, 0, t.floor);
  });
  // 2) Treppen, Öffnungen, Barrieren, Deko
  rooms.forEach((r, i) => {
    const y = r.min.y;
    if (i < rooms.length - 1) {
      for (let s2 = 0; s2 < 8; s2++) b.box(-1, y + s2, -1 - s2, 1, y + s2, -1 - s2, t.accent);
      b.box(-1, y + 8, -10, 1, y + 8, -2, "minecraft:air");
      b.box(r.door.min.x, r.door.min.y, -10, r.door.max.x, r.door.max.y, -2, "cdw:barriere");
    }
    for (const [x, z] of [[-8, -17], [8, -17], [-8, -1], [8, -1]]) b.box(x, y, z, x, y + 7, z, t.pillar);
    b.set(-9, y + 4, -9, t.light).set(9, y + 4, -9, t.light);
    b.box(-10, y + 3, -12, -10, y + 5, -6, "minecraft:air").box(10, y + 3, -12, 10, y + 5, -6, "minecraft:air");
    roomDecor(b, def, r, i);
  });
  // Dach-Arena offen
  const top = 1 + rooms.length * 9 + 1;
  b.box(-9, top, -18, 9, top + 3, 0, "minecraft:air");
  for (const [x, z] of [[-10, -19], [10, -19], [-10, 1], [10, 1]]) b.box(x, top, z, x, top + 6, z, t.pillar);
  const h = heartPos(def);
  b.set(h.x, h.y - 1, h.z, t.accent).set(h.x, h.y, h.z, "cdw:wurzelherz");
}

function corridor(b: Builder, t: Theme, zStart: number, zEnd: number): void {
  const [a, c] = [Math.max(zStart, zEnd), Math.min(zStart, zEnd)];
  b.box(-3, D - 1, c, 3, D + 5, a, t.wall);
  b.box(-2, D, c, 2, D + 4, a, "minecraft:air");
  b.box(-2, D - 1, c, 2, D - 1, a, t.floor);
  for (let z = a; z >= c; z -= 5) b.set(-3, D + 3, z, t.light);
}

function chamber(b: Builder, t: Theme, r: RoomLayout): void {
  b.room(r.min.x - 1, r.min.y - 1, r.min.z - 1, r.max.x + 1, r.max.y + 1, r.max.z + 1, t.wall, t.floor, t.ceil);
  // Säulen
  for (const [x, z] of [[r.min.x + 2, r.min.z + 2], [r.max.x - 2, r.min.z + 2], [r.min.x + 2, r.max.z - 2], [r.max.x - 2, r.max.z - 2]]) {
    b.box(x, r.min.y, z, x, r.max.y, z, t.pillar);
    b.set(x, r.max.y - 1, z + (z < (r.min.z + r.max.z) / 2 ? 1 : -1), t.light);
  }
}

function arena(b: Builder, t: Theme, r: RoomLayout): void {
  const cx = (r.min.x + r.max.x) / 2;
  const cz = (r.min.z + r.max.z) / 2;
  const rad = (r.max.x - r.min.x) / 2;
  b.cyl(cx, r.min.y - 1, cz, rad + 1, r.max.y - r.min.y + 3, t.wall);
  b.cyl(cx, r.min.y, cz, rad, r.max.y - r.min.y + 1, "minecraft:air");
  b.disc(cx, r.min.y - 1, cz, rad, t.floor);
  b.disc(cx, r.max.y + 1, cz, rad, t.ceil);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.round(cx + Math.cos(a) * (rad - 1.5));
    const z = Math.round(cz + Math.sin(a) * (rad - 1.5));
    b.box(x, r.min.y, z, x, r.max.y, z, t.pillar);
    b.set(x, r.min.y + 5, z, t.light);
  }
  b.disc(cx, r.min.y - 1, cz, 3, t.accent);
}

function roomDecor(b: Builder, def: DungeonDef, r: RoomLayout, i: number): void {
  const t = def.theme;
  const w = r.max.x - r.min.x;
  const d = r.max.z - r.min.z;
  for (let n = 0; n < 6; n++) {
    const x = r.min.x + 1 + Math.floor(b.rnd() * (w - 1));
    const z = r.min.z + 1 + Math.floor(b.rnd() * (d - 1));
    if (Math.abs(x) <= 1) continue;
    b.set(x, r.min.y, z, t.deco);
  }
  if (r.kind === "puzzle") {
    // 4 Runensteine mit Kerzen-Hinweisen (1–4 Kerzen = Reihenfolge)
    const spots = [
      { x: r.min.x + 2, z: (r.min.z + r.max.z) / 2 - 3 },
      { x: r.max.x - 2, z: (r.min.z + r.max.z) / 2 - 3 },
      { x: r.min.x + 2, z: (r.min.z + r.max.z) / 2 + 3 },
      { x: r.max.x - 2, z: (r.min.z + r.max.z) / 2 + 3 },
    ];
    // Reihenfolge per Seed mischen
    const order = [0, 1, 2, 3].sort(() => b.rnd() - 0.5);
    spots.forEach((s, k) => {
      const z = Math.round(s.z);
      b.set(s.x, r.min.y, z, "cdw:runenstein");
      b.set(s.x, r.min.y - 1, z, t.accent);
      b.set(s.x + (s.x < 0 ? 1 : -1), r.min.y, z, { id: "minecraft:candle", states: { candles: order[k], lit: true } });
      b.mark(`rune${order[k]}`, s.x, r.min.y, z);
    });
    b.then(() => storeMarks(def.id, b.marks));
  }
  if (r.kind === "heart" && !def.tower) {
    b.box(r.min.x, r.min.y, r.min.z, r.max.x, r.min.y, r.max.z, t.accent);
    const h = heartPos(def);
    b.set(h.x, h.y - 1, h.z, t.pillar);
    b.set(h.x, h.y, h.z, "cdw:wurzelherz");
    for (const [x, z] of [[-3, -113], [3, -113], [-3, -107], [3, -107]]) b.box(x, r.min.y + 1, z, x, r.max.y, z, t.pillar);
  }
  if (r.kind === "wave" && i >= 2) {
    b.set(r.max.x - 1, r.min.y, r.min.z + 1, { id: "minecraft:chest", states: { "minecraft:cardinal_direction": "south" } });
    b.mark("chest", r.max.x - 1, r.min.y, r.min.z + 1);
    b.then(() => fillChest(def, b, r));
  }
}

function fillChest(def: DungeonDef, b: Builder, r: RoomLayout): void {
  try {
    const block = b.dim.getBlock(b.abs(r.max.x - 1, r.min.y, r.min.z + 1));
    const inv = (block?.getComponent("minecraft:inventory") as BlockInventoryComponent | undefined)?.container;
    if (!inv) return;
    const items: ItemStack[] = [
      new ItemStack("cdw:heiltrank", 2 + Math.floor(b.rnd() * 2)),
      new ItemStack("cdw:manatrank", 1 + Math.floor(b.rnd() * 2)),
      new ItemStack("minecraft:gold_ingot", 2 + Math.floor(b.rnd() * 5)),
      new ItemStack("cdw:runenstaub", 1 + Math.floor(def.act / 2)),
    ];
    if (b.rnd() < 0.5) items.push(new ItemStack("cdw:verwelkte_seite", 1));
    if (b.rnd() < 0.3) items.push(new ItemStack("minecraft:diamond", 1 + Math.floor(b.rnd() * 2)));
    items.push(createGear(randomGearFor(def.level + 2, undefined), 1 + Math.floor(b.rnd() * 2)));
    let slot = 0;
    for (const it of items) {
      inv.setItem(slot, it);
      slot += 2 + Math.floor(b.rnd() * 3);
    }
  } catch {
    /* Truhe nicht verfügbar */
  }
}

function storeMarks(id: string, marks: Record<string, Vector3[]>): void {
  const st = wdata().dungeons[id];
  if (!st) return;
  st.data ??= {};
  for (let k = 0; k < 4; k++) {
    const m = marks[`rune${k}`]?.[0];
    if (m) {
      st.data[`r${k}x`] = m.x;
      st.data[`r${k}y`] = m.y;
      st.data[`r${k}z`] = m.z;
    }
  }
  markWorldDirty();
}

// ---------- Laufzeit ----------
function abs(st: DungeonState, v: Vector3): Vector3 {
  return { x: st.x + v.x, y: st.y + v.y, z: st.z + v.z };
}

function inBox(p: Vector3, st: DungeonState, r: RoomLayout): boolean {
  const a = abs(st, r.min);
  const c = abs(st, r.max);
  return p.x >= a.x && p.x <= c.x + 1 && p.y >= a.y - 1 && p.y <= c.y + 2 && p.z >= a.z && p.z <= c.z + 1;
}

const active = new Map<string, { room: number; tag: string; waves: number; wave: number }>();

function tagFor(id: string, room: number): string {
  return `cdw_dg:${id}:${room}`;
}

function spawnWave(def: DungeonDef, st: DungeonState, roomIdx: number, waveNo: number, heroic: boolean): void {
  const rooms = layout(def);
  const r = rooms[roomIdx];
  const dim = world.getDimension("minecraft:overworld");
  const players = dim.getPlayers({ location: abs(st, r.min), maxDistance: 80 }).length;
  const count = 3 + roomIdx + waveNo + Math.max(0, players - 1) * 2;
  const tag = tagFor(def.id, roomIdx);
  const lvl = (heroic ? 50 : def.level) + roomIdx;
  for (let i = 0; i < count; i++) {
    const mobId = i === 0 && waveNo > 0 ? def.elite : pick(def.mobs);
    const loc = abs(st, { x: Math.round(rand(r.min.x + 2, r.max.x - 2)), y: r.min.y, z: Math.round(rand(r.min.z + 2, r.max.z - 2)) });
    try {
      const e = dim.spawnEntity(`cdw:${mobId}`, V.add(loc, { x: 0.5, y: 0.1, z: 0.5 }));
      e.addTag(tag);
      e.addTag("cdw_dungeon");
      e.setDynamicProperty("cdw:l", lvl);
      if (i === 0 && waveNo > 0) {
        e.setDynamicProperty("cdw:e", true);
        e.setDynamicProperty("cdw:hm", 2.5);
        e.setDynamicProperty("cdw:dm", 1.5);
        try {
          e.setProperty("cdw:elite", true);
        } catch {
          /* ignorieren */
        }
      }
      assignLevel(e);
      particle(dim, "minecraft:large_smoke_particle", V.add(loc, { x: 0.5, y: 1, z: 0.5 }));
    } catch (err) {
      log("Wellen-Spawn fehlgeschlagen:", mobId, String(err));
    }
  }
  sound(dim, "mob.evocation_illager.prepare_summon", abs(st, r.min), 0.8, 1);
}

function openDoor(def: DungeonDef, st: DungeonState, roomIdx: number): void {
  const r = layout(def)[roomIdx];
  const dim = world.getDimension("minecraft:overworld");
  const air = perm("minecraft:air");
  if (!air) return;
  const zmin = def.tower ? -10 : r.door.min.z;
  const zmax = def.tower ? -2 : r.door.max.z;
  for (let x = r.door.min.x; x <= r.door.max.x; x++)
    for (let y = r.door.min.y; y <= r.door.max.y; y++)
      for (let z = zmin; z <= zmax; z++) {
        const loc = abs(st, { x, y, z });
        try {
          const blk = dim.getBlock(loc);
          if (blk?.typeId === "cdw:barriere") {
            blk.setPermutation(air);
            if ((x + y + z) % 2 === 0) particle(dim, "minecraft:villager_happy", V.add(loc, { x: 0.5, y: 0.5, z: 0.5 }));
          }
        } catch {
          /* ignorieren */
        }
      }
  sound(dim, "random.door_open", abs(st, r.door.min), 0.6, 1);
}

function closeDoors(def: DungeonDef, st: DungeonState, fromRoom: number): void {
  const dim = world.getDimension("minecraft:overworld");
  const bar = perm("cdw:barriere");
  if (!bar) return;
  layout(def).forEach((r, i) => {
    if (i < fromRoom || r.kind === "heart") return;
    const zmin = def.tower ? -10 : r.door.min.z;
    const zmax = def.tower ? -2 : r.door.max.z;
    for (let x = r.door.min.x; x <= r.door.max.x; x++)
      for (let y = r.door.min.y; y <= r.door.max.y; y++)
        for (let z = zmin; z <= zmax; z++) {
          try {
            dim.getBlock(abs(st, { x, y, z }))?.setPermutation(bar);
          } catch {
            /* ignorieren */
          }
        }
  });
}

function roomCleared(def: DungeonDef, st: DungeonState, roomIdx: number): void {
  st.stage = roomIdx + 1;
  markWorldDirty();
  active.delete(def.id);
  openDoor(def, st, roomIdx);
  const dim = world.getDimension("minecraft:overworld");
  for (const p of dim.getPlayers({ location: abs(st, layout(def)[roomIdx].min), maxDistance: 60 })) {
    title(p, "§aRaum gesäubert", "§7Der Weg ist frei", 5, 30, 10);
    sound(p, "random.levelup", undefined, 1.4, 0.6);
  }
  const rooms = layout(def);
  const bossIdx = rooms.findIndex((r) => r.kind === "boss");
  if (roomIdx === bossIdx - 1) emit("flag", { key: `dungeon:${def.id}:rooms` });
}

function bossLoc(def: DungeonDef, st: DungeonState): Vector3 {
  return abs(st, bossCenter(def));
}

function tickDungeon(def: DungeonDef, st: DungeonState): void {
  const dim = world.getDimension("minecraft:overworld");
  const near = dim.getPlayers({ location: { x: st.x, y: st.y, z: st.z - 50 }, maxDistance: 140 });
  if (!near.length) return;
  const rooms = layout(def);
  const heroic = (st.heroic ?? 0) > 0 && st.data?.heroicActive === 1;
  const act = active.get(def.id);
  if (act) {
    const left = dim.getEntities({ tags: [act.tag] }).length;
    if (left === 0) {
      if (act.wave + 1 < act.waves) {
        act.wave++;
        spawnWave(def, st, act.room, act.wave, heroic);
        for (const p of near) title(p, "", `§cWelle ${act.wave + 1}/${act.waves}`, 2, 20, 5);
      } else roomCleared(def, st, act.room);
    }
    return;
  }
  const idx = st.stage;
  const r = rooms[idx];
  if (!r) return;
  const inside = near.filter((p) => inBox(p.location, st, r));
  if (!inside.length) return;
  if (r.kind === "wave") {
    // Wellen: vorhandene getaggte Mobs nach Neustart berücksichtigen
    const tag = tagFor(def.id, idx);
    const existing = dim.getEntities({ tags: [tag] }).length;
    active.set(def.id, { room: idx, tag, waves: idx >= 2 ? 3 : 2, wave: 0 });
    if (!existing) spawnWave(def, st, idx, 0, heroic);
    for (const p of inside) title(p, "§cHinterhalt!", "§7Besiege alle Gegner", 5, 30, 10);
  } else if (r.kind === "boss" && !st.boss) {
    const tag = tagFor(def.id, idx);
    const existing = dim.getEntities({ tags: [tag] });
    active.set(def.id, { room: idx, tag, waves: 1, wave: 0 });
    if (!existing.length) {
      closeDoorBehind(def, st, idx);
      startBoss(def.boss, bossLoc(def, st), tag, heroic, () => onBossDefeated(def, st, idx, heroic));
    }
  } else if (r.kind === "boss" && st.boss) {
    if (st.stage === idx) roomCleared(def, st, idx);
  }
}

function closeDoorBehind(def: DungeonDef, st: DungeonState, idx: number): void {
  // Den Gang hinter den Spielern mit Barriere schließen, bis der Boss fällt
  const rooms = layout(def);
  const prev = rooms[idx - 1];
  if (!prev || def.tower) return;
  const dim = world.getDimension("minecraft:overworld");
  const bar = perm("cdw:barriere");
  if (!bar) return;
  for (let x = prev.door.min.x; x <= prev.door.max.x; x++)
    for (let y = prev.door.min.y; y <= prev.door.max.y; y++) {
      const loc = abs(st, { x, y, z: prev.door.min.z });
      try {
        if (dim.getPlayers({ location: V.add(loc, { x: 0.5, y: 0, z: 0.5 }), maxDistance: 1.5 }).length) continue;
        dim.getBlock(loc)?.setPermutation(bar);
      } catch {
        /* ignorieren */
      }
    }
}

function onBossDefeated(def: DungeonDef, st: DungeonState, idx: number, heroic: boolean): void {
  if (heroic) {
    st.data ??= {};
    st.data.heroicActive = 0;
    markWorldDirty();
    for (const p of players()) {
      const d = pdata(p);
      d.stats.heroic = (d.stats.heroic ?? 0) + 1;
      markDirty(p);
      emit("flag", { key: "heroic_boss", player: p });
    }
    active.delete(def.id);
    if (idx > 0) openDoor(def, st, idx - 1);
    openDoor(def, st, idx);
    return;
  }
  st.boss = true;
  markWorldDirty();
  if (idx > 0) openDoor(def, st, idx - 1);
  roomCleared(def, st, idx);
}

/** Runenstein angeklickt. */
export function onRuneStone(p: Player, loc: Vector3): void {
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st?.built || !st.data) continue;
    let k = -1;
    for (let i = 0; i < 4; i++) if (st.x + st.data[`r${i}x`] === Math.floor(loc.x) && st.z + st.data[`r${i}z`] === Math.floor(loc.z) && Math.abs(st.y + st.data[`r${i}y`] - Math.floor(loc.y)) <= 1) k = i;
    if (k < 0) continue;
    const rooms = layout(def);
    const puzzleIdx = rooms.findIndex((r) => r.kind === "puzzle");
    if (st.stage !== puzzleIdx) {
      p.sendMessage("§7Der Runenstein schweigt.");
      return;
    }
    const next = st.data.puzzle ?? 0;
    const dim = p.dimension;
    if (k === next) {
      st.data.puzzle = next + 1;
      setRuneLit(dim, { x: st.x + st.data[`r${k}x`], y: st.y + st.data[`r${k}y`], z: st.z + st.data[`r${k}z`] }, true);
      sound(dim, "block.bell.hit", loc, 1 + k * 0.2, 1);
      if (st.data.puzzle >= 4) {
        st.data.puzzle = 0;
        for (const pl of dim.getPlayers({ location: loc, maxDistance: 40 })) title(pl, "§aRätsel gelöst", "§7Die Runen leuchten", 5, 40, 10);
        roomCleared(def, st, puzzleIdx);
      }
    } else {
      st.data.puzzle = 0;
      for (let i = 0; i < 4; i++) setRuneLit(dim, { x: st.x + st.data[`r${i}x`], y: st.y + st.data[`r${i}y`], z: st.z + st.data[`r${i}z`] }, false);
      p.sendMessage("§cFalsche Reihenfolge! Die Runen erlöschen… §7(Tipp: Zähle die Kerzen neben den Steinen.)");
      sound(dim, "random.fizz", loc, 0.8, 1);
      // Strafe: zwei Gegner
      for (let i = 0; i < 2; i++) {
        try {
          const e = dim.spawnEntity(`cdw:${pick(def.mobs)}`, V.add(loc, { x: rand(-3, 3), y: 0, z: rand(-3, 3) }));
          e.setDynamicProperty("cdw:l", def.level);
          assignLevel(e);
        } catch {
          /* ignorieren */
        }
      }
    }
    markWorldDirty();
    return;
  }
}

function setRuneLit(dim: ReturnType<typeof world.getDimension>, loc: Vector3, lit: boolean): void {
  try {
    const b = dim.getBlock(loc);
    if (b?.typeId === "cdw:runenstein") b.setPermutation(BlockPermutation.resolve("cdw:runenstein" as never, { "cdw:lit": lit } as never));
  } catch {
    /* ignorieren */
  }
}

/** Wurzelherz angeklickt. */
export async function onHeart(p: Player, loc: Vector3): Promise<void> {
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st?.built) continue;
    const h = abs(st, heartPos(def));
    if (V.dist(h, loc) > 2) continue;
    if (st.heart) {
      p.sendMessage("§aDas Wurzelherz schlägt kräftig und warm.");
      return;
    }
    if (!st.boss) {
      p.sendMessage("§5Eine finstere Macht schützt das Herz noch…");
      return;
    }
    if (def.id === "seufzermoor" && !wdata().morgra) {
      const sel = await choice(p, { s: "erzaehler", t: "Der Fluch auf dem Herzen ist mit Morgra verbunden. Du kannst die Kraft des Herzens nutzen, um sie zu §aerlösen§f – oder den Fluch mit ihr zusammen §cverbannen§f und seine Macht für dich beanspruchen." }, ["§aMorgra erlösen\n§7Sie wird frei sein", "§cDen Fluch verbannen\n§7Morgra verschwindet mit ihm"]);
      if (sel === undefined) return;
      wdata().morgra = sel === 0 ? "free" : "banish";
      markWorldDirty();
      emit("flag", { key: "choice:morgra", player: p });
      if (sel === 0) broadcast("§a✦ Morgra wurde erlöst. Man munkelt, sie habe sich im Hain niedergelassen.");
      else broadcast("§c✦ Der Fluch wurde verbannt – und mit ihm die Hexe des Moors.");
      for (const pl of players()) {
        try {
          giveItem(pl, new ItemStack(sel === 0 ? "cdw:talisman_weisheit" : "cdw:talisman_macht", 1));
        } catch {
          /* ignorieren */
        }
      }
    }
    st.heart = true;
    markWorldDirty();
    try {
      p.dimension.getBlock(h)?.setPermutation(BlockPermutation.resolve("cdw:wurzelherz" as never, { "cdw:purified": true } as never));
    } catch {
      /* ignorieren */
    }
    for (let r = 1; r < 8; r++) system.runTimeout(() => ring(p.dimension, "minecraft:totem_particle", h, r, r * 4), r * 4);
    const near = p.dimension.getPlayers({ location: h, maxDistance: 32 });
    cinematic(near, [
      { loc: V.add(h, { x: 4, y: 3, z: 4 }), look: V.add(h, { x: 0.5, y: 0.8, z: 0.5 }), sec: 0 },
      { loc: V.add(h, { x: -3, y: 5, z: 3 }), look: V.add(h, { x: 0.5, y: 0.8, z: 0.5 }), sec: 3 },
    ]);
    sound(p.dimension, "random.totem", h, 1, 1);
    for (const pl of players()) title(pl, "§6Wurzelherz gereinigt", `§f${def.name}`, 10, 60, 20);
    emit("flag", { key: `heart:${def.id}`, player: p });
    return;
  }
}

/** Heroischer Modus: Dungeon zurücksetzen (Endgame). */
export function startHeroic(id: string): string | undefined {
  const def = dungeonDef(id);
  const st = wdata().dungeons[id];
  if (!def || !st?.built || !st.heart) return "Dieser Wurzelpfad ist noch nicht gereinigt.";
  const day = Math.floor(Date.now() / 86400000);
  st.data ??= {};
  if (st.data.heroicDay === day) return "Dieser Wurzelpfad wurde heute bereits heroisch bezwungen. Morgen wieder!";
  st.data.heroicDay = day;
  st.data.heroicActive = 1;
  st.heroic = Date.now();
  st.stage = 0;
  st.data.puzzle = 0;
  markWorldDirty();
  active.delete(id);
  const dim = world.getDimension("minecraft:overworld");
  try {
    if (dim.isChunkLoaded({ x: st.x, y: st.y, z: st.z })) closeDoors(def, st, 0);
  } catch {
    /* ignorieren */
  }
  st.data.needsDoors = 1;
  return undefined;
}

export function dungeonPos(id: string): { x: number; y: number; z: number } | undefined {
  const st = ensureLocation(id);
  if (!st) return undefined;
  return { x: st.x, y: st.y + 1, z: st.z };
}

export function initDungeons(): void {
  system.runInterval(() => {
    for (const def of DUNGEONS) {
      const st = wdata().dungeons[def.id];
      if (!st) continue;
      try {
        if (!st.built) {
          for (const p of players()) {
            if (p.dimension.id === "minecraft:overworld" && V.dist2d(p.location, st) < 90) {
              buildDungeon(def, st);
              break;
            }
          }
          continue;
        }
        if (st.data?.needsDoors) {
          const dim = world.getDimension("minecraft:overworld");
          if (dim.getPlayers({ location: st, maxDistance: 64 }).length) {
            closeDoors(def, st, 0);
            st.data.needsDoors = 0;
            markWorldDirty();
          }
        }
        tickDungeon(def, st);
      } catch (e) {
        log("Dungeon-Tick:", def.id, String(e));
      }
    }
  }, 10);
}

export function isDungeonMob(e: Entity): boolean {
  return isValid(e) && e.hasTag("cdw_dungeon");
}

export { mobById };
