import { createSeededRandom } from "../utils.js";

export type TerrainMaterial = "grass" | "dirt";

interface TextureState {
  image: HTMLImageElement | null;
  loaded: boolean;
  fallback: HTMLCanvasElement | null;
  patterns: WeakMap<CanvasRenderingContext2D, CanvasPattern>;
}

const TEXTURE_SIZE = 128;

/** Images load once; each canvas context keeps its own repeating material. */
export class TerrainTextures {
  private readonly materials: Record<TerrainMaterial, TextureState>;
  private revision = 0;

  constructor() {
    this.materials = {
      grass: this.loadMaterial("grass-ground"),
      dirt: this.loadMaterial("dirt-ground")
    };
  }

  get version(): number {
    return this.revision;
  }

  getPattern(ctx: CanvasRenderingContext2D, material: TerrainMaterial): CanvasPattern | null {
    const texture = this.materials[material];
    const cached = texture.patterns.get(ctx);
    if (cached) {
      return cached;
    }

    if (!texture.loaded && !texture.fallback) {
      texture.fallback = this.createFallback(material);
    }
    const source = texture.loaded ? texture.image : texture.fallback;
    const pattern = source ? ctx.createPattern(source, "repeat") : null;
    if (pattern) {
      texture.patterns.set(ctx, pattern);
    }
    return pattern;
  }

  private loadMaterial(name: string): TextureState {
    const image = typeof Image === "undefined" ? null : new Image();
    const texture: TextureState = {
      image,
      loaded: false,
      fallback: null,
      patterns: new WeakMap()
    };
    if (image) {
      image.onload = () => {
        if (image.naturalWidth !== TEXTURE_SIZE || image.naturalHeight !== TEXTURE_SIZE) {
          return;
        }
        texture.loaded = true;
        texture.patterns = new WeakMap();
        this.revision += 1;
      };
      image.onerror = () => { texture.loaded = false; };
      image.src = `/assets/environment/${name}.png`;
    }
    return texture;
  }

  private createFallback(material: TerrainMaterial): HTMLCanvasElement | null {
    if (typeof document === "undefined") {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const random = createSeededRandom(material === "grass" ? 74181 : 92017);
    const colors = material === "grass"
      ? ["#2d4e2c", "#345733", "#3a6038", "#40683d", "#466f42", "#4c7647", "#537d4c", "#5a8452", "#628b57", "#6a925c", "#739963", "#7b9e68"]
      : ["#665237", "#715b3e", "#7c6445", "#876d4c", "#927653", "#9d805b", "#a78a63", "#b0946c"];
    ctx.fillStyle = colors[material === "grass" ? 5 : 3];
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    const markCount = material === "grass" ? 180 : 256;
    for (let index = 0; index < markCount; index += 1) {
      const x = Math.floor(random() * TEXTURE_SIZE);
      const y = Math.floor(random() * TEXTURE_SIZE);
      const width = 2 + Math.floor(random() * 2);
      const height = 2 + Math.floor(random() * 2);
      const markColor = colors[1 + Math.floor(random() * (colors.length - 2))];
      // Wrap edge marks so even the fallback repeats without tile borders.
      for (const offsetX of [0, -TEXTURE_SIZE]) {
        for (const offsetY of [0, -TEXTURE_SIZE]) {
          const px = x + offsetX, py = y + offsetY;
          if (material === "grass") {
            ctx.fillStyle = colors[2];
            ctx.fillRect(px, py + 5, 7, 1);
            ctx.fillStyle = markColor;
            ctx.fillRect(px + 2, py + 2, 1, 3);
            ctx.fillRect(px + 1, py + 1, 1, 2);
            ctx.fillRect(px + 4, py + 1, 1, 4);
            ctx.fillRect(px + 5, py, 1, 2);
            ctx.fillStyle = colors[7];
            ctx.fillRect(px + 5, py + 3, 1, 2);
            ctx.fillRect(px + 6, py + 2, 1, 2);
          } else {
            ctx.fillStyle = markColor;
            ctx.fillRect(px, py, width, height);
          }
        }
      }
    }
    return canvas;
  }
}
