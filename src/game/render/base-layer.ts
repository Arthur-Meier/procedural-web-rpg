import { PIXELS_PER_METER } from "../constants.js";
import { clamp } from "../utils.js";
import type {
  BurnEffect,
  EffectParticle,
  EnemyDeathEffect,
  FloatingTextEffect,
  PendingSpellCast,
  PlayerAuraEffect
} from "../app-types.js";
import type { DayNightLightingState } from "../day-night.js";
import type { CameraState, Drop, EnemyEntity, Player, Projectile } from "../types.js";
import { World } from "../world.js";
import type { WorldRendererState } from "./render-types.js";

export abstract class WorldRenderLayerBase {
  constructor(
    protected readonly ctx: CanvasRenderingContext2D,
    protected readonly canvas: HTMLCanvasElement
  ) {}

  protected state!: WorldRendererState;

  setState(state: WorldRendererState): void {
    this.state = state;
  }

  protected get world(): World {
    return this.state.world;
  }

  protected get player(): Player {
    return this.state.player;
  }

  protected get enemies(): EnemyEntity[] {
    return this.state.enemies;
  }

  protected get projectiles(): Projectile[] {
    return this.state.projectiles;
  }

  protected get drops(): Drop[] {
    return this.state.drops;
  }

  protected get particles(): EffectParticle[] {
    return this.state.particles;
  }

  protected get burnEffects(): BurnEffect[] {
    return this.state.burnEffects;
  }

  protected get floatingTexts(): FloatingTextEffect[] {
    return this.state.floatingTexts;
  }

  protected get pendingSpellCasts(): PendingSpellCast[] {
    return this.state.pendingSpellCasts;
  }

  protected get enemyDeathEffects(): EnemyDeathEffect[] {
    return this.state.enemyDeathEffects;
  }

  protected get playerAuraEffects(): PlayerAuraEffect[] {
    return this.state.playerAuraEffects;
  }

  protected get camera(): CameraState {
    return this.state.camera;
  }

  protected get seed(): number {
    return this.state.seed;
  }

  protected get lastTimestamp(): number {
    return this.state.lastTimestamp;
  }

  protected get dayNight(): DayNightLightingState {
    return this.state.dayNight;
  }

  protected drawBar(x: number, y: number, ratio: number, color: string): void {
    const screenX = x * PIXELS_PER_METER;
    const screenY = y * PIXELS_PER_METER;
    const width = 44;
    const height = 7;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    this.ctx.fillRect(screenX - width / 2, screenY, width, height);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(screenX - width / 2, screenY, width * clamp(ratio, 0, 1), height);
  }

  protected getCameraBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: this.camera.x - this.camera.halfWidth,
      maxX: this.camera.x + this.camera.halfWidth,
      minY: this.camera.y - this.camera.halfHeight,
      maxY: this.camera.y + this.camera.halfHeight
    };
  }
}
