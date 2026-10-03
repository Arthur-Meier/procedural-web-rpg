# Item spritesheet

The five loot materials share `loot-items.png` and the editable `loot-items.aseprite`. The sheet is 320 x 64 pixels, five 64 x 64 cells in one row. No individual PNG is required by the game or inventory.

| Column | ID | Artwork | World cell size |
| --- | --- | --- | --- |
| 0 | slimeGoo | Cyan gel with a liquid silhouette, bubbles and white reflections matching the blue slime | 40 x 40 |
| 1 | gold | Thick gold coin with engraved lozenge, raised rim and upper-left highlight | 36 x 36 |
| 2 | wood | Two sloping logs with bark ridges, knots and end grain | 44 x 44 |
| 3 | charcoal | Dark fractured charcoal with cool facets and small fragments | 40 x 40 |
| 4 | stone | Warm neutral granite pile with broad worn planes, deep fractures and overlapping smaller chunks | 44 x 44 |

Every cell has a center pivot `(32, 32)`, transparent padding and binary alpha. The shared palette contains 42 opaque colors; no antialiasing or partial alpha is used. Aseprite layers and slices retain the item IDs. `loot-items.json` records cell coordinates, sizes and pivot.

On 2026-10-02, authored pixel plans from [prepare-item-assets.mjs](../../scripts/prepare-item-assets.mjs) were drawn, organized into layers/slices, assigned the palette and exported using the Aseprite MCP. That script prepares instructions in `.runtime/items/pixel-plan.json`; it does not export images or recreate the Aseprite file by itself. Subsequent art edits should keep the exported PNG, metadata and source consistent.

The stone revision on 2026-10-02 follows the rock piles attached by the user in chat: grouped irregular chunks, rounded broken edges, readable top planes and pronounced seams. Warm neutral gray/cream highlights, muted olive-gray shadows and upper-left lighting adapt that volume to the existing forest boulders. The four earlier cells were copied from the actual editable source through MCP and confirmed unchanged pixel-for-pixel; stone was added in column 4 with its own layer and slice.

[ItemSpriteRenderer](../../src/game/render/item-sprites.ts) uses nearest-neighbor sampling and the existing vertical bob. Contact shadows stay on the ground. Loading/failed dimensions return to the existing procedural drawings; the slime gel fallback is cyan. All five items, including stone, now use the sheet in normal rendering. Drop rates, material selection, quantities, pickup radii and saved IDs are unchanged.

Inventory material tokens reuse this same sheet in [styles.css](../../styles.css), with a background sized to 500% x 100% and positions 0%, 25%, 50%, 75% and 100%. Stone uses the fifth cell in `.token-stone`. Weapon icons retain their current artwork. The gold cell is available as `.token-gold`; the existing gold counter remains text.

Validate with `node scripts/validate-item-sprites.mjs` (existing Playwright module and Chromium may be passed through `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`). Evidence is written to `output/item-validation/`. The browser fixture blocks storage writes, uses actual rendering classes and checks loading/error/dimension fallback, cell mapping, bobbing, shadows and inventory CSS. It does not establish save compatibility, drop probabilities or a gameplay benchmark.
