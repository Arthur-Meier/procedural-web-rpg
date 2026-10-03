# ART DIRECTION

## Current Visual Style

- The game uses detailed fantasy pixel art for the main character, blue slimes, red mages, loot, grass, dirt, trees, boulders, crates and cottages. Other entities, lighting and effects use Canvas 2D rendering.
- Character artwork lives in `assets/characters/`; scenery artwork lives in `assets/environment/`. Both include PNG exports and editable Aseprite sources, and every scenery asset also has its own sprite file.
- Enemy artwork lives in `assets/enemies/`. The blue slime follows `Img referencias/Folha de Sprites do Slime Azul.png`: dark pixel outline, a translucent-looking cyan body, white reflections and small expressive eyes. Exported pixels have binary transparency.
- The red mage follows `Img referencias/Ficha de Referência do Mago Vermelho Maligno.png`: pointed crimson hood, ragged layered robes, dark skeletal face with red eyes, brass fittings and a red-gem staff. A 25-color pixel palette, binary alpha and nearest-neighbor rendering keep it consistent with the player and forest assets.
- Loot artwork lives in `assets/items/`: cyan slime gel, a gold coin, bark-covered logs, fractured charcoal and a granite pile share a single five-cell spritesheet and editable Aseprite source, with binary transparency and a 42-color palette.
- Terrain balances readable character silhouettes with visible ground detail: distinct grass blades and tufts, shaded green clusters, and textured earth along the entrance trail. Preserve blade shapes with sharp pixel sampling of the retained artwork and a coherent green palette. Avoid averaged, blurry grass, a nearly smooth floor, overwhelming yellow highlights and uniform hatch marks.
- Structure and prop colors lean toward warm browns, golds, and muted beige tones.
- Fire effects use warm orange and red gradients, while water effects use cyan and blue gradients.

## Character And Object Rendering

- The player uses `blue-orb-knight.png`, based on `Img referencias/Cavaleiro Mago do Orbe Azul.png`: blue hood and cloak, gold trim, cream scarf, silver armor, burgundy tabard, sword, and a staff with a bright blue orb.
- The player sheet contains eight directions, one standing pose and six walking frames per direction, in 96 x 96 cells. Rendering uses nearest-neighbor sampling; the ground shadow and combat effects remain procedural.
- Scenery uses the 768 x 768 `forest-props.png` atlas: three tree variants, two boulders, two crates and two cottages in 256 x 256 cells. Natural silhouettes, bark, leaf clusters, fractured stone, weathered planks, masonry and roof tiles replace the earlier simple shapes.
- The ground uses opaque 128 x 128 grass and dirt tiles with matching opposite edges. The corrected 2026-10-03 grass directly samples a central 384 x 384 region of its original reference without averaging, keeping blade shapes large enough to read. Twelve greens define highlights and shadows; a single edge row/column joins the repeat. Dirt retains its eight-color two-pixel clusters and 40 worn accents. Editable sources and PNGs were drawn/exported through Aseprite MCP. World overlays stay soft; the entrance trail retains its current placement.
- Actors and scenery are drawn in order of ground contact, allowing the player and enemies to pass in front of or behind props.
- Slimes use a 26-frame Aseprite sheet with breathing, directional dash and hurt poses. Horizontal dashes stretch into the reference attack silhouette; vertical dashes use the up/down poses. The last two defeat poses remain available in the editable source; existing death effects continue to handle removal.
- Mages use `red-mage.png`, a 30-frame 3840 x 128 sheet with 128 x 128 cells and anchor `(64, 116)`. Front/side/back banks include breathing, robe/step movement, casting and hurt; left mirrors the side view. Casting follows the matching active spell, while movement is observed by the renderer without changing enemy state. Shadows and depth remain grounded, and health bars clear the taller hood/staff.
- Loot uses the shared 320 x 64 `loot-items.png` sheet with 64 x 64 cells, nearest-neighbor sampling and grounded contact shadows under the existing bob. Stone follows the user's attached rock-pile reference: uneven overlapping chunks, broad broken planes, deep seams and warm neutral gray highlights matching forest boulders. NPCs retain their existing rendering. Procedural character/scenery/enemy/loot drawings remain available during image loading or failure; slime gel is cyan and mage robes are crimson in both paths.
- Combat and progression feedback use glow-heavy particles, radial gradients, and short-lived screen-space accents.

## UI Visual Direction

- UI headings retain the serif stack `"Palatino Linotype"`, `"Book Antiqua"`, and `Georgia`; data, labels and actions use `"Segoe UI"` / system sans-serif for quick scanning. Fonts are local to the operating system.
- Keep the UI restrained: forest surface `#17211c`, parchment text `#ede8d7`, muted sage `#a9b5ab` and brass accent `#c9af78`. Health uses a muted rose as a semantic state color. Prefer flat fills, thin borders, small corner radii and row separators over repeated gradient cards, heavy shadows or blur.
- The title is an unboxed composition with generous space and the existing forest/knight artwork. Gameplay HUD stays compact in the corners; repeated control paragraphs, enemy-count debug information and the full inventory strip are removed from the persistent HUD. Full inventory, stats, map, quests and saves remain in their overlays, with detailed controls available in pause.
- Small brass pixel glyphs come from `assets/ui/ui-icons.{png,json,aseprite}`, created and exported through Aseprite MCP. Glyphs support readable text rather than replacing essential labels. The inventory portrait uses the actual Blue Orb Knight artwork.
- Keep short entry and button/focus transitions; title trees may sway gently. Honor reduced-motion preferences. Adapt HUD/navigation and overlay grids at narrow widths, retain vertical scrolling, visible focus and practical click targets.
- Inventory material tokens `.token-wood`, `.token-charcoal`, `.token-slimeGoo` and `.token-stone` reuse the loot spritesheet with pixelated sampling; `.token-gold` exposes the coin cell. Weapon tokens retain their CSS artwork.

## Lighting And Atmosphere

- Oak, pine and birch canopies sway in eight pixel-art poses with grounded roots and fixed contact shadows. Small green, gold and copper leaf sprites flutter, rotate and descend in a pulsing breeze. Spatial offsets keep neighboring trees from moving in exact unison; the effect stays restrained and uses a maximum of 48 visible leaves.
- The scene uses soft vignette and sunlight overlays in `HudFxLayer`.
- World objects and characters consistently render with drop shadows underneath.
- UI surfaces use a subtle separation shadow; the world artwork supplies the scene's visual richness.
