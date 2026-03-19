import type { BreakableKind, EnemyKind } from "./core.js";

export interface BreakableDefinition {
  kind: BreakableKind;
  name: string;
  maxHp: number;
  radius: number;
  color: string;
}

export interface BreakableObject {
  id: string;
  chunkKey: string;
  kind: BreakableKind;
  x: number;
  y: number;
  radius: number;
  maxHp: number;
  hp: number;
  solid: true;
}

export interface WorldChunk {
  cx: number;
  cy: number;
  key: string;
  objects: BreakableObject[];
}

export interface WorldMutation {
  hp: number;
  destroyed: boolean;
}

export interface WorldSnapshot {
  seed: number;
  discoveredChunks: string[];
  mutations: [string, WorldMutation][];
}

export interface RespawnEntry {
  kind: EnemyKind;
  multiplier: number;
  remaining: number;
}
