import type { Player } from "../types.js";
import {
  getPlayerSpriteFrame,
  PLAYER_SPRITE_CELL_SIZE,
  PLAYER_SPRITE_COLUMNS,
  PLAYER_SPRITE_DIRECTIONS,
  PLAYER_SPRITE_FOOT_ANCHOR
} from "../state/player-animation.js";

const PLAYER_SPRITE_SIZE = 72;

export class PlayerSpriteRenderer {
  private readonly image: HTMLImageElement | null;
  private loaded = false;

  constructor() {
    this.image = typeof Image === "undefined" ? null : new Image();
    if (!this.image) {
      return;
    }

    this.image.onload = () => {
      this.loaded = this.image?.naturalWidth === PLAYER_SPRITE_CELL_SIZE * PLAYER_SPRITE_COLUMNS &&
        this.image?.naturalHeight === PLAYER_SPRITE_CELL_SIZE * PLAYER_SPRITE_DIRECTIONS.length;
    };
    this.image.onerror = () => { this.loaded = false; };
    this.image.src = "/assets/characters/blue-orb-knight.png";
  }

  draw(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number, timestamp: number): boolean {
    if (!this.loaded || !this.image) {
      return false;
    }

    const { column, row } = getPlayerSpriteFrame(player);
    const scale = PLAYER_SPRITE_SIZE / PLAYER_SPRITE_CELL_SIZE;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (player.invulnerability > 0) {
      ctx.globalAlpha *= Math.floor(timestamp / 70) % 2 === 0 ? 0.45 : 1;
      ctx.filter = "brightness(1.5)";
    }
    ctx.drawImage(
      this.image,
      column * PLAYER_SPRITE_CELL_SIZE,
      row * PLAYER_SPRITE_CELL_SIZE,
      PLAYER_SPRITE_CELL_SIZE,
      PLAYER_SPRITE_CELL_SIZE,
      Math.round(x - PLAYER_SPRITE_FOOT_ANCHOR.x * scale),
      Math.round(y - PLAYER_SPRITE_FOOT_ANCHOR.y * scale),
      PLAYER_SPRITE_SIZE,
      PLAYER_SPRITE_SIZE
    );
    ctx.restore();
    return true;
  }
}
