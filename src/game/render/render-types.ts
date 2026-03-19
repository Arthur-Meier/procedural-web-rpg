import type {
  BurnEffect,
  EffectParticle,
  EnemyDeathEffect,
  FloatingTextEffect,
  PendingSpellCast,
  PlayerAuraEffect,
  ResolvedSpellCastSource
} from "../app-types.js";
import type { DayNightLightingState } from "../day-night.js";
import type { CameraState, Drop, EnemyEntity, Player, Projectile } from "../types.js";
import { World } from "../world.js";

export interface WorldRendererState {
  world: World;
  player: Player;
  enemies: EnemyEntity[];
  projectiles: Projectile[];
  drops: Drop[];
  particles: EffectParticle[];
  burnEffects: BurnEffect[];
  floatingTexts: FloatingTextEffect[];
  pendingSpellCasts: PendingSpellCast[];
  enemyDeathEffects: EnemyDeathEffect[];
  playerAuraEffects: PlayerAuraEffect[];
  camera: CameraState;
  seed: number;
  lastTimestamp: number;
  dayNight: DayNightLightingState;
  resolveSpellCastSource(cast: PendingSpellCast): ResolvedSpellCastSource | null;
  isNearGuideNpc(): boolean;
}
