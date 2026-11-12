// Zentrale Balancing-Werte. Reine Daten – keine @minecraft-Importe (wird auch von Generatoren genutzt).

export const NS = "cdw";
export const MAX_LEVEL = 50;
export const ATTR_POINTS_PER_LEVEL = 2;

/** XP, die man von Stufe L auf L+1 braucht. Gesamt-XP wird gespeichert (Kurve später anpassbar). */
export function xpToNext(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round((90 * Math.pow(level, 1.35) + 30) / 10) * 10;
}

/** Gesamt-XP, die für das Erreichen von Stufe L nötig ist. */
export function totalXpForLevel(level: number): number {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
}

export function levelFromTotalXp(xp: number): number {
  let l = 1;
  let need = 0;
  while (l < MAX_LEVEL) {
    need += xpToNext(l);
    if (xp < need) break;
    l++;
  }
  return l;
}

/** Monster: Lebenspunkte-Skalierung (Anzeige-LP = Vanilla-LP × Faktor). */
export function mobHpScale(level: number): number {
  return 1 + 0.32 * (level - 1);
}
/** Monster: Schadensskalierung. */
export function mobDmgScale(level: number): number {
  return 1 + 0.2 * (level - 1);
}
/** Grundumrechnung Vanilla-Schaden eines Monsters → RPG-Schaden. */
export const MOB_DMG_BASE_MULT = 5;

/** XP-Belohnung für ein Monster. */
export function mobXp(level: number, mult = 1): number {
  return Math.round((8 + 4.5 * level) * mult);
}
export function mobGold(level: number, mult = 1): number {
  return Math.max(1, Math.round((1 + level * 0.6) * mult));
}

/** Monsterstufe nach Entfernung zum Hain (Zonen). */
export function zoneLevel(distance: number, dimension: string): number {
  let lvl = 1 + Math.floor(distance / 36);
  if (dimension === "minecraft:nether") lvl += 14;
  if (dimension === "minecraft:the_end") lvl += 26;
  return Math.max(1, Math.min(55, lvl));
}

/** Spieler-Grundwerte. */
export const PLAYER_BASE = {
  hp: 100,
  hpPerLevel: 10,
  hpPerVit: 9,
  mana: 50,
  manaPerLevel: 4,
  manaPerWis: 7,
  manaRegen: 1.2, // pro Sekunde
  manaRegenPerWis: 0.12,
  critChance: 0.05,
  critPerDex: 0.004,
  critDamage: 1.5,
  strDmg: 0.03, // +3 % Nahkampf pro Stärke
  dexDmg: 0.03, // +3 % Fernkampf/Dolch/Speer pro Geschick
  intDmg: 0.035, // +3,5 % Magie pro Intelligenz
  wisHeal: 0.03, // +3 % Heilung pro Weisheit
};

/** Rüstungsreduktion durch Vitalität (%), gedeckelt. */
export function vitResist(vit: number): number {
  return Math.min(0.25, vit * 0.0035);
}

export const RARITIES = [
  { id: "common", name: "Gewöhnlich", color: "§f", affixes: 0, weight: 60, statMult: 1.0 },
  { id: "uncommon", name: "Ungewöhnlich", color: "§a", affixes: 1, weight: 26, statMult: 1.06 },
  { id: "rare", name: "Selten", color: "§9", affixes: 2, weight: 10, statMult: 1.12 },
  { id: "epic", name: "Episch", color: "§5", affixes: 3, weight: 3.4, statMult: 1.2 },
  { id: "legendary", name: "Legendär", color: "§6", affixes: 4, weight: 0.6, statMult: 1.3 },
] as const;
export type RarityId = (typeof RARITIES)[number]["id"];

export const UPGRADE_MAX = 10;
export const UPGRADE_DMG_PER_LEVEL = 0.08;
export function upgradeCost(tier: number, plus: number): { gold: number; dust: number } {
  return { gold: Math.round((40 + 30 * plus * plus) * (1 + tier * 0.6)), dust: 1 + Math.floor(plus / 2) + tier };
}

export const WAYSTONE_TRAVEL_COST = 15;
export const CLASS_CHANGE_COST = 250;
export const RESPEC_COST_PER_LEVEL = 8;

export const REPUTATION_LEVELS = [
  { name: "Fremd", need: 0 },
  { name: "Bekannt", need: 300 },
  { name: "Geschätzt", need: 1000 },
  { name: "Geehrt", need: 2500 },
  { name: "Wächter des Hains", need: 5000 },
];

/** Dungeon-Ringe um den Hain (Blöcke) – Akt 1..5 + Zitadelle. */
export const DUNGEON_RINGS = [320, 620, 920, 1220, 1520, 1100];
