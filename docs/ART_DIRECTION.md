# ART DIRECTION

## Current Visual Style

- The game currently uses a stylized 2D fantasy look built entirely from Canvas 2D primitives, gradients, shadows, and simple shapes.
- The project currently has no external sprite sheet, texture atlas, or dedicated asset folder for world art.
- Terrain colors are dominated by dark greens with lighter grass, dirt patches, flowers, and stone accents.
- Structure and prop colors lean toward warm browns, golds, and muted beige tones.
- Fire effects use warm orange and red gradients, while water effects use cyan and blue gradients.

## Character And Object Rendering

- The player, NPC, enemies, breakables, and drops are drawn procedurally in code.
- Characters use rounded silhouettes, soft shadows, and gradient-filled clothing or body shapes rather than pixel-art tiles.
- Breakables and drops use hand-built shape compositions with highlight and shadow passes.
- Combat and progression feedback use glow-heavy particles, radial gradients, and short-lived screen-space accents.

## UI Visual Direction

- UI typography currently uses a serif stack: `"Palatino Linotype"`, `"Book Antiqua"`, and `Georgia`.
- Panels use rounded corners, translucent dark backgrounds, blur, and warm gold or cream text.
- The current UI palette combines deep greens, dark brown-black backgrounds, and warm accent oranges for primary buttons.
- Inventory icons are represented through CSS token classes such as `.token-wood`, `.token-stone`, and `.token-slimeStaff` instead of external images.

## Lighting And Atmosphere

- The scene uses soft vignette and sunlight overlays in `HudFxLayer`.
- World objects and characters consistently render with drop shadows underneath.
- UI and HUD elements use layered shadows and inset highlights to create depth.
