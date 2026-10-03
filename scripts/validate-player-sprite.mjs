import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href)
  : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const outputDirectory = path.resolve(process.argv[3] || "output/sprite-validation/browser");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
const checks = [];

async function preparePage({ failSprite = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (error) => failures.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !(failSprite && message.location().url.includes("blue-orb-knight.png"))) {
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
    window.__spriteDraws = [];
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image instanceof HTMLImageElement && image.src.includes("blue-orb-knight.png")) {
        window.__spriteDraws.push({ row: args[1] / 96, column: args[0] / 96 });
        window.__spriteDraws = window.__spriteDraws.slice(-4);
      }
      return drawImage.call(this, image, ...args);
    };
  });
  if (failSprite) {
    await page.route("**/assets/characters/blue-orb-knight.png", (route) => route.abort());
  }
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  assert.equal((await state(page)).uiState, "title");
  await page.click("#newGameButton");
  await page.locator("#gameCanvas").dispatchEvent("mouseleave");
  await step(page, 0);
  assert.equal((await state(page)).uiState, "playing");
  return page;
}

async function state(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function step(page, milliseconds) {
  await page.evaluate((milliseconds) => window.advanceTime(milliseconds), milliseconds);
}

async function capture(page, name) {
  const current = await state(page);
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`) });
  const canvas = await page.locator("#gameCanvas").boundingBox();
  const x = canvas.x + canvas.width / 2 + (current.player.x - current.camera.x) * current.coordinates.pixelsPerMeter;
  const y = canvas.y + canvas.height / 2 + (current.player.y - current.camera.y) * current.coordinates.pixelsPerMeter;
  await page.screenshot({ path: path.join(outputDirectory, `${name}-player.png`), clip: { x: Math.round(x - 54), y: Math.round(y - 81), width: 108, height: 108 } });
  await writeFile(path.join(outputDirectory, `${name}.json`), JSON.stringify(current, null, 2));
  return current;
}

async function assertFrameDrawn(page, current) {
  const draw = await page.evaluate(() => window.__spriteDraws.at(-1));
  assert.deepEqual(draw, { row: current.player.sprite.row, column: current.player.sprite.column });
}

try {
  const page = await preparePage();
  const initial = await capture(page, "initial-idle");
  assert.equal(initial.player.walking, false);
  assert.equal(initial.player.sprite.column, 0);
  await assertFrameDrawn(page, initial);
  checks.push("PNG loaded and idle frame drawn on canvas");

  const directions = [
    { name: "down", row: 0, keys: ["ArrowDown"], x: 0, y: 1 },
    { name: "down-left", row: 1, keys: ["ArrowDown", "ArrowLeft"], x: -1, y: 1 },
    { name: "left", row: 2, keys: ["ArrowLeft"], x: -1, y: 0 },
    { name: "up-left", row: 3, keys: ["ArrowUp", "ArrowLeft"], x: -1, y: -1 },
    { name: "up", row: 4, keys: ["ArrowUp"], x: 0, y: -1 },
    { name: "up-right", row: 5, keys: ["ArrowUp", "ArrowRight"], x: 1, y: -1 },
    { name: "right", row: 6, keys: ["ArrowRight"], x: 1, y: 0 },
    { name: "down-right", row: 7, keys: ["ArrowDown", "ArrowRight"], x: 1, y: 1 }
  ];
  for (const direction of directions) {
    const before = await state(page);
    for (const key of direction.keys) await page.keyboard.down(key);
    await step(page, 40);
    const walking = await capture(page, `walk-${direction.name}`);
    assert.equal(walking.player.walking, true, direction.name);
    assert.equal(walking.player.sprite.direction, direction.name);
    assert.equal(walking.player.sprite.row, direction.row);
    assert.ok(walking.player.sprite.column >= 1 && walking.player.sprite.column <= 6);
    if (direction.x) assert.equal(Math.sign(walking.player.x - before.player.x), direction.x);
    if (direction.y) assert.equal(Math.sign(walking.player.y - before.player.y), direction.y);
    await assertFrameDrawn(page, walking);
    for (const key of direction.keys) await page.keyboard.up(key);
    await step(page, 1000 / 60);
    const idle = await capture(page, `idle-${direction.name}`);
    assert.equal(idle.player.walking, false);
    assert.equal(idle.player.sprite.column, 0);
    assert.equal(idle.player.sprite.direction, direction.name);
    await assertFrameDrawn(page, idle);
  }
  checks.push("Walking and idle in all eight directions; drawn row/column matches game state");

  await page.keyboard.down("ArrowDown");
  const walkColumns = new Set();
  for (let frame = 0; frame < 6; frame += 1) {
    await step(page, 90);
    const current = await capture(page, `walk-frame-${frame + 1}`);
    walkColumns.add(current.player.sprite.column);
    await assertFrameDrawn(page, current);
  }
  assert.deepEqual([...walkColumns].sort(), [1, 2, 3, 4, 5, 6]);
  checks.push("All six walking frames rendered across a complete cycle");

  await page.keyboard.down("Escape");
  await step(page, 1000 / 60);
  await page.keyboard.up("Escape");
  const paused = await capture(page, "paused");
  assert.equal(paused.uiState, "paused");
  assert.equal(paused.player.walking, false);
  assert.equal(paused.player.sprite.column, 0);
  await step(page, 300);
  const stillPaused = await state(page);
  assert.equal(stillPaused.player.x, paused.player.x);
  assert.equal(stillPaused.player.y, paused.player.y);
  await page.keyboard.up("ArrowDown");
  await page.click("#resumeButton");
  await step(page, 1000 / 60);
  assert.equal((await state(page)).uiState, "playing");
  assert.equal((await state(page)).player.walking, false);
  checks.push("Pause freezes movement and resets animation; resume returns to idle");

  const beforeTimeAdvance = await state(page);
  await step(page, 100);
  const afterTimeAdvance = await state(page);
  assert.ok(Math.abs(afterTimeAdvance.timestampMilliseconds - beforeTimeAdvance.timestampMilliseconds - 100) <= 0.001);
  assert.equal(afterTimeAdvance.player.x, beforeTimeAdvance.player.x);
  assert.equal(afterTimeAdvance.player.y, beforeTimeAdvance.player.y);
  checks.push("Controlled stepping advances the shared render timestamp by the requested 100 milliseconds");

  const beforeWallClockDelay = await state(page);
  await page.waitForTimeout(120);
  const afterWallClockDelay = await state(page);
  assert.deepEqual(afterWallClockDelay.player, beforeWallClockDelay.player);
  assert.equal(afterWallClockDelay.timestampMilliseconds, beforeWallClockDelay.timestampMilliseconds);
  checks.push("Controlled stepping remains deterministic between advanceTime calls");
  assert.deepEqual(await page.evaluate(() => window.__storageWrites), []);
  await page.close();

  const fallback = await preparePage({ failSprite: true });
  await fallback.keyboard.down("ArrowRight");
  await step(fallback, 80);
  await fallback.keyboard.up("ArrowRight");
  const fallbackState = await capture(fallback, "missing-png-fallback");
  assert.equal(fallbackState.uiState, "playing");
  assert.equal(fallbackState.player.walking, true);
  assert.equal(fallbackState.player.sprite.direction, "right");
  assert.deepEqual(await fallback.evaluate(() => window.__spriteDraws), []);
  assert.deepEqual(await fallback.evaluate(() => window.__storageWrites), []);
  checks.push("Missing PNG keeps gameplay working through procedural rendering fallback");
  checks.push("No localStorage writes, removals or clears attempted");
  await fallback.close();
  assert.deepEqual(failures, [], "Browser errors");
  checks.push("No unexpected console errors or uncaught browser exceptions");
  await writeFile(path.join(outputDirectory, "results.json"), JSON.stringify({ passed: true, checks }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  await writeFile(path.join(outputDirectory, "results.json"), JSON.stringify({ passed: false, checks, failures, error: String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
