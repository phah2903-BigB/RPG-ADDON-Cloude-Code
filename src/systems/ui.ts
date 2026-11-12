// Formular-Helfer: Dialoge, Auswahlmenüs, Bestätigungen (PS5-Controller & Touch geeignet).
import { Player, system } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, FormCancelationReason, MessageFormData, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { Line, SPEAKERS } from "../data/quests";
import { npcById } from "../data/mobs";

async function showWithRetry<T extends { canceled: boolean; cancelationReason?: FormCancelationReason }>(p: Player, show: () => Promise<T>, tries = 12): Promise<T | undefined> {
  for (let i = 0; i < tries; i++) {
    let res: T;
    try {
      res = await show();
    } catch {
      return undefined;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await system.waitTicks(8);
      continue;
    }
    return res;
  }
  return undefined;
}

export interface MenuButton {
  text: string;
  icon?: string;
  action?: () => void | Promise<void>;
}

export async function menu(p: Player, titleText: string, body: string, buttons: MenuButton[], opts: { back?: () => void | Promise<void> } = {}): Promise<number | undefined> {
  const f = new ActionFormData().title(titleText);
  if (body) f.body(body);
  for (const b of buttons) f.button(b.text, b.icon);
  if (opts.back) f.button("§8« Zurück", "textures/cdw/ui/back");
  const res = (await showWithRetry(p, () => f.show(p))) as ActionFormResponse | undefined;
  if (!res || res.canceled || res.selection === undefined) return undefined;
  if (opts.back && res.selection === buttons.length) {
    await opts.back();
    return undefined;
  }
  const b = buttons[res.selection];
  if (b?.action) await b.action();
  return res.selection;
}

export async function confirm(p: Player, titleText: string, body: string, yes = "§aJa", no = "§cNein"): Promise<boolean> {
  const f = new MessageFormData().title(titleText).body(body).button1(no).button2(yes);
  const res = await showWithRetry(p, () => f.show(p));
  return !!res && !res.canceled && res.selection === 1;
}

export async function modal(p: Player, form: ModalFormData): Promise<ModalFormResponse | undefined> {
  const res = await showWithRetry(p, () => form.show(p));
  if (!res || res.canceled) return undefined;
  return res;
}

export function speakerName(s: string): string {
  if (SPEAKERS[s]) return SPEAKERS[s];
  const n = npcById(s);
  return n ? `§a${n.name}` : s;
}

export function speakerIcon(s: string): string | undefined {
  const n = npcById(s);
  if (n) return `textures/cdw/ui/portrait_${n.id}`;
  return undefined;
}

/** Zeigt Dialogzeilen nacheinander. Gibt false zurück, wenn abgebrochen. */
export async function dialog(p: Player, lines: Line[], finalButton = "§aVerstanden"): Promise<boolean> {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const last = i === lines.length - 1;
    const f = new ActionFormData().title(speakerName(l.s)).body(`§f${l.t}\n `);
    f.button(last ? finalButton : "§fWeiter  ▶", last ? "textures/cdw/ui/check" : "textures/cdw/ui/next");
    const res = await showWithRetry(p, () => f.show(p));
    if (!res) return false;
    if (res.canceled) {
      // Abbrechen überspringt den Rest des Dialogs nicht stillschweigend: Restliche Zeilen in den Chat
      for (let j = i; j < lines.length; j++) p.sendMessage(`${speakerName(lines[j].s)}§r§7: §f${lines[j].t}`);
      return true;
    }
  }
  return true;
}

/** Dialog mit Auswahl am Ende. */
export async function choice(p: Player, l: Line, options: string[]): Promise<number | undefined> {
  const f = new ActionFormData().title(speakerName(l.s)).body(`§f${l.t}\n `);
  for (const o of options) f.button(o);
  const res = await showWithRetry(p, () => f.show(p));
  if (!res || res.canceled) return undefined;
  return res.selection;
}

export { ActionFormData, ModalFormData };
