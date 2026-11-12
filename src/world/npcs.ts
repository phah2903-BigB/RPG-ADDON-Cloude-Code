// NPC-Verwaltung: Spawnen, Wiederfinden, Heimatorte, Interaktion.
import { Entity, Player, Vector3, world } from "@minecraft/server";
import { NPCS, npcById } from "../data/mobs";
import { markWorldDirty, wdata } from "../core/store";
import { V, log } from "../core/util";

export function npcHome(id: string): { x: number; y: number; z: number; d: string } | undefined {
  const f = wdata().flags;
  if (f[`npc_${id}_x`] === undefined) return undefined;
  return { x: f[`npc_${id}_x`], y: f[`npc_${id}_y`], z: f[`npc_${id}_z`], d: f[`npc_${id}_nether`] ? "minecraft:nether" : "minecraft:overworld" };
}

function setHome(id: string, loc: Vector3): void {
  const f = wdata().flags;
  f[`npc_${id}_x`] = Math.floor(loc.x) + 0.5;
  f[`npc_${id}_y`] = Math.floor(loc.y);
  f[`npc_${id}_z`] = Math.floor(loc.z) + 0.5;
  markWorldDirty();
}

export function npcIdOf(e: Entity): string | undefined {
  for (const t of e.getTags()) if (t.startsWith("cdw_npc:")) return t.slice(8);
  return undefined;
}

export function findNpcs(id: string): Entity[] {
  const out: Entity[] = [];
  for (const dimId of ["minecraft:overworld"]) {
    try {
      for (const e of world.getDimension(dimId).getEntities({ type: "cdw:npc", tags: [`cdw_npc:${id}`] })) out.push(e);
    } catch {
      /* ignorieren */
    }
  }
  return out;
}

/** Spawnt einen NPC (entfernt geladene Duplikate). */
export function spawnNpc(id: string, loc: Vector3, dimId = "minecraft:overworld"): Entity | undefined {
  const def = npcById(id);
  if (!def) return undefined;
  setHome(id, loc);
  for (const e of findNpcs(id)) {
    try {
      e.remove();
    } catch {
      /* ignorieren */
    }
  }
  try {
    const dim = world.getDimension(dimId);
    const e = dim.spawnEntity("cdw:npc", loc);
    e.addTag(`cdw_npc:${id}`);
    e.setProperty("cdw:variant", def.variant);
    e.nameTag = `§a${def.name}\n§7${def.title}`;
    return e;
  } catch (err) {
    log("NPC-Spawn fehlgeschlagen:", id, String(err));
    return undefined;
  }
}

export function despawnNpc(id: string): void {
  for (const e of findNpcs(id)) {
    try {
      e.remove();
    } catch {
      /* ignorieren */
    }
  }
}

/** NPCs, die sich zu weit von ihrer Heimat entfernt haben, zurückholen; fehlende neu setzen, wenn geladen. */
export function maintainNpcs(): void {
  for (const n of NPCS) {
    const home = npcHome(n.id);
    if (!home) continue;
    const dim = world.getDimension(home.d);
    let loaded = false;
    try {
      loaded = dim.isChunkLoaded(home);
    } catch {
      loaded = false;
    }
    if (!loaded) continue;
    const list = findNpcs(n.id);
    if (list.length === 0) {
      if (wdata().flags[`npc_${n.id}_gone`]) continue;
      // nur neu setzen, wenn ein Spieler in der Nähe ist (Chunk wirklich aktiv)
      if (dim.getPlayers({ location: home, maxDistance: 48 }).length) spawnNpc(n.id, home, home.d);
      continue;
    }
    for (let i = 1; i < list.length; i++) list[i].remove();
    const e = list[0];
    if (V.dist(e.location, home) > 3) e.teleport(home);
  }
}

export function setNpcGone(id: string, gone: boolean): void {
  wdata().flags[`npc_${id}_gone`] = gone ? 1 : 0;
  markWorldDirty();
  if (gone) despawnNpc(id);
}

export function lookAtPlayer(npc: Entity, p: Player): void {
  try {
    npc.lookAt(p.getHeadLocation());
  } catch {
    /* ignorieren */
  }
}
