import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href) : await import("playwright");
const url = process.argv[2] || "http://localhost:4174", output = path.resolve(process.argv[3] || "output/ui-validation/browser");
await mkdir(output, { recursive: true });
const checks = [], errors = [], atlas = readPng("assets/ui/ui-icons.png");
const meta = JSON.parse(await readFile("assets/ui/ui-icons.json", "utf8")), source = await readFile("assets/ui/ui-icons.aseprite");
assert.deepEqual([atlas.width, atlas.height], [240, 24]); assert.equal(alphaStats(atlas).translucent, 0);
assert.equal(source.readUInt16LE(4), 0xa5e0); assert.equal(source.readUInt16LE(6), 1); assert.equal(source.readUInt16LE(12), 32);
const pixels = Buffer.alloc(240 * 24 * 4), slices = {};
for (let offset = 144, end = 128 + source.readUInt32LE(128); offset < end;) {
  const length = source.readUInt32LE(offset), kind = source.readUInt16LE(offset + 4), data = source.subarray(offset + 6, offset + length);
  if (kind === 0x2005) {
    const x = data.readInt16LE(2), y = data.readInt16LE(4), type = data.readUInt16LE(7);
    assert.ok(type === 0 || type === 2); assert.equal(data[6], 255);
    const w = data.readUInt16LE(16), h = data.readUInt16LE(18), rgba = type === 2 ? inflateSync(data.subarray(20)) : data.subarray(20);
    for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
      const at = (cy * w + cx) * 4; if (rgba[at + 3]) rgba.copy(pixels, ((y + cy) * 240 + x + cx) * 4, at, at + 4);
    }
  }
  if (kind === 0x2022) {
    const len = data.readUInt16LE(12), name = data.toString("utf8", 14, 14 + len), key = 14 + len;
    assert.equal(data.readUInt32LE(4), 2);
    slices[name] = { frame: { x: data.readInt32LE(key + 4), y: data.readInt32LE(key + 8), w: data.readUInt32LE(key + 12), h: data.readUInt32LE(key + 16) }, pivot: { x: data.readInt32LE(key + 20), y: data.readInt32LE(key + 24) } };
  }
  offset += length;
}
assert.deepEqual(pixels, atlas.pixels); assert.deepEqual(slices, meta.frames); assert.equal(Object.keys(slices).length, 10);
for (const { frame: f } of Object.values(meta.frames)) {
  let count = 0;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (pixels[(y * 240 + f.x + x) * 4 + 3]) { count++; assert.ok(x > 0 && x < 23 && y > 0 && y < 23); }
  assert.ok(count > 20);
}
checks.push("10 padded glyphs with binary alpha and exact Aseprite/PNG/slice/pivot equality");

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
async function prepare(width, height, missing = false, reduced = false) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reduced ? "reduce" : "no-preference" });
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error" && !(missing && message.text().includes("ERR_FAILED"))) errors.push(message.text()); });
  await page.route("**/favicon.ico", r => r.fulfill({ status: 204 }));
  if (missing) await page.route("**/assets/ui/ui-icons.png", r => r.abort());
  await page.addInitScript(() => {
    window.__storageWrites = [];
    for (const method of ["setItem", "removeItem", "clear"]) Storage.prototype[method] = function () { window.__storageWrites.push(method); throw Error("Storage write prohibited"); };
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.advanceTime === "function");
  return page;
}
async function capture(page, name) {
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(output, `${name}.png`) });
}
async function state(page) { return page.evaluate(() => JSON.parse(window.render_game_to_text())); }
async function frame(page) { await page.evaluate(() => window.advanceTime(0)); }
async function fit(page, selectors, scrollContent = false) {
  const result = await page.evaluate(selectors => selectors.map(selector => {
    const element = document.querySelector(selector), r = element.getBoundingClientRect();
    return { selector, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, overflow: getComputedStyle(element).overflowX, vw: innerWidth, vh: innerHeight };
  }), selectors);
  for (const r of result) { assert.ok(r.width > 0 && r.height > 0, `${r.selector} must be visible`); assert.ok(r.x >= -1 && r.right <= r.vw + 1 && ((scrollContent && r.selector.startsWith(".")) || (r.y >= -1 && r.bottom <= r.vh + 1)), `${r.selector} must fit the viewport`); assert.ok(r.scrollWidth <= r.clientWidth + 1 || (r.selector === "#titlePanel" && r.overflow === "hidden"), `${r.selector} horizontal overflow`); }
  return result;
}
try {
  for (const [label, width, height] of [["desktop", 1440, 900], ["tablet", 820, 700], ["mobile", 390, 844], ["small", 320, 568], ["landscape", 844, 390]]) {
    const page = await prepare(width, height);
    await fit(page, ["#titlePanel", "#newGameButton", "#showLoadButton"]);
    await capture(page, `${label}-title`);
    await page.click("#showLoadButton"); await capture(page, `${label}-load`); await fit(page, ["#titleLoadPanel", "#backToTitleButton"]);
    assert.equal(await page.locator("#titleLoadSlots button:disabled").count(), 3);
    await page.click("#backToTitleButton"); await page.click("#newGameButton"); await frame(page);
    assert.equal((await state(page)).uiState, "playing");
    const hud = await fit(page, ["#hudTop", "#hudSide", "#hudBottom", ".hud-navigation"]);
    assert.ok(hud.reduce((n, r) => n + r.width * r.height, 0) / (width * height) < (width >= 760 && height >= 600 ? .14 : .32), "HUD must leave most of the world unobstructed");
    assert.equal(await page.locator("#hud .inventory-slot").count(), 0);
    assert.equal(await page.locator("#hudTop [role=progressbar]").count(), 2);
    const targets = await page.locator(".hud-navigation button").evaluateAll(nodes => nodes.map(n => [n.clientWidth, n.clientHeight]));
    assert.ok(targets.every(([w, h]) => w >= 44 && h >= 40));
    await capture(page, `${label}-hud`);
    const initial = (await state(page)).player;
    await page.click("#hudInventoryButton"); assert.equal((await state(page)).overlays.inventory, true);
    assert.ok(await page.locator("#hud").isHidden());
    await capture(page, `${label}-inventory`); await fit(page, ["#inventoryPanel", ".inventory-workspace", ".inventory-panel-grid"], true);
    await page.locator("#inventoryPanelGrid .inventory-storage-slot").last().scrollIntoViewIfNeeded();
    assert.ok(await page.locator("#inventoryPanelGrid .inventory-storage-slot").last().isVisible());
    const portraitWidth = await page.locator(".inventory-character-stage").evaluate(e => e.clientWidth); assert.ok(portraitWidth >= 192, "Character artwork must fit its stage");
    assert.equal(await page.locator("#inventoryPanelGrid .inventory-storage-slot").count(), 10);
    assert.equal(await page.locator("#craftingWorkbench .workbench-cell").count(), 9);
    await page.keyboard.press("i"); await frame(page); assert.equal((await state(page)).overlays.inventory, false);
    await page.click("#hudStatsButton"); await capture(page, `${label}-stats`); await fit(page, ["#statsPanel"]);
    assert.equal(await page.locator("#statsAllocation button:disabled").count(), 5);
    await page.click("#closeStatsButton"); await page.click("#hudMapButton"); await capture(page, `${label}-map`); await fit(page, ["#mapPanel"]);
    assert.equal((await state(page)).overlays.map, true); await page.click("#closeMapButton");
    await page.click("#hudPauseButton"); assert.equal((await state(page)).uiState, "paused");
    await capture(page, `${label}-pause`); await fit(page, ["#pausePanel"]);
    assert.equal(await page.locator("#pauseSaveSlots button").count(), 3);
    await page.click(".controls-help summary"); assert.ok(await page.locator(".controls-help dl").isVisible());
    await page.keyboard.press("Escape"); await frame(page); assert.equal((await state(page)).uiState, "playing");
    assert.deepEqual((await state(page)).player, initial, "Opening and closing menus must not change player state");
    await page.click("#hudPauseButton"); await page.click("#backToMenuButton"); assert.equal((await state(page)).uiState, "title");
    assert.deepEqual(await page.evaluate(() => window.__storageWrites), []);
    await page.close();
  }
  checks.push("Five viewport sizes: title/load/start, compact HUD, inventory, stats, map and pause fit without horizontal overflow");
  checks.push("Mouse navigation and I/Esc close/resume paths retain player state; full inventory, 3x3 workbench, disabled stat allocation, save/load lists and controls remain accessible");
  const page = await prepare(1280, 800);
  await page.click("#newGameButton"); await frame(page);
  const dynamic = await page.evaluate(async () => {
    const [{ updateHud }, { createPlayer }] = await Promise.all([import("/dist/src/game/ui/panels/hud-panel.js"), import("/dist/src/game/state/player-factory.js")]);
    const player = createPlayer(); player.hp = 4; player.xp = 5; player.gold = 17; player.unspentStatPoints = 2;
    const refs = { hudTop: document.querySelector("#hudTop"), hudSide: document.querySelector("#hudSide"), hudBottom: document.querySelector("#hudBottom"), hudMessage: document.querySelector("#hudMessage") };
    const before = JSON.stringify(player);
    updateHud(refs, player, [], "Recurso coletado", true, { title: "Caminhos seguros", progress: 3, killTarget: 10 }, 4);
    return { text: refs.hudSide.textContent, hp: refs.hudTop.querySelector('.health-bar').getAttribute('aria-valuenow'), xp: refs.hudTop.querySelector('.xp-bar').getAttribute('aria-valuenow'), unchanged: before === JSON.stringify(player) };
  });
  assert.equal(dynamic.hp, "4"); assert.equal(dynamic.xp, "5"); assert.ok(dynamic.text.includes("17") && dynamic.text.includes("Dia 4") && dynamic.text.includes("Caminhos seguros") && dynamic.text.includes("2 pontos") && dynamic.text.includes("Falar")); assert.ok(dynamic.unchanged);
  await capture(page, "hud-status-fixture"); await page.close();
  checks.push("HUD health/XP accessibility values, gold/day, active quest, available points, interaction and toast reflect state without mutating it");
  const fixture = await prepare(1280, 800);
  await fixture.click("#newGameButton"); await frame(fixture); await fixture.click("#hudInventoryButton");
  await fixture.evaluate(async () => {
    const [{ renderInventoryPanel }, { renderStatsPanel }, { renderQuestBoard }, { createPlayer }, { createQuestBoardState }] = await Promise.all([
      import("/dist/src/game/ui/panels/inventory-panel.js"), import("/dist/src/game/ui/panels/stats-panel.js"), import("/dist/src/game/ui/panels/quest-panel.js"),
      import("/dist/src/game/state/player-factory.js"), import("/dist/src/game/state/quest-factory.js")
    ]);
    const player = createPlayer(); player.unspentStatPoints = 2;
    for (const [index, id] of ["wood", "stone", "charcoal", "slimeGoo"].entries()) player.inventory[index] = { kind: "item", itemId: id, count: index + 2 };
    player.inventory[4] = { kind: "weapon", weaponId: "stoneSword" }; player.inventory[5] = { kind: "weapon", weaponId: "woodenSword" };
    const refs = Object.fromEntries(["inventoryCharacter", "inventoryEquipment", "craftingWorkbench", "craftingOutput", "inventoryCapacity", "inventoryPanelGrid"].map(id => [id, document.getElementById(id)]));
    window.__uiActions = { equip: [], spend: [], accept: [] };
    const before = JSON.stringify(player);
    renderInventoryPanel(refs, player, id => window.__uiActions.equip.push(id), () => {});
    renderStatsPanel({ statsOverview: document.getElementById("statsOverview"), statsAllocation: document.getElementById("statsAllocation") }, player, key => window.__uiActions.spend.push(key));
    const quests = createQuestBoardState();
    renderQuestBoard(document.getElementById("questBoardList"), quests, id => window.__uiActions.accept.push(id));
    window.__uiFixture = { unchanged: before === JSON.stringify(player), quests, renderQuestBoard };
  });
  const equip = fixture.locator("#inventoryPanelGrid [role=button]").first();
  await equip.focus(); await fixture.keyboard.press("Enter"); await fixture.keyboard.press("Space"); await equip.click();
  assert.deepEqual(await fixture.evaluate(() => window.__uiActions.equip), ["stoneSword", "stoneSword", "stoneSword"]);
  assert.equal(await fixture.locator("#inventoryPanelGrid .equipped").count(), 1);
  for (const id of ["wood", "stone", "charcoal", "slimeGoo"]) assert.equal(await fixture.locator(`#inventoryPanelGrid .token-${id}`).count(), 1);
  await capture(fixture, "inventory-populated-fixture");
  await fixture.click("#closeInventoryButton"); await fixture.click("#hudStatsButton");
  // The actual navigation rerenders stats from game state. Render this isolated presentation fixture again.
  await fixture.evaluate(async () => {
    const { renderStatsPanel } = await import("/dist/src/game/ui/panels/stats-panel.js");
    const { createPlayer } = await import("/dist/src/game/state/player-factory.js"); const player = createPlayer(); player.unspentStatPoints = 2;
    renderStatsPanel({ statsOverview: document.getElementById("statsOverview"), statsAllocation: document.getElementById("statsAllocation") }, player, key => window.__uiActions.spend.push(key));
  });
  await fixture.locator("#statsAllocation button").first().click(); assert.deepEqual(await fixture.evaluate(() => window.__uiActions.spend), ["strength"]);
  await capture(fixture, "stats-points-fixture");
  await fixture.click("#closeStatsButton");
  await fixture.evaluate(() => { document.querySelector("#overlayVeil").classList.remove("hidden"); document.querySelector("#questPanel").classList.remove("hidden"); document.querySelector("#hud").classList.add("hidden"); });
  await fixture.locator("#questBoardList button").first().click(); assert.equal((await fixture.evaluate(() => window.__uiActions.accept)).length, 1);
  await fixture.evaluate(() => { const f = window.__uiFixture; f.quests[0].accepted = true; f.renderQuestBoard(document.getElementById("questBoardList"), f.quests, () => {}); });
  assert.equal(await fixture.locator("#questBoardList button:not(:disabled)").count(), 0);
  await capture(fixture, "quests-fixture");
  assert.ok(await fixture.evaluate(() => window.__uiFixture.unchanged)); assert.deepEqual(await fixture.evaluate(() => window.__storageWrites), []);
  await fixture.close();
  checks.push("Isolated populated overlays retain material sprites, equipped indicators and weapon activation by click/Enter/Space; stat and quest buttons dispatch their existing callbacks without persistence");
  for (const [label, missing, reduced] of [["missing-icons", true, false], ["reduced-motion", false, true]]) {
    const fallback = await prepare(390, 844, missing, reduced);
    if (reduced) assert.equal(await fallback.locator(".title-tree").first().evaluate(e => getComputedStyle(e).animationName), "none");
    await fallback.click("#newGameButton"); await frame(fallback); await fallback.click("#hudInventoryButton"); await capture(fallback, label);
    assert.equal((await state(fallback)).overlays.inventory, true); assert.ok(await fallback.locator("#closeInventoryButton").isVisible());
    assert.deepEqual(await fallback.evaluate(() => window.__storageWrites), []); await fallback.close();
  }
  checks.push("Missing glyph image retains readable navigation; reduced-motion preference disables UI animations; zero attempted storage writes");
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, "results.json"), JSON.stringify({ passed: true, checks, errors, storageWrites: 0 }, null, 2));
  console.log(JSON.stringify({ passed: true, checks, errors, output }, null, 2));
} finally { await browser.close(); }
