import { mkdir, writeFile } from "node:fs/promises";
import { readPng } from "./png-art-utils.mjs";

// Read the retained original references; write pixel instructions only.
// All image/source drawing and exports are performed through Aseprite MCP.
const output = "output/terrain-preparation", alphabet = "0123456789ab";
await mkdir(output, { recursive: true });
const materials = {
  grass: ["#2d4e2c", "#345733", "#3a6038", "#40683d", "#466f42", "#4c7647", "#537d4c", "#5a8452", "#628b57", "#6a925c", "#739963", "#7b9e68"],
  dirt: ["#665237", "#715b3e", "#7c6445", "#876d4c", "#927653", "#9d805b", "#a78a63", "#b0946c"]
};
for (const [name, palette] of Object.entries(materials)) {
  const reference = `assets/environment/${name}-ground-generated.png`, source = readPng(reference);
  const sample = (x, y) => {
    const span = name === "grass" ? Math.min(384, source.width, source.height) : source.width;
    const sx = Math.min(source.width - 1, Math.floor((source.width - span) / 2 + (x + .5) * span / 128));
    const sy = Math.min(source.height - 1, Math.floor((source.height - span) / 2 + (y + .5) * span / 128));
    const at = (sy * source.width + sx) * 4;
    return source.pixels[at] * .25 + source.pixels[at + 1] * .6 + source.pixels[at + 2] * .15;
  };
  // Grass samples a smaller original region directly: leaf shapes remain large
  // enough to read, with sharp pixels and no averaging/filtering of the blades.
  const size = name === "grass" ? 128 : 64;
  const tones = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) =>
    name === "grass" ? sample(x, y) :
      (sample(x * 2, y * 2) + sample(x * 2 + 1, y * 2) + sample(x * 2, y * 2 + 1) + sample(x * 2 + 1, y * 2 + 1)) / 4));
  const mean = tones.flat().reduce((sum, v) => sum + v, 0) / (size * size);
  const quantize = tone => Math.max(0, Math.min(palette.length - 1,
    Math.round((name === "grass" ? 5.2 : 3.5) + (tone - mean) * (name === "grass" ? .8 / 7 : .65 / 10))));
  const grid = Array.from({ length: 128 }, (_, y) => Array.from({ length: 128 }, (_, x) => quantize(tones[Math.floor(y * size / 128)][Math.floor(x * size / 128)])));
  let seed = name === "grass" ? 739721 : 92017;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const rect = (x, y, w, h, color) => {
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) grid[(py + 128) % 128][(px + 128) % 128] = color;
  };
  // Earth retains its small worn accents; grass uses the original blade shapes.
  for (let mark = 0; mark < (name === "grass" ? 0 : 40); mark++) {
    const x = Math.floor(random() * 128), y = Math.floor(random() * 128), base = grid[y][x];
    const dark = Math.max(0, base - 2), light = Math.min(palette.length - 1, base + 2);
    rect(x, y, 3, 2, light); rect(x + 1, y + 2, 3, 1, dark);
  }
  // A single grass seam retains the sharp interior; earth keeps its prior seams.
  const seamWidth = name === "grass" ? 1 : 4;
  for (let y = 0; y < 128; y++) for (let i = 0; i < seamWidth; i++) {
    const mix = Math.round((grid[y][i] + grid[y][127 - i]) / 2);
    grid[y][i] = mix; grid[y][127 - i] = mix;
  }
  for (let x = 0; x < 128; x++) for (let i = 0; i < seamWidth; i++) {
    const mix = Math.round((grid[i][x] + grid[127 - i][x]) / 2);
    grid[i][x] = mix; grid[127 - i][x] = mix;
  }
  const plan = { name, reference, width: 128, height: 128, alphabet, palette, rows: grid.map(row => row.map(v => alphabet[v]).join("")) };
  await writeFile(`${output}/${name}-plan.json`, JSON.stringify(plan));
}
console.log(`Prepared original-derived terrain plans in ${output}; export through Aseprite MCP.`);
