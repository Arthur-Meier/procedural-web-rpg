import fs from "node:fs";
import zlib from "node:zlib";

// Read-only PNG inspection; the artwork is edited and exported with Aseprite MCP.
const filename = process.argv[2];
if (!filename) throw new Error("Usage: node scripts/inspect-character-sheet.mjs image.png [source|sheet]");
const png = fs.readFileSync(filename);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) {
  throw new Error("Expected a non-interlaced 8-bit RGBA PNG");
}
const chunks = [];
for (let offset = 8; offset < png.length;) {
  const length = png.readUInt32BE(offset);
  if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
  offset += 12 + length;
}
const raw = zlib.inflateSync(Buffer.concat(chunks));
const stride = width * 4;
const pixels = Buffer.alloc(stride * height);
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const i = y * stride + x;
    const a = x >= 4 ? pixels[i - 4] : 0;
    const b = y ? pixels[i - stride] : 0;
    const c = y && x >= 4 ? pixels[i - stride - 4] : 0;
    const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
    if (prediction === undefined) throw new Error("Invalid PNG filter");
    pixels[i] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255;
  }
}
const rowCounts = new Array(height).fill(0);
const colCounts = new Array(width).fill(0);
let transparent = 0, translucent = 0, opaque = 0;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const alpha = pixels[(y * width + x) * 4 + 3];
  if (!alpha) transparent++;
  else if (alpha < 255) translucent++;
  else opaque++;
  if (alpha >= 128) { rowCounts[y]++; colCounts[x]++; }
}
function boundaries(counts, parts) {
  const result = [0];
  for (let i = 1; i < parts; i++) {
    const guess = Math.round(counts.length * i / parts);
    let best = guess;
    for (let d = -20; d <= 20; d++) {
      const at = guess + d;
      if (at > 0 && at < counts.length &&
          (counts[at] < counts[best] || (counts[at] === counts[best] && Math.abs(d) < Math.abs(best - guess)))) best = at;
    }
    result.push(best);
  }
  result.push(counts.length);
  return result;
}
const sourceMode = process.argv[3] === "source";
const xs = sourceMode ? boundaries(colCounts, 7) : Array.from({ length: 8 }, (_, i) => i * 96);
const ys = sourceMode ? boundaries(rowCounts, 8) : Array.from({ length: 9 }, (_, i) => i * 96);
const frames = [];
for (let row = 0; row < 8; row++) for (let column = 0; column < 7; column++) {
  let left = width, top = height, right = -1, bottom = -1, count = 0, edge = 0;
  for (let y = ys[row]; y < ys[row + 1]; y++) for (let x = xs[column]; x < xs[column + 1]; x++) {
    if (pixels[(y * width + x) * 4 + 3] >= 128) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
      if (x === xs[column] || x === xs[column + 1] - 1 || y === ys[row] || y === ys[row + 1] - 1) edge++;
    }
  }
  frames.push({ row, column, left, top, right, bottom, width: right - left + 1, height: bottom - top + 1, count, edge });
}
const report = { filename, width, height, transparent, translucent, opaque, xs, ys, frames };
const destination = process.argv[4];
if (destination) fs.writeFileSync(destination, JSON.stringify(report, null, 2) + "\n");
if (sourceMode && process.argv[5]) {
  const directions = ["down", "down-left", "left", "up-left", "up", "up-right", "right", "down-right"];
  const scale = 0.47;
  const palette = ["#10121e", "#182239", "#223154", "#2d4471", "#365b94", "#4b78b8", "#6a96d0", "#8cafd6",
    "#4a2c26", "#6f462f", "#98673e", "#c08b4f", "#dfb366", "#f3d798", "#3c4456", "#697387", "#9ba8bb",
    "#c6cfda", "#f3f3ea", "#8f8066", "#bfad88", "#e4d6b3", "#fff1d1", "#805136", "#b67c51", "#dfa976",
    "#422130", "#69283c", "#964350", "#164984", "#208aca", "#45bdf1", "#69dcff", "#dcfbff"];
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const paletteRgb = palette.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  const nearestColors = new Map();
  function nearestColor(offset) {
    const key = pixels.readUIntBE(offset, 3);
    if (nearestColors.has(key)) return nearestColors.get(key);
    let best = 0, bestDistance = Infinity;
    for (let i = 0; i < paletteRgb.length; i++) {
      const d = paletteRgb[i].reduce((sum, channel, k) => sum + (channel - pixels[offset + k]) ** 2, 0);
      if (d < bestDistance) { bestDistance = d; best = i; }
    }
    nearestColors.set(key, best);
    return best;
  }
  const artwork = frames.map(frame => {
    let footSum = 0, footCount = 0;
    for (let y = Math.max(frame.top, frame.bottom - 6); y <= frame.bottom; y++) {
      for (let x = frame.left; x <= frame.right; x++) {
        if (pixels[(y * width + x) * 4 + 3] >= 128) { footSum += x; footCount++; }
      }
    }
    const footX = footCount ? footSum / footCount : (frame.left + frame.right) / 2;
    const bitmap = new Array(96 * 96).fill(".");
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
      const sx = Math.round(footX + (x - 48) / scale);
      const sy = Math.round(frame.bottom + (y - 84) / scale);
      if (sx < xs[frame.column] || sx >= xs[frame.column + 1] || sy < ys[frame.row] || sy >= ys[frame.row + 1]) continue;
      const offset = (sy * width + sx) * 4;
      if (pixels[offset + 3] < 128) continue;
      bitmap[y * 96 + x] = alphabet[nearestColor(offset)];
    }
    return { row: frame.row, column: frame.column, direction: directions[frame.row], bitmap: bitmap.join("") };
  });
  fs.writeFileSync(process.argv[5], JSON.stringify({ cellWidth: 96, cellHeight: 96, anchor: { x: 48, y: 84 }, alphabet, palette, frames: artwork }));
}
console.log(JSON.stringify({ ...report, frames: destination ? {
  count: frames.length, empty: frames.filter(f => !f.count).length,
  maxWidth: Math.max(...frames.map(f => f.width)), maxHeight: Math.max(...frames.map(f => f.height)),
  edgePixels: frames.reduce((n, f) => n + f.edge, 0)
} : frames }, null, 2));
if (!sourceMode && (width !== 672 || height !== 768 || !transparent || frames.some(f => !f.count || f.edge))) process.exitCode = 1;
