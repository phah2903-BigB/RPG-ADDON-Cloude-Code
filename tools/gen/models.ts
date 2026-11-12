// 3D-Modelle (Blockbench-kompatibel) als kompakte Definitionen + automatische Box-UV-Packung.

export type Mat = string; // Malmaterial (wird im Texturgenerator ausgewertet)

export interface Cube {
  o: [number, number, number];
  s: [number, number, number];
  mat: Mat;
  inf?: number;
  mirror?: boolean;
  uv?: [number, number];
  rot?: [number, number, number];
  pivot?: [number, number, number];
}

export interface Bone {
  name: string;
  parent?: string;
  pivot: [number, number, number];
  rot?: [number, number, number];
  cubes: Cube[];
}

export type AnimKind = "biped" | "quad" | "blob" | "hover" | "bird" | "spider" | "scorpion" | "toad" | "wyrm" | "npc" | "static" | "projectile" | "golem";

export interface Model {
  id: string;
  kind: AnimKind;
  bones: Bone[];
  texW: number;
  texH: number;
  bounds: [number, number]; // Breite, Höhe (Blöcke)
}

const c = (x: number, y: number, z: number, w: number, h: number, d: number, mat: Mat, extra: Partial<Cube> = {}): Cube => ({ o: [x, y, z], s: [w, h, d], mat, ...extra });
const b = (name: string, pivot: [number, number, number], cubes: Cube[], parent?: string, rot?: [number, number, number]): Bone => ({ name, pivot, cubes, parent, rot });

// ---------------- Humanoide ----------------
function humanoid(o: { head?: [number, number, number]; body?: [number, number, number]; arm?: number; leg?: number; legH?: number; armH?: number; mats: { head: Mat; body: Mat; arm: Mat; leg: Mat }; extra?: Bone[]; eyes?: Mat; eyeY?: number }): Bone[] {
  const [hw, hh, hd] = o.head ?? [8, 8, 8];
  const [bw, bh, bd] = o.body ?? [8, 12, 4];
  const aw = o.arm ?? 4;
  const lw = o.leg ?? 4;
  const lh = o.legH ?? 12;
  const ah = o.armH ?? bh;
  const top = lh + bh;
  const bones: Bone[] = [
    b("root", [0, 0, 0], []),
    b("body", [0, top, 0], [c(-bw / 2, lh, -bd / 2, bw, bh, bd, o.mats.body)], "root"),
    b("head", [0, top, 0], [c(-hw / 2, top, -hd / 2, hw, hh, hd, o.mats.head)], "body"),
    b("arm_r", [-(bw / 2 + aw / 2), top - 2, 0], [c(-(bw / 2 + aw), top - ah, -aw / 2, aw, ah, aw, o.mats.arm)], "body"),
    b("arm_l", [bw / 2 + aw / 2, top - 2, 0], [c(bw / 2, top - ah, -aw / 2, aw, ah, aw, o.mats.arm, { mirror: true })], "body"),
    b("leg_r", [-lw / 2, lh, 0], [c(-lw, 0, -lw / 2, lw, lh, lw, o.mats.leg)], "root"),
    b("leg_l", [lw / 2, lh, 0], [c(0, 0, -lw / 2, lw, lh, lw, o.mats.leg, { mirror: true })], "root"),
  ];
  if (o.eyes) {
    const ey = top + (o.eyeY ?? Math.round(hh * 0.45));
    bones.find((x) => x.name === "head")!.cubes.push(c(-3, ey, -hd / 2 - 1, 2, 1, 1, o.eyes), c(1, ey, -hd / 2 - 1, 2, 1, 1, o.eyes));
  }
  if (o.extra) bones.push(...o.extra);
  return bones;
}

function legs(n: number, side: number, y: number, z0: number, dz: number, len: number, mat: Mat, prefix = "leg"): Bone[] {
  const out: Bone[] = [];
  for (let i = 0; i < n; i++) {
    const z = z0 + i * dz;
    for (const s of [-1, 1]) {
      const name = `${prefix}${i}${s < 0 ? "r" : "l"}`;
      const x0 = s * side;
      out.push(b(name, [x0, y, z], [c(s < 0 ? x0 - len : x0, y - 1, z - 0.5 - 0.5, len, 2, 2, mat)], "body", [0, 0, s * -28]));
    }
  }
  return out;
}

export const MODELS: Model[] = [
  {
    id: "blob",
    kind: "blob",
    texW: 64,
    texH: 64,
    bounds: [1, 1.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 0, 0], [c(-5, 1, -5, 10, 9, 10, "moss"), c(-4, 10, -4, 8, 1, 8, "moss_light"), c(-3, 5, -6, 2, 2, 1, "eye"), c(1, 5, -6, 2, 2, 1, "eye"), c(-2, 2, -6, 4, 1, 1, "mouth")], "root"),
      b("sprout", [0, 11, 0], [c(-1, 11, -1, 2, 3, 2, "stem"), c(-5, 13, -1, 4, 1, 3, "leaf"), c(1, 13, -2, 4, 1, 3, "leaf")], "body"),
      b("leg_r", [-2, 1, 0], [c(-4, 0, -3, 3, 1, 4, "moss_dark")], "root"),
      b("leg_l", [2, 1, 0], [c(1, 0, -3, 3, 1, 4, "moss_dark")], "root"),
    ],
  },
  {
    id: "quad_wolf",
    kind: "quad",
    texW: 64,
    texH: 64,
    bounds: [1.4, 1.4],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 10, 0], [c(-3, 7, -6, 6, 6, 12, "fur"), c(-1, 13, -4, 1, 3, 1, "thorn"), c(0, 13, -1, 1, 4, 1, "thorn"), c(-1, 13, 2, 1, 3, 1, "thorn"), c(1, 12, 4, 1, 2, 1, "thorn")], "root"),
      b("head", [0, 11, -6], [c(-3.5, 9, -12, 7, 6, 6, "fur"), c(-2, 9, -15, 4, 3, 3, "fur_light"), c(-3, 15, -10, 2, 2, 1, "fur_dark"), c(1, 15, -10, 2, 2, 1, "fur_dark"), c(-3, 12, -13, 2, 1, 1, "eye"), c(1, 12, -13, 2, 1, 1, "eye"), c(-1, 9, -16, 2, 1, 1, "nose")], "body"),
      b("tail", [0, 12, 6], [c(-1, 9, 6, 2, 2, 7, "fur")], "body", [35, 0, 0]),
      b("leg_fr", [-2, 7, -4], [c(-3, 0, -5, 2, 7, 2, "fur_dark")], "root"),
      b("leg_fl", [2, 7, -4], [c(1, 0, -5, 2, 7, 2, "fur_dark")], "root"),
      b("leg_br", [-2, 7, 4], [c(-3, 0, 3, 2, 7, 2, "fur_dark")], "root"),
      b("leg_bl", [2, 7, 4], [c(1, 0, 3, 2, 7, 2, "fur_dark")], "root"),
    ],
  },
  {
    id: "treant",
    kind: "biped",
    texW: 128,
    texH: 64,
    bounds: [1.6, 2.6],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 12, 0], [c(-5, 12, -3, 10, 14, 6, "bark"), c(-6, 20, -2, 2, 4, 3, "moss"), c(3, 15, -4, 3, 3, 1, "moss")], "root"),
      b("head", [0, 26, 0], [c(-4, 26, -4, 8, 7, 8, "bark_light"), c(-6, 32, -6, 12, 6, 12, "leaf"), c(-3, 29, -5, 2, 1, 1, "eye"), c(1, 29, -5, 2, 1, 1, "eye"), c(-2, 27, -5, 4, 1, 1, "mouth"), c(-1, 37, -1, 2, 4, 2, "bark")], "body"),
      b("arm_r", [-6, 24, 0], [c(-9, 10, -2, 3, 15, 3, "bark"), c(-10, 7, -2, 1, 4, 1, "bark_dark"), c(-8, 7, 0, 1, 3, 1, "bark_dark")], "body"),
      b("arm_l", [6, 24, 0], [c(6, 10, -2, 3, 15, 3, "bark", { mirror: true }), c(9, 7, -2, 1, 4, 1, "bark_dark"), c(7, 7, 0, 1, 3, 1, "bark_dark")], "body"),
      b("leg_r", [-3, 12, 0], [c(-5, 0, -2, 4, 12, 4, "bark"), c(-6, 0, -4, 6, 2, 3, "root")], "root"),
      b("leg_l", [3, 12, 0], [c(1, 0, -2, 4, 12, 4, "bark", { mirror: true }), c(0, 0, -4, 6, 2, 3, "root")], "root"),
    ],
  },
  {
    id: "humanoid_big",
    kind: "biped",
    texW: 64,
    texH: 64,
    bounds: [1.2, 2.2],
    bones: humanoid({ mats: { head: "skin", body: "cloth", arm: "skin", leg: "cloth_dark" }, eyes: "eye", extra: [b("growth", [0, 24, 0], [c(-6, 21, -3, 3, 3, 6, "moss"), c(4, 18, -2, 2, 4, 4, "moss"), c(-2, 32, -3, 4, 1, 4, "moss")], "body")] }),
  },
  {
    id: "humanoid_thin",
    kind: "biped",
    texW: 64,
    texH: 64,
    bounds: [1.2, 2.2],
    bones: humanoid({ arm: 3, mats: { head: "wrap", body: "cloth", arm: "wrap", leg: "wrap" }, eyes: "eye", extra: [b("hood", [0, 24, 0], [c(-4.5, 24, -4.5, 9, 9, 9, "cloth_dark", { inf: 0.3 }), c(-1, 33, -1, 2, 2, 2, "gold")], "head"), b("sash", [0, 18, 0], [c(-4, 16, -2.5, 8, 2, 5, "gold")], "body")] }),
  },
  {
    id: "humanoid_small",
    kind: "biped",
    texW: 64,
    texH: 64,
    bounds: [1, 1.4],
    bones: humanoid({ head: [8, 7, 7], body: [6, 7, 3], arm: 3, leg: 3, legH: 6, armH: 8, mats: { head: "skin", body: "cloth", arm: "skin", leg: "cloth_dark" }, eyes: "eye", eyeY: 3, extra: [b("ears", [0, 16, 0], [c(-7, 16, -1, 3, 2, 1, "skin"), c(4, 16, -1, 3, 2, 1, "skin"), c(-1, 15, -5, 2, 2, 1, "skin_dark")], "head")] }),
  },
  {
    id: "toad",
    kind: "toad",
    texW: 64,
    texH: 64,
    bounds: [1.4, 1.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 4, 0], [c(-6, 2, -6, 12, 8, 13, "toad"), c(-6, 2, -9, 12, 5, 3, "toad_belly"), c(-6, 9, -7, 3, 3, 3, "eye_big"), c(3, 9, -7, 3, 3, 3, "eye_big"), c(-4, 10, -1, 3, 1, 3, "wart"), c(2, 10, 2, 2, 1, 2, "wart")], "root"),
      b("leg_bl", [-6, 3, 3], [c(-9, 0, 1, 3, 4, 6, "toad_dark")], "root"),
      b("leg_br", [6, 3, 3], [c(6, 0, 1, 3, 4, 6, "toad_dark")], "root"),
      b("leg_fl", [-5, 3, -5], [c(-7, 0, -7, 2, 3, 2, "toad_dark")], "root"),
      b("leg_fr", [5, 3, -5], [c(5, 0, -7, 2, 3, 2, "toad_dark")], "root"),
    ],
  },
  {
    id: "wraith",
    kind: "hover",
    texW: 64,
    texH: 64,
    bounds: [1.2, 2.0],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 14, 0], [c(-4, 6, -2.5, 8, 14, 5, "robe"), c(-3, 1, -2, 6, 5, 4, "robe_fade")], "root"),
      b("head", [0, 20, 0], [c(-4.5, 20, -4.5, 9, 8, 9, "robe_dark"), c(-3, 23, -5, 2, 1, 1, "eye"), c(1, 23, -5, 2, 1, 1, "eye")], "body"),
      b("arm_r", [-5, 19, 0], [c(-7, 8, -1.5, 3, 11, 3, "robe"), c(-7, 6, -1.5, 3, 2, 3, "bone")], "body"),
      b("arm_l", [5, 19, 0], [c(4, 8, -1.5, 3, 11, 3, "robe", { mirror: true }), c(4, 6, -1.5, 3, 2, 3, "bone")], "body"),
    ],
  },
  {
    id: "scorpion",
    kind: "scorpion",
    texW: 64,
    texH: 64,
    bounds: [1.8, 1.4],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 5, 0], [c(-5, 3, -6, 10, 5, 12, "chitin"), c(-4, 3, -9, 8, 4, 3, "chitin_dark"), c(-3, 6, -10, 1, 1, 1, "eye"), c(2, 6, -10, 1, 1, 1, "eye"), c(-4, 8, -4, 8, 1, 8, "chitin_light")], "root"),
      b("claw_r", [-5, 5, -8], [c(-9, 3, -13, 3, 3, 5, "chitin"), c(-11, 3, -17, 5, 3, 4, "chitin_dark")], "body"),
      b("claw_l", [5, 5, -8], [c(6, 3, -13, 3, 3, 5, "chitin", { mirror: true }), c(6, 3, -17, 5, 3, 4, "chitin_dark")], "body"),
      b("tail1", [0, 7, 6], [c(-1.5, 6, 6, 3, 3, 5, "chitin")], "body", [-25, 0, 0]),
      b("tail2", [0, 7.5, 11], [c(-1.5, 6, 11, 3, 3, 5, "chitin")], "tail1", [-50, 0, 0]),
      b("tail3", [0, 7.5, 16], [c(-1, 6.5, 16, 2, 2, 4, "chitin_light"), c(-0.5, 6, 20, 1, 3, 1, "sting")], "tail2", [-60, 0, 0]),
      ...legs(3, 5, 5, -3, 4, 6, "chitin_dark"),
    ],
  },
  {
    id: "wisp",
    kind: "hover",
    texW: 64,
    texH: 32,
    bounds: [1, 1.6],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 9, 0], [c(-3, 6, -3, 6, 6, 6, "ember_core"), c(-2, 12, -2, 4, 4, 4, "ember"), c(-1, 16, -1, 2, 3, 2, "ember_tip"), c(-2, 8, -3.5, 1, 1, 1, "eye_dark"), c(1, 8, -3.5, 1, 1, 1, "eye_dark")], "root"),
      b("arm_r", [-5, 9, 0], [c(-7, 7, -1, 2, 2, 2, "ember")], "body"),
      b("arm_l", [5, 9, 0], [c(5, 9, -1, 2, 2, 2, "ember")], "body"),
    ],
  },
  {
    id: "troll",
    kind: "golem",
    texW: 128,
    texH: 64,
    bounds: [2.2, 3.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 14, 0], [c(-8, 14, -4, 16, 16, 8, "troll_skin"), c(-6, 20, -5, 12, 8, 1, "fur"), c(-4, 30, 0, 3, 5, 3, "ice"), c(1, 29, 1, 3, 6, 3, "ice")], "root"),
      b("head", [0, 29, -3], [c(-5, 28, -10, 10, 9, 8, "troll_skin"), c(-3, 32, -11, 2, 1, 1, "eye"), c(1, 32, -11, 2, 1, 1, "eye"), c(-4, 28, -11, 1, 3, 1, "tusk"), c(3, 28, -11, 1, 3, 1, "tusk"), c(-2, 30, -12, 4, 2, 2, "troll_dark")], "body"),
      b("arm_r", [-9, 28, 0], [c(-14, 6, -3, 5, 23, 6, "troll_skin"), c(-15, 4, -4, 7, 4, 8, "ice")], "body"),
      b("arm_l", [9, 28, 0], [c(9, 6, -3, 5, 23, 6, "troll_skin", { mirror: true }), c(8, 4, -4, 7, 4, 8, "ice")], "body"),
      b("leg_r", [-4, 14, 0], [c(-7, 0, -3, 5, 14, 6, "fur")], "root"),
      b("leg_l", [4, 14, 0], [c(2, 0, -3, 5, 14, 6, "fur", { mirror: true })], "root"),
    ],
  },
  {
    id: "bird",
    kind: "bird",
    texW: 64,
    texH: 32,
    bounds: [1.4, 1],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 6, 0], [c(-3, 4, -4, 6, 5, 8, "feather"), c(-2, 5, 4, 4, 1, 5, "feather_dark")], "root"),
      b("head", [0, 8, -4], [c(-2.5, 7, -8, 5, 5, 4, "feather"), c(-1, 7, -10, 2, 2, 2, "beak"), c(-2.5, 9, -8.5, 1, 1, 1, "eye"), c(1.5, 9, -8.5, 1, 1, 1, "eye")], "body"),
      b("wing_r", [-3, 8, -1], [c(-12, 8, -3, 9, 1, 6, "feather_dark")], "body"),
      b("wing_l", [3, 8, -1], [c(3, 8, -3, 9, 1, 6, "feather_dark", { mirror: true })], "body"),
      b("leg_r", [-1, 4, 0], [c(-2, 0, 0, 1, 4, 1, "beak")], "root"),
      b("leg_l", [1, 4, 0], [c(1, 0, 0, 1, 4, 1, "beak")], "root"),
    ],
  },
  {
    id: "spider",
    kind: "spider",
    texW: 64,
    texH: 64,
    bounds: [1.8, 1.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 6, 0], [c(-5, 3, -1, 10, 8, 12, "chitin"), c(-2, 11, 2, 3, 4, 3, "crystal"), c(1, 10, 6, 3, 3, 3, "crystal"), c(-4, 10, 7, 2, 3, 2, "crystal")], "root"),
      b("head", [0, 6, -1], [c(-4, 4, -7, 8, 6, 6, "chitin_dark"), c(-3, 7, -8, 2, 1, 1, "eye"), c(1, 7, -8, 2, 1, 1, "eye"), c(-1, 8, -8, 2, 1, 1, "eye"), c(-2, 4, -8, 1, 2, 1, "fang"), c(1, 4, -8, 1, 2, 1, "fang")], "body"),
      ...legs(4, 4, 6, -4, 3, 12, "chitin_dark"),
    ],
  },
  {
    id: "crawler",
    kind: "quad",
    texW: 64,
    texH: 64,
    bounds: [1.4, 1.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 8, 0], [c(-4, 6, -6, 8, 6, 12, "shadow"), c(-2, 12, -3, 1, 2, 1, "shadow_spike"), c(1, 12, 1, 1, 3, 1, "shadow_spike")], "root"),
      b("head", [0, 9, -6], [c(-4, 5, -12, 8, 7, 7, "shadow_dark"), c(-3, 9, -13, 2, 2, 1, "eye_big"), c(1, 9, -13, 2, 2, 1, "eye_big"), c(-3, 5, -13, 6, 1, 1, "fang")], "body"),
      b("tail", [0, 10, 6], [c(-1, 9, 6, 2, 2, 8, "shadow")], "body", [20, 0, 0]),
      b("leg_fr", [-4, 8, -4], [c(-7, 0, -6, 3, 9, 3, "shadow_dark")], "root"),
      b("leg_fl", [4, 8, -4], [c(4, 0, -6, 3, 9, 3, "shadow_dark")], "root"),
      b("leg_br", [-4, 8, 4], [c(-7, 0, 3, 3, 9, 3, "shadow_dark")], "root"),
      b("leg_bl", [4, 8, 4], [c(4, 0, 3, 3, 9, 3, "shadow_dark")], "root"),
    ],
  },
  {
    id: "golem",
    kind: "golem",
    texW: 128,
    texH: 64,
    bounds: [2.2, 3.0],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 12, 0], [c(-9, 12, -5, 18, 18, 10, "stone"), c(-10, 16, -6, 4, 12, 2, "root"), c(5, 14, -6, 3, 10, 2, "root"), c(-3, 20, -6, 6, 6, 1, "core")], "root"),
      b("head", [0, 30, 0], [c(-4, 30, -6, 8, 7, 7, "stone_dark"), c(-3, 33, -7, 6, 1, 1, "eye"), c(-5, 36, -2, 2, 4, 2, "root"), c(3, 36, -1, 2, 5, 2, "root")], "body"),
      b("arm_r", [-10, 28, 0], [c(-16, 6, -4, 6, 22, 8, "stone"), c(-17, 10, -5, 2, 14, 2, "root")], "body"),
      b("arm_l", [10, 28, 0], [c(10, 6, -4, 6, 22, 8, "stone", { mirror: true }), c(15, 10, -5, 2, 14, 2, "root")], "body"),
      b("leg_r", [-4, 12, 0], [c(-7, 0, -3, 5, 12, 6, "stone_dark")], "root"),
      b("leg_l", [4, 12, 0], [c(2, 0, -3, 5, 12, 6, "stone_dark", { mirror: true })], "root"),
    ],
  },
  {
    id: "druid",
    kind: "biped",
    texW: 64,
    texH: 64,
    bounds: [1.4, 2.6],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 24, 0], [c(-4, 12, -2, 8, 12, 4, "robe"), c(-5, 0, -3, 10, 13, 6, "robe_dark")], "root"),
      b("head", [0, 24, 0], [c(-4, 24, -4, 8, 8, 8, "pale"), c(-4.5, 24, -4.5, 9, 9, 9, "robe", { inf: 0.25 }), c(-3, 27, -5, 2, 1, 1, "eye"), c(1, 27, -5, 2, 1, 1, "eye"), c(-6, 31, -1, 2, 6, 2, "antler"), c(4, 31, -1, 2, 6, 2, "antler"), c(-8, 35, -1, 3, 2, 2, "antler"), c(5, 35, -1, 3, 2, 2, "antler")], "body"),
      b("arm_r", [-5, 22, 0], [c(-8, 12, -2, 4, 12, 4, "robe"), c(-7, 0, -6, 1, 26, 1, "staff"), c(-8, 26, -7, 3, 3, 3, "core")], "body"),
      b("arm_l", [5, 22, 0], [c(4, 12, -2, 4, 12, 4, "robe", { mirror: true })], "body"),
      b("leg_r", [-2, 12, 0], [], "root"),
      b("leg_l", [2, 12, 0], [], "root"),
    ],
  },
  {
    id: "wyrm",
    kind: "wyrm",
    texW: 128,
    texH: 128,
    bounds: [4, 4],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 12, 0], [c(-6, 4, -6, 12, 12, 12, "scale")], "root"),
      b("head", [0, 14, -6], [c(-6, 12, -20, 12, 10, 14, "scale_dark"), c(-5, 8, -19, 10, 4, 12, "scale"), c(-5, 18, -21, 3, 2, 1, "eye"), c(2, 18, -21, 3, 2, 1, "eye"), c(-6, 22, -12, 2, 8, 2, "horn"), c(4, 22, -12, 2, 8, 2, "horn"), c(-4, 9, -21, 1, 3, 1, "fang"), c(3, 9, -21, 1, 3, 1, "fang")], "body"),
      b("seg1", [0, 10, 6], [c(-5, 4, 6, 10, 10, 10, "scale"), c(-1, 14, 8, 2, 4, 3, "horn")], "body"),
      b("seg2", [0, 9, 16], [c(-4, 4, 16, 8, 9, 9, "scale"), c(-1, 13, 18, 2, 3, 3, "horn")], "seg1"),
      b("seg3", [0, 8, 25], [c(-3, 4, 25, 6, 7, 8, "scale")], "seg2"),
      b("seg4", [0, 7, 33], [c(-2, 4, 33, 4, 5, 8, "scale_dark"), c(-3, 5, 40, 6, 1, 4, "horn")], "seg3"),
    ],
  },
  {
    id: "npc",
    kind: "npc",
    texW: 64,
    texH: 64,
    bounds: [1, 2.2],
    bones: [
      b("root", [0, 0, 0], []),
      b("body", [0, 24, 0], [c(-4, 12, -2, 8, 12, 4, "npc_body", { uv: [16, 16] })], "root"),
      b("head", [0, 24, 0], [c(-4, 24, -4, 8, 8, 8, "npc_head", { uv: [0, 0] }), c(-4, 24, -4, 8, 8, 8, "npc_hat", { uv: [32, 0], inf: 0.5 })], "body"),
      b("arm_r", [-5, 22, 0], [c(-8, 12, -2, 4, 12, 4, "npc_arm", { uv: [40, 16] })], "body"),
      b("arm_l", [5, 22, 0], [c(4, 12, -2, 4, 12, 4, "npc_arm", { uv: [32, 48] })], "body"),
      b("leg_r", [-1.9, 12, 0], [c(-3.9, 0, -2, 4, 12, 4, "npc_leg", { uv: [0, 16] })], "root"),
      b("leg_l", [1.9, 12, 0], [c(-0.1, 0, -2, 4, 12, 4, "npc_leg", { uv: [16, 48] })], "root"),
    ],
  },
  // ---------- Projektile ----------
  { id: "orb", kind: "projectile", texW: 16, texH: 16, bounds: [0.5, 0.5], bones: [b("root", [0, 2, 0], [c(-2, 0, -2, 4, 4, 4, "proj")])] },
  { id: "thorn", kind: "projectile", texW: 32, texH: 16, bounds: [0.5, 0.5], bones: [b("root", [0, 1, 0], [c(-0.5, 0.5, -4, 1, 1, 8, "proj"), c(-1.5, 0, 2, 3, 2, 1, "proj")])] },
  { id: "shard", kind: "projectile", texW: 32, texH: 16, bounds: [0.6, 0.6], bones: [b("root", [0, 1, 0], [c(-1, 0, -5, 2, 2, 10, "proj")])] },
  { id: "arrow", kind: "projectile", texW: 32, texH: 16, bounds: [0.6, 0.6], bones: [b("root", [0, 1, 0], [c(-0.5, 0.5, -5, 1, 1, 10, "proj"), c(-1.5, 0, 3, 3, 2, 2, "proj_tip")])] },
];

// ---------- Rüstungs-Modelle (Spieler-Skelett) ----------
export const ARMOR_MODELS: Model[] = [];

// ---------- Block-Modelle ----------
export const BLOCK_MODELS: { id: string; texW: number; texH: number; cubes: Cube[] }[] = [
  { id: "wegstein", texW: 64, texH: 64, cubes: [c(-7, 0, -7, 14, 3, 14, "stone_base"), c(-4, 3, -4, 8, 22, 8, "stone_rune"), c(-5, 25, -5, 10, 3, 10, "stone_base")] },
  { id: "kopfgeldbrett", texW: 64, texH: 64, cubes: [c(-7, 0, -1, 2, 16, 2, "wood"), c(5, 0, -1, 2, 16, 2, "wood"), c(-8, 6, -1.5, 16, 12, 1, "board"), c(-8, 18, -2, 16, 2, 2, "wood")] },
  { id: "altar", texW: 64, texH: 64, cubes: [c(-8, 0, -8, 16, 4, 16, "stone_base"), c(-5, 4, -5, 10, 8, 10, "stone_rune"), c(-7, 12, -7, 14, 2, 14, "stone_base")] },
  { id: "wurzelherz", texW: 64, texH: 64, cubes: [c(-5, 0, -5, 10, 12, 10, "heart"), c(-3, 12, -3, 6, 4, 6, "heart"), c(-7, 0, -2, 2, 8, 4, "root"), c(5, 0, -2, 2, 8, 4, "root")] },
];

// ---------- UV-Packung ----------
export function boxUvSize(cb: Cube): [number, number] {
  const [w, h, d] = cb.s.map((v) => Math.max(1, Math.ceil(v)));
  return [2 * (d + w), d + h];
}

export function packUv(cubes: Cube[], texW: number, texH: number, id: string): void {
  // Feste UVs (z. B. Spieler-Skin-Layout) bleiben unverändert
  const free = cubes.filter((cb) => !cb.uv);
  const used: { x: number; y: number; w: number; h: number }[] = cubes.filter((cb) => cb.uv).map((cb) => ({ x: cb.uv![0], y: cb.uv![1], w: boxUvSize(cb)[0], h: boxUvSize(cb)[1] }));
  free.sort((a, b) => boxUvSize(b)[1] - boxUvSize(a)[1]);
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const cb of free) {
    const [w, h] = boxUvSize(cb);
    let placed = false;
    while (!placed) {
      if (x + w > texW) {
        x = 0;
        y += rowH;
        rowH = 0;
      }
      if (y + h > texH) throw new Error(`UV-Platz reicht nicht für Modell ${id} (${texW}x${texH})`);
      const overlap = used.some((r) => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y);
      if (overlap) {
        x += 1;
        continue;
      }
      cb.uv = [x, y];
      used.push({ x, y, w, h });
      x += w;
      rowH = Math.max(rowH, h);
      placed = true;
    }
  }
}

function packGrow(cubes: Cube[], m: { texW: number; texH: number; id: string }): void {
  const fixed = cubes.filter((cb) => cb.uv).map((cb) => cb.uv);
  for (let tries = 0; tries < 6; tries++) {
    try {
      cubes.forEach((cb, i) => {
        if (!fixed.includes(cb.uv)) cb.uv = undefined;
        void i;
      });
      packUv(cubes, m.texW, m.texH, m.id);
      return;
    } catch {
      if (m.texH < m.texW) m.texH *= 2;
      else m.texW *= 2;
    }
  }
  throw new Error(`UV-Packung unmöglich: ${m.id}`);
}

export function geometryJson(m: Model): object {
  const all = m.bones.flatMap((bn) => bn.cubes);
  packGrow(all, m);
  return {
    format_version: "1.12.0",
    "minecraft:geometry": [
      {
        description: { identifier: `geometry.cdw.${m.id}`, texture_width: m.texW, texture_height: m.texH, visible_bounds_width: m.bounds[0] + 1, visible_bounds_height: m.bounds[1] + 1, visible_bounds_offset: [0, m.bounds[1] / 2, 0] },
        bones: m.bones.map((bn) => {
          const o: Record<string, unknown> = { name: bn.name, pivot: bn.pivot };
          if (bn.parent) o.parent = bn.parent;
          if (bn.rot) o.rotation = bn.rot;
          if (bn.cubes.length)
            o.cubes = bn.cubes.map((cb) => {
              const co: Record<string, unknown> = { origin: cb.o, size: cb.s, uv: cb.uv };
              if (cb.inf) co.inflate = cb.inf;
              if (cb.mirror) co.mirror = true;
              if (cb.rot) {
                co.rotation = cb.rot;
                co.pivot = cb.pivot ?? cb.o;
              }
              return co;
            });
          return o;
        }),
      },
    ],
  };
}

export function blockGeometryJson(m: (typeof BLOCK_MODELS)[number]): object {
  packGrow(m.cubes, m);
  return {
    format_version: "1.12.0",
    "minecraft:geometry": [
      {
        description: { identifier: `geometry.cdw.${m.id}`, texture_width: m.texW, texture_height: m.texH, visible_bounds_width: 2, visible_bounds_height: 2.5, visible_bounds_offset: [0, 0.75, 0] },
        bones: [{ name: "root", pivot: [0, 0, 0], cubes: m.cubes.map((cb) => ({ origin: cb.o, size: cb.s, uv: cb.uv })) }],
      },
    ],
  };
}

/** Malinformationen für den Texturgenerator. */
export function paintInfo(texW: number, texH: number, cubes: Cube[]): object {
  return {
    texW,
    texH,
    cubes: cubes.map((cb) => ({ uv: cb.uv, s: cb.s.map((v) => Math.max(1, Math.ceil(v))), mat: cb.mat, mirror: !!cb.mirror, y: cb.o[1] + cb.s[1] / 2 })),
  };
}

// ---------------- Animationen ----------------
const WALK = "math.cos(q.modified_distance_moved * 38.17)";
const WALK2 = "math.cos(q.modified_distance_moved * 38.17 + 180)";

export function animationsFor(m: Model): Record<string, object> {
  const id = m.id;
  const has = (n: string) => m.bones.some((b) => b.name === n);
  const A: Record<string, object> = {};
  const look = has("head") ? { head: { rotation: ["q.target_x_rotation * 0.6", "q.target_y_rotation * 0.6", 0] } } : {};
  switch (m.kind) {
    case "biped":
    case "npc":
    case "golem": {
      const amp = m.kind === "golem" ? 35 : 45;
      A[`animation.cdw.${id}.walk`] = {
        loop: true,
        bones: {
          leg_r: { rotation: [`${WALK} * ${amp} * q.modified_move_speed`, 0, 0] },
          leg_l: { rotation: [`${WALK2} * ${amp} * q.modified_move_speed`, 0, 0] },
          arm_r: { rotation: [`${WALK2} * ${amp * 0.8} * q.modified_move_speed`, 0, 0] },
          arm_l: { rotation: [`${WALK} * ${amp * 0.8} * q.modified_move_speed`, 0, 0] },
        },
      };
      A[`animation.cdw.${id}.idle`] = {
        loop: true,
        bones: {
          ...look,
          body: { rotation: ["math.sin(q.life_time * 90) * 1.5", 0, 0] },
          arm_r: { rotation: [0, 0, "math.sin(q.life_time * 80) * 3 + 3"] },
          arm_l: { rotation: [0, 0, "-math.sin(q.life_time * 80) * 3 - 3"] },
        },
      };
      A[`animation.cdw.${id}.attack`] = {
        loop: false,
        animation_length: 0.5,
        bones: {
          arm_r: { rotation: { "0.0": [0, 0, 0], "0.15": [-110, 10, 0], "0.3": [20, 0, 0], "0.5": [0, 0, 0] } },
          arm_l: { rotation: { "0.0": [0, 0, 0], "0.15": [-90, -10, 0], "0.3": [15, 0, 0], "0.5": [0, 0, 0] } },
          body: { rotation: { "0.0": [0, 0, 0], "0.2": [8, 0, 0], "0.5": [0, 0, 0] } },
        },
      };
      break;
    }
    case "quad":
      A[`animation.cdw.${id}.walk`] = {
        loop: true,
        bones: {
          leg_fr: { rotation: [`${WALK} * 50 * q.modified_move_speed`, 0, 0] },
          leg_bl: { rotation: [`${WALK} * 50 * q.modified_move_speed`, 0, 0] },
          leg_fl: { rotation: [`${WALK2} * 50 * q.modified_move_speed`, 0, 0] },
          leg_br: { rotation: [`${WALK2} * 50 * q.modified_move_speed`, 0, 0] },
          ...(has("tail") ? { tail: { rotation: [0, "math.sin(q.life_time * 400) * 15", 0] } } : {}),
        },
      };
      A[`animation.cdw.${id}.idle`] = { loop: true, bones: { ...look, body: { position: [0, "math.sin(q.life_time * 120) * 0.2", 0] } } };
      A[`animation.cdw.${id}.attack`] = { loop: false, animation_length: 0.4, bones: { head: { rotation: { "0.0": [0, 0, 0], "0.15": [25, 0, 0], "0.4": [0, 0, 0] } } } };
      break;
    case "blob":
    case "toad":
      A[`animation.cdw.${id}.walk`] = {
        loop: true,
        bones: {
          root: { position: [0, `math.abs(math.sin(q.modified_distance_moved * 25)) * ${m.kind === "toad" ? 3 : 2.5}`, 0] },
          body: { scale: [1, `1 + math.sin(q.modified_distance_moved * 50) * 0.08`, 1] },
          ...(has("leg_bl") ? { leg_bl: { rotation: [`math.sin(q.modified_distance_moved * 50) * 30`, 0, 0] }, leg_br: { rotation: [`math.sin(q.modified_distance_moved * 50) * 30`, 0, 0] } } : {}),
        },
      };
      A[`animation.cdw.${id}.idle`] = { loop: true, bones: { body: { scale: [`1 + math.sin(q.life_time * 150) * 0.03`, `1 - math.sin(q.life_time * 150) * 0.03`, `1 + math.sin(q.life_time * 150) * 0.03`] }, ...(has("sprout") ? { sprout: { rotation: [0, 0, "math.sin(q.life_time * 100) * 8"] } } : {}) } };
      A[`animation.cdw.${id}.attack`] = { loop: false, animation_length: 0.4, bones: { body: { scale: { "0.0": [1, 1, 1], "0.15": [1.15, 0.85, 1.15], "0.3": [0.95, 1.1, 0.95], "0.4": [1, 1, 1] } } } };
      break;
    case "hover":
      A[`animation.cdw.${id}.walk`] = { loop: true, bones: { body: { rotation: ["10 * q.modified_move_speed", 0, 0] } } };
      A[`animation.cdw.${id}.idle`] = {
        loop: true,
        bones: {
          root: { position: [0, "math.sin(q.life_time * 120) * 1.5 + 2", 0] },
          ...(has("arm_r") ? { arm_r: { rotation: ["math.sin(q.life_time * 100) * 10 - 10", 0, "10"] }, arm_l: { rotation: ["-math.sin(q.life_time * 100) * 10 - 10", 0, "-10"] } } : {}),
          ...look,
        },
      };
      A[`animation.cdw.${id}.attack`] = { loop: false, animation_length: 0.5, bones: { body: { rotation: { "0.0": [0, 0, 0], "0.2": [-15, 0, 0], "0.5": [0, 0, 0] } }, ...(has("arm_r") ? { arm_r: { rotation: { "0.0": [0, 0, 0], "0.2": [-100, 0, 0], "0.5": [0, 0, 0] } } } : {}) } };
      break;
    case "bird":
      A[`animation.cdw.${id}.walk`] = { loop: true, bones: { body: { rotation: ["15 * q.modified_move_speed", 0, 0] } } };
      A[`animation.cdw.${id}.idle`] = { loop: true, bones: { root: { position: [0, "math.sin(q.life_time * 200) * 1 + 2", 0] }, wing_r: { rotation: [0, 0, "math.sin(q.life_time * 900) * 35"] }, wing_l: { rotation: [0, 0, "-math.sin(q.life_time * 900) * 35"] }, ...look } };
      A[`animation.cdw.${id}.attack`] = { loop: false, animation_length: 0.4, bones: { head: { rotation: { "0.0": [0, 0, 0], "0.15": [35, 0, 0], "0.4": [0, 0, 0] } } } };
      break;
    case "spider":
    case "scorpion": {
      const legBones = m.bones.filter((b) => b.name.startsWith("leg"));
      const bones: Record<string, object> = {};
      legBones.forEach((lb, i) => {
        const phase = i % 2 === 0 ? 0 : 180;
        bones[lb.name] = { rotation: [0, `math.cos(q.modified_distance_moved * 60 + ${phase + Math.floor(i / 2) * 60}) * 22 * q.modified_move_speed`, `math.abs(math.sin(q.modified_distance_moved * 60 + ${phase})) * 12 * q.modified_move_speed`] };
      });
      A[`animation.cdw.${id}.walk`] = { loop: true, bones };
      A[`animation.cdw.${id}.idle`] = { loop: true, bones: { ...(has("tail3") ? { tail1: { rotation: ["math.sin(q.life_time * 80) * 4", 0, 0] } } : {}), ...(has("head") ? look : {}) } };
      A[`animation.cdw.${id}.attack`] = {
        loop: false,
        animation_length: 0.5,
        bones: has("tail3")
          ? { tail1: { rotation: { "0.0": [0, 0, 0], "0.2": [-30, 0, 0], "0.5": [0, 0, 0] } }, tail3: { rotation: { "0.0": [0, 0, 0], "0.2": [-40, 0, 0], "0.5": [0, 0, 0] } }, claw_r: { rotation: { "0.0": [0, 0, 0], "0.2": [0, 25, 0], "0.5": [0, 0, 0] } }, claw_l: { rotation: { "0.0": [0, 0, 0], "0.2": [0, -25, 0], "0.5": [0, 0, 0] } } }
          : { head: { rotation: { "0.0": [0, 0, 0], "0.2": [20, 0, 0], "0.5": [0, 0, 0] } } },
      };
      break;
    }
    case "wyrm":
      A[`animation.cdw.${id}.walk`] = { loop: true, bones: { body: { position: [0, "math.sin(q.modified_distance_moved * 20) * 0.6", 0] } } };
      A[`animation.cdw.${id}.idle`] = {
        loop: true,
        bones: {
          seg1: { rotation: [0, "math.sin(q.life_time * 90) * 12", 0] },
          seg2: { rotation: [0, "math.sin(q.life_time * 90 - 60) * 14", 0] },
          seg3: { rotation: [0, "math.sin(q.life_time * 90 - 120) * 16", 0] },
          seg4: { rotation: [0, "math.sin(q.life_time * 90 - 180) * 18", 0] },
          head: { rotation: ["q.target_x_rotation * 0.4 + math.sin(q.life_time * 60) * 4", "q.target_y_rotation * 0.4", 0] },
        },
      };
      A[`animation.cdw.${id}.attack`] = { loop: false, animation_length: 0.6, bones: { head: { rotation: { "0.0": [0, 0, 0], "0.25": [-25, 0, 0], "0.45": [15, 0, 0], "0.6": [0, 0, 0] } } } };
      break;
    case "projectile":
      A[`animation.cdw.${id}.idle`] = { loop: true, bones: { root: { rotation: [0, 0, "q.life_time * 720"] } } };
      break;
    case "static":
      break;
  }
  return A;
}
