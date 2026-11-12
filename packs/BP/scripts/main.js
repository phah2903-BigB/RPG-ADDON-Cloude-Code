// Chroniken des Weltenbaums – generiert aus src/ (TypeScript). Nicht direkt bearbeiten.

// src/main.ts
import { CommandPermissionLevel, CustomCommandStatus, ItemStack as ItemStack11, system as system22, world as world21 } from "@minecraft/server";

// src/core/store.ts
import { world as world2, system as system2 } from "@minecraft/server";

// src/core/util.ts
import { Player, world, system } from "@minecraft/server";
var V = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul: (a, s2) => ({ x: a.x * s2, y: a.y * s2, z: a.z * s2 }),
  len: (a) => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z),
  dist: (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2),
  dist2d: (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2),
  norm: (a) => {
    const l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1;
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  },
  flat: (a) => {
    const l = Math.sqrt(a.x * a.x + a.z * a.z) || 1;
    return { x: a.x / l, y: 0, z: a.z / l };
  },
  floor: (a) => ({ x: Math.floor(a.x), y: Math.floor(a.y), z: Math.floor(a.z) }),
  center: (a) => ({ x: Math.floor(a.x) + 0.5, y: Math.floor(a.y), z: Math.floor(a.z) + 0.5 }),
  rotY: (a, deg) => {
    const r = deg * Math.PI / 180;
    const c = Math.cos(r);
    const s2 = Math.sin(r);
    return { x: a.x * c - a.z * s2, y: a.y, z: a.x * s2 + a.z * c };
  }
};
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weighted(arr) {
  const total = arr.reduce((s2, a) => s2 + a.weight, 0);
  let r = Math.random() * total;
  for (const a of arr) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return arr[arr.length - 1];
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s2) {
  let h = 2166136261;
  for (let i = 0; i < s2.length; i++) {
    h ^= s2.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function bar(frac, len = 10, full = "\u25B0", empty = "\u25B1") {
  const f = clamp(Math.round(frac * len), 0, len);
  return full.repeat(f) + empty.repeat(len - f);
}
function isValid(e) {
  try {
    return !!e && e.isValid;
  } catch {
    return false;
  }
}
function log(...args) {
  console.warn("[CdW] " + args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" "));
}
function particle(dim, id, loc, vars) {
  try {
    dim.spawnParticle(id, loc, vars);
  } catch {
  }
}
function ring(dim, id, center, radius, count = 16) {
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2;
    particle(dim, id, { x: center.x + Math.cos(a) * radius, y: center.y, z: center.z + Math.sin(a) * radius });
  }
}
function sound(target, id, loc, pitch = 1, volume = 1) {
  try {
    if (target instanceof Player) target.playSound(id, { pitch, volume });
    else if (loc) target.playSound(id, loc, { pitch, volume });
  } catch {
  }
}
function players() {
  return world.getAllPlayers().filter((p) => isValid(p));
}
function arrowTo(player, target) {
  const rot = player.getRotation();
  const d = V.sub(target, player.location);
  const targetYaw = Math.atan2(-d.x, d.z) * 180 / Math.PI;
  let rel = targetYaw - rot.y;
  while (rel > 180) rel -= 360;
  while (rel < -180) rel += 360;
  const arrows = ["\u2191", "\u2197", "\u2192", "\u2198", "\u2193", "\u2199", "\u2190", "\u2196"];
  const idx = Math.round((rel + 360) % 360 / 45) % 8;
  return arrows[idx];
}
function later(ticks, fn) {
  system.runTimeout(() => {
    try {
      fn();
    } catch (e) {
      log("Fehler (later):", String(e));
    }
  }, ticks);
}
function msg(p, text) {
  try {
    p.sendMessage(text);
  } catch {
  }
}
function broadcast(text) {
  try {
    world.sendMessage(text);
  } catch {
  }
}
function title(p, t, sub = "", fadeIn = 10, stay = 50, fadeOut = 15) {
  try {
    p.onScreenDisplay.setTitle(t, { subtitle: sub, fadeInDuration: fadeIn, stayDuration: stay, fadeOutDuration: fadeOut });
  } catch {
  }
}
function dayNumber() {
  return Math.floor(Date.now() / 864e5);
}
function weekNumber() {
  return Math.floor((Date.now() / 864e5 + 3) / 7);
}

// src/core/store.ts
var DATA_VERSION = 1;
var PLAYER_KEY = "cdw:pd";
var WORLD_KEY = "cdw:wd";
var CHUNK = 3e4;
function newPlayerData() {
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
    bossKills: {}
  };
}
function newWorldData() {
  return { v: DATA_VERSION, main: { idx: 0, s: 0, c: 0 }, flags: {}, dungeons: {}, waystones: {}, bountySeed: 0, worldBoss: 0, camps: [] };
}
function readChunked(get, key) {
  const n = get(key + ":n");
  if (typeof n !== "number") {
    const v = get(key);
    return typeof v === "string" ? v : void 0;
  }
  let s2 = "";
  for (let i = 0; i < n; i++) {
    const part = get(`${key}:${i}`);
    if (typeof part !== "string") return void 0;
    s2 += part;
  }
  return s2;
}
function writeChunked(set, get, key, value) {
  const old = get(key + ":n");
  const n = Math.ceil(value.length / CHUNK) || 1;
  for (let i = 0; i < n; i++) set(`${key}:${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  if (typeof old === "number") for (let i = n; i < old; i++) set(`${key}:${i}`, void 0);
  set(key + ":n", n);
}
function merge(base, loaded) {
  const out = { ...base };
  for (const [k, v] of Object.entries(loaded)) {
    const b = base[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)) {
      out[k] = merge(b, v);
    } else if (v !== void 0) out[k] = v;
  }
  return out;
}
var cache = /* @__PURE__ */ new Map();
var dirty = /* @__PURE__ */ new Set();
var worldCache;
var worldDirty = false;
function pdata(p) {
  let d = cache.get(p.id);
  if (d) return d;
  try {
    const raw = readChunked((k) => p.getDynamicProperty(k), PLAYER_KEY);
    d = raw ? merge(newPlayerData(), JSON.parse(raw)) : newPlayerData();
  } catch (e) {
    log("Spielerdaten besch\xE4digt, neu angelegt:", String(e));
    d = newPlayerData();
  }
  cache.set(p.id, d);
  return d;
}
function markDirty(p) {
  dirty.add(p.id);
}
function savePlayer(p) {
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
function wdata() {
  if (worldCache) return worldCache;
  try {
    const raw = readChunked((k) => world2.getDynamicProperty(k), WORLD_KEY);
    worldCache = raw ? merge(newWorldData(), JSON.parse(raw)) : newWorldData();
  } catch (e) {
    log("Weltdaten besch\xE4digt, neu angelegt:", String(e));
    worldCache = newWorldData();
  }
  return worldCache;
}
function markWorldDirty() {
  worldDirty = true;
}
function saveWorld() {
  if (!worldCache) return;
  try {
    writeChunked(
      (k, v) => world2.setDynamicProperty(k, v),
      (k) => world2.getDynamicProperty(k),
      WORLD_KEY,
      JSON.stringify(worldCache)
    );
    worldDirty = false;
  } catch (e) {
    log("Welt speichern fehlgeschlagen:", String(e));
  }
}
function forgetPlayer(id) {
  cache.delete(id);
  dirty.delete(id);
}
function resetPlayerData(p) {
  const d = newPlayerData();
  cache.set(p.id, d);
  markDirty(p);
  return d;
}
function resetWorldData() {
  worldCache = newWorldData();
  markWorldDirty();
}
function initStore() {
  system2.runInterval(() => {
    for (const p of world2.getAllPlayers()) if (dirty.has(p.id)) savePlayer(p);
    if (worldDirty) saveWorld();
  }, 100);
  world2.beforeEvents.playerLeave.subscribe((ev) => {
    const p = ev.player;
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
      }
    }
    system2.run(() => forgetPlayer(id));
  });
}
function stat(p, key, add = 1) {
  const d = pdata(p);
  d.stats[key] = (d.stats[key] ?? 0) + add;
  markDirty(p);
  return d.stats[key];
}
function flag(key) {
  return wdata().flags[key] ?? 0;
}
function setFlag(key, v = 1) {
  wdata().flags[key] = v;
  markWorldDirty();
}

// src/systems/combat.ts
import { EntityDamageCause, EquipmentSlot as EquipmentSlot3, ItemStack as ItemStack2, system as system4, world as world4 } from "@minecraft/server";

// src/data/balance.ts
var MAX_LEVEL = 50;
var ATTR_POINTS_PER_LEVEL = 2;
function xpToNext(level2) {
  if (level2 >= MAX_LEVEL) return Infinity;
  return Math.round((90 * Math.pow(level2, 1.35) + 30) / 10) * 10;
}
function totalXpForLevel(level2) {
  let t = 0;
  for (let l = 1; l < level2; l++) t += xpToNext(l);
  return t;
}
function levelFromTotalXp(xp) {
  let l = 1;
  let need = 0;
  while (l < MAX_LEVEL) {
    need += xpToNext(l);
    if (xp < need) break;
    l++;
  }
  return l;
}
function mobHpScale(level2) {
  return 1 + 0.32 * (level2 - 1);
}
function mobDmgScale(level2) {
  return 1 + 0.2 * (level2 - 1);
}
var MOB_DMG_BASE_MULT = 5;
function mobXp(level2, mult = 1) {
  return Math.round((8 + 4.5 * level2) * mult);
}
function mobGold(level2, mult = 1) {
  return Math.max(1, Math.round((1 + level2 * 0.6) * mult));
}
function zoneLevel(distance, dimension) {
  let lvl = 1 + Math.floor(distance / 36);
  if (dimension === "minecraft:nether") lvl += 14;
  if (dimension === "minecraft:the_end") lvl += 26;
  return Math.max(1, Math.min(55, lvl));
}
var PLAYER_BASE = {
  hp: 100,
  hpPerLevel: 10,
  hpPerVit: 9,
  mana: 50,
  manaPerLevel: 4,
  manaPerWis: 7,
  manaRegen: 1.2,
  // pro Sekunde
  manaRegenPerWis: 0.12,
  critChance: 0.05,
  critPerDex: 4e-3,
  critDamage: 1.5,
  strDmg: 0.03,
  // +3 % Nahkampf pro Stärke
  dexDmg: 0.03,
  // +3 % Fernkampf/Dolch/Speer pro Geschick
  intDmg: 0.035,
  // +3,5 % Magie pro Intelligenz
  wisHeal: 0.03
  // +3 % Heilung pro Weisheit
};
function vitResist(vit) {
  return Math.min(0.25, vit * 35e-4);
}
var RARITIES = [
  { id: "common", name: "Gew\xF6hnlich", color: "\xA7f", affixes: 0, weight: 60, statMult: 1 },
  { id: "uncommon", name: "Ungew\xF6hnlich", color: "\xA7a", affixes: 1, weight: 26, statMult: 1.06 },
  { id: "rare", name: "Selten", color: "\xA79", affixes: 2, weight: 10, statMult: 1.12 },
  { id: "epic", name: "Episch", color: "\xA75", affixes: 3, weight: 3.4, statMult: 1.2 },
  { id: "legendary", name: "Legend\xE4r", color: "\xA76", affixes: 4, weight: 0.6, statMult: 1.3 }
];
var UPGRADE_MAX = 10;
var UPGRADE_DMG_PER_LEVEL = 0.08;
function upgradeCost(tier, plus) {
  return { gold: Math.round((40 + 30 * plus * plus) * (1 + tier * 0.6)), dust: 1 + Math.floor(plus / 2) + tier };
}
var WAYSTONE_TRAVEL_COST = 15;
var CLASS_CHANGE_COST = 250;
var RESPEC_COST_PER_LEVEL = 8;
var REPUTATION_LEVELS = [
  { name: "Fremd", need: 0 },
  { name: "Bekannt", need: 300 },
  { name: "Gesch\xE4tzt", need: 1e3 },
  { name: "Geehrt", need: 2500 },
  { name: "W\xE4chter des Hains", need: 5e3 }
];
var DUNGEON_RINGS = [320, 620, 920, 1220, 1520, 1100];

// src/data/classes.ts
var ATTR_NAMES = {
  str: "St\xE4rke",
  dex: "Geschick",
  int: "Intelligenz",
  vit: "Vitalit\xE4t",
  wis: "Weisheit"
};
var ATTR_DESC = {
  str: "+3 % Nahkampfschaden (Schwert, Zweih\xE4nder, Axt, Hammer)",
  dex: "+3 % Fernkampf-, Dolch- und Speerschaden, +0,4 % Krit",
  int: "+3,5 % Magieschaden",
  vit: "+9 Lebenspunkte, +0,35 % Widerstand",
  wis: "+7 Mana, schnellere Mana-Regeneration, +3 % Heilung"
};
var CLASSES = [
  {
    id: "krieger",
    name: "Krieger",
    role: "Nahkampf \xB7 Verteidiger",
    color: "\xA7c",
    desc: "Steht in der ersten Reihe. Viel Leben, schwere Waffen, Fl\xE4chenschl\xE4ge und Schutzf\xE4higkeiten.",
    base: { str: 6, dex: 2, int: 1, vit: 5, wis: 1 },
    growth: { str: 1, vit: 1 },
    weapons: ["schwert", "zweihaender", "streitaxt", "kriegshammer"],
    starter: "schwert_bronze"
  },
  {
    id: "waldlaeufer",
    name: "Waldl\xE4ufer",
    role: "Fernkampf \xB7 Beweglichkeit",
    color: "\xA7a",
    desc: "Trifft aus der Distanz, ist schnell und kritisch. B\xF6gen, Armbr\xFCste, Speere und Dolche.",
    base: { str: 2, dex: 6, int: 1, vit: 3, wis: 2 },
    growth: { dex: 1, vit: 1 },
    weapons: ["langbogen", "armbrust", "speer", "dolch"],
    starter: "langbogen_bronze"
  },
  {
    id: "magier",
    name: "Magier",
    role: "Magie \xB7 Fl\xE4chenschaden",
    color: "\xA79",
    desc: "Zerst\xF6rerische Elementarmagie aus der Ferne. Zerbrechlich, aber verheerend.",
    base: { str: 1, dex: 2, int: 7, vit: 2, wis: 4 },
    growth: { int: 1, wis: 1 },
    weapons: ["zauberstab", "dolch"],
    starter: "zauberstab_bronze"
  },
  {
    id: "druide",
    name: "Druide",
    role: "Heilung \xB7 Unterst\xFCtzung",
    color: "\xA72",
    desc: "Heilt Gef\xE4hrten, fesselt Feinde mit Ranken und ruft Naturgeister. Ideal im Team.",
    base: { str: 2, dex: 2, int: 4, vit: 3, wis: 6 },
    growth: { wis: 1, int: 1 },
    weapons: ["naturstab", "dolch", "speer"],
    starter: "naturstab_bronze"
  }
];
function classById(id) {
  return CLASSES.find((c) => c.id === id);
}
var ABILITIES = [
  // Krieger
  { id: "wirbelschlag", cls: "krieger", name: "Wirbelschlag", level: 1, mana: 14, cooldown: 6, desc: "Trifft alle Gegner im Umkreis von 4 Bl\xF6cken mit 160 % Waffenschaden.", glyph: "spin", color: [220, 70, 50] },
  { id: "schildwall", cls: "krieger", name: "Schildwall", level: 5, mana: 18, cooldown: 22, desc: "6 Sek. lang 50 % weniger Schaden und kein R\xFCcksto\xDF.", glyph: "shield", color: [200, 160, 60] },
  { id: "sturmangriff", cls: "krieger", name: "Sturmangriff", level: 10, mana: 16, cooldown: 12, desc: "St\xFCrmt 8 Bl\xF6cke vorw\xE4rts, verletzt und verlangsamt Gegner auf dem Weg.", glyph: "arrow", color: [230, 110, 40] },
  { id: "kampfschrei", cls: "krieger", name: "Kampfschrei", level: 15, mana: 22, cooldown: 30, desc: "Verb\xFCndete: +20 % Schaden f\xFCr 12 Sek. Gegner werden geschw\xE4cht.", glyph: "horn", color: [240, 200, 80] },
  { id: "titanenhieb", cls: "krieger", name: "Titanenhieb", level: 25, mana: 40, cooldown: 60, desc: "ULTIMATE: Ersch\xFCttert den Boden \u2013 420 % Waffenschaden im Umkreis von 6 Bl\xF6cken, bet\xE4ubt 3 Sek.", glyph: "hammer", color: [255, 90, 40], ult: true },
  // Waldläufer
  { id: "salve", cls: "waldlaeufer", name: "Salve", level: 1, mana: 12, cooldown: 6, desc: "Feuert 5 Pfeile im F\xE4cher (je 70 % Waffenschaden).", glyph: "fan", color: [90, 200, 90] },
  { id: "rueckwaertssprung", cls: "waldlaeufer", name: "R\xFCckw\xE4rtssprung", level: 5, mana: 10, cooldown: 10, desc: "Springt zur\xFCck und verlangsamt nahe Gegner.", glyph: "back", color: [120, 220, 160] },
  { id: "giftpfeil", cls: "waldlaeufer", name: "Giftpfeil", level: 10, mana: 14, cooldown: 8, desc: "Ein Pfeil, der 6 Sek. lang Gift-Schaden verursacht (insg. 240 %).", glyph: "drop", color: [130, 210, 40] },
  { id: "falkenauge", cls: "waldlaeufer", name: "Falkenauge", level: 15, mana: 20, cooldown: 30, desc: "10 Sek.: +30 % Krit-Chance und Tempo.", glyph: "eye", color: [230, 220, 120] },
  { id: "pfeilregen", cls: "waldlaeufer", name: "Pfeilregen", level: 25, mana: 40, cooldown: 60, desc: "ULTIMATE: L\xE4sst 6 Sek. lang Pfeile auf das Zielgebiet regnen.", glyph: "rain", color: [160, 255, 120], ult: true },
  // Magier
  { id: "feuerball", cls: "magier", name: "Feuerball", level: 1, mana: 12, cooldown: 3, desc: "Explodierender Feuerball: 180 % Magieschaden im Umkreis von 3 Bl\xF6cken.", glyph: "flame", color: [255, 120, 30] },
  { id: "frostlanze", cls: "magier", name: "Frostlanze", level: 5, mana: 14, cooldown: 6, desc: "Durchbohrende Eislanze: 150 % Schaden, verlangsamt stark.", glyph: "shard", color: [120, 200, 255] },
  { id: "blinzeln", cls: "magier", name: "Blinzeln", level: 10, mana: 12, cooldown: 10, desc: "Teleportiert dich 8 Bl\xF6cke in Blickrichtung.", glyph: "blink", color: [190, 120, 255] },
  { id: "arkanschild", cls: "magier", name: "Arkanschild", level: 15, mana: 24, cooldown: 30, desc: "Ein Schild, der Schaden in H\xF6he von 30 % deiner LP absorbiert.", glyph: "orb", color: [150, 110, 255] },
  { id: "meteor", cls: "magier", name: "Meteor", level: 25, mana: 45, cooldown: 60, desc: "ULTIMATE: Ein Meteor schl\xE4gt nach 1,5 Sek. ein \u2013 500 % Schaden und Brand.", glyph: "meteor", color: [255, 70, 20], ult: true },
  // Druide
  { id: "heilbluete", cls: "druide", name: "Heilende Bl\xFCte", level: 1, mana: 16, cooldown: 12, desc: "Heilt dich und Verb\xFCndete im Umkreis von 8 Bl\xF6cken \xFCber 5 Sek. um 30 % LP.", glyph: "flower", color: [255, 150, 200] },
  { id: "dornenranken", cls: "druide", name: "Dornenranken", level: 5, mana: 16, cooldown: 12, desc: "Fesselt Gegner im Zielgebiet 4 Sek. und verletzt sie (140 %).", glyph: "vine", color: [80, 170, 60] },
  { id: "wolfsgeist", cls: "druide", name: "Wolfsgeist", level: 10, mana: 25, cooldown: 45, desc: "Ruft f\xFCr 40 Sek. einen Geisterwolf, der an deiner Seite k\xE4mpft.", glyph: "wolf", color: [170, 230, 255] },
  { id: "rindenhaut", cls: "druide", name: "Rindenhaut", level: 15, mana: 20, cooldown: 30, desc: "Verb\xFCndete im Umkreis erhalten 10 Sek. Widerstand und Regeneration.", glyph: "bark", color: [160, 110, 60] },
  { id: "segen", cls: "druide", name: "Segen des Ylvaris", level: 25, mana: 50, cooldown: 90, desc: "ULTIMATE: Heilt alle Verb\xFCndeten voll, entfernt Gift und schadet F\xE4ulnis-Wesen schwer.", glyph: "tree", color: [120, 255, 150], ult: true }
];
function abilitiesFor(cls) {
  return ABILITIES.filter((a) => a.cls === cls);
}
var TALENT_PATH_NAMES = {
  krieger: ["Berserker", "Bollwerk"],
  waldlaeufer: ["Scharfsch\xFCtze", "Pirscher"],
  magier: ["Feuer & Zerst\xF6rung", "Frost & Arkanes"],
  druide: ["Lebensbaum", "Wildnis"]
};
var TALENTS = [
  // Krieger – Berserker
  { id: "k_wut", cls: "krieger", path: 0, tier: 1, name: "Kampfeswut", desc: "+4 % Nahkampfschaden je Rang", maxRank: 3, effects: { "melee%": 0.04 } },
  { id: "k_blut", cls: "krieger", path: 0, tier: 2, name: "Blutdurst", desc: "+2 % Lebensraub je Rang", maxRank: 2, effects: { lifesteal: 0.02 } },
  { id: "k_wirbel", cls: "krieger", path: 0, tier: 3, name: "Klingensturm", desc: "Wirbelschlag +25 % Schaden je Rang", maxRank: 2, effects: { "ability:wirbelschlag%": 0.25 } },
  { id: "k_hinrichtung", cls: "krieger", path: 0, tier: 4, name: "Hinrichter", desc: "+8 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.08 } },
  { id: "k_titan", cls: "krieger", path: 0, tier: 5, name: "Titanenblut", desc: "Titanenhieb +40 % Schaden, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:titanenhieb%": 0.4, cdr: 0.1 } },
  // Krieger – Bollwerk
  { id: "k_haut", cls: "krieger", path: 1, tier: 1, name: "Eisenhaut", desc: "+5 % max. LP je Rang", maxRank: 3, effects: { "hp%": 0.05 } },
  { id: "k_stand", cls: "krieger", path: 1, tier: 2, name: "Standhaft", desc: "+3 % Widerstand je Rang", maxRank: 2, effects: { resist: 0.03 } },
  { id: "k_wall", cls: "krieger", path: 1, tier: 3, name: "Unersch\xFCtterlich", desc: "Schildwall -4 Sek. Abklingzeit je Rang", maxRank: 2, effects: { "cd:schildwall": 4 } },
  { id: "k_regen", cls: "krieger", path: 1, tier: 4, name: "Z\xE4higkeit", desc: "+0,5 LP-Regeneration/Sek. (%) je Rang", maxRank: 3, effects: { regen: 5e-3 } },
  { id: "k_bastion", cls: "krieger", path: 1, tier: 5, name: "Bastion", desc: "+10 % max. LP und +5 % Widerstand", maxRank: 1, effects: { "hp%": 0.1, resist: 0.05 } },
  // Waldläufer – Scharfschütze
  { id: "w_zielen", cls: "waldlaeufer", path: 0, tier: 1, name: "Ruhige Hand", desc: "+4 % Fernkampfschaden je Rang", maxRank: 3, effects: { "ranged%": 0.04 } },
  { id: "w_krit", cls: "waldlaeufer", path: 0, tier: 2, name: "Schwachstelle", desc: "+3 % Krit-Chance je Rang", maxRank: 2, effects: { crit: 0.03 } },
  { id: "w_salve", cls: "waldlaeufer", path: 0, tier: 3, name: "F\xE4cherschuss", desc: "Salve +25 % Schaden je Rang", maxRank: 2, effects: { "ability:salve%": 0.25 } },
  { id: "w_kopf", cls: "waldlaeufer", path: 0, tier: 4, name: "Kopfschuss", desc: "+10 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.1 } },
  { id: "w_regen", cls: "waldlaeufer", path: 0, tier: 5, name: "Sturm der Pfeile", desc: "Pfeilregen +40 %, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:pfeilregen%": 0.4, cdr: 0.1 } },
  // Waldläufer – Pirscher
  { id: "w_flink", cls: "waldlaeufer", path: 1, tier: 1, name: "Leichtf\xFC\xDFig", desc: "+3 % Tempo je Rang", maxRank: 3, effects: { speed: 0.03 } },
  { id: "w_gift", cls: "waldlaeufer", path: 1, tier: 2, name: "Giftmischer", desc: "Giftpfeil +30 % Schaden je Rang", maxRank: 2, effects: { "ability:giftpfeil%": 0.3 } },
  { id: "w_dolch", cls: "waldlaeufer", path: 1, tier: 3, name: "Klingentanz", desc: "+5 % Nahkampfschaden je Rang", maxRank: 2, effects: { "melee%": 0.05 } },
  { id: "w_ausweichen", cls: "waldlaeufer", path: 1, tier: 4, name: "Ausweichen", desc: "+3 % Widerstand je Rang", maxRank: 3, effects: { resist: 0.03 } },
  { id: "w_schatten", cls: "waldlaeufer", path: 1, tier: 5, name: "J\xE4gerinstinkt", desc: "+6 % Krit und +3 % Lebensraub", maxRank: 1, effects: { crit: 0.06, lifesteal: 0.03 } },
  // Magier – Feuer
  { id: "m_glut", cls: "magier", path: 0, tier: 1, name: "Glutherz", desc: "+4 % Magieschaden je Rang", maxRank: 3, effects: { "magic%": 0.04 } },
  { id: "m_feuer", cls: "magier", path: 0, tier: 2, name: "Inferno", desc: "Feuerball +25 % Schaden je Rang", maxRank: 2, effects: { "ability:feuerball%": 0.25 } },
  { id: "m_krit", cls: "magier", path: 0, tier: 3, name: "Z\xFCndfunke", desc: "+3 % Krit-Chance je Rang", maxRank: 2, effects: { crit: 0.03 } },
  { id: "m_kritdmg", cls: "magier", path: 0, tier: 4, name: "Feuersturm", desc: "+10 % Krit-Schaden je Rang", maxRank: 3, effects: { critdmg: 0.1 } },
  { id: "m_meteor", cls: "magier", path: 0, tier: 5, name: "Sternenzorn", desc: "Meteor +40 %, -10 % Abklingzeiten", maxRank: 1, effects: { "ability:meteor%": 0.4, cdr: 0.1 } },
  // Magier – Frost & Arkan
  { id: "m_mana", cls: "magier", path: 1, tier: 1, name: "Manaquell", desc: "+6 % max. Mana je Rang", maxRank: 3, effects: { "mana%": 0.06 } },
  { id: "m_frost", cls: "magier", path: 1, tier: 2, name: "Eisk\xE4lte", desc: "Frostlanze +30 % Schaden je Rang", maxRank: 2, effects: { "ability:frostlanze%": 0.3 } },
  { id: "m_kosten", cls: "magier", path: 1, tier: 3, name: "Effizienz", desc: "-6 % Manakosten je Rang", maxRank: 2, effects: { "manacost%": 0.06 } },
  { id: "m_schild", cls: "magier", path: 1, tier: 4, name: "Arkane Barriere", desc: "+5 % max. LP je Rang", maxRank: 3, effects: { "hp%": 0.05 } },
  { id: "m_zeit", cls: "magier", path: 1, tier: 5, name: "Zeitkr\xFCmmung", desc: "-15 % Abklingzeiten", maxRank: 1, effects: { cdr: 0.15 } },
  // Druide – Lebensbaum
  { id: "d_heil", cls: "druide", path: 0, tier: 1, name: "Lebenssaft", desc: "+6 % Heilung je Rang", maxRank: 3, effects: { "heal%": 0.06 } },
  { id: "d_mana", cls: "druide", path: 0, tier: 2, name: "Tau des Morgens", desc: "+6 % max. Mana je Rang", maxRank: 2, effects: { "mana%": 0.06 } },
  { id: "d_bluete", cls: "druide", path: 0, tier: 3, name: "Volle Bl\xFCte", desc: "Heilende Bl\xFCte +25 % je Rang", maxRank: 2, effects: { "ability:heilbluete%": 0.25 } },
  { id: "d_regen", cls: "druide", path: 0, tier: 4, name: "Erneuerung", desc: "+0,5 % LP-Regeneration/Sek. je Rang", maxRank: 3, effects: { regen: 5e-3 } },
  { id: "d_segen", cls: "druide", path: 0, tier: 5, name: "Ylvaris' Gunst", desc: "Segen -30 Sek. Abklingzeit, +10 % Heilung", maxRank: 1, effects: { "cd:segen": 30, "heal%": 0.1 } },
  // Druide – Wildnis
  { id: "d_dorn", cls: "druide", path: 1, tier: 1, name: "Dornen", desc: "+4 % Magieschaden je Rang", maxRank: 3, effects: { "magic%": 0.04 } },
  { id: "d_ranken", cls: "druide", path: 1, tier: 2, name: "W\xFCrgende Ranken", desc: "Dornenranken +30 % Schaden je Rang", maxRank: 2, effects: { "ability:dornenranken%": 0.3 } },
  { id: "d_wolf", cls: "druide", path: 1, tier: 3, name: "Rudelf\xFChrer", desc: "Wolfsgeist -10 Sek. Abklingzeit je Rang", maxRank: 2, effects: { "cd:wolfsgeist": 10 } },
  { id: "d_rinde", cls: "druide", path: 1, tier: 4, name: "Borke", desc: "+3 % Widerstand je Rang", maxRank: 3, effects: { resist: 0.03 } },
  { id: "d_wild", cls: "druide", path: 1, tier: 5, name: "Ruf der Wildnis", desc: "+10 % Schaden, +5 % Tempo", maxRank: 1, effects: { "dmg%": 0.1, speed: 0.05 } }
];
function talentsFor(cls) {
  return TALENTS.filter((t) => t.cls === cls);
}
function talentPointsForLevel(level2) {
  return level2 < 3 ? 0 : Math.floor((level2 - 1) / 2);
}

// src/data/items.ts
var WEAPON_TYPES = [
  { id: "schwert", name: "Schwert", kind: "melee_str", dmgMult: 1, speed: 11, ability: "Klingensto\xDF", abilityDesc: "St\xF6\xDFt 3 Bl\xF6cke vor und trifft alles auf dem Weg (130 %).", abilityCd: 5, abilityMana: 6, enchantSlot: "sword" },
  { id: "zweihaender", name: "Zweih\xE4nder", kind: "melee_str", dmgMult: 1.45, speed: 20, ability: "Rundumschlag", abilityDesc: "Trifft alle Gegner im Umkreis von 3,5 Bl\xF6cken (120 %).", abilityCd: 8, abilityMana: 10, enchantSlot: "sword" },
  { id: "dolch", name: "Dolch", kind: "melee_dex", dmgMult: 0.72, speed: 6, ability: "Schattenschritt", abilityDesc: "Springt hinter das anvisierte Ziel. Der n\xE4chste Treffer ist kritisch.", abilityCd: 8, abilityMana: 8, enchantSlot: "sword" },
  { id: "streitaxt", name: "Streitaxt", kind: "melee_str", dmgMult: 1.25, speed: 16, ability: "Spalten", abilityDesc: "Wuchtiger Hieb (200 %), schw\xE4cht das Ziel 6 Sek.", abilityCd: 7, abilityMana: 8, enchantSlot: "axe" },
  { id: "kriegshammer", name: "Kriegshammer", kind: "melee_str", dmgMult: 1.35, speed: 22, ability: "Erdbeben", abilityDesc: "Ersch\xFCttert den Boden (110 %), bet\xE4ubt Gegner im Umkreis 2 Sek.", abilityCd: 10, abilityMana: 12, enchantSlot: "sword" },
  { id: "speer", name: "Speer", kind: "melee_dex", dmgMult: 1.05, speed: 14, ability: "Ansturm", abilityDesc: "Sprintet 6 Bl\xF6cke vorw\xE4rts und durchbohrt Gegner (140 %).", abilityCd: 8, abilityMana: 8, enchantSlot: "sword" },
  { id: "langbogen", name: "Langbogen", kind: "ranged", dmgMult: 1.1, speed: 0, ability: "Gespannter Schuss", abilityDesc: "Halten zum Spannen, loslassen zum Schie\xDFen. Ben\xF6tigt keine Pfeile.", abilityCd: 0, abilityMana: 0, useAnim: "bow", enchantSlot: "bow" },
  { id: "armbrust", name: "Armbrust", kind: "ranged", dmgMult: 1.5, speed: 0, ability: "Bolzenschuss", abilityDesc: "Durchschlagender Bolzen. 1,4 Sek. Nachladezeit. Ben\xF6tigt keine Munition.", abilityCd: 1.4, abilityMana: 0, enchantSlot: "crossbow" },
  { id: "zauberstab", name: "Zauberstab", kind: "magic", dmgMult: 1, speed: 0, ability: "Arkanes Geschoss", abilityDesc: "Feuert ein magisches Geschoss (2 Mana).", abilityCd: 0.6, abilityMana: 2, enchantSlot: "sword" },
  { id: "naturstab", name: "Naturstab", kind: "magic", dmgMult: 0.85, speed: 0, ability: "Dornengeschoss", abilityDesc: "Feuert einen Dorn. Heilt dabei Verb\xFCndete in der N\xE4he leicht (3 Mana).", abilityCd: 0.8, abilityMana: 3, enchantSlot: "sword" }
];
var TIERS = [
  { tier: 1, id: "bronze", name: "Bronze", reqLevel: 1, baseDmg: 7, durability: 400, palette: "bronze", value: 10 },
  { tier: 2, id: "stahl", name: "Stahl", reqLevel: 10, baseDmg: 12, durability: 900, palette: "steel", value: 35 },
  { tier: 3, id: "mondsilber", name: "Mondsilber", reqLevel: 20, baseDmg: 19, durability: 1600, palette: "moonsilver", value: 90 },
  { tier: 4, id: "runenobsidian", name: "Runenobsidian", reqLevel: 30, baseDmg: 28, durability: 2600, palette: "runeobsidian", value: 200 }
];
var WEAPONS = [];
for (const t of WEAPON_TYPES) {
  for (const tier of TIERS) {
    WEAPONS.push({
      id: `${t.id}_${tier.id}`,
      type: t.id,
      tier: tier.tier,
      name: `${tier.name}-${t.name}`.replace("Bronze-Langbogen", "Bronze-Langbogen"),
      reqLevel: tier.reqLevel,
      dmg: Math.round(tier.baseDmg * t.dmgMult * 10) / 10,
      durability: tier.durability,
      palette: tier.palette,
      value: tier.value
    });
  }
}
var UNIQUES = [
  { id: "ylvaris_zorn", type: "zweihaender", tier: 5, name: "Ylvaris' Zorn", reqLevel: 36, dmg: 46, durability: 4e3, palette: "u_ylvaris", value: 500, unique: { effect: "rootburst", desc: "Treffer lassen mit 20 % Chance Wurzeln ausbrechen (150 % Fl\xE4chenschaden).", lore: "Geschmiedet aus einem Ast, der nie verwelkte." } },
  { id: "fluesterklinge", type: "dolch", tier: 5, name: "Fl\xFCsterklinge", reqLevel: 36, dmg: 24, durability: 4e3, palette: "u_whisper", value: 500, unique: { effect: "shadowcrit", desc: "+15 % Krit-Chance. Kritische Treffer machen 2 Sek. unsichtbar.", lore: "Man h\xF6rt sie nur, wenn es zu sp\xE4t ist." } },
  { id: "sternenfall", type: "langbogen", tier: 5, name: "Sternenfall", reqLevel: 36, dmg: 34, durability: 4e3, palette: "u_star", value: 500, unique: { effect: "starfall", desc: "Jeder 4. Schuss ruft einen Sternensplitter herab (200 %).", lore: "Ihre Sehne ist ein Strahl aus Mondlicht." } },
  { id: "herz_des_winters", type: "zauberstab", tier: 5, name: "Herz des Winters", reqLevel: 36, dmg: 33, durability: 4e3, palette: "u_winter", value: 500, unique: { effect: "frostnova", desc: "Geschosse verlangsamen; 15 % Chance auf eine Frostnova.", lore: "Im Kristall schl\xE4gt ein gefrorenes Herz." } },
  { id: "wurzelbrecher", type: "kriegshammer", tier: 5, name: "Wurzelbrecher", reqLevel: 36, dmg: 42, durability: 4e3, palette: "u_root", value: 500, unique: { effect: "quake", desc: "Treffer bet\xE4uben mit 15 % Chance und heilen dich um 3 % LP.", lore: "Er zerschlug einst das Tor der Zitadelle." } },
  { id: "atem_des_hains", type: "naturstab", tier: 5, name: "Atem des Hains", reqLevel: 36, dmg: 29, durability: 4e3, palette: "u_grove", value: 500, unique: { effect: "bloom", desc: "Dornen heilen Verb\xFCndete doppelt so stark; +20 % Heilung.", lore: "Wo er den Boden ber\xFChrt, sprie\xDFen Blumen." } }
];
var ALL_WEAPONS = [...WEAPONS, ...UNIQUES];
function weaponTypeDef(t) {
  return WEAPON_TYPES.find((w) => w.id === t);
}
var ARMOR_SLOTS = [
  { slot: "head", name: "Helm", mcSlot: "slot.armor.head", protShare: 0.15 },
  { slot: "chest", name: "Brustschutz", mcSlot: "slot.armor.chest", protShare: 0.4 },
  { slot: "legs", name: "Beinschutz", mcSlot: "slot.armor.legs", protShare: 0.3 },
  { slot: "feet", name: "Stiefel", mcSlot: "slot.armor.feet", protShare: 0.15 }
];
var ARMOR_SETS = [
  { id: "eichenwacht", name: "Eichenwacht", cls: "krieger", reqLevel: 8, protection: 17, toughness: 2, durability: 500, palette: "oakguard", bonus: { vit: 2, str: 1 }, setBonus: { pieces: 4, desc: "+10 % max. LP, +5 % Widerstand", effects: { "hp%": 0.1, resist: 0.05 } }, value: 40, pieceNames: { head: "Eichenwacht-Helm", chest: "Eichenwacht-Harnisch", legs: "Eichenwacht-Beinschienen", feet: "Eichenwacht-Stiefel" } },
  { id: "pirschleder", name: "Pirschleder", cls: "waldlaeufer", reqLevel: 8, protection: 14, toughness: 1, durability: 420, palette: "stalker", bonus: { dex: 2, vit: 1 }, setBonus: { pieces: 4, desc: "+8 % Krit-Chance, +5 % Tempo", effects: { crit: 0.08, speed: 0.05 } }, value: 40, pieceNames: { head: "Pirscherkapuze", chest: "Pirscherwams", legs: "Pirscherhose", feet: "Pirscherstiefel" } },
  { id: "sternengewebe", name: "Sternengewebe", cls: "magier", reqLevel: 8, protection: 11, toughness: 0, durability: 360, palette: "starweave", bonus: { int: 2, wis: 1 }, setBonus: { pieces: 4, desc: "+15 % max. Mana, +10 % Magieschaden", effects: { "mana%": 0.15, "magic%": 0.1 } }, value: 40, pieceNames: { head: "Sternenhaube", chest: "Sternengewand", legs: "Sternenrock", feet: "Sternenschuhe" } },
  { id: "rindenkleid", name: "Rindenkleid", cls: "druide", reqLevel: 8, protection: 13, toughness: 1, durability: 420, palette: "barkweave", bonus: { wis: 2, vit: 1 }, setBonus: { pieces: 4, desc: "+15 % Heilung, +0,5 % LP-Regeneration/Sek.", effects: { "heal%": 0.15, regen: 5e-3 } }, value: 40, pieceNames: { head: "Rindenkrone", chest: "Rindenkleid", legs: "Rindengamaschen", feet: "Wurzelsohlen" } },
  { id: "weltenbaum", name: "Weltenbaum", reqLevel: 38, protection: 20, toughness: 3, durability: 1400, palette: "worldtree", bonus: { str: 2, dex: 2, int: 2, vit: 3, wis: 2 }, setBonus: { pieces: 4, desc: "+12 % Schaden, +10 % max. LP, +1 % LP-Reg./Sek.", effects: { "dmg%": 0.12, "hp%": 0.1, regen: 0.01 } }, value: 400, pieceNames: { head: "Krone des Weltenbaums", chest: "Herzholz des Weltenbaums", legs: "Wurzeln des Weltenbaums", feet: "Schritte des Weltenbaums" } }
];
var TALISMANS = [
  { id: "talisman_leben", name: "Talisman des Lebens", desc: "+12 % max. LP", icon: "talisman:red", stack: 1, value: 60, category: "talisman", offhand: true, effects: { "hp%": 0.12 }, rarity: "rare" },
  { id: "talisman_macht", name: "Talisman der Macht", desc: "+10 % Schaden", icon: "talisman:orange", stack: 1, value: 60, category: "talisman", offhand: true, effects: { "dmg%": 0.1 }, rarity: "rare" },
  { id: "talisman_weisheit", name: "Talisman der Weisheit", desc: "+20 % Mana-Regeneration, +10 % max. Mana", icon: "talisman:blue", stack: 1, value: 60, category: "talisman", offhand: true, effects: { manaregen: 0.2, "mana%": 0.1 }, rarity: "rare" },
  { id: "talisman_glueck", name: "Talisman des Gl\xFCcks", desc: "+25 % Gold, +15 % Chance auf bessere Beute", icon: "talisman:green", stack: 1, value: 60, category: "talisman", offhand: true, effects: { gold: 0.25, luck: 0.15 }, rarity: "rare" },
  { id: "talisman_wind", name: "Talisman des Windes", desc: "+10 % Tempo, -8 % Abklingzeiten", icon: "talisman:white", stack: 1, value: 60, category: "talisman", offhand: true, effects: { speed: 0.1, cdr: 0.08 }, rarity: "rare" },
  { id: "talisman_waechter", name: "Talisman des W\xE4chters", desc: "+8 % Widerstand, +0,5 % LP-Reg./Sek.", icon: "talisman:purple", stack: 1, value: 60, category: "talisman", offhand: true, effects: { resist: 0.08, regen: 5e-3 }, rarity: "rare" }
];
var CONSUMABLES = [
  { id: "heiltrank_klein", name: "Kleiner Heiltrank", desc: "Heilt sofort 25 % LP.", icon: "potion:red:1", stack: 16, value: 4, category: "consumable", use: "drink", effects: { heal: 0.25 } },
  { id: "heiltrank", name: "Heiltrank", desc: "Heilt sofort 45 % LP.", icon: "potion:red:2", stack: 16, value: 10, category: "consumable", use: "drink", effects: { heal: 0.45 } },
  { id: "heiltrank_gross", name: "Gro\xDFer Heiltrank", desc: "Heilt sofort 70 % LP.", icon: "potion:red:3", stack: 16, value: 22, category: "consumable", use: "drink", effects: { heal: 0.7 } },
  { id: "manatrank_klein", name: "Kleiner Manatrank", desc: "Stellt 30 % Mana wieder her.", icon: "potion:blue:1", stack: 16, value: 4, category: "consumable", use: "drink", effects: { mana: 0.3 } },
  { id: "manatrank", name: "Manatrank", desc: "Stellt 55 % Mana wieder her.", icon: "potion:blue:2", stack: 16, value: 10, category: "consumable", use: "drink", effects: { mana: 0.55 } },
  { id: "manatrank_gross", name: "Gro\xDFer Manatrank", desc: "Stellt 85 % Mana wieder her.", icon: "potion:blue:3", stack: 16, value: 22, category: "consumable", use: "drink", effects: { mana: 0.85 } },
  { id: "elixier_staerke", name: "Elixier der St\xE4rke", desc: "+15 % Schaden f\xFCr 5 Minuten.", icon: "flask:orange", stack: 8, value: 30, category: "consumable", use: "drink", effects: { buff_dmg: 300 } },
  { id: "elixier_zaehigkeit", name: "Elixier der Z\xE4higkeit", desc: "+15 % Widerstand f\xFCr 5 Minuten.", icon: "flask:gray", stack: 8, value: 30, category: "consumable", use: "drink", effects: { buff_resist: 300 } },
  { id: "elixier_weisheit", name: "Elixier der Weisheit", desc: "+20 % Erfahrung f\xFCr 10 Minuten.", icon: "flask:purple", stack: 8, value: 40, category: "consumable", use: "drink", effects: { buff_xp: 600 } },
  { id: "elixier_eile", name: "Elixier der Eile", desc: "Tempo und Eile f\xFCr 5 Minuten.", icon: "flask:yellow", stack: 8, value: 25, category: "consumable", use: "drink", effects: { buff_speed: 300 } },
  { id: "rueckkehrschriftrolle", name: "Schriftrolle der R\xFCckkehr", desc: "Bringt dich nach 3 Sek. Konzentration zum Hain zur\xFCck.", icon: "scroll:green", stack: 16, value: 12, category: "consumable", use: "use", effects: { recall: 1 } }
];
var MATERIALS = [
  { id: "faeulnisessenz", name: "F\xE4ulnisessenz", desc: "Z\xE4hfl\xFCssige Essenz des Welkens.", icon: "essence:purple", stack: 64, value: 2, category: "material" },
  { id: "moosherz", name: "Moosherz", desc: "Pochendes Herz eines Mooslings.", icon: "orb:green", stack: 64, value: 2, category: "material" },
  { id: "dornenfang", name: "Dornenfang", desc: "Ein Rei\xDFzahn voller Dornen.", icon: "fang:green", stack: 64, value: 3, category: "material" },
  { id: "moorschleim", name: "Moorschleim", desc: "Riecht nach altem Sumpf.", icon: "slime:olive", stack: 64, value: 3, category: "material" },
  { id: "skorpionstachel", name: "Skorpionstachel", desc: "Noch immer giftig.", icon: "fang:orange", stack: 64, value: 4, category: "material" },
  { id: "frostsplitter", name: "Frostsplitter", desc: "Schmilzt niemals.", icon: "crystal:ice", stack: 64, value: 4, category: "material" },
  { id: "schattenkristall", name: "Schattenkristall", desc: "Schluckt das Licht um sich herum.", icon: "crystal:shadow", stack: 64, value: 5, category: "material" },
  { id: "runenstaub", name: "Runenstaub", desc: "Glitzernder Staub zum Verst\xE4rken von Ausr\xFCstung.", icon: "dust:cyan", stack: 64, value: 6, category: "material" },
  { id: "mondsilberbarren", name: "Mondsilberbarren", desc: "Schimmert selbst in der Nacht.", icon: "ingot:moon", stack: 64, value: 12, category: "material" },
  { id: "uraltes_harz", name: "Uraltes Harz", desc: "Harz des Weltenbaums. Sehr selten.", icon: "gem:amber", stack: 64, value: 25, category: "material" }
];
var QUEST_ITEMS = [
  { id: "samen", name: "Samen des Weltenbaums", desc: "Pflanze ihn an einem Ort deiner Wahl (Benutzen auf Gras oder Erde).", icon: "seed", stack: 1, value: 0, category: "quest", glint: true, rarity: "epic" },
  { id: "buch", name: "Abenteuerbuch", desc: "Quests, Charakter, F\xE4higkeiten und mehr. Benutzen zum \xD6ffnen.", icon: "book", stack: 1, value: 0, category: "quest" },
  { id: "verwelkte_seite", name: "Verwelkte Tagebuchseite", desc: "Eine alte Seite in feiner Handschrift.", icon: "page", stack: 16, value: 0, category: "quest" },
  { id: "wurzelsplitter", name: "Wurzelsplitter", desc: "Ein Splitter eines befreiten Wurzelherzens. Er pulsiert warm.", icon: "crystal:gold", stack: 16, value: 0, category: "quest", glint: true },
  { id: "kaels_amulett", name: "Kaels Amulett", desc: "Ein zerkratztes Amulett mit zwei Namen.", icon: "amulet", stack: 1, value: 0, category: "quest" },
  { id: "muenzbeutel", name: "M\xFCnzbeutel", desc: "Enth\xE4lt Gold. Benutzen, um es zu erhalten.", icon: "pouch", stack: 1, value: 0, category: "misc" },
  { id: "beschwoerungsstein", name: "Beschw\xF6rungsstein", desc: "Legt ihn auf den Altar im Hain, um den Uralten zu rufen.", icon: "crystal:red", stack: 16, value: 0, category: "quest", glint: true, rarity: "epic" }
];
var RUNES = ABILITIES.map((a) => ({
  id: `rune_${a.id}`,
  name: `Rune: ${a.name}`,
  desc: a.desc,
  icon: `rune:${a.glyph}`,
  stack: 1,
  value: 0,
  category: "rune",
  rarity: a.ult ? "epic" : "rare"
}));
var ALL_SIMPLE = [...TALISMANS, ...CONSUMABLES, ...MATERIALS, ...QUEST_ITEMS, ...RUNES];
function simpleItem(id) {
  return ALL_SIMPLE.find((s2) => s2.id === id);
}

// src/core/bus.ts
var handlers = {};
function on(k, h) {
  (handlers[k] ??= []).push(h);
}
function emit(k, ev) {
  const list = handlers[k];
  if (!list) return;
  for (const h of list) {
    try {
      h(ev);
    } catch (e) {
      console.warn(`[CdW] Bus-Fehler (${k}): ${String(e)} ${e?.stack ?? ""}`);
    }
  }
}

// src/systems/gear.ts
import { ItemStack, ItemLockMode } from "@minecraft/server";
var NS = "cdw:";
var PROP = "cdw:g";
var weaponById = new Map(ALL_WEAPONS.map((w) => [NS + w.id, w]));
var armorById = /* @__PURE__ */ new Map();
for (const s2 of ARMOR_SETS) for (const sl of ARMOR_SLOTS) armorById.set(`${NS}${s2.id}_${sl.slot}`, { set: s2, slot: sl.slot });
function weaponOf(typeId) {
  return typeId ? weaponById.get(typeId) : void 0;
}
function armorOf(typeId) {
  return typeId ? armorById.get(typeId) : void 0;
}
function isGear(typeId) {
  return weaponById.has(typeId) || armorById.has(typeId);
}
var AFFIX_NAMES = {
  str: (v) => `+${v} ${ATTR_NAMES.str}`,
  dex: (v) => `+${v} ${ATTR_NAMES.dex}`,
  int: (v) => `+${v} ${ATTR_NAMES.int}`,
  vit: (v) => `+${v} ${ATTR_NAMES.vit}`,
  wis: (v) => `+${v} ${ATTR_NAMES.wis}`,
  crit: (v) => `+${pct(v)} Krit-Chance`,
  critdmg: (v) => `+${pct(v)} Krit-Schaden`,
  "hp%": (v) => `+${pct(v)} max. Leben`,
  "mana%": (v) => `+${pct(v)} max. Mana`,
  "dmg%": (v) => `+${pct(v)} Schaden`,
  resist: (v) => `+${pct(v)} Widerstand`,
  lifesteal: (v) => `+${pct(v)} Lebensraub`,
  regen: (v) => `+${pct(v)} Leben/Sek.`,
  speed: (v) => `+${pct(v)} Tempo`,
  cdr: (v) => `-${pct(v)} Abklingzeiten`,
  manaregen: (v) => `+${pct(v)} Mana-Regeneration`,
  gold: (v) => `+${pct(v)} Gold`,
  luck: (v) => `+${pct(v)} Beutegl\xFCck`
};
function pct(v) {
  const p = Math.round(v * 1e3) / 10;
  return `${p.toString().replace(".", ",")} %`;
}
var WEAPON_AFFIXES = ["str", "dex", "int", "vit", "wis", "crit", "critdmg", "dmg%", "lifesteal", "cdr", "mana%"];
var ARMOR_AFFIXES = ["str", "dex", "int", "vit", "wis", "hp%", "resist", "regen", "speed", "manaregen", "mana%"];
function rollAffix(key, tier) {
  const t = Math.max(1, tier);
  switch (key) {
    case "str":
    case "dex":
    case "int":
    case "vit":
    case "wis":
      return randInt(1 + t, 3 + t * 2);
    case "crit":
      return Math.round(rand(0.01, 0.015 + 0.01 * t) * 1e3) / 1e3;
    case "critdmg":
      return Math.round(rand(0.05, 0.06 + 0.04 * t) * 100) / 100;
    case "dmg%":
      return Math.round(rand(0.02, 0.03 + 0.02 * t) * 100) / 100;
    case "hp%":
      return Math.round(rand(0.02, 0.03 + 0.015 * t) * 100) / 100;
    case "mana%":
      return Math.round(rand(0.03, 0.04 + 0.02 * t) * 100) / 100;
    case "resist":
      return Math.round(rand(0.01, 0.015 + 8e-3 * t) * 1e3) / 1e3;
    case "lifesteal":
      return Math.round(rand(0.01, 0.012 + 6e-3 * t) * 1e3) / 1e3;
    case "regen":
      return Math.round(rand(1e-3, 2e-3 + 1e-3 * t) * 1e3) / 1e3;
    case "speed":
      return Math.round(rand(0.02, 0.03 + 0.01 * t) * 100) / 100;
    case "cdr":
      return Math.round(rand(0.02, 0.025 + 0.012 * t) * 1e3) / 1e3;
    case "manaregen":
      return Math.round(rand(0.05, 0.08 + 0.04 * t) * 100) / 100;
    default:
      return 0;
  }
}
function rollRarity(luck = 0, minRarity = 0) {
  const opts = RARITIES.map((r, i) => ({ i, weight: i === 0 ? r.weight * (1 - Math.min(0.5, luck)) : r.weight * (1 + luck * 2) })).filter((o) => o.i >= minRarity);
  return weighted(opts).i;
}
function rollGear(typeId, rarity, luck = 0) {
  const w = weaponOf(typeId);
  const a = armorOf(typeId);
  const tier = w ? w.tier : a ? Math.max(1, Math.round(a.set.reqLevel / 10)) : 1;
  let r = rarity ?? rollRarity(luck);
  if (w?.unique) r = 4;
  const count = RARITIES[r].affixes;
  const pool = [...w ? WEAPON_AFFIXES : ARMOR_AFFIXES];
  const affixes = {};
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const key = pool.splice(idx, 1)[0];
    affixes[key] = rollAffix(key, tier + (r >= 3 ? 1 : 0));
  }
  return { r, a: affixes, u: 0 };
}
function getGear(item) {
  if (!item) return void 0;
  try {
    const raw = item.getDynamicProperty(PROP);
    if (typeof raw === "string") return JSON.parse(raw);
  } catch {
  }
  return void 0;
}
function setGear(item, g) {
  item.setDynamicProperty(PROP, JSON.stringify(g));
  applyLore(item, g);
}
function weaponDamage(w, g) {
  const rm = g ? RARITIES[g.r]?.statMult ?? 1 : 1;
  return w.dmg * rm * (1 + (g?.u ?? 0) * UPGRADE_DMG_PER_LEVEL);
}
function armorBonusMult(g) {
  return (g ? RARITIES[g.r]?.statMult ?? 1 : 1) * (1 + (g?.u ?? 0) * 0.06);
}
function displayName(typeId, g) {
  const w = weaponOf(typeId);
  const a = armorOf(typeId);
  const base = w ? w.name : a ? a.set.pieceNames[a.slot] : typeId;
  if (!g) return base;
  const rar = RARITIES[g.r];
  return `${rar.color}${base}${g.u > 0 ? ` \xA7e+${g.u}` : ""}`;
}
function applyLore(item, g) {
  const w = weaponOf(item.typeId);
  const a = armorOf(item.typeId);
  const rar = RARITIES[g.r];
  const lines = [];
  lines.push(`${rar.color}${rar.name}\xA7r\xA77${w ? " \xB7 " + (weaponTypeDef(w.type)?.name ?? "") : a ? " \xB7 R\xFCstung" : ""}`);
  if (w) {
    lines.push(`\xA7fSchaden: \xA7c${Math.round(weaponDamage(w, g) * 10) / 10}`);
    lines.push(`\xA77Ben\xF6tigt Stufe ${w.reqLevel}`);
  } else if (a) {
    const sl = ARMOR_SLOTS.find((s2) => s2.slot === a.slot);
    lines.push(`\xA7fR\xFCstung: \xA7b${Math.max(1, Math.round(a.set.protection * sl.protShare))}`);
    const m = armorBonusMult(g);
    for (const [k, v] of Object.entries(a.set.bonus)) lines.push(`\xA7a${AFFIX_NAMES[k]?.(Math.round(v * m)) ?? k}`);
    lines.push(`\xA77Ben\xF6tigt Stufe ${a.set.reqLevel}${a.set.cls ? " \xB7 Klassenset" : ""}`);
  }
  for (const [k, v] of Object.entries(g.a)) lines.push(`${rar.color}${AFFIX_NAMES[k]?.(v) ?? k}`);
  if (w?.unique) {
    lines.push(`\xA76${w.unique.desc.slice(0, 48)}`);
    if (w.unique.desc.length > 48) lines.push(`\xA76${w.unique.desc.slice(48, 96)}`);
    lines.push(`\xA78\xA7o${w.unique.lore.slice(0, 48)}`);
  } else if (w) {
    const t = weaponTypeDef(w.type);
    if (t && t.abilityCd > 0 && t.kind !== "magic") lines.push(`\xA78Benutzen: ${t.ability}`);
  }
  if (a) lines.push(`\xA78Set (${a.set.setBonus.pieces}): ${a.set.setBonus.desc.slice(0, 40)}`);
  item.setLore(lines.map((l) => l.slice(0, 60)));
  item.nameTag = displayName(item.typeId, g);
}
function createGear(typeId, rarity, luck = 0) {
  const item = new ItemStack(typeId, 1);
  const g = rollGear(typeId, rarity, luck);
  setGear(item, g);
  item.keepOnDeath = true;
  return item;
}
function ensureItem(item) {
  const id = item.typeId;
  if (!id.startsWith(NS)) return void 0;
  let changed = false;
  if (isGear(id) && !getGear(item)) {
    setGear(item, rollGear(id));
    changed = true;
  }
  const s2 = simpleItem(id.slice(NS.length));
  const shouldKeep = isGear(id) || s2?.category === "rune" || s2?.category === "talisman" || id === NS + "buch";
  if (shouldKeep && !item.keepOnDeath) {
    item.keepOnDeath = true;
    changed = true;
  }
  if ((s2?.category === "rune" || id === NS + "buch") && item.lockMode !== ItemLockMode.inventory) {
    item.lockMode = ItemLockMode.inventory;
    changed = true;
  }
  return changed ? item : void 0;
}
function equippable(p) {
  return p.getComponent("minecraft:equippable");
}
function getEquip(p, slot) {
  try {
    return equippable(p)?.getEquipment(slot);
  } catch {
    return void 0;
  }
}
function randomGearFor(level2, cls, armorChance = 0.25) {
  const tier = level2 < 10 ? 1 : level2 < 20 ? 2 : level2 < 30 ? 3 : 4;
  if (Math.random() < armorChance && level2 >= 8) {
    const sets = ARMOR_SETS.filter((s2) => (s2.cls === cls || !s2.cls && level2 >= 38) && s2.reqLevel <= level2 + 2);
    if (sets.length) {
      const set = pick(sets);
      return `${NS}${set.id}_${pick(ARMOR_SLOTS).slot}`;
    }
  }
  const classTypes = WEAPON_TYPES.filter((t2) => !cls || Math.random() < 0.25 || (CLASS_WEAPONS[cls] ?? []).includes(t2.id));
  const t = pick(classTypes.length ? classTypes : WEAPON_TYPES);
  const tierId = ["bronze", "stahl", "mondsilber", "runenobsidian"][tier - 1];
  return `${NS}${t.id}_${tierId}`;
}
var CLASS_WEAPONS = {
  krieger: ["schwert", "zweihaender", "streitaxt", "kriegshammer"],
  waldlaeufer: ["langbogen", "armbrust", "speer", "dolch"],
  magier: ["zauberstab", "dolch"],
  druide: ["naturstab", "dolch", "speer"]
};
function talismanEffects(typeId) {
  if (!typeId) return void 0;
  return TALISMANS.find((t) => NS + t.id === typeId)?.effects;
}
var RARITY_IDS = RARITIES.map((r) => r.id);

// src/systems/mobs.ts
import { world as world3 } from "@minecraft/server";

// src/data/mobs.ts
var BLIGHT = ["monster", "cdw_blight"];
var MOBS = [
  // --- Wald (Akt 1) ---
  { id: "moosling", name: "Moosling", act: 1, arch: "leaper", model: "blob", skin: "moss", health: 10, damage: 2, speed: 0.3, xpMult: 0.6, goldMult: 0.6, families: [...BLIGHT, "cdw_forest"], collision: [0.7, 0.7], spawn: { biomes: ["forest", "birch", "roofed", "taiga"], weight: 30, herd: [2, 4], density: 6 }, drops: [{ item: "moosherz", chance: 0.5 }, { item: "faeulnisessenz", chance: 0.25 }] },
  { id: "dornenwolf", name: "Dornenwolf", act: 1, arch: "melee", model: "quad_wolf", skin: "thornwolf", health: 18, damage: 4, speed: 0.33, xpMult: 1, goldMult: 1, families: [...BLIGHT, "cdw_forest"], collision: [0.8, 0.9], spawn: { biomes: ["forest", "taiga", "birch"], weight: 18, herd: [1, 3], density: 4 }, drops: [{ item: "dornenfang", chance: 0.55 }, { item: "faeulnisessenz", chance: 0.3 }], glow: true },
  { id: "rindenschreck_setzling", name: "Rindenschreck-Setzling", act: 1, arch: "melee", model: "treant", skin: "treant_young", health: 34, damage: 5, speed: 0.2, xpMult: 1.5, goldMult: 1.4, families: [...BLIGHT, "cdw_forest"], collision: [0.9, 2], spawn: { biomes: ["forest", "roofed"], weight: 10, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.6 }, { item: "minecraft:stick", chance: 0.8, min: 1, max: 3 }], glow: true },
  // --- Moor (Akt 2) ---
  { id: "moorschlurfer", name: "Moorschlurfer", act: 2, arch: "melee", model: "humanoid_big", skin: "bog", health: 26, damage: 4, speed: 0.22, xpMult: 1.1, goldMult: 1, families: [...BLIGHT, "cdw_swamp", "undead"], collision: [0.7, 1.95], spawn: { biomes: ["swamp", "mangrove_swamp"], weight: 25, herd: [1, 3], density: 5 }, drops: [{ item: "moorschleim", chance: 0.5 }, { item: "faeulnisessenz", chance: 0.3 }], effectOnHit: { id: "slowness", seconds: 2, amp: 0 } },
  { id: "schlammkroete", name: "Schlammkr\xF6te", act: 2, arch: "leaper", model: "toad", skin: "toad", health: 22, damage: 5, speed: 0.25, xpMult: 1, goldMult: 1, families: [...BLIGHT, "cdw_swamp"], collision: [0.9, 0.8], spawn: { biomes: ["swamp", "mangrove_swamp", "river"], weight: 18, herd: [1, 2], density: 4 }, drops: [{ item: "moorschleim", chance: 0.6 }], effectOnHit: { id: "poison", seconds: 3, amp: 0 } },
  { id: "seufzergeist", name: "Seufzergeist", act: 2, arch: "hover_ranged", model: "wraith", skin: "sighghost", health: 20, damage: 3, speed: 0.25, xpMult: 1.3, goldMult: 1.2, families: [...BLIGHT, "cdw_swamp", "undead"], collision: [0.7, 1.6], spawn: { biomes: ["swamp", "mangrove_swamp"], weight: 12, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.7 }], projectile: "blight_bolt", glow: true },
  // --- Glutsand (Akt 3) ---
  { id: "glutskorpion", name: "Glutskorpion", act: 3, arch: "melee", model: "scorpion", skin: "scorpion", health: 26, damage: 5, speed: 0.3, xpMult: 1.2, goldMult: 1.1, families: [...BLIGHT, "cdw_desert", "arthropod"], collision: [1.2, 0.8], spawn: { biomes: ["desert", "mesa"], weight: 22, herd: [1, 2], density: 4 }, drops: [{ item: "skorpionstachel", chance: 0.5 }], effectOnHit: { id: "poison", seconds: 4, amp: 0 }, fireImmune: true },
  { id: "verdorrter_priester", name: "Verdorrter Priester", act: 3, arch: "melee", model: "humanoid_thin", skin: "mummy", health: 30, damage: 5, speed: 0.24, xpMult: 1.3, goldMult: 1.3, families: [...BLIGHT, "cdw_desert", "undead"], collision: [0.6, 1.95], spawn: { biomes: ["desert", "mesa"], weight: 16, herd: [1, 2], density: 3, nightOnly: true }, drops: [{ item: "verwelkte_seite", chance: 0.04 }, { item: "faeulnisessenz", chance: 0.4 }, { item: "minecraft:gold_nugget", chance: 0.5, min: 1, max: 4 }], effectOnHit: { id: "wither", seconds: 3, amp: 0 } },
  { id: "glutgeist", name: "Glutgeist", act: 3, arch: "hover_ranged", model: "wisp", skin: "emberwisp", health: 18, damage: 4, speed: 0.28, xpMult: 1.2, goldMult: 1.1, families: [...BLIGHT, "cdw_desert"], collision: [0.7, 1], spawn: { biomes: ["desert", "mesa", "savanna"], weight: 10, herd: [1, 2], density: 2 }, drops: [{ item: "minecraft:blaze_powder", chance: 0.35 }, { item: "faeulnisessenz", chance: 0.35 }], projectile: "fire_bolt", fireImmune: true, glow: true },
  // --- Frostkrone (Akt 4) ---
  { id: "eiskobold", name: "Eiskobold", act: 4, arch: "melee", model: "humanoid_small", skin: "icekobold", health: 18, damage: 4, speed: 0.36, xpMult: 0.9, goldMult: 1, families: [...BLIGHT, "cdw_frost"], collision: [0.6, 1.2], spawn: { biomes: ["frozen", "cold", "ice", "mountains"], weight: 22, herd: [2, 4], density: 6 }, drops: [{ item: "frostsplitter", chance: 0.45 }], effectOnHit: { id: "slowness", seconds: 2, amp: 0 }, glow: true },
  { id: "frosttroll", name: "Frosttroll", act: 4, arch: "melee", model: "troll", skin: "frosttroll", health: 60, damage: 8, speed: 0.22, scale: 1, xpMult: 2.4, goldMult: 2.2, families: [...BLIGHT, "cdw_frost"], collision: [1.3, 2.7], spawn: { biomes: ["frozen", "cold", "mountains"], weight: 8, herd: [1, 1], density: 1 }, drops: [{ item: "frostsplitter", chance: 0.9, min: 1, max: 3 }, { item: "runenstaub", chance: 0.15 }] },
  { id: "reifkraehe", name: "Reifkr\xE4he", act: 4, arch: "hover_melee", model: "bird", skin: "frostcrow", health: 14, damage: 3, speed: 0.4, xpMult: 0.9, goldMult: 0.8, families: [...BLIGHT, "cdw_frost"], collision: [0.7, 0.7], spawn: { biomes: ["frozen", "cold", "taiga", "mountains"], weight: 14, herd: [2, 3], density: 4 }, drops: [{ item: "frostsplitter", chance: 0.3 }, { item: "minecraft:feather", chance: 0.6, min: 1, max: 2 }], glow: true },
  // --- Schattenwurzel (Akt 5) ---
  { id: "kristallspinne", name: "Kristallspinne", act: 5, arch: "melee", model: "spider", skin: "crystalspider", health: 24, damage: 5, speed: 0.32, xpMult: 1.1, goldMult: 1.1, families: [...BLIGHT, "cdw_deep", "arthropod"], collision: [1.3, 0.8], spawn: { biomes: ["overworld"], weight: 14, herd: [1, 2], density: 3, underground: true }, drops: [{ item: "schattenkristall", chance: 0.4 }, { item: "minecraft:string", chance: 0.6, min: 1, max: 2 }], effectOnHit: { id: "poison", seconds: 3, amp: 0 }, glow: true },
  { id: "schattenkriecher", name: "Schattenkriecher", act: 5, arch: "melee", model: "crawler", skin: "shadowcrawler", health: 26, damage: 6, speed: 0.3, xpMult: 1.3, goldMult: 1.2, families: [...BLIGHT, "cdw_deep"], collision: [0.9, 1], spawn: { biomes: ["overworld"], weight: 10, herd: [1, 2], density: 2, underground: true }, drops: [{ item: "schattenkristall", chance: 0.5 }], effectOnHit: { id: "blindness", seconds: 3, amp: 0 }, glow: true },
  { id: "wurzelgolem", name: "Wurzelgolem", act: 5, arch: "melee", model: "golem", skin: "rootgolem", health: 80, damage: 9, speed: 0.18, xpMult: 2.8, goldMult: 2.5, families: [...BLIGHT, "cdw_deep"], collision: [1.4, 2.6], spawn: { biomes: ["overworld"], weight: 4, herd: [1, 1], density: 1, underground: true }, drops: [{ item: "schattenkristall", chance: 0.8, min: 1, max: 2 }, { item: "runenstaub", chance: 0.3 }], glow: true },
  // --- Überall ---
  { id: "faeulnisgeist", name: "F\xE4ulnisgeist", act: 0, arch: "hover_melee", model: "wraith", skin: "blightwraith", health: 20, damage: 4, speed: 0.3, xpMult: 1.2, goldMult: 1, families: [...BLIGHT, "undead"], collision: [0.7, 1.6], spawn: { biomes: ["plains", "forest", "taiga", "savanna", "meadow", "birch", "jungle", "cherry_grove"], weight: 8, herd: [1, 1], density: 2, nightOnly: true }, drops: [{ item: "faeulnisessenz", chance: 0.8 }], effectOnHit: { id: "weakness", seconds: 4, amp: 0 }, glow: true },
  { id: "goblin_pluenderer", name: "Goblin-Pl\xFCnderer", act: 0, arch: "melee", model: "humanoid_small", skin: "goblin", health: 16, damage: 4, speed: 0.34, xpMult: 0.9, goldMult: 1.8, families: ["monster", "cdw_goblin"], collision: [0.6, 1.2], spawn: { biomes: ["plains", "savanna", "forest", "meadow", "taiga"], weight: 8, herd: [2, 3], density: 3 }, drops: [{ item: "minecraft:gold_nugget", chance: 0.7, min: 1, max: 5 }, { item: "heiltrank_klein", chance: 0.08 }] },
  { id: "goblin_schuetze", name: "Goblin-Sch\xFCtze", act: 0, arch: "ranged", model: "humanoid_small", skin: "goblin_archer", health: 14, damage: 3, speed: 0.3, xpMult: 1, goldMult: 1.8, families: ["monster", "cdw_goblin"], collision: [0.6, 1.2], spawn: { biomes: ["plains", "savanna", "forest", "meadow"], weight: 5, herd: [1, 2], density: 2 }, drops: [{ item: "minecraft:arrow", chance: 0.6, min: 1, max: 4 }, { item: "minecraft:gold_nugget", chance: 0.5, min: 1, max: 3 }], projectile: "goblin_arrow" },
  // --- Bosse ---
  { id: "boss_rindenschreck", name: "Rindenschreck", act: 1, arch: "boss_melee", model: "treant", skin: "treant_boss", health: 140, damage: 7, speed: 0.22, scale: 2, xpMult: 12, goldMult: 15, families: [...BLIGHT, "cdw_boss"], collision: [1.8, 4], drops: [{ item: "runenstaub", chance: 1, min: 3, max: 5 }, { item: "uraltes_harz", chance: 0.5 }], boss: { title: "Rindenschreck, der Verderbte Ent", color: "green", fixedLevel: 10, adds: ["moosling"] }, glow: true },
  { id: "boss_moorschlund", name: "Moorschlund", act: 2, arch: "boss_melee", model: "toad", skin: "toad_boss", health: 170, damage: 8, speed: 0.24, scale: 3, xpMult: 14, goldMult: 18, families: [...BLIGHT, "cdw_boss"], collision: [2.6, 2.2], drops: [{ item: "runenstaub", chance: 1, min: 4, max: 6 }, { item: "uraltes_harz", chance: 0.6 }], boss: { title: "Moorschlund, Herr des Seufzermoors", color: "green", fixedLevel: 17, adds: ["schlammkroete"] }, effectOnHit: { id: "poison", seconds: 4, amp: 1 } },
  { id: "boss_glutkoenigin", name: "Glutk\xF6nigin", act: 3, arch: "boss_melee", model: "scorpion", skin: "scorpion_boss", health: 200, damage: 9, speed: 0.28, scale: 2.8, xpMult: 16, goldMult: 20, families: [...BLIGHT, "cdw_boss"], collision: [3, 2], drops: [{ item: "runenstaub", chance: 1, min: 5, max: 7 }, { item: "uraltes_harz", chance: 0.7 }], boss: { title: "Die Glutk\xF6nigin", color: "red", fixedLevel: 24, adds: ["glutskorpion"] }, fireImmune: true, effectOnHit: { id: "poison", seconds: 4, amp: 1 }, glow: true },
  { id: "boss_hrimgar", name: "Hrimgar", act: 4, arch: "boss_melee", model: "troll", skin: "hrimgar", health: 240, damage: 10, speed: 0.24, scale: 1.7, xpMult: 18, goldMult: 22, families: [...BLIGHT, "cdw_boss"], collision: [2.2, 4.5], drops: [{ item: "runenstaub", chance: 1, min: 6, max: 8 }, { item: "uraltes_harz", chance: 0.8 }], boss: { title: "Hrimgar, der Frostkoloss", color: "blue", fixedLevel: 32, adds: ["eiskobold"] }, effectOnHit: { id: "slowness", seconds: 3, amp: 1 }, glow: true },
  { id: "boss_kristallmutter", name: "Kristallmutter", act: 5, arch: "boss_melee", model: "spider", skin: "crystalspider_boss", health: 280, damage: 11, speed: 0.28, scale: 2.8, xpMult: 20, goldMult: 25, families: [...BLIGHT, "cdw_boss"], collision: [3.4, 2], drops: [{ item: "runenstaub", chance: 1, min: 7, max: 9 }, { item: "uraltes_harz", chance: 1 }], boss: { title: "Die Kristallmutter", color: "purple", fixedLevel: 38, adds: ["kristallspinne"] }, effectOnHit: { id: "poison", seconds: 4, amp: 1 }, glow: true },
  { id: "boss_morvath", name: "Morvath", act: 6, arch: "boss_ranged", model: "druid", skin: "morvath", health: 260, damage: 10, speed: 0.26, scale: 1.25, xpMult: 25, goldMult: 30, families: [...BLIGHT, "cdw_boss"], collision: [0.8, 2.5], drops: [], projectile: "blight_bolt_big", boss: { title: "Morvath, der Welkende", color: "purple", fixedLevel: 40, phases: 2, adds: ["faeulnisgeist"] }, glow: true },
  { id: "boss_welkenbestie", name: "Welkenbestie", act: 6, arch: "boss_melee", model: "golem", skin: "witherbeast", health: 360, damage: 12, speed: 0.24, scale: 1.9, xpMult: 30, goldMult: 40, families: [...BLIGHT, "cdw_boss"], collision: [2.6, 5], drops: [{ item: "runenstaub", chance: 1, min: 10, max: 14 }, { item: "uraltes_harz", chance: 1, min: 2, max: 3 }], boss: { title: "Die Welkenbestie", color: "purple", fixedLevel: 41, adds: ["wurzelgolem"] }, effectOnHit: { id: "wither", seconds: 3, amp: 1 }, glow: true },
  { id: "boss_wurzelwyrm", name: "Der Uralte Wurzelwyrm", act: 7, arch: "boss_ranged", model: "wyrm", skin: "wyrm", health: 500, damage: 13, speed: 0.22, scale: 1.6, xpMult: 40, goldMult: 60, families: [...BLIGHT, "cdw_boss"], collision: [3, 3.5], drops: [{ item: "runenstaub", chance: 1, min: 12, max: 16 }, { item: "uraltes_harz", chance: 1, min: 3, max: 5 }], projectile: "blight_bolt_big", boss: { title: "Der Uralte Wurzelwyrm", color: "yellow", fixedLevel: 50, adds: ["faeulnisgeist", "wurzelgolem"] }, glow: true }
];
function mobById(id) {
  return MOBS.find((m) => m.id === id);
}
var PROJECTILES = [
  { id: "arcane_bolt", model: "orb", skin: "arcane", gravity: 0, power: 2.2, particle: "arcane", impactDamage: 1 },
  { id: "thorn_bolt", model: "thorn", skin: "thorn", gravity: 0.01, power: 2, particle: "leaf", impactDamage: 1 },
  { id: "fireball", model: "orb", skin: "fire", gravity: 0, power: 1.6, particle: "fire", scale: 1.4, impactDamage: 1 },
  { id: "frost_lance", model: "shard", skin: "frost", gravity: 0, power: 2.6, particle: "frost", impactDamage: 1 },
  { id: "poison_arrow", model: "arrow", skin: "poison_arrow", gravity: 0.03, power: 2.6, particle: "poison", impactDamage: 1 },
  { id: "ranger_arrow", model: "arrow", skin: "ranger_arrow", gravity: 0.03, power: 2.8, particle: "none", impactDamage: 1 },
  { id: "meteor", model: "orb", skin: "fire", gravity: 0.06, power: 1.2, particle: "fire", scale: 3, fire: true, impactDamage: 1 },
  { id: "blight_bolt", model: "orb", skin: "blight", gravity: 0, power: 1.2, particle: "blight", impactDamage: 4 },
  { id: "blight_bolt_big", model: "orb", skin: "blight", gravity: 0, power: 1.3, particle: "blight", scale: 1.8, impactDamage: 7 },
  { id: "fire_bolt", model: "orb", skin: "fire", gravity: 0, power: 1.2, particle: "fire", impactDamage: 4, fire: true },
  { id: "goblin_arrow", model: "arrow", skin: "goblin_arrow", gravity: 0.04, power: 1.6, particle: "none", impactDamage: 3 }
];
var NPCS = [
  { id: "sylva", variant: 0, name: "Sylva", title: "H\xFCterin des Hains", skin: "npc_sylva", stage: 0 },
  { id: "fennick", variant: 1, name: "Fennick", title: "Fahrender H\xE4ndler", skin: "npc_fennick", stage: 0 },
  { id: "kael", variant: 2, name: "Kael", title: "Waldl\xE4ufer & Kopfgeldj\xE4ger", skin: "npc_kael", stage: 1 },
  { id: "brom", variant: 3, name: "Brom Eisenwurz", title: "Schmied", skin: "npc_brom", stage: 1 },
  { id: "mira", variant: 4, name: "Mira Tauglanz", title: "Alchemistin", skin: "npc_mira", stage: 2 },
  { id: "oswin", variant: 5, name: "Oswin", title: "Bibliothekar & Chronist", skin: "npc_oswin", stage: 3 },
  { id: "morgra", variant: 6, name: "Morgra", title: "Sumpfhexe", skin: "npc_morgra", stage: 99 }
];
function npcById(id) {
  return NPCS.find((n) => n.id === id);
}

// src/systems/stats.ts
import { EquipmentSlot as EquipmentSlot2 } from "@minecraft/server";
var ATTRS = ["str", "dex", "int", "vit", "wis"];
var cache2 = /* @__PURE__ */ new Map();
var mana = /* @__PURE__ */ new Map();
var shields = /* @__PURE__ */ new Map();
var tempBuffs = /* @__PURE__ */ new Map();
function level(p) {
  return levelFromTotalXp(pdata(p).xp);
}
function xpProgress(p) {
  const d = pdata(p);
  const lvl = levelFromTotalXp(d.xp);
  if (lvl >= MAX_LEVEL) return { level: lvl, cur: 1, need: 1 };
  const base = totalXpForLevel(lvl);
  return { level: lvl, cur: d.xp - base, need: xpToNext(lvl) };
}
function freeAttrPoints(p) {
  const d = pdata(p);
  const lvl = level(p);
  const spent = ATTRS.reduce((s2, a) => s2 + (d.attr[a] ?? 0), 0);
  return (lvl - 1) * ATTR_POINTS_PER_LEVEL + d.prestige * 2 - spent;
}
function freeTalentPoints(p) {
  const d = pdata(p);
  const spent = Object.values(d.talents).reduce((s2, v) => s2 + v, 0);
  return talentPointsForLevel(level(p)) - spent;
}
function addTempBuff(p, key, value, ticks, now2) {
  let m = tempBuffs.get(p.id);
  if (!m) tempBuffs.set(p.id, m = /* @__PURE__ */ new Map());
  m.set(key, { v: value, until: now2 + ticks });
  invalidate(p);
}
function tempBuff(p, key, now2) {
  const b = tempBuffs.get(p.id)?.get(key);
  if (!b) return 0;
  if (b.until < now2) {
    tempBuffs.get(p.id)?.delete(key);
    return 0;
  }
  return b.v;
}
function invalidate(p) {
  cache2.delete(p.id);
}
function stats(p, now2 = 0) {
  const c = cache2.get(p.id);
  if (c && now2 - c.t < 10) return c.s;
  const s2 = compute(p, now2);
  cache2.set(p.id, { t: now2, s: s2 });
  return s2;
}
function compute(p, now2) {
  const d = pdata(p);
  const lvl = levelFromTotalXp(d.xp);
  const cls = classById(d.cls);
  const attrs = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  for (const a of ATTRS) attrs[a] = (cls?.base[a] ?? 2) + (cls?.growth[a] ?? 0) * (lvl - 1) + (d.attr[a] ?? 0);
  const mods = {};
  const add = (k, v) => mods[k] = (mods[k] ?? 0) + v;
  for (const t of TALENTS) {
    const rank = d.talents[t.id] ?? 0;
    if (rank > 0 && t.cls === d.cls) for (const [k, v] of Object.entries(t.effects)) add(k, v * rank);
  }
  const setCounts = /* @__PURE__ */ new Map();
  const main = getEquip(p, EquipmentSlot2.Mainhand);
  if (main && weaponOf(main.typeId)) {
    const g = getGear(main);
    if (g) for (const [k, v] of Object.entries(g.a)) add(k, v);
  }
  const off = getEquip(p, EquipmentSlot2.Offhand);
  const tal = talismanEffects(off?.typeId);
  if (tal) for (const [k, v] of Object.entries(tal)) add(k, v);
  for (const slot of [EquipmentSlot2.Head, EquipmentSlot2.Chest, EquipmentSlot2.Legs, EquipmentSlot2.Feet]) {
    const it = getEquip(p, slot);
    const a = armorOf(it?.typeId);
    if (!it || !a) continue;
    const g = getGear(it);
    const m = armorBonusMult(g);
    for (const [k, v] of Object.entries(a.set.bonus)) add(k, Math.round(v * m));
    if (g) for (const [k, v] of Object.entries(g.a)) add(k, v);
    setCounts.set(a.set.id, (setCounts.get(a.set.id) ?? 0) + 1);
  }
  const setBonus = [];
  for (const [id, n] of setCounts) {
    const set = armorOf(`cdw:${id}_head`)?.set;
    if (set && n >= set.setBonus.pieces) {
      for (const [k, v] of Object.entries(set.setBonus.effects)) add(k, v);
      setBonus.push(set.name);
    }
  }
  for (const a of ATTRS) {
    if (mods[a]) {
      attrs[a] += mods[a];
      delete mods[a];
    }
  }
  const nowMs = Date.now();
  if ((d.buffs.dmg ?? 0) > nowMs) add("dmg%", 0.15);
  if ((d.buffs.resist ?? 0) > nowMs) add("resist", 0.15);
  add("dmg%", tempBuff(p, "dmg%", now2));
  add("crit", tempBuff(p, "crit", now2));
  add("resist", tempBuff(p, "resist", now2));
  add("dmg%", d.prestige * 0.02);
  add("hp%", d.prestige * 0.02);
  const maxHp = Math.round((PLAYER_BASE.hp + PLAYER_BASE.hpPerLevel * (lvl - 1) + PLAYER_BASE.hpPerVit * attrs.vit) * (1 + (mods["hp%"] ?? 0)));
  const maxMana = Math.round((PLAYER_BASE.mana + PLAYER_BASE.manaPerLevel * (lvl - 1) + PLAYER_BASE.manaPerWis * attrs.wis) * (1 + (mods["mana%"] ?? 0)));
  return {
    level: lvl,
    attrs,
    maxHp,
    maxMana,
    manaRegen: (PLAYER_BASE.manaRegen + PLAYER_BASE.manaRegenPerWis * attrs.wis) * (1 + (mods.manaregen ?? 0)),
    crit: Math.min(0.75, PLAYER_BASE.critChance + PLAYER_BASE.critPerDex * attrs.dex + (mods.crit ?? 0)),
    critDmg: PLAYER_BASE.critDamage + (mods.critdmg ?? 0),
    resist: Math.min(0.7, vitResist(attrs.vit) + (mods.resist ?? 0)),
    lifesteal: Math.min(0.25, mods.lifesteal ?? 0),
    regen: mods.regen ?? 0,
    speed: Math.min(0.5, mods.speed ?? 0),
    cdr: Math.min(0.5, mods.cdr ?? 0),
    goldMult: 1 + (mods.gold ?? 0),
    luck: mods.luck ?? 0,
    mods,
    setBonus
  };
}
function getMana(p) {
  const v = mana.get(p.id);
  if (v === void 0) {
    const m = stats(p).maxMana;
    mana.set(p.id, m);
    return m;
  }
  return v;
}
function setMana(p, v) {
  mana.set(p.id, Math.max(0, Math.min(stats(p).maxMana, v)));
}
function spendMana(p, cost) {
  const m = getMana(p);
  if (m < cost) return false;
  setMana(p, m - cost);
  return true;
}
function getShield(p) {
  return shields.get(p.id) ?? 0;
}
function setShield(p, v) {
  if (v <= 0) shields.delete(p.id);
  else shields.set(p.id, v);
}
function health(p) {
  return p.getComponent("minecraft:health");
}
function hpInfo(p) {
  const h = health(p);
  const s2 = stats(p);
  if (!h) return { cur: s2.maxHp, max: s2.maxHp };
  return { cur: Math.ceil(h.currentValue / h.effectiveMax * s2.maxHp), max: s2.maxHp };
}
function healRpg(p, amount) {
  const h = health(p);
  if (!h || amount <= 0) return 0;
  const s2 = stats(p);
  const vanilla = amount / s2.maxHp * h.effectiveMax;
  const before = h.currentValue;
  h.setCurrentValue(Math.min(h.effectiveMax, before + vanilla));
  return (h.currentValue - before) / h.effectiveMax * s2.maxHp;
}
function healPct(p, pct2) {
  return healRpg(p, stats(p).maxHp * pct2);
}
function forgetStats(id) {
  cache2.delete(id);
  mana.delete(id);
  shields.delete(id);
  tempBuffs.delete(id);
}

// src/systems/mobs.ts
var info = /* @__PURE__ */ new Map();
function mobDef(e) {
  return e.typeId.startsWith("cdw:") ? mobById(e.typeId.slice(4)) : void 0;
}
function isHostile(e) {
  try {
    if (e.typeId === "minecraft:player") return false;
    if (e.typeId.startsWith("cdw:")) return !!mobById(e.typeId.slice(4));
    return e.matches({ families: ["monster"] });
  } catch {
    return false;
  }
}
function hubCenter() {
  const h = wdata().hub;
  if (h) return h;
  const s2 = world3.getDefaultSpawnLocation();
  return { x: s2.x, y: 64, z: s2.z };
}
function nearbyMaxPlayerLevel(e) {
  let max = 0;
  try {
    for (const p of e.dimension.getPlayers({ location: e.location, maxDistance: 96 })) max = Math.max(max, level(p));
  } catch {
  }
  return max;
}
function assignLevel(e, force = false) {
  if (!isValid(e)) return void 0;
  const existing = info.get(e.id);
  if (existing && !force) return existing;
  const stored = e.getDynamicProperty("cdw:l");
  const def = mobDef(e);
  if (typeof stored === "number" && !force) {
    const mi2 = {
      lvl: stored,
      elite: e.getDynamicProperty("cdw:e") === true,
      hpMult: e.getDynamicProperty("cdw:hm") ?? 1,
      dmgMult: e.getDynamicProperty("cdw:dm") ?? 1,
      def
    };
    info.set(e.id, mi2);
    return mi2;
  }
  if (!isHostile(e)) return void 0;
  let lvl;
  let elite = false;
  let hpMult = 1;
  let dmgMult = 1;
  if (def?.boss) {
    lvl = def.boss.fixedLevel;
    const players2 = e.dimension.getPlayers({ location: e.location, maxDistance: 48 }).length;
    hpMult = 1 + 0.6 * Math.max(0, players2 - 1);
  } else {
    const hub = hubCenter();
    const dist = V.dist2d(e.location, hub);
    lvl = zoneLevel(dist, e.dimension.id) + (def?.levelBonus ?? 0) + randInt(-1, 1);
    const pmax = nearbyMaxPlayerLevel(e);
    if (pmax > 0) lvl = Math.min(lvl, pmax + 4);
    if (def && def.act > 0) lvl = Math.max(lvl, [1, 1, 8, 15, 22, 30][def.act] ?? 1);
    lvl = clamp(lvl, 1, 55);
    if (def && Math.random() < 0.05) {
      elite = true;
      lvl += 2;
      hpMult = 2.5;
      dmgMult = 1.5;
    }
  }
  const mi = { lvl, elite, hpMult, dmgMult, def };
  try {
    e.setDynamicProperty("cdw:l", lvl);
    if (elite) {
      e.setDynamicProperty("cdw:e", true);
      try {
        e.setProperty("cdw:elite", true);
      } catch {
      }
    }
    if (hpMult !== 1) e.setDynamicProperty("cdw:hm", hpMult);
    if (dmgMult !== 1) e.setDynamicProperty("cdw:dm", dmgMult);
  } catch {
  }
  info.set(e.id, mi);
  return mi;
}
function getInfo(e) {
  return info.get(e.id) ?? (isValid(e) ? assignLevel(e) : void 0);
}
function peekInfo(e) {
  const c = info.get(e.id);
  if (c) return c;
  try {
    const stored = e.getDynamicProperty("cdw:l");
    if (typeof stored === "number") {
      const mi = {
        lvl: stored,
        elite: e.getDynamicProperty("cdw:e") === true,
        hpMult: e.getDynamicProperty("cdw:hm") ?? 1,
        dmgMult: e.getDynamicProperty("cdw:dm") ?? 1,
        def: mobDef(e)
      };
      info.set(e.id, mi);
      return mi;
    }
  } catch {
  }
  return void 0;
}
function forgetMob(id) {
  info.delete(id);
}
function totalHpScale(mi) {
  if (!mi) return 1;
  return mobHpScale(mi.lvl) * mi.hpMult;
}
function mobName(e) {
  const d = mobDef(e);
  if (d) return d.name;
  return e.typeId.replace("minecraft:", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function mobHp(e) {
  const h = e.getComponent("minecraft:health");
  if (!h) return void 0;
  const sc = totalHpScale(getInfo(e));
  return { cur: Math.max(0, Math.ceil(h.currentValue * sc)), max: Math.ceil(h.effectiveMax * sc) };
}

// src/systems/progression.ts
import { system as system3 } from "@minecraft/server";
var levelListeners = [];
function addXp(p, amount, reason = "") {
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
  if (reason) msg(p, `\xA7b+${fmt(gain)} XP \xA77${reason}`);
  if (after > before) {
    invalidate(p);
    for (let l = before + 1; l <= after; l++) levelUp(p, l);
  }
}
function levelUp(p, lvl) {
  title(p, `\xA76Stufe ${lvl}!`, "\xA7eDu bist st\xE4rker geworden", 5, 50, 15);
  sound(p, "random.levelup", void 0, 1);
  sound(p, "ui.toast.challenge_complete", void 0, 1.2, 0.6);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    particle(p.dimension, "minecraft:totem_particle", { x: p.location.x + Math.cos(a), y: p.location.y + 1, z: p.location.z + Math.sin(a) });
  }
  system3.runTimeout(() => {
    try {
      healPct(p, 1);
      setMana(p, stats(p).maxMana);
    } catch {
    }
  }, 2);
  msg(p, `\xA76\u2726 Stufenaufstieg! \xA7fDu bist jetzt Stufe \xA7e${lvl}\xA7f. \xA77(+2 Attributpunkte \u2013 Abenteuerbuch \u2192 Charakter)`);
  if (lvl >= 3 && lvl % 2 === 1) msg(p, "\xA7a\u2726 Neuer Talentpunkt verf\xFCgbar! \xA77(Abenteuerbuch \u2192 Talente)");
  const d = pdata(p);
  for (const a of abilitiesFor(d.cls)) {
    if (a.level === lvl) {
      msg(p, `\xA7d\u2726 Neue F\xE4higkeit freigeschaltet: \xA7f${a.name}\xA7d! \xA77Hol dir die Rune im Abenteuerbuch \u2192 F\xE4higkeiten.`);
      title(p, `\xA76Stufe ${lvl}!`, `\xA7dNeue F\xE4higkeit: ${a.name}`, 5, 60, 15);
    }
  }
  stat(p, "maxLevel", 0);
  d.stats.maxLevel = Math.max(d.stats.maxLevel ?? 0, lvl);
  for (const fn of levelListeners) {
    try {
      fn(p, lvl);
    } catch {
    }
  }
}
function addGold(p, amount, reason = "", applyMult = true) {
  const d = pdata(p);
  const gain = Math.round(applyMult ? amount * stats(p).goldMult : amount);
  if (gain === 0) return 0;
  d.gold = Math.max(0, d.gold + gain);
  if (gain > 0) d.stats.goldEarned = (d.stats.goldEarned ?? 0) + gain;
  markDirty(p);
  if (reason) msg(p, `${gain > 0 ? "\xA7e+" : "\xA7c"}${fmt(gain)} Gold \xA77${reason}`);
  return gain;
}
function spendGold(p, amount) {
  const d = pdata(p);
  if (d.gold < amount) return false;
  d.gold -= amount;
  markDirty(p);
  return true;
}
function repLevel(rep) {
  let idx = 0;
  for (let i = 0; i < REPUTATION_LEVELS.length; i++) if (rep >= REPUTATION_LEVELS[i].need) idx = i;
  return { idx, name: REPUTATION_LEVELS[idx].name, next: REPUTATION_LEVELS[idx + 1]?.need };
}
function addRep(p, amount) {
  const d = pdata(p);
  const before = repLevel(d.rep).idx;
  d.rep += amount;
  markDirty(p);
  const after = repLevel(d.rep);
  if (after.idx > before) {
    msg(p, `\xA7a\u2726 Ruf beim Hain gestiegen: \xA7f${after.name}\xA7a! \xA77H\xE4ndler bieten dir neue Waren an.`);
    sound(p, "random.orb", void 0, 0.8);
  }
}
function repDiscount(p) {
  return repLevel(pdata(p).rep).idx * 0.05;
}

// src/systems/combat.ts
var lastAttack = /* @__PURE__ */ new Map();
var lastHit = /* @__PURE__ */ new Map();
var pending = /* @__PURE__ */ new Map();
var forcedCrit = /* @__PURE__ */ new Set();
var targetInfo = /* @__PURE__ */ new Map();
var procQueue = [];
var uniqueProcs = /* @__PURE__ */ new Map();
function registerProc(effect, fn) {
  uniqueProcs.set(effect, fn);
}
function forceCrit(p) {
  forcedCrit.add(p.id);
}
function kindMultiplier(p, kind, now2) {
  const s2 = stats(p, now2);
  const m = s2.mods;
  let mult = 1 + (m["dmg%"] ?? 0);
  switch (kind) {
    case "melee_str":
      mult += s2.attrs.str * 0.03 + (m["melee%"] ?? 0);
      break;
    case "melee_dex":
      mult += s2.attrs.dex * 0.03 + (m["melee%"] ?? 0);
      break;
    case "ranged":
      mult += s2.attrs.dex * 0.03 + (m["ranged%"] ?? 0);
      break;
    case "magic":
      mult += s2.attrs.int * 0.035 + (m["magic%"] ?? 0);
      break;
  }
  return mult;
}
function weaponBase(p) {
  const item = getEquip(p, EquipmentSlot3.Mainhand);
  const w = weaponOf(item?.typeId);
  if (!w || !item) return { dmg: 4, kind: "melee_str" };
  const t = weaponTypeDef(w.type);
  let dmg = weaponDamage(w, getGear(item));
  let penalty;
  const d = pdata(p);
  const lvl = stats(p).level;
  if (lvl < w.reqLevel) {
    dmg *= 0.3;
    penalty = `\xA7cBen\xF6tigt Stufe ${w.reqLevel}`;
  } else if (d.cls && !(CLASS_WEAPONS[d.cls] ?? []).includes(w.type)) {
    dmg *= 0.6;
    penalty = `\xA77${classById(d.cls)?.name ?? ""} beherrscht diese Waffe nicht (60 % Schaden)`;
  }
  return { dmg, kind: t.kind, typeId: item.typeId, penalty };
}
function rollCrit(p, now2, bonus = 0) {
  const s2 = stats(p, now2);
  if (forcedCrit.has(p.id)) {
    forcedCrit.delete(p.id);
    return { crit: true, mult: s2.critDmg + 0.25 };
  }
  const crit = Math.random() < s2.crit + bonus;
  return { crit, mult: crit ? s2.critDmg : 1 };
}
function dealDamage(p, target, rpg, opts = {}) {
  if (!isValid(target) || target.typeId === "minecraft:player" || !isHostile(target)) return 0;
  const now2 = system4.currentTick;
  let dmg = rpg;
  if (opts.ability) dmg *= 1 + (stats(p, now2).mods[`ability:${opts.ability}%`] ?? 0);
  let crit = false;
  if (!opts.noCrit) {
    const c = rollCrit(p, now2);
    crit = c.crit;
    dmg *= c.mult;
  }
  const mi = getInfo(target);
  const vanilla = Math.max(0.05, dmg / totalHpScale(mi));
  pending.set(target.id, vanilla);
  lastHit.set(target.id, { pid: p.id, t: now2 });
  targetInfo.set(p.id, { id: target.id, t: now2 });
  try {
    target.applyDamage(vanilla, { cause: EntityDamageCause.override, damagingEntity: p });
  } catch {
    pending.delete(target.id);
  }
  pending.delete(target.id);
  if (crit) particle(target.dimension, "minecraft:critical_hit_emitter", V.add(target.location, { x: 0, y: 1, z: 0 }));
  lifesteal(p, dmg);
  return dmg;
}
function lifesteal(p, dmg) {
  const ls = stats(p).lifesteal;
  if (ls > 0) healRpg(p, dmg * ls);
}
function enemiesNear(dim, loc, radius) {
  try {
    return dim.getEntities({ location: loc, maxDistance: radius, families: ["monster"] }).filter((e) => e.typeId !== "minecraft:player");
  } catch {
    return [];
  }
}
function attackerOf(src) {
  return src.damagingEntity;
}
function initCombat() {
  world4.beforeEvents.entityHurt.subscribe((ev) => {
    const target = ev.hurtEntity;
    const src = ev.damageSource;
    const pre = pending.get(target.id);
    if (pre !== void 0) {
      ev.damage = pre;
      return;
    }
    const attacker = attackerOf(src);
    const now2 = system4.currentTick;
    if (target.typeId === "minecraft:player") {
      const p = target;
      if (!attacker || attacker.typeId === "minecraft:player") return;
      const mi2 = peekInfo(attacker);
      const lvl = mi2?.lvl ?? 1;
      let rpg2 = ev.damage * MOB_DMG_BASE_MULT * mobDmgScale(lvl) * (mi2?.dmgMult ?? 1);
      const diff = pdata(p).settings.diff;
      rpg2 *= diff === 0 ? 0.7 : diff === 2 ? 1.35 : 1;
      const s2 = stats(p, now2);
      rpg2 *= 1 - s2.resist;
      if (tempBuff(p, "wall", now2) > 0) rpg2 *= 0.5;
      const sh = getShield(p);
      if (sh > 0) {
        const absorbed = Math.min(sh, rpg2);
        rpg2 -= absorbed;
        setShield(p, sh - absorbed);
        if (rpg2 <= 0) {
          ev.cancel = true;
          return;
        }
      }
      const h = p.getComponent("minecraft:health");
      const vmax = h?.effectiveMax ?? 20;
      ev.damage = Math.max(0.1, rpg2 / s2.maxHp * vmax);
      return;
    }
    const proj = src.damagingProjectile;
    let player;
    if (attacker?.typeId === "minecraft:player") player = attacker;
    let rpg;
    let crit = false;
    if (proj && player) {
      const stored = proj.getDynamicProperty("cdw:d");
      if (typeof stored === "number") {
        rpg = stored;
        const c = rollCrit(player, now2, proj.getDynamicProperty("cdw:c") ?? 0);
        crit = c.crit;
        rpg *= c.mult;
      } else {
        const c = rollCrit(player, now2);
        crit = c.crit;
        rpg = ev.damage * kindMultiplier(player, "ranged", now2) * c.mult;
      }
    } else if (player && (src.cause === EntityDamageCause.entityAttack || src.cause === EntityDamageCause.maceSmash)) {
      const wb = weaponBase(player);
      const charge = chargeFactor(player, wb.typeId, now2);
      const base = wb.typeId ? wb.dmg : Math.max(ev.damage, 1) * 1;
      const c = rollCrit(player, now2);
      crit = c.crit;
      rpg = base * charge * kindMultiplier(player, wb.kind, now2) * c.mult;
      const pl2 = player;
      if (wb.penalty && Math.random() < 0.2) procQueue.push(() => pl2.onScreenDisplay.setActionBar(wb.penalty));
      const w = weaponOf(wb.typeId);
      if (w?.unique) {
        const fn = uniqueProcs.get(w.unique.effect);
        const tgt2 = target;
        const r = rpg;
        const cr = crit;
        if (fn) procQueue.push(() => fn(pl2, tgt2, r, cr));
      }
    } else if (attacker && attacker.typeId === "cdw:geisterwolf") {
      const owner = attacker.getDynamicProperty("cdw:o");
      const op = typeof owner === "string" ? world4.getEntity(owner) : void 0;
      if (op?.typeId === "minecraft:player") {
        player = op;
        rpg = 6 * (1 + 0.22 * (stats(player, now2).level - 1)) * kindMultiplier(player, "magic", now2) * 0.6;
      }
    }
    if (rpg === void 0 || !player) return;
    const mi = peekInfo(target);
    ev.damage = Math.max(0.05, rpg / totalHpScale(mi));
    lastHit.set(target.id, { pid: player.id, t: now2 });
    targetInfo.set(player.id, { id: target.id, t: now2 });
    const pl = player;
    const finalRpg = rpg;
    const tgt = target;
    procQueue.push(() => {
      lifesteal(pl, finalRpg);
      if (crit && isValid(tgt)) {
        particle(tgt.dimension, "minecraft:critical_hit_emitter", V.add(tgt.location, { x: 0, y: 1, z: 0 }));
        sound(pl, "random.anvil_land", void 0, 1.9, 0.25);
      }
      if (!mi && isValid(tgt)) assignLevel(tgt);
    });
  });
  system4.runInterval(() => {
    while (procQueue.length) {
      const fn = procQueue.shift();
      try {
        fn();
      } catch {
      }
    }
  }, 1);
  world4.afterEvents.entityDie.subscribe((ev) => {
    const dead = ev.deadEntity;
    let id;
    try {
      id = dead.id;
    } catch {
      return;
    }
    if (dead.typeId === "minecraft:player") {
      onPlayerDeath(dead);
      return;
    }
    const mi = getInfo(dead);
    let killer;
    const src = ev.damageSource;
    if (src.damagingEntity?.typeId === "minecraft:player") killer = src.damagingEntity;
    if (!killer) {
      const lh = lastHit.get(id);
      if (lh && system4.currentTick - lh.t < 300) {
        const e = world4.getEntity(lh.pid);
        if (e?.typeId === "minecraft:player") killer = e;
      }
    }
    lastHit.delete(id);
    forgetMob(id);
    if (!killer || !mi) return;
    onKill(killer, dead, mi);
  });
  world4.afterEvents.entityRemove.subscribe((ev) => {
    forgetMob(ev.removedEntityId);
    lastHit.delete(ev.removedEntityId);
  });
}
function chargeFactor(p, typeId, now2) {
  const w = weaponOf(typeId);
  const speed = w ? weaponTypeDef(w.type)?.speed ?? 10 : 10;
  const last = lastAttack.get(p.id) ?? -1e3;
  lastAttack.set(p.id, now2);
  if (speed <= 0) return 1;
  const f = (now2 - last) / speed;
  return Math.max(0.25, Math.min(1, f));
}
function onKill(killer, dead, mi) {
  const def = mi.def;
  const loc = { x: dead.location.x, y: dead.location.y, z: dead.location.z };
  const dim = dead.dimension;
  let families = [];
  try {
    const tf = dead.getComponent("minecraft:type_family");
    families = tf?.getTypeFamilies() ?? [];
  } catch {
  }
  const xpMult = (def?.xpMult ?? 1) * (mi.elite ? 3 : 1);
  const goldMult = (def?.goldMult ?? 1) * (mi.elite ? 3 : 1);
  const party = dim.getPlayers({ location: loc, maxDistance: 48 });
  if (!party.some((p) => p.id === killer.id)) party.push(killer);
  for (const p of party) {
    const plvl = stats(p).level;
    const diff = plvl - mi.lvl;
    const pen = diff > 6 ? Math.max(0.1, 1 - (diff - 6) * 0.15) : 1;
    addXp(p, mobXp(mi.lvl, xpMult) * pen);
    addGold(p, mobGold(mi.lvl, goldMult) * (0.6 + Math.random() * 0.8));
    stat(p, "kills");
    if (mi.elite) stat(p, "eliteKills");
    if (def?.boss) {
      const d = pdata(p);
      d.bossKills[def.id] = (d.bossKills[def.id] ?? 0) + 1;
      markDirty(p);
    }
    emit("kill", { player: p, entity: dead, typeId: dead.typeId, families, info: mi, location: loc });
  }
  if (def) {
    for (const drop of def.drops) {
      if (Math.random() < drop.chance * (mi.elite ? 1.5 : 1)) {
        const id = drop.item.includes(":") ? drop.item : `cdw:${drop.item}`;
        const n = randInt(drop.min ?? 1, drop.max ?? 1);
        try {
          dim.spawnItem(new ItemStack2(id, n), loc);
        } catch {
        }
      }
    }
  }
  const luck = stats(killer).luck;
  let gearChance = def?.boss ? 1 : mi.elite ? 0.35 : def ? 0.035 : 0.02;
  gearChance *= 1 + luck;
  const rolls = def?.boss ? 2 + party.length - 1 : 1;
  for (let i = 0; i < rolls; i++) {
    if (Math.random() >= gearChance) continue;
    const owner = party[i % party.length];
    const typeId = randomGearFor(mi.lvl, pdata(owner).cls);
    const minR = def?.boss ? 2 : mi.elite ? 1 : 0;
    try {
      const item = createGear(typeId, void 0, luck);
      const g = getGear(item);
      if (g && g.r < minR) {
        const better = createGear(typeId, minR);
        dim.spawnItem(better, loc);
      } else dim.spawnItem(item, loc);
      particle(dim, "minecraft:totem_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
    } catch {
    }
  }
  if (Math.random() < (def ? 0.06 : 0.03)) {
    try {
      dim.spawnItem(new ItemStack2(Math.random() < 0.5 ? "cdw:heiltrank_klein" : "cdw:manatrank_klein"), loc);
    } catch {
    }
  }
  if (mi.lvl >= 15 && Math.random() < 0.04) {
    try {
      dim.spawnItem(new ItemStack2("cdw:runenstaub"), loc);
    } catch {
    }
  }
}
function onPlayerDeath(p) {
  stat(p, "deaths");
  msg(p, "\xA77Deine Ausr\xFCstung, Runen und das Abenteuerbuch bleiben dir erhalten.");
}

// src/systems/abilities.ts
import { system as system5, world as world5 } from "@minecraft/server";
import { EquipmentSlot as EquipmentSlot4 } from "@minecraft/server";
var abilityById = new Map(ABILITIES.map((a) => [a.id, a]));
var lastCast = /* @__PURE__ */ new Map();
var readyAt = /* @__PURE__ */ new Map();
function onCooldown(p, key) {
  return (readyAt.get(`${p.id}:${key}`) ?? 0) > now();
}
function setCooldown(p, key, category, ticks) {
  readyAt.set(`${p.id}:${key}`, now() + ticks);
  try {
    p.startItemCooldown(category, ticks);
  } catch {
  }
}
function clearCooldown(p, category) {
  try {
    p.startItemCooldown(category, 1);
  } catch {
  }
}
var wolves = /* @__PURE__ */ new Map();
function now() {
  return system5.currentTick;
}
function power(p, kind) {
  const wb = weaponBase(p);
  const k = kind ?? wb.kind;
  return { dmg: wb.dmg * kindMultiplier(p, k, now()), kind: k };
}
function magicPower(p) {
  const wb = weaponBase(p);
  const base = wb.kind === "magic" ? wb.dmg : 5 + stats(p).level * 0.55;
  return base * kindMultiplier(p, "magic", now());
}
function spawnProjectile(p, id, rpg, opts = {}) {
  const dir = opts.dir ?? p.getViewDirection();
  const head = p.getHeadLocation();
  const from = opts.from ?? V.add(head, V.mul(V.norm(dir), 1.1));
  try {
    const e = p.dimension.spawnEntity(`cdw:${id}`, from);
    e.setDynamicProperty("cdw:d", rpg * (1 + (opts.ability ? stats(p).mods[`ability:${opts.ability}%`] ?? 0 : 0)));
    if (opts.critBonus) e.setDynamicProperty("cdw:c", opts.critBonus);
    if (opts.ability) e.setDynamicProperty("cdw:a", opts.ability);
    const pc = e.getComponent("minecraft:projectile");
    if (pc) {
      pc.owner = p;
      let d = V.norm(dir);
      if (opts.spread) d = V.norm(V.add(d, { x: rand(-opts.spread, opts.spread), y: rand(-opts.spread / 2, opts.spread / 2), z: rand(-opts.spread, opts.spread) }));
      pc.shoot(V.mul(d, opts.power ?? 2));
    }
    return e;
  } catch {
    return void 0;
  }
}
function cooldownTicks(p, a) {
  const s2 = stats(p);
  const flat = s2.mods[`cd:${a.id}`] ?? 0;
  return Math.max(10, Math.round((a.cooldown - flat) * 20 * (1 - s2.cdr)));
}
function manaCost(p, base) {
  return Math.round(base * (1 - (stats(p).mods["manacost%"] ?? 0)));
}
function castRune(p, abilityId) {
  const a = abilityById.get(abilityId);
  if (!a) return;
  const d = pdata(p);
  if (d.cls !== a.cls) {
    msg(p, "\xA7cDiese Rune geh\xF6rt zu einer anderen Klasse.");
    return;
  }
  if (stats(p).level < a.level) {
    msg(p, `\xA7cBen\xF6tigt Stufe ${a.level}.`);
    return;
  }
  if (onCooldown(p, a.id)) return;
  const cost = manaCost(p, a.mana);
  if (getMana(p) < cost) {
    p.onScreenDisplay.setActionBar("\xA79Nicht genug Mana!");
    sound(p, "note.bass", void 0, 0.6);
    clearCooldown(p, `cdw_${a.id}`);
    return;
  }
  const ok = runAbility(p, a);
  if (ok === false) {
    clearCooldown(p, `cdw_${a.id}`);
    return;
  }
  spendMana(p, cost);
  setCooldown(p, a.id, `cdw_${a.id}`, cooldownTicks(p, a));
  lastCast.set(p.id, now());
  emit("flag", { key: "ability_used", player: p });
}
function runAbility(p, a) {
  const dim = p.dimension;
  const loc = p.location;
  switch (a.id) {
    // ---- Krieger ----
    case "wirbelschlag": {
      const pw = power(p);
      ring(dim, "minecraft:critical_hit_emitter", V.add(loc, { x: 0, y: 1, z: 0 }), 2.5, 14);
      ring(dim, "minecraft:knockback_roar_particle", V.add(loc, { x: 0, y: 0.5, z: 0 }), 1.5, 6);
      sound(dim, "mob.ravager.roar", loc, 1.6, 0.6);
      for (const e of enemiesNear(dim, loc, 4)) {
        dealDamage(p, e, pw.dmg * 1.6, { kind: pw.kind, ability: a.id });
        knockFrom(e, loc, 0.6, 0.25);
      }
      return;
    }
    case "schildwall": {
      addTempBuff(p, "wall", 1, 120, now());
      p.addEffect("resistance", 120, { amplifier: 0, showParticles: false });
      p.addEffect("slowness", 120, { amplifier: 0, showParticles: false });
      sound(dim, "item.shield.block", loc, 0.8, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1, z: 0 }), 1.2, 12);
      return;
    }
    case "sturmangriff": {
      dash(p, 2.6, 0.15, 8, (e) => {
        dealDamage(p, e, power(p).dmg * 1.3, { ability: a.id });
        e.addEffect("slowness", 60, { amplifier: 2 });
      });
      sound(dim, "mob.ravager.stun", loc, 1.4, 0.7);
      return;
    }
    case "kampfschrei": {
      sound(dim, "raid.horn", loc, 1.4, 0.5);
      for (const ally of dim.getPlayers({ location: loc, maxDistance: 12 })) {
        addTempBuff(ally, "dmg%", 0.2, 240, now());
        ally.addEffect("strength", 240, { amplifier: 0, showParticles: true });
      }
      for (const e of enemiesNear(dim, loc, 8)) e.addEffect("weakness", 200, { amplifier: 1 });
      ring(dim, "minecraft:villager_angry", V.add(loc, { x: 0, y: 1.8, z: 0 }), 1.5, 10);
      return;
    }
    case "titanenhieb": {
      p.applyKnockback({ x: 0, z: 0 }, 0.7);
      later(10, () => {
        if (!isValid(p)) return;
        const l = p.location;
        sound(dim, "random.explode", l, 0.7, 1);
        for (let r = 1; r <= 6; r += 1.25) ring(dim, "minecraft:huge_explosion_emitter", l, r, Math.round(r * 2));
        const pw = power(p);
        for (const e of enemiesNear(dim, l, 6)) {
          dealDamage(p, e, pw.dmg * 4.2, { kind: pw.kind, ability: a.id });
          stun(e, 60);
        }
      });
      return;
    }
    // ---- Waldläufer ----
    case "salve": {
      const pw = power(p, "ranged");
      const dir = p.getViewDirection();
      for (let i = -2; i <= 2; i++) spawnProjectile(p, "ranger_arrow", pw.dmg * 0.7, { dir: V.rotY(dir, i * 9), power: 2.6, ability: a.id });
      sound(dim, "random.bow", loc, 0.9, 1);
      return;
    }
    case "rueckwaertssprung": {
      const back = V.mul(V.flat(p.getViewDirection()), -1);
      p.applyKnockback({ x: back.x * 2.2, z: back.z * 2.2 }, 0.55);
      for (const e of enemiesNear(dim, loc, 5)) e.addEffect("slowness", 80, { amplifier: 2 });
      particle(dim, "minecraft:large_explosion", loc);
      sound(dim, "mob.phantom.flap", loc, 1.2, 1);
      return;
    }
    case "giftpfeil": {
      const pw = power(p, "ranged");
      spawnProjectile(p, "poison_arrow", pw.dmg * 0.8, { power: 2.8, ability: a.id });
      sound(dim, "random.bow", loc, 0.7, 1);
      return;
    }
    case "falkenauge": {
      addTempBuff(p, "crit", 0.3, 200, now());
      p.addEffect("speed", 200, { amplifier: 1, showParticles: false });
      sound(dim, "mob.parrot.fly", loc, 1, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1.9, z: 0 }), 0.6, 8);
      return;
    }
    case "pfeilregen": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 32 });
      const center = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 10));
      const pw = power(p, "ranged");
      let n = 0;
      const id = system5.runInterval(() => {
        if (!isValid(p) || n++ > 24) {
          system5.clearRun(id);
          return;
        }
        for (let i = 0; i < 3; i++) {
          const from = V.add(center, { x: rand(-5, 5), y: 14, z: rand(-5, 5) });
          spawnProjectile(p, "ranger_arrow", pw.dmg * 0.55, { from, dir: { x: rand(-0.05, 0.05), y: -1, z: rand(-0.05, 0.05) }, power: 2.4, ability: a.id });
        }
      }, 5);
      ring(dim, "minecraft:villager_happy", center, 5, 20);
      return;
    }
    // ---- Magier ----
    case "feuerball": {
      spawnProjectile(p, "fireball", magicPower(p) * 1.8, { power: 1.6, ability: a.id });
      sound(dim, "mob.ghast.fireball", loc, 1.1, 0.8);
      return;
    }
    case "frostlanze": {
      spawnProjectile(p, "frost_lance", magicPower(p) * 1.5, { power: 2.8, ability: a.id });
      sound(dim, "random.glass", loc, 1.5, 0.6);
      return;
    }
    case "blinzeln": {
      const dir = V.norm(p.getViewDirection());
      const hit = p.dimension.getBlockFromRay(p.getHeadLocation(), dir, { maxDistance: 8, includeLiquidBlocks: false, includePassableBlocks: false });
      const dist = hit ? Math.max(0, V.dist(p.getHeadLocation(), V.add(hit.block.location, hit.faceLocation)) - 1.2) : 8;
      const dest = V.add(loc, V.mul(dir, dist));
      particle(dim, "minecraft:portal_reverse_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
      p.teleport(dest, { checkForBlocks: true, keepVelocity: false });
      particle(dim, "minecraft:portal_reverse_particle", V.add(dest, { x: 0, y: 1, z: 0 }));
      sound(dim, "mob.endermen.portal", dest, 1.2, 1);
      return;
    }
    case "arkanschild": {
      setShield(p, stats(p).maxHp * 0.3);
      sound(dim, "beacon.power", loc, 1.6, 1);
      ring(dim, "minecraft:obsidian_glow_dust_particle", V.add(loc, { x: 0, y: 1, z: 0 }), 1, 16);
      msg(p, "\xA75Arkanschild aktiv.");
      return;
    }
    case "meteor": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 40 });
      const target = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 12));
      ring(dim, "minecraft:basic_flame_particle", target, 3, 18);
      ring(dim, "minecraft:basic_flame_particle", target, 5, 24);
      const dmg = magicPower(p) * 5;
      later(30, () => {
        if (!isValid(p)) return;
        spawnProjectile(p, "meteor", dmg, { from: V.add(target, { x: -4, y: 18, z: 0 }), dir: V.norm({ x: 4, y: -18, z: 0 }), power: 1.6, ability: a.id });
      });
      sound(dim, "mob.blaze.shoot", loc, 0.5, 1);
      return;
    }
    // ---- Druide ----
    case "heilbluete": {
      const healMult = 1 + (stats(p).mods["heal%"] ?? 0) + stats(p).attrs.wis * 0.03;
      const allies = dim.getPlayers({ location: loc, maxDistance: 8 });
      let ticks = 0;
      const id = system5.runInterval(() => {
        if (ticks++ >= 5) {
          system5.clearRun(id);
          return;
        }
        for (const al of allies) {
          if (!isValid(al)) continue;
          healPct(al, 0.06 * healMult * (1 + (stats(p).mods["ability:heilbluete%"] ?? 0)));
          particle(al.dimension, "minecraft:heart_particle", V.add(al.location, { x: 0, y: 2, z: 0 }));
        }
      }, 20);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 0.3, z: 0 }), 3, 16);
      sound(dim, "random.orb", loc, 1.5, 1);
      return;
    }
    case "dornenranken": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 20 });
      const c = hit ? V.add(hit.block.location, { x: 0.5, y: 1, z: 0.5 }) : V.add(loc, V.mul(V.flat(p.getViewDirection()), 6));
      ring(dim, "minecraft:villager_happy", c, 3.5, 18);
      sound(dim, "dig.grass", c, 0.6, 1);
      for (const e of enemiesNear(dim, c, 4)) {
        dealDamage(p, e, magicPower(p) * 1.4, { ability: a.id });
        stun(e, 80);
      }
      return;
    }
    case "wolfsgeist": {
      const old = wolves.get(p.id);
      if (old) safeRemove(old.id);
      try {
        const w = dim.spawnEntity("cdw:geisterwolf", V.add(loc, V.mul(V.flat(p.getViewDirection()), 1.5)));
        w.setDynamicProperty("cdw:o", p.id);
        wolves.set(p.id, { id: w.id, until: now() + 800 });
        particle(dim, "minecraft:soul_particle", w.location);
        sound(dim, "mob.wolf.howl", loc, 1.2, 0.8);
      } catch {
        return false;
      }
      return;
    }
    case "rindenhaut": {
      for (const al of dim.getPlayers({ location: loc, maxDistance: 10 })) {
        al.addEffect("resistance", 200, { amplifier: 1, showParticles: true });
        al.addEffect("regeneration", 200, { amplifier: 0, showParticles: true });
      }
      sound(dim, "dig.wood", loc, 0.6, 1);
      ring(dim, "minecraft:villager_happy", V.add(loc, { x: 0, y: 1, z: 0 }), 2, 12);
      return;
    }
    case "segen": {
      for (const al of dim.getPlayers({ location: loc, maxDistance: 16 })) {
        healPct(al, 1);
        al.removeEffect("poison");
        al.removeEffect("wither");
        al.addEffect("regeneration", 200, { amplifier: 1 });
        title2(al, "", "\xA7aSegen des Ylvaris");
      }
      for (const e of enemiesNear(dim, loc, 12)) {
        const blight = e.matches({ families: ["cdw_blight"] });
        dealDamage(p, e, magicPower(p) * (blight ? 4 : 1.5), { ability: a.id });
      }
      for (let r = 2; r <= 12; r += 2) ring(dim, "minecraft:totem_particle", V.add(loc, { x: 0, y: 0.5, z: 0 }), r, r * 3);
      sound(dim, "random.totem", loc, 1, 0.8);
      return;
    }
  }
}
function title2(p, t, sub) {
  try {
    p.onScreenDisplay.setTitle(t, { subtitle: sub, fadeInDuration: 5, stayDuration: 30, fadeOutDuration: 10 });
  } catch {
  }
}
function safeRemove(id) {
  try {
    world5.getEntity(id)?.remove();
  } catch {
  }
}
function stun(e, ticks) {
  try {
    e.addEffect("slowness", ticks, { amplifier: 10, showParticles: false });
    e.addEffect("weakness", ticks, { amplifier: 10, showParticles: false });
    particle(e.dimension, "minecraft:villager_angry", V.add(e.location, { x: 0, y: 2, z: 0 }));
  } catch {
  }
}
function knockFrom(e, from, h, v) {
  try {
    const d = V.flat(V.sub(e.location, from));
    e.applyKnockback({ x: d.x * h, z: d.z * h }, v);
  } catch {
  }
}
function dash(p, strength, up, ticks, onHit) {
  const dir = V.flat(p.getViewDirection());
  p.applyKnockback({ x: dir.x * strength, z: dir.z * strength }, up);
  const hit = /* @__PURE__ */ new Set();
  let n = 0;
  const id = system5.runInterval(() => {
    if (!isValid(p) || n++ > ticks) {
      system5.clearRun(id);
      return;
    }
    particle(p.dimension, "minecraft:large_explosion", V.add(p.location, { x: 0, y: 0.6, z: 0 }));
    for (const e of enemiesNear(p.dimension, p.location, 2.2)) {
      if (hit.has(e.id)) continue;
      hit.add(e.id);
      onHit(e);
    }
  }, 1);
}
function useWeapon(p, typeId) {
  const w = weaponOf(typeId);
  if (!w) return;
  const t = weaponTypeDef(w.type);
  const cat = `cdw_w_${t.id}`;
  if (onCooldown(p, cat)) return;
  const cost = manaCost(p, t.abilityMana);
  if (getMana(p) < cost) {
    p.onScreenDisplay.setActionBar("\xA79Nicht genug Mana!");
    clearCooldown(p, cat);
    return;
  }
  const dim = p.dimension;
  const loc = p.location;
  const pw = power(p);
  switch (t.id) {
    case "schwert":
      dash(p, 1.4, 0.05, 6, (e) => dealDamage(p, e, pw.dmg * 1.3));
      sound(dim, "item.trident.riptide_1", loc, 1.5, 0.6);
      break;
    case "zweihaender":
      ring(dim, "minecraft:critical_hit_emitter", V.add(loc, { x: 0, y: 1, z: 0 }), 2.2, 12);
      for (const e of enemiesNear(dim, loc, 3.5)) {
        dealDamage(p, e, pw.dmg * 1.2);
        knockFrom(e, loc, 0.8, 0.3);
      }
      sound(dim, "mob.ravager.attack", loc, 1.2, 0.8);
      break;
    case "dolch": {
      const target = p.getEntitiesFromViewDirection({ maxDistance: 8, families: ["monster"] })[0]?.entity;
      if (!target) {
        msg(p, "\xA77Kein Ziel in Sicht.");
        clearCooldown(p, cat);
        return;
      }
      const behind = V.add(target.location, V.mul(V.flat(target.getViewDirection()), -1.4));
      particle(dim, "minecraft:large_smoke_particle", V.add(loc, { x: 0, y: 1, z: 0 }));
      p.teleport(behind, { facingLocation: target.location, checkForBlocks: true });
      forceCrit(p);
      sound(dim, "mob.endermen.portal", behind, 1.8, 0.6);
      break;
    }
    case "streitaxt": {
      const target = p.getEntitiesFromViewDirection({ maxDistance: 4, families: ["monster"] })[0]?.entity;
      if (!target) {
        msg(p, "\xA77Kein Ziel in Reichweite.");
        clearCooldown(p, cat);
        return;
      }
      dealDamage(p, target, pw.dmg * 2);
      target.addEffect("weakness", 120, { amplifier: 1 });
      sound(dim, "random.anvil_land", loc, 0.7, 0.6);
      break;
    }
    case "kriegshammer":
      for (const e of enemiesNear(dim, loc, 4.5)) {
        dealDamage(p, e, pw.dmg * 1.1);
        stun(e, 40);
      }
      ring(dim, "minecraft:huge_explosion_emitter", loc, 2.5, 6);
      sound(dim, "random.explode", loc, 1.4, 0.6);
      break;
    case "speer":
      dash(p, 2, 0.1, 8, (e) => dealDamage(p, e, pw.dmg * 1.4));
      sound(dim, "item.trident.throw", loc, 1, 1);
      break;
    case "armbrust":
      spawnProjectile(p, "ranger_arrow", pw.dmg * 1, { power: 3.6, critBonus: 0.1 });
      sound(dim, "crossbow.shoot", loc, 1, 1);
      break;
    case "zauberstab": {
      spawnProjectile(p, w.unique?.effect === "frostnova" ? "frost_lance" : "arcane_bolt", magicPower(p) * 1, { power: 2.2 });
      sound(dim, "mob.evocation_illager.cast_spell", loc, 1.8, 0.4);
      break;
    }
    case "naturstab": {
      spawnProjectile(p, "thorn_bolt", magicPower(p) * 0.9, { power: 2.1 });
      const healMult = (w.unique?.effect === "bloom" ? 2 : 1) * (1 + (stats(p).mods["heal%"] ?? 0));
      for (const al of dim.getPlayers({ location: loc, maxDistance: 6 })) if (al.id !== p.id) healPct(al, 0.02 * healMult);
      healPct(p, 0.01 * healMult);
      sound(dim, "dig.grass", loc, 1.4, 0.6);
      break;
    }
    default:
      return;
  }
  spendMana(p, cost);
  if (t.abilityCd > 0) setCooldown(p, cat, cat, Math.max(4, Math.round(t.abilityCd * 20 * (1 - stats(p).cdr * 0.5))));
}
var starfallCount = /* @__PURE__ */ new Map();
function releaseBow(p, typeId, useDuration) {
  const w = weaponOf(typeId);
  if (!w || w.type !== "langbogen") return;
  const drawn = Math.max(0, 72e3 - useDuration);
  const charge = Math.min(1, drawn / 20);
  if (charge < 0.2) return;
  const pw = power(p, "ranged");
  spawnProjectile(p, "ranger_arrow", pw.dmg * (0.4 + charge * 0.8), { power: 1.2 + charge * 2.2, critBonus: charge >= 1 ? 0.1 : 0 });
  sound(p.dimension, "random.bow", p.location, 1 + (1 - charge) * 0.3, 1);
  if (w.unique?.effect === "starfall") {
    const n = (starfallCount.get(p.id) ?? 0) + 1;
    starfallCount.set(p.id, n);
    if (n % 4 === 0) {
      const t = p.getEntitiesFromViewDirection({ maxDistance: 40, families: ["monster"] })[0]?.entity;
      if (t) {
        const tl = t.location;
        particle(p.dimension, "minecraft:totem_particle", V.add(tl, { x: 0, y: 3, z: 0 }));
        later(10, () => {
          if (isValid(t)) {
            for (const e of enemiesNear(t.dimension, tl, 3)) dealDamage(p, e, pw.dmg * 2);
            particle(t.dimension, "minecraft:huge_explosion_emitter", tl);
          }
        });
      }
    }
  }
}
function onProjectileImpact(proj, loc, hitEntity) {
  const ownerComp = proj.getComponent("minecraft:projectile");
  const owner = ownerComp?.owner;
  if (!owner || owner.typeId !== "minecraft:player") return;
  const p = owner;
  const rpg = proj.getDynamicProperty("cdw:d") ?? 0;
  const dim = proj.dimension;
  switch (proj.typeId) {
    case "cdw:fireball":
      particle(dim, "minecraft:huge_explosion_emitter", loc);
      sound(dim, "random.explode", loc, 1.3, 0.7);
      for (const e of enemiesNear(dim, loc, 3)) {
        if (hitEntity && e.id === hitEntity.id) continue;
        dealDamage(p, e, rpg * 0.6, { noCrit: false });
        e.setOnFire(3, true);
      }
      if (hitEntity) hitEntity.setOnFire(4, true);
      break;
    case "cdw:meteor":
      particle(dim, "minecraft:huge_explosion_emitter", loc);
      ring(dim, "minecraft:huge_explosion_emitter", loc, 3, 6);
      sound(dim, "random.explode", loc, 0.6, 1);
      for (const e of enemiesNear(dim, loc, 6)) {
        dealDamage(p, e, rpg, { ability: "meteor" });
        e.setOnFire(6, true);
      }
      break;
    case "cdw:frost_lance":
      if (hitEntity) {
        hitEntity.addEffect("slowness", 100, { amplifier: 3 });
        particle(dim, "minecraft:snowflake_particle", V.add(hitEntity.location, { x: 0, y: 1, z: 0 }));
        const w = weaponOf(getEquip(p, EquipmentSlot4.Mainhand)?.typeId);
        if (w?.unique?.effect === "frostnova" && Math.random() < 0.15) {
          ring(dim, "minecraft:snowflake_particle", loc, 3, 16);
          for (const e of enemiesNear(dim, loc, 4)) {
            dealDamage(p, e, rpg * 0.6);
            e.addEffect("slowness", 80, { amplifier: 5 });
          }
        }
      }
      break;
    case "cdw:poison_arrow":
      if (hitEntity) {
        let n = 0;
        const target = hitEntity;
        const id = system5.runInterval(() => {
          if (!isValid(target) || !isValid(p) || n++ >= 6) {
            system5.clearRun(id);
            return;
          }
          dealDamage(p, target, rpg * 0.4 * (1 + (stats(p).mods["ability:giftpfeil%"] ?? 0)), { noCrit: true });
          particle(target.dimension, "minecraft:mobspell_emitter", V.add(target.location, { x: 0, y: 1, z: 0 }));
        }, 20);
      }
      break;
  }
}
function initUniques() {
  registerProc("rootburst", (p, t, rpg) => {
    if (Math.random() > 0.2 || !isValid(t)) return;
    const l = t.location;
    ring(t.dimension, "minecraft:villager_happy", l, 2, 10);
    for (const e of enemiesNear(t.dimension, l, 3)) dealDamage(p, e, rpg * 1.5, { noCrit: true });
  });
  registerProc("shadowcrit", (p, _t, _rpg, crit) => {
    if (crit) p.addEffect("invisibility", 40, { showParticles: false });
  });
  registerProc("quake", (p, t) => {
    if (Math.random() < 0.15 && isValid(t)) stun(t, 40);
    healPct(p, 0.03);
  });
}
function tickWolves() {
  for (const [pid, w] of wolves) {
    const wolf = world5.getEntity(w.id);
    const owner = world5.getEntity(pid);
    if (!wolf || !owner || now() > w.until) {
      if (wolf) {
        particle(wolf.dimension, "minecraft:soul_particle", wolf.location);
        safeRemove(w.id);
      }
      wolves.delete(pid);
      continue;
    }
    if (wolf.dimension.id !== owner.dimension.id || V.dist(wolf.location, owner.location) > 18) {
      wolf.teleport(owner.location, { dimension: owner.dimension });
    }
  }
}
function initAbilities() {
  initUniques();
  world5.afterEvents.projectileHitEntity.subscribe((ev) => {
    const proj = ev.projectile;
    if (!isValid(proj) || !proj.typeId.startsWith("cdw:")) return;
    const hit = ev.getEntityHit()?.entity;
    onProjectileImpact(proj, ev.location, hit);
  });
  world5.afterEvents.projectileHitBlock.subscribe((ev) => {
    const proj = ev.projectile;
    if (!isValid(proj) || !proj.typeId.startsWith("cdw:")) return;
    onProjectileImpact(proj, ev.location);
  });
  world5.afterEvents.itemReleaseUse.subscribe((ev) => {
    if (ev.itemStack && ev.itemStack.typeId.startsWith("cdw:")) releaseBow(ev.source, ev.itemStack.typeId, ev.useDuration);
  });
  system5.runInterval(tickWolves, 20);
}

// src/systems/hud.ts
import { LocationWaypoint, system as system8, WaypointTexture, world as world7 } from "@minecraft/server";

// src/systems/quests.ts
import { ItemStack as ItemStack3, system as system7, world as world6 } from "@minecraft/server";

// src/data/quests.ts
var SPEAKERS = {
  erzaehler: "\xA77Erz\xE4hler",
  stimme: "\xA7a???",
  sylva: "\xA7aSylva",
  kael: "\xA72Kael",
  brom: "\xA76Brom",
  mira: "\xA7dMira",
  oswin: "\xA79Oswin",
  fennick: "\xA7eFennick",
  morgra: "\xA75Morgra",
  morvath: "\xA74Morvath",
  liora: "\xA7bLiora"
};
var MAIN = [
  // ======================= PROLOG =======================
  {
    id: "m01",
    title: "Ein Fl\xFCstern in den Bl\xE4ttern",
    kind: "main",
    act: 0,
    summary: "Ein seltsamer Samen ist in deinem Gep\xE4ck aufgetaucht. Eine Stimme bittet dich, ihn zu pflanzen.",
    intro: [
      { s: "stimme", t: "\xA7o\u2026h\xF6rst du mich? Endlich. Endlich jemand, der noch zuh\xF6ren kann.\xA7r" },
      { s: "stimme", t: "\xA7oDas Land wird krank. Die Bl\xE4tter fl\xFCstern es seit Wochen, die Wurzeln schreien es. Bald werden es auch die Tiere tun \u2013 und dann ist es zu sp\xE4t.\xA7r" },
      { s: "stimme", t: "\xA7oIn deinem Gep\xE4ck liegt ein Samen. Er hat dich ausgew\xE4hlt, nicht ich. Pflanze ihn auf Gras oder Erde \u2013 an einem Ort, den du sch\xFCtzen m\xF6chtest. Dort werde ich dich finden.\xA7r" },
      { s: "erzaehler", t: "Tipp: Der Ort, an dem du den Samen pflanzt, wird zum \xA7aHain des Erwachens\xA7f \u2013 dem Herz deines Abenteuers. W\xE4hle eine offene, eher flache Stelle (etwa 40 \xD7 40 Bl\xF6cke). Das \xA7eAbenteuerbuch\xA7f in deinem Inventar zeigt dir jederzeit deine Aufgaben." }
    ],
    stages: [{ text: "Pflanze den Samen des Weltenbaums", obj: { type: "flag", flag: "hub_planted" } }],
    outro: [],
    rewards: { xp: 60, gold: 10 }
  },
  {
    id: "m02",
    title: "Die H\xFCterin",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Aus dem Samen ist ein Hain gewachsen \u2013 und mit ihm eine Gestalt, die auf dich gewartet hat.",
    intro: [
      { s: "sylva", t: "Du hast ihn gepflanzt. Und er ist gewachsen \u2013 schneller, als ich zu hoffen wagte. Ich bin \xA7aSylva\xA7f, die letzte H\xFCterin des Weltenbaums." },
      { s: "sylva", t: "Tief unter diesem Land liegen die Wurzeln von \xA7aYlvaris\xA7f, dem Weltenbaum. F\xFCnf \xA76Wurzelherzen\xA7f n\xE4hren sie \u2013 und durch sie jedes Blatt, jedes Tier, jeden Fluss." },
      { s: "sylva", t: "Doch die Herzen wurden vergiftet. Ein F\xE4ulnis, die wir \xA75das Welken\xA7f nennen, kriecht durch die Wurzeln. Wo sie ankommt, verdorrt das Leben \u2013 oder es verwandelt sich in etwas \u2026 Hungriges." },
      { s: "sylva", t: "Der Samen hat dich gew\xE4hlt, weil in dir noch Wachstum steckt. Du sollst ein \xA76W\xE4chter\xA7f werden. Aber zuerst: Zeig mir, welcher Weg zu dir passt." },
      { s: "erzaehler", t: "W\xE4hle jetzt deine \xA76Klasse\xA7f. Du kannst sie sp\xE4ter bei Sylva gegen Gold wechseln." }
    ],
    stages: [{ text: "W\xE4hle deine Klasse", obj: { type: "flag", flag: "class_chosen" }, start: ["classpick"] }],
    outro: [
      { s: "sylva", t: "So sei es. Ich sp\xFCre, wie die Kraft des Samens zu dir flie\xDFt. Diese \xA7dRune\xA7f tr\xE4gt deine erste F\xE4higkeit in sich \u2013 lege sie in deine Schnellleiste und benutze sie." }
    ],
    rewards: { xp: 80, gold: 20, items: [{ id: "heiltrank_klein", n: 4 }, { id: "manatrank_klein", n: 2 }] }
  },
  {
    id: "m03",
    title: "Erste Schritte",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Sylva will sehen, ob du deine neue Kraft beherrschst. Mooslinge streifen um den Hain.",
    intro: [
      { s: "sylva", t: "Sp\xFCrst du das Kribbeln in den Fingern? Das ist die Rune. Je \xF6fter du sie benutzt, desto selbstverst\xE4ndlicher wird sie dir." },
      { s: "sylva", t: "Sieh dich um \u2013 das Welken hat bereits die Mooslinge erreicht. Fr\xFCher haben sie nur Tau getrunken. Jetzt bei\xDFen sie. Erl\xF6se sie." },
      { s: "erzaehler", t: "Tipp: Benutze deine \xA7dRune\xA7f (Item in der Hand + Benutzen). Mana regeneriert sich mit der Zeit. Oben in der Wegpunktleiste und unten im HUD siehst du, wohin du musst." }
    ],
    stages: [
      { text: "Benutze deine erste F\xE4higkeit", obj: { type: "flag", flag: "ability_used" } },
      { text: "Erl\xF6se verdorbene Mooslinge", obj: { type: "kill", mobs: ["cdw:moosling"], count: 6 }, start: ["spawn:moosling:7:hub"], target: { k: "hub" } }
    ],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Gut gemacht. Siehst du, wie das Moos wieder gr\xFCn wird, wo sie gefallen sind? Das Welken l\xE4sst sich zur\xFCckdr\xE4ngen. Aber nicht ohne Widerstand\u2026" }
    ],
    rewards: { xp: 150, gold: 25, gear: { rarity: 1 } }
  },
  {
    id: "m04",
    title: "Die Wurzeln bluten",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Das Welken sp\xFCrt den neuen Hain \u2013 und schickt seine Kreaturen.",
    intro: [
      { s: "sylva", t: "H\xF6rst du das? Etwas kommt durch das Unterholz. Viele. Das Welken hat bemerkt, dass hier etwas Neues w\xE4chst." },
      { s: "sylva", t: "Der junge Baum ist noch schwach. Wenn sie ihn erreichen, war alles umsonst. Stell dich ihnen entgegen \u2013 ich st\xE4rke dich, so gut ich kann!" }
    ],
    stages: [{ text: "Verteidige den Hain (3 Wellen)", obj: { type: "flag", flag: "defense:hain" }, start: ["defense:hain"], target: { k: "hub" } }],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Sie weichen zur\xFCck\u2026 f\xFCrs Erste. Du hast gek\xE4mpft wie ein wahrer W\xE4chter." },
      { s: "sylva", t: "Aber das waren nur Ausl\xE4ufer. Nicht weit von hier sp\xFCre ich das erste Herz \u2013 es schl\xE4gt kaum noch. Ein Waldl\xE4ufer namens \xA72Kael\xA7f verfolgt dort seit Tagen eine Spur. Finde ihn." }
    ],
    rewards: { xp: 260, gold: 40, items: [{ id: "heiltrank", n: 3 }], rep: 50 }
  },
  // ======================= AKT I =======================
  {
    id: "m05",
    title: "Spuren im Unterholz",
    kind: "main",
    act: 1,
    summary: "Finde den Waldl\xE4ufer Kael, der die Spur des Welkens verfolgt.",
    intro: [],
    stages: [
      { text: "Finde Kaels Lager", obj: { type: "reach", target: { k: "camp" }, radius: 12 }, target: { k: "camp" }, start: ["camp"] },
      { text: "Sprich mit Kael", obj: { type: "talk", npc: "kael" }, target: { k: "camp" } }
    ],
    outro: [
      { s: "kael", t: "Hah \u2013 ganz ruhig. Wenn du mich h\xE4ttest t\xF6ten wollen, h\xE4ttest du nicht so laut durchs Geb\xFCsch trampeln d\xFCrfen." },
      { s: "kael", t: "Sylva schickt dich? Dann ist es ernst. Ich bin Kael. Ich jage, was gejagt werden muss \u2013 und seit dem Welken ist das eine Menge." },
      { s: "kael", t: "Die W\xF6lfe hier sind nicht mehr sie selbst. Aus ihrem Fell wachsen Dornen. Irgendetwas weiter im Wald ruft sie." }
    ],
    rewards: { xp: 300, gold: 30 }
  },
  {
    id: "m06",
    title: "Dornenf\xE4nge",
    kind: "main",
    act: 1,
    giver: "kael",
    summary: "Kael will herausfinden, was die W\xF6lfe ver\xE4ndert hat.",
    intro: [
      { s: "kael", t: "Bring mir F\xE4nge von den Dornenw\xF6lfen. Wenn ich das Gift darin lesen kann, finde ich den Ort, von dem es kommt." },
      { s: "kael", t: "Und \u2013 sei nicht zu sanft. Sie leiden. Ein schneller Tod ist das Freundlichste, was wir ihnen geben k\xF6nnen." }
    ],
    stages: [
      { text: "Sammle Dornenf\xE4nge", obj: { type: "collect", item: "cdw:dornenfang", count: 5, consume: true }, target: { k: "camp" }, start: ["spawn:dornenwolf:4:camp"], drop: { mobs: ["cdw:dornenwolf"], item: "dornenfang", chance: 0.7 } }
    ],
    turnIn: "kael",
    outro: [
      { s: "kael", t: "Hm\u2026 riechst du das? Harz und F\xE4ulnis. Das stammt nicht aus dem Wald \u2013 das kommt von unten. Aus den Wurzeln selbst." },
      { s: "kael", t: "Der Ort hei\xDFt bei den Alten der \xA72Dornenhain\xA7f. Ein Tempel, den die Wurzeln l\xE4ngst verschluckt haben. Dort schl\xE4gt dein Herz \u2013 und dort wartet auch, was die W\xF6lfe ruft." }
    ],
    rewards: { xp: 380, gold: 45, gear: { rarity: 1 } }
  },
  {
    id: "m07",
    title: "Der Dornenhain",
    kind: "main",
    act: 1,
    summary: "Dring in den Dornenhain ein und befreie das erste Wurzelherz.",
    intro: [],
    stages: [
      { text: "Erreiche den Dornenhain", obj: { type: "reach", target: { k: "dungeon", id: "dornenhain" }, radius: 10 }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:dornenhain:rooms" }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Besiege den W\xE4chter des Herzens", obj: { type: "flag", flag: "boss:boss_rindenschreck" }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:dornenhain" }, target: { k: "dungeon", id: "dornenhain" } }
    ],
    outro: [
      { s: "erzaehler", t: "Als deine Hand das Herz ber\xFChrt, durchf\xE4hrt dich W\xE4rme. Das schwarze Ge\xE4st darin zerf\xE4llt zu Staub, und ein goldenes Pulsieren breitet sich in alle Richtungen aus \u2013 bis weit unter die Erde." },
      { s: "stimme", t: "\xA7o\u2026eins\u2026\xA7r" }
    ],
    rewards: { xp: 900, gold: 120, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 2 } }
  },
  {
    id: "m08",
    title: "Ein Funke Hoffnung",
    kind: "main",
    act: 1,
    summary: "Kehre zum Hain zur\xFCck und berichte Sylva.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zur\xFCck", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Ich habe es gesp\xFCrt! Der Baum hat in der Nacht getrunken \u2013 zum ersten Mal seit Monden. Sieh nur, wie er gewachsen ist." },
      { s: "sylva", t: "Und mit dem Leben kommen die Menschen zur\xFCck. Ein Schmied, \xA76Brom\xA7f, hat sich am Hain niedergelassen. Und Kael\u2026 nun, Kael sagt, er bleibt \u201Evorerst\u201C." },
      { s: "sylva", t: "Doch die F\xE4ulnis kam nicht von selbst. Etwas \u2013 jemand \u2013 hat die Herzen vergiftet. Ich\u2026 habe einen Verdacht. Aber ich brauche Gewissheit, bevor ich ihn ausspreche." }
    ],
    done: ["hub_stage:1", "npc_home:kael"],
    rewards: { xp: 400, gold: 80, rep: 150, gear: { rarity: 2, armor: true } }
  },
  // ======================= AKT II =======================
  {
    id: "m09",
    title: "Der Schmied",
    kind: "main",
    act: 2,
    giver: "brom",
    summary: "Brom Eisenwurz bietet an, deine Waffe zu verst\xE4rken.",
    intro: [
      { s: "brom", t: "Du bist also der Gr\xFCnschnabel, wegen dem Sylva pl\xF6tzlich wieder l\xE4chelt. Brom. Eisenwurz. Schmied." },
      { s: "brom", t: "Zeig mal deine Klinge\u2026 Hmpf. Damit willst du dem Welken in die Augen sehen? Gib her. Die erste Verbesserung geht aufs Haus." },
      { s: "erzaehler", t: "Nimm die Waffe, die du verbessern willst, in die Hand und w\xE4hle bei Brom \u201EAusr\xFCstung verbessern\u201C." }
    ],
    stages: [{ text: "Verbessere eine Waffe bei Brom", obj: { type: "flag", flag: "upgrade_done" }, target: { k: "npc", id: "brom" }, start: ["free_upgrade"] }],
    turnIn: "brom",
    outro: [
      { s: "brom", t: "Na also. Sp\xFCrst du das Gewicht? Das ist ehrlicher Stahl. Komm wieder, wenn du Runenstaub findest \u2013 dann zeig ich dir, was richtige Schmiedekunst ist." }
    ],
    rewards: { xp: 300, gold: 40 }
  },
  {
    id: "m10",
    title: "Seufzer im Nebel",
    kind: "main",
    act: 2,
    giver: "sylva",
    summary: "Das zweite Herz liegt unter einem Moor, in dem es nachts seufzt.",
    intro: [
      { s: "sylva", t: "Das zweite Herz schl\xE4gt unter dem \xA72Seufzermoor\xA7f. Die Menschen dort erz\xE4hlen, dass man nachts Stimmen im Nebel h\xF6rt \u2013 Seufzer, als w\xFCrde das Moor selbst trauern." },
      { s: "sylva", t: "Sei vorsichtig. Wo Wasser steht, breitet sich das Welken schneller aus." }
    ],
    stages: [
      { text: "Reise zum Seufzermoor", obj: { type: "reach", target: { k: "dungeon", id: "seufzermoor" }, radius: 60 }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Besiege Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 8 }, target: { k: "dungeon", id: "seufzermoor" }, start: ["zone:seufzermoor"] }
    ],
    outro: [
      { s: "erzaehler", t: "Zwischen den toten B\xE4umen steigt d\xFCnner Rauch auf. Eine H\xFCtte \u2013 bewohnt." }
    ],
    rewards: { xp: 700, gold: 70 }
  },
  {
    id: "m11",
    title: "Die Hexe im Moor",
    kind: "main",
    act: 2,
    summary: "In der H\xFCtte am Moor lebt jemand, der mehr wei\xDF, als er sagt.",
    intro: [],
    stages: [
      { text: "Sprich mit der Bewohnerin der H\xFCtte", obj: { type: "talk", npc: "morgra" }, target: { k: "npc", id: "morgra" }, start: ["npc_dungeon:morgra:seufzermoor"] },
      {
        text: "Bring Morgra Moorschleim",
        obj: { type: "collect", item: "cdw:moorschleim", count: 6, consume: true },
        target: { k: "npc", id: "morgra" },
        lines: [
          { s: "morgra", t: "Noch ein Held. Wie reizend. Der letzte hat drei Tage durchgehalten, bevor das Moor ihn verschluckt hat." },
          { s: "morgra", t: "Du willst zum Herzen? Unter dem Moor wacht der \xA75Moorschlund\xA7f. Sein Gift frisst sich durch Leder und Haut. Ohne meinen Trank bist du Futter." },
          { s: "morgra", t: "Bring mir Moorschleim. Sechs Klumpen. Und frag nicht, wof\xFCr ich den Rest brauche." }
        ],
        drop: { mobs: ["cdw:schlammkroete", "cdw:moorschlurfer"], item: "moorschleim", chance: 0.7 }
      },
      { text: "Gib Morgra den Moorschleim", obj: { type: "talk", npc: "morgra" }, target: { k: "npc", id: "morgra" } }
    ],
    outro: [
      { s: "morgra", t: "Hier. Trink das, bevor du runtergehst \u2013 oder lass es, mir egal." },
      { s: "morgra", t: "\u2026Und W\xE4chter. Wenn du dem Schlund gegen\xFCberstehst \u2013 schau ihm in die Augen. Vielleicht erkennst du dann, warum ich dieses Moor nicht verlassen kann." }
    ],
    rewards: { xp: 650, gold: 60, items: [{ id: "heiltrank", n: 4 }, { id: "elixier_zaehigkeit", n: 1 }] }
  },
  {
    id: "m12",
    title: "Das Seufzermoor",
    kind: "main",
    act: 2,
    summary: "Befreie das zweite Wurzelherz unter dem Moor.",
    intro: [],
    stages: [
      { text: "Betritt das Seufzermoor", obj: { type: "reach", target: { k: "dungeon", id: "seufzermoor" }, radius: 10 }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:seufzermoor:rooms" }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Besiege den Moorschlund", obj: { type: "flag", flag: "boss:boss_moorschlund" }, target: { k: "dungeon", id: "seufzermoor" } },
      {
        text: "Triff am Herzen eine Entscheidung",
        obj: { type: "flag", flag: "choice:morgra" },
        target: { k: "dungeon", id: "seufzermoor" },
        lines: [
          { s: "erzaehler", t: "Im Maul des toten Schlunds gl\xE4nzt etwas: ein silberner Ring mit einem eingeritzten Namen \u2013 \xA75Morgra\xA7f." },
          { s: "erzaehler", t: "Am Wurzelherz h\xE4ngt ein Fluch wie ein schwarzer Schleier. Er ist mit dem Ring verbunden \u2013 und mit der Frau in der H\xFCtte. Sie ist nicht die Herrin des Moors. Sie ist seine Gefangene." }
        ]
      },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:seufzermoor" }, target: { k: "dungeon", id: "seufzermoor" } }
    ],
    outro: [{ s: "stimme", t: "\xA7o\u2026zwei\u2026\xA7r" }],
    rewards: { xp: 1600, gold: 180, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 2 } }
  },
  {
    id: "m13",
    title: "Zwei Herzen",
    kind: "main",
    act: 2,
    summary: "Kehre zum Hain zur\xFCck.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zur\xFCck", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Zwei Herzen schlagen wieder. Der Hain bl\xFCht \u2013 sieh nur, eine Alchemistin ist gekommen, \xA7dMira\xA7f. Sie sagt, die Pflanzen hier seien \u201Eunversch\xE4mt lebendig\u201C." },
      { s: "sylva", t: "Du hast mir von Morgra erz\xE4hlt. Ein Fluch, der einen Menschen an ein Herz bindet\u2026 Diese Art Magie kenne ich. Es gibt nur einen, der sie je beherrscht hat." },
      { s: "sylva", t: "Sein Name ist \xA74Morvath\xA7f. Einst war er Erzdruide des Weltenbaums. Dann wollte er mehr als ein Leben. Mehr erz\xE4hle ich dir, wenn ich sicher bin." }
    ],
    done: ["hub_stage:2"],
    rewards: { xp: 700, gold: 120, rep: 250 }
  },
  // ======================= AKT III =======================
  {
    id: "m14",
    title: "Die Alchemistin",
    kind: "main",
    act: 3,
    giver: "mira",
    summary: "Mira bringt dir die Grundlagen der Alchemie bei.",
    intro: [
      { s: "mira", t: "Oh! Du bist der W\xE4chter! Ich bin Mira. Wei\xDFt du, dass die Bl\xFCten hier nachts leuchten? Das ist wissenschaftlich h\xF6chst unanst\xE4ndig!" },
      { s: "mira", t: "F\xFCr den Weg, der vor dir liegt, brauchst du mehr als Gl\xFCck. Ich zeige dir, wie man einen Heiltrank braut \u2013 an jeder Werkbank, mit Zutaten, die das Welken dir praktischerweise selbst liefert." },
      { s: "erzaehler", t: "Rezept: \xA7fKleiner Heiltrank\xA77 = Glasflasche + Moosherz + S\xFC\xDFe Beeren (Werkbank). Weitere Rezepte findest du im Abenteuerbuch \u2192 Rezepte." }
    ],
    stages: [{ text: "Braue einen kleinen Heiltrank", obj: { type: "collect", item: "cdw:heiltrank_klein", count: 1, consume: false }, target: { k: "npc", id: "mira" } }],
    turnIn: "mira",
    outro: [{ s: "mira", t: "Perfekt! Na ja \u2013 trinkbar. Das ist in der Alchemie praktisch dasselbe. Nimm die hier, die sind von mir. Und komm wieder, ich habe Aufgaben f\xFCr dich!" }],
    rewards: { xp: 500, gold: 60, items: [{ id: "heiltrank", n: 4 }, { id: "manatrank", n: 4 }] }
  },
  {
    id: "m15",
    title: "Asche und Erinnerung",
    kind: "main",
    act: 3,
    giver: "sylva",
    summary: "Im Glutsand sollen alte Aufzeichnungen der Weltenbaum-Priester liegen.",
    intro: [
      { s: "sylva", t: "Das dritte Herz liegt unter dem \xA76Glutsand\xA7f \u2013 in einem Tempel der alten Priester von Ylvaris. Fr\xFCher war dort ein Wald. Dann kam die Hitze." },
      { s: "sylva", t: "Die Priester sind nie gegangen. Das Welken hat sie\u2026 behalten. Sie tragen vielleicht noch Seiten ihrer Chroniken bei sich. Ich muss wissen, was darin steht." }
    ],
    stages: [
      { text: "Reise zum Glutsand", obj: { type: "reach", target: { k: "dungeon", id: "glutsand" }, radius: 60 }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Finde verwelkte Tagebuchseiten", obj: { type: "collect", item: "cdw:verwelkte_seite", count: 3, consume: true }, target: { k: "dungeon", id: "glutsand" }, start: ["zone:glutsand"], drop: { mobs: ["cdw:verdorrter_priester", "cdw:glutgeist", "cdw:glutskorpion"], item: "verwelkte_seite", chance: 0.3 } }
    ],
    outro: [
      { s: "erzaehler", t: "Die Seiten sind br\xFCchig, die Schrift fein und schr\xE4g: \xA7o\u201ETag 412. Der Baum schenkt Leben, aber er nimmt es auch wieder. Warum sollte ein G\xE4rtner sterben, w\xE4hrend sein Garten ewig lebt? Ich werde einen Weg finden. F\xFCr mich. F\xFCr sie.\u201C\xA7r" },
      { s: "erzaehler", t: "Unterzeichnet mit einem einzigen Buchstaben: \xA74M.\xA7r" }
    ],
    rewards: { xp: 1300, gold: 140 }
  },
  {
    id: "m16",
    title: "Tempel der Glut",
    kind: "main",
    act: 3,
    summary: "L\xF6se das R\xE4tsel des Tempels und befreie das dritte Herz.",
    intro: [],
    stages: [
      { text: "Betritt den Tempel der Glut", obj: { type: "reach", target: { k: "dungeon", id: "glutsand" }, radius: 10 }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Entz\xFCnde die Runensteine und dringe vor", obj: { type: "flag", flag: "dungeon:glutsand:rooms" }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Besiege die Glutk\xF6nigin", obj: { type: "flag", flag: "boss:boss_glutkoenigin" }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:glutsand" }, target: { k: "dungeon", id: "glutsand" } }
    ],
    outro: [{ s: "stimme", t: "\xA7o\u2026drei\u2026\xA7r" }],
    rewards: { xp: 2600, gold: 260, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } }
  },
  {
    id: "m17",
    title: "F\xFCr sie",
    kind: "main",
    act: 3,
    summary: "Bring Sylva die Seiten aus dem Tempel.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zur\xFCck", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "\u201EF\xFCr mich. F\xFCr sie.\u201C \u2026Ich kenne diese Handschrift. Ich habe sie mein Leben lang gesehen." },
      { s: "sylva", t: "Morvath ist mein Bruder. Als ich krank wurde, damals, suchte er einen Weg, den Tod zu besiegen. Er fand ihn \u2013 in den Wurzeln. Er nahm dem Baum, was der Baum allen gab." },
      { s: "sylva", t: "Ich wurde gesund. Und er wurde\u2026 etwas anderes. Ich habe ihn verbannt. Ich dachte, er sei l\xE4ngst vergangen. Ich habe mich geirrt." },
      { s: "sylva", t: "Ein Gelehrter ist angekommen, \xA79Oswin\xA7f. Er kann die Seiten entziffern. Bitte \u2013 hilf ihm. Und verzeih mir, dass ich es dir nicht fr\xFCher gesagt habe." }
    ],
    done: ["hub_stage:3"],
    rewards: { xp: 1e3, gold: 160, rep: 350 }
  },
  // ======================= AKT IV =======================
  {
    id: "m18",
    title: "Der Chronist",
    kind: "main",
    act: 4,
    summary: "Oswin hat die Seiten entziffert.",
    intro: [],
    stages: [{ text: "Sprich mit Oswin, dem Chronisten", obj: { type: "talk", npc: "oswin" }, target: { k: "npc", id: "oswin" } }],
    outro: [
      { s: "oswin", t: "Ah, der W\xE4chter. Oswin, Chronist, ehemals Bibliothekar der Akademie zu \u2013 nun, das tut nichts zur Sache. Ich habe die Seiten gelesen. Dreimal. Mit Lupe." },
      { s: "oswin", t: "Der Verfasser beschreibt ein Ritual. Er bindet fremde Seelen an die Wurzelherzen, damit sie an seiner statt verwelken. Das vierte Herz liegt in der \xA7bFrostkrone\xA7f, hoch in den Bergen." },
      { s: "oswin", t: "Und \u2013 das ist das Beunruhigende \u2013 er schreibt von einem \u201EHelfer, der die W\xE4chter f\xFChrt\u201C. Jemand aus eurem Kreis arbeitet f\xFCr ihn." },
      { s: "oswin", t: "Seid wachsam, wem ihr den R\xFCcken zukehrt. Und bringt mir bitte weitere Seiten, falls ihr welche findet. F\xFCr die Chronik." }
    ],
    rewards: { xp: 900, gold: 100 }
  },
  {
    id: "m19",
    title: "K\xE4lter als Eis",
    kind: "main",
    act: 4,
    summary: "Reise in die Frostkrone. Etwas Vertrautes wartet dort.",
    intro: [],
    stages: [
      { text: "Reise zur Frostkrone", obj: { type: "reach", target: { k: "dungeon", id: "frostkrone" }, radius: 60 }, target: { k: "dungeon", id: "frostkrone" } },
      { text: "Besiege Kreaturen der Frostkrone", obj: { type: "kill", fam: "cdw_frost", count: 10 }, target: { k: "dungeon", id: "frostkrone" }, start: ["zone:frostkrone"] },
      { text: "Finde, was der Frosttroll bewacht", obj: { type: "collect", item: "cdw:kaels_amulett", count: 1, consume: false }, target: { k: "dungeon", id: "frostkrone" }, start: ["spawn:frosttroll:1:dungeon:frostkrone"], drop: { mobs: ["cdw:frosttroll"], item: "kaels_amulett", chance: 1 } }
    ],
    outro: [
      { s: "erzaehler", t: "Das Amulett ist zerkratzt, aber die Gravur ist deutlich: \xA72Kael\xA7f \u2013 und darunter ein zweiter Name, \xA7bLiora\xA7f." },
      { s: "erzaehler", t: "Warum tr\xE4gt ein Frosttroll, ein Diener des Welkens, Kaels Amulett?" }
    ],
    rewards: { xp: 2400, gold: 220 }
  },
  {
    id: "m20",
    title: "Verrat",
    kind: "main",
    act: 4,
    summary: "Stelle dich der Wahrheit in der Frostkrone.",
    intro: [],
    stages: [
      {
        text: "Betritt die Frostkrone-Feste",
        obj: { type: "reach", target: { k: "dungeon", id: "frostkrone" }, radius: 10 },
        target: { k: "dungeon", id: "frostkrone" }
      },
      {
        text: "Dringe in die Feste vor",
        obj: { type: "flag", flag: "dungeon:frostkrone:rooms" },
        target: { k: "dungeon", id: "frostkrone" },
        start: ["kael_away"],
        lines: [
          { s: "kael", t: "\u2026Du hast das Amulett gefunden. Nat\xFCrlich hast du das." },
          { s: "kael", t: "Ja. Ich war es. Ich habe Morvaths Kreaturen zu den Herzen gef\xFChrt, bevor Sylva dich gefunden hat. Ich habe ihm gesagt, wo der Hain steht." },
          { s: "kael", t: "Er hat meine Schwester. \xA7bLiora\xA7f. Er hat sie an das letzte Herz gebunden \u2013 wenn es gereinigt wird, stirbt sie mit dem Fluch. Das hat er mir jedenfalls gesagt." },
          { s: "kael", t: "Ich kann dich nicht aufhalten. Ich will es nicht einmal. Aber ich kann dir auch nicht helfen. Nicht hier." },
          { s: "erzaehler", t: "Kael verschwindet im Schneetreiben. Hinter ihm schlie\xDFt sich das Tor der Feste." }
        ]
      },
      { text: "Besiege Hrimgar, den Frostkoloss", obj: { type: "flag", flag: "boss:boss_hrimgar" }, target: { k: "dungeon", id: "frostkrone" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:frostkrone" }, target: { k: "dungeon", id: "frostkrone" } }
    ],
    outro: [
      { s: "stimme", t: "\xA7o\u2026vier\u2026\xA7r" },
      { s: "erzaehler", t: "Im verblassenden Licht des Herzens zeichnet sich ein Bild: eine junge Frau, eingesponnen in Kristall, tief unter der Erde. Sie lebt." }
    ],
    done: ["npc_home:kael"],
    rewards: { xp: 3600, gold: 340, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } }
  },
  {
    id: "m21",
    title: "Vergebung?",
    kind: "main",
    act: 4,
    summary: "Kael ist zum Hain zur\xFCckgekehrt. Sprich mit ihm.",
    intro: [],
    stages: [{ text: "Sprich mit Kael im Hain", obj: { type: "talk", npc: "kael" }, target: { k: "npc", id: "kael" } }],
    outro: [
      { s: "kael", t: "Ich hab's Sylva gesagt. Alles. Sie hat mich nicht fortgejagt. Ich wei\xDF nicht, ob das besser oder schlimmer ist." },
      { s: "kael", t: "Du hast es auch gesehen, oder? Im Herz. Liora. Sie lebt \u2013 Morvath hat gelogen. Der Fluch h\xE4lt sie in der \xA75Schattenwurzel\xA7f gefangen, nicht im Herz." },
      { s: "kael", t: "Ich schulde dir mehr, als ich je zur\xFCckzahlen kann. Aber lass mich anfangen. Ich gehe mit dir in die Tiefe." }
    ],
    done: ["hub_stage:4"],
    rewards: { xp: 1500, gold: 200, rep: 400, gear: { rarity: 3, armor: true } }
  },
  // ======================= AKT V =======================
  {
    id: "m22",
    title: "In die Tiefe",
    kind: "main",
    act: 5,
    giver: "kael",
    summary: "Steige in die Schattenwurzel hinab.",
    intro: [
      { s: "kael", t: "Die Schattenwurzel liegt dort, wo die Wurzeln von Ylvaris am tiefsten reichen. Kein Licht, kein Laut \u2013 nur Kristall und Hunger." },
      { s: "kael", t: "R\xE4um den Weg frei. Ich folge dir, sobald ich Liora sp\xFCre." }
    ],
    stages: [
      { text: "Reise zur Schattenwurzel", obj: { type: "reach", target: { k: "dungeon", id: "schattenwurzel" }, radius: 60 }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Besiege Kreaturen der Tiefe", obj: { type: "kill", fam: "cdw_deep", count: 10 }, target: { k: "dungeon", id: "schattenwurzel" }, start: ["zone:schattenwurzel"] }
    ],
    outro: [],
    rewards: { xp: 3200, gold: 300 }
  },
  {
    id: "m23",
    title: "Die Kristallmutter",
    kind: "main",
    act: 5,
    summary: "Befreie das f\xFCnfte Herz \u2013 und Liora.",
    intro: [],
    stages: [
      { text: "Betritt die Schattenwurzel", obj: { type: "reach", target: { k: "dungeon", id: "schattenwurzel" }, radius: 10 }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:schattenwurzel:rooms" }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Besiege die Kristallmutter", obj: { type: "flag", flag: "boss:boss_kristallmutter" }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Reinige das letzte Wurzelherz", obj: { type: "flag", flag: "heart:schattenwurzel" }, target: { k: "dungeon", id: "schattenwurzel" } }
    ],
    outro: [
      { s: "erzaehler", t: "Der Kristall um die junge Frau splittert. Kael ist da, bevor sie f\xE4llt." },
      { s: "liora", t: "\u2026Kael? Du bist alt geworden, gro\xDFer Bruder." },
      { s: "kael", t: "Und du bist immer noch frech. Gut. Gut\u2026" },
      { s: "stimme", t: "\xA7o\u2026f\xFCnf. Ich bin wach.\xA7r" }
    ],
    rewards: { xp: 5200, gold: 480, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } }
  },
  {
    id: "m24",
    title: "Die letzte Verteidigung",
    kind: "main",
    act: 5,
    giver: "sylva",
    summary: "Morvath hat gesp\xFCrt, dass alle Herzen frei sind. Er greift den Hain an.",
    intro: [
      { s: "sylva", t: "Alle f\xFCnf Herzen schlagen. Ylvaris ist wach \u2013 und Morvath wei\xDF es. Ich sp\xFCre seinen Zorn wie Frost auf der Haut." },
      { s: "sylva", t: "Er wird nicht warten. Er schickt alles, was ihm geblieben ist. Hier, gegen den Hain. Gegen uns." },
      { s: "morvath", t: "\xA7o\u201ESchwester. Du h\xE4ttest sterben sollen, damals. Ich habe dir ein Leben geschenkt \u2013 und du gibst es diesem Baum zur\xFCck?\u201C\xA7r" }
    ],
    stages: [{ text: "Verteidige den Hain gegen Morvaths Heer (5 Wellen)", obj: { type: "flag", flag: "defense:final" }, start: ["defense:final"], target: { k: "hub" } }],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Sie fliehen! Doch sieh \u2013 dort am Horizont. Ein Turm aus schwarzem Holz, gewachsen in einer einzigen Nacht. Die \xA74Zitadelle des Welkens\xA7f." },
      { s: "sylva", t: "Dort ist er. Beende es, W\xE4chter. Und wenn du kannst\u2026 sag ihm, dass ich ihm vergebe." }
    ],
    done: ["citadel"],
    rewards: { xp: 4800, gold: 450, rep: 500 }
  },
  // ======================= FINALE =======================
  {
    id: "m25",
    title: "Die Zitadelle des Welkens",
    kind: "main",
    act: 6,
    summary: "Erklimme die Zitadelle und stelle dich Morvath.",
    intro: [],
    stages: [
      { text: "Erreiche die Zitadelle", obj: { type: "reach", target: { k: "dungeon", id: "zitadelle" }, radius: 12 }, target: { k: "dungeon", id: "zitadelle" } },
      { text: "Erklimme die Zitadelle", obj: { type: "flag", flag: "dungeon:zitadelle:rooms" }, target: { k: "dungeon", id: "zitadelle" } },
      {
        text: "Besiege Morvath",
        obj: { type: "flag", flag: "boss:boss_morvath" },
        target: { k: "dungeon", id: "zitadelle" },
        lines: [
          { s: "morvath", t: "Der kleine G\xE4rtner meiner Schwester. Wei\xDFt du, was Ewigkeit bedeutet? Kein Abschied mehr. Nie wieder." },
          { s: "morvath", t: "Ich wollte nur, dass sie bleibt. Und jetzt hat sie sich f\xFCr einen Baum entschieden. Dann soll der Baum brennen." }
        ]
      },
      { text: "Besiege, was aus Morvath geworden ist", obj: { type: "flag", flag: "boss:boss_welkenbestie" }, target: { k: "dungeon", id: "zitadelle" } }
    ],
    outro: [
      { s: "erzaehler", t: "Die Bestie zerf\xE4llt zu Holz und Asche. Zur\xFCck bleibt ein alter Mann, kaum mehr als ein Schatten." },
      { s: "morvath", t: "\u2026Sie vergibt mir? Dumme, gute Schwester. \u2026Sag ihr\u2026 dass das Gift nie f\xFCr sie bestimmt war. Nur die Angst." },
      { s: "erzaehler", t: "Ein Windhauch, und er ist fort. \xDCber der Zitadelle rei\xDFt der Himmel auf." }
    ],
    rewards: { xp: 8e3, gold: 900, gear: { rarity: 4 } }
  },
  {
    id: "m26",
    title: "Ylvaris erbl\xFCht",
    kind: "main",
    act: 6,
    summary: "Kehre ein letztes Mal zu Sylva zur\xFCck.",
    intro: [],
    stages: [{ text: "Kehre zum Hain zur\xFCck", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Ich habe es gesp\xFCrt, als er ging. Kein Zorn mehr. Nur Stille. \u2026Danke, dass du ihm meine Worte gebracht hast." },
      { s: "sylva", t: "Sieh dir den Baum an. Ylvaris bl\xFCht. Das Land wird heilen \u2013 nicht in einem Tag, aber es wird heilen." },
      { s: "sylva", t: "Doch das Welken hat Spuren hinterlassen. Tief unter der Erde regt sich etwas Uraltes, das Morvath geweckt hat. Und die Wurzelpfade werden nicht von selbst sicher." },
      { s: "sylva", t: "Ihr seid jetzt \xA76W\xE4chter des Weltenbaums\xA7f. Der Hain ist euer Zuhause. Was immer kommt \u2013 wir begegnen ihm gemeinsam." },
      { s: "erzaehler", t: "\xA76Ende der Hauptgeschichte.\xA7f Freigeschaltet: \xA7eHeroische Wurzelpfade\xA7f (Dungeons wiederholen), \xA7eder Altar des Uralten\xA7f (Weltboss) und \xA7ePrestige\xA7f. Danke f\xFCrs Spielen!" }
    ],
    done: ["hub_stage:5", "endgame"],
    rewards: { xp: 5e3, gold: 1e3, rep: 1e3, title: "W\xE4chter des Weltenbaums", items: [{ id: "beschwoerungsstein", n: 1 }] }
  }
];
var SIDE = [
  // --- Fennick ---
  {
    id: "f1",
    title: "Ein H\xE4ndler in Not",
    kind: "side",
    act: 0,
    giver: "fennick",
    minStage: 0,
    summary: "Fennick hat auf dem Weg zum Hain seine Vorr\xE4te verloren.",
    intro: [{ s: "fennick", t: "Fennick, fahrender H\xE4ndler, zu Diensten! Nun ja \u2013 fast. Ein paar Mooslinge haben meinen Proviant gefressen. Mitsamt Wagen. Bringst du mir Brot? Ich zahle gut. Sp\xE4ter. Ganz bestimmt." }],
    stages: [{ text: "Bring Fennick 8 Brot", obj: { type: "collect", item: "minecraft:bread", count: 8, consume: true }, target: { k: "npc", id: "fennick" } }],
    outro: [{ s: "fennick", t: "Mmh! Du bist ein Schatz. Hier, ehrlich verdient. Und f\xFCr dich gibt's ab jetzt den Freundschaftspreis!" }],
    rewards: { xp: 120, gold: 40, rep: 60 }
  },
  {
    id: "f2",
    title: "Gef\xE4hrliche Handelswege",
    kind: "side",
    act: 0,
    giver: "fennick",
    requires: ["f1"],
    minLevel: 5,
    summary: "Die Wege rund um den Hain sind voller Kreaturen des Welkens.",
    intro: [{ s: "fennick", t: "Kein H\xE4ndler traut sich mehr hierher \u2013 \xFCberall F\xE4ulniskreaturen! R\xE4um ein bisschen auf, ja? F\xFCnfzehn sollten reichen, damit sich das rumspricht." }],
    stages: [{ text: "Besiege Kreaturen des Welkens", obj: { type: "kill", fam: "cdw_blight", count: 15 } }],
    outro: [{ s: "fennick", t: "Ich hab's geh\xF6rt! \u201EAm Hain gibt's einen W\xE4chter, der aufr\xE4umt.\u201C Gut f\xFCrs Gesch\xE4ft. Sehr gut sogar." }],
    rewards: { xp: 400, gold: 90, rep: 80 }
  },
  {
    id: "f3",
    title: "Seltene Ware",
    kind: "side",
    act: 0,
    giver: "fennick",
    requires: ["f2"],
    minLevel: 12,
    summary: "Fennick sucht Smaragde f\xFCr einen besonderen Kunden.",
    intro: [{ s: "fennick", t: "Ein Kunde \u2013 sehr reich, sehr geheimnisvoll \u2013 will Smaragde. Drei St\xFCck. Daf\xFCr hab ich da einen Talisman, der\u2026 sagen wir, Gl\xFCck anzieht." }],
    stages: [{ text: "Bring Fennick 3 Smaragde", obj: { type: "collect", item: "minecraft:emerald", count: 3, consume: true }, target: { k: "npc", id: "fennick" } }],
    outro: [{ s: "fennick", t: "Wundersch\xF6n. Hier, der Talisman des Gl\xFCcks. Nicht weitersagen, woher du ihn hast." }],
    rewards: { xp: 700, gold: 60, rep: 100, items: [{ id: "talisman_glueck", n: 1 }] }
  },
  // --- Kael ---
  {
    id: "k1",
    title: "Rudeljagd",
    kind: "side",
    act: 1,
    giver: "kael",
    minStage: 1,
    summary: "Kael will die verdorbenen Wolfsrudel ausd\xFCnnen.",
    intro: [{ s: "kael", t: "Die Dornenw\xF6lfe vermehren sich. Wenn wir nichts tun, sind bald alle Rudel verdorben. Zehn. Dann reden wir weiter." }],
    stages: [{ text: "Besiege Dornenw\xF6lfe", obj: { type: "kill", mobs: ["cdw:dornenwolf"], count: 10 } }],
    outro: [{ s: "kael", t: "Saubere Arbeit. Hier, nimm das. Ein J\xE4ger sollte gut ausger\xFCstet sein." }],
    rewards: { xp: 500, gold: 70, rep: 60, gear: { rarity: 1 } }
  },
  {
    id: "k2",
    title: "Goblinplage",
    kind: "side",
    act: 1,
    giver: "kael",
    requires: ["k1"],
    minLevel: 8,
    summary: "Goblins pl\xFCndern die Gegend.",
    intro: [{ s: "kael", t: "Goblins. Das Welken interessiert sie nicht \u2013 nur, was sie dabei mitgehen lassen k\xF6nnen. Ihre Lager tauchen \xFCberall auf. Zeig ihnen, dass hier nichts zu holen ist." }],
    stages: [{ text: "Besiege Goblins", obj: { type: "kill", fam: "cdw_goblin", count: 12 } }],
    outro: [{ s: "kael", t: "Die werden so schnell nicht wiederkommen. Na ja. Goblins. Vermutlich doch." }],
    rewards: { xp: 800, gold: 150, rep: 80 }
  },
  {
    id: "k3",
    title: "Der Leitwolf",
    kind: "side",
    act: 1,
    giver: "kael",
    requires: ["k2"],
    minLevel: 14,
    summary: "Kael sucht eine besonders starke Kreatur.",
    intro: [{ s: "kael", t: "Manche Kreaturen des Welkens sind st\xE4rker als andere \u2013 du erkennst sie an ihrem Leuchten. Elite-Biester. Erledige eins und bring mir den Beweis." }],
    stages: [{ text: "Besiege ein Elite-Monster", obj: { type: "flag", flag: "elite_kill" } }],
    outro: [{ s: "kael", t: "Nicht schlecht. Wirklich nicht schlecht. Der hier geh\xF6rt dir \u2013 er hat mir oft genug den Hintern gerettet." }],
    rewards: { xp: 1400, gold: 160, rep: 100, items: [{ id: "talisman_wind", n: 1 }] }
  },
  {
    id: "k4",
    title: "Schatten der Tiefe",
    kind: "side",
    act: 5,
    giver: "kael",
    requires: ["k3"],
    minLevel: 32,
    minStage: 4,
    summary: "Wurzelgolems bedrohen die H\xF6hlen.",
    intro: [{ s: "kael", t: "Liora erz\xE4hlt von riesigen Golems aus Wurzeln und Stein, die in den H\xF6hlen wandern. Drei davon. F\xFCr sie." }],
    stages: [{ text: "Besiege Wurzelgolems", obj: { type: "kill", mobs: ["cdw:wurzelgolem"], count: 3 } }],
    outro: [{ s: "kael", t: "Danke. Von uns beiden." }],
    rewards: { xp: 4e3, gold: 300, rep: 150, gear: { rarity: 3 } }
  },
  // --- Brom ---
  {
    id: "b1",
    title: "Erz f\xFCr die Esse",
    kind: "side",
    act: 2,
    giver: "brom",
    minStage: 1,
    summary: "Brom braucht Eisen f\xFCr seine Schmiede.",
    intro: [{ s: "brom", t: "Eine Schmiede ohne Eisen ist wie ein Bier ohne Schaum. Traurig. Bring mir zehn Eisenbarren, und ich schmiede dir was Anst\xE4ndiges." }],
    stages: [{ text: "Bring Brom 10 Eisenbarren", obj: { type: "collect", item: "minecraft:iron_ingot", count: 10, consume: true }, target: { k: "npc", id: "brom" } }],
    outro: [{ s: "brom", t: "Gutes Eisen. Hier \u2013 frisch aus der Esse. Pass drauf auf." }],
    rewards: { xp: 600, gold: 50, rep: 80, gear: { rarity: 2 } }
  },
  {
    id: "b2",
    title: "Mondsilber",
    kind: "side",
    act: 3,
    giver: "brom",
    requires: ["b1"],
    minLevel: 18,
    summary: "Brom will Mondsilber schmelzen.",
    intro: [{ s: "brom", t: "Mondsilber. Gold, das im Frost geschmiedet wird. Bring mir 6 Goldbarren und 4 Frostsplitter, dann zeig ich dir das Rezept." }],
    stages: [
      { text: "Bring Brom 6 Goldbarren", obj: { type: "collect", item: "minecraft:gold_ingot", count: 6, consume: true }, target: { k: "npc", id: "brom" } },
      { text: "Bring Brom 4 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 4, consume: true }, target: { k: "npc", id: "brom" } }
    ],
    outro: [{ s: "brom", t: "Sieh dir diesen Glanz an! Hier, drei Barren f\xFCr dich. Das Rezept steht jetzt in deinem Buch." }],
    rewards: { xp: 1600, gold: 100, rep: 100, items: [{ id: "mondsilberbarren", n: 3 }] }
  },
  {
    id: "b3",
    title: "Runen im Stahl",
    kind: "side",
    act: 3,
    giver: "brom",
    requires: ["b2"],
    minLevel: 24,
    summary: "Brom will Runen in Stahl schmieden.",
    intro: [{ s: "brom", t: "Runenstaub, W\xE4chter. F\xFCnf H\xE4ufchen. Damit bringe ich deinem Stahl das Singen bei." }],
    stages: [{ text: "Bring Brom 5 Runenstaub", obj: { type: "collect", item: "cdw:runenstaub", count: 5, consume: true }, target: { k: "npc", id: "brom" } }],
    outro: [{ s: "brom", t: "Da. H\xF6rst du's? Nein? Dann hast du keine Ohren f\xFCr Stahl. Nimm's trotzdem." }],
    rewards: { xp: 2800, gold: 200, rep: 120, gear: { rarity: 3 } }
  },
  {
    id: "b4",
    title: "Meisterst\xFCck",
    kind: "side",
    act: 5,
    giver: "brom",
    requires: ["b3"],
    minLevel: 32,
    summary: "Brom will sein Meisterst\xFCck schmieden.",
    intro: [{ s: "brom", t: "Ich will ein Meisterst\xFCck schmieden, bevor ich alt werde. \xC4lter. Ich brauch uraltes Harz und f\xFCnf Schattenkristalle." }],
    stages: [
      { text: "Bring Brom 1 Uraltes Harz", obj: { type: "collect", item: "cdw:uraltes_harz", count: 1, consume: true }, target: { k: "npc", id: "brom" } },
      { text: "Bring Brom 5 Schattenkristalle", obj: { type: "collect", item: "cdw:schattenkristall", count: 5, consume: true }, target: { k: "npc", id: "brom" } }
    ],
    outro: [{ s: "brom", t: "\u2026Das ist das Beste, was ich je gemacht hab. Und es geh\xF6rt dir. Sag's keinem, sonst wollen alle eins." }],
    rewards: { xp: 5e3, gold: 400, rep: 200, gear: { rarity: 4 } }
  },
  // --- Mira ---
  {
    id: "a1",
    title: "Kr\xE4uterkunde",
    kind: "side",
    act: 3,
    giver: "mira",
    minStage: 2,
    summary: "Mira braucht Zutaten f\xFCr ihre Experimente.",
    intro: [{ s: "mira", t: "Moosherzen! Sie pochen noch, wenn man sie pfl\xFCckt \u2013 ist das nicht wunderbar? Und eklig! Bring mir sechs, bitte!" }],
    stages: [{ text: "Bring Mira 6 Moosherzen", obj: { type: "collect", item: "cdw:moosherz", count: 6, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Danke! Daraus wird ein Trank, der\u2026 hm. Ich wei\xDF es noch nicht. Hier, die funktionieren schon." }],
    rewards: { xp: 700, gold: 60, rep: 80, items: [{ id: "heiltrank", n: 3 }, { id: "elixier_eile", n: 1 }] }
  },
  {
    id: "a2",
    title: "Gegengift",
    kind: "side",
    act: 3,
    giver: "mira",
    requires: ["a1"],
    minLevel: 18,
    summary: "Mira erforscht ein Gegengift.",
    intro: [{ s: "mira", t: "Skorpionstacheln \u2013 f\xFCnf St\xFCck. Aus ihrem Gift mache ich ein Gegengift. Theoretisch. Praktisch probieren wir es an dir aus. Scherz! Halb." }],
    stages: [{ text: "Bring Mira 5 Skorpionstachel", obj: { type: "collect", item: "cdw:skorpionstachel", count: 5, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Es hat funktioniert! Ich glaube! Hier \u2013 Elixiere, frisch gebraut." }],
    rewards: { xp: 1600, gold: 110, rep: 100, items: [{ id: "elixier_staerke", n: 2 }, { id: "elixier_zaehigkeit", n: 2 }] }
  },
  {
    id: "a3",
    title: "Frostbl\xFCte",
    kind: "side",
    act: 4,
    giver: "mira",
    requires: ["a2"],
    minLevel: 24,
    summary: "Mira will eine Bl\xFCte aus Frost z\xFCchten.",
    intro: [{ s: "mira", t: "Frostsplitter schmelzen nie. Wenn ich einen Samen hineinsetze\u2026 stell dir vor, eine Blume aus Eis! Sechs Splitter, bitte!" }],
    stages: [{ text: "Bring Mira 6 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 6, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Sie bl\xFCht! Und sie\u2026 summt? Egal. Hier, ein Talisman \u2013 das Leben in ihm hat mich darauf gebracht." }],
    rewards: { xp: 2600, gold: 160, rep: 120, items: [{ id: "talisman_leben", n: 1 }] }
  },
  {
    id: "a4",
    title: "Essenz des Welkens",
    kind: "side",
    act: 5,
    giver: "mira",
    requires: ["a3"],
    minLevel: 30,
    summary: "Mira will das Welken selbst verstehen.",
    intro: [{ s: "mira", t: "Wenn ich verstehe, woraus das Welken besteht, kann ich es vielleicht heilen. Zwanzig F\xE4ulnisessenzen. Ja, zwanzig. Ich wei\xDF." }],
    stages: [{ text: "Bring Mira 20 F\xE4ulnisessenzen", obj: { type: "collect", item: "cdw:faeulnisessenz", count: 20, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Es ist\u2026 Trauer. Das Welken ist im Kern Trauer, zu Gift gemacht. Wie seltsam. Danke \u2013 das hier hilft dir beim Lernen." }],
    rewards: { xp: 4e3, gold: 250, rep: 150, items: [{ id: "elixier_weisheit", n: 3 }] }
  },
  // --- Oswin ---
  {
    id: "o1",
    title: "Verlorene Seiten",
    kind: "side",
    act: 4,
    giver: "oswin",
    minStage: 3,
    summary: "Oswin sammelt jede Seite von Morvaths Tagebuch.",
    intro: [{ s: "oswin", t: "Es gibt mehr Seiten, da bin ich sicher. Verdorrte Priester tragen sie, und in alten Truhen k\xF6nnten welche liegen. F\xFCnf weitere w\xFCrden die Chronik vervollst\xE4ndigen." }],
    stages: [{ text: "Bring Oswin 5 Tagebuchseiten", obj: { type: "collect", item: "cdw:verwelkte_seite", count: 5, consume: true }, target: { k: "npc", id: "oswin" }, drop: { mobs: ["cdw:verdorrter_priester"], item: "verwelkte_seite", chance: 0.25 } }],
    outro: [{ s: "oswin", t: "\u201ETag 1: Sylva hustet wieder Blut. Die Heiler schweigen.\u201C \u2026Er war kein Ungeheuer. Nicht am Anfang. Danke, W\xE4chter." }],
    rewards: { xp: 2400, gold: 150, rep: 150, title: "Chronist" }
  },
  {
    id: "o2",
    title: "Die alten Wegsteine",
    kind: "side",
    act: 2,
    giver: "oswin",
    minStage: 3,
    summary: "Oswin will die Wegsteine kartieren.",
    intro: [{ s: "oswin", t: "Die Wegsteine sind Knoten im Wurzelnetz. Aktiviere vier davon \u2013 ich zeichne die Verbindungen in meine Karten." }],
    stages: [{ text: "Aktiviere 4 Wegsteine", obj: { type: "flag", flag: "waystone", count: 4 } }],
    outro: [{ s: "oswin", t: "Faszinierend. Sie bilden ein Muster \u2013 wie die Adern eines Blattes. Hier, f\xFCr deine M\xFChe." }],
    rewards: { xp: 1800, gold: 150, rep: 120, items: [{ id: "rueckkehrschriftrolle", n: 5 }] }
  },
  {
    id: "o3",
    title: "Chronik eines W\xE4chters",
    kind: "side",
    act: 4,
    giver: "oswin",
    requires: ["o1"],
    minLevel: 30,
    summary: "Oswin will deine Geschichte aufschreiben.",
    intro: [{ s: "oswin", t: "Jede Chronik braucht einen Helden. Erreiche Stufe 35 \u2013 dann schreibe ich das Kapitel \xFCber dich." }],
    stages: [{ text: "Erreiche Stufe 35", obj: { type: "level", level: 35 } }],
    outro: [{ s: "oswin", t: "\u201E\u2026und so stand der W\xE4chter vor dem Baum, und der Baum verneigte sich.\u201C Zu dick aufgetragen? Ach was." }],
    rewards: { xp: 3e3, gold: 300, rep: 200, title: "Held der Chronik" }
  },
  // --- Morgra (nur wenn erlöst) ---
  {
    id: "g1",
    title: "Morgras Gebr\xE4u",
    kind: "side",
    act: 2,
    giver: "morgra",
    needsChoice: "free",
    hidden: true,
    summary: "Die freie Morgra braut wieder \u2013 diesmal f\xFCr den Hain.",
    intro: [{ s: "morgra", t: "Frei. Wei\xDFt du, wie lange ich dieses Wort nicht mehr gedacht habe? \u2026Genug Gef\xFChle. Bring mir zehn Moorschleim, ich braue dir etwas Besonderes." }],
    stages: [{ text: "Bring Morgra 10 Moorschleim", obj: { type: "collect", item: "cdw:moorschleim", count: 10, consume: true }, target: { k: "npc", id: "morgra" } }],
    outro: [{ s: "morgra", t: "Hier. Trink nicht alles auf einmal. Oder doch, ist dein Magen." }],
    rewards: { xp: 1500, gold: 100, rep: 150, items: [{ id: "elixier_weisheit", n: 2 }, { id: "manatrank_gross", n: 3 }] }
  },
  {
    id: "g2",
    title: "Das Moor heilt",
    kind: "side",
    act: 3,
    giver: "morgra",
    requires: ["g1"],
    needsChoice: "free",
    hidden: true,
    minLevel: 20,
    summary: "Morgra will das Moor endg\xFCltig vom Welken befreien.",
    intro: [{ s: "morgra", t: "Das Moor war meine Heimat, lange bevor es mein Gef\xE4ngnis wurde. Erledige zwanzig seiner verdorbenen Kreaturen \u2013 dann kann es heilen." }],
    stages: [{ text: "Besiege Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 20 } }],
    outro: [{ s: "morgra", t: "H\xF6rst du das? Keine Seufzer mehr. Nur Fr\xF6sche. Danke, W\xE4chter. Ehrlich." }],
    rewards: { xp: 3e3, gold: 200, rep: 200, items: [{ id: "talisman_waechter", n: 1 }] }
  }
];
var ALL_QUESTS = [...MAIN, ...SIDE];
function questById(id) {
  return ALL_QUESTS.find((q) => q.id === id);
}
var BOUNTIES = [
  { id: "bt_moos", text: "Erl\xF6se 12 Mooslinge", obj: { type: "kill", mobs: ["cdw:moosling"], count: 12 }, minAct: 0, mult: 0.8 },
  { id: "bt_wolf", text: "Jage 8 Dornenw\xF6lfe", obj: { type: "kill", mobs: ["cdw:dornenwolf"], count: 8 }, minAct: 1, mult: 1 },
  { id: "bt_setzling", text: "F\xE4lle 4 Rindenschreck-Setzlinge", obj: { type: "kill", mobs: ["cdw:rindenschreck_setzling"], count: 4 }, minAct: 1, mult: 1.2 },
  { id: "bt_goblin", text: "Vertreibe 10 Goblins", obj: { type: "kill", fam: "cdw_goblin", count: 10 }, minAct: 0, mult: 1 },
  { id: "bt_geist", text: "Banne 5 F\xE4ulnisgeister", obj: { type: "kill", mobs: ["cdw:faeulnisgeist"], count: 5 }, minAct: 0, mult: 1.1 },
  { id: "bt_blight", text: "Besiege 20 Kreaturen des Welkens", obj: { type: "kill", fam: "cdw_blight", count: 20 }, minAct: 0, mult: 1.3 },
  { id: "bt_undead", text: "Besiege 15 Untote", obj: { type: "kill", fam: "undead", count: 15 }, minAct: 0, mult: 1 },
  { id: "bt_creeper", text: "Entsch\xE4rfe 6 Creeper", obj: { type: "kill", mobs: ["minecraft:creeper"], count: 6 }, minAct: 0, mult: 0.9 },
  { id: "bt_spinne", text: "Erlege 10 Spinnen", obj: { type: "kill", fam: "arthropod", count: 10 }, minAct: 0, mult: 0.9 },
  { id: "bt_moor", text: "Besiege 10 Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 10 }, minAct: 2, mult: 1.1 },
  { id: "bt_kroete", text: "Erlege 6 Schlammkr\xF6ten", obj: { type: "kill", mobs: ["cdw:schlammkroete"], count: 6 }, minAct: 2, mult: 1 },
  { id: "bt_wueste", text: "Besiege 10 Kreaturen des Glutsands", obj: { type: "kill", fam: "cdw_desert", count: 10 }, minAct: 3, mult: 1.1 },
  { id: "bt_skorpion", text: "Erlege 6 Glutskorpione", obj: { type: "kill", mobs: ["cdw:glutskorpion"], count: 6 }, minAct: 3, mult: 1 },
  { id: "bt_frost", text: "Besiege 10 Kreaturen der Frostkrone", obj: { type: "kill", fam: "cdw_frost", count: 10 }, minAct: 4, mult: 1.1 },
  { id: "bt_troll", text: "F\xE4lle 2 Frosttrolle", obj: { type: "kill", mobs: ["cdw:frosttroll"], count: 2 }, minAct: 4, mult: 1.4 },
  { id: "bt_tiefe", text: "Besiege 10 Kreaturen der Tiefe", obj: { type: "kill", fam: "cdw_deep", count: 10 }, minAct: 5, mult: 1.2 },
  { id: "bt_golem", text: "Zerschlage 2 Wurzelgolems", obj: { type: "kill", mobs: ["cdw:wurzelgolem"], count: 2 }, minAct: 5, mult: 1.5 },
  { id: "bt_elite", text: "Besiege ein Elite-Monster", obj: { type: "flag", flag: "elite_kill" }, minAct: 1, mult: 1.6 },
  { id: "bt_essenz", text: "Liefere 8 F\xE4ulnisessenzen", obj: { type: "collect", item: "cdw:faeulnisessenz", count: 8, consume: true }, minAct: 0, mult: 1 },
  { id: "bt_fang", text: "Liefere 6 Dornenf\xE4nge", obj: { type: "collect", item: "cdw:dornenfang", count: 6, consume: true }, minAct: 1, mult: 1 },
  { id: "bt_schleim", text: "Liefere 6 Moorschleim", obj: { type: "collect", item: "cdw:moorschleim", count: 6, consume: true }, minAct: 2, mult: 1 },
  { id: "bt_stachel", text: "Liefere 5 Skorpionstachel", obj: { type: "collect", item: "cdw:skorpionstachel", count: 5, consume: true }, minAct: 3, mult: 1.1 },
  { id: "bt_splitter", text: "Liefere 5 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 5, consume: true }, minAct: 4, mult: 1.1 },
  { id: "bt_kristall", text: "Liefere 4 Schattenkristalle", obj: { type: "collect", item: "cdw:schattenkristall", count: 4, consume: true }, minAct: 5, mult: 1.2 },
  { id: "bt_eisen", text: "Liefere 12 Eisenbarren", obj: { type: "collect", item: "minecraft:iron_ingot", count: 12, consume: true }, minAct: 0, mult: 1 },
  { id: "bt_knochen", text: "Liefere 16 Knochen", obj: { type: "collect", item: "minecraft:bone", count: 16, consume: true }, minAct: 0, mult: 0.8 },
  { id: "bt_dungeon", text: "Besiege einen Dungeon-W\xE4chter (heroisch)", obj: { type: "flag", flag: "heroic_boss" }, minAct: 7, mult: 3 },
  { id: "bt_lager", text: "R\xE4ume ein Goblin-Lager", obj: { type: "flag", flag: "camp_cleared" }, minAct: 0, mult: 1.5 },
  { id: "bt_riss", text: "Schlie\xDFe einen F\xE4ulnis-Riss", obj: { type: "flag", flag: "rift_closed" }, minAct: 1, mult: 1.5 },
  { id: "bt_nether", text: "Besiege 10 Kreaturen im Nether", obj: { type: "kill", mobs: ["minecraft:blaze", "minecraft:wither_skeleton", "minecraft:ghast", "minecraft:magma_cube", "minecraft:piglin_brute", "minecraft:hoglin", "minecraft:zombie_pigman"], count: 10 }, minAct: 3, mult: 1.3 }
];

// src/systems/ui.ts
import { system as system6 } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";
var autotest = { on: false };
async function showWithRetry(p, show, tries = 12) {
  for (let i = 0; i < tries; i++) {
    let res;
    try {
      res = await show();
    } catch {
      return void 0;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await system6.waitTicks(8);
      continue;
    }
    return res;
  }
  return void 0;
}
async function menu(p, titleText, body, buttons, opts = {}) {
  if (autotest.on) return void 0;
  const f = new ActionFormData().title(titleText);
  if (body) f.body(body);
  for (const b2 of buttons) f.button(b2.text, b2.icon);
  if (opts.back) f.button("\xA78\xAB Zur\xFCck", "textures/cdw/ui/back");
  const res = await showWithRetry(p, () => f.show(p));
  if (!res || res.canceled || res.selection === void 0) return void 0;
  if (opts.back && res.selection === buttons.length) {
    await opts.back();
    return void 0;
  }
  const b = buttons[res.selection];
  if (b?.action) await b.action();
  return res.selection;
}
async function confirm(p, titleText, body, yes = "\xA7aJa", no = "\xA7cNein") {
  if (autotest.on) return true;
  const f = new MessageFormData().title(titleText).body(body).button1(no).button2(yes);
  const res = await showWithRetry(p, () => f.show(p));
  return !!res && !res.canceled && res.selection === 1;
}
async function modal(p, form) {
  if (autotest.on) return void 0;
  const res = await showWithRetry(p, () => form.show(p));
  if (!res || res.canceled) return void 0;
  return res;
}
function speakerName(s2) {
  if (SPEAKERS[s2]) return SPEAKERS[s2];
  const n = npcById(s2);
  return n ? `\xA7a${n.name}` : s2;
}
async function dialog(p, lines, finalButton = "\xA7aVerstanden") {
  if (autotest.on) return true;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const last = i === lines.length - 1;
    const f = new ActionFormData().title(speakerName(l.s)).body(`\xA7f${l.t}
 `);
    f.button(last ? finalButton : "\xA7fWeiter  \u25B6", last ? "textures/cdw/ui/check" : "textures/cdw/ui/next");
    const res = await showWithRetry(p, () => f.show(p));
    if (!res) return false;
    if (res.canceled) {
      for (let j = i; j < lines.length; j++) p.sendMessage(`${speakerName(lines[j].s)}\xA7r\xA77: \xA7f${lines[j].t}`);
      return true;
    }
  }
  return true;
}
async function choice(p, l, options) {
  if (autotest.on) return 0;
  const f = new ActionFormData().title(speakerName(l.s)).body(`\xA7f${l.t}
 `);
  for (const o of options) f.button(o);
  const res = await showWithRetry(p, () => f.show(p));
  if (!res || res.canceled) return void 0;
  return res.selection;
}

// src/systems/quests.ts
var hooks = {
  action: () => void 0,
  resolveTarget: () => void 0,
  onMainChanged: () => void 0
};
function countItem(p, typeId) {
  const inv = p.getComponent("minecraft:inventory")?.container;
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (it?.typeId === typeId) n += it.amount;
  }
  return n;
}
function takeItem(p, typeId, count) {
  const inv = p.getComponent("minecraft:inventory")?.container;
  if (!inv || countItem(p, typeId) < count) return false;
  let left = count;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const it = inv.getItem(i);
    if (it?.typeId !== typeId) continue;
    if (it.amount <= left) {
      left -= it.amount;
      inv.setItem(i, void 0);
    } else {
      it.amount -= left;
      left = 0;
      inv.setItem(i, it);
    }
  }
  return true;
}
function giveItem(p, item) {
  const inv = p.getComponent("minecraft:inventory")?.container;
  const rest = inv?.addItem(item);
  if (rest) p.dimension.spawnItem(rest, p.location);
}
function matchesKill(obj, typeId, families) {
  if (obj.type !== "kill") return false;
  if (obj.mobs && obj.mobs.includes(typeId)) return true;
  if (obj.fam && families.includes(obj.fam)) return true;
  return false;
}
function objCount(obj) {
  switch (obj.type) {
    case "kill":
    case "collect":
      return obj.count;
    case "flag":
      return obj.count ?? 1;
    default:
      return 1;
  }
}
function mainQuest() {
  return MAIN[wdata().main.idx];
}
function mainStage() {
  const q = mainQuest();
  const s2 = wdata().main.s;
  return q && s2 >= 0 ? q.stages[s2] : void 0;
}
function mainTracker() {
  const q = mainQuest();
  if (!q) return void 0;
  const m = wdata().main;
  if (m.s < 0 && q.giver) return { text: `Sprich mit ${npcName(q.giver)}`, target: { k: "npc", id: q.giver }, quest: q };
  if (m.s >= q.stages.length) return { text: `Kehre zu ${npcName(q.turnIn ?? "sylva")} zur\xFCck`, target: { k: "npc", id: q.turnIn ?? "sylva" }, quest: q };
  const st = q.stages[m.s];
  const n = objCount(st.obj);
  const prog = n > 1 ? ` \xA77(${m.c}/${n})` : "";
  return { text: st.text + prog, target: st.target, quest: q };
}
function npcName(id) {
  const names = { sylva: "Sylva", kael: "Kael", brom: "Brom", mira: "Mira", oswin: "Oswin", fennick: "Fennick", morgra: "Morgra" };
  return names[id] ?? id;
}
function startStage(q, s2, trigger) {
  const st = q.stages[s2];
  if (!st) return;
  for (const a of st.start ?? []) hooks.action(a, trigger);
  for (const p of players()) {
    title(p, "\xA76Neues Ziel", `\xA7f${st.text}`, 5, 50, 10);
    sound(p, "random.orb", void 0, 1.2, 0.6);
  }
  if (st.lines?.length) {
    const viewers = trigger ? [trigger] : players();
    for (const p of viewers) void dialog(p, st.lines);
    for (const p of players()) if (!viewers.includes(p)) msg(p, `\xA77(Dialog: siehe Abenteuerbuch \u2192 Quests)`);
  }
  hooks.onMainChanged();
}
function advanceMain(trigger) {
  const w = wdata();
  const q = mainQuest();
  if (!q) return;
  w.main.s++;
  w.main.c = 0;
  markWorldDirty();
  if (w.main.s < q.stages.length) {
    startStage(q, w.main.s, trigger);
    system7.runTimeout(() => checkMainPassive(), 5);
    return;
  }
  if (q.turnIn) {
    for (const p of players()) {
      title(p, "\xA7aZiel erreicht", `\xA7fKehre zu ${npcName(q.turnIn)} zur\xFCck`, 5, 50, 10);
      sound(p, "random.levelup", void 0, 1.6, 0.5);
    }
    hooks.onMainChanged();
    return;
  }
  void completeMain(trigger);
}
async function completeMain(trigger) {
  const w = wdata();
  const q = mainQuest();
  if (!q) return;
  const idx = w.main.idx;
  if (q.outro.length) {
    const viewers = trigger ? [trigger] : players();
    for (const p of players()) if (!viewers.includes(p)) msg(p, `\xA77${trigger?.name ?? "Jemand"} hat \u201E${q.title}\u201C abgeschlossen. (Dialog: Abenteuerbuch \u2192 Chronik)`);
    await Promise.all(viewers.map((p) => dialog(p, q.outro)));
  }
  for (const a of q.done ?? []) hooks.action(a, trigger);
  w.main.idx = idx + 1;
  w.main.s = -1;
  w.main.c = 0;
  markWorldDirty();
  for (const p of players()) grantPendingMain(p);
  const next = mainQuest();
  if (next) {
    if (!next.giver) {
      w.main.s = 0;
      markWorldDirty();
      for (const p of players()) {
        if (next.intro.length) void dialog(p, next.intro);
      }
      startStage(next, 0, trigger);
    } else {
      for (const p of players()) msg(p, `\xA76\u2726 Neue Hauptquest: \xA7f${next.title} \xA77\u2013 sprich mit ${npcName(next.giver)}.`);
      hooks.onMainChanged();
    }
  } else hooks.onMainChanged();
}
function grantPendingMain(p) {
  const d = pdata(p);
  const done = wdata().main.idx - 1;
  while (d.mainRewarded < done) {
    d.mainRewarded++;
    const q = MAIN[d.mainRewarded];
    if (!q) continue;
    msg(p, `\xA76\u2726 Quest abgeschlossen: \xA7f${q.title}`);
    title(p, "\xA76Quest abgeschlossen", `\xA7f${q.title}`, 5, 50, 10);
    giveRewards(p, q.rewards);
  }
  markDirty(p);
}
function giveRewards(p, r) {
  if (r.xp) addXp(p, r.xp, "(Quest)");
  if (r.gold) addGold(p, r.gold, "(Quest)", false);
  if (r.rep) addRep(p, r.rep);
  for (const it of r.items ?? []) {
    const id = it.id.includes(":") ? it.id : `cdw:${it.id}`;
    try {
      giveItem(p, new ItemStack3(id, it.n));
    } catch {
    }
  }
  if (r.gear) {
    const typeId = randomGearFor(level(p), pdata(p).cls, r.gear.armor ? 1 : 0);
    try {
      const item = createGear(typeId, r.gear.rarity);
      giveItem(p, item);
      msg(p, `\xA7a+ ${item.nameTag ?? typeId}`);
    } catch {
    }
  }
  if (r.title) {
    const d = pdata(p);
    if (!d.ach.includes(`title:${r.title}`)) d.ach.push(`title:${r.title}`);
    msg(p, `\xA7d\u2726 Neuer Titel freigeschaltet: \xA7f${r.title} \xA77(Abenteuerbuch \u2192 Erfolge)`);
    markDirty(p);
  }
  sound(p, "random.levelup", void 0, 1.3, 0.7);
}
async function acceptMain(p) {
  const q = mainQuest();
  if (!q || wdata().main.s >= 0) return;
  await dialog(p, q.intro, "\xA7a\xBB Auftrag annehmen");
  if (wdata().main.idx !== MAIN.indexOf(q) || wdata().main.s >= 0) return;
  wdata().main.s = 0;
  wdata().main.c = 0;
  markWorldDirty();
  for (const o of players()) if (o.id !== p.id) msg(o, `\xA76\u2726 ${p.name} hat die Hauptquest \u201E${q.title}\u201C angenommen.`);
  startStage(q, 0, p);
  system7.runTimeout(() => checkMainPassive(), 5);
}
async function turnInMain(p) {
  const q = mainQuest();
  if (!q || wdata().main.s < q.stages.length) return;
  await completeMain(p);
}
function sideAvailable(p, npc) {
  const d = pdata(p);
  const lvl = level(p);
  const stage = wdata().hub?.stage ?? 0;
  return SIDE.filter((q) => {
    if (q.giver !== npc) return false;
    if (d.done.includes(q.id) || d.quests[q.id]) return false;
    if (q.minLevel && lvl < q.minLevel) return false;
    if (q.minStage !== void 0 && stage < q.minStage) return false;
    if (q.requires && !q.requires.every((r) => d.done.includes(r))) return false;
    if (q.needsChoice && wdata().morgra !== q.needsChoice) return false;
    return true;
  });
}
function sideActive(p) {
  return Object.keys(pdata(p).quests).map((id) => questById(id)).filter((q) => !!q);
}
function sideTracker(p, q) {
  const qp = pdata(p).quests[q.id];
  if (!qp) return { text: q.title };
  if (qp.s >= q.stages.length) return { text: `Kehre zu ${npcName(q.turnIn ?? q.giver ?? "sylva")} zur\xFCck`, target: { k: "npc", id: q.turnIn ?? q.giver ?? "sylva" } };
  const st = q.stages[qp.s];
  const n = objCount(st.obj);
  return { text: st.text + (n > 1 ? ` \xA77(${qp.c}/${n})` : ""), target: st.target };
}
async function acceptSide(p, q) {
  await dialog(p, q.intro, "\xA7a\xBB Auftrag annehmen");
  const d = pdata(p);
  if (d.quests[q.id] || d.done.includes(q.id)) return;
  d.quests[q.id] = { s: 0, c: 0, t: Date.now() };
  if (!d.tracked) d.tracked = q.id;
  markDirty(p);
  title(p, "\xA7eNeue Nebenquest", `\xA7f${q.title}`, 5, 40, 10);
  sound(p, "random.orb", void 0, 1, 0.8);
  for (const a of q.stages[0].start ?? []) hooks.action(a, p);
  checkSidePassive(p);
}
function advanceSide(p, q) {
  const d = pdata(p);
  const qp = d.quests[q.id];
  if (!qp) return;
  qp.s++;
  qp.c = 0;
  markDirty(p);
  if (qp.s < q.stages.length) {
    title(p, "\xA7eNeues Ziel", `\xA7f${q.stages[qp.s].text}`, 5, 40, 10);
    for (const a of q.stages[qp.s].start ?? []) hooks.action(a, p);
    checkSidePassive(p);
    return;
  }
  title(p, "\xA7aZiel erreicht", `\xA7fKehre zu ${npcName(q.turnIn ?? q.giver ?? "sylva")} zur\xFCck`, 5, 40, 10);
  sound(p, "random.levelup", void 0, 1.6, 0.5);
}
async function turnInSide(p, q) {
  const d = pdata(p);
  const qp = d.quests[q.id];
  if (!qp || qp.s < q.stages.length) return;
  await dialog(p, q.outro, "\xA7a\xBB Belohnung annehmen");
  if (!d.quests[q.id]) return;
  delete d.quests[q.id];
  d.done.push(q.id);
  if (d.tracked === q.id) d.tracked = void 0;
  markDirty(p);
  title(p, "\xA76Nebenquest abgeschlossen", `\xA7f${q.title}`, 5, 50, 10);
  giveRewards(p, q.rewards);
  for (const a of q.done ?? []) hooks.action(a, p);
}
function abandonSide(p, id) {
  const d = pdata(p);
  delete d.quests[id];
  if (d.tracked === id) d.tracked = void 0;
  markDirty(p);
}
function actReached() {
  const idx = wdata().main.idx;
  if (idx >= MAIN.length) return 7;
  return MAIN[Math.max(0, idx - 1)]?.act ?? 0;
}
function refreshBounties(p) {
  const d = pdata(p);
  const day = dayNumber();
  if (d.bounty.day === day && d.bounty.list.length) return;
  const act = actReached();
  const pool = BOUNTIES.filter((b) => b.minAct <= act);
  const rnd = seeded(hashStr(`${day}:${world6.seed}`));
  const chosen = [];
  const copy = [...pool];
  while (chosen.length < 3 && copy.length) chosen.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  d.bounty.day = day;
  d.bounty.list = chosen.map((b) => ({ id: b.id, c: 0, done: false }));
  markDirty(p);
}
function bountyReward(p, b) {
  const lvl = level(p);
  return { xp: Math.round((120 + lvl * lvl * 6) * b.mult), gold: Math.round((25 + lvl * 4) * b.mult) };
}
function completeBounty(p, b) {
  const r = bountyReward(p, b);
  const d = pdata(p);
  d.bounty.total++;
  d.stats.bounties = (d.stats.bounties ?? 0) + 1;
  markDirty(p);
  title(p, "\xA76Kopfgeld erf\xFCllt!", `\xA7f${b.text}`, 5, 50, 10);
  addXp(p, r.xp, "(Kopfgeld)");
  addGold(p, r.gold, "(Kopfgeld)", false);
  addRep(p, 40);
  if (Math.random() < 0.35) {
    try {
      giveItem(p, createGear(randomGearFor(level(p), d.cls), 1));
    } catch {
    }
  }
}
function onKill2(p, typeId, families, elite) {
  const q = mainQuest();
  const w = wdata();
  if (q && w.main.s >= 0 && w.main.s < q.stages.length) {
    const st = q.stages[w.main.s];
    if (matchesKill(st.obj, typeId, families)) {
      w.main.c++;
      markWorldDirty();
      if (w.main.c >= objCount(st.obj)) advanceMain(p);
      else hooks.onMainChanged();
    }
  }
  const d = pdata(p);
  for (const [id, qp] of Object.entries(d.quests)) {
    const sq = questById(id);
    const st = sq?.stages[qp.s];
    if (!sq || !st) continue;
    if (matchesKill(st.obj, typeId, families)) {
      qp.c++;
      markDirty(p);
      if (qp.c >= objCount(st.obj)) advanceSide(p, sq);
    }
  }
  for (const b of d.bounty.list) {
    if (b.done) continue;
    const t = BOUNTIES.find((x) => x.id === b.id);
    if (t && matchesKill(t.obj, typeId, families)) {
      b.c++;
      markDirty(p);
      if (b.c >= objCount(t.obj)) {
        b.done = true;
        completeBounty(p, t);
      }
    }
  }
  if (elite) progressFlag("elite_kill", p);
}
function progressFlag(key, p, amount = 1) {
  const q = mainQuest();
  const w = wdata();
  if (q && w.main.s >= 0 && w.main.s < q.stages.length) {
    const st = q.stages[w.main.s];
    if (st.obj.type === "flag" && st.obj.flag === key) {
      w.main.c += amount;
      markWorldDirty();
      if (w.main.c >= objCount(st.obj)) advanceMain(p);
      else hooks.onMainChanged();
    }
  }
  const targets = p ? [p] : players();
  for (const pl of targets) {
    const d = pdata(pl);
    for (const [id, qp] of Object.entries(d.quests)) {
      const sq = questById(id);
      const st = sq?.stages[qp.s];
      if (sq && st && st.obj.type === "flag" && st.obj.flag === key) {
        qp.c += amount;
        markDirty(pl);
        if (qp.c >= objCount(st.obj)) advanceSide(pl, sq);
      }
    }
    for (const b of d.bounty.list) {
      if (b.done) continue;
      const t = BOUNTIES.find((x) => x.id === b.id);
      if (t && t.obj.type === "flag" && t.obj.flag === key) {
        b.c += amount;
        markDirty(pl);
        if (b.c >= objCount(t.obj)) {
          b.done = true;
          completeBounty(pl, t);
        }
      }
    }
  }
}
async function talkTo(p, npc) {
  const q = mainQuest();
  const w = wdata();
  if (q) {
    if (w.main.s < 0 && q.giver === npc) {
      await acceptMain(p);
      return true;
    }
    if (w.main.s >= q.stages.length && (q.turnIn ?? "sylva") === npc) {
      await turnInMain(p);
      return true;
    }
    const st = mainStage();
    if (st && st.obj.type === "talk" && st.obj.npc === npc) {
      advanceMain(p);
      return true;
    }
  }
  const d = pdata(p);
  for (const [id, qp] of Object.entries(d.quests)) {
    const sq = questById(id);
    if (!sq) continue;
    if (qp.s >= sq.stages.length && (sq.turnIn ?? sq.giver) === npc) {
      await turnInSide(p, sq);
      return true;
    }
    const st = sq.stages[qp.s];
    if (st?.obj.type === "talk" && st.obj.npc === npc) {
      advanceSide(p, sq);
      return true;
    }
  }
  return false;
}
function checkMainPassive() {
  const q = mainQuest();
  const w = wdata();
  if (!q || w.main.s < 0 || w.main.s >= q.stages.length) return;
  const st = q.stages[w.main.s];
  const obj = st.obj;
  if (obj.type === "reach") {
    const loc = hooks.resolveTarget(obj.target);
    if (!loc) return;
    for (const p of players()) {
      if ((loc.d ?? "minecraft:overworld") !== p.dimension.id) continue;
      if (V.dist2d(p.location, loc) <= obj.radius && Math.abs(p.location.y - loc.y) < 40) {
        advanceMain(p);
        return;
      }
    }
  } else if (obj.type === "collect") {
    for (const p of players()) {
      const n = countItem(p, obj.item);
      if (n !== w.main.c) {
        w.main.c = Math.min(n, obj.count);
        markWorldDirty();
        hooks.onMainChanged();
      }
      if (n >= obj.count) {
        if (obj.consume) takeItem(p, obj.item, obj.count);
        advanceMain(p);
        return;
      }
    }
  } else if (obj.type === "level") {
    for (const p of players()) {
      if (level(p) >= obj.level) {
        advanceMain(p);
        return;
      }
    }
  }
}
function checkSidePassive(p) {
  const d = pdata(p);
  for (const [id, qp] of Object.entries(d.quests)) {
    const sq = questById(id);
    const st = sq?.stages[qp.s];
    if (!sq || !st) continue;
    const obj = st.obj;
    if (obj.type === "collect") {
      const n = countItem(p, obj.item);
      if (n !== qp.c) {
        qp.c = Math.min(n, obj.count);
        markDirty(p);
      }
      if (n >= obj.count) {
        if (obj.consume) takeItem(p, obj.item, obj.count);
        advanceSide(p, sq);
      }
    } else if (obj.type === "level" && level(p) >= obj.level) advanceSide(p, sq);
    else if (obj.type === "reach") {
      const loc = hooks.resolveTarget(obj.target);
      if (loc && V.dist2d(p.location, loc) <= obj.radius) advanceSide(p, sq);
    }
  }
  for (const b of d.bounty.list) {
    if (b.done) continue;
    const t = BOUNTIES.find((x) => x.id === b.id);
    if (t?.obj.type === "collect") {
      const n = countItem(p, t.obj.item);
      b.c = Math.min(n, t.obj.count);
    }
  }
}
function turnInBountyItems(p) {
  const d = pdata(p);
  let n = 0;
  for (const b of d.bounty.list) {
    if (b.done) continue;
    const t = BOUNTIES.find((x) => x.id === b.id);
    if (t?.obj.type === "collect" && countItem(p, t.obj.item) >= t.obj.count) {
      takeItem(p, t.obj.item, t.obj.count);
      b.done = true;
      b.c = t.obj.count;
      completeBounty(p, t);
      n++;
    }
  }
  markDirty(p);
  return n;
}
function questDrops(p, typeId, loc) {
  const st = mainStage();
  const tryDrop = (stage) => {
    if (!stage?.drop || !stage.drop.mobs.includes(typeId)) return;
    if (stage.obj.type === "collect" && countItem(p, stage.obj.item) >= stage.obj.count) return;
    if (Math.random() < stage.drop.chance) {
      try {
        p.dimension.spawnItem(new ItemStack3(`cdw:${stage.drop.item}`, 1), loc);
      } catch {
      }
    }
  };
  tryDrop(st);
  const d = pdata(p);
  for (const [id, qp] of Object.entries(d.quests)) tryDrop(questById(id)?.stages[qp.s]);
}
function initQuests() {
  on("kill", (ev) => {
    if (!isValid(ev.player)) return;
    onKill2(ev.player, ev.typeId, ev.families, !!ev.info?.elite);
    questDrops(ev.player, ev.typeId, ev.location);
  });
  on("flag", (ev) => progressFlag(ev.key, ev.player));
  system7.runInterval(() => {
    checkMainPassive();
    for (const p of players()) {
      checkSidePassive(p);
      refreshBounties(p);
    }
  }, 30);
}
function setTracked(p, id) {
  pdata(p).tracked = id;
  markDirty(p);
  hooks.onMainChanged();
}
function questLog(p) {
  const lines = [];
  const mt = mainTracker();
  if (mt?.quest) lines.push(`\xA76\u2605 ${mt.quest.title}
\xA77  ${mt.text}`);
  for (const q of sideActive(p)) lines.push(`\xA7e\u2022 ${q.title}
\xA77  ${sideTracker(p, q).text}`);
  return lines.join("\n") || "\xA77Keine aktiven Quests.";
}

// src/systems/hud.ts
var waypoints = /* @__PURE__ */ new Map();
function resolve(t) {
  if (!t) return void 0;
  try {
    return hooks.resolveTarget(t);
  } catch {
    return void 0;
  }
}
function setWp(p, slot, loc, tex, color) {
  let m = waypoints.get(p.id);
  if (!m) waypoints.set(p.id, m = {});
  const cur = m[slot];
  if (!loc) {
    if (cur) {
      try {
        p.locatorBar.removeWaypoint(cur.wp);
      } catch {
      }
      m[slot] = void 0;
    }
    return;
  }
  const dim = world7.getDimension(loc.d ?? "minecraft:overworld");
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
  }
}
function currentTarget(p) {
  const d = pdata(p);
  if (d.tracked && d.tracked !== "main") {
    const q = questById(d.tracked);
    if (q && d.quests[q.id]) {
      const t = sideTracker(p, q);
      return { text: `\xA7e${t.text}`, loc: resolve(t.target), main: false };
    }
  }
  const mt = mainTracker();
  if (mt) return { text: `\xA76${mt.text}`, loc: resolve(mt.target), main: true };
  const side = sideActive(p)[0];
  if (side) {
    const t = sideTracker(p, side);
    return { text: `\xA7e${t.text}`, loc: resolve(t.target), main: false };
  }
  return void 0;
}
function updateWaypoints(p) {
  const mt = mainTracker();
  setWp(p, "main", mt ? resolve(mt.target) : void 0, WaypointTexture.SmallStar, { red: 1, green: 0.78, blue: 0.2 });
  const d = pdata(p);
  let side;
  const sq = d.tracked && d.tracked !== "main" ? questById(d.tracked) : sideActive(p)[0];
  if (sq && d.quests[sq.id]) side = resolve(sideTracker(p, sq).target);
  setWp(p, "side", side, WaypointTexture.Circle, { red: 0.3, green: 0.7, blue: 1 });
  setWp(p, "hub", resolve({ k: "hub" }), WaypointTexture.SmallSquare, { red: 0.35, green: 1, blue: 0.45 });
}
var tick = 0;
function hudTick() {
  tick++;
  const now2 = system8.currentTick;
  for (const p of players()) {
    try {
      const d = pdata(p);
      if (tick % 2 === 0) {
        const s3 = stats(p, now2);
        setMana(p, getMana(p) + s3.manaRegen);
        if (s3.regen > 0) healRpg(p, s3.maxHp * s3.regen);
      }
      if (tick % 6 === 0) updateWaypoints(p);
      if (!d.cls && !d.settings.hud) continue;
      if (!d.settings.hud) continue;
      const s2 = stats(p, now2);
      const hp = hpInfo(p);
      const mana2 = getMana(p);
      const xp = xpProgress(p);
      const sh = getShield(p);
      let line1 = `\xA7c\u2764 ${fmt(hp.cur)}/${fmt(hp.max)}${sh > 0 ? ` \xA75(+${fmt(sh)})` : ""}  \xA79\u2726 ${fmt(mana2)}/${fmt(s2.maxMana)}  \xA7eLv ${xp.level} \xA77${bar(xp.cur / xp.need, 8)} ${Math.floor(xp.cur / xp.need * 100)}%`;
      if (!d.cls) line1 = `\xA7c\u2764 ${fmt(hp.cur)}/${fmt(hp.max)}  \xA7eLv ${xp.level}`;
      const lines = [line1];
      const tgt = currentTarget(p);
      if (tgt) {
        let nav = "";
        if (tgt.loc && (tgt.loc.d ?? "minecraft:overworld") === p.dimension.id) {
          const dist = V.dist2d(p.location, tgt.loc);
          const dy = tgt.loc.y - p.location.y;
          nav = dist > 4 ? ` \xA77\xB7 \xA7f${fmt(dist)} m ${arrowTo(p, tgt.loc)}${Math.abs(dy) > 8 ? dy > 0 ? " \xA7a\u25B2" : " \xA7c\u25BC" : ""}` : " \xA7a\u2713";
          if (d.settings.wisp && dist > 6 && tick % 2 === 0) wisp(p, tgt.loc);
        } else if (tgt.loc) nav = " \xA77\xB7 \xA75andere Dimension";
        lines.push(`\u27A4 ${tgt.text}${nav}`);
      }
      const ti = targetInfo.get(p.id);
      if (ti && now2 - ti.t < 70) {
        const e = world7.getEntity(ti.id);
        if (e && isValid(e)) {
          const hpm = mobHp(e);
          const mi = getInfo(e);
          if (hpm) lines.push(`${mi?.elite ? "\xA76\u2605 " : "\xA7f"}${mobName(e)} \xA77Lv ${mi?.lvl ?? 1}  \xA7c${bar(hpm.cur / Math.max(1, hpm.max), 10, "\u2588", "\u2591")} \xA7f${fmt(hpm.cur)}`);
        }
      }
      p.onScreenDisplay.setActionBar(lines.join("\n"));
    } catch {
    }
  }
}
function wisp(p, target) {
  const dir = V.flat(V.sub(target, p.location));
  const head = p.getHeadLocation();
  for (const step of [2.2, 3.4, 4.6]) {
    const pos = V.add(head, { x: dir.x * step, y: -0.4 + Math.sin((system8.currentTick + step * 10) / 6) * 0.15, z: dir.z * step });
    try {
      p.spawnParticle("cdw:wisp", pos);
    } catch {
    }
  }
}
function refreshHud() {
  for (const p of players()) updateWaypoints(p);
}
function forgetHud(id) {
  waypoints.delete(id);
}
function initHud() {
  system8.runInterval(hudTick, 10);
}

// src/systems/achievements.ts
import { system as system9 } from "@minecraft/server";
var s = (p, k) => pdata(p).stats[k] ?? 0;
var boss = (p, id) => (pdata(p).bossKills[id] ?? 0) > 0;
var mainAt = (n) => wdata().main.idx >= n;
var ACHIEVEMENTS = [
  { id: "erster", name: "Erste Schritte", desc: "Besiege dein erstes Monster.", check: (p) => s(p, "kills") >= 1 },
  { id: "k100", name: "Monsterj\xE4ger", desc: "Besiege 100 Monster.", check: (p) => s(p, "kills") >= 100 },
  { id: "k1000", name: "Gei\xDFel des Welkens", desc: "Besiege 1.000 Monster.", title: "Gei\xDFel des Welkens", check: (p) => s(p, "kills") >= 1e3 },
  { id: "k5000", name: "Unaufhaltsam", desc: "Besiege 5.000 Monster.", title: "Der Unaufhaltsame", check: (p) => s(p, "kills") >= 5e3 },
  { id: "elite10", name: "Elitej\xE4ger", desc: "Besiege 10 Elite-Monster.", title: "Elitej\xE4ger", check: (p) => s(p, "eliteKills") >= 10 },
  { id: "lv10", name: "Gefestigt", desc: "Erreiche Stufe 10.", check: (p) => level(p) >= 10 },
  { id: "lv20", name: "Erfahren", desc: "Erreiche Stufe 20.", check: (p) => level(p) >= 20 },
  { id: "lv30", name: "Veteran", desc: "Erreiche Stufe 30.", title: "Veteran", check: (p) => level(p) >= 30 },
  { id: "lv40", name: "Meister", desc: "Erreiche Stufe 40.", check: (p) => level(p) >= 40 },
  { id: "lv50", name: "Legende", desc: "Erreiche Stufe 50.", title: "Legende", check: (p) => level(p) >= 50 },
  { id: "hain", name: "G\xE4rtner", desc: "Pflanze den Samen des Weltenbaums.", check: () => !!wdata().hub },
  { id: "b1", name: "Holzf\xE4ller", desc: "Besiege den Rindenschreck.", check: (p) => boss(p, "boss_rindenschreck") },
  { id: "b2", name: "Moorl\xE4ufer", desc: "Besiege den Moorschlund.", check: (p) => boss(p, "boss_moorschlund") },
  { id: "b3", name: "Glutbrecher", desc: "Besiege die Glutk\xF6nigin.", check: (p) => boss(p, "boss_glutkoenigin") },
  { id: "b4", name: "Frostbezwinger", desc: "Besiege Hrimgar.", title: "Frostbezwinger", check: (p) => boss(p, "boss_hrimgar") },
  { id: "b5", name: "Kristallbrecher", desc: "Besiege die Kristallmutter.", check: (p) => boss(p, "boss_kristallmutter") },
  { id: "b6", name: "Ende des Welkens", desc: "Besiege die Welkenbestie.", title: "Bezwinger des Welkens", check: (p) => boss(p, "boss_welkenbestie") },
  { id: "wyrm", name: "Drachenz\xE4hmer", desc: "Besiege den Uralten Wurzelwyrm.", title: "Wyrmt\xF6ter", check: (p) => boss(p, "boss_wurzelwyrm") },
  { id: "herzen", name: "Herzschlag", desc: "Reinige alle f\xFCnf Wurzelherzen.", check: () => mainAt(23) },
  { id: "story", name: "Ylvaris erbl\xFCht", desc: "Schlie\xDFe die Hauptgeschichte ab.", title: "W\xE4chter des Weltenbaums", check: () => mainAt(26) },
  { id: "kopf10", name: "Kopfgeldj\xE4ger", desc: "Erf\xFClle 10 Kopfgelder.", check: (p) => s(p, "bounties") >= 10 },
  { id: "kopf50", name: "Gesucht: Du", desc: "Erf\xFClle 50 Kopfgelder.", title: "Kopfgeldj\xE4ger", check: (p) => s(p, "bounties") >= 50 },
  { id: "gold", name: "Goldesel", desc: "Verdiene insgesamt 10.000 Gold.", title: "Der Wohlhabende", check: (p) => s(p, "goldEarned") >= 1e4 },
  { id: "plus10", name: "Meisterschmied", desc: "Verbessere eine Ausr\xFCstung auf +10.", title: "Meisterschmied", check: (p) => s(p, "maxUpgrade") >= 10 },
  { id: "legend", name: "Legend\xE4rer Fund", desc: "Finde einen legend\xE4ren Gegenstand.", check: (p) => s(p, "legendaries") >= 1 },
  { id: "steine", name: "Weltenwanderer", desc: "Aktiviere 6 Wegsteine.", check: (p) => pdata(p).waystones.length >= 6 },
  { id: "seiten", name: "Chronist", desc: "Liefere alle Tagebuchseiten ab.", check: (p) => pdata(p).done.includes("o1") },
  { id: "neben", name: "Hilfsbereit", desc: "Schlie\xDFe 10 Nebenquests ab.", title: "Freund des Hains", check: (p) => pdata(p).done.length >= 10 },
  { id: "tod10", name: "Unsterblich? Nein.", desc: "Stirb 10 Mal.", title: "Der Stehaufmann", check: (p) => s(p, "deaths") >= 10 },
  { id: "prestige", name: "Wiedergeboren", desc: "Erreiche Prestige 1.", title: "Wiedergeborener", check: (p) => pdata(p).prestige >= 1 },
  { id: "heroisch", name: "Heroisch", desc: "Besiege einen heroischen Dungeon-W\xE4chter.", title: "Held der Wurzelpfade", check: (p) => s(p, "heroic") >= 1 }
];
function unlockedTitles(p) {
  const d = pdata(p);
  const out = [];
  for (const a of ACHIEVEMENTS) if (a.title && d.ach.includes(a.id)) out.push(a.title);
  for (const x of d.ach) if (x.startsWith("title:")) out.push(x.slice(6));
  return [...new Set(out)];
}
function check(p) {
  const d = pdata(p);
  for (const a of ACHIEVEMENTS) {
    if (d.ach.includes(a.id)) continue;
    let ok = false;
    try {
      ok = a.check(p);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    d.ach.push(a.id);
    markDirty(p);
    title(p, "\xA76Erfolg!", `\xA7f${a.name}`, 5, 50, 10);
    sound(p, "ui.toast.challenge_complete", void 0, 1, 1);
    msg(p, `\xA76\u2726 Erfolg freigeschaltet: \xA7f${a.name} \xA77\u2013 ${a.desc}${a.title ? ` \xA7d(Titel: ${a.title})` : ""}`);
  }
}
function applyNameTag(p) {
  const d = pdata(p);
  try {
    const t = d.title ? `\xA7d[${d.title}]\xA7r
` : "";
    const pre = d.prestige > 0 ? `\xA76\u2726${d.prestige} ` : "";
    p.nameTag = `${t}${pre}\xA7f${p.name} \xA77Lv ${level(p)}`;
  } catch {
  }
}
function initAchievements() {
  on("kill", (ev) => {
    if ((pdata(ev.player).stats.kills ?? 0) % 10 === 1 || ev.info?.def?.boss) check(ev.player);
  });
  on("flag", (ev) => {
    if (ev.player) check(ev.player);
  });
  system9.runInterval(() => {
    for (const p of players()) {
      check(p);
      applyNameTag(p);
    }
  }, 200);
}

// src/systems/items.ts
import { BlockPermutation as BlockPermutation3, ItemStack as ItemStack8, system as system18, world as world17 } from "@minecraft/server";

// src/ui/book.ts
import { EquipmentSlot as EquipmentSlot6, ItemStack as ItemStack7, world as world16 } from "@minecraft/server";

// src/world/dungeons.ts
import { system as system14, world as world12, BlockPermutation as BlockPermutation2, ItemStack as ItemStack4 } from "@minecraft/server";

// src/world/builder.ts
import { BlockPermutation, BlockVolume, system as system10, world as world8 } from "@minecraft/server";
var permCache = /* @__PURE__ */ new Map();
function perm(spec) {
  const key = typeof spec === "string" ? spec : spec.id + JSON.stringify(spec.states ?? {});
  let p = permCache.get(key);
  if (p === void 0) {
    try {
      p = typeof spec === "string" ? BlockPermutation.resolve(spec) : BlockPermutation.resolve(spec.id, spec.states);
    } catch (e) {
      log("Unbekannter Block:", key, String(e));
      p = null;
    }
    permCache.set(key, p);
  }
  return p ?? void 0;
}
var Builder = class {
  constructor(dim, o, seed = 1) {
    this.dim = dim;
    this.o = o;
    this.rnd = seeded(seed);
  }
  ops = [];
  rnd;
  /** Markierungen (z. B. Spawnpunkte), relativ zum Ursprung */
  marks = {};
  abs(x, y, z) {
    return { x: this.o.x + x, y: this.o.y + y, z: this.o.z + z };
  }
  mark(name, x, y, z) {
    (this.marks[name] ??= []).push({ x, y, z });
  }
  pickFrom(p) {
    if (!Array.isArray(p)) return p;
    const total = p.reduce((s2, e) => s2 + e.w, 0);
    let r = this.rnd() * total;
    for (const e of p) {
      r -= e.w;
      if (r <= 0) return e.b;
    }
    return p[p.length - 1].b;
  }
  base(p) {
    if (!Array.isArray(p)) return p;
    return p.reduce((a, b) => b.w > a.w ? b : a).b;
  }
  /** Quader füllen (inklusive Grenzen). Gemischte Paletten werden nachträglich gesprenkelt. */
  box(x1, y1, z1, x2, y2, z2, p) {
    const [ax, bx] = [Math.min(x1, x2), Math.max(x1, x2)];
    const [ay, by] = [Math.min(y1, y2), Math.max(y1, y2)];
    const [az, bz] = [Math.min(z1, z2), Math.max(z1, z2)];
    const b = this.base(p);
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
      if (vol <= 6e3) {
        for (let x = ax; x <= bx; x++)
          for (let y = ay; y <= by; y++)
            for (let z = az; z <= bz; z++) {
              const s2 = this.pickFrom(p);
              if (s2 !== b) this.set(x, y, z, s2);
            }
      }
    }
    return this;
  }
  /** Hohler Quader (Wände, Boden, Decke). */
  room(x1, y1, z1, x2, y2, z2, wall, floor, ceil) {
    this.box(x1, y1, z1, x2, y2, z2, wall);
    this.box(x1 + 1, y1 + 1, z1 + 1, x2 - 1, y2 - 1, z2 - 1, "minecraft:air");
    if (floor) this.box(x1 + 1, y1, z1 + 1, x2 - 1, y1, z2 - 1, floor);
    if (ceil) this.box(x1 + 1, y2, z1 + 1, x2 - 1, y2, z2 - 1, ceil);
    return this;
  }
  set(x, y, z, p) {
    const s2 = Array.isArray(p) ? this.pickFrom(p) : p;
    this.ops.push(() => {
      const pm = perm(s2);
      if (!pm) return;
      try {
        this.dim.setBlockPermutation(this.abs(x, y, z), pm);
      } catch {
      }
    });
    return this;
  }
  /** Zylinder (vertikal). */
  cyl(cx, y1, cz, r, h, p, hollow = false) {
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
  disc(cx, y, cz, r, p) {
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
      let zmax = -1;
      for (let z = 0; z <= Math.ceil(r); z++) if (Math.sqrt(x * x + z * z) <= r + 0.3) zmax = z;
      if (zmax >= 0) this.box(cx + x, y, cz - zmax, cx + x, y, cz + zmax, p);
    }
    return this;
  }
  /** Kugel / Ellipsoid (für Blätterkronen). */
  blob(cx, cy, cz, rx, ry, rz, p, density = 1) {
    for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++)
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++)
        for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z++) {
          const d = x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz);
          if (d > 1) continue;
          if (density < 1 && d > 0.6 && this.rnd() > density) continue;
          this.set(cx + x, cy + y, cz + z, p);
        }
    return this;
  }
  /** Linie aus Blöcken (z. B. Äste). */
  line(a, b, p, thick = 0) {
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
  then(fn) {
    this.ops.push(fn);
    return this;
  }
  /** Startet den Bau als Job. Callback nach Fertigstellung. */
  run(onDone, perTick = 40) {
    const ops = this.ops;
    function* job() {
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
    system10.runJob(job());
  }
};
async function withLoadedArea(id, dim, from, to, fn) {
  const tam = world8.tickingAreaManager;
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
    system10.runTimeout(() => {
      try {
        if (tam.hasTickingArea(tid)) tam.removeTickingArea(tid);
      } catch {
      }
    }, 400);
  }
}
function surfaceY(dim, x, z) {
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
    if (!b) return void 0;
    return { y: b.y, water: b.isLiquid || b.typeId.includes("water") || b.typeId.includes("ice") && b.typeId !== "minecraft:packed_ice" };
  } catch {
    return void 0;
  }
}

// src/world/waystones.ts
import { world as world9, system as system11 } from "@minecraft/server";
function registerWaystone(id, loc, dim, name, owner) {
  const w = wdata();
  w.waystones[id] = { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z), d: dim, name, owner };
  markWorldDirty();
}
function unregisterAt(loc, dim) {
  const w = wdata();
  for (const [id, ws] of Object.entries(w.waystones)) {
    if (ws.d === dim && ws.x === Math.floor(loc.x) && ws.y === Math.floor(loc.y) && ws.z === Math.floor(loc.z)) {
      delete w.waystones[id];
      markWorldDirty();
    }
  }
}
function waystoneAt(loc, dim) {
  for (const [id, ws] of Object.entries(wdata().waystones)) {
    if (ws.d === dim && Math.abs(ws.x - Math.floor(loc.x)) <= 0 && Math.abs(ws.z - Math.floor(loc.z)) <= 0 && Math.abs(ws.y - Math.floor(loc.y)) <= 1) return id;
  }
  return void 0;
}
function activate(p, id) {
  const d = pdata(p);
  if (d.waystones.includes(id)) return;
  d.waystones.push(id);
  markDirty(p);
  const ws = wdata().waystones[id];
  title(p, "\xA7bWegstein aktiviert", `\xA7f${ws?.name ?? id}`, 5, 40, 10);
  sound(p, "beacon.activate", void 0, 1.2, 0.8);
  emit("flag", { key: "waystone", player: p });
}
async function openWaystone(p, loc) {
  let id = waystoneAt(loc, p.dimension.id);
  if (!id) {
    id = `w_${Math.floor(loc.x)}_${Math.floor(loc.z)}`;
    registerWaystone(id, loc, p.dimension.id, `Wegstein (${Math.floor(loc.x)}, ${Math.floor(loc.z)})`);
  }
  activate(p, id);
  await travelMenu(p, id);
}
async function travelMenu(p, fromId) {
  const d = pdata(p);
  const all = wdata().waystones;
  const list = d.waystones.filter((id) => all[id] && id !== fromId);
  if (!list.length) {
    msg(p, "\xA77Du hast noch keine weiteren Wegsteine aktiviert. Ber\xFChre Wegsteine, um sie freizuschalten.");
    return;
  }
  await menu(
    p,
    "\xA7bWegsteine",
    `\xA77Reisekosten: \xA7e${WAYSTONE_TRAVEL_COST} Gold \xA77\xB7 Dein Gold: \xA7e${fmt(d.gold)}`,
    list.map((id) => {
      const ws = all[id];
      const dist = ws.d === p.dimension.id ? `${fmt(V.dist2d(p.location, ws))} m` : "andere Dimension";
      return {
        text: `\xA7f${ws.name}
\xA77${dist}`,
        icon: "textures/cdw/ui/waystone",
        action: () => travel(p, id)
      };
    })
  );
}
function travel(p, id, free = false) {
  const ws = wdata().waystones[id];
  if (!ws) return;
  if (!free && !spendGold(p, WAYSTONE_TRAVEL_COST)) {
    msg(p, `\xA7cNicht genug Gold (${WAYSTONE_TRAVEL_COST} ben\xF6tigt).`);
    return;
  }
  const dim = world9.getDimension(ws.d);
  particle(p.dimension, "minecraft:portal_reverse_particle", V.add(p.location, { x: 0, y: 1, z: 0 }));
  sound(p.dimension, "mob.endermen.portal", p.location, 1, 1);
  p.addEffect("blindness", 25, { showParticles: false });
  system11.runTimeout(() => {
    try {
      p.teleport({ x: ws.x + 0.5, y: ws.y + 1, z: ws.z + 1.5 }, { dimension: dim, checkForBlocks: false });
      sound(p, "mob.endermen.portal", void 0, 1.2, 1);
    } catch {
    }
  }, 8);
}

// src/world/bosses.ts
import { EntityDamageCause as EntityDamageCause2, system as system13, world as world11 } from "@minecraft/server";

// src/world/mobfx.ts
import { system as system12, world as world10 } from "@minecraft/server";
function spawnProjectileFromMob(mob, projId, target, speed = 1.3) {
  try {
    const from = V.add(mob.location, { x: 0, y: 1.6, z: 0 });
    const dir = V.norm(V.sub(target, from));
    const e = mob.dimension.spawnEntity(`cdw:${projId}`, V.add(from, V.mul(dir, 1.5)));
    const pc = e.getComponent("minecraft:projectile");
    if (pc) {
      pc.owner = mob;
      pc.shoot(V.mul(dir, speed));
    }
  } catch {
  }
}
function initEliteAura() {
  system12.runInterval(() => {
    for (const p of world10.getAllPlayers()) {
      try {
        for (const e of p.dimension.getEntities({ location: p.location, maxDistance: 32, families: ["cdw_blight"] })) {
          if (!isValid(e) || e.getDynamicProperty("cdw:e") !== true) continue;
          particle(e.dimension, "minecraft:villager_angry", V.add(e.location, { x: 0, y: 2.2, z: 0 }));
        }
      } catch {
      }
    }
  }, 30);
}

// src/world/bosses.ts
var runs = /* @__PURE__ */ new Map();
function startBoss(bossId, center, tag, heroic, onDefeat) {
  const def = mobById(bossId);
  if (!def?.boss) return void 0;
  const dim = world11.getDimension("minecraft:overworld");
  try {
    const e = dim.spawnEntity(`cdw:${bossId}`, V.add(center, { x: 0.5, y: 0.2, z: 0.5 }));
    e.addTag(tag);
    e.addTag("cdw_boss");
    const n = dim.getPlayers({ location: center, maxDistance: 64 }).length;
    e.setDynamicProperty("cdw:l", heroic ? 52 : def.boss.fixedLevel);
    e.setDynamicProperty("cdw:hm", (heroic ? 1.8 : 1) * (1 + 0.6 * Math.max(0, n - 1)));
    if (heroic) e.setDynamicProperty("cdw:dm", 1.3);
    e.nameTag = `\xA7l${heroic ? "\xA76[Heroisch] " : ""}\xA7c${def.boss.title}`;
    assignLevel(e);
    runs.set(e.id, { id: bossId, entity: e.id, center, tag, heroic, onDefeat, t: 0, enraged: false, lastSeen: system13.currentTick });
    for (const p of dim.getPlayers({ location: center, maxDistance: 64 })) {
      title(p, `\xA7c${def.boss.title}`, heroic ? "\xA76Heroischer W\xE4chter" : "\xA77erwacht!", 10, 60, 20);
      sound(p, "mob.wither.spawn", void 0, 0.8, 0.6);
    }
    for (let r = 1; r < 6; r++) ring(dim, "minecraft:large_smoke_particle", center, r, r * 4);
    return e;
  } catch (err) {
    log("Boss-Spawn fehlgeschlagen:", bossId, String(err));
    return void 0;
  }
}
function bossHp(e) {
  const h = e.getComponent("minecraft:health");
  return h ? h.currentValue / h.effectiveMax : 1;
}
function hurtPlayer(boss2, p, base) {
  try {
    p.applyDamage(base, { cause: EntityDamageCause2.entityAttack, damagingEntity: boss2 });
  } catch {
  }
}
function slam(boss2, radius, base, color = "minecraft:basic_flame_particle") {
  const c = boss2.location;
  const dim = boss2.dimension;
  for (let i = 0; i < 3; i++) system13.runTimeout(() => ring(dim, color, V.add(c, { x: 0, y: 0.2, z: 0 }), radius, Math.round(radius * 4)), i * 8);
  sound(dim, "mob.ravager.roar", c, 0.7, 1);
  system13.runTimeout(() => {
    if (!isValid(boss2)) return;
    particle(dim, "minecraft:huge_explosion_emitter", c);
    sound(dim, "random.explode", c, 0.8, 1);
    for (const p of dim.getPlayers({ location: c, maxDistance: radius })) {
      hurtPlayer(boss2, p, base);
      const d = V.flat(V.sub(p.location, c));
      p.applyKnockback({ x: d.x * 1.2, z: d.z * 1.2 }, 0.45);
    }
  }, 30);
}
function summonAdds(boss2, run) {
  const def = mobById(run.id);
  const adds = def?.boss?.adds ?? [];
  if (!adds.length) return;
  const dim = boss2.dimension;
  const alive = dim.getEntities({ tags: [`${run.tag}:add`] }).length;
  if (alive >= 6) return;
  const n = run.enraged ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const loc = V.add(run.center, { x: rand(-7, 7), y: 0.2, z: rand(-7, 7) });
    try {
      const e = dim.spawnEntity(`cdw:${pick(adds)}`, loc);
      e.addTag(`${run.tag}:add`);
      e.addTag("cdw_dungeon");
      e.setDynamicProperty("cdw:l", (run.heroic ? 50 : def?.boss?.fixedLevel ?? 10) - 2);
      assignLevel(e);
      particle(dim, "minecraft:large_smoke_particle", loc);
    } catch {
    }
  }
  sound(dim, "mob.evocation_illager.prepare_summon", boss2.location, 1, 1);
}
function volley(boss2, run) {
  const def = mobById(run.id);
  const proj = def?.projectile ?? "blight_bolt_big";
  const targets = boss2.dimension.getPlayers({ location: boss2.location, maxDistance: 30 });
  for (const p of targets) {
    for (let i = 0; i < (run.enraged ? 3 : 2); i++) {
      system13.runTimeout(() => {
        if (isValid(boss2) && isValid(p)) spawnProjectileFromMob(boss2, proj, p.getHeadLocation());
      }, i * 6);
    }
  }
}
function tick2() {
  for (const [eid, run] of runs) {
    const e = world11.getEntity(eid);
    if (!e || !isValid(e)) continue;
    run.t++;
    const dim = e.dimension;
    const near = dim.getPlayers({ location: run.center, maxDistance: 40 });
    if (near.length) run.lastSeen = system13.currentTick;
    else if (system13.currentTick - run.lastSeen > 1200) {
      const h = e.getComponent("minecraft:health");
      h?.resetToMaxValue();
      e.teleport(V.add(run.center, { x: 0.5, y: 0.2, z: 0.5 }));
      run.enraged = false;
      continue;
    }
    if (V.dist2d(e.location, run.center) > 24) e.teleport(V.add(run.center, { x: 0.5, y: 0.5, z: 0.5 }));
    const hp = bossHp(e);
    if (!run.enraged && hp < 0.5) {
      run.enraged = true;
      e.addEffect("speed", 20 * 600, { amplifier: 0, showParticles: false });
      e.addEffect("strength", 20 * 600, { amplifier: 0, showParticles: false });
      for (const p of near) title(p, "", "\xA7cDer W\xE4chter rast vor Zorn!", 5, 40, 10);
      sound(dim, "mob.enderdragon.growl", e.location, 1, 1);
      summonAdds(e, run);
    }
    const def = mobById(run.id);
    const base = (def?.damage ?? 6) * 1.2;
    const period = run.enraged ? 7 : 10;
    if (run.t % period === 0) slam(e, run.id === "boss_wurzelwyrm" ? 7 : 5, base, run.id.includes("frost") || run.id === "boss_hrimgar" ? "minecraft:snowflake_particle" : "minecraft:basic_flame_particle");
    if (run.t % (run.enraged ? 12 : 18) === 5) summonAdds(e, run);
    if ((def?.arch === "boss_ranged" || run.id === "boss_kristallmutter" || run.id === "boss_glutkoenigin") && run.t % 4 === 2) volley(e, run);
  }
}
function initBosses() {
  system13.runInterval(tick2, 20);
  world11.afterEvents.entityDie.subscribe((ev) => {
    let id;
    try {
      id = ev.deadEntity.id;
    } catch {
      return;
    }
    const run = runs.get(id);
    if (!run) return;
    runs.delete(id);
    const center = run.center;
    try {
      for (const a of ev.deadEntity.dimension.getEntities({ tags: [`${run.tag}:add`] })) a.kill();
    } catch {
    }
    emit("flag", { key: `boss:${run.id}` });
    for (const p of players()) if (V.dist(p.location, center) < 80) title(p, "\xA76Sieg!", `\xA7f${mobById(run.id)?.boss?.title ?? ""} ist gefallen`, 10, 60, 20);
    if (run.id === "boss_morvath") {
      system13.runTimeout(() => {
        const dim = world11.getDimension("minecraft:overworld");
        for (let r = 1; r < 8; r++) ring(dim, "minecraft:soul_particle", center, r, r * 4);
        sound(dim, "mob.wither.spawn", center, 0.6, 1);
        startBoss("boss_welkenbestie", center, run.tag, run.heroic, run.onDefeat);
      }, 60);
      return;
    }
    try {
      run.onDefeat();
    } catch (e) {
      log("Boss-Abschluss:", String(e));
    }
  });
  world11.afterEvents.entityLoad.subscribe((ev) => {
    const e = ev.entity;
    if (!isValid(e) || !e.hasTag("cdw_boss") || runs.has(e.id)) return;
    const tag = e.getTags().find((t) => t.startsWith("cdw_dg:")) ?? "cdw_dg:world";
    const bossId = e.typeId.slice(4);
    runs.set(e.id, { id: bossId, entity: e.id, center: e.location, tag, heroic: false, onDefeat: () => resumeDefeat(tag), t: 0, enraged: false, lastSeen: system13.currentTick });
  });
}
function resumeDefeat(tag) {
  const parts = tag.split(":");
  const st = wdata().dungeons[parts[1]];
  if (st) {
    st.boss = true;
    st.stage = Math.max(st.stage, Number(parts[2]) + 1);
    markWorldDirty();
  }
}

// src/world/dungeons.ts
var T = {
  forest: {
    wall: [{ b: "minecraft:mossy_stone_bricks", w: 4 }, { b: "minecraft:stone_bricks", w: 2 }, { b: "minecraft:cracked_stone_bricks", w: 1 }, { b: "minecraft:moss_block", w: 1 }],
    floor: [{ b: "minecraft:moss_block", w: 3 }, { b: "minecraft:mossy_cobblestone", w: 2 }, { b: "minecraft:dirt_with_roots", w: 1 }],
    ceil: [{ b: "minecraft:mossy_stone_bricks", w: 3 }, { b: "minecraft:moss_block", w: 2 }],
    pillar: { id: "minecraft:oak_log", states: { pillar_axis: "y" } },
    accent: "minecraft:chiseled_stone_bricks",
    light: "minecraft:ochre_froglight",
    deco: [{ b: "minecraft:moss_carpet", w: 3 }, { b: "minecraft:short_grass", w: 1 }, { b: "minecraft:fern", w: 1 }],
    surface: [{ b: "minecraft:mossy_stone_bricks", w: 3 }, { b: "minecraft:mossy_cobblestone", w: 2 }]
  },
  swamp: {
    wall: [{ b: "minecraft:mud_bricks", w: 4 }, { b: "minecraft:packed_mud", w: 2 }, { b: "minecraft:mossy_cobblestone", w: 1 }],
    floor: [{ b: "minecraft:mud", w: 3 }, { b: "minecraft:muddy_mangrove_roots", w: 1 }, { b: "minecraft:mud_bricks", w: 2 }],
    ceil: [{ b: "minecraft:mangrove_roots", w: 2 }, { b: "minecraft:mud_bricks", w: 3 }],
    pillar: { id: "minecraft:mangrove_log", states: { pillar_axis: "y" } },
    accent: "minecraft:mangrove_planks",
    light: "minecraft:verdant_froglight",
    deco: [{ b: "minecraft:moss_carpet", w: 2 }, { b: "minecraft:brown_mushroom", w: 1 }],
    surface: [{ b: "minecraft:mud_bricks", w: 3 }, { b: "minecraft:mangrove_planks", w: 1 }]
  },
  desert: {
    wall: [{ b: "minecraft:cut_sandstone", w: 3 }, { b: "minecraft:smooth_sandstone", w: 2 }, { b: "minecraft:chiseled_sandstone", w: 1 }],
    floor: [{ b: "minecraft:smooth_sandstone", w: 3 }, { b: "minecraft:sand", w: 1 }, { b: "minecraft:orange_terracotta", w: 1 }],
    ceil: [{ b: "minecraft:cut_red_sandstone", w: 2 }, { b: "minecraft:smooth_sandstone", w: 2 }],
    pillar: "minecraft:chiseled_red_sandstone",
    accent: "minecraft:gold_block",
    light: "minecraft:pearlescent_froglight",
    deco: [{ b: "minecraft:deadbush", w: 2 }, { b: "minecraft:sand", w: 1 }],
    surface: [{ b: "minecraft:cut_sandstone", w: 3 }, { b: "minecraft:sandstone", w: 2 }]
  },
  frost: {
    wall: [{ b: "minecraft:deepslate_tiles", w: 3 }, { b: "minecraft:packed_ice", w: 2 }, { b: "minecraft:polished_deepslate", w: 1 }],
    floor: [{ b: "minecraft:packed_ice", w: 3 }, { b: "minecraft:snow", w: 2 }, { b: "minecraft:deepslate_tiles", w: 1 }],
    ceil: [{ b: "minecraft:blue_ice", w: 2 }, { b: "minecraft:deepslate_tiles", w: 3 }],
    pillar: "minecraft:polished_deepslate",
    accent: "minecraft:blue_ice",
    light: "minecraft:sea_lantern",
    deco: [{ b: "minecraft:snow_layer", w: 3 }],
    surface: [{ b: "minecraft:deepslate_tiles", w: 2 }, { b: "minecraft:packed_ice", w: 1 }, { b: "minecraft:snow", w: 2 }]
  },
  deep: {
    wall: [{ b: "minecraft:deepslate_bricks", w: 3 }, { b: "minecraft:cracked_deepslate_bricks", w: 1 }, { b: "minecraft:tuff_bricks", w: 1 }],
    floor: [{ b: "minecraft:polished_deepslate", w: 3 }, { b: "minecraft:sculk", w: 1 }, { b: "minecraft:amethyst_block", w: 0.5 }],
    ceil: [{ b: "minecraft:deepslate_bricks", w: 3 }, { b: "minecraft:amethyst_block", w: 1 }],
    pillar: "minecraft:chiseled_deepslate",
    accent: "minecraft:amethyst_block",
    light: "minecraft:pearlescent_froglight",
    deco: [{ b: "minecraft:small_amethyst_bud", w: 1 }, { b: "minecraft:sculk_vein", w: 1 }],
    surface: [{ b: "minecraft:cobbled_deepslate", w: 2 }, { b: "minecraft:deepslate_bricks", w: 2 }]
  },
  citadel: {
    wall: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:cracked_polished_blackstone_bricks", w: 1 }, { b: "minecraft:crimson_hyphae", w: 1 }],
    floor: [{ b: "minecraft:polished_blackstone", w: 3 }, { b: "minecraft:crimson_nylium", w: 1 }],
    ceil: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:nether_wart_block", w: 1 }],
    pillar: { id: "minecraft:crimson_stem", states: { pillar_axis: "y" } },
    accent: "minecraft:crying_obsidian",
    light: "minecraft:shroomlight",
    deco: [{ b: "minecraft:crimson_roots", w: 2 }, { b: "minecraft:weeping_vines", w: 0 }],
    surface: [{ b: "minecraft:polished_blackstone_bricks", w: 3 }, { b: "minecraft:blackstone", w: 1 }]
  }
};
var DUNGEONS = [
  { id: "dornenhain", name: "Der Dornenhain", act: 1, ring: DUNGEON_RINGS[0], angle: 35, level: 7, mobs: ["moosling", "dornenwolf", "rindenschreck_setzling"], elite: "dornenwolf", boss: "boss_rindenschreck", theme: T.forest },
  { id: "seufzermoor", name: "Das Seufzermoor", act: 2, ring: DUNGEON_RINGS[1], angle: 145, level: 14, mobs: ["moorschlurfer", "schlammkroete", "seufzergeist"], elite: "moorschlurfer", boss: "boss_moorschlund", theme: T.swamp },
  { id: "glutsand", name: "Tempel der Glut", act: 3, ring: DUNGEON_RINGS[2], angle: 250, level: 21, mobs: ["glutskorpion", "verdorrter_priester", "glutgeist"], elite: "verdorrter_priester", boss: "boss_glutkoenigin", theme: T.desert },
  { id: "frostkrone", name: "Frostkrone-Feste", act: 4, ring: DUNGEON_RINGS[3], angle: 320, level: 28, mobs: ["eiskobold", "frosttroll", "reifkraehe"], elite: "frosttroll", boss: "boss_hrimgar", theme: T.frost },
  { id: "schattenwurzel", name: "Die Schattenwurzel", act: 5, ring: DUNGEON_RINGS[4], angle: 200, level: 35, mobs: ["kristallspinne", "schattenkriecher", "wurzelgolem"], elite: "schattenkriecher", boss: "boss_kristallmutter", theme: T.deep },
  { id: "zitadelle", name: "Zitadelle des Welkens", act: 6, ring: DUNGEON_RINGS[5], angle: 95, level: 39, mobs: ["faeulnisgeist", "wurzelgolem", "schattenkriecher", "seufzergeist"], elite: "wurzelgolem", boss: "boss_morvath", theme: T.citadel, tower: true }
];
function dungeonDef(id) {
  return DUNGEONS.find((d) => d.id === id);
}
var D = -14;
function layout(def) {
  if (def.tower) {
    const rooms = [];
    const kinds = ["wave", "wave", "puzzle", "wave", "boss"];
    for (let i = 0; i < kinds.length; i++) {
      const y = 1 + i * 9;
      rooms.push({ kind: kinds[i], min: { x: -9, y, z: -18 }, max: { x: 9, y: y + 7, z: 0 }, door: { min: { x: -1, y: y + 8, z: -2 }, max: { x: 1, y: y + 8, z: 0 } } });
    }
    return rooms;
  }
  return [
    { kind: "wave", min: { x: -7, y: D, z: -32 }, max: { x: 7, y: D + 7, z: -18 }, door: { min: { x: -2, y: D, z: -33 }, max: { x: 2, y: D + 4, z: -33 } } },
    { kind: "puzzle", min: { x: -7, y: D, z: -52 }, max: { x: 7, y: D + 7, z: -38 }, door: { min: { x: -2, y: D, z: -53 }, max: { x: 2, y: D + 4, z: -53 } } },
    { kind: "wave", min: { x: -7, y: D, z: -72 }, max: { x: 7, y: D + 7, z: -58 }, door: { min: { x: -2, y: D, z: -73 }, max: { x: 2, y: D + 4, z: -73 } } },
    { kind: "boss", min: { x: -12, y: D, z: -102 }, max: { x: 12, y: D + 12, z: -78 }, door: { min: { x: -2, y: D, z: -103 }, max: { x: 2, y: D + 4, z: -103 } } },
    { kind: "heart", min: { x: -4, y: D, z: -114 }, max: { x: 4, y: D + 6, z: -106 }, door: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } }
  ];
}
function bossCenter(def) {
  return def.tower ? { x: 0, y: 1 + 4 * 9 + 1, z: -9 } : { x: 0, y: D + 1, z: -90 };
}
function heartPos(def) {
  return def.tower ? { x: 0, y: 1 + 4 * 9 + 1, z: -16 } : { x: 0, y: D + 2, z: -112 };
}
function dungeonState(id) {
  return wdata().dungeons[id];
}
function ensureLocation(id) {
  const def = dungeonDef(id);
  const hub = wdata().hub;
  if (!def || !hub) return void 0;
  let st = wdata().dungeons[id];
  if (st) return st;
  const ang = (def.angle + hub.x % 30) * Math.PI / 180;
  st = { x: Math.round(hub.x + Math.cos(ang) * def.ring), y: hub.y, z: Math.round(hub.z + Math.sin(ang) * def.ring), built: false, stage: 0, boss: false, heart: false, rerolls: 0 };
  wdata().dungeons[id] = st;
  markWorldDirty();
  return st;
}
function reroll(id) {
  const st = wdata().dungeons[id];
  const def = dungeonDef(id);
  const hub = wdata().hub;
  if (!st || !def || !hub || st.built) return false;
  st.rerolls++;
  const ang = (def.angle + st.rerolls * 47 + hub.x % 30) * Math.PI / 180;
  const ring2 = def.ring + st.rerolls % 2 * 60;
  st.x = Math.round(hub.x + Math.cos(ang) * ring2);
  st.z = Math.round(hub.z + Math.sin(ang) * ring2);
  markWorldDirty();
  return true;
}
var buildingNow = /* @__PURE__ */ new Set();
function buildDungeon(def, st) {
  buildDungeonImpl(def, st, () => void 0, false);
}
function testBuildDungeon(id, at) {
  const def = dungeonDef(id);
  if (!def) return Promise.reject(new Error("unbekannt"));
  const st = { x: at.x, y: 64, z: at.z, built: false, stage: 0, boss: false, heart: false, rerolls: 0 };
  return new Promise((res) => buildDungeonImpl(def, st, () => res(st), true));
}
function buildDungeonImpl(def, st, done, test) {
  const key = test ? `test_${def.id}` : def.id;
  if (buildingNow.has(key)) return;
  buildingNow.add(key);
  const dim = world12.getDimension("minecraft:overworld");
  const from = { x: st.x - 20, y: 0, z: st.z - 120 };
  const to = { x: st.x + 20, y: 0, z: st.z + 12 };
  void withLoadedArea(`dg_${key}`, dim, from, to, () => {
    return new Promise((resolve2) => {
      let surf = surfaceY(dim, st.x, st.z);
      for (let i = 0; i < 6 && surf?.water; i++) {
        const nx = st.x + Math.round(rand(-30, 30));
        const nz = st.z + Math.round(rand(-30, 30));
        const s2 = surfaceY(dim, nx, nz);
        if (s2 && !s2.water) {
          st.x = nx;
          st.z = nz;
          surf = s2;
        }
      }
      const y = Math.max(-40, Math.min(250, surf?.y ?? wdata().hub?.y ?? 64));
      st.y = y;
      const origin = { x: st.x, y, z: st.z };
      const b = new Builder(dim, origin, st.x * 7 + st.z * 13);
      if (def.tower) buildTower(b, def, !!surf?.water);
      else buildUnderground(b, def, !!surf?.water);
      b.then(() => {
        if (test) return;
        registerWaystone(`dg_${def.id}`, { x: origin.x + 4, y: origin.y + 1, z: origin.z + 5 }, "minecraft:overworld", def.name);
        if (def.id === "seufzermoor" && wdata().flags.npc_morgra_x !== void 0) {
          wdata().flags.npc_morgra_x = origin.x - 10.5;
          wdata().flags.npc_morgra_y = origin.y + 1;
          wdata().flags.npc_morgra_z = origin.z + 6.5;
        }
        st.built = true;
        markWorldDirty();
        for (const p of dim.getPlayers({ location: origin, maxDistance: 120 })) title(p, `\xA76${def.name}`, "\xA77Ein uralter Ort erhebt sich", 10, 60, 20);
        sound(dim, "ambient.weather.thunder", origin, 0.5, 1);
      });
      b.run(() => {
        buildingNow.delete(key);
        resolve2();
        done();
      }, 50);
    });
  });
}
function buildUnderground(b, def, water) {
  const t = def.theme;
  const rooms = layout(def);
  rooms.forEach((r) => {
    if (r.kind === "boss") arena(b, t, r);
    else chamber(b, t, r);
  });
  if (water) b.box(-7, -3, -7, 7, 0, 9, t.surface);
  b.box(-6, 0, -6, 6, 0, 8, t.surface);
  b.box(-6, 1, -6, 6, 8, 8, "minecraft:air");
  for (const [x, z] of [[-5, -5], [5, -5], [-5, 7], [5, 7]]) {
    const h = 2 + Math.floor(b.rnd() * 5);
    b.box(x, 1, z, x, h, z, t.pillar);
  }
  b.box(-3, 1, -6, -3, 5, -6, t.wall).box(3, 1, -6, 3, 5, -6, t.wall).box(-3, 6, -6, 3, 6, -6, t.wall);
  b.set(0, 7, -6, t.accent);
  b.set(-3, 6, -5, t.light).set(3, 6, -5, t.light);
  b.set(4, 1, 5, "cdw:wegstein");
  if (def.id === "seufzermoor") {
    b.box(-14, 0, 3, -8, 0, 9, "minecraft:mangrove_planks");
    b.box(-14, 1, 3, -8, 4, 9, [{ b: "minecraft:mud_bricks", w: 3 }, { b: "minecraft:mangrove_planks", w: 1 }]);
    b.box(-13, 1, 4, -9, 4, 8, "minecraft:air");
    b.box(-8, 1, 6, -8, 2, 6, "minecraft:air");
    b.box(-15, 5, 2, -7, 5, 10, "minecraft:mangrove_roots");
    b.set(-12, 1, 4, "minecraft:cauldron").set(-13, 1, 8, "minecraft:brewing_stand").set(-10, 3, 6, { id: "minecraft:lantern", states: { hanging: false } });
  }
  const first = rooms[0];
  const wallZ = first.max.z + 1;
  for (let i = 0; i <= -D; i++) {
    const z = -6 - i;
    const yTop = -i;
    if (z >= wallZ) {
      b.box(-3, yTop - 1, z, 3, yTop + 5, z, t.wall);
      b.box(-2, yTop, z, 2, yTop + 4, z, "minecraft:air");
      b.box(-2, yTop - 1, z, 2, yTop - 1, z, t.floor);
      if (i % 4 === 2) b.set(-3, yTop + 2, z, t.light).set(3, yTop + 2, z, t.light);
      if (z === wallZ) b.box(-2, first.min.y, z, 2, yTop + 4, z, "minecraft:air");
    } else if (yTop - 1 >= first.min.y) {
      b.box(-2, yTop - 1, z, 2, yTop - 1, z, t.floor);
    }
  }
  rooms.forEach((r, i) => {
    const next = rooms[i + 1];
    if (next) corridor(b, t, r.min.z - 1, next.max.z + 1);
    if (r.kind !== "heart") b.box(r.door.min.x, r.door.min.y, r.door.min.z, r.door.max.x, r.door.max.y, r.door.max.z, "cdw:barriere");
    roomDecor(b, def, r, i);
  });
}
function buildTower(b, def, water) {
  const t = def.theme;
  if (water) b.box(-12, -3, -22, 12, 0, 4, t.surface);
  b.box(-11, 0, -21, 11, 0, 3, t.surface);
  b.box(-11, 1, -21, 11, 50, 3, "minecraft:air");
  b.set(4, 1, 2, "cdw:wegstein");
  const rooms = layout(def);
  b.box(-10, 0, -19, 10, 1 + rooms.length * 9 + 2, 1, t.wall);
  b.box(-9, 1, -18, 9, 1 + rooms.length * 9 + 1, 0, "minecraft:air");
  b.box(-1, 1, 1, 1, 4, 1, "minecraft:air");
  rooms.forEach((r, i) => {
    const y = r.min.y;
    if (i > 0) b.box(-9, y - 1, -18, 9, y - 1, 0, t.floor);
    else b.box(-9, 0, -18, 9, 0, 0, t.floor);
  });
  rooms.forEach((r, i) => {
    const y = r.min.y;
    if (i < rooms.length - 1) {
      for (let s2 = 0; s2 < 8; s2++) b.box(-1, y + s2, -1 - s2, 1, y + s2, -1 - s2, t.accent);
      b.box(-1, y + 8, -10, 1, y + 8, -2, "minecraft:air");
      b.box(r.door.min.x, r.door.min.y, -10, r.door.max.x, r.door.max.y, -2, "cdw:barriere");
    }
    for (const [x, z] of [[-8, -17], [8, -17], [-8, -1], [8, -1]]) b.box(x, y, z, x, y + 7, z, t.pillar);
    b.set(-9, y + 4, -9, t.light).set(9, y + 4, -9, t.light);
    b.box(-10, y + 3, -12, -10, y + 5, -6, "minecraft:air").box(10, y + 3, -12, 10, y + 5, -6, "minecraft:air");
    roomDecor(b, def, r, i);
  });
  const top = 1 + rooms.length * 9 + 1;
  b.box(-9, top, -18, 9, top + 3, 0, "minecraft:air");
  for (const [x, z] of [[-10, -19], [10, -19], [-10, 1], [10, 1]]) b.box(x, top, z, x, top + 6, z, t.pillar);
  const h = heartPos(def);
  b.set(h.x, h.y - 1, h.z, t.accent).set(h.x, h.y, h.z, "cdw:wurzelherz");
}
function corridor(b, t, zStart, zEnd) {
  const [a, c] = [Math.max(zStart, zEnd), Math.min(zStart, zEnd)];
  b.box(-3, D - 1, c, 3, D + 5, a, t.wall);
  b.box(-2, D, c, 2, D + 4, a, "minecraft:air");
  b.box(-2, D - 1, c, 2, D - 1, a, t.floor);
  for (let z = a; z >= c; z -= 5) b.set(-3, D + 3, z, t.light);
}
function chamber(b, t, r) {
  b.room(r.min.x - 1, r.min.y - 1, r.min.z - 1, r.max.x + 1, r.max.y + 1, r.max.z + 1, t.wall, t.floor, t.ceil);
  for (const [x, z] of [[r.min.x + 2, r.min.z + 2], [r.max.x - 2, r.min.z + 2], [r.min.x + 2, r.max.z - 2], [r.max.x - 2, r.max.z - 2]]) {
    b.box(x, r.min.y, z, x, r.max.y, z, t.pillar);
    b.set(x, r.max.y - 1, z + (z < (r.min.z + r.max.z) / 2 ? 1 : -1), t.light);
  }
}
function arena(b, t, r) {
  const cx = (r.min.x + r.max.x) / 2;
  const cz = (r.min.z + r.max.z) / 2;
  const rad = (r.max.x - r.min.x) / 2;
  b.cyl(cx, r.min.y - 1, cz, rad + 1, r.max.y - r.min.y + 3, t.wall);
  b.cyl(cx, r.min.y, cz, rad, r.max.y - r.min.y + 1, "minecraft:air");
  b.disc(cx, r.min.y - 1, cz, rad, t.floor);
  b.disc(cx, r.max.y + 1, cz, rad, t.ceil);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const x = Math.round(cx + Math.cos(a) * (rad - 1.5));
    const z = Math.round(cz + Math.sin(a) * (rad - 1.5));
    b.box(x, r.min.y, z, x, r.max.y, z, t.pillar);
    b.set(x, r.min.y + 5, z, t.light);
  }
  b.disc(cx, r.min.y - 1, cz, 3, t.accent);
}
function roomDecor(b, def, r, i) {
  const t = def.theme;
  const w = r.max.x - r.min.x;
  const d = r.max.z - r.min.z;
  for (let n = 0; n < 6; n++) {
    const x = r.min.x + 1 + Math.floor(b.rnd() * (w - 1));
    const z = r.min.z + 1 + Math.floor(b.rnd() * (d - 1));
    if (Math.abs(x) <= 1) continue;
    b.set(x, r.min.y, z, t.deco);
  }
  if (r.kind === "puzzle") {
    const spots = [
      { x: r.min.x + 2, z: (r.min.z + r.max.z) / 2 - 3 },
      { x: r.max.x - 2, z: (r.min.z + r.max.z) / 2 - 3 },
      { x: r.min.x + 2, z: (r.min.z + r.max.z) / 2 + 3 },
      { x: r.max.x - 2, z: (r.min.z + r.max.z) / 2 + 3 }
    ];
    const order = [0, 1, 2, 3].sort(() => b.rnd() - 0.5);
    spots.forEach((s2, k) => {
      const z = Math.round(s2.z);
      b.set(s2.x, r.min.y, z, "cdw:runenstein");
      b.set(s2.x, r.min.y - 1, z, t.accent);
      b.set(s2.x + (s2.x < 0 ? 1 : -1), r.min.y, z, { id: "minecraft:candle", states: { candles: order[k], lit: true } });
      b.mark(`rune${order[k]}`, s2.x, r.min.y, z);
    });
    b.then(() => storeMarks(def.id, b.marks));
  }
  if (r.kind === "heart" && !def.tower) {
    b.box(r.min.x, r.min.y, r.min.z, r.max.x, r.min.y, r.max.z, t.accent);
    const h = heartPos(def);
    b.set(h.x, h.y - 1, h.z, t.pillar);
    b.set(h.x, h.y, h.z, "cdw:wurzelherz");
    for (const [x, z] of [[-3, -113], [3, -113], [-3, -107], [3, -107]]) b.box(x, r.min.y + 1, z, x, r.max.y, z, t.pillar);
  }
  if (r.kind === "wave" && i >= 2) {
    b.set(r.max.x - 1, r.min.y, r.min.z + 1, { id: "minecraft:chest", states: { "minecraft:cardinal_direction": "south" } });
    b.mark("chest", r.max.x - 1, r.min.y, r.min.z + 1);
    b.then(() => fillChest(def, b, r));
  }
}
function fillChest(def, b, r) {
  try {
    const block = b.dim.getBlock(b.abs(r.max.x - 1, r.min.y, r.min.z + 1));
    const inv = block?.getComponent("minecraft:inventory")?.container;
    if (!inv) return;
    const items = [
      new ItemStack4("cdw:heiltrank", 2 + Math.floor(b.rnd() * 2)),
      new ItemStack4("cdw:manatrank", 1 + Math.floor(b.rnd() * 2)),
      new ItemStack4("minecraft:gold_ingot", 2 + Math.floor(b.rnd() * 5)),
      new ItemStack4("cdw:runenstaub", 1 + Math.floor(def.act / 2))
    ];
    if (b.rnd() < 0.5) items.push(new ItemStack4("cdw:verwelkte_seite", 1));
    if (b.rnd() < 0.3) items.push(new ItemStack4("minecraft:diamond", 1 + Math.floor(b.rnd() * 2)));
    items.push(createGear(randomGearFor(def.level + 2, void 0), 1 + Math.floor(b.rnd() * 2)));
    let slot = 0;
    for (const it of items) {
      inv.setItem(slot, it);
      slot += 2 + Math.floor(b.rnd() * 3);
    }
  } catch {
  }
}
function storeMarks(id, marks) {
  const st = wdata().dungeons[id];
  if (!st) return;
  st.data ??= {};
  for (let k = 0; k < 4; k++) {
    const m = marks[`rune${k}`]?.[0];
    if (m) {
      st.data[`r${k}x`] = m.x;
      st.data[`r${k}y`] = m.y;
      st.data[`r${k}z`] = m.z;
    }
  }
  markWorldDirty();
}
function abs(st, v) {
  return { x: st.x + v.x, y: st.y + v.y, z: st.z + v.z };
}
function inBox(p, st, r) {
  const a = abs(st, r.min);
  const c = abs(st, r.max);
  return p.x >= a.x && p.x <= c.x + 1 && p.y >= a.y - 1 && p.y <= c.y + 2 && p.z >= a.z && p.z <= c.z + 1;
}
var active = /* @__PURE__ */ new Map();
function tagFor(id, room) {
  return `cdw_dg:${id}:${room}`;
}
function spawnWave(def, st, roomIdx, waveNo, heroic) {
  const rooms = layout(def);
  const r = rooms[roomIdx];
  const dim = world12.getDimension("minecraft:overworld");
  const players2 = dim.getPlayers({ location: abs(st, r.min), maxDistance: 80 }).length;
  const count = 3 + roomIdx + waveNo + Math.max(0, players2 - 1) * 2;
  const tag = tagFor(def.id, roomIdx);
  const lvl = (heroic ? 50 : def.level) + roomIdx;
  for (let i = 0; i < count; i++) {
    const mobId = i === 0 && waveNo > 0 ? def.elite : pick(def.mobs);
    const loc = abs(st, { x: Math.round(rand(r.min.x + 2, r.max.x - 2)), y: r.min.y, z: Math.round(rand(r.min.z + 2, r.max.z - 2)) });
    try {
      const e = dim.spawnEntity(`cdw:${mobId}`, V.add(loc, { x: 0.5, y: 0.1, z: 0.5 }));
      e.addTag(tag);
      e.addTag("cdw_dungeon");
      e.setDynamicProperty("cdw:l", lvl);
      if (i === 0 && waveNo > 0) {
        e.setDynamicProperty("cdw:e", true);
        e.setDynamicProperty("cdw:hm", 2.5);
        e.setDynamicProperty("cdw:dm", 1.5);
        try {
          e.setProperty("cdw:elite", true);
        } catch {
        }
      }
      assignLevel(e);
      particle(dim, "minecraft:large_smoke_particle", V.add(loc, { x: 0.5, y: 1, z: 0.5 }));
    } catch (err) {
      log("Wellen-Spawn fehlgeschlagen:", mobId, String(err));
    }
  }
  sound(dim, "mob.evocation_illager.prepare_summon", abs(st, r.min), 0.8, 1);
}
function openDoor(def, st, roomIdx) {
  const r = layout(def)[roomIdx];
  const dim = world12.getDimension("minecraft:overworld");
  const air = perm("minecraft:air");
  if (!air) return;
  const zmin = def.tower ? -10 : r.door.min.z;
  const zmax = def.tower ? -2 : r.door.max.z;
  for (let x = r.door.min.x; x <= r.door.max.x; x++)
    for (let y = r.door.min.y; y <= r.door.max.y; y++)
      for (let z = zmin; z <= zmax; z++) {
        const loc = abs(st, { x, y, z });
        try {
          const blk = dim.getBlock(loc);
          if (blk?.typeId === "cdw:barriere") {
            blk.setPermutation(air);
            if ((x + y + z) % 2 === 0) particle(dim, "minecraft:villager_happy", V.add(loc, { x: 0.5, y: 0.5, z: 0.5 }));
          }
        } catch {
        }
      }
  sound(dim, "random.door_open", abs(st, r.door.min), 0.6, 1);
}
function closeDoors(def, st, fromRoom) {
  const dim = world12.getDimension("minecraft:overworld");
  const bar2 = perm("cdw:barriere");
  if (!bar2) return;
  layout(def).forEach((r, i) => {
    if (i < fromRoom || r.kind === "heart") return;
    const zmin = def.tower ? -10 : r.door.min.z;
    const zmax = def.tower ? -2 : r.door.max.z;
    for (let x = r.door.min.x; x <= r.door.max.x; x++)
      for (let y = r.door.min.y; y <= r.door.max.y; y++)
        for (let z = zmin; z <= zmax; z++) {
          try {
            dim.getBlock(abs(st, { x, y, z }))?.setPermutation(bar2);
          } catch {
          }
        }
  });
}
function roomCleared(def, st, roomIdx) {
  st.stage = roomIdx + 1;
  markWorldDirty();
  active.delete(def.id);
  openDoor(def, st, roomIdx);
  const dim = world12.getDimension("minecraft:overworld");
  for (const p of dim.getPlayers({ location: abs(st, layout(def)[roomIdx].min), maxDistance: 60 })) {
    title(p, "\xA7aRaum ges\xE4ubert", "\xA77Der Weg ist frei", 5, 30, 10);
    sound(p, "random.levelup", void 0, 1.4, 0.6);
  }
  const rooms = layout(def);
  const bossIdx = rooms.findIndex((r) => r.kind === "boss");
  if (roomIdx === bossIdx - 1) emit("flag", { key: `dungeon:${def.id}:rooms` });
}
function bossLoc(def, st) {
  return abs(st, bossCenter(def));
}
function tickDungeon(def, st) {
  const dim = world12.getDimension("minecraft:overworld");
  const near = dim.getPlayers({ location: { x: st.x, y: st.y, z: st.z - 50 }, maxDistance: 140 });
  if (!near.length) return;
  const rooms = layout(def);
  const heroic = (st.heroic ?? 0) > 0 && st.data?.heroicActive === 1;
  const act = active.get(def.id);
  if (act) {
    const left = dim.getEntities({ tags: [act.tag] }).length;
    if (left === 0) {
      if (act.wave + 1 < act.waves) {
        act.wave++;
        spawnWave(def, st, act.room, act.wave, heroic);
        for (const p of near) title(p, "", `\xA7cWelle ${act.wave + 1}/${act.waves}`, 2, 20, 5);
      } else roomCleared(def, st, act.room);
    }
    return;
  }
  const idx = st.stage;
  const r = rooms[idx];
  if (!r) return;
  const inside = near.filter((p) => inBox(p.location, st, r));
  if (!inside.length) return;
  if (r.kind === "wave") {
    const tag = tagFor(def.id, idx);
    const existing = dim.getEntities({ tags: [tag] }).length;
    active.set(def.id, { room: idx, tag, waves: idx >= 2 ? 3 : 2, wave: 0 });
    if (!existing) spawnWave(def, st, idx, 0, heroic);
    for (const p of inside) title(p, "\xA7cHinterhalt!", "\xA77Besiege alle Gegner", 5, 30, 10);
  } else if (r.kind === "boss" && !st.boss) {
    const tag = tagFor(def.id, idx);
    const existing = dim.getEntities({ tags: [tag] });
    active.set(def.id, { room: idx, tag, waves: 1, wave: 0 });
    if (!existing.length) {
      closeDoorBehind(def, st, idx);
      startBoss(def.boss, bossLoc(def, st), tag, heroic, () => onBossDefeated(def, st, idx, heroic));
    }
  } else if (r.kind === "boss" && st.boss) {
    if (st.stage === idx) roomCleared(def, st, idx);
  }
}
function closeDoorBehind(def, st, idx) {
  const rooms = layout(def);
  const prev = rooms[idx - 1];
  if (!prev || def.tower) return;
  const dim = world12.getDimension("minecraft:overworld");
  const bar2 = perm("cdw:barriere");
  if (!bar2) return;
  for (let x = prev.door.min.x; x <= prev.door.max.x; x++)
    for (let y = prev.door.min.y; y <= prev.door.max.y; y++) {
      const loc = abs(st, { x, y, z: prev.door.min.z });
      try {
        if (dim.getPlayers({ location: V.add(loc, { x: 0.5, y: 0, z: 0.5 }), maxDistance: 1.5 }).length) continue;
        dim.getBlock(loc)?.setPermutation(bar2);
      } catch {
      }
    }
}
function onBossDefeated(def, st, idx, heroic) {
  if (heroic) {
    st.data ??= {};
    st.data.heroicActive = 0;
    markWorldDirty();
    for (const p of players()) {
      const d = pdata(p);
      d.stats.heroic = (d.stats.heroic ?? 0) + 1;
      markDirty(p);
      emit("flag", { key: "heroic_boss", player: p });
    }
    active.delete(def.id);
    if (idx > 0) openDoor(def, st, idx - 1);
    openDoor(def, st, idx);
    return;
  }
  st.boss = true;
  markWorldDirty();
  if (idx > 0) openDoor(def, st, idx - 1);
  roomCleared(def, st, idx);
}
function onRuneStone(p, loc) {
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st?.built || !st.data) continue;
    let k = -1;
    for (let i = 0; i < 4; i++) if (st.x + st.data[`r${i}x`] === Math.floor(loc.x) && st.z + st.data[`r${i}z`] === Math.floor(loc.z) && Math.abs(st.y + st.data[`r${i}y`] - Math.floor(loc.y)) <= 1) k = i;
    if (k < 0) continue;
    const rooms = layout(def);
    const puzzleIdx = rooms.findIndex((r) => r.kind === "puzzle");
    if (st.stage !== puzzleIdx) {
      p.sendMessage("\xA77Der Runenstein schweigt.");
      return;
    }
    const next = st.data.puzzle ?? 0;
    const dim = p.dimension;
    if (k === next) {
      st.data.puzzle = next + 1;
      setRuneLit(dim, { x: st.x + st.data[`r${k}x`], y: st.y + st.data[`r${k}y`], z: st.z + st.data[`r${k}z`] }, true);
      sound(dim, "block.bell.hit", loc, 1 + k * 0.2, 1);
      if (st.data.puzzle >= 4) {
        st.data.puzzle = 0;
        for (const pl of dim.getPlayers({ location: loc, maxDistance: 40 })) title(pl, "\xA7aR\xE4tsel gel\xF6st", "\xA77Die Runen leuchten", 5, 40, 10);
        roomCleared(def, st, puzzleIdx);
      }
    } else {
      st.data.puzzle = 0;
      for (let i = 0; i < 4; i++) setRuneLit(dim, { x: st.x + st.data[`r${i}x`], y: st.y + st.data[`r${i}y`], z: st.z + st.data[`r${i}z`] }, false);
      p.sendMessage("\xA7cFalsche Reihenfolge! Die Runen erl\xF6schen\u2026 \xA77(Tipp: Z\xE4hle die Kerzen neben den Steinen.)");
      sound(dim, "random.fizz", loc, 0.8, 1);
      for (let i = 0; i < 2; i++) {
        try {
          const e = dim.spawnEntity(`cdw:${pick(def.mobs)}`, V.add(loc, { x: rand(-3, 3), y: 0, z: rand(-3, 3) }));
          e.setDynamicProperty("cdw:l", def.level);
          assignLevel(e);
        } catch {
        }
      }
    }
    markWorldDirty();
    return;
  }
}
function setRuneLit(dim, loc, lit) {
  try {
    const b = dim.getBlock(loc);
    if (b?.typeId === "cdw:runenstein") b.setPermutation(BlockPermutation2.resolve("cdw:runenstein", { "cdw:lit": lit }));
  } catch {
  }
}
async function onHeart(p, loc) {
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st?.built) continue;
    const h = abs(st, heartPos(def));
    if (V.dist(h, loc) > 2) continue;
    if (st.heart) {
      p.sendMessage("\xA7aDas Wurzelherz schl\xE4gt kr\xE4ftig und warm.");
      return;
    }
    if (!st.boss) {
      p.sendMessage("\xA75Eine finstere Macht sch\xFCtzt das Herz noch\u2026");
      return;
    }
    if (def.id === "seufzermoor" && !wdata().morgra) {
      const sel = await choice(p, { s: "erzaehler", t: "Der Fluch auf dem Herzen ist mit Morgra verbunden. Du kannst die Kraft des Herzens nutzen, um sie zu \xA7aerl\xF6sen\xA7f \u2013 oder den Fluch mit ihr zusammen \xA7cverbannen\xA7f und seine Macht f\xFCr dich beanspruchen." }, ["\xA7aMorgra erl\xF6sen\n\xA77Sie wird frei sein", "\xA7cDen Fluch verbannen\n\xA77Morgra verschwindet mit ihm"]);
      if (sel === void 0) return;
      wdata().morgra = sel === 0 ? "free" : "banish";
      markWorldDirty();
      emit("flag", { key: "choice:morgra", player: p });
      if (sel === 0) broadcast("\xA7a\u2726 Morgra wurde erl\xF6st. Man munkelt, sie habe sich im Hain niedergelassen.");
      else broadcast("\xA7c\u2726 Der Fluch wurde verbannt \u2013 und mit ihm die Hexe des Moors.");
      for (const pl of players()) {
        try {
          giveItem(pl, new ItemStack4(sel === 0 ? "cdw:talisman_weisheit" : "cdw:talisman_macht", 1));
        } catch {
        }
      }
    }
    st.heart = true;
    markWorldDirty();
    try {
      p.dimension.getBlock(h)?.setPermutation(BlockPermutation2.resolve("cdw:wurzelherz", { "cdw:purified": true }));
    } catch {
    }
    for (let r = 1; r < 8; r++) system14.runTimeout(() => ring(p.dimension, "minecraft:totem_particle", h, r, r * 4), r * 4);
    sound(p.dimension, "random.totem", h, 1, 1);
    for (const pl of players()) title(pl, "\xA76Wurzelherz gereinigt", `\xA7f${def.name}`, 10, 60, 20);
    emit("flag", { key: `heart:${def.id}`, player: p });
    return;
  }
}
function startHeroic(id) {
  const def = dungeonDef(id);
  const st = wdata().dungeons[id];
  if (!def || !st?.built || !st.heart) return "Dieser Wurzelpfad ist noch nicht gereinigt.";
  const day = Math.floor(Date.now() / 864e5);
  st.data ??= {};
  if (st.data.heroicDay === day) return "Dieser Wurzelpfad wurde heute bereits heroisch bezwungen. Morgen wieder!";
  st.data.heroicDay = day;
  st.data.heroicActive = 1;
  st.heroic = Date.now();
  st.stage = 0;
  st.data.puzzle = 0;
  markWorldDirty();
  active.delete(id);
  const dim = world12.getDimension("minecraft:overworld");
  try {
    if (dim.isChunkLoaded({ x: st.x, y: st.y, z: st.z })) closeDoors(def, st, 0);
  } catch {
  }
  st.data.needsDoors = 1;
  return void 0;
}
function dungeonPos(id) {
  const st = ensureLocation(id);
  if (!st) return void 0;
  return { x: st.x, y: st.y + 1, z: st.z };
}
function initDungeons() {
  system14.runInterval(() => {
    for (const def of DUNGEONS) {
      const st = wdata().dungeons[def.id];
      if (!st) continue;
      try {
        if (!st.built) {
          for (const p of players()) {
            if (p.dimension.id === "minecraft:overworld" && V.dist2d(p.location, st) < 90) {
              buildDungeon(def, st);
              break;
            }
          }
          continue;
        }
        if (st.data?.needsDoors) {
          const dim = world12.getDimension("minecraft:overworld");
          if (dim.getPlayers({ location: st, maxDistance: 64 }).length) {
            closeDoors(def, st, 0);
            st.data.needsDoors = 0;
            markWorldDirty();
          }
        }
        tickDungeon(def, st);
      } catch (e) {
        log("Dungeon-Tick:", def.id, String(e));
      }
    }
  }, 10);
}

// src/ui/classpick.ts
import { ItemStack as ItemStack5 } from "@minecraft/server";
function giveRunes(p, onlyMissing = true) {
  const d = pdata(p);
  const lvl = stats(p).level;
  let n = 0;
  const inv = p.getComponent("minecraft:inventory");
  const have = /* @__PURE__ */ new Set();
  if (inv && onlyMissing) for (let i = 0; i < inv.container.size; i++) {
    const it = inv.container.getItem(i);
    if (it) have.add(it.typeId);
  }
  for (const a of ABILITIES) {
    if (a.cls !== d.cls || a.level > lvl) continue;
    const id = `cdw:rune_${a.id}`;
    if (have.has(id)) continue;
    const it = new ItemStack5(id, 1);
    it.keepOnDeath = true;
    giveItem(p, it);
    n++;
  }
  return n;
}
function removeForeignRunes(p) {
  const d = pdata(p);
  const inv = p.getComponent("minecraft:inventory");
  if (!inv) return;
  for (let i = 0; i < inv.container.size; i++) {
    const it = inv.container.getItem(i);
    if (!it?.typeId.startsWith("cdw:rune_")) continue;
    const a = ABILITIES.find((x) => `cdw:rune_${x.id}` === it.typeId);
    if (a && a.cls !== d.cls) inv.container.setItem(i, void 0);
  }
}
async function openClassPick(p, change = false) {
  const d = pdata(p);
  if (d.cls && !change) return;
  await menu(
    p,
    "\xA76W\xE4hle deinen Weg",
    "\xA77Jede Klasse spielt sich anders. Ihr k\xF6nnt als Gruppe verschiedene Klassen w\xE4hlen \u2013 sie erg\xE4nzen sich!\n ",
    CLASSES.map((c) => ({
      text: `${c.color}\xA7l${c.name}\xA7r
\xA78${c.role}`,
      icon: `textures/cdw/ui/class_${c.id}`,
      action: async () => {
        const ok = await confirm(p, `${c.color}${c.name}`, `\xA7f${c.desc}

\xA77Waffen: \xA7f${c.weapons.join(", ").replace("zweihaender", "Zweih\xE4nder").replace("waldlaeufer", "")}
\xA77Startf\xE4higkeit: \xA7d${ABILITIES.find((a) => a.cls === c.id && a.level === 1)?.name}

\xA7eDiese Klasse w\xE4hlen?`, "\xA7aW\xE4hlen", "\xA77Zur\xFCck");
        if (!ok) {
          await openClassPick(p, change);
          return;
        }
        setClass(p, c.id, !change);
      }
    }))
  );
  if (!pdata(p).cls) msg(p, "\xA77Du kannst deine Klasse jederzeit im Abenteuerbuch w\xE4hlen.");
}
function setClass(p, cls, starter) {
  const d = pdata(p);
  d.cls = cls;
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  setMana(p, stats(p).maxMana);
  removeForeignRunes(p);
  giveRunes(p);
  const c = classById(cls);
  if (starter) {
    giveItem(p, createGear(`cdw:${c.starter}`, 1));
  }
  title(p, `${c.color}${c.name}`, "\xA77Dein Weg beginnt", 10, 50, 15);
  sound(p, "random.totem", void 0, 1.2, 0.6);
  msg(p, `\xA7a\u2726 Du bist jetzt ${c.color}${c.name}\xA7a. \xA77Lege die Rune in die Schnellleiste und benutze sie!`);
  emit("flag", { key: "class_chosen", player: p });
}

// src/world/hub.ts
import { system as system15, world as world14 } from "@minecraft/server";

// src/world/npcs.ts
import { world as world13 } from "@minecraft/server";
function npcHome(id) {
  const f = wdata().flags;
  if (f[`npc_${id}_x`] === void 0) return void 0;
  return { x: f[`npc_${id}_x`], y: f[`npc_${id}_y`], z: f[`npc_${id}_z`], d: f[`npc_${id}_nether`] ? "minecraft:nether" : "minecraft:overworld" };
}
function setHome(id, loc) {
  const f = wdata().flags;
  f[`npc_${id}_x`] = Math.floor(loc.x) + 0.5;
  f[`npc_${id}_y`] = Math.floor(loc.y);
  f[`npc_${id}_z`] = Math.floor(loc.z) + 0.5;
  markWorldDirty();
}
function npcIdOf(e) {
  for (const t of e.getTags()) if (t.startsWith("cdw_npc:")) return t.slice(8);
  return void 0;
}
function findNpcs(id) {
  const out = [];
  for (const dimId of ["minecraft:overworld"]) {
    try {
      for (const e of world13.getDimension(dimId).getEntities({ type: "cdw:npc", tags: [`cdw_npc:${id}`] })) out.push(e);
    } catch {
    }
  }
  return out;
}
function spawnNpc(id, loc, dimId = "minecraft:overworld") {
  const def = npcById(id);
  if (!def) return void 0;
  setHome(id, loc);
  for (const e of findNpcs(id)) {
    try {
      e.remove();
    } catch {
    }
  }
  try {
    const dim = world13.getDimension(dimId);
    const e = dim.spawnEntity("cdw:npc", loc);
    e.addTag(`cdw_npc:${id}`);
    e.setProperty("cdw:variant", def.variant);
    e.nameTag = `\xA7a${def.name}
\xA77${def.title}`;
    return e;
  } catch (err) {
    log("NPC-Spawn fehlgeschlagen:", id, String(err));
    return void 0;
  }
}
function despawnNpc(id) {
  for (const e of findNpcs(id)) {
    try {
      e.remove();
    } catch {
    }
  }
}
function maintainNpcs() {
  for (const n of NPCS) {
    const home = npcHome(n.id);
    if (!home) continue;
    const dim = world13.getDimension(home.d);
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
      if (dim.getPlayers({ location: home, maxDistance: 48 }).length) spawnNpc(n.id, home, home.d);
      continue;
    }
    for (let i = 1; i < list.length; i++) list[i].remove();
    const e = list[0];
    if (V.dist(e.location, home) > 3) e.teleport(home);
  }
}
function setNpcGone(id, gone) {
  wdata().flags[`npc_${id}_gone`] = gone ? 1 : 0;
  markWorldDirty();
  if (gone) despawnNpc(id);
}
function lookAtPlayer(npc, p) {
  try {
    npc.lookAt(p.getHeadLocation());
  } catch {
  }
}

// src/world/hub.ts
var LEAF = (id) => ({ id, states: { persistent_bit: true } });
var LEAVES = [
  { b: LEAF("minecraft:azalea_leaves"), w: 5 },
  { b: LEAF("minecraft:azalea_leaves_flowered"), w: 3 }
];
var LEAVES_BLOOM = [
  { b: LEAF("minecraft:cherry_leaves"), w: 5 },
  { b: LEAF("minecraft:azalea_leaves_flowered"), w: 3 },
  { b: "minecraft:shroomlight", w: 0.4 }
];
var BARK = { id: "minecraft:oak_wood", states: { pillar_axis: "y" } };
var PATH = [
  { b: "minecraft:grass_path", w: 6 },
  { b: "minecraft:coarse_dirt", w: 1 },
  { b: "minecraft:mossy_cobblestone", w: 1 }
];
var stair = (id, dir, upside = false) => ({ id, states: { weirdo_direction: dir, upside_down_bit: upside } });
function hubPos() {
  const h = wdata().hub;
  return h ? { x: h.x, y: h.y, z: h.z } : void 0;
}
var HUB_SPOTS = {
  sylva: { x: 0, y: 1, z: -7 },
  fennick: { x: 13, y: 1, z: 3 },
  kael: { x: 9, y: 1, z: 14 },
  brom: { x: -13, y: 1, z: 9 },
  mira: { x: 13, y: 1, z: -11 },
  oswin: { x: -12, y: 1, z: -12 },
  morgra: { x: 16, y: 1, z: -2 },
  waystone: { x: -6, y: 1, z: 15 },
  board: { x: 4, y: 1, z: 15 },
  altar: { x: 0, y: 1, z: -16 }
};
function treeParams(stage) {
  const t = [
    { h: 7, r: 0.6, crown: 3.2, branches: 0 },
    { h: 11, r: 1.1, crown: 4.2, branches: 3 },
    { h: 14, r: 1.5, crown: 5.2, branches: 4 },
    { h: 17, r: 1.9, crown: 6, branches: 5 },
    { h: 21, r: 2.3, crown: 7, branches: 6 },
    { h: 25, r: 2.8, crown: 8, branches: 7 }
  ];
  return t[Math.max(0, Math.min(5, stage))];
}
function buildTree(b, stage) {
  const t = treeParams(stage);
  const leaves = stage >= 5 ? LEAVES_BLOOM : LEAVES;
  for (let i = 0; i < 6 + stage; i++) {
    const a = i / (6 + stage) * Math.PI * 2 + b.rnd() * 0.4;
    const len = 2 + t.r * 2 + b.rnd() * 2;
    b.line({ x: 0, y: 1, z: 0 }, { x: Math.round(Math.cos(a) * len), y: 0, z: Math.round(Math.sin(a) * len) }, BARK);
  }
  b.cyl(0, 0, 0, t.r, t.h, BARK);
  for (let i = 0; i < t.branches; i++) {
    const a = i / t.branches * Math.PI * 2 + b.rnd();
    const sy = Math.round(t.h * (0.55 + b.rnd() * 0.3));
    const len = t.crown * 0.9 + b.rnd() * 2;
    const end = { x: Math.round(Math.cos(a) * len), y: sy + 2 + Math.round(b.rnd() * 3), z: Math.round(Math.sin(a) * len) };
    b.line({ x: 0, y: sy, z: 0 }, end, BARK);
    b.blob(end.x, end.y + 1, end.z, t.crown * 0.55, t.crown * 0.4, t.crown * 0.55, leaves, 0.8);
  }
  b.blob(0, t.h + 1, 0, t.crown, t.crown * 0.7, t.crown, leaves, 0.85);
  if (stage >= 2) for (let i = 0; i < stage * 2; i++) b.set(Math.round((b.rnd() - 0.5) * t.crown * 1.6), t.h - 1 + Math.round(b.rnd() * 2), Math.round((b.rnd() - 0.5) * t.crown * 1.6), "minecraft:ochre_froglight");
}
function lamp(b, x, z) {
  b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
  b.set(x, 3, z, { id: "minecraft:lantern", states: { hanging: false } });
}
function house(b, cx, cz, w, d, h, door, wood = "spruce", wall = "minecraft:white_terracotta") {
  const x1 = cx - Math.floor(w / 2);
  const x2 = x1 + w - 1;
  const z1 = cz - Math.floor(d / 2);
  const z2 = z1 + d - 1;
  b.box(x1, 0, z1, x2, 0, z2, "minecraft:cobblestone");
  b.box(x1, 1, z1, x2, h, z2, wall);
  b.box(x1 + 1, 1, z1 + 1, x2 - 1, h, z2 - 1, "minecraft:air");
  b.box(x1 + 1, 0, z1 + 1, x2 - 1, 0, z2 - 1, `minecraft:${wood}_planks`);
  for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) b.box(x, 1, z, x, h, z, { id: `minecraft:${wood}_log`, states: { pillar_axis: "y" } });
  b.box(x1, h, z1, x2, h, z1, { id: `minecraft:${wood}_log`, states: { pillar_axis: "x" } });
  b.box(x1, h, z2, x2, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "x" } });
  b.box(x1, h, z1, x1, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "z" } });
  b.box(x2, h, z1, x2, h, z2, { id: `minecraft:${wood}_log`, states: { pillar_axis: "z" } });
  const glass = "minecraft:glass_pane";
  if (w >= 5) {
    b.set(cx - 1, 2, z1, glass).set(cx + 1, 2, z1, glass).set(cx - 1, 2, z2, glass).set(cx + 1, 2, z2, glass);
  }
  if (d >= 5) {
    b.set(x1, 2, cz - 1, glass).set(x1, 2, cz + 1, glass).set(x2, 2, cz - 1, glass).set(x2, 2, cz + 1, glass);
  }
  const dx = door === "e" ? x2 : door === "w" ? x1 : cx;
  const dz = door === "s" ? z2 : door === "n" ? z1 : cz;
  b.box(dx, 1, dz, dx, 2, dz, "minecraft:air");
  const stairs = `minecraft:${wood}_stairs`;
  const half = Math.ceil(d / 2);
  for (let i = 0; i <= half; i++) {
    const y = h + 1 + i;
    const za = z1 - 1 + i;
    const zb = z2 + 1 - i;
    if (za >= zb) {
      b.box(x1 - 1, y, za, x2 + 1, y, za, `minecraft:${wood}_planks`);
      break;
    }
    b.box(x1 - 1, y, za, x2 + 1, y, za, stair(stairs, 2));
    b.box(x1 - 1, y, zb, x2 + 1, y, zb, stair(stairs, 3));
    if (zb - za > 1) {
      b.box(x1, y, za + 1, x1, y, zb - 1, wall);
      b.box(x2, y, za + 1, x2, y, zb - 1, wall);
    }
  }
  b.set(cx, h - 1, cz, { id: "minecraft:lantern", states: { hanging: true } });
}
function buildBase(b, y0) {
  const R = 21;
  for (let y = 1; y <= 34; y++) b.disc(0, y, 0, R, "minecraft:air");
  for (let y = -4; y <= -1; y++) b.disc(0, y, 0, R + (y + 4) * 0, "minecraft:dirt");
  b.disc(0, 0, 0, R, "minecraft:grass_block");
  b.box(-1, 0, -R, 1, 0, R, PATH);
  b.box(-R, 0, -1, R, 0, 1, PATH);
  for (let a = 0; a < 64; a++) {
    const ang = a / 64 * Math.PI * 2;
    const x = Math.round(Math.cos(ang) * 11);
    const z = Math.round(Math.sin(ang) * 11);
    b.box(x, 0, z, x, 0, z, PATH);
  }
  b.disc(0, 0, 0, 5, [{ b: "minecraft:moss_block", w: 4 }, { b: "minecraft:mossy_cobblestone", w: 1 }]);
  for (const [x, z] of [[3, 9], [-3, 9], [3, -9], [-3, -9], [9, 3], [9, -3], [-9, 3], [-9, -3], [3, 19], [-3, 19]]) lamp(b, x, z);
  const flowers = ["minecraft:poppy", "minecraft:dandelion", "minecraft:cornflower", "minecraft:oxeye_daisy", "minecraft:allium", "minecraft:azure_bluet", "minecraft:lily_of_the_valley"];
  for (let i = 0; i < 70; i++) {
    const a = b.rnd() * Math.PI * 2;
    const r = 6 + b.rnd() * 14;
    const x = Math.round(Math.cos(a) * r);
    const z = Math.round(Math.sin(a) * r);
    if (Math.abs(x) <= 1 || Math.abs(z) <= 1 || Math.abs(Math.sqrt(x * x + z * z) - 11) < 1) continue;
    b.set(x, 1, z, flowers[Math.floor(b.rnd() * flowers.length)]);
  }
  for (const x of [-3, 3]) b.box(x, 1, R - 1, x, 4, R - 1, { id: "minecraft:oak_log", states: { pillar_axis: "y" } });
  b.box(-3, 5, R - 1, 3, 5, R - 1, { id: "minecraft:oak_log", states: { pillar_axis: "x" } });
  b.blob(0, 6, R - 1, 4, 1.2, 1.2, LEAVES, 0.9);
  b.disc(0, 0, -7, 2.5, "minecraft:mossy_stone_bricks");
  for (const [x, z] of [[-2, -9], [2, -9]]) {
    b.box(x, 1, z, x, 3, z, "minecraft:mossy_stone_brick_wall");
    b.set(x, 4, z, "minecraft:ochre_froglight");
  }
  b.box(11, 0, 1, 15, 0, 5, "minecraft:spruce_planks");
  for (const [x, z] of [[11, 1], [15, 1], [11, 5], [15, 5]]) b.box(x, 1, z, x, 3, z, "minecraft:spruce_fence");
  b.box(11, 4, 1, 15, 4, 5, [{ b: "minecraft:red_wool", w: 1 }, { b: "minecraft:white_wool", w: 1 }]);
  b.box(12, 1, 1, 14, 1, 1, "minecraft:barrel");
  b.set(15, 1, 3, "minecraft:chest");
  b.disc(-6, 0, 15, 2, "minecraft:polished_andesite");
  b.disc(4, 0, 15, 1.5, "minecraft:polished_andesite");
}
function buildStage(b, stage) {
  if (stage >= 1) {
    house(b, -14, 13, 7, 7, 4, "e", "dark_oak", [{ b: "minecraft:stone_bricks", w: 4 }, { b: "minecraft:cracked_stone_bricks", w: 1 }]);
    b.set(-11, 1, 9, "minecraft:anvil").set(-12, 1, 9, "minecraft:blast_furnace").set(-12, 1, 10, "minecraft:grindstone");
    b.box(-13, 1, 8, -13, 2, 8, "minecraft:cobblestone_wall");
    b.set(-13, 3, 8, { id: "minecraft:campfire", states: { extinguished: false } });
    b.disc(9, 0, 14, 3, "minecraft:coarse_dirt");
    b.set(9, 1, 12, { id: "minecraft:campfire", states: { extinguished: false } });
    for (const [x, z] of [[7, 15], [11, 15]]) b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
    b.box(7, 3, 15, 11, 3, 16, "minecraft:green_wool");
    b.set(10, 1, 16, "minecraft:target");
  }
  if (stage >= 2) {
    house(b, 14, -12, 7, 6, 4, "w", "birch", "minecraft:white_terracotta");
    b.set(11, 1, -12, "minecraft:brewing_stand").set(12, 1, -14, "minecraft:cauldron").set(16, 1, -10, "minecraft:flower_pot");
    for (let i = 0; i < 8; i++) b.set(9 + Math.round(b.rnd() * 7), 1, -17 + Math.round(b.rnd() * 2), "minecraft:sweet_berry_bush");
  }
  if (stage >= 3) {
    house(b, -13, -13, 8, 7, 6, "e", "oak", [{ b: "minecraft:mossy_stone_bricks", w: 2 }, { b: "minecraft:stone_bricks", w: 3 }]);
    b.box(-16, 1, -16, -10, 3, -16, "minecraft:bookshelf");
    b.set(-11, 1, -13, "minecraft:lectern").set(-14, 1, -11, "minecraft:enchanting_table");
  }
  if (stage >= 4) {
    for (const [x, z] of [[-18, 0], [18, 0], [0, 18]]) b.blob(x, 2, z, 2, 2, 2, LEAVES, 0.8);
    b.box(-8, 1, 6, -6, 1, 8, "minecraft:flowering_azalea");
    b.box(6, 1, -8, 8, 1, -6, "minecraft:flowering_azalea");
  }
  if (stage >= 5) {
    b.disc(0, 0, -16, 3, "minecraft:chiseled_stone_bricks");
    b.box(-1, 1, -17, 1, 1, -15, "minecraft:polished_deepslate");
  }
}
function placeNpcs(stage, origin) {
  for (const n of NPCS) {
    if (n.stage > stage) continue;
    if (n.id === "morgra" && wdata().morgra !== "free") continue;
    if (n.id === "kael" && wdata().flags.kael_away) continue;
    const spot = HUB_SPOTS[n.id];
    if (!spot) continue;
    const loc = V.add(origin, { x: spot.x + 0.5, y: spot.y, z: spot.z + 0.5 });
    spawnNpc(n.id, loc, "minecraft:overworld");
  }
}
function placeBlocksForStage(b, stage) {
  const w = HUB_SPOTS.waystone;
  b.box(w.x, 0, w.z, w.x, 0, w.z, "minecraft:polished_andesite");
  b.set(w.x, 1, w.z, "cdw:wegstein");
  const bd = HUB_SPOTS.board;
  b.set(bd.x, 1, bd.z, "cdw:kopfgeldbrett");
  if (stage >= 5) b.set(HUB_SPOTS.altar.x, 2, HUB_SPOTS.altar.z, "cdw:altar");
}
async function plantHub(p, loc) {
  const w = wdata();
  if (w.hub) {
    p.sendMessage("\xA7cDer Hain wurde bereits gepflanzt.");
    return false;
  }
  if (p.dimension.id !== "minecraft:overworld") {
    p.sendMessage("\xA7cDer Samen will in der Oberwelt wachsen.");
    return false;
  }
  const origin = V.floor(loc);
  w.hub = { x: origin.x, y: origin.y, z: origin.z, stage: 0, building: true };
  markWorldDirty();
  for (const pl of players()) title(pl, "\xA7aDer Samen keimt\u2026", "\xA77Etwas Uraltes erwacht", 10, 80, 20);
  sound(p.dimension, "block.beehive.enter", origin, 0.5, 1);
  await buildHub(0, true);
  return true;
}
var building = false;
async function buildHub(stage, full) {
  const w = wdata();
  const h = w.hub;
  if (!h || building) return;
  building = true;
  const dim = world14.getDimension("minecraft:overworld");
  const origin = { x: h.x, y: h.y, z: h.z };
  const protect = () => {
    for (const p of dim.getPlayers({ location: origin, maxDistance: 34 })) {
      try {
        p.addEffect("slow_falling", 400, { showParticles: false });
        p.addEffect("resistance", 400, { amplifier: 4, showParticles: false });
      } catch {
      }
    }
  };
  protect();
  try {
    await withLoadedArea("hub", dim, V.add(origin, { x: -24, y: -5, z: -24 }), V.add(origin, { x: 24, y: 40, z: 24 }), () => {
      return new Promise((resolve2) => {
        const b = new Builder(dim, origin, origin.x * 31 + origin.z * 17 + stage);
        if (full) buildBase(b, origin.y);
        else {
          b.cyl(0, 1, 0, 9, 34, "minecraft:air");
          b.disc(0, 0, 0, 5, [{ b: "minecraft:moss_block", w: 4 }, { b: "minecraft:mossy_cobblestone", w: 1 }]);
        }
        buildStage(b, stage);
        buildTree(b, stage);
        placeBlocksForStage(b, stage);
        b.then(() => {
          protect();
          for (const p of dim.getPlayers({ location: origin, maxDistance: 24 })) {
            if (Math.abs(p.location.y - (origin.y + 1)) > 2) {
              try {
                p.teleport({ x: origin.x + 0.5, y: origin.y + 1, z: origin.z + 4.5 });
              } catch {
              }
            }
          }
          placeNpcs(stage, origin);
          registerWaystone("hub", { x: origin.x + HUB_SPOTS.waystone.x, y: origin.y + 1, z: origin.z + HUB_SPOTS.waystone.z }, "minecraft:overworld", "Hain des Erwachens");
          for (let i = 0; i < 30; i++) particle(dim, "minecraft:totem_particle", V.add(origin, { x: (Math.random() - 0.5) * 16, y: 2 + Math.random() * 10, z: (Math.random() - 0.5) * 16 }));
        });
        b.run(() => resolve2(), 60);
      });
    });
  } catch (e) {
    log("Hain-Bau fehlgeschlagen:", String(e));
  }
  h.stage = stage;
  h.building = false;
  markWorldDirty();
  building = false;
}
async function upgradeHub(stage) {
  const h = wdata().hub;
  if (!h || h.stage >= stage) return;
  broadcast(`\xA7a\u2726 Der Hain w\xE4chst! \xA77(Ausbaustufe ${stage})`);
  await buildHub(stage, false);
  setFlag(`hub_stage_${stage}`);
  for (const p of players()) title(p, "\xA7aDer Hain w\xE4chst", `\xA77Ausbaustufe ${stage}`, 10, 60, 20);
}
function resetHubLocation() {
  const w = wdata();
  w.hub = void 0;
  markWorldDirty();
  system15.run(() => {
    for (const e of world14.getDimension("minecraft:overworld").getEntities({ type: "cdw:npc" })) {
      try {
        e.remove();
      } catch {
      }
    }
  });
}

// src/ui/npcmenus.ts
import { system as system17 } from "@minecraft/server";

// src/ui/shop.ts
import { EquipmentSlot as EquipmentSlot5, ItemStack as ItemStack6 } from "@minecraft/server";
var SHOPS = {
  fennick: {
    title: "\xA7eFennicks Waren",
    offers: [
      { id: "cdw:heiltrank_klein", n: 1, price: 8 },
      { id: "cdw:manatrank_klein", n: 1, price: 8 },
      { id: "cdw:heiltrank", n: 1, price: 20, rep: 1 },
      { id: "cdw:manatrank", n: 1, price: 20, rep: 1 },
      { id: "cdw:rueckkehrschriftrolle", n: 1, price: 25 },
      { id: "minecraft:bread", n: 8, price: 10 },
      { id: "minecraft:arrow", n: 16, price: 8 },
      { id: "minecraft:torch", n: 16, price: 6 },
      { id: "cdw:runenstaub", n: 1, price: 60, rep: 2 },
      { id: "cdw:mondsilberbarren", n: 1, price: 45, rep: 2 },
      { id: "cdw:talisman_leben", n: 1, price: 900, rep: 3 },
      { id: "cdw:talisman_macht", n: 1, price: 900, rep: 3 },
      { id: "cdw:talisman_wind", n: 1, price: 900, rep: 4 },
      { id: "cdw:wegstein_eigen", n: 1, price: 400, rep: 2 },
      { id: "cdw:beschwoerungsstein", n: 1, price: 2500, rep: 4, minLevel: 45 }
    ]
  },
  mira: {
    title: "\xA7dMiras Alchemie",
    offers: [
      { id: "cdw:heiltrank", n: 1, price: 18 },
      { id: "cdw:manatrank", n: 1, price: 18 },
      { id: "cdw:heiltrank_gross", n: 1, price: 40, rep: 2 },
      { id: "cdw:manatrank_gross", n: 1, price: 40, rep: 2 },
      { id: "cdw:elixier_staerke", n: 1, price: 70, rep: 1 },
      { id: "cdw:elixier_zaehigkeit", n: 1, price: 70, rep: 1 },
      { id: "cdw:elixier_eile", n: 1, price: 50 },
      { id: "cdw:elixier_weisheit", n: 1, price: 120, rep: 2 }
    ]
  },
  morgra: {
    title: "\xA75Morgras Gebr\xE4u",
    offers: [
      { id: "cdw:elixier_weisheit", n: 1, price: 90 },
      { id: "cdw:elixier_staerke", n: 1, price: 55 },
      { id: "cdw:manatrank_gross", n: 1, price: 32 },
      { id: "cdw:talisman_weisheit", n: 1, price: 700, rep: 2 },
      { id: "cdw:talisman_waechter", n: 1, price: 900, rep: 3 }
    ]
  }
};
function itemLabel(id) {
  if (id.startsWith("cdw:")) {
    const s2 = simpleItem(id.slice(4));
    if (s2) return s2.name;
    const w = ALL_WEAPONS.find((x) => `cdw:${x.id}` === id);
    if (w) return w.name;
    const a = armorOf(id);
    if (a) return a.set.pieceNames[a.slot];
    if (id === "cdw:wegstein_eigen") return "Eigener Wegstein";
  }
  return id.replace("minecraft:", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function iconFor(id) {
  if (id.startsWith("cdw:")) return `textures/cdw/items/${id.slice(4)}`;
  return void 0;
}
function buyOffer(p, shopId, idx) {
  const o = SHOPS[shopId]?.offers[idx];
  if (!o) return false;
  const price = Math.max(1, Math.round(o.price * (1 - repDiscount(p))));
  if (!spendGold(p, price)) {
    msg(p, "\xA7cNicht genug Gold.");
    sound(p, "note.bass", void 0, 0.7);
    return false;
  }
  giveItem(p, new ItemStack6(o.id, o.n));
  msg(p, `\xA7a+ ${itemLabel(o.id)}${o.n > 1 ? ` \xD7${o.n}` : ""} \xA77(-${price} Gold)`);
  sound(p, "random.orb", void 0, 1.4, 0.8);
  return true;
}
async function openShop(p, shopId) {
  const shop = SHOPS[shopId];
  if (!shop) return;
  const d = pdata(p);
  const rep = repLevel(d.rep);
  const disc = repDiscount(p);
  const lvl = level(p);
  const offers = shop.offers.filter((o) => (o.rep ?? 0) <= rep.idx && (o.minLevel ?? 0) <= lvl);
  const locked = shop.offers.length - offers.length;
  await menu(
    p,
    shop.title,
    `\xA77Dein Gold: \xA7e${fmt(d.gold)}\xA77 \xB7 Ruf: \xA7a${rep.name}${disc > 0 ? ` \xA77(Rabatt ${Math.round(disc * 100)} %)` : ""}${locked ? `
\xA78${locked} weitere Waren bei h\xF6herem Ruf/Stufe` : ""}`,
    offers.map((o) => {
      const price = Math.max(1, Math.round(o.price * (1 - disc)));
      return {
        text: `\xA7f${itemLabel(o.id)}${o.n > 1 ? ` \xD7${o.n}` : ""}
\xA7e${fmt(price)} Gold`,
        icon: iconFor(o.id),
        action: async () => {
          buyOffer(p, shopId, shop.offers.indexOf(o));
          await openShop(p, shopId);
        }
      };
    }),
    { back: void 0 }
  );
}
function sellValue(it) {
  const id = it.typeId;
  const w = weaponOf(id);
  const g = getGear(it);
  if (w) return Math.round(w.value * (1 + (g?.r ?? 0) * 0.8) * (1 + (g?.u ?? 0) * 0.15));
  const a = armorOf(id);
  if (a) return Math.round(a.set.value * (1 + (g?.r ?? 0) * 0.8) * (1 + (g?.u ?? 0) * 0.15));
  const s2 = id.startsWith("cdw:") ? simpleItem(id.slice(4)) : void 0;
  if (s2 && s2.value > 0 && s2.category !== "quest" && s2.category !== "rune") return s2.value * it.amount;
  return 0;
}
async function openSell(p, autoSell = false) {
  const inv = p.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  const entries = [];
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (!it) continue;
    const v = sellValue(it);
    if (v > 0) entries.push({ slot: i, it, v });
  }
  if (!entries.length) {
    msg(p, "\xA77Du hast nichts, was Fennick kaufen w\xFCrde (Ausr\xFCstung, Materialien, Tr\xE4nke).");
    return;
  }
  const total = entries.filter((e) => !isGear(e.it.typeId)).reduce((s2, e) => s2 + e.v, 0);
  if (autoSell) {
    for (const e of entries) if (!isGear(e.it.typeId)) inv.setItem(e.slot, void 0);
    if (total > 0) addGold(p, total, "(Verkauf)", false);
    return;
  }
  const buttons = [];
  if (total > 0)
    buttons.push({
      text: `\xA7aAlle Materialien & Tr\xE4nke verkaufen
\xA7e+${fmt(total)} Gold`,
      action: async () => {
        for (const e of entries) if (!isGear(e.it.typeId)) inv.setItem(e.slot, void 0);
        addGold(p, total, "(Verkauf)", false);
      }
    });
  for (const e of entries.slice(0, 40)) {
    const g = getGear(e.it);
    buttons.push({
      text: `${g ? displayName(e.it.typeId, g) : itemLabel(e.it.typeId)}${e.it.amount > 1 ? ` \xD7${e.it.amount}` : ""}
\xA7e${fmt(e.v)} Gold`,
      icon: iconFor(e.it.typeId),
      action: async () => {
        const cur = inv.getItem(e.slot);
        if (!cur || cur.typeId !== e.it.typeId) return;
        if (g && g.r >= 3 && !await confirm(p, "\xA7cWirklich verkaufen?", `\xA7f${displayName(e.it.typeId, g)}
\xA77ist ${RARITIES[g.r].name}.`)) return;
        inv.setItem(e.slot, void 0);
        addGold(p, e.v, "(Verkauf)", false);
        await openSell(p);
      }
    });
  }
  await menu(p, "\xA7eVerkaufen", `\xA77Dein Gold: \xA7e${fmt(pdata(p).gold)}`, buttons);
}
function heldGear(p) {
  const eq = equippable(p);
  if (!eq) return void 0;
  for (const slot of [EquipmentSlot5.Mainhand, EquipmentSlot5.Chest, EquipmentSlot5.Head, EquipmentSlot5.Legs, EquipmentSlot5.Feet]) {
    const it = eq.getEquipment(slot);
    if (it && isGear(it.typeId)) return { it, slot };
    if (slot === EquipmentSlot5.Mainhand && it) break;
  }
  return void 0;
}
function gearTier(id) {
  const w = weaponOf(id);
  if (w) return w.tier;
  const a = armorOf(id);
  return a ? Math.max(1, Math.round(a.set.reqLevel / 10)) : 1;
}
async function openSmith(p) {
  const d = pdata(p);
  await menu(p, "\xA76Bromse Schmiede", `\xA77Gold: \xA7e${fmt(d.gold)} \xA77\xB7 Runenstaub: \xA7b${countItem(p, "cdw:runenstaub")}
\xA78Nimm die gew\xFCnschte Waffe in die Hand (oder trage die R\xFCstung).`, [
    { text: "\xA7fAusr\xFCstung verbessern\n\xA78+1 Stufe (max. +10)", icon: "textures/cdw/ui/upgrade", action: () => upgradeMenu(p) },
    { text: "\xA7fAlles reparieren\n\xA78Gehaltene & getragene Ausr\xFCstung", icon: "textures/cdw/ui/repair", action: () => repairAll(p) },
    { text: "\xA7fZerlegen\n\xA78Ausr\xFCstung \u2192 Runenstaub", icon: "textures/cdw/ui/salvage", action: () => salvageMenu(p) },
    { text: "\xA7fMondsilber schmelzen\n\xA782 Goldbarren + 1 Frostsplitter", icon: "textures/cdw/items/mondsilberbarren", action: () => smelt(p) }
  ]);
}
async function upgradeMenu(p) {
  const h = heldGear(p);
  if (!h) {
    msg(p, "\xA7cHalte eine Waffe in der Hand oder trage R\xFCstung aus dem Hain.");
    return;
  }
  const g = getGear(h.it) ?? { r: 0, a: {}, u: 0 };
  if (g.u >= UPGRADE_MAX) {
    msg(p, "\xA77Das ist bereits Meisterarbeit (+10).");
    return;
  }
  const d = pdata(p);
  const free = (d.stats.freeUpgrade ?? 0) > 0;
  const cost = upgradeCost(gearTier(h.it.typeId), g.u + 1);
  const ok = await confirm(p, "\xA76Verbessern", `\xA7f${displayName(h.it.typeId, g)} \xA77\u2192 \xA7e+${g.u + 1}

\xA77Kosten: ${free ? "\xA7aKostenlos (Willkommensgeschenk)" : `\xA7e${fmt(cost.gold)} Gold \xA77+ \xA7b${cost.dust} Runenstaub`}
\xA77Effekt: +8 % Waffenschaden bzw. +6 % R\xFCstungswerte`, "\xA7aVerbessern", "\xA77Abbrechen");
  if (!ok) return;
  if (!free) {
    if (countItem(p, "cdw:runenstaub") < cost.dust) {
      msg(p, "\xA7cNicht genug Runenstaub. \xA77(Zerlege Ausr\xFCstung oder besiege starke Gegner.)");
      return;
    }
    if (!spendGold(p, cost.gold)) {
      msg(p, "\xA7cNicht genug Gold.");
      return;
    }
    takeItem(p, "cdw:runenstaub", cost.dust);
  } else {
    d.stats.freeUpgrade = 0;
    markDirty(p);
  }
  g.u++;
  const it = h.it;
  setGear(it, g);
  equippable(p)?.setEquipment(h.slot, it);
  d.stats.maxUpgrade = Math.max(d.stats.maxUpgrade ?? 0, g.u);
  markDirty(p);
  invalidate(p);
  sound(p, "random.anvil_use", void 0, 1, 1);
  msg(p, `\xA7a\u2726 ${displayName(it.typeId, g)} \xA7averbessert!`);
  emit("flag", { key: "upgrade_done", player: p });
}
async function repairAll(p) {
  const eq = equippable(p);
  if (!eq) return;
  let cost = 0;
  const todo = [];
  for (const slot of [EquipmentSlot5.Mainhand, EquipmentSlot5.Offhand, EquipmentSlot5.Head, EquipmentSlot5.Chest, EquipmentSlot5.Legs, EquipmentSlot5.Feet]) {
    const it = eq.getEquipment(slot);
    const dur = it?.getComponent("minecraft:durability");
    if (it && dur && dur.damage > 0) {
      todo.push({ slot, it, dur });
      cost += Math.ceil(dur.damage / 20) * (1 + gearTier(it.typeId));
    }
  }
  if (!todo.length) {
    msg(p, "\xA77Nichts zu reparieren.");
    return;
  }
  if (!await confirm(p, "\xA76Reparieren", `\xA77${todo.length} Gegenst\xE4nde f\xFCr \xA7e${fmt(cost)} Gold\xA77 reparieren?`)) return;
  if (!spendGold(p, cost)) {
    msg(p, "\xA7cNicht genug Gold.");
    return;
  }
  for (const t of todo) {
    t.dur.damage = 0;
    eq.setEquipment(t.slot, t.it);
  }
  sound(p, "random.anvil_use", void 0, 1.2, 0.8);
  msg(p, "\xA7aAlles wie neu.");
}
async function salvageMenu(p) {
  const inv = p.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  const list = [];
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (!it || !isGear(it.typeId)) continue;
    const g = getGear(it);
    list.push({ slot: i, it, dust: 1 + (g?.r ?? 0) + Math.floor(gearTier(it.typeId) / 2) + Math.floor((g?.u ?? 0) / 3) });
  }
  if (!list.length) {
    msg(p, "\xA77Keine Ausr\xFCstung zum Zerlegen im Inventar.");
    return;
  }
  const common = list.filter((l) => (getGear(l.it)?.r ?? 0) <= 1 && (getGear(l.it)?.u ?? 0) === 0);
  const buttons = [];
  if (common.length)
    buttons.push({
      text: `\xA7aAlle gew\xF6hnlichen & ungew\xF6hnlichen zerlegen
\xA7b+${common.reduce((s2, l) => s2 + l.dust, 0)} Runenstaub`,
      action: async () => {
        let n = 0;
        for (const l of common) {
          inv.setItem(l.slot, void 0);
          n += l.dust;
        }
        giveItem(p, new ItemStack6("cdw:runenstaub", n));
        sound(p, "random.break", void 0, 0.8, 1);
      }
    });
  for (const l of list.slice(0, 30))
    buttons.push({
      text: `${displayName(l.it.typeId, getGear(l.it))}
\xA7b+${l.dust} Runenstaub`,
      action: async () => {
        const g = getGear(l.it);
        if (g && (g.r >= 3 || g.u >= 3) && !await confirm(p, "\xA7cWirklich zerlegen?", displayName(l.it.typeId, g))) return;
        inv.setItem(l.slot, void 0);
        giveItem(p, new ItemStack6("cdw:runenstaub", l.dust));
        sound(p, "random.break", void 0, 0.8, 1);
        await salvageMenu(p);
      }
    });
  await menu(p, "\xA76Zerlegen", "\xA77Ausr\xFCstung wird zu Runenstaub (f\xFCr Verbesserungen).", buttons);
}
async function smelt(p) {
  if (!pdata(p).done.includes("b2")) {
    msg(p, "\xA77Brom: \u201EDas Rezept verrate ich dir erst, wenn du mir hilfst.\u201C \xA78(Nebenquest \u201EMondsilber\u201C)");
    return;
  }
  if (countItem(p, "minecraft:gold_ingot") < 2 || countItem(p, "cdw:frostsplitter") < 1) {
    msg(p, "\xA7cBen\xF6tigt 2 Goldbarren und 1 Frostsplitter.");
    return;
  }
  takeItem(p, "minecraft:gold_ingot", 2);
  takeItem(p, "cdw:frostsplitter", 1);
  giveItem(p, new ItemStack6("cdw:mondsilberbarren", 1));
  sound(p, "random.anvil_use", void 0, 1.4, 0.8);
}
async function openForge(p) {
  const d = pdata(p);
  const lvl = level(p);
  const tier = lvl < 10 ? 1 : lvl < 20 ? 2 : lvl < 30 ? 3 : 4;
  const tierName = ["bronze", "stahl", "mondsilber", "runenobsidian"][tier - 1];
  const bars = tier >= 3 ? 3 : 0;
  const gold = 60 * tier * tier;
  const types = (d.cls ? CLASS_WEAPONS[d.cls] : void 0) ?? ["schwert"];
  await menu(
    p,
    "\xA76Waffe schmieden",
    `\xA77Brom schmiedet dir eine Waffe deiner Stufe (\xA7f${tierName}\xA77).
\xA77Kosten: \xA7e${gold} Gold${bars ? ` \xA77+ \xA7f${bars} Mondsilberbarren` : ""} \xA77+ \xA7b${tier} Runenstaub`,
    types.map((t) => ({
      text: `\xA7f${itemLabel(`cdw:${t}_${tierName}`)}`,
      icon: `textures/cdw/items/${t}_${tierName}`,
      action: async () => {
        if (countItem(p, "cdw:runenstaub") < tier || countItem(p, "cdw:mondsilberbarren") < bars) {
          msg(p, "\xA7cMaterial fehlt.");
          return;
        }
        if (!spendGold(p, gold)) {
          msg(p, "\xA7cNicht genug Gold.");
          return;
        }
        takeItem(p, "cdw:runenstaub", tier);
        if (bars) takeItem(p, "cdw:mondsilberbarren", bars);
        giveItem(p, createGear(`cdw:${t}_${tierName}`, 1 + (Math.random() < 0.35 ? 1 : 0)));
        sound(p, "random.anvil_use", void 0, 1, 1);
      }
    }))
  );
}

// src/world/events.ts
import { system as system16, world as world15 } from "@minecraft/server";
function spawnMobAt(id, loc, lvl, tags = []) {
  try {
    const dim = world15.getDimension("minecraft:overworld");
    const s2 = surfaceY(dim, Math.floor(loc.x), Math.floor(loc.z));
    const y = s2 ? s2.y + 1 : loc.y;
    const e = dim.spawnEntity(`cdw:${id}`, { x: loc.x, y, z: loc.z });
    for (const t of tags) e.addTag(t);
    if (lvl !== void 0) e.setDynamicProperty("cdw:l", lvl);
    assignLevel(e);
    particle(dim, "minecraft:large_smoke_particle", { x: loc.x, y: y + 1, z: loc.z });
    return true;
  } catch {
    return false;
  }
}
function spawnAction(mob, n, where, extra) {
  let center;
  if (where === "hub") center = hubPos();
  else if (where === "camp") center = campPos();
  else if (where === "dungeon" && extra) {
    const st = wdata().dungeons[extra];
    if (st) center = { x: st.x, y: st.y, z: st.z };
  }
  if (!center) return;
  const c = center;
  const pending2 = () => {
    const near = players().some((p) => V.dist2d(p.location, c) < 64);
    if (!near) return false;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = where === "hub" ? 14 + Math.random() * 8 : 8 + Math.random() * 10;
      spawnMobAt(mob, { x: c.x + Math.cos(a) * r, y: c.y, z: c.z + Math.sin(a) * r }, void 0, ["cdw_quest"]);
    }
    return true;
  };
  if (!pending2()) {
    const id = system16.runInterval(() => {
      if (pending2()) system16.clearRun(id);
    }, 40);
  }
}
function campPos() {
  const f = wdata().flags;
  if (f.camp_x === void 0) return void 0;
  return { x: f.camp_x, y: f.camp_y, z: f.camp_z };
}
function setupCamp() {
  const hub = hubPos();
  if (!hub || campPos()) return;
  const def = dungeonDef("dornenhain");
  const ang = (def.angle + hub.x % 30) * Math.PI / 180;
  const dist = def.ring * 0.6;
  const f = wdata().flags;
  f.camp_x = Math.round(hub.x + Math.cos(ang) * dist);
  f.camp_z = Math.round(hub.z + Math.sin(ang) * dist);
  f.camp_y = hub.y;
  f.npc_kael_x = f.camp_x + 2.5;
  f.npc_kael_y = hub.y + 1;
  f.npc_kael_z = f.camp_z + 0.5;
  markWorldDirty();
}
function tickCamp() {
  const c = campPos();
  const f = wdata().flags;
  if (!c || f.camp_built) return;
  const dim = world15.getDimension("minecraft:overworld");
  if (!players().some((p) => p.dimension.id === dim.id && V.dist2d(p.location, c) < 72)) return;
  f.camp_built = 1;
  markWorldDirty();
  void withLoadedArea("camp", dim, V.add(c, { x: -8, y: 0, z: -8 }), V.add(c, { x: 8, y: 0, z: 8 }), () => {
    return new Promise((resolve2) => {
      const s2 = surfaceY(dim, c.x, c.z);
      const y = s2?.y ?? c.y;
      f.camp_y = y;
      f.npc_kael_y = y + 1;
      const b = new Builder(dim, { x: c.x, y, z: c.z }, 77);
      b.disc(0, 0, 0, 4, "minecraft:coarse_dirt");
      for (let yy = 1; yy < 6; yy++) b.disc(0, yy, 0, 4, "minecraft:air");
      b.set(0, 1, 0, { id: "minecraft:campfire", states: { extinguished: false } });
      for (const [x, z] of [[-3, -2], [-3, 2], [-1, -2], [-1, 2]]) b.box(x, 1, z, x, 2, z, "minecraft:spruce_fence");
      b.box(-3, 3, -2, -1, 3, 2, "minecraft:green_wool");
      b.set(2, 1, -2, "minecraft:barrel").set(3, 1, 2, { id: "minecraft:spruce_log", states: { pillar_axis: "x" } });
      b.run(() => resolve2(), 40);
    });
  });
}
var DEFENSES = {
  hain: {
    key: "defense:hain",
    level: 3,
    waves: [
      [{ mob: "moosling", n: 5 }],
      [{ mob: "moosling", n: 4 }, { mob: "dornenwolf", n: 2 }],
      [{ mob: "dornenwolf", n: 3 }, { mob: "rindenschreck_setzling", n: 1 }]
    ]
  },
  final: {
    key: "defense:final",
    level: 37,
    waves: [
      [{ mob: "faeulnisgeist", n: 4 }, { mob: "moorschlurfer", n: 3 }],
      [{ mob: "glutskorpion", n: 3 }, { mob: "eiskobold", n: 4 }],
      [{ mob: "frosttroll", n: 1 }, { mob: "schattenkriecher", n: 3 }],
      [{ mob: "wurzelgolem", n: 2 }, { mob: "seufzergeist", n: 2 }],
      [{ mob: "wurzelgolem", n: 1 }, { mob: "faeulnisgeist", n: 5 }, { mob: "frosttroll", n: 1 }]
    ]
  }
};
function startDefense(id) {
  setFlag(`def_${id}_wave`, 1);
  setFlag(`def_${id}_active`, 1);
  setFlag(`def_${id}_spawned`, 0);
}
function tickDefense() {
  const hub = hubPos();
  if (!hub) return;
  for (const [id, def] of Object.entries(DEFENSES)) {
    if (!flag(`def_${id}_active`)) continue;
    const near = players().filter((p) => V.dist2d(p.location, hub) < 48);
    if (!near.length) continue;
    const wave = flag(`def_${id}_wave`);
    const tag = `cdw_def:${id}`;
    const dim = world15.getDimension("minecraft:overworld");
    const alive = dim.getEntities({ tags: [tag] }).filter((e) => isValid(e));
    if (!flag(`def_${id}_spawned`)) {
      const w = def.waves[wave - 1];
      if (!w) continue;
      for (const p of near) {
        title(p, `\xA7cWelle ${wave}/${def.waves.length}`, "\xA77Verteidige den Hain!", 5, 40, 10);
        sound(p, "raid.horn", void 0, 1, 0.6);
      }
      const extra = Math.max(0, near.length - 1);
      for (const g of w) {
        for (let i = 0; i < g.n + extra; i++) {
          const a = Math.random() * Math.PI * 2;
          spawnMobAt(g.mob, { x: hub.x + Math.cos(a) * 19, y: hub.y, z: hub.z + Math.sin(a) * 19 }, def.level + wave, [tag]);
        }
      }
      setFlag(`def_${id}_spawned`, 1);
      continue;
    }
    for (const e of alive) {
      if (V.dist2d(e.location, hub) > 34) e.teleport({ x: hub.x + rand(-15, 15), y: hub.y + 2, z: hub.z + rand(-15, 15) });
    }
    if (alive.length === 0) {
      if (wave >= def.waves.length) {
        setFlag(`def_${id}_active`, 0);
        for (const p of near) title(p, "\xA7aDer Hain h\xE4lt stand!", "\xA77Alle Wellen abgewehrt", 10, 60, 20);
        emit("flag", { key: def.key });
      } else {
        setFlag(`def_${id}_wave`, wave + 1);
        setFlag(`def_${id}_spawned`, 0);
      }
    }
  }
}
function tickZones() {
  const act = wdata().main.idx;
  const dim = world15.getDimension("minecraft:overworld");
  for (const def of DUNGEONS) {
    const st = wdata().dungeons[def.id];
    if (!st || !flag(`zone_${def.id}`)) continue;
    const center = { x: st.x, y: st.y, z: st.z };
    const near = players().filter((p2) => p2.dimension.id === dim.id && V.dist2d(p2.location, center) < 110);
    if (!near.length) continue;
    const count = dim.getEntities({ location: center, maxDistance: 90, tags: [`cdw_zone:${def.id}`] }).length;
    if (count >= 6 + near.length * 2) continue;
    const p = pick(near);
    const a = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 14;
    const loc = { x: p.location.x + Math.cos(a) * r, y: p.location.y, z: p.location.z + Math.sin(a) * r };
    if (V.dist2d(loc, center) > 100) continue;
    spawnMobAt(pick(def.mobs.filter((m) => m !== "wurzelgolem" || Math.random() < 0.3)), loc, void 0, [`cdw_zone:${def.id}`]);
  }
}
function tickWorldEvents() {
  const w = wdata();
  if (!w.hub || w.main.idx < 4) return;
  const now2 = Date.now();
  w.camps = w.camps.filter((c2) => now2 - c2.t < 36e5);
  if (w.camps.length >= 2) return;
  if (now2 - flag("last_event") * 1e3 < 20 * 6e4) return;
  const ps = players().filter((p2) => p2.dimension.id === "minecraft:overworld");
  if (!ps.length) return;
  const p = pick(ps);
  if (hubPos() && V.dist2d(p.location, hubPos()) < 60) return;
  setFlag("last_event", Math.floor(now2 / 1e3));
  const a = Math.random() * Math.PI * 2;
  const loc = { x: Math.round(p.location.x + Math.cos(a) * 55), y: p.location.y, z: Math.round(p.location.z + Math.sin(a) * 55) };
  const kind = Math.random() < 0.55 ? "lager" : "riss";
  const c = { x: loc.x, z: loc.z, t: now2, id: `${kind}_${now2}` };
  w.camps.push(c);
  markWorldDirty();
  buildEvent(c, kind, level(p));
  for (const pl of ps) {
    if (V.dist2d(pl.location, { x: loc.x, y: 0, z: loc.z }) < 150) {
      title(pl, kind === "lager" ? "\xA76Goblin-Lager entdeckt!" : "\xA75Ein F\xE4ulnis-Riss \xF6ffnet sich!", "\xA77In der N\xE4he \u2013 folge dem Rauch", 10, 60, 20);
      pl.sendMessage(`\xA77Ereignis bei \xA7f${loc.x}, ${loc.z}\xA77. Besiege alle Gegner f\xFCr eine Belohnung.`);
    }
  }
}
function buildEvent(c, kind, lvl) {
  const dim = world15.getDimension("minecraft:overworld");
  void withLoadedArea(`ev_${c.id}`.slice(0, 24), dim, { x: c.x - 8, y: 0, z: c.z - 8 }, { x: c.x + 8, y: 0, z: c.z + 8 }, () => {
    return new Promise((resolve2) => {
      const s2 = surfaceY(dim, c.x, c.z);
      if (!s2 || s2.water) {
        resolve2();
        return;
      }
      const b = new Builder(dim, { x: c.x, y: s2.y, z: c.z }, c.t % 1e3);
      const tag = `cdw_ev:${c.id}`;
      if (kind === "lager") {
        b.disc(0, 0, 0, 5, "minecraft:coarse_dirt");
        for (let y = 1; y < 5; y++) b.disc(0, y, 0, 5, "minecraft:air");
        b.set(0, 1, 0, { id: "minecraft:campfire", states: { extinguished: false } });
        for (const [x, z] of [[-4, -1], [3, 2]]) {
          b.box(x, 1, z, x + 1, 2, z + 1, "minecraft:spruce_fence");
          b.box(x - 1, 3, z - 1, x + 2, 3, z + 2, "minecraft:brown_wool");
        }
        b.set(2, 1, -3, "minecraft:barrel").set(-2, 1, 3, "minecraft:hay_block");
        b.then(() => {
          for (let i = 0; i < 4; i++) spawnMobAt(i < 3 ? "goblin_pluenderer" : "goblin_schuetze", { x: c.x + rand(-4, 4), y: s2.y + 1, z: c.z + rand(-4, 4) }, Math.max(2, lvl), [tag]);
        });
      } else {
        b.disc(0, 0, 0, 4, [{ b: "minecraft:crying_obsidian", w: 1 }, { b: "cdw:faeulnis", w: 3 }, { b: "minecraft:soul_soil", w: 1 }]);
        b.set(0, 1, 0, "minecraft:soul_fire");
        b.then(() => {
          for (let i = 0; i < 4; i++) spawnMobAt(pick(["faeulnisgeist", "moosling", "seufzergeist"]), { x: c.x + rand(-4, 4), y: s2.y + 1, z: c.z + rand(-4, 4) }, Math.max(2, lvl + 1), [tag]);
        });
      }
      b.run(() => resolve2(), 40);
    });
  });
}
function tickEventCompletion() {
  const w = wdata();
  const dim = world15.getDimension("minecraft:overworld");
  for (const c of [...w.camps]) {
    const near = players().filter((p) => V.dist2d(p.location, { x: c.x, y: 0, z: c.z }) < 40);
    if (!near.length) continue;
    if (Date.now() - c.t < 15e3) continue;
    const alive = dim.getEntities({ tags: [`cdw_ev:${c.id}`] }).length;
    if (alive > 0) continue;
    w.camps = w.camps.filter((x) => x.id !== c.id);
    markWorldDirty();
    const isCamp = c.id.startsWith("lager");
    for (const p of near) {
      title(p, isCamp ? "\xA7aLager ger\xE4umt!" : "\xA7aRiss geschlossen!", "\xA77Belohnung erhalten", 5, 40, 10);
      addXp(p, 80 + level(p) * 25, "(Ereignis)");
      addGold(p, 20 + level(p) * 3, "(Ereignis)");
      if (Math.random() < 0.6) giveItem(p, createGear(randomGearFor(level(p), pdata(p).cls), 1 + (Math.random() < 0.3 ? 1 : 0)));
      emit("flag", { key: isCamp ? "camp_cleared" : "rift_closed", player: p });
    }
    if (!isCamp) {
      const s2 = surfaceY(dim, c.x, c.z);
      if (s2) {
        try {
          dim.runCommand(`fill ${c.x - 4} ${s2.y} ${c.z - 4} ${c.x + 4} ${s2.y} ${c.z + 4} moss_block replace cdw:faeulnis`);
          dim.runCommand(`fill ${c.x} ${s2.y + 1} ${c.z} ${c.x} ${s2.y + 1} ${c.z} air replace soul_fire`);
        } catch {
        }
        ring(dim, "minecraft:totem_particle", { x: c.x, y: s2.y + 1, z: c.z }, 3, 16);
      }
    }
  }
}
function summonWorldBoss(p) {
  const w = wdata();
  if (w.main.idx < 26) return "Der Altar schweigt noch.";
  const hub = hubPos();
  if (!hub) return "Kein Hain.";
  if (flag("wyrm_active")) return "Der Uralte ist bereits erwacht!";
  const center = { x: hub.x + HUB_SPOTS.altar.x, y: hub.y + 1, z: hub.z + HUB_SPOTS.altar.z - 14 };
  const e = startBoss("boss_wurzelwyrm", center, "cdw_wb", false, () => {
    setFlag("wyrm_active", 0);
    const week = weekNumber();
    for (const pl of players()) {
      if (V.dist(pl.location, center) > 80) continue;
      const d = pdata(pl);
      const first = (d.stats.wyrmWeek ?? 0) !== week;
      d.stats.wyrmWeek = week;
      addXp(pl, 2e4, "(Weltboss)");
      if (first) {
        giveItem(pl, createGear(randomGearFor(50, d.cls, 0.5), 4));
        pl.sendMessage("\xA76\u2726 W\xF6chentliche Beute des Uralten erhalten!");
      } else pl.sendMessage("\xA77Die w\xF6chentliche Beute hast du bereits erhalten. N\xE4chste Woche wieder!");
    }
    broadcast("\xA76\u2726 Der Uralte Wurzelwyrm wurde bezwungen!");
  });
  if (!e) return "Beschw\xF6rung fehlgeschlagen.";
  setFlag("wyrm_active", 1);
  return void 0;
}
function initEvents() {
  system16.runInterval(() => {
    try {
      tickDefense();
      tickCamp();
    } catch (e) {
      log("Event-Tick:", String(e));
    }
  }, 20);
  system16.runInterval(() => {
    try {
      tickZones();
      tickEventCompletion();
    } catch (e) {
      log("Zonen-Tick:", String(e));
    }
  }, 60);
  system16.runInterval(() => {
    try {
      tickWorldEvents();
    } catch (e) {
      log("Welt-Event:", String(e));
    }
  }, 1200);
}

// src/ui/npcmenus.ts
var GREET = {
  sylva: ["Die Wurzeln fl\xFCstern deinen Namen, W\xE4chter.", "Der Hain ist st\xE4rker, seit du hier bist.", "Brauchst du Rat?"],
  fennick: ["Fennick! Feinste Waren, fairste Preise. Meistens.", "Was darf's sein, mein Freund?", "Kaufen, verkaufen \u2013 alles ist Handel!"],
  kael: ["Halt die Augen offen.", "Die Jagd ruft.", "Was brauchst du?"],
  brom: ["Hmpf. Was willst du?", "Die Esse ist hei\xDF. Mach schnell.", "Zeig her, was du da schleppst."],
  mira: ["Oh! Hallo! Nicht anfassen, das blubbert!", "Du siehst durstig aus. Trank?", "Ich hab da eine Theorie\u2026"],
  oswin: ["Ah, die Chronik w\xE4chst.", "Jedes Kapitel braucht einen Helden.", "Hast du neue Seiten gefunden?"],
  morgra: ["Was willst du?", "Das Moor schl\xE4ft. Endlich.", "Sprich, oder lass mich brauen."]
};
async function onNpcInteract(p, e) {
  const id = npcIdOf(e);
  if (!id) return;
  lookAtPlayer(e, p);
  const handled = await talkTo(p, id);
  if (handled) return;
  await npcMenu(p, id);
}
async function npcMenu(p, id) {
  const n = npcById(id);
  if (!n) return;
  const greet = GREET[id] ?? ["\u2026"];
  const buttons = [];
  for (const q of sideAvailable(p, id)) buttons.push({ text: `\xA7e! ${q.title}
\xA78Neue Aufgabe`, icon: "textures/cdw/ui/quest_new", action: () => acceptSide(p, q) });
  for (const q of sideActive(p).filter((q2) => q2.giver === id)) buttons.push({ text: `\xA77\u2026 ${q.title}
\xA78${sideTracker(p, q).text.slice(0, 40)}`, icon: "textures/cdw/ui/quest_active", action: async () => void await dialog(p, [{ s: id, t: `\u201E${q.summary}\u201C

\xA77Aktuell: \xA7f${sideTracker(p, q).text}` }]) });
  switch (id) {
    case "sylva":
      buttons.push({ text: "\xA7fKlasse wechseln\n\xA78" + CLASS_CHANGE_COST + " Gold", icon: "textures/cdw/ui/class", action: () => changeClass(p) });
      buttons.push({ text: "\xA7fTalente & Attribute zur\xFCcksetzen\n\xA78" + RESPEC_COST_PER_LEVEL * level(p) + " Gold", icon: "textures/cdw/ui/respec", action: () => respec(p) });
      if (wdata().flags.endgame) buttons.push({ text: "\xA76Heroische Wurzelpfade\n\xA78Dungeons auf Stufe 50", icon: "textures/cdw/ui/heroic", action: () => heroicMenu(p) });
      buttons.push({ text: "\xA7fWas soll ich tun?\n\xA78Hinweis zur Geschichte", icon: "textures/cdw/ui/hint", action: () => hint(p) });
      break;
    case "fennick":
      buttons.push({ text: "\xA7fKaufen", icon: "textures/cdw/ui/buy", action: () => openShop(p, "fennick") });
      buttons.push({ text: "\xA7fVerkaufen", icon: "textures/cdw/ui/sell", action: () => openSell(p) });
      break;
    case "brom":
      buttons.push({ text: "\xA7fSchmiede\n\xA78Verbessern \xB7 Reparieren \xB7 Zerlegen", icon: "textures/cdw/ui/upgrade", action: () => openSmith(p) });
      buttons.push({ text: "\xA7fWaffe schmieden\n\xA78Waffe deiner Stufe", icon: "textures/cdw/ui/forge", action: () => openForge(p) });
      break;
    case "mira":
      buttons.push({ text: "\xA7fTr\xE4nke & Elixiere", icon: "textures/cdw/ui/buy", action: () => openShop(p, "mira") });
      break;
    case "morgra":
      buttons.push({ text: "\xA7fMorgras Gebr\xE4u", icon: "textures/cdw/ui/buy", action: () => openShop(p, "morgra") });
      break;
    case "kael":
      buttons.push({ text: "\xA76Kopfgelder\n\xA783 neue Auftr\xE4ge pro Tag", icon: "textures/cdw/ui/bounty", action: () => openBounties(p) });
      break;
    case "oswin":
      buttons.push({ text: "\xA7fChronik\n\xA78Gespr\xE4che erneut lesen", icon: "textures/cdw/ui/chronicle", action: () => openChronicle(p) });
      buttons.push({ text: "\xA7fErfolge & Titel", icon: "textures/cdw/ui/achievements", action: () => openAchievements(p) });
      if (level(p) >= MAX_LEVEL) buttons.push({ text: "\xA76Prestige\n\xA78Neubeginn mit Bonus", icon: "textures/cdw/ui/prestige", action: () => prestige(p) });
      if (wdata().flags.endgame) buttons.push({ text: "\xA7cDer Altar des Uralten\n\xA78Weltboss beschw\xF6ren", icon: "textures/cdw/ui/altar", action: () => altar(p) });
      break;
  }
  await menu(p, `\xA7a${n.name} \xA77\u2013 ${n.title}`, `\xA7f\u201E${greet[Math.floor(Math.random() * greet.length)]}\u201C`, buttons);
}
async function changeClass(p) {
  if (!await confirm(p, "\xA76Klasse wechseln", `\xA77Kosten: \xA7e${CLASS_CHANGE_COST} Gold\xA77.
Talente und Attributpunkte werden zur\xFCckgesetzt. Stufe und Ausr\xFCstung bleiben.`)) return;
  if (!spendGold(p, CLASS_CHANGE_COST)) {
    msg(p, "\xA7cNicht genug Gold.");
    return;
  }
  await openClassPick(p, true);
}
async function respec(p) {
  const cost = RESPEC_COST_PER_LEVEL * level(p);
  if (!await confirm(p, "\xA76Zur\xFCcksetzen", `\xA77Alle Talent- und Attributpunkte zur\xFCckerhalten f\xFCr \xA7e${fmt(cost)} Gold\xA77?`)) return;
  if (!spendGold(p, cost)) {
    msg(p, "\xA7cNicht genug Gold.");
    return;
  }
  const d = pdata(p);
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  msg(p, "\xA7aPunkte zur\xFCckgesetzt. Verteile sie neu im Abenteuerbuch.");
}
async function hint(p) {
  const q = MAIN[wdata().main.idx];
  if (!q) {
    await dialog(p, [{ s: "sylva", t: "Die Geschichte des Welkens ist erz\xE4hlt. Doch Ylvaris braucht weiter W\xE4chter: Kopfgelder, heroische Wurzelpfade und der Uralte warten." }]);
    return;
  }
  await dialog(p, [{ s: "sylva", t: `\u201E${q.summary}\u201C

\xA77Folge dem \xA76goldenen Stern\xA77 in der Wegpunktleiste oder dem Pfeil im HUD.` }]);
}
async function heroicMenu(p) {
  await menu(
    p,
    "\xA76Heroische Wurzelpfade",
    "\xA77Setzt einen gereinigten Dungeon zur\xFCck: Gegner auf Stufe 50+, bessere Beute. Einmal pro Tag und Dungeon.",
    DUNGEONS.filter((d) => wdata().dungeons[d.id]?.heart).map((d) => ({
      text: `\xA7f${d.name}`,
      action: async () => {
        const err = startHeroic(d.id);
        if (err) msg(p, `\xA7c${err}`);
        else msg(p, `\xA76\u2726 ${d.name} ist jetzt heroisch. Folge dem Wegstein dorthin!`);
      }
    }))
  );
}
async function prestige(p) {
  const d = pdata(p);
  if (!await confirm(p, "\xA76Prestige", `\xA77Deine Stufe wird auf 1 zur\xFCckgesetzt. Du beh\xE4ltst Ausr\xFCstung, Gold, Quests und Erfolge.

\xA7aBonus: +2 % Schaden & Leben dauerhaft, +2 Attributpunkte, Prestige-Rang ${d.prestige + 1}.

\xA7eWirklich neu beginnen?`)) return;
  d.prestige++;
  d.xp = 0;
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  sound(p, "random.totem", void 0, 1, 1);
  msg(p, `\xA76\u2726 Prestige ${d.prestige}! Die Reise beginnt von Neuem \u2013 st\xE4rker als zuvor.`);
}
async function altar(p) {
  const has = countItem(p, "cdw:beschwoerungsstein");
  if (!has) {
    msg(p, "\xA77Du brauchst einen \xA7dBeschw\xF6rungsstein\xA77 (Belohnung der Hauptgeschichte, sp\xE4ter bei Fennick).");
    return;
  }
  if (!await confirm(p, "\xA7cDer Uralte", "\xA77Den Uralten Wurzelwyrm am Altar im Norden des Hains beschw\xF6ren? \xA7cSehr gef\xE4hrlich \u2013 empfohlen: Stufe 50, zu zweit.")) return;
  const err = summonWorldBoss(p);
  if (err) {
    msg(p, `\xA7c${err}`);
    return;
  }
  takeItem(p, "cdw:beschwoerungsstein", 1);
}
async function openBounties(p) {
  refreshBounties(p);
  const delivered = turnInBountyItems(p);
  if (delivered) msg(p, `\xA7a${delivered} Lieferauftrag/-auftr\xE4ge abgegeben!`);
  const d = pdata(p);
  const lines = d.bounty.list.map((b) => {
    const t = BOUNTIES.find((x) => x.id === b.id);
    if (!t) return "";
    const r = bountyReward(p, t);
    const n = t.obj.type === "kill" || t.obj.type === "collect" ? t.obj.count : 1;
    return `${b.done ? "\xA7a\u2714" : "\xA76\u2022"} \xA7f${t.text} \xA77(${Math.min(b.c, n)}/${n})
   \xA77Belohnung: \xA7b${fmt(r.xp)} XP \xA77\xB7 \xA7e${fmt(r.gold)} Gold`;
  });
  const left = Math.ceil((864e5 - Date.now() % 864e5) / 36e5);
  await menu(p, "\xA76Kopfgeldbrett", `${lines.join("\n\n")}

\xA78Neue Auftr\xE4ge in ca. ${left} Std. \xB7 Erf\xFCllt gesamt: ${d.bounty.total}
\xA78Lieferauftr\xE4ge werden hier automatisch abgegeben.`, [{ text: "\xA7aAktualisieren", action: () => openBounties(p) }]);
}

// src/ui/book.ts
async function openBook(p) {
  const d = pdata(p);
  emit("flag", { key: "book_opened", player: p });
  if (!wdata().hub) {
    await dialog(p, MAIN[0].intro);
    return;
  }
  const cls = classById(d.cls);
  const xp = xpProgress(p);
  const hp = hpInfo(p);
  const s2 = stats(p);
  const header = `\xA7f${p.name} \xA77\xB7 ${cls ? cls.color + cls.name : "\xA77Keine Klasse"} \xA77\xB7 \xA7eStufe ${xp.level}
\xA7c\u2764 ${fmt(hp.cur)}/${fmt(hp.max)}  \xA79\u2726 ${fmt(getMana(p))}/${fmt(s2.maxMana)}  \xA7e${fmt(d.gold)} Gold
\xA77XP: ${fmt(xp.cur)}/${fmt(xp.need)}${d.title ? `  \xA7dTitel: ${d.title}` : ""}`;
  const fp = freeAttrPoints(p);
  const tp = freeTalentPoints(p);
  const buttons = [
    { text: "\xA76Quests\n\xA78Aufgaben & Ziele", icon: "textures/cdw/ui/quests", action: () => openQuests(p) },
    { text: `\xA7fCharakter${fp > 0 ? ` \xA7a(+${fp})` : ""}
\xA78Werte & Attribute`, icon: "textures/cdw/ui/character", action: () => openCharacter(p) },
    { text: "\xA7dF\xE4higkeiten\n\xA78Runen & \xDCbersicht", icon: "textures/cdw/ui/abilities", action: () => openAbilities(p) },
    { text: `\xA7aTalente${tp > 0 ? ` \xA7a(+${tp})` : ""}
\xA78${cls ? TALENT_PATH_NAMES[cls.id].join(" \xB7 ") : "\u2013"}`, icon: "textures/cdw/ui/talents", action: () => openTalents(p) },
    { text: "\xA7bAusr\xFCstung\n\xA78Angelegte Gegenst\xE4nde", icon: "textures/cdw/ui/equipment", action: () => openEquipment(p) },
    { text: "\xA7eErfolge & Titel", icon: "textures/cdw/ui/achievements", action: () => openAchievements(p) },
    { text: "\xA7fRezepte", icon: "textures/cdw/ui/recipes", action: () => openRecipes(p) },
    { text: "\xA77Einstellungen", icon: "textures/cdw/ui/settings", action: () => openSettings(p) }
  ];
  if (!d.cls) buttons.unshift({ text: "\xA76Klasse w\xE4hlen!", icon: "textures/cdw/ui/class", action: () => openClassPick(p) });
  if (p.playerPermissionLevel >= 2 || p.commandPermissionLevel >= 1) buttons.push({ text: "\xA7cAdmin", icon: "textures/cdw/ui/admin", action: () => openAdmin(p) });
  await menu(p, "\xA7l\xA76Abenteuerbuch", header, buttons);
}
async function openQuests(p) {
  const d = pdata(p);
  const buttons = [];
  const mt = mainTracker();
  if (mt?.quest) {
    const q = mt.quest;
    buttons.push({
      text: `\xA76\u2605 ${q.title}${!d.tracked || d.tracked === "main" ? " \xA7a(verfolgt)" : ""}
\xA78${mt.text.replace(/§./g, "").slice(0, 42)}`,
      icon: "textures/cdw/ui/quest_main",
      action: () => questDetail(p, "main")
    });
  }
  for (const q of sideActive(p))
    buttons.push({ text: `\xA7e${q.title}${d.tracked === q.id ? " \xA7a(verfolgt)" : ""}
\xA78${sideTracker(p, q).text.replace(/§./g, "").slice(0, 42)}`, icon: "textures/cdw/ui/quest_active", action: () => questDetail(p, q.id) });
  buttons.push({ text: "\xA76Kopfgelder\n\xA78Heutige Auftr\xE4ge", icon: "textures/cdw/ui/bounty", action: () => openBounties(p) });
  buttons.push({ text: "\xA7fChronik\n\xA78Abgeschlossene Geschichte", icon: "textures/cdw/ui/chronicle", action: () => openChronicle(p) });
  await menu(p, "\xA76Quests", questLog(p), buttons, { back: () => openBook(p) });
}
async function questDetail(p, id) {
  const d = pdata(p);
  if (id === "main") {
    const mt = mainTracker();
    const q2 = mt?.quest;
    if (!q2) return;
    const buttons = [
      { text: "\xA7aVerfolgen", action: () => setTracked(p, "main") },
      { text: "\xA7fEinleitung erneut lesen", action: async () => void await dialog(p, q2.intro.length ? q2.intro : [{ s: "erzaehler", t: q2.summary }]) }
    ];
    const tgt = mt.target;
    if (tgt?.k === "dungeon") {
      const st = dungeonState(tgt.id);
      if (st && !st.built)
        buttons.push({
          text: "\xA7cOrt neu bestimmen\n\xA78Falls er auf euren Bauten liegt",
          action: async () => {
            if (await confirm(p, "\xA7cOrt neu bestimmen", "\xA77Der Dungeon wird an einer anderen Stelle (gleiche Richtung, \xE4hnliche Entfernung) errichtet. Nur m\xF6glich, solange er noch nicht gebaut wurde.")) {
              if (reroll(tgt.id)) msg(p, "\xA7aNeuer Ort bestimmt. Folge dem Wegpunkt.");
            }
          }
        });
    }
    await menu(p, `\xA76${q2.title}`, `\xA77${q2.summary}

\xA7fZiel: ${mt.text}`, buttons, { back: () => openQuests(p) });
    return;
  }
  const q = questById(id);
  if (!q || !d.quests[id]) return;
  await menu(
    p,
    `\xA7e${q.title}`,
    `\xA77${q.summary}

\xA7fZiel: ${sideTracker(p, q).text}`,
    [
      { text: "\xA7aVerfolgen", action: () => setTracked(p, id) },
      { text: "\xA7fEinleitung erneut lesen", action: async () => void await dialog(p, q.intro) },
      {
        text: "\xA7cAufgeben",
        action: async () => {
          if (await confirm(p, "\xA7cAufgeben?", `\xA77\u201E${q.title}\u201C abbrechen? Du kannst sie sp\xE4ter erneut annehmen.`)) abandonSide(p, id);
        }
      }
    ],
    { back: () => openQuests(p) }
  );
}
async function openChronicle(p) {
  const idx = wdata().main.idx;
  const done = MAIN.slice(0, idx);
  if (!done.length) {
    msg(p, "\xA77Die Chronik ist noch leer.");
    return;
  }
  await menu(
    p,
    "\xA7fChronik",
    "\xA77Lies abgeschlossene Kapitel erneut.",
    done.map((q) => ({ text: `\xA7f${q.title}
\xA78Akt ${q.act || "Prolog"}`, action: async () => void await dialog(p, [...q.intro, ...q.outro].length ? [...q.intro, ...q.outro] : [{ s: "erzaehler", t: q.summary }]) })).reverse()
  );
}
async function openCharacter(p) {
  const s2 = stats(p);
  const d = pdata(p);
  const fp = freeAttrPoints(p);
  const pct2 = (v) => `${Math.round(v * 1e3) / 10}`.replace(".", ",") + " %";
  const body = [
    `\xA7eStufe ${s2.level} \xA77\xB7 Prestige ${d.prestige} \xB7 Ruf ${fmt(d.rep)}`,
    `\xA7c\u2764 Leben: \xA7f${fmt(s2.maxHp)}   \xA79\u2726 Mana: \xA7f${fmt(s2.maxMana)} \xA77(+${s2.manaRegen.toFixed(1).replace(".", ",")}/s)`,
    `\xA76Krit: \xA7f${pct2(s2.crit)} \xA77(\xD7${s2.critDmg.toFixed(2).replace(".", ",")})   \xA7bWiderstand: \xA7f${pct2(s2.resist)}`,
    `\xA7aLebensraub: \xA7f${pct2(s2.lifesteal)}   \xA7dAbklingzeit: \xA7f-${pct2(s2.cdr)}   \xA7fTempo: +${pct2(s2.speed)}`,
    s2.setBonus.length ? `\xA76Setbonus: \xA7f${s2.setBonus.join(", ")}` : "",
    "",
    ...["str", "dex", "int", "vit", "wis"].map((a) => `\xA7f${ATTR_NAMES[a]}: \xA7e${s2.attrs[a]} \xA78(${d.attr[a]} verteilt)`),
    "",
    fp > 0 ? `\xA7a${fp} freie Attributpunkte` : "\xA77Keine freien Punkte"
  ].filter((l) => l !== void 0).join("\n");
  const buttons = ["str", "dex", "int", "vit", "wis"].map((a) => ({
    text: `\xA7f+ ${ATTR_NAMES[a]}
\xA78${ATTR_DESC[a].slice(0, 44)}`,
    icon: `textures/cdw/ui/attr_${a}`,
    action: async () => {
      if (freeAttrPoints(p) <= 0) {
        msg(p, "\xA77Keine freien Attributpunkte.");
        return;
      }
      d.attr[a]++;
      markDirty(p);
      invalidate(p);
      sound(p, "random.orb", void 0, 1.5, 0.5);
      await openCharacter(p);
    }
  }));
  if (fp >= 5)
    buttons.push({
      text: "\xA7aMehrere Punkte verteilen\u2026",
      action: async () => {
        const f = new ModalFormData().title("\xA7fAttribute verteilen");
        const attrs = ["str", "dex", "int", "vit", "wis"];
        for (const a of attrs) f.slider(`${ATTR_NAMES[a]} (+)`, 0, fp, { valueStep: 1, defaultValue: 0 });
        const res = await modal(p, f);
        if (!res?.formValues) return;
        let sum = 0;
        const vals = res.formValues.map((v) => Number(v) || 0);
        for (const v of vals) sum += v;
        if (sum > freeAttrPoints(p)) {
          msg(p, `\xA7cDu hast nur ${freeAttrPoints(p)} Punkte.`);
          return;
        }
        attrs.forEach((a, i) => d.attr[a] += vals[i]);
        markDirty(p);
        invalidate(p);
        await openCharacter(p);
      }
    });
  await menu(p, "\xA7fCharakter", body, buttons, { back: () => openBook(p) });
}
async function openAbilities(p) {
  const d = pdata(p);
  if (!d.cls) {
    await openClassPick(p);
    return;
  }
  const lvl = stats(p).level;
  const list = abilitiesFor(d.cls).map((a) => `${a.level <= lvl ? "\xA7a\u2714" : "\xA78\u2716"} \xA7d${a.name} \xA77(Stufe ${a.level}, ${a.mana} Mana, ${a.cooldown} s)
  \xA7f${a.desc}`).join("\n\n");
  await menu(
    p,
    "\xA7dF\xE4higkeiten",
    `${list}

\xA77Runen in die Schnellleiste legen und benutzen. Waffen haben zus\xE4tzlich eine eigene F\xE4higkeit (Benutzen).`,
    [
      {
        text: "\xA7aFehlende Runen erhalten",
        icon: "textures/cdw/ui/abilities",
        action: () => {
          const n = giveRunes(p);
          msg(p, n ? `\xA7a${n} Rune(n) erhalten.` : "\xA77Du hast bereits alle freigeschalteten Runen.");
        }
      }
    ],
    { back: () => openBook(p) }
  );
}
async function openTalents(p) {
  const d = pdata(p);
  const cls = classById(d.cls);
  if (!cls) {
    await openClassPick(p);
    return;
  }
  const tp = freeTalentPoints(p);
  const ts = talentsFor(cls.id);
  const buttons = [];
  for (const path of [0, 1]) {
    const pts = ts.filter((t) => t.path === path).reduce((s2, t) => s2 + (d.talents[t.id] ?? 0), 0);
    for (const t of ts.filter((x) => x.path === path).sort((a, b) => a.tier - b.tier)) {
      const rank = d.talents[t.id] ?? 0;
      const needed = (t.tier - 1) * 2;
      const locked = pts < needed;
      buttons.push({
        text: `${locked ? "\xA78\u{1F512}" : rank >= t.maxRank ? "\xA7a\u2605" : "\xA7f"}${TALENT_PATH_NAMES[cls.id][path]}: ${t.name} \xA77${rank}/${t.maxRank}
\xA78${locked ? `Ben\xF6tigt ${needed} Punkte im Pfad` : t.desc.slice(0, 44)}`,
        icon: `textures/cdw/ui/talent_${path}`,
        action: async () => {
          if (locked) msg(p, `\xA77Ben\xF6tigt ${needed} Punkte im Pfad \u201E${TALENT_PATH_NAMES[cls.id][path]}\u201C.`);
          else if (rank >= t.maxRank) msg(p, "\xA77Bereits gemeistert.");
          else if (freeTalentPoints(p) <= 0) msg(p, "\xA77Keine freien Talentpunkte. \xA78(Jede 2. Stufe ab 3)");
          else {
            d.talents[t.id] = rank + 1;
            markDirty(p);
            invalidate(p);
            sound(p, "random.orb", void 0, 1.6, 0.6);
          }
          await openTalents(p);
        }
      });
    }
  }
  await menu(p, "\xA7aTalente", `\xA77Freie Talentpunkte: \xA7a${tp}
\xA78H\xF6here Talente ben\xF6tigen Punkte im selben Pfad.`, buttons, { back: () => openBook(p) });
}
async function openEquipment(p) {
  const lines = [];
  const slots = [
    [EquipmentSlot6.Mainhand, "Waffe"],
    [EquipmentSlot6.Offhand, "Nebenhand"],
    [EquipmentSlot6.Head, "Kopf"],
    [EquipmentSlot6.Chest, "Brust"],
    [EquipmentSlot6.Legs, "Beine"],
    [EquipmentSlot6.Feet, "F\xFC\xDFe"]
  ];
  for (const [slot, name] of slots) {
    const it = getEquip(p, slot);
    if (!it) {
      lines.push(`\xA78${name}: \u2013`);
      continue;
    }
    const g = getGear(it);
    lines.push(`\xA77${name}: ${g ? displayName(it.typeId, g) : "\xA7f" + (it.nameTag ?? it.typeId.replace(/^.*:/, "").replace(/_/g, " "))}`);
    if (g) for (const [k, v] of Object.entries(g.a)) lines.push(`   ${RARITIES[g.r].color}${AFFIX_NAMES[k]?.(v) ?? k}`);
  }
  const s2 = stats(p);
  if (s2.setBonus.length) lines.push(`
\xA76Aktive Setboni: \xA7f${s2.setBonus.join(", ")}`);
  await menu(p, "\xA7bAusr\xFCstung", lines.join("\n"), [], { back: () => openBook(p) });
}
async function openAchievements(p) {
  const d = pdata(p);
  const got = ACHIEVEMENTS.filter((a) => d.ach.includes(a.id)).length;
  const body = ACHIEVEMENTS.map((a) => `${d.ach.includes(a.id) ? "\xA7a\u2714" : "\xA78\u2716"} \xA7f${a.name} \xA77\u2013 ${a.desc}${a.title ? ` \xA7d[${a.title}]` : ""}`).join("\n");
  const titles = unlockedTitles(p);
  const buttons = titles.map((t) => ({
    text: `\xA7dTitel tragen: ${t}${d.title === t ? " \xA7a\u2714" : ""}`,
    action: () => {
      d.title = t;
      markDirty(p);
      applyNameTag(p);
    }
  }));
  if (d.title) buttons.push({ text: "\xA77Titel ablegen", action: () => void (d.title = void 0, markDirty(p), applyNameTag(p)) });
  await menu(p, `\xA7eErfolge (${got}/${ACHIEVEMENTS.length})`, body, buttons);
}
async function openRecipes(p) {
  const body = [
    "\xA7fWerkbank-Rezepte (Zutaten beliebig anordnen):",
    "\xA7a\u2022 Kleiner Heiltrank: \xA77Glasflasche + Moosherz + S\xFC\xDFe Beeren",
    "\xA7a\u2022 Heiltrank: \xA77Kleiner Heiltrank + Moosherz + Glitzernde Melone",
    "\xA7a\u2022 Gro\xDFer Heiltrank: \xA77Heiltrank + Uraltes Harz",
    "\xA79\u2022 Kleiner Manatrank: \xA77Glasflasche + F\xE4ulnisessenz + Leuchtbeeren",
    "\xA79\u2022 Manatrank: \xA77Kleiner Manatrank + Schattenkristall",
    "\xA79\u2022 Gro\xDFer Manatrank: \xA77Manatrank + Uraltes Harz",
    "\xA76\u2022 Elixier der St\xE4rke: \xA77Glasflasche + Dornenfang + Lohenstaub",
    "\xA76\u2022 Elixier der Z\xE4higkeit: \xA77Glasflasche + Moorschleim + Eisenbarren",
    "\xA76\u2022 Elixier der Eile: \xA77Glasflasche + Skorpionstachel + Zucker",
    "\xA76\u2022 Elixier der Weisheit: \xA77Glasflasche + Frostsplitter + Lapislazuli",
    "\xA7e\u2022 Schriftrolle der R\xFCckkehr: \xA77Papier + Moosherz + F\xE4ulnisessenz",
    "\xA7b\u2022 Eigener Wegstein: \xA774 Runenstaub + Leitstein + 4 Steinziegel",
    "\xA7b\u2022 Abenteuerbuch: \xA77Buch + Moosherz",
    "",
    "\xA7fBei Brom: \xA77Mondsilberbarren (2 Gold + 1 Frostsplitter, nach Nebenquest), Waffen schmieden."
  ].join("\n");
  await menu(p, "\xA7fRezepte", body, [], { back: () => openBook(p) });
}
async function openSettings(p) {
  const d = pdata(p);
  const f = new ModalFormData().title("\xA77Einstellungen").toggle("HUD in der Aktionsleiste anzeigen", { defaultValue: d.settings.hud }).toggle("Irrlicht-Pfad zum Questziel", { defaultValue: d.settings.wisp }).dropdown("Schwierigkeit (Schaden durch Monster)", ["Entspannt (-30 %)", "Normal", "Heroisch (+35 %)"], { defaultValueIndex: d.settings.diff }).toggle("Wegpunkte in der Wegpunktleiste", { defaultValue: (d.stats.noWp ?? 0) === 0 });
  const res = await modal(p, f);
  if (!res?.formValues) return;
  const [hud, wisp2, diff, wp] = res.formValues;
  d.settings.hud = hud;
  d.settings.wisp = wisp2;
  d.settings.diff = diff;
  d.stats.noWp = wp ? 0 : 1;
  markDirty(p);
  if (!wp) {
    try {
      p.locatorBar.removeAllWaypoints();
    } catch {
    }
  }
  msg(p, "\xA7aEinstellungen gespeichert.");
}
async function openAdmin(p) {
  const w = wdata();
  await menu(
    p,
    "\xA7cAdmin",
    `\xA77Hauptquest: ${w.main.idx}/${MAIN.length} (Stufe ${w.main.s}, Z\xE4hler ${w.main.c})
\xA77Hain: ${w.hub ? `${w.hub.x} ${w.hub.y} ${w.hub.z} (Stufe ${w.hub.stage})` : "nicht gepflanzt"}`,
    [
      {
        text: "\xA7fZu Dungeon teleportieren",
        action: () => menu(
          p,
          "Dungeons",
          "",
          DUNGEONS.map((dg) => ({
            text: `${dg.name}${dungeonState(dg.id)?.built ? " \xA7a(gebaut)" : ""}`,
            action: () => {
              const st = dungeonState(dg.id);
              if (st) p.teleport({ x: st.x + 0.5, y: st.y + 2, z: st.z + 8 }, { dimension: world16.getDimension("minecraft:overworld") });
              else msg(p, "\xA77Ort noch nicht bestimmt.");
            }
          }))
        )
      },
      { text: "\xA7fZum Hain teleportieren", action: () => travel(p, "hub", true) },
      {
        text: "\xA7fHauptquest \xFCberspringen",
        action: async () => {
          if (!await confirm(p, "\xDCberspringen?", "Aktuelle Hauptquest ohne Belohnung \xFCberspringen?")) return;
          w.main.idx++;
          w.main.s = -1;
          w.main.c = 0;
          if (MAIN[w.main.idx] && !MAIN[w.main.idx].giver) w.main.s = 0;
          markWorldDirty();
        }
      },
      { text: "\xA7f+1 Stufe (Test)", action: () => addXp(p, xpProgress(p).need - xpProgress(p).cur + 1) },
      { text: "\xA7fTestausr\xFCstung erhalten", action: () => giveItem(p, createGear("cdw:schwert_stahl", 3)) },
      {
        text: "\xA7cHain verschieben",
        action: async () => {
          if (!await confirm(p, "\xA7cHain verschieben", "\xA77Setzt den Hain-Standort zur\xFCck (Geb\xE4ude bleiben stehen, NPCs verschwinden). Du erh\xE4ltst einen neuen Samen.")) return;
          resetHubLocation();
          giveItem(p, new ItemStack7("cdw:samen", 1));
        }
      },
      {
        text: "\xA7cMeinen Fortschritt zur\xFCcksetzen",
        action: async () => {
          if (await confirm(p, "\xA7cZur\xFCcksetzen", "\xA77Alle deine RPG-Daten (Stufe, Gold, Quests) l\xF6schen?")) resetPlayerData(p);
        }
      },
      {
        text: "\xA74Welt-Fortschritt zur\xFCcksetzen",
        action: async () => {
          if (await confirm(p, "\xA74Welt zur\xFCcksetzen", "\xA77Hauptstory, Hain-Daten und Dungeons werden zur\xFCckgesetzt (Bauwerke bleiben stehen).")) resetWorldData();
        }
      }
    ],
    { back: () => openBook(p) }
  );
}

// src/systems/items.ts
function applyConsumable(p, typeId) {
  const s2 = simpleItem(typeId.slice(4));
  if (!s2?.effects) return;
  const d = pdata(p);
  const now2 = Date.now();
  for (const [k, v] of Object.entries(s2.effects)) {
    switch (k) {
      case "heal":
        healPct(p, v);
        particle(p.dimension, "minecraft:heart_particle", V.add(p.location, { x: 0, y: 2, z: 0 }));
        break;
      case "mana":
        setMana(p, getMana(p) + stats(p).maxMana * v);
        particle(p.dimension, "minecraft:blue_flame_particle", V.add(p.location, { x: 0, y: 2, z: 0 }));
        break;
      case "buff_dmg":
        d.buffs.dmg = now2 + v * 1e3;
        break;
      case "buff_resist":
        d.buffs.resist = now2 + v * 1e3;
        break;
      case "buff_xp":
        d.buffs.xp = now2 + v * 1e3;
        break;
      case "buff_speed":
        p.addEffect("speed", v * 20, { amplifier: 1 });
        p.addEffect("haste", v * 20, { amplifier: 1 });
        break;
    }
  }
  markDirty(p);
  invalidate(p);
  sound(p, "random.drink", void 0, 1.1, 0.8);
}
function recall(p, item) {
  const hub = hubPos();
  if (!hub) {
    msg(p, "\xA77Es gibt noch keinen Hain.");
    return;
  }
  const start = V.floor(p.location);
  title(p, "", "\xA7aKonzentration\u2026 nicht bewegen", 0, 60, 5);
  let n = 0;
  const id = system18.runInterval(() => {
    if (!isValid(p)) {
      system18.clearRun(id);
      return;
    }
    if (V.dist(V.floor(p.location), start) > 1.5) {
      system18.clearRun(id);
      msg(p, "\xA7cR\xFCckkehr abgebrochen.");
      return;
    }
    particle(p.dimension, "minecraft:villager_happy", V.add(p.location, { x: Math.random() - 0.5, y: 1 + Math.random(), z: Math.random() - 0.5 }));
    if (++n >= 6) {
      system18.clearRun(id);
      if (takeItem(p, item.typeId, 1)) travel(p, "hub", true);
    }
  }, 10);
}
async function useTool(p, item) {
  switch (item.typeId) {
    case "cdw:buch":
      await openBook(p);
      return;
    case "cdw:samen": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 7 });
      const b = hit?.block;
      if (!b || !["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:coarse_dirt", "minecraft:rooted_dirt"].includes(b.typeId)) {
        msg(p, "\xA77Schau auf einen Gras- oder Erdblock, um den Samen zu pflanzen.");
        return;
      }
      const ok = await confirm(p, "\xA7aSamen pflanzen", `\xA7fHier pflanzen? \xA77(${b.x}, ${b.y}, ${b.z})

\xA77Der Hain braucht etwa \xA7f42 \xD7 42 Bl\xF6cke\xA77. B\xE4ume, Pflanzen und lose Bl\xF6cke in diesem Kreis werden eingeebnet \u2013 eigene Bauten bitte nicht in die N\xE4he!`, "\xA7aPflanzen", "\xA77Abbrechen");
      if (!ok) return;
      if (await plantHub(p, b.location)) {
        takeItem(p, "cdw:samen", 1);
        emit("flag", { key: "hub_planted", player: p });
      }
      return;
    }
    case "cdw:rueckkehrschriftrolle":
      recall(p, item);
      return;
    case "cdw:muenzbeutel": {
      const amount = item.getDynamicProperty("cdw:gold") ?? 0;
      if (takeItem(p, "cdw:muenzbeutel", 1)) addGold(p, amount, "(M\xFCnzbeutel)", false);
      return;
    }
    case "cdw:beschwoerungsstein":
      msg(p, "\xA77Lege den Stein auf den \xA7dAltar des Uralten\xA77 im Norden des Hains (Altar benutzen).");
      return;
  }
}
function registerComponents(ev) {
  const items = ev.itemComponentRegistry;
  items.registerCustomComponent("cdw:weapon", {
    onUse(e) {
      const it = e.itemStack;
      if (!it) return;
      const w = weaponOf(it.typeId);
      if (!w || w.type === "langbogen") return;
      const p = e.source;
      const id = it.typeId;
      system18.run(() => useWeapon(p, id));
    }
  });
  items.registerCustomComponent("cdw:rune", {
    onUse(e, params) {
      const id = params.params?.ability;
      const p = e.source;
      if (id) system18.run(() => castRune(p, id));
    }
  });
  items.registerCustomComponent("cdw:consumable", {
    onConsume(e) {
      const src = e.source;
      const id = e.itemStack.typeId;
      if (src.typeId === "minecraft:player") system18.run(() => applyConsumable(src, id));
    }
  });
  items.registerCustomComponent("cdw:tool", {
    onUse(e) {
      const it = e.itemStack;
      if (!it) return;
      const p = e.source;
      system18.run(() => void useTool(p, it));
    }
  });
  const blocks = ev.blockComponentRegistry;
  blocks.registerCustomComponent("cdw:waystone", {
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      const loc = e.block.location;
      system18.run(() => void openWaystone(p, loc));
    }
  });
  blocks.registerCustomComponent("cdw:waystone_own", {
    onPlace(e) {
      const loc = e.block.location;
      const dim = e.dimension.id;
      system18.run(() => {
        const near = e.dimension.getPlayers({ location: loc, maxDistance: 8 })[0];
        registerWaystone(`own_${loc.x}_${loc.y}_${loc.z}`, loc, dim, `${near?.name ?? "Eigener"}s Wegstein (${loc.x}, ${loc.z})`, near?.name);
      });
    },
    onPlayerBreak(e) {
      const loc = e.block.location;
      const dim = e.dimension.id;
      system18.run(() => unregisterAt(loc, dim));
    },
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      const loc = e.block.location;
      system18.run(() => void openWaystone(p, loc));
    }
  });
  blocks.registerCustomComponent("cdw:board", {
    onPlayerInteract(e) {
      const p = e.player;
      if (p) system18.run(() => void openBounties(p));
    }
  });
  blocks.registerCustomComponent("cdw:runestone", {
    onPlayerInteract(e) {
      const p = e.player;
      const loc = e.block.location;
      if (p) system18.run(() => onRuneStone(p, loc));
    }
  });
  blocks.registerCustomComponent("cdw:heart", {
    onPlayerInteract(e) {
      const p = e.player;
      const loc = e.block.location;
      if (p) system18.run(() => void onHeart(p, loc));
    }
  });
  blocks.registerCustomComponent("cdw:altar", {
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      system18.run(async () => {
        const inv = p.getComponent("minecraft:inventory")?.container;
        let has = false;
        if (inv) {
          for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === "cdw:beschwoerungsstein") has = true;
        }
        if (!has) {
          msg(p, "\xA77Der Altar wartet auf einen \xA7dBeschw\xF6rungsstein\xA77.");
          return;
        }
        if (!await confirm(p, "\xA7cDer Uralte", "\xA77Den Uralten Wurzelwyrm beschw\xF6ren? \xA7cSehr gef\xE4hrlich \u2013 empfohlen ab Stufe 50, gemeinsam.")) return;
        const err = summonWorldBoss(p);
        if (err) msg(p, `\xA7c${err}`);
        else takeItem(p, "cdw:beschwoerungsstein", 1);
      });
    }
  });
  blocks.registerCustomComponent("cdw:blight", {
    onRandomTick(e) {
      if (Math.random() < 0.02) {
        try {
          e.block.setPermutation(BlockPermutation3.resolve("minecraft:moss_block"));
        } catch {
        }
      }
    }
  });
}
function initItemWatch() {
  world17.afterEvents.playerInventoryItemChange.subscribe((ev) => {
    const it = ev.itemStack;
    if (!it || !it.typeId.startsWith("cdw:")) return;
    const p = ev.player;
    const slot = ev.slot;
    system18.run(() => {
      try {
        const inv = p.getComponent("minecraft:inventory")?.container;
        const cur = inv?.getItem(slot);
        if (!cur || cur.typeId !== it.typeId) return;
        const changed = ensureItem(cur);
        if (changed) inv.setItem(slot, changed);
        const g = changed ? void 0 : void 0;
        if (cur.typeId.startsWith("cdw:") && weaponOf(cur.typeId)?.unique) {
          const d = pdata(p);
          d.stats.legendaries = Math.max(d.stats.legendaries ?? 0, 1);
          markDirty(p);
        }
      } catch {
      }
    });
  });
}

// src/world/actions.ts
import { system as system19, world as world18 } from "@minecraft/server";
function setNpcHomeFlags(id, x, y, z) {
  const f = wdata().flags;
  f[`npc_${id}_x`] = x;
  f[`npc_${id}_y`] = y;
  f[`npc_${id}_z`] = z;
  f[`npc_${id}_gone`] = 0;
  markWorldDirty();
}
function runAction(a, p) {
  const parts = a.split(":");
  try {
    switch (parts[0]) {
      case "classpick":
        for (const pl of players()) if (!pdata(pl).cls) system19.runTimeout(() => void openClassPick(pl), 40);
        break;
      case "spawn":
        spawnAction(parts[1], Number(parts[2]), parts[3], parts[4]);
        break;
      case "defense":
        startDefense(parts[1]);
        break;
      case "camp":
        setupCamp();
        break;
      case "zone":
        ensureLocation(parts[1]);
        setFlag(`zone_${parts[1]}`);
        break;
      case "npc_dungeon": {
        const st = ensureLocation(parts[2]);
        if (st) {
          setNpcHomeFlags(parts[1], st.x - 10.5, st.y + 1, st.z + 6.5);
          wdata().flags[`npc_${parts[1]}_ybuild`] = 1;
        }
        break;
      }
      case "hub_stage":
        void upgradeHub(Number(parts[1]));
        break;
      case "npc_home": {
        const hub = hubPos();
        const spot = HUB_SPOTS[parts[1]];
        if (!hub || !spot) break;
        despawnNpc(parts[1]);
        wdata().flags.kael_away = 0;
        setNpcHomeFlags(parts[1], hub.x + spot.x + 0.5, hub.y + spot.y, hub.z + spot.z + 0.5);
        const loc = npcHome(parts[1]);
        if (loc) {
          try {
            if (world18.getDimension("minecraft:overworld").isChunkLoaded(loc)) spawnNpc(parts[1], loc);
          } catch {
          }
        }
        break;
      }
      case "kael_away":
        wdata().flags.kael_away = 1;
        setNpcGone("kael", true);
        break;
      case "free_upgrade":
        for (const pl of players()) {
          pdata(pl).stats.freeUpgrade = 1;
          markDirty(pl);
        }
        break;
      case "citadel":
        ensureLocation("zitadelle");
        broadcast("\xA74\u2726 Die Zitadelle des Welkens ist erschienen. \xA77Folge dem Wegpunkt.");
        break;
      case "endgame":
        setFlag("endgame");
        break;
      default:
        log("Unbekannte Aktion:", a);
    }
  } catch (e) {
    log("Aktion fehlgeschlagen:", a, String(e));
  }
}
function resolveTarget(t) {
  switch (t.k) {
    case "hub": {
      const h = hubPos();
      return h ? { x: h.x + 0.5, y: h.y + 1, z: h.z + 0.5 } : void 0;
    }
    case "npc": {
      const h = npcHome(t.id);
      if (h) return h;
      if (t.id === "kael") return campPos();
      const hub = hubPos();
      const spot = HUB_SPOTS[t.id];
      return hub && spot ? V.add(hub, spot) : hub;
    }
    case "dungeon":
      return dungeonPos(t.id);
    case "camp":
      return campPos();
  }
  return void 0;
}
function initActions() {
  hooks.action = runAction;
  hooks.resolveTarget = resolveTarget;
  hooks.onMainChanged = () => system19.run(refreshHud);
}

// src/selftest.ts
import { ItemStack as ItemStack9, system as system20, world as world19 } from "@minecraft/server";
var BLOCKS_TO_CHECK = [
  "cdw:wegstein",
  "cdw:wegstein_eigen",
  "cdw:kopfgeldbrett",
  "cdw:runenstein",
  "cdw:wurzelherz",
  "cdw:barriere",
  "cdw:faeulnis",
  "cdw:altar"
];
function report(msg2) {
  log(msg2);
  try {
    world19.sendMessage(`\xA77[Test] ${msg2}`);
  } catch {
  }
}
async function runSelfTest(mode = "all") {
  const errors = [];
  report(`Selbsttest startet (${mode})\u2026`);
  for (const b of BLOCKS_TO_CHECK) if (!perm(b)) errors.push(`Block fehlt: ${b}`);
  const itemIds = [...ALL_WEAPONS.map((w) => `cdw:${w.id}`), ...ALL_SIMPLE.map((s2) => `cdw:${s2.id}`), ...ARMOR_SETS.flatMap((s2) => ARMOR_SLOTS.map((sl) => `cdw:${s2.id}_${sl.slot}`))];
  for (const id of itemIds) {
    try {
      new ItemStack9(id, 1);
    } catch {
      errors.push(`Item fehlt: ${id}`);
    }
  }
  try {
    createGear("cdw:schwert_bronze", 4);
  } catch (e) {
    errors.push(`createGear: ${String(e)}`);
  }
  report(`Items gepr\xFCft: ${itemIds.length}`);
  const dim = world19.getDimension("minecraft:overworld");
  const base = { x: 1e4, y: 100, z: 1e4 };
  try {
    await world19.tickingAreaManager.createTickingArea("cdw_test", { dimension: dim, from: { x: base.x - 40, y: 0, z: base.z - 140 }, to: { x: base.x + 40, y: 0, z: base.z + 40 } });
  } catch (e) {
    errors.push(`Ticking-Area: ${String(e)}`);
  }
  const ents = [...MOBS.map((m) => m.id), ...PROJECTILES.map((p) => p.id), "npc", "geisterwolf"];
  let ok = 0;
  for (const id of ents) {
    try {
      const e = dim.spawnEntity(`cdw:${id}`, { x: base.x, y: 120, z: base.z });
      ok++;
      e.remove();
    } catch (e) {
      errors.push(`Entity ${id}: ${String(e)}`);
    }
  }
  report(`Entities gespawnt: ${ok}/${ents.length}`);
  if (mode === "all" || mode === "build") {
    const w = wdata();
    const oldHub = w.hub;
    const top = dim.getTopmostBlock({ x: base.x, z: base.z });
    w.hub = { x: base.x, y: top?.y ?? 64, z: base.z, stage: 0 };
    markWorldDirty();
    const t0 = Date.now();
    await buildHub(0, true);
    await buildHub(5, false);
    report(`Hain gebaut (Stufe 0\u21925) in ${Date.now() - t0} ms`);
    for (const d of DUNGEONS) {
      const t1 = Date.now();
      try {
        await testBuildDungeon(d.id, { x: base.x + 200 + DUNGEONS.indexOf(d) * 60, z: base.z });
        report(`Dungeon ${d.id} gebaut in ${Date.now() - t1} ms`);
      } catch (e) {
        errors.push(`Dungeon ${d.id}: ${String(e)}`);
      }
    }
    w.hub = oldHub;
    markWorldDirty();
  }
  try {
    world19.tickingAreaManager.removeTickingArea("cdw_test");
  } catch {
  }
  if (errors.length) for (const e of errors) report(`\xA7cFEHLER: ${e}`);
  report(errors.length ? `Selbsttest beendet: ${errors.length} Fehler` : "Selbsttest beendet: OK");
  log(`SELFTEST_DONE errors=${errors.length}`);
}
function initSelfTest() {
  system20.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "cdw:selftest") void runSelfTest(ev.message || "all");
  });
}

// src/debug.ts
import { ItemStack as ItemStack10, system as system21, world as world20 } from "@minecraft/server";
function byName(name) {
  return world20.getAllPlayers().find((p) => p.name === name);
}
function reply(obj) {
  const s2 = JSON.stringify(obj);
  log("CDW_STATE " + s2);
  try {
    system21.sendScriptEvent("cdwtest:state", s2.slice(0, 2e3));
  } catch {
  }
}
function initDebug() {
  system21.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id !== "cdw:debug") return;
    const [cmd, ...args] = ev.message.trim().split(/\s+/);
    const p = args[0] ? byName(args[0]) : void 0;
    try {
      switch (cmd) {
        case "autotest":
          autotest.on = args[0] !== "off";
          log("Autotest", autotest.on ? "an" : "aus");
          break;
        case "talk": {
          const npc = world20.getDimension("minecraft:overworld").getEntities({ type: "cdw:npc", tags: [`cdw_npc:${args[1]}`] })[0];
          if (p && npc) void onNpcInteract(p, npc);
          break;
        }
        case "cast":
          if (p) castRune(p, args[1]);
          break;
        case "scan": {
          const [x1, y1, z1, x2, y2, z2] = args.map(Number);
          const dim = world20.getDimension("minecraft:overworld");
          const pal = [];
          const out = [];
          void world20.tickingAreaManager.createTickingArea("cdw_scan", { dimension: dim, from: { x: x1, y: 0, z: z1 }, to: { x: x2, y: 0, z: z2 } }).then(() => system21.runJob(
            function* () {
              let n = 0;
              for (let y = y1; y <= y2; y++)
                for (let x = x1; x <= x2; x++)
                  for (let z = z1; z <= z2; z++) {
                    const b = dim.getBlock({ x, y, z });
                    if (b && !b.isAir) {
                      let i = pal.indexOf(b.typeId);
                      if (i < 0) i = pal.push(b.typeId) - 1;
                      out.push(x - x1, y - y1, z - z1, i);
                    }
                    if (++n % 3e3 === 0) yield;
                  }
              const s2 = JSON.stringify({ pal, out });
              for (let i = 0; i < s2.length; i += 8e3) log(`CDW_SCAN ${i / 8e3} ${s2.slice(i, i + 8e3)}`);
              log("CDW_SCAN_END");
            }()
          ));
          break;
        }
        case "hubat": {
          const [x, z] = args.map(Number);
          const dim = world20.getDimension("minecraft:overworld");
          void world20.tickingAreaManager.createTickingArea("cdw_dbg", { dimension: dim, from: { x: x - 30, y: 0, z: z - 30 }, to: { x: x + 30, y: 0, z: z + 30 } }).then(() => {
            const s2 = surfaceY(dim, x, z);
            wdata().hub = { x, y: s2?.y ?? 64, z, stage: 0 };
            markWorldDirty();
            void buildHub(0, true).then(() => log("HUB_BUILT", JSON.stringify(wdata().hub)));
          });
          break;
        }
        case "hubstage":
          void upgradeHub(Number(args[0])).then(() => log("HUB_STAGE_DONE"));
          break;
        case "hubscan": {
          const h = wdata().hub;
          if (h) system21.sendScriptEvent("cdw:debug", `scan ${h.x - 23} ${h.y - 4} ${h.z - 23} ${h.x + 23} ${h.y + 34} ${h.z + 23}`);
          break;
        }
        case "dgat": {
          const [id, x, z] = [args[0], Number(args[1]), Number(args[2])];
          void testBuildDungeon(id, { x, z }).then((st) => {
            log("DG_BUILT", JSON.stringify({ x: st.x, y: st.y, z: st.z }));
            if (args[3] === "scan") system21.sendScriptEvent("cdw:debug", `scan ${st.x} ${st.y - 18} ${st.z - 118} ${st.x} ${st.y + 60} ${st.z + 10}`);
          });
          break;
        }
        case "gold":
          if (p) addGold(p, Number(args[1]), "", false);
          break;
        case "give":
          if (p) giveItem(p, new ItemStack10(args[1], Number(args[2] ?? 1)));
          break;
        case "gear":
          if (p) giveItem(p, createGear(args[1], Number(args[2] ?? 0)));
          break;
        case "buy":
          if (p) reply({ buy: buyOffer(p, args[1], Number(args[2])) });
          break;
        case "upgrade":
          if (p) void upgradeMenu(p);
          break;
        case "sell":
          if (p) void openSell(p, true);
          break;
        case "drink":
          if (p) applyConsumable(p, args[1]);
          break;
        case "plant":
          if (p) void plantHub(p, { x: Math.floor(p.location.x), y: Math.floor(p.location.y) - 1, z: Math.floor(p.location.z) }).then(() => emit("flag", { key: "hub_planted", player: p }));
          break;
        case "class":
          if (p) setClass(p, args[1], true);
          break;
        case "main": {
          const w = wdata();
          w.main.idx = Number(args[0]);
          w.main.s = Number(args[1] ?? (MAIN[w.main.idx]?.giver ? -1 : 0));
          w.main.c = 0;
          markWorldDirty();
          break;
        }
        case "flag":
          emit("flag", { key: args[1] ?? args[0], player: p });
          break;
        case "dungeon": {
          const st = ensureLocation(args[0]);
          reply({ dungeon: args[0], st });
          break;
        }
        case "mob": {
          const e = world20.getEntity(args[0]);
          if (e) reply({ mob: e.typeId, info: getInfo(e), hp: mobHp(e) });
          break;
        }
        case "state": {
          if (!p) return;
          const d = pdata(p);
          const s2 = stats(p);
          const w = wdata();
          reply({
            name: p.name,
            cls: d.cls,
            lvl: s2.level,
            xp: d.xp,
            gold: d.gold,
            hp: hpInfo(p),
            mana: Math.round(getMana(p)),
            maxHp: s2.maxHp,
            main: w.main,
            hub: w.hub,
            quests: d.quests,
            done: d.done,
            ws: d.waystones,
            kills: d.stats.kills ?? 0,
            dungeons: Object.fromEntries(Object.entries(w.dungeons).map(([k, v]) => [k, { x: v.x, y: v.y, z: v.z, built: v.built, stage: v.stage, boss: v.boss, heart: v.heart, data: v.data }])),
            morgra: w.morgra
          });
          break;
        }
      }
    } catch (e) {
      log("Debug-Fehler:", String(e));
    }
  });
}

// src/main.ts
system22.beforeEvents.startup.subscribe((ev) => {
  registerComponents(ev);
  const reg = ev.customCommandRegistry;
  reg.registerCommand({ name: "cdw:buch", description: "\xD6ffnet das Abenteuerbuch (und gibt es zur\xFCck, falls verloren).", permissionLevel: CommandPermissionLevel.Any }, (origin) => {
    const p = origin.sourceEntity;
    if (p?.typeId !== "minecraft:player") return { status: CustomCommandStatus.Failure, message: "Nur f\xFCr Spieler." };
    system22.run(() => {
      ensureBook(p);
      void openBook(p);
    });
    return { status: CustomCommandStatus.Success };
  });
  reg.registerCommand({ name: "cdw:rpghud", description: "Schaltet das RPG-HUD an/aus.", permissionLevel: CommandPermissionLevel.Any }, (origin) => {
    const p = origin.sourceEntity;
    if (p?.typeId !== "minecraft:player") return { status: CustomCommandStatus.Failure };
    system22.run(() => {
      const d = pdata(p);
      d.settings.hud = !d.settings.hud;
      markDirty(p);
      msg(p, `\xA77HUD ${d.settings.hud ? "\xA7aan" : "\xA7caus"}`);
    });
    return { status: CustomCommandStatus.Success };
  });
  reg.registerCommand({ name: "cdw:test", description: "Selbsttest des RPG-Add-ons (Admin).", permissionLevel: CommandPermissionLevel.GameDirectors }, () => {
    system22.run(() => void runSelfTest());
    return { status: CustomCommandStatus.Success, message: "Selbsttest gestartet \u2013 siehe Chat/Log." };
  });
});
function ensureBook(p) {
  const inv = p.getComponent("minecraft:inventory");
  if (!inv) return;
  for (let i = 0; i < inv.container.size; i++) if (inv.container.getItem(i)?.typeId === "cdw:buch") return;
  giveItem(p, new ItemStack11("cdw:buch", 1));
}
function onJoin(p) {
  const d = pdata(p);
  if (d.intro === 0) {
    d.intro = 1;
    markDirty(p);
    ensureBook(p);
    if (!wdata().hub) {
      giveItem(p, new ItemStack11("cdw:samen", 1));
      system22.runTimeout(() => {
        if (isValid(p)) void dialog(p, MAIN[0].intro);
      }, 60);
    } else {
      system22.runTimeout(() => {
        if (!isValid(p)) return;
        msg(p, "\xA7a\u2726 Willkommen, W\xE4chter! \xA77Der Hain wurde bereits gepflanzt. \xD6ffne dein \xA7eAbenteuerbuch\xA77, um zu beginnen.");
        if (wdata().main.idx >= 1 && !pdata(p).cls) void openClassPick(p);
      }, 60);
    }
  } else if (wdata().main.idx >= 2 && !d.cls) {
    system22.runTimeout(() => isValid(p) && void openClassPick(p), 80);
  }
  grantPendingMain(p);
  refreshBounties(p);
  applyNameTag(p);
}
function init() {
  initStore();
  initActions();
  initCombat();
  initAbilities();
  initQuests();
  initHud();
  initAchievements();
  initItemWatch();
  initDungeons();
  initBosses();
  initEvents();
  initEliteAura();
  initSelfTest();
  initDebug();
  world21.afterEvents.playerSpawn.subscribe((ev) => {
    if (ev.initialSpawn) system22.runTimeout(() => isValid(ev.player) && onJoin(ev.player), 40);
  });
  world21.afterEvents.playerLeave.subscribe((ev) => {
    forgetStats(ev.playerId);
    forgetHud(ev.playerId);
  });
  world21.afterEvents.playerInteractWithEntity.subscribe((ev) => {
    if (ev.target.typeId === "cdw:npc") void onNpcInteract(ev.player, ev.target);
  });
  world21.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    if (autotest.on) log("Interaktion", ev.player.name, ev.target.typeId);
  });
  world21.afterEvents.entitySpawn.subscribe((ev) => {
    const e = ev.entity;
    system22.runTimeout(() => {
      if (isValid(e) && isHostile(e)) assignLevel(e);
    }, 2);
  });
  world21.afterEvents.entityLoad.subscribe((ev) => {
    const e = ev.entity;
    if (isValid(e) && isHostile(e)) assignLevel(e);
  });
  system22.runInterval(() => {
    try {
      maintainNpcs();
    } catch (e) {
      log("NPC-Pflege:", String(e));
    }
  }, 100);
  system22.beforeEvents.shutdown.subscribe(() => {
    try {
      saveWorld();
    } catch {
    }
  });
  system22.runTimeout(() => {
    for (const p of players()) onJoin(p);
  }, 20);
  log("Chroniken des Weltenbaums geladen.");
}
world21.afterEvents.worldLoad.subscribe(() => init());
