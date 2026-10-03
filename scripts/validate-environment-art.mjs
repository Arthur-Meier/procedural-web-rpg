import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href)
  : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const outputDirectory = path.resolve(process.argv[3] || "output/environment-validation/browser");
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [];
const failures = [];
const assetNames = ["grass-ground.png", "dirt-ground.png", "forest-props.png"];

async function preparePage({ missingAssets = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", error => failures.push(String(error)));
  page.on("console", message => {
    if (message.type() === "error" && !(missingAssets && message.location().url.includes("/assets/environment/"))) {
      failures.push(message.text());
    }
  });
  await page.addInitScript(() => {
    window.__storageWrites = [];
    for (const method of ["setItem", "removeItem", "clear"]) {
      Storage.prototype[method] = function () {
        window.__storageWrites.push(method);
        throw new Error(`Persistencia proibida durante validacao: ${method}`);
      };
    }
    window.__art = { imageLoads: {}, patterns: [], patternFills: [], draws: [], fills: [] };
    const patternSources = new WeakMap();
    const createPattern = CanvasRenderingContext2D.prototype.createPattern;
    CanvasRenderingContext2D.prototype.createPattern = function (source, repetition) {
      const pattern = createPattern.call(this, source, repetition);
      if (source instanceof HTMLImageElement && source.src.includes("/assets/environment/") && pattern) {
        const asset = new URL(source.src).pathname.split("/").at(-1);
        window.__art.imageLoads[asset] = [source.naturalWidth, source.naturalHeight];
        patternSources.set(pattern, asset);
        window.__art.patterns.push({ asset, repetition });
      }
      return pattern;
    };
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
      if (source instanceof HTMLImageElement && (source.src.includes("/assets/environment/") || source.src.includes("blue-orb-knight.png"))) {
        const asset = new URL(source.src).pathname.split("/").at(-1);
        window.__art.imageLoads[asset] = [source.naturalWidth, source.naturalHeight];
        window.__art.draws.push({ canvas: this.canvas.id, asset, args });
        if (window.__art.draws.length > 3000) window.__art.draws.splice(0, 1000);
      }
      return drawImage.call(this, source, ...args);
    };
    for (const method of ["fill", "fillRect"]) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function (...args) {
        const pattern = patternSources.get(this.fillStyle);
        if (pattern) {
          window.__art.patternFills.push(pattern);
          if (window.__art.patternFills.length > 1000) window.__art.patternFills.splice(0, 500);
        }
        if (method === "fillRect" && this.fillStyle === "#f0c95a") {
          window.__art.fills.push({ canvas: this.canvas.id, color: this.fillStyle, args });
        }
        return original.call(this, ...args);
      };
    }
  });
  if (missingAssets) await page.route("**/assets/environment/**", route => route.abort());
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.click("#newGameButton");
  await page.locator("#gameCanvas").dispatchEvent("mouseleave");
  await page.evaluate(() => window.advanceTime(0));
  return page;
}

async function state(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function capture(page, name) {
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`) });
  await writeFile(path.join(outputDirectory, `${name}.json`), JSON.stringify(await state(page), null, 2));
}

async function resetTelemetry(page) {
  await page.evaluate(() => { window.__art.draws = []; window.__art.fills = []; });
}

// Use the real renderer with an isolated, in-memory World. No saves or backend are involved.
async function createFixture(page, { missingAssets = false } = {}) {
  await page.evaluate(async () => {
    const [{ WorldRenderer }, { World }, { createPlayer }, { DayNightSystem }, { BREAKABLES }] = await Promise.all([
      import("/dist/src/game/render/world-renderer.js"),
      import("/dist/src/game/world.js"),
      import("/dist/src/game/state/player-factory.js"),
      import("/dist/src/game/day-night.js"),
      import("/dist/src/game/constants.js")
    ]);
    const backdrop = document.createElement("div");
    backdrop.style.cssText = "position:fixed;inset:0;z-index:9999;background:#122116;display:flex;align-items:center;justify-content:center";
    const canvas = document.createElement("canvas");
    canvas.id = "environmentFixture";
    canvas.width = 1280;
    canvas.height = 800;
    backdrop.append(canvas);
    document.body.append(backdrop);
    const ctx = canvas.getContext("2d");
    const world = new World(739721);
    const chunk = { cx: 0, cy: 0, key: "0,0", objects: [] };
    world.chunkCache.set("0,0", chunk);
    world.activeChunkKeys = new Set(["0,0"]);
    const add = (kind, x, y, id = `${kind}:fixture:${chunk.objects.length}`) => {
      const definition = BREAKABLES[kind];
      const object = { id, chunkKey: chunk.key, kind, x, y, radius: definition.radius, maxHp: definition.maxHp, hp: definition.maxHp, solid: true };
      chunk.objects.push(object);
      return object;
    };
    const player = createPlayer();
    player.x = -1;
    player.y = 0;
    const state = {
      world, player, seed: world.seed, camera: { x: 0, y: 0, halfWidth: 1280 / 96, halfHeight: 800 / 96 },
      enemies: [], projectiles: [], drops: [], particles: [], burnEffects: [], floatingTexts: [], pendingSpellCasts: [], enemyDeathEffects: [], playerAuraEffects: [],
      lastTimestamp: 0, dayNight: new DayNightSystem().getLightingState(), resolveSpellCastSource: () => null, isNearGuideNpc: () => false
    };
    const renderer = new WorldRenderer(ctx, canvas);
    const render = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); renderer.render(state); };
    window.__fixture = { canvas, ctx, world, chunk, add, state, renderer, render };
    add("tree", -7, -2.8);
    add("tree", -3.8, -2.8);
    add("tree", -.6, -2.8);
    add("rock", -7, 2.8);
    add("rock", -4, 2.8);
    add("crate", -.7, 2.8);
    add("crate", 2, 2.8);
    render();
  });
  await page.waitForFunction(missingAssets => {
    window.__fixture.render();
    const draws = window.__art.draws.filter(draw => draw.canvas === "environmentFixture");
    return draws.some(draw => draw.asset === "blue-orb-knight.png") &&
      (missingAssets || draws.some(draw => draw.asset === "forest-props.png"));
  }, missingAssets);
}

try {
  const page = await preparePage();
  await page.waitForFunction(() => ["grass-ground.png", "dirt-ground.png", "forest-props.png"].every(name => window.__art.imageLoads[name]));
  await page.evaluate(() => window.advanceTime(0));
  const telemetry = await page.evaluate(() => window.__art);
  assert.deepEqual(telemetry.imageLoads["grass-ground.png"], [128, 128]);
  assert.deepEqual(telemetry.imageLoads["dirt-ground.png"], [128, 128]);
  assert.deepEqual(telemetry.imageLoads["forest-props.png"], [768, 768]);
  for (const asset of assetNames.slice(0, 2)) {
    assert.ok(telemetry.patterns.some(pattern => pattern.asset === asset && pattern.repetition === "repeat"), asset);
    assert.ok(telemetry.patternFills.includes(asset), `${asset} must actually fill the terrain`);
  }
  assert.ok(telemetry.draws.some(draw => draw.asset === "forest-props.png" && draw.args[1] === 512), "House sprite drawn");
  await capture(page, "hub");
  checks.push("Grass and dirt images load at 128 x 128 and both repeating CanvasPatterns fill the terrain; house atlas loads at 768 x 768 and is drawn");

  const movement = await page.evaluate(async () => {
    const { World } = await import("/dist/src/game/world.js");
    const { SPAWN_HOUSE_COLLIDER, GUIDE_NPC } = await import("/dist/src/game/game-config.js");
    const initial = JSON.parse(window.render_game_to_text());
    const world = new World(initial.seed);
    const obstacles = [];
    for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 2; cx++) obstacles.push(...world.getChunk(cx, cy).objects);
    const free = (gx, gy) => {
      const x = gx * .5, y = gy * .5;
      if (gx < -2 || gx > 60 || gy < -18 || gy > 18) return false;
      if (Math.abs(x - SPAWN_HOUSE_COLLIDER.x) < SPAWN_HOUSE_COLLIDER.width / 2 + .65 && Math.abs(y - SPAWN_HOUSE_COLLIDER.y) < SPAWN_HOUSE_COLLIDER.height / 2 + .65) return false;
      if (Math.hypot(x - GUIDE_NPC.x, y - GUIDE_NPC.y) < GUIDE_NPC.radius + .65) return false;
      return obstacles.every(object => Math.hypot(x - object.x, y - object.y) > object.radius + .65);
    };
    const start = [0, 0];
    let goal = [54, 0];
    while (!free(...goal) && goal[1] < 18) goal[1] += 1;
    const key = ([x, y]) => `${x},${y}`;
    const parents = new Map([[key(start), null]]);
    const frontier = [start];
    const moves = [[1, 0], [0, 1], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let i = 0; i < frontier.length && !parents.has(key(goal)); i++) {
      const current = frontier[i];
      for (const [dx, dy] of moves) {
        const next = [current[0] + dx, current[1] + dy];
        if (parents.has(key(next)) || !free(...next) || !free(current[0] + dx, current[1]) || !free(current[0], current[1] + dy)) continue;
        parents.set(key(next), current);
        frontier.push(next);
      }
    }
    if (!parents.has(key(goal))) throw new Error("No safe route to the adjacent chunk for this seed");
    const route = [];
    for (let position = goal; position; position = parents.get(key(position))) route.push(position);
    route.reverse();
    let previousKeys = [];
    for (let i = 1; i < route.length; i++) {
      const dx = route[i][0] - route[i - 1][0], dy = route[i][1] - route[i - 1][1];
      const codes = [];
      if (dx) codes.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
      if (dy) codes.push(dy > 0 ? "ArrowDown" : "ArrowUp");
      for (const code of previousKeys) if (!codes.includes(code)) window.dispatchEvent(new KeyboardEvent("keyup", { key: code, code, bubbles: true }));
      for (const code of codes) if (!previousKeys.includes(code)) window.dispatchEvent(new KeyboardEvent("keydown", { key: code, code, bubbles: true }));
      previousKeys = codes;
      window.advanceTime(Math.hypot(dx, dy) * .5 / 5 * 1000);
    }
    for (const code of previousKeys) window.dispatchEvent(new KeyboardEvent("keyup", { key: code, code, bubbles: true }));
    window.advanceTime(0);
    const final = JSON.parse(window.render_game_to_text());
    return { start: initial.player, finish: final.player, uiState: final.uiState, routeSteps: route.length, chunk: world.getChunkCoordinates(final.player.x, final.player.y) };
  });
  assert.equal(movement.uiState, "playing");
  assert.ok(movement.finish.x > 24, "Keyboard movement enters the next procedural chunk");
  await capture(page, "forest-chunk");
  await writeFile(path.join(outputDirectory, "movement.json"), JSON.stringify(movement, null, 2));
  checks.push("Keyboard movement follows a collision-free generated route into the next procedural chunk while terrain and props render");

  await createFixture(page);
  await resetTelemetry(page);
  await page.evaluate(() => window.__fixture.render());
  let fixtureDraws = await page.evaluate(() => window.__art.draws.filter(draw => draw.canvas === "environmentFixture"));
  for (const row of [1, 2]) assert.ok(fixtureDraws.some(draw => draw.asset === "forest-props.png" && draw.args[1] === row * 256), `Atlas row ${row} drawn`);
  assert.equal(fixtureDraws.filter(draw => draw.asset === "tree-wind.png").length, 3, "All three trees use the animated atlas");
  await page.screenshot({ path: path.join(outputDirectory, "props-renderer-fixture.png") });
  checks.push("Real WorldRenderer draws tree, rock, crate and house sprites in a front-end-only fixture");

  await page.evaluate(async () => {
    const { EnvironmentSpriteRenderer } = await import("/dist/src/game/render/environment-sprites.js");
    window.__fixture.overviewRenderer = new EnvironmentSpriteRenderer();
  });
  await page.waitForFunction(() => window.__fixture.overviewRenderer.draw(window.__fixture.ctx, "oakTree", -1000, -1000, 10));
  await resetTelemetry(page);
  const overview = await page.evaluate(() => {
    const { ctx, canvas, overviewRenderer } = window.__fixture;
    ctx.fillStyle = "#263b2c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ids = ["oakTree", "pineTree", "birchTree", "grayRock", "mossRock", "woodCrate", "timberHouse", "weatheredCrate", "stoneHouse"];
    return ids.map((id, index) => {
      const x = 270 + index % 3 * 370;
      const y = 220 + Math.floor(index / 3) * 255;
      const drawn = overviewRenderer.draw(ctx, id, x, y, 240);
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e4ddba";
      ctx.fillText(id, x, y + 27);
      return { id, drawn };
    });
  });
  assert.ok(overview.every(sprite => sprite.drawn));
  fixtureDraws = await page.evaluate(() => window.__art.draws.filter(draw => draw.canvas === "environmentFixture" && draw.asset === "forest-props.png"));
  assert.deepEqual(fixtureDraws.map(draw => draw.args.slice(0, 4)), [
    [0, 0, 256, 256], [256, 0, 256, 256], [512, 0, 256, 256],
    [0, 256, 256, 256], [256, 256, 256, 256], [512, 256, 256, 256],
    [0, 512, 256, 256], [256, 512, 256, 256], [512, 512, 256, 256]
  ]);
  await page.screenshot({ path: path.join(outputDirectory, "all-nine-sprites.png") });
  checks.push("Each of the nine named scenery sprites draws the correct individual atlas cell");

  await resetTelemetry(page);
  const depth = await page.evaluate(() => {
    const fixture = window.__fixture;
    fixture.chunk.objects.length = 0;
    fixture.state.player.x = -4;
    fixture.state.player.y = 0;
    const behind = fixture.add("tree", -4, -1.8, "tree:depth:back");
    const front = fixture.add("tree", -4, 1.8, "tree:depth:front");
    fixture.render();
    return { behind, front };
  });
  fixtureDraws = await page.evaluate(() => window.__art.draws.filter(draw => draw.canvas === "environmentFixture"));
  const playerIndex = fixtureDraws.findIndex(draw => draw.asset === "blue-orb-knight.png");
  const trees = fixtureDraws.map((draw, index) => ({ draw, index })).filter(({ draw }) => draw.asset === "tree-wind.png");
  assert.equal(trees.length, 2);
  assert.ok(trees[0].index < playerIndex && trees[1].index > playerIndex, "Player drawn between trees above and below its feet");
  await page.screenshot({ path: path.join(outputDirectory, "depth-order.png") });
  await writeFile(path.join(outputDirectory, "depth-order.json"), JSON.stringify({ objects: depth, draws: fixtureDraws }, null, 2));
  checks.push("Painter ordering draws the tree behind the player first and the tree in front after the player");

  await resetTelemetry(page);
  await page.evaluate(() => {
    const fixture = window.__fixture;
    fixture.chunk.objects.length = 0;
    const object = fixture.add("rock", -4, 1.8, "rock:damaged:fixture");
    object.hp = object.maxHp - 2;
    fixture.world.updateObjectState(object);
    fixture.render();
    fixture.damagedObject = object;
  });
  const damaged = await page.evaluate(() => ({ hp: window.__fixture.damagedObject.hp, maxHp: window.__fixture.damagedObject.maxHp, bars: window.__art.fills.filter(fill => fill.canvas === "environmentFixture"), draws: window.__art.draws.filter(draw => draw.canvas === "environmentFixture") }));
  assert.ok(damaged.bars.some(bar => Math.abs(bar.args[2] - 44 * damaged.hp / damaged.maxHp) < .001 && bar.args[3] === 7), "Damaged object HP ratio remains visible");
  await page.screenshot({ path: path.join(outputDirectory, "damaged-rock-hp-bar.png") });
  await resetTelemetry(page);
  const destroyed = await page.evaluate(() => {
    const fixture = window.__fixture;
    fixture.world.destroyObject(fixture.damagedObject);
    fixture.render();
    return { remaining: fixture.chunk.objects.length, mutation: fixture.world.mutations.get(fixture.damagedObject.id), draws: window.__art.draws.filter(draw => draw.canvas === "environmentFixture"), bars: window.__art.fills.filter(fill => fill.canvas === "environmentFixture") };
  });
  assert.equal(destroyed.remaining, 0);
  assert.deepEqual(destroyed.mutation, { hp: 0, destroyed: true });
  assert.ok(!destroyed.draws.some(draw => draw.asset === "forest-props.png" && draw.args[1] === 256));
  assert.equal(destroyed.bars.length, 0);
  checks.push("Damaged prop health bar retains its HP ratio; destroying the isolated in-memory object removes its sprite and bar");
  assert.deepEqual(await page.evaluate(() => window.__storageWrites), []);
  await page.close();

  const fallback = await preparePage({ missingAssets: true });
  await fallback.keyboard.down("ArrowRight");
  await fallback.evaluate(() => window.advanceTime(200));
  await fallback.keyboard.up("ArrowRight");
  await fallback.evaluate(() => window.advanceTime(0));
  assert.equal((await state(fallback)).uiState, "playing");
  assert.ok((await state(fallback)).player.x > 0);
  assert.ok(!(await fallback.evaluate(() => window.__art.draws)).some(draw => draw.asset === "forest-props.png"));
  await createFixture(fallback, { missingAssets: true });
  await fallback.screenshot({ path: path.join(outputDirectory, "missing-environment-assets-fallback.png") });
  assert.deepEqual(await fallback.evaluate(() => window.__storageWrites), []);
  await fallback.close();
  checks.push("Blocking all environment images keeps keyboard movement and procedural scenery/leaf fallbacks working");
  checks.push("No localStorage writes, removals or clears attempted");
  assert.deepEqual(failures, [], "Browser errors");
  checks.push("No unexpected browser console errors or uncaught exceptions");
  await writeFile(path.join(outputDirectory, "results.json"), JSON.stringify({ passed: true, checks }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  await writeFile(path.join(outputDirectory, "results.json"), JSON.stringify({ passed: false, checks, failures, error: String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
