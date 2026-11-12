// Debug-Schnittstelle für automatisierte Tests (nur per /scriptevent, also nur mit Cheats/OP nutzbar).
import { Player, system, world } from "@minecraft/server";
import { ClassId } from "./data/classes";
import { emit } from "./core/bus";
import { markWorldDirty, pdata, wdata } from "./core/store";
import { log } from "./core/util";
import { setClass } from "./ui/classpick";
import { plantHub } from "./world/hub";
import { ensureLocation } from "./world/dungeons";
import { getMana, hpInfo, stats } from "./systems/stats";
import { MAIN } from "./data/quests";
import { getInfo, mobHp } from "./systems/mobs";
import { autotest } from "./systems/ui";
import { onNpcInteract } from "./ui/npcmenus";
import { castRune } from "./systems/abilities";

function byName(name: string): Player | undefined {
  return world.getAllPlayers().find((p) => p.name === name);
}

function reply(obj: unknown): void {
  const s = JSON.stringify(obj);
  log("CDW_STATE " + s);
  try {
    system.sendScriptEvent("cdwtest:state", s.slice(0, 2000));
  } catch {
    /* ignorieren */
  }
}

export function initDebug(): void {
  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id !== "cdw:debug") return;
    const [cmd, ...args] = ev.message.trim().split(/\s+/);
    const p = args[0] ? byName(args[0]) : undefined;
    try {
      switch (cmd) {
        case "autotest":
          autotest.on = args[0] !== "off";
          log("Autotest", autotest.on ? "an" : "aus");
          break;
        case "talk": {
          const npc = world.getDimension("minecraft:overworld").getEntities({ type: "cdw:npc", tags: [`cdw_npc:${args[1]}`] })[0];
          if (p && npc) void onNpcInteract(p, npc);
          break;
        }
        case "cast":
          if (p) castRune(p, args[1]);
          break;
        case "plant":
          if (p) void plantHub(p, { x: Math.floor(p.location.x), y: Math.floor(p.location.y) - 1, z: Math.floor(p.location.z) }).then(() => emit("flag", { key: "hub_planted", player: p }));
          break;
        case "class":
          if (p) setClass(p, args[1] as ClassId, true);
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
          const e = world.getEntity(args[0]);
          if (e) reply({ mob: e.typeId, info: getInfo(e), hp: mobHp(e) });
          break;
        }
        case "state": {
          if (!p) return;
          const d = pdata(p);
          const s = stats(p);
          const w = wdata();
          reply({
            name: p.name,
            cls: d.cls,
            lvl: s.level,
            xp: d.xp,
            gold: d.gold,
            hp: hpInfo(p),
            mana: Math.round(getMana(p)),
            maxHp: s.maxHp,
            main: w.main,
            hub: w.hub,
            quests: d.quests,
            done: d.done,
            ws: d.waystones,
            kills: d.stats.kills ?? 0,
            dungeons: Object.fromEntries(Object.entries(w.dungeons).map(([k, v]) => [k, { x: v.x, y: v.y, z: v.z, built: v.built, stage: v.stage, boss: v.boss, heart: v.heart, data: v.data }])),
            morgra: w.morgra,
          });
          break;
        }
      }
    } catch (e) {
      log("Debug-Fehler:", String(e));
    }
  });
}
