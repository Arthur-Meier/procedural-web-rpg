import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Probe the real compiled loaders' outgoing image URLs. This checks HTTP paths,
// not browser decoding, Canvas drawing, animation or gameplay.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const loaders = [
  ["environment-sprites", "EnvironmentSpriteRenderer"],
  ["item-sprites", "ItemSpriteRenderer"],
  ["player-sprite", "PlayerSpriteRenderer"],
  ["mage-sprite", "MageSpriteRenderer"],
  ["slime-sprite", "SlimeSpriteRenderer"],
  ["terrain-textures", "TerrainTextures"],
  ["wind-leaves", "WindLeavesLayer"]
];
const classes = await Promise.all(loaders.map(async ([module, name]) => {
  const exports = await import(pathToFileURL(path.join(root, "dist/src/game/render", `${module}.js`)).href);
  return exports[name];
}));
const css = await readFile(path.join(root, "styles.css"), "utf8");
const html = await readFile(path.join(root, "index.html"), "utf8");
const cssUrls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1]);
const htmlImages = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
const previousImage = globalThis.Image;
const failures = [];
let checks = 0;

try {
  for (const prefix of ["/", "/procedural-web-rpg/"]) {
    const imageUrls = [];
    globalThis.Image = class ImageRequestProbe {
      set src(value) { imageUrls.push(String(value)); }
    };
    for (const Renderer of classes) new Renderer({}, { width: 1280, height: 800 });
    assert.equal(imageUrls.length, 9, "All nine sprite/terrain loaders must be exercised");

    // Only this mount is served: a root-absolute URL must fail in the subpath case.
    const server = createServer(async (request, response) => {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
      try {
        const relative = decodeURIComponent(pathname.slice(prefix.length));
        const filename = path.resolve(root, relative);
        if (!filename.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
        const bytes = await readFile(filename);
        response.writeHead(200).end(bytes);
      } catch { response.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const base = `http://127.0.0.1:${server.address().port}${prefix}`;
      for (const source of [...imageUrls, ...cssUrls, ...htmlImages]) {
        const url = new URL(source, base);
        const response = await fetch(url);
        checks++;
        if (response.status !== 200) {
          failures.push(`${prefix}: ${url.pathname} returned ${response.status}`);
          await response.arrayBuffer();
          continue;
        }
        const relative = decodeURIComponent(url.pathname.slice(prefix.length));
        const expected = await readFile(path.join(root, relative));
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected, `Asset bytes: ${url.pathname}`);
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  }
} finally {
  if (previousImage === undefined) delete globalThis.Image;
  else globalThis.Image = previousImage;
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log(`${checks} asset HTTP checks passed at / and /procedural-web-rpg/; file bytes match the repository.`);
