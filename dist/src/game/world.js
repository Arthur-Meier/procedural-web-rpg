import { ACTIVE_CHUNK_BUFFER, CHUNK_SIZE, MAP_DISCOVERY_RADIUS } from "./constants.js";
import { chunkKey } from "./utils.js";
import { generateChunk } from "./world/generation.js";
import { getChunkCoordinates, getDiscoveredBounds, getObjectsNear } from "./world/queries.js";
export class World {
    constructor(seed, snapshot = null) {
        this.seed = seed;
        this.chunkCache = new Map();
        this.activeChunkKeys = new Set();
        this.discoveredChunks = new Set(snapshot?.discoveredChunks || []);
        this.mutations = new Map(snapshot?.mutations || []);
    }
    static fromSnapshot(snapshot) {
        return new World(snapshot.seed, snapshot);
    }
    serialize() {
        return {
            seed: this.seed,
            discoveredChunks: [...this.discoveredChunks],
            mutations: [...this.mutations.entries()]
        };
    }
    getChunkCoordinates(x, y) {
        return getChunkCoordinates(x, y);
    }
    getChunk(cx, cy) {
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
    updateActiveChunks(bounds) {
        const minX = Math.floor(bounds.minX / CHUNK_SIZE) - ACTIVE_CHUNK_BUFFER;
        const maxX = Math.floor(bounds.maxX / CHUNK_SIZE) + ACTIVE_CHUNK_BUFFER;
        const minY = Math.floor(bounds.minY / CHUNK_SIZE) - ACTIVE_CHUNK_BUFFER;
        const maxY = Math.floor(bounds.maxY / CHUNK_SIZE) + ACTIVE_CHUNK_BUFFER;
        const nextActive = new Set();
        for (let cy = minY; cy <= maxY; cy += 1) {
            for (let cx = minX; cx <= maxX; cx += 1) {
                const key = chunkKey(cx, cy);
                nextActive.add(key);
                this.getChunk(cx, cy);
            }
        }
        this.activeChunkKeys = nextActive;
    }
    getActiveChunks() {
        return [...this.activeChunkKeys]
            .map((key) => this.chunkCache.get(key))
            .filter((chunk) => Boolean(chunk));
    }
    getObjectsNear(x, y, radius) {
        return getObjectsNear((cx, cy) => this.getChunk(cx, cy), x, y, radius);
    }
    discoverAround(x, y, radiusChunks = MAP_DISCOVERY_RADIUS) {
        const center = this.getChunkCoordinates(x, y);
        for (let cy = center.y - radiusChunks; cy <= center.y + radiusChunks; cy += 1) {
            for (let cx = center.x - radiusChunks; cx <= center.x + radiusChunks; cx += 1) {
                this.discoveredChunks.add(chunkKey(cx, cy));
            }
        }
    }
    getDiscoveredBounds() {
        return getDiscoveredBounds(this.discoveredChunks);
    }
    updateObjectState(object) {
        this.mutations.set(object.id, {
            hp: object.hp,
            destroyed: false
        });
    }
    destroyObject(object) {
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
    generateChunk(cx, cy) {
        return generateChunk(this.seed, cx, cy, this.mutations);
    }
}
