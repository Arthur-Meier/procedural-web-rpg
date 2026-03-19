# PERFORMANCE RULES

## Frame Update

- The main loop runs on `requestAnimationFrame`.
- Frame delta is clamped to `0.05` seconds before simulation updates.
- Message decay is separated so UI timers can continue even while gameplay simulation is paused by overlays.

## World Streaming And Queries

- World chunks are generated lazily and cached in `World.chunkCache`.
- Active chunks are recomputed from camera bounds plus `ACTIVE_CHUNK_BUFFER`.
- Most world-object proximity checks go through `world.getObjectsNear(...)` instead of iterating every generated object.
- Rendering of breakables and terrain is limited to active chunks.

## Collection Update Pattern

- Transient arrays that remove items during iteration are updated in reverse index order.
- This reverse-splice pattern is used for projectiles, drops, particles, death effects, aura effects, and pending respawns.

## Rendering Scope

- The world map is rendered only when the map overlay is open or when map interaction requires a redraw.
- The world renderer uses ordered layers instead of separate canvases or DOM elements for each world category.
- World-space translation is applied once per render pass before the layer draw calls.

## Spawn And Generation Limits

- Enemy spawning uses capped attempt counts when searching for valid spawn positions.
- Chunk generation uses capped placement attempts per object instance.
- Enemy spawns are rejected if they would appear inside the visible camera area.
