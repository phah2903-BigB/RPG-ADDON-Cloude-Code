// End-to-End-Test mit simuliertem Spieler. Start: /scriptevent cdwtest:run
import { world, system, GameMode, BlockPermutation } from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";

const log = (...a) => console.warn("[E2E] " + a.join(" "));
let lastState = null;
const results = [];
function check(name, cond, info = "") {
  results.push([name, !!cond]);
  log((cond ? "PASS " : "FAIL ") + name + (info ? " :: " + info : ""));
}
const wait = (t) => system.waitTicks(t);
function dbg(msg) {
  system.sendScriptEvent("cdw:debug", msg);
}
async function state(name = "Tester") {
  lastState = null;
  dbg("state " + name);
  for (let i = 0; i < 40 && !lastState; i++) await wait(1);
  return lastState;
}
async function until(fn, ticks = 200, step = 10) {
  for (let t = 0; t < ticks; t += step) {
    try {
      if (await fn()) return true;
    } catch {}
    await wait(step);
  }
  return false;
}
function count(p, id) {
  const inv = p.getComponent("minecraft:inventory").container;
  let n = 0;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === id) n += inv.getItem(i).amount;
  return n;
}
function slotOf(p, id) {
  const inv = p.getComponent("minecraft:inventory").container;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === id) return i;
  return -1;
}
function hold(p, id) {
  const inv = p.getComponent("minecraft:inventory").container;
  const s = slotOf(p, id);
  if (s < 0) return false;
  if (s > 8) inv.swapItems(s, 0, inv);
  p.selectedSlotIndex = s > 8 ? 0 : s;
  return true;
}
function talk(p, npcId, npc) {
  let ok = false;
  try {
    ok = p.interactWithEntity(npc);
  } catch (e) {
    log("interactWithEntity Fehler", String(e));
  }
  log(`interactWithEntity(${npcId}) → ${ok}`);
  // Simulierte Spieler lösen keine Script-Interaktionsevents aus → Logik direkt prüfen
  dbg(`talk Tester ${npcId}`);
}
async function killEntity(p, e, maxHits = 80) {
  for (let i = 0; i < maxHits && e.isValid; i++) {
    try {
      p.teleport({ x: e.location.x + 1.2, y: e.location.y, z: e.location.z }, { facingLocation: e.location });
      p.lookAtEntity(e);
      p.attackEntity(e);
    } catch {}
    await wait(12);
  }
  return !e.isValid;
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "cdwtest:state") {
    try {
      lastState = JSON.parse(ev.message);
    } catch {}
  }
  if (ev.id === "cdwtest:run") run().catch((e) => log("ABBRUCH", String(e), e?.stack ?? ""));
});

async function run() {
  log("Start");
  dbg("autotest on");
  const dim = world.getDimension("overworld");
  const sp = world.getDefaultSpawnLocation();
  const base = { x: sp.x, z: sp.z };
  await world.tickingAreaManager.createTickingArea("e2e", { dimension: dim, from: { x: base.x - 40, y: 0, z: base.z - 40 }, to: { x: base.x + 40, y: 0, z: base.z + 40 } });
  await wait(20);
  // Bodenhöhe ohne Laub/Holz
  let top = dim.getTopmostBlock({ x: base.x, z: base.z });
  while (top && /leaves|log|wood|air|grass$|fern|flower|vine/.test(top.typeId)) top = top.below();
  const p = spawnSimulatedPlayer({ dimension: dim, x: base.x + 0.5, y: top.y + 1, z: base.z + 0.5 }, "Tester", GameMode.Survival);
  await wait(120);
  const keepAlive = () => {
    try {
      const h = p.getComponent("minecraft:health");
      if (h.currentValue <= 0) {
        log("Spieler tot – Wiederbelebung");
        p.respawn();
      }
      p.addEffect("resistance", 400, { amplifier: 3, showParticles: false });
      p.addEffect("regeneration", 400, { amplifier: 2, showParticles: false });
      p.addEffect("saturation", 400, { amplifier: 1, showParticles: false });
    } catch {}
  };
  const ka = system.runInterval(keepAlive, 100);
  keepAlive();

  // 1) Startitems
  check("Startitems (Buch + Samen)", count(p, "cdw:buch") === 1 && count(p, "cdw:samen") === 1, `buch=${count(p, "cdw:buch")} samen=${count(p, "cdw:samen")}`);

  // 2) Hain pflanzen
  dbg("plant Tester");
  await until(async () => (await state())?.hub, 300);
  let s = await state();
  check("Hain gepflanzt", !!s?.hub, JSON.stringify(s?.hub));
  await wait(240);
  const hub = s.hub;
  const ws = dim.getBlock({ x: hub.x - 6, y: hub.y + 1, z: hub.z + 15 });
  check("Wegstein im Hain gebaut", ws?.typeId === "cdw:wegstein", ws?.typeId);
  const tree = dim.getBlock({ x: hub.x, y: hub.y + 3, z: hub.z });
  check("Baum gewachsen", tree?.typeId === "minecraft:oak_wood", tree?.typeId);
  let npcs = dim.getEntities({ type: "cdw:npc" });
  check("NPCs erschienen", npcs.length >= 2, `n=${npcs.length}`);
  s = await state();
  check("Hauptquest 2 wartet auf Sylva", s.main.idx === 1 && s.main.s === -1, JSON.stringify(s.main));

  // 3) Mit Sylva sprechen
  const sylva = npcs.find((e) => e.hasTag("cdw_npc:sylva"));
  p.teleport({ x: sylva.location.x + 1.5, y: sylva.location.y, z: sylva.location.z }, { facingLocation: sylva.location });
  await wait(10);
  talk(p, "sylva", sylva);
  await wait(40);
  s = await state();
  check("Quest „Die Hüterin“ angenommen", s.main.idx === 1 && s.main.s === 0, JSON.stringify(s.main));

  // 4) Klasse wählen
  dbg("class Tester krieger");
  await wait(40);
  s = await state();
  check("Klasse Krieger", s.cls === "krieger");
  check("Startwaffe + Rune erhalten", count(p, "cdw:schwert_bronze") === 1 && count(p, "cdw:rune_wirbelschlag") === 1);
  check("Hauptquest 3 erreicht", s.main.idx === 2, JSON.stringify(s.main));

  // 5) Quest 3 annehmen, Rune benutzen
  talk(p, "sylva", sylva);
  await wait(40);
  s = await state();
  check("Quest „Erste Schritte“ angenommen", s.main.idx === 2 && s.main.s === 0, JSON.stringify(s.main));
  const manaBefore = s.mana;
  hold(p, "cdw:rune_wirbelschlag");
  await wait(5);
  const used = p.useItemInSlot(p.selectedSlotIndex);
  log(`useItemInSlot(rune) → ${used}`);
  await wait(20);
  // Simulierte Spieler lösen keine Item-Custom-Component-Events aus → Logik direkt prüfen
  dbg("cast Tester wirbelschlag");
  await wait(20);
  s = await state();
  check("Rune gewirkt (Mana verbraucht)", s.mana < manaBefore, `${manaBefore} → ${s.mana}`);
  check("Ziel „Fähigkeit benutzen“ erfüllt", s.main.idx === 2 && s.main.s === 1, JSON.stringify(s.main));

  // 6) Mooslinge besiegen
  hold(p, "cdw:schwert_bronze");
  await wait(60);
  let mobs = dim.getEntities({ type: "cdw:moosling" });
  check("Mooslinge erschienen", mobs.length >= 6, `n=${mobs.length}`);
  const xp0 = s.xp;
  for (const m of mobs.slice(0, 7)) await killEntity(p, m, 30);
  await wait(20);
  s = await state();
  check("XP durch Kämpfe", s.xp > xp0, `${xp0} → ${s.xp}`);
  check("Kills gezählt", s.kills >= 6, `kills=${s.kills}`);
  check("Quest 3 bereit zur Abgabe", s.main.idx === 2 && s.main.s === 2, JSON.stringify(s.main));
  talk(p, "sylva", sylva);
  await wait(40);
  s = await state();
  check("Quest 3 abgegeben → Quest 4", s.main.idx === 3, JSON.stringify(s.main));

  // 7) Schaden durch Monster (Skalierung)
  system.clearRun(ka);
  p.removeEffect("resistance");
  p.removeEffect("regeneration");
  const z = dim.spawnEntity("minecraft:zombie", { x: p.location.x + 2, y: p.location.y, z: p.location.z });
  const hp0 = s.hp.cur;
  for (let i = 0; i < 12; i++) {
    try {
      z.teleport({ x: p.location.x + 1, y: p.location.y, z: p.location.z }, { facingLocation: p.location });
    } catch {}
    await wait(10);
  }
  s = await state();
  check("Spieler nimmt Monsterschaden, überlebt", s.hp.cur < hp0 && s.hp.cur > 0, `${hp0} → ${s.hp.cur}/${s.hp.max}`);
  if (z.isValid) await killEntity(p, z, 40);
  const ka2 = system.runInterval(keepAlive, 100);
  keepAlive();

  // 8) Verteidigung des Hains
  talk(p, "sylva", sylva);
  await wait(40);
  for (let wave = 0; wave < 3; wave++) {
    await until(() => dim.getEntities({ tags: ["cdw_def:hain"] }).length > 0, 200);
    const list = dim.getEntities({ tags: ["cdw_def:hain"] });
    log(`Welle ${wave + 1}: ${list.length} Gegner`);
    for (const e of list) e.kill();
    await wait(60);
  }
  await wait(60);
  s = await state();
  check("Verteidigung abgeschlossen (Quest 4 bereit)", s.main.idx === 3 && s.main.s === 1, JSON.stringify(s.main));
  talk(p, "sylva", sylva);
  await wait(60);
  s = await state();
  check("Quest 5 (Kaels Lager) gestartet", s.main.idx === 4 && s.main.s === 0, JSON.stringify(s.main));

  // 9) Wegstein aktivieren
  p.teleport({ x: hub.x - 6 + 0.5, y: hub.y + 1, z: hub.z + 13.5 }, { facingLocation: { x: hub.x - 5.5, y: hub.y + 1.5, z: hub.z + 15.5 } });
  await wait(10);
  p.interactWithBlock({ x: hub.x - 6, y: hub.y + 1, z: hub.z + 15 });
  await wait(20);
  s = await state();
  check("Wegstein aktiviert", s.ws.includes("hub"), JSON.stringify(s.ws));

  // 10) Dungeon (Akt 1)
  dbg("main 6 0");
  await wait(10);
  dbg("dungeon dornenhain");
  await wait(10);
  s = await state();
  let d = s.dungeons.dornenhain;
  check("Dungeon-Ort bestimmt", !!d, JSON.stringify(d));
  await world.tickingAreaManager.createTickingArea("e2e_dg", { dimension: dim, from: { x: d.x - 20, y: 0, z: d.z - 120 }, to: { x: d.x + 20, y: 0, z: d.z + 12 } });
  p.teleport({ x: d.x + 0.5, y: 200, z: d.z + 12.5 });
  p.addEffect("slow_falling", 400, { showParticles: false });
  p.addEffect("resistance", 6000, { amplifier: 4, showParticles: false });
  await until(async () => (await state())?.dungeons?.dornenhain?.built, 600, 20);
  s = await state();
  d = s.dungeons.dornenhain;
  check("Dungeon gebaut", d.built, JSON.stringify({ x: d.x, y: d.y, z: d.z }));
  p.teleport({ x: d.x + 0.5, y: d.y + 1, z: d.z + 3.5 });
  await wait(60);
  s = await state();
  check("Quest-Ziel „Erreiche den Dornenhain“", s.main.idx === 6 && s.main.s >= 1, JSON.stringify(s.main));
  const heartBlock = dim.getBlock({ x: d.x, y: d.y - 14 + 2, z: d.z - 112 });
  check("Wurzelherz platziert", heartBlock?.typeId === "cdw:wurzelherz", heartBlock?.typeId);
  const door = dim.getBlock({ x: d.x, y: d.y - 14 + 1, z: d.z - 33 });
  check("Tür (Barriere) vorhanden", door?.typeId === "cdw:barriere", door?.typeId);

  // Raum 1
  const roomCenter = (z0) => ({ x: d.x + 0.5, y: d.y - 14 + 0.1, z: d.z + z0 + 0.5 });
  async function clearWaveRoom(idx, z0) {
    p.teleport(roomCenter(z0));
    for (let i = 0; i < 6; i++) {
      await wait(30);
      const tag = `cdw_dg:dornenhain:${idx}`;
      const list = dim.getEntities({ tags: [tag] });
      for (const e of list) e.kill();
      s = await state();
      if (s.dungeons.dornenhain.stage > idx) return true;
    }
    return false;
  }
  check("Raum 1 gesäubert", await clearWaveRoom(0, -25));
  check("Tür 1 offen", dim.getBlock({ x: d.x, y: d.y - 14 + 1, z: d.z - 33 })?.typeId === "minecraft:air");
  // Rätsel
  p.teleport(roomCenter(-45));
  await wait(20);
  s = await state();
  const dd = s.dungeons.dornenhain.data;
  for (let k = 0; k < 4; k++) {
    const loc = { x: d.x + dd[`r${k}x`], y: d.y + dd[`r${k}y`], z: d.z + dd[`r${k}z`] };
    p.teleport({ x: loc.x + 0.5, y: loc.y, z: loc.z + 1.5 }, { facingLocation: { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 } });
    await wait(6);
    p.interactWithBlock(loc);
    await wait(10);
  }
  s = await state();
  check("Runenrätsel gelöst", s.dungeons.dornenhain.stage >= 2, `stage=${s.dungeons.dornenhain.stage}`);
  check("Raum 3 gesäubert", await clearWaveRoom(2, -65));
  s = await state();
  check("Quest-Ziel Tiefe erreicht", s.main.s >= 2, JSON.stringify(s.main));
  // Boss
  p.teleport(roomCenter(-84));
  const bossOk = await until(() => dim.getEntities({ type: "cdw:boss_rindenschreck" }).length > 0, 200);
  check("Boss erscheint", bossOk);
  const boss = dim.getEntities({ type: "cdw:boss_rindenschreck" })[0];
  if (boss) {
    hold(p, "cdw:schwert_bronze");
    await killEntity(p, boss, 6);
    dbg(`mob ${boss.id}`);
    await wait(5);
    boss.kill();
  }
  await wait(60);
  s = await state();
  check("Boss besiegt", s.dungeons.dornenhain.boss, JSON.stringify(s.main));
  // Herz
  p.teleport({ x: d.x + 0.5, y: d.y - 14 + 1, z: d.z - 110 + 0.5 }, { facingLocation: { x: d.x + 0.5, y: d.y - 12 + 0.5, z: d.z - 111.5 } });
  await wait(10);
  p.interactWithBlock({ x: d.x, y: d.y - 12, z: d.z - 112 });
  await wait(60);
  s = await state();
  check("Wurzelherz gereinigt", s.dungeons.dornenhain.heart);
  check("Hauptquest 8 erreicht", s.main.idx === 7, JSON.stringify(s.main));

  const pass = results.filter((r) => r[1]).length;
  log(`ERGEBNIS ${pass}/${results.length} bestanden`);
  for (const r of results) if (!r[1]) log("  FEHLGESCHLAGEN: " + r[0]);
  system.clearRun(ka2);
  log("E2E_DONE");
}
