# LEVEL DESIGN RULES

## World Layout

- The world is currently a procedural chunk grid.
- `CHUNK_SIZE` is currently `24`.
- Discovery and map rendering operate at the chunk level rather than per-tile exploration.

## Spawn Area

- The opening play space is centered around the origin and kept comparatively clear.
- Procedural breakables are skipped if their generated position is within `6.5` units of `(0, 0)`.
- A fixed spawn house is placed near the start area.
- A fixed guide NPC and quest sign are placed near the spawn house.

## Chunk Content

- Chunk object generation currently uses rule-based counts and spacing rather than authored layouts.
- Trees generate with `min: 3`, `max: 6`, `spacing: 2.7`.
- Rocks generate with `min: 2`, `max: 4`, `spacing: 2.5`.
- Crates generate with `min: 1`, `max: 2`, `spacing: 2.3`, and `chance: 0.75`.
- Generated objects are placed with margins from the chunk edges and are rejected if they overlap previous objects.

## Navigation And Readability

- The map reveals the current chunk and nearby chunks around the player through `discoverAround(...)`.
- The quest board and guide NPC are intentionally readable hub anchors in the spawn area.
- Enemy spawns are placed away from the player and outside the visible camera bounds.
