// Abgeleitete Spielerwerte: Stufe, Attribute, Talente, Ausrüstung, Buffs.
import { EquipmentSlot, Player, EntityHealthComponent } from "@minecraft/server";
import { ATTR_POINTS_PER_LEVEL, MAX_LEVEL, PLAYER_BASE, levelFromTotalXp, vitResist, xpToNext, totalXpForLevel } from "../data/balance";
import { AttrId, classById, TALENTS, talentPointsForLevel } from "../data/classes";
import { pdata } from "../core/store";
import { armorBonusMult, armorOf, getEquip, getGear, talismanEffects, weaponOf } from "./gear";

export interface Stats {
  level: number;
  attrs: Record<AttrId, number>;
  maxHp: number;
  maxMana: number;
  manaRegen: number;
  crit: number;
  critDmg: number;
  resist: number;
  lifesteal: number;
  regen: number; // Anteil max. LP pro Sekunde
  speed: number;
  cdr: number;
  goldMult: number;
  luck: number;
  mods: Record<string, number>; // dmg%, melee%, ranged%, magic%, heal%, manacost%, ability:x%, cd:x
  setBonus: string[];
}

const ATTRS: AttrId[] = ["str", "dex", "int", "vit", "wis"];
const cache = new Map<string, { t: number; s: Stats }>();
const mana = new Map<string, number>();
const shields = new Map<string, number>(); // Arkanschild (RPG-LP)
const tempBuffs = new Map<string, Map<string, { v: number; until: number }>>(); // Kurzzeit-Buffs (Ticks)

export function level(p: Player): number {
  return levelFromTotalXp(pdata(p).xp);
}

export function xpProgress(p: Player): { level: number; cur: number; need: number } {
  const d = pdata(p);
  const lvl = levelFromTotalXp(d.xp);
  if (lvl >= MAX_LEVEL) return { level: lvl, cur: 1, need: 1 };
  const base = totalXpForLevel(lvl);
  return { level: lvl, cur: d.xp - base, need: xpToNext(lvl) };
}

export function freeAttrPoints(p: Player): number {
  const d = pdata(p);
  const lvl = level(p);
  const spent = ATTRS.reduce((s, a) => s + (d.attr[a] ?? 0), 0);
  return (lvl - 1) * ATTR_POINTS_PER_LEVEL + d.prestige * 2 - spent;
}

export function freeTalentPoints(p: Player): number {
  const d = pdata(p);
  const spent = Object.values(d.talents).reduce((s, v) => s + v, 0);
  return talentPointsForLevel(level(p)) - spent;
}

export function addTempBuff(p: Player, key: string, value: number, ticks: number, now: number): void {
  let m = tempBuffs.get(p.id);
  if (!m) tempBuffs.set(p.id, (m = new Map()));
  m.set(key, { v: value, until: now + ticks });
  invalidate(p);
}

export function tempBuff(p: Player, key: string, now: number): number {
  const b = tempBuffs.get(p.id)?.get(key);
  if (!b) return 0;
  if (b.until < now) {
    tempBuffs.get(p.id)?.delete(key);
    return 0;
  }
  return b.v;
}

export function invalidate(p: Player): void {
  cache.delete(p.id);
}

export function stats(p: Player, now = 0): Stats {
  const c = cache.get(p.id);
  if (c && now - c.t < 10) return c.s;
  const s = compute(p, now);
  cache.set(p.id, { t: now, s });
  return s;
}

function compute(p: Player, now: number): Stats {
  const d = pdata(p);
  const lvl = levelFromTotalXp(d.xp);
  const cls = classById(d.cls);
  const attrs: Record<AttrId, number> = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  for (const a of ATTRS) attrs[a] = (cls?.base[a] ?? 2) + ((cls?.growth[a] ?? 0) * (lvl - 1)) + (d.attr[a] ?? 0);
  const mods: Record<string, number> = {};
  const add = (k: string, v: number) => (mods[k] = (mods[k] ?? 0) + v);

  // Talente
  for (const t of TALENTS) {
    const rank = d.talents[t.id] ?? 0;
    if (rank > 0 && t.cls === d.cls) for (const [k, v] of Object.entries(t.effects)) add(k, v * rank);
  }

  // Ausrüstung
  const setCounts = new Map<string, number>();
  const main = getEquip(p, EquipmentSlot.Mainhand);
  if (main && weaponOf(main.typeId)) {
    const g = getGear(main);
    if (g) for (const [k, v] of Object.entries(g.a)) add(k, v);
  }
  const off = getEquip(p, EquipmentSlot.Offhand);
  const tal = talismanEffects(off?.typeId);
  if (tal) for (const [k, v] of Object.entries(tal)) add(k, v);
  for (const slot of [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet]) {
    const it = getEquip(p, slot);
    const a = armorOf(it?.typeId);
    if (!it || !a) continue;
    const g = getGear(it);
    const m = armorBonusMult(g);
    for (const [k, v] of Object.entries(a.set.bonus)) add(k, Math.round(v * m));
    if (g) for (const [k, v] of Object.entries(g.a)) add(k, v);
    setCounts.set(a.set.id, (setCounts.get(a.set.id) ?? 0) + 1);
  }
  const setBonus: string[] = [];
  for (const [id, n] of setCounts) {
    const set = armorOf(`cdw:${id}_head`)?.set;
    if (set && n >= set.setBonus.pieces) {
      for (const [k, v] of Object.entries(set.setBonus.effects)) add(k, v);
      setBonus.push(set.name);
    }
  }
  // Attribut-Affixe
  for (const a of ATTRS) {
    if (mods[a]) {
      attrs[a] += mods[a];
      delete mods[a];
    }
  }

  // Langzeit-Buffs (Elixiere)
  const nowMs = Date.now();
  if ((d.buffs.dmg ?? 0) > nowMs) add("dmg%", 0.15);
  if ((d.buffs.resist ?? 0) > nowMs) add("resist", 0.15);
  // Kurzzeit-Buffs (Fähigkeiten)
  add("dmg%", tempBuff(p, "dmg%", now));
  add("crit", tempBuff(p, "crit", now));
  add("resist", tempBuff(p, "resist", now));

  // Prestige: +2 % Schaden & LP je Rang
  add("dmg%", d.prestige * 0.02);
  add("hp%", d.prestige * 0.02);

  const maxHp = Math.round((PLAYER_BASE.hp + PLAYER_BASE.hpPerLevel * (lvl - 1) + PLAYER_BASE.hpPerVit * attrs.vit) * (1 + (mods["hp%"] ?? 0)));
  const maxMana = Math.round((PLAYER_BASE.mana + PLAYER_BASE.manaPerLevel * (lvl - 1) + PLAYER_BASE.manaPerWis * attrs.wis) * (1 + (mods["mana%"] ?? 0)));
  return {
    level: lvl,
    attrs,
    maxHp,
    maxMana,
    manaRegen: (PLAYER_BASE.manaRegen + PLAYER_BASE.manaRegenPerWis * attrs.wis) * (1 + (mods.manaregen ?? 0)),
    crit: Math.min(0.75, PLAYER_BASE.critChance + PLAYER_BASE.critPerDex * attrs.dex + (mods.crit ?? 0)),
    critDmg: PLAYER_BASE.critDamage + (mods.critdmg ?? 0),
    resist: Math.min(0.7, vitResist(attrs.vit) + (mods.resist ?? 0)),
    lifesteal: Math.min(0.25, mods.lifesteal ?? 0),
    regen: mods.regen ?? 0,
    speed: Math.min(0.5, mods.speed ?? 0),
    cdr: Math.min(0.5, mods.cdr ?? 0),
    goldMult: 1 + (mods.gold ?? 0),
    luck: mods.luck ?? 0,
    mods,
    setBonus,
  };
}

// ---------- Mana ----------
export function getMana(p: Player): number {
  const v = mana.get(p.id);
  if (v === undefined) {
    const m = stats(p).maxMana;
    mana.set(p.id, m);
    return m;
  }
  return v;
}
export function setMana(p: Player, v: number): void {
  mana.set(p.id, Math.max(0, Math.min(stats(p).maxMana, v)));
}
export function spendMana(p: Player, cost: number): boolean {
  const m = getMana(p);
  if (m < cost) return false;
  setMana(p, m - cost);
  return true;
}

// ---------- Schild ----------
export function getShield(p: Player): number {
  return shields.get(p.id) ?? 0;
}
export function setShield(p: Player, v: number): void {
  if (v <= 0) shields.delete(p.id);
  else shields.set(p.id, v);
}

// ---------- LP (virtuell) ----------
export function health(p: Player): EntityHealthComponent | undefined {
  return p.getComponent("minecraft:health") as EntityHealthComponent | undefined;
}
export function hpInfo(p: Player): { cur: number; max: number } {
  const h = health(p);
  const s = stats(p);
  if (!h) return { cur: s.maxHp, max: s.maxHp };
  return { cur: Math.ceil((h.currentValue / h.effectiveMax) * s.maxHp), max: s.maxHp };
}
/** Heilt den Spieler um RPG-LP. */
export function healRpg(p: Player, amount: number): number {
  const h = health(p);
  if (!h || amount <= 0) return 0;
  const s = stats(p);
  const vanilla = (amount / s.maxHp) * h.effectiveMax;
  const before = h.currentValue;
  h.setCurrentValue(Math.min(h.effectiveMax, before + vanilla));
  return ((h.currentValue - before) / h.effectiveMax) * s.maxHp;
}
export function healPct(p: Player, pct: number): number {
  return healRpg(p, stats(p).maxHp * pct);
}

export function forgetStats(id: string): void {
  cache.delete(id);
  mana.delete(id);
  shields.delete(id);
  tempBuffs.delete(id);
}
