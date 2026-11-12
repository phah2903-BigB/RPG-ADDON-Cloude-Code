// Monster-, Boss-, NPC- und Projektil-Definitionen.

export type MobArchetype =
  | "melee" // läuft & schlägt
  | "ranged" // läuft & schießt
  | "hover_melee" // schwebt & schlägt
  | "hover_ranged" // schwebt & schießt
  | "leaper" // springt Ziel an
  | "boss_melee"
  | "boss_ranged";

export interface SpawnDef {
  biomes: string[]; // Biome-Tags (any_of)
  weight: number;
  herd: [number, number];
  surface?: boolean; // Standard: Oberfläche
  underground?: boolean;
  nightOnly?: boolean;
  density: number;
}

export interface Drop {
  item: string; // ohne Namespace für cdw-Items, sonst "minecraft:…"
  chance: number;
  min?: number;
  max?: number;
}

export interface MobDef {
  id: string;
  name: string;
  act: number; // 0 = überall
  arch: MobArchetype;
  model: string; // Geometrie-Design (tools/gen/models.ts)
  skin: string; // Texturpalette
  health: number; // Vanilla-LP auf Stufe 1
  damage: number; // Vanilla-Angriffsschaden
  speed: number;
  scale?: number;
  levelBonus?: number; // auf Zonenstufe addiert
  xpMult: number;
  goldMult: number;
  families: string[];
  collision: [number, number];
  spawn?: SpawnDef;
  drops: Drop[];
  projectile?: string; // für Fernkämpfer
  fireImmune?: boolean;
  boss?: { title: string; color: string; music?: string; phases?: number; adds?: string[]; fixedLevel: number };
  effectOnHit?: { id: string; seconds: number; amp: number };
  glow?: boolean; // Leuchtende Augen/Teile (MERS)
}

const BLIGHT = ["monster", "cdw_blight"];

export const MOBS: MobDef[] = [
  // --- Wald (Akt 1) ---
  { id: "moosling", name: "Moosling", act: 1, arch: "leaper", model: "blob", skin: "moss", health: 10, damage: 2, speed: 0.3, xpMult: 0.6, goldMult: 0.6, families: [...BLIGHT, "cdw_forest"], collision: [0.7, 0.7], spawn: { biomes: ["forest", "birch", "roofed", "taiga"], weight: 30, herd: [2, 4], density: 6 }, drops: [{ item: "moosherz", chance: 0.5 }, { item: "faeulnisessenz", chance: 0.25 }] },
  { id: "dornenwolf", name: "Dornenwolf", act: 1, arch: "melee", model: "quad_wolf", skin: "thornwolf", health: 18, damage: 4, speed: 0.33, xpMult: 1.0, goldMult: 1, families: [...BLIGHT, "cdw_forest"], collision: [0.8, 0.9], spawn: { biomes: ["forest", "taiga", "birch"], weight: 18, herd: [1, 3], density: 4 }, drops: [{ item: "dornenfang", chance: 0.55 }, { item: "faeulnisessenz", chance: 0.3 }], glow: true },
  { id: "rindenschreck_setzling", name: "Rindenschreck-Setzling", act: 1, arch: "melee", model: "treant", skin: "treant_young", health: 34, damage: 5, speed: 0.2, xpMult: 1.5, goldMult: 1.4, families: [...BLIGHT, "cdw_forest"], collision: [0.9, 2.0], spawn: { biomes: ["forest", "roofed"], weight: 10, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.6 }, { item: "minecraft:stick", chance: 0.8, min: 1, max: 3 }], glow: true },
  // --- Moor (Akt 2) ---
  { id: "moorschlurfer", name: "Moorschlurfer", act: 2, arch: "melee", model: "humanoid_big", skin: "bog", health: 26, damage: 4, speed: 0.22, xpMult: 1.1, goldMult: 1, families: [...BLIGHT, "cdw_swamp", "undead"], collision: [0.7, 1.95], spawn: { biomes: ["swamp", "mangrove_swamp"], weight: 25, herd: [1, 3], density: 5 }, drops: [{ item: "moorschleim", chance: 0.5 }, { item: "faeulnisessenz", chance: 0.3 }], effectOnHit: { id: "slowness", seconds: 2, amp: 0 } },
  { id: "schlammkroete", name: "Schlammkröte", act: 2, arch: "leaper", model: "toad", skin: "toad", health: 22, damage: 5, speed: 0.25, xpMult: 1.0, goldMult: 1, families: [...BLIGHT, "cdw_swamp"], collision: [0.9, 0.8], spawn: { biomes: ["swamp", "mangrove_swamp", "river"], weight: 18, herd: [1, 2], density: 4 }, drops: [{ item: "moorschleim", chance: 0.6 }], effectOnHit: { id: "poison", seconds: 3, amp: 0 } },
  { id: "seufzergeist", name: "Seufzergeist", act: 2, arch: "hover_ranged", model: "wraith", skin: "sighghost", health: 20, damage: 3, speed: 0.25, xpMult: 1.3, goldMult: 1.2, families: [...BLIGHT, "cdw_swamp", "undead"], collision: [0.7, 1.6], spawn: { biomes: ["swamp", "mangrove_swamp"], weight: 12, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.7 }], projectile: "blight_bolt", glow: true },
  // --- Glutsand (Akt 3) ---
  { id: "glutskorpion", name: "Glutskorpion", act: 3, arch: "melee", model: "scorpion", skin: "scorpion", health: 26, damage: 5, speed: 0.3, xpMult: 1.2, goldMult: 1.1, families: [...BLIGHT, "cdw_desert", "arthropod"], collision: [1.2, 0.8], spawn: { biomes: ["desert", "mesa"], weight: 22, herd: [1, 2], density: 4 }, drops: [{ item: "skorpionstachel", chance: 0.5 }], effectOnHit: { id: "poison", seconds: 4, amp: 0 }, fireImmune: true },
  { id: "verdorrter_priester", name: "Verdorrter Priester", act: 3, arch: "melee", model: "humanoid_thin", skin: "mummy", health: 30, damage: 5, speed: 0.24, xpMult: 1.3, goldMult: 1.3, families: [...BLIGHT, "cdw_desert", "undead"], collision: [0.6, 1.95], spawn: { biomes: ["desert", "mesa"], weight: 16, herd: [1, 2], density: 3, nightOnly: true }, drops: [{ item: "verwelkte_seite", chance: 0.04 }, { item: "faeulnisessenz", chance: 0.4 }, { item: "minecraft:gold_nugget", chance: 0.5, min: 1, max: 4 }], effectOnHit: { id: "wither", seconds: 3, amp: 0 } },
  { id: "glutgeist", name: "Glutgeist", act: 3, arch: "hover_ranged", model: "wisp", skin: "emberwisp", health: 18, damage: 4, speed: 0.28, xpMult: 1.2, goldMult: 1.1, families: [...BLIGHT, "cdw_desert"], collision: [0.7, 1.0], spawn: { biomes: ["desert", "mesa", "savanna"], weight: 10, herd: [1, 2], density: 2 }, drops: [{ item: "minecraft:blaze_powder", chance: 0.35 }, { item: "faeulnisessenz", chance: 0.35 }], projectile: "fire_bolt", fireImmune: true, glow: true },
  // --- Frostkrone (Akt 4) ---
  { id: "eiskobold", name: "Eiskobold", act: 4, arch: "melee", model: "humanoid_small", skin: "icekobold", health: 18, damage: 4, speed: 0.36, xpMult: 0.9, goldMult: 1, families: [...BLIGHT, "cdw_frost"], collision: [0.6, 1.2], spawn: { biomes: ["frozen", "cold", "ice", "mountains"], weight: 22, herd: [2, 4], density: 6 }, drops: [{ item: "frostsplitter", chance: 0.45 }], effectOnHit: { id: "slowness", seconds: 2, amp: 0 }, glow: true },
  { id: "frosttroll", name: "Frosttroll", act: 4, arch: "melee", model: "troll", skin: "frosttroll", health: 60, damage: 8, speed: 0.22, scale: 1.0, xpMult: 2.4, goldMult: 2.2, families: [...BLIGHT, "cdw_frost"], collision: [1.3, 2.7], spawn: { biomes: ["frozen", "cold", "mountains"], weight: 8, herd: [1, 1], density: 1 }, drops: [{ item: "frostsplitter", chance: 0.9, min: 1, max: 3 }, { item: "runenstaub", chance: 0.15 }] },
  { id: "reifkraehe", name: "Reifkrähe", act: 4, arch: "hover_melee", model: "bird", skin: "frostcrow", health: 14, damage: 3, speed: 0.4, xpMult: 0.9, goldMult: 0.8, families: [...BLIGHT, "cdw_frost"], collision: [0.7, 0.7], spawn: { biomes: ["frozen", "cold", "taiga", "mountains"], weight: 14, herd: [2, 3], density: 4 }, drops: [{ item: "frostsplitter", chance: 0.3 }, { item: "minecraft:feather", chance: 0.6, min: 1, max: 2 }], glow: true },
  // --- Schattenwurzel (Akt 5) ---
  { id: "kristallspinne", name: "Kristallspinne", act: 5, arch: "melee", model: "spider", skin: "crystalspider", health: 24, damage: 5, speed: 0.32, xpMult: 1.1, goldMult: 1.1, families: [...BLIGHT, "cdw_deep", "arthropod"], collision: [1.3, 0.8], spawn: { biomes: ["overworld"], weight: 14, herd: [1, 2], density: 3, underground: true }, drops: [{ item: "schattenkristall", chance: 0.4 }, { item: "minecraft:string", chance: 0.6, min: 1, max: 2 }], effectOnHit: { id: "poison", seconds: 3, amp: 0 }, glow: true },
  { id: "schattenkriecher", name: "Schattenkriecher", act: 5, arch: "melee", model: "crawler", skin: "shadowcrawler", health: 26, damage: 6, speed: 0.3, xpMult: 1.3, goldMult: 1.2, families: [...BLIGHT, "cdw_deep"], collision: [0.9, 1.0], spawn: { biomes: ["overworld"], weight: 10, herd: [1, 2], density: 2, underground: true }, drops: [{ item: "schattenkristall", chance: 0.5 }], effectOnHit: { id: "blindness", seconds: 3, amp: 0 }, glow: true },
  { id: "wurzelgolem", name: "Wurzelgolem", act: 5, arch: "melee", model: "golem", skin: "rootgolem", health: 80, damage: 9, speed: 0.18, xpMult: 2.8, goldMult: 2.5, families: [...BLIGHT, "cdw_deep"], collision: [1.4, 2.6], spawn: { biomes: ["overworld"], weight: 4, herd: [1, 1], density: 1, underground: true }, drops: [{ item: "schattenkristall", chance: 0.8, min: 1, max: 2 }, { item: "runenstaub", chance: 0.3 }], glow: true },
  // --- Überall ---
  { id: "faeulnisgeist", name: "Fäulnisgeist", act: 0, arch: "hover_melee", model: "wraith", skin: "blightwraith", health: 20, damage: 4, speed: 0.3, xpMult: 1.2, goldMult: 1, families: [...BLIGHT, "undead"], collision: [0.7, 1.6], spawn: { biomes: ["plains", "forest", "taiga", "savanna", "meadow", "birch", "jungle", "cherry_grove"], weight: 8, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.8 }], effectOnHit: { id: "weakness", seconds: 4, amp: 0 }, glow: true },
  { id: "goblin_pluenderer", name: "Goblin-Plünderer", act: 0, arch: "melee", model: "humanoid_small", skin: "goblin", health: 16, damage: 4, speed: 0.34, xpMult: 0.9, goldMult: 1.8, families: ["monster", "cdw_goblin"], collision: [0.6, 1.2], spawn: { biomes: ["plains", "savanna", "forest", "meadow", "taiga"], weight: 8, herd: [2, 3], density: 3 }, drops: [{ item: "minecraft:gold_nugget", chance: 0.7, min: 1, max: 5 }, { item: "heiltrank_klein", chance: 0.08 }] },
  { id: "goblin_schuetze", name: "Goblin-Schütze", act: 0, arch: "ranged", model: "humanoid_small", skin: "goblin_archer", health: 14, damage: 3, speed: 0.3, xpMult: 1.0, goldMult: 1.8, families: ["monster", "cdw_goblin"], collision: [0.6, 1.2], spawn: { biomes: ["plains", "savanna", "forest", "meadow"], weight: 5, herd: [1, 2], density: 2 }, drops: [{ item: "minecraft:arrow", chance: 0.6, min: 1, max: 4 }, { item: "minecraft:gold_nugget", chance: 0.5, min: 1, max: 3 }], projectile: "goblin_arrow" },

  // --- Bosse ---
  { id: "boss_rindenschreck", name: "Rindenschreck", act: 1, arch: "boss_melee", model: "treant", skin: "treant_boss", health: 140, damage: 7, speed: 0.22, scale: 2.0, xpMult: 12, goldMult: 15, families: [...BLIGHT, "cdw_boss"], collision: [1.8, 4.0], drops: [{ item: "runenstaub", chance: 1, min: 3, max: 5 }, { item: "uraltes_harz", chance: 0.5 }], boss: { title: "Rindenschreck, der Verderbte Ent", color: "green", fixedLevel: 10, adds: ["moosling"] }, glow: true },
  { id: "boss_moorschlund", name: "Moorschlund", act: 2, arch: "boss_melee", model: "toad", skin: "toad_boss", health: 170, damage: 8, speed: 0.24, scale: 3.0, xpMult: 14, goldMult: 18, families: [...BLIGHT, "cdw_boss"], collision: [2.6, 2.2], drops: [{ item: "runenstaub", chance: 1, min: 4, max: 6 }, { item: "uraltes_harz", chance: 0.6 }], boss: { title: "Moorschlund, Herr des Seufzermoors", color: "green", fixedLevel: 17, adds: ["schlammkroete"] }, effectOnHit: { id: "poison", seconds: 4, amp: 1 } },
  { id: "boss_glutkoenigin", name: "Glutkönigin", act: 3, arch: "boss_melee", model: "scorpion", skin: "scorpion_boss", health: 200, damage: 9, speed: 0.28, scale: 2.8, xpMult: 16, goldMult: 20, families: [...BLIGHT, "cdw_boss"], collision: [3.0, 2.0], drops: [{ item: "runenstaub", chance: 1, min: 5, max: 7 }, { item: "uraltes_harz", chance: 0.7 }], boss: { title: "Die Glutkönigin", color: "red", fixedLevel: 24, adds: ["glutskorpion"] }, fireImmune: true, effectOnHit: { id: "poison", seconds: 4, amp: 1 }, glow: true },
  { id: "boss_hrimgar", name: "Hrimgar", act: 4, arch: "boss_melee", model: "troll", skin: "hrimgar", health: 240, damage: 10, speed: 0.24, scale: 1.7, xpMult: 18, goldMult: 22, families: [...BLIGHT, "cdw_boss"], collision: [2.2, 4.5], drops: [{ item: "runenstaub", chance: 1, min: 6, max: 8 }, { item: "uraltes_harz", chance: 0.8 }], boss: { title: "Hrimgar, der Frostkoloss", color: "blue", fixedLevel: 32, adds: ["eiskobold"] }, effectOnHit: { id: "slowness", seconds: 3, amp: 1 }, glow: true },
  { id: "boss_kristallmutter", name: "Kristallmutter", act: 5, arch: "boss_melee", model: "spider", skin: "crystalspider_boss", health: 280, damage: 11, speed: 0.28, scale: 2.8, xpMult: 20, goldMult: 25, families: [...BLIGHT, "cdw_boss"], collision: [3.4, 2.0], drops: [{ item: "runenstaub", chance: 1, min: 7, max: 9 }, { item: "uraltes_harz", chance: 1 }], boss: { title: "Die Kristallmutter", color: "purple", fixedLevel: 38, adds: ["kristallspinne"] }, effectOnHit: { id: "poison", seconds: 4, amp: 1 }, glow: true },
  { id: "boss_morvath", name: "Morvath", act: 6, arch: "boss_ranged", model: "druid", skin: "morvath", health: 260, damage: 10, speed: 0.26, scale: 1.25, xpMult: 25, goldMult: 30, families: [...BLIGHT, "cdw_boss"], collision: [0.8, 2.5], drops: [], projectile: "blight_bolt_big", boss: { title: "Morvath, der Welkende", color: "purple", fixedLevel: 40, phases: 2, adds: ["faeulnisgeist"] }, glow: true },
  { id: "boss_welkenbestie", name: "Welkenbestie", act: 6, arch: "boss_melee", model: "golem", skin: "witherbeast", health: 360, damage: 12, speed: 0.24, scale: 1.9, xpMult: 30, goldMult: 40, families: [...BLIGHT, "cdw_boss"], collision: [2.6, 5.0], drops: [{ item: "runenstaub", chance: 1, min: 10, max: 14 }, { item: "uraltes_harz", chance: 1, min: 2, max: 3 }], boss: { title: "Die Welkenbestie", color: "purple", fixedLevel: 41, adds: ["wurzelgolem"] }, effectOnHit: { id: "wither", seconds: 3, amp: 1 }, glow: true },
  { id: "boss_wurzelwyrm", name: "Der Uralte Wurzelwyrm", act: 7, arch: "boss_ranged", model: "wyrm", skin: "wyrm", health: 500, damage: 13, speed: 0.22, scale: 1.6, xpMult: 40, goldMult: 60, families: [...BLIGHT, "cdw_boss"], collision: [3.0, 3.5], drops: [{ item: "runenstaub", chance: 1, min: 12, max: 16 }, { item: "uraltes_harz", chance: 1, min: 3, max: 5 }], projectile: "blight_bolt_big", boss: { title: "Der Uralte Wurzelwyrm", color: "yellow", fixedLevel: 50, adds: ["faeulnisgeist", "wurzelgolem"] }, glow: true },
];

export function mobById(id: string): MobDef | undefined {
  return MOBS.find((m) => m.id === id);
}

export interface ProjectileDef {
  id: string;
  model: string;
  skin: string;
  gravity: number;
  power: number;
  particle: string; // eigener Partikel-Trail
  scale?: number;
  fire?: boolean;
  impactDamage: number; // Vanilla-Grundwert (Mob-Projektile); Spieler-Projektile werden per Script berechnet
}

export const PROJECTILES: ProjectileDef[] = [
  { id: "arcane_bolt", model: "orb", skin: "arcane", gravity: 0, power: 2.2, particle: "arcane", impactDamage: 1 },
  { id: "thorn_bolt", model: "thorn", skin: "thorn", gravity: 0.01, power: 2.0, particle: "leaf", impactDamage: 1 },
  { id: "fireball", model: "orb", skin: "fire", gravity: 0, power: 1.6, particle: "fire", scale: 1.4, impactDamage: 1 },
  { id: "frost_lance", model: "shard", skin: "frost", gravity: 0, power: 2.6, particle: "frost", impactDamage: 1 },
  { id: "poison_arrow", model: "arrow", skin: "poison_arrow", gravity: 0.03, power: 2.6, particle: "poison", impactDamage: 1 },
  { id: "ranger_arrow", model: "arrow", skin: "ranger_arrow", gravity: 0.03, power: 2.8, particle: "none", impactDamage: 1 },
  { id: "meteor", model: "orb", skin: "fire", gravity: 0.06, power: 1.2, particle: "fire", scale: 3.0, fire: true, impactDamage: 1 },
  { id: "blight_bolt", model: "orb", skin: "blight", gravity: 0, power: 1.2, particle: "blight", impactDamage: 4 },
  { id: "blight_bolt_big", model: "orb", skin: "blight", gravity: 0, power: 1.3, particle: "blight", scale: 1.8, impactDamage: 7 },
  { id: "fire_bolt", model: "orb", skin: "fire", gravity: 0, power: 1.2, particle: "fire", impactDamage: 4, fire: true },
  { id: "goblin_arrow", model: "arrow", skin: "goblin_arrow", gravity: 0.04, power: 1.6, particle: "none", impactDamage: 3 },
];

export interface NpcDef {
  id: string;
  variant: number;
  name: string;
  title: string;
  skin: string;
  stage: number; // ab welcher Hain-Ausbaustufe anwesend
}

export const NPCS: NpcDef[] = [
  { id: "sylva", variant: 0, name: "Sylva", title: "Hüterin des Hains", skin: "npc_sylva", stage: 0 },
  { id: "fennick", variant: 1, name: "Fennick", title: "Fahrender Händler", skin: "npc_fennick", stage: 0 },
  { id: "kael", variant: 2, name: "Kael", title: "Waldläufer & Kopfgeldjäger", skin: "npc_kael", stage: 1 },
  { id: "brom", variant: 3, name: "Brom Eisenwurz", title: "Schmied", skin: "npc_brom", stage: 1 },
  { id: "mira", variant: 4, name: "Mira Tauglanz", title: "Alchemistin", skin: "npc_mira", stage: 2 },
  { id: "oswin", variant: 5, name: "Oswin", title: "Bibliothekar & Chronist", skin: "npc_oswin", stage: 3 },
  { id: "morgra", variant: 6, name: "Morgra", title: "Sumpfhexe", skin: "npc_morgra", stage: 99 },
];

export function npcById(id: string): NpcDef | undefined {
  return NPCS.find((n) => n.id === id);
}
