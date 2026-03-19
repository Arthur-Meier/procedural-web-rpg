import type { FacingDirection } from "../app-types.js";
import type { Player } from "../types.js";
import { roundTo } from "../utils.js";

export function computePhysicalDamage(player: Player): number {
  return roundTo(player.stats.strength * 0.1 + player.weapons.sword.physicalMultiplier, 1);
}

export function computeMagicDamage(player: Player): number {
  return roundTo(player.stats.intelligence * 0.1 + player.weapons.staff.magicMultiplier, 1);
}

export function computeMoveSpeed(player: Player): number {
  return roundTo(player.stats.agility * 0.5, 1);
}

export function xpRequiredForNextLevel(level: number): number {
  return level + 9;
}

export function getFacingDirection(angle: number): FacingDirection {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (Math.abs(cos) > Math.abs(sin)) {
    return cos >= 0 ? "right" : "left";
  }

  return sin >= 0 ? "down" : "up";
}
