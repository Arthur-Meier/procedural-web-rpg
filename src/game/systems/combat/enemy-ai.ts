import { SPELL_CAST_DELAY } from "../../game-config.js";
import { distance, normalize } from "../../utils.js";
import type { EnemyEntity } from "../../types.js";
import type { CombatActions, CombatSystemHost } from "./types.js";

interface DirectionWithLength {
  x: number;
  y: number;
  length: number;
}

export class CombatEnemyAi {
  constructor(
    private readonly host: CombatSystemHost,
    private readonly actions: Pick<CombatActions, "damagePlayer" | "startSpellCast">
  ) {}

  updateEnemies(dt: number): void {
    for (const enemy of this.host.enemies) {
      if (enemy.dead) {
        continue;
      }

      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.dashCooldown = Math.max(0, enemy.dashCooldown - dt);
      enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);

      const direction = normalize(this.host.player.x - enemy.x, this.host.player.y - enemy.y);
      const targetDistance = direction.length;

      if (enemy.behavior === "ranged") {
        this.updateRangedEnemy(enemy, direction, targetDistance, dt);
      } else {
        this.updateDashEnemy(enemy, direction, targetDistance, dt);
      }

      const touchingPlayer =
        distance(enemy.x, enemy.y, this.host.player.x, this.host.player.y) < enemy.radius + this.host.player.radius;
      if (touchingPlayer && this.host.player.invulnerability <= 0) {
        this.actions.damagePlayer(enemy.contactDamage);
      }
    }

    this.host.enemies = this.host.enemies.filter((enemy) => !enemy.dead);
  }

  private updateDashEnemy(
    enemy: EnemyEntity,
    direction: DirectionWithLength,
    targetDistance: number,
    dt: number
  ): void {
    if (enemy.dashTimer > 0) {
      enemy.dashTimer = Math.max(0, enemy.dashTimer - dt);
      this.host.moveEntity(enemy, enemy.dashDirection.x * enemy.dashSpeed * dt, enemy.dashDirection.y * enemy.dashSpeed * dt);
      return;
    }

    if (targetDistance < enemy.dashAggroRange && direction.length > 0 && enemy.dashCooldown <= 0) {
      enemy.dashTimer = enemy.dashTime;
      enemy.dashCooldown = enemy.dashCooldownDuration;
      enemy.dashDirection = {
        x: direction.x,
        y: direction.y
      };
    }
  }

  private updateRangedEnemy(
    enemy: EnemyEntity,
    direction: DirectionWithLength,
    targetDistance: number,
    dt: number
  ): void {
    enemy.dashTimer = 0;

    if (direction.length <= 0 || targetDistance > enemy.dashAggroRange) {
      return;
    }

    if (targetDistance > enemy.preferredDistance + 0.45) {
      enemy.dashDirection = {
        x: direction.x,
        y: direction.y
      };
      this.host.moveEntity(enemy, direction.x * enemy.moveSpeed * dt, direction.y * enemy.moveSpeed * dt);
    } else if (targetDistance < enemy.preferredDistance - 0.85) {
      enemy.dashDirection = {
        x: -direction.x,
        y: -direction.y
      };
      this.host.moveEntity(enemy, -direction.x * enemy.moveSpeed * 0.82 * dt, -direction.y * enemy.moveSpeed * 0.82 * dt);
    }

    const canShoot =
      enemy.projectileElement &&
      enemy.projectileSpeed > 0 &&
      enemy.projectileRange > 0 &&
      enemy.projectileRadius > 0;

    if (!canShoot || enemy.attackTimer > 0 || targetDistance > enemy.attackRange) {
      return;
    }

    this.launchEnemyProjectile(enemy, direction);
    enemy.attackTimer = enemy.attackCooldownDuration + SPELL_CAST_DELAY;
  }

  private launchEnemyProjectile(enemy: EnemyEntity, direction: { x: number; y: number }): void {
    if (!enemy.projectileElement) {
      return;
    }

    this.actions.startSpellCast({
      source: "enemy",
      sourceEnemyId: enemy.id,
      element: enemy.projectileElement,
      direction: {
        x: direction.x,
        y: direction.y
      },
      radius: enemy.projectileRadius,
      speed: enemy.projectileSpeed,
      range: enemy.projectileRange,
      damage: enemy.projectileDamage,
      spawnOffset: enemy.projectileRadius + 0.12
    });
  }
}
