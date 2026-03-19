import {
  ACTIVE_CHUNK_BUFFER,
  CHUNK_SIZE,
  MAP_DISCOVERY_RADIUS
} from "./constants.js";
import {
  chunkKey
} from "./utils.js";
import type {
  Bounds,
  BreakableObject,
  WorldChunk,
  WorldMutation,
  WorldSnapshot
} from "./types.js";
import { generateChunk } from "./world/generation.js";
import { getChunkCoordinates, getDiscoveredBounds, getObjectsNear } from "./world/queries.js";

export class World {
  seed: number;
  chunkCache: Map<string, WorldChunk>;
  activeChunkKeys: Set<string>;
  discoveredChunks: Set<string>;
  mutations: Map<string, WorldMutation>;

  constructor(seed: number, snapshot: WorldSnapshot | null = null) {
    this.seed = seed;
    this.chunkCache = new Map();
    this.activeChunkKeys = new Set();
    this.discoveredChunks = new Set(snapshot?.discoveredChunks || []);
    this.mutations = new Map(snapshot?.mutations || []);
  }

  static fromSnapshot(snapshot: WorldSnapshot): World {
    return new World(snapshot.seed, snapshot);
  }

  serialize(): WorldSnapshot {
    return {
      seed: this.seed,
      discoveredChunks: [...this.discoveredChunks],
      mutations: [...this.mutations.entries()]
    };
  }

  getChunkCoordinates(x: number, y: number): { x: number; y: number } {
    return getChunkCoordinates(x, y);
  }

  getChunk(cx: number, cy: number): WorldChunk {
    const key = chunkKey(cx, cy);

    if (!this.chunkCache.has(key)) {
      this.chunkCache.set(key, this.generateChunk(cx, cy));
    }

    const chunk = this.chunkCache.get(key);
    if (!chunk) {
      throw new Error(`Chunk ${key} nao foi gerado corretamente.`);
    }

    return chunk;
  }

  updateActiveChunks(bounds: Bounds): void {
    const minX = Math.floor(bounds.minX / CHUNK_SIZE) - ACTIVE_CHUNK_BUFFER;
    const maxX = Math.floor(bounds.maxX / CHUNK_SIZE) + ACTIVE_CHUNK_BUFFER;
    const minY = Math.floor(bounds.minY / CHUNK_SIZE) - ACTIVE_CHUNK_BUFFER;
    const maxY = Math.floor(bounds.maxY / CHUNK_SIZE) + ACTIVE_CHUNK_BUFFER;

    const nextActive = new Set<string>();
    for (let cy = minY; cy <= maxY; cy += 1) {
      for (let cx = minX; cx <= maxX; cx += 1) {
        const key = chunkKey(cx, cy);
        nextActive.add(key);
        this.getChunk(cx, cy);
      }
    }

    this.activeChunkKeys = nextActive;
  }

  getActiveChunks(): WorldChunk[] {
    return [...this.activeChunkKeys]
      .map((key) => this.chunkCache.get(key))
      .filter((chunk): chunk is WorldChunk => Boolean(chunk));
  }

  getObjectsNear(x: number, y: number, radius: number): BreakableObject[] {
    return getObjectsNear((cx, cy) => this.getChunk(cx, cy), x, y, radius);
  }

  discoverAround(x: number, y: number, radiusChunks = MAP_DISCOVERY_RADIUS): void {
    const center = this.getChunkCoordinates(x, y);
    for (let cy = center.y - radiusChunks; cy <= center.y + radiusChunks; cy += 1) {
      for (let cx = center.x - radiusChunks; cx <= center.x + radiusChunks; cx += 1) {
        this.discoveredChunks.add(chunkKey(cx, cy));
      }
    }
  }

  getDiscoveredBounds(): Bounds {
    return getDiscoveredBounds(this.discoveredChunks);
  }

  updateObjectState(object: BreakableObject): void {
    this.mutations.set(object.id, {
      hp: object.hp,
      destroyed: false
    });
  }

  destroyObject(object: BreakableObject): void {
    this.mutations.set(object.id, {
      hp: 0,
      destroyed: true
    });

    const chunk = this.chunkCache.get(object.chunkKey);
    if (!chunk) {
      return;
    }

    chunk.objects = chunk.objects.filter((entry) => entry.id !== object.id);
  }

  generateChunk(cx: number, cy: number): WorldChunk {
    return generateChunk(this.seed, cx, cy, this.mutations);
  }
}
