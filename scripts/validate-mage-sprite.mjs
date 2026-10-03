import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readPng, alphaStats } from "./png-art-utils.mjs";

const { chromium }=process.env.PLAYWRIGHT_MODULE ? await import(pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href) : await import("playwright");
const url=process.argv[2]||"http://localhost:4174", output=path.resolve(process.argv[3]||"output/mage-validation");
await mkdir(output,{recursive:true});
const checks=[], errors=[], atlas=readPng("assets/enemies/red-mage.png"), stats=alphaStats(atlas);
const metadata=JSON.parse(await readFile("assets/enemies/red-mage.json","utf8")), expectedTags=[];
assert.deepEqual([atlas.width,atlas.height],[3840,128]); assert.equal(stats.translucent,0); assert.ok(stats.colors<=25);
const hashes=[];
for(let frame=0;frame<30;frame++) {
  assert.deepEqual(metadata.frames[frame].frame,{x:frame*128,y:0,w:128,h:128});
  const pixels=Buffer.alloc(128*128*4); let occupied=0;
  for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
    const at=(y*atlas.width+frame*128+x)*4;
    atlas.pixels.copy(pixels,(y*128+x)*4,at,at+4);
    if(atlas.pixels[at+3]) { occupied++; assert.ok(x>0&&x<127&&y>0&&y<127,`Clipping frame ${frame}`); }
  }
  assert.ok(occupied>2800,`Empty/truncated frame ${frame}`);
  hashes.push(createHash("sha256").update(pixels).digest("hex"));
}
for(const [bank,view] of [[0,"front"],[10,"side"],[20,"back"]]) {
  for(const [action,from,to,duration] of [["idle",0,1,240],["walk",2,5,120],["cast",6,8,110],["hurt",9,9,100]]) {
    expectedTags.push([`${view}-${action}`,bank+from,bank+to]);
    for(let i=bank+from;i<=bank+to;i++) assert.equal(metadata.frames[i].duration,duration);
    if(action!=="hurt") assert.ok(new Set(hashes.slice(bank+from,bank+to+1)).size>1,`${view}-${action} is static`);
  }
}
assert.deepEqual(metadata.meta.frameTags.map(t=>[t.name,t.from,t.to]),expectedTags);
// Reconstruct all RGBA source cels and compare to the exported sheet, without launching a writer.
const source=await readFile("assets/enemies/red-mage.aseprite"), reconstructed=Buffer.alloc(atlas.pixels.length);
assert.equal(source.readUInt16LE(4),0xa5e0);
assert.deepEqual([source.readUInt16LE(6),source.readUInt16LE(8),source.readUInt16LE(10),source.readUInt16LE(12)],[30,128,128,32]);
let frameStart=128;
for(let frame=0;frame<30;frame++) {
  const end=frameStart+source.readUInt32LE(frameStart); assert.equal(source.readUInt16LE(frameStart+8),metadata.frames[frame].duration);
  for(let offset=frameStart+16;offset<end;) {
    const length=source.readUInt32LE(offset),kind=source.readUInt16LE(offset+4),data=source.subarray(offset+6,offset+length);
    if(kind===0x2005) {
      const x=data.readInt16LE(2),y=data.readInt16LE(4),type=data.readUInt16LE(7);
      assert.equal(data[6],255); assert.ok(type===0||type===2);
      const w=data.readUInt16LE(16),h=data.readUInt16LE(18),rgba=type===2?inflateSync(data.subarray(20)):data.subarray(20);
      assert.equal(rgba.length,w*h*4);
      for(let cy=0;cy<h;cy++) for(let cx=0;cx<w;cx++) {
        const at=(cy*w+cx)*4,dest=((y+cy)*atlas.width+frame*128+x+cx)*4;
        if(rgba[at+3]) rgba.copy(reconstructed,dest,at,at+4);
      }
    }
    offset+=length;
  }
  frameStart=end;
}
assert.deepEqual(reconstructed,atlas.pixels);
checks.push("30 populated unclipped frames, binary alpha, palette <=25 colors, 12 tags/durations and exact editable-source/export equality; all idle/walk/cast groups animate");

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
async function fixture(mode="normal") {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("console",message=>{if(message.type()==="error"&&!message.text().includes("ERR_FAILED"))errors.push(message.text());});
  await page.route("**/favicon.ico",r=>r.fulfill({status:204}));
  await page.route("**/mage-fixture.html",r=>r.fulfill({contentType:"text/html",body:'<html><head><link rel="stylesheet" href="/styles.css"></head><body><canvas width="1280" height="800"></canvas></body></html>'}));
  await page.addInitScript(()=>{
    window.__storageWrites=[]; window.__mageDraws=[];
    for(const method of ["setItem","removeItem","clear"])Storage.prototype[method]=function(){window.__storageWrites.push(method);throw Error("Storage write blocked");};
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
      if(source instanceof HTMLImageElement&&source.src.includes("red-mage.png"))window.__mageDraws.push({frame:args[0]/128,args,smoothing:this.imageSmoothingEnabled,mirror:this.getTransform().a<0,filter:this.filter});
      return original.call(this,source,...args);
    };
  });
  if(mode==="missing")await page.route("**/assets/enemies/red-mage.png",r=>r.abort());
  if(mode==="wrong-size")await page.route("**/assets/enemies/red-mage.png",r=>r.fulfill({path:path.resolve("assets/items/loot-items.png")}));
  await page.goto(`${url}/mage-fixture.html`,{waitUntil:"networkidle"});
  await page.evaluate(async()=>{
    const [{EntityLayer},{Mage},{World},{WorldRenderer},{createPlayer},{DayNightSystem}] = await Promise.all([
      import("/dist/src/game/render/layers/entity-layer.js"),import("/dist/src/game/enemies/index.js"),import("/dist/src/game/world.js"),
      import("/dist/src/game/render/world-renderer.js"),import("/dist/src/game/state/player-factory.js"),import("/dist/src/game/day-night.js")]);
    const canvas=document.querySelector("canvas"),ctx=canvas.getContext("2d"),player=createPlayer(),world=new World(739721),enemy=new Mage(0,0,0);
    canvas.style.cssText="position:fixed;inset:0;width:1280px;height:800px"; player.x=0;player.y=5;
    const state={world,player,enemies:[],projectiles:[],drops:[],particles:[],burnEffects:[],floatingTexts:[],pendingSpellCasts:[],enemyDeathEffects:[],playerAuraEffects:[],
      camera:{x:0,y:5,halfWidth:1280/96,halfHeight:800/96},seed:world.seed,lastTimestamp:0,dayNight:new DayNightSystem().getLightingState(),
      resolveSpellCastSource:cast=>{const e=state.enemies.find(e=>e.id===cast.sourceEnemyId);return e?{x:e.x,y:e.y,radius:e.radius}:null;},isNearGuideNpc:()=>false};
    const layer=new EntityLayer(ctx,canvas);layer.setState(state);
    window.__fixture={canvas,ctx,state,layer,enemy,Mage,renderer:new WorldRenderer(ctx,canvas)};
    ctx.save();ctx.translate(640,400);layer.drawEnemy(enemy);ctx.restore();
  });
  await page.waitForLoadState("networkidle");return page;
}
try {
  const page=await fixture();
  await page.waitForFunction(()=>{const f=window.__fixture;window.__mageDraws=[];f.layer.drawEnemy(f.enemy);return window.__mageDraws.length===1;});
  const behavior=await page.evaluate(()=>{
    const f=window.__fixture,e=f.enemy;let unchanged=true;
    const draw=()=>{const before=JSON.stringify(e);window.__mageDraws=[];f.layer.drawEnemy(e);unchanged&&=before===JSON.stringify(e);return window.__mageDraws.at(-1);};
    const idle=[];
    for(const direction of [{x:0,y:1},{x:1,y:0},{x:-1,y:0},{x:0,y:-1}]) {
      e.dashDirection=direction;f.state.lastTimestamp=0;const a=draw();f.state.lastTimestamp=240;const b=draw();idle.push([a,b]);
    }
    e.dashDirection={x:0,y:1};f.state.lastTimestamp=0;draw();const walk=[];
    for(let i=1;i<=4;i++){e.x+=0.03;f.state.lastTimestamp=i*120;walk.push(draw());}
    f.state.lastTimestamp=700;const stopped=draw();const paused=draw();f.state.lastTimestamp=0;const rewind=draw();
    e.attackTimer=9;const cooldown=draw();const castFrames=[];
    for(const direction of [{x:0,y:1},{x:1,y:0},{x:-1,y:0},{x:0,y:-1}])for(const remaining of [0.5,0.3,0.1]) {
      f.state.pendingSpellCasts=[{id:1,source:"enemy",sourceEnemyId:e.id,element:"water",direction,duration:0.5,remaining}];castFrames.push(draw());
    }
    f.state.pendingSpellCasts[0].remaining=0;const expired=draw();
    f.state.pendingSpellCasts[0].remaining=0.5;f.state.pendingSpellCasts[0].sourceEnemyId=123;const otherEnemy=draw();
    f.state.pendingSpellCasts=[];e.hurtTimer=0.16;const hurt=draw();e.hurtTimer=0;const recovered=draw();
    const restored=f.ctx.filter==="none"&&f.ctx.imageSmoothingEnabled;
    f.state.enemies=[new f.Mage(-4,7,1),new f.Mage(-2,7,2),new f.Mage(0,7,3),new f.Mage(2,7,4),new f.Mage(4,7,5)];
    f.state.enemies[1].dashDirection={x:1,y:0};f.state.enemies[2].dashDirection={x:-1,y:0};f.state.enemies[3].dashDirection={x:0,y:-1};
    f.state.pendingSpellCasts=[{id:1,source:"enemy",sourceEnemyId:5,element:"water",direction:{x:0,y:1},remaining:0.2,duration:0.5,radius:0.15,speed:3,range:5,damage:2,spawnOffset:0.2}];
    f.renderer.render(f.state);
    return {idle,walk,stopped,paused,rewind,cooldown,castFrames,expired,otherEnemy,hurt,recovered,unchanged,restored};
  });
  assert.deepEqual(behavior.idle.map(frames=>frames.map(f=>f.frame)),[[0,1],[10,11],[10,11],[20,21]]);
  assert.deepEqual(behavior.idle.map(frames=>frames[0].mirror),[false,false,true,false]);
  assert.deepEqual(behavior.walk.map(f=>f.frame),[3,4,5,2]);
  assert.deepEqual(behavior.paused,behavior.stopped);
  assert.ok([behavior.stopped,behavior.paused,behavior.rewind,behavior.cooldown,behavior.expired,behavior.otherEnemy,behavior.recovered].every(f=>f.frame<2));
  assert.deepEqual(behavior.castFrames.map(f=>f.frame),[6,7,8,16,17,18,16,17,18,26,27,28]);
  assert.deepEqual(behavior.castFrames.map(f=>f.mirror),[false,false,false,false,false,false,true,true,true,false,false,false]);
  assert.equal(behavior.hurt.frame,9);assert.ok(behavior.hurt.filter.includes("brightness"));assert.ok(behavior.unchanged&&behavior.restored);
  assert.ok([...behavior.idle.flat(),...behavior.walk,...behavior.castFrames].every(f=>!f.smoothing));
  await page.waitForTimeout(150);await page.evaluate(()=>{const f=window.__fixture;f.renderer.render(f.state);});
  await page.screenshot({path:path.join(output,"mages-in-world.png")});
  await page.screenshot({path:path.join(output,"mages-detail.png"),clip:{x:380,y:390,width:800,height:190}});
  assert.deepEqual(await page.evaluate(()=>window.__storageWrites),[]);await page.close();
  checks.push("Real EntityLayer selects idle/walk/cast/hurt for all four facings, mirrors left, detects actual displacement, settles on stop/rewind, holds idle at a fixed clock, ignores full cooldown/expired/other-enemy casts and restores Canvas state without mutating enemies");
  for(const mode of ["missing","wrong-size"]) {
    const fallback=await fixture(mode);
    const result=await fallback.evaluate(()=>{
      const f=window.__fixture;f.ctx.clearRect(0,0,1280,800);window.__mageDraws=[];const before=JSON.stringify(f.enemy);
      f.ctx.save();f.ctx.translate(640,400);f.layer.drawEnemy(f.enemy);f.ctx.restore();
      const pixels=f.ctx.getImageData(600,340,110,120).data;let red=0;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]&&pixels[i]>pixels[i+1]*1.3&&pixels[i]>pixels[i+2]*1.2)red++;
      return {draws:window.__mageDraws.length,red,unchanged:before===JSON.stringify(f.enemy),storage:window.__storageWrites};
    });
    assert.equal(result.draws,0);assert.ok(result.red>100);assert.ok(result.unchanged);assert.deepEqual(result.storage,[]);
    await fallback.screenshot({path:path.join(output,`${mode}-fallback.png`)});await fallback.close();
  }
  checks.push("Missing/wrong-dimension mage image uses visible red procedural fallback; no attempted storage writes or unexpected browser errors");
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,"results.json"),JSON.stringify({passed:true,stats,checks,behavior},null,2));console.log(JSON.stringify({passed:true,stats,checks},null,2));
}catch(error){await writeFile(path.join(output,"results.json"),JSON.stringify({passed:false,checks,errors,error:String(error)},null,2));throw error;}
finally{await browser.close();}
