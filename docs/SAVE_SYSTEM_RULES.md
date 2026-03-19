# SAVE SYSTEM RULES

## Storage Backend

- Save data is stored in `window.localStorage`.
- Save keys use the prefix `rpg-mundo-aberto-slot-`.
- The project currently exposes `SAVE_SLOT_COUNT = 3`.

## Snapshot Shape

- The saved object is a `GameSnapshot` with top-level `version`, `meta`, and `state`.
- The current snapshot version is `2`.
- `meta` stores slot number, save timestamp, level, XP, gold, HP, and a rounded player position.
- `state` stores world seed, serialized world data, player data, live enemies, drops, pending respawns, runtime counters, and quests.

## Save Behavior

- Only non-dead enemies are persisted.
- Drops are shallow-copied into the snapshot.
- Quests are serialized as full quest state entries, including progress and refresh timing fields.
- Snapshot metadata position is rounded for display, while runtime player state is saved separately in the full player snapshot.

## Load Behavior

- Load reconstructs the world from `World.fromSnapshot(...)`.
- Load reconstructs the player through `createPlayer(...)`.
- Load reconstructs enemies through `createEnemyFromSnapshot(...)`.
- Projectiles, particles, pending spell casts, enemy death effects, and player aura effects are reset on load instead of being persisted.
- Pending respawns are restored from the snapshot and then topped up until tracked enemies plus pending respawns reach `ENEMY_MAX_ALIVE`.
- Quests are restored through `hydrateQuestBoardState(...)`.

## Slot Listing And Error Handling

- Slot lists are built by reading all configured slot keys and parsing the stored JSON.
- Missing saves are treated as empty slots.
- Unreadable JSON is treated as a corrupted save and surfaced in the load list as an unavailable slot.
