// Kleiner interner Event-Bus zwischen den Systemen.
import type { Entity, Player } from "@minecraft/server";
import type { MobInfo } from "../systems/mobs";

export interface BusEvents {
  kill: { player: Player; entity: Entity; typeId: string; families: string[]; info?: MobInfo; location: { x: number; y: number; z: number } };
  flag: { key: string; player?: Player };
  item: { player: Player; typeId: string };
  talk: { player: Player; npc: string };
  levelup: { player: Player; level: number };
}

type Handler<K extends keyof BusEvents> = (ev: BusEvents[K]) => void;
const handlers: { [K in keyof BusEvents]?: Handler<K>[] } = {};

export function on<K extends keyof BusEvents>(k: K, h: Handler<K>): void {
  ((handlers as Record<string, unknown[]>)[k] ??= []).push(h as unknown);
}

export function emit<K extends keyof BusEvents>(k: K, ev: BusEvents[K]): void {
  const list = handlers[k] as Handler<K>[] | undefined;
  if (!list) return;
  for (const h of list) {
    try {
      h(ev);
    } catch (e) {
      console.warn(`[CdW] Bus-Fehler (${k}): ${String(e)} ${(e as Error)?.stack ?? ""}`);
    }
  }
}
