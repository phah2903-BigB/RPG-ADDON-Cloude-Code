// HUD (Aktionsleiste), Quest-Kompass, Locator-Bar-Wegpunkte, Irrlicht-Pfad, Regeneration.
import { LocationWaypoint, Player, system, Vector3, WaypointTexture, world } from "@minecraft/server";
import { pdata } from "../core/store";
import { V, arrowTo, bar, fmt, isValid, players } from "../core/util";
import { targetInfo } from "./combat";
import { mobHp, mobName, getInfo } from "./mobs";
import { hooks, mainTracker, sideActive, sideTracker } from "./quests";
import { questById } from "../data/quests";
import { getMana, getShield, health, hpInfo, setMana, stats, xpProgress, healRpg } from "./stats";

interface Wp {
  wp: LocationWaypoint;
  key: string;
}
const waypoints = new Map<string, { main?: Wp; side?: Wp; hub?: Wp }>();

function resolve(t: Parameters<typeof hooks.resolveTarget>[0] | undefined): { x: number; y: number; z: number; d?: string } | undefined {
  if (!t) return undefined;
  try {
    return hooks.resolveTarget(t);
  } catch {
    return undefined;
  }
}

function setWp(p: Player, slot: "main" | "side" | "hub", loc: { x: number; y: number; z: number; d?: string } | undefined, tex: WaypointTexture, color: { red: number; green: number; blue: number }): void {
  let m = waypoints.get(p.id);
  if (!m) waypoints.set(p.id, (m = {}));
  const cur = m[slot];
  if (!loc) {
    if (cur) {
      try {
        p.locatorBar.removeWaypoint(cur.wp);
      } catch {
        /* ignorieren */
      }
      m[slot] = undefined;
    }
    return;
  }
  const dim = world.getDimension(loc.d ?? "minecraft:overworld");
  const key = `${Math.round(loc.x)},${Math.round(loc.y)},${Math.round(loc.z)},${dim.id}`;
  try {
    if (cur && cur.key === key && p.locatorBar.hasWaypoint(cur.wp)) return;
    if (cur) {
      cur.wp.setDimensionLocation({ dimension: dim, x: loc.x, y: loc.y, z: loc.z });
      cur.key = key;
      if (!p.locatorBar.hasWaypoint(cur.wp)) p.locatorBar.addWaypoint(cur.wp);
      return;
    }
    const wp = new LocationWaypoint({ dimension: dim, x: loc.x, y: loc.y, z: loc.z }, { textureBoundsList: [{ lowerBound: 0, texture: tex }] }, color);
    p.locatorBar.addWaypoint(wp);
    m[slot] = { wp, key };
  } catch {
    /* Locator-Bar voll oder nicht verfügbar */
  }
}

/** Aktuelles Ziel des Spielers für Kompass/Irrlicht. */
export function currentTarget(p: Player): { text: string; loc?: { x: number; y: number; z: number; d?: string }; main: boolean } | undefined {
  const d = pdata(p);
  if (d.tracked && d.tracked !== "main") {
    const q = questById(d.tracked);
    if (q && d.quests[q.id]) {
      const t = sideTracker(p, q);
      return { text: `§e${t.text}`, loc: resolve(t.target), main: false };
    }
  }
  const mt = mainTracker();
  if (mt) return { text: `§6${mt.text}`, loc: resolve(mt.target), main: true };
  const side = sideActive(p)[0];
  if (side) {
    const t = sideTracker(p, side);
    return { text: `§e${t.text}`, loc: resolve(t.target), main: false };
  }
  return undefined;
}

function updateWaypoints(p: Player): void {
  const mt = mainTracker();
  setWp(p, "main", mt ? resolve(mt.target) : undefined, WaypointTexture.SmallStar, { red: 1, green: 0.78, blue: 0.2 });
  const d = pdata(p);
  let side: { x: number; y: number; z: number; d?: string } | undefined;
  const sq = d.tracked && d.tracked !== "main" ? questById(d.tracked) : sideActive(p)[0];
  if (sq && d.quests[sq.id]) side = resolve(sideTracker(p, sq).target);
  setWp(p, "side", side, WaypointTexture.Circle, { red: 0.3, green: 0.7, blue: 1 });
  setWp(p, "hub", resolve({ k: "hub" }), WaypointTexture.SmallSquare, { red: 0.35, green: 1, blue: 0.45 });
}

let tick = 0;
function hudTick(): void {
  tick++;
  const now = system.currentTick;
  for (const p of players()) {
    try {
      const d = pdata(p);
      // Regeneration (jede Sekunde)
      if (tick % 2 === 0) {
        const s = stats(p, now);
        setMana(p, getMana(p) + s.manaRegen);
        if (s.regen > 0) healRpg(p, s.maxHp * s.regen);
      }
      if (tick % 6 === 0) updateWaypoints(p);
      if (!d.cls && !d.settings.hud) continue;
      if (!d.settings.hud) continue;
      const s = stats(p, now);
      const hp = hpInfo(p);
      const mana = getMana(p);
      const xp = xpProgress(p);
      const sh = getShield(p);
      let line1 = `§c❤ ${fmt(hp.cur)}/${fmt(hp.max)}${sh > 0 ? ` §5(+${fmt(sh)})` : ""}  §9✦ ${fmt(mana)}/${fmt(s.maxMana)}  §eLv ${xp.level} §7${bar(xp.cur / xp.need, 8)} ${Math.floor((xp.cur / xp.need) * 100)}%`;
      if (!d.cls) line1 = `§c❤ ${fmt(hp.cur)}/${fmt(hp.max)}  §eLv ${xp.level}`;
      const lines = [line1];
      const tgt = currentTarget(p);
      if (tgt) {
        let nav = "";
        if (tgt.loc && (tgt.loc.d ?? "minecraft:overworld") === p.dimension.id) {
          const dist = V.dist2d(p.location, tgt.loc);
          const dy = tgt.loc.y - p.location.y;
          nav = dist > 4 ? ` §7· §f${fmt(dist)} m ${arrowTo(p, tgt.loc)}${Math.abs(dy) > 8 ? (dy > 0 ? " §a▲" : " §c▼") : ""}` : " §a✓";
          if (d.settings.wisp && dist > 6 && tick % 2 === 0) wisp(p, tgt.loc);
        } else if (tgt.loc) nav = " §7· §5andere Dimension";
        lines.push(`➤ ${tgt.text}${nav}`);
      }
      const ti = targetInfo.get(p.id);
      if (ti && now - ti.t < 70) {
        const e = world.getEntity(ti.id);
        if (e && isValid(e)) {
          const hpm = mobHp(e);
          const mi = getInfo(e);
          if (hpm) lines.push(`${mi?.elite ? "§6★ " : "§f"}${mobName(e)} §7Lv ${mi?.lvl ?? 1}  §c${bar(hpm.cur / Math.max(1, hpm.max), 10, "█", "░")} §f${fmt(hpm.cur)}`);
        }
      }
      p.onScreenDisplay.setActionBar(lines.join("\n"));
    } catch {
      /* Spieler im Übergang */
    }
  }
}

function wisp(p: Player, target: Vector3): void {
  const dir = V.flat(V.sub(target, p.location));
  const head = p.getHeadLocation();
  for (const step of [2.2, 3.4, 4.6]) {
    const pos = V.add(head, { x: dir.x * step, y: -0.4 + Math.sin((system.currentTick + step * 10) / 6) * 0.15, z: dir.z * step });
    try {
      p.spawnParticle("cdw:wisp", pos);
    } catch {
      /* ignorieren */
    }
  }
}

export function refreshHud(): void {
  for (const p of players()) updateWaypoints(p);
}

export function clearWaypoints(p: Player): void {
  try {
    p.locatorBar.removeAllWaypoints();
  } catch {
    /* ignorieren */
  }
  waypoints.delete(p.id);
}

export function forgetHud(id: string): void {
  waypoints.delete(id);
}

export function initHud(): void {
  system.runInterval(hudTick, 10);
  void health;
}
