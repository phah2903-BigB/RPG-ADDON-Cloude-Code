// Statische Prüfung: Block-/Item-IDs, Texturen, Referenzen zwischen Dateien.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vd = await import(path.join(root, "node_modules/@minecraft/vanilla-data/lib/index.js"));
const blocks = new Set(Object.values(vd.MinecraftBlockTypes));
const items = new Set(Object.values(vd.MinecraftItemTypes));
const entities = new Set(Object.values(vd.MinecraftEntityTypes));
let errors = 0;
const COMPONENTS = /^minecraft:(health|inventory|durability|projectile|cardinal_direction|recipe_shaped|recipe_shapeless|equippable|type_family|item|block|entity|geometry|attachable|client_entity|spawn_rules|vertical_half|corner)$/;
const err = (m) => { errors++; console.log("FEHLER:", m); };
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];

// 1) Block-IDs in Welt-Code
for (const f of walk(path.join(root, "src/world"))) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/"(minecraft:[a-z0-9_]+)"/g)) {
    const id = m[1];
    if (id === "minecraft:overworld" || id === "minecraft:nether" || id === "minecraft:the_end") continue;
    if (/particle|emitter|flame|dust|spell|explosion|portal|totem|villager|crit|smoke|soul_particle|heart_particle|snowflake|knockback/.test(id)) continue;
    if (COMPONENTS.test(id)) continue;
    if (!blocks.has(id) && !entities.has(id) && !items.has(id)) err(`${path.relative(root, f)}: unbekannter Block ${id}`);
  }
}
// 2) Item-IDs in Daten & Rezepten
const known = new Set();
for (const f of walk(path.join(root, "packs/BP/items"))) known.add(JSON.parse(fs.readFileSync(f, "utf8"))["minecraft:item"].description.identifier);
for (const f of walk(path.join(root, "packs/BP/blocks"))) known.add(JSON.parse(fs.readFileSync(f, "utf8"))["minecraft:block"].description.identifier);
for (const f of [...walk(path.join(root, "src")), ...walk(path.join(root, "packs/BP/recipes"))]) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/"((?:cdw|minecraft):[a-z0-9_]+)"/g)) {
    const id = m[1];
    if (COMPONENTS.test(id) || /^cdw:r_/.test(id) || id === "cdw:rune_") continue;
    if (id.startsWith("cdw:")) {
      const ok = known.has(id) || /cdw:(npc|geisterwolf|elite|variant|lit|purified|l|e|hm|dm|d|c|a|o|g|gold|pd|wd|weapon|rune|tool|consumable|waystone|waystone_own|board|runestone|heart|altar|blight|buch|test|rpghud|selftest)$/.test(id) || /cdw:(wisp|trail_)/.test(id);
      const ent = fs.existsSync(path.join(root, `packs/BP/entities/cdw/${id.slice(4)}.json`)) || fs.existsSync(path.join(root, `packs/BP/entities/cdw/proj_${id.slice(4)}.json`));
      if (!ok && !ent) err(`${path.relative(root, f)}: unbekannte ID ${id}`);
    } else if (f.includes("recipes") || f.includes("data/quests") || f.includes("ui/shop") || f.includes("data/mobs")) {
      if (!items.has(id) && !blocks.has(id) && !entities.has(id)) err(`${path.relative(root, f)}: unbekanntes Vanilla-Item ${id}`);
    }
  }
}
// 3) Texturen
const tex = (p) => ["png", "tga"].some((e) => fs.existsSync(path.join(root, "packs/RP", `${p}.${e}`)));
const it = JSON.parse(fs.readFileSync(path.join(root, "packs/RP/textures/item_texture.json"), "utf8"));
for (const [k, v] of Object.entries(it.texture_data)) if (!tex(v.textures)) err(`Item-Textur fehlt: ${k} → ${v.textures}`);
const tt = JSON.parse(fs.readFileSync(path.join(root, "packs/RP/textures/terrain_texture.json"), "utf8"));
for (const [k, v] of Object.entries(tt.texture_data)) if (!tex(v.textures)) err(`Block-Textur fehlt: ${k} → ${v.textures}`);
for (const f of walk(path.join(root, "packs/RP/entity"))) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"))["minecraft:client_entity"].description;
  for (const t of Object.values(d.textures)) if (!tex(t)) err(`Entity-Textur fehlt: ${d.identifier} → ${t}`);
  for (const g of Object.values(d.geometry)) if (!fs.existsSync(path.join(root, "packs/RP/models/entity/cdw", g.replace("geometry.cdw.", "") + ".geo.json"))) err(`Geometrie fehlt: ${g}`);
}
for (const f of walk(path.join(root, "packs/RP/attachables"))) {
  const d = JSON.parse(fs.readFileSync(f, "utf8"))["minecraft:attachable"].description;
  if (!tex(d.textures.default)) err(`Rüstungstextur fehlt: ${d.textures.default}`);
}
// 4) UI-Icons, die im Code referenziert werden
for (const f of walk(path.join(root, "src"))) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/"(textures\/cdw\/[a-z0-9_\/]+)"/g)) if (!tex(m[1])) err(`${path.relative(root, f)}: Icon fehlt ${m[1]}`);
}
console.log(errors ? `${errors} Fehler gefunden.` : "Validierung OK.");
process.exit(errors ? 1 : 0);
