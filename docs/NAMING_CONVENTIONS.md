# NAMING CONVENTIONS

## Source Files And Folders

- Multiword TypeScript source files use kebab-case.
- Examples include `combat-system.ts`, `enemy-ai.ts`, `world-renderer.ts`, `quest-panel.ts`, and `snapshot-store.ts`.
- Barrel files use the reserved name `index.ts`.
- Folder names are lowercase and mostly kebab-free single nouns such as `systems`, `render`, `state`, `types`, `world`, `ui`, and `enemies`.

## Symbols

- Classes, interfaces, and type aliases use PascalCase.
- Examples include `GameLoop`, `WorldRenderer`, `QuestSystem`, `EnemyEntity`, `WorldChunk`, and `SaveSlotSummary`.
- Functions, methods, and local variables use camelCase.
- Examples include `createPlayer`, `renderInventoryPanel`, `updateRespawns`, `pickEnemySpawnTemplate`, and `getObjectsNear`.
- Shared constants use UPPER_SNAKE_CASE.
- Examples include `PLAYER_ATTACK_RANGE`, `ENEMY_MAX_ALIVE`, `QUEST_BOARD_TEMPLATE`, and `SAVE_SLOT_COUNT`.

## IDs And Data Keys

- String IDs for items, weapons, recipes, and quests use lowerCamelCase.
- Examples include `woodenSword`, `slimeGoo`, `craftStoneSword`, `craftSlimeStaff`, `huntScout`, and `huntElite`.
- Runtime object fields stay camelCase even inside serialized snapshots.
- Examples include `enemyIdCounter`, `projectileIdCounter`, `equippedSwordId`, `completedAt`, and `refreshAt`.

## UI Naming

- CSS class names use kebab-case.
- Examples include `overlay-veil`, `panel-header`, `slot-card`, `inventory-item-card`, and `active-quest-pill`.
- DOM element IDs use camelCase.
- Examples include `gameCanvas`, `hudTop`, `mapPanel`, `questBoardList`, and `closeQuestButton`.

## Import Pattern

- Relative imports inside TypeScript source use `.js` file extensions because the project compiles with `module: "NodeNext"`.
