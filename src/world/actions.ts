// Verdrahtung: Quest-Aktionen & Zielauflösung.
import { Player, system, world } from "@minecraft/server";
import { Target } from "../data/quests";
import { markDirty, markWorldDirty, pdata, setFlag, wdata } from "../core/store";
import { V, broadcast, log, players } from "../core/util";
import { hooks } from "../systems/quests";
import { refreshHud } from "../systems/hud";
import { dungeonPos, ensureLocation } from "./dungeons";
import { campPos, setupCamp, spawnAction, startDefense } from "./events";
import { HUB_SPOTS, hubPos, upgradeHub } from "./hub";
import { despawnNpc, npcHome, setNpcGone, spawnNpc } from "./npcs";
import { openClassPick } from "../ui/classpick";

function setNpcHomeFlags(id: string, x: number, y: number, z: number): void {
  const f = wdata().flags;
  f[`npc_${id}_x`] = x;
  f[`npc_${id}_y`] = y;
  f[`npc_${id}_z`] = z;
  f[`npc_${id}_gone`] = 0;
  markWorldDirty();
}

export function runAction(a: string, p?: Player): void {
  const parts = a.split(":");
  try {
    switch (parts[0]) {
      case "classpick":
        for (const pl of players()) if (!pdata(pl).cls) system.runTimeout(() => void openClassPick(pl), 40);
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
            if (world.getDimension("minecraft:overworld").isChunkLoaded(loc)) spawnNpc(parts[1], loc);
          } catch {
            /* wird später gesetzt */
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
        broadcast("§4✦ Die Zitadelle des Welkens ist erschienen. §7Folge dem Wegpunkt.");
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
  void p;
}

export function resolveTarget(t: Target): { x: number; y: number; z: number; d?: string } | undefined {
  switch (t.k) {
    case "hub": {
      const h = hubPos();
      return h ? { x: h.x + 0.5, y: h.y + 1, z: h.z + 0.5 } : undefined;
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
  return undefined;
}

export function initActions(): void {
  hooks.action = runAction;
  hooks.resolveTarget = resolveTarget;
  hooks.onMainChanged = () => system.run(refreshHud);
}
