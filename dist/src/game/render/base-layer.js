import { PIXELS_PER_METER } from "../constants.js";
import { clamp } from "../utils.js";
export class WorldRenderLayerBase {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }
    setState(state) {
        this.state = state;
    }
    get world() {
        return this.state.world;
    }
    get player() {
        return this.state.player;
    }
    get enemies() {
        return this.state.enemies;
    }
    get projectiles() {
        return this.state.projectiles;
    }
    get drops() {
        return this.state.drops;
    }
    get particles() {
        return this.state.particles;
    }
    get burnEffects() {
        return this.state.burnEffects;
    }
    get floatingTexts() {
        return this.state.floatingTexts;
    }
    get pendingSpellCasts() {
        return this.state.pendingSpellCasts;
    }
    get enemyDeathEffects() {
        return this.state.enemyDeathEffects;
    }
    get playerAuraEffects() {
        return this.state.playerAuraEffects;
    }
    get camera() {
        return this.state.camera;
    }
    get seed() {
        return this.state.seed;
    }
    get lastTimestamp() {
        return this.state.lastTimestamp;
    }
    get dayNight() {
        return this.state.dayNight;
    }
    drawBar(x, y, ratio, color) {
        const screenX = x * PIXELS_PER_METER;
        const screenY = y * PIXELS_PER_METER;
        const width = 44;
        const height = 7;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        this.ctx.fillRect(screenX - width / 2, screenY, width, height);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(screenX - width / 2, screenY, width * clamp(ratio, 0, 1), height);
    }
    getCameraBounds() {
        return {
            minX: this.camera.x - this.camera.halfWidth,
            maxX: this.camera.x + this.camera.halfWidth,
            minY: this.camera.y - this.camera.halfHeight,
            maxY: this.camera.y + this.camera.halfHeight
        };
    }
}
