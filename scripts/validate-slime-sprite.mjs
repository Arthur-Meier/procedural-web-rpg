import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href)
  : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const output = path.resolve(process.argv[3] || "output/slime-validation");
await mkdir(output, { recursive: true });
const checks = [], errors = [];
const image = readPng("assets/enemies/blue-slime.png");
const stats = alphaStats(image);
assert.equal(stats.width, 2080);
assert.equal(stats.height, 64);
assert.equal(stats.translucent, 0);
assert.ok(stats.transparent > stats.opaque);
assert.ok(stats.colors <= 14);
for (let frame = 0; frame < 26; frame++) {
  let occupied = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 80; x++) {
    const alpha = image.pixels[(y * image.width + frame * 80 + x) * 4 + 3];
    if (alpha) {
      occupied++;
      assert.ok(x > 0 && x < 79 && y > 0 && y < 63, `Frame ${frame} clipped`);
    }
  }
  assert.ok(occupied > 300, `Empty frame ${frame}`);
}
const metadata = JSON.parse(await readFile("assets/enemies/blue-slime.json", "utf8"));
assert.equal(metadata.frames.length, 26);
assert.deepEqual(metadata.meta.frameTags.map(tag => [tag.name, tag.from, tag.to]), [
  ["idle", 0, 3], ["move-down", 4, 7], ["move-left", 8, 11], ["move-up", 12, 15], ["attack", 16, 21], ["hurt-defeat", 22, 25]
]);
checks.push("26 populated, unclipped frames; 2080 x 64; binary alpha; 14-color palette; six matching animation tags");

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
async function prepare(fallback = false) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => {
    if (message.type() === "error" && !(fallback && message.text().includes("ERR_FAILED"))) errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.__storageWrites = [];
    for (const method of ["setItem", "removeItem", "clear"]) Storage.prototype[method] = function () {
      window.__storageWrites.push(method);
      throw new Error(`Persistence blocked: ${method}`);
    };
    window.__slimeDraws = [];
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLImageElement && source.src.includes("blue-slime.png")) {
        window.__slimeDraws.push({ canvas: this.canvas.id, args, smoothing: this.imageSmoothingEnabled, matrix: this.getTransform().a });
        if (window.__slimeDraws.length > 500) window.__slimeDraws.shift();
      }
      return original.call(this, source, ...args);
    };
  });
  if (fallback) await page.route("**/assets/enemies/blue-slime.png", route => route.abort());
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click("#newGameButton");
  await page.evaluate(() => window.advanceTime(0));
  return page;
}
async function fixture(page) {
  await page.evaluate(async () => {
    const [{ EntityLayer }, { Slime }, { createPlayer }, { World }, { WorldRenderer }, { DayNightSystem }, sprite] = await Promise.all([
      import("/dist/src/game/render/layers/entity-layer.js"), import("/dist/src/game/enemies/index.js"),
      import("/dist/src/game/state/player-factory.js"), import("/dist/src/game/world.js"),
      import("/dist/src/game/render/world-renderer.js"), import("/dist/src/game/day-night.js"),
      import("/dist/src/game/render/slime-sprite.js")
    ]);
    const canvas = document.createElement("canvas");
    canvas.id = "slimeFixture"; canvas.width = 1280; canvas.height = 800;
    canvas.style.cssText = "position:fixed;inset:0;z-index:9999;background:#173020";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d"), player = createPlayer(), world = new World(739721);
    player.x = 0; player.y = 2;
    const state = { world, player, enemies: [], projectiles: [], drops: [], particles: [], burnEffects: [], floatingTexts: [], pendingSpellCasts: [], enemyDeathEffects: [], playerAuraEffects: [],
      camera: { x: 0, y: 1, halfWidth: 1280 / 96, halfHeight: 800 / 96 }, seed: world.seed, lastTimestamp: 0,
      dayNight: new DayNightSystem().getLightingState(), resolveSpellCastSource: () => null, isNearGuideNpc: () => false };
    const layer = new EntityLayer(ctx, canvas); layer.setState(state);
    const renderer = new WorldRenderer(ctx, canvas), enemy = new Slime(11, 11, 0);
    window.__slimeFixture = { canvas, ctx, state, layer, renderer, enemy, sprite, Slime };
    layer.drawEnemy(enemy);
  });
}
try {
  const page = await prepare();
  await page.screenshot({ path: path.join(output, "gameplay.png") });
  await fixture(page);
  await page.waitForFunction(() => { const f = window.__slimeFixture; f.layer.drawEnemy(f.enemy); return window.__slimeDraws.some(d => d.canvas === "slimeFixture"); });
  const sequences = await page.evaluate(() => {
    const f = window.__slimeFixture, e = f.enemy;
    const initial = JSON.stringify(e), idle = [], horizontal = [], vertical = [];
    function draw() {
      window.__slimeDraws = []; f.layer.drawEnemy(e);
      const d = window.__slimeDraws.at(-1);
      return { frame: d.args[0] / 80, mirror: d.matrix < 0, smoothing: d.smoothing };
    }
    for (let i = 0; i < 4; i++) { f.state.lastTimestamp = i * 150; idle.push(draw()); }
    const unchanged = initial === JSON.stringify(e);
    for (const dx of [1, -1]) for (let i = 0; i < 6; i++) {
      e.dashDirection = { x: dx, y: 0 }; e.dashTimer = e.dashTime * (1 - (i + 0.1) / 6); horizontal.push(draw());
    }
    for (const dy of [1, -1]) for (let i = 0; i < 4; i++) {
      e.dashDirection = { x: 0, y: dy }; e.dashTimer = e.dashTime * (1 - (i + 0.1) / 4); vertical.push(draw());
    }
    e.hurtTimer = 0.16; const hurt1 = draw(); e.hurtTimer = 0.05; const hurt2 = draw();
    e.hurtTimer = 0; e.dashTimer = 0; const recovered = draw();
    f.state.enemies = [new f.Slime(-2, 3, 0), new f.Slime(2, 3, 1), new f.Slime(-3, 5, 2), new f.Slime(3, 5, 3)];
    f.state.enemies[1].dashTimer = .18; f.state.enemies[1].dashDirection = { x: -1, y: 0 };
    f.state.enemies[2].hurtTimer = .05;
    f.state.enemies[3].dashTimer = .15; f.state.enemies[3].dashDirection = { x: 0, y: -1 };
    f.renderer.render(f.state);
    return { idle, horizontal, vertical, hurt1, hurt2, recovered, unchanged };
  });
  assert.deepEqual(sequences.idle.map(d => d.frame), [0, 1, 2, 3]);
  assert.deepEqual(sequences.horizontal.map(d => d.frame), [...[16,17,18,19,20,21], ...[16,17,18,19,20,21]]);
  assert.deepEqual(sequences.horizontal.map(d => d.mirror), [...Array(6).fill(false), ...Array(6).fill(true)]);
  assert.deepEqual(sequences.vertical.map(d => d.frame), [4,5,6,7,12,13,14,15]);
  assert.deepEqual([sequences.hurt1.frame, sequences.hurt2.frame], [22,23]);
  assert.ok(sequences.recovered.frame < 4);
  assert.ok(sequences.unchanged);
  assert.ok([...sequences.idle, ...sequences.horizontal, ...sequences.vertical].every(d => !d.smoothing));
  checks.push("Real EntityLayer draws idle cycle, six dash frames to both sides, four vertical frames per direction, hurt and recovery with nearest-neighbor sampling and no render mutation");
  await page.waitForTimeout(100);
  await page.evaluate(() => window.__slimeFixture.renderer.render(window.__slimeFixture.state));
  await page.screenshot({ path: path.join(output, "slimes-in-world.png") });
  await page.screenshot({ path: path.join(output, "slimes-detail.png"), clip: { x: 450, y: 430, width: 380, height: 240 } });
  assert.deepEqual(await page.evaluate(() => window.__storageWrites), []);
  await page.close();
  const fallback = await prepare(true); await fixture(fallback);
  await fallback.evaluate(() => { const f = window.__slimeFixture; f.ctx.clearRect(0,0,1280,800); f.layer.drawEnemy(f.enemy); });
  assert.equal(await fallback.evaluate(() => window.__slimeDraws.length), 0);
  assert.ok(await fallback.evaluate(() => window.__slimeFixture.ctx.getImageData(525,520,35,45).data.some((v,i) => i % 4 === 3 && v > 0)));
  assert.deepEqual(await fallback.evaluate(() => window.__storageWrites), []);
  await fallback.screenshot({ path: path.join(output, "missing-image-fallback.png") });
  await fallback.close();
  checks.push("Missing PNG uses visible procedural fallback; no attempted storage writes or unexpected browser errors");
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, "results.json"), JSON.stringify({ passed: true, stats, checks, sequences }, null, 2));
  console.log(JSON.stringify({ passed: true, stats, checks }, null, 2));
} catch (error) {
  await writeFile(path.join(output, "results.json"), JSON.stringify({ passed: false, checks, errors, error: String(error) }, null, 2));
  throw error;
} finally { await browser.close(); }
