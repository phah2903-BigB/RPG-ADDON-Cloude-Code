// Erfolge & Titel.
import { Player, system } from "@minecraft/server";
import { on } from "../core/bus";
import { markDirty, pdata, wdata } from "../core/store";
import { msg, players, sound, title } from "../core/util";
import { level } from "./stats";

export interface AchDef {
  id: string;
  name: string;
  desc: string;
  title?: string;
  check: (p: Player) => boolean;
}

const s = (p: Player, k: string) => pdata(p).stats[k] ?? 0;
const boss = (p: Player, id: string) => (pdata(p).bossKills[id] ?? 0) > 0;
const mainAt = (n: number) => wdata().main.idx >= n;

export const ACHIEVEMENTS: AchDef[] = [
  { id: "erster", name: "Erste Schritte", desc: "Besiege dein erstes Monster.", check: (p) => s(p, "kills") >= 1 },
  { id: "k100", name: "Monsterjäger", desc: "Besiege 100 Monster.", check: (p) => s(p, "kills") >= 100 },
  { id: "k1000", name: "Geißel des Welkens", desc: "Besiege 1.000 Monster.", title: "Geißel des Welkens", check: (p) => s(p, "kills") >= 1000 },
  { id: "k5000", name: "Unaufhaltsam", desc: "Besiege 5.000 Monster.", title: "Der Unaufhaltsame", check: (p) => s(p, "kills") >= 5000 },
  { id: "elite10", name: "Elitejäger", desc: "Besiege 10 Elite-Monster.", title: "Elitejäger", check: (p) => s(p, "eliteKills") >= 10 },
  { id: "lv10", name: "Gefestigt", desc: "Erreiche Stufe 10.", check: (p) => level(p) >= 10 },
  { id: "lv20", name: "Erfahren", desc: "Erreiche Stufe 20.", check: (p) => level(p) >= 20 },
  { id: "lv30", name: "Veteran", desc: "Erreiche Stufe 30.", title: "Veteran", check: (p) => level(p) >= 30 },
  { id: "lv40", name: "Meister", desc: "Erreiche Stufe 40.", check: (p) => level(p) >= 40 },
  { id: "lv50", name: "Legende", desc: "Erreiche Stufe 50.", title: "Legende", check: (p) => level(p) >= 50 },
  { id: "hain", name: "Gärtner", desc: "Pflanze den Samen des Weltenbaums.", check: () => !!wdata().hub },
  { id: "b1", name: "Holzfäller", desc: "Besiege den Rindenschreck.", check: (p) => boss(p, "boss_rindenschreck") },
  { id: "b2", name: "Moorläufer", desc: "Besiege den Moorschlund.", check: (p) => boss(p, "boss_moorschlund") },
  { id: "b3", name: "Glutbrecher", desc: "Besiege die Glutkönigin.", check: (p) => boss(p, "boss_glutkoenigin") },
  { id: "b4", name: "Frostbezwinger", desc: "Besiege Hrimgar.", title: "Frostbezwinger", check: (p) => boss(p, "boss_hrimgar") },
  { id: "b5", name: "Kristallbrecher", desc: "Besiege die Kristallmutter.", check: (p) => boss(p, "boss_kristallmutter") },
  { id: "b6", name: "Ende des Welkens", desc: "Besiege die Welkenbestie.", title: "Bezwinger des Welkens", check: (p) => boss(p, "boss_welkenbestie") },
  { id: "wyrm", name: "Drachenzähmer", desc: "Besiege den Uralten Wurzelwyrm.", title: "Wyrmtöter", check: (p) => boss(p, "boss_wurzelwyrm") },
  { id: "herzen", name: "Herzschlag", desc: "Reinige alle fünf Wurzelherzen.", check: () => mainAt(23) },
  { id: "story", name: "Ylvaris erblüht", desc: "Schließe die Hauptgeschichte ab.", title: "Wächter des Weltenbaums", check: () => mainAt(26) },
  { id: "kopf10", name: "Kopfgeldjäger", desc: "Erfülle 10 Kopfgelder.", check: (p) => s(p, "bounties") >= 10 },
  { id: "kopf50", name: "Gesucht: Du", desc: "Erfülle 50 Kopfgelder.", title: "Kopfgeldjäger", check: (p) => s(p, "bounties") >= 50 },
  { id: "gold", name: "Goldesel", desc: "Verdiene insgesamt 10.000 Gold.", title: "Der Wohlhabende", check: (p) => s(p, "goldEarned") >= 10000 },
  { id: "plus10", name: "Meisterschmied", desc: "Verbessere eine Ausrüstung auf +10.", title: "Meisterschmied", check: (p) => s(p, "maxUpgrade") >= 10 },
  { id: "legend", name: "Legendärer Fund", desc: "Finde einen legendären Gegenstand.", check: (p) => s(p, "legendaries") >= 1 },
  { id: "steine", name: "Weltenwanderer", desc: "Aktiviere 6 Wegsteine.", check: (p) => pdata(p).waystones.length >= 6 },
  { id: "seiten", name: "Chronist", desc: "Liefere alle Tagebuchseiten ab.", check: (p) => pdata(p).done.includes("o1") },
  { id: "neben", name: "Hilfsbereit", desc: "Schließe 10 Nebenquests ab.", title: "Freund des Hains", check: (p) => pdata(p).done.length >= 10 },
  { id: "tod10", name: "Unsterblich? Nein.", desc: "Stirb 10 Mal.", title: "Der Stehaufmann", check: (p) => s(p, "deaths") >= 10 },
  { id: "prestige", name: "Wiedergeboren", desc: "Erreiche Prestige 1.", title: "Wiedergeborener", check: (p) => pdata(p).prestige >= 1 },
  { id: "heroisch", name: "Heroisch", desc: "Besiege einen heroischen Dungeon-Wächter.", title: "Held der Wurzelpfade", check: (p) => s(p, "heroic") >= 1 },
];

export function unlockedTitles(p: Player): string[] {
  const d = pdata(p);
  const out: string[] = [];
  for (const a of ACHIEVEMENTS) if (a.title && d.ach.includes(a.id)) out.push(a.title);
  for (const x of d.ach) if (x.startsWith("title:")) out.push(x.slice(6));
  return [...new Set(out)];
}

function check(p: Player): void {
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
    title(p, "§6Erfolg!", `§f${a.name}`, 5, 50, 10);
    sound(p, "ui.toast.challenge_complete", undefined, 1, 1);
    msg(p, `§6✦ Erfolg freigeschaltet: §f${a.name} §7– ${a.desc}${a.title ? ` §d(Titel: ${a.title})` : ""}`);
  }
}

export function applyNameTag(p: Player): void {
  const d = pdata(p);
  try {
    const t = d.title ? `§d[${d.title}]§r\n` : "";
    const pre = d.prestige > 0 ? `§6✦${d.prestige} ` : "";
    p.nameTag = `${t}${pre}§f${p.name} §7Lv ${level(p)}`;
  } catch {
    /* ignorieren */
  }
}

export function initAchievements(): void {
  on("kill", (ev) => {
    if ((pdata(ev.player).stats.kills ?? 0) % 10 === 1 || ev.info?.def?.boss) check(ev.player);
  });
  on("flag", (ev) => {
    if (ev.player) check(ev.player);
  });
  system.runInterval(() => {
    for (const p of players()) {
      check(p);
      applyNameTag(p);
    }
  }, 200);
}
