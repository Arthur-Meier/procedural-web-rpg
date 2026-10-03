import { mkdir, writeFile } from "node:fs/promises";
import { readPng } from "./png-art-utils.mjs";

// Read the supplied art and produce pixel instructions. Only Aseprite MCP draws/exports images.
const reference = "Img referencias/Ficha de Referência do Mago Vermelho Maligno.png";
const image = readPng(reference), width = 128, height = 128, anchor = { x:64, y:116 };
const palette = ["#100e14","#201821","#31232b","#483139","#63272e","#842d35","#a13a40","#bc4b4a","#d26256",
  "#403931","#5e5040","#80694e","#a4875e","#c1a479","#dfc9a1","#524f4d","#75736c","#9a9686","#bcb6a1","#ded4ba",
  "#9b1c32","#d82a3b","#fa4850","#ff896b","#ffdbb5"];
const rgb = palette.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
function sample(x,y) { const at=(y*image.width+x)*4; return [...image.pixels.subarray(at,at+4)]; }
function material([r,g,b,a]) { return a>0 && ((r>40 && r-g>13 && r-b>8) || (r>65 && r-b>16 && g>35) || (Math.max(r,g,b)>78 && Math.max(r,g,b)-Math.min(r,g,b)<50)); }
function nearest(color) {
  let best=0,error=Infinity;
  for(const [i,c] of rgb.entries()) { const d=c.reduce((sum,v,k)=>sum+(v-color[k])**2,0); if(d<error) { best=i; error=d; } }
  return palette[best];
}
const poses = {
  front: { rect:[27,200,279,302], center:169, eyes:[[166,264],[178,264]] },
  side: { rect:[611,208,190,294], center:717, eyes:[[734,269]] },
  back: { rect:[850,208,252,294], center:946 },
  castFront: { rect:[35,578,235,333], center:163, exclude:(x,y)=>y<660 },
  castSide: { rect:[329,675,284,231], center:452, exclude:(x,y)=>x>604 },
};
function extract(pose) {
  const [left,top,w,h]=pose.rect, columns=Math.ceil(w/3), rows=Math.ceil(h/3), points=[];
  for(let y=0;y<rows;y++) for(let x=0;x<columns;x++) {
    const sx=left+x*3+1,sy=top+y*3+1;
    if(pose.exclude?.(sx,sy)) continue;
    const color=sample(sx,sy), dark=Math.max(...color.slice(0,3))<31;
    let near=false;
    if(dark && y<rows-2) for(let dy=-2;dy<=2&&!near;dy++) for(let dx=-2;dx<=2;dx++) {
      const tx=sx+dx*3,ty=sy+dy*3;
      if(tx>=left && tx<left+w && ty>=top && ty<top+h && !pose.exclude?.(tx,ty) && material(sample(tx,ty))) { near=true; break; }
    }
    if(material(color) || (dark && near)) points.push({x,y,color:nearest(color)});
  }
  const bottom=Math.max(...points.map(p=>p.y)), shiftX=anchor.x-Math.round((pose.center-left)/3), shiftY=anchor.y-1-bottom;
  const pixels=points.map(p=>({...p,x:p.x+shiftX,y:p.y+shiftY}));
  // Preserve the reference's glowing eyes after reduction to gameplay-sized pixels.
  for(const [sx,sy] of pose.eyes||[]) {
    const x=Math.round((sx-left)/3)+shiftX,y=Math.round((sy-top)/3)+shiftY;
    const existing=pixels.find(p=>p.x===x && p.y===y);
    if(existing) existing.color="#fa4850"; else pixels.push({x,y,color:"#fa4850"});
  }
  return pixels;
}
const bases=Object.fromEntries(Object.entries(poses).map(([name,pose])=>[name,extract(pose)]));
// Reuse the complete idle staff head for the raised pose, without baking the
// reference's floating sigil/projectile or cutting its gem into a rectangle.
const staffHead=new Map(bases.front.filter(p=>p.x<46 && p.y<48).map(p=>[p.y*width+p.x,p.color]));
const rotation=0.30, cosine=Math.cos(rotation), sine=Math.sin(rotation);
for(let y=2;y<49;y++) for(let x=28;x<72;x++) {
  const sx=Math.round(cosine*(x-51)+sine*(y-20)+30), sy=Math.round(-sine*(x-51)+cosine*(y-20)+27);
  const color=staffHead.get(sy*width+sx);
  if(color) bases.castFront.push({x,y,color});
}
const frames=[], tags=[];
for(const view of ["front","side","back"]) {
  const base=bases[view];
  for(const [action,count,duration] of [["idle",2,240],["walk",4,120],["cast",3,110],["hurt",1,100]]) {
    const from=frames.length;
    for(let phase=0;phase<count;phase++) {
      const source=action==="cast" && view!=="back" ? bases[view==="front"?"castFront":"castSide"] : base;
      const map=new Map();
      for(const p of source) {
        let x=p.x,y=p.y,color=p.color;
        if(action==="idle" && phase===1 && y<108) y-=1;
        if(action==="walk") {
          const step=[-1,0,1,0][phase];
          if(y>78) x+=Math.round(step*(y-78)/38);
          if(y>=108) y-=(x<64 ? [0,1,2,1][phase] : [2,1,0,1][phase]);
          else if(phase===1 || phase===3) y-=1;
        }
        if(action==="cast") {
          if(y<72) { y-=phase; x+=view==="side"?phase:0; }
          if(phase===2 && ["#d82a3b","#fa4850","#ff896b"].includes(color) && y<50) color="#ffdbb5";
        }
        if(action==="hurt") x-=Math.round((116-y)/40);
        if(x<2 || x>125 || y<2 || y>125) throw Error(`Clipping ${view}-${action}`);
        map.set(y*width+x,{x,y,color});
      }
      frames.push({name:`${view}-${action}`,duration,pixels:[...map.values()]});
    }
    tags.push({name:`${view}-${action}`,from,to:frames.length-1});
  }
}
await mkdir(".runtime/mage",{recursive:true});
for(const [i,frame] of frames.entries()) await writeFile(`.runtime/mage/frame-${i+1}.json`,JSON.stringify(frame.pixels));
await writeFile(".runtime/mage/manifest.json",JSON.stringify({reference,width,height,anchor,palette,tags,frames:frames.map(({pixels,...f})=>({...f,pixelCount:pixels.length}))},null,2));
console.log(JSON.stringify({frames:frames.length,palette:palette.length,counts:frames.map(f=>f.pixels.length),tags},null,2));
