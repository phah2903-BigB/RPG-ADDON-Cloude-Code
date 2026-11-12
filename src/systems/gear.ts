// Ausrüstung: Affixe, Seltenheit, Upgrades, Lore.
import { ItemStack, ItemLockMode, Player, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";
import { RARITIES, UPGRADE_DMG_PER_LEVEL, RarityId } from "../data/balance";
import { ALL_WEAPONS, ARMOR_SETS, ARMOR_SLOTS, ArmorSlot, WeaponDef, ArmorSetDef, weaponTypeDef, simpleItem, TALISMANS, WEAPON_TYPES } from "../data/items";
import { ATTR_NAMES } from "../data/classes";
import { pick, rand, randInt, weighted } from "../core/util";

export const NS = "cdw:";
const PROP = "cdw:g";

export interface GearData {
  r: number; // Seltenheitsindex
  a: Record<string, number>; // Affixe
  u: number; // Upgradestufe
}

const weaponById = new Map<string, WeaponDef>(ALL_WEAPONS.map((w) => [NS + w.id, w]));
const armorById = new Map<string, { set: ArmorSetDef; slot: ArmorSlot }>();
for (const s of ARMOR_SETS) for (const sl of ARMOR_SLOTS) armorById.set(`${NS}${s.id}_${sl.slot}`, { set: s, slot: sl.slot });

export function weaponOf(typeId: string | undefined): WeaponDef | undefined {
  return typeId ? weaponById.get(typeId) : undefined;
}
export function armorOf(typeId: string | undefined): { set: ArmorSetDef; slot: ArmorSlot } | undefined {
  return typeId ? armorById.get(typeId) : undefined;
}
export function isGear(typeId: string): boolean {
  return weaponById.has(typeId) || armorById.has(typeId);
}
export function allWeaponIds(): string[] {
  return [...weaponById.keys()];
}

export const AFFIX_NAMES: Record<string, (v: number) => string> = {
  str: (v) => `+${v} ${ATTR_NAMES.str}`,
  dex: (v) => `+${v} ${ATTR_NAMES.dex}`,
  int: (v) => `+${v} ${ATTR_NAMES.int}`,
  vit: (v) => `+${v} ${ATTR_NAMES.vit}`,
  wis: (v) => `+${v} ${ATTR_NAMES.wis}`,
  crit: (v) => `+${pct(v)} Krit-Chance`,
  critdmg: (v) => `+${pct(v)} Krit-Schaden`,
  "hp%": (v) => `+${pct(v)} max. Leben`,
  "mana%": (v) => `+${pct(v)} max. Mana`,
  "dmg%": (v) => `+${pct(v)} Schaden`,
  resist: (v) => `+${pct(v)} Widerstand`,
  lifesteal: (v) => `+${pct(v)} Lebensraub`,
  regen: (v) => `+${pct(v)} Leben/Sek.`,
  speed: (v) => `+${pct(v)} Tempo`,
  cdr: (v) => `-${pct(v)} Abklingzeiten`,
  manaregen: (v) => `+${pct(v)} Mana-Regeneration`,
  gold: (v) => `+${pct(v)} Gold`,
  luck: (v) => `+${pct(v)} Beuteglück`,
};

function pct(v: number): string {
  const p = Math.round(v * 1000) / 10;
  return `${p.toString().replace(".", ",")} %`;
}

const WEAPON_AFFIXES = ["str", "dex", "int", "vit", "wis", "crit", "critdmg", "dmg%", "lifesteal", "cdr", "mana%"];
const ARMOR_AFFIXES = ["str", "dex", "int", "vit", "wis", "hp%", "resist", "regen", "speed", "manaregen", "mana%"];

function rollAffix(key: string, tier: number): number {
  const t = Math.max(1, tier);
  switch (key) {
    case "str":
    case "dex":
    case "int":
    case "vit":
    case "wis":
      return randInt(1 + t, 3 + t * 2);
    case "crit":
      return Math.round(rand(0.01, 0.015 + 0.01 * t) * 1000) / 1000;
    case "critdmg":
      return Math.round(rand(0.05, 0.06 + 0.04 * t) * 100) / 100;
    case "dmg%":
      return Math.round(rand(0.02, 0.03 + 0.02 * t) * 100) / 100;
    case "hp%":
      return Math.round(rand(0.02, 0.03 + 0.015 * t) * 100) / 100;
    case "mana%":
      return Math.round(rand(0.03, 0.04 + 0.02 * t) * 100) / 100;
    case "resist":
      return Math.round(rand(0.01, 0.015 + 0.008 * t) * 1000) / 1000;
    case "lifesteal":
      return Math.round(rand(0.01, 0.012 + 0.006 * t) * 1000) / 1000;
    case "regen":
      return Math.round(rand(0.001, 0.002 + 0.001 * t) * 1000) / 1000;
    case "speed":
      return Math.round(rand(0.02, 0.03 + 0.01 * t) * 100) / 100;
    case "cdr":
      return Math.round(rand(0.02, 0.025 + 0.012 * t) * 1000) / 1000;
    case "manaregen":
      return Math.round(rand(0.05, 0.08 + 0.04 * t) * 100) / 100;
    default:
      return 0;
  }
}

export function rollRarity(luck = 0, minRarity = 0): number {
  const opts = RARITIES.map((r, i) => ({ i, weight: i === 0 ? r.weight * (1 - Math.min(0.5, luck)) : r.weight * (1 + luck * 2) })).filter((o) => o.i >= minRarity);
  return weighted(opts).i;
}

export function rollGear(typeId: string, rarity?: number, luck = 0): GearData {
  const w = weaponOf(typeId);
  const a = armorOf(typeId);
  const tier = w ? w.tier : a ? Math.max(1, Math.round(a.set.reqLevel / 10)) : 1;
  let r = rarity ?? rollRarity(luck);
  if (w?.unique) r = 4;
  const count = RARITIES[r].affixes;
  const pool = [...(w ? WEAPON_AFFIXES : ARMOR_AFFIXES)];
  const affixes: Record<string, number> = {};
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const key = pool.splice(idx, 1)[0];
    affixes[key] = rollAffix(key, tier + (r >= 3 ? 1 : 0));
  }
  return { r, a: affixes, u: 0 };
}

export function getGear(item: ItemStack | undefined): GearData | undefined {
  if (!item) return undefined;
  try {
    const raw = item.getDynamicProperty(PROP);
    if (typeof raw === "string") return JSON.parse(raw) as GearData;
  } catch {
    /* kein Gear */
  }
  return undefined;
}

export function setGear(item: ItemStack, g: GearData): void {
  item.setDynamicProperty(PROP, JSON.stringify(g));
  applyLore(item, g);
}

export function weaponDamage(w: WeaponDef, g?: GearData): number {
  const rm = g ? RARITIES[g.r]?.statMult ?? 1 : 1;
  return w.dmg * rm * (1 + (g?.u ?? 0) * UPGRADE_DMG_PER_LEVEL);
}

export function armorBonusMult(g?: GearData): number {
  return (g ? RARITIES[g.r]?.statMult ?? 1 : 1) * (1 + (g?.u ?? 0) * 0.06);
}

export function displayName(typeId: string, g?: GearData): string {
  const w = weaponOf(typeId);
  const a = armorOf(typeId);
  const base = w ? w.name : a ? a.set.pieceNames[a.slot] : typeId;
  if (!g) return base;
  const rar = RARITIES[g.r];
  return `${rar.color}${base}${g.u > 0 ? ` §e+${g.u}` : ""}`;
}

export function applyLore(item: ItemStack, g: GearData): void {
  const w = weaponOf(item.typeId);
  const a = armorOf(item.typeId);
  const rar = RARITIES[g.r];
  const lines: string[] = [];
  lines.push(`${rar.color}${rar.name}§r§7${w ? " · " + (weaponTypeDef(w.type)?.name ?? "") : a ? " · Rüstung" : ""}`);
  if (w) {
    lines.push(`§fSchaden: §c${Math.round(weaponDamage(w, g) * 10) / 10}`);
    lines.push(`§7Benötigt Stufe ${w.reqLevel}`);
  } else if (a) {
    const sl = ARMOR_SLOTS.find((s) => s.slot === a.slot)!;
    lines.push(`§fRüstung: §b${Math.max(1, Math.round(a.set.protection * sl.protShare))}`);
    const m = armorBonusMult(g);
    for (const [k, v] of Object.entries(a.set.bonus)) lines.push(`§a${AFFIX_NAMES[k]?.(Math.round(v * m)) ?? k}`);
    lines.push(`§7Benötigt Stufe ${a.set.reqLevel}${a.set.cls ? " · Klassenset" : ""}`);
  }
  for (const [k, v] of Object.entries(g.a)) lines.push(`${rar.color}${AFFIX_NAMES[k]?.(v) ?? k}`);
  if (w?.unique) {
    lines.push(`§6${w.unique.desc.slice(0, 48)}`);
    if (w.unique.desc.length > 48) lines.push(`§6${w.unique.desc.slice(48, 96)}`);
    lines.push(`§8§o${w.unique.lore.slice(0, 48)}`);
  } else if (w) {
    const t = weaponTypeDef(w.type);
    if (t && t.abilityCd > 0 && t.kind !== "magic") lines.push(`§8Benutzen: ${t.ability}`);
  }
  if (a) lines.push(`§8Set (${a.set.setBonus.pieces}): ${a.set.setBonus.desc.slice(0, 40)}`);
  item.setLore(lines.map((l) => l.slice(0, 60)));
  item.nameTag = displayName(item.typeId, g);
}

/** Erstellt ein fertiges Ausrüstungsitem. */
export function createGear(typeId: string, rarity?: number, luck = 0): ItemStack {
  const item = new ItemStack(typeId, 1);
  const g = rollGear(typeId, rarity, luck);
  setGear(item, g);
  item.keepOnDeath = true;
  return item;
}

/** Initialisiert neu erhaltene Ausrüstung (z. B. aus Truhen) und bindet Seelen-Items. */
export function ensureItem(item: ItemStack): ItemStack | undefined {
  const id = item.typeId;
  if (!id.startsWith(NS)) return undefined;
  let changed = false;
  if (isGear(id) && !getGear(item)) {
    setGear(item, rollGear(id));
    changed = true;
  }
  const s = simpleItem(id.slice(NS.length));
  const shouldKeep = isGear(id) || s?.category === "rune" || s?.category === "talisman" || id === NS + "buch";
  if (shouldKeep && !item.keepOnDeath) {
    item.keepOnDeath = true;
    changed = true;
  }
  if ((s?.category === "rune" || id === NS + "buch") && item.lockMode !== ItemLockMode.inventory) {
    item.lockMode = ItemLockMode.inventory;
    changed = true;
  }
  return changed ? item : undefined;
}

export function equippable(p: Player): EntityEquippableComponent | undefined {
  return p.getComponent("minecraft:equippable") as EntityEquippableComponent | undefined;
}

export function getEquip(p: Player, slot: EquipmentSlot): ItemStack | undefined {
  try {
    return equippable(p)?.getEquipment(slot);
  } catch {
    return undefined;
  }
}

/** Zufälliges Ausrüstungsitem passend zu Stufe und (optional) Klasse. */
export function randomGearFor(level: number, cls: string | undefined, armorChance = 0.25): string {
  const tier = level < 10 ? 1 : level < 20 ? 2 : level < 30 ? 3 : 4;
  if (Math.random() < armorChance && level >= 8) {
    const sets = ARMOR_SETS.filter((s) => (s.cls === cls || (!s.cls && level >= 38)) && s.reqLevel <= level + 2);
    if (sets.length) {
      const set = pick(sets);
      return `${NS}${set.id}_${pick(ARMOR_SLOTS).slot}`;
    }
  }
  const classTypes = WEAPON_TYPES.filter((t) => !cls || Math.random() < 0.25 || (CLASS_WEAPONS[cls] ?? []).includes(t.id));
  const t = pick(classTypes.length ? classTypes : WEAPON_TYPES);
  const tierId = ["bronze", "stahl", "mondsilber", "runenobsidian"][tier - 1];
  return `${NS}${t.id}_${tierId}`;
}

export const CLASS_WEAPONS: Record<string, string[]> = {
  krieger: ["schwert", "zweihaender", "streitaxt", "kriegshammer"],
  waldlaeufer: ["langbogen", "armbrust", "speer", "dolch"],
  magier: ["zauberstab", "dolch"],
  druide: ["naturstab", "dolch", "speer"],
};

export function talismanEffects(typeId: string | undefined): Record<string, number> | undefined {
  if (!typeId) return undefined;
  return TALISMANS.find((t) => NS + t.id === typeId)?.effects;
}

export const RARITY_IDS: RarityId[] = RARITIES.map((r) => r.id);
