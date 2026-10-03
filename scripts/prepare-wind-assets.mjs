import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { readPng } from "./png-art-utils.mjs";

// Intermediate images only. Editable timelines and game exports are made via Aseprite MCP.
const output = "output/wind-preparation";
await mkdir(output, { recursive: true });
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name), result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length); type.copy(result, 4); data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([type, data])), data.length + 8);
  return result;
}
async function png(file, width, height, pixels) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  await writeFile(file, Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", header), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]));
}
const shifts = [0, 3, 5, 3, 0, -2, -4, -2];
for (const name of ["oak", "pine", "birch"]) {
  const source = readPng(`assets/environment/sprites/${name}-tree.png`);
  for (let frame = 0; frame < 8; frame++) {
    const pixels = Buffer.alloc(256 * 256 * 4);
    for (let y = 0; y < 256; y++) {
      // Roots and lower trunk never move; flex grows smoothly toward the canopy.
      const bend = Math.round(shifts[frame] * Math.pow(Math.max(0, (205 - y) / 190), 1.6));
      for (let x = 0; x < 256; x++) {
        const destX = x + bend;
        if (destX < 0 || destX >= 256) {
          if (source.pixels[(y * 256 + x) * 4 + 3]) throw Error(`${name} clipped at ${frame}`);
          continue;
        }
        source.pixels.copy(pixels, (y * 256 + destX) * 4, (y * 256 + x) * 4, (y * 256 + x) * 4 + 4);
      }
    }
    await png(`${output}/${name}-${frame}.png`, 256, 256, pixels);
  }
}
// Three leaf palettes, four tumble silhouettes each, with a stem and a lit vein.
const palettes = [["#304a21", "#769447", "#b0be64"], ["#655124", "#ba9448", "#e5c878"], ["#553725", "#a56b3b", "#d09b55"]];
const masks = [
  ["...........", "......oo...", "....oooo...", "..oooooo...", ".ooooooo...", ".oooooo....", ".ooooo.....", "..oo......."],
  ["...........", ".......o...", ".....ooo...", "...oooo....", "..oooo.....", "..ooo......", "..oo.......", "..o........"],
  ["...........", "...........", "...........", "..oooooo...", ".oooooooo..", "..oooooo...", "...........", "..........."],
  ["...........", "...oo......", "...ooo.....", "...oooo....", "....oooo...", ".....ooo...", "......oo...", ".......o..."]
];
const plans = [];
for (let variant = 0; variant < 3; variant++) for (let pose = 0; pose < 4; pose++) {
  const pixels = [];
  for (let y = 0; y < masks[pose].length; y++) for (let x = 0; x < masks[pose][y].length; x++) {
    if (masks[pose][y][x] !== "o") continue;
    const edge = ![[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) => masks[pose][y + dy]?.[x + dx] === "o");
    pixels.push({ x: x + 2, y: y + 4, color: palettes[variant][edge ? 0 : ((x + y) % 4 === 0 ? 2 : 1)] });
  }
  const stem = pose === 2 ? [[4, 10], [3, 11]] : pose === 3 ? [[10, 12], [11, 13]] : [[4, 12], [3, 13]];
  for (const [x, y] of stem) pixels.push({ x, y, color: palettes[variant][0] });
  plans.push({ frame: variant * 4 + pose + 1, pixels });
}
await writeFile(`${output}/leaves.json`, JSON.stringify(plans));
console.log("Prepared 24 anchored tree frames and 12 leaf pixel plans for Aseprite MCP.");
