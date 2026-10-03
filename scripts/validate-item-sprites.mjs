import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href) : await import("playwright");
const url = process.argv[2] || "http://localhost:4174";
const output = path.resolve(process.argv[3] || "output/item-validation");
await mkdir(output, { recursive: true });
const checks = [], errors = [], atlas = readPng("assets/items/loot-items.png"), stats = alphaStats(atlas);
const metadata = JSON.parse(await readFile("assets/items/loot-items.json", "utf8"));
assert.deepEqual([atlas.width, atlas.height], [320, 64]);
assert.equal(stats.translucent, 0); assert.equal(stats.colors, 42);
assert.ok(stats.transparent > stats.opaque);
for (const [index, id] of ["slimeGoo", "gold", "wood", "charcoal", "stone"].entries()) {
  assert.deepEqual(metadata.frames[id].frame, { x: index * 64, y: 0, w: 64, h: 64 });
  assert.deepEqual(metadata.frames[id].pivot, { x: 32, y: 32 });
  let count = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    if (atlas.pixels[(y * atlas.width + index * 64 + x) * 4 + 3]) {
      count++; assert.ok(x > 0 && x < 63 && y > 0 && y < 63, `${id} clipped`);
    }
  }
  assert.ok(count > 1000, `${id} must contain artwork`);
}
const source = await readFile("assets/items/loot-items.aseprite");
assert.equal(source.readUInt16LE(4), 0xa5e0);
assert.deepEqual([source.readUInt16LE(6), source.readUInt16LE(8), source.readUInt16LE(10)], [1, 320, 64]);
for (const id of Object.keys(metadata.frames)) assert.ok(source.includes(Buffer.from(id)), `${id} missing in source`);
// Read compressed RGBA cels from the single-frame source; validate the actual editable pixels.
assert.equal(source.readUInt16LE(12),32);
const sourcePixels = Buffer.alloc(atlas.width * atlas.height * 4), slices = {};
const frameEnd = 128 + source.readUInt32LE(128);
for (let offset = 144; offset < frameEnd;) {
  const length = source.readUInt32LE(offset), kind = source.readUInt16LE(offset+4), data = source.subarray(offset+6,offset+length);
  if (kind === 0x2005) {
    const x=data.readInt16LE(2), y=data.readInt16LE(4), type=data.readUInt16LE(7);
    assert.equal(data[6],255); assert.ok(type===0 || type===2,"Expected unlinked image cels");
    const w=data.readUInt16LE(16), h=data.readUInt16LE(18), rgba=type===2?inflateSync(data.subarray(20)):data.subarray(20);
    assert.equal(rgba.length,w*h*4);
    for(let cy=0;cy<h;cy++) for(let cx=0;cx<w;cx++) {
      const at=(cy*w+cx)*4, dest=((y+cy)*atlas.width+x+cx)*4;
      assert.ok(rgba[at+3]===0 || rgba[at+3]===255);
      if(rgba[at+3]) rgba.copy(sourcePixels,dest,at,at+4);
    }
  }
  if (kind === 0x2022) {
    assert.equal(data.readUInt32LE(0),1); const flags=data.readUInt32LE(4), nameLength=data.readUInt16LE(12);
    const name=data.toString("utf8",14,14+nameLength), key=14+nameLength;
    assert.equal(data.readUInt32LE(key),0); assert.equal(flags,2);
    slices[name]={frame:{x:data.readInt32LE(key+4),y:data.readInt32LE(key+8),w:data.readUInt32LE(key+12),h:data.readUInt32LE(key+16)},
      pivot:{x:data.readInt32LE(key+20),y:data.readInt32LE(key+24)}};
  }
  offset += length;
}
assert.deepEqual(sourcePixels, atlas.pixels, "Editable source pixels must match game atlas");
assert.deepEqual(Object.keys(slices).sort(),Object.keys(metadata.frames).sort());
for(const id of Object.keys(slices)) { assert.deepEqual(slices[id].frame,metadata.frames[id].frame); assert.deepEqual(slices[id].pivot,metadata.frames[id].pivot); }
checks.push("Five populated cells with padding, 42 colors, binary alpha, matching metadata and exact editable-source pixels/slices");

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
async function prepare(mode = "normal") {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => { if (message.type() === "error" && !message.text().includes("ERR_FAILED")) errors.push(message.text()); });
  await page.route("**/favicon.ico", route => route.fulfill({ status: 204 }));
  // Read-only presentation fixture: never boot the game/session or a persistence API.
  await page.route("**/item-fixture.html", route => route.fulfill({ contentType: "text/html", body:
    '<html><head><link rel="stylesheet" href="/styles.css"></head><body><canvas id="items" width="1280" height="800"></canvas></body></html>' }));
  await page.addInitScript(() => {
    window.__storageWrites = []; window.__draws = []; window.__shadows = [];
    for (const method of ["setItem", "removeItem", "clear"]) Storage.prototype[method] = function () { window.__storageWrites.push(method); throw Error("Storage write blocked"); };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (image instanceof HTMLImageElement && image.src.includes("loot-items.png")) window.__draws.push({ args, smoothing: this.imageSmoothingEnabled });
      return draw.call(this, image, ...args);
    };
    const ellipse = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function (...args) { window.__shadows.push(args); return ellipse.apply(this,args); };
  });
  if (mode === "missing") await page.route("**/assets/items/loot-items.png", route => route.abort());
  if (mode === "wrong-size") await page.route("**/assets/items/loot-items.png", route => route.fulfill({ path: path.resolve("assets/environment/forest-props.png") }));
  await page.goto(`${url}/item-fixture.html`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const [{ EnvironmentLayer }, { WorldRenderer }, { World }, { createPlayer }, { DayNightSystem }, helpers] = await Promise.all([
      import("/dist/src/game/render/layers/environment-layer.js"), import("/dist/src/game/render/world-renderer.js"),
      import("/dist/src/game/world.js"), import("/dist/src/game/state/player-factory.js"),
      import("/dist/src/game/day-night.js"), import("/dist/src/game/state-helpers.js")
    ]);
    const canvas = document.querySelector("canvas"), ctx = canvas.getContext("2d");
    canvas.style.cssText = "position:fixed;inset:0;width:1280px;height:800px";
    const world = new World(739721), player = createPlayer(); player.x = 0; player.y = 5;
    const drops = [helpers.createItemDrop(1,"slimeGoo",3,-3,7), helpers.createGoldDrop(2,8,-1,7),
      helpers.createItemDrop(3,"wood",5,1,7), helpers.createItemDrop(4,"charcoal",2,3,7), helpers.createItemDrop(5,"stone",2,5,7)];
    const state = { world, player, drops, enemies: [], projectiles: [], particles: [], burnEffects: [], floatingTexts: [], pendingSpellCasts: [], enemyDeathEffects: [], playerAuraEffects: [],
      camera: { x: 0, y: 5, halfWidth: 1280/96, halfHeight:800/96 }, seed: world.seed, lastTimestamp: 0,
      dayNight: new DayNightSystem().getLightingState(), resolveSpellCastSource: () => null, isNearGuideNpc: () => false };
    const layer = new EnvironmentLayer(ctx, canvas); layer.setState(state);
    const renderer = new WorldRenderer(ctx, canvas);
    window.__fixture = { canvas,ctx,state,layer,renderer, before:JSON.stringify(drops) };
    const ui = document.createElement("div"); ui.id = "iconFixture";
    ui.style.cssText = "position:fixed;top:30px;right:30px;z-index:9999;display:flex;gap:18px;padding:18px;background:#182a20;border:1px solid #a98751";
    ui.innerHTML = ["slimeGoo","gold","wood","charcoal","stone"].map(id=>`<div class="inventory-slot" style="width:100px;display:flex;flex-direction:column;gap:10px;padding:12px"><span class="slot-token token-${id}"></span><small>${id}</small></div>`).join("");
    document.body.append(ui);
    layer.drawDrops();
  });
  await page.waitForLoadState("networkidle");
  return page;
}
try {
  const page = await prepare();
  await page.waitForFunction(() => { window.__draws=[]; window.__fixture.layer.drawDrops(); return window.__draws.length === 5; });
  const behavior = await page.evaluate(() => {
    const f=window.__fixture;
    function draw() { window.__draws=[]; window.__shadows=[]; f.ctx.clearRect(0,0,1280,800); f.ctx.save(); f.ctx.translate(640,64); f.layer.drawDrops(); f.ctx.restore(); return { draws:[...window.__draws], shadows:window.__shadows.slice(0,5) }; }
    const initial=draw(), unchanged=f.before===JSON.stringify(f.state.drops);
    f.state.drops.forEach(d=>d.life=0.7); const bobbed=draw();
    f.renderer.render(f.state);
    return { initial,bobbed,unchanged,icons:[...document.querySelectorAll("#iconFixture .slot-token")].map(el=>{
      const s=getComputedStyle(el); return { image:s.backgroundImage, position:s.backgroundPositionX, size:s.backgroundSize, radius:s.borderRadius, sampling:s.imageRendering };
    }) };
  });
  assert.deepEqual(behavior.initial.draws.map(d=>d.args.slice(0,4)), [[0,0,64,64],[64,0,64,64],[128,0,64,64],[192,0,64,64],[256,0,64,64]]);
  assert.deepEqual(behavior.initial.draws.map(d=>d.args[6]), [40,36,44,40,44]);
  assert.ok(behavior.initial.draws.every(d=>!d.smoothing)); assert.ok(behavior.unchanged);
  assert.notDeepEqual(behavior.initial.draws.map(d=>d.args[5]),behavior.bobbed.draws.map(d=>d.args[5]));
  assert.deepEqual(behavior.initial.shadows,behavior.bobbed.shadows);
  assert.deepEqual(behavior.icons.map(i=>parseFloat(i.position)),[0,25,50,75,100]);
  assert.ok(behavior.icons.every(i=>i.image.includes("loot-items.png") && i.sampling==="pixelated" && i.radius==="0px" && i.size==="500% 100%"));
  assert.deepEqual(await page.evaluate(()=>window.__storageWrites),[]);
  await page.screenshot({ path:path.join(output,"items-in-world.png") });
  await page.screenshot({ path:path.join(output,"items-detail.png"),clip:{x:450,y:430,width:480,height:150} });
  checks.push("Actual EnvironmentLayer/WorldRenderer draw all five cells including stone, preserve quantities and pickup radii; bobbing moves artwork while shadows stay grounded");
  checks.push("Inventory CSS reuses matching atlas cells with pixelated sampling and no clipped rounded corners");
  await page.close();
  for (const mode of ["missing","wrong-size"]) {
    const fallback = await prepare(mode);
    const result=await fallback.evaluate(()=>{
      const f=window.__fixture; window.__draws=[]; f.ctx.clearRect(0,0,1280,800); f.ctx.save(); f.ctx.translate(640,64); f.layer.drawDrops(); f.ctx.restore();
      const pixels=f.ctx.getImageData(0,0,1280,800).data; let visible=0,cyan=0;
      for(let i=0;i<pixels.length;i+=4) if(pixels[i+3]) { visible++; if(pixels[i+2]>pixels[i]*1.25 && pixels[i+1]>pixels[i]*1.25) cyan++; }
      return {draws:window.__draws.length,visible,cyan,unchanged:f.before===JSON.stringify(f.state.drops),storage:window.__storageWrites};
    });
    assert.equal(result.draws,0); assert.ok(result.visible>1000); assert.ok(result.cyan>100); assert.ok(result.unchanged); assert.deepEqual(result.storage,[]);
    await fallback.screenshot({path:path.join(output,`${mode}-fallback.png`)}); await fallback.close();
  }
  checks.push("Missing and incorrect-dimension images use visible procedural fallback with cyan gel; zero storage write attempts or browser errors");
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,"results.json"),JSON.stringify({passed:true,stats,checks,behavior},null,2));
  console.log(JSON.stringify({passed:true,stats,checks},null,2));
} catch(error) {
  await writeFile(path.join(output,"results.json"),JSON.stringify({passed:false,checks,errors,error:String(error)},null,2));
  throw error;
} finally { await browser.close(); }
