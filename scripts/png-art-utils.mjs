import fs from "node:fs";
import zlib from "node:zlib";

// Read pixel data for inspection and for plans consumed by the Aseprite MCP.
// This module never writes an image.
export function readPng(filename) {
  const png = fs.readFileSync(filename);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const depth = png[24], type = png[25];
  if (depth !== 8 || ![2, 3, 6].includes(type) || png[28] !== 0) throw new Error("Expected non-interlaced 8-bit RGB, RGBA or indexed PNG");
  const chunks = [];
  let palette = null, transparency = null;
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const name = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (name === "IDAT") chunks.push(data);
    if (name === "PLTE") palette = data;
    if (name === "tRNS") transparency = data;
    offset += 12 + length;
  }
  const channels = type === 6 ? 4 : type === 2 ? 3 : 1;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const decoded = Buffer.alloc(stride * height);
  const pixels = Buffer.alloc(width * height * 4);
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const a = x >= channels ? decoded[i - channels] : 0;
      const b = y ? decoded[i - stride] : 0;
      const c = y && x >= channels ? decoded[i - stride - channels] : 0;
      const prediction = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      if (prediction === undefined) throw new Error("Invalid PNG filter");
      decoded[i] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255;
    }
  }
  for (let i = 0; i < width * height; i++) {
    const at = i * 4, source = i * channels;
    if (type === 3) {
      const index = decoded[source];
      if (!palette) throw new Error("Indexed PNG without palette");
      pixels[at] = palette[index * 3]; pixels[at + 1] = palette[index * 3 + 1]; pixels[at + 2] = palette[index * 3 + 2];
      pixels[at + 3] = transparency?.[index] ?? 255;
    } else {
      pixels[at] = decoded[source]; pixels[at + 1] = decoded[source + 1]; pixels[at + 2] = decoded[source + 2];
      pixels[at + 3] = type === 6 ? decoded[source + 3] : 255;
    }
  }
  return { width, height, pixels };
}

export function alphaStats(image) {
  let transparent = 0, translucent = 0, opaque = 0;
  const colors = new Set();
  for (let i = 0; i < image.pixels.length; i += 4) {
    const alpha = image.pixels[i + 3];
    if (alpha === 0) transparent++;
    else if (alpha === 255) opaque++;
    else translucent++;
    if (alpha) colors.add(image.pixels.readUIntBE(i, 3));
  }
  return { width: image.width, height: image.height, transparent, translucent, opaque, colors: colors.size };
}
