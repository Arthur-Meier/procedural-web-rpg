import { clamp } from "../utils.js";
export class GameLoop {
    constructor(host, callbacks) {
        this.host = host;
        this.callbacks = callbacks;
    }
    start() {
        requestAnimationFrame((timestamp) => this.frame(timestamp));
    }
    frame(timestamp) {
        if (!this.host.lastTimestamp) {
            this.host.lastTimestamp = timestamp;
        }
        const dt = clamp((timestamp - this.host.lastTimestamp) / 1000, 0, 0.05);
        this.host.lastTimestamp = timestamp;
        this.handleGlobalInput();
        if (this.host.uiState === "playing") {
            this.host.questSystem.update();
        }
        if (this.host.uiState === "playing" &&
            !this.host.mapOpen &&
            !this.host.statsOpen &&
            !this.host.inventoryOpen &&
            !this.host.questBoardOpen) {
            this.update(dt);
        }
        else {
            this.updateMessage(dt);
        }
        this.host.render();
        this.host.input.endFrame();
        requestAnimationFrame((nextTimestamp) => this.frame(nextTimestamp));
    }
    handleGlobalInput() {
        if (this.host.uiState === "paused" && this.host.input.pressed("Escape")) {
            this.callbacks.resumeGame();
            return;
        }
        if (this.host.uiState !== "playing") {
            return;
        }
        if (this.host.questBoardOpen && this.host.input.pressed("Escape")) {
            this.callbacks.closeQuestBoard();
            return;
        }
        if (this.host.input.pressed("Escape")) {
            this.callbacks.openPause();
            return;
        }
        if (this.host.input.pressedKey("m")) {
            this.callbacks.toggleMap();
            return;
        }
        if (this.host.input.pressedKey("p")) {
            this.callbacks.toggleStats();
            return;
        }
        if (this.host.input.pressedKey("i")) {
            this.callbacks.toggleInventory();
            return;
        }
    }
    update(dt) {
        if (!this.host.player || !this.host.world) {
            return;
        }
        this.host.player.invulnerability = Math.max(0, this.host.player.invulnerability - dt);
        this.host.player.meleeCooldown = Math.max(0, this.host.player.meleeCooldown - dt);
        this.host.player.magicCooldown = Math.max(0, this.host.player.magicCooldown - dt);
        this.host.player.swingVisualTimer = Math.max(0, this.host.player.swingVisualTimer - dt);
        const previousCycleTime = this.host.dayNightSystem.getElapsedTime();
        this.host.dayNightSystem.update(dt);
        if (this.host.dayNightSystem.getElapsedTime() < previousCycleTime) {
            this.host.dayCount += 1;
        }
        this.host.movementSystem.updateCamera(0.18);
        this.host.world.updateActiveChunks(this.host.movementSystem.getCameraBounds());
        this.host.movementSystem.updatePlayer(dt);
        this.host.combatSystem.updateSpellCasts(dt);
        this.host.combatSystem.updateParticles(dt);
        this.host.combatSystem.updateEnemyDeathEffects(dt);
        this.host.combatSystem.updatePlayerAuraEffects(dt);
        this.host.combatSystem.updateFloatingTexts(dt);
        this.host.movementSystem.updateCamera(0.26);
        this.host.world.updateActiveChunks(this.host.movementSystem.getCameraBounds());
        this.host.world.discoverAround(this.host.player.x, this.host.player.y);
        this.host.combatSystem.updateBurnEffects(dt);
        this.host.combatSystem.updateEnemies(dt);
        this.host.combatSystem.updateProjectiles(dt);
        this.host.combatSystem.updateDrops(dt);
        this.host.spawnSystem.updateRespawns(dt);
        this.updateMessage(dt);
        this.host.progressionSystem.syncDerivedStats();
        if (this.host.player.hp <= 0 && this.host.uiState !== "gameOver") {
            this.host.player.hp = 0;
            this.host.uiState = "gameOver";
            this.host.refreshSlotLists();
            this.host.syncUi();
        }
    }
    updateMessage(dt) {
        if (!this.host.messageTimer) {
            return;
        }
        this.host.messageTimer = Math.max(0, this.host.messageTimer - dt);
        if (!this.host.messageTimer) {
            this.host.message = "";
            this.host.syncUi();
        }
    }
}
