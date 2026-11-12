// Wegsteine: Aktivieren & Schnellreise.
import { Player, Vector3, world, system } from "@minecraft/server";
import { WAYSTONE_TRAVEL_COST } from "../data/balance";
import { emit } from "../core/bus";
import { markDirty, markWorldDirty, pdata, wdata } from "../core/store";
import { V, fmt, msg, particle, sound, title } from "../core/util";
import { spendGold } from "../systems/progression";
import { menu } from "../systems/ui";

export function registerWaystone(id: string, loc: Vector3, dim: string, name: string, owner?: string): void {
  const w = wdata();
  w.waystones[id] = { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z), d: dim, name, owner };
  markWorldDirty();
}

export function unregisterAt(loc: Vector3, dim: string): void {
  const w = wdata();
  for (const [id, ws] of Object.entries(w.waystones)) {
    if (ws.d === dim && ws.x === Math.floor(loc.x) && ws.y === Math.floor(loc.y) && ws.z === Math.floor(loc.z)) {
      delete w.waystones[id];
      markWorldDirty();
    }
  }
}

export function waystoneAt(loc: Vector3, dim: string): string | undefined {
  for (const [id, ws] of Object.entries(wdata().waystones)) {
    if (ws.d === dim && Math.abs(ws.x - Math.floor(loc.x)) <= 0 && Math.abs(ws.z - Math.floor(loc.z)) <= 0 && Math.abs(ws.y - Math.floor(loc.y)) <= 1) return id;
  }
  return undefined;
}

export function activate(p: Player, id: string): void {
  const d = pdata(p);
  if (d.waystones.includes(id)) return;
  d.waystones.push(id);
  markDirty(p);
  const ws = wdata().waystones[id];
  title(p, "§bWegstein aktiviert", `§f${ws?.name ?? id}`, 5, 40, 10);
  sound(p, "beacon.activate", undefined, 1.2, 0.8);
  emit("flag", { key: "waystone", player: p });
}

export async function openWaystone(p: Player, loc: Vector3): Promise<void> {
  let id = waystoneAt(loc, p.dimension.id);
  if (!id) {
    id = `w_${Math.floor(loc.x)}_${Math.floor(loc.z)}`;
    registerWaystone(id, loc, p.dimension.id, `Wegstein (${Math.floor(loc.x)}, ${Math.floor(loc.z)})`);
  }
  activate(p, id);
  await travelMenu(p, id);
}

export async function travelMenu(p: Player, fromId?: string): Promise<void> {
  const d = pdata(p);
  const all = wdata().waystones;
  const list = d.waystones.filter((id) => all[id] && id !== fromId);
  if (!list.length) {
    msg(p, "§7Du hast noch keine weiteren Wegsteine aktiviert. Berühre Wegsteine, um sie freizuschalten.");
    return;
  }
  await menu(
    p,
    "§bWegsteine",
    `§7Reisekosten: §e${WAYSTONE_TRAVEL_COST} Gold §7· Dein Gold: §e${fmt(d.gold)}`,
    list.map((id) => {
      const ws = all[id];
      const dist = ws.d === p.dimension.id ? `${fmt(V.dist2d(p.location, ws))} m` : "andere Dimension";
      return {
        text: `§f${ws.name}\n§7${dist}`,
        icon: "textures/cdw/ui/waystone",
        action: () => travel(p, id),
      };
    })
  );
}

export function travel(p: Player, id: string, free = false): void {
  const ws = wdata().waystones[id];
  if (!ws) return;
  if (!free && !spendGold(p, WAYSTONE_TRAVEL_COST)) {
    msg(p, `§cNicht genug Gold (${WAYSTONE_TRAVEL_COST} benötigt).`);
    return;
  }
  const dim = world.getDimension(ws.d);
  particle(p.dimension, "minecraft:portal_reverse_particle", V.add(p.location, { x: 0, y: 1, z: 0 }));
  sound(p.dimension, "mob.endermen.portal", p.location, 1, 1);
  p.addEffect("blindness", 25, { showParticles: false });
  system.runTimeout(() => {
    try {
      p.teleport({ x: ws.x + 0.5, y: ws.y + 1, z: ws.z + 1.5 }, { dimension: dim, checkForBlocks: false });
      sound(p, "mob.endermen.portal", undefined, 1.2, 1);
    } catch {
      /* ignorieren */
    }
  }, 8);
}
