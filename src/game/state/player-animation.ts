import type { Player } from "../types.js";

export const PLAYER_SPRITE_DIRECTIONS = [
  "down", "down-left", "left", "up-left", "up", "up-right", "right", "down-right"
] as const;
export const PLAYER_SPRITE_CELL_SIZE = 96;
export const PLAYER_SPRITE_COLUMNS = 7;
export const PLAYER_SPRITE_FOOT_ANCHOR = { x: 48, y: 84 } as const;
export const PLAYER_WALK_FRAME_DURATION = 0.1;
export const PLAYER_WALK_FRAME_COUNT = 6;

export type PlayerSpriteDirection = typeof PLAYER_SPRITE_DIRECTIONS[number];

export interface PlayerSpriteFrame {
  direction: PlayerSpriteDirection;
  row: number;
  column: number;
}

export function stopPlayerAnimation(player: Player): void {
  const animation = player.animation ?? (player.animation = { walking: false, elapsed: 0 });
  animation.walking = false;
  animation.elapsed = 0;
}

export function updatePlayerAnimation(player: Player, dt: number, travelledDistance: number): void {
  if (!Number.isFinite(dt) || dt <= 0 || !Number.isFinite(travelledDistance) || travelledDistance <= 0.000001) {
    stopPlayerAnimation(player);
    return;
  }

  const animation = player.animation ?? (player.animation = { walking: false, elapsed: 0 });
  const previousElapsed = animation.walking ? animation.elapsed : 0;
  animation.walking = true;
  animation.elapsed = (previousElapsed + dt) % (PLAYER_WALK_FRAME_DURATION * PLAYER_WALK_FRAME_COUNT);
}

export function getPlayerSpriteFrame(player: Player): PlayerSpriteFrame {
  const angle = Number.isFinite(player.facingAngle) ? player.facingAngle : Math.PI / 2;
  const fullTurn = Math.PI * 2;
  const normalizedAngle = ((angle % fullTurn) + fullTurn) % fullTurn;
  const sector = Math.floor((normalizedAngle + Math.PI / 8) / (Math.PI / 4)) % 8;
  const row = (sector + 6) % 8;
  const animation = player.animation;
  const column = animation?.walking
    ? 1 + Math.floor(animation.elapsed / PLAYER_WALK_FRAME_DURATION + 0.0000001) % PLAYER_WALK_FRAME_COUNT
    : 0;

  return { direction: PLAYER_SPRITE_DIRECTIONS[row], row, column };
}
