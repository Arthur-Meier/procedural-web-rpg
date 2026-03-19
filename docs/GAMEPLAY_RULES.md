# GAMEPLAY RULES

## Movement And Input

- Player movement is driven by a normalized axis built from `WASD` and arrow keys.
- Player facing follows the mouse while the pointer is inside the canvas. When the mouse is not active, facing falls back to movement direction.
- `E` is the current interaction key for the guide NPC.
- Left mouse click on the quest sign is the current way to open the quest board.
- `M`, `P`, `I`, and `Esc` are the current overlay shortcuts for map, stats, inventory, and pause or close behavior.

## Combat

- Left mouse click or `J` triggers the sword attack when melee cooldown is available.
- Right mouse click or `K` triggers magic when magic cooldown is available.
- Sword attacks use a frontal arc check based on player facing and `PLAYER_ATTACK_RANGE`.
- Sword attacks can damage both enemies and breakable world objects.
- Player magic is implemented as a delayed spell cast that spawns a projectile after `SPELL_CAST_DELAY`.
- Enemy combat currently uses two behavior families: `dash` and `ranged`.
- Contact damage is applied when a live enemy overlaps the player and the player is not invulnerable.
- Enemy ranged attacks also use the delayed spell-cast pipeline before producing projectiles.

## Progression

- XP progression uses `xpRequiredForNextLevel(level)`, which currently returns `level + 9`.
- Each level-up grants exactly one unspent stat point.
- `constitution` maps directly to max HP.
- Physical damage is currently `strength * 0.1 + sword physical multiplier`.
- Magic damage is currently `intelligence * 0.1 + staff magic multiplier`.
- Movement speed is currently `agility * 0.5`.
- Luck feeds into drop chances through `chanceWithLuck(...)`.

## World Interaction

- Trees, rocks, and crates are breakable solid objects.
- Tree destruction yields `wood`.
- Rock destruction yields `stone`.
- Crates can yield gold.
- Item and gold drops are picked up automatically when the player is close enough.

## Quest Flow

- Only one quest can be active at a time.
- Current quest objectives are kill counts only.
- Completing a quest grants gold immediately.
- Completed quests stay visible as completed until their refresh timer expires.
- Completed quests rotate into a new quest state after `QUEST_COMPLETED_REFRESH_MS`, currently 5 minutes.
