import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href) : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const output = path.resolve(process.argv[3] || "output/terrain-validation");
const before = process.argv[4] ? path.resolve(process.argv[4]) : null;
await mkdir(output, { recursive: true });
const checks = [], errors = [], metrics = {};
function measure(image) {
  let green = 0, edges = 0, pairs = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const p = (y * image.width + x) * 4;
    green += image.pixels[p + 1] - (image.pixels[p] + image.pixels[p + 2]) / 2;
    for (const [dx, dy] of [[1, 0], [0, 1]]) if (x + dx < image.width && y + dy < image.height) {
      const q = ((y + dy) * image.width + x + dx) * 4;
      for (let c = 0; c < 3; c++) edges += Math.abs(image.pixels[p + c] - image.pixels[q + c]);
      pairs += 3;
    }
  }
  return { ...alphaStats(image), greenExcess: green / (image.width * image.height), neighborContrast: edges / pairs };
}
for (const material of ["grass", "dirt"]) {
  const name = `${material}-ground`, image = readPng(`assets/environment/${name}.png`), facts = measure(image);
  assert.deepEqual([image.width, image.height], [128, 128]);
  assert.equal(facts.opaque, 128 * 128); assert.equal(facts.translucent, 0); assert.ok(facts.colors <= (material === "grass" ? 12 : 8));
  // The revised art must sit between the rejected smooth tile and the noisy original.
  assert.ok(facts.neighborContrast > (material === "grass" ? 4 : 1), `${material}: texture must carry more detail than the rejected version`);
  assert.ok(facts.neighborContrast < (material === "grass" ? 12 : 6), `${material}: avoid overwhelming texture noise`);
  if (material === "grass") assert.ok(facts.greenExcess > 30, "grass retains a clearly green palette");
  for (let i = 0; i < 128; i++) for (let c = 0; c < 4; c++) {
    assert.equal(image.pixels[i * 4 + c], image.pixels[(127 * 128 + i) * 4 + c]);
    assert.equal(image.pixels[i * 128 * 4 + c], image.pixels[(i * 128 + 127) * 4 + c]);
  }
  assert.deepEqual(await readFile(`assets/environment/${name}.png`), await readFile(`assets/environment/sprites/${name}.png`));
  const source = await readFile(`assets/environment/${name}.aseprite`), pixels = Buffer.alloc(128 * 128 * 4);
  assert.equal(source.readUInt16LE(4), 0xa5e0); assert.equal(source.readUInt16LE(6), 1);
  assert.deepEqual([source.readUInt16LE(8), source.readUInt16LE(10), source.readUInt16LE(12)], [128, 128, 32]);
  for (let at = 144, end = 128 + source.readUInt32LE(128); at < end;) {
    const size = source.readUInt32LE(at), type = source.readUInt16LE(at + 4), chunk = source.subarray(at + 6, at + size);
    if (type === 0x2005) {
      const x = chunk.readInt16LE(2), y = chunk.readInt16LE(4), kind = chunk.readUInt16LE(7);
      assert.equal(chunk[6], 255); assert.ok(kind === 0 || kind === 2);
      const w = chunk.readUInt16LE(16), h = chunk.readUInt16LE(18), rgba = kind === 2 ? inflateSync(chunk.subarray(20)) : chunk.subarray(20);
      for (let py = 0; py < h; py++) rgba.copy(pixels, ((y + py) * 128 + x) * 4, py * w * 4, (py + 1) * w * 4);
    }
    at += size;
  }
  assert.deepEqual(pixels, image.pixels, `${material}: native Aseprite pixels equal PNG`);
  metrics[material] = { current: facts };
  if (before && existsSync(path.join(before, `${name}.png`))) {
    const prior = measure(readPng(path.join(before, `${name}.png`)));
    metrics[material].before = prior;
    metrics[material].neighborContrastReduction = 1 - facts.neighborContrast / prior.neighborContrast;
    assert.ok(facts.neighborContrast < prior.neighborContrast * .55, "retain substantially less fine noise than the original detailed tile");
    if (material === "grass") assert.ok(facts.greenExcess > prior.greenExcess);
  }
}
checks.push("Two opaque 128px tiles: limited 12/8-color palettes, seamless edges, matching copies/native Aseprite pixels; contrast exceeds the rejected simplified version and stays below original fine noise");

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
async function scene(mode) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error" && !(mode === "missing" && m.text().includes("ERR_FAILED"))) errors.push(m.text()); });
  await page.route("**/favicon.ico", r => r.fulfill({ status: 204 }));
  await page.route("**/assets/environment/*-ground.png", async r => {
    if (mode === "missing") return r.abort();
    if (mode === "wrong-size") return r.fulfill({ path: path.resolve("assets/ui/ui-icons.png") });
    if (mode === "before") return r.fulfill({ path: path.join(before, new URL(r.request().url()).pathname.split("/").at(-1)) });
    return r.continue();
  });
  await page.addInitScript(() => {
    window.__writes = [];
    window.__assetDraws = new Set();
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (this.canvas.id === "terrainFixture" && source instanceof HTMLImageElement) window.__assetDraws.add(new URL(source.src).pathname.split("/").at(-1));
      return draw.call(this, source, ...args);
    };
    for (const method of ["setItem", "removeItem", "clear"]) Storage.prototype[method] = function () {
      window.__writes.push(method); throw new Error(`Storage write blocked: ${method}`);
    };
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const [{ WorldRenderer }, { World }, { createPlayer }, { DayNightSystem }, { BREAKABLES }, { Mage }, { Slime }, { TerrainTextures }] = await Promise.all([
      import("/dist/src/game/render/world-renderer.js"), import("/dist/src/game/world.js"), import("/dist/src/game/state/player-factory.js"),
      import("/dist/src/game/day-night.js"), import("/dist/src/game/constants.js"), import("/dist/src/game/enemies/index.js"),
      import("/dist/src/game/enemies/index.js"), import("/dist/src/game/render/terrain-textures.js")
    ]);
    document.querySelector("#overlayVeil").classList.add("hidden");
    const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
    canvas.id = "terrainFixture"; canvas.style.cssText = "position:fixed;inset:0;z-index:9999;width:1280px;height:800px";
    document.body.append(canvas);
    canvas.width = 1280; canvas.height = 800;
    const world = new World(739721), chunk = { cx: 0, cy: 0, key: "0,0", objects: [] };
    world.chunkCache.set("0,0", chunk); world.activeChunkKeys = new Set(["0,0"]);
    for (const [kind, x, y] of [["tree", -7, -3], ["tree", -3.8, -3], ["rock", -7, 2.8], ["crate", 2, 2.8]]) {
      const d = BREAKABLES[kind]; chunk.objects.push({ id: `${kind}:terrain:${chunk.objects.length}`, chunkKey: "0,0", kind, x, y, radius: d.radius, maxHp: d.maxHp, hp: d.maxHp, solid: true });
    }
    const player = createPlayer(); player.x = -1; player.y = 0;
    const state = { world, player, seed: world.seed, camera: { x: 0, y: 0, halfWidth: 1280 / 96, halfHeight: 800 / 96 },
      enemies: [new Mage(-4, 3, 1), new Slime(0, 3, 2)], projectiles: [], drops: [], particles: [], burnEffects: [], floatingTexts: [],
      pendingSpellCasts: [], enemyDeathEffects: [], playerAuraEffects: [], lastTimestamp: 0,
      dayNight: new DayNightSystem().getLightingState(), resolveSpellCastSource: () => null, isNearGuideNpc: () => false };
    const renderer = new WorldRenderer(ctx, canvas), textures = new TerrainTextures();
    const render = () => { ctx.clearRect(0, 0, 1280, 800); renderer.render(state); };
    const snapshot = () => JSON.stringify({ player, enemies: state.enemies, objects: chunk.objects, particles: state.particles });
    window.__terrain = { ctx, state, renderer, textures, render, snapshot, initial: snapshot() }; render();
  });
  await page.waitForFunction(() => {
    window.__terrain.render();
    return ["blue-orb-knight.png", "red-mage.png", "blue-slime.png", "forest-props.png"].every(name => window.__assetDraws.has(name));
  });
  return page;
}
try {
  for (const mode of [...(before ? ["before"] : []), "current", "missing", "wrong-size"]) {
    const page = await scene(mode);
    const result = await page.evaluate(() => {
      const f = window.__terrain, sample = document.createElement("canvas"); sample.width = 128; sample.height = 128;
      const ctx = sample.getContext("2d"), first = f.textures.getPattern(ctx, "grass"), second = f.textures.getPattern(ctx, "grass");
      ctx.fillStyle = first; ctx.fillRect(0, 0, 128, 128);
      const p = ctx.getImageData(0, 0, 128, 128).data; let opaque = 0, green = 0;
      for (let i = 0; i < p.length; i += 4) { if (p[i + 3] === 255) opaque++; green += p[i + 1] - (p[i] + p[i + 2]) / 2; }
      f.render();
      const worldPixels = f.ctx.getImageData(0, 0, 1280, 800).data, colors = new Set();
      for (let i = 0; i < worldPixels.length; i += 16) colors.add(`${worldPixels[i]},${worldPixels[i + 1]},${worldPixels[i + 2]}`);
      return { samePattern: first === second, unchanged: f.initial === f.snapshot(), version: f.textures.version, opaque, green: green / 16384, worldColors: colors.size, writes: window.__writes };
    });
    assert.ok(result.samePattern && result.unchanged); assert.equal(result.opaque, 16384); assert.deepEqual(result.writes, []);
    assert.ok(result.worldColors > 100, "capture contains the rendered scene rather than the empty game canvas");
    assert.equal(result.version, ["missing", "wrong-size"].includes(mode) ? 0 : 2);
    if (mode !== "before") assert.ok(result.green > 30);
    await page.screenshot({ path: path.join(output, `${mode}-world.png`) });
    // World-space caches must also render beyond the origin and retain the bound.
    const cache = await page.evaluate(() => {
      const f = window.__terrain;
      for (let i = 0; i < 60; i++) { f.state.camera.x = -24 - i * 9; f.state.camera.y = -12; f.render(); }
      const layer = f.renderer.terrainLayer;
      const count = layer.detailCells.size;
      f.state.seed += 1; f.render();
      return { count, newSeed: layer.detailSeed === f.state.seed, unchanged: f.initial === f.snapshot() };
    });
    assert.ok(cache.count <= 48 && cache.newSeed && cache.unchanged);
    await page.close();
  }
  checks.push("Actual WorldRenderer shows player/mage/slime and props on terrain; pattern cache reuse, negative-world cache bounds and seed reset retain gameplay state");
  checks.push("Missing and wrong-size terrain use opaque green textured fallback with zero storage writes or unexpected browser errors");
  assert.deepEqual(errors, []);
  const results = { passed: true, checks, metrics, errors, storageWrites: 0 };
  await writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2)); console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
