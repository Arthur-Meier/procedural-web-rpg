export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function roundTo(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
export function normalize(x, y) {
    const length = Math.hypot(x, y);
    if (!length) {
        return { x: 0, y: 0, length: 0 };
    }
    return { x: x / length, y: y / length, length };
}
export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}
export function angleDifference(a, b) {
    let diff = b - a;
    while (diff > Math.PI)
        diff -= Math.PI * 2;
    while (diff < -Math.PI)
        diff += Math.PI * 2;
    return diff;
}
export function createSeededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function hashCoords(seed, x, y) {
    const mixed = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
    const random = createSeededRandom(mixed);
    return random();
}
export function chunkKey(x, y) {
    return `${x},${y}`;
}
export function parseChunkKey(key) {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
}
export function pickInverseWeighted(min, max, random) {
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
export function chanceWithLuck(baseChance, luck, scale = 0.03) {
    return clamp(baseChance + Math.max(0, luck - 1) * scale, 0, 0.97);
}
export function randomBetween(random, min, max) {
    return min + (max - min) * random();
}
export function formatTimestamp(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(timestamp));
}
