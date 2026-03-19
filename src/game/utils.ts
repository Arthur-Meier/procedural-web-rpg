import type { SeededRandom, Vector2, VectorWithLength } from "./types.js";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function normalize(x: number, y: number): VectorWithLength {
  const length = Math.hypot(x, y);
  if (!length) {
    return { x: 0, y: 0, length: 0 };
  }

  return { x: x / length, y: y / length, length };
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDifference(a: number, b: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashCoords(seed: number, x: number, y: number): number {
  const mixed = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  const random = createSeededRandom(mixed);
  return random();
}

export function chunkKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseChunkKey(key: string): Vector2 {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

export function pickInverseWeighted(min: number, max: number, random: SeededRandom): number {
  let totalWeight = 0;
  for (let value = min; value <= max; value += 1) {
    totalWeight += 1 / value;
  }

  let cursor = random() * totalWeight;
  for (let value = min; value <= max; value += 1) {
    cursor -= 1 / value;
    if (cursor <= 0) {
      return value;
    }
  }

  return max;
}

export function chanceWithLuck(baseChance: number, luck: number, scale = 0.03): number {
  return clamp(baseChance + Math.max(0, luck - 1) * scale, 0, 0.97);
}

export function randomBetween(random: SeededRandom, min: number, max: number): number {
  return min + (max - min) * random();
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(timestamp));
}
