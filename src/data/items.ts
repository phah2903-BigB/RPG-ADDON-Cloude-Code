// Item-Definitionen (Waffen, Rüstung, Talismane, Verbrauchsgüter, Materialien, Questgegenstände).
import { ABILITIES } from "./classes";

export type WeaponType =
  | "schwert"
  | "zweihaender"
  | "dolch"
  | "streitaxt"
  | "kriegshammer"
  | "speer"
  | "langbogen"
  | "armbrust"
  | "zauberstab"
  | "naturstab";

export type DamageKind = "melee_str" | "melee_dex" | "ranged" | "magic";

export interface WeaponTypeDef {
  id: WeaponType;
  name: string;
  kind: DamageKind;
  dmgMult: number; // relativ zum Tier-Grundschaden
  speed: number; // Ticks bis voller Schwung (Nahkampf)
  ability: string; // Name der Waffenfähigkeit
  abilityDesc: string;
  abilityCd: number; // Sekunden
  abilityMana: number;
  useAnim?: "bow" | "crossbow" | "spear" | "block";
  enchantSlot: string;
}

export const WEAPON_TYPES: WeaponTypeDef[] = [
  { id: "schwert", name: "Schwert", kind: "melee_str", dmgMult: 1.0, speed: 11, ability: "Klingenstoß", abilityDesc: "Stößt 3 Blöcke vor und trifft alles auf dem Weg (130 %).", abilityCd: 5, abilityMana: 6, enchantSlot: "sword" },
  { id: "zweihaender", name: "Zweihänder", kind: "melee_str", dmgMult: 1.45, speed: 20, ability: "Rundumschlag", abilityDesc: "Trifft alle Gegner im Umkreis von 3,5 Blöcken (120 %).", abilityCd: 8, abilityMana: 10, enchantSlot: "sword" },
  { id: "dolch", name: "Dolch", kind: "melee_dex", dmgMult: 0.72, speed: 6, ability: "Schattenschritt", abilityDesc: "Springt hinter das anvisierte Ziel. Der nächste Treffer ist kritisch.", abilityCd: 8, abilityMana: 8, enchantSlot: "sword" },
  { id: "streitaxt", name: "Streitaxt", kind: "melee_str", dmgMult: 1.25, speed: 16, ability: "Spalten", abilityDesc: "Wuchtiger Hieb (200 %), schwächt das Ziel 6 Sek.", abilityCd: 7, abilityMana: 8, enchantSlot: "axe" },
  { id: "kriegshammer", name: "Kriegshammer", kind: "melee_str", dmgMult: 1.35, speed: 22, ability: "Erdbeben", abilityDesc: "Erschüttert den Boden (110 %), betäubt Gegner im Umkreis 2 Sek.", abilityCd: 10, abilityMana: 12, enchantSlot: "sword" },
  { id: "speer", name: "Speer", kind: "melee_dex", dmgMult: 1.05, speed: 14, ability: "Ansturm", abilityDesc: "Sprintet 6 Blöcke vorwärts und durchbohrt Gegner (140 %).", abilityCd: 8, abilityMana: 8, enchantSlot: "sword" },
  { id: "langbogen", name: "Langbogen", kind: "ranged", dmgMult: 1.1, speed: 0, ability: "Gespannter Schuss", abilityDesc: "Halten zum Spannen, loslassen zum Schießen. Benötigt keine Pfeile.", abilityCd: 0, abilityMana: 0, useAnim: "bow", enchantSlot: "bow" },
  { id: "armbrust", name: "Armbrust", kind: "ranged", dmgMult: 1.5, speed: 0, ability: "Bolzenschuss", abilityDesc: "Durchschlagender Bolzen. 1,4 Sek. Nachladezeit. Benötigt keine Munition.", abilityCd: 1.4, abilityMana: 0, enchantSlot: "crossbow" },
  { id: "zauberstab", name: "Zauberstab", kind: "magic", dmgMult: 1.0, speed: 0, ability: "Arkanes Geschoss", abilityDesc: "Feuert ein magisches Geschoss (2 Mana).", abilityCd: 0.6, abilityMana: 2, enchantSlot: "sword" },
  { id: "naturstab", name: "Naturstab", kind: "magic", dmgMult: 0.85, speed: 0, ability: "Dornengeschoss", abilityDesc: "Feuert einen Dorn. Heilt dabei Verbündete in der Nähe leicht (3 Mana).", abilityCd: 0.8, abilityMana: 3, enchantSlot: "sword" },
];

export interface TierDef {
  tier: number;
  id: string;
  name: string;
  reqLevel: number;
  baseDmg: number;
  durability: number;
  palette: string; // Texturpalette
  value: number; // Verkaufswert (Gold)
}

export const TIERS: TierDef[] = [
  { tier: 1, id: "bronze", name: "Bronze", reqLevel: 1, baseDmg: 7, durability: 400, palette: "bronze", value: 10 },
  { tier: 2, id: "stahl", name: "Stahl", reqLevel: 10, baseDmg: 12, durability: 900, palette: "steel", value: 35 },
  { tier: 3, id: "mondsilber", name: "Mondsilber", reqLevel: 20, baseDmg: 19, durability: 1600, palette: "moonsilver", value: 90 },
  { tier: 4, id: "runenobsidian", name: "Runenobsidian", reqLevel: 30, baseDmg: 28, durability: 2600, palette: "runeobsidian", value: 200 },
];

export interface WeaponDef {
  id: string; // ohne Namespace
  type: WeaponType;
  tier: number; // 1..5 (5 = legendär)
  name: string;
  reqLevel: number;
  dmg: number;
  durability: number;
  palette: string;
  value: number;
  unique?: { effect: string; desc: string; lore: string };
}

export const WEAPONS: WeaponDef[] = [];
for (const t of WEAPON_TYPES) {
  for (const tier of TIERS) {
    WEAPONS.push({
      id: `${t.id}_${tier.id}`,
      type: t.id,
      tier: tier.tier,
      name: `${tier.name}-${t.name}`.replace("Bronze-Langbogen", "Bronze-Langbogen"),
      reqLevel: tier.reqLevel,
      dmg: Math.round(tier.baseDmg * t.dmgMult * 10) / 10,
      durability: tier.durability,
      palette: tier.palette,
      value: tier.value,
    });
  }
}

export const UNIQUES: WeaponDef[] = [
  { id: "ylvaris_zorn", type: "zweihaender", tier: 5, name: "Ylvaris' Zorn", reqLevel: 36, dmg: 46, durability: 4000, palette: "u_ylvaris", value: 500, unique: { effect: "rootburst", desc: "Treffer lassen mit 20 % Chance Wurzeln ausbrechen (150 % Flächenschaden).", lore: "Geschmiedet aus einem Ast, der nie verwelkte." } },
  { id: "fluesterklinge", type: "dolch", tier: 5, name: "Flüsterklinge", reqLevel: 36, dmg: 24, durability: 4000, palette: "u_whisper", value: 500, unique: { effect: "shadowcrit", desc: "+15 % Krit-Chance. Kritische Treffer machen 2 Sek. unsichtbar.", lore: "Man hört sie nur, wenn es zu spät ist." } },
  { id: "sternenfall", type: "langbogen", tier: 5, name: "Sternenfall", reqLevel: 36, dmg: 34, durability: 4000, palette: "u_star", value: 500, unique: { effect: "starfall", desc: "Jeder 4. Schuss ruft einen Sternensplitter herab (200 %).", lore: "Ihre Sehne ist ein Strahl aus Mondlicht." } },
  { id: "herz_des_winters", type: "zauberstab", tier: 5, name: "Herz des Winters", reqLevel: 36, dmg: 33, durability: 4000, palette: "u_winter", value: 500, unique: { effect: "frostnova", desc: "Geschosse verlangsamen; 15 % Chance auf eine Frostnova.", lore: "Im Kristall schlägt ein gefrorenes Herz." } },
  { id: "wurzelbrecher", type: "kriegshammer", tier: 5, name: "Wurzelbrecher", reqLevel: 36, dmg: 42, durability: 4000, palette: "u_root", value: 500, unique: { effect: "quake", desc: "Treffer betäuben mit 15 % Chance und heilen dich um 3 % LP.", lore: "Er zerschlug einst das Tor der Zitadelle." } },
  { id: "atem_des_hains", type: "naturstab", tier: 5, name: "Atem des Hains", reqLevel: 36, dmg: 29, durability: 4000, palette: "u_grove", value: 500, unique: { effect: "bloom", desc: "Dornen heilen Verbündete doppelt so stark; +20 % Heilung.", lore: "Wo er den Boden berührt, sprießen Blumen." } },
];

export const ALL_WEAPONS: WeaponDef[] = [...WEAPONS, ...UNIQUES];

export function weaponTypeDef(t: string): WeaponTypeDef | undefined {
  return WEAPON_TYPES.find((w) => w.id === t);
}

// ---------------- Rüstung ----------------
export type ArmorSlot = "head" | "chest" | "legs" | "feet";
export const ARMOR_SLOTS: { slot: ArmorSlot; name: string; mcSlot: string; protShare: number }[] = [
  { slot: "head", name: "Helm", mcSlot: "slot.armor.head", protShare: 0.15 },
  { slot: "chest", name: "Brustschutz", mcSlot: "slot.armor.chest", protShare: 0.4 },
  { slot: "legs", name: "Beinschutz", mcSlot: "slot.armor.legs", protShare: 0.3 },
  { slot: "feet", name: "Stiefel", mcSlot: "slot.armor.feet", protShare: 0.15 },
];

export interface ArmorSetDef {
  id: string;
  name: string;
  cls?: string; // Klassenset
  reqLevel: number;
  protection: number; // Summe über 4 Teile (Vanilla-Rüstungspunkte, max 20)
  toughness: number;
  durability: number;
  palette: string;
  bonus: Record<string, number>; // Statbonus pro Teil
  setBonus: { pieces: number; desc: string; effects: Record<string, number> };
  value: number;
  pieceNames: Record<ArmorSlot, string>;
}

export const ARMOR_SETS: ArmorSetDef[] = [
  { id: "eichenwacht", name: "Eichenwacht", cls: "krieger", reqLevel: 8, protection: 17, toughness: 2, durability: 500, palette: "oakguard", bonus: { vit: 2, str: 1 }, setBonus: { pieces: 4, desc: "+10 % max. LP, +5 % Widerstand", effects: { "hp%": 0.1, resist: 0.05 } }, value: 40, pieceNames: { head: "Eichenwacht-Helm", chest: "Eichenwacht-Harnisch", legs: "Eichenwacht-Beinschienen", feet: "Eichenwacht-Stiefel" } },
  { id: "pirschleder", name: "Pirschleder", cls: "waldlaeufer", reqLevel: 8, protection: 14, toughness: 1, durability: 420, palette: "stalker", bonus: { dex: 2, vit: 1 }, setBonus: { pieces: 4, desc: "+8 % Krit-Chance, +5 % Tempo", effects: { crit: 0.08, speed: 0.05 } }, value: 40, pieceNames: { head: "Pirscherkapuze", chest: "Pirscherwams", legs: "Pirscherhose", feet: "Pirscherstiefel" } },
  { id: "sternengewebe", name: "Sternengewebe", cls: "magier", reqLevel: 8, protection: 11, toughness: 0, durability: 360, palette: "starweave", bonus: { int: 2, wis: 1 }, setBonus: { pieces: 4, desc: "+15 % max. Mana, +10 % Magieschaden", effects: { "mana%": 0.15, "magic%": 0.1 } }, value: 40, pieceNames: { head: "Sternenhaube", chest: "Sternengewand", legs: "Sternenrock", feet: "Sternenschuhe" } },
  { id: "rindenkleid", name: "Rindenkleid", cls: "druide", reqLevel: 8, protection: 13, toughness: 1, durability: 420, palette: "barkweave", bonus: { wis: 2, vit: 1 }, setBonus: { pieces: 4, desc: "+15 % Heilung, +0,5 % LP-Regeneration/Sek.", effects: { "heal%": 0.15, regen: 0.005 } }, value: 40, pieceNames: { head: "Rindenkrone", chest: "Rindenkleid", legs: "Rindengamaschen", feet: "Wurzelsohlen" } },
  { id: "weltenbaum", name: "Weltenbaum", reqLevel: 38, protection: 20, toughness: 3, durability: 1400, palette: "worldtree", bonus: { str: 2, dex: 2, int: 2, vit: 3, wis: 2 }, setBonus: { pieces: 4, desc: "+12 % Schaden, +10 % max. LP, +1 % LP-Reg./Sek.", effects: { "dmg%": 0.12, "hp%": 0.1, regen: 0.01 } }, value: 400, pieceNames: { head: "Krone des Weltenbaums", chest: "Herzholz des Weltenbaums", legs: "Wurzeln des Weltenbaums", feet: "Schritte des Weltenbaums" } },
];

// ---------------- Talismane (Nebenhand) ----------------
export interface SimpleItemDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // Generator-Rezept
  stack: number;
  value: number;
  category: "talisman" | "consumable" | "material" | "quest" | "misc" | "rune";
  offhand?: boolean;
  glint?: boolean;
  effects?: Record<string, number>;
  rarity?: "common" | "uncommon" | "rare" | "epic";
  use?: "drink" | "eat" | "use";
}

export const TALISMANS: SimpleItemDef[] = [
  { id: "talisman_leben", name: "Talisman des Lebens", desc: "+12 % max. LP", icon: "talisman:red", stack: 1, value: 60, category: "talisman", offhand: true, effects: { "hp%": 0.12 }, rarity: "rare" },
  { id: "talisman_macht", name: "Talisman der Macht", desc: "+10 % Schaden", icon: "talisman:orange", stack: 1, value: 60, category: "talisman", offhand: true, effects: { "dmg%": 0.1 }, rarity: "rare" },
  { id: "talisman_weisheit", name: "Talisman der Weisheit", desc: "+20 % Mana-Regeneration, +10 % max. Mana", icon: "talisman:blue", stack: 1, value: 60, category: "talisman", offhand: true, effects: { manaregen: 0.2, "mana%": 0.1 }, rarity: "rare" },
  { id: "talisman_glueck", name: "Talisman des Glücks", desc: "+25 % Gold, +15 % Chance auf bessere Beute", icon: "talisman:green", stack: 1, value: 60, category: "talisman", offhand: true, effects: { gold: 0.25, luck: 0.15 }, rarity: "rare" },
  { id: "talisman_wind", name: "Talisman des Windes", desc: "+10 % Tempo, -8 % Abklingzeiten", icon: "talisman:white", stack: 1, value: 60, category: "talisman", offhand: true, effects: { speed: 0.1, cdr: 0.08 }, rarity: "rare" },
  { id: "talisman_waechter", name: "Talisman des Wächters", desc: "+8 % Widerstand, +0,5 % LP-Reg./Sek.", icon: "talisman:purple", stack: 1, value: 60, category: "talisman", offhand: true, effects: { resist: 0.08, regen: 0.005 }, rarity: "rare" },
];

export const CONSUMABLES: SimpleItemDef[] = [
  { id: "heiltrank_klein", name: "Kleiner Heiltrank", desc: "Heilt sofort 25 % LP.", icon: "potion:red:1", stack: 16, value: 4, category: "consumable", use: "drink", effects: { heal: 0.25 } },
  { id: "heiltrank", name: "Heiltrank", desc: "Heilt sofort 45 % LP.", icon: "potion:red:2", stack: 16, value: 10, category: "consumable", use: "drink", effects: { heal: 0.45 } },
  { id: "heiltrank_gross", name: "Großer Heiltrank", desc: "Heilt sofort 70 % LP.", icon: "potion:red:3", stack: 16, value: 22, category: "consumable", use: "drink", effects: { heal: 0.7 } },
  { id: "manatrank_klein", name: "Kleiner Manatrank", desc: "Stellt 30 % Mana wieder her.", icon: "potion:blue:1", stack: 16, value: 4, category: "consumable", use: "drink", effects: { mana: 0.3 } },
  { id: "manatrank", name: "Manatrank", desc: "Stellt 55 % Mana wieder her.", icon: "potion:blue:2", stack: 16, value: 10, category: "consumable", use: "drink", effects: { mana: 0.55 } },
  { id: "manatrank_gross", name: "Großer Manatrank", desc: "Stellt 85 % Mana wieder her.", icon: "potion:blue:3", stack: 16, value: 22, category: "consumable", use: "drink", effects: { mana: 0.85 } },
  { id: "elixier_staerke", name: "Elixier der Stärke", desc: "+15 % Schaden für 5 Minuten.", icon: "flask:orange", stack: 8, value: 30, category: "consumable", use: "drink", effects: { buff_dmg: 300 } },
  { id: "elixier_zaehigkeit", name: "Elixier der Zähigkeit", desc: "+15 % Widerstand für 5 Minuten.", icon: "flask:gray", stack: 8, value: 30, category: "consumable", use: "drink", effects: { buff_resist: 300 } },
  { id: "elixier_weisheit", name: "Elixier der Weisheit", desc: "+20 % Erfahrung für 10 Minuten.", icon: "flask:purple", stack: 8, value: 40, category: "consumable", use: "drink", effects: { buff_xp: 600 } },
  { id: "elixier_eile", name: "Elixier der Eile", desc: "Tempo und Eile für 5 Minuten.", icon: "flask:yellow", stack: 8, value: 25, category: "consumable", use: "drink", effects: { buff_speed: 300 } },
  { id: "rueckkehrschriftrolle", name: "Schriftrolle der Rückkehr", desc: "Bringt dich nach 3 Sek. Konzentration zum Hain zurück.", icon: "scroll:green", stack: 16, value: 12, category: "consumable", use: "use", effects: { recall: 1 } },
];

export const MATERIALS: SimpleItemDef[] = [
  { id: "faeulnisessenz", name: "Fäulnisessenz", desc: "Zähflüssige Essenz des Welkens.", icon: "essence:purple", stack: 64, value: 2, category: "material" },
  { id: "moosherz", name: "Moosherz", desc: "Pochendes Herz eines Mooslings.", icon: "orb:green", stack: 64, value: 2, category: "material" },
  { id: "dornenfang", name: "Dornenfang", desc: "Ein Reißzahn voller Dornen.", icon: "fang:green", stack: 64, value: 3, category: "material" },
  { id: "moorschleim", name: "Moorschleim", desc: "Riecht nach altem Sumpf.", icon: "slime:olive", stack: 64, value: 3, category: "material" },
  { id: "skorpionstachel", name: "Skorpionstachel", desc: "Noch immer giftig.", icon: "fang:orange", stack: 64, value: 4, category: "material" },
  { id: "frostsplitter", name: "Frostsplitter", desc: "Schmilzt niemals.", icon: "crystal:ice", stack: 64, value: 4, category: "material" },
  { id: "schattenkristall", name: "Schattenkristall", desc: "Schluckt das Licht um sich herum.", icon: "crystal:shadow", stack: 64, value: 5, category: "material" },
  { id: "runenstaub", name: "Runenstaub", desc: "Glitzernder Staub zum Verstärken von Ausrüstung.", icon: "dust:cyan", stack: 64, value: 6, category: "material" },
  { id: "mondsilberbarren", name: "Mondsilberbarren", desc: "Schimmert selbst in der Nacht.", icon: "ingot:moon", stack: 64, value: 12, category: "material" },
  { id: "uraltes_harz", name: "Uraltes Harz", desc: "Harz des Weltenbaums. Sehr selten.", icon: "gem:amber", stack: 64, value: 25, category: "material" },
];

export const QUEST_ITEMS: SimpleItemDef[] = [
  { id: "samen", name: "Samen des Weltenbaums", desc: "Pflanze ihn an einem Ort deiner Wahl (Benutzen auf Gras oder Erde).", icon: "seed", stack: 1, value: 0, category: "quest", glint: true, rarity: "epic" },
  { id: "buch", name: "Abenteuerbuch", desc: "Quests, Charakter, Fähigkeiten und mehr. Benutzen zum Öffnen.", icon: "book", stack: 1, value: 0, category: "quest" },
  { id: "verwelkte_seite", name: "Verwelkte Tagebuchseite", desc: "Eine alte Seite in feiner Handschrift.", icon: "page", stack: 16, value: 0, category: "quest" },
  { id: "wurzelsplitter", name: "Wurzelsplitter", desc: "Ein Splitter eines befreiten Wurzelherzens. Er pulsiert warm.", icon: "crystal:gold", stack: 16, value: 0, category: "quest", glint: true },
  { id: "kaels_amulett", name: "Kaels Amulett", desc: "Ein zerkratztes Amulett mit zwei Namen.", icon: "amulet", stack: 1, value: 0, category: "quest" },
  { id: "muenzbeutel", name: "Münzbeutel", desc: "Enthält Gold. Benutzen, um es zu erhalten.", icon: "pouch", stack: 1, value: 0, category: "misc" },
  { id: "beschwoerungsstein", name: "Beschwörungsstein", desc: "Legt ihn auf den Altar im Hain, um den Uralten zu rufen.", icon: "crystal:red", stack: 16, value: 0, category: "quest", glint: true, rarity: "epic" },
];

export const RUNES: SimpleItemDef[] = ABILITIES.map((a) => ({
  id: `rune_${a.id}`,
  name: `Rune: ${a.name}`,
  desc: a.desc,
  icon: `rune:${a.glyph}`,
  stack: 1,
  value: 0,
  category: "rune" as const,
  rarity: a.ult ? ("epic" as const) : ("rare" as const),
}));

export const ALL_SIMPLE: SimpleItemDef[] = [...TALISMANS, ...CONSUMABLES, ...MATERIALS, ...QUEST_ITEMS, ...RUNES];

export function simpleItem(id: string): SimpleItemDef | undefined {
  return ALL_SIMPLE.find((s) => s.id === id);
}
