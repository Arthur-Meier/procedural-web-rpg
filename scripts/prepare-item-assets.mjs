import { mkdir, writeFile } from "node:fs/promises";

// Authored pixel instructions only. Images and editable sources are drawn/exported by Aseprite MCP.
const size = 64, names = ["slimeGoo", "gold", "wood", "charcoal", "stone"];
const plans = [];
for (const name of names) {
  const pixels = new Map();
  const put = (x, y, color) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < size && y >= 0 && y < size) pixels.set(y * size + x, color); };
  function ellipse(cx, cy, rx, ry, color) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if ((x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1) put(x, y, typeof color === "function" ? color(x, y) : color);
    }
  }
  function polygon(points, color) {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [a, b] = points[i], [c, d] = points[j];
        if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) inside = !inside;
      }
      if (inside) put(x, y, typeof color === "function" ? color(x, y) : color);
    }
  }
  function line(x0, y0, x1, y1, color, thickness = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) for (let j = 0; j < thickness; j++) put(x0 + (x1 - x0) * i / Math.max(1, steps), y0 + (y1 - y0) * i / Math.max(1, steps) + j, color);
  }
  const noise = (x, y) => ((Math.imul(x + 31, 734287) ^ Math.imul(y + 17, 912931)) >>> 0) % 19;
  if (name === "slimeGoo") {
    const contour = [[10,44],[13,34],[19,28],[23,22],[25,13],[29,9],[34,12],[36,22],[43,29],[47,39],[53,43],[52,48],[46,52],[22,53],[12,50]];
    polygon(contour, "#073955");
    polygon([[12,44],[16,34],[22,29],[26,21],[27,14],[30,12],[33,15],[34,24],[41,31],[45,41],[50,44],[49,48],[43,50],[22,51],[14,48]], (x,y) => {
      const light = 1 - (y - 16) / 43 - (x - 27) / 65;
      return ["#086baa","#079aca","#13bee5","#46ddf4","#89f0fa"][Math.max(0,Math.min(4,Math.floor(light * 4)))];
    });
    polygon([[16,37],[20,33],[23,33],[21,40],[18,44],[15,44]], "#89f0fa");
    polygon([[23,27],[27,20],[28,14],[30,14],[31,17],[29,24],[27,29]], "#bffaff");
    line(28,15,29,15,"#efffff",2);
    polygon([[29,33],[37,31],[42,36],[44,44],[40,48],[28,49],[23,45]],"#079aca");
    ellipse(34,39,5,5,"#13bee5"); ellipse(32,37,2,2,"#89f0fa"); put(31,36,"#efffff");
    ellipse(44,45,3,2,"#46ddf4"); put(43,44,"#bffaff");
    line(23,50,40,50,"#46ddf4"); line(26,51,37,51,"#89f0fa");
    ellipse(10,51,3,2,"#073955"); ellipse(10,50,2,1,"#46ddf4");
    ellipse(53,35,2,3,"#073955"); ellipse(53,34,1,2,"#89f0fa");
  } else if (name === "gold") {
    ellipse(34,33,18,23,"#38251e"); ellipse(34,33,17,22,"#895020");
    for(let y=16;y<51;y+=4) line(48,y,50,y,"#d09331");
    ellipse(30,31,18,23,"#38251e");
    ellipse(30,31,17,22,(x,y)=>y<22?"#ffe6a0":y<33?"#eac35d":y<44?"#c58b32":"#895020");
    ellipse(30,31,14,19,"#895020");
    ellipse(30,30,13,18,(x,y)=>x+y<49?"#f5d67b":x+y<68?"#dca948":"#b0782b");
    ellipse(30,31,11,16,"#b0782b");
    ellipse(30,32,10,15,(x,y)=>y<29?"#eac35d":y<40?"#dca948":"#c58b32");
    // Engraved lozenge and tiny rim marks, lit from the upper left.
    polygon([[30,20],[37,31],[30,42],[23,31]],"#895020");
    polygon([[29,21],[35,31],[29,40],[24,31]],"#ffe6a0");
    polygon([[30,25],[33,31],[30,36],[27,31]],"#b0782b");
    line(17,23,18,19,"#fff3c4",2); line(20,15,26,12,"#fff3c4");
    line(23,10,33,10,"#ffe6a0"); line(25,51,34,51,"#eac35d");
    for(const [x,y] of [[22,17],[29,14],[36,17],[19,29],[20,40],[29,47],[39,40],[41,29]]) put(x,y,"#ffe6a0");
    line(17,16,17,21,"#fff3c4"); line(15,18,19,18,"#fff3c4");
  } else if (name === "wood") {
    function log(cx, cy, length) {
      // Slightly sloped cylinders with irregular bark ridges and end grain.
      polygon([[cx,cy-7],[cx+length,cy-17],[cx+length+4,cy-13],[cx+length+4,cy-3],[cx+2,cy+8],[cx-4,cy+4]],"#30251e");
      polygon([[cx+1,cy-5],[cx+length,cy-15],[cx+length+2,cy-12],[cx+length+2,cy-5],[cx+2,cy+6]],(x,y)=> {
        const v=y-cy+(x-cx)*.36;
        const n=noise(x,y);
        return v< -2 ? (n<3?"#bd925b":"#9b7548") : v<2?(n<4?"#513b29":"#785333"):(n<5?"#30251e":"#513b29");
      });
      for(let i=0;i<4;i++) {
        line(cx+6+i*2,cy-4+i*3,cx+length-2,cy-12+i*3,i%2?"#30251e":"#bd925b");
      }
      ellipse(cx,cy,7,8,"#30251e"); ellipse(cx,cy-1,6,7,"#bd925b");
      ellipse(cx-1,cy-2,5,5,"#e3c18a"); ellipse(cx-1,cy-1,4,4,"#9b7548");
      ellipse(cx-1,cy-2,3,3,"#d1ac72"); ellipse(cx-1,cy-1,1,2,"#785333");
      line(cx+2,cy+1,cx+5,cy+4,"#785333"); put(cx-3,cy-5,"#f1dbad");
      ellipse(cx+length-1,cy-8,2,2,"#513b29"); put(cx+length-2,cy-9,"#bd925b");
    }
    log(20,28,25); log(16,46,32);
    // A chipped split end on the upper log.
    line(21,20,24,17,"#e3c18a"); line(23,18,27,18,"#9b7548");
  } else if (name === "charcoal") {
    polygon([[9,42],[13,33],[22,30],[30,35],[31,46],[25,53],[13,51]],"#171d23");
    polygon([[12,41],[16,35],[23,33],[28,37],[26,44],[17,46]],"#48545c");
    polygon([[12,41],[17,46],[25,45],[24,51],[14,49]],"#29343d");
    polygon([[22,22],[29,13],[40,12],[50,22],[53,37],[47,47],[32,50],[22,43],[18,32]],"#171d23");
    polygon([[23,23],[30,16],[39,15],[45,22],[35,28]],"#627079");
    polygon([[23,24],[35,29],[31,39],[22,42],[21,32]],"#3a4650");
    polygon([[36,29],[46,24],[50,36],[43,40],[32,40]],"#29343d");
    polygon([[31,41],[43,41],[47,37],[45,45],[33,47],[25,43]],"#202830");
    polygon([[29,17],[37,16],[42,20],[34,24]],"#7d8990");
    line(25,24,30,19,"#939d9f"); line(38,16,42,20,"#939d9f");
    line(24,27,28,30,"#627079"); line(24,32,27,34,"#48545c");
    line(37,27,39,31,"#171d23"); line(39,31,37,35,"#171d23");
    line(47,27,49,34,"#48545c");
    polygon([[46,46],[50,42],[55,45],[56,51],[51,54],[46,52]],"#171d23");
    polygon([[48,46],[51,44],[54,47],[50,49]],"#627079");
    polygon([[48,48],[51,50],[54,48],[54,51],[50,52]],"#29343d");
    put(12,55,"#3a4650"); put(15,56,"#29343d"); put(40,53,"#48545c");
  } else if (name === "stone") {
    // Reference-inspired pile of quarried rock: broad worn planes, split seams,
    // smaller overlapping chunks. Warm neutral granite follows the forest boulders.
    const edge="#454c45", deep="#5d6358", shade="#747c6b", mid="#929988";
    const face="#b0b5a2", light="#ccd0ba", lit="#e3e3ce", grain="#c0c5af";
    polygon([[11,30],[18,26],[25,29],[27,39],[21,46],[12,44],[8,37]],edge);
    polygon([[11,32],[17,29],[22,31],[23,36],[17,39],[10,36]],face);
    polygon([[11,37],[17,40],[22,37],[21,43],[13,42]],shade);
    polygon([[17,21],[23,14],[32,10],[42,12],[49,19],[51,32],[48,43],[39,49],[25,46],[17,37],[15,28]],edge);
    polygon([[18,23],[24,16],[32,12],[41,14],[47,20],[48,30],[42,34],[32,35],[21,31],[17,28]],face);
    polygon([[20,22],[25,17],[32,13],[40,15],[43,21],[38,26],[27,25]],light);
    polygon([[25,17],[32,13],[39,15],[36,19],[28,20]],lit);
    polygon([[17,29],[24,33],[31,35],[30,44],[24,44],[19,37]],shade);
    polygon([[32,35],[42,33],[48,28],[48,39],[43,44],[33,46]],mid);
    polygon([[42,33],[48,29],[47,39],[43,43],[41,40]],shade);
    polygon([[25,35],[28,36],[27,41],[23,39]],mid);
    // Deep crooked fractures interrupt the broad top plane rather than making a gem.
    line(34,14,32,20,shade); line(32,20,35,25,shade);
    line(22,26,28,27,deep); line(28,27,35,25,deep); line(35,25,43,27,deep);
    line(43,27,47,23,deep); line(35,26,33,32,shade); line(33,32,31,35,deep);
    line(23,25,28,25,lit); line(36,24,41,25,grain);
    polygon([[19,24],[21,21],[24,21],[22,24]],lit);
    polygon([[43,17],[46,21],[45,24],[42,20]],grain);
    line(20,30,23,32,mid); line(45,34,43,38,face);
    // Foreground chunks have separate outlines and unequal silhouettes.
    polygon([[22,37],[30,33],[37,36],[39,46],[35,55],[25,55],[19,49],[18,43]],edge);
    polygon([[22,39],[29,35],[35,38],[35,44],[27,47],[20,44]],light);
    polygon([[23,39],[29,36],[33,38],[29,41],[24,42]],lit);
    polygon([[20,45],[27,49],[27,53],[23,51],[20,48]],shade);
    polygon([[28,48],[36,43],[36,47],[33,53],[28,53]],mid);
    line(29,36,28,41,mid); line(28,41,31,45,shade);
    polygon([[40,39],[46,34],[52,36],[56,44],[53,51],[46,54],[40,50],[37,45]],edge);
    polygon([[40,41],[46,36],[51,38],[53,43],[46,46],[39,44]],face);
    polygon([[42,40],[46,37],[49,38],[47,41],[43,43]],light);
    polygon([[40,45],[46,48],[46,52],[41,49]],shade);
    polygon([[47,47],[53,44],[52,49],[48,51]],mid);
    line(49,40,47,44,shade);
    // A few subdued mineral flecks and edge chips, readable at pickup size.
    for(const [x,y] of [[26,22],[38,18],[40,30],[25,37],[33,49],[48,39]]) put(x,y,grain);
    put(27,22,light); put(38,19,face); put(33,50,face);
    polygon([[10,49],[13,47],[16,49],[15,53],[11,53]],edge);
    polygon([[11,49],[13,48],[15,50],[12,51]],face);
    polygon([[48,56],[51,54],[54,56],[53,58],[49,58]],deep);
    line(50,55,52,56,face);
  }
  plans.push({ name, pixels: [...pixels].map(([key,color])=>({x:key%size + plans.length*size,y:Math.floor(key/size),color})) });
}
await mkdir(".runtime/items", { recursive: true });
await writeFile(".runtime/items/pixel-plan.json", JSON.stringify(plans));
console.log(plans.map(p=>`${p.name}: ${p.pixels.length} pixels`).join("\n"));
