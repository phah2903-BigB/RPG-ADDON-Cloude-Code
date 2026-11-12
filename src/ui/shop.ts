// Wirtschaft: Kaufen, Verkaufen, Schmied (Verbessern, Reparieren, Zerlegen).
import { EntityInventoryComponent, EquipmentSlot, ItemDurabilityComponent, ItemStack, Player } from "@minecraft/server";
import { RARITIES, UPGRADE_MAX, upgradeCost } from "../data/balance";
import { ALL_SIMPLE, ALL_WEAPONS, simpleItem } from "../data/items";
import { emit } from "../core/bus";
import { markDirty, pdata } from "../core/store";
import { fmt, msg, sound } from "../core/util";
import { addGold, repDiscount, repLevel, spendGold } from "../systems/progression";
import { armorOf, displayName, equippable, getGear, isGear, setGear, weaponOf, createGear } from "../systems/gear";
import { countItem, giveItem, takeItem } from "../systems/quests";
import { confirm, menu, MenuButton } from "../systems/ui";
import { invalidate, level } from "../systems/stats";

interface Offer {
  id: string; // cdw:… oder minecraft:…
  n: number;
  price: number;
  rep?: number; // benötigte Rufstufe
  minLevel?: number;
  gear?: boolean;
}

export const SHOPS: Record<string, { title: string; offers: Offer[] }> = {
  fennick: {
    title: "§eFennicks Waren",
    offers: [
      { id: "cdw:heiltrank_klein", n: 1, price: 8 },
      { id: "cdw:manatrank_klein", n: 1, price: 8 },
      { id: "cdw:heiltrank", n: 1, price: 20, rep: 1 },
      { id: "cdw:manatrank", n: 1, price: 20, rep: 1 },
      { id: "cdw:rueckkehrschriftrolle", n: 1, price: 25 },
      { id: "minecraft:bread", n: 8, price: 10 },
      { id: "minecraft:arrow", n: 16, price: 8 },
      { id: "minecraft:torch", n: 16, price: 6 },
      { id: "cdw:runenstaub", n: 1, price: 60, rep: 2 },
      { id: "cdw:mondsilberbarren", n: 1, price: 45, rep: 2 },
      { id: "cdw:talisman_leben", n: 1, price: 900, rep: 3 },
      { id: "cdw:talisman_macht", n: 1, price: 900, rep: 3 },
      { id: "cdw:talisman_wind", n: 1, price: 900, rep: 4 },
      { id: "cdw:wegstein_eigen", n: 1, price: 400, rep: 2 },
      { id: "cdw:beschwoerungsstein", n: 1, price: 2500, rep: 4, minLevel: 45 },
    ],
  },
  mira: {
    title: "§dMiras Alchemie",
    offers: [
      { id: "cdw:heiltrank", n: 1, price: 18 },
      { id: "cdw:manatrank", n: 1, price: 18 },
      { id: "cdw:heiltrank_gross", n: 1, price: 40, rep: 2 },
      { id: "cdw:manatrank_gross", n: 1, price: 40, rep: 2 },
      { id: "cdw:elixier_staerke", n: 1, price: 70, rep: 1 },
      { id: "cdw:elixier_zaehigkeit", n: 1, price: 70, rep: 1 },
      { id: "cdw:elixier_eile", n: 1, price: 50 },
      { id: "cdw:elixier_weisheit", n: 1, price: 120, rep: 2 },
    ],
  },
  morgra: {
    title: "§5Morgras Gebräu",
    offers: [
      { id: "cdw:elixier_weisheit", n: 1, price: 90 },
      { id: "cdw:elixier_staerke", n: 1, price: 55 },
      { id: "cdw:manatrank_gross", n: 1, price: 32 },
      { id: "cdw:talisman_weisheit", n: 1, price: 700, rep: 2 },
      { id: "cdw:talisman_waechter", n: 1, price: 900, rep: 3 },
    ],
  },
};

export function itemLabel(id: string): string {
  if (id.startsWith("cdw:")) {
    const s = simpleItem(id.slice(4));
    if (s) return s.name;
    const w = ALL_WEAPONS.find((x) => `cdw:${x.id}` === id);
    if (w) return w.name;
    const a = armorOf(id);
    if (a) return a.set.pieceNames[a.slot];
    if (id === "cdw:wegstein_eigen") return "Eigener Wegstein";
  }
  return id.replace("minecraft:", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function iconFor(id: string): string | undefined {
  if (id.startsWith("cdw:")) return `textures/cdw/items/${id.slice(4)}`;
  return undefined;
}

export async function openShop(p: Player, shopId: string): Promise<void> {
  const shop = SHOPS[shopId];
  if (!shop) return;
  const d = pdata(p);
  const rep = repLevel(d.rep);
  const disc = repDiscount(p);
  const lvl = level(p);
  const offers = shop.offers.filter((o) => (o.rep ?? 0) <= rep.idx && (o.minLevel ?? 0) <= lvl);
  const locked = shop.offers.length - offers.length;
  await menu(
    p,
    shop.title,
    `§7Dein Gold: §e${fmt(d.gold)}§7 · Ruf: §a${rep.name}${disc > 0 ? ` §7(Rabatt ${Math.round(disc * 100)} %)` : ""}${locked ? `\n§8${locked} weitere Waren bei höherem Ruf/Stufe` : ""}`,
    offers.map((o) => {
      const price = Math.max(1, Math.round(o.price * (1 - disc)));
      return {
        text: `§f${itemLabel(o.id)}${o.n > 1 ? ` ×${o.n}` : ""}\n§e${fmt(price)} Gold`,
        icon: iconFor(o.id),
        action: async () => {
          if (!spendGold(p, price)) {
            msg(p, "§cNicht genug Gold.");
            sound(p, "note.bass", undefined, 0.7);
          } else {
            const it = new ItemStack(o.id, o.n);
            giveItem(p, it);
            msg(p, `§a+ ${itemLabel(o.id)}${o.n > 1 ? ` ×${o.n}` : ""} §7(-${price} Gold)`);
            sound(p, "random.orb", undefined, 1.4, 0.8);
          }
          await openShop(p, shopId);
        },
      };
    }),
    { back: undefined }
  );
}

function sellValue(it: ItemStack): number {
  const id = it.typeId;
  const w = weaponOf(id);
  const g = getGear(it);
  if (w) return Math.round(w.value * (1 + (g?.r ?? 0) * 0.8) * (1 + (g?.u ?? 0) * 0.15));
  const a = armorOf(id);
  if (a) return Math.round(a.set.value * (1 + (g?.r ?? 0) * 0.8) * (1 + (g?.u ?? 0) * 0.15));
  const s = id.startsWith("cdw:") ? simpleItem(id.slice(4)) : undefined;
  if (s && s.value > 0 && s.category !== "quest" && s.category !== "rune") return s.value * it.amount;
  return 0;
}

export async function openSell(p: Player): Promise<void> {
  const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
  if (!inv) return;
  const entries: { slot: number; it: ItemStack; v: number }[] = [];
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (!it) continue;
    const v = sellValue(it);
    if (v > 0) entries.push({ slot: i, it, v });
  }
  if (!entries.length) {
    msg(p, "§7Du hast nichts, was Fennick kaufen würde (Ausrüstung, Materialien, Tränke).");
    return;
  }
  const total = entries.filter((e) => !isGear(e.it.typeId)).reduce((s, e) => s + e.v, 0);
  const buttons: MenuButton[] = [];
  if (total > 0)
    buttons.push({
      text: `§aAlle Materialien & Tränke verkaufen\n§e+${fmt(total)} Gold`,
      action: async () => {
        for (const e of entries) if (!isGear(e.it.typeId)) inv.setItem(e.slot, undefined);
        addGold(p, total, "(Verkauf)", false);
      },
    });
  for (const e of entries.slice(0, 40)) {
    const g = getGear(e.it);
    buttons.push({
      text: `${g ? displayName(e.it.typeId, g) : itemLabel(e.it.typeId)}${e.it.amount > 1 ? ` ×${e.it.amount}` : ""}\n§e${fmt(e.v)} Gold`,
      icon: iconFor(e.it.typeId),
      action: async () => {
        const cur = inv.getItem(e.slot);
        if (!cur || cur.typeId !== e.it.typeId) return;
        if (g && g.r >= 3 && !(await confirm(p, "§cWirklich verkaufen?", `§f${displayName(e.it.typeId, g)}\n§7ist ${RARITIES[g.r].name}.`))) return;
        inv.setItem(e.slot, undefined);
        addGold(p, e.v, "(Verkauf)", false);
        await openSell(p);
      },
    });
  }
  await menu(p, "§eVerkaufen", `§7Dein Gold: §e${fmt(pdata(p).gold)}`, buttons);
}

// ------------------- Schmied -------------------
function heldGear(p: Player): { it: ItemStack; slot: EquipmentSlot } | undefined {
  const eq = equippable(p);
  if (!eq) return undefined;
  for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Chest, EquipmentSlot.Head, EquipmentSlot.Legs, EquipmentSlot.Feet]) {
    const it = eq.getEquipment(slot);
    if (it && isGear(it.typeId)) return { it, slot };
    if (slot === EquipmentSlot.Mainhand && it) break;
  }
  return undefined;
}

function gearTier(id: string): number {
  const w = weaponOf(id);
  if (w) return w.tier;
  const a = armorOf(id);
  return a ? Math.max(1, Math.round(a.set.reqLevel / 10)) : 1;
}

export async function openSmith(p: Player): Promise<void> {
  const d = pdata(p);
  await menu(p, "§6Bromse Schmiede", `§7Gold: §e${fmt(d.gold)} §7· Runenstaub: §b${countItem(p, "cdw:runenstaub")}\n§8Nimm die gewünschte Waffe in die Hand (oder trage die Rüstung).`, [
    { text: "§fAusrüstung verbessern\n§8+1 Stufe (max. +10)", icon: "textures/cdw/ui/upgrade", action: () => upgradeMenu(p) },
    { text: "§fAlles reparieren\n§8Gehaltene & getragene Ausrüstung", icon: "textures/cdw/ui/repair", action: () => repairAll(p) },
    { text: "§fZerlegen\n§8Ausrüstung → Runenstaub", icon: "textures/cdw/ui/salvage", action: () => salvageMenu(p) },
    { text: "§fMondsilber schmelzen\n§82 Goldbarren + 1 Frostsplitter", icon: "textures/cdw/items/mondsilberbarren", action: () => smelt(p) },
  ]);
}

async function upgradeMenu(p: Player): Promise<void> {
  const h = heldGear(p);
  if (!h) {
    msg(p, "§cHalte eine Waffe in der Hand oder trage Rüstung aus dem Hain.");
    return;
  }
  const g = getGear(h.it) ?? { r: 0, a: {}, u: 0 };
  if (g.u >= UPGRADE_MAX) {
    msg(p, "§7Das ist bereits Meisterarbeit (+10).");
    return;
  }
  const d = pdata(p);
  const free = (d.stats.freeUpgrade ?? 0) > 0;
  const cost = upgradeCost(gearTier(h.it.typeId), g.u + 1);
  const ok = await confirm(p, "§6Verbessern", `§f${displayName(h.it.typeId, g)} §7→ §e+${g.u + 1}\n\n§7Kosten: ${free ? "§aKostenlos (Willkommensgeschenk)" : `§e${fmt(cost.gold)} Gold §7+ §b${cost.dust} Runenstaub`}\n§7Effekt: +8 % Waffenschaden bzw. +6 % Rüstungswerte`, "§aVerbessern", "§7Abbrechen");
  if (!ok) return;
  if (!free) {
    if (countItem(p, "cdw:runenstaub") < cost.dust) {
      msg(p, "§cNicht genug Runenstaub. §7(Zerlege Ausrüstung oder besiege starke Gegner.)");
      return;
    }
    if (!spendGold(p, cost.gold)) {
      msg(p, "§cNicht genug Gold.");
      return;
    }
    takeItem(p, "cdw:runenstaub", cost.dust);
  } else {
    d.stats.freeUpgrade = 0;
    markDirty(p);
  }
  g.u++;
  const it = h.it;
  setGear(it, g);
  equippable(p)?.setEquipment(h.slot, it);
  d.stats.maxUpgrade = Math.max(d.stats.maxUpgrade ?? 0, g.u);
  markDirty(p);
  invalidate(p);
  sound(p, "random.anvil_use", undefined, 1, 1);
  msg(p, `§a✦ ${displayName(it.typeId, g)} §averbessert!`);
  emit("flag", { key: "upgrade_done", player: p });
}

async function repairAll(p: Player): Promise<void> {
  const eq = equippable(p);
  if (!eq) return;
  let cost = 0;
  const todo: { slot: EquipmentSlot; it: ItemStack; dur: ItemDurabilityComponent }[] = [];
  for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand, EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet]) {
    const it = eq.getEquipment(slot);
    const dur = it?.getComponent("minecraft:durability") as ItemDurabilityComponent | undefined;
    if (it && dur && dur.damage > 0) {
      todo.push({ slot, it, dur });
      cost += Math.ceil(dur.damage / 20) * (1 + gearTier(it.typeId));
    }
  }
  if (!todo.length) {
    msg(p, "§7Nichts zu reparieren.");
    return;
  }
  if (!(await confirm(p, "§6Reparieren", `§7${todo.length} Gegenstände für §e${fmt(cost)} Gold§7 reparieren?`))) return;
  if (!spendGold(p, cost)) {
    msg(p, "§cNicht genug Gold.");
    return;
  }
  for (const t of todo) {
    t.dur.damage = 0;
    eq.setEquipment(t.slot, t.it);
  }
  sound(p, "random.anvil_use", undefined, 1.2, 0.8);
  msg(p, "§aAlles wie neu.");
}

async function salvageMenu(p: Player): Promise<void> {
  const inv = (p.getComponent("minecraft:inventory") as EntityInventoryComponent | undefined)?.container;
  if (!inv) return;
  const list: { slot: number; it: ItemStack; dust: number }[] = [];
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (!it || !isGear(it.typeId)) continue;
    const g = getGear(it);
    list.push({ slot: i, it, dust: 1 + (g?.r ?? 0) + Math.floor(gearTier(it.typeId) / 2) + Math.floor((g?.u ?? 0) / 3) });
  }
  if (!list.length) {
    msg(p, "§7Keine Ausrüstung zum Zerlegen im Inventar.");
    return;
  }
  const common = list.filter((l) => (getGear(l.it)?.r ?? 0) <= 1 && (getGear(l.it)?.u ?? 0) === 0);
  const buttons: MenuButton[] = [];
  if (common.length)
    buttons.push({
      text: `§aAlle gewöhnlichen & ungewöhnlichen zerlegen\n§b+${common.reduce((s, l) => s + l.dust, 0)} Runenstaub`,
      action: async () => {
        let n = 0;
        for (const l of common) {
          inv.setItem(l.slot, undefined);
          n += l.dust;
        }
        giveItem(p, new ItemStack("cdw:runenstaub", n));
        sound(p, "random.break", undefined, 0.8, 1);
      },
    });
  for (const l of list.slice(0, 30))
    buttons.push({
      text: `${displayName(l.it.typeId, getGear(l.it))}\n§b+${l.dust} Runenstaub`,
      action: async () => {
        const g = getGear(l.it);
        if (g && (g.r >= 3 || g.u >= 3) && !(await confirm(p, "§cWirklich zerlegen?", displayName(l.it.typeId, g)))) return;
        inv.setItem(l.slot, undefined);
        giveItem(p, new ItemStack("cdw:runenstaub", l.dust));
        sound(p, "random.break", undefined, 0.8, 1);
        await salvageMenu(p);
      },
    });
  await menu(p, "§6Zerlegen", "§7Ausrüstung wird zu Runenstaub (für Verbesserungen).", buttons);
}

async function smelt(p: Player): Promise<void> {
  if (!pdata(p).done.includes("b2")) {
    msg(p, "§7Brom: „Das Rezept verrate ich dir erst, wenn du mir hilfst.“ §8(Nebenquest „Mondsilber“)");
    return;
  }
  if (countItem(p, "minecraft:gold_ingot") < 2 || countItem(p, "cdw:frostsplitter") < 1) {
    msg(p, "§cBenötigt 2 Goldbarren und 1 Frostsplitter.");
    return;
  }
  takeItem(p, "minecraft:gold_ingot", 2);
  takeItem(p, "cdw:frostsplitter", 1);
  giveItem(p, new ItemStack("cdw:mondsilberbarren", 1));
  sound(p, "random.anvil_use", undefined, 1.4, 0.8);
}

/** Schmieden einer Waffe/Rüstung gegen Material (Brom, ab Ruf 2). */
export async function openForge(p: Player): Promise<void> {
  const d = pdata(p);
  const lvl = level(p);
  const tier = lvl < 10 ? 1 : lvl < 20 ? 2 : lvl < 30 ? 3 : 4;
  const tierName = ["bronze", "stahl", "mondsilber", "runenobsidian"][tier - 1];
  const bars = tier >= 3 ? 3 : 0;
  const gold = 60 * tier * tier;
  const types = (d.cls ? (await import("../systems/gear")).CLASS_WEAPONS[d.cls] : undefined) ?? ["schwert"];
  await menu(
    p,
    "§6Waffe schmieden",
    `§7Brom schmiedet dir eine Waffe deiner Stufe (§f${tierName}§7).\n§7Kosten: §e${gold} Gold${bars ? ` §7+ §f${bars} Mondsilberbarren` : ""} §7+ §b${tier} Runenstaub`,
    types.map((t) => ({
      text: `§f${itemLabel(`cdw:${t}_${tierName}`)}`,
      icon: `textures/cdw/items/${t}_${tierName}`,
      action: async () => {
        if (countItem(p, "cdw:runenstaub") < tier || countItem(p, "cdw:mondsilberbarren") < bars) {
          msg(p, "§cMaterial fehlt.");
          return;
        }
        if (!spendGold(p, gold)) {
          msg(p, "§cNicht genug Gold.");
          return;
        }
        takeItem(p, "cdw:runenstaub", tier);
        if (bars) takeItem(p, "cdw:mondsilberbarren", bars);
        giveItem(p, createGear(`cdw:${t}_${tierName}`, 1 + (Math.random() < 0.35 ? 1 : 0)));
        sound(p, "random.anvil_use", undefined, 1, 1);
      },
    }))
  );
}

export { ALL_SIMPLE };
