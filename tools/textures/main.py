"""Erzeugt alle Texturen des Resource-Packs aus build/paint.json."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402
from lib import save, textured_fill, outline, mers_from  # noqa: E402
import icons  # noqa: E402
import paint  # noqa: E402

ROOT = os.getcwd()
RP = os.path.join(ROOT, "packs", "RP")
BP = os.path.join(ROOT, "packs", "BP")
T = os.path.join(RP, "textures", "cdw")
data = json.load(open(os.path.join(ROOT, "build", "paint.json")))


def texture_set(folder, name, mers_img):
    save(mers_img, os.path.join(folder, f"{name}_mers.png"))
    with open(os.path.join(folder, f"{name}.texture_set.json"), "w") as f:
        json.dump({"format_version": "1.21.30", "minecraft:texture_set": {"color": name, "metalness_emissive_roughness_subsurface": f"{name}_mers"}}, f, indent=2)


def item_icons():
    out = os.path.join(T, "items")
    abil = {f"rune_{a['id']}": a for a in data["abilities"]}
    for i, ic in enumerate(data["icons"]):
        rid = ic["recipe"]
        seed = 1000 + i * 7
        if rid.startswith("weapon:"):
            _, kind, pal = rid.split(":")
            img, mers = icons.weapon(kind, pal, seed)
        elif rid.startswith("armor:"):
            _, slot, pal = rid.split(":")
            img, mers = icons.armor(slot, pal, seed)
        elif rid.startswith("rune:"):
            a = abil[ic["id"]]
            img, mers = icons.rune(a["glyph"], a["color"], a["ult"], seed)
        else:
            img, mers = icons.simple(rid, seed)
        save(img, os.path.join(out, f"{ic['id']}.png"))
        if mers is not None:
            texture_set(out, ic["id"], mers)
    print(f"  Item-Icons: {len(data['icons'])}")


def entity_skins():
    out = os.path.join(T, "entity")
    done = set()
    for i, sk in enumerate(data["skins"]):
        name = sk["skin"]
        if name in done:
            continue
        done.add(name)
        if sk["kind"] == "npc":
            img = paint.paint_npc(name, 11 + i)
            save(img, os.path.join(out, f"{name}.png"))
            continue
        info = data["models"][sk["model"]]
        img, em = paint.paint_model(info, name, 31 + i, glow_alpha=sk["glow"])
        save(img, os.path.join(out, f"{name}.png"))
        if sk["glow"]:
            texture_set(out, name, mers_from(img, em, rough=180))
    print(f"  Kreatur-Skins: {len(done)}")


def armor_textures():
    out = os.path.join(T, "armor")
    for s in data["armorSets"]:
        for layer in (1, 2):
            save(paint.paint_armor(s["palette"], layer), os.path.join(out, f"{s['id']}_{layer}.png"))
    print(f"  Rüstungstexturen: {len(data['armorSets']) * 2}")


def block_textures():
    out = os.path.join(T, "blocks")
    paint.SKINS["wegstein"] = {"stone_rune": "#7a8088", "stone_base": "#5a5e66"}
    paint.SKINS["kopfgeldbrett"] = {}
    paint.SKINS["altar"] = {"stone_rune": "#4a3a5a"}
    paint.SKINS["wurzelherz"] = {"heart": "#4a1a5a", "root": "#2a1a10"}
    paint.SKINS["wurzelherz_rein"] = {"heart": "#ffd860", "root": "#6a4a2a"}
    for name, model in [("wegstein", "wegstein"), ("kopfgeldbrett", "kopfgeldbrett"), ("altar", "altar"), ("wurzelherz", "wurzelherz"), ("wurzelherz_rein", "wurzelherz")]:
        img, em = paint.paint_model(data["models"][f"block_{model}"], name, 77, glow_alpha=False)
        if name == "wegstein":
            d = ImageDraw.Draw(img)
            # leuchtende Rune auf dem Pfeiler (Blau)
            em = em.copy()
        if name == "kopfgeldbrett":
            d = ImageDraw.Draw(img)
            for (x, y) in [(20, 30), (60, 34), (100, 28)]:
                d.rectangle([x, y, x + 26, y + 30], fill=(236, 226, 196, 255), outline=(90, 60, 30, 255))
                d.line([(x + 4, y + 8), (x + 22, y + 8)], fill=(80, 50, 30, 255), width=2)
                d.line([(x + 4, y + 16), (x + 18, y + 16)], fill=(80, 50, 30, 255), width=2)
        save(img, os.path.join(out, f"{name}.png"))
        if name in ("wegstein", "wurzelherz", "wurzelherz_rein", "altar"):
            texture_set(out, name, mers_from(img, em if name != "wegstein" else img.convert("L").point(lambda v: 0)))
    for kind in ("runenstein", "runenstein_lit", "barriere", "faeulnis"):
        img, em = paint.block_tex(kind)
        save(img, os.path.join(out, f"{kind}.png"))
        if kind in ("runenstein_lit", "barriere"):
            texture_set(out, kind, mers_from(img, em))
    print("  Blocktexturen: 9")


def glyph_icon(glyph, colors, size=64):
    S = 256
    mask = Image.new("L", (S, S), 0)
    icons.draw_glyph(ImageDraw.Draw(mask), glyph, 128, 128, 1.15, 18)
    img = textured_fill((S, S), mask, colors, "metal", 5)
    img = img.resize((size, size), Image.LANCZOS)
    a = np.asarray(img).copy()
    a[..., 3] = np.where(a[..., 3] > 90, 255, 0)
    return outline(Image.fromarray(a, "RGBA"))


def ui_icons():
    out = os.path.join(T, "ui")
    C = icons.COLORS
    g = {
        "back": ("back", C["gray"]), "check": ("check", C["green"]), "next": ("next", C["gold"]), "talents": ("tree", C["green"]), "achievements": ("star", C["gold"]),
        "settings": ("gear", C["gray"]), "admin": ("crown", C["red"]), "class": ("star", C["white"]), "quest_new": ("star", C["yellow"]), "quest_active": ("eye", C["gold"]),
        "quest_main": ("star", C["orange"]), "respec": ("spin", C["cyan"]), "heroic": ("crown", C["gold"]), "hint": ("eye", C["green"]), "buy": ("coin", C["gold"]),
        "upgrade": ("hammer", C["orange"]), "repair": ("plus", C["green"]), "prestige": ("star", C["purple"]), "waystone": ("shard", C["cyan"]), "abilities": ("spin", C["purple"]),
        "attr_str": ("hammer", C["red"]), "attr_dex": ("arrow", C["green"]), "attr_int": ("orb", C["blue"]), "attr_vit": ("shield", C["red"]), "attr_wis": ("flower", C["blue"]),
        "talent_0": ("tree", C["orange"]), "talent_1": ("bark", C["green"]),
    }
    for name, (glyph, cols) in g.items():
        save(glyph_icon(glyph, cols), os.path.join(out, f"{name}.png"))
    items_dir = os.path.join(T, "items")
    reuse = {
        "quests": "rueckkehrschriftrolle", "character": "eichenwacht_head", "equipment": "eichenwacht_chest", "recipes": "heiltrank", "bounty": "verwelkte_seite",
        "chronicle": "buch", "sell": "muenzbeutel", "forge": "kriegshammer_stahl", "salvage": "runenstaub", "altar": "beschwoerungsstein",
        "class_krieger": "schwert_stahl", "class_waldlaeufer": "langbogen_stahl", "class_magier": "zauberstab_mondsilber", "class_druide": "naturstab_bronze",
    }
    for name, src in reuse.items():
        Image.open(os.path.join(items_dir, f"{src}.png")).save(os.path.join(out, f"{name}.png"))
    # Porträts aus NPC-Skins
    for n in data["npcs"]:
        sk = Image.open(os.path.join(T, "entity", f"{n['skin']}.png"))
        face = sk.crop((8 * 4, 8 * 4, 16 * 4, 16 * 4)).resize((64, 64), Image.NEAREST)
        hat = sk.crop((40 * 4, 8 * 4, 48 * 4, 16 * 4)).resize((64, 64), Image.NEAREST)
        face.alpha_composite(hat)
        save(face, os.path.join(out, f"portrait_{n['id']}.png"))
    print(f"  UI-Icons: {len(g) + len(reuse) + len(data['npcs'])}")


def particles():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 0 weicher Punkt
    for r in range(4, 0, -1):
        d.ellipse([4 - r, 4 - r, 4 + r - 1, 4 + r - 1], fill=(255, 255, 255, int(255 * (1 - r / 5))))
    # 1 Stern
    d.line([(12, 4), (12 + 3, 4)], fill=(255, 255, 255, 255))
    d.line([(8 + 4, 1), (8 + 4, 7)], fill=(255, 255, 255, 255))
    d.line([(9, 4), (15, 4)], fill=(255, 255, 255, 255))
    # 2 Blatt
    d.ellipse([17, 1, 23, 7], fill=(255, 255, 255, 255))
    # 3 Flamme
    d.polygon([(28, 7), (25, 4), (28, 0), (31, 4)], fill=(255, 255, 255, 255))
    # 4 Schneeflocke
    d.line([(32, 4), (39, 4)], fill=(255, 255, 255, 255))
    d.line([(35, 1), (35, 7)], fill=(255, 255, 255, 255))
    d.line([(33, 2), (37, 6)], fill=(255, 255, 255, 255))
    # 5 Blase
    d.ellipse([41, 1, 47, 7], outline=(255, 255, 255, 255))
    # 6 Schwade
    d.ellipse([49, 2, 55, 6], fill=(255, 255, 255, 220))
    # 7 Funke
    d.point([(60, 4), (59, 4), (61, 4), (60, 3), (60, 5)], fill=(255, 255, 255, 255))
    save(img, os.path.join(T, "particle", "particles.png"))


def pack_icons():
    S = 256
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([8, 8, 248, 248], fill=(22, 44, 26, 255))
    ring = Image.new("L", (S, S), 0)
    ImageDraw.Draw(ring).ellipse([8, 8, 248, 248], outline=255, width=14)
    img.alpha_composite(textured_fill((S, S), ring, ["#6a4a10", "#d8a83a", "#ffe89a"], "metal", 3))
    tree = Image.new("L", (S, S), 0)
    icons.draw_glyph(ImageDraw.Draw(tree), "tree", 128, 132, 1.25, 22)
    glow = tree.filter(ImageFilter.GaussianBlur(10))
    gl = Image.new("RGBA", (S, S), (160, 255, 140, 0))
    ga = np.asarray(gl).copy()
    ga[..., 3] = (np.asarray(glow, dtype=np.float32) * 0.7).astype(np.uint8)
    img.alpha_composite(Image.fromarray(ga, "RGBA"))
    img.alpha_composite(textured_fill((S, S), tree, ["#2a6a1a", "#7ad84a", "#e8ffc0"], "leaf", 9))
    img = outline(img, width=2)
    for p in (BP, RP):
        save(img, os.path.join(p, "pack_icon.png"))


if __name__ == "__main__":
    print("Texturen werden erzeugt …")
    item_icons()
    entity_skins()
    armor_textures()
    block_textures()
    ui_icons()
    particles()
    pack_icons()
    print("Fertig.")
