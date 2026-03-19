import { PIXELS_PER_METER } from "../constants.js";
import { EffectsLayer } from "./layers/effects-layer.js";
import { EntityLayer } from "./layers/entity-layer.js";
import { EnvironmentLayer } from "./layers/environment-layer.js";
import { HudFxLayer } from "./layers/hud-fx-layer.js";
import { TerrainLayer } from "./layers/terrain-layer.js";
export class WorldRenderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.terrainLayer = new TerrainLayer(ctx, canvas);
        this.environmentLayer = new EnvironmentLayer(ctx, canvas);
        this.entityLayer = new EntityLayer(ctx, canvas);
        this.effectsLayer = new EffectsLayer(ctx, canvas);
        this.hudFxLayer = new HudFxLayer(ctx, canvas);
    }
    render(state) {
        this.terrainLayer.setState(state);
        this.environmentLayer.setState(state);
        this.entityLayer.setState(state);
        this.effectsLayer.setState(state);
        this.hudFxLayer.setState(state);
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2 - state.camera.x * PIXELS_PER_METER, this.canvas.height / 2 - state.camera.y * PIXELS_PER_METER);
        this.terrainLayer.drawGround();
        this.environmentLayer.drawSpawnHouse();
        this.environmentLayer.drawBreakables();
        this.environmentLayer.drawDrops();
        this.effectsLayer.drawEnemyDeathEffects();
        this.entityLayer.drawEnemies();
        this.effectsLayer.drawBurnEffects();
        this.environmentLayer.drawQuestSign();
        this.environmentLayer.drawGuideNpc();
        this.effectsLayer.drawPlayerAuras();
        this.entityLayer.drawPlayer();
        this.effectsLayer.drawSpellCasts();
        this.effectsLayer.drawProjectiles();
        this.effectsLayer.drawParticles();
        this.effectsLayer.drawFloatingTexts();
        this.hudFxLayer.drawAimIndicator();
        this.ctx.restore();
        this.hudFxLayer.drawScreenEffects();
    }
}
