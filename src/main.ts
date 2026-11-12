// Chroniken des Weltenbaums – Einstiegspunkt.
import { CommandPermissionLevel, CustomCommandStatus, ItemStack, Player, system, world } from "@minecraft/server";
import { initStore, pdata, markDirty, wdata, saveWorld } from "./core/store";
import { isValid, log, msg, players } from "./core/util";
import { initCombat } from "./systems/combat";
import { initAbilities } from "./systems/abilities";
import { initHud, forgetHud } from "./systems/hud";
import { grantPendingMain, initQuests, refreshBounties } from "./systems/quests";
import { initAchievements, applyNameTag } from "./systems/achievements";
import { initItemWatch, registerComponents } from "./systems/items";
import { assignLevel, isHostile } from "./systems/mobs";
import { forgetStats } from "./systems/stats";
import { initActions } from "./world/actions";
import { initBosses } from "./world/bosses";
import { initDungeons } from "./world/dungeons";
import { initEvents } from "./world/events";
import { initEliteAura } from "./world/mobfx";
import { maintainNpcs } from "./world/npcs";
import { onNpcInteract } from "./ui/npcmenus";
import { openBook } from "./ui/book";
import { openClassPick } from "./ui/classpick";
import { giveItem } from "./systems/quests";
import { initSelfTest, runSelfTest } from "./selftest";
import { dialog } from "./systems/ui";
import { MAIN } from "./data/quests";

system.beforeEvents.startup.subscribe((ev) => {
  registerComponents(ev);
  const reg = ev.customCommandRegistry;
  reg.registerCommand({ name: "cdw:buch", description: "Öffnet das Abenteuerbuch (und gibt es zurück, falls verloren).", permissionLevel: CommandPermissionLevel.Any }, (origin) => {
    const p = origin.sourceEntity;
    if (p?.typeId !== "minecraft:player") return { status: CustomCommandStatus.Failure, message: "Nur für Spieler." };
    system.run(() => {
      ensureBook(p as Player);
      void openBook(p as Player);
    });
    return { status: CustomCommandStatus.Success };
  });
  reg.registerCommand({ name: "cdw:rpghud", description: "Schaltet das RPG-HUD an/aus.", permissionLevel: CommandPermissionLevel.Any }, (origin) => {
    const p = origin.sourceEntity;
    if (p?.typeId !== "minecraft:player") return { status: CustomCommandStatus.Failure };
    system.run(() => {
      const d = pdata(p as Player);
      d.settings.hud = !d.settings.hud;
      markDirty(p as Player);
      msg(p as Player, `§7HUD ${d.settings.hud ? "§aan" : "§caus"}`);
    });
    return { status: CustomCommandStatus.Success };
  });
  reg.registerCommand({ name: "cdw:test", description: "Selbsttest des RPG-Add-ons (Admin).", permissionLevel: CommandPermissionLevel.GameDirectors }, () => {
    system.run(() => void runSelfTest());
    return { status: CustomCommandStatus.Success, message: "Selbsttest gestartet – siehe Chat/Log." };
  });
});

function ensureBook(p: Player): void {
  const inv = p.getComponent("minecraft:inventory") as unknown as { container: { size: number; getItem(i: number): ItemStack | undefined } } | undefined;
  if (!inv) return;
  for (let i = 0; i < inv.container.size; i++) if (inv.container.getItem(i)?.typeId === "cdw:buch") return;
  giveItem(p, new ItemStack("cdw:buch", 1));
}

function onJoin(p: Player): void {
  const d = pdata(p);
  if (d.intro === 0) {
    d.intro = 1;
    markDirty(p);
    ensureBook(p);
    if (!wdata().hub) {
      giveItem(p, new ItemStack("cdw:samen", 1));
      system.runTimeout(() => {
        if (isValid(p)) void dialog(p, MAIN[0].intro);
      }, 60);
    } else {
      system.runTimeout(() => {
        if (!isValid(p)) return;
        msg(p, "§a✦ Willkommen, Wächter! §7Der Hain wurde bereits gepflanzt. Öffne dein §eAbenteuerbuch§7, um zu beginnen.");
        if (wdata().main.idx >= 1 && !pdata(p).cls) void openClassPick(p);
      }, 60);
    }
  } else if (wdata().main.idx >= 2 && !d.cls) {
    system.runTimeout(() => isValid(p) && void openClassPick(p), 80);
  }
  grantPendingMain(p);
  refreshBounties(p);
  applyNameTag(p);
}

function init(): void {
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

  world.afterEvents.playerSpawn.subscribe((ev) => {
    if (ev.initialSpawn) system.runTimeout(() => isValid(ev.player) && onJoin(ev.player), 40);
  });
  world.afterEvents.playerLeave.subscribe((ev) => {
    forgetStats(ev.playerId);
    forgetHud(ev.playerId);
  });
  world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
    if (ev.target.typeId === "cdw:npc") void onNpcInteract(ev.player, ev.target);
  });
  world.afterEvents.entitySpawn.subscribe((ev) => {
    const e = ev.entity;
    system.runTimeout(() => {
      if (isValid(e) && isHostile(e)) assignLevel(e);
    }, 2);
  });
  world.afterEvents.entityLoad.subscribe((ev) => {
    const e = ev.entity;
    if (isValid(e) && isHostile(e)) assignLevel(e);
  });
  system.runInterval(() => {
    try {
      maintainNpcs();
    } catch (e) {
      log("NPC-Pflege:", String(e));
    }
  }, 100);
  system.beforeEvents.shutdown.subscribe(() => {
    try {
      saveWorld();
    } catch {
      /* ignorieren */
    }
  });
  // Bereits verbundene Spieler (Script-Neuladen)
  system.runTimeout(() => {
    for (const p of players()) onJoin(p);
  }, 20);
  log("Chroniken des Weltenbaums geladen.");
}

world.afterEvents.worldLoad.subscribe(() => init());
