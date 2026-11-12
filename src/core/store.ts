import { Player, world, system } from "@minecraft/server";
import type { AttrId, ClassId } from "../data/classes";
import { log } from "./util";

export const DATA_VERSION = 1;

export interface QuestProgress {
  s: number; // Stufe (Stage-Index)
  c: number; // Zähler
  t?: number; // Startzeit
}

export interface BountyState {
  id: string;
  c: number;
  done: boolean;
}

export interface PlayerData {
  v: number;
  cls?: ClassId;
  xp: number;
  attr: Record<AttrId, number>; // frei verteilte Punkte
  talents: Record<string, number>;
  gold: number;
  rep: number;
  quests: Record<string, QuestProgress>; // aktive Nebenquests
  done: string[]; // abgeschlossene Nebenquests
  tracked?: string; // verfolgte Quest
  bounty: { day: number; list: BountyState[]; total: number };
  stats: Record<string, number>;
  ach: string[];
  title?: string;
  settings: { hud: boolean; wisp: boolean; diff: number; numbers: boolean };
  waystones: string[];
  prestige: number;
  intro: number; // 0 = neu, 1 = Samen erhalten
  mainRewarded: number; // Index der letzten Hauptquest, deren Belohnung ausgezahlt wurde
  buffs: Record<string, number>; // Ablauf (Date.now ms)
  pages: number[]; // gefundene Tagebuchseiten
  bossKills: Record<string, number>;
}

export interface DungeonState {
  x: number;
  y: number;
  z: number;
  built: boolean;
  stage: number; // Fortschritt im Dungeon (Räume)
  boss: boolean; // Boss besiegt
  heart: boolean; // Herz gereinigt
  rerolls: number;
  heroic?: number; // Zeitstempel letzte heroische Runde
  data?: Record<string, number>;
}

export interface WorldData {
  v: number;
  hub?: { x: number; y: number; z: number; stage: number; building?: boolean };
  main: { idx: number; s: number; c: number };
  flags: Record<string, number>;
  dungeons: Record<string, DungeonState>;
  waystones: Record<string, { x: number; y: number; z: number; d: string; name: string; owner?: string }>;
  morgra?: "free" | "banish";
  bountySeed: number;
  worldBoss: number; // Zeitstempel letzter Kill
  camps: { x: number; z: number; t: number; id: string }[];
}

const PLAYER_KEY = "cdw:pd";
const WORLD_KEY = "cdw:wd";
const CHUNK = 30000;

function newPlayerData(): PlayerData {
  return {
    v: DATA_VERSION,
    xp: 0,
    attr: { str: 0, dex: 0, int: 0, vit: 0, wis: 0 },
    talents: {},
    gold: 0,
    rep: 0,
    quests: {},
    done: [],
    bounty: { day: 0, list: [], total: 0 },
    stats: {},
    ach: [],
    settings: { hud: true, wisp: true, diff: 1, numbers: true },
    waystones: [],
    prestige: 0,
    intro: 0,
    mainRewarded: -1,
    buffs: {},
    pages: [],
    bossKills: {},
  };
}

function newWorldData(): WorldData {
  return { v: DATA_VERSION, main: { idx: 0, s: 0, c: 0 }, flags: {}, dungeons: {}, waystones: {}, bountySeed: 0, worldBoss: 0, camps: [] };
}

function readChunked(get: (k: string) => unknown, key: string): string | undefined {
  const n = get(key + ":n");
  if (typeof n !== "number") {
    const v = get(key);
    return typeof v === "string" ? v : undefined;
  }
  let s = "";
  for (let i = 0; i < n; i++) {
    const part = get(`${key}:${i}`);
    if (typeof part !== "string") return undefined;
    s += part;
  }
  return s;
}

function writeChunked(set: (k: string, v?: string | number) => void, get: (k: string) => unknown, key: string, value: string): void {
  const old = get(key + ":n");
  const n = Math.ceil(value.length / CHUNK) || 1;
  for (let i = 0; i < n; i++) set(`${key}:${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  if (typeof old === "number") for (let i = n; i < old; i++) set(`${key}:${i}`, undefined);
  set(key + ":n", n);
}

function merge<T extends object>(base: T, loaded: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(loaded)) {
    const b = (base as Record<string, unknown>)[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)) {
      out[k] = merge(b as object, v as object);
    } else if (v !== undefined) out[k] = v;
  }
  return out as T;
}

const cache = new Map<string, PlayerData>();
const dirty = new Set<string>();
let worldCache: WorldData | undefined;
let worldDirty = false;

export function pdata(p: Player): PlayerData {
  let d = cache.get(p.id);
  if (d) return d;
  try {
    const raw = readChunked((k) => p.getDynamicProperty(k), PLAYER_KEY);
    d = raw ? merge(newPlayerData(), JSON.parse(raw) as Partial<PlayerData>) : newPlayerData();
  } catch (e) {
    log("Spielerdaten beschädigt, neu angelegt:", String(e));
    d = newPlayerData();
  }
  cache.set(p.id, d);
  return d;
}

export function markDirty(p: Player): void {
  dirty.add(p.id);
}

export function savePlayer(p: Player): void {
  const d = cache.get(p.id);
  if (!d) return;
  try {
    writeChunked(
      (k, v) => p.setDynamicProperty(k, v),
      (k) => p.getDynamicProperty(k),
      PLAYER_KEY,
      JSON.stringify(d)
    );
    dirty.delete(p.id);
  } catch (e) {
    log("Speichern fehlgeschlagen:", String(e));
  }
}

export function wdata(): WorldData {
  if (worldCache) return worldCache;
  try {
    const raw = readChunked((k) => world.getDynamicProperty(k), WORLD_KEY);
    worldCache = raw ? merge(newWorldData(), JSON.parse(raw) as Partial<WorldData>) : newWorldData();
  } catch (e) {
    log("Weltdaten beschädigt, neu angelegt:", String(e));
    worldCache = newWorldData();
  }
  return worldCache;
}

export function markWorldDirty(): void {
  worldDirty = true;
}

export function saveWorld(): void {
  if (!worldCache) return;
  try {
    writeChunked(
      (k, v) => world.setDynamicProperty(k, v),
      (k) => world.getDynamicProperty(k),
      WORLD_KEY,
      JSON.stringify(worldCache)
    );
    worldDirty = false;
  } catch (e) {
    log("Welt speichern fehlgeschlagen:", String(e));
  }
}

export function forgetPlayer(id: string): void {
  cache.delete(id);
  dirty.delete(id);
}

export function resetPlayerData(p: Player): PlayerData {
  const d = newPlayerData();
  cache.set(p.id, d);
  markDirty(p);
  return d;
}

export function resetWorldData(): void {
  worldCache = newWorldData();
  markWorldDirty();
}

export function initStore(): void {
  system.runInterval(() => {
    for (const p of world.getAllPlayers()) if (dirty.has(p.id)) savePlayer(p);
    if (worldDirty) saveWorld();
  }, 100);
  world.beforeEvents.playerLeave.subscribe((ev) => {
    const p = ev.player;
    // Lesen ist in Before-Events erlaubt, Schreiben nicht → Zwischenspeicher sichern & nach dem Tick löschen
    const id = p.id;
    const d = cache.get(id);
    if (d && dirty.has(id)) {
      try {
        writeChunked(
          (k, v) => p.setDynamicProperty(k, v),
          (k) => p.getDynamicProperty(k),
          PLAYER_KEY,
          JSON.stringify(d)
        );
      } catch {
        /* in eingeschränktem Kontext evtl. nicht erlaubt – wurde spätestens vor 5 s gesichert */
      }
    }
    system.run(() => forgetPlayer(id));
  });
}

export function stat(p: Player, key: string, add = 1): number {
  const d = pdata(p);
  d.stats[key] = (d.stats[key] ?? 0) + add;
  markDirty(p);
  return d.stats[key];
}

export function flag(key: string): number {
  return wdata().flags[key] ?? 0;
}
export function setFlag(key: string, v = 1): void {
  wdata().flags[key] = v;
  markWorldDirty();
}
