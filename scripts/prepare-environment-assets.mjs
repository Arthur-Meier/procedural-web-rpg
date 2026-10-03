import fs from "node:fs";
import { readPng, alphaStats } from "./png-art-utils.mjs";

// Prepare pixel plans only. Final PNGs and native sources are written by Aseprite MCP.
const mode = process.argv[2];
const filename = process.argv[3];
const destination = process.argv[4];
if (!["props", "grass", "dirt"].includes(mode) || !filename || !destination) throw new Error("Usage: node scripts/prepare-environment-assets.mjs props|grass|dirt source.png plan.json");
const image = readPng(filename);
const { width, height, pixels } = image;
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const palette = [
  "#171b20", "#272b2b", "#373e3b", "#4c5149", "#656a5e", "#818474", "#a2a48e", "#c4c3ab",
  "#202b22", "#293b29", "#344a2c", "#405832", "#51663a", "#667b42", "#7d8e4b", "#96a458",
  "#b3b86a", "#cbd084", "#24352f", "#30483a", "#405d43", "#527551", "#678960", "#87a273",
  "#29231f", "#3b2e25", "#513b2b", "#674b33", "#7e5b3c", "#96704a", "#af8759", "#c5a170",
  "#d9b88c", "#edcfa4", "#3b2725", "#57352b", "#724633", "#8d583b", "#a66b48", "#c18559",
  "#ddaa76", "#4a292a", "#66382e", "#834638", "#a05b45", "#b97553", "#d29365", "#eab586",
  "#2b3440", "#3e4954", "#56616b", "#737c83", "#929a9b", "#b4b8b1", "#d5d5c5", "#eee8d6",
  "#32343b", "#514b47", "#75695b", "#a19379", "#c6bda2", "#e4d9bc", "#182939", "#3e5868"
];
const paletteRgb = palette.map(hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16)));
const cache = new Map();
function nearest(sample) {
  const rgb = Array.isArray(sample) ? sample : [pixels[sample], pixels[sample + 1], pixels[sample + 2]];
  const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
  if (cache.has(key)) return cache.get(key);
  let best = 0, distance = Infinity;
  for (let i = 0; i < paletteRgb.length; i++) {
    const d = paletteRgb[i].reduce((sum, channel, k) => sum + (channel - rgb[k]) ** 2, 0);
    if (d < distance) { distance = d; best = i; }
  }
  cache.set(key, best);
  return best;
}
function encodeCell(size, sampler) {
  const result = new Array(size * size).fill(".");
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const source = sampler(x, y);
    if (source !== null) result[y * size + x] = alphabet[nearest(source)];
  }
  return result.join("");
}

let sprites;
if (mode === "props") {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || pixels[start * 4 + 3] < 128) continue;
    let head = 0, tail = 1, count = 0, left = width, top = height, right = 0, bottom = 0;
    queue[0] = start; visited[start] = 1;
    while (head < tail) {
      const current = queue[head++], x = current % width, y = Math.floor(current / width);
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((!dx && !dy) || nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (!visited[next] && pixels[next * 4 + 3] >= 128) { visited[next] = 1; queue[tail++] = next; }
      }
    }
    if (count > 1500) components.push({ left, top, right, bottom, count, centerX: (left + right) / 2, centerY: (top + bottom) / 2 });
  }
  const selected = components.sort((a, b) => b.count - a.count).slice(0, 9).sort((a, b) => a.centerY - b.centerY);
  if (selected.length !== 9) throw new Error(`Expected nine isolated sprites, found ${selected.length}`);
  const names = ["oak-tree", "pine-tree", "birch-tree", "gray-rock", "moss-rock", "wood-crate", "timber-house", "weathered-crate", "stone-house"];
  const ordered = [];
  for (let row = 0; row < 3; row++) ordered.push(...selected.slice(row * 3, row * 3 + 3).sort((a, b) => a.centerX - b.centerX));
  sprites = ordered.map((bounds, index) => {
    const sourceWidth = bounds.right - bounds.left + 1, sourceHeight = bounds.bottom - bounds.top + 1;
    const tree = index < 3, house = index === 6 || index === 8, rock = index === 3 || index === 4;
    const maxWidth = tree ? 230 : house ? 190 : rock ? 200 : 184;
    const maxHeight = tree ? 208 : house ? 190 : rock ? 174 : 184;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const bitmap = encodeCell(256, (x, y) => {
      const sx = Math.round(bounds.centerX + (x - 128) / scale);
      const sy = Math.round(bounds.bottom + (y - 224) / scale);
      if (sx < bounds.left || sx > bounds.right || sy < bounds.top || sy > bounds.bottom) return null;
      const offset = (sy * width + sx) * 4;
      return pixels[offset + 3] >= 128 ? offset : null;
    });
    return { name: names[index], row: Math.floor(index / 3), column: index % 3, width: 256, height: 256, anchor: { x: 128, y: 224 }, bounds, bitmap };
  });
} else {
  const bitmap = encodeCell(128, (x, y) => {
    // Blend only the eight-pixel edge bands, preserving the interior's natural pattern.
    // Quantization makes the result crisp; opposite edge pixels match exactly.
    const sample = (tx, ty) => {
      const sx = Math.min(width - 1, Math.floor((tx + 0.5) * width / 128));
      const sy = Math.min(height - 1, Math.floor((ty + 0.5) * height / 128));
      const offset = (sy * width + sx) * 4;
      return [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
    };
    const edgeX = Math.min(x, 127 - x), edgeY = Math.min(y, 127 - y);
    const weightX = edgeX < 8 ? 0.5 * (1 - edgeX / 8) : 0;
    const weightY = edgeY < 8 ? 0.5 * (1 - edgeY / 8) : 0;
    const a = sample(x, y), b = sample(127 - x, y), c = sample(x, 127 - y), d = sample(127 - x, 127 - y);
    return a.map((channel, k) => Math.round(channel * (1 - weightX) * (1 - weightY) + b[k] * weightX * (1 - weightY) + c[k] * (1 - weightX) * weightY + d[k] * weightX * weightY));
  });
  sprites = [{ name: `${mode}-ground`, row: 0, column: 0, width: 128, height: 128, bitmap }];
}
fs.writeFileSync(destination, JSON.stringify({ alphabet, palette, mode, sprites }));
console.log(JSON.stringify({ source: filename, stats: alphaStats(image), sprites: sprites.map(({ bitmap, ...rest }) => ({ ...rest, opaquePixels: bitmap.split("").filter(c => c !== ".").length })) }, null, 2));
