import { mkdir, writeFile } from "node:fs/promises";

// Pixel instructions for Aseprite MCP; does not create or overwrite the exported artwork.
const colors = { o: "#343b30", g: "#b49962", h: "#e8d9ab", b: "#796444", c: "#83b8be", r: "#bc756b" };
const glyphs = {
  crest: [".......h........", "......hgh.......", ".....hgogh......", "....hggoogh.....", "...hggogoggh....", "..hggogogoggh...", ".hggogogogoggh..", "hggogogogogoggh.", ".hggogogogoggh..", "..hggogogoggh...", "...hggogoggh....", "....hggoogh.....", ".....hgogh......", "......hgh.......", ".......h........"],
  heart: ["................", "..ooo.....ooo...", ".ohhro...ohhro..", "ohhrrro.ohhrrro.", "ohrrrrroorrrrro.", "orrrrrrrrrrrrro.", ".orrrrrrrrrrro..", "..orrrrrrrrro...", "...orrrrrrro....", "....orrrrro.....", ".....orrro......", "......oro.......", ".......o........"],
  coin: ["................", ".....oooooo.....", "...oohhhhgoo....", "..ohgggggggbo...", ".ohgggoooggbo...", ".ohggohgoggbo...", ".ohggohgoggbo...", ".ohggohgoggbo...", ".ohggohgoggbo...", ".ohgggoooggbo...", "..obggggggbo....", "...oobbbboo.....", ".....oooooo....."],
  sun: [".......g........", "...g...h...g....", "....h.....h.....", "......ooo.......", ".....ohhgo......", "....ohggggo.....", "gh..ohggggo..hg.", "....ogggggo.....", ".....ogggo......", "......ooo.......", "....h.....h.....", "...g...h...g....", ".......g........"],
  sword: ["............oo..", "...........oho..", "..........ohho..", ".........ohho...", "........ohho....", ".......ohho.....", "......ohho......", ".....ohho.......", "..g.ohho........", "..hgggo.........", "...ghhg.........", "..og..gg........", ".obo...h........", ".oo............."],
  staff: ["..........ooo...", ".........ohcco..", ".........occco..", ".........occbo..", "..........ogo...", ".........ogo....", "........ogo.....", ".......ogo......", "......ogo.......", ".....ogo........", "....ogo.........", "...ogo..........", "..ogo...........", "..oo............"],
  bag: ["......oooo......", ".....ohggho.....", ".....ogbbgo.....", "...oooggggooo...", "..ohhgggggggbo..", "..ohggggggggbo..", "..oggggohgggbo..", "..obgggohgggbo..", "..obgggoogg gbo..".replaceAll(" ", ""), "..obggggggggbo..", "..obbbbbbbbbbo..", "...oooooooooo..."],
  map: ["................", ".oooo..oooo.....", ".ohhhoohhhhoo...", ".ohhhghhhhhho...", ".ohhhghbbhhho...", ".ohhhghhbhhho...", ".ohbbghhbhhho...", ".ohhhghhbhhho...", ".ohhhghbbhhho...", ".ohhhghhhhhho...", ".ohhhoohhhhho...", ".oooo..oooooo..."],
  stats: ["................", "..........hh....", "..........gg....", "..........gg....", "......hh..gg....", "......gg..gg....", "......gg..gg....", "..hh..gg..gg....", "..gg..gg..gg....", "..gg..gg..gg....", "..gg..gg..gg....", ".ooooooooooooo.."],
  pause: ["................", "...hhh...hhh....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...ggg...ggg....", "...bbb...bbb...."]
};
const frames = {}, plans = [];
for (const [index, [name, rows]] of Object.entries(glyphs).entries()) {
  const pixels = [];
  for (const [y, row] of rows.entries()) for (let x = 0; x < row.length; x++) {
    if (colors[row[x]]) pixels.push({ x: index * 24 + x + 4, y: y + 4, color: colors[row[x]] });
  }
  plans.push({ name, pixels });
  frames[name] = { frame: { x: index * 24, y: 0, w: 24, h: 24 }, pivot: { x: 12, y: 12 } };
}
await mkdir("output/ui-preparation", { recursive: true });
await writeFile("output/ui-preparation/pixel-plans.json", JSON.stringify(plans));
await writeFile("output/ui-preparation/ui-icons.json", JSON.stringify({ image: "ui-icons.png", width: 240, height: 24, frames, palette: Object.values(colors), sampling: "nearest-neighbor" }, null, 2) + "\n");
console.log("Prepared 10 UI glyphs for Aseprite MCP.");
