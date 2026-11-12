// Abenteuerbuch: Hauptmenü.
import { EquipmentSlot, ItemStack, Player, world } from "@minecraft/server";
import { RARITIES } from "../data/balance";
import { ABILITIES, ATTR_DESC, ATTR_NAMES, AttrId, TALENT_PATH_NAMES, abilitiesFor, classById, talentsFor } from "../data/classes";
import { MAIN, questById } from "../data/quests";
import { emit } from "../core/bus";
import { markDirty, pdata, resetPlayerData, resetWorldData, wdata, markWorldDirty } from "../core/store";
import { fmt, msg, sound } from "../core/util";
import { ACHIEVEMENTS, applyNameTag, unlockedTitles } from "../systems/achievements";
import { AFFIX_NAMES, createGear, displayName, getEquip, getGear } from "../systems/gear";
import { abandonSide, giveItem, mainTracker, questLog, setTracked, sideActive, sideTracker } from "../systems/quests";
import { freeAttrPoints, freeTalentPoints, getMana, hpInfo, invalidate, stats, xpProgress } from "../systems/stats";
import { confirm, dialog, menu, MenuButton, modal, ModalFormData } from "../systems/ui";
import { DUNGEONS, dungeonState, reroll } from "../world/dungeons";
import { giveRunes, openClassPick } from "./classpick";
import { travel } from "../world/waystones";
import { resetHubLocation } from "../world/hub";
import { addXp } from "../systems/progression";

export async function openBook(p: Player): Promise<void> {
  const d = pdata(p);
  emit("flag", { key: "book_opened", player: p });
  if (!wdata().hub) {
    await dialog(p, MAIN[0].intro);
    return;
  }
  const cls = classById(d.cls);
  const xp = xpProgress(p);
  const hp = hpInfo(p);
  const s = stats(p);
  const header = `§f${p.name} §7· ${cls ? cls.color + cls.name : "§7Keine Klasse"} §7· §eStufe ${xp.level}\n§c❤ ${fmt(hp.cur)}/${fmt(hp.max)}  §9✦ ${fmt(getMana(p))}/${fmt(s.maxMana)}  §e${fmt(d.gold)} Gold\n§7XP: ${fmt(xp.cur)}/${fmt(xp.need)}${d.title ? `  §dTitel: ${d.title}` : ""}`;
  const fp = freeAttrPoints(p);
  const tp = freeTalentPoints(p);
  const buttons: MenuButton[] = [
    { text: "§6Quests\n§8Aufgaben & Ziele", icon: "textures/cdw/ui/quests", action: () => openQuests(p) },
    { text: `§fCharakter${fp > 0 ? ` §a(+${fp})` : ""}\n§8Werte & Attribute`, icon: "textures/cdw/ui/character", action: () => openCharacter(p) },
    { text: "§dFähigkeiten\n§8Runen & Übersicht", icon: "textures/cdw/ui/abilities", action: () => openAbilities(p) },
    { text: `§aTalente${tp > 0 ? ` §a(+${tp})` : ""}\n§8${cls ? TALENT_PATH_NAMES[cls.id].join(" · ") : "–"}`, icon: "textures/cdw/ui/talents", action: () => openTalents(p) },
    { text: "§bAusrüstung\n§8Angelegte Gegenstände", icon: "textures/cdw/ui/equipment", action: () => openEquipment(p) },
    { text: "§eErfolge & Titel", icon: "textures/cdw/ui/achievements", action: () => openAchievements(p) },
    { text: "§fRezepte", icon: "textures/cdw/ui/recipes", action: () => openRecipes(p) },
    { text: "§7Einstellungen", icon: "textures/cdw/ui/settings", action: () => openSettings(p) },
  ];
  if (!d.cls) buttons.unshift({ text: "§6Klasse wählen!", icon: "textures/cdw/ui/class", action: () => openClassPick(p) });
  if (p.playerPermissionLevel >= 2 || p.commandPermissionLevel >= 1) buttons.push({ text: "§cAdmin", icon: "textures/cdw/ui/admin", action: () => openAdmin(p) });
  await menu(p, "§l§6Abenteuerbuch", header, buttons);
}

// ------------------- Quests -------------------
export async function openQuests(p: Player): Promise<void> {
  const d = pdata(p);
  const buttons: MenuButton[] = [];
  const mt = mainTracker();
  if (mt?.quest) {
    const q = mt.quest;
    buttons.push({
      text: `§6★ ${q.title}${!d.tracked || d.tracked === "main" ? " §a(verfolgt)" : ""}\n§8${mt.text.replace(/§./g, "").slice(0, 42)}`,
      icon: "textures/cdw/ui/quest_main",
      action: () => questDetail(p, "main"),
    });
  }
  for (const q of sideActive(p))
    buttons.push({ text: `§e${q.title}${d.tracked === q.id ? " §a(verfolgt)" : ""}\n§8${sideTracker(p, q).text.replace(/§./g, "").slice(0, 42)}`, icon: "textures/cdw/ui/quest_active", action: () => questDetail(p, q.id) });
  buttons.push({ text: "§6Kopfgelder\n§8Heutige Aufträge", icon: "textures/cdw/ui/bounty", action: async () => (await import("./npcmenus")).openBounties(p) });
  buttons.push({ text: "§fChronik\n§8Abgeschlossene Geschichte", icon: "textures/cdw/ui/chronicle", action: () => openChronicle(p) });
  await menu(p, "§6Quests", questLog(p), buttons, { back: () => openBook(p) });
}

async function questDetail(p: Player, id: string): Promise<void> {
  const d = pdata(p);
  if (id === "main") {
    const mt = mainTracker();
    const q = mt?.quest;
    if (!q) return;
    const buttons: MenuButton[] = [
      { text: "§aVerfolgen", action: () => setTracked(p, "main") },
      { text: "§fEinleitung erneut lesen", action: async () => void (await dialog(p, q.intro.length ? q.intro : [{ s: "erzaehler", t: q.summary }])) },
    ];
    const tgt = mt.target;
    if (tgt?.k === "dungeon") {
      const st = dungeonState(tgt.id);
      if (st && !st.built)
        buttons.push({
          text: "§cOrt neu bestimmen\n§8Falls er auf euren Bauten liegt",
          action: async () => {
            if (await confirm(p, "§cOrt neu bestimmen", "§7Der Dungeon wird an einer anderen Stelle (gleiche Richtung, ähnliche Entfernung) errichtet. Nur möglich, solange er noch nicht gebaut wurde.")) {
              if (reroll(tgt.id)) msg(p, "§aNeuer Ort bestimmt. Folge dem Wegpunkt.");
            }
          },
        });
    }
    await menu(p, `§6${q.title}`, `§7${q.summary}\n\n§fZiel: ${mt.text}`, buttons, { back: () => openQuests(p) });
    return;
  }
  const q = questById(id);
  if (!q || !d.quests[id]) return;
  await menu(
    p,
    `§e${q.title}`,
    `§7${q.summary}\n\n§fZiel: ${sideTracker(p, q).text}`,
    [
      { text: "§aVerfolgen", action: () => setTracked(p, id) },
      { text: "§fEinleitung erneut lesen", action: async () => void (await dialog(p, q.intro)) },
      {
        text: "§cAufgeben",
        action: async () => {
          if (await confirm(p, "§cAufgeben?", `§7„${q.title}“ abbrechen? Du kannst sie später erneut annehmen.`)) abandonSide(p, id);
        },
      },
    ],
    { back: () => openQuests(p) }
  );
}

export async function openChronicle(p: Player): Promise<void> {
  const idx = wdata().main.idx;
  const done = MAIN.slice(0, idx);
  if (!done.length) {
    msg(p, "§7Die Chronik ist noch leer.");
    return;
  }
  await menu(
    p,
    "§fChronik",
    "§7Lies abgeschlossene Kapitel erneut.",
    done.map((q) => ({ text: `§f${q.title}\n§8Akt ${q.act || "Prolog"}`, action: async () => void (await dialog(p, [...q.intro, ...q.outro].length ? [...q.intro, ...q.outro] : [{ s: "erzaehler", t: q.summary }])) })).reverse()
  );
}

// ------------------- Charakter -------------------
async function openCharacter(p: Player): Promise<void> {
  const s = stats(p);
  const d = pdata(p);
  const fp = freeAttrPoints(p);
  const pct = (v: number) => `${Math.round(v * 1000) / 10}`.replace(".", ",") + " %";
  const body = [
    `§eStufe ${s.level} §7· Prestige ${d.prestige} · Ruf ${fmt(d.rep)}`,
    `§c❤ Leben: §f${fmt(s.maxHp)}   §9✦ Mana: §f${fmt(s.maxMana)} §7(+${s.manaRegen.toFixed(1).replace(".", ",")}/s)`,
    `§6Krit: §f${pct(s.crit)} §7(×${s.critDmg.toFixed(2).replace(".", ",")})   §bWiderstand: §f${pct(s.resist)}`,
    `§aLebensraub: §f${pct(s.lifesteal)}   §dAbklingzeit: §f-${pct(s.cdr)}   §fTempo: +${pct(s.speed)}`,
    s.setBonus.length ? `§6Setbonus: §f${s.setBonus.join(", ")}` : "",
    "",
    ...(["str", "dex", "int", "vit", "wis"] as AttrId[]).map((a) => `§f${ATTR_NAMES[a]}: §e${s.attrs[a]} §8(${d.attr[a]} verteilt)`),
    "",
    fp > 0 ? `§a${fp} freie Attributpunkte` : "§7Keine freien Punkte",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
  const buttons: MenuButton[] = (["str", "dex", "int", "vit", "wis"] as AttrId[]).map((a) => ({
    text: `§f+ ${ATTR_NAMES[a]}\n§8${ATTR_DESC[a].slice(0, 44)}`,
    icon: `textures/cdw/ui/attr_${a}`,
    action: async () => {
      if (freeAttrPoints(p) <= 0) {
        msg(p, "§7Keine freien Attributpunkte.");
        return;
      }
      d.attr[a]++;
      markDirty(p);
      invalidate(p);
      sound(p, "random.orb", undefined, 1.5, 0.5);
      await openCharacter(p);
    },
  }));
  if (fp >= 5)
    buttons.push({
      text: "§aMehrere Punkte verteilen…",
      action: async () => {
        const f = new ModalFormData().title("§fAttribute verteilen");
        const attrs = ["str", "dex", "int", "vit", "wis"] as AttrId[];
        for (const a of attrs) f.slider(`${ATTR_NAMES[a]} (+)`, 0, fp, { valueStep: 1, defaultValue: 0 });
        const res = await modal(p, f);
        if (!res?.formValues) return;
        let sum = 0;
        const vals = res.formValues.map((v) => Number(v) || 0);
        for (const v of vals) sum += v;
        if (sum > freeAttrPoints(p)) {
          msg(p, `§cDu hast nur ${freeAttrPoints(p)} Punkte.`);
          return;
        }
        attrs.forEach((a, i) => (d.attr[a] += vals[i]));
        markDirty(p);
        invalidate(p);
        await openCharacter(p);
      },
    });
  await menu(p, "§fCharakter", body, buttons, { back: () => openBook(p) });
}

// ------------------- Fähigkeiten -------------------
async function openAbilities(p: Player): Promise<void> {
  const d = pdata(p);
  if (!d.cls) {
    await openClassPick(p);
    return;
  }
  const lvl = stats(p).level;
  const list = abilitiesFor(d.cls)
    .map((a) => `${a.level <= lvl ? "§a✔" : "§8✖"} §d${a.name} §7(Stufe ${a.level}, ${a.mana} Mana, ${a.cooldown} s)\n  §f${a.desc}`)
    .join("\n\n");
  await menu(
    p,
    "§dFähigkeiten",
    `${list}\n\n§7Runen in die Schnellleiste legen und benutzen. Waffen haben zusätzlich eine eigene Fähigkeit (Benutzen).`,
    [
      {
        text: "§aFehlende Runen erhalten",
        icon: "textures/cdw/ui/abilities",
        action: () => {
          const n = giveRunes(p);
          msg(p, n ? `§a${n} Rune(n) erhalten.` : "§7Du hast bereits alle freigeschalteten Runen.");
        },
      },
    ],
    { back: () => openBook(p) }
  );
}

// ------------------- Talente -------------------
async function openTalents(p: Player): Promise<void> {
  const d = pdata(p);
  const cls = classById(d.cls);
  if (!cls) {
    await openClassPick(p);
    return;
  }
  const tp = freeTalentPoints(p);
  const ts = talentsFor(cls.id);
  const buttons: MenuButton[] = [];
  for (const path of [0, 1] as const) {
    const pts = ts.filter((t) => t.path === path).reduce((s, t) => s + (d.talents[t.id] ?? 0), 0);
    for (const t of ts.filter((x) => x.path === path).sort((a, b) => a.tier - b.tier)) {
      const rank = d.talents[t.id] ?? 0;
      const needed = (t.tier - 1) * 2; // Punkte im Pfad nötig
      const locked = pts < needed;
      buttons.push({
        text: `${locked ? "§8🔒" : rank >= t.maxRank ? "§a★" : "§f"}${TALENT_PATH_NAMES[cls.id][path]}: ${t.name} §7${rank}/${t.maxRank}\n§8${locked ? `Benötigt ${needed} Punkte im Pfad` : t.desc.slice(0, 44)}`,
        icon: `textures/cdw/ui/talent_${path}`,
        action: async () => {
          if (locked) msg(p, `§7Benötigt ${needed} Punkte im Pfad „${TALENT_PATH_NAMES[cls.id][path]}“.`);
          else if (rank >= t.maxRank) msg(p, "§7Bereits gemeistert.");
          else if (freeTalentPoints(p) <= 0) msg(p, "§7Keine freien Talentpunkte. §8(Jede 2. Stufe ab 3)");
          else {
            d.talents[t.id] = rank + 1;
            markDirty(p);
            invalidate(p);
            sound(p, "random.orb", undefined, 1.6, 0.6);
          }
          await openTalents(p);
        },
      });
    }
  }
  await menu(p, "§aTalente", `§7Freie Talentpunkte: §a${tp}\n§8Höhere Talente benötigen Punkte im selben Pfad.`, buttons, { back: () => openBook(p) });
}

// ------------------- Ausrüstung -------------------
async function openEquipment(p: Player): Promise<void> {
  const lines: string[] = [];
  const slots: [EquipmentSlot, string][] = [
    [EquipmentSlot.Mainhand, "Waffe"],
    [EquipmentSlot.Offhand, "Nebenhand"],
    [EquipmentSlot.Head, "Kopf"],
    [EquipmentSlot.Chest, "Brust"],
    [EquipmentSlot.Legs, "Beine"],
    [EquipmentSlot.Feet, "Füße"],
  ];
  for (const [slot, name] of slots) {
    const it = getEquip(p, slot);
    if (!it) {
      lines.push(`§8${name}: –`);
      continue;
    }
    const g = getGear(it);
    lines.push(`§7${name}: ${g ? displayName(it.typeId, g) : "§f" + (it.nameTag ?? it.typeId.replace(/^.*:/, "").replace(/_/g, " "))}`);
    if (g) for (const [k, v] of Object.entries(g.a)) lines.push(`   ${RARITIES[g.r].color}${AFFIX_NAMES[k]?.(v) ?? k}`);
  }
  const s = stats(p);
  if (s.setBonus.length) lines.push(`\n§6Aktive Setboni: §f${s.setBonus.join(", ")}`);
  await menu(p, "§bAusrüstung", lines.join("\n"), [], { back: () => openBook(p) });
}

// ------------------- Erfolge -------------------
export async function openAchievements(p: Player): Promise<void> {
  const d = pdata(p);
  const got = ACHIEVEMENTS.filter((a) => d.ach.includes(a.id)).length;
  const body = ACHIEVEMENTS.map((a) => `${d.ach.includes(a.id) ? "§a✔" : "§8✖"} §f${a.name} §7– ${a.desc}${a.title ? ` §d[${a.title}]` : ""}`).join("\n");
  const titles = unlockedTitles(p);
  const buttons: MenuButton[] = titles.map((t) => ({
    text: `§dTitel tragen: ${t}${d.title === t ? " §a✔" : ""}`,
    action: () => {
      d.title = t;
      markDirty(p);
      applyNameTag(p);
    },
  }));
  if (d.title) buttons.push({ text: "§7Titel ablegen", action: () => void ((d.title = undefined), markDirty(p), applyNameTag(p)) });
  await menu(p, `§eErfolge (${got}/${ACHIEVEMENTS.length})`, body, buttons);
}

// ------------------- Rezepte -------------------
async function openRecipes(p: Player): Promise<void> {
  const body = [
    "§fWerkbank-Rezepte (Zutaten beliebig anordnen):",
    "§a• Kleiner Heiltrank: §7Glasflasche + Moosherz + Süße Beeren",
    "§a• Heiltrank: §7Kleiner Heiltrank + Moosherz + Glitzernde Melone",
    "§a• Großer Heiltrank: §7Heiltrank + Uraltes Harz",
    "§9• Kleiner Manatrank: §7Glasflasche + Fäulnisessenz + Leuchtbeeren",
    "§9• Manatrank: §7Kleiner Manatrank + Schattenkristall",
    "§9• Großer Manatrank: §7Manatrank + Uraltes Harz",
    "§6• Elixier der Stärke: §7Glasflasche + Dornenfang + Lohenstaub",
    "§6• Elixier der Zähigkeit: §7Glasflasche + Moorschleim + Eisenbarren",
    "§6• Elixier der Eile: §7Glasflasche + Skorpionstachel + Zucker",
    "§6• Elixier der Weisheit: §7Glasflasche + Frostsplitter + Lapislazuli",
    "§e• Schriftrolle der Rückkehr: §7Papier + Moosherz + Fäulnisessenz",
    "§b• Eigener Wegstein: §74 Runenstaub + Leitstein + 4 Steinziegel",
    "§b• Abenteuerbuch: §7Buch + Moosherz",
    "",
    "§fBei Brom: §7Mondsilberbarren (2 Gold + 1 Frostsplitter, nach Nebenquest), Waffen schmieden.",
  ].join("\n");
  await menu(p, "§fRezepte", body, [], { back: () => openBook(p) });
}

// ------------------- Einstellungen -------------------
async function openSettings(p: Player): Promise<void> {
  const d = pdata(p);
  const f = new ModalFormData()
    .title("§7Einstellungen")
    .toggle("HUD in der Aktionsleiste anzeigen", { defaultValue: d.settings.hud })
    .toggle("Irrlicht-Pfad zum Questziel", { defaultValue: d.settings.wisp })
    .dropdown("Schwierigkeit (Schaden durch Monster)", ["Entspannt (-30 %)", "Normal", "Heroisch (+35 %)"], { defaultValueIndex: d.settings.diff })
    .toggle("Wegpunkte in der Wegpunktleiste", { defaultValue: (d.stats.noWp ?? 0) === 0 });
  const res = await modal(p, f);
  if (!res?.formValues) return;
  const [hud, wisp, diff, wp] = res.formValues as [boolean, boolean, number, boolean];
  d.settings.hud = hud;
  d.settings.wisp = wisp;
  d.settings.diff = diff;
  d.stats.noWp = wp ? 0 : 1;
  markDirty(p);
  if (!wp) {
    try {
      p.locatorBar.removeAllWaypoints();
    } catch {
      /* ignorieren */
    }
  }
  msg(p, "§aEinstellungen gespeichert.");
}

// ------------------- Admin -------------------
async function openAdmin(p: Player): Promise<void> {
  const w = wdata();
  await menu(
    p,
    "§cAdmin",
    `§7Hauptquest: ${w.main.idx}/${MAIN.length} (Stufe ${w.main.s}, Zähler ${w.main.c})\n§7Hain: ${w.hub ? `${w.hub.x} ${w.hub.y} ${w.hub.z} (Stufe ${w.hub.stage})` : "nicht gepflanzt"}`,
    [
      {
        text: "§fZu Dungeon teleportieren",
        action: () =>
          menu(
            p,
            "Dungeons",
            "",
            DUNGEONS.map((dg) => ({
              text: `${dg.name}${dungeonState(dg.id)?.built ? " §a(gebaut)" : ""}`,
              action: () => {
                const st = dungeonState(dg.id);
                if (st) p.teleport({ x: st.x + 0.5, y: st.y + 2, z: st.z + 8 }, { dimension: world.getDimension("minecraft:overworld") });
                else msg(p, "§7Ort noch nicht bestimmt.");
              },
            }))
          ),
      },
      { text: "§fZum Hain teleportieren", action: () => travel(p, "hub", true) },
      {
        text: "§fHauptquest überspringen",
        action: async () => {
          if (!(await confirm(p, "Überspringen?", "Aktuelle Hauptquest ohne Belohnung überspringen?"))) return;
          w.main.idx++;
          w.main.s = -1;
          w.main.c = 0;
          if (MAIN[w.main.idx] && !MAIN[w.main.idx].giver) w.main.s = 0;
          markWorldDirty();
        },
      },
      { text: "§f+1 Stufe (Test)", action: () => addXp(p, xpProgress(p).need - xpProgress(p).cur + 1) },
      { text: "§fTestausrüstung erhalten", action: () => giveItem(p, createGear("cdw:schwert_stahl", 3)) },
      {
        text: "§cHain verschieben",
        action: async () => {
          if (!(await confirm(p, "§cHain verschieben", "§7Setzt den Hain-Standort zurück (Gebäude bleiben stehen, NPCs verschwinden). Du erhältst einen neuen Samen."))) return;
          resetHubLocation();
          giveItem(p, new ItemStack("cdw:samen", 1));
        },
      },
      {
        text: "§cMeinen Fortschritt zurücksetzen",
        action: async () => {
          if (await confirm(p, "§cZurücksetzen", "§7Alle deine RPG-Daten (Stufe, Gold, Quests) löschen?")) resetPlayerData(p);
        },
      },
      {
        text: "§4Welt-Fortschritt zurücksetzen",
        action: async () => {
          if (await confirm(p, "§4Welt zurücksetzen", "§7Hauptstory, Hain-Daten und Dungeons werden zurückgesetzt (Bauwerke bleiben stehen).")) resetWorldData();
        },
      },
    ],
    { back: () => openBook(p) }
  );
}

export { ABILITIES };
