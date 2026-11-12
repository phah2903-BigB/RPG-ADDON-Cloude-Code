// Klassenwahl.
import { ItemStack, Player } from "@minecraft/server";
import { ABILITIES, CLASSES, ClassId, classById } from "../data/classes";
import { emit } from "../core/bus";
import { markDirty, pdata } from "../core/store";
import { msg, sound, title } from "../core/util";
import { createGear } from "../systems/gear";
import { invalidate, setMana, stats } from "../systems/stats";
import { giveItem } from "../systems/quests";
import { confirm, menu } from "../systems/ui";

export function giveRunes(p: Player, onlyMissing = true): number {
  const d = pdata(p);
  const lvl = stats(p).level;
  let n = 0;
  const inv = p.getComponent("minecraft:inventory") as unknown as { container: { size: number; getItem(i: number): ItemStack | undefined } } | undefined;
  const have = new Set<string>();
  if (inv && onlyMissing) for (let i = 0; i < inv.container.size; i++) {
    const it = inv.container.getItem(i);
    if (it) have.add(it.typeId);
  }
  for (const a of ABILITIES) {
    if (a.cls !== d.cls || a.level > lvl) continue;
    const id = `cdw:rune_${a.id}`;
    if (have.has(id)) continue;
    const it = new ItemStack(id, 1);
    it.keepOnDeath = true;
    giveItem(p, it);
    n++;
  }
  return n;
}

/** Entfernt Runen anderer Klassen aus dem Inventar. */
export function removeForeignRunes(p: Player): void {
  const d = pdata(p);
  const inv = p.getComponent("minecraft:inventory") as unknown as { container: { size: number; getItem(i: number): ItemStack | undefined; setItem(i: number, it?: ItemStack): void } } | undefined;
  if (!inv) return;
  for (let i = 0; i < inv.container.size; i++) {
    const it = inv.container.getItem(i);
    if (!it?.typeId.startsWith("cdw:rune_")) continue;
    const a = ABILITIES.find((x) => `cdw:rune_${x.id}` === it.typeId);
    if (a && a.cls !== d.cls) inv.container.setItem(i, undefined);
  }
}

export async function openClassPick(p: Player, change = false): Promise<void> {
  const d = pdata(p);
  if (d.cls && !change) return;
  await menu(
    p,
    "§6Wähle deinen Weg",
    "§7Jede Klasse spielt sich anders. Ihr könnt als Gruppe verschiedene Klassen wählen – sie ergänzen sich!\n ",
    CLASSES.map((c) => ({
      text: `${c.color}§l${c.name}§r\n§8${c.role}`,
      icon: `textures/cdw/ui/class_${c.id}`,
      action: async () => {
        const ok = await confirm(p, `${c.color}${c.name}`, `§f${c.desc}\n\n§7Waffen: §f${c.weapons.join(", ").replace("zweihaender", "Zweihänder").replace("waldlaeufer", "")}\n§7Startfähigkeit: §d${ABILITIES.find((a) => a.cls === c.id && a.level === 1)?.name}\n\n§eDiese Klasse wählen?`, "§aWählen", "§7Zurück");
        if (!ok) {
          await openClassPick(p, change);
          return;
        }
        setClass(p, c.id, !change);
      },
    }))
  );
  if (!pdata(p).cls) msg(p, "§7Du kannst deine Klasse jederzeit im Abenteuerbuch wählen.");
}

export function setClass(p: Player, cls: ClassId, starter: boolean): void {
  const d = pdata(p);
  d.cls = cls;
  d.talents = {};
  d.attr = { str: 0, dex: 0, int: 0, vit: 0, wis: 0 };
  markDirty(p);
  invalidate(p);
  setMana(p, stats(p).maxMana);
  removeForeignRunes(p);
  giveRunes(p);
  const c = classById(cls)!;
  if (starter) {
    giveItem(p, createGear(`cdw:${c.starter}`, 1));
  }
  title(p, `${c.color}${c.name}`, "§7Dein Weg beginnt", 10, 50, 15);
  sound(p, "random.totem", undefined, 1.2, 0.6);
  msg(p, `§a✦ Du bist jetzt ${c.color}${c.name}§a. §7Lege die Rune in die Schnellleiste und benutze sie!`);
  emit("flag", { key: "class_chosen", player: p });
}
