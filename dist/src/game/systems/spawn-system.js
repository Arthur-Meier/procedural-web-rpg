import { ENEMY_MAX_ALIVE, PIXELS_PER_METER } from "../constants.js";
import { createEnemy, getEnemyStats, Mage, Slime } from "../enemies/index.js";
import { distance } from "../utils.js";
import { SpawnRespawnSystem } from "./spawn/respawn-system.js";
export class SpawnSystem {
    constructor(host) {
        this.host = host;
        this.respawns = new SpawnRespawnSystem({
            get enemies() {
                return host.enemies;
            },
            get pendingRespawns() {
                return host.pendingRespawns;
            },
            spawnEnemy: (kind, multiplier) => this.spawnEnemy(kind, multiplier)
        });
    }
    spawnInitialEnemies() {
        let attempts = 0;
        while (this.host.enemies.length < ENEMY_MAX_ALIVE && attempts < ENEMY_MAX_ALIVE * 20) {
            this.spawnRandomEnemy();
            attempts += 1;
        }
    }
    spawnSlime() {
        return this.spawnEnemy(Slime.kind, Slime.multiplier);
    }
    spawnMage() {
        return this.spawnEnemy(Mage.kind, Mage.multiplier);
    }
    spawnRandomEnemy() {
        const enemyTemplate = this.pickEnemySpawnTemplate();
        return this.spawnEnemy(enemyTemplate.kind, enemyTemplate.multiplier);
    }
    updateRespawns(dt) {
        this.respawns.updateRespawns(dt);
    }
    pickEnemySpawnTemplate() {
        const slimesPerMage = this.getSlimesPerMageForLevel(this.host.player.level);
        const counts = this.getTrackedSpawnCounts();
        const totalTracked = counts.slime + counts.mage;
        const desiredMageCount = Math.floor((totalTracked + 1) / (slimesPerMage + 1));
        if (counts.mage < desiredMageCount) {
            return {
                kind: Mage.kind,
                multiplier: Mage.multiplier
            };
        }
        return {
            kind: Slime.kind,
            multiplier: Slime.multiplier
        };
    }
    getSlimesPerMageForLevel(level) {
        if (level < 5) {
            return 5;
        }
        if (level < 10) {
            return 3;
        }
        return 1;
    }
    getTrackedSpawnCounts() {
        const counts = {
            slime: 0,
            mage: 0
        };
        for (const enemy of this.host.enemies) {
            if (enemy.dead) {
                continue;
            }
            if (enemy.kind === Mage.kind) {
                counts.mage += 1;
                continue;
            }
            if (enemy.kind === Slime.kind) {
                counts.slime += 1;
            }
        }
        for (const entry of this.host.pendingRespawns) {
            if (entry.kind === Mage.kind) {
                counts.mage += 1;
                continue;
            }
            if (entry.kind === Slime.kind) {
                counts.slime += 1;
            }
        }
        return counts;
    }
    spawnEnemy(kind, multiplier = 1) {
        const stats = getEnemyStats(kind, multiplier);
        const spawn = this.findSpawnPosition(12, 38, stats.radius + stats.spawnPadding);
        if (!spawn) {
            return false;
        }
        this.host.enemies.push(createEnemy(kind, spawn.x, spawn.y, this.host.enemyIdCounter++, { multiplier }));
        return true;
    }
    findSpawnPosition(minDistance, maxDistance, radius) {
        for (let attempt = 0; attempt < 120; attempt += 1) {
            const angle = Math.random() * Math.PI * 2;
            const distanceFromPlayer = minDistance + Math.random() * (maxDistance - minDistance);
            const x = this.host.player.x + Math.cos(angle) * distanceFromPlayer;
            const y = this.host.player.y + Math.sin(angle) * distanceFromPlayer;
            if (distance(x, y, this.host.player.x, this.host.player.y) < minDistance) {
                continue;
            }
            if (!this.isPositionFree(x, y, radius)) {
                continue;
            }
            const screen = this.worldToScreen(x, y);
            const outsideCamera = screen.x < -90 ||
                screen.y < -90 ||
                screen.x > this.host.canvas.width + 90 ||
                screen.y > this.host.canvas.height + 90;
            if (!outsideCamera) {
                continue;
            }
            return { x, y };
        }
        return null;
    }
    isPositionFree(x, y, radius) {
        const objects = this.host.world.getObjectsNear(x, y, radius + 1.2);
        const collidesObject = objects.some((object) => distance(object.x, object.y, x, y) < object.radius + radius);
        if (collidesObject) {
            return false;
        }
        const collidesEnemy = this.host.enemies.some((enemy) => !enemy.dead && distance(enemy.x, enemy.y, x, y) < enemy.radius + radius + 0.4);
        if (collidesEnemy) {
            return false;
        }
        return distance(x, y, this.host.player.x, this.host.player.y) > radius + this.host.player.radius + 2;
    }
    worldToScreen(x, y) {
        return {
            x: (x - this.host.camera.x) * PIXELS_PER_METER + this.host.canvas.width / 2,
            y: (y - this.host.camera.y) * PIXELS_PER_METER + this.host.canvas.height / 2
        };
    }
}
