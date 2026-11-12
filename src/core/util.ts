import { Entity, Player, Vector3, world, system, Dimension, MolangVariableMap } from "@minecraft/server";

export const V = {
  add: (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (a: Vector3, s: number): Vector3 => ({ x: a.x * s, y: a.y * s, z: a.z * s }),
  len: (a: Vector3): number => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z),
  dist: (a: Vector3, b: Vector3): number => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2),
  dist2d: (a: Vector3, b: Vector3): number => Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2),
  norm: (a: Vector3): Vector3 => {
    const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1;
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  },
  flat: (a: Vector3): Vector3 => {
    const l = Math.sqrt(a.x * a.x + a.z * a.z) || 1;
    return { x: a.x / l, y: 0, z: a.z / l };
  },
  floor: (a: Vector3): Vector3 => ({ x: Math.floor(a.x), y: Math.floor(a.y), z: Math.floor(a.z) }),
  center: (a: Vector3): Vector3 => ({ x: Math.floor(a.x) + 0.5, y: Math.floor(a.y), z: Math.floor(a.z) + 0.5 }),
  rotY: (a: Vector3, deg: number): Vector3 => {
    const r = (deg * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return { x: a.x * c - a.z * s, y: a.y, z: a.x * s + a.z * c };
  },
};

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
export function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function weighted<T extends { weight: number }>(arr: readonly T[]): T {
  const total = arr.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of arr) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return arr[arr.length - 1];
}
export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

/** Deterministischer Zufall (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function bar(frac: number, len = 10, full = "▰", empty = "▱"): string {
  const f = clamp(Math.round(frac * len), 0, len);
  return full.repeat(f) + empty.repeat(len - f);
}

export function isValid(e: Entity | undefined): e is Entity {
  try {
    return !!e && e.isValid;
  } catch {
    return false;
  }
}

export function safe<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

export function log(...args: unknown[]): void {
  console.warn("[CdW] " + args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
}

export function particle(dim: Dimension, id: string, loc: Vector3, vars?: MolangVariableMap): void {
  try {
    dim.spawnParticle(id, loc, vars);
  } catch {
    /* Chunk nicht geladen */
  }
}

export function ring(dim: Dimension, id: string, center: Vector3, radius: number, count = 16): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    particle(dim, id, { x: center.x + Math.cos(a) * radius, y: center.y, z: center.z + Math.sin(a) * radius });
  }
}

export function sound(target: Player | Dimension, id: string, loc?: Vector3, pitch = 1, volume = 1): void {
  try {
    if (target instanceof Player) target.playSound(id, { pitch, volume });
    else if (loc) target.playSound(id, loc, { pitch, volume });
  } catch {
    /* ignorieren */
  }
}

export function players(): Player[] {
  return world.getAllPlayers().filter((p) => isValid(p));
}

export function nearbyPlayers(loc: Vector3, dim: Dimension, radius: number): Player[] {
  return dim.getPlayers({ location: loc, maxDistance: radius });
}

/** Richtungspfeil relativ zur Blickrichtung. */
export function arrowTo(player: Player, target: Vector3): string {
  const rot = player.getRotation();
  const d = V.sub(target, player.location);
  const targetYaw = (Math.atan2(-d.x, d.z) * 180) / Math.PI; // Minecraft-Yaw
  let rel = targetYaw - rot.y;
  while (rel > 180) rel -= 360;
  while (rel < -180) rel += 360;
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const idx = Math.round(((rel + 360) % 360) / 45) % 8;
  return arrows[idx];
}

export function later(ticks: number, fn: () => void): void {
  system.runTimeout(() => {
    try {
      fn();
    } catch (e) {
      log("Fehler (later):", String(e));
    }
  }, ticks);
}

export function run(fn: () => void): void {
  system.run(() => {
    try {
      fn();
    } catch (e) {
      log("Fehler (run):", String(e), (e as Error)?.stack ?? "");
    }
  });
}

export function msg(p: Player, text: string): void {
  try {
    p.sendMessage(text);
  } catch {
    /* Spieler weg */
  }
}

export function broadcast(text: string): void {
  try {
    world.sendMessage(text);
  } catch {
    /* ignorieren */
  }
}

export function title(p: Player, t: string, sub = "", fadeIn = 10, stay = 50, fadeOut = 15): void {
  try {
    p.onScreenDisplay.setTitle(t, { subtitle: sub, fadeInDuration: fadeIn, stayDuration: stay, fadeOutDuration: fadeOut });
  } catch {
    /* ignorieren */
  }
}

export const DIM = {
  overworld: () => world.getDimension("minecraft:overworld"),
};

export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}
export function weekNumber(): number {
  return Math.floor((Date.now() / 86400000 + 3) / 7);
}
