// Hain des Erwachens: Platzierung, Ausbaustufen, NPCs.
import { Player, system, world, Vector3 } from "@minecraft/server";
import { NPCS } from "../data/mobs";
import { markWorldDirty, setFlag, wdata } from "../core/store";
import { V, broadcast, log, particle, players, sound, title } from "../core/util";
import { BlockSpec, Builder, Palette, withLoadedArea } from "./builder";
import { spawnNpc } from "./npcs";
import { registerWaystone } from "./waystones";

const LEAF = (id: string): BlockSpec => ({ id, states: { persistent_bit: true } });
const LEAVES: Palette = [
  { b: LEAF("minecraft:azalea_leaves"), w: 5 },
  { b: LEAF("minecraft:azalea_leaves_flowered"), w: 3 },
];
const LEAVES_BLOOM: Palette = [
  { b: LEAF("minecraft:cherry_leaves"), w: 5 },
  { b: LEAF("minecraft:azalea_leaves_flowered"), w: 3 },
  { b: "minecraft:shroomlight", w: 0.4 },
];
const BARK = { id: "minecraft:oak_wood", states: { pillar_axis: "y" } };
const PATH: Palette = [
  { b: "minecraft:grass_path", w: 6 },
  { b: "minecraft:coarse_dirt", w: 1 },
  { b: "minecraft:mossy_cobblestone", w: 1 },
];

const stair = (id: string, dir: number, upside = false) => ({ id, states: { weirdo_direction: dir, upside_down_bit: upside } });
// weirdo_direction: 0 = Ost, 1 = West, 2 = Süd, 3 = Nord (Aufstiegsrichtung)

export function hubPos(): Vector3 | undefined {
  const h = wdata().hub;
  return h ? { x: h.x, y: h.y, z: h.z } : undefined;
}

/** Plätze im Hain (relativ zum Zentrum). */
export const HUB_SPOTS: Record<string, Vector3> = {
  sylva: { x: 0, y: 1, z: -7 },
  fennick: { x: 13, y: 1, z: 3 },
  kael: { x: 9, y: 1, z: 14 },
  brom: { x: -13, y: 1, z: 9 },
  mira: { x: 13, y: 1, z: -11 },
  oswin: { x: -12, y: 1, z: -12 },
  morgra: { x: 16, y: 1, z: -2 },
  waystone: { x: -6, y: 1, z: 15 },
  board: { x: 4, y: 1, z: 15 },
  altar: { x: 0, y: 1, z: -16 },
};

function treeParams(stage: number): { h: number; r: number; crown: number; branches: number } {
  const t = [
    { h: 7, r: 0.6, crown: 3.2, branches: 0 },
    { h: 11, r: 1.1, crown: 4.2, branches: 3 },
    { h: 14, r: 1.5, crown: 5.2, branches: 4 },
    { h: 17, r: 1.9, crown: 6, branches: 5 },
    { h: 21, r: 2.3, crown: 7, branches: 6 },
    { h: 25, r: 2.8, crown: 8, branches: 7 },
  ];
  return t[Math.max(0, Math.min(5, stage))];
}

function buildTree(b: Builder, stage: number): void {
  const t = treeParams(stage);
  const leaves = stage >= 5 ? LEAVES_BLOOM : LEAVES;
  // Wurzeln
  for (let i = 0; i < 6 + stage; i++) {
    const a = (i / (6 + stage)) * Math.PI * 2 + b.rnd() * 0.4;
    const len = 2 + t.r * 2 + b.rnd() * 2;
    b.line({ x: 0, y: 1, z: 0 }, { x: Math.round(Math.cos(a) * len), y: 0, z: Math.round(Math.sin(a) * len) }, BARK);
  }
  b.cyl(0, 0, 0, t.r, t.h, BARK);
  // Äste mit Kronen
  for (let i = 0; i < t.branches; i++) {
    const a = (i / t.branches) * Math.PI * 2 + b.rnd();
    const sy = Math.round(t.h * (0.55 + b.rnd() * 0.3));
    const len = t.crown * 0.9 + b.rnd() * 2;
    const end = { x: Math.round(Math.cos(a) * len), y: sy + 2 + Math.round(b.rnd() * 3), z: Math.round(Math.sin(a) * len) };
    b.line({ x: 0, y: sy, z: 0 }, end, BARK);
    b.blob(end.x, end.y + 1, end.z, t.crown * 0.55, t.crown * 0.4, t.crown * 0.55, leaves, 0.8);
  }
  b.blob(0, t.h + 1, 0, t.crown, t.crown * 0.7, t.crown, leaves, 0.85);
  // Leuchtende Früchte ab Stufe 2
  if (stage >= 2) for (let i = 0; i < stage * 2; i++) b.set(Math.round((b.rnd() - 0.5) * t.crown * 1.6), t.h - 1 + Math.round(b.rnd() * 2), Math.round((b.rnd() - 0.5) * t.crown * 1.6), "minecraft:ochre_froglight");
}

function lamp(b: Builder, x: number, z: number): void {
  b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
  b.set(x, 3, z, { id: "minecraft:lantern", states: { hanging: false } });
}

/** Einfaches Fachwerkhaus. Tür zeigt nach `door` (n/s/e/w). */
function house(b: Builder, cx: number, cz: number, w: number, d: number, h: number, door: "n" | "s" | "e" | "w", wood = "spruce", wall: Palette = "minecraft:white_terracotta"): void {
  const x1 = cx - Math.floor(w / 2);
  const x2 = x1 + w - 1;
  const z1 = cz - Math.floor(d / 2);
  const z2 = z1 + d - 1;
  b.box(x1, 0, z1, x2, 0, z2, "minecraft:cobblestone");
  b.box(x1, 1, z1, x2, h, z2, wall);
  b.box(x1 + 1, 1, z1 + 1, x2 - 1, h, z2 - 1, "minecraft:air");
  b.box(x1 + 1, 0, z1 + 1, x2 - 1, 0, z2 - 1, `minecraft:${wood}_planks`);
  // Fachwerk
  for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) b.box(x, 1, z, x, h, z, { id: `minecraft:${wood}_log`, states: { pillar_axis: "y" } });
  b.box(x1, h, z1, x2, h, z1, { id: `minecraft:${wood}_log`, states: { pillar_axis: "x" } });
  b.box(x1, h, z2, x2, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "x" } });
  b.box(x1, h, z1, x1, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "z" } });
  b.box(x2, h, z1, x2, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "z" } });
  // Fenster
  const glass = "minecraft:glass_pane";
  if (w >= 5) {
    b.set(cx - 1, 2, z1, glass).set(cx + 1, 2, z1, glass).set(cx - 1, 2, z2, glass).set(cx + 1, 2, z2, glass);
  }
  if (d >= 5) {
    b.set(x1, 2, cz - 1, glass).set(x1, 2, cz + 1, glass).set(x2, 2, cz - 1, glass).set(x2, 2, cz + 1, glass);
  }
  // Tür (offener Durchgang)
  const dx = door === "e" ? x2 : door === "w" ? x1 : cx;
  const dz = door === "s" ? z2 : door === "n" ? z1 : cz;
  b.box(dx, 1, dz, dx, 2, dz, "minecraft:air");
  // Dach (Satteldach entlang x)
  const stairs = `minecraft:${wood}_stairs`;
  const half = Math.ceil(d / 2);
  for (let i = 0; i <= half; i++) {
    const y = h + 1 + i;
    const za = z1 - 1 + i;
    const zb = z2 + 1 - i;
    if (za >= zb) {
      b.box(x1 - 1, y, za, x2 + 1, y, za, `minecraft:${wood}_planks`);
      break;
    }
    b.box(x1 - 1, y, za, x2 + 1, y, za, stair(stairs, 2));
    b.box(x1 - 1, y, zb, x2 + 1, y, zb, stair(stairs, 3));
    if (zb - za > 1) {
      b.box(x1, y, za + 1, x1, y, zb - 1, wall);
      b.box(x2, y, za + 1, x2, y, zb - 1, wall);
    }
  }
  b.set(cx, h - 1, cz, { id: "minecraft:lantern", states: { hanging: true } });
}

function buildBase(b: Builder, y0: number): void {
  void y0;
  const R = 21;
  // Gelände ebnen
  for (let y = 1; y <= 34; y++) b.disc(0, y, 0, R, "minecraft:air");
  for (let y = -4; y <= -1; y++) b.disc(0, y, 0, R + (y + 4) * 0.0, "minecraft:dirt");
  b.disc(0, 0, 0, R, "minecraft:grass_block");
  // Wege: Kreuz + Ring
  b.box(-1, 0, -R, 1, 0, R, PATH);
  b.box(-R, 0, -1, R, 0, 1, PATH);
  for (let a = 0; a < 64; a++) {
    const ang = (a / 64) * Math.PI * 2;
    const x = Math.round(Math.cos(ang) * 11);
    const z = Math.round(Math.sin(ang) * 11);
    b.box(x, 0, z, x, 0, z, PATH);
  }
  // Platz um den Baum
  b.disc(0, 0, 0, 5, [{ b: "minecraft:moss_block", w: 4 }, { b: "minecraft:mossy_cobblestone", w: 1 }]);
  // Lampen
  for (const [x, z] of [[3, 9], [-3, 9], [3, -9], [-3, -9], [9, 3], [9, -3], [-9, 3], [-9, -3], [3, 19], [-3, 19]]) lamp(b, x, z);
  // Blumen & Büsche
  const flowers = ["minecraft:poppy", "minecraft:dandelion", "minecraft:cornflower", "minecraft:oxeye_daisy", "minecraft:allium", "minecraft:azure_bluet", "minecraft:lily_of_the_valley"];
  for (let i = 0; i < 70; i++) {
    const a = b.rnd() * Math.PI * 2;
    const r = 6 + b.rnd() * 14;
    const x = Math.round(Math.cos(a) * r);
    const z = Math.round(Math.sin(a) * r);
    if (Math.abs(x) <= 1 || Math.abs(z) <= 1 || Math.abs(Math.sqrt(x * x + z * z) - 11) < 1) continue;
    b.set(x, 1, z, flowers[Math.floor(b.rnd() * flowers.length)]);
  }
  // Eingangsbogen im Süden
  for (const x of [-3, 3]) b.box(x, 1, R - 1, x, 4, R - 1, { id: "minecraft:oak_log", states: { pillar_axis: "y" } });
  b.box(-3, 5, R - 1, 3, 5, R - 1, { id: "minecraft:oak_log", states: { pillar_axis: "x" } });
  b.blob(0, 6, R - 1, 4, 1.2, 1.2, LEAVES, 0.9);
  // Sylvas Schrein
  b.disc(0, 0, -7, 2.5, "minecraft:mossy_stone_bricks");
  for (const [x, z] of [[-2, -9], [2, -9]]) {
    b.box(x, 1, z, x, 3, z, "minecraft:mossy_stone_brick_wall");
    b.set(x, 4, z, "minecraft:ochre_froglight");
  }
  // Fennicks Marktstand (Osten)
  b.box(11, 0, 1, 15, 0, 5, "minecraft:spruce_planks");
  for (const [x, z] of [[11, 1], [15, 1], [11, 5], [15, 5]]) b.box(x, 1, z, x, 3, z, "minecraft:spruce_fence");
  b.box(11, 4, 1, 15, 4, 5, [{ b: "minecraft:red_wool", w: 1 }, { b: "minecraft:white_wool", w: 1 }]);
  b.box(12, 1, 1, 14, 1, 1, "minecraft:barrel");
  b.set(15, 1, 3, "minecraft:chest");
  // Wegstein-Platz & Kopfgeldbrett (Süden)
  b.disc(-6, 0, 15, 2, "minecraft:polished_andesite");
  b.disc(4, 0, 15, 1.5, "minecraft:polished_andesite");
}

function buildStage(b: Builder, stage: number): void {
  if (stage >= 1) {
    // Bromse Schmiede (Südwesten)
    house(b, -14, 13, 7, 7, 4, "e", "dark_oak", [{ b: "minecraft:stone_bricks", w: 4 }, { b: "minecraft:cracked_stone_bricks", w: 1 }]);
    b.set(-11, 1, 9, "minecraft:anvil").set(-12, 1, 9, "minecraft:blast_furnace").set(-12, 1, 10, "minecraft:grindstone");
    b.box(-13, 1, 8, -13, 2, 8, "minecraft:cobblestone_wall");
    b.set(-13, 3, 8, { id: "minecraft:campfire", states: { extinguished: false } });
    // Kaels Lager (Südosten)
    b.disc(9, 0, 14, 3, "minecraft:coarse_dirt");
    b.set(9, 1, 12, { id: "minecraft:campfire", states: { extinguished: false } });
    for (const [x, z] of [[7, 15], [11, 15]]) b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
    b.box(7, 3, 15, 11, 3, 16, "minecraft:green_wool");
    b.set(10, 1, 16, "minecraft:target");
  }
  if (stage >= 2) {
    // Miras Alchemiehütte (Nordosten)
    house(b, 14, -12, 7, 6, 4, "w", "birch", "minecraft:white_terracotta");
    b.set(11, 1, -12, "minecraft:brewing_stand").set(12, 1, -14, "minecraft:cauldron").set(16, 1, -10, "minecraft:flower_pot");
    for (let i = 0; i < 8; i++) b.set(9 + Math.round(b.rnd() * 7), 1, -17 + Math.round(b.rnd() * 2), "minecraft:sweet_berry_bush");
  }
  if (stage >= 3) {
    // Oswins Bibliothek (Nordwesten)
    house(b, -13, -13, 8, 7, 6, "e", "oak", [{ b: "minecraft:mossy_stone_bricks", w: 2 }, { b: "minecraft:stone_bricks", w: 3 }]);
    b.box(-16, 1, -16, -10, 3, -16, "minecraft:bookshelf");
    b.set(-11, 1, -13, "minecraft:lectern").set(-14, 1, -11, "minecraft:enchanting_table");
  }
  if (stage >= 4) {
    // Gärten & Banner
    for (const [x, z] of [[-18, 0], [18, 0], [0, 18]]) b.blob(x, 2, z, 2, 2, 2, LEAVES, 0.8);
    b.box(-8, 1, 6, -6, 1, 8, "minecraft:flowering_azalea");
    b.box(6, 1, -8, 8, 1, -6, "minecraft:flowering_azalea");
  }
  if (stage >= 5) {
    // Altar des Uralten (Norden)
    b.disc(0, 0, -16, 3, "minecraft:chiseled_stone_bricks");
    b.box(-1, 1, -17, 1, 1, -15, "minecraft:polished_deepslate");
  }
}

function placeNpcs(stage: number, origin: Vector3): void {
  for (const n of NPCS) {
    if (n.stage > stage) continue;
    if (n.id === "morgra" && wdata().morgra !== "free") continue;
    if (n.id === "kael" && wdata().flags.kael_away) continue;
    const spot = HUB_SPOTS[n.id];
    if (!spot) continue;
    const loc = V.add(origin, { x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 });
    spawnNpc(n.id, loc, "minecraft:overworld");
  }
}

function placeBlocksForStage(b: Builder, stage: number): void {
  const w = HUB_SPOTS.waystone;
  b.box(w.x, 0, w.z, w.x, 0, w.z, "minecraft:polished_andesite");
  b.set(w.x, 1, w.z, "cdw:wegstein");
  const bd = HUB_SPOTS.board;
  b.set(bd.x, 1, bd.z, "cdw:kopfgeldbrett");
  if (stage >= 5) b.set(HUB_SPOTS.altar.x, 2, HUB_SPOTS.altar.z, "cdw:altar");
}

/** Pflanzt den Samen: legt den Hain an. */
export async function plantHub(p: Player, loc: Vector3): Promise<boolean> {
  const w = wdata();
  if (w.hub) {
    p.sendMessage("§cDer Hain wurde bereits gepflanzt.");
    return false;
  }
  if (p.dimension.id !== "minecraft:overworld") {
    p.sendMessage("§cDer Samen will in der Oberwelt wachsen.");
    return false;
  }
  const origin = V.floor(loc);
  w.hub = { x: origin.x, y: origin.y, z: origin.z, stage: 0, building: true };
  markWorldDirty();
  for (const pl of players()) title(pl, "§aDer Samen keimt…", "§7Etwas Uraltes erwacht", 10, 80, 20);
  sound(p.dimension, "block.beehive.enter", origin, 0.5, 1);
  await buildHub(0, true);
  return true;
}

let building = false;
export async function buildHub(stage: number, full: boolean): Promise<void> {
  const w = wdata();
  const h = w.hub;
  if (!h || building) return;
  building = true;
  const dim = world.getDimension("minecraft:overworld");
  const origin = { x: h.x, y: h.y, z: h.z };
  try {
    await withLoadedArea("hub", dim, V.add(origin, { x: -24, y: -5, z: -24 }), V.add(origin, { x: 24, y: 40, z: 24 }), () => {
      return new Promise<void>((resolve) => {
        const b = new Builder(dim, origin, origin.x * 31 + origin.z * 17 + stage);
        if (full) buildBase(b, origin.y);
        else {
          // Platz für den wachsenden Baum freimachen
          b.cyl(0, 1, 0, 9, 34, "minecraft:air");
          b.disc(0, 0, 0, 5, [{ b: "minecraft:moss_block", w: 4 }, { b: "minecraft:mossy_cobblestone", w: 1 }]);
        }
        buildStage(b, stage);
        buildTree(b, stage);
        placeBlocksForStage(b, stage);
        b.then(() => {
          placeNpcs(stage, origin);
          registerWaystone("hub", { x: origin.x + HUB_SPOTS.waystone.x, y: origin.y + 1, z: origin.z + HUB_SPOTS.waystone.z }, "minecraft:overworld", "Hain des Erwachens");
          for (let i = 0; i < 30; i++) particle(dim, "minecraft:totem_particle", V.add(origin, { x: (Math.random() - 0.5) * 16, y: 2 + Math.random() * 10, z: (Math.random() - 0.5) * 16 }));
        });
        b.run(() => resolve(), 60);
      });
    });
  } catch (e) {
    log("Hain-Bau fehlgeschlagen:", String(e));
  }
  h.stage = stage;
  h.building = false;
  markWorldDirty();
  building = false;
}

export async function upgradeHub(stage: number): Promise<void> {
  const h = wdata().hub;
  if (!h || h.stage >= stage) return;
  broadcast(`§a✦ Der Hain wächst! §7(Ausbaustufe ${stage})`);
  await buildHub(stage, false);
  setFlag(`hub_stage_${stage}`);
  for (const p of players()) title(p, "§aDer Hain wächst", `§7Ausbaustufe ${stage}`, 10, 60, 20);
}

/** Hain verschieben (Admin): Daten zurücksetzen, NPCs entfernen. */
export function resetHubLocation(): void {
  const w = wdata();
  w.hub = undefined;
  markWorldDirty();
  system.run(() => {
    for (const e of world.getDimension("minecraft:overworld").getEntities({ type: "cdw:npc" })) {
      try {
        e.remove();
      } catch {
        /* ignorieren */
      }
    }
  });
}
