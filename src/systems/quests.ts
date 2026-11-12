// Quest-Engine: Hauptstory (gemeinsam für die Welt), Nebenquests & Kopfgeld (pro Spieler).
import { EntityInventoryComponent, ItemStack, Player, system, world } from "@minecraft/server";
import { BOUNTIES, BountyTemplate, MAIN, Obj, QuestDef, SIDE, Stage, Target, questById } from "../data/quests";
import { on } from "../core/bus";
import { flag, markDirty, markWorldDirty, pdata, setFlag, wdata } from "../core/store";
import { V, broadcast, dayNumber, fmt, hashStr, isValid, msg, players, seeded, sound, title } from "../core/util";
import { createGear, randomGearFor } from "./gear";
import { addGold, addRep, addXp } from "./progression";
import { level } from "./stats";
import { dialog } from "./ui";

// Von anderen Systemen gesetzte Hooks (vermeidet Zirkelimporte)
export const hooks: {
  action: (a: string, p?: Player) => void;
  resolveTarget: (t: Target) => { x: number; y: number; z: number; d?: string } | undefined;
  onMainChanged: () => void;
} = {
  action: () => undefined,
  resolveTarget: () => undefined,
  onMainChanged: () => undefined,
};

// ---------------- Hilfen ----------------
export function countItem(p: Player, typeId: string): number {
  const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
  if (!inv) return 0;
  let n = 0;
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (it?.typeId === typeId) n += it.amount;
  }
  return n;
}

export function takeItem(p: Player, typeId: string, count: number): boolean {
  const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
  if (!inv || countItem(p, typeId) < count) return false;
  let left = count;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const it = inv.getItem(i);
    if (it?.typeId !== typeId) continue;
    if (it.amount <= left) {
      left -= it.amount;
      inv.setItem(i, undefined);
    } else {
      it.amount -= left;
      left = 0;
      inv.setItem(i, it);
    }
  }
  return true;
}

export function giveItem(p: Player, item: ItemStack): void {
  const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
  const rest = inv?.addItem(item);
  if (rest) p.dimension.spawnItem(rest, p.location);
}

function matchesKill(obj: Obj, typeId: string, families: string[]): boolean {
  if (obj.type !== "kill") return false;
  if (obj.mobs && obj.mobs.includes(typeId)) return true;
  if (obj.fam && families.includes(obj.fam)) return true;
  return false;
}

function objCount(obj: Obj): number {
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

export function itemName(id: string): string {
  return id.replace("cdw:", "").replace("minecraft:", "").replace(/_/g, " ");
}

// ---------------- Hauptquest ----------------
export function mainQuest(): QuestDef | undefined {
  return MAIN[wdata().main.idx];
}
export function mainStage(): Stage | undefined {
  const q = mainQuest();
  const s = wdata().main.s;
  return q && s >= 0 ? q.stages[s] : undefined;
}
export function mainFinished(): boolean {
  return wdata().main.idx >= MAIN.length;
}

/** Tracker-Text der Hauptquest. */
export function mainTracker(): { text: string; target?: Target; quest?: QuestDef } | undefined {
  const q = mainQuest();
  if (!q) return undefined;
  const m = wdata().main;
  if (m.s < 0 && q.giver) return { text: `Sprich mit ${npcName(q.giver)}`, target: { k: "npc", id: q.giver }, quest: q };
  if (m.s >= q.stages.length) return { text: `Kehre zu ${npcName(q.turnIn ?? "sylva")} zurück`, target: { k: "npc", id: q.turnIn ?? "sylva" }, quest: q };
  const st = q.stages[m.s];
  const n = objCount(st.obj);
  const prog = n > 1 ? ` §7(${m.c}/${n})` : "";
  return { text: st.text + prog, target: st.target, quest: q };
}

function npcName(id: string): string {
  const names: Record<string, string> = { sylva: "Sylva", kael: "Kael", brom: "Brom", mira: "Mira", oswin: "Oswin", fennick: "Fennick", morgra: "Morgra" };
  return names[id] ?? id;
}

function startStage(q: QuestDef, s: number, trigger?: Player): void {
  const st = q.stages[s];
  if (!st) return;
  for (const a of st.start ?? []) hooks.action(a, trigger);
  for (const p of players()) {
    title(p, "§6Neues Ziel", `§f${st.text}`, 5, 50, 10);
    sound(p, "random.orb", undefined, 1.2, 0.6);
  }
  if (st.lines?.length) {
    const viewers = trigger ? [trigger] : players();
    for (const p of viewers) void dialog(p, st.lines);
    for (const p of players()) if (!viewers.includes(p)) msg(p, `§7(Dialog: siehe Abenteuerbuch → Quests)`);
  }
  hooks.onMainChanged();
}

function advanceMain(trigger?: Player): void {
  const w = wdata();
  const q = mainQuest();
  if (!q) return;
  w.main.s++;
  w.main.c = 0;
  markWorldDirty();
  if (w.main.s < q.stages.length) {
    startStage(q, w.main.s, trigger);
    // sofort prüfen (z. B. Gegenstände schon im Inventar)
    system.runTimeout(() => checkMainPassive(), 5);
    return;
  }
  if (q.turnIn) {
    for (const p of players()) {
      title(p, "§aZiel erreicht", `§fKehre zu ${npcName(q.turnIn)} zurück`, 5, 50, 10);
      sound(p, "random.levelup", undefined, 1.6, 0.5);
    }
    hooks.onMainChanged();
    return;
  }
  void completeMain(trigger);
}

async function completeMain(trigger?: Player): Promise<void> {
  const w = wdata();
  const q = mainQuest();
  if (!q) return;
  const idx = w.main.idx;
  // Outro
  if (q.outro.length) {
    const viewers = trigger ? [trigger] : players();
    for (const p of players()) if (!viewers.includes(p)) msg(p, `§7${trigger?.name ?? "Jemand"} hat „${q.title}“ abgeschlossen. (Dialog: Abenteuerbuch → Chronik)`);
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
      for (const p of players()) msg(p, `§6✦ Neue Hauptquest: §f${next.title} §7– sprich mit ${npcName(next.giver)}.`);
      hooks.onMainChanged();
    }
  } else hooks.onMainChanged();
}

/** Belohnungen abgeschlossener Hauptquests (auch nachträglich für Offline-Spieler). */
export function grantPendingMain(p: Player): void {
  const d = pdata(p);
  const done = wdata().main.idx - 1;
  while (d.mainRewarded < done) {
    d.mainRewarded++;
    const q = MAIN[d.mainRewarded];
    if (!q) continue;
    msg(p, `§6✦ Quest abgeschlossen: §f${q.title}`);
    title(p, "§6Quest abgeschlossen", `§f${q.title}`, 5, 50, 10);
    giveRewards(p, q.rewards);
  }
  markDirty(p);
}

export function giveRewards(p: Player, r: QuestDef["rewards"]): void {
  if (r.xp) addXp(p, r.xp, "(Quest)");
  if (r.gold) addGold(p, r.gold, "(Quest)", false);
  if (r.rep) addRep(p, r.rep);
  for (const it of r.items ?? []) {
    const id = it.id.includes(":") ? it.id : `cdw:${it.id}`;
    try {
      giveItem(p, new ItemStack(id, it.n));
    } catch {
      /* ignorieren */
    }
  }
  if (r.gear) {
    const typeId = randomGearFor(level(p), pdata(p).cls, r.gear.armor ? 1 : 0);
    try {
      const item = createGear(typeId, r.gear.rarity);
      giveItem(p, item);
      msg(p, `§a+ ${item.nameTag ?? typeId}`);
    } catch {
      /* ignorieren */
    }
  }
  if (r.title) {
    const d = pdata(p);
    if (!d.ach.includes(`title:${r.title}`)) d.ach.push(`title:${r.title}`);
    msg(p, `§d✦ Neuer Titel freigeschaltet: §f${r.title} §7(Abenteuerbuch → Erfolge)`);
    markDirty(p);
  }
  sound(p, "random.levelup", undefined, 1.3, 0.7);
}

/** Hauptquest annehmen (Gespräch mit Questgeber). */
export async function acceptMain(p: Player): Promise<void> {
  const q = mainQuest();
  if (!q || wdata().main.s >= 0) return;
  await dialog(p, q.intro, "§a» Auftrag annehmen");
  if (wdata().main.idx !== MAIN.indexOf(q) || wdata().main.s >= 0) return;
  wdata().main.s = 0;
  wdata().main.c = 0;
  markWorldDirty();
  for (const o of players()) if (o.id !== p.id) msg(o, `§6✦ ${p.name} hat die Hauptquest „${q.title}“ angenommen.`);
  startStage(q, 0, p);
  system.runTimeout(() => checkMainPassive(), 5);
}

export async function turnInMain(p: Player): Promise<void> {
  const q = mainQuest();
  if (!q || wdata().main.s < q.stages.length) return;
  await completeMain(p);
}

// ---------------- Nebenquests ----------------
export function sideAvailable(p: Player, npc: string): QuestDef[] {
  const d = pdata(p);
  const lvl = level(p);
  const stage = wdata().hub?.stage ?? 0;
  return SIDE.filter((q) => {
    if (q.giver !== npc) return false;
    if (d.done.includes(q.id) || d.quests[q.id]) return false;
    if (q.minLevel && lvl < q.minLevel) return false;
    if (q.minStage !== undefined && stage < q.minStage) return false;
    if (q.requires && !q.requires.every((r) => d.done.includes(r))) return false;
    if (q.needsChoice && wdata().morgra !== q.needsChoice) return false;
    return true;
  });
}

export function sideActive(p: Player): QuestDef[] {
  return Object.keys(pdata(p).quests)
    .map((id) => questById(id))
    .filter((q): q is QuestDef => !!q);
}

export function sideTracker(p: Player, q: QuestDef): { text: string; target?: Target } {
  const qp = pdata(p).quests[q.id];
  if (!qp) return { text: q.title };
  if (qp.s >= q.stages.length) return { text: `Kehre zu ${npcName(q.turnIn ?? q.giver ?? "sylva")} zurück`, target: { k: "npc", id: q.turnIn ?? q.giver ?? "sylva" } };
  const st = q.stages[qp.s];
  const n = objCount(st.obj);
  return { text: st.text + (n > 1 ? ` §7(${qp.c}/${n})` : ""), target: st.target };
}

export async function acceptSide(p: Player, q: QuestDef): Promise<void> {
  await dialog(p, q.intro, "§a» Auftrag annehmen");
  const d = pdata(p);
  if (d.quests[q.id] || d.done.includes(q.id)) return;
  d.quests[q.id] = { s: 0, c: 0, t: Date.now() };
  if (!d.tracked) d.tracked = q.id;
  markDirty(p);
  title(p, "§eNeue Nebenquest", `§f${q.title}`, 5, 40, 10);
  sound(p, "random.orb", undefined, 1, 0.8);
  for (const a of q.stages[0].start ?? []) hooks.action(a, p);
  checkSidePassive(p);
}

function advanceSide(p: Player, q: QuestDef): void {
  const d = pdata(p);
  const qp = d.quests[q.id];
  if (!qp) return;
  qp.s++;
  qp.c = 0;
  markDirty(p);
  if (qp.s < q.stages.length) {
    title(p, "§eNeues Ziel", `§f${q.stages[qp.s].text}`, 5, 40, 10);
    for (const a of q.stages[qp.s].start ?? []) hooks.action(a, p);
    checkSidePassive(p);
    return;
  }
  title(p, "§aZiel erreicht", `§fKehre zu ${npcName(q.turnIn ?? q.giver ?? "sylva")} zurück`, 5, 40, 10);
  sound(p, "random.levelup", undefined, 1.6, 0.5);
}

export async function turnInSide(p: Player, q: QuestDef): Promise<void> {
  const d = pdata(p);
  const qp = d.quests[q.id];
  if (!qp || qp.s < q.stages.length) return;
  await dialog(p, q.outro, "§a» Belohnung annehmen");
  if (!d.quests[q.id]) return;
  delete d.quests[q.id];
  d.done.push(q.id);
  if (d.tracked === q.id) d.tracked = undefined;
  markDirty(p);
  title(p, "§6Nebenquest abgeschlossen", `§f${q.title}`, 5, 50, 10);
  giveRewards(p, q.rewards);
  for (const a of q.done ?? []) hooks.action(a, p);
}

export function abandonSide(p: Player, id: string): void {
  const d = pdata(p);
  delete d.quests[id];
  if (d.tracked === id) d.tracked = undefined;
  markDirty(p);
}

// ---------------- Kopfgeld ----------------
export function actReached(): number {
  const idx = wdata().main.idx;
  if (idx >= MAIN.length) return 7;
  return MAIN[Math.max(0, idx - 1)]?.act ?? 0;
}

export function refreshBounties(p: Player): void {
  const d = pdata(p);
  const day = dayNumber();
  if (d.bounty.day === day && d.bounty.list.length) return;
  const act = actReached();
  const pool = BOUNTIES.filter((b) => b.minAct <= act);
  const rnd = seeded(hashStr(`${day}:${world.seed}`));
  const chosen: BountyTemplate[] = [];
  const copy = [...pool];
  while (chosen.length < 3 && copy.length) chosen.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  d.bounty.day = day;
  d.bounty.list = chosen.map((b) => ({ id: b.id, c: 0, done: false }));
  markDirty(p);
}

export function bountyReward(p: Player, b: BountyTemplate): { xp: number; gold: number } {
  const lvl = level(p);
  return { xp: Math.round((120 + lvl * lvl * 6) * b.mult), gold: Math.round((25 + lvl * 4) * b.mult) };
}

function completeBounty(p: Player, b: BountyTemplate): void {
  const r = bountyReward(p, b);
  const d = pdata(p);
  d.bounty.total++;
  d.stats.bounties = (d.stats.bounties ?? 0) + 1;
  markDirty(p);
  title(p, "§6Kopfgeld erfüllt!", `§f${b.text}`, 5, 50, 10);
  addXp(p, r.xp, "(Kopfgeld)");
  addGold(p, r.gold, "(Kopfgeld)", false);
  addRep(p, 40);
  if (Math.random() < 0.35) {
    try {
      giveItem(p, createGear(randomGearFor(level(p), d.cls), 1));
    } catch {
      /* ignorieren */
    }
  }
}

// ---------------- Fortschritt ----------------
function onKill(p: Player, typeId: string, families: string[], elite: boolean): void {
  // Hauptquest (gemeinsam)
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
  // Nebenquests
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
  // Kopfgeld
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

/** Flag-Fortschritt: Hauptquest (global) und Neben-/Kopfgeldquests des Spielers. */
export function progressFlag(key: string, p?: Player, amount = 1): void {
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

/** Gespräch mit NPC als Questziel. Gibt true zurück, wenn ein Questschritt passiert ist. */
export async function talkTo(p: Player, npc: string): Promise<boolean> {
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
      // Talk-Ziel am Ende ohne turnIn → Outro direkt
      return true;
    }
  }
  // Nebenquests abgeben / Gesprächsziele
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

/** Periodische Prüfung: Erreichen, Sammeln, Stufe. */
function checkMainPassive(): void {
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

function checkSidePassive(p: Player): void {
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
      // Abgabe erfolgt am Kopfgeldbrett
    }
  }
}

export function turnInBountyItems(p: Player): number {
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

/** Questspezifische Beute (z. B. Seiten nur während der Quest). */
function questDrops(p: Player, typeId: string, loc: { x: number; y: number; z: number }): void {
  const st = mainStage();
  const tryDrop = (stage: Stage | undefined) => {
    if (!stage?.drop || !stage.drop.mobs.includes(typeId)) return;
    if (stage.obj.type === "collect" && countItem(p, stage.obj.item) >= stage.obj.count) return;
    if (Math.random() < stage.drop.chance) {
      try {
        p.dimension.spawnItem(new ItemStack(`cdw:${stage.drop.item}`, 1), loc);
      } catch {
        /* ignorieren */
      }
    }
  };
  tryDrop(st);
  const d = pdata(p);
  for (const [id, qp] of Object.entries(d.quests)) tryDrop(questById(id)?.stages[qp.s]);
}

export function initQuests(): void {
  on("kill", (ev) => {
    if (!isValid(ev.player)) return;
    onKill(ev.player, ev.typeId, ev.families, !!ev.info?.elite);
    questDrops(ev.player, ev.typeId, ev.location);
  });
  on("flag", (ev) => progressFlag(ev.key, ev.player));
  system.runInterval(() => {
    checkMainPassive();
    for (const p of players()) {
      checkSidePassive(p);
      refreshBounties(p);
    }
  }, 30);
}

export function setTracked(p: Player, id: string | undefined): void {
  pdata(p).tracked = id;
  markDirty(p);
  hooks.onMainChanged();
}

export function questLog(p: Player): string {
  const lines: string[] = [];
  const mt = mainTracker();
  if (mt?.quest) lines.push(`§6★ ${mt.quest.title}\n§7  ${mt.text}`);
  for (const q of sideActive(p)) lines.push(`§e• ${q.title}\n§7  ${sideTracker(p, q).text}`);
  return lines.join("\n") || "§7Keine aktiven Quests.";
}

export { flag, setFlag, fmt, broadcast };
