# Erstellt dist/*.mcpack und dist/*.mcaddon aus packs/BP und packs/RP.
import os, sys, zipfile
root = sys.argv[1]
dist = os.path.join(root, "dist")
name = "Chroniken_des_Weltenbaums"
def add_dir(z, src, prefix):
    for base, _, files in os.walk(src):
        for f in sorted(files):
            full = os.path.join(base, f)
            rel = os.path.relpath(full, src)
            z.write(full, os.path.join(prefix, rel) if prefix else rel)
bp = os.path.join(root, "packs", "BP"); rp = os.path.join(root, "packs", "RP")
for p, label in ((bp, "BP"), (rp, "RP")):
    with zipfile.ZipFile(os.path.join(dist, f"{name}_{label}.mcpack"), "w", zipfile.ZIP_DEFLATED) as z:
        add_dir(z, p, "")
with zipfile.ZipFile(os.path.join(dist, f"{name}.mcaddon"), "w", zipfile.ZIP_DEFLATED) as z:
    add_dir(z, bp, f"{name}_BP")
    add_dir(z, rp, f"{name}_RP")
for f in sorted(os.listdir(dist)):
    print(f"  dist/{f}  {os.path.getsize(os.path.join(dist, f)) // 1024} KB")
