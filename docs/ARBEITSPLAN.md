# Chroniken des Weltenbaums – Arbeitsplan & Game-Design

**Ein RPG-Add-on für Minecraft Bedrock** (Realm · PS5 · Android) · kompatibel mit **Natur Fantasy 64x (PBR)**
Status: **Plan zur Freigabe**, es wird noch nichts gebaut.

---

## 1. Rechercheergebnisse (kurz)

### 1.1 Was ein gutes (MMO)RPG ausmacht
| Säule | Erkenntnis | Umsetzung hier |
|---|---|---|
| **Fortschritt** | Der wichtigste Motor ist das Gefühl von Wachstum und einer Reise, nicht nur steigende Zahlen. | Level, Talente, sichtbarer Wandel der Welt (der Hain wächst mit jedem Akt) |
| **Kampf + Beute** | Der Kern besteht aus Kampf, Monstern und Beute. | 10 Waffentypen, Seltenheitsstufen, Zufallsaffixe, Bosse |
| **Klassen** | Unterschiedliche Stärken und Schwächen sorgen für Individualität. | 4 Klassen, die sich zu zweit gut ergänzen |
| **Spielschleifen** | Kern-Loop (Kampf) → Fortschritts-Loop (Level/Gear) → Langzeit-Loop (Endgame). | siehe 3.1 |
| **Quests** | Hol- und Töte-Quests sind okay, brauchen aber eine Wendung, einen Story-Bezug oder neue Mechaniken. Lieber wenige und gute Nebenquests. | jede Quest bekommt eine Wendung bzw. einen Lore-Bezug; Questtypen werden gemischt |
| **Endgame** | Auf Maximalstufe braucht es neue Ziele. | heroische Dungeons, Weltboss, Erfolge und Titel, Prestige |
| **Soziales** | Gruppeninhalte (Dungeons, Gruppenquests) binden Spieler. | Koop für 2 Spieler: geteilte Story, geteilte Kills, skalierte Bosse |
| **Wirtschaft** | Crafting enttäuscht, wenn die Ergebnisse nicht mit Beute mithalten. Ruf schaltet Vorteile frei. | Schmied-Upgrades +1 bis +10, Ruf beim Hain schaltet Händlerware frei |
| **XP-Kurve** | Lieber Gesamt-XP speichern, dann lässt sich die Kurve später anpassen. Höhere Monster geben mehr XP, damit die Zeit pro Level nur langsam steigt. Von Hand nachjustieren. | Formel + Simulationsskript, Gesamt-XP-Speicherung |

### 1.2 Technischer Stand Bedrock (Nov 2026)
- **Aktuelle Version:** Spiel 1.26.63 (Retail), Script-API `@minecraft/server` 2.11 stable.
- **Zielversion:** `@minecraft/server` **2.8.0** + `@minecraft/server-ui` **2.1.0**, `min_engine_version` **1.26.30**. Gründe:
  - Ab 2.8.0 gibt es die stabile **Locator-Bar-API** (`LocationWaypoint`). Damit lassen sich **echte Quest-Wegpunkte** in die Bedrock-Wegpunktleiste setzen.
  - Ab 2.8.0 ist `world.beforeEvents.entityHurt` stabil und der **Schaden ist veränderbar**. Damit sind Krits, Verteidigung, Monsterstufen und skalierte Lebenspunkte möglich, ohne `player.json` zu überschreiben.
  - Benutzerdefinierte Slash-Befehle, Kamera-API, Strukturen, Item-Cooldowns, ItemStack-Daten und Lore sind alle **stabil**.
- **Keine Experimente / Beta-APIs:** Realms sind dafür nicht verlässlich dokumentiert, und ein Experiment lässt sich nicht mehr aus der Welt entfernen. Darum nutze ich **nur stabile APIs**.
- **Kein JSON-UI-HUD:** JSON-UI ist offiziell veraltet (Ore UI ersetzt es) und bricht bei Updates. Stattdessen nutze ich **Aktionsleiste, Titel, Bossleisten und Server-UI-Formulare**, die auf PS5 (Controller) und Android (Touch) identisch funktionieren.
- **Installation auf PS5:** Die Konsole kann keine Dateien importieren. Der Weg führt über **Android**: Add-on importieren, dann in den Realm-Einstellungen die Packs aktivieren oder die Welt hoch- bzw. herunterladen. Eine Schritt-für-Schritt-Anleitung liegt bei.
- **Performance (Android):** Keine Befehle pro Tick, keine großen fill/clone-Aufrufe zur Laufzeit, Arbeit wird über mehrere Ticks verteilt, Monsterdichte wird begrenzt. Benannte Vanilla-Mobs werden vermieden, weil Namensschilder das Despawnen verhindern.

### 1.3 Analyse Texturpaket „Natur Fantasy“ (v0.35.6)
- Items und Blöcke **64×64**, Kreaturen **256×** (4× Vanilla), gemalter, detailreicher Stil mit dunklen Konturen.
- **PBR / Vibrant Visuals** (`texture_set.json` + MERS-Karten), 5 Subpacks (Nebel, Erzleuchten).
- Überschreibt Vanilla-Dateien und `villager_v2.entity.json`. Es gibt **kein** `ui/`-JSON und keine Modelle.
- **Kompatibilitätsregeln für mein Add-on:**
  1. Ich überschreibe **keine einzige** Vanilla-Datei. Alles liegt unter einem eigenen Namespace (`cdw:`, `textures/cdw/…`).
  2. `item_texture.json`, `terrain_texture.json`, Sounds und Sprachdateien werden von Bedrock **zusammengeführt**. Das ist konfliktfrei.
  3. Stil-Angleichung: Icons in 64×, Kreaturen in 256×, gleiche Konturfarben und Sättigung, **MERS-Leuchtkarten** für Runen, Augen und Magie. Unter Vibrant Visuals leuchtet es, ohne VV funktioniert alles normal.
  4. Das Add-on funktioniert auch **ohne** Natur Fantasy.

---

## 2. Story: „Das Welken“

**Welt-Lore:** Der Weltenbaum **Ylvaris** nährt das Land über fünf **Wurzelherzen**. Der Erzdruide **Morvath** wollte ewiges Leben und hat die Wurzeln vergiftet. Daraus entsteht **das Welken**, eine Fäulnis, die Tiere und Pflanzen in Monster verwandelt. Seine Schwester **Sylva**, die letzte Hüterin, sucht neue **Wächter**: euch.

**Einleitung (erster Login):** Ein Flüstern im Chat und ein Titel erscheinen, dazu ein **Samen des Weltenbaums** im Inventar. Ihr pflanzt ihn an einem Ort eurer Wahl. Eine **Kamerafahrt** zeigt, wie der **Hain des Erwachens** emporwächst. Sylva erscheint und erklärt in einem Dialog alles Wichtige: was passiert ist, was ihr tun müsst, wie das Abenteuerbuch, die Wegpunkte und die Klassen funktionieren.

| Akt | Region / Dungeon | Stufe | Inhalt & Wendung | Boss |
|---|---|---|---|---|
| **Prolog** | Hain des Erwachens | 1–3 | Samen pflanzen, Klasse wählen (Sylvas Prüfung), erste Fähigkeit, Hain gegen eine Welle von Mooslingen verteidigen | – |
| **I – Erwachen** | Der Dornenhain | 3–10 | Waldläufer **Kael** stößt dazu. Spurensuche, Wurzelherz befreien | **Rindenschreck**, der verderbte Ent |
| **II – Moor der Seufzer** | Seufzermoor | 10–17 | Die Sumpfhexe **Morgra** wirkt wie die Feindin, ist aber selbst verflucht. **Entscheidung:** erlösen oder verbannen, mit unterschiedlicher Belohnung | **Moorschlund** (Riesenkröte) |
| **III – Glutsand** | Tempel der Glut | 17–24 | Ruinen der Weltenbaum-Priester. Rätsel mit Runensteinen, Lore-Seiten erzählen Morvaths Fall | **Glutkönigin** (Skorpion) |
| **IV – Frostkrone** | Frostkrone-Feste | 24–32 | **Verrat:** Kael spioniert für Morvath, um seine Schwester zu retten. Danach folgt seine Läuterungsquest | **Hrimgar**, der Frostkoloss |
| **V – Schattenwurzel** | Die Tiefe | 32–38 | Abstieg in die Wurzelhöhlen, Verteidigung des letzten Wurzelherzens | **Kristallmutter** |
| **Finale** | Zitadelle des Welkens | 38–40 | Turmaufstieg mit Wellen | **Morvath** (Phase 1: Druide, Phase 2: Welkenbestie) |
| **Epilog** | Hain | 40+ | Ylvaris erblüht, der Hain erreicht seine letzte Ausbaustufe, das Endgame wird freigeschaltet | – |

**Sichtbarer Fortschritt:** Mit jedem befreiten Wurzelherz wächst der Hain sichtbar um eine Ausbaustufe (insgesamt 5 Stufen): neue Gebäude, neue NPCs, mehr Licht.

---

## 3. Spielsysteme

### 3.1 Spielschleifen
- **Kern:** erkunden, kämpfen, Beute sammeln.
- **Fortschritt:** Quest, dann XP, Level, Talente und Upgrades beim Schmied, dann schwerere Zone.
- **Langzeit:** Story-Akte, Erfolge und Titel, heroische Dungeons, Weltboss, Prestige.

### 3.2 Charakter
- **Stufen 1–50**, Gesamt-XP wird gespeichert. Kurve: `XP(L→L+1) = 100 · L^1.4`. Monster-XP skaliert mit der Monsterstufe, Quests liefern etwa 40 % der XP. Zielwerte: **Stufe 10 nach etwa 3 h**, Story-Ende bei Stufe 40 nach etwa 25 h, Stufe 50 nach etwa 40 h. Die Werte werden per Simulationsskript feinjustiert.
- **Attribute:** Stärke, Geschick, Intelligenz, Vitalität, Weisheit. 2 Punkte pro Level plus klassenbasiertes Wachstum.
- **Lebenspunkte skaliert:** Die Herzleiste bleibt bei 10 Herzen, zeigt aber **Prozent**. Die echten LP (z. B. 340/400) stehen im HUD. Technisch läuft das über Schadensumrechnung im `entityHurt`-Event, ohne `player.json` zu überschreiben, also update-sicher.
- **Mana** als eigene Ressource mit Regeneration, angezeigt im HUD.

### 3.3 Klassen (wählbar im Prolog, beim Hain gegen Gold wechselbar)
| Klasse | Rolle | Waffen | Beispiel-Fähigkeiten |
|---|---|---|---|
| **Krieger** | Nahkampf / Tank | Schwert, Zweihänder, Streitaxt, Kriegshammer | Schildwall, Wirbelschlag, Kampfschrei, Ult: *Titanenhieb* |
| **Waldläufer** | Fernkampf / Mobilität | Langbogen, Armbrust, Speer, Dolch | Salve, Rückwärtssprung, Giftpfeil, Ult: *Pfeilregen* |
| **Magier** | Flächenschaden | Zauberstab | Feuerball, Frostlanze, Blinzeln, Ult: *Meteor* |
| **Druide** | Heilung / Unterstützung | Naturstab, Dolch | Heilkreis, Dornenranken (Fessel), Wolfsgeist rufen, Ult: *Segen des Ylvaris* |

- Jede Klasse hat **4 aktive Fähigkeiten und 1 Ultimate** (freigeschaltet mit Lv 1/5/10/15/25) sowie einen **Talentbaum mit 2 Pfaden zu je 5 Knoten**.
- **Bedienung auf PS5/Android:** Fähigkeiten sind **Runen-Items** in der Hotbar. Slot wählen und benutzen (LT bzw. Tippen). Die native **Item-Cooldown-Anzeige** zeigt die Abklingzeit direkt am Icon. Runen bleiben gebunden und kehren nach dem Wegwerfen automatisch zurück. Jede Waffe hat zusätzlich eine eigene **Waffenfähigkeit** über „Benutzen“.

### 3.4 Waffen, Rüstung, Beute
- **10 Waffentypen:** Schwert, Zweihänder, Dolch, Streitaxt, Kriegshammer, Speer, Langbogen, Armbrust, Zauberstab, Naturstab. Jeder Typ hat eigenes Schadensprofil, eigenen Spezialeffekt und eigene Waffenfähigkeit (z. B. Hammer: Erdbeben mit Betäubung, Dolch: Schattenschritt hinter das Ziel).
- **4 Materialstufen** pro Typ (Bronze, Stahl, Mondsilber, Runenobsidian), also 40 Basiswaffen, plus **6 legendäre Unikate** mit eigenem Effekt und eigener Lore.
- **Seltenheit:** Gewöhnlich, Ungewöhnlich, Selten, Episch, Legendär (farbiger Name). **Zufallsaffixe** wie +Stärke, Krit-Chance, Lebensraub oder Feuerschaden werden im Item gespeichert und als Lore angezeigt. So entsteht Diablo-artige Beute.
- **Rüstung:** 4 Klassen-Sets und 1 legendäres Set „Weltenbaum“ (je 4 Teile, 3D-Rüstungsmodelle mit 4×-Texturen). **Talismane** in der Nebenhand geben passive Boni.
- **Verbrauchsgüter:** Heil- und Manatränke (3 Stufen), 4 Elixiere, Rückkehrschriftrolle.
- **Materialien:** 10 Monster-Drops, z. B. Fäulnisessenz, Dornenfang, Frostsplitter, Schattenkristall, Runenstaub.
- **Tod:** RPG-Ausrüstung bleibt erhalten (Seelenbindung), Vanilla-Items fallen normal.

### 3.5 Monster (alle neu, im Natur-Fantasy-Stil)
| Region | Kreaturen |
|---|---|
| Wald | Moosling (Schwarm), Dornenwolf, Rindenschreck-Setzling |
| Moor | Moorschlurfer, Schlammkröte, Seufzergeist (Zauberer) |
| Glutsand | Glutskorpion, Verdorrter Priester, Glutgeist |
| Frostkrone | Eiskobold, Frosttroll, Reifkrähe (fliegend) |
| Schattenwurzel | Kristallspinne, Schattenkriecher, Wurzelgolem |
| Überall (Nacht/Lager) | Fäulnisgeist, Goblin-Plünderer (Krieger + Schütze) |

- **18 Monsterarten, 6 Dungeonbosse, 1 Weltboss** („Der Uralte Wurzelwyrm“, Endgame).
- **Monsterstufen** steigen mit der Entfernung zum Hain und mit der Dimension (Nether +15, End +30). Das gilt **auch für Vanilla-Mobs**: Stufe, Schaden und XP werden per Script skaliert.
- **Elite-Monster** (selten, mit Aura) bringen bessere Beute.
- **Bosse:** Bossleiste, Phasen, angekündigte Flächenangriffe (Partikel-Markierung), beschworene Helfer. Die LP skalieren mit der Spielerzahl.
- Spawning in passenden Biomen (Dichte begrenzt) und gezielt rund um die Dungeons.

### 3.6 Quests
- **Hauptstory:** Prolog, 5 Akte und Finale mit etwa **26 Quests**. Der Fortschritt ist **gemeinsam für die Welt**, damit keiner von euch zurückbleibt. Belohnungen gibt es pro Spieler, auch wenn jemand offline war.
- **Nebenquests:** etwa **20** in 5 Questreihen der Hain-NPCs (Schmied, Alchemistin, Jägerin, Händler, Bibliothekar).
- **Kopfgeldbrett:** 3 **tägliche** Aufträge aus einem Pool von etwa 30 Vorlagen, belohnt mit Gold und Ruf.
- **Questtypen gemischt:** Kampf mit Wendung, Erkundung, Sammeln aus Monster-Drops, Verteidigung (Wellen), Runenrätsel, Entscheidung, Lieferung, Boss.
- **Wegpunkte (dreifach abgesichert):**
  1. **Locator-Bar-Wegpunkt** (native Bedrock-Wegpunktleiste): Hauptquest gold, Nebenquest blau.
  2. **HUD-Kompass** in der Aktionsleiste, z. B. `➤ Dornenhain · 245 m ↗`. Der Pfeil richtet sich nach der Blickrichtung.
  3. Optionales **Irrlicht** als Leuchtpartikel-Spur, die vorausfliegt (abschaltbar).
- **Kamerafahrten und Dialoge** an Story-Schlüsselstellen (Kamera-API und Dialogfenster).

### 3.7 Welt & Orte
- **Hain des Erwachens** (Hub, 5 Ausbaustufen) mit 7 NPCs, Kopfgeldbrett und Wegstein. Er wird **dort platziert, wo ihr den Samen pflanzt**. Weil die Welt schon existiert, bestimmt ihr den Ort.
- **Dungeons** werden **erst beim Annähern** platziert, in festen Ringen um den Hain (etwa 300, 600, 900, 1200 und 1500 Blöcke). Das Gelände wird geprüft (Oberfläche, Wasser), der Eingang liegt als Ruine an der Oberfläche, das Innere darunter. Ihr könnt einen Ort **neu würfeln**, falls er zu nah an euren Bauten liegt. Bestehende Bauten werden so nicht überbaut.
- **Wegsteine** (Schnellreise gegen Gold): einer am Hain, einer an jedem Dungeon.
- **Welt-Events:** Goblin-Lager und Fäulnis-Risse entstehen zufällig in der Nähe von Spielern (kleine Strukturen, zeitlich begrenzt).

### 3.8 Wirtschaft & Handwerk
- **Gold** wird virtuell gespeichert und kann per Münzbeutel-Item an den Mitspieler übergeben werden.
- **Gold-Senken:** Schmied (Reparatur, **Upgrade +1 bis +10** ohne Zufall), Klassenwechsel, Talent-Reset, Schnellreise, Händlerware.
- **Händler:** Beute verkaufen (Preis nach Seltenheit), Tränke und Materialien kaufen. Das Angebot wächst mit dem **Ruf beim Hain** (5 Rufstufen).
- **Alchemie:** Tränke über Crafting-Rezepte aus Monster-Materialien.

### 3.9 Endgame
Heroische Dungeons (wiederholbar, Stufe 50, bessere Affixe), Weltboss (wöchentliche Beute), legendäres Set, **30 Erfolge mit Titeln** (über dem Namen sichtbar) sowie **Prestige** (Neustart der Stufe gegen einen kosmetischen Rang und einen kleinen Bonus).

### 3.10 Bedienoberfläche
- **Abenteuerbuch** (Item; per `/cdw:buch` jederzeit neu erhältlich). Menü mit Quests, Charakter, Attribute, Fähigkeiten/Runen, Talente, Erfolge, Einstellungen und Admin.
- **HUD in der Aktionsleiste:** Zeile 1 `❤ 340/400  ✦ 80/120  Lv 12 ▰▰▰▱▱ 63 %`, Zeile 2 Quest-Tracker mit Kompass. Beim Treffen erscheint die Zielinfo: Name, Stufe, LP.
- **Titel/Untertitel** für Level-Up, Quest-Abschluss und Bosskampf, dazu passende Vanilla-Sounds.
- **Einstellungen:** HUD an/aus, Irrlicht an/aus, Schwierigkeit (Entspannt/Normal/Heroisch). Admin: Quest zurücksetzen, Hain verschieben.

---

## 4. Technische Architektur

```
RPG-ADDON-Cloude-Code/
├─ config.json                 # bridge.-v2-Projektdatei
├─ packs/BP/                   # Behavior Pack (entities, items, blocks, loot_tables, spawn_rules, recipes, structures, scripts)
├─ packs/RP/                   # Resource Pack (entity, models, animations, attachables, textures/cdw, texts, sounds)
├─ src/                        # TypeScript-Quellcode (modular: core, player, combat, items, mobs, quests, world, ui)
├─ data/                       # Content-Definitionen (Waffen, Monster, Quests, Loot) → Generator
├─ tools/                      # Build, Codegen (JSON), Textur-/Modellgenerator, Validator, Balancing-Simulation
└─ dist/                       # Chroniken_des_Weltenbaums.mcaddon
```
- **TypeScript (strict)** wird mit esbuild zu einer `main.js` gebündelt und gegen die offiziellen Typen von `@minecraft/server` 2.8.0 geprüft.
- **Datengetrieben:** Waffen, Monster, Quests und Loot sind in `data/` definiert. Generatoren erzeugen daraus die über 150 JSON-Dateien. Das ist konsistent, fehlerarm und leicht zu balancieren.
- **Speicherung:** Dynamic Properties (Spieler- und Weltdaten, versioniertes Schema mit Migration). Gesamt-XP wird gespeichert.
- **Grafik:** Item- und Block-Texturen in 64× und Kreatur-Texturen in 256× werden per **Python-Generator** im gemalten Natur-Fantasy-Stil erzeugt (Konturen, Schattierung, MERS-Leuchtkarten). Modelle und Animationen liegen als **Blockbench-kompatible** `.geo.json` und `.animation.json` vor. Ihr könnt sie also später selbst in Blockbench verfeinern. Einfache Monster nutzen Vanilla-Geometrien mit eigenen Texturen, Signatur-Monster und Bosse bekommen eigene Modelle.
- **Sprache:** Deutsch, auch in `en_US`, damit die Texte unabhängig von der Konsolensprache deutsch erscheinen.
- **Namespace:** `cdw:` (Chroniken des Weltenbaums).

---

## 5. Meilensteine (jeder Meilenstein ist für sich spielbar)

| # | Meilenstein | Ergebnis |
|---|---|---|
| **M0** | Fundament | Projekt, Build-Pipeline, Manifeste, Speicher, HUD, Abenteuerbuch, Sprachdateien |
| **M1** | Charakter | Klassen, Level/XP, Attribute, Mana, Fähigkeiten (Runen), Talente, Schadensformel |
| **M2** | Ausrüstung | 40 Waffen + 6 Unikate, 5 Rüstungssets, Talismane, Tränke, Beute/Affixe, Schmied/Händler/Alchemie |
| **M3** | Monster | 18 Monsterarten, Spawnregeln, Stufenzonen, Elites, Vanilla-Skalierung |
| **M4** | Welt | Hain (5 Stufen), NPCs, Wegsteine, 5 Dungeons + Zitadelle, Welt-Events |
| **M5** | Quests | Prolog mit Einleitung, 5 Akte, Finale, Nebenquests, Kopfgeld, Wegpunkte, Kamerafahrten |
| **M6** | Bosse & Endgame | 6 Bosse + Weltboss, heroische Dungeons, Erfolge/Titel, Prestige |
| **M7** | QA & Release | Validierung, Balancing, Performance-Check, `.mcaddon`, Installationsanleitung, Testcheckliste |

**Qualitätssicherung:**
- **Statisch:** TypeScript-Compiler, JSON-Validator (alle IDs, Texturpfade und Sprachschlüssel vorhanden), Balancing-Simulation.
- **Laufzeit (empfohlen):** Den offiziellen **Bedrock Dedicated Server 1.26.63** headless hier im Container starten, Packs laden, das Content-Log auf Fehler prüfen und automatische Selbsttests laufen lassen (alle Monster spawnen, alle Strukturen platzieren, Questablauf simulieren). Das Starten des Servers wurde von der Sicherheitsrichtlinie dieser Sitzung blockiert. Ich brauche dafür deine Freigabe (siehe Fragen).
- **Abbruchkriterium:** Lässt sich eine Funktion nicht stabil ohne Experimente umsetzen, ersetze ich sie durch eine robuste Alternative und dokumentiere das. Sie wird nicht halbfertig ausgeliefert.

**Fertig ist das Projekt, wenn:** die `.mcaddon` fehlerfrei lädt (keine Content-Log-Fehler), die Story von Prolog bis Epilog durchspielbar ist, alle Systeme aus Abschnitt 3 funktionieren und die Installationsanleitung für Realm/PS5 beiliegt.

---

## 6. Risiken & Lösungen
| Risiko | Lösung |
|---|---|
| PS5 kann keine Add-ons importieren | Installation über Android in die Realm-Einstellungen. **Vorher ein Realm-Backup anlegen.** |
| Dungeon landet auf eigenen Bauten | Platzierung erst beim Annähern, Geländeprüfung, Ort neu würfeln möglich |
| Spiel-Updates brechen Add-ons | Nur stabile APIs, keine Vanilla-Overrides (kein `player.json`, kein JSON-UI) |
| Android-Leistung | Monsterlimits, verteilte Script-Last, keine Dauer-Befehle, sparsame Partikel |
| Konflikt mit dem Texturpaket | Eigener Namespace, keine überschriebenen Dateien, Pack-Reihenfolge egal |
| Bestehende Spielstände | Das Add-on startet erst mit dem Samen. Vorhandene Items und Bauten bleiben unberührt |

---

## 7. Quellen der Recherche
- [Designing Rewarding Progression Systems in MMORPGs (DEV)](https://dev.to/raiden_studio/designing-rewarding-progression-systems-in-mmorpgs-1gih)
- [MMORPG – Definition & Kernelemente (Mein-MMO)](https://mein-mmo.de/en/mmorpg-massive-multiplayer-role-playing-game,2079)
- [Core Loops in Gameplay (Game Design Skills)](https://gamedesignskills.com/game-design/core-loops-in-gameplay/)
- [Game Quest Types (Game Design Skills)](https://gamedesignskills.com/game-design/game-quest-types/)
- [Why won't fetch quests die (PC Gamer)](https://www.pcgamer.com/games/rpg/why-wont-fetch-quests-die-the-horrible-truth-is-we-need-them)
- [Designing a quest system players want to complete (StraySpark)](https://www.strayspark.studio/blog/designing-quest-system-players-want-to-complete)
- [RPG level-based progression math (D. Aversa)](https://davideaversa.it/blog/gamedesign-math-rpg-level-based-progression/)
- [XP Curve Calculator](https://ziva.sh/tools/xp-level-curve-calculator)
- [5 MMO Features That Keep Players Coming Back (CGM)](https://www.cgmagonline.com/articles/5-mmo-features-that-keep-players)
- [10 Features every MMORPG should have (Mein-MMO)](https://mein-mmo.de/en/these-10-great-features-every-mmorpg-should-have,1157285)
- [@minecraft/server auf npm](https://www.npmjs.com/package/@minecraft/server?activeTab=versions) · [Bedrock 1.26.20 Creator Notes](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.20?view=minecraft-bedrock-stable)
- [Experimental Features (Microsoft Learn)](https://learn.microsoft.com/en-us/minecraft/creator/documents/experimentalfeaturestoggle)
- [Vibrant Visuals Resource Packs (Microsoft Learn)](https://learn.microsoft.com/en-us/minecraft/creator/documents/vibrantvisuals/vvresourcepacks)
- [JSON UI – HUD-Elemente & Deprecation (Bedrock Wiki)](https://wiki.bedrock.dev/json-ui/add-hud-elements)
- [Add-on Performance (Bedrock Wiki)](https://wiki.bedrock.dev/meta/addon-performance)
- [Bedrock 1.21.130 Creator Notes – Spear/Kinetic Weapon](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.21.130)
- [Add-ons auf einem Realm (Sportskeeda)](https://www.sportskeeda.com/minecraft/how-add-ons-minecraft-realm)
- Offizielle Typdefinitionen `@minecraft/server` 2.5–2.13 (npm), selbst ausgewertet: LocatorBar ab 2.8.0, `entityHurt`-Before-Event mit änderbarem Schaden
