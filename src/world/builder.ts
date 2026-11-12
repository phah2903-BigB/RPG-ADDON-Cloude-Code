// Struktur-Baukasten: baut Bauwerke per Script, verteilt auf mehrere Ticks (runJob).
import { BlockPermutation, BlockVolume, Dimension, system, Vector3, world } from "@minecraft/server";
import { log, seeded } from "../core/util";

export type BlockSpec = string | { id: string; states?: Record<string, string | number | boolean> };
export type Palette = BlockSpec | { b: BlockSpec; w: number }[];

const permCache = new Map<string, BlockPermutation | null>();

export function perm(spec: BlockSpec): BlockPermutation | undefined {
  const key = typeof spec === "string" ? spec : spec.id + JSON.stringify(spec.states ?? {});
  let p = permCache.get(key);
  if (p === undefined) {
    try {
      p = typeof spec === "string" ? BlockPermutation.resolve(spec as never) : BlockPermutation.resolve(spec.id as never, spec.states as never);
    } catch (e) {
      log("Unbekannter Block:", key, String(e));
      p = null;
    }
    permCache.set(key, p);
  }
  return p ?? undefined;
}

type Op = () => void;

export class Builder {
  readonly ops: Op[] = [];
  readonly rnd: () => number;
  /** Markierungen (z. B. Spawnpunkte), relativ zum Ursprung */
  readonly marks: Record<string, Vector3[]> = {};

  constructor(
    readonly dim: Dimension,
    readonly o: Vector3,
    seed = 1
  ) {
    this.rnd = seeded(seed);
  }

  abs(x: number, y: number, z: number): Vector3 {
    return { x: this.o.x + x, y: this.o.y + y, z: this.o.z + z };
  }

  mark(name: string, x: number, y: number, z: number): void {
    (this.marks[name] ??= []).push({ x, y, z });
  }

  private pickFrom(p: Palette): BlockSpec {
    if (!Array.isArray(p)) return p;
    const total = p.reduce((s, e) => s + e.w, 0);
    let r = this.rnd() * total;
    for (const e of p) {
      r -= e.w;
      if (r <= 0) return e.b;
    }
    return p[p.length - 1].b;
  }

  private base(p: Palette): BlockSpec {
    if (!Array.isArray(p)) return p;
    return p.reduce((a, b) => (b.w > a.w ? b : a)).b;
  }

  /** Quader füllen (inklusive Grenzen). Gemischte Paletten werden nachträglich gesprenkelt. */
  box(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p: Palette): this {
    const [ax, bx] = [Math.min(x1, x2), Math.max(x1, x2)];
    const [ay, by] = [Math.min(y1, y2), Math.max(y1, y2)];
    const [az, bz] = [Math.min(z1, z2), Math.max(z1, z2)];
    const b = this.base(p);
    // in handliche Stücke teilen (Füllgrenze)
    const step = 24;
    for (let x = ax; x <= bx; x += step)
      for (let z = az; z <= bz; z += step)
        for (let y = ay; y <= by; y += step) {
          const ex = Math.min(bx, x + step - 1);
          const ez = Math.min(bz, z + step - 1);
          const ey = Math.min(by, y + step - 1);
          this.ops.push(() => {
            const pm = perm(b);
            if (!pm) return;
            this.dim.fillBlocks(new BlockVolume(this.abs(x, y, z), this.abs(ex, ey, ez)), pm, { ignoreChunkBoundErrors: true });
          });
        }
    if (Array.isArray(p) && p.length > 1) {
      const vol = (bx - ax + 1) * (by - ay + 1) * (bz - az + 1);
      if (vol <= 6000) {
        for (let x = ax; x <= bx; x++)
          for (let y = ay; y <= by; y++)
            for (let z = az; z <= bz; z++) {
              const s = this.pickFrom(p);
              if (s !== b) this.set(x, y, z, s);
            }
      }
    }
    return this;
  }

  /** Hohler Quader (Wände, Boden, Decke). */
  room(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, wall: Palette, floor?: Palette, ceil?: Palette): this {
    this.box(x1, y1, z1, x2, y2, z2, wall);
    this.box(x1 + 1, y1 + 1, z1 + 1, x2 - 1, y2 - 1, z2 - 1, "minecraft:air");
    if (floor) this.box(x1 + 1, y1, z1 + 1, x2 - 1, y1, z2 - 1, floor);
    if (ceil) this.box(x1 + 1, y2, z1 + 1, x2 - 1, y2, z2 - 1, ceil);
    return this;
  }

  set(x: number, y: number, z: number, p: Palette): this {
    const s = Array.isArray(p) ? this.pickFrom(p) : p;
    this.ops.push(() => {
      const pm = perm(s);
      if (!pm) return;
      try {
        this.dim.setBlockPermutation(this.abs(x, y, z), pm);
      } catch {
        /* Chunk nicht geladen */
      }
    });
    return this;
  }

  /** Zylinder (vertikal). */
  cyl(cx: number, y1: number, cz: number, r: number, h: number, p: Palette, hollow = false): this {
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++)
      for (let z = -Math.ceil(r); z <= Math.ceil(r); z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d > r + 0.3) continue;
        if (hollow && d < r - 0.7) continue;
        this.box(cx + x, y1, cz + z, cx + x, y1 + h - 1, cz + z, p);
      }
    return this;
  }

  /** Scheibe (z. B. Boden einer Arena). */
  disc(cx: number, y: number, cz: number, r: number, p: Palette): this {
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
      let zmax = -1;
      for (let z = 0; z <= Math.ceil(r); z++) if (Math.sqrt(x * x + z * z) <= r + 0.3) zmax = z;
      if (zmax >= 0) this.box(cx + x, y, cz - zmax, cx + x, y, cz + zmax, p);
    }
    return this;
  }

  /** Kugel / Ellipsoid (für Blätterkronen). */
  blob(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, p: Palette, density = 1): this {
    for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++)
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++)
        for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z++) {
          const d = (x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz);
          if (d > 1) continue;
          if (density < 1 && d > 0.6 && this.rnd() > density) continue;
          this.set(cx + x, cy + y, cz + z, p);
        }
    return this;
  }

  /** Linie aus Blöcken (z. B. Äste). */
  line(a: Vector3, b: Vector3, p: Palette, thick = 0): this {
    const n = Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), Math.abs(b.z - a.z))) || 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.round(a.x + (b.x - a.x) * t);
      const y = Math.round(a.y + (b.y - a.y) * t);
      const z = Math.round(a.z + (b.z - a.z) * t);
      if (thick > 0) this.box(x - thick, y, z - thick, x + thick, y, z + thick, p);
      else this.set(x, y, z, p);
    }
    return this;
  }

  /** Beliebige Aktion (z. B. Entity spawnen) am Ende einreihen. */
  then(fn: Op): this {
    this.ops.push(fn);
    return this;
  }

  /** Startet den Bau als Job. Callback nach Fertigstellung. */
  run(onDone?: () => void, perTick = 40): void {
    const ops = this.ops;
    function* job(): Generator<void, void, void> {
      let n = 0;
      for (const op of ops) {
        try {
          op();
        } catch (e) {
          log("Bau-Fehler:", String(e));
        }
        if (++n % perTick === 0) yield;
      }
      if (onDone) {
        try {
          onDone();
        } catch (e) {
          log("Bau-Abschluss-Fehler:", String(e));
        }
      }
    }
    system.runJob(job());
  }
}

/** Lädt einen Bereich per Ticking-Area und ruft danach fn auf. */
export async function withLoadedArea(id: string, dim: Dimension, from: Vector3, to: Vector3, fn: () => Promise<void> | void): Promise<void> {
  const tam = world.tickingAreaManager;
  const tid = `cdw_${id}`.slice(0, 32);
  try {
    if (tam.hasTickingArea(tid)) tam.removeTickingArea(tid);
    await tam.createTickingArea(tid, { dimension: dim, from, to });
  } catch (e) {
    log("Ticking-Area konnte nicht erstellt werden:", String(e));
  }
  try {
    await fn();
  } finally {
    system.runTimeout(() => {
      try {
        if (tam.hasTickingArea(tid)) tam.removeTickingArea(tid);
      } catch {
        /* ignorieren */
      }
    }, 400);
  }
}

/** Findet die Oberfläche (oberster fester Block, kein Laub/Holz/Wasser) an x/z. */
export function surfaceY(dim: Dimension, x: number, z: number): { y: number; water: boolean } | undefined {
  try {
    let b = dim.getTopmostBlock({ x, z });
    let guard = 0;
    while (b && guard++ < 40) {
      const id = b.typeId;
      if (id.includes("leaves") || id.includes("log") || id.includes("wood") || id === "minecraft:snow_layer" || id.includes("vine") || id.includes("grass") && !id.includes("block") || id.includes("flower") || id.includes("fern") || id.includes("bush") || id.includes("mushroom") || id === "minecraft:air") {
        b = b.below();
        continue;
      }
      break;
    }
    if (!b) return undefined;
    return { y: b.y, water: b.isLiquid || b.typeId.includes("water") || b.typeId.includes("ice") && b.typeId !== "minecraft:packed_ice" };
  } catch {
    return undefined;
  }
}
