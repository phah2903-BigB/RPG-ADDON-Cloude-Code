#!/usr/bin/env bash
# Startet einen lokalen Bedrock Dedicated Server mit den Packs, führt Befehle aus und gibt das Log aus.
# Nutzung: BDS=/pfad/zum/server [LEVEL=name] [E2E=1] tools/bds-test.sh <sekunden> "befehl1" ...
#   E2E=1 installiert zusätzlich das Testpack (tools/e2e) und aktiviert "Beta-APIs" in der Testwelt.
set -u
BDS="${BDS:?BDS-Pfad setzen}"
LEVEL="${LEVEL:-cdwtest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WAIT="${1:-60}"; shift || true
sed -i "s/^level-name=.*/level-name=$LEVEL/" "$BDS/server.properties"
W="$BDS/worlds/$LEVEL"
start_server() {
  FIFO="$BDS/cmd.fifo"; rm -f "$FIFO"; mkfifo "$FIFO"
  ( cd "$BDS" && LD_LIBRARY_PATH=. ./bedrock_server < "$FIFO" > "$BDS/run.log" 2>&1 ) &
  PID=$!
  exec 3>"$FIFO"
  for i in $(seq 1 90); do grep -q "Server started" "$BDS/run.log" 2>/dev/null && break; sleep 1; done
}
stop_server() {
  echo "stop" >&3; sleep 6; exec 3>&-; kill $PID 2>/dev/null; wait $PID 2>/dev/null; rm -f "$FIFO"
}
if [ ! -f "$W/level.dat" ]; then start_server; sleep 3; stop_server; fi
rm -rf "$BDS/development_behavior_packs/cdw_bp" "$BDS/development_resource_packs/cdw_rp" "$BDS/development_behavior_packs/cdw_e2e"
mkdir -p "$BDS/development_behavior_packs" "$BDS/development_resource_packs"
cp -r "$ROOT/packs/BP" "$BDS/development_behavior_packs/cdw_bp"
cp -r "$ROOT/packs/RP" "$BDS/development_resource_packs/cdw_rp"
uuid() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['header']['uuid'])" "$1"; }
VER=$(python3 -c "import json;print(json.load(open('$ROOT/packs/BP/manifest.json'))['header']['version'])")
BPS="{\"pack_id\":\"$(uuid "$ROOT/packs/BP/manifest.json")\",\"version\":$VER}"
if [ "${E2E:-0}" = "1" ]; then
  cp -r "$ROOT/tools/e2e/BP" "$BDS/development_behavior_packs/cdw_e2e"
  BPS="$BPS,{\"pack_id\":\"$(uuid "$ROOT/tools/e2e/BP/manifest.json")\",\"version\":[1,0,0]}"
  python3 -I - "$ROOT/tools" "$W/level.dat" <<'PY'
import sys; sys.path.insert(0, sys.argv[1])
import nbt
ver, name, root = nbt.load(sys.argv[2])
exp = root.setdefault("experiments", (10, {}))[1]
exp["gametest"] = (1, 1); exp["experiments_ever_used"] = (1, 1); exp["saved_with_toggled_experiments"] = (1, 1)
root["commandsEnabled"] = (1, 1)
nbt.save(sys.argv[2], ver, name, root)
PY
fi
echo "[$BPS]" > "$W/world_behavior_packs.json"
echo "[{\"pack_id\":\"$(uuid "$ROOT/packs/RP/manifest.json")\",\"version\":$VER}]" > "$W/world_resource_packs.json"
start_server
sleep 3
for c in "$@"; do echo "$c" >&3; sleep 2; done
sleep "$WAIT"
stop_server
cat "$BDS/run.log"
