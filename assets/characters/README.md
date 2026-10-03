# Blue Orb Knight

Character design reference: `Img referencias/Cavaleiro Mago do Orbe Azul.png`.

The artwork was generated from the reference with the image-generation tool, normalized to a 34-color palette and transparent pixel-art cells, then drawn and exported through the Aseprite MCP. The original generated output is retained as `blue-orb-knight-generated.png`. The generation prompt is in `prompts/blue-orb-knight-spritesheet.txt`.

## Game sheet

- File: `blue-orb-knight.png`.
- Image size: 672 x 768 pixels, RGBA with binary transparency.
- Grid: seven columns and eight rows; every cell is 96 x 96 pixels.
- Column 0: standing pose. Columns 1 through 6: the walking cycle, 100 ms per frame.
- Foot anchor in each cell: x = 48, y = 84.
- Runtime draws the complete cell at 72 x 72 pixels, without image smoothing. The anchor coincides with the existing ground shadow.
- Animation advances only during actual movement and returns to the standing pose when stopped, blocked, or paused.
- Facing follows the game's existing mouse aiming and movement rules. This changes the artwork without changing attack targeting.

| Row (zero based) | Direction | Description |
| --- | --- | --- |
| 0 | down | South / front |
| 1 | down-left | Southwest |
| 2 | left | West / left profile |
| 3 | up-left | Northwest / back diagonal |
| 4 | up | North / back |
| 5 | up-right | Northeast / back diagonal |
| 6 | right | East / right profile |
| 7 | down-right | Southeast |

## Editable sources and previews

- `blue-orb-knight-sheet.aseprite`: the exact game sheet, one frame with all 56 cells.
- `blue-orb-knight.aseprite`: a 96 x 96 animation timeline with 56 frames and idle/walk tags for each direction.
- `blue-orb-knight-animations.png` and `.json`: the horizontal timeline export and its Aseprite metadata, including animation tags.
- `previews/walk-*.gif`: a preview of each walking loop. The game consumes the transparent PNG, not the GIF previews.

The standing frames are static poses. The requested movement animation is a six-frame loop; there are no new attack, spell-casting or death animations in this sheet.

## Validation

Inspect the game sheet without modifying it:

```powershell
node scripts/inspect-character-sheet.mjs assets/characters/blue-orb-knight.png sheet output/sprite-validation/final-sheet-analysis.json
```

The inspector checks dimensions, alpha, the presence of artwork in every cell and clipping at cell edges. Runtime direction, walking, stopping, pause and missing-image behavior are checked with `scripts/validate-player-sprite.mjs` in Playwright. Test artifacts live under `output/sprite-validation/`.
