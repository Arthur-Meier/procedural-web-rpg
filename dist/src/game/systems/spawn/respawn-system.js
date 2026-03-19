import { ENEMY_MAX_ALIVE } from "../../constants.js";
import { Slime } from "../../enemies/index.js";
export class SpawnRespawnSystem {
    constructor(host) {
        this.host = host;
    }
    updateRespawns(dt) {
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
