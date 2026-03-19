import { ENEMY_MAX_ALIVE } from "../../constants.js";
import { Slime } from "../../enemies/index.js";
import type { EnemyEntity, EnemyKind, RespawnEntry } from "../../types.js";

interface SpawnRespawnHost {
  enemies: EnemyEntity[];
  pendingRespawns: RespawnEntry[];
  spawnEnemy(kind: EnemyKind, multiplier?: number): boolean;
}

export class SpawnRespawnSystem {
  constructor(private readonly host: SpawnRespawnHost) {}

  updateRespawns(dt: number): void {
    for (let index = this.host.pendingRespawns.length - 1; index >= 0; index -= 1) {
      const respawn = this.host.pendingRespawns[index];
      respawn.remaining -= dt;

      if (respawn.remaining <= 0 && this.host.enemies.length < ENEMY_MAX_ALIVE) {
        if (this.host.spawnEnemy(respawn.kind || Slime.kind, respawn.multiplier ?? Slime.multiplier)) {
          this.host.pendingRespawns.splice(index, 1);
        }
      }
    }
  }
}
