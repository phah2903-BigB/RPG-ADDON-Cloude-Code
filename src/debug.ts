// Debug-Schnittstelle für automatisierte Tests (nur per /scriptevent, also nur mit Cheats/OP nutzbar).
import { Player, system, world } from "@minecraft/server";
import { ClassId } from "./data/classes";
import { emit } from "./core/bus";
import { markWorldDirty, pdata, wdata } from "./core/store";
import { log } from "./core/util";
import { setClass } from "./ui/classpick";
import { buildHub, plantHub, upgradeHub } from "./world/hub";
import { surfaceY } from "./world/builder";
import { ensureLocation, testBuildDungeon } from "./world/dungeons";
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
        case "scan": {
          // scan x1 y1 z1 x2 y2 z2 – Blöcke ins Log (für Vorschaubilder)
          const [x1, y1, z1, x2, y2, z2] = args.map(Number);
          const dim = world.getDimension("minecraft:overworld");
          const pal: string[] = [];
          const out: number[] = [];
          void world.tickingAreaManager.createTickingArea("cdw_scan", { dimension: dim, from: { x: x1, y: 0, z: z1 }, to: { x: x2, y: 0, z: z2 } }).then(() => system.runJob(
            (function* () {
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
                    if (++n % 3000 === 0) yield;
                  }
              const s = JSON.stringify({ pal, out });
              for (let i = 0; i < s.length; i += 8000) log(`CDW_SCAN ${i / 8000} ${s.slice(i, i + 8000)}`);
              log("CDW_SCAN_END");
            })()
          ));
          break;
        }
        case "hubat": {
          const [x, z] = args.map(Number);
          const dim = world.getDimension("minecraft:overworld");
          void world.tickingAreaManager.createTickingArea("cdw_dbg", { dimension: dim, from: { x: x - 30, y: 0, z: z - 30 }, to: { x: x + 30, y: 0, z: z + 30 } }).then(() => {
            const s = surfaceY(dim, x, z);
            wdata().hub = { x, y: s?.y ?? 64, z, stage: 0 };
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
          if (h) system.sendScriptEvent("cdw:debug", `scan ${h.x - 23} ${h.y - 4} ${h.z - 23} ${h.x + 23} ${h.y + 34} ${h.z + 23}`);
          break;
        }
        case "dgat": {
          const [id, x, z] = [args[0], Number(args[1]), Number(args[2])];
          void testBuildDungeon(id, { x, z }).then((st) => {
            log("DG_BUILT", JSON.stringify({ x: st.x, y: st.y, z: st.z }));
            if (args[3] === "scan") system.sendScriptEvent("cdw:debug", `scan ${st.x} ${st.y - 18} ${st.z - 118} ${st.x} ${st.y + 60} ${st.z + 10}`);
          });
          break;
        }
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
