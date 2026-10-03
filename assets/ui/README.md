# Fantasy UI glyphs

The interface uses quiet forest surfaces, parchment text and a restrained brass accent. Small pixel glyphs connect the menus to the game's detailed fantasy art without ornamental frames around every element.

## Atlas contract

- `ui-icons.png`: 240 × 24, ten horizontal 24 × 24 cells, binary transparency, six visible colors, nearest-neighbor sampling.
- `ui-icons.aseprite`: editable single-frame source, ten named layers and slices with central pivots `(12, 12)`.
- `ui-icons.json`: cell rectangles, pivots and palette. Cell order: crest, heart, coin, sun, sword, staff, bag, map, stats, pause.
- Aseprite MCP created the source, drew the prepared pixels, set the palette, created slices/pivots and exported the actual game PNG. `scripts/prepare-ui-assets.mjs` regenerates pixel instructions and metadata in `output/ui-preparation/`; it does not overwrite exported artwork.
- `.ui-glyph` in `styles.css` maps each CSS glyph to its atlas cell. Crest/coin/sun, weapons, bag/map/stats/pause are used in the title, HUD and inventory. The heart remains available for later UI artwork; health uses a labeled bar.
- Labels and actions remain usable if the glyph image fails. Glyph spans are decorative (`aria-hidden`); navigation buttons retain text, titles and keyboard hints. No remote fonts or image services are required at runtime.

## Layout

- The title uses an unboxed composition with the existing tree/player artwork. Serif headings and clean sans-serif data use only system fonts.
- Gameplay keeps health/XP/level in the upper left, gold/day/context in the upper right, compact combat/equipment hints in the lower left and four navigation actions in the lower right. The complete inventory lives in its overlay rather than occupying the world viewport.
- Overlays hide the gameplay HUD, use flat dark surfaces and simple separators, and retain the current menu actions. Inventory uses the actual knight sprite, equipment cells, the existing nine-cell workbench/output and all ten inventory slots. The workbench remains the existing presentation; this redesign does not implement crafting interactions.
- At narrow widths the navigation moves to the bottom row, inventory/storage columns adapt and panels scroll vertically. Short panel/button transitions and gentle title-tree motion honor `prefers-reduced-motion`.

## Validation

Run `node scripts/validate-ui-layout.mjs http://localhost:4174` after building. It requires Playwright and supports `PLAYWRIGHT_MODULE` / `CHROMIUM_EXECUTABLE` for an existing installation. Tests inspect editable pixels/slices and actual UI at desktop, tablet, narrow portrait and landscape sizes. Screenshots/results live in `output/ui-validation/browser/`. Save/load lists are inspected; no save, delete or storage write is executed.
