import fs from "node:fs";
import path from "node:path";
import { readPng } from "./png-art-utils.mjs";

// Produce pixel instructions only. Aseprite MCP creates all images and sources.
const reference = "Img referencias/Folha de Sprites do Slime Azul.png";
const image = readPng(reference);
const palette = ["#101629", "#172858", "#164a91", "#0769ca", "#008bef", "#009ef7", "#00b4f5", "#00c9fa", "#13ddff", "#43e7ff", "#76eeff", "#b4f7ff", "#e5fcff", "#ffffff"];
const rgb = palette.map(hex => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16)));
const groups = [
  { name: "idle", duration: 150, rects: [[323,151,132,101],[565,151,137,101],[808,150,134,102],[1050,150,132,102]] },
  { name: "move-down", duration: 100, rects: [[330,293,123,104],[572,293,123,104],[814,293,122,104],[1055,293,122,104]] },
  { name: "move-left", duration: 100, rects: [[327,439,126,100],[569,439,126,100],[811,439,126,100],[1052,439,126,100]] },
  { name: "move-up", duration: 100, rects: [[325,581,129,104],[568,581,129,104],[811,581,129,104],[1053,581,129,104]] },
  { name: "attack", duration: 65, rects: [[205,746,128,103],[383,755,134,93],[573,746,191,101],[798,766,218,80],[1060,746,134,103],[1271,746,130,103]] },
  { name: "hurt-defeat", duration: 100, rects: [[310,924,131,102],[551,929,143,96],[776,961,214,64],[1039,969,216,57]] }
];
function sample(x, y) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return [0, 0, 0, 0];
  return Array.from(image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4));
}
const isBlue = ([r, g, b, a]) => a > 0 && b > 130 && b - r > 35 && g > 55;
const isLight = ([r, g, b, a]) => a > 0 && r > 155 && g > 200 && b > 215;
const nearest = color => {
  let best = 0, error = Infinity;
  rgb.forEach((candidate, index) => {
    const distance = candidate.reduce((sum, value, channel) => sum + (value - color[channel]) ** 2, 0);
    if (distance < error) { error = distance; best = index; }
  });
  return palette[best];
};
const frames = [], tags = [];
for (const group of groups) {
  const start = frames.length;
  for (const [left, top, width, height] of group.rects) {
    const points = [];
    for (let y = 0; y < Math.ceil(height / 3); y++) for (let x = 0; x < Math.ceil(width / 3); x++) {
      const sx = left + x * 3 + 1, sy = top + y * 3 + 1, color = sample(sx, sy);
      const dark = Math.max(...color.slice(0, 3)) < 46;
      let nearBody = false;
      if (dark) for (let dy = -5; dy <= 5 && !nearBody; dy++) for (let dx = -5; dx <= 5; dx++) {
        if (isBlue(sample(sx + dx, sy + dy))) { nearBody = true; break; }
      }
      if (isBlue(color) || isLight(color) || (dark && nearBody)) points.push({ x, y, color: nearest(color) });
    }
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));
    const shiftX = 40 - Math.round((minX + maxX) / 2), shiftY = 53 - maxY;
    const pixels = points.map(p => ({ ...p, x: p.x + shiftX, y: p.y + shiftY }));
    if (pixels.some(p => p.x < 2 || p.x > 77 || p.y < 2 || p.y > 61)) throw new Error(`Clipping in ${group.name}`);
    frames.push({ name: group.name, duration: group.duration, pixels });
  }
  tags.push({ name: group.name, from: start, to: frames.length - 1 });
}
fs.mkdirSync(".runtime/slime", { recursive: true });
fs.writeFileSync(".runtime/slime/pixel-plan.json", JSON.stringify({ reference, width: 80, height: 64, anchor: { x: 40, y: 54 }, palette, tags, frames }));
console.log(JSON.stringify({ reference, frames: frames.length, tags, palette: palette.length, plan: path.resolve(".runtime/slime/pixel-plan.json") }, null, 2));
