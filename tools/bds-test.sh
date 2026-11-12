#!/usr/bin/env bash
# Startet einen lokalen Bedrock Dedicated Server mit den Packs, führt Befehle aus und gibt das Log aus.
# Nutzung: BDS=/pfad/zum/server tools/bds-test.sh <sekunden> "befehl1" "befehl2" ...
set -u
BDS="${BDS:?BDS-Pfad setzen}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WAIT="${1:-60}"; shift || true
W="$BDS/worlds/cdwtest"
mkdir -p "$W"
rm -rf "$BDS/development_behavior_packs/cdw_bp" "$BDS/development_resource_packs/cdw_rp"
mkdir -p "$BDS/development_behavior_packs" "$BDS/development_resource_packs"
cp -r "$ROOT/packs/BP" "$BDS/development_behavior_packs/cdw_bp"
cp -r "$ROOT/packs/RP" "$BDS/development_resource_packs/cdw_rp"
BPU=$(python3 -c "import json;print(json.load(open('$ROOT/packs/BP/manifest.json'))['header']['uuid'])")
RPU=$(python3 -c "import json;print(json.load(open('$ROOT/packs/RP/manifest.json'))['header']['uuid'])")
VER=$(python3 -c "import json;print(json.load(open('$ROOT/packs/BP/manifest.json'))['header']['version'])")
echo "[{\"pack_id\":\"$BPU\",\"version\":$VER}]" > "$W/world_behavior_packs.json"
echo "[{\"pack_id\":\"$RPU\",\"version\":$VER}]" > "$W/world_resource_packs.json"
FIFO="$BDS/cmd.fifo"; rm -f "$FIFO"; mkfifo "$FIFO"
cd "$BDS"
( LD_LIBRARY_PATH=. ./bedrock_server < "$FIFO" > "$BDS/run.log" 2>&1 ) &
PID=$!
exec 3>"$FIFO"
for i in $(seq 1 60); do grep -q "Server started" "$BDS/run.log" 2>/dev/null && break; sleep 1; done
sleep 3
for c in "$@"; do echo "$c" >&3; sleep 2; done
sleep "$WAIT"
echo "stop" >&3
sleep 5
exec 3>&-
kill $PID 2>/dev/null
wait $PID 2>/dev/null
rm -f "$FIFO"
cat "$BDS/run.log"
