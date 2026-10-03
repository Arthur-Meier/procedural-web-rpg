import { PIXELS_PER_METER } from "../constants.js";
import { GUIDE_NPC, QUEST_SIGN } from "../game-config.js";
import type { BreakableObject, EnemyEntity } from "../types.js";
import { EffectsLayer } from "./layers/effects-layer.js";
import { EntityLayer } from "./layers/entity-layer.js";
import { EnvironmentLayer } from "./layers/environment-layer.js";
import { HudFxLayer } from "./layers/hud-fx-layer.js";
import { TerrainLayer } from "./layers/terrain-layer.js";
import type { WorldRendererState } from "./render-types.js";
import { WindLeavesLayer } from "./wind-leaves.js";

export type { WorldRendererState } from "./render-types.js";

type DepthEntry =
  | { kind: "breakable"; baseY: number; object: BreakableObject }
  | { kind: "enemy"; baseY: number; enemy: EnemyEntity }
  | { kind: "house" | "guide" | "sign" | "player"; baseY: number };

export class WorldRenderer {
  private readonly terrainLayer: TerrainLayer;
  private readonly environmentLayer: EnvironmentLayer;
  private readonly entityLayer: EntityLayer;
  private readonly effectsLayer: EffectsLayer;
  private readonly hudFxLayer: HudFxLayer;
  private readonly windLeavesLayer: WindLeavesLayer;

  constructor(private readonly ctx: CanvasRenderingContext2D, private readonly canvas: HTMLCanvasElement) {
    this.terrainLayer = new TerrainLayer(ctx, canvas);
    this.environmentLayer = new EnvironmentLayer(ctx, canvas);
    this.entityLayer = new EntityLayer(ctx, canvas);
    this.effectsLayer = new EffectsLayer(ctx, canvas);
    this.hudFxLayer = new HudFxLayer(ctx, canvas);
    this.windLeavesLayer = new WindLeavesLayer(ctx, canvas);
  }

  render(state: WorldRendererState): void {
    this.terrainLayer.setState(state);
    this.environmentLayer.setState(state);
    this.entityLayer.setState(state);
    this.effectsLayer.setState(state);
    this.hudFxLayer.setState(state);
    this.windLeavesLayer.setState(state);

    this.ctx.save();
    this.ctx.translate(
      this.canvas.width / 2 - state.camera.x * PIXELS_PER_METER,
      this.canvas.height / 2 - state.camera.y * PIXELS_PER_METER
    );

    this.terrainLayer.drawGround();
    const breakables = this.environmentLayer.getVisibleBreakables();
    this.environmentLayer.drawGroundShadows(breakables);
    this.environmentLayer.drawDrops();
    this.effectsLayer.drawEnemyDeathEffects();
    this.drawWorldDepth(state, breakables);
    this.windLeavesLayer.draw(breakables);
    this.effectsLayer.drawBurnEffects();
    this.effectsLayer.drawSpellCasts();
    this.effectsLayer.drawProjectiles();
    this.effectsLayer.drawParticles();
    this.effectsLayer.drawFloatingTexts();
    this.hudFxLayer.drawAimIndicator();

    this.ctx.restore();
    this.hudFxLayer.drawScreenEffects();
  }

  private drawWorldDepth(state: WorldRendererState, breakables: readonly BreakableObject[]): void {
    const entries: DepthEntry[] = [
      { kind: "house", baseY: this.environmentLayer.getHouseBaseY() },
      { kind: "guide", baseY: GUIDE_NPC.y + GUIDE_NPC.radius * 1.18 },
      { kind: "sign", baseY: QUEST_SIGN.y + QUEST_SIGN.radius * 1.18 * 1.32 },
      { kind: "player", baseY: state.player.y + state.player.radius * 1.3 }
    ];
    for (const object of breakables) {
      entries.push({ kind: "breakable", baseY: this.environmentLayer.getBreakableBaseY(object), object });
    }
    for (const enemy of state.enemies) {
      if (Math.abs(enemy.x - state.camera.x) <= state.camera.halfWidth + 3 &&
        Math.abs(enemy.y - state.camera.y) <= state.camera.halfHeight + 3) {
        entries.push({ kind: "enemy", baseY: enemy.y + enemy.radius * 1.3, enemy });
      }
    }
    // Ground contact, rather than the top of a sprite, determines who passes in
    // front of a canopy or wall. Gameplay positions and colliders are unchanged.
    entries.sort((left, right) => left.baseY - right.baseY);
    for (const entry of entries) {
      if (entry.kind === "breakable") {
        this.environmentLayer.drawBreakable(entry.object);
      } else if (entry.kind === "enemy") {
        this.entityLayer.drawEnemy(entry.enemy);
      } else if (entry.kind === "house") {
        this.environmentLayer.drawSpawnHouse();
      } else if (entry.kind === "guide") {
        this.environmentLayer.drawGuideNpc();
      } else if (entry.kind === "sign") {
        this.environmentLayer.drawQuestSign();
      } else {
        this.effectsLayer.drawPlayerAuras();
        this.entityLayer.drawPlayer();
      }
    }
  }
}
