# CREATE ENEMY

Read `docs/AI_RULES.md`, `docs/GAME_VISION.md`, `docs/GAMEPLAY_RULES.md`, `docs/TECH_ARCHITECTURE.md`, `docs/ART_DIRECTION.md`, `docs/PERFORMANCE_RULES.md`, and `docs/NAMING_CONVENTIONS.md`.

Then:

- Define the enemy in terms of existing enemy architecture, combat flow, rendering style, and progression balance.
- Reuse the current enemy factory, stat, AI, drop, and render patterns unless the task explicitly requires a new pattern.
- Keep naming aligned with current `Enemy`, `Mage`, and `Slime` conventions.
- Add only the data, behavior, rendering, and spawn hooks required for the new enemy to function.
- Verify the implementation with the project build or the closest available check.
