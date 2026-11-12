// Registrierung der eigenen Item- und Block-Komponenten.
import { BlockPermutation, EntityInventoryComponent, ItemStack, Player, StartupEvent, system, world } from "@minecraft/server";
import { simpleItem } from "../data/items";
import { markDirty, pdata } from "../core/store";
import { V, fmt, isValid, later, msg, particle, sound, title } from "../core/util";
import { castRune, useWeapon } from "./abilities";
import { ensureItem, weaponOf } from "./gear";
import { addGold } from "./progression";
import { getMana, healPct, invalidate, setMana, stats } from "./stats";
import { openBook } from "../ui/book";
import { openBounties } from "../ui/npcmenus";
import { plantHub, hubPos } from "../world/hub";
import { onHeart, onRuneStone } from "../world/dungeons";
import { openWaystone, registerWaystone, unregisterAt, travel } from "../world/waystones";
import { emit } from "../core/bus";
import { summonWorldBoss } from "../world/events";
import { confirm } from "./ui";
import { takeItem } from "./quests";

function applyConsumable(p: Player, typeId: string): void {
  const s = simpleItem(typeId.slice(4));
  if (!s?.effects) return;
  const d = pdata(p);
  const now = Date.now();
  for (const [k, v] of Object.entries(s.effects)) {
    switch (k) {
      case "heal":
        healPct(p, v);
        particle(p.dimension, "minecraft:heart_particle", V.add(p.location, { x: 0, y: 2, z: 0 }));
        break;
      case "mana":
        setMana(p, getMana(p) + stats(p).maxMana * v);
        particle(p.dimension, "minecraft:blue_flame_particle", V.add(p.location, { x: 0, y: 2, z: 0 }));
        break;
      case "buff_dmg":
        d.buffs.dmg = now + v * 1000;
        break;
      case "buff_resist":
        d.buffs.resist = now + v * 1000;
        break;
      case "buff_xp":
        d.buffs.xp = now + v * 1000;
        break;
      case "buff_speed":
        p.addEffect("speed", v * 20, { amplifier: 1 });
        p.addEffect("haste", v * 20, { amplifier: 1 });
        break;
    }
  }
  markDirty(p);
  invalidate(p);
  sound(p, "random.drink", undefined, 1.1, 0.8);
}

function recall(p: Player, item: ItemStack): void {
  const hub = hubPos();
  if (!hub) {
    msg(p, "§7Es gibt noch keinen Hain.");
    return;
  }
  const start = V.floor(p.location);
  title(p, "", "§aKonzentration… nicht bewegen", 0, 60, 5);
  let n = 0;
  const id = system.runInterval(() => {
    if (!isValid(p)) {
      system.clearRun(id);
      return;
    }
    if (V.dist(V.floor(p.location), start) > 1.5) {
      system.clearRun(id);
      msg(p, "§cRückkehr abgebrochen.");
      return;
    }
    particle(p.dimension, "minecraft:villager_happy", V.add(p.location, { x: Math.random() - 0.5, y: 1 + Math.random(), z: Math.random() - 0.5 }));
    if (++n >= 6) {
      system.clearRun(id);
      if (takeItem(p, item.typeId, 1)) travel(p, "hub", true);
    }
  }, 10);
}

async function useTool(p: Player, item: ItemStack): Promise<void> {
  switch (item.typeId) {
    case "cdw:buch":
      await openBook(p);
      return;
    case "cdw:samen": {
      const hit = p.getBlockFromViewDirection({ maxDistance: 7 });
      const b = hit?.block;
      if (!b || !["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:moss_block", "minecraft:coarse_dirt", "minecraft:rooted_dirt"].includes(b.typeId)) {
        msg(p, "§7Schau auf einen Gras- oder Erdblock, um den Samen zu pflanzen.");
        return;
      }
      const ok = await confirm(p, "§aSamen pflanzen", `§fHier pflanzen? §7(${b.x}, ${b.y}, ${b.z})\n\n§7Der Hain braucht etwa §f42 × 42 Blöcke§7. Bäume, Pflanzen und lose Blöcke in diesem Kreis werden eingeebnet – eigene Bauten bitte nicht in die Nähe!`, "§aPflanzen", "§7Abbrechen");
      if (!ok) return;
      if (await plantHub(p, b.location)) {
        takeItem(p, "cdw:samen", 1);
        emit("flag", { key: "hub_planted", player: p });
      }
      return;
    }
    case "cdw:rueckkehrschriftrolle":
      recall(p, item);
      return;
    case "cdw:muenzbeutel": {
      const amount = (item.getDynamicProperty("cdw:gold") as number) ?? 0;
      if (takeItem(p, "cdw:muenzbeutel", 1)) addGold(p, amount, "(Münzbeutel)", false);
      return;
    }
    case "cdw:beschwoerungsstein":
      msg(p, "§7Lege den Stein auf den §dAltar des Uralten§7 im Norden des Hains (Altar benutzen).");
      return;
  }
}

export function registerComponents(ev: StartupEvent): void {
  const items = ev.itemComponentRegistry;
  items.registerCustomComponent("cdw:weapon", {
    onUse(e) {
      const it = e.itemStack;
      if (!it) return;
      const w = weaponOf(it.typeId);
      if (!w || w.type === "langbogen") return;
      useWeapon(e.source, it.typeId);
    },
  });
  items.registerCustomComponent("cdw:rune", {
    onUse(e, params) {
      const id = (params.params as { ability?: string })?.ability;
      if (id) castRune(e.source, id);
    },
  });
  items.registerCustomComponent("cdw:consumable", {
    onConsume(e) {
      if (e.source.typeId === "minecraft:player") applyConsumable(e.source as Player, e.itemStack.typeId);
    },
  });
  items.registerCustomComponent("cdw:tool", {
    onUse(e) {
      const it = e.itemStack;
      if (!it) return;
      const p = e.source;
      system.run(() => void useTool(p, it));
    },
  });

  const blocks = ev.blockComponentRegistry;
  blocks.registerCustomComponent("cdw:waystone", {
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      const loc = e.block.location;
      system.run(() => void openWaystone(p, loc));
    },
  });
  blocks.registerCustomComponent("cdw:waystone_own", {
    onPlace(e) {
      const loc = e.block.location;
      const dim = e.dimension.id;
      system.run(() => {
        const near = e.dimension.getPlayers({ location: loc, maxDistance: 8 })[0];
        registerWaystone(`own_${loc.x}_${loc.y}_${loc.z}`, loc, dim, `${near?.name ?? "Eigener"}s Wegstein (${loc.x}, ${loc.z})`, near?.name);
      });
    },
    onPlayerBreak(e) {
      const loc = e.block.location;
      const dim = e.dimension.id;
      system.run(() => unregisterAt(loc, dim));
    },
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      const loc = e.block.location;
      system.run(() => void openWaystone(p, loc));
    },
  });
  blocks.registerCustomComponent("cdw:board", {
    onPlayerInteract(e) {
      const p = e.player;
      if (p) system.run(() => void openBounties(p));
    },
  });
  blocks.registerCustomComponent("cdw:runestone", {
    onPlayerInteract(e) {
      const p = e.player;
      const loc = e.block.location;
      if (p) system.run(() => onRuneStone(p, loc));
    },
  });
  blocks.registerCustomComponent("cdw:heart", {
    onPlayerInteract(e) {
      const p = e.player;
      const loc = e.block.location;
      if (p) system.run(() => void onHeart(p, loc));
    },
  });
  blocks.registerCustomComponent("cdw:altar", {
    onPlayerInteract(e) {
      const p = e.player;
      if (!p) return;
      system.run(async () => {
        const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
        let has = false;
        if (inv) for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === "cdw:beschwoerungsstein") has = true;
        if (!has) {
          msg(p, "§7Der Altar wartet auf einen §dBeschwörungsstein§7.");
          return;
        }
        if (!(await confirm(p, "§cDer Uralte", "§7Den Uralten Wurzelwyrm beschwören? §cSehr gefährlich – empfohlen ab Stufe 50, gemeinsam."))) return;
        const err = summonWorldBoss(p);
        if (err) msg(p, `§c${err}`);
        else takeItem(p, "cdw:beschwoerungsstein", 1);
      });
    },
  });
  blocks.registerCustomComponent("cdw:blight", {
    onRandomTick(e) {
      // Fäulnis-Block: zerfällt langsam wieder zu Moos, wenn der Hain stark genug ist
      if (Math.random() < 0.02) {
        try {
          e.block.setPermutation(BlockPermutation.resolve("minecraft:moss_block"));
        } catch {
          /* ignorieren */
        }
      }
    },
  });
}

/** Neue Items initialisieren (Seltenheit, Seelenbindung). */
export function initItemWatch(): void {
  world.afterEvents.playerInventoryItemChange.subscribe((ev) => {
    const it = ev.itemStack;
    if (!it || !it.typeId.startsWith("cdw:")) return;
    const p = ev.player;
    const slot = ev.slot;
    system.run(() => {
      try {
        const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
        const cur = inv?.getItem(slot);
        if (!cur || cur.typeId !== it.typeId) return;
        const changed = ensureItem(cur);
        if (changed) inv!.setItem(slot, changed);
        const g = changed ? undefined : undefined;
        void g;
        if (cur.typeId.startsWith("cdw:") && weaponOf(cur.typeId)?.unique) {
          const d = pdata(p);
          d.stats.legendaries = Math.max(d.stats.legendaries ?? 0, 1);
          markDirty(p);
        }
      } catch {
        /* ignorieren */
      }
    });
  });
}

export function goldPouch(amount: number): ItemStack {
  const it = new ItemStack("cdw:muenzbeutel", 1);
  it.setDynamicProperty("cdw:gold", amount);
  it.setLore([`§e${fmt(amount)} Gold`]);
  return it;
}

export { later };
