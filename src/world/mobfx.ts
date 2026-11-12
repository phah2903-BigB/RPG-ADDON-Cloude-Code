// Hilfen für Monster-Effekte (Projektile von Monstern, Elite-Aura).
import { Entity, EntityProjectileComponent, system, Vector3, world } from "@minecraft/server";
import { V, isValid, particle } from "../core/util";

export function spawnProjectileFromMob(mob: Entity, projId: string, target: Vector3, speed = 1.3): void {
  try {
    const from = V.add(mob.location, { x: 0, y: 1.6, z: 0 });
    const dir = V.norm(V.sub(target, from));
    const e = mob.dimension.spawnEntity(`cdw:${projId}`, V.add(from, V.mul(dir, 1.5)));
    const pc = e.getComponent("minecraft:projectile") as EntityProjectileComponent | undefined;
    if (pc) {
      pc.owner = mob;
      pc.shoot(V.mul(dir, speed));
    }
  } catch {
    /* ignorieren */
  }
}

/** Elite-Monster sichtbar machen (leichte Partikel-Aura). */
export function initEliteAura(): void {
  system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
      try {
        for (const e of p.dimension.getEntities({ location: p.location, maxDistance: 32, families: ["cdw_blight"] })) {
          if (!isValid(e) || e.getDynamicProperty("cdw:e") !== true) continue;
          particle(e.dimension, "minecraft:villager_angry", V.add(e.location, { x: 0, y: 2.2, z: 0 }));
        }
      } catch {
        /* ignorieren */
      }
    }
  }, 30);
}
