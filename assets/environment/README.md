# Environment sprite standard

The scenery uses the fantasy pixel-art style established by the Blue Orb Knight, with detailed props over moderately textured green terrain. Each requested asset has a separate PNG sprite and an editable Aseprite source. The game uses the combined atlas to load props efficiently and repeating PNG tiles for the ground.

The original scenery art was generated from the character references with the image-generation tool, normalized into pixel plans, then drawn and exported with the Aseprite MCP. Exact prompts are retained in `prompts/environment-sprites.txt`; original generated images are retained as `*-generated.png`. The corrected 2026-10-03 grass samples a smaller original region directly, preserving sharp blade shapes rather than averaging them. Dirt retains its averaged clusters. The preparation script writes pixel instructions; Aseprite MCP draws/exports the game artwork. Reference images remain intact.

## Assets

| Asset | Individual PNG | Editable source | Atlas cell (row, column) |
| --- | --- | --- | --- |
| Oak tree | `sprites/oak-tree.png` | `sprites/oak-tree.aseprite` | 0, 0 |
| Pine tree | `sprites/pine-tree.png` | `sprites/pine-tree.aseprite` | 0, 1 |
| Birch tree | `sprites/birch-tree.png` | `sprites/birch-tree.aseprite` | 0, 2 |
| Gray boulder | `sprites/gray-rock.png` | `sprites/gray-rock.aseprite` | 1, 0 |
| Moss-covered boulder | `sprites/moss-rock.png` | `sprites/moss-rock.aseprite` | 1, 1 |
| Wooden crate | `sprites/wood-crate.png` | `sprites/wood-crate.aseprite` | 1, 2 |
| Timber cottage | `sprites/timber-house.png` | `sprites/timber-house.aseprite` | 2, 0 |
| Weathered crate | `sprites/weathered-crate.png` | `sprites/weathered-crate.aseprite` | 2, 1 |
| Stone cottage | `sprites/stone-house.png` | `sprites/stone-house.aseprite` | 2, 2 |
| Grass ground | `sprites/grass-ground.png` | `grass-ground.aseprite` | Separate repeating tile |
| Dirt ground | `sprites/dirt-ground.png` | `dirt-ground.aseprite` | Separate repeating tile |

## Drawing contract

- `forest-props.png`: 768 x 768 pixels, three columns and three rows of 256 x 256 cells. Ground contact anchor: (128, 224).
- `forest-props.aseprite`: editable source of the same atlas. `forest-props.json`: asset names, individual files, rectangles, anchors and the 64-color environment palette.
- Props use binary transparency, have padding around their silhouettes and contain no baked ground shadow. Renderer contact shadows remain separate.
- `grass-ground.png` and `dirt-ground.png`: opaque 128 x 128 repeating tiles, opposite edge pixels match. Individual copies also live in `sprites/`.
- All sprite drawing disables image smoothing. Trees are taller than the player; rock/crate scaling and house foundation remain tied to their existing world positions.
- Each object chooses its variant and scale deterministically from its ID and the world seed. The existing house chooses between the two cottage sprites; this art change does not create additional world structures.
- Rendering order follows ground contact, so actors can pass in front of or behind tree canopies. Gameplay positions, collisions, damage and resource drops retain their existing behavior.
- Grass is continuous rather than a checkerboard of differently colored rectangles. Small cached tonal overlays and the worn dirt trail add organic variation while the material artwork comes from the PNG tiles.
- Image loading happens once per renderer; terrain patterns are cached by canvas context, and detail caches are bounded. Missing images retain a procedural fallback.

When editing a prop, export its standalone PNG and update the corresponding atlas cell together. Preserve its frame size, anchor and transparency. Run the asset inspector after re-exporting.

## Quiet green terrain

- After the averaged grass was judged blurry, the revised tile directly samples a central 384 x 384 region of `grass-ground-generated.png` into 128 x 128 sharp pixels. This keeps recognizable curved blades/tufts, remapped to twelve greens, without averaging or synthetic hatch marks. Only one seam row/column is joined. Dirt retains four-sample averages, two-pixel clusters, eight earth colors and 40 worn accents. Material palettes remain independent of the 64-color prop atlas palette.
- `scripts/prepare-terrain-assets.mjs` regenerates compact pixel instructions in `output/terrain-preparation/`; it never overwrites exported artwork. Aseprite MCP creates the named material layer, draws the pixels, sets the palette and exports each opaque 128 x 128 tile. Opposite edges and standalone copies remain identical.
- The renderer uses three gentle green overlay patches per world cell; the fallback draws 180 tufts with three curved blades and contact shadows, or 256 dirt clusters. Material/context caches, the 48-cell bound, seed handling and entrance-trail geometry are preserved.
- `node scripts/validate-terrain-art.mjs http://localhost:4174 output/terrain-crisp/art` checks source/export equality, opacity, seams, copies, limited palettes, intermediate pixel-neighbor contrast, live rendering/cache/state preservation and missing/wrong-size fallback. Grass contrast must exceed the rejected simplified revision while remaining below heavy noise (4–12); dirt uses a 1–6 range. An optional fourth argument points to the original detailed PNGs for a measured comparison and paired scene captures. Those captures use identical fixture placement and the current renderer for both materials, isolating the tile revision; they do not reconstruct the historical renderer. Contrast checks alone do not establish recognizable grass or artistic approval: inspect the tile and actual-scale world captures.

## Wind animation

- `tree-wind.aseprite`, `tree-wind.png` and `tree-wind.json`: 24 frames, three banks (oak, pine, birch), eight 256 x 256 poses per bank, 220 ms per frame. Horizontal sheet: 6144 x 256. Tags: `oak-wind`, `pine-wind`, `birch-wind`.
- The animation bends the existing artwork by up to five source pixels near the canopy. Rows from 205 down, including the roots and (128, 224) ground anchor, remain identical. The first pose of each bank matches its original standalone PNG. Static sprites and the original atlas remain available for loading/error fallback.
- `wind-leaves.aseprite`, `wind-leaves.png` and `wind-leaves.json`: 12 frames in 16 x 16 cells, horizontal sheet 192 x 16, 160 ms per pose. Three four-pose banks (`green-flutter`, `gold-flutter`, `copper-flutter`) show outlined leaf silhouettes with stems/highlights and narrow tumble poses. Both sheets use binary transparency and nearest-neighbor drawing.
- `scripts/prepare-wind-assets.mjs` prepares anchored tree frames and leaf pixel plans in `output/wind-preparation/`. Actual timeline creation/import, leaf drawing, tags, durations, palettes and game exports were performed through Aseprite MCP. The script does not overwrite the game exports or original tree artwork.
- The renderer uses the existing visual timestamp, spatial phase differences and a pulsing breeze. Leaves drift right, descend, flutter/rotate and fade in/out from tree canopies; their origin remains in world coordinates as the camera moves. At most 48 visible leaves are drawn, with two trajectories per visible tree and viewport culling. They do not enter gameplay particle arrays or snapshots. Trees retain their contact shadows and depth order. No new clock, simulation system or save field is introduced.
- Missing/invalid animated sheets use static tree art and procedural leaf silhouettes. `tree-wind-preview.gif` and `wind-leaves-preview.gif` are editable-animation previews.

Validate assets and real rendering with `node scripts/validate-wind.mjs http://localhost:4174`. Evidence goes to `output/wind-validation/`; this inspection fixture does not start a session or write storage. The existing environment regression also checks the animated tree atlas and ordering around the player.

## Validation

```powershell
node scripts/inspect-environment-assets.mjs assets/environment output/environment-validation/art/final-assets.json
npm.cmd run build
node scripts/validate-environment-art.mjs http://localhost:4174
```

The browser validation requires Playwright; an existing installation can be selected with `PLAYWRIGHT_MODULE`. It checks actual rendering, movement across chunks, depth, damaged/destroyed props in an isolated in-memory fixture, and loading failure. It never saves or clears browser storage. Screenshots and results live in `output/environment-validation/`.
