import type { EnemyKind } from "../types.js";
import { Enemy } from "./enemy.js";

export class Slime extends Enemy {
  static override get kind(): EnemyKind {
    return "slime";
  }

  static override get multiplier() {
    return 1;
  }
}
