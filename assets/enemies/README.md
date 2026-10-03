# Blue Slime

The [evil red mage](RED_MAGE.md) also uses an editable Aseprite timeline, a PNG spritesheet and animation metadata. Its dedicated contract documents the reference, palette, frame banks and validation.

Reference: `Img referencias/Folha de Sprites do Slime Azul.png`.

The supplied reference was sampled at one pixel per three reference pixels, with the gray presentation background and baked shadow removed. Colors were mapped to a 14-entry blue/cyan palette (13 colors occur in the exported image). `scripts/prepare-slime-assets.mjs` produces pixel instructions; the Aseprite MCP drew those pixels, set the palette, animation tags and durations, and exported the editable source, PNG, JSON and GIF previews. No image-generation tool was used for this asset.

## Runtime contract

- `blue-slime.png`: transparent horizontal sheet, 2080 x 64 pixels, 26 cells of 80 x 64.
- Ground anchor: (40, 54) in every cell; all silhouettes have transparent margins.
- Body artwork is roughly 42 pixels wide at rest. Runtime scales it in proportion to the existing enemy radius and uses nearest-neighbor sampling.
- Shadows, health bars, depth sorting and combat logic remain in the existing renderer/systems.
- Invalid dimensions, pending loads and failed loads use the blue procedural fallback.

| Frames (zero based) | Tag | Duration | Runtime use |
| --- | --- | --- | --- |
| 0–3 | idle | 150 ms | Breathing and wobble at rest, staggered by enemy ID. |
| 4–7 | move-down | 100 ms | Downward dash, synchronized to existing dash progress. |
| 8–11 | move-left | 100 ms | Editable reference poses; retained in the sheet. |
| 12–15 | move-up | 100 ms | Upward dash, synchronized to existing dash progress. |
| 16–21 | attack | 65 ms | Horizontal dash, mirrored for leftward movement; playback follows the existing dash duration. |
| 22–25 | hurt-defeat | 100 ms | First two frames react to the existing hurt timer. The final two defeat poses are retained for editing and are not played by the current death-effects system. |

`blue-slime.aseprite` is an 80 x 64 timeline with 26 frames and six tags. `blue-slime.json` is the Aseprite export metadata. `previews/idle.gif` and `previews/attack.gif` show the tagged loops at 3x scale. The game consumes only the PNG; animation selection is defined in `src/game/render/slime-sprite.ts`.

## Validation

```powershell
node scripts/prepare-slime-assets.mjs
node scripts/validate-slime-sprite.mjs http://localhost:4174
```

The first command writes only a pixel plan under `.runtime/slime/`; images are created through Aseprite MCP. The second inspects the PNG and metadata and checks the real `EntityLayer`/`WorldRenderer` in a browser, including directional dash, hurt/recovery, transparency, loading failure and attempted storage writes. It supports `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` for existing installations. Evidence is written under `output/slime-validation/`, outside the versioned assets. Browser fixtures are in memory and do not save a session.
