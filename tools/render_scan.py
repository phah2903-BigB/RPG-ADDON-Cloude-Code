"""Rendert einen Block-Scan (aus dem BDS-Log) als isometrische Vorschau. Nutzung: render_scan.py log.txt out.png [texturpaket]"""
import sys, json, os, re
import numpy as np
from PIL import Image, ImageDraw
log, out = sys.argv[1], sys.argv[2]
tp = sys.argv[3] if len(sys.argv) > 3 else None
parts = {}
for line in open(log, encoding="utf8", errors="ignore"):
    m = re.search(r"CDW_SCAN (\d+) (.*)$", line.rstrip("\n"))
    if m:
        parts[int(m.group(1))] = m.group(2)
data = json.loads("".join(parts[k] for k in sorted(parts)))
pal, arr = data["pal"], np.array(data["out"]).reshape(-1, 4)
NATURAL = re.compile(r"minecraft:(stone|dirt|grass_block|gravel|granite|diorite|andesite|tuff|deepslate|bedrock|water|lava|coal_ore|iron_ore|copper_ore|gold_ore|redstone_ore|lapis_ore|diamond_ore|emerald_ore|deepslate_\w+_ore|calcite|smooth_basalt|amethyst_block|budding_amethyst|clay|sand|red_sand|terracotta|\w+_terracotta|snow|powder_snow|ice|packed_ice|dripstone_block|pointed_dripstone|glow_lichen|cave_vines\w*|moss_carpet|short_grass|tall_grass|\w+_leaves|\w+_log|vine|kelp\w*|seagrass|azalea|flowering_azalea|big_dripleaf|small_dripleaf_block|cobweb|infested_\w+|copper_ore|raw_\w+|mud|sculk\w*|spore_blossom|hanging_roots|\w+_flower|poppy|dandelion|fern|large_fern|sweet_berry_bush|pumpkin|melon_block|bamboo)$")
if len(sys.argv) > 4 and sys.argv[4] == "built":
    keep = [i for i, b in enumerate(pal) if not NATURAL.match(b)]
    arr = arr[np.isin(arr[:, 3], keep)]
cache = {}
def color(bid):
    if bid in cache: return cache[bid]
    name = bid.split(":")[1]
    c = None
    if tp:
        for cand in [name, name.replace("_block", ""), name + "_top", name.replace("stone_bricks", "stonebrick"), name.replace("_planks", "").replace("oak", "planks_oak"), "log_" + name.replace("_log", "").replace("_wood", "")]:
            f = os.path.join(tp, "textures", "blocks", cand + ".png")
            if os.path.exists(f):
                im = np.asarray(Image.open(f).convert("RGBA").resize((8, 8)), dtype=np.float32)
                a = im[..., 3:] / 255
                if a.sum() > 0:
                    c = tuple(int(v) for v in (im[..., :3] * a).sum((0, 1)) / a.sum())
                    break
    if c is None:
        h = abs(hash(name)) % 360
        import colorsys
        r, g, b = colorsys.hsv_to_rgb(h / 360, 0.35, 0.75)
        c = (int(r * 255), int(g * 255), int(b * 255))
        if "leaves" in name: c = (70, 140, 60)
        if "grass" in name: c = (90, 150, 60)
        if "wood" in name or "log" in name: c = (110, 80, 50)
        if name.startswith("cdw"): c = (90, 200, 255)
    cache[bid] = c
    return c
S = 6
mx, my, mz = arr[:, 0].max() + 1, arr[:, 1].max() + 1, arr[:, 2].max() + 1
W = int((mx + mz) * S * 1.0) + 20
H = int((mx + mz) * S * 0.5 + my * S) + 20
img = Image.new("RGB", (W, H), (40, 44, 52))
d = ImageDraw.Draw(img)
order = sorted(arr.tolist(), key=lambda b: (b[0] + b[2], b[1]))
occ = set((b[0], b[1], b[2]) for b in arr.tolist())
for x, y, z, i in order:
    if (x + 1, y, z) in occ and (x, y + 1, z) in occ and (x, y, z + 1) in occ:
        continue
    c = color(pal[i])
    cx = (x - z) * S + (mz) * S + 10
    cy = (x + z) * S * 0.5 - y * S + my * S + 10
    top = [(cx, cy), (cx + S, cy + S * 0.5), (cx, cy + S), (cx - S, cy + S * 0.5)]
    left = [(cx - S, cy + S * 0.5), (cx, cy + S), (cx, cy + 2 * S), (cx - S, cy + 1.5 * S)]
    right = [(cx, cy + S), (cx + S, cy + S * 0.5), (cx + S, cy + 1.5 * S), (cx, cy + 2 * S)]
    d.polygon(top, fill=c)
    d.polygon(left, fill=tuple(int(v * 0.72) for v in c))
    d.polygon(right, fill=tuple(int(v * 0.55) for v in c))
img.save(out)
print(out, img.size, len(arr), "Blöcke")
