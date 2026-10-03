# Evil red mage

Reference: [Ficha de Referência do Mago Vermelho Maligno.png](../../Img%20referencias/Ficha%20de%20Refer%C3%AAncia%20do%20Mago%20Vermelho%20Maligno.png).

The supplied reference defines a pointed crimson hood, torn layered robes, a shadowed skeletal face with red eyes, brass clasps/chains, a belt and a staff with a red gem. The source art was sampled at one pixel per three reference pixels, stripped of its presentation background/shadow and mapped to a 25-color palette. The raised staff head reuses the complete idle gem after pixel rotation; the reference's large sigil and flying projectile are not baked into the front casting sprite. Eyes receive a small pixel accent after reduction.

`scripts/prepare-mage-assets.mjs` prepares pixel instructions under `.runtime/mage/`; it never exports an image. The Aseprite MCP drew all 30 cels, assigned the palette, durations and twelve tags, and exported the editable source, game PNG, JSON and GIF previews. Idle breathing, robe/step movement, casting progression and hurt lean are derived variations of the reference poses; the sheet is not claimed to be a supplied hand-drawn walk cycle.

## Runtime contract

- `red-mage.png`: horizontal transparent sheet, 3840 x 128, 30 cells of 128 x 128. All pixels have binary alpha and transparent margins.
- `red-mage.aseprite`: 128 x 128 timeline, one `mage` layer, 30 frames and twelve animation tags. `red-mage.json` records the Aseprite export.
- Ground anchor: `(64, 116)` in every cell. Scale is `radius * 3.3 / 102`, matching the existing player/scenery pixel-art scale while retaining collision radius.
- Front, side and back banks represent down, right and up. Left mirrors the side bank. Diagonal vectors follow the game's existing four-sector facing rule.
- `previews/red-mage-walk.gif` and `previews/red-mage-cast.gif` show the front groups at 3x scale.

| Action | Front frames | Side frames | Back frames | Duration | Selection |
| --- | --- | --- | --- | --- | --- |
| Idle | 0-1 | 10-11 | 20-21 | 240 ms | Visual clock with enemy-ID staggering |
| Walk | 2-5 | 12-15 | 22-25 | 120 ms | Actual position changes observed in the renderer |
| Cast | 6-8 | 16-18 | 26-28 | 110 ms | Progress of the matching active pending spell |
| Hurt | 9 | 19 | 29 | 100 ms | Existing hurt timer, with a brightness flash |

The movement cache is a WeakMap owned by [MageSpriteRenderer](../../src/game/render/mage-sprite.ts). It does not add fields to enemies or saves. A short 140 ms grace interval avoids flicker between updates; stopping returns to idle after that interval, and rewinding the visual clock resets movement detection. A frozen clock holds the current animation frame. Casting faces the pending spell's actual direction; a full attack cooldown, expired spell or another enemy's spell does not trigger the cast group.

[EntityLayer](../../src/game/render/layers/entity-layer.ts) preserves contact shadows and ground-contact depth. Health bars are lifted above the taller hood and raised staff. Missing/pending/wrong-size images fall back to procedural crimson robes, bone-colored skin, red eyes and the red staff gem.

This is an appearance change. Mage AI, stats, projectile element (currently water), charge/projectile effects, damage, loot and snapshots retain their existing rules. The red gem is part of the artwork; it does not change elemental mechanics. The reference's strong-spell aura and defeated pose are not new gameplay actions.

## Validation

`node scripts/validate-mage-sprite.mjs` checks all PNG cells/tags/durations and reconstructs RGBA cels from the editable source to compare against the exported pixels. Its read-only browser fixture imports the real EntityLayer/WorldRenderer, tests all four facings, movement/stop/clock rewind, casting ownership/direction/progress, hurt/recovery and absent/invalid-image fallback, and blocks storage writes.

Existing Playwright/Chromium installations may be passed through `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`. Evidence is written under `output/mage-validation/`. The fixture does not initialize or save a game session and does not validate combat balance, save compatibility or frame-rate performance.
