// Haupt- und Nebenquests inkl. Dialoge.

export interface Line {
  s: string; // Sprecher: NPC-Id | "erzaehler" | "stimme" | "morvath" | "liora"
  t: string;
}

export type Target =
  | { k: "hub" }
  | { k: "npc"; id: string }
  | { k: "dungeon"; id: string }
  | { k: "camp" };

export type Obj =
  | { type: "kill"; mobs?: string[]; fam?: string; count: number }
  | { type: "collect"; item: string; count: number; consume: boolean }
  | { type: "reach"; target: Target; radius: number }
  | { type: "talk"; npc: string }
  | { type: "flag"; flag: string; count?: number }
  | { type: "level"; level: number };

export interface Stage {
  text: string;
  obj: Obj;
  target?: Target;
  start?: string[];
  lines?: Line[];
  drop?: { mobs: string[]; item: string; chance: number }; // Questspezifische Beute während der Stufe
}

export interface Rewards {
  xp: number;
  gold: number;
  items?: { id: string; n: number }[];
  gear?: { rarity: number; armor?: boolean };
  rep?: number;
  title?: string;
}

export interface QuestDef {
  id: string;
  title: string;
  kind: "main" | "side";
  act: number;
  giver?: string;
  turnIn?: string;
  requires?: string[];
  minLevel?: number;
  minStage?: number;
  summary: string;
  intro: Line[];
  stages: Stage[];
  outro: Line[];
  rewards: Rewards;
  done?: string[];
  hidden?: boolean; // erscheint nur unter Bedingungen (z. B. Entscheidung)
  needsChoice?: "free" | "banish";
}

export const SPEAKERS: Record<string, string> = {
  erzaehler: "§7Erzähler",
  stimme: "§a???",
  sylva: "§aSylva",
  kael: "§2Kael",
  brom: "§6Brom",
  mira: "§dMira",
  oswin: "§9Oswin",
  fennick: "§eFennick",
  morgra: "§5Morgra",
  morvath: "§4Morvath",
  liora: "§bLiora",
};

export const MAIN: QuestDef[] = [
  // ======================= PROLOG =======================
  {
    id: "m01",
    title: "Ein Flüstern in den Blättern",
    kind: "main",
    act: 0,
    summary: "Ein seltsamer Samen ist in deinem Gepäck aufgetaucht. Eine Stimme bittet dich, ihn zu pflanzen.",
    intro: [
      { s: "stimme", t: "§o…hörst du mich? Endlich. Endlich jemand, der noch zuhören kann.§r" },
      { s: "stimme", t: "§oDas Land wird krank. Die Blätter flüstern es seit Wochen, die Wurzeln schreien es. Bald werden es auch die Tiere tun – und dann ist es zu spät.§r" },
      { s: "stimme", t: "§oIn deinem Gepäck liegt ein Samen. Er hat dich ausgewählt, nicht ich. Pflanze ihn auf Gras oder Erde – an einem Ort, den du schützen möchtest. Dort werde ich dich finden.§r" },
      { s: "erzaehler", t: "Tipp: Der Ort, an dem du den Samen pflanzt, wird zum §aHain des Erwachens§f – dem Herz deines Abenteuers. Wähle eine offene, eher flache Stelle (etwa 40 × 40 Blöcke). Das §eAbenteuerbuch§f in deinem Inventar zeigt dir jederzeit deine Aufgaben." },
    ],
    stages: [{ text: "Pflanze den Samen des Weltenbaums", obj: { type: "flag", flag: "hub_planted" } }],
    outro: [],
    rewards: { xp: 60, gold: 10 },
  },
  {
    id: "m02",
    title: "Die Hüterin",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Aus dem Samen ist ein Hain gewachsen – und mit ihm eine Gestalt, die auf dich gewartet hat.",
    intro: [
      { s: "sylva", t: "Du hast ihn gepflanzt. Und er ist gewachsen – schneller, als ich zu hoffen wagte. Ich bin §aSylva§f, die letzte Hüterin des Weltenbaums." },
      { s: "sylva", t: "Tief unter diesem Land liegen die Wurzeln von §aYlvaris§f, dem Weltenbaum. Fünf §6Wurzelherzen§f nähren sie – und durch sie jedes Blatt, jedes Tier, jeden Fluss." },
      { s: "sylva", t: "Doch die Herzen wurden vergiftet. Ein Fäulnis, die wir §5das Welken§f nennen, kriecht durch die Wurzeln. Wo sie ankommt, verdorrt das Leben – oder es verwandelt sich in etwas … Hungriges." },
      { s: "sylva", t: "Der Samen hat dich gewählt, weil in dir noch Wachstum steckt. Du sollst ein §6Wächter§f werden. Aber zuerst: Zeig mir, welcher Weg zu dir passt." },
      { s: "erzaehler", t: "Wähle jetzt deine §6Klasse§f. Du kannst sie später bei Sylva gegen Gold wechseln." },
    ],
    stages: [{ text: "Wähle deine Klasse", obj: { type: "flag", flag: "class_chosen" }, start: ["classpick"] }],
    outro: [
      { s: "sylva", t: "So sei es. Ich spüre, wie die Kraft des Samens zu dir fließt. Diese §dRune§f trägt deine erste Fähigkeit in sich – lege sie in deine Schnellleiste und benutze sie." },
    ],
    rewards: { xp: 80, gold: 20, items: [{ id: "heiltrank_klein", n: 4 }, { id: "manatrank_klein", n: 2 }] },
  },
  {
    id: "m03",
    title: "Erste Schritte",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Sylva will sehen, ob du deine neue Kraft beherrschst. Mooslinge streifen um den Hain.",
    intro: [
      { s: "sylva", t: "Spürst du das Kribbeln in den Fingern? Das ist die Rune. Je öfter du sie benutzt, desto selbstverständlicher wird sie dir." },
      { s: "sylva", t: "Sieh dich um – das Welken hat bereits die Mooslinge erreicht. Früher haben sie nur Tau getrunken. Jetzt beißen sie. Erlöse sie." },
      { s: "erzaehler", t: "Tipp: Benutze deine §dRune§f (Item in der Hand + Benutzen). Mana regeneriert sich mit der Zeit. Oben in der Wegpunktleiste und unten im HUD siehst du, wohin du musst." },
    ],
    stages: [
      { text: "Benutze deine erste Fähigkeit", obj: { type: "flag", flag: "ability_used" } },
      { text: "Erlöse verdorbene Mooslinge", obj: { type: "kill", mobs: ["cdw:moosling"], count: 6 }, start: ["spawn:moosling:7:hub"], target: { k: "hub" } },
    ],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Gut gemacht. Siehst du, wie das Moos wieder grün wird, wo sie gefallen sind? Das Welken lässt sich zurückdrängen. Aber nicht ohne Widerstand…" },
    ],
    rewards: { xp: 150, gold: 25, gear: { rarity: 1 } },
  },
  {
    id: "m04",
    title: "Die Wurzeln bluten",
    kind: "main",
    act: 0,
    giver: "sylva",
    summary: "Das Welken spürt den neuen Hain – und schickt seine Kreaturen.",
    intro: [
      { s: "sylva", t: "Hörst du das? Etwas kommt durch das Unterholz. Viele. Das Welken hat bemerkt, dass hier etwas Neues wächst." },
      { s: "sylva", t: "Der junge Baum ist noch schwach. Wenn sie ihn erreichen, war alles umsonst. Stell dich ihnen entgegen – ich stärke dich, so gut ich kann!" },
    ],
    stages: [{ text: "Verteidige den Hain (3 Wellen)", obj: { type: "flag", flag: "defense:hain" }, start: ["defense:hain"], target: { k: "hub" } }],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Sie weichen zurück… fürs Erste. Du hast gekämpft wie ein wahrer Wächter." },
      { s: "sylva", t: "Aber das waren nur Ausläufer. Nicht weit von hier spüre ich das erste Herz – es schlägt kaum noch. Ein Waldläufer namens §2Kael§f verfolgt dort seit Tagen eine Spur. Finde ihn." },
    ],
    rewards: { xp: 260, gold: 40, items: [{ id: "heiltrank", n: 3 }], rep: 50 },
  },
  // ======================= AKT I =======================
  {
    id: "m05",
    title: "Spuren im Unterholz",
    kind: "main",
    act: 1,
    summary: "Finde den Waldläufer Kael, der die Spur des Welkens verfolgt.",
    intro: [],
    stages: [
      { text: "Finde Kaels Lager", obj: { type: "reach", target: { k: "camp" }, radius: 12 }, target: { k: "camp" }, start: ["camp"] },
      { text: "Sprich mit Kael", obj: { type: "talk", npc: "kael" }, target: { k: "camp" } },
    ],
    outro: [
      { s: "kael", t: "Hah – ganz ruhig. Wenn du mich hättest töten wollen, hättest du nicht so laut durchs Gebüsch trampeln dürfen." },
      { s: "kael", t: "Sylva schickt dich? Dann ist es ernst. Ich bin Kael. Ich jage, was gejagt werden muss – und seit dem Welken ist das eine Menge." },
      { s: "kael", t: "Die Wölfe hier sind nicht mehr sie selbst. Aus ihrem Fell wachsen Dornen. Irgendetwas weiter im Wald ruft sie." },
    ],
    rewards: { xp: 300, gold: 30 },
  },
  {
    id: "m06",
    title: "Dornenfänge",
    kind: "main",
    act: 1,
    giver: "kael",
    summary: "Kael will herausfinden, was die Wölfe verändert hat.",
    intro: [
      { s: "kael", t: "Bring mir Fänge von den Dornenwölfen. Wenn ich das Gift darin lesen kann, finde ich den Ort, von dem es kommt." },
      { s: "kael", t: "Und – sei nicht zu sanft. Sie leiden. Ein schneller Tod ist das Freundlichste, was wir ihnen geben können." },
    ],
    stages: [
      { text: "Sammle Dornenfänge", obj: { type: "collect", item: "cdw:dornenfang", count: 5, consume: true }, target: { k: "camp" }, start: ["spawn:dornenwolf:4:camp"], drop: { mobs: ["cdw:dornenwolf"], item: "dornenfang", chance: 0.7 } },
    ],
    turnIn: "kael",
    outro: [
      { s: "kael", t: "Hm… riechst du das? Harz und Fäulnis. Das stammt nicht aus dem Wald – das kommt von unten. Aus den Wurzeln selbst." },
      { s: "kael", t: "Der Ort heißt bei den Alten der §2Dornenhain§f. Ein Tempel, den die Wurzeln längst verschluckt haben. Dort schlägt dein Herz – und dort wartet auch, was die Wölfe ruft." },
    ],
    rewards: { xp: 380, gold: 45, gear: { rarity: 1 } },
  },
  {
    id: "m07",
    title: "Der Dornenhain",
    kind: "main",
    act: 1,
    summary: "Dring in den Dornenhain ein und befreie das erste Wurzelherz.",
    intro: [],
    stages: [
      { text: "Erreiche den Dornenhain", obj: { type: "reach", target: { k: "dungeon", id: "dornenhain" }, radius: 10 }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:dornenhain:rooms" }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Besiege den Wächter des Herzens", obj: { type: "flag", flag: "boss:boss_rindenschreck" }, target: { k: "dungeon", id: "dornenhain" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:dornenhain" }, target: { k: "dungeon", id: "dornenhain" } },
    ],
    outro: [
      { s: "erzaehler", t: "Als deine Hand das Herz berührt, durchfährt dich Wärme. Das schwarze Geäst darin zerfällt zu Staub, und ein goldenes Pulsieren breitet sich in alle Richtungen aus – bis weit unter die Erde." },
      { s: "stimme", t: "§o…eins…§r" },
    ],
    rewards: { xp: 900, gold: 120, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 2 } },
  },
  {
    id: "m08",
    title: "Ein Funke Hoffnung",
    kind: "main",
    act: 1,

    summary: "Kehre zum Hain zurück und berichte Sylva.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zurück", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Ich habe es gespürt! Der Baum hat in der Nacht getrunken – zum ersten Mal seit Monden. Sieh nur, wie er gewachsen ist." },
      { s: "sylva", t: "Und mit dem Leben kommen die Menschen zurück. Ein Schmied, §6Brom§f, hat sich am Hain niedergelassen. Und Kael… nun, Kael sagt, er bleibt „vorerst“." },
      { s: "sylva", t: "Doch die Fäulnis kam nicht von selbst. Etwas – jemand – hat die Herzen vergiftet. Ich… habe einen Verdacht. Aber ich brauche Gewissheit, bevor ich ihn ausspreche." },
    ],
    done: ["hub_stage:1", "npc_home:kael"],
    rewards: { xp: 400, gold: 80, rep: 150, gear: { rarity: 2, armor: true } },
  },
  // ======================= AKT II =======================
  {
    id: "m09",
    title: "Der Schmied",
    kind: "main",
    act: 2,
    giver: "brom",
    summary: "Brom Eisenwurz bietet an, deine Waffe zu verstärken.",
    intro: [
      { s: "brom", t: "Du bist also der Grünschnabel, wegen dem Sylva plötzlich wieder lächelt. Brom. Eisenwurz. Schmied." },
      { s: "brom", t: "Zeig mal deine Klinge… Hmpf. Damit willst du dem Welken in die Augen sehen? Gib her. Die erste Verbesserung geht aufs Haus." },
      { s: "erzaehler", t: "Nimm die Waffe, die du verbessern willst, in die Hand und wähle bei Brom „Ausrüstung verbessern“." },
    ],
    stages: [{ text: "Verbessere eine Waffe bei Brom", obj: { type: "flag", flag: "upgrade_done" }, target: { k: "npc", id: "brom" }, start: ["free_upgrade"] }],
    turnIn: "brom",
    outro: [
      { s: "brom", t: "Na also. Spürst du das Gewicht? Das ist ehrlicher Stahl. Komm wieder, wenn du Runenstaub findest – dann zeig ich dir, was richtige Schmiedekunst ist." },
    ],
    rewards: { xp: 300, gold: 40 },
  },
  {
    id: "m10",
    title: "Seufzer im Nebel",
    kind: "main",
    act: 2,
    giver: "sylva",
    summary: "Das zweite Herz liegt unter einem Moor, in dem es nachts seufzt.",
    intro: [
      { s: "sylva", t: "Das zweite Herz schlägt unter dem §2Seufzermoor§f. Die Menschen dort erzählen, dass man nachts Stimmen im Nebel hört – Seufzer, als würde das Moor selbst trauern." },
      { s: "sylva", t: "Sei vorsichtig. Wo Wasser steht, breitet sich das Welken schneller aus." },
    ],
    stages: [
      { text: "Reise zum Seufzermoor", obj: { type: "reach", target: { k: "dungeon", id: "seufzermoor" }, radius: 60 }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Besiege Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 8 }, target: { k: "dungeon", id: "seufzermoor" }, start: ["zone:seufzermoor"] },
    ],
    outro: [
      { s: "erzaehler", t: "Zwischen den toten Bäumen steigt dünner Rauch auf. Eine Hütte – bewohnt." },
    ],
    rewards: { xp: 700, gold: 70 },
  },
  {
    id: "m11",
    title: "Die Hexe im Moor",
    kind: "main",
    act: 2,
    summary: "In der Hütte am Moor lebt jemand, der mehr weiß, als er sagt.",
    intro: [],
    stages: [
      { text: "Sprich mit der Bewohnerin der Hütte", obj: { type: "talk", npc: "morgra" }, target: { k: "npc", id: "morgra" }, start: ["npc_dungeon:morgra:seufzermoor"] },
      {
        text: "Bring Morgra Moorschleim",
        obj: { type: "collect", item: "cdw:moorschleim", count: 6, consume: true },
        target: { k: "npc", id: "morgra" },
        lines: [
          { s: "morgra", t: "Noch ein Held. Wie reizend. Der letzte hat drei Tage durchgehalten, bevor das Moor ihn verschluckt hat." },
          { s: "morgra", t: "Du willst zum Herzen? Unter dem Moor wacht der §5Moorschlund§f. Sein Gift frisst sich durch Leder und Haut. Ohne meinen Trank bist du Futter." },
          { s: "morgra", t: "Bring mir Moorschleim. Sechs Klumpen. Und frag nicht, wofür ich den Rest brauche." },
        ],
        drop: { mobs: ["cdw:schlammkroete", "cdw:moorschlurfer"], item: "moorschleim", chance: 0.7 },
      },
      { text: "Gib Morgra den Moorschleim", obj: { type: "talk", npc: "morgra" }, target: { k: "npc", id: "morgra" } },
    ],
    outro: [
      { s: "morgra", t: "Hier. Trink das, bevor du runtergehst – oder lass es, mir egal." },
      { s: "morgra", t: "…Und Wächter. Wenn du dem Schlund gegenüberstehst – schau ihm in die Augen. Vielleicht erkennst du dann, warum ich dieses Moor nicht verlassen kann." },
    ],
    rewards: { xp: 650, gold: 60, items: [{ id: "heiltrank", n: 4 }, { id: "elixier_zaehigkeit", n: 1 }] },
  },
  {
    id: "m12",
    title: "Das Seufzermoor",
    kind: "main",
    act: 2,
    summary: "Befreie das zweite Wurzelherz unter dem Moor.",
    intro: [],
    stages: [
      { text: "Betritt das Seufzermoor", obj: { type: "reach", target: { k: "dungeon", id: "seufzermoor" }, radius: 10 }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:seufzermoor:rooms" }, target: { k: "dungeon", id: "seufzermoor" } },
      { text: "Besiege den Moorschlund", obj: { type: "flag", flag: "boss:boss_moorschlund" }, target: { k: "dungeon", id: "seufzermoor" } },
      {
        text: "Triff am Herzen eine Entscheidung",
        obj: { type: "flag", flag: "choice:morgra" },
        target: { k: "dungeon", id: "seufzermoor" },
        lines: [
          { s: "erzaehler", t: "Im Maul des toten Schlunds glänzt etwas: ein silberner Ring mit einem eingeritzten Namen – §5Morgra§f." },
          { s: "erzaehler", t: "Am Wurzelherz hängt ein Fluch wie ein schwarzer Schleier. Er ist mit dem Ring verbunden – und mit der Frau in der Hütte. Sie ist nicht die Herrin des Moors. Sie ist seine Gefangene." },
        ],
      },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:seufzermoor" }, target: { k: "dungeon", id: "seufzermoor" } },
    ],
    outro: [{ s: "stimme", t: "§o…zwei…§r" }],
    rewards: { xp: 1600, gold: 180, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 2 } },
  },
  {
    id: "m13",
    title: "Zwei Herzen",
    kind: "main",
    act: 2,

    summary: "Kehre zum Hain zurück.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zurück", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Zwei Herzen schlagen wieder. Der Hain blüht – sieh nur, eine Alchemistin ist gekommen, §dMira§f. Sie sagt, die Pflanzen hier seien „unverschämt lebendig“." },
      { s: "sylva", t: "Du hast mir von Morgra erzählt. Ein Fluch, der einen Menschen an ein Herz bindet… Diese Art Magie kenne ich. Es gibt nur einen, der sie je beherrscht hat." },
      { s: "sylva", t: "Sein Name ist §4Morvath§f. Einst war er Erzdruide des Weltenbaums. Dann wollte er mehr als ein Leben. Mehr erzähle ich dir, wenn ich sicher bin." },
    ],
    done: ["hub_stage:2"],
    rewards: { xp: 700, gold: 120, rep: 250 },
  },
  // ======================= AKT III =======================
  {
    id: "m14",
    title: "Die Alchemistin",
    kind: "main",
    act: 3,
    giver: "mira",
    summary: "Mira bringt dir die Grundlagen der Alchemie bei.",
    intro: [
      { s: "mira", t: "Oh! Du bist der Wächter! Ich bin Mira. Weißt du, dass die Blüten hier nachts leuchten? Das ist wissenschaftlich höchst unanständig!" },
      { s: "mira", t: "Für den Weg, der vor dir liegt, brauchst du mehr als Glück. Ich zeige dir, wie man einen Heiltrank braut – an jeder Werkbank, mit Zutaten, die das Welken dir praktischerweise selbst liefert." },
      { s: "erzaehler", t: "Rezept: §fKleiner Heiltrank§7 = Glasflasche + Moosherz + Süße Beeren (Werkbank). Weitere Rezepte findest du im Abenteuerbuch → Rezepte." },
    ],
    stages: [{ text: "Braue einen kleinen Heiltrank", obj: { type: "collect", item: "cdw:heiltrank_klein", count: 1, consume: false }, target: { k: "npc", id: "mira" } }],
    turnIn: "mira",
    outro: [{ s: "mira", t: "Perfekt! Na ja – trinkbar. Das ist in der Alchemie praktisch dasselbe. Nimm die hier, die sind von mir. Und komm wieder, ich habe Aufgaben für dich!" }],
    rewards: { xp: 500, gold: 60, items: [{ id: "heiltrank", n: 4 }, { id: "manatrank", n: 4 }] },
  },
  {
    id: "m15",
    title: "Asche und Erinnerung",
    kind: "main",
    act: 3,
    giver: "sylva",
    summary: "Im Glutsand sollen alte Aufzeichnungen der Weltenbaum-Priester liegen.",
    intro: [
      { s: "sylva", t: "Das dritte Herz liegt unter dem §6Glutsand§f – in einem Tempel der alten Priester von Ylvaris. Früher war dort ein Wald. Dann kam die Hitze." },
      { s: "sylva", t: "Die Priester sind nie gegangen. Das Welken hat sie… behalten. Sie tragen vielleicht noch Seiten ihrer Chroniken bei sich. Ich muss wissen, was darin steht." },
    ],
    stages: [
      { text: "Reise zum Glutsand", obj: { type: "reach", target: { k: "dungeon", id: "glutsand" }, radius: 60 }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Finde verwelkte Tagebuchseiten", obj: { type: "collect", item: "cdw:verwelkte_seite", count: 3, consume: true }, target: { k: "dungeon", id: "glutsand" }, start: ["zone:glutsand"], drop: { mobs: ["cdw:verdorrter_priester", "cdw:glutgeist", "cdw:glutskorpion"], item: "verwelkte_seite", chance: 0.3 } },
    ],
    outro: [
      { s: "erzaehler", t: "Die Seiten sind brüchig, die Schrift fein und schräg: §o„Tag 412. Der Baum schenkt Leben, aber er nimmt es auch wieder. Warum sollte ein Gärtner sterben, während sein Garten ewig lebt? Ich werde einen Weg finden. Für mich. Für sie.“§r" },
      { s: "erzaehler", t: "Unterzeichnet mit einem einzigen Buchstaben: §4M.§r" },
    ],
    rewards: { xp: 1300, gold: 140 },
  },
  {
    id: "m16",
    title: "Tempel der Glut",
    kind: "main",
    act: 3,
    summary: "Löse das Rätsel des Tempels und befreie das dritte Herz.",
    intro: [],
    stages: [
      { text: "Betritt den Tempel der Glut", obj: { type: "reach", target: { k: "dungeon", id: "glutsand" }, radius: 10 }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Entzünde die Runensteine und dringe vor", obj: { type: "flag", flag: "dungeon:glutsand:rooms" }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Besiege die Glutkönigin", obj: { type: "flag", flag: "boss:boss_glutkoenigin" }, target: { k: "dungeon", id: "glutsand" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:glutsand" }, target: { k: "dungeon", id: "glutsand" } },
    ],
    outro: [{ s: "stimme", t: "§o…drei…§r" }],
    rewards: { xp: 2600, gold: 260, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } },
  },
  {
    id: "m17",
    title: "Für sie",
    kind: "main",
    act: 3,

    summary: "Bring Sylva die Seiten aus dem Tempel.",
    intro: [],
    stages: [{ text: "Kehre zu Sylva zurück", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "„Für mich. Für sie.“ …Ich kenne diese Handschrift. Ich habe sie mein Leben lang gesehen." },
      { s: "sylva", t: "Morvath ist mein Bruder. Als ich krank wurde, damals, suchte er einen Weg, den Tod zu besiegen. Er fand ihn – in den Wurzeln. Er nahm dem Baum, was der Baum allen gab." },
      { s: "sylva", t: "Ich wurde gesund. Und er wurde… etwas anderes. Ich habe ihn verbannt. Ich dachte, er sei längst vergangen. Ich habe mich geirrt." },
      { s: "sylva", t: "Ein Gelehrter ist angekommen, §9Oswin§f. Er kann die Seiten entziffern. Bitte – hilf ihm. Und verzeih mir, dass ich es dir nicht früher gesagt habe." },
    ],
    done: ["hub_stage:3"],
    rewards: { xp: 1000, gold: 160, rep: 350 },
  },
  // ======================= AKT IV =======================
  {
    id: "m18",
    title: "Der Chronist",
    kind: "main",
    act: 4,
    summary: "Oswin hat die Seiten entziffert.",
    intro: [],
    stages: [{ text: "Sprich mit Oswin, dem Chronisten", obj: { type: "talk", npc: "oswin" }, target: { k: "npc", id: "oswin" } }],
    outro: [
      { s: "oswin", t: "Ah, der Wächter. Oswin, Chronist, ehemals Bibliothekar der Akademie zu – nun, das tut nichts zur Sache. Ich habe die Seiten gelesen. Dreimal. Mit Lupe." },
      { s: "oswin", t: "Der Verfasser beschreibt ein Ritual. Er bindet fremde Seelen an die Wurzelherzen, damit sie an seiner statt verwelken. Das vierte Herz liegt in der §bFrostkrone§f, hoch in den Bergen." },
      { s: "oswin", t: "Und – das ist das Beunruhigende – er schreibt von einem „Helfer, der die Wächter führt“. Jemand aus eurem Kreis arbeitet für ihn." },{ s: "oswin", t: "Seid wachsam, wem ihr den Rücken zukehrt. Und bringt mir bitte weitere Seiten, falls ihr welche findet. Für die Chronik." }],
    rewards: { xp: 900, gold: 100 },
  },
  {
    id: "m19",
    title: "Kälter als Eis",
    kind: "main",
    act: 4,
    summary: "Reise in die Frostkrone. Etwas Vertrautes wartet dort.",
    intro: [],
    stages: [
      { text: "Reise zur Frostkrone", obj: { type: "reach", target: { k: "dungeon", id: "frostkrone" }, radius: 60 }, target: { k: "dungeon", id: "frostkrone" } },
      { text: "Besiege Kreaturen der Frostkrone", obj: { type: "kill", fam: "cdw_frost", count: 10 }, target: { k: "dungeon", id: "frostkrone" }, start: ["zone:frostkrone"] },
      { text: "Finde, was der Frosttroll bewacht", obj: { type: "collect", item: "cdw:kaels_amulett", count: 1, consume: false }, target: { k: "dungeon", id: "frostkrone" }, start: ["spawn:frosttroll:1:dungeon:frostkrone"], drop: { mobs: ["cdw:frosttroll"], item: "kaels_amulett", chance: 1 } },
    ],
    outro: [
      { s: "erzaehler", t: "Das Amulett ist zerkratzt, aber die Gravur ist deutlich: §2Kael§f – und darunter ein zweiter Name, §bLiora§f." },
      { s: "erzaehler", t: "Warum trägt ein Frosttroll, ein Diener des Welkens, Kaels Amulett?" },
    ],
    rewards: { xp: 2400, gold: 220 },
  },
  {
    id: "m20",
    title: "Verrat",
    kind: "main",
    act: 4,
    summary: "Stelle dich der Wahrheit in der Frostkrone.",
    intro: [],
    stages: [
      {
        text: "Betritt die Frostkrone-Feste",
        obj: { type: "reach", target: { k: "dungeon", id: "frostkrone" }, radius: 10 },
        target: { k: "dungeon", id: "frostkrone" },
      },
      {
        text: "Dringe in die Feste vor",
        obj: { type: "flag", flag: "dungeon:frostkrone:rooms" },
        target: { k: "dungeon", id: "frostkrone" },
        start: ["kael_away"],
        lines: [
          { s: "kael", t: "…Du hast das Amulett gefunden. Natürlich hast du das." },
          { s: "kael", t: "Ja. Ich war es. Ich habe Morvaths Kreaturen zu den Herzen geführt, bevor Sylva dich gefunden hat. Ich habe ihm gesagt, wo der Hain steht." },
          { s: "kael", t: "Er hat meine Schwester. §bLiora§f. Er hat sie an das letzte Herz gebunden – wenn es gereinigt wird, stirbt sie mit dem Fluch. Das hat er mir jedenfalls gesagt." },
          { s: "kael", t: "Ich kann dich nicht aufhalten. Ich will es nicht einmal. Aber ich kann dir auch nicht helfen. Nicht hier." },
          { s: "erzaehler", t: "Kael verschwindet im Schneetreiben. Hinter ihm schließt sich das Tor der Feste." },
        ],
      },
      { text: "Besiege Hrimgar, den Frostkoloss", obj: { type: "flag", flag: "boss:boss_hrimgar" }, target: { k: "dungeon", id: "frostkrone" } },
      { text: "Reinige das Wurzelherz", obj: { type: "flag", flag: "heart:frostkrone" }, target: { k: "dungeon", id: "frostkrone" } },
    ],
    outro: [
      { s: "stimme", t: "§o…vier…§r" },
      { s: "erzaehler", t: "Im verblassenden Licht des Herzens zeichnet sich ein Bild: eine junge Frau, eingesponnen in Kristall, tief unter der Erde. Sie lebt." },
    ],
    done: ["npc_home:kael"],
    rewards: { xp: 3600, gold: 340, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } },
  },
  {
    id: "m21",
    title: "Vergebung?",
    kind: "main",
    act: 4,

    summary: "Kael ist zum Hain zurückgekehrt. Sprich mit ihm.",
    intro: [],
    stages: [{ text: "Sprich mit Kael im Hain", obj: { type: "talk", npc: "kael" }, target: { k: "npc", id: "kael" } }],
    outro: [
      { s: "kael", t: "Ich hab's Sylva gesagt. Alles. Sie hat mich nicht fortgejagt. Ich weiß nicht, ob das besser oder schlimmer ist." },
      { s: "kael", t: "Du hast es auch gesehen, oder? Im Herz. Liora. Sie lebt – Morvath hat gelogen. Der Fluch hält sie in der §5Schattenwurzel§f gefangen, nicht im Herz." },
      { s: "kael", t: "Ich schulde dir mehr, als ich je zurückzahlen kann. Aber lass mich anfangen. Ich gehe mit dir in die Tiefe." },
    ],
    done: ["hub_stage:4"],
    rewards: { xp: 1500, gold: 200, rep: 400, gear: { rarity: 3, armor: true } },
  },
  // ======================= AKT V =======================
  {
    id: "m22",
    title: "In die Tiefe",
    kind: "main",
    act: 5,
    giver: "kael",
    summary: "Steige in die Schattenwurzel hinab.",
    intro: [
      { s: "kael", t: "Die Schattenwurzel liegt dort, wo die Wurzeln von Ylvaris am tiefsten reichen. Kein Licht, kein Laut – nur Kristall und Hunger." },
      { s: "kael", t: "Räum den Weg frei. Ich folge dir, sobald ich Liora spüre." },
    ],
    stages: [
      { text: "Reise zur Schattenwurzel", obj: { type: "reach", target: { k: "dungeon", id: "schattenwurzel" }, radius: 60 }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Besiege Kreaturen der Tiefe", obj: { type: "kill", fam: "cdw_deep", count: 10 }, target: { k: "dungeon", id: "schattenwurzel" }, start: ["zone:schattenwurzel"] },
    ],
    outro: [],
    rewards: { xp: 3200, gold: 300 },
  },
  {
    id: "m23",
    title: "Die Kristallmutter",
    kind: "main",
    act: 5,
    summary: "Befreie das fünfte Herz – und Liora.",
    intro: [],
    stages: [
      { text: "Betritt die Schattenwurzel", obj: { type: "reach", target: { k: "dungeon", id: "schattenwurzel" }, radius: 10 }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Dringe in die Tiefe vor", obj: { type: "flag", flag: "dungeon:schattenwurzel:rooms" }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Besiege die Kristallmutter", obj: { type: "flag", flag: "boss:boss_kristallmutter" }, target: { k: "dungeon", id: "schattenwurzel" } },
      { text: "Reinige das letzte Wurzelherz", obj: { type: "flag", flag: "heart:schattenwurzel" }, target: { k: "dungeon", id: "schattenwurzel" } },
    ],
    outro: [
      { s: "erzaehler", t: "Der Kristall um die junge Frau splittert. Kael ist da, bevor sie fällt." },
      { s: "liora", t: "…Kael? Du bist alt geworden, großer Bruder." },
      { s: "kael", t: "Und du bist immer noch frech. Gut. Gut…" },
      { s: "stimme", t: "§o…fünf. Ich bin wach.§r" },
    ],
    rewards: { xp: 5200, gold: 480, items: [{ id: "wurzelsplitter", n: 1 }], gear: { rarity: 3 } },
  },
  {
    id: "m24",
    title: "Die letzte Verteidigung",
    kind: "main",
    act: 5,
    giver: "sylva",
    summary: "Morvath hat gespürt, dass alle Herzen frei sind. Er greift den Hain an.",
    intro: [
      { s: "sylva", t: "Alle fünf Herzen schlagen. Ylvaris ist wach – und Morvath weiß es. Ich spüre seinen Zorn wie Frost auf der Haut." },
      { s: "sylva", t: "Er wird nicht warten. Er schickt alles, was ihm geblieben ist. Hier, gegen den Hain. Gegen uns." },
      { s: "morvath", t: "§o„Schwester. Du hättest sterben sollen, damals. Ich habe dir ein Leben geschenkt – und du gibst es diesem Baum zurück?“§r" },
    ],
    stages: [{ text: "Verteidige den Hain gegen Morvaths Heer (5 Wellen)", obj: { type: "flag", flag: "defense:final" }, start: ["defense:final"], target: { k: "hub" } }],
    turnIn: "sylva",
    outro: [
      { s: "sylva", t: "Sie fliehen! Doch sieh – dort am Horizont. Ein Turm aus schwarzem Holz, gewachsen in einer einzigen Nacht. Die §4Zitadelle des Welkens§f." },
      { s: "sylva", t: "Dort ist er. Beende es, Wächter. Und wenn du kannst… sag ihm, dass ich ihm vergebe." },
    ],
    done: ["citadel"],
    rewards: { xp: 4800, gold: 450, rep: 500 },
  },
  // ======================= FINALE =======================
  {
    id: "m25",
    title: "Die Zitadelle des Welkens",
    kind: "main",
    act: 6,
    summary: "Erklimme die Zitadelle und stelle dich Morvath.",
    intro: [],
    stages: [
      { text: "Erreiche die Zitadelle", obj: { type: "reach", target: { k: "dungeon", id: "zitadelle" }, radius: 12 }, target: { k: "dungeon", id: "zitadelle" } },
      { text: "Erklimme die Zitadelle", obj: { type: "flag", flag: "dungeon:zitadelle:rooms" }, target: { k: "dungeon", id: "zitadelle" } },
      {
        text: "Besiege Morvath",
        obj: { type: "flag", flag: "boss:boss_morvath" },
        target: { k: "dungeon", id: "zitadelle" },
        lines: [
          { s: "morvath", t: "Der kleine Gärtner meiner Schwester. Weißt du, was Ewigkeit bedeutet? Kein Abschied mehr. Nie wieder." },
          { s: "morvath", t: "Ich wollte nur, dass sie bleibt. Und jetzt hat sie sich für einen Baum entschieden. Dann soll der Baum brennen." },
        ],
      },
      { text: "Besiege, was aus Morvath geworden ist", obj: { type: "flag", flag: "boss:boss_welkenbestie" }, target: { k: "dungeon", id: "zitadelle" } },
    ],
    outro: [
      { s: "erzaehler", t: "Die Bestie zerfällt zu Holz und Asche. Zurück bleibt ein alter Mann, kaum mehr als ein Schatten." },
      { s: "morvath", t: "…Sie vergibt mir? Dumme, gute Schwester. …Sag ihr… dass das Gift nie für sie bestimmt war. Nur die Angst." },
      { s: "erzaehler", t: "Ein Windhauch, und er ist fort. Über der Zitadelle reißt der Himmel auf." },
    ],
    rewards: { xp: 8000, gold: 900, gear: { rarity: 4 } },
  },
  {
    id: "m26",
    title: "Ylvaris erblüht",
    kind: "main",
    act: 6,

    summary: "Kehre ein letztes Mal zu Sylva zurück.",
    intro: [],
    stages: [{ text: "Kehre zum Hain zurück", obj: { type: "talk", npc: "sylva" }, target: { k: "npc", id: "sylva" } }],
    outro: [
      { s: "sylva", t: "Ich habe es gespürt, als er ging. Kein Zorn mehr. Nur Stille. …Danke, dass du ihm meine Worte gebracht hast." },
      { s: "sylva", t: "Sieh dir den Baum an. Ylvaris blüht. Das Land wird heilen – nicht in einem Tag, aber es wird heilen." },
      { s: "sylva", t: "Doch das Welken hat Spuren hinterlassen. Tief unter der Erde regt sich etwas Uraltes, das Morvath geweckt hat. Und die Wurzelpfade werden nicht von selbst sicher." },
      { s: "sylva", t: "Ihr seid jetzt §6Wächter des Weltenbaums§f. Der Hain ist euer Zuhause. Was immer kommt – wir begegnen ihm gemeinsam." },
      { s: "erzaehler", t: "§6Ende der Hauptgeschichte.§f Freigeschaltet: §eHeroische Wurzelpfade§f (Dungeons wiederholen), §eder Altar des Uralten§f (Weltboss) und §ePrestige§f. Danke fürs Spielen!" },
    ],
    done: ["hub_stage:5", "endgame"],
    rewards: { xp: 5000, gold: 1000, rep: 1000, title: "Wächter des Weltenbaums", items: [{ id: "beschwoerungsstein", n: 1 }] },
  },
];

// ======================= NEBENQUESTS =======================
export const SIDE: QuestDef[] = [
  // --- Fennick ---
  {
    id: "f1", title: "Ein Händler in Not", kind: "side", act: 0, giver: "fennick", minStage: 0,
    summary: "Fennick hat auf dem Weg zum Hain seine Vorräte verloren.",
    intro: [{ s: "fennick", t: "Fennick, fahrender Händler, zu Diensten! Nun ja – fast. Ein paar Mooslinge haben meinen Proviant gefressen. Mitsamt Wagen. Bringst du mir Brot? Ich zahle gut. Später. Ganz bestimmt." }],
    stages: [{ text: "Bring Fennick 8 Brot", obj: { type: "collect", item: "minecraft:bread", count: 8, consume: true }, target: { k: "npc", id: "fennick" } }],
    outro: [{ s: "fennick", t: "Mmh! Du bist ein Schatz. Hier, ehrlich verdient. Und für dich gibt's ab jetzt den Freundschaftspreis!" }],
    rewards: { xp: 120, gold: 40, rep: 60 },
  },
  {
    id: "f2", title: "Gefährliche Handelswege", kind: "side", act: 0, giver: "fennick", requires: ["f1"], minLevel: 5,
    summary: "Die Wege rund um den Hain sind voller Kreaturen des Welkens.",
    intro: [{ s: "fennick", t: "Kein Händler traut sich mehr hierher – überall Fäulniskreaturen! Räum ein bisschen auf, ja? Fünfzehn sollten reichen, damit sich das rumspricht." }],
    stages: [{ text: "Besiege Kreaturen des Welkens", obj: { type: "kill", fam: "cdw_blight", count: 15 } }],
    outro: [{ s: "fennick", t: "Ich hab's gehört! „Am Hain gibt's einen Wächter, der aufräumt.“ Gut fürs Geschäft. Sehr gut sogar." }],
    rewards: { xp: 400, gold: 90, rep: 80 },
  },
  {
    id: "f3", title: "Seltene Ware", kind: "side", act: 0, giver: "fennick", requires: ["f2"], minLevel: 12,
    summary: "Fennick sucht Smaragde für einen besonderen Kunden.",
    intro: [{ s: "fennick", t: "Ein Kunde – sehr reich, sehr geheimnisvoll – will Smaragde. Drei Stück. Dafür hab ich da einen Talisman, der… sagen wir, Glück anzieht." }],
    stages: [{ text: "Bring Fennick 3 Smaragde", obj: { type: "collect", item: "minecraft:emerald", count: 3, consume: true }, target: { k: "npc", id: "fennick" } }],
    outro: [{ s: "fennick", t: "Wunderschön. Hier, der Talisman des Glücks. Nicht weitersagen, woher du ihn hast." }],
    rewards: { xp: 700, gold: 60, rep: 100, items: [{ id: "talisman_glueck", n: 1 }] },
  },
  // --- Kael ---
  {
    id: "k1", title: "Rudeljagd", kind: "side", act: 1, giver: "kael", minStage: 1,
    summary: "Kael will die verdorbenen Wolfsrudel ausdünnen.",
    intro: [{ s: "kael", t: "Die Dornenwölfe vermehren sich. Wenn wir nichts tun, sind bald alle Rudel verdorben. Zehn. Dann reden wir weiter." }],
    stages: [{ text: "Besiege Dornenwölfe", obj: { type: "kill", mobs: ["cdw:dornenwolf"], count: 10 } }],
    outro: [{ s: "kael", t: "Saubere Arbeit. Hier, nimm das. Ein Jäger sollte gut ausgerüstet sein." }],
    rewards: { xp: 500, gold: 70, rep: 60, gear: { rarity: 1 } },
  },
  {
    id: "k2", title: "Goblinplage", kind: "side", act: 1, giver: "kael", requires: ["k1"], minLevel: 8,
    summary: "Goblins plündern die Gegend.",
    intro: [{ s: "kael", t: "Goblins. Das Welken interessiert sie nicht – nur, was sie dabei mitgehen lassen können. Ihre Lager tauchen überall auf. Zeig ihnen, dass hier nichts zu holen ist." }],
    stages: [{ text: "Besiege Goblins", obj: { type: "kill", fam: "cdw_goblin", count: 12 } }],
    outro: [{ s: "kael", t: "Die werden so schnell nicht wiederkommen. Na ja. Goblins. Vermutlich doch." }],
    rewards: { xp: 800, gold: 150, rep: 80 },
  },
  {
    id: "k3", title: "Der Leitwolf", kind: "side", act: 1, giver: "kael", requires: ["k2"], minLevel: 14,
    summary: "Kael sucht eine besonders starke Kreatur.",
    intro: [{ s: "kael", t: "Manche Kreaturen des Welkens sind stärker als andere – du erkennst sie an ihrem Leuchten. Elite-Biester. Erledige eins und bring mir den Beweis." }],
    stages: [{ text: "Besiege ein Elite-Monster", obj: { type: "flag", flag: "elite_kill" } }],
    outro: [{ s: "kael", t: "Nicht schlecht. Wirklich nicht schlecht. Der hier gehört dir – er hat mir oft genug den Hintern gerettet." }],
    rewards: { xp: 1400, gold: 160, rep: 100, items: [{ id: "talisman_wind", n: 1 }] },
  },
  {
    id: "k4", title: "Schatten der Tiefe", kind: "side", act: 5, giver: "kael", requires: ["k3"], minLevel: 32, minStage: 4,
    summary: "Wurzelgolems bedrohen die Höhlen.",
    intro: [{ s: "kael", t: "Liora erzählt von riesigen Golems aus Wurzeln und Stein, die in den Höhlen wandern. Drei davon. Für sie." }],
    stages: [{ text: "Besiege Wurzelgolems", obj: { type: "kill", mobs: ["cdw:wurzelgolem"], count: 3 } }],
    outro: [{ s: "kael", t: "Danke. Von uns beiden." }],
    rewards: { xp: 4000, gold: 300, rep: 150, gear: { rarity: 3 } },
  },
  // --- Brom ---
  {
    id: "b1", title: "Erz für die Esse", kind: "side", act: 2, giver: "brom", minStage: 1,
    summary: "Brom braucht Eisen für seine Schmiede.",
    intro: [{ s: "brom", t: "Eine Schmiede ohne Eisen ist wie ein Bier ohne Schaum. Traurig. Bring mir zehn Eisenbarren, und ich schmiede dir was Anständiges." }],
    stages: [{ text: "Bring Brom 10 Eisenbarren", obj: { type: "collect", item: "minecraft:iron_ingot", count: 10, consume: true }, target: { k: "npc", id: "brom" } }],
    outro: [{ s: "brom", t: "Gutes Eisen. Hier – frisch aus der Esse. Pass drauf auf." }],
    rewards: { xp: 600, gold: 50, rep: 80, gear: { rarity: 2 } },
  },
  {
    id: "b2", title: "Mondsilber", kind: "side", act: 3, giver: "brom", requires: ["b1"], minLevel: 18,
    summary: "Brom will Mondsilber schmelzen.",
    intro: [{ s: "brom", t: "Mondsilber. Gold, das im Frost geschmiedet wird. Bring mir 6 Goldbarren und 4 Frostsplitter, dann zeig ich dir das Rezept." }],
    stages: [
      { text: "Bring Brom 6 Goldbarren", obj: { type: "collect", item: "minecraft:gold_ingot", count: 6, consume: true }, target: { k: "npc", id: "brom" } },
      { text: "Bring Brom 4 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 4, consume: true }, target: { k: "npc", id: "brom" } },
    ],
    outro: [{ s: "brom", t: "Sieh dir diesen Glanz an! Hier, drei Barren für dich. Das Rezept steht jetzt in deinem Buch." }],
    rewards: { xp: 1600, gold: 100, rep: 100, items: [{ id: "mondsilberbarren", n: 3 }] },
  },
  {
    id: "b3", title: "Runen im Stahl", kind: "side", act: 3, giver: "brom", requires: ["b2"], minLevel: 24,
    summary: "Brom will Runen in Stahl schmieden.",
    intro: [{ s: "brom", t: "Runenstaub, Wächter. Fünf Häufchen. Damit bringe ich deinem Stahl das Singen bei." }],
    stages: [{ text: "Bring Brom 5 Runenstaub", obj: { type: "collect", item: "cdw:runenstaub", count: 5, consume: true }, target: { k: "npc", id: "brom" } }],
    outro: [{ s: "brom", t: "Da. Hörst du's? Nein? Dann hast du keine Ohren für Stahl. Nimm's trotzdem." }],
    rewards: { xp: 2800, gold: 200, rep: 120, gear: { rarity: 3 } },
  },
  {
    id: "b4", title: "Meisterstück", kind: "side", act: 5, giver: "brom", requires: ["b3"], minLevel: 32,
    summary: "Brom will sein Meisterstück schmieden.",
    intro: [{ s: "brom", t: "Ich will ein Meisterstück schmieden, bevor ich alt werde. Älter. Ich brauch uraltes Harz und fünf Schattenkristalle." }],
    stages: [
      { text: "Bring Brom 1 Uraltes Harz", obj: { type: "collect", item: "cdw:uraltes_harz", count: 1, consume: true }, target: { k: "npc", id: "brom" } },
      { text: "Bring Brom 5 Schattenkristalle", obj: { type: "collect", item: "cdw:schattenkristall", count: 5, consume: true }, target: { k: "npc", id: "brom" } },
    ],
    outro: [{ s: "brom", t: "…Das ist das Beste, was ich je gemacht hab. Und es gehört dir. Sag's keinem, sonst wollen alle eins." }],
    rewards: { xp: 5000, gold: 400, rep: 200, gear: { rarity: 4 } },
  },
  // --- Mira ---
  {
    id: "a1", title: "Kräuterkunde", kind: "side", act: 3, giver: "mira", minStage: 2,
    summary: "Mira braucht Zutaten für ihre Experimente.",
    intro: [{ s: "mira", t: "Moosherzen! Sie pochen noch, wenn man sie pflückt – ist das nicht wunderbar? Und eklig! Bring mir sechs, bitte!" }],
    stages: [{ text: "Bring Mira 6 Moosherzen", obj: { type: "collect", item: "cdw:moosherz", count: 6, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Danke! Daraus wird ein Trank, der… hm. Ich weiß es noch nicht. Hier, die funktionieren schon." }],
    rewards: { xp: 700, gold: 60, rep: 80, items: [{ id: "heiltrank", n: 3 }, { id: "elixier_eile", n: 1 }] },
  },
  {
    id: "a2", title: "Gegengift", kind: "side", act: 3, giver: "mira", requires: ["a1"], minLevel: 18,
    summary: "Mira erforscht ein Gegengift.",
    intro: [{ s: "mira", t: "Skorpionstacheln – fünf Stück. Aus ihrem Gift mache ich ein Gegengift. Theoretisch. Praktisch probieren wir es an dir aus. Scherz! Halb." }],
    stages: [{ text: "Bring Mira 5 Skorpionstachel", obj: { type: "collect", item: "cdw:skorpionstachel", count: 5, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Es hat funktioniert! Ich glaube! Hier – Elixiere, frisch gebraut." }],
    rewards: { xp: 1600, gold: 110, rep: 100, items: [{ id: "elixier_staerke", n: 2 }, { id: "elixier_zaehigkeit", n: 2 }] },
  },
  {
    id: "a3", title: "Frostblüte", kind: "side", act: 4, giver: "mira", requires: ["a2"], minLevel: 24,
    summary: "Mira will eine Blüte aus Frost züchten.",
    intro: [{ s: "mira", t: "Frostsplitter schmelzen nie. Wenn ich einen Samen hineinsetze… stell dir vor, eine Blume aus Eis! Sechs Splitter, bitte!" }],
    stages: [{ text: "Bring Mira 6 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 6, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Sie blüht! Und sie… summt? Egal. Hier, ein Talisman – das Leben in ihm hat mich darauf gebracht." }],
    rewards: { xp: 2600, gold: 160, rep: 120, items: [{ id: "talisman_leben", n: 1 }] },
  },
  {
    id: "a4", title: "Essenz des Welkens", kind: "side", act: 5, giver: "mira", requires: ["a3"], minLevel: 30,
    summary: "Mira will das Welken selbst verstehen.",
    intro: [{ s: "mira", t: "Wenn ich verstehe, woraus das Welken besteht, kann ich es vielleicht heilen. Zwanzig Fäulnisessenzen. Ja, zwanzig. Ich weiß." }],
    stages: [{ text: "Bring Mira 20 Fäulnisessenzen", obj: { type: "collect", item: "cdw:faeulnisessenz", count: 20, consume: true }, target: { k: "npc", id: "mira" } }],
    outro: [{ s: "mira", t: "Es ist… Trauer. Das Welken ist im Kern Trauer, zu Gift gemacht. Wie seltsam. Danke – das hier hilft dir beim Lernen." }],
    rewards: { xp: 4000, gold: 250, rep: 150, items: [{ id: "elixier_weisheit", n: 3 }] },
  },
  // --- Oswin ---
  {
    id: "o1", title: "Verlorene Seiten", kind: "side", act: 4, giver: "oswin", minStage: 3,
    summary: "Oswin sammelt jede Seite von Morvaths Tagebuch.",
    intro: [{ s: "oswin", t: "Es gibt mehr Seiten, da bin ich sicher. Verdorrte Priester tragen sie, und in alten Truhen könnten welche liegen. Fünf weitere würden die Chronik vervollständigen." }],
    stages: [{ text: "Bring Oswin 5 Tagebuchseiten", obj: { type: "collect", item: "cdw:verwelkte_seite", count: 5, consume: true }, target: { k: "npc", id: "oswin" }, drop: { mobs: ["cdw:verdorrter_priester"], item: "verwelkte_seite", chance: 0.25 } }],
    outro: [{ s: "oswin", t: "„Tag 1: Sylva hustet wieder Blut. Die Heiler schweigen.“ …Er war kein Ungeheuer. Nicht am Anfang. Danke, Wächter." }],
    rewards: { xp: 2400, gold: 150, rep: 150, title: "Chronist" },
  },
  {
    id: "o2", title: "Die alten Wegsteine", kind: "side", act: 2, giver: "oswin", minStage: 3,
    summary: "Oswin will die Wegsteine kartieren.",
    intro: [{ s: "oswin", t: "Die Wegsteine sind Knoten im Wurzelnetz. Aktiviere vier davon – ich zeichne die Verbindungen in meine Karten." }],
    stages: [{ text: "Aktiviere 4 Wegsteine", obj: { type: "flag", flag: "waystone", count: 4 } }],
    outro: [{ s: "oswin", t: "Faszinierend. Sie bilden ein Muster – wie die Adern eines Blattes. Hier, für deine Mühe." }],
    rewards: { xp: 1800, gold: 150, rep: 120, items: [{ id: "rueckkehrschriftrolle", n: 5 }] },
  },
  {
    id: "o3", title: "Chronik eines Wächters", kind: "side", act: 4, giver: "oswin", requires: ["o1"], minLevel: 30,
    summary: "Oswin will deine Geschichte aufschreiben.",
    intro: [{ s: "oswin", t: "Jede Chronik braucht einen Helden. Erreiche Stufe 35 – dann schreibe ich das Kapitel über dich." }],
    stages: [{ text: "Erreiche Stufe 35", obj: { type: "level", level: 35 } }],
    outro: [{ s: "oswin", t: "„…und so stand der Wächter vor dem Baum, und der Baum verneigte sich.“ Zu dick aufgetragen? Ach was." }],
    rewards: { xp: 3000, gold: 300, rep: 200, title: "Held der Chronik" },
  },
  // --- Morgra (nur wenn erlöst) ---
  {
    id: "g1", title: "Morgras Gebräu", kind: "side", act: 2, giver: "morgra", needsChoice: "free", hidden: true,
    summary: "Die freie Morgra braut wieder – diesmal für den Hain.",
    intro: [{ s: "morgra", t: "Frei. Weißt du, wie lange ich dieses Wort nicht mehr gedacht habe? …Genug Gefühle. Bring mir zehn Moorschleim, ich braue dir etwas Besonderes." }],
    stages: [{ text: "Bring Morgra 10 Moorschleim", obj: { type: "collect", item: "cdw:moorschleim", count: 10, consume: true }, target: { k: "npc", id: "morgra" } }],
    outro: [{ s: "morgra", t: "Hier. Trink nicht alles auf einmal. Oder doch, ist dein Magen." }],
    rewards: { xp: 1500, gold: 100, rep: 150, items: [{ id: "elixier_weisheit", n: 2 }, { id: "manatrank_gross", n: 3 }] },
  },
  {
    id: "g2", title: "Das Moor heilt", kind: "side", act: 3, giver: "morgra", requires: ["g1"], needsChoice: "free", hidden: true, minLevel: 20,
    summary: "Morgra will das Moor endgültig vom Welken befreien.",
    intro: [{ s: "morgra", t: "Das Moor war meine Heimat, lange bevor es mein Gefängnis wurde. Erledige zwanzig seiner verdorbenen Kreaturen – dann kann es heilen." }],
    stages: [{ text: "Besiege Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 20 } }],
    outro: [{ s: "morgra", t: "Hörst du das? Keine Seufzer mehr. Nur Frösche. Danke, Wächter. Ehrlich." }],
    rewards: { xp: 3000, gold: 200, rep: 200, items: [{ id: "talisman_waechter", n: 1 }] },
  },
];

export const ALL_QUESTS: QuestDef[] = [...MAIN, ...SIDE];
export function questById(id: string): QuestDef | undefined {
  return ALL_QUESTS.find((q) => q.id === id);
}

// ======================= KOPFGELD =======================
export interface BountyTemplate {
  id: string;
  text: string;
  obj: Obj;
  minAct: number;
  mult: number;
}

export const BOUNTIES: BountyTemplate[] = [
  { id: "bt_moos", text: "Erlöse 12 Mooslinge", obj: { type: "kill", mobs: ["cdw:moosling"], count: 12 }, minAct: 0, mult: 0.8 },
  { id: "bt_wolf", text: "Jage 8 Dornenwölfe", obj: { type: "kill", mobs: ["cdw:dornenwolf"], count: 8 }, minAct: 1, mult: 1 },
  { id: "bt_setzling", text: "Fälle 4 Rindenschreck-Setzlinge", obj: { type: "kill", mobs: ["cdw:rindenschreck_setzling"], count: 4 }, minAct: 1, mult: 1.2 },
  { id: "bt_goblin", text: "Vertreibe 10 Goblins", obj: { type: "kill", fam: "cdw_goblin", count: 10 }, minAct: 0, mult: 1 },
  { id: "bt_geist", text: "Banne 5 Fäulnisgeister", obj: { type: "kill", mobs: ["cdw:faeulnisgeist"], count: 5 }, minAct: 0, mult: 1.1 },
  { id: "bt_blight", text: "Besiege 20 Kreaturen des Welkens", obj: { type: "kill", fam: "cdw_blight", count: 20 }, minAct: 0, mult: 1.3 },
  { id: "bt_undead", text: "Besiege 15 Untote", obj: { type: "kill", fam: "undead", count: 15 }, minAct: 0, mult: 1 },
  { id: "bt_creeper", text: "Entschärfe 6 Creeper", obj: { type: "kill", mobs: ["minecraft:creeper"], count: 6 }, minAct: 0, mult: 0.9 },
  { id: "bt_spinne", text: "Erlege 10 Spinnen", obj: { type: "kill", fam: "arthropod", count: 10 }, minAct: 0, mult: 0.9 },
  { id: "bt_moor", text: "Besiege 10 Kreaturen des Moors", obj: { type: "kill", fam: "cdw_swamp", count: 10 }, minAct: 2, mult: 1.1 },
  { id: "bt_kroete", text: "Erlege 6 Schlammkröten", obj: { type: "kill", mobs: ["cdw:schlammkroete"], count: 6 }, minAct: 2, mult: 1 },
  { id: "bt_wueste", text: "Besiege 10 Kreaturen des Glutsands", obj: { type: "kill", fam: "cdw_desert", count: 10 }, minAct: 3, mult: 1.1 },
  { id: "bt_skorpion", text: "Erlege 6 Glutskorpione", obj: { type: "kill", mobs: ["cdw:glutskorpion"], count: 6 }, minAct: 3, mult: 1 },
  { id: "bt_frost", text: "Besiege 10 Kreaturen der Frostkrone", obj: { type: "kill", fam: "cdw_frost", count: 10 }, minAct: 4, mult: 1.1 },
  { id: "bt_troll", text: "Fälle 2 Frosttrolle", obj: { type: "kill", mobs: ["cdw:frosttroll"], count: 2 }, minAct: 4, mult: 1.4 },
  { id: "bt_tiefe", text: "Besiege 10 Kreaturen der Tiefe", obj: { type: "kill", fam: "cdw_deep", count: 10 }, minAct: 5, mult: 1.2 },
  { id: "bt_golem", text: "Zerschlage 2 Wurzelgolems", obj: { type: "kill", mobs: ["cdw:wurzelgolem"], count: 2 }, minAct: 5, mult: 1.5 },
  { id: "bt_elite", text: "Besiege ein Elite-Monster", obj: { type: "flag", flag: "elite_kill" }, minAct: 1, mult: 1.6 },
  { id: "bt_essenz", text: "Liefere 8 Fäulnisessenzen", obj: { type: "collect", item: "cdw:faeulnisessenz", count: 8, consume: true }, minAct: 0, mult: 1 },
  { id: "bt_fang", text: "Liefere 6 Dornenfänge", obj: { type: "collect", item: "cdw:dornenfang", count: 6, consume: true }, minAct: 1, mult: 1 },
  { id: "bt_schleim", text: "Liefere 6 Moorschleim", obj: { type: "collect", item: "cdw:moorschleim", count: 6, consume: true }, minAct: 2, mult: 1 },
  { id: "bt_stachel", text: "Liefere 5 Skorpionstachel", obj: { type: "collect", item: "cdw:skorpionstachel", count: 5, consume: true }, minAct: 3, mult: 1.1 },
  { id: "bt_splitter", text: "Liefere 5 Frostsplitter", obj: { type: "collect", item: "cdw:frostsplitter", count: 5, consume: true }, minAct: 4, mult: 1.1 },
  { id: "bt_kristall", text: "Liefere 4 Schattenkristalle", obj: { type: "collect", item: "cdw:schattenkristall", count: 4, consume: true }, minAct: 5, mult: 1.2 },
  { id: "bt_eisen", text: "Liefere 12 Eisenbarren", obj: { type: "collect", item: "minecraft:iron_ingot", count: 12, consume: true }, minAct: 0, mult: 1 },
  { id: "bt_knochen", text: "Liefere 16 Knochen", obj: { type: "collect", item: "minecraft:bone", count: 16, consume: true }, minAct: 0, mult: 0.8 },
  { id: "bt_dungeon", text: "Besiege einen Dungeon-Wächter (heroisch)", obj: { type: "flag", flag: "heroic_boss" }, minAct: 7, mult: 3 },
  { id: "bt_lager", text: "Räume ein Goblin-Lager", obj: { type: "flag", flag: "camp_cleared" }, minAct: 0, mult: 1.5 },
  { id: "bt_riss", text: "Schließe einen Fäulnis-Riss", obj: { type: "flag", flag: "rift_closed" }, minAct: 1, mult: 1.5 },
  { id: "bt_nether", text: "Besiege 10 Kreaturen im Nether", obj: { type: "kill", mobs: ["minecraft:blaze", "minecraft:wither_skeleton", "minecraft:ghast", "minecraft:magma_cube", "minecraft:piglin_brute", "minecraft:hoglin", "minecraft:zombie_pigman"], count: 10 }, minAct: 3, mult: 1.3 },
];
