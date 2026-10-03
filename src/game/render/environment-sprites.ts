import type { BreakableObject } from "../types.js";

export const ENVIRONMENT_SPRITE_CELL_SIZE = 256;
export const ENVIRONMENT_SPRITE_COLUMNS = 3;
export const ENVIRONMENT_SPRITE_ROWS = 3;
export const ENVIRONMENT_SPRITE_ANCHOR = Object.freeze({ x: 128, y: 224 });

export type EnvironmentSpriteId =
  | "oakTree"
  | "pineTree"
  | "birchTree"
  | "grayRock"
  | "mossRock"
  | "woodCrate"
  | "timberHouse"
  | "weatheredCrate"
  | "stoneHouse";

const SPRITE_CELLS: Record<EnvironmentSpriteId, { column: number; row: number }> = {
  oakTree: { column: 0, row: 0 },
  pineTree: { column: 1, row: 0 },
  birchTree: { column: 2, row: 0 },
  grayRock: { column: 0, row: 1 },
  mossRock: { column: 1, row: 1 },
  woodCrate: { column: 2, row: 1 },
  timberHouse: { column: 0, row: 2 },
  weatheredCrate: { column: 1, row: 2 },
  stoneHouse: { column: 2, row: 2 }
};

const TREE_SPRITES: readonly EnvironmentSpriteId[] = ["oakTree", "pineTree", "birchTree"];
const ROCK_SPRITES: readonly EnvironmentSpriteId[] = ["grayRock", "mossRock"];
const CRATE_SPRITES: readonly EnvironmentSpriteId[] = ["woodCrate", "weatheredCrate"];

export function getEnvironmentVisualHash(id: string, seed: number): number {
  let value = (2166136261 ^ seed) >>> 0;
  for (let index = 0; index < id.length; index += 1) {
    value = Math.imul(value ^ id.charCodeAt(index), 16777619) >>> 0;
  }
  return value;
}

export function getBreakableSprite(object: BreakableObject, seed: number): { id: EnvironmentSpriteId; size: number } {
  const hash = getEnvironmentVisualHash(object.id, seed);
  const variation = 0.94 + ((hash >>> 8) % 13) / 100;
  if (object.kind === "tree") {
    return { id: TREE_SPRITES[hash % TREE_SPRITES.length], size: Math.round(224 * variation) };
  }
  if (object.kind === "rock") {
    return { id: ROCK_SPRITES[hash % ROCK_SPRITES.length], size: Math.round(112 * variation) };
  }
  return { id: CRATE_SPRITES[hash % CRATE_SPRITES.length], size: Math.round(82 * variation) };
}

export class EnvironmentSpriteRenderer {
  private readonly image: HTMLImageElement | null;
  private loaded = false;
  private readonly windImage: HTMLImageElement | null;
  private windLoaded = false;

  constructor() {
    this.image = typeof Image === "undefined" ? null : new Image();
    this.windImage = typeof Image === "undefined" ? null : new Image();
    if (this.windImage) {
      this.windImage.onload = () => {
        this.windLoaded = this.windImage?.naturalWidth === 6144 && this.windImage?.naturalHeight === 256;
      };
      this.windImage.onerror = () => { this.windLoaded = false; };
      this.windImage.src = "/assets/environment/tree-wind.png";
    }
    if (!this.image) {
      return;
    }
    this.image.onload = () => {
      this.loaded = this.image?.naturalWidth === ENVIRONMENT_SPRITE_CELL_SIZE * ENVIRONMENT_SPRITE_COLUMNS &&
        this.image?.naturalHeight === ENVIRONMENT_SPRITE_CELL_SIZE * ENVIRONMENT_SPRITE_ROWS;
    };
    this.image.onerror = () => { this.loaded = false; };
    this.image.src = "/assets/environment/forest-props.png";
  }

  draw(ctx: CanvasRenderingContext2D, id: EnvironmentSpriteId, x: number, baseY: number, size: number, windFrame?: number): boolean {
    const treeIndex = TREE_SPRITES.indexOf(id);
    const animated = treeIndex >= 0 && windFrame !== undefined && this.windLoaded && this.windImage;
    const image = animated ? this.windImage : this.image;
    if ((!animated && !this.loaded) || !image) {
      return false;
    }
    const cell = SPRITE_CELLS[id];
    const scale = size / ENVIRONMENT_SPRITE_CELL_SIZE;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      animated ? (treeIndex * 8 + windFrame!) * ENVIRONMENT_SPRITE_CELL_SIZE : cell.column * ENVIRONMENT_SPRITE_CELL_SIZE,
      animated ? 0 : cell.row * ENVIRONMENT_SPRITE_CELL_SIZE,
      ENVIRONMENT_SPRITE_CELL_SIZE,
      ENVIRONMENT_SPRITE_CELL_SIZE,
      Math.round(x - ENVIRONMENT_SPRITE_ANCHOR.x * scale),
      Math.round(baseY - ENVIRONMENT_SPRITE_ANCHOR.y * scale),
      size,
      size
    );
    ctx.restore();
    return true;
  }
}
