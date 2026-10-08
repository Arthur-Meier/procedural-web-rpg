import { PIXELS_PER_METER } from "../constants.js";
import type { BreakableObject } from "../types.js";
import { WorldRenderLayerBase } from "./base-layer.js";
import { getBreakableSprite, getEnvironmentVisualHash } from "./environment-sprites.js";
import { windTravel } from "./wind.js";

export const MAX_WIND_LEAVES = 48;

export class WindLeavesLayer extends WorldRenderLayerBase {
  private readonly image = typeof Image === "undefined" ? null : new Image();
  private loaded = false;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    super(ctx, canvas);
    if (this.image) {
      this.image.onload = () => { this.loaded = this.image?.naturalWidth === 192 && this.image?.naturalHeight === 16; };
      this.image.onerror = () => { this.loaded = false; };
      this.image.src = "./assets/environment/wind-leaves.png";
    }
  }

  draw(objects: readonly BreakableObject[]): void {
    const seconds = Math.max(0, this.lastTimestamp) / 1000;
    const bounds = this.getCameraBounds();
    let count = 0;
    for (const object of objects) {
      if (object.kind !== "tree") continue;
      const hash = getEnvironmentVisualHash(object.id, this.seed);
      const size = getBreakableSprite(object, this.seed).size;
      for (let slot = 0; slot < 2; slot++) {
        const key = (hash + Math.imul(slot + 1, 2654435761)) >>> 0;
        const lifetime = 6 + (key % 31) / 10;
        const age = (seconds + ((key >>> 8) % 1000) / 1000 * lifetime) % lifetime;
        const born = seconds - age;
        const phase = key % 628 / 100;
        // Analytic trajectories avoid particle accumulation, frame-rate dependence and save state.
        const x = object.x * PIXELS_PER_METER + ((key >>> 16) % 91 - 45) * size / 256
          + windTravel(seconds) - windTravel(born) + Math.sin(age * 2.5 + phase) * 9;
        const y = object.y * PIXELS_PER_METER - size * (0.42 + (key % 21) / 100)
          + age * (12 + key % 6) + Math.sin(age * 3 + phase) * 6;
        if (x < bounds.minX * PIXELS_PER_METER - 16 || x > bounds.maxX * PIXELS_PER_METER + 16 ||
          y < bounds.minY * PIXELS_PER_METER - 16 || y > bounds.maxY * PIXELS_PER_METER + 16) continue;
        const alpha = Math.min(1, age / 0.6, (lifetime - age) / 0.9) * 0.85;
        const variant = key % 3;
        const frame = variant * 4 + Math.floor(age / 0.16 + phase) % 4;
        const leafSize = 18 + key % 7;
        this.ctx.save();
        this.ctx.globalAlpha *= alpha;
        this.ctx.translate(Math.round(x), Math.round(y));
        this.ctx.rotate(Math.sin(age * 1.9 + phase) * 0.7 + age * 0.35);
        this.ctx.imageSmoothingEnabled = false;
        if (this.loaded && this.image) {
          this.ctx.drawImage(this.image, frame * 16, 0, 16, 16, -leafSize / 2, -leafSize / 2, leafSize, leafSize);
        } else {
          this.ctx.fillStyle = ["#a2b861", "#d8b75c", "#b58246"][variant];
          this.ctx.beginPath();
          this.ctx.moveTo(-5, 3); this.ctx.lineTo(-3, -2); this.ctx.lineTo(5, -4);
          this.ctx.lineTo(4, 1); this.ctx.lineTo(-1, 4); this.ctx.closePath(); this.ctx.fill();
          this.ctx.fillStyle = "#55462b"; this.ctx.fillRect(-5, 3, 2, 3);
        }
        this.ctx.restore();
        if (++count >= MAX_WIND_LEAVES) return;
      }
    }
  }
}
