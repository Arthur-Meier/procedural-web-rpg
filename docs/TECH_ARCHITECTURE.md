# TECH ARCHITECTURE

## Platform And Stack

- The source code is written in TypeScript.
- The runtime target is browser execution with a custom Canvas 2D renderer.
- The project does not use a third-party game engine.
- `server.ts` is a small Node HTTP server that serves static files from the project root.
- TypeScript is compiled to `dist/` using `tsc -p tsconfig.json`.

## Top-Level Structure

- `src/main.ts` is the composition root and owns the main `Game` class.
- `src/game/systems/` contains gameplay domain systems.
- `src/game/render/` contains renderer orchestration and draw layers.
- `src/game/state/` contains factories, calculators, palette helpers, and inventory helpers.
- `src/game/types/` contains shared runtime and snapshot types.
- `src/game/app/` contains UI- and app-level types that do not fit the lower-level runtime buckets.
- `src/game/ui/` contains DOM panel rendering, overlay control, and world map rendering.
- `src/game/world/` contains chunk generation and world query helpers.
- `src/game/enemies/` contains enemy classes and enemy factory helpers.

## Runtime Composition

- `Game` owns the mutable runtime state, DOM references, system instances, renderer, input manager, overlay controller, and game loop.
- Systems are not passed the entire `Game` instance directly.
- `src/game/runtime/system-hosts.ts` builds host objects with getters and setters that expose only the state each system needs.
- The runtime uses composition over inheritance for system assembly.

## System Organization

- `MovementSystem` handles player motion, camera smoothing, interaction checks, and collision resolution.
- `CombatSystem` is a facade that composes `CombatDamageSystem`, `CombatDropSystem`, `CombatEnemyAi`, `CombatProjectileSystem`, and `CombatEffectsSystem`.
- `ProgressionSystem` handles derived stats, XP, level-ups, stat allocation, equipment changes, and crafting.
- `SpawnSystem` handles initial enemy creation, spawn templates, spawn placement, and delegated respawn updates.
- `QuestSystem` handles quest acceptance, progress, completion rewards, and timed quest refresh.
- `SessionSystem` composes `SessionLifecycle` and `SessionSnapshotStore`.

## Data Model Pattern

- Runtime state is stored as plain objects and arrays typed through `src/game/types/` and `src/game/app/`.
- Factories such as `createPlayer`, `createInventory`, `createQuestBoardState`, and `createProjectile` build or normalize state objects.
- Shared formulas and data transforms are separated from systems into `src/game/state/`.
- Enemy classes inherit from a common `Enemy` base class and specialize behavior or stats through static overrides.

## Rendering Pattern

- Rendering is centralized in `WorldRenderer`.
- `WorldRenderer` delegates drawing to ordered layers: `TerrainLayer`, `EnvironmentLayer`, `EntityLayer`, `EffectsLayer`, and `HudFxLayer`.
- The renderer applies a world-space translation once per frame and then draws world elements in a fixed order.
- UI panels are not part of the Canvas renderer. They are DOM elements updated separately.

## UI Architecture

- The base DOM shell lives in `index.html`.
- `OverlayController` owns overlay panel visibility, panel switching, resize behavior, and world map drag behavior.
- Individual panels are rendered by dedicated functions under `src/game/ui/panels/`.
- `createGameUiElements()` is the central DOM lookup entry point.

## World And Persistence

- `World` manages chunk caching, active chunks, discovered chunks, and breakable-object mutations.
- Procedural content is generated lazily per chunk through `generateChunk(...)`.
- Save data is serialized into a `GameSnapshot` structure and stored in `window.localStorage`.
- Snapshot load recreates player and world state through factories instead of mutating objects in place.
