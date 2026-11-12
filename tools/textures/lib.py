"""Hilfsfunktionen für den prozeduralen Texturgenerator (gemalter Natur-Fantasy-Stil)."""
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def clamp(a):
    return np.clip(a, 0, 255)


_noise_cache = {}


def noise(w, h, scale, seed, octaves=3):
    """Weiches Wertrauschen 0..1 (mehrere Oktaven)."""
    key = (w, h, round(scale, 3), seed, octaves)
    if key in _noise_cache:
        return _noise_cache[key]
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), dtype=np.float32)
    amp, total = 1.0, 0.0
    s = scale
    for _ in range(octaves):
        gw, gh = max(2, int(w / s) + 2), max(2, int(h / s) + 2)
        grid = (rng.random((gh, gw)) * 255).astype(np.uint8)
        img = Image.fromarray(grid, "L").resize((w, h), Image.BICUBIC)
        out += np.asarray(img, dtype=np.float32) / 255.0 * amp
        total += amp
        amp *= 0.5
        s = max(1.0, s / 2)
    out /= total
    _noise_cache[key] = out
    return out


def streaks(w, h, seed, vertical=True, density=0.35):
    rng = np.random.default_rng(seed)
    if vertical:
        cols = rng.random(w)
        base = np.tile(cols, (h, 1))
        n = noise(w, h, max(2, h / 2), seed + 3, 2)
    else:
        rows = rng.random(h)
        base = np.tile(rows[:, None], (1, w))
        n = noise(w, h, max(2, w / 2), seed + 3, 2)
    return np.clip(base * density + n * (1 - density), 0, 1)


PATTERNS = {}


def pattern(name):
    def deco(fn):
        PATTERNS[name] = fn
        return fn
    return deco


@pattern("plain")
def p_plain(w, h, seed):
    return 0.5 + (noise(w, h, 6, seed) - 0.5) * 0.5


@pattern("fur")
def p_fur(w, h, seed):
    s = streaks(w, h, seed, vertical=True, density=0.55)
    return 0.35 + s * 0.65


@pattern("bark")
def p_bark(w, h, seed):
    s = streaks(w, h, seed, vertical=True, density=0.7)
    cracks = (noise(w, h, 3, seed + 7, 2) > 0.62).astype(np.float32) * -0.35
    return np.clip(0.3 + s * 0.7 + cracks, 0, 1)


@pattern("moss")
def p_moss(w, h, seed):
    n = noise(w, h, 4, seed, 3)
    speck = (noise(w, h, 1.5, seed + 9, 1) > 0.72).astype(np.float32) * 0.25
    return np.clip(0.25 + n * 0.7 + speck, 0, 1)


@pattern("stone")
def p_stone(w, h, seed):
    n = noise(w, h, 8, seed, 3)
    cracks = (np.abs(noise(w, h, 6, seed + 5, 2) - 0.5) < 0.03).astype(np.float32) * -0.4
    return np.clip(0.35 + n * 0.6 + cracks, 0, 1)


@pattern("cloth")
def p_cloth(w, h, seed):
    folds = streaks(w, h, seed, vertical=True, density=0.4)
    weave = ((np.indices((h, w)).sum(axis=0) % 2) * 0.06).astype(np.float32)
    return np.clip(0.35 + folds * 0.55 + weave, 0, 1)


@pattern("metal")
def p_metal(w, h, seed):
    y = np.linspace(1, 0, h, dtype=np.float32)[:, None] * np.ones((1, w), np.float32)
    scratch = (noise(w, h, 1.2, seed, 1) > 0.85).astype(np.float32) * 0.15
    return np.clip(0.3 + y * 0.6 + scratch + (noise(w, h, 5, seed + 1) - 0.5) * 0.15, 0, 1)


@pattern("chitin")
def p_chitin(w, h, seed):
    bands = (np.sin(np.linspace(0, math.pi * max(2, h / 6), h))[:, None] * 0.5 + 0.5) * np.ones((1, w))
    return np.clip(0.3 + bands * 0.45 + noise(w, h, 4, seed) * 0.25, 0, 1).astype(np.float32)


@pattern("scale")
def p_scale(w, h, seed):
    yy, xx = np.indices((h, w)).astype(np.float32)
    s = 5.0
    cell = (np.sin(xx / s * math.pi + (yy // s) * math.pi / 2) * np.sin(yy / s * math.pi)) * 0.5 + 0.5
    return np.clip(0.3 + cell * 0.5 + noise(w, h, 4, seed) * 0.2, 0, 1)


@pattern("leaf")
def p_leaf(w, h, seed):
    n = noise(w, h, 3, seed, 2)
    clumps = (noise(w, h, 2, seed + 4, 1) > 0.55).astype(np.float32) * 0.2
    return np.clip(0.2 + n * 0.7 + clumps, 0, 1)


@pattern("wrap")
def p_wrap(w, h, seed):
    yy = np.indices((h, w))[0].astype(np.float32)
    stripes = (np.sin(yy / 2.2 + noise(w, h, 6, seed) * 4) * 0.5 + 0.5)
    return np.clip(0.4 + stripes * 0.45 + noise(w, h, 3, seed + 1) * 0.15, 0, 1)


@pattern("feather")
def p_feather(w, h, seed):
    yy, xx = np.indices((h, w)).astype(np.float32)
    f = (np.sin((xx + yy * 0.6) / 2.5) * 0.5 + 0.5)
    return np.clip(0.35 + f * 0.35 + noise(w, h, 4, seed) * 0.3, 0, 1)


@pattern("crystal")
def p_crystal(w, h, seed):
    yy, xx = np.indices((h, w)).astype(np.float32)
    facets = (np.abs(((xx * 0.7 + yy) % 12) - 6) / 6.0)
    return np.clip(0.35 + facets * 0.5 + noise(w, h, 5, seed) * 0.15, 0, 1)


@pattern("glow")
def p_glow(w, h, seed):
    yy, xx = np.indices((h, w)).astype(np.float32)
    cx, cy = (w - 1) / 2, (h - 1) / 2
    d = np.sqrt(((xx - cx) / max(1, w / 2)) ** 2 + ((yy - cy) / max(1, h / 2)) ** 2)
    return np.clip(1.0 - d * 0.45 + noise(w, h, 3, seed) * 0.15, 0, 1)


@pattern("shadow")
def p_shadow(w, h, seed):
    n = noise(w, h, 5, seed, 3)
    wisps = (np.abs(noise(w, h, 7, seed + 2, 2) - 0.5) < 0.05).astype(np.float32) * 0.5
    return np.clip(0.15 + n * 0.5 + wisps, 0, 1)


@pattern("ice")
def p_ice(w, h, seed):
    n = noise(w, h, 6, seed, 2)
    cracks = (np.abs(noise(w, h, 5, seed + 3, 2) - 0.5) < 0.025).astype(np.float32) * 0.45
    return np.clip(0.45 + n * 0.4 + cracks, 0, 1)


@pattern("skin")
def p_skin(w, h, seed):
    return np.clip(0.45 + (noise(w, h, 6, seed, 3) - 0.5) * 0.45, 0, 1)


def ramp(colors, t):
    """Mehrfarbiger Verlauf: colors = [dunkel, mittel, hell], t = 0..1."""
    cs = [hexrgb(c) if isinstance(c, str) else np.array(c, np.float32) for c in colors]
    t = np.clip(t, 0, 1)
    n = len(cs) - 1
    idx = np.minimum((t * n).astype(int), n - 1)
    frac = (t * n - idx)[..., None]
    a = np.stack(cs)[idx]
    b = np.stack(cs)[idx + 1]
    return a * (1 - frac) + b * frac


def shade(base_hex, w, h, pat, seed, face="north", dark=None, light=None):
    """Malt eine Fläche: Farbverlauf nach Muster + Flächenlicht + Randabdunklung."""
    base = hexrgb(base_hex)
    d = hexrgb(dark) if dark else base * 0.45
    l = hexrgb(light) if light else np.minimum(base * 1.35 + 20, 255)
    t = PATTERNS.get(pat, p_plain)(w, h, seed)
    rgb = ramp([d, base, l], t)
    fl = {"up": 1.15, "down": 0.65, "north": 1.0, "south": 0.88, "east": 0.93, "west": 0.93}.get(face, 1)
    if face not in ("up", "down"):
        grad = np.linspace(1.06, 0.84, h, dtype=np.float32)[:, None]
        rgb = rgb * grad[..., None]
    rgb = rgb * fl
    # Randabdunklung (Ambient Occlusion)
    if w > 2 and h > 2:
        yy, xx = np.indices((h, w)).astype(np.float32)
        ex = np.minimum(xx, w - 1 - xx)
        ey = np.minimum(yy, h - 1 - yy)
        edge = np.minimum(ex, ey)
        ao = np.where(edge < 1, 0.78, np.where(edge < 2, 0.92, 1.0))
        rgb = rgb * ao[..., None]
    return clamp(rgb)


def outline(img, color=(26, 18, 12, 255), width=1):
    """Fügt eine dunkle Kontur um nicht-transparente Pixel hinzu (Stil des Texturpakets)."""
    a = np.asarray(img.split()[-1], dtype=np.uint8)
    mask = Image.fromarray((a > 40).astype(np.uint8) * 255, "L")
    grown = mask.filter(ImageFilter.MaxFilter(width * 2 + 1))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ol = Image.new("RGBA", img.size, color)
    out.paste(ol, (0, 0), grown)
    out.alpha_composite(img)
    return out


def textured_fill(size, mask, colors, pat, seed, vertical_light=True):
    """Füllt eine Maske (L) mit einer schattierten Materialtextur."""
    w, h = size
    t = PATTERNS.get(pat, p_plain)(w, h, seed)
    if vertical_light:
        yy, xx = np.indices((h, w)).astype(np.float32)
        t = np.clip(t * 0.6 + (1 - (xx + (h - yy)) / (w + h)) * 0.0 + (1 - yy / h) * 0.25 + (xx / w) * 0.15, 0, 1)
    rgb = ramp(colors, t)
    arr = np.zeros((h, w, 4), np.uint8)
    arr[..., :3] = clamp(rgb).astype(np.uint8)
    arr[..., 3] = np.asarray(mask, dtype=np.uint8)
    return Image.fromarray(arr, "RGBA")


def rot_points(pts, angle_deg, cx, cy):
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for (x, y) in pts]


def save(img, path):
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)


def mers_from(img, emissive_mask=None, metal=0, rough=200):
    """Erzeugt eine MERS-Karte (Metallisch, Emissiv, Rauheit, Subsurface)."""
    w, h = img.size
    arr = np.zeros((h, w, 4), np.uint8)
    arr[..., 0] = metal
    arr[..., 2] = rough
    arr[..., 3] = 255
    if emissive_mask is not None:
        arr[..., 1] = np.asarray(emissive_mask, dtype=np.uint8)
    return Image.fromarray(arr, "RGBA")


def rng(seed):
    return random.Random(seed)
