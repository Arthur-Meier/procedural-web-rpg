import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const root = path.resolve(process.argv[2] || "assets/environment");
const metadata = JSON.parse(fs.readFileSync(path.join(root, "forest-props.json"), "utf8"));
const atlas = readPng(path.join(root, metadata.image));
assert.equal(atlas.width, metadata.width);
assert.equal(atlas.height, metadata.height);
assert.equal(metadata.sprites.length, 9);
const sprites = [];
for (const sprite of metadata.sprites) {
  const standalone = readPng(path.join(root, sprite.file));
  assert.equal(standalone.width, sprite.width, sprite.id);
  assert.equal(standalone.height, sprite.height, sprite.id);
  const stats = alphaStats(standalone);
  assert.ok(stats.opaque > 1000 && stats.transparent > 1000, `${sprite.id}: missing artwork or transparency`);
  assert.equal(stats.translucent, 0, `${sprite.id}: nonbinary alpha`);
  assert.ok(stats.colors <= metadata.palette.length, `${sprite.id}: palette size`);
  let clipped = 0;
  for (let y = 0; y < sprite.height; y++) for (let x = 0; x < sprite.width; x++) {
    const at = (y * sprite.width + x) * 4;
    const source = ((sprite.y + y) * atlas.width + sprite.x + x) * 4;
    for (let channel = 0; channel < 4; channel++) {
      assert.equal(standalone.pixels[at + channel], atlas.pixels[source + channel], `${sprite.id}: atlas/individual mismatch at (${x},${y})`);
    }
    if ((!x || !y || x === sprite.width - 1 || y === sprite.height - 1) && standalone.pixels[at + 3]) clipped++;
  }
  assert.equal(clipped, 0, `${sprite.id}: cropped silhouette`);
  assert.ok(fs.existsSync(path.join(root, sprite.source)), `${sprite.id}: missing editable source`);
  sprites.push({ id: sprite.id, ...stats, clipped, atlasMatches: true });
}
const terrain = [];
for (const tile of metadata.terrain) {
  const image = readPng(path.join(root, tile.file));
  const stats = alphaStats(image);
  assert.equal(image.width, tile.width); assert.equal(image.height, tile.height);
  assert.equal(stats.opaque, tile.width * tile.height); assert.equal(stats.translucent, 0);
  for (let i = 0; i < tile.width; i++) for (let channel = 0; channel < 4; channel++) {
    assert.equal(image.pixels[i * 4 + channel], image.pixels[((tile.height - 1) * tile.width + i) * 4 + channel], `${tile.id}: vertical seam`);
    assert.equal(image.pixels[i * tile.width * 4 + channel], image.pixels[(i * tile.width + tile.width - 1) * 4 + channel], `${tile.id}: horizontal seam`);
  }
  const copy = fs.readFileSync(path.join(root, "sprites", tile.file));
  assert.deepEqual(copy, fs.readFileSync(path.join(root, tile.file)), `${tile.id}: individual copy`);
  assert.ok(fs.existsSync(path.join(root, tile.source)), `${tile.id}: missing editable source`);
  terrain.push({ id: tile.id, ...stats, seamlessEdges: true, individualMatches: true });
}
const result = { passed: true, atlas: alphaStats(atlas), sprites, terrain };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ passed: true, sprites: sprites.length, terrain: terrain.length, atlas: result.atlas }, null, 2));
