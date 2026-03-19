import { CHUNK_SIZE, PIXELS_PER_METER } from "../../constants.js";
import { hashCoords } from "../../utils.js";
import { WorldRenderLayerBase } from "../base-layer.js";

export class TerrainLayer extends WorldRenderLayerBase {
  drawGround(): void {
    const cellMeters = 2;
    const cellPixels = cellMeters * PIXELS_PER_METER;
    const bounds = this.getCameraBounds();

    this.ctx.fillStyle = "#223b28";
    this.ctx.fillRect(
      (bounds.minX - 3) * PIXELS_PER_METER,
      (bounds.minY - 3) * PIXELS_PER_METER,
      (bounds.maxX - bounds.minX + 6) * PIXELS_PER_METER,
      (bounds.maxY - bounds.minY + 6) * PIXELS_PER_METER
    );

    for (const chunk of this.world.getActiveChunks()) {
      const baseX = chunk.cx * CHUNK_SIZE;
      const baseY = chunk.cy * CHUNK_SIZE;

      for (let y = 0; y < 12; y += 1) {
        for (let x = 0; x < 12; x += 1) {
          const worldX = baseX + x * cellMeters;
          const worldY = baseY + y * cellMeters;
          const noise = hashCoords(this.seed, baseX + x, baseY + y);
          const moisture = hashCoords(this.seed + 17, baseX + x, baseY + y);
          const detail = hashCoords(this.seed + 91, baseX + x, baseY + y);
          const patch = hashCoords(this.seed + 141, baseX + x, baseY + y);
          const flowers = hashCoords(this.seed + 211, baseX + x, baseY + y);
          const stones = hashCoords(this.seed + 257, baseX + x, baseY + y);
          const dirt = hashCoords(this.seed + 307, baseX + x, baseY + y);
          const glow = hashCoords(this.seed + 353, baseX + x, baseY + y);
          const screenX = worldX * PIXELS_PER_METER;
          const screenY = worldY * PIXELS_PER_METER;

          this.ctx.fillStyle =
            noise > 0.86 ? "#5f9255" :
            noise > 0.7 ? "#517f49" :
            moisture > 0.64 ? "#456f43" :
            "#35593a";
          this.ctx.fillRect(screenX, screenY, cellPixels + 1, cellPixels + 1);

          this.ctx.fillStyle = "rgba(255, 244, 214, 0.04)";
          this.ctx.fillRect(screenX, screenY, cellPixels + 1, cellPixels * 0.16);
          this.ctx.fillStyle = "rgba(8, 20, 14, 0.08)";
          this.ctx.fillRect(screenX, screenY + cellPixels * 0.82, cellPixels + 1, cellPixels * 0.22);

          if (patch > 0.82) {
            this.ctx.fillStyle = "rgba(84, 124, 72, 0.22)";
            this.ctx.beginPath();
            this.ctx.ellipse(
              (worldX + 1) * PIXELS_PER_METER,
              (worldY + 1) * PIXELS_PER_METER,
              cellPixels * 0.45,
              cellPixels * 0.28,
              0,
              0,
              Math.PI * 2
            );
            this.ctx.fill();
          }

          if (dirt > 0.44 && dirt < 0.56) {
            this.ctx.fillStyle = "rgba(113, 88, 50, 0.2)";
            this.ctx.beginPath();
            this.ctx.ellipse(
              screenX + cellPixels * 0.48,
              screenY + cellPixels * 0.72,
              cellPixels * 0.34,
              cellPixels * 0.12,
              -0.28,
              0,
              Math.PI * 2
            );
            this.ctx.fill();
          }

          if (detail > 0.72) {
            this.ctx.fillStyle = detail > 0.9 ? "#f4d68d" : "#9ed26f";
            this.ctx.fillRect((worldX + 0.48) * PIXELS_PER_METER, (worldY + 0.74) * PIXELS_PER_METER, 3, 10);
            this.ctx.fillRect((worldX + 1.12) * PIXELS_PER_METER, (worldY + 0.6) * PIXELS_PER_METER, 2, 11);
            this.ctx.fillRect((worldX + 1.48) * PIXELS_PER_METER, (worldY + 0.86) * PIXELS_PER_METER, 2, 9);
          }

          if (detail < 0.12) {
            this.ctx.fillStyle = "rgba(41, 60, 45, 0.45)";
            this.ctx.fillRect((worldX + 0.28) * PIXELS_PER_METER, (worldY + 1.18) * PIXELS_PER_METER, 12, 4);
          }

          if (flowers > 0.94) {
            this.ctx.fillStyle = flowers > 0.975 ? "#ffd98c" : "#ffc7da";
            this.ctx.fillRect(screenX + cellPixels * 0.32, screenY + cellPixels * 0.46, 3, 3);
            this.ctx.fillRect(screenX + cellPixels * 0.35, screenY + cellPixels * 0.42, 3, 3);
            this.ctx.fillRect(screenX + cellPixels * 0.38, screenY + cellPixels * 0.46, 3, 3);
            this.ctx.fillRect(screenX + cellPixels * 0.35, screenY + cellPixels * 0.5, 3, 3);
            this.ctx.fillStyle = "#f5f2bf";
            this.ctx.fillRect(screenX + cellPixels * 0.36, screenY + cellPixels * 0.46, 2, 2);
          }

          if (stones < 0.14) {
            this.ctx.fillStyle = "rgba(197, 205, 212, 0.24)";
            this.ctx.fillRect(screenX + cellPixels * 0.66, screenY + cellPixels * 0.7, 5, 3);
            this.ctx.fillRect(screenX + cellPixels * 0.74, screenY + cellPixels * 0.64, 4, 3);
          }

          if (glow > 0.97) {
            this.ctx.fillStyle = "rgba(250, 237, 176, 0.12)";
            this.ctx.beginPath();
            this.ctx.arc(screenX + cellPixels * 0.78, screenY + cellPixels * 0.26, 4, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
      }
    }
  }
}
