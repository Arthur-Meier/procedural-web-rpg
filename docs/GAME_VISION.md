# GAME VISION

## Current Scope

- The current project is a browser-based 2D top-down action RPG implemented with TypeScript, Canvas 2D, HTML, and CSS.
- The current playable loop is: start at the spawn hub, explore a procedural overworld, fight enemies, collect drops, craft stronger weapons, spend stat points, complete hunt quests, and save or load progress.
- The project currently presents a continuous overworld instead of scene-based levels. The initial hub is built around a spawn house, a guide NPC, and a quest sign near the origin.
- The player-facing states currently implemented are `title`, `playing`, `paused`, and `gameOver`.

## Current Gameplay Pillars

- Exploration is chunk-based and procedural. The map reveals discovered chunks around the player.
- Combat is real-time and supports two player attack modes: sword melee and magic projectile casting.
- Progression is stat-driven. The player levels up through XP, receives unspent stat points, and improves damage, movement, luck, and max HP through attributes.
- Resource gathering is part of the loop. Trees, rocks, and crates can be broken for crafting materials or gold.
- Equipment progression is currently tied to weapon crafting and equipping.
- Quests currently focus on kill objectives and reward gold. Only one quest can be active at a time.

## Current Content

- Current enemies are `slime` and `mage`.
- Current collectible materials are `wood`, `stone`, and `slimeGoo`.
- Current craftable upgrades are `stoneSword` and `slimeStaff`.
- Current player magic uses the `fire` element, while the ranged enemy content uses the `water` element.
