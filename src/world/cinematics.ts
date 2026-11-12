// Kurze Kamerafahrten an Schlüsselmomenten (Kamera-API, stabil).
import { EasingType, Player, system, Vector3 } from "@minecraft/server";
import { isValid } from "../core/util";
import { autotest } from "../systems/ui";

export interface Shot {
  loc: Vector3;
  look: Vector3;
  sec: number; // Dauer der Fahrt zu diesem Punkt
}

/** Spielt eine Kamerafahrt für die Spieler ab und gibt danach die Kamera zurück. */
export function cinematic(players: Player[], shots: Shot[], hold = 1.5): void {
  if (autotest.on || !shots.length) return;
  for (const p of players) {
    try {
      p.camera.fade({ fadeTime: { fadeInTime: 0.4, holdTime: 0.2, fadeOutTime: 0.6 }, fadeColor: { red: 0, green: 0, blue: 0 } });
    } catch {
      /* ignorieren */
    }
  }
  let t = 12;
  shots.forEach((s, i) => {
    system.runTimeout(() => {
      for (const p of players) {
        if (!isValid(p)) continue;
        try {
          p.camera.setCamera("minecraft:free", i === 0 ? { location: s.loc, facingLocation: s.look } : { location: s.loc, facingLocation: s.look, easeOptions: { easeTime: s.sec, easeType: EasingType.InOutSine } });
        } catch {
          /* ignorieren */
        }
      }
    }, t);
    t += Math.round((i === 0 ? 0.5 : s.sec) * 20);
  });
  system.runTimeout(() => {
    for (const p of players) {
      if (!isValid(p)) continue;
      try {
        p.camera.fade({ fadeTime: { fadeInTime: 0.3, holdTime: 0.2, fadeOutTime: 0.5 }, fadeColor: { red: 0, green: 0, blue: 0 } });
      } catch {
        /* ignorieren */
      }
    }
  }, t + Math.round(hold * 20) - 6);
  system.runTimeout(() => {
    for (const p of players) {
      if (!isValid(p)) continue;
      try {
        p.camera.clear();
      } catch {
        /* ignorieren */
      }
    }
  }, t + Math.round(hold * 20));
}

/** Umrundet einen Punkt (z. B. den wachsenden Baum). */
export function orbit(players: Player[], center: Vector3, radius: number, height: number, lookY: number, seconds = 6): void {
  const shots: Shot[] = [];
  for (let i = 0; i <= 3; i++) {
    const a = (i / 4) * Math.PI * 1.5 + Math.PI / 4;
    shots.push({ loc: { x: center.x + Math.cos(a) * radius, y: center.y + height + i * 1.5, z: center.z + Math.sin(a) * radius }, look: { x: center.x, y: center.y + lookY, z: center.z }, sec: seconds / 3 });
  }
  cinematic(players, shots);
}
