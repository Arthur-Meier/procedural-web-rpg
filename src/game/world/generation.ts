import { BREAKABLES, CHUNK_SIZE } from "../constants.js";
import { chunkKey, createSeededRandom, distance, randomBetween } from "../utils.js";
import type { BreakableKind, BreakableObject, WorldChunk, WorldMutation } from "../types.js";

interface GenerationRule {
  kind: BreakableKind;
  min: number;
  max: number;
  spacing: number;
  chance?: number;
}

const GENERATION_RULES: GenerationRule[] = [
  { kind: "tree", min: 3, max: 6, spacing: 2.7 },
  { kind: "rock", min: 2, max: 4, spacing: 2.5 },
  { kind: "crate", min: 1, max: 2, spacing: 2.3, chance: 0.75 }
];

export function generateChunk(seed: number, cx: number, cy: number, mutations: Map<string, WorldMutation>): WorldChunk {
  const chunkSeed = (((seed >>> 0) ^ Math.imul(cx, 73856093)) ^ Math.imul(cy, 19349663)) >>> 0;
  const random = createSeededRandom(chunkSeed);
  const baseX = cx * CHUNK_SIZE;
  const baseY = cy * CHUNK_SIZE;
  const objects: BreakableObject[] = [];

  for (const rule of GENERATION_RULES) {
    if (rule.chance && random() > rule.chance) {
      continue;
    }

    const count = rule.min + Math.floor(random() * (rule.max - rule.min + 1));
    for (let index = 0; index < count; index += 1) {
      const id = `${rule.kind}:${cx}:${cy}:${index}`;
      const mutation = mutations.get(id);
      if (mutation?.destroyed) {
        continue;
      }

      const config = BREAKABLES[rule.kind];
      let placed = false;

      for (let attempt = 0; attempt < 24; attempt += 1) {
        const x = randomBetween(random, baseX + 1.8, baseX + CHUNK_SIZE - 1.8);
        const y = randomBetween(random, baseY + 1.8, baseY + CHUNK_SIZE - 1.8);

        if (distance(x, y, 0, 0) < 6.5) {
          continue;
        }

        const collision = objects.some((object) => {
          return distance(x, y, object.x, object.y) < config.radius + object.radius + rule.spacing;
        });

        if (collision) {
          continue;
        }

        objects.push({
          id,
          chunkKey: chunkKey(cx, cy),
          kind: rule.kind,
          x,
          y,
          radius: config.radius,
          maxHp: config.maxHp,
          hp: mutation?.hp ?? config.maxHp,
          solid: true
        });
        placed = true;
        break;
      }

      if (!placed) {
        continue;
      }
    }
  }

  return {
    cx,
    cy,
    key: chunkKey(cx, cy),
    objects
  };
}
