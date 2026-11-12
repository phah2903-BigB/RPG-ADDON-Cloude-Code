"""Kreatur-, NPC-, Rüstungs- und Blocktexturen (UV-basiert, 4x Auflösung wie Natur Fantasy)."""
import numpy as np
from PIL import Image, ImageDraw
from lib import shade, hexrgb, mers_from

SC = 4  # Pixel pro UV-Einheit

# Material-Bibliothek: name -> (Farbe, Muster, emissiv)
MATS = {
    "moss": ("#4f8a2f", "moss", 0), "moss_light": ("#7cb342", "moss", 0), "moss_dark": ("#2e5a1c", "moss", 0),
    "eye": ("#ffe066", "glow", 1), "eye_big": ("#ffcc33", "glow", 1), "eye_dark": ("#2a0a00", "plain", 0), "mouth": ("#1d2a12", "plain", 0),
    "stem": ("#6b4a2a", "bark", 0), "leaf": ("#5fae3a", "leaf", 0), "fur": ("#6b5040", "fur", 0), "fur_light": ("#9a7a5a", "fur", 0), "fur_dark": ("#3a2a20", "fur", 0),
    "thorn": ("#8ab84a", "bark", 0), "nose": ("#1a1010", "plain", 0), "bark": ("#5e4228", "bark", 0), "bark_light": ("#7a5a38", "bark", 0), "bark_dark": ("#3a2616", "bark", 0),
    "root": ("#4a3018", "bark", 0), "skin": ("#8a9a6a", "skin", 0), "skin_dark": ("#4a5a3a", "skin", 0), "cloth": ("#4a3a2a", "cloth", 0), "cloth_dark": ("#2a2018", "cloth", 0),
    "wrap": ("#c9b88a", "wrap", 0), "gold": ("#d8a83a", "metal", 0), "toad": ("#5a6b2f", "moss", 0), "toad_belly": ("#a8a060", "skin", 0), "toad_dark": ("#3a4a1a", "moss", 0),
    "wart": ("#7a8a3a", "moss", 0), "robe": ("#2d3b45", "cloth", 0), "robe_fade": ("#1d2b35", "shadow", 0), "robe_dark": ("#1a242c", "cloth", 0), "bone": ("#d8d0c0", "plain", 0),
    "chitin": ("#b5651d", "chitin", 0), "chitin_dark": ("#6a3a10", "chitin", 0), "chitin_light": ("#e09a4a", "chitin", 0), "sting": ("#ff6a2a", "glow", 1),
    "ember_core": ("#ff8a1a", "glow", 1), "ember": ("#ffb03a", "glow", 1), "ember_tip": ("#ffe08a", "glow", 1), "troll_skin": ("#7a9bb0", "skin", 0), "troll_dark": ("#4a6a80", "skin", 0),
    "tusk": ("#f0e8d8", "plain", 0), "ice": ("#a8e0ff", "ice", 0), "feather": ("#2f3a4a", "feather", 0), "feather_dark": ("#1a222e", "feather", 0), "beak": ("#c8a040", "plain", 0),
    "crystal": ("#c08aff", "crystal", 1), "fang": ("#e8e0d0", "plain", 0), "shadow": ("#1a1220", "shadow", 0), "shadow_dark": ("#0e0a14", "shadow", 0), "shadow_spike": ("#5a2a8a", "crystal", 1),
    "stone": ("#6a6e72", "stone", 0), "stone_dark": ("#4a4e52", "stone", 0), "core": ("#7cff8a", "glow", 1), "pale": ("#c8c0b0", "skin", 0), "antler": ("#5a4030", "bark", 0),
    "staff": ("#4a3020", "bark", 0), "scale": ("#3a5a2a", "scale", 0), "scale_dark": ("#24381a", "scale", 0), "horn": ("#c8b898", "plain", 0),
    "proj": ("#c8a0ff", "glow", 1), "proj_tip": ("#ffffff", "plain", 1),
    "stone_base": ("#6a6a70", "stone", 0), "stone_rune": ("#7a7e86", "stone", 0), "wood": ("#6a4a2a", "bark", 0), "board": ("#c8a870", "cloth", 0), "heart": ("#5a2a6a", "crystal", 1),
}

SKINS = {
    "moss": {},
    "thornwolf": {"fur": "#5a4636", "fur_light": "#8a7458", "fur_dark": "#32261c", "thorn": "#7cbf3f", "eye": "#d4ff4a"},
    "spiritwolf": {"fur": "#8fc8e8", "fur_light": "#e0f8ff", "fur_dark": "#5a9ab8", "thorn": "#c8f0ff", "eye": "#ffffff", "nose": "#3a6a8a"},
    "treant_young": {"bark": "#5a3f26", "leaf": "#7a8a3a", "eye": "#c8ff4a", "moss": "#4a6a2a"},
    "treant_boss": {"bark": "#3e2a1c", "bark_light": "#5a4030", "leaf": "#6a3a7a", "eye": "#e070ff", "root": "#2a1a10", "moss": "#4a2a5a"},
    "bog": {"skin": "#5a6a3a", "cloth": "#3a3020", "cloth_dark": "#24200f", "moss": "#4a5a20", "eye": "#e0ff6a"},
    "toad": {}, "toad_boss": {"toad": "#3a4a2a", "toad_belly": "#8a7a40", "eye_big": "#ff5a2a", "wart": "#6a2a7a", "toad_dark": "#24301a"},
    "sighghost": {"robe": "#2d3b45", "robe_dark": "#16222a", "robe_fade": "#2a3a40", "eye": "#9ff8e8", "bone": "#c8d8d0"},
    "blightwraith": {"robe": "#2a1f33", "robe_dark": "#160e1e", "robe_fade": "#3a1a4a", "eye": "#d070ff", "bone": "#a898b8"},
    "scorpion": {"chitin": "#c0702a", "eye": "#ff3a1a", "sting": "#ffe03a"},
    "scorpion_boss": {"chitin": "#8a1a10", "chitin_dark": "#4a0a08", "chitin_light": "#d8502a", "eye": "#ffe03a", "sting": "#ff8a1a"},
    "mummy": {"wrap": "#c9b88a", "cloth": "#6a4a2a", "cloth_dark": "#4a3018", "eye": "#40ff9a"},
    "emberwisp": {},
    "icekobold": {"skin": "#6fa8c8", "skin_dark": "#3a6a8a", "cloth": "#e8f0f8", "cloth_dark": "#8aa0b8", "eye": "#a8f0ff"},
    "goblin": {"skin": "#6a8a2a", "skin_dark": "#3a5a1a", "cloth": "#6a4a2a", "cloth_dark": "#3a2a18", "eye": "#ffd03a"},
    "goblin_archer": {"skin": "#6a8a2a", "skin_dark": "#3a5a1a", "cloth": "#3a5a6a", "cloth_dark": "#24343a", "eye": "#ffd03a"},
    "frosttroll": {"fur": "#d8e0e8", "fur_light": "#ffffff", "fur_dark": "#9aa8b8", "eye": "#a8f8ff"},
    "hrimgar": {"troll_skin": "#4a6a8a", "troll_dark": "#2a4a6a", "fur": "#8a9ab0", "ice": "#6ad0ff", "eye": "#a8f8ff"},
    "frostcrow": {"beak": "#9ab0c0", "eye": "#9fd0ff"},
    "crystalspider": {"chitin": "#2a2340", "chitin_dark": "#16122a", "eye": "#ff7aff", "fang": "#d8c8ff"},
    "crystalspider_boss": {"chitin": "#3a1a4a", "chitin_dark": "#1e0e2a", "crystal": "#ff9ae0", "eye": "#ffffff"},
    "shadowcrawler": {"eye_big": "#b05aff"},
    "rootgolem": {"stone": "#5a5e62", "root": "#5a3a1e", "core": "#7cff8a", "eye": "#7cff8a"},
    "witherbeast": {"stone": "#3a2a3e", "stone_dark": "#241828", "root": "#3a1a2a", "core": "#ff4ad0", "eye": "#ff4ad0"},
    "morvath": {"robe": "#3a1a2a", "robe_dark": "#22101a", "pale": "#b8b0a8", "antler": "#4a3a2a", "staff": "#2a1a14", "core": "#d04aff", "eye": "#e070ff"},
    "wyrm": {"eye": "#ffe03a", "fang": "#f0e8d8", "horn": "#d8c8a0"},
    "arcane": {"proj": "#b070ff"}, "thorn": {"proj": "#5a9a2e"}, "fire": {"proj": "#ff8a1a"}, "frost": {"proj": "#a8e8ff"},
    "poison_arrow": {"proj": "#7ad83a", "proj_tip": "#c8ff8a"}, "ranger_arrow": {"proj": "#8a6a3a", "proj_tip": "#e8e8e8"}, "blight": {"proj": "#a040e0"}, "goblin_arrow": {"proj": "#6a4a2a", "proj_tip": "#a8a8a8"},
}


def faces(uv, s):
    u, v = uv
    w, h, d = s
    return {
        "up": (u + d, v, w, d), "down": (u + d + w, v, w, d),
        "east": (u, v + d, d, h), "north": (u + d, v + d, w, h),
        "west": (u + d + w, v + d, d, h), "south": (u + 2 * d + w, v + d, w, h),
    }


def paint_model(info, skin, seed=1, glow_alpha=True):
    W, H = info["texW"] * SC, info["texH"] * SC
    img = np.zeros((H, W, 4), np.uint8)
    em = np.zeros((H, W), np.uint8)
    ov = SKINS.get(skin, {})
    ys = [cb.get("y", 0) for cb in info["cubes"]] or [0]
    ymin, ymax = min(ys), max(ys)
    for ci, cb in enumerate(info["cubes"]):
        hl = 0.86 + 0.22 * ((cb.get("y", 0) - ymin) / (ymax - ymin) if ymax > ymin else 0.5)
        mat = cb["mat"]
        base, pat, emissive = MATS.get(mat, ("#888888", "plain", 0))
        base = ov.get(mat, base)
        for fi, (face, (x, y, w, h)) in enumerate(faces(cb["uv"], cb["s"]).items()):
            pw, ph = max(1, int(w * SC)), max(1, int(h * SC))
            px, py = int(x * SC), int(y * SC)
            if px + pw > W or py + ph > H:
                continue
            rgb = shade(base, pw, ph, pat, seed * 131 + ci * 17 + fi, face)
            if not emissive:
                rgb = np.clip(rgb * hl, 0, 255)
            img[py:py + ph, px:px + pw, :3] = rgb.astype(np.uint8)
            img[py:py + ph, px:px + pw, 3] = 255
            if emissive:
                em[py:py + ph, px:px + pw] = 255
                if glow_alpha:
                    img[py:py + ph, px:px + pw, 3] = 40  # entity_emissive_alpha: wenig Alpha = leuchtet
    return Image.fromarray(img, "RGBA"), Image.fromarray(em, "L")


# ---------------- NPCs (Spieler-Skin-Layout 64x64) ----------------
NPC_STYLE = {
    "npc_sylva": dict(skin="#ecd2b4", hair="#b8e0b0", eyes="#2fa860", top="#3a7a3a", top2="#5aa850", legs="#2a5a2a", shoes="#4a3220", hat="leaves", beard=None, long_hair=True),
    "npc_fennick": dict(skin="#d8a880", hair="#9a3a1a", eyes="#5a3a1a", top="#5a2a6a", top2="#d8b040", legs="#3a2a1a", shoes="#2a1a10", hat="cap", beard="#9a3a1a", long_hair=False),
    "npc_kael": dict(skin="#c89870", hair="#3a2618", eyes="#7a8a8a", top="#2e5a3a", top2="#6a4626", legs="#4a3420", shoes="#2a1a10", hat="hood", beard="#3a2618", long_hair=False),
    "npc_brom": dict(skin="#d8a080", hair="#8a5a2a", eyes="#2a1a10", top="#6a6a70", top2="#4a3020", legs="#3a3a40", shoes="#2a1a10", hat=None, beard="#a8642a", long_hair=False, bald=True),
    "npc_mira": dict(skin="#f2d4b6", hair="#e8c860", eyes="#3a7ad8", top="#7a3a8a", top2="#f0ece0", legs="#5a2a6a", shoes="#3a2a1a", hat="goggles", beard=None, long_hair=True),
    "npc_oswin": dict(skin="#e0c4a4", hair="#ececec", eyes="#3a4a6a", top="#2a3a6a", top2="#c8a83a", legs="#1e2a4a", shoes="#2a1a10", hat="glasses", beard="#f0f0f0", long_hair=False),
    "npc_morgra": dict(skin="#a8b890", hair="#1a1a1a", eyes="#e8d83a", top="#2a3a20", top2="#5a3a5a", legs="#1e2a16", shoes="#1a1410", hat="witch", beard=None, long_hair=True),
}


def rect(img, x, y, w, h, color, pat="plain", seed=1, face="north", alpha=255):
    pw, ph = int(w * SC), int(h * SC)
    rgb = shade(color, pw, ph, pat, seed, face)
    arr = np.asarray(img).copy()
    arr[int(y * SC):int(y * SC) + ph, int(x * SC):int(x * SC) + pw, :3] = rgb.astype(np.uint8)
    arr[int(y * SC):int(y * SC) + ph, int(x * SC):int(x * SC) + pw, 3] = alpha
    return Image.fromarray(arr, "RGBA")


def box(img, uv, s, color, pat, seed, front=None):
    for i, (face, (x, y, w, h)) in enumerate(faces(uv, s).items()):
        img = rect(img, x, y, w, h, color, pat, seed + i, face)
    return img


def paint_npc(skin_id, seed=7):
    st = NPC_STYLE[skin_id]
    img = Image.new("RGBA", (64 * SC, 64 * SC), (0, 0, 0, 0))
    img = box(img, (0, 0), (8, 8, 8), st["skin"], "skin", seed)
    # Haare: oben, hinten, Seiten oben
    if not st.get("bald"):
        img = rect(img, 8, 0, 8, 8, st["hair"], "fur", seed + 1, "up")
        img = rect(img, 24, 8, 8, 8 if st["long_hair"] else 5, st["hair"], "fur", seed + 2, "south")
        img = rect(img, 0, 8, 8, 6 if st["long_hair"] else 3, st["hair"], "fur", seed + 3, "east")
        img = rect(img, 16, 8, 8, 6 if st["long_hair"] else 3, st["hair"], "fur", seed + 4, "west")
        img = rect(img, 8, 8, 8, 2, st["hair"], "fur", seed + 5)
    d = ImageDraw.Draw(img)
    s = SC
    # Augen
    ey = 8 + 4
    for ex in (9, 13):
        d.rectangle([ex * s, ey * s, (ex + 2) * s - 1, (ey + 1) * s - 1], fill=(250, 250, 250, 255))
        d.rectangle([(ex + (1 if ex == 9 else 0)) * s, ey * s, (ex + (1 if ex == 9 else 0) + 1) * s - 1, (ey + 1) * s - 1], fill=tuple(int(c) for c in hexrgb(st["eyes"])) + (255,))
    d.rectangle([9 * s, (ey - 1) * s, 15 * s - 1, (ey - 1) * s + 2], fill=tuple(int(c * 0.6) for c in hexrgb(st["hair"])) + (255,))
    # Mund / Bart
    if st["beard"]:
        bc = tuple(int(c) for c in hexrgb(st["beard"])) + (255,)
        d.rectangle([8 * s, 14 * s, 16 * s - 1, 16 * s - 1], fill=bc)
        d.rectangle([9 * s, 13 * s + 2, 15 * s - 1, 14 * s], fill=bc)
        img = rect(img, 16, 0, 8, 8, st["beard"], "fur", seed + 9, "down")
    else:
        d.rectangle([11 * s, 14 * s + 1, 13 * s - 1, 14 * s + 2], fill=(120, 60, 60, 255))
    # Körper
    img = box(img, (16, 16), (8, 12, 4), st["top"], "cloth", seed + 10)
    img = rect(img, 20, 20, 8, 12, st["top2"], "cloth", seed + 11) if skin_id in ("npc_brom", "npc_mira") else img
    img = rect(img, 20, 30, 8, 2, "#3a2a1a", "plain", seed + 12)  # Gürtel
    # Arme
    img = box(img, (40, 16), (4, 12, 4), st["top"], "cloth", seed + 13)
    img = box(img, (32, 48), (4, 12, 4), st["top"], "cloth", seed + 14)
    if skin_id == "npc_brom":
        img = box(img, (40, 16), (4, 12, 4), st["skin"], "skin", seed + 15)
        img = box(img, (32, 48), (4, 12, 4), st["skin"], "skin", seed + 16)
    for (x, y) in ((44, 30), (36, 62)):
        img = rect(img, x, y - 2, 4, 2, st["skin"], "skin", seed + 17)
    # Beine
    img = box(img, (0, 16), (4, 12, 4), st["legs"], "cloth", seed + 18)
    img = box(img, (16, 48), (4, 12, 4), st["legs"], "cloth", seed + 19)
    for (x, y) in ((4, 29), (20, 61)):
        img = rect(img, x - 4, y, 16, 3, st["shoes"], "plain", seed + 20)
    # Kopfschmuck (Hut-Ebene 32,0)
    hat = st["hat"]
    if hat == "leaves":
        img = rect(img, 40, 0, 8, 8, "#4a9a3a", "leaf", seed + 21, "up")
        for x0 in (32, 40, 48, 56):
            img = rect(img, x0, 8, 8, 2, "#5aae3a", "leaf", seed + 22)
    elif hat == "hood" or hat == "witch":
        col = "#2e5a3a" if hat == "hood" else "#2a2a20"
        img = rect(img, 40, 0, 8, 8, col, "cloth", seed + 23, "up")
        for x0 in (32, 48, 56):
            img = rect(img, x0, 8, 8, 8, col, "cloth", seed + 24)
        img = rect(img, 40, 8, 8, 2, col, "cloth", seed + 25)
    elif hat == "cap":
        img = rect(img, 40, 0, 8, 8, "#6a3a1a", "cloth", seed + 26, "up")
        for x0 in (32, 40, 48, 56):
            img = rect(img, x0, 8, 8, 2, "#6a3a1a", "cloth", seed + 27)
    elif hat in ("glasses", "goggles"):
        d = ImageDraw.Draw(img)
        col = (200, 170, 60, 255) if hat == "glasses" else (90, 60, 40, 255)
        for ex in (41, 45):
            d.rectangle([ex * s, 12 * s, (ex + 2) * s + 1, 13 * s + 2], outline=col, width=2)
    return img


# ---------------- Rüstung (64x32 → 256x128) ----------------
ARMOR_COLORS = {
    "oakguard": ("#8a6232", "#8a949e", "#4a9a2e"), "stalker": ("#6a4626", "#2e6a3a", "#b8772f"), "starweave": ("#283a8a", "#5a3a9a", "#d8a83a"),
    "barkweave": ("#5e4428", "#3e7a26", "#e06aa8"), "worldtree": ("#9a7a30", "#3eb85a", "#a8f0ff"),
}


def paint_armor(set_id, layer, seed=3):
    p, sec, acc = ARMOR_COLORS[set_id]
    img = Image.new("RGBA", (64 * SC, 32 * SC), (0, 0, 0, 0))
    pat = "metal" if set_id in ("oakguard", "worldtree") else "cloth"
    if layer == 1:
        img = box(img, (0, 0), (8, 8, 8), p, pat, seed)
        img = rect(img, 8, 8 + 6, 8, 2, sec, "metal", seed + 1)
        img = rect(img, 10, 8, 4, 1, acc, "plain", seed + 2)
        img = box(img, (16, 16), (8, 12, 4), p, pat, seed + 3)
        img = rect(img, 22, 22, 4, 4, acc, "glow", seed + 4)
        img = rect(img, 20, 29, 8, 2, sec, "metal", seed + 5)
        img = box(img, (40, 16), (4, 12, 4), sec, "metal", seed + 6)
        img = rect(img, 40, 28, 16, 4, p, pat, seed + 7)
        # Stiefel (untere Beinhälfte)
        for (x, w) in ((0, 4), (4, 4), (8, 4), (12, 4)):
            img = rect(img, x, 27, w, 5, p, pat, seed + 8 + x)
        img = rect(img, 4, 16, 4, 4, p, pat, seed + 30, "up")
        img = rect(img, 8, 16, 4, 4, sec, "metal", seed + 31, "down")
    else:
        img = box(img, (0, 16), (4, 12, 4), p, pat, seed + 10)
        img = rect(img, 4, 22, 4, 2, sec, "metal", seed + 11)
        img = rect(img, 16, 26, 24, 6, p, pat, seed + 12)
        img = rect(img, 20, 26, 8, 1, acc, "plain", seed + 13)
    return img


# ---------------- Volle Blöcke (64x64) ----------------
def block_tex(kind, seed=5):
    from lib import noise
    W = 64
    if kind in ("runenstein", "runenstein_lit"):
        base = shade("#6a6e74", W, W, "stone", seed, "north")
        img = np.zeros((W, W, 4), np.uint8)
        img[..., :3] = base.astype(np.uint8)
        img[..., 3] = 255
        im = Image.fromarray(img, "RGBA")
        d = ImageDraw.Draw(im)
        col = (120, 230, 255, 255) if kind.endswith("lit") else (40, 44, 52, 255)
        d.line([(20, 12), (32, 52), (44, 12)], fill=col, width=4)
        d.line([(24, 32), (40, 32)], fill=col, width=4)
        d.rectangle([2, 2, 61, 61], outline=(30, 32, 36, 255), width=2)
        em = Image.new("L", (W, W), 0)
        if kind.endswith("lit"):
            ImageDraw.Draw(em).line([(20, 12), (32, 52), (44, 12)], fill=255, width=4)
            ImageDraw.Draw(em).line([(24, 32), (40, 32)], fill=255, width=4)
        return im, em
    if kind == "barriere":
        n = noise(W, W, 6, seed, 2)
        arr = np.zeros((W, W, 4), np.uint8)
        arr[..., 0] = (80 + n * 80).astype(np.uint8)
        arr[..., 1] = (200 + n * 55).astype(np.uint8)
        arr[..., 2] = 255
        arr[..., 3] = (90 + n * 70).astype(np.uint8)
        im = Image.fromarray(arr, "RGBA")
        d = ImageDraw.Draw(im)
        for i in range(0, 64, 16):
            d.line([(i, 0), (i + 16, 64)], fill=(200, 255, 255, 200), width=2)
        d.rectangle([0, 0, 63, 63], outline=(220, 255, 255, 230), width=3)
        return im, Image.new("L", (W, W), 255)
    if kind == "faeulnis":
        base = shade("#3a1a4a", W, W, "shadow", seed, "up", dark="#120818", light="#8a3ab0")
        arr = np.zeros((W, W, 4), np.uint8)
        arr[..., :3] = base.astype(np.uint8)
        arr[..., 3] = 255
        return Image.fromarray(arr, "RGBA"), Image.new("L", (W, W), 0)
    raise ValueError(kind)
