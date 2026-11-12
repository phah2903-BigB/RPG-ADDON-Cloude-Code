# Entwicklung

## Aufbau
```
src/            TypeScript (Script-API): core/ systems/ world/ ui/ data/
src/data/       Inhalte: Klassen, Items, Monster, Quests, Balancing (auch von den Generatoren genutzt)
tools/gen/      Generator: erzeugt alle Pack-JSONs (Items, Blöcke, Entities, Modelle, Animationen, Sprache …)
tools/textures/ Texturgenerator (Python/PIL): Icons, Kreaturen, Rüstung, Blöcke, UI, Partikel
tools/e2e/      Test-Behavior-Pack mit simuliertem Spieler (NICHT ausliefern)
packs/BP, RP    Fertige Packs (generiert, bridge.-v2-kompatibel, siehe config.json)
dist/           .mcaddon / .mcpack
```

## Befehle
| Befehl | Zweck |
|---|---|
| `npm run typecheck` | TypeScript prüfen (offizielle Typen @minecraft/server 2.8.0) |
| `npm run gen` | Pack-JSONs neu erzeugen |
| `npm run textures` | Texturen neu erzeugen |
| `npm run build` | Script bündeln + `dist/` packen |
| `npm run validate` | Referenzen prüfen (IDs, Texturen, Geometrien) |
| `npm run all` | alles nacheinander |

## Tests auf dem Bedrock Dedicated Server
```
BDS=/pfad/zum/bedrock-server tools/bds-test.sh 120 "scriptevent cdw:selftest all"
BDS=/pfad/zum/bedrock-server LEVEL=cdwe2e E2E=1 tools/bds-test.sh 360 "scriptevent cdwtest:run"
```
- **Selbsttest:** alle Items, Blöcke, Entities, Hain (Stufe 0–5) und alle 6 Dungeons werden erzeugt.
- **E2E-Test (47 Prüfungen):** Startitems, Hain pflanzen, Dialoge, Klassenwahl, Runen, Kampf/XP,
  Schadensskalierung, Verteidigung, Wegstein, Dungeon (Treppe begehbar, Wellen, Rätsel, Boss, Herz),
  Wirtschaft (Kauf, Heiltrank, Schmied, Verkauf, Beute), Heroisch-Modus, Weltboss.
- Vorschau-Werkzeuge: `/scriptevent cdw:debug scan …` + `tools/render_scan.py` (isometrische Ansicht).

## Debug (nur mit Cheats/OP)
`/scriptevent cdw:debug <befehl>` – z. B. `state <Spieler>`, `main <idx> <stufe>`, `gold <Spieler> <n>`,
`dungeon <id>`, `hubat <x> <z>`, `hubstage <n>`, `heroic <id>`.
