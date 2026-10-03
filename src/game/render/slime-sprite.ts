import type { EnemyEntity } from "../types.js";
import { clamp } from "../utils.js";

export const SLIME_SPRITE_WIDTH = 80;
export const SLIME_SPRITE_HEIGHT = 64;
export const SLIME_SPRITE_FRAMES = 26;
export const SLIME_SPRITE_ANCHOR = { x: 40, y: 54 };

/** Animation follows existing combat timers; rendering never changes enemy state. */
export function getSlimeSpriteFrame(enemy: EnemyEntity, timestamp: number): { frame: number; mirror: boolean } {
  if (enemy.hurtTimer > 0) {
    return { frame: enemy.hurtTimer > 0.12 ? 22 : 23, mirror: false };
  }
  if (enemy.dashTimer > 0) {
    const progress = clamp(1 - enemy.dashTimer / Math.max(enemy.dashTime, 0.001), 0, 1);
    const horizontal = Math.abs(enemy.dashDirection.x) >= Math.abs(enemy.dashDirection.y);
    if (horizontal) {
      return { frame: 16 + Math.min(5, Math.floor(progress * 6)), mirror: enemy.dashDirection.x < 0 };
    }
    return { frame: (enemy.dashDirection.y < 0 ? 12 : 4) + Math.min(3, Math.floor(progress * 4)), mirror: false };
  }
  return { frame: Math.floor(Math.max(0, timestamp + enemy.id * 73) / 150) % 4, mirror: false };
}

export class SlimeSpriteRenderer {
  private readonly image: HTMLImageElement | null;
  private loaded = false;

  constructor() {
    this.image = typeof Image === "undefined" ? null : new Image();
    if (!this.image) return;
    this.image.onload = () => {
      this.loaded = this.image?.naturalWidth === SLIME_SPRITE_WIDTH * SLIME_SPRITE_FRAMES &&
        this.image?.naturalHeight === SLIME_SPRITE_HEIGHT;
    };
    this.image.onerror = () => { this.loaded = false; };
    this.image.src = "/assets/enemies/blue-slime.png";
  }

  draw(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, x: number, groundY: number, radius: number, timestamp: number): boolean {
    if (!this.loaded || !this.image) return false;
    const { frame, mirror } = getSlimeSpriteFrame(enemy, timestamp);
    const scale = radius * 2.75 / 42;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(groundY));
    if (mirror) ctx.scale(-1, 1);
    if (enemy.hurtTimer > 0) ctx.filter = "brightness(1.35)";
    ctx.drawImage(this.image, frame * SLIME_SPRITE_WIDTH, 0, SLIME_SPRITE_WIDTH, SLIME_SPRITE_HEIGHT,
      -SLIME_SPRITE_ANCHOR.x * scale, -SLIME_SPRITE_ANCHOR.y * scale,
      SLIME_SPRITE_WIDTH * scale, SLIME_SPRITE_HEIGHT * scale);
    ctx.restore();
    return true;
  }
}
