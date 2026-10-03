import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href) : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const output = path.resolve(process.argv[3] || "output/wind-validation");
await mkdir(output, { recursive: true });
const checks = [], errors = [];

for (const [name, cell, count, duration] of [["tree-wind", 256, 24, 220], ["wind-leaves", 16, 12, 160]]) {
  const atlas = readPng(`assets/environment/${name}.png`);
  const meta = JSON.parse(await readFile(`assets/environment/${name}.json`, "utf8"));
  const source = await readFile(`assets/environment/${name}.aseprite`);
  assert.deepEqual([atlas.width, atlas.height], [cell * count, cell]);
  assert.equal(alphaStats(atlas).translucent, 0);
  assert.equal(source.readUInt16LE(4), 0xa5e0); assert.equal(source.readUInt16LE(12), 32);
  assert.equal(source.readUInt16LE(6), count); assert.equal(meta.frames.length, count);
  assert.equal(meta.meta.frameTags.length, 3);
  let offset = 128;
  for (let frame = 0; frame < count; frame++) {
    assert.equal(source.readUInt16LE(offset + 4), 0xf1fa);
    assert.equal(source.readUInt16LE(offset + 8), duration);
    assert.equal(meta.frames[frame].duration, duration);
    assert.deepEqual(meta.frames[frame].frame, { x: frame * cell, y: 0, w: cell, h: cell });
    const pixels = Buffer.alloc(cell * cell * 4), end = offset + source.readUInt32LE(offset);
    for (let chunk = offset + 16; chunk < end;) {
      const length = source.readUInt32LE(chunk), kind = source.readUInt16LE(chunk + 4), data = source.subarray(chunk + 6, chunk + length);
      if (kind === 0x2005) {
        const x = data.readInt16LE(2), y = data.readInt16LE(4), type = data.readUInt16LE(7);
        assert.ok(type === 0 || type === 2); assert.equal(data[6], 255);
        const w = data.readUInt16LE(16), h = data.readUInt16LE(18);
        const rgba = type === 2 ? inflateSync(data.subarray(20)) : data.subarray(20);
        for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
          const at = (cy * w + cx) * 4;
          if (rgba[at + 3]) rgba.copy(pixels, ((y + cy) * cell + x + cx) * 4, at, at + 4);
        }
      }
      chunk += length;
    }
    let opaque = 0;
    const original = name === "tree-wind" ? readPng(`assets/environment/sprites/${["oak", "pine", "birch"][Math.floor(frame / 8)]}-tree.png`) : null;
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
      const at = (y * cell + x) * 4, atlasAt = (y * atlas.width + frame * cell + x) * 4;
      assert.deepEqual(pixels.subarray(at, at + 4), atlas.pixels.subarray(atlasAt, atlasAt + 4), `${name} source mismatch`);
      if (pixels[at + 3]) { opaque++; assert.ok(x > 0 && y > 0 && x < cell - 1 && y < cell - 1, `${name} clipped`); }
      if (original && y >= 205) assert.deepEqual(pixels.subarray(at, at + 4), original.pixels.subarray(at, at + 4), "Root pixels must stay fixed");
      if (original && frame % 8 === 0) assert.deepEqual(pixels.subarray(at, at + 4), original.pixels.subarray(at, at + 4), "Neutral pose must preserve original art");
    }
    assert.ok(opaque > (cell === 256 ? 1000 : 15));
    offset = end;
  }
  for (const [index, tag] of meta.meta.frameTags.entries()) {
    const bank = count / 3; assert.equal(tag.from, index * bank); assert.equal(tag.to, (index + 1) * bank - 1);
  }
  checks.push(`${name}: all populated frames, padding, binary alpha, tags/durations and exact Aseprite/PNG equality`);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
async function fixture(mode = "normal") {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error" && !message.text().includes("ERR_FAILED")) errors.push(message.text()); });
  await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
  await page.route("**/wind-fixture.html", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"><canvas width="1280" height="800"></canvas></body></html>' }));
  await page.addInitScript(() => {
    window.__storageWrites = []; window.__draws = []; window.__shadows = [];
    for (const method of ["setItem", "removeItem", "clear"]) Storage.prototype[method] = function () { window.__storageWrites.push(method); throw Error("Storage write blocked"); };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image instanceof HTMLImageElement && image.src.includes("/assets/environment/")) window.__draws.push({ image: image.src.split("/").pop(), args, smoothing: this.imageSmoothingEnabled, matrix: Array.from([this.getTransform().a, this.getTransform().b, this.getTransform().c, this.getTransform().d, this.getTransform().e, this.getTransform().f]), alpha: this.globalAlpha });
      return draw.call(this, image, ...args);
    };
    const ellipse = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function (...args) { window.__shadows.push(args); return ellipse.apply(this, args); };
  });
  if (mode === "missing") await page.route("**/assets/environment/*wind*.png", route => route.abort());
  if (mode === "wrong-size") await page.route("**/assets/environment/*wind*.png", route => route.fulfill({ path: path.resolve("assets/items/loot-items.png") }));
  await page.goto(`${url}/wind-fixture.html`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const [{ WorldRenderer }, { EnvironmentLayer }, { WindLeavesLayer }, { World }, { createPlayer }, { DayNightSystem }, { BREAKABLES }, sprites] = await Promise.all([
      import("/dist/src/game/render/world-renderer.js"), import("/dist/src/game/render/layers/environment-layer.js"), import("/dist/src/game/render/wind-leaves.js"),
      import("/dist/src/game/world.js"), import("/dist/src/game/state/player-factory.js"), import("/dist/src/game/day-night.js"), import("/dist/src/game/constants.js"), import("/dist/src/game/render/environment-sprites.js")
    ]);
    const canvas = document.querySelector("canvas"), ctx = canvas.getContext("2d"), world = new World(739721), player = createPlayer();
    const chunk = { cx: 0, cy: 0, key: "0,0", objects: [] };
    world.chunkCache.set(chunk.key, chunk); world.activeChunkKeys = new Set([chunk.key]);
    function add(kind, x, y, id) {
      const def = BREAKABLES[kind], object = { id, chunkKey: chunk.key, kind, x, y, radius: def.radius, hp: def.maxHp, maxHp: def.maxHp, solid: true };
      chunk.objects.push(object); return object;
    }
    for (const [index, variant] of ["oakTree", "pineTree", "birchTree"].entries()) {
      for (let n = 0; n < 100; n++) {
        const tree = { kind: "tree", id: `wind:${n}` };
        if (sprites.getBreakableSprite(tree, world.seed).id === variant) { add("tree", -7 + index * 6, 4, tree.id); break; }
      }
    }
    add("rock", -5, 8, "rock:wind"); add("crate", 3, 8, "crate:wind");
    player.x = 0; player.y = 8;
    const state = { world, player, seed: world.seed, camera: { x: 0, y: 5, halfWidth: 1280 / 96, halfHeight: 800 / 96 }, enemies: [], drops: [], projectiles: [], particles: [], burnEffects: [], floatingTexts: [], pendingSpellCasts: [], enemyDeathEffects: [], playerAuraEffects: [], lastTimestamp: 1100, dayNight: new DayNightSystem().getLightingState(), resolveSpellCastSource: () => null, isNearGuideNpc: () => false };
    const renderer = new WorldRenderer(ctx, canvas), layer = new EnvironmentLayer(ctx, canvas), leaves = new WindLeavesLayer(ctx, canvas);
    layer.setState(state); leaves.setState(state);
    window.__fixture = { ctx, canvas, state, chunk, renderer, layer, leaves };
  });
  await page.waitForLoadState("networkidle");
  return page;
}
try {
  const page = await fixture();
  await page.waitForFunction(() => { window.__draws = []; window.__fixture.renderer.render(window.__fixture.state); return window.__draws.filter(d => d.image === "tree-wind.png").length === 3; });
  const result = await page.evaluate(() => {
    const f = window.__fixture, before = JSON.stringify(f.chunk.objects);
    function sample(t) { f.state.lastTimestamp = t; window.__draws = []; window.__shadows = []; f.renderer.render(f.state); return { draws: [...window.__draws], shadows: [...window.__shadows] }; }
    const a = sample(1100), b = sample(1540), repeated = sample(1540);
    const banks = [0, 1, 2].map(i => { const frames = new Set(); for (let t = 0; t < 2200; t += 110) frames.add(sample(t).draws.filter(d => d.image === "tree-wind.png")[i].args[0] / 256); return [...frames]; });
    const crowded = Array.from({ length: 120 }, (_, i) => ({ ...f.chunk.objects[0], id: `dense:${i}`, x: -4 + i % 9, y: 5 }));
    window.__draws = []; f.leaves.draw(crowded); const capped = window.__draws.length;
    window.__draws = []; f.leaves.draw(f.chunk.objects.filter(o => o.kind !== "tree")); const treeless = window.__draws.length;
    f.state.lastTimestamp = 1100; f.renderer.render(f.state);
    return { a, b, repeated, banks, capped, treeless, unchanged: before === JSON.stringify(f.chunk.objects), particles: f.state.particles.length, writes: window.__storageWrites };
  });
  const trees = sample => sample.draws.filter(d => d.image === "tree-wind.png");
  const leaves = sample => sample.draws.filter(d => d.image === "wind-leaves.png");
  assert.notDeepEqual(trees(result.a).map(d => d.args[0]), trees(result.b).map(d => d.args[0]));
  assert.deepEqual(trees(result.a).map(d => d.args.slice(4)), trees(result.b).map(d => d.args.slice(4)));
  assert.deepEqual(result.a.shadows, result.b.shadows);
  assert.deepEqual(result.b, result.repeated, "Same visual time must render identical leaves/trees");
  assert.ok(leaves(result.a).length > 0); assert.notDeepEqual(leaves(result.a), leaves(result.b));
  for (const [index, bank] of result.banks.entries()) { assert.equal(bank.length, 8); assert.ok(bank.every(frame => Math.floor(frame / 8) === index)); }
  assert.ok(result.capped > 0 && result.capped <= 48); assert.equal(result.treeless, 0);
  assert.ok(result.a.draws.filter(d => ["tree-wind.png", "wind-leaves.png"].includes(d.image)).every(d => !d.smoothing));
  assert.deepEqual(result.a.draws.filter(d => d.image === "forest-props.png"), result.b.draws.filter(d => d.image === "forest-props.png"));
  assert.ok(result.unchanged); assert.equal(result.particles, 0); assert.deepEqual(result.writes, []);
  await page.screenshot({ path: path.join(output, "forest-wind.png") });
  await page.evaluate(() => { window.__fixture.state.lastTimestamp = 1540; window.__fixture.renderer.render(window.__fixture.state); });
  await page.screenshot({ path: path.join(output, "forest-wind-next.png") });
  checks.push("Three tree variants cycle through eight poses with fixed roots, contact shadows and prop depth; static props stay fixed");
  checks.push("Leaf movement/flutter/fading is deterministic, world anchored, limited to 48 draws and absent without trees; gameplay objects/particles unchanged");
  await page.close();
  for (const mode of ["missing", "wrong-size"]) {
    const fallback = await fixture(mode);
    await fallback.waitForFunction(() => { window.__draws = []; window.__fixture.renderer.render(window.__fixture.state); return window.__draws.some(d => d.image === "forest-props.png"); });
    const r = await fallback.evaluate(() => { const f = window.__fixture; window.__draws = []; f.renderer.render(f.state); const pixels = f.ctx.getImageData(0, 0, 1280, 800).data; return { images: window.__draws.map(d => d.image), opaque: pixels.filter((v, i) => i % 4 === 3 && v > 0).length, writes: window.__storageWrites }; });
    assert.ok(!r.images.some(n => n.includes("wind"))); assert.ok(r.images.includes("forest-props.png")); assert.ok(r.opaque > 10000); assert.deepEqual(r.writes, []);
    await fallback.screenshot({ path: path.join(output, `${mode}-fallback.png`) });
    const leafPixels = await fallback.evaluate(() => { const f = window.__fixture; f.ctx.clearRect(0, 0, 1280, 800); f.ctx.save(); f.ctx.translate(640, 160); f.leaves.draw(f.chunk.objects); f.ctx.restore(); return f.ctx.getImageData(0, 0, 1280, 800).data.filter((v, i) => i % 4 === 3 && v > 0).length; });
    assert.ok(leafPixels > 30, "Fallback leaves must actually draw visible pixels");
    await fallback.close();
  }
  checks.push("Missing/invalid wind assets retain static trees and visible procedural leaves; no storage writes or browser errors");
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, "results.json"), JSON.stringify({ checks, errors, storageWrites: 0 }, null, 2));
  console.log(JSON.stringify({ checks, errors, output }, null, 2));
} finally { await browser.close(); }
