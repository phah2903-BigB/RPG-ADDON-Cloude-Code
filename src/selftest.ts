// Selbsttest (für den Dedicated Server / Admins): prüft Blöcke, Items, Entities, Strukturen.
import { ItemStack, system, world } from "@minecraft/server";
import { ALL_SIMPLE, ALL_WEAPONS, ARMOR_SETS, ARMOR_SLOTS } from "./data/items";
import { MOBS, PROJECTILES } from "./data/mobs";
import { markWorldDirty, wdata } from "./core/store";
import { log } from "./core/util";
import { perm } from "./world/builder";
import { DUNGEONS, testBuildDungeon } from "./world/dungeons";
import { buildHub } from "./world/hub";
import { createGear } from "./systems/gear";

const BLOCKS_TO_CHECK = [
  "cdw:wegstein", "cdw:wegstein_eigen", "cdw:kopfgeldbrett", "cdw:runenstein", "cdw:wurzelherz", "cdw:barriere", "cdw:faeulnis", "cdw:altar",
];

function report(msg: string): void {
  log(msg);
  try {
    world.sendMessage(`§7[Test] ${msg}`);
  } catch {
    /* ignorieren */
  }
}

export async function runSelfTest(mode = "all"): Promise<void> {
  const errors: string[] = [];
  report(`Selbsttest startet (${mode})…`);
  // Blöcke
  for (const b of BLOCKS_TO_CHECK) if (!perm(b)) errors.push(`Block fehlt: ${b}`);
  // Items
  const itemIds = [...ALL_WEAPONS.map((w) => `cdw:${w.id}`), ...ALL_SIMPLE.map((s) => `cdw:${s.id}`), ...ARMOR_SETS.flatMap((s) => ARMOR_SLOTS.map((sl) => `cdw:${s.id}_${sl.slot}`))];
  for (const id of itemIds) {
    try {
      new ItemStack(id, 1);
    } catch {
      errors.push(`Item fehlt: ${id}`);
    }
  }
  try {
    createGear("cdw:schwert_bronze", 4);
  } catch (e) {
    errors.push(`createGear: ${String(e)}`);
  }
  report(`Items geprüft: ${itemIds.length}`);
  const dim = world.getDimension("minecraft:overworld");
  const base = { x: 10000, y: 100, z: 10000 };
  try {
    await world.tickingAreaManager.createTickingArea("cdw_test", { dimension: dim, from: { x: base.x - 40, y: 0, z: base.z - 140 }, to: { x: base.x + 40, y: 0, z: base.z + 40 } });
  } catch (e) {
    errors.push(`Ticking-Area: ${String(e)}`);
  }
  // Entities
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
    // Hain bauen
    const w = wdata();
    const oldHub = w.hub;
    const top = dim.getTopmostBlock({ x: base.x, z: base.z });
    w.hub = { x: base.x, y: top?.y ?? 64, z: base.z, stage: 0 };
    markWorldDirty();
    const t0 = Date.now();
    await buildHub(0, true);
    await buildHub(5, false);
    report(`Hain gebaut (Stufe 0→5) in ${Date.now() - t0} ms`);
    // Dungeons
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
    world.tickingAreaManager.removeTickingArea("cdw_test");
  } catch {
    /* ignorieren */
  }
  if (errors.length) for (const e of errors) report(`§cFEHLER: ${e}`);
  report(errors.length ? `Selbsttest beendet: ${errors.length} Fehler` : "Selbsttest beendet: OK");
  log(`SELFTEST_DONE errors=${errors.length}`);
}

export function initSelfTest(): void {
  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id === "cdw:selftest") void runSelfTest(ev.message || "all");
  });
}
