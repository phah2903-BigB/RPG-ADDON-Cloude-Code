// NPC-Gespräche & Funktionen.
import { Entity, Player, system } from "@minecraft/server";
import { CLASS_CHANGE_COST, MAX_LEVEL, RESPEC_COST_PER_LEVEL } from "../data/balance";
import { MAIN, BOUNTIES } from "../data/quests";
import { npcById } from "../data/mobs";
import { markDirty, pdata, wdata } from "../core/store";
import { fmt, msg, sound } from "../core/util";
import { acceptSide, bountyReward, refreshBounties, sideActive, sideAvailable, sideTracker, talkTo, turnInBountyItems } from "../systems/quests";
import { spendGold } from "../systems/progression";
import { invalidate, level } from "../systems/stats";
import { confirm, dialog, menu, MenuButton } from "../systems/ui";
import { DUNGEONS, startHeroic } from "../world/dungeons";
import { lookAtPlayer, npcIdOf } from "../world/npcs";
import { openClassPick } from "./classpick";
import { openForge, openSell, openShop, openSmith } from "./shop";
import { openAchievements, openChronicle } from "./book";
import { summonWorldBoss } from "../world/events";

const GREET: Record<string, string[]> = {
  sylva: ["Die Wurzeln flüstern deinen Namen, Wächter.", "Der Hain ist stärker, seit du hier bist.", "Brauchst du Rat?"],
  fennick: ["Fennick! Feinste Waren, fairste Preise. Meistens.", "Was darf's sein, mein Freund?", "Kaufen, verkaufen – alles ist Handel!"],
  kael: ["Halt die Augen offen.", "Die Jagd ruft.", "Was brauchst du?"],
  brom: ["Hmpf. Was willst du?", "Die Esse ist heiß. Mach schnell.", "Zeig her, was du da schleppst."],
  mira: ["Oh! Hallo! Nicht anfassen, das blubbert!", "Du siehst durstig aus. Trank?", "Ich hab da eine Theorie…"],
  oswin: ["Ah, die Chronik wächst.", "Jedes Kapitel braucht einen Helden.", "Hast du neue Seiten gefunden?"],
  morgra: ["Was willst du?", "Das Moor schläft. Endlich.", "Sprich, oder lass mich brauen."],
};

export async function onNpcInteract(p: Player, e: Entity): Promise<void> {
  const id = npcIdOf(e);
  if (!id) return;
  lookAtPlayer(e, p);
  const handled = await talkTo(p, id);
  if (handled) return;
  await npcMenu(p, id);
}

async function npcMenu(p: Player, id: string): Promise<void> {
  const n = npcById(id);
  if (!n) return;
  const greet = GREET[id] ?? ["…"];
  const buttons: MenuButton[] = [];
  for (const q of sideAvailable(p, id)) buttons.push({ text: `§e! ${q.title}\n§8Neue Aufgabe`, icon: "textures/cdw/ui/quest_new", action: () => acceptSide(p, q) });
  for (const q of sideActive(p).filter((q) => q.giver === id)) buttons.push({ text: `§7… ${q.title}\n§8${sideTracker(p, q).text.slice(0, 40)}`, icon: "textures/cdw/ui/quest_active", action: async () => void (await dialog(p, [{ s: id, t: `„${q.summary}“\n\n§7Aktuell: §f${sideTracker(p, q).text}` }])) });
  switch (id) {
    case "sylva":
      buttons.push({ text: "§fKlasse wechseln\n§8" + CLASS_CHANGE_COST + " Gold", icon: "textures/cdw/ui/class", action: () => changeClass(p) });
      buttons.push({ text: "§fTalente & Attribute zurücksetzen\n§8" + RESPEC_COST_PER_LEVEL * level(p) + " Gold", icon: "textures/cdw/ui/respec", action: () => respec(p) });
      if (wdata().flags.endgame) buttons.push({ text: "§6Heroische Wurzelpfade\n§8Dungeons auf Stufe 50", icon: "textures/cdw/ui/heroic", action: () => heroicMenu(p) });
      buttons.push({ text: "§fWas soll ich tun?\n§8Hinweis zur Geschichte", icon: "textures/cdw/ui/hint", action: () => hint(p) });
      break;
    case "fennick":
      buttons.push({ text: "§fKaufen", icon: "textures/cdw/ui/buy", action: () => openShop(p, "fennick") });
      buttons.push({ text: "§fVerkaufen", icon: "textures/cdw/ui/sell", action: () => openSell(p) });
      break;
    case "brom":
      buttons.push({ text: "§fSchmiede\n§8Verbessern · Reparieren · Zerlegen", icon: "textures/cdw/ui/upgrade", action: () => openSmith(p) });
      buttons.push({ text: "§fWaffe schmieden\n§8Waffe deiner Stufe", icon: "textures/cdw/ui/forge", action: () => openForge(p) });
      break;
    case "mira":
      buttons.push({ text: "§fTränke & Elixiere", icon: "textures/cdw/ui/buy", action: () => openShop(p, "mira") });
      break;
    case "morgra":
      buttons.push({ text: "§fMorgras Gebräu", icon: "textures/cdw/ui/buy", action: () => openShop(p, "morgra") });
      break;
    case "kael":
      buttons.push({ text: "§6Kopfgelder\n§83 neue Aufträge pro Tag", icon: "textures/cdw/ui/bounty", action: () => openBounties(p) });
      break;
    case "oswin":
      buttons.push({ text: "§fChronik\n§8Gespräche erneut lesen", icon: "textures/cdw/ui/chronicle", action: () => openChronicle(p) });
      buttons.push({ text: "§fErfolge & Titel", icon: "textures/cdw/ui/achievements", action: () => openAchievements(p) });
      if (level(p) >= MAX_LEVEL) buttons.push({ text: "§6Prestige\n§8Neubeginn mit Bonus", icon: "textures/cdw/ui/prestige", action: () => prestige(p) });
      if (wdata().flags.endgame) buttons.push({ text: "§cDer Altar des Uralten\n§8Weltboss beschwören", icon: "textures/cdw/ui/altar", action: () => altar(p) });
      break;
  }
  await menu(p, `§a${n.name} §7– ${n.title}`, `§f„${greet[Math.floor(Math.random() * greet.length)]}“`, buttons);
}

async function changeClass(p: Player): Promise<void> {
  if (!(await confirm(p, "§6Klasse wechseln", `§7Kosten: §e${CLASS_CHANGE_COST} Gold§7.\nTalente und Attributpunkte werden zurückgesetzt. Stufe und Ausrüstung bleiben.`))) return;
  if (!spendGold(p, CLASS_CHANGE_COST)) {
    msg(p, "§cNicht genug Gold.");
    return;
  }
  await openClassPick(p, true);
}

async function respec(p: Player): Promise<void> {
  const cost = RESPEC_COST_PER_LEVEL * level(p);
  if (!(await confirm(p, "§6Zurücksetzen", `§7Alle Talent- und Attributpunkte zurückerhalten für §e${fmt(cost)} Gold§7?`))) return;
  if (!spendGold(p, cost)) {
    msg(p, "§cNicht genug Gold.");
    return;
  }
  const d = pdata(p);
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  msg(p, "§aPunkte zurückgesetzt. Verteile sie neu im Abenteuerbuch.");
}

async function hint(p: Player): Promise<void> {
  const q = MAIN[wdata().main.idx];
  if (!q) {
    await dialog(p, [{ s: "sylva", t: "Die Geschichte des Welkens ist erzählt. Doch Ylvaris braucht weiter Wächter: Kopfgelder, heroische Wurzelpfade und der Uralte warten." }]);
    return;
  }
  await dialog(p, [{ s: "sylva", t: `„${q.summary}“\n\n§7Folge dem §6goldenen Stern§7 in der Wegpunktleiste oder dem Pfeil im HUD.` }]);
}

async function heroicMenu(p: Player): Promise<void> {
  await menu(
    p,
    "§6Heroische Wurzelpfade",
    "§7Setzt einen gereinigten Dungeon zurück: Gegner auf Stufe 50+, bessere Beute. Einmal pro Tag und Dungeon.",
    DUNGEONS.filter((d) => wdata().dungeons[d.id]?.heart).map((d) => ({
      text: `§f${d.name}`,
      action: async () => {
        const err = startHeroic(d.id);
        if (err) msg(p, `§c${err}`);
        else msg(p, `§6✦ ${d.name} ist jetzt heroisch. Folge dem Wegstein dorthin!`);
      },
    }))
  );
}

async function prestige(p: Player): Promise<void> {
  const d = pdata(p);
  if (!(await confirm(p, "§6Prestige", `§7Deine Stufe wird auf 1 zurückgesetzt. Du behältst Ausrüstung, Gold, Quests und Erfolge.\n\n§aBonus: +2 % Schaden & Leben dauerhaft, +2 Attributpunkte, Prestige-Rang ${d.prestige + 1}.\n\n§eWirklich neu beginnen?`))) return;
  d.prestige++;
  d.xp = 0;
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  sound(p, "random.totem", undefined, 1, 1);
  msg(p, `§6✦ Prestige ${d.prestige}! Die Reise beginnt von Neuem – stärker als zuvor.`);
}

async function altar(p: Player): Promise<void> {
  const has = (await import("../systems/quests")).countItem(p, "cdw:beschwoerungsstein");
  if (!has) {
    msg(p, "§7Du brauchst einen §dBeschwörungsstein§7 (Belohnung der Hauptgeschichte, später bei Fennick).");
    return;
  }
  if (!(await confirm(p, "§cDer Uralte", "§7Den Uralten Wurzelwyrm am Altar im Norden des Hains beschwören? §cSehr gefährlich – empfohlen: Stufe 50, zu zweit."))) return;
  const err = summonWorldBoss(p);
  if (err) {
    msg(p, `§c${err}`);
    return;
  }
  (await import("../systems/quests")).takeItem(p, "cdw:beschwoerungsstein", 1);
}

export async function openBounties(p: Player): Promise<void> {
  refreshBounties(p);
  const delivered = turnInBountyItems(p);
  if (delivered) msg(p, `§a${delivered} Lieferauftrag/-aufträge abgegeben!`);
  const d = pdata(p);
  const lines = d.bounty.list.map((b) => {
    const t = BOUNTIES.find((x) => x.id === b.id);
    if (!t) return "";
    const r = bountyReward(p, t);
    const n = t.obj.type === "kill" || t.obj.type === "collect" ? t.obj.count : 1;
    return `${b.done ? "§a✔" : "§6•"} §f${t.text} §7(${Math.min(b.c, n)}/${n})\n   §7Belohnung: §b${fmt(r.xp)} XP §7· §e${fmt(r.gold)} Gold`;
  });
  const left = Math.ceil((86400000 - (Date.now() % 86400000)) / 3600000);
  await menu(p, "§6Kopfgeldbrett", `${lines.join("\n\n")}\n\n§8Neue Aufträge in ca. ${left} Std. · Erfüllt gesamt: ${d.bounty.total}\n§8Lieferaufträge werden hier automatisch abgegeben.`, [{ text: "§aAktualisieren", action: () => openBounties(p) }]);
}

export function initNpcMenus(): void {
  void system;
}
