import { PIXELS_PER_METER } from "../../constants.js";
import { SPAWN_HOUSE_FOOTPRINT } from "../../game-config.js";
import { createSeededRandom, hashCoords } from "../../utils.js";
import { WorldRenderLayerBase } from "../base-layer.js";
import { TerrainTextures } from "../terrain-textures.js";

const DETAIL_CELL_METERS = 8;
const DETAIL_CELL_PIXELS = DETAIL_CELL_METERS * PIXELS_PER_METER;
const DETAIL_CANVAS_PIXELS = DETAIL_CELL_PIXELS / 2;
const MAX_DETAIL_CELLS = 48;
const HUB_LEFT = -3 * PIXELS_PER_METER;
const HUB_TOP = -1 * PIXELS_PER_METER;
const HUB_WIDTH = 11 * PIXELS_PER_METER;
const HUB_HEIGHT = 7 * PIXELS_PER_METER;

export class TerrainLayer extends WorldRenderLayerBase {
  private readonly textures = new TerrainTextures();
  private readonly detailCells = new Map<string, HTMLCanvasElement>();
  private detailSeed: number | null = null;
  private hubSurface: HTMLCanvasElement | null = null;
  private hubVersion = -1;

  drawGround(): void {
    const bounds = this.getCameraBounds();
    const left = Math.floor((bounds.minX - 1) * PIXELS_PER_METER);
    const top = Math.floor((bounds.minY - 1) * PIXELS_PER_METER);
    const width = Math.ceil((bounds.maxX - bounds.minX + 2) * PIXELS_PER_METER);
    const height = Math.ceil((bounds.maxY - bounds.minY + 2) * PIXELS_PER_METER);

    if (this.detailSeed !== this.seed) {
      this.detailCells.clear();
      this.hubSurface = null;
      this.detailSeed = this.seed;
    }

    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = this.textures.getPattern(this.ctx, "grass") ?? "#4c7647";
    this.ctx.fillRect(left, top, width, height);

    // Detail cells are transparent caches, never differently colored square tiles.
    // Their marks use world coordinates and continue across cache boundaries.
    const minCellX = Math.floor(bounds.minX / DETAIL_CELL_METERS);
    const maxCellX = Math.floor(bounds.maxX / DETAIL_CELL_METERS);
    const minCellY = Math.floor(bounds.minY / DETAIL_CELL_METERS);
    const maxCellY = Math.floor(bounds.maxY / DETAIL_CELL_METERS);
    for (let cy = minCellY; cy <= maxCellY; cy += 1) {
      for (let cx = minCellX; cx <= maxCellX; cx += 1) {
        const cell = this.getDetailCell(cx, cy);
        if (cell) {
          this.ctx.drawImage(cell, cx * DETAIL_CELL_PIXELS, cy * DETAIL_CELL_PIXELS, DETAIL_CELL_PIXELS, DETAIL_CELL_PIXELS);
        }
      }
    }

    if (left < HUB_LEFT + HUB_WIDTH && left + width > HUB_LEFT && top < HUB_TOP + HUB_HEIGHT && top + height > HUB_TOP) {
      const hub = this.getHubSurface();
      if (hub) {
        this.ctx.drawImage(hub, HUB_LEFT, HUB_TOP);
      }
    }
    this.ctx.restore();
  }

  private getDetailCell(cx: number, cy: number): HTMLCanvasElement | null {
    const key = `${cx},${cy}`;
    const cached = this.detailCells.get(key);
    if (cached) {
      this.detailCells.delete(key);
      this.detailCells.set(key, cached);
      return cached;
    }
    if (typeof document === "undefined") {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = DETAIL_CANVAS_PIXELS;
    canvas.height = DETAIL_CANVAS_PIXELS;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    // Neighboring anchors ensure each irregular patch continues across its edge.
    for (let anchorY = cy - 1; anchorY <= cy + 1; anchorY += 1) {
      for (let anchorX = cx - 1; anchorX <= cx + 1; anchorX += 1) {
        const random = createSeededRandom(Math.floor(hashCoords(this.seed + 713, anchorX, anchorY) * 0xffffffff));
        const offsetX = (anchorX - cx) * DETAIL_CANVAS_PIXELS;
        const offsetY = (anchorY - cy) * DETAIL_CANVAS_PIXELS;
        for (let patch = 0; patch < 3; patch += 1) {
          const x = offsetX + random() * DETAIL_CANVAS_PIXELS;
          const y = offsetY + random() * DETAIL_CANVAS_PIXELS;
          const radius = 18 + random() * 40;
          ctx.fillStyle = patch % 3 === 0 ? "rgba(28, 52, 29, 0.035)" : patch % 3 === 1 ? "rgba(83, 123, 69, 0.025)" : "rgba(40, 73, 38, 0.03)";
          this.drawOrganicPatch(ctx, x, y, radius, radius * 0.66, random);
        }
      }
    }

    this.detailCells.set(key, canvas);
    if (this.detailCells.size > MAX_DETAIL_CELLS) {
      const oldest = this.detailCells.keys().next().value as string | undefined;
      if (oldest !== undefined) {
        this.detailCells.delete(oldest);
      }
    }
    return canvas;
  }

  private getHubSurface(): HTMLCanvasElement | null {
    if (this.hubSurface && this.hubVersion === this.textures.version) {
      return this.hubSurface;
    }
    if (typeof document === "undefined") {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = HUB_WIDTH;
    canvas.height = HUB_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-HUB_LEFT, -HUB_TOP);
    const random = createSeededRandom(this.seed ^ 0x27a145);
    const doorX = SPAWN_HOUSE_FOOTPRINT.x;
    const doorY = SPAWN_HOUSE_FOOTPRINT.y + SPAWN_HOUSE_FOOTPRINT.height / 2;
    const dirt = this.textures.getPattern(ctx, "dirt") ?? "#876d4c";

    // An irregular worn trail joins the entrance, guide and starting clearing.
    for (let step = 0; step <= 35; step += 1) {
      const t = step / 35;
      const inverse = 1 - t;
      const worldX = inverse ** 3 * doorX + 3 * inverse ** 2 * t * (doorX + 0.3) + 3 * inverse * t ** 2 * 0.9 + t ** 3 * -1.8;
      const worldY = inverse ** 3 * doorY + 3 * inverse ** 2 * t * 3.2 + 3 * inverse * t ** 2 * 0.5 + t ** 3 * 1.25;
      const radius = (0.47 + Math.sin(t * Math.PI) * 0.2 + random() * 0.09) * PIXELS_PER_METER;
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = dirt;
      this.drawOrganicPatch(ctx, worldX * PIXELS_PER_METER, worldY * PIXELS_PER_METER, radius * 1.36, radius * 0.97, random);
      ctx.globalAlpha = 0.84;
      this.drawOrganicPatch(ctx, worldX * PIXELS_PER_METER, worldY * PIXELS_PER_METER, radius, radius * 0.67, random);
    }
    ctx.globalAlpha = 1;
    this.hubSurface = canvas;
    this.hubVersion = this.textures.version;
    return canvas;
  }

  private drawOrganicPatch(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    random: () => number
  ): void {
    ctx.beginPath();
    for (let point = 0; point < 18; point += 1) {
      const angle = point / 18 * Math.PI * 2;
      const irregularity = 0.78 + random() * 0.32;
      const px = Math.round(x + Math.cos(angle) * radiusX * irregularity);
      const py = Math.round(y + Math.sin(angle) * radiusY * irregularity);
      if (point === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}
