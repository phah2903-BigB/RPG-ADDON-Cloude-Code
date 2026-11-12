// XP, Stufenaufstieg, Gold, Ruf.
import { Player, system } from "@minecraft/server";
import { MAX_LEVEL, REPUTATION_LEVELS, levelFromTotalXp } from "../data/balance";
import { abilitiesFor } from "../data/classes";
import { markDirty, pdata, stat } from "../core/store";
import { fmt, msg, particle, sound, title } from "../core/util";
import { healPct, invalidate, setMana, stats } from "./stats";

type Listener = (p: Player, lvl: number) => void;
const levelListeners: Listener[] = [];
export function onLevelUp(fn: Listener): void {
  levelListeners.push(fn);
}

export function addXp(p: Player, amount: number, reason = ""): void {
  const d = pdata(p);
  if (amount <= 0) return;
  let mult = 1;
  if ((d.buffs.xp ?? 0) > Date.now()) mult += 0.2;
  const gain = Math.max(1, Math.round(amount * mult));
  const before = levelFromTotalXp(d.xp);
  if (before >= MAX_LEVEL) return;
  d.xp += gain;
  markDirty(p);
  const after = levelFromTotalXp(d.xp);
  if (reason) msg(p, `§b+${fmt(gain)} XP §7${reason}`);
  if (after > before) {
    invalidate(p);
    for (let l = before + 1; l <= after; l++) levelUp(p, l);
  }
}

function levelUp(p: Player, lvl: number): void {
  title(p, `§6Stufe ${lvl}!`, "§eDu bist stärker geworden", 5, 50, 15);
  sound(p, "random.levelup", undefined, 1.0);
  sound(p, "ui.toast.challenge_complete", undefined, 1.2, 0.6);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    particle(p.dimension, "minecraft:totem_particle", { x: p.location.x + Math.cos(a), y: p.location.y + 1, z: p.location.z + Math.sin(a) });
  }
  system.runTimeout(() => {
    try {
      healPct(p, 1);
      setMana(p, stats(p).maxMana);
    } catch {
      /* Spieler weg */
    }
  }, 2);
  msg(p, `§6✦ Stufenaufstieg! §fDu bist jetzt Stufe §e${lvl}§f. §7(+2 Attributpunkte – Abenteuerbuch → Charakter)`);
  if (lvl >= 3 && lvl % 2 === 1) msg(p, "§a✦ Neuer Talentpunkt verfügbar! §7(Abenteuerbuch → Talente)");
  const d = pdata(p);
  for (const a of abilitiesFor(d.cls)) {
    if (a.level === lvl) {
      msg(p, `§d✦ Neue Fähigkeit freigeschaltet: §f${a.name}§d! §7Hol dir die Rune im Abenteuerbuch → Fähigkeiten.`);
      title(p, `§6Stufe ${lvl}!`, `§dNeue Fähigkeit: ${a.name}`, 5, 60, 15);
    }
  }
  stat(p, "maxLevel", 0);
  d.stats.maxLevel = Math.max(d.stats.maxLevel ?? 0, lvl);
  for (const fn of levelListeners) {
    try {
      fn(p, lvl);
    } catch {
      /* ignorieren */
    }
  }
}

export function addGold(p: Player, amount: number, reason = "", applyMult = true): number {
  const d = pdata(p);
  const gain = Math.round(applyMult ? amount * stats(p).goldMult : amount);
  if (gain === 0) return 0;
  d.gold = Math.max(0, d.gold + gain);
  if (gain > 0) d.stats.goldEarned = (d.stats.goldEarned ?? 0) + gain;
  markDirty(p);
  if (reason) msg(p, `${gain > 0 ? "§e+" : "§c"}${fmt(gain)} Gold §7${reason}`);
  return gain;
}

export function spendGold(p: Player, amount: number): boolean {
  const d = pdata(p);
  if (d.gold < amount) return false;
  d.gold -= amount;
  markDirty(p);
  return true;
}

export function repLevel(rep: number): { idx: number; name: string; next?: number } {
  let idx = 0;
  for (let i = 0; i < REPUTATION_LEVELS.length; i++) if (rep >= REPUTATION_LEVELS[i].need) idx = i;
  return { idx, name: REPUTATION_LEVELS[idx].name, next: REPUTATION_LEVELS[idx + 1]?.need };
}

export function addRep(p: Player, amount: number): void {
  const d = pdata(p);
  const before = repLevel(d.rep).idx;
  d.rep += amount;
  markDirty(p);
  const after = repLevel(d.rep);
  if (after.idx > before) {
    msg(p, `§a✦ Ruf beim Hain gestiegen: §f${after.name}§a! §7Händler bieten dir neue Waren an.`);
    sound(p, "random.orb", undefined, 0.8);
  }
}

/** Rabatt durch Ruf (0..0.2). */
export function repDiscount(p: Player): number {
  return repLevel(pdata(p).rep).idx * 0.05;
}
