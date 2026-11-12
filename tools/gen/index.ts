// Generator: erzeugt alle JSON-Dateien des Behavior- und Resource-Packs aus den Daten in src/data.
import * as fs from "fs";
import * as path from "path";
import { ALL_SIMPLE, ALL_WEAPONS, ARMOR_SETS, ARMOR_SLOTS, CONSUMABLES, MATERIALS, QUEST_ITEMS, RUNES, TALISMANS, WEAPON_TYPES, weaponTypeDef } from "../../src/data/items";
import { MOBS, NPCS, PROJECTILES, MobDef } from "../../src/data/mobs";
import { ABILITIES } from "../../src/data/classes";
import { BLOCK_MODELS, MODELS, animationsFor, blockGeometryJson, geometryJson, paintInfo } from "./models";

const ROOT = process.cwd();
const BP = path.join(ROOT, "packs/BP");
const RP = path.join(ROOT, "packs/RP");
const BUILD = path.join(ROOT, "build");
const UUIDS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/uuids.json"), "utf8"));
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version.split(".").map(Number) as [number, number, number];
const MIN_ENGINE = [1, 26, 30];
const ITEM_FV = "1.21.90";
const BLOCK_FV = "1.21.90";
const ENTITY_FV = "1.21.0";

function write(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
}
function clean(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

const lang: string[] = [];
const L = (k: string, v: string) => lang.push(`${k}=${v}`);

// ======================= Manifeste =======================
function manifests(): void {
  write(path.join(BP, "manifest.json"), {
    format_version: 2,
    header: { name: "Chroniken des Weltenbaums §7(Verhalten)", description: "RPG-Abenteuer: Klassen, Quests, Dungeons, Bosse. §aPS5 · Android · Realm", uuid: UUIDS.bp_header, version: VERSION, min_engine_version: MIN_ENGINE },
    modules: [
      { type: "data", uuid: UUIDS.bp_data, version: VERSION },
      { type: "script", language: "javascript", uuid: UUIDS.bp_script, version: VERSION, entry: "scripts/main.js" },
    ],
    dependencies: [
      { uuid: UUIDS.rp_header, version: VERSION },
      { module_name: "@minecraft/server", version: "2.8.0" },
      { module_name: "@minecraft/server-ui", version: "2.1.0" },
    ],
    metadata: { authors: ["Chroniken des Weltenbaums"], product_type: "addon" },
  });
  write(path.join(RP, "manifest.json"), {
    format_version: 2,
    header: { name: "Chroniken des Weltenbaums §7(Ressourcen)", description: "Modelle, Texturen und Texte. Passend zu Natur Fantasy 64x.", uuid: UUIDS.rp_header, version: VERSION, min_engine_version: MIN_ENGINE },
    modules: [{ type: "resources", uuid: UUIDS.rp_resources, version: VERSION }],
    capabilities: ["pbr"],
    metadata: { authors: ["Chroniken des Weltenbaums"], product_type: "addon" },
  });
}

// ======================= Items =======================
const itemTextures: Record<string, { textures: string }> = {};
const icons: { id: string; recipe: string; extra?: Record<string, unknown> }[] = [];

function itemBase(id: string, name: string, comps: Record<string, unknown>, category = "equipment", group?: string): object {
  const key = `cdw_${id}`;
  itemTextures[key] = { textures: `textures/cdw/items/${id}` };
  L(`item.cdw.${id}`, name);
  return {
    format_version: ITEM_FV,
    "minecraft:item": {
      description: { identifier: `cdw:${id}`, menu_category: group ? { category, group } : { category } },
      components: { "minecraft:icon": { textures: { default: key } }, "minecraft:display_name": { value: `item.cdw.${id}` }, ...comps },
    },
  };
}

function items(): void {
  for (const w of ALL_WEAPONS) {
    const t = weaponTypeDef(w.type)!;
    const comps: Record<string, unknown> = {
      "minecraft:max_stack_size": 1,
      "minecraft:hand_equipped": true,
      "minecraft:durability": { max_durability: w.durability },
      "minecraft:damage": { value: Math.max(1, Math.round(w.dmg / 2)) },
      "minecraft:enchantable": { slot: t.enchantSlot, value: 10 + w.tier * 2 },
      "minecraft:tags": { tags: ["cdw:weapon", `cdw:${w.type}`] },
      "cdw:weapon": {},
    };
    if (w.unique) {
      comps["minecraft:glint"] = true;
      comps["minecraft:rarity"] = "epic";
    }
    if (t.useAnim === "bow") {
      comps["minecraft:use_modifiers"] = { use_duration: 3600, movement_modifier: 0.35 };
      comps["minecraft:use_animation"] = "bow";
    } else if (t.abilityCd > 0 || t.kind === "magic") {
      comps["minecraft:cooldown"] = { category: `cdw_w_${t.id}`, duration: Math.max(0.3, t.abilityCd) };
    }
    if (t.id === "armbrust") comps["minecraft:use_animation"] = "crossbow";
    write(path.join(BP, `items/cdw/weapons/${w.id}.json`), itemBase(w.id, w.name, comps, "equipment", groupFor(w.type)));
    icons.push({ id: w.id, recipe: `weapon:${w.type}:${w.palette}`, extra: { unique: !!w.unique } });
  }
  for (const s of ARMOR_SETS) {
    for (const sl of ARMOR_SLOTS) {
      const id = `${s.id}_${sl.slot}`;
      const comps = {
        "minecraft:max_stack_size": 1,
        "minecraft:wearable": { slot: sl.mcSlot, protection: Math.max(1, Math.round(s.protection * sl.protShare)) },
        "minecraft:durability": { max_durability: s.durability },
        "minecraft:enchantable": { slot: `armor_${sl.slot === "chest" ? "torso" : sl.slot}`, value: 12 },
        "minecraft:tags": { tags: ["cdw:armor", `minecraft:is_armor`] },
        "minecraft:repairable": { repair_items: [{ items: ["cdw:runenstaub"], repair_amount: "context.other->query.remaining_durability + 0.25 * context.other->query.max_durability" }] },
      };
      write(path.join(BP, `items/cdw/armor/${id}.json`), itemBase(id, s.pieceNames[sl.slot], comps, "equipment", `minecraft:itemGroup.name.${sl.slot === "head" ? "helmet" : sl.slot === "chest" ? "chestplate" : sl.slot === "legs" ? "leggings" : "boots"}`));
      icons.push({ id, recipe: `armor:${sl.slot}:${s.palette}` });
      attachable(id, sl.slot, s.id);
    }
  }
  for (const s of ALL_SIMPLE) {
    const comps: Record<string, unknown> = { "minecraft:max_stack_size": s.stack };
    if (s.glint) comps["minecraft:glint"] = true;
    if (s.rarity) comps["minecraft:rarity"] = s.rarity;
    if (s.offhand) comps["minecraft:allow_off_hand"] = true;
    let category = "items";
    if (s.category === "consumable" && s.use === "drink") {
      comps["minecraft:food"] = { can_always_eat: true, nutrition: 0, saturation_modifier: 0 };
      comps["minecraft:use_modifiers"] = { use_duration: 0.9, movement_modifier: 0.6 };
      comps["minecraft:use_animation"] = "drink";
      comps["cdw:consumable"] = {};
    } else if (s.category === "consumable" || s.category === "quest" || s.category === "misc") {
      comps["cdw:tool"] = {};
    }
    if (s.category === "rune") {
      const a = ABILITIES.find((x) => `rune_${x.id}` === s.id)!;
      comps["cdw:rune"] = { ability: a.id };
      comps["minecraft:cooldown"] = { category: `cdw_${a.id}`, duration: a.cooldown };
      comps["minecraft:hand_equipped"] = false;
      category = "equipment";
    }
    write(path.join(BP, `items/cdw/${s.category}/${s.id}.json`), itemBase(s.id, s.name, comps, category));
    icons.push({ id: s.id, recipe: s.icon, extra: { rarity: s.rarity } });
  }
  write(path.join(RP, "textures/item_texture.json"), { resource_pack_name: "cdw", texture_name: "atlas.items", texture_data: itemTextures });
}

function groupFor(t: string): string | undefined {
  if (["schwert", "zweihaender", "dolch", "speer"].includes(t)) return "minecraft:itemGroup.name.sword";
  if (["streitaxt", "kriegshammer"].includes(t)) return "minecraft:itemGroup.name.axe";
  if (t === "langbogen" || t === "armbrust") return "minecraft:itemGroup.name.bow";
  return undefined;
}

function attachable(id: string, slot: string, set: string): void {
  const layer = slot === "legs" ? 2 : 1;
  const geo = { head: "helmet", chest: "chestplate", legs: "leggings", feet: "boots" }[slot]!;
  const setup = { head: "variable.helmet_layer_visible = 0.0;", chest: "variable.chest_layer_visible = 0.0;", legs: "variable.leg_layer_visible = 0.0;", feet: "variable.boot_layer_visible = 0.0;" }[slot]!;
  const tex = { default: `textures/cdw/armor/${set}_${layer}`, enchanted: "textures/misc/enchanted_actor_glint" };
  write(path.join(RP, `attachables/cdw/${id}.json`), {
    format_version: "1.10.0",
    "minecraft:attachable": { description: { identifier: `cdw:${id}`, materials: { default: "armor", enchanted: "armor_enchanted" }, textures: tex, geometry: { default: `geometry.humanoid.armor.${geo}` }, scripts: { parent_setup: setup }, render_controllers: ["controller.render.armor"] } },
  });
  write(path.join(RP, `attachables/cdw/${id}.player.json`), {
    format_version: "1.10.0",
    "minecraft:attachable": {
      description: {
        identifier: `cdw:${id}.player`,
        item: { [`cdw:${id}`]: "query.owner_identifier == 'minecraft:player'" },
        materials: { default: "armor", enchanted: "armor_enchanted" },
        textures: tex,
        geometry: { default: `geometry.player.armor.${geo}` },
        scripts: { parent_setup: setup, animate: ["offset"] },
        animations: { offset: `animation.armor.${geo}.offset` },
        render_controllers: ["controller.render.armor"],
      },
    },
  });
}

// ======================= Blöcke =======================
const terrain: Record<string, { textures: string }> = {};
const blockSounds: Record<string, unknown> = {};

function block(id: string, name: string, comps: Record<string, unknown>, opts: { states?: Record<string, unknown[]>; perms?: { condition: string; components: Record<string, unknown> }[]; item?: boolean; sound?: string } = {}): void {
  L(`tile.cdw:${id}.name`, name);
  const desc: Record<string, unknown> = { identifier: `cdw:${id}`, menu_category: opts.item ? { category: "items" } : { category: "none", is_hidden_in_commands: false } };
  if (opts.states) desc.states = opts.states;
  const def: Record<string, unknown> = { description: desc, components: comps };
  if (opts.perms) def.permutations = opts.perms;
  write(path.join(BP, `blocks/cdw/${id}.json`), { format_version: BLOCK_FV, "minecraft:block": def });
  blockSounds[`cdw:${id}`] = { sound: opts.sound ?? "stone" };
}

function tex(key: string): string {
  terrain[`cdw_${key}`] = { textures: `textures/cdw/blocks/${key}` };
  return `cdw_${key}`;
}

function blocks(): void {
  const unbreakable = { "minecraft:destructible_by_mining": false, "minecraft:destructible_by_explosion": false };
  const waystoneComps = (breakable: boolean) => ({
    "minecraft:geometry": "geometry.cdw.wegstein",
    "minecraft:material_instances": { "*": { texture: tex("wegstein"), render_method: "alpha_test" } },
    "minecraft:collision_box": { origin: [-6, 0, -6], size: [12, 16, 12] },
    "minecraft:selection_box": { origin: [-7, 0, -7], size: [14, 16, 14] },
    "minecraft:light_emission": 10,
    "minecraft:light_dampening": 0,
    "minecraft:map_color": "#5fd3ff",
    ...(breakable ? { "minecraft:destructible_by_mining": { seconds_to_destroy: 3 }, "minecraft:destructible_by_explosion": false } : unbreakable),
  });
  block("wegstein", "Wegstein", { ...waystoneComps(false), "cdw:waystone": {} });
  block("wegstein_eigen", "Eigener Wegstein", { ...waystoneComps(true), "cdw:waystone_own": {} }, { item: true });
  block("kopfgeldbrett", "Kopfgeldbrett", {
    "minecraft:geometry": "geometry.cdw.kopfgeldbrett",
    "minecraft:material_instances": { "*": { texture: tex("kopfgeldbrett"), render_method: "alpha_test" } },
    "minecraft:collision_box": { origin: [-8, 0, -2], size: [16, 16, 4] },
    "minecraft:selection_box": { origin: [-8, 0, -2], size: [16, 16, 4] },
    "minecraft:light_dampening": 0,
    ...unbreakable,
    "cdw:board": {},
  }, { sound: "wood" });
  block("altar", "Altar des Uralten", {
    "minecraft:geometry": "geometry.cdw.altar",
    "minecraft:material_instances": { "*": { texture: tex("altar"), render_method: "alpha_test" } },
    "minecraft:light_emission": 7,
    "minecraft:light_dampening": 0,
    ...unbreakable,
    "cdw:altar": {},
  });
  block(
    "runenstein",
    "Runenstein",
    { "minecraft:geometry": "minecraft:geometry.full_block", "minecraft:material_instances": { "*": { texture: tex("runenstein"), render_method: "opaque" } }, ...unbreakable, "cdw:runestone": {}, "minecraft:light_emission": 2 },
    { states: { "cdw:lit": [false, true] }, perms: [{ condition: "q.block_state('cdw:lit') == true", components: { "minecraft:material_instances": { "*": { texture: tex("runenstein_lit"), render_method: "opaque" } }, "minecraft:light_emission": 13 } }] }
  );
  block(
    "wurzelherz",
    "Wurzelherz",
    {
      "minecraft:geometry": "geometry.cdw.wurzelherz",
      "minecraft:material_instances": { "*": { texture: tex("wurzelherz"), render_method: "alpha_test" } },
      "minecraft:light_emission": 6,
      "minecraft:light_dampening": 0,
      ...unbreakable,
      "cdw:heart": {},
    },
    { states: { "cdw:purified": [false, true] }, perms: [{ condition: "q.block_state('cdw:purified') == true", components: { "minecraft:material_instances": { "*": { texture: tex("wurzelherz_rein"), render_method: "alpha_test" } }, "minecraft:light_emission": 15 } }] }
  );
  block("barriere", "Magische Barriere", {
    "minecraft:geometry": "minecraft:geometry.full_block",
    "minecraft:material_instances": { "*": { texture: tex("barriere"), render_method: "blend", ambient_occlusion: false } },
    "minecraft:light_emission": 7,
    "minecraft:light_dampening": 0,
    ...unbreakable,
  });
  block("faeulnis", "Fäulnis", {
    "minecraft:geometry": "minecraft:geometry.full_block",
    "minecraft:material_instances": { "*": { texture: tex("faeulnis"), render_method: "opaque" } },
    "minecraft:destructible_by_mining": { seconds_to_destroy: 1 },
    "minecraft:loot": "loot_tables/cdw/empty.json",
    "cdw:blight": {},
  }, { sound: "slime" });
  write(path.join(RP, "textures/terrain_texture.json"), { resource_pack_name: "cdw", texture_name: "atlas.terrain", padding: 8, num_mip_levels: 4, texture_data: terrain });
  write(path.join(RP, "blocks.json"), { format_version: [1, 1, 0], ...blockSounds });
  for (const m of BLOCK_MODELS) write(path.join(RP, `models/blocks/cdw/${m.id}.geo.json`), blockGeometryJson(m));
}

// ======================= Entities =======================
const paint: Record<string, unknown> = {};
const skins: { skin: string; model: string; glow: boolean; kind: "mob" | "npc" | "proj" }[] = [];

function monsterTargets(): object {
  return {
    priority: 2,
    must_see: true,
    reselect_targets: true,
    within_radius: 24,
    must_see_forget_duration: 10,
    entity_types: [{ filters: { any_of: [{ test: "is_family", subject: "other", value: "player" }, { test: "is_family", subject: "other", value: "cdw_ally" }] }, max_dist: 24 }],
  };
}

function mobEntity(m: MobDef): object {
  const boss = !!m.boss;
  const comps: Record<string, unknown> = {
    "minecraft:type_family": { family: [...m.families, "mob"] },
    "minecraft:health": { value: m.health, max: m.health },
    "minecraft:attack": m.effectOnHit ? { damage: m.damage, effect_name: m.effectOnHit.id, effect_duration: m.effectOnHit.seconds } : { damage: m.damage },
    "minecraft:collision_box": { width: m.collision[0], height: m.collision[1] },
    "minecraft:movement": { value: m.speed },
    "minecraft:physics": {},
    "minecraft:pushable": { is_pushable: !boss, is_pushable_by_piston: true },
    "minecraft:nameable": {},
    "minecraft:follow_range": { value: boss ? 40 : 24, max: boss ? 48 : 32 },
    "minecraft:breathable": { total_supply: 15, suffocate_time: 0, breathes_air: true, breathes_water: true },
    "minecraft:jump.static": {},
    "minecraft:behavior.hurt_by_target": { priority: 1 },
    "minecraft:behavior.nearest_attackable_target": monsterTargets(),
    "minecraft:behavior.look_at_player": { priority: 8, look_distance: 8 },
    "minecraft:behavior.random_look_around": { priority: 9 },
    "minecraft:loot": { table: "loot_tables/cdw/empty.json" },
    "minecraft:experience_reward": { on_death: boss ? "query.last_hit_by_player ? 60 : 0" : "query.last_hit_by_player ? 5 : 0" },
    "minecraft:conditional_bandwidth_optimization": {},
  };
  if (m.scale) comps["minecraft:scale"] = { value: m.scale };
  if (m.fireImmune) comps["minecraft:fire_immune"] = true;
  const hover = m.arch === "hover_melee" || m.arch === "hover_ranged";
  if (hover) {
    Object.assign(comps, {
      "minecraft:navigation.hover": { can_path_over_water: true, can_sink: false, can_pass_doors: false, can_path_from_air: true, avoid_water: true, avoid_damage_blocks: true, avoid_sun: false },
      "minecraft:movement.hover": {},
      "minecraft:can_fly": {},
      "minecraft:flying_speed": { value: 0.18 },
      "minecraft:physics": { has_gravity: false },
      "minecraft:behavior.random_hover": { priority: 7, xz_dist: 8, y_dist: 3, y_offset: -1, interval: 1, hover_height: [1, 4] },
    });
  } else {
    Object.assign(comps, {
      "minecraft:navigation.walk": { can_path_over_water: true, avoid_damage_blocks: true, can_open_doors: false, can_walk: true, is_amphibious: true },
      "minecraft:movement.basic": {},
      "minecraft:behavior.float": { priority: 0 },
      "minecraft:behavior.random_stroll": { priority: 7, speed_multiplier: 0.8 },
    });
  }
  if (m.model === "spider") {
    comps["minecraft:can_climb"] = {};
    comps["minecraft:navigation.climb"] = { can_path_over_water: true, avoid_damage_blocks: true };
    delete comps["minecraft:navigation.walk"];
  }
  if (m.arch === "ranged" || m.arch === "hover_ranged" || m.arch === "boss_ranged") {
    comps["minecraft:shooter"] = { def: `cdw:${m.projectile}` };
    comps["minecraft:behavior.ranged_attack"] = { priority: 3, attack_interval_min: boss ? 1.2 : 2, attack_interval_max: boss ? 2.2 : 3.5, attack_radius: 16, speed_multiplier: 1.0 };
    if (m.arch === "boss_ranged") comps["minecraft:behavior.melee_attack"] = { priority: 4, speed_multiplier: 1.1, track_target: true };
  } else {
    comps["minecraft:behavior.melee_attack"] = { priority: 3, speed_multiplier: hover ? 1.4 : 1.2, track_target: true };
    if (m.arch === "leaper") comps["minecraft:behavior.leap_at_target"] = { priority: 2, yd: 0.4, must_be_on_ground: true };
  }
  if (boss) {
    comps["minecraft:boss"] = { hud_range: 48, should_darken_sky: false, name: m.boss!.title };
    comps["minecraft:knockback_resistance"] = { value: 0.85 };
    comps["minecraft:persistent"] = {};
    comps["minecraft:damage_sensor"] = { triggers: [{ cause: "fall", deals_damage: "no" }, { cause: "suffocation", deals_damage: "no" }, { cause: "drowning", deals_damage: "no" }] };
  } else {
    comps["minecraft:despawn"] = { despawn_from_distance: { min_distance: 40, max_distance: 96 } };
  }
  return {
    format_version: ENTITY_FV,
    "minecraft:entity": {
      description: { identifier: `cdw:${m.id}`, is_spawnable: true, is_summonable: true, is_experimental: false, properties: { "cdw:elite": { type: "bool", default: false, client_sync: true } } },
      components: comps,
    },
  };
}

function clientEntity(id: string, model: string, skin: string, kind: string, opts: { glow?: boolean; egg?: [string, string]; elite?: boolean; npc?: boolean; particle?: string; scaleExpr?: string } = {}): object {
  const anims: Record<string, string> = {};
  const animate: (string | Record<string, string>)[] = [];
  const has = (n: string) => !!animationsFor(MODELS.find((m) => m.id === model)!)[`animation.cdw.${model}.${n}`];
  if (has("idle")) {
    anims.idle = `animation.cdw.${model}.idle`;
    animate.push("idle");
  }
  if (has("walk") && kind !== "projectile") {
    anims.walk = `animation.cdw.${model}.walk`;
    animate.push({ walk: "q.modified_move_speed > 0.02" });
  }
  if (has("attack")) {
    anims.attack = `animation.cdw.${model}.attack`;
    animate.push({ attack: "v.attack_time > 0.0" });
  }
  const desc: Record<string, unknown> = {
    identifier: id,
    materials: { default: opts.glow ? "entity_emissive_alpha" : "entity_alphatest" },
    textures: opts.npc ? Object.fromEntries(NPCS.map((n) => [n.id, `textures/cdw/entity/${n.skin}`])) : { default: `textures/cdw/entity/${skin}` },
    geometry: { default: `geometry.cdw.${model}` },
    animations: anims,
    scripts: { animate, ...(opts.scaleExpr ? { scale: opts.scaleExpr } : {}) },
    render_controllers: [opts.npc ? "controller.render.cdw.npc" : opts.elite ? "controller.render.cdw.mob" : "controller.render.cdw.simple"],
  };
  if (opts.egg) desc.spawn_egg = { base_color: opts.egg[0], overlay_color: opts.egg[1] };
  if (opts.particle) {
    desc.particle_effects = { trail: `cdw:trail_${opts.particle}` };
    anims.trail = "animation.cdw.proj.trail";
    animate.push("trail");
  }
  return { format_version: "1.10.0", "minecraft:client_entity": { description: desc } };
}

const EGG: Record<string, [string, string]> = {
  moss: ["#4f7f2e", "#b8e070"], thornwolf: ["#4b3a2a", "#7fbf3f"], treant_young: ["#5a3f26", "#7dbb4a"], bog: ["#3d4a2a", "#8a7a45"], toad: ["#5a6b2f", "#c2b26a"], sighghost: ["#2d3b45", "#9fd8c8"],
  scorpion: ["#b5651d", "#3a1f0a"], mummy: ["#c9b88a", "#5a4630"], emberwisp: ["#ff7a1a", "#ffe066"], icekobold: ["#6fa8c8", "#e0f4ff"], frosttroll: ["#7a9bb0", "#dff2ff"], frostcrow: ["#2f3a4a", "#9fd0ff"],
  crystalspider: ["#2a2340", "#c08aff"], shadowcrawler: ["#141018", "#a04aff"], rootgolem: ["#555a5f", "#6b4a2a"], blightwraith: ["#2a1f33", "#b04cff"], goblin: ["#5f7f2a", "#8a5a2a"], goblin_archer: ["#5f7f2a", "#4a6a8a"],
};

function entities(): void {
  for (const m of MOBS) {
    write(path.join(BP, `entities/cdw/${m.id}.json`), mobEntity(m));
    write(path.join(RP, `entity/cdw/${m.id}.entity.json`), clientEntity(`cdw:${m.id}`, m.model, m.skin, MODELS.find((x) => x.id === m.model)!.kind, { glow: m.glow, egg: m.boss ? ["#300818", "#ffcc33"] : EGG[m.skin] ?? ["#444444", "#aaaaaa"], elite: !m.boss, scaleExpr: m.boss ? undefined : "q.property('cdw:elite') ? 1.2 : 1.0" }));
    L(`entity.cdw:${m.id}.name`, m.name);
    L(`item.spawn_egg.entity.cdw:${m.id}.name`, `${m.name} herbeirufen`);
    skins.push({ skin: m.skin, model: m.model, glow: !!m.glow, kind: "mob" });
    if (m.spawn) spawnRule(m);
  }
  // NPC
  write(path.join(BP, "entities/cdw/npc.json"), {
    format_version: ENTITY_FV,
    "minecraft:entity": {
      description: { identifier: "cdw:npc", is_spawnable: true, is_summonable: true, is_experimental: false, properties: { "cdw:variant": { type: "int", range: [0, 7], default: 0, client_sync: true } } },
      components: {
        "minecraft:type_family": { family: ["cdw_npc", "npc", "inanimate"] },
        "minecraft:health": { value: 100, max: 100 },
        "minecraft:damage_sensor": { triggers: [{ cause: "all", deals_damage: "no" }] },
        "minecraft:collision_box": { width: 0.6, height: 1.9 },
        "minecraft:physics": {},
        "minecraft:pushable": { is_pushable: false, is_pushable_by_piston: false },
        "minecraft:persistent": {},
        "minecraft:nameable": { always_show: true, allow_name_tag_renaming: false },
        "minecraft:movement": { value: 0 },
        "minecraft:knockback_resistance": { value: 1 },
        "minecraft:fire_immune": true,
        "minecraft:behavior.look_at_player": { priority: 1, look_distance: 8, probability: 0.9 },
        "minecraft:behavior.random_look_around": { priority: 2 },
        "minecraft:interact": { interactions: [{ on_interact: { filters: { test: "is_family", subject: "other", value: "player" }, event: "cdw:talk" }, interact_text: "action.interact.cdw_talk" }] },
      },
      events: { "cdw:talk": {} },
    },
  });
  write(path.join(RP, "entity/cdw/npc.entity.json"), clientEntity("cdw:npc", "npc", "npc", "npc", { npc: true }));
  L("entity.cdw:npc.name", "Bewohner des Hains");
  L("action.interact.cdw_talk", "Sprechen");
  for (const n of NPCS) skins.push({ skin: n.skin, model: "npc", glow: false, kind: "npc" });
  // Geisterwolf
  write(path.join(BP, "entities/cdw/geisterwolf.json"), {
    format_version: ENTITY_FV,
    "minecraft:entity": {
      description: { identifier: "cdw:geisterwolf", is_spawnable: false, is_summonable: true, is_experimental: false },
      components: {
        "minecraft:type_family": { family: ["cdw_ally", "mob"] },
        "minecraft:health": { value: 40, max: 40 },
        "minecraft:attack": { damage: 6 },
        "minecraft:collision_box": { width: 0.8, height: 0.9 },
        "minecraft:movement": { value: 0.38 },
        "minecraft:physics": {},
        "minecraft:pushable": { is_pushable: true, is_pushable_by_piston: true },
        "minecraft:navigation.walk": { can_path_over_water: true, avoid_damage_blocks: true },
        "minecraft:movement.basic": {},
        "minecraft:jump.static": {},
        "minecraft:fire_immune": true,
        "minecraft:damage_sensor": { triggers: [{ on_damage: { filters: { any_of: [{ test: "is_family", subject: "other", value: "player" }, { test: "is_family", subject: "other", value: "cdw_ally" }] } }, deals_damage: "no" }, { cause: "fall", deals_damage: "no" }] },
        "minecraft:behavior.float": { priority: 0 },
        "minecraft:behavior.melee_attack": { priority: 2, speed_multiplier: 1.3, track_target: true },
        "minecraft:behavior.nearest_attackable_target": { priority: 1, must_see: false, reselect_targets: true, within_radius: 16, entity_types: [{ filters: { test: "is_family", subject: "other", value: "monster" }, max_dist: 16 }] },
        "minecraft:behavior.random_stroll": { priority: 6 },
        "minecraft:loot": { table: "loot_tables/cdw/empty.json" },
      },
    },
  });
  write(path.join(RP, "entity/cdw/geisterwolf.entity.json"), clientEntity("cdw:geisterwolf", "quad_wolf", "spiritwolf", "quad", { glow: true }));
  L("entity.cdw:geisterwolf.name", "Geisterwolf");
  skins.push({ skin: "spiritwolf", model: "quad_wolf", glow: true, kind: "mob" });
  // Projektile
  for (const p of PROJECTILES) {
    write(path.join(BP, `entities/cdw/proj_${p.id}.json`), {
      format_version: ENTITY_FV,
      "minecraft:entity": {
        description: { identifier: `cdw:${p.id}`, is_spawnable: false, is_summonable: true, is_experimental: false, runtime_identifier: "minecraft:snowball" },
        components: {
          "minecraft:collision_box": { width: 0.3 * (p.scale ?? 1), height: 0.3 * (p.scale ?? 1) },
          "minecraft:projectile": {
            on_hit: { impact_damage: { damage: p.impactDamage, knockback: true, catch_fire: !!p.fire }, remove_on_hit: {} },
            power: p.power,
            gravity: p.gravity,
            inertia: 1,
            liquid_inertia: 0.9,
            uncertainty_base: 0,
            uncertainty_multiplier: 0,
            anchor: 1,
            offset: [0, -0.1, 0],
            hit_sound: p.fire ? "fire.ignite" : "random.glass",
          },
          "minecraft:physics": {},
          "minecraft:pushable": { is_pushable: false, is_pushable_by_piston: true },
          ...(p.scale ? { "minecraft:scale": { value: p.scale } } : {}),
          "minecraft:despawn": { despawn_from_distance: { min_distance: 64, max_distance: 128 } },
        },
      },
    });
    write(path.join(RP, `entity/cdw/proj_${p.id}.entity.json`), clientEntity(`cdw:${p.id}`, p.model, p.skin, "projectile", { glow: true, particle: p.particle !== "none" ? p.particle : undefined }));
    L(`entity.cdw:${p.id}.name`, "Geschoss");
    skins.push({ skin: p.skin, model: p.model, glow: true, kind: "proj" });
  }
  // Render-Controller
  write(path.join(RP, "render_controllers/cdw.render_controllers.json"), {
    format_version: "1.8.0",
    render_controllers: {
      "controller.render.cdw.simple": { geometry: "Geometry.default", materials: [{ "*": "Material.default" }], textures: ["Texture.default"] },
      "controller.render.cdw.mob": {
        geometry: "Geometry.default",
        materials: [{ "*": "Material.default" }],
        textures: ["Texture.default"],
        overlay_color: { r: 1.0, g: 0.75, b: 0.15, a: "q.property('cdw:elite') ? 0.22 : 0.0" },
      },
      "controller.render.cdw.npc": {
        arrays: { textures: { "Array.skins": NPCS.sort((a, b) => a.variant - b.variant).map((n) => `Texture.${n.id}`) } },
        geometry: "Geometry.default",
        materials: [{ "*": "Material.default" }],
        textures: ["Array.skins[q.property('cdw:variant')]"],
      },
    },
  });
  // Geometrien & Animationen
  for (const m of MODELS) {
    write(path.join(RP, `models/entity/cdw/${m.id}.geo.json`), geometryJson(m));
    const anims = animationsFor(m);
    if (Object.keys(anims).length) write(path.join(RP, `animations/cdw/${m.id}.animation.json`), { format_version: "1.8.0", animations: anims });
    paint[m.id] = paintInfo(m.texW, m.texH, m.bones.flatMap((b) => b.cubes));
  }
  write(path.join(RP, "animations/cdw/proj.animation.json"), { format_version: "1.8.0", animations: { "animation.cdw.proj.trail": { loop: "hold_on_last_frame", animation_length: 0.05, particle_effects: { "0.0": { effect: "trail" } } } } });
  for (const m of BLOCK_MODELS) paint[`block_${m.id}`] = paintInfo(m.texW, m.texH, m.cubes);
}

function spawnRule(m: MobDef): void {
  const s = m.spawn!;
  const cond: Record<string, unknown> = {
    "minecraft:difficulty_filter": { min: "easy", max: "hard" },
    "minecraft:weight": { default: s.weight },
    "minecraft:herd": { min_size: s.herd[0], max_size: s.herd[1] },
    "minecraft:biome_filter": { any_of: s.biomes.map((b) => ({ test: "has_biome_tag", operator: "==", value: b })) },
  };
  if (s.underground) {
    cond["minecraft:spawns_underground"] = {};
    cond["minecraft:height_filter"] = { min: -60, max: 30 };
    cond["minecraft:brightness_filter"] = { min: 0, max: 7, adjust_for_weather: false };
    cond["minecraft:density_limit"] = { underground: s.density };
  } else {
    cond["minecraft:spawns_on_surface"] = {};
    cond["minecraft:density_limit"] = { surface: s.density };
    if (s.nightOnly) cond["minecraft:brightness_filter"] = { min: 0, max: 7, adjust_for_weather: true };
  }
  write(path.join(BP, `spawn_rules/cdw/${m.id}.json`), { format_version: "1.8.0", "minecraft:spawn_rules": { description: { identifier: `cdw:${m.id}`, population_control: "monster" }, conditions: [cond] } });
}

// ======================= Partikel =======================
function particles(): void {
  const P = (id: string, cell: number, color: [number, number, number], opts: { trail?: boolean; size?: number; life?: number; rise?: number } = {}) => {
    const size = opts.size ?? 0.12;
    const comps: Record<string, unknown> = opts.trail
      ? {
          "minecraft:emitter_rate_steady": { spawn_rate: 40, max_particles: 80 },
          "minecraft:emitter_lifetime_looping": { active_time: 1 },
          "minecraft:emitter_shape_sphere": { radius: 0.12, direction: "outwards" },
          "minecraft:emitter_local_space": { position: false, rotation: false },
        }
      : {
          "minecraft:emitter_rate_instant": { num_particles: 1 },
          "minecraft:emitter_lifetime_once": { active_time: 0 },
          "minecraft:emitter_shape_point": {},
        };
    Object.assign(comps, {
      "minecraft:particle_lifetime_expression": { max_lifetime: opts.life ?? 0.6 },
      "minecraft:particle_initial_speed": opts.trail ? 0.2 : 0,
      "minecraft:particle_motion_dynamic": { linear_acceleration: [0, opts.rise ?? 0.3, 0], linear_drag_coefficient: 1.5 },
      "minecraft:particle_appearance_billboard": {
        size: [`${size} * (1 - v.particle_age / v.particle_lifetime) + 0.02`, `${size} * (1 - v.particle_age / v.particle_lifetime) + 0.02`],
        facing_camera_mode: "rotate_xyz",
        uv: { texture_width: 64, texture_height: 64, uv: [(cell % 8) * 8, Math.floor(cell / 8) * 8], uv_size: [8, 8] },
      },
      "minecraft:particle_appearance_tinting": { color: [...color, 1] },
    });
    write(path.join(RP, `particles/cdw/${id}.json`), {
      format_version: "1.10.0",
      particle_effect: { description: { identifier: `cdw:${id}`, basic_render_parameters: { material: "particles_add", texture: "textures/cdw/particle/particles" } }, components: comps },
    });
  };
  P("wisp", 0, [0.55, 1, 0.6], { size: 0.14, life: 0.55, rise: 0.25 });
  P("trail_arcane", 1, [0.75, 0.5, 1], { trail: true, life: 0.4 });
  P("trail_leaf", 2, [0.5, 0.9, 0.35], { trail: true, life: 0.6, rise: -0.4 });
  P("trail_fire", 3, [1, 0.55, 0.15], { trail: true, life: 0.45, size: 0.18 });
  P("trail_frost", 4, [0.6, 0.85, 1], { trail: true, life: 0.5 });
  P("trail_poison", 5, [0.5, 0.95, 0.2], { trail: true, life: 0.5 });
  P("trail_blight", 6, [0.6, 0.25, 0.85], { trail: true, life: 0.6, size: 0.16 });
}

// ======================= Loot, Rezepte =======================
function lootAndRecipes(): void {
  write(path.join(BP, "loot_tables/cdw/empty.json"), { pools: [] });
  const shapeless = (id: string, ing: string[], out: string, n = 1) =>
    write(path.join(BP, `recipes/cdw/${id}.json`), {
      format_version: "1.20.10",
      "minecraft:recipe_shapeless": { description: { identifier: `cdw:${id}` }, tags: ["crafting_table"], ingredients: ing.map((i) => ({ item: i })), result: { item: out, count: n }, unlock: { context: "AlwaysUnlocked" } },
    });
  shapeless("r_heiltrank_klein", ["minecraft:glass_bottle", "cdw:moosherz", "minecraft:sweet_berries"], "cdw:heiltrank_klein");
  shapeless("r_heiltrank", ["cdw:heiltrank_klein", "cdw:moosherz", "minecraft:glistering_melon_slice"], "cdw:heiltrank");
  shapeless("r_heiltrank_gross", ["cdw:heiltrank", "cdw:uraltes_harz"], "cdw:heiltrank_gross");
  shapeless("r_manatrank_klein", ["minecraft:glass_bottle", "cdw:faeulnisessenz", "minecraft:glow_berries"], "cdw:manatrank_klein");
  shapeless("r_manatrank", ["cdw:manatrank_klein", "cdw:schattenkristall"], "cdw:manatrank");
  shapeless("r_manatrank_gross", ["cdw:manatrank", "cdw:uraltes_harz"], "cdw:manatrank_gross");
  shapeless("r_elixier_staerke", ["minecraft:glass_bottle", "cdw:dornenfang", "minecraft:blaze_powder"], "cdw:elixier_staerke");
  shapeless("r_elixier_zaehigkeit", ["minecraft:glass_bottle", "cdw:moorschleim", "minecraft:iron_ingot"], "cdw:elixier_zaehigkeit");
  shapeless("r_elixier_eile", ["minecraft:glass_bottle", "cdw:skorpionstachel", "minecraft:sugar"], "cdw:elixier_eile");
  shapeless("r_elixier_weisheit", ["minecraft:glass_bottle", "cdw:frostsplitter", "minecraft:lapis_lazuli"], "cdw:elixier_weisheit");
  shapeless("r_rueckkehr", ["minecraft:paper", "cdw:moosherz", "cdw:faeulnisessenz"], "cdw:rueckkehrschriftrolle", 2);
  shapeless("r_buch", ["minecraft:book", "cdw:moosherz"], "cdw:buch");
  write(path.join(BP, "recipes/cdw/r_wegstein.json"), {
    format_version: "1.20.10",
    "minecraft:recipe_shaped": {
      description: { identifier: "cdw:r_wegstein" },
      tags: ["crafting_table"],
      pattern: ["SRS", "RLR", "SRS"],
      key: { S: { item: "minecraft:stone_bricks" }, R: { item: "cdw:runenstaub" }, L: { item: "minecraft:lodestone" } },
      result: { item: "cdw:wegstein_eigen" },
      unlock: { context: "AlwaysUnlocked" },
    },
  });
}

// ======================= Sprache =======================
function languages(): void {
  L("pack.name", "Chroniken des Weltenbaums");
  L("pack.description", "RPG-Abenteuer für Minecraft Bedrock");
  const text = lang.sort().join("\n") + "\n";
  for (const l of ["de_DE", "en_US"]) {
    write(path.join(RP, `texts/${l}.lang`), text);
    write(path.join(BP, `texts/${l}.lang`), "pack.name=Chroniken des Weltenbaums\npack.description=RPG-Abenteuer für Minecraft Bedrock\n");
  }
  write(path.join(RP, "texts/languages.json"), ["de_DE", "en_US"]);
  write(path.join(BP, "texts/languages.json"), ["de_DE", "en_US"]);
}

// ======================= Ausführen =======================
function main(): void {
  for (const d of ["items/cdw", "blocks/cdw", "entities/cdw", "spawn_rules/cdw", "recipes/cdw", "loot_tables/cdw"]) clean(path.join(BP, d));
  for (const d of ["entity/cdw", "attachables/cdw", "models/entity/cdw", "models/blocks/cdw", "animations/cdw", "particles/cdw", "render_controllers"]) clean(path.join(RP, d));
  manifests();
  items();
  blocks();
  entities();
  particles();
  lootAndRecipes();
  languages();
  write(path.join(BUILD, "paint.json"), { models: paint, skins, icons, weaponTypes: WEAPON_TYPES.map((w) => w.id), armorSets: ARMOR_SETS.map((s) => ({ id: s.id, palette: s.palette })), talismans: TALISMANS.length, consumables: CONSUMABLES.length, materials: MATERIALS.length, quest: QUEST_ITEMS.length, runes: RUNES.map((r) => r.id), abilities: ABILITIES.map((a) => ({ id: a.id, glyph: a.glyph, color: a.color, ult: !!a.ult })), npcs: NPCS });
  console.log(`Generiert: ${ALL_WEAPONS.length} Waffen, ${ARMOR_SETS.length * 4} Rüstungsteile, ${ALL_SIMPLE.length} Items, ${MOBS.length} Monster, ${PROJECTILES.length} Projektile, ${MODELS.length} Modelle.`);
}

main();
