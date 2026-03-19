import { distance } from "../../utils.js";
import type { CombatActions, CombatSystemHost } from "./types.js";

export class CombatProjectileSystem {
  constructor(
    private readonly host: CombatSystemHost,
    private readonly actions: Pick<
      CombatActions,
      "damageEnemy" | "damagePlayer" | "damageWorldObject" | "tryApplyFireballBurnToEnemy" | "tryApplyFireballBurnToBreakable"
    >
  ) {}

  updateProjectiles(dt: number): void {
    for (let index = this.host.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.host.projectiles[index];
      const step = projectile.speed * dt;

      projectile.x += projectile.direction.x * step;
      projectile.y += projectile.direction.y * step;
      projectile.remaining = Math.max(0, projectile.remaining - step);

      const solid = this.host.world
        .getObjectsNear(projectile.x, projectile.y, projectile.radius + 1)
        .find((object) => distance(object.x, object.y, projectile.x, projectile.y) < object.radius + projectile.radius);

      if (solid) {
        if (projectile.owner === "player") {
          this.actions.damageWorldObject(solid, projectile.damage, "magic");
          if (projectile.element === "fire") {
            this.actions.tryApplyFireballBurnToBreakable(solid);
          }
        }
        this.host.projectiles.splice(index, 1);
        continue;
      }

      if (projectile.owner === "enemy") {
        const hitPlayer =
          distance(this.host.player.x, this.host.player.y, projectile.x, projectile.y) <
          this.host.player.radius + projectile.radius;
        if (hitPlayer) {
          if (this.host.player.invulnerability <= 0) {
            this.actions.damagePlayer(projectile.damage, "magic");
          }
          this.host.projectiles.splice(index, 1);
          continue;
        }
      } else {
        const hitEnemies = this.host.enemies.filter((enemy) => {
          return !enemy.dead &&
            !projectile.hitEnemyIds.includes(enemy.id) &&
            distance(enemy.x, enemy.y, projectile.x, projectile.y) < enemy.radius + projectile.radius;
        });

        for (const enemy of hitEnemies) {
          projectile.hitEnemyIds.push(enemy.id);
          this.actions.damageEnemy(enemy, projectile.damage, "magic");
          if (projectile.element === "fire") {
            this.actions.tryApplyFireballBurnToEnemy(enemy);
          }
        }
      }

      if (projectile.remaining <= 0) {
        this.host.projectiles.splice(index, 1);
      }
    }
  }
}
