import { CHUNK_SIZE } from "../constants.js";
import { parseChunkKey } from "../utils.js";
export function getChunkCoordinates(x, y) {
    return {
        x: Math.floor(x / CHUNK_SIZE),
        y: Math.floor(y / CHUNK_SIZE)
    };
}
export function getObjectsNear(getChunk, x, y, radius) {
    const minX = Math.floor((x - radius) / CHUNK_SIZE);
    const maxX = Math.floor((x + radius) / CHUNK_SIZE);
    const minY = Math.floor((y - radius) / CHUNK_SIZE);
    const maxY = Math.floor((y + radius) / CHUNK_SIZE);
    const matches = [];
    for (let cy = minY; cy <= maxY; cy += 1) {
        for (let cx = minX; cx <= maxX; cx += 1) {
            const chunk = getChunk(cx, cy);
            for (const object of chunk.objects) {
                if (Math.abs(object.x - x) <= radius + object.radius && Math.abs(object.y - y) <= radius + object.radius) {
                    matches.push(object);
                }
            }
        }
    }
    return matches;
}
export function getDiscoveredBounds(discoveredChunks) {
    if (!discoveredChunks.size) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const key of discoveredChunks) {
        const parsed = parseChunkKey(key);
        minX = Math.min(minX, parsed.x);
        maxX = Math.max(maxX, parsed.x);
        minY = Math.min(minY, parsed.y);
        maxY = Math.max(maxY, parsed.y);
    }
    return { minX, maxX, minY, maxY };
}
