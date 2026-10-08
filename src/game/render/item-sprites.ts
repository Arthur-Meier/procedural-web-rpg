import type { Drop } from "../types.js";

export const ITEM_SPRITE_CELL_SIZE = 64;
export const ITEM_SPRITE_COLUMNS = 5;
export const ITEM_SPRITE_ANCHOR = Object.freeze({ x: 32, y: 32 });
export type ItemSpriteId = "slimeGoo" | "gold" | "wood" | "charcoal" | "stone";
export const ITEM_SPRITE_CELLS: Readonly<Record<ItemSpriteId, number>> = Object.freeze({
  slimeGoo: 0, gold: 1, wood: 2, charcoal: 3, stone: 4
});

/** Only presentation changes: loot identity, amounts and pickup radii stay in the drop system. */
export class ItemSpriteRenderer {
  private readonly image: HTMLImageElement | null;
  private loaded = false;

  constructor() {
    this.image = typeof Image === "undefined" ? null : new Image();
    if (!this.image) return;
    this.image.onload = () => {
      this.loaded = this.image?.naturalWidth === ITEM_SPRITE_CELL_SIZE * ITEM_SPRITE_COLUMNS &&
        this.image?.naturalHeight === ITEM_SPRITE_CELL_SIZE;
    };
    this.image.onerror = () => { this.loaded = false; };
    this.image.src = "./assets/items/loot-items.png";
  }

  draw(ctx: CanvasRenderingContext2D, drop: Drop, x: number, y: number, groundY: number): boolean {
    if (!this.loaded || !this.image) return false;
    const id = drop.kind === "gold" ? "gold" : drop.itemId;
    const size = id === "wood" ? 44 : id === "gold" ? 36 : id === "stone" ? 44 : 40;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + 15, id === "wood" ? 15 : 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, ITEM_SPRITE_CELLS[id] * ITEM_SPRITE_CELL_SIZE, 0,
      ITEM_SPRITE_CELL_SIZE, ITEM_SPRITE_CELL_SIZE,
      Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.restore();
    return true;
  }
}
