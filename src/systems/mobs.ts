// Monsterstufen, Elites, Bosse (Grundwerte) – gilt für eigene und Vanilla-Monster.
import { Entity, EntityHealthComponent, world, Player } from "@minecraft/server";
import { mobHpScale, zoneLevel } from "../data/balance";
import { MobDef, mobById } from "../data/mobs";
import { wdata } from "../core/store";
import { V, clamp, isValid, randInt } from "../core/util";
import { level as playerLevel } from "./stats";

export interface MobInfo {
  lvl: number;
  elite: boolean;
  hpMult: number; // zusätzlicher LP-Faktor (Elite/Boss/Spielerzahl)
  dmgMult: number;
  def?: MobDef;
}

const info = new Map<string, MobInfo>();

export function mobDef(e: Entity): MobDef | undefined {
  return e.typeId.startsWith("cdw:") ? mobById(e.typeId.slice(4)) : undefined;
}

export function isHostile(e: Entity): boolean {
  try {
    if (e.typeId === "minecraft:player") return false;
    if (e.typeId.startsWith("cdw:")) return !!mobById(e.typeId.slice(4));
    return e.matches({ families: ["monster"] });
  } catch {
    return false;
  }
}

export function hubCenter(): { x: number; y: number; z: number } {
  const h = wdata().hub;
  if (h) return h;
  const s = world.getDefaultSpawnLocation();
  return { x: s.x, y: 64, z: s.z };
}

function nearbyMaxPlayerLevel(e: Entity): number {
  let max = 0;
  try {
    for (const p of e.dimension.getPlayers({ location: e.location, maxDistance: 96 })) max = Math.max(max, playerLevel(p));
  } catch {
    /* ignorieren */
  }
  return max;
}

export function assignLevel(e: Entity, force = false): MobInfo | undefined {
  if (!isValid(e)) return undefined;
  const existing = info.get(e.id);
  if (existing && !force) return existing;
  const stored = e.getDynamicProperty("cdw:l");
  const def = mobDef(e);
  if (typeof stored === "number" && !force) {
    const mi: MobInfo = {
      lvl: stored,
      elite: e.getDynamicProperty("cdw:e") === true,
      hpMult: (e.getDynamicProperty("cdw:hm") as number) ?? 1,
      dmgMult: (e.getDynamicProperty("cdw:dm") as number) ?? 1,
      def,
    };
    info.set(e.id, mi);
    return mi;
  }
  if (!isHostile(e)) return undefined;
  let lvl: number;
  let elite = false;
  let hpMult = 1;
  let dmgMult = 1;
  if (def?.boss) {
    lvl = def.boss.fixedLevel;
    const players = e.dimension.getPlayers({ location: e.location, maxDistance: 48 }).length;
    hpMult = 1 + 0.6 * Math.max(0, players - 1);
  } else {
    const hub = hubCenter();
    const dist = V.dist2d(e.location, hub);
    lvl = zoneLevel(dist, e.dimension.id) + (def?.levelBonus ?? 0) + randInt(-1, 1);
    const pmax = nearbyMaxPlayerLevel(e);
    if (pmax > 0) lvl = Math.min(lvl, pmax + 4);
    // Akt-Monster nicht schwächer als ihr Gebiet
    if (def && def.act > 0) lvl = Math.max(lvl, [1, 1, 8, 15, 22, 30][def.act] ?? 1);
    lvl = clamp(lvl, 1, 55);
    if (def && Math.random() < 0.05) {
      elite = true;
      lvl += 2;
      hpMult = 2.5;
      dmgMult = 1.5;
    }
  }
  const mi: MobInfo = { lvl, elite, hpMult, dmgMult, def };
  try {
    e.setDynamicProperty("cdw:l", lvl);
    if (elite) {
      e.setDynamicProperty("cdw:e", true);
      try {
        e.setProperty("cdw:elite", true);
      } catch {
        /* Vanilla */
      }
    }
    if (hpMult !== 1) e.setDynamicProperty("cdw:hm", hpMult);
    if (dmgMult !== 1) e.setDynamicProperty("cdw:dm", dmgMult);
  } catch {
    /* ignorieren */
  }
  info.set(e.id, mi);
  return mi;
}

export function getInfo(e: Entity): MobInfo | undefined {
  return info.get(e.id) ?? (isValid(e) ? assignLevel(e) : undefined);
}

/** Lesender Zugriff ohne Schreiben (für Before-Events). */
export function peekInfo(e: Entity): MobInfo | undefined {
  const c = info.get(e.id);
  if (c) return c;
  try {
    const stored = e.getDynamicProperty("cdw:l");
    if (typeof stored === "number") {
      const mi: MobInfo = {
        lvl: stored,
        elite: e.getDynamicProperty("cdw:e") === true,
        hpMult: (e.getDynamicProperty("cdw:hm") as number) ?? 1,
        dmgMult: (e.getDynamicProperty("cdw:dm") as number) ?? 1,
        def: mobDef(e),
      };
      info.set(e.id, mi);
      return mi;
    }
  } catch {
    /* ignorieren */
  }
  return undefined;
}

export function forgetMob(id: string): void {
  info.delete(id);
}

export function totalHpScale(mi: MobInfo | undefined): number {
  if (!mi) return 1;
  return mobHpScale(mi.lvl) * mi.hpMult;
}

export function mobName(e: Entity): string {
  const d = mobDef(e);
  if (d) return d.name;
  return e.typeId.replace("minecraft:", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mobHp(e: Entity): { cur: number; max: number } | undefined {
  const h = e.getComponent("minecraft:health") as EntityHealthComponent | undefined;
  if (!h) return undefined;
  const sc = totalHpScale(getInfo(e));
  return { cur: Math.max(0, Math.ceil(h.currentValue * sc)), max: Math.ceil(h.effectiveMax * sc) };
}

export function playerLvl(p: Player): number {
  return playerLevel(p);
}
