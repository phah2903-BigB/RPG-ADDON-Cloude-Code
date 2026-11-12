"""Item-Icons (64x64, gemalter Stil mit Kontur) – Waffen, Rüstung, Tränke, Materialien, Runen."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from lib import textured_fill, rot_points, outline, hexrgb, mers_from

S = 384  # Arbeitsauflösung (Mitte = 192, Icons werden eingepasst)
OUT = 64

WPAL = {
    "bronze": dict(blade=["#5e3a17", "#b8772f", "#f2c47c"], guard=["#4a2e14", "#8f5c2a", "#d09450"], grip=["#2a1a10", "#5b3a22", "#8a5a36"], accent=["#6a4010", "#d8a040", "#ffe08a"], wood=["#3a2412", "#7a5230", "#b48050"], glow=None),
    "steel": dict(blade=["#4a5560", "#aab6c0", "#f4f8fb"], guard=["#3a4048", "#7a848e", "#c8d0d8"], grip=["#20160e", "#4a3424", "#7a5a40"], accent=["#5a6470", "#a8b4c0", "#e8eef4"], wood=["#2e2014", "#5e4430", "#8e6c4c"], glow=None),
    "moonsilver": dict(blade=["#5a6c9c", "#c4d6ff", "#ffffff"], guard=["#3a4878", "#7f90c8", "#c8d4ff"], grip=["#1a2040", "#34407a", "#5a6aa8"], accent=["#6080c0", "#a8c8ff", "#e8f4ff"], wood=["#2a3050", "#4a5888", "#8090c8"], glow="#a8d0ff"),
    "runeobsidian": dict(blade=["#0e0a16", "#2c2040", "#5a4680"], guard=["#1a1226", "#3e2c5c", "#6a5294"], grip=["#0c0810", "#221a2c", "#3a2e4a"], accent=["#5a2a9a", "#b070ff", "#f0d0ff"], wood=["#140e1c", "#2e2440", "#4e3e6a"], glow="#b070ff"),
    "u_ylvaris": dict(blade=["#3a2a14", "#8a6a2a", "#e8c870"], guard=["#1e4a14", "#4a9a2e", "#a8f070"], grip=["#2a1a10", "#5b3a22", "#8a5a36"], accent=["#2a6a1a", "#5cb83a", "#c8ff8a"], wood=["#3a2412", "#7a5230", "#b48050"], glow="#9cff6a"),
    "u_whisper": dict(blade=["#140a1e", "#3a2058", "#9a6ad8"], guard=["#1a0e26", "#4a2a6a", "#8a5ab8"], grip=["#0c0810", "#221a2c", "#3a2e4a"], accent=["#4a1a7a", "#a060e0", "#f0c8ff"], wood=["#140e1c", "#2e2440", "#4e3e6a"], glow="#c890ff"),
    "u_star": dict(blade=["#1a2a4a", "#4a6aa8", "#c8dcff"], guard=["#2a3a6a", "#6a8ad0", "#e0ecff"], grip=["#141a30", "#2a3460", "#4a5a98"], accent=["#8aa8ff", "#d8e8ff", "#ffffff"], wood=["#1a2a4a", "#4a6aa8", "#c8dcff"], glow="#e8f0ff"),
    "u_winter": dict(blade=["#2a4a6a", "#6aa8d8", "#e0f6ff"], guard=["#1e3a5a", "#4a88b8", "#b8e4ff"], grip=["#14283c", "#2a4a6a", "#4a7aa0"], accent=["#6ac8ff", "#c0f0ff", "#ffffff"], wood=["#2a4a6a", "#5a8ab8", "#a8d0f0"], glow="#a8e8ff"),
    "u_root": dict(blade=["#2e2e2e", "#6e685e", "#b8b0a0"], guard=["#3a2412", "#6a4422", "#a07040"], grip=["#2a1a10", "#5b3a22", "#8a5a36"], accent=["#1e5a2a", "#3ab85a", "#a8ffb0"], wood=["#3a2412", "#6a4422", "#a07040"], glow="#7cff8a"),
    "u_grove": dict(blade=["#8a2a5a", "#e06aa8", "#ffd0ea"], guard=["#1e4a14", "#4a9a2e", "#a8f070"], grip=["#2a1a10", "#5b3a22", "#8a5a36"], accent=["#d85a9a", "#ff9ad0", "#ffe8f4"], wood=["#3a2412", "#7a5230", "#b48050"], glow="#9cff9a"),
}

APAL = {
    "oakguard": dict(p=["#3d2a14", "#8a6232", "#c89a5a"], s=["#3a4048", "#8a949e", "#d8e0e8"], a=["#1e4a14", "#4a9a2e", "#9ae070"], glow=None),
    "stalker": dict(p=["#2a1a0e", "#6a4626", "#a8784a"], s=["#14301a", "#2e6a3a", "#5aa868"], a=["#5e3a17", "#b8772f", "#f2c47c"], glow=None),
    "starweave": dict(p=["#0e1430", "#283a8a", "#5a72d0"], s=["#2a1440", "#5a3a9a", "#9a7ad8"], a=["#6a4a10", "#d8a83a", "#ffe89a"], glow="#ffe89a"),
    "barkweave": dict(p=["#2a1c10", "#5e4428", "#94704a"], s=["#1e3a12", "#3e7a26", "#7ac04a"], a=["#8a2a5a", "#e06aa8", "#ffc0e0"], glow=None),
    "worldtree": dict(p=["#3a2a10", "#9a7a30", "#f0d070"], s=["#1a5a2a", "#3eb85a", "#a8ff9a"], a=["#5aa0ff", "#a8f0ff", "#ffffff"], glow="#a8f0ff"),
}


def bevel(layer, mask, strength=1.0):
    """Gemalte Plastizität: Licht von oben links, dunkle Innenkanten."""
    m = np.asarray(mask, dtype=np.float32) / 255.0
    if m.max() == 0:
        return layer
    blur = np.asarray(mask.filter(ImageFilter.GaussianBlur(7)), dtype=np.float32) / 255.0
    shifted = np.asarray(mask.transform(mask.size, Image.AFFINE, (1, 0, 5, 0, 1, 5)), dtype=np.float32) / 255.0
    hi = np.clip(m - shifted, 0, 1)  # Kanten oben links
    shifted2 = np.asarray(mask.transform(mask.size, Image.AFFINE, (1, 0, -5, 0, 1, -5)), dtype=np.float32) / 255.0
    lo = np.clip(m - shifted2, 0, 1)  # Kanten unten rechts
    a = np.asarray(layer, dtype=np.float32).copy()
    edge = (1 - blur) * m
    f = 1 - edge * 0.45 * strength + hi * 0.35 * strength - lo * 0.3 * strength
    a[..., :3] = np.clip(a[..., :3] * f[..., None] + hi[..., None] * 40 * strength, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


class Canvas:
    def __init__(self, seed=1, sx=1.0, sy=1.0):
        self.img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        self.glow = Image.new("L", (S, S), 0)
        self.seed = seed
        self.sx = sx
        self.sy = sy

    def tf(self, pts):
        return [(x * self.sx, y * self.sy) for (x, y) in pts]

    def part(self, draw_fn, colors, pat="metal", glow=False, light=True):
        mask = Image.new("L", (S, S), 0)
        draw_fn(ImageDraw.Draw(mask))
        self.seed += 1
        layer = textured_fill((S, S), mask, colors, pat, self.seed, light)
        layer = bevel(layer, mask)
        self.img.alpha_composite(layer)
        if glow:
            self.glow.paste(255, (0, 0), mask)
        return mask

    def poly(self, pts, colors, pat="metal", glow=False, angle=45):
        p = rot_points(self.tf(pts), angle, S / 2, S / 2)
        return self.part(lambda d: d.polygon(p, fill=255), colors, pat, glow)

    def circle(self, cx, cy, r, colors, pat="metal", glow=False, angle=45):
        (x, y), = rot_points(self.tf([(cx, cy)]), angle, S / 2, S / 2)
        r = r * self.sx
        return self.part(lambda d: d.ellipse([x - r, y - r, x + r, y + r], fill=255), colors, pat, glow)

    def line(self, pts, width, colors, pat="metal", glow=False, angle=45):
        p = rot_points(self.tf(pts), angle, S / 2, S / 2)
        width = int(width * self.sx)
        return self.part(lambda d: d.line(p, fill=255, width=width, joint="curve"), colors, pat, glow)

    def highlight(self, pts, color=(255, 255, 255, 110), width=4, angle=45):
        p = rot_points(self.tf(pts), angle, S / 2, S / 2)
        d = ImageDraw.Draw(self.img)
        d.line(p, fill=color, width=width)

    def finish(self, glow_color=None, fit=True):
        src, gsrc = self.img, self.glow
        bb = src.getbbox()
        if bb:
            x0, y0, x1, y1 = bb
            side = max(x1 - x0, y1 - y0, 236 if not fit else 1)
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            m = side * 0.06
            box = (int(cx - side / 2 - m), int(cy - side / 2 - m), int(cx + side / 2 + m), int(cy + side / 2 + m))
            src = src.crop(box)
            gsrc = gsrc.crop(box)
        self.glow = gsrc
        img = src.resize((OUT, OUT), Image.LANCZOS)
        a = np.asarray(img).copy()
        a[..., 3] = np.where(a[..., 3] > 90, 255, 0)
        img = Image.fromarray(a, "RGBA")
        img = outline(img)
        g = self.glow.resize((OUT, OUT), Image.LANCZOS)
        if glow_color:
            # sanfter Schein um leuchtende Teile
            halo = g.filter(ImageFilter.GaussianBlur(2))
            col = Image.new("RGBA", (OUT, OUT), tuple(int(v) for v in hexrgb(glow_color)) + (0,))
            ca = np.asarray(col).copy()
            ca[..., 3] = (np.asarray(halo, dtype=np.float32) * 0.55).astype(np.uint8)
            base = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
            base.alpha_composite(Image.fromarray(ca, "RGBA"))
            base.alpha_composite(img)
            img = base
        mers = None
        if glow_color is not None:
            mers = mers_from(img, emissive_mask=g.point(lambda v: 255 if v > 100 else 0))
        return img, mers


# ---------------- Waffen ----------------
def weapon(kind, palette, seed=1):
    P = WPAL[palette]
    sxk = {"streitaxt": 1.1, "kriegshammer": 1.05, "langbogen": 1.25, "armbrust": 1.2}.get(kind, 1.55)
    c = Canvas(seed, sx=sxk, sy=1.02 if kind in ("streitaxt", "kriegshammer") else 1.08)
    g = P["glow"] is not None
    if kind in ("schwert", "zweihaender", "dolch"):
        k = {"schwert": 1.0, "zweihaender": 1.15, "dolch": 0.72}[kind]
        wid = {"schwert": 14, "zweihaender": 19, "dolch": 13}[kind]
        top = -150 * k if kind != "dolch" else -70
        gy = 82 * k if kind != "dolch" else 50
        bot = 140 * k if kind != "dolch" else 105
        c.circle(0, bot, 13, P["accent"], glow=g)
        c.poly([(-7, gy + 12), (7, gy + 12), (7, bot - 8), (-7, bot - 8)], P["grip"], "wrap")
        gw = {"schwert": 40, "zweihaender": 52, "dolch": 26}[kind]
        c.poly([(-gw, gy), (gw, gy), (gw - 4, gy + 14), (-gw + 4, gy + 14)], P["guard"])
        c.circle(-gw, gy + 7, 8, P["accent"])
        c.circle(gw, gy + 7, 8, P["accent"])
        c.poly([(-wid, gy), (wid, gy), (wid - 2, top + 35), (0, top), (-wid + 2, top + 35)], P["blade"], "metal", glow=palette in ("u_whisper", "runeobsidian") and False)
        c.poly([(-3, gy - 6), (3, gy - 6), (2, top + 40), (-2, top + 40)], [P["blade"][0], P["blade"][0], P["blade"][1]], "metal", glow=g)
        c.highlight([(wid - 5, gy - 8), (wid - 6, top + 40), (0, top + 6)])
    elif kind == "streitaxt":
        c.poly([(-6, 145), (6, 145), (6, -130), (-6, -130)], P["wood"], "bark")
        c.poly([(-6, -125), (-75, -150), (-90, -95), (-75, -40), (-6, -70)], P["blade"], "metal")
        c.poly([(6, -120), (45, -138), (52, -98), (45, -60), (6, -78)], P["blade"], "metal")
        c.poly([(-9, -128), (9, -128), (9, -68), (-9, -68)], P["guard"])
        c.circle(0, 145, 11, P["accent"], glow=g)
        c.poly([(-7, 60), (7, 60), (7, 120), (-7, 120)], P["grip"], "wrap")
        c.highlight([(-80, -130), (-86, -95), (-74, -55)])
        if g:
            c.line([(-50, -120), (-62, -95), (-50, -70)], 6, [P["glow"], P["glow"], "#ffffff"], glow=True)
    elif kind == "kriegshammer":
        c.poly([(-7, 145), (7, 145), (7, -100), (-7, -100)], P["wood"], "bark")
        c.poly([(-58, -145), (58, -145), (58, -88), (-58, -88)], P["blade"], "stone" if palette == "u_root" else "metal")
        c.poly([(-60, -125), (60, -125), (60, -110), (-60, -110)], P["guard"])
        c.poly([(-8, -145), (8, -145), (0, -170)], P["accent"])
        c.poly([(-8, 60), (8, 60), (8, 125), (-8, 125)], P["grip"], "wrap")
        c.circle(0, 145, 11, P["accent"], glow=g)
        if g:
            c.line([(-40, -100), (-20, -132), (0, -100), (20, -132), (40, -100)], 5, [P["glow"], P["glow"], "#ffffff"], glow=True)
        c.highlight([(-54, -140), (54, -140)])
    elif kind == "speer":
        c.poly([(-5, 150), (5, 150), (5, -88), (-5, -88)], P["wood"], "bark")
        c.poly([(0, -155), (19, -118), (10, -84), (-10, -84), (-19, -118)], P["blade"], "metal", glow=palette == "u_star")
        c.poly([(-8, -86), (8, -86), (8, -70), (-8, -70)], P["accent"])
        c.poly([(-6, 30), (6, 30), (6, 70), (-6, 70)], P["grip"], "wrap")
        c.highlight([(12, -118), (0, -150)])
        if g:
            c.line([(0, -140), (0, -95)], 4, [P["glow"], P["glow"], "#ffffff"], glow=True)
    elif kind == "langbogen":
        pts = [(-14, -150), (-40, -100), (-52, -40), (-55, 0), (-52, 40), (-40, 100), (-14, 150)]
        c.line(pts, 14, P["wood"], "bark", glow=palette == "u_star")
        c.line([(-14, -150), (16, 0), (-14, 150)] if False else [(-14, -148), (-14, 148)], 3, ["#d8d0c0", "#f0ece0", "#ffffff"], "plain", glow=palette == "u_star")
        c.poly([(-60, -18), (-46, -18), (-46, 18), (-60, 18)], P["grip"], "wrap")
        c.circle(-14, -150, 7, P["accent"], glow=g)
        c.circle(-14, 150, 7, P["accent"], glow=g)
    elif kind == "armbrust":
        c.poly([(-11, 140), (11, 140), (9, -60), (-9, -60)], P["wood"], "bark")
        c.line([(-75, -40), (-40, -70), (0, -78), (40, -70), (75, -40)], 12, P["blade"], "metal")
        c.line([(-75, -40), (0, -20), (75, -40)], 3, ["#d8d0c0", "#f0ece0", "#ffffff"], "plain")
        c.poly([(-3, -20), (3, -20), (3, -140), (-3, -140)], P["guard"])
        c.poly([(0, -158), (8, -138), (-8, -138)], P["accent"], glow=g)
        c.poly([(-6, 60), (6, 60), (6, 110), (-6, 110)], P["grip"], "wrap")
    elif kind == "zauberstab":
        c.poly([(-6, 150), (6, 150), (5, -92), (-5, -92)], P["wood"], "bark")
        c.poly([(-6, 60), (6, 60), (6, 110), (-6, 110)], P["grip"], "wrap")
        for sx in (-1, 1):
            c.poly([(0, -90), (sx * 26, -112), (sx * 22, -150), (sx * 12, -118)], P["guard"])
        orb = P["glow"] or P["accent"][1]
        c.circle(0, -122, 25, [P["accent"][0], orb, "#ffffff"], "glow", glow=True)
        c.circle(0, 150, 9, P["accent"], glow=g)
        return c.finish(orb)
    elif kind == "naturstab":
        pts = [(4, 150), (-6, 100), (6, 50), (-5, 0), (6, -50), (-4, -100), (10, -130), (26, -138), (30, -118)]
        c.line(pts, 13, P["wood"], "bark")
        for (lx, ly, r) in [(-18, -120, 16), (20, -95, 14), (-14, -75, 12)]:
            c.circle(lx, ly, r, ["#1e4a14", "#4a9a2e", "#a8f070"], "leaf")
        orb = P["glow"] or "#9cff9a"
        c.circle(16, -132, 14, ["#2a8a3a", orb, "#ffffff"], "glow", glow=True)
        if palette == "u_grove":
            for (fx, fy) in [(-22, -60), (12, -40), (-10, 10)]:
                c.circle(fx, fy, 9, P["accent"], "plain")
        return c.finish(orb)
    return c.finish(P["glow"])


# ---------------- Rüstung ----------------
def armor(slot, palette, seed=1):
    P = APAL[palette]
    c = Canvas(seed)
    a0 = 0
    if slot == "head":
        c.part(lambda d: d.chord([48, 40, 208, 200], 180, 360, fill=255), P["p"], "metal")
        c.part(lambda d: d.rectangle([48, 118, 208, 176], fill=255), P["p"], "metal")
        c.part(lambda d: d.rectangle([40, 112, 216, 128], fill=255), P["s"], "metal")
        c.part(lambda d: d.rectangle([84, 138, 172, 150], fill=255), ["#050505", "#151515", "#2a2a2a"], "plain")
        c.part(lambda d: d.polygon([(128, 34), (140, 70), (116, 70)], fill=255), P["a"], "leaf", glow=P["glow"] is not None)
    elif slot == "chest":
        c.part(lambda d: d.polygon([(70, 40), (186, 40), (210, 80), (196, 110), (180, 100), (176, 220), (80, 220), (76, 100), (60, 110), (46, 80)], fill=255), P["p"], "metal")
        c.part(lambda d: d.ellipse([34, 50, 98, 104], fill=255), P["s"], "metal")
        c.part(lambda d: d.ellipse([158, 50, 222, 104], fill=255), P["s"], "metal")
        c.part(lambda d: d.rectangle([80, 172, 176, 188], fill=255), P["a"], "plain")
        c.part(lambda d: d.ellipse([108, 92, 148, 132], fill=255), P["a"], "glow", glow=P["glow"] is not None)
    elif slot == "legs":
        c.part(lambda d: d.polygon([(70, 40), (186, 40), (196, 220), (142, 220), (128, 110), (114, 220), (60, 220)], fill=255), P["p"], "cloth")
        c.part(lambda d: d.rectangle([66, 38, 190, 60], fill=255), P["a"], "plain")
        c.part(lambda d: d.rectangle([72, 150, 110, 166], fill=255), P["s"], "metal")
        c.part(lambda d: d.rectangle([146, 150, 184, 166], fill=255), P["s"], "metal")
    elif slot == "feet":
        for ox in (0, 92):
            c.part(lambda d, ox=ox: d.polygon([(44 + ox, 80), (100 + ox, 80), (104 + ox, 180), (128 + ox, 200), (128 + ox, 222), (36 + ox, 222), (40 + ox, 180)], fill=255), P["p"], "cloth")
            c.part(lambda d, ox=ox: d.rectangle([38 + ox, 200, 128 + ox, 222], fill=255), P["s"], "metal")
            c.part(lambda d, ox=ox: d.rectangle([42 + ox, 80, 102 + ox, 96], fill=255), P["a"], "plain")
    void = a0
    return c.finish(P["glow"], fit=False)


# ---------------- Einfache Items ----------------
COLORS = {
    "red": ["#5a0a10", "#d8283a", "#ff9aa0"], "blue": ["#0a1a5a", "#2a5ad8", "#9ac8ff"], "orange": ["#5a2a05", "#e8781a", "#ffd08a"], "gray": ["#2a2e33", "#7a848e", "#d8e0e8"],
    "purple": ["#2a0a4a", "#8a3ad8", "#e0b0ff"], "yellow": ["#5a4a05", "#e8c81a", "#fff4a0"], "green": ["#0a3a10", "#3ab83a", "#c0ffa0"], "white": ["#5a6a7a", "#d8e4f0", "#ffffff"],
    "olive": ["#2a3010", "#7a8a2a", "#c8d880"], "ice": ["#2a5a8a", "#8ad0ff", "#ffffff"], "shadow": ["#0a0614", "#3a1a6a", "#a070ff"], "cyan": ["#0a4a5a", "#2ac8d8", "#c0ffff"],
    "moon": ["#4a5a8a", "#c0d0ff", "#ffffff"], "amber": ["#5a2a05", "#e8961a", "#ffe08a"], "gold": ["#6a4a10", "#d8a83a", "#ffe89a"],
}
GLASS = ["#6a7a88", "#c8dce8", "#ffffff"]
CORK = ["#4a2e14", "#8f5c2a", "#d09450"]


def simple(recipe, seed=1):
    parts = recipe.split(":")
    kind = parts[0]
    col = parts[1] if len(parts) > 1 else "green"
    C = COLORS.get(col, COLORS["green"])
    c = Canvas(seed)
    glow = None
    if kind == "potion":
        size = int(parts[2]) if len(parts) > 2 else 2
        r = [0, 56, 66, 78][size]
        c.part(lambda d: d.ellipse([128 - r, 210 - 2 * r, 128 + r, 210], fill=255), GLASS, "plain")
        c.part(lambda d: d.ellipse([128 - r + 10, 210 - 2 * r + 34, 128 + r - 10, 202], fill=255), C, "glow", glow=True)
        c.part(lambda d: d.rectangle([110, 210 - 2 * r - 40, 146, 210 - 2 * r + 8], fill=255), GLASS, "plain")
        c.part(lambda d: d.rectangle([106, 210 - 2 * r - 62, 150, 210 - 2 * r - 36], fill=255), CORK, "bark")
        c.part(lambda d: d.ellipse([128 - r + 18, 210 - 2 * r + 20, 128 - r + 40, 210 - 2 * r + 58], fill=255), ["#ffffff", "#ffffff", "#ffffff"], "plain")
        glow = C[1]
    elif kind == "flask":
        c.part(lambda d: d.polygon([(100, 60), (156, 60), (160, 110), (190, 210), (66, 210), (96, 110)], fill=255), GLASS, "plain")
        c.part(lambda d: d.polygon([(90, 140), (166, 140), (182, 202), (74, 202)], fill=255), C, "glow", glow=True)
        c.part(lambda d: d.rectangle([98, 34, 158, 62], fill=255), CORK, "bark")
        glow = C[1]
    elif kind == "scroll":
        c.part(lambda d: d.rectangle([60, 70, 196, 190], fill=255), ["#8a6a3a", "#e8d4a0", "#fff4d8"], "cloth")
        c.part(lambda d: d.ellipse([44, 56, 80, 204], fill=255), ["#6a4a20", "#c8a868", "#f0dca8"], "cloth")
        c.part(lambda d: d.ellipse([176, 56, 212, 204], fill=255), ["#6a4a20", "#c8a868", "#f0dca8"], "cloth")
        c.part(lambda d: d.rectangle([118, 60, 138, 200], fill=255), C, "plain")
    elif kind == "talisman":
        c.part(lambda d: d.arc([64, 20, 192, 150], 200, 340, fill=255, width=8), ["#5a4a20", "#c8a858", "#fff0b0"], "metal")
        c.part(lambda d: d.ellipse([70, 96, 186, 212], fill=255), ["#5a4a20", "#c8a858", "#fff0b0"], "metal")
        c.part(lambda d: d.ellipse([92, 118, 164, 190], fill=255), C, "crystal", glow=True)
        glow = C[1]
    elif kind == "essence":
        c.part(lambda d: d.polygon([(128, 34), (180, 130), (172, 180), (128, 214), (84, 180), (76, 130)], fill=255), C, "glow", glow=True)
        glow = C[1]
    elif kind == "orb":
        c.part(lambda d: d.ellipse([50, 50, 206, 206], fill=255), C, "moss")
        c.part(lambda d: d.ellipse([92, 92, 164, 164], fill=255), [C[1], C[2], "#ffffff"], "glow", glow=True)
        glow = C[2]
    elif kind == "fang":
        c.part(lambda d: d.polygon([(80, 40), (150, 40), (176, 120), (150, 190), (120, 226), (128, 150), (104, 90)], fill=255), ["#8a8070", "#e8e0d0", "#ffffff"], "plain")
        c.part(lambda d: d.polygon([(80, 40), (150, 40), (146, 70), (88, 70)], fill=255), C, "plain")
    elif kind == "slime":
        c.part(lambda d: d.ellipse([40, 90, 216, 220], fill=255), C, "moss")
        c.part(lambda d: d.ellipse([90, 50, 170, 140], fill=255), C, "moss")
    elif kind == "crystal":
        for (x0, h, w) in [(76, 150, 40), (116, 190, 44), (160, 130, 36)]:
            c.part(lambda d, x0=x0, h=h, w=w: d.polygon([(x0, 220), (x0 + w, 220), (x0 + w, 220 - h + 30), (x0 + w / 2, 220 - h), (x0, 220 - h + 30)], fill=255), C, "crystal", glow=True)
        glow = C[1]
    elif kind == "dust":
        c.part(lambda d: d.chord([40, 120, 216, 260], 180, 360, fill=255), C, "moss", glow=True)
        for (x, y) in [(80, 90), (150, 70), (176, 110), (110, 50)]:
            c.part(lambda d, x=x, y=y: d.polygon([(x, y - 14), (x + 5, y), (x, y + 14), (x - 5, y)], fill=255), ["#ffffff", "#ffffff", "#ffffff"], "plain", glow=True)
        glow = C[1]
    elif kind == "ingot":
        c.part(lambda d: d.polygon([(40, 150), (100, 96), (216, 96), (216, 140), (156, 196), (40, 196)], fill=255), C, "metal", glow=True)
        c.part(lambda d: d.polygon([(40, 150), (100, 96), (216, 96), (156, 150)], fill=255), [C[1], C[2], "#ffffff"], "metal")
        glow = C[2]
    elif kind == "gem":
        c.part(lambda d: d.ellipse([60, 40, 196, 216], fill=255), C, "crystal", glow=True)
        c.part(lambda d: d.ellipse([90, 70, 140, 130], fill=255), [C[2], "#ffffff", "#ffffff"], "plain")
        glow = C[1]
    elif kind == "seed":
        c.part(lambda d: d.ellipse([64, 70, 192, 226], fill=255), ["#3a2410", "#8a5a2a", "#d8a060"], "bark")
        c.part(lambda d: d.polygon([(128, 80), (150, 30), (190, 20), (160, 60)], fill=255), ["#1e4a14", "#4a9a2e", "#a8f070"], "leaf")
        c.part(lambda d: d.polygon([(124, 84), (100, 36), (64, 34), (96, 70)], fill=255), ["#1e4a14", "#4a9a2e", "#a8f070"], "leaf")
        c.part(lambda d: d.ellipse([104, 120, 152, 176], fill=255), ["#4aa83a", "#b8ff8a", "#ffffff"], "glow", glow=True)
        glow = "#b8ff8a"
    elif kind == "book":
        c.part(lambda d: d.rectangle([52, 40, 204, 220], fill=255), ["#3a1e0e", "#7a3e1a", "#b8703a"], "cloth")
        c.part(lambda d: d.rectangle([186, 50, 204, 210], fill=255), ["#c8b890", "#f0e4c8", "#ffffff"], "plain")
        c.part(lambda d: d.rectangle([52, 40, 72, 220], fill=255), ["#6a4a10", "#d8a83a", "#ffe89a"], "metal")
        c.part(lambda d: d.polygon([(128, 70), (160, 130), (144, 130), (164, 170), (92, 170), (112, 130), (96, 130)], fill=255), ["#1e4a14", "#4a9a2e", "#a8f070"], "leaf", glow=True)
        glow = "#a8f070"
    elif kind == "page":
        c.part(lambda d: d.polygon([(64, 40), (192, 50), (184, 220), (56, 210)], fill=255), ["#8a7040", "#d8c490", "#f4e8c0"], "cloth")
        for y in range(80, 200, 22):
            c.part(lambda d, y=y: d.line([(80, y), (170, y + 4)], fill=255, width=5), ["#2a1a10", "#3a2a1a", "#4a3a2a"], "plain")
    elif kind == "amulet":
        c.part(lambda d: d.arc([70, 20, 186, 140], 200, 340, fill=255, width=7), ["#5a5a64", "#b8bcc8", "#ffffff"], "metal")
        c.part(lambda d: d.ellipse([78, 100, 178, 214], fill=255), ["#5a5a64", "#b8bcc8", "#ffffff"], "metal")
        c.part(lambda d: d.line([(100, 140), (156, 176)], fill=255, width=6), ["#2a2a30", "#3a3a40", "#4a4a50"], "plain")
    elif kind == "pouch":
        c.part(lambda d: d.ellipse([50, 80, 206, 226], fill=255), ["#3a2410", "#8a5a2a", "#c8904a"], "cloth")
        c.part(lambda d: d.polygon([(96, 50), (160, 50), (146, 96), (110, 96)], fill=255), ["#3a2410", "#8a5a2a", "#c8904a"], "cloth")
        c.part(lambda d: d.rectangle([100, 88, 156, 100], fill=255), COLORS["gold"], "metal")
        c.part(lambda d: d.ellipse([110, 140, 150, 180], fill=255), COLORS["gold"], "metal")
    elif kind == "rune":
        glyph_name = col
        c.part(lambda d: d.rounded_rectangle([44, 36, 212, 220], radius=40, fill=255), ["#2a2c30", "#6a6e74", "#a8acb2"], "stone")
        return (c, glyph_name)
    return c.finish(glow, fit=False)


# ---------------- Glyphen (Runen & UI) ----------------
def draw_glyph(d, name, cx=128, cy=128, s=1.0, width=14):
    def P(x, y):
        return (cx + x * s, cy + y * s)

    W = max(3, int(width * s))
    if name == "spin":
        pts = [P(math.cos(a) * (10 + a * 9), math.sin(a) * (10 + a * 9)) for a in np.linspace(0, 4 * math.pi, 50)]
        d.line(pts, fill=255, width=W, joint="curve")
    elif name == "shield":
        d.polygon([P(-50, -60), P(50, -60), P(50, 0), P(0, 65), P(-50, 0)], outline=255, width=W)
        d.line([P(0, -60), P(0, 65)], fill=255, width=W)
    elif name in ("arrow", "back"):
        sgn = -1 if name == "back" else 1
        d.line([P(-60 * sgn, 0), P(55 * sgn, 0)], fill=255, width=W)
        d.polygon([P(65 * sgn, 0), P(30 * sgn, -30), P(30 * sgn, 30)], fill=255)
    elif name == "horn":
        d.arc([cx - 60 * s, cy - 50 * s, cx + 60 * s, cy + 70 * s], 180, 330, fill=255, width=W)
        d.polygon([P(52, -20), P(75, -60), P(80, -5)], fill=255)
    elif name == "hammer":
        d.rectangle([cx - 55 * s, cy - 60 * s, cx + 55 * s, cy - 20 * s], fill=255)
        d.line([P(0, -20), P(0, 70)], fill=255, width=W)
    elif name == "fan":
        for a in (-30, 0, 30):
            r = math.radians(a - 90)
            d.line([P(0, 60), P(math.cos(r) * 70, math.sin(r) * 70)], fill=255, width=W)
    elif name == "drop":
        d.polygon([P(0, -65), P(40, 10), P(30, 45), P(0, 60), P(-30, 45), P(-40, 10)], fill=255)
    elif name == "eye":
        d.ellipse([cx - 65 * s, cy - 35 * s, cx + 65 * s, cy + 35 * s], outline=255, width=W)
        d.ellipse([cx - 20 * s, cy - 20 * s, cx + 20 * s, cy + 20 * s], fill=255)
    elif name == "rain":
        for x in (-45, -15, 15, 45):
            d.line([P(x + 12, -60), P(x - 12, 60)], fill=255, width=W)
    elif name == "flame":
        d.polygon([P(0, -70), P(35, -10), P(40, 30), P(0, 65), P(-40, 30), P(-35, -10), P(-10, -30)], fill=255)
    elif name == "shard":
        d.polygon([P(0, -75), P(25, 0), P(0, 75), P(-25, 0)], fill=255)
    elif name == "blink":
        for x in (-55, -20, 15):
            d.line([P(x, 0), P(x + 22, 0)], fill=255, width=W)
        d.polygon([P(65, 0), P(38, -25), P(38, 25)], fill=255)
    elif name == "orb":
        d.ellipse([cx - 55 * s, cy - 55 * s, cx + 55 * s, cy + 55 * s], outline=255, width=W)
        d.ellipse([cx - 22 * s, cy - 22 * s, cx + 22 * s, cy + 22 * s], fill=255)
    elif name == "meteor":
        d.ellipse([cx + 5 * s, cy + 5 * s, cx + 65 * s, cy + 65 * s], fill=255)
        for o in (-20, 0, 20):
            d.line([P(10 + o, 30 - o), P(-60 + o, -40 - o)], fill=255, width=W // 2 + 2)
    elif name == "flower":
        for a in range(0, 360, 72):
            r = math.radians(a)
            x, y = math.cos(r) * 38, math.sin(r) * 38
            d.ellipse([cx + (x - 22) * s, cy + (y - 22) * s, cx + (x + 22) * s, cy + (y + 22) * s], fill=255)
    elif name == "vine":
        pts = [P(-60 + t * 120, math.sin(t * 9) * 30) for t in np.linspace(0, 1, 40)]
        d.line(pts, fill=255, width=W, joint="curve")
        for t in (0.2, 0.5, 0.8):
            x, y = P(-60 + t * 120, math.sin(t * 9) * 30)
            d.ellipse([x - 12 * s, y - 24 * s, x + 12 * s, y], fill=255)
    elif name == "wolf":
        d.polygon([P(-50, -60), P(-20, -25), P(20, -25), P(50, -60), P(50, 10), P(0, 65), P(-50, 10)], fill=255)
    elif name == "bark":
        d.regular_polygon((cx, cy, 60 * s), 6, outline=255, width=W)
        d.line([P(-30, -20), P(30, 20)], fill=255, width=W // 2)
    elif name == "tree":
        d.line([P(0, 70), P(0, -10)], fill=255, width=W)
        d.ellipse([cx - 60 * s, cy - 75 * s, cx + 60 * s, cy + 5 * s], fill=255)
        for x in (-35, 35):
            d.line([P(0, 50), P(x, 70)], fill=255, width=W // 2)
    elif name == "star":
        pts = []
        for i in range(10):
            r = (70 if i % 2 == 0 else 30) * s
            a = math.radians(i * 36 - 90)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        d.polygon(pts, fill=255)
    elif name == "check":
        d.line([P(-55, 0), P(-15, 45), P(60, -50)], fill=255, width=W + 4, joint="curve")
    elif name == "next":
        d.polygon([P(-40, -60), P(55, 0), P(-40, 60)], fill=255)
    elif name == "gear":
        d.ellipse([cx - 45 * s, cy - 45 * s, cx + 45 * s, cy + 45 * s], outline=255, width=W + 6)
        for a in range(0, 360, 45):
            r = math.radians(a)
            d.line([P(math.cos(r) * 40, math.sin(r) * 40), P(math.cos(r) * 70, math.sin(r) * 70)], fill=255, width=W + 4)
    elif name == "crown":
        d.polygon([P(-65, 45), P(-65, -35), P(-30, 5), P(0, -55), P(30, 5), P(65, -35), P(65, 45)], fill=255)
    elif name == "coin":
        d.ellipse([cx - 60 * s, cy - 60 * s, cx + 60 * s, cy + 60 * s], fill=255)
    elif name == "plus":
        d.line([P(-55, 0), P(55, 0)], fill=255, width=W + 8)
        d.line([P(0, -55), P(0, 55)], fill=255, width=W + 8)
    elif name == "scroll":
        d.rectangle([cx - 50 * s, cy - 60 * s, cx + 50 * s, cy + 60 * s], fill=255)
    else:
        d.ellipse([cx - 40 * s, cy - 40 * s, cx + 40 * s, cy + 40 * s], fill=255)


def rune(glyph, color, ult=False, seed=1):
    c, _ = simple(f"rune:{glyph}", seed)
    mask = Image.new("L", (S, S), 0)
    draw_glyph(ImageDraw.Draw(mask), glyph, 128, 128, 0.95)
    col = "#%02x%02x%02x" % tuple(color)
    lay = textured_fill((S, S), mask, [col, col, "#ffffff"], "glow", 3, False)
    c.img.alpha_composite(lay)
    c.glow.paste(255, (0, 0), mask)
    if ult:
        border = Image.new("L", (S, S), 0)
        ImageDraw.Draw(border).rounded_rectangle([44, 36, 212, 220], radius=40, outline=255, width=12)
        c.img.alpha_composite(textured_fill((S, S), border, ["#6a4a10", "#d8a83a", "#ffe89a"], "metal", 5))
    return c.finish(col, fit=False)
