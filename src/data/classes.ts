// Klassen, Fähigkeiten (Runen) und Talente.

export type ClassId = "krieger" | "waldlaeufer" | "magier" | "druide";
export type AttrId = "str" | "dex" | "int" | "vit" | "wis";

export const ATTR_NAMES: Record<AttrId, string> = {
  str: "Stärke",
  dex: "Geschick",
  int: "Intelligenz",
  vit: "Vitalität",
  wis: "Weisheit",
};
export const ATTR_DESC: Record<AttrId, string> = {
  str: "+3 % Nahkampfschaden (Schwert, Zweihänder, Axt, Hammer)",
  dex: "+3 % Fernkampf-, Dolch- und Speerschaden, +0,4 % Krit",
  int: "+3,5 % Magieschaden",
  vit: "+9 Lebenspunkte, +0,35 % Widerstand",
  wis: "+7 Mana, schnellere Mana-Regeneration, +3 % Heilung",
};

export interface ClassDef {
  id: ClassId;
  name: string;
  role: string;
  color: string;
  desc: string;
  base: Record<AttrId, number>;
  growth: Partial<Record<AttrId, number>>; // automatisches Wachstum pro Stufe
  weapons: string[]; // Waffentypen
  starter: string; // Startwaffe (Item-Id ohne Namespace)
}

export const CLASSES: ClassDef[] = [
  {
    id: "krieger",
    name: "Krieger",
    role: "Nahkampf · Verteidiger",
    color: "§c",
    desc: "Steht in der ersten Reihe. Viel Leben, schwere Waffen, Flächenschläge und Schutzfähigkeiten.",
    base: { str: 6, dex: 2, int: 1, vit: 5, wis: 1 },
    growth: { str: 1, vit: 1 },
    weapons: ["schwert", "zweihaender", "streitaxt", "kriegshammer"],
    starter: "schwert_bronze",
  },
  {
    id: "waldlaeufer",
    name: "Waldläufer",
    role: "Fernkampf · Beweglichkeit",
    color: "§a",
    desc: "Trifft aus der Distanz, ist schnell und kritisch. Bögen, Armbrüste, Speere und Dolche.",
    base: { str: 2, dex: 6, int: 1, vit: 3, wis: 2 },
    growth: { dex: 1, vit: 1 },
    weapons: ["langbogen", "armbrust", "speer", "dolch"],
    starter: "langbogen_bronze",
  },
  {
    id: "magier",
    name: "Magier",
    role: "Magie · Flächenschaden",
    color: "§9",
    desc: "Zerstörerische Elementarmagie aus der Ferne. Zerbrechlich, aber verheerend.",
    base: { str: 1, dex: 2, int: 7, vit: 2, wis: 4 },
    growth: { int: 1, wis: 1 },
    weapons: ["zauberstab", "dolch"],
    starter: "zauberstab_bronze",
  },
  {
    id: "druide",
    name: "Druide",
    role: "Heilung · Unterstützung",
    color: "§2",
    desc: "Heilt Gefährten, fesselt Feinde mit Ranken und ruft Naturgeister. Ideal im Team.",
    base: { str: 2, dex: 2, int: 4, vit: 3, wis: 6 },
    growth: { wis: 1, int: 1 },
    weapons: ["naturstab", "dolch", "speer"],
    starter: "naturstab_bronze",
  },
];

export function classById(id: string | undefined): ClassDef | undefined {
  return CLASSES.find((c) => c.id === id);
}

export interface AbilityDef {
  id: string; // Rune-Item: cdw:rune_<id>
  cls: ClassId;
  name: string;
  level: number;
  mana: number;
  cooldown: number; // Sekunden
  desc: string;
  glyph: string; // Symbol für den Texturgenerator
  color: [number, number, number];
  ult?: boolean;
}

export const ABILITIES: AbilityDef[] = [
  // Krieger
  { id: "wirbelschlag", cls: "krieger", name: "Wirbelschlag", level: 1, mana: 14, cooldown: 6, desc: "Trifft alle Gegner im Umkreis von 4 Blöcken mit 160 % Waffenschaden.", glyph: "spin", color: [220, 70, 50] },
  { id: "schildwall", cls: "krieger", name: "Schildwall", level: 5, mana: 18, cooldown: 22, desc: "6 Sek. lang 50 % weniger Schaden und kein Rückstoß.", glyph: "shield", color: [200, 160, 60] },
  { id: "sturmangriff", cls: "krieger", name: "Sturmangriff", level: 10, mana: 16, cooldown: 12, desc: "Stürmt 8 Blöcke vorwärts, verletzt und verlangsamt Gegner auf dem Weg.", glyph: "arrow", color: [230, 110, 40] },
  { id: "kampfschrei", cls: "krieger", name: "Kampfschrei", level: 15, mana: 22, cooldown: 30, desc: "Verbündete: +20 % Schaden für 12 Sek. Gegner werden geschwächt.", glyph: "horn", color: [240, 200, 80] },
  { id: "titanenhieb", cls: "krieger", name: "Titanenhieb", level: 25, mana: 40, cooldown: 60, desc: "ULTIMATE: Erschüttert den Boden – 420 % Waffenschaden im Umkreis von 6 Blöcken, betäubt 3 Sek.", glyph: "hammer", color: [255, 90, 40], ult: true },
  // Waldläufer
  { id: "salve", cls: "waldlaeufer", name: "Salve", level: 1, mana: 12, cooldown: 6, desc: "Feuert 5 Pfeile im Fächer (je 70 % Waffenschaden).", glyph: "fan", color: [90, 200, 90] },
  { id: "rueckwaertssprung", cls: "waldlaeufer", name: "Rückwärtssprung", level: 5, mana: 10, cooldown: 10, desc: "Springt zurück und verlangsamt nahe Gegner.", glyph: "back", color: [120, 220, 160] },
  { id: "giftpfeil", cls: "waldlaeufer", name: "Giftpfeil", level: 10, mana: 14, cooldown: 8, desc: "Ein Pfeil, der 6 Sek. lang Gift-Schaden verursacht (insg. 240 %).", glyph: "drop", color: [130, 210, 40] },
  { id: "falkenauge", cls: "waldlaeufer", name: "Falkenauge", level: 15, mana: 20, cooldown: 30, desc: "10 Sek.: +30 % Krit-Chance und Tempo.", glyph: "eye", color: [230, 220, 120] },
  { id: "pfeilregen", cls: "waldlaeufer", name: "Pfeilregen", level: 25, mana: 40, cooldown: 60, desc: "ULTIMATE: Lässt 6 Sek. lang Pfeile auf das Zielgebiet regnen.", glyph: "rain", color: [160, 255, 120], ult: true },
  // Magier
  { id: "feuerball", cls: "magier", name: "Feuerball", level: 1, mana: 12, cooldown: 3, desc: "Explodierender Feuerball: 180 % Magieschaden im Umkreis von 3 Blöcken.", glyph: "flame", color: [255, 120, 30] },
  { id: "frostlanze", cls: "magier", name: "Frostlanze", level: 5, mana: 14, cooldown: 6, desc: "Durchbohrende Eislanze: 150 % Schaden, verlangsamt stark.", glyph: "shard", color: [120, 200, 255] },
  { id: "blinzeln", cls: "magier", name: "Blinzeln", level: 10, mana: 12, cooldown: 10, desc: "Teleportiert dich 8 Blöcke in Blickrichtung.", glyph: "blink", color: [190, 120, 255] },
  { id: "arkanschild", cls: "magier", name: "Arkanschild", level: 15, mana: 24, cooldown: 30, desc: "Ein Schild, der Schaden in Höhe von 30 % deiner LP absorbiert.", glyph: "orb", color: [150, 110, 255] },
  { id: "meteor", cls: "magier", name: "Meteor", level: 25, mana: 45, cooldown: 60, desc: "ULTIMATE: Ein Meteor schlägt nach 1,5 Sek. ein – 500 % Schaden und Brand.", glyph: "meteor", color: [255, 70, 20], ult: true },
  // Druide
  { id: "heilbluete", cls: "druide", name: "Heilende Blüte", level: 1, mana: 16, cooldown: 12, desc: "Heilt dich und Verbündete im Umkreis von 8 Blöcken über 5 Sek. um 30 % LP.", glyph: "flower", color: [255, 150, 200] },
  { id: "dornenranken", cls: "druide", name: "Dornenranken", level: 5, mana: 16, cooldown: 12, desc: "Fesselt Gegner im Zielgebiet 4 Sek. und verletzt sie (140 %).", glyph: "vine", color: [80, 170, 60] },
  { id: "wolfsgeist", cls: "druide", name: "Wolfsgeist", level: 10, mana: 25, cooldown: 45, desc: "Ruft für 40 Sek. einen Geisterwolf, der an deiner Seite kämpft.", glyph: "wolf", color: [170, 230, 255] },
  { id: "rindenhaut", cls: "druide", name: "Rindenhaut", level: 15, mana: 20, cooldown: 30, desc: "Verbündete im Umkreis erhalten 10 Sek. Widerstand und Regeneration.", glyph: "bark", color: [160, 110, 60] },
  { id: "segen", cls: "druide", name: "Segen des Ylvaris", level: 25, mana: 50, cooldown: 90, desc: "ULTIMATE: Heilt alle Verbündeten voll, entfernt Gift und schadet Fäulnis-Wesen schwer.", glyph: "tree", color: [120, 255, 150], ult: true },
];

export function abilitiesFor(cls: string | undefined): AbilityDef[] {
  return ABILITIES.filter((a) => a.cls === cls);
}

export interface TalentDef {
  id: string;
  cls: ClassId;
  path: 0 | 1;
  tier: number; // 1..5 (Reihenfolge im Pfad)
  name: string;
  desc: string;
  maxRank: number;
  /** Effektschlüssel → Wert pro Rang */
  effects: Record<string, number>;
}

// Effektschlüssel (werden in stats.ts ausgewertet):
// dmg%, melee%, ranged%, magic%, heal%, crit, critdmg, hp%, mana%, regen, resist, cdr, lifesteal, speed,
// ability:<id>% (Fähigkeitsschaden), manacost%
export const TALENT_PATH_NAMES: Record<ClassId, [string, string]> = {
  krieger: ["Berserker", "Bollwerk"],
  waldlaeufer: ["Scharfschütze", "Pirscher"],
  magier: ["Feuer & Zerstörung", "Frost & Arkanes"],
  druide: ["Lebensbaum", "Wildnis"],
};

export const TALENTS: TalentDef[] = [
  // Krieger – Berserker
  { id: "k_wut", cls: "krieger", path: 0, tier: 1, name: "Kampfeswut", desc: "+4 % Nahkampfschaden je Rang", maxRank: 3, effects: { "melee%": 0.04 } },
  { id: "k_blut", cls: "krieger", path: 0, tier: 2, name: "Blutdurst", desc: "+2 % Lebensraub je Rang", maxRank: 2, effects: { lifesteal: 0.02 } },
  { id: "k_wirbel", cls: "krieger", path: 0, tier: 3, name: "Klingensturm", desc: "Wirbelschlag +25 % Schaden je Rang", maxRank: 2, effects: { "ability:wirbelschlag%": 0.25 } },
  { id: "k_hinrichtung", cls: "krieger", path: 0, tier: 4, name: "Hinrichter", desc: "+8 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.08 } },
  { id: "k_titan", cls: "krieger", path: 0, tier: 5, name: "Titanenblut", desc: "Titanenhieb +40 % Schaden, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:titanenhieb%": 0.4, cdr: 0.1 } },
  // Krieger – Bollwerk
  { id: "k_haut", cls: "krieger", path: 1, tier: 1, name: "Eisenhaut", desc: "+5 % max. LP je Rang", maxRank: 3, effects: { "hp%": 0.05 } },
  { id: "k_stand", cls: "krieger", path: 1, tier: 2, name: "Standhaft", desc: "+3 % Widerstand je Rang", maxRank: 2, effects: { resist: 0.03 } },
  { id: "k_wall", cls: "krieger", path: 1, tier: 3, name: "Unerschütterlich", desc: "Schildwall -4 Sek. Abklingzeit je Rang", maxRank: 2, effects: { "cd:schildwall": 4 } },
  { id: "k_regen", cls: "krieger", path: 1, tier: 4, name: "Zähigkeit", desc: "+0,5 LP-Regeneration/Sek. (%) je Rang", maxRank: 3, effects: { regen: 0.005 } },
  { id: "k_bastion", cls: "krieger", path: 1, tier: 5, name: "Bastion", desc: "+10 % max. LP und +5 % Widerstand", maxRank: 1, effects: { "hp%": 0.1, resist: 0.05 } },
  // Waldläufer – Scharfschütze
  { id: "w_zielen", cls: "waldlaeufer", path: 0, tier: 1, name: "Ruhige Hand", desc: "+4 % Fernkampfschaden je Rang", maxRank: 3, effects: { "ranged%": 0.04 } },
  { id: "w_krit", cls: "waldlaeufer", path: 0, tier: 2, name: "Schwachstelle", desc: "+3 % Krit-Chance je Rang", maxRank: 2, effects: { crit: 0.03 } },
  { id: "w_salve", cls: "waldlaeufer", path: 0, tier: 3, name: "Fächerschuss", desc: "Salve +25 % Schaden je Rang", maxRank: 2, effects: { "ability:salve%": 0.25 } },
  { id: "w_kopf", cls: "waldlaeufer", path: 0, tier: 4, name: "Kopfschuss", desc: "+10 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.1 } },
  { id: "w_regen", cls: "waldlaeufer", path: 0, tier: 5, name: "Sturm der Pfeile", desc: "Pfeilregen +40 %, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:pfeilregen%": 0.4, cdr: 0.1 } },
  // Waldläufer – Pirscher
  { id: "w_flink", cls: "waldlaeufer", path: 1, tier: 1, name: "Leichtfüßig", desc: "+3 % Tempo je Rang", maxRank: 3, effects: { speed: 0.03 } },
  { id: "w_gift", cls: "waldlaeufer", path: 1, tier: 2, name: "Giftmischer", desc: "Giftpfeil +30 % Schaden je Rang", maxRank: 2, effects: { "ability:giftpfeil%": 0.3 } },
  { id: "w_dolch", cls: "waldlaeufer", path: 1, tier: 3, name: "Klingentanz", desc: "+5 % Nahkampfschaden je Rang", maxRank: 2, effects: { "melee%": 0.05 } },
  { id: "w_ausweichen", cls: "waldlaeufer", path: 1, tier: 4, name: "Ausweichen", desc: "+3 % Widerstand je Rang", maxRank: 3, effects: { resist: 0.03 } },
  { id: "w_schatten", cls: "waldlaeufer", path: 1, tier: 5, name: "Jägerinstinkt", desc: "+6 % Krit und +3 % Lebensraub", maxRank: 1, effects: { crit: 0.06, lifesteal: 0.03 } },
  // Magier – Feuer
  { id: "m_glut", cls: "magier", path: 0, tier: 1, name: "Glutherz", desc: "+4 % Magieschaden je Rang", maxRank: 3, effects: { "magic%": 0.04 } },
  { id: "m_feuer", cls: "magier", path: 0, tier: 2, name: "Inferno", desc: "Feuerball +25 % Schaden je Rang", maxRank: 2, effects: { "ability:feuerball%": 0.25 } },
  { id: "m_krit", cls: "magier", path: 0, tier: 3, name: "Zündfunke", desc: "+3 % Krit-Chance je Rang", maxRank: 2, effects: { crit: 0.03 } },
  { id: "m_kritdmg", cls: "magier", path: 0, tier: 4, name: "Feuersturm", desc: "+10 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.1 } },
  { id: "m_meteor", cls: "magier", path: 0, tier: 5, name: "Sternenzorn", desc: "Meteor +40 %, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:meteor%": 0.4, cdr: 0.1 } },
  // Magier – Frost & Arkan
  { id: "m_mana", cls: "magier", path: 1, tier: 1, name: "Manaquell", desc: "+6 % max. Mana je Rang", maxRank: 3, effects: { "mana%": 0.06 } },
  { id: "m_frost", cls: "magier", path: 1, tier: 2, name: "Eiskälte", desc: "Frostlanze +30 % Schaden je Rang", maxRank: 2, effects: { "ability:frostlanze%": 0.3 } },
  { id: "m_kosten", cls: "magier", path: 1, tier: 3, name: "Effizienz", desc: "-6 % Manakosten je Rang", maxRank: 2, effects: { "manacost%": 0.06 } },
  { id: "m_schild", cls: "magier", path: 1, tier: 4, name: "Arkane Barriere", desc: "+5 % max. LP je Rang", maxRank: 3, effects: { "hp%": 0.05 } },
  { id: "m_zeit", cls: "magier", path: 1, tier: 5, name: "Zeitkrümmung", desc: "-15 % Abklingzeiten", maxRank: 1, effects: { cdr: 0.15 } },
  // Druide – Lebensbaum
  { id: "d_heil", cls: "druide", path: 0, tier: 1, name: "Lebenssaft", desc: "+6 % Heilung je Rang", maxRank: 3, effects: { "heal%": 0.06 } },
  { id: "d_mana", cls: "druide", path: 0, tier: 2, name: "Tau des Morgens", desc: "+6 % max. Mana je Rang", maxRank: 2, effects: { "mana%": 0.06 } },
  { id: "d_bluete", cls: "druide", path: 0, tier: 3, name: "Volle Blüte", desc: "Heilende Blüte +25 % je Rang", maxRank: 2, effects: { "ability:heilbluete%": 0.25 } },
  { id: "d_regen", cls: "druide", path: 0, tier: 4, name: "Erneuerung", desc: "+0,5 % LP-Regeneration/Sek. je Rang", maxRank: 3, effects: { regen: 0.005 } },
  { id: "d_segen", cls: "druide", path: 0, tier: 5, name: "Ylvaris' Gunst", desc: "Segen -30 Sek. Abklingzeit, +10 % Heilung", maxRank: 1, effects: { "cd:segen": 30, "heal%": 0.1 } },
  // Druide – Wildnis
  { id: "d_dorn", cls: "druide", path: 1, tier: 1, name: "Dornen", desc: "+4 % Magieschaden je Rang", maxRank: 3, effects: { "magic%": 0.04 } },
  { id: "d_ranken", cls: "druide", path: 1, tier: 2, name: "Würgende Ranken", desc: "Dornenranken +30 % Schaden je Rang", maxRank: 2, effects: { "ability:dornenranken%": 0.3 } },
  { id: "d_wolf", cls: "druide", path: 1, tier: 3, name: "Rudelführer", desc: "Wolfsgeist -10 Sek. Abklingzeit je Rang", maxRank: 2, effects: { "cd:wolfsgeist": 10 } },
  { id: "d_rinde", cls: "druide", path: 1, tier: 4, name: "Borke", desc: "+3 % Widerstand je Rang", maxRank: 3, effects: { resist: 0.03 } },
  { id: "d_wild", cls: "druide", path: 1, tier: 5, name: "Ruf der Wildnis", desc: "+10 % Schaden, +5 % Tempo", maxRank: 1, effects: { "dmg%": 0.1, speed: 0.05 } },
];

export function talentsFor(cls: string | undefined): TalentDef[] {
  return TALENTS.filter((t) => t.cls === cls);
}
/** Talentpunkte: 1 Punkt ab Stufe 3, dann jede 2. Stufe. */
export function talentPointsForLevel(level: number): number {
  return level < 3 ? 0 : Math.floor((level - 1) / 2);
}
