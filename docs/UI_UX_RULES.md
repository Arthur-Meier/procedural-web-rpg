# UI_UX_RULES

## UI Structure

- The UI is split between a full-screen gameplay canvas and DOM overlays.
- The persistent HUD is divided into `hudTop`, `hudSide`, `hudBottom`, and `hudMessage`.
- Overlay panels currently include title, title-load, pause, game over, map, stats, inventory, and quest board panels.

## Overlay Behavior

- Only one gameplay overlay panel is active at a time through `OverlayController`.
- Opening map, stats, inventory, or quests hides the others by switching a single active overlay state.
- `Esc` closes the quest board, resumes from pause, or opens pause depending on the current state.
- The overlay veil becomes visible whenever the game is not in the plain `playing` state or a gameplay panel is open.

## Panel Pattern

- Panels use a shared `.panel` base class and then specialize with modifier classes such as `.map-panel`, `.inventory-panel`, and `.quest-panel`.
- Scrollable panels are used for inventory and quest content.
- Panel headers consistently pair descriptive text with a close or navigation action.
- Primary actions use the `button.primary` style.

## Input And Feedback

- The HUD side panel repeats current control hints in text instead of relying only on external instructions.
- Contextual guidance is shown when the player is near the guide NPC.
- The quest board shows availability, active state, completion state, and a refresh countdown when relevant.
- The map panel supports drag-to-pan only when discovered content exceeds the viewport.

## Responsive Behavior

- The layout has explicit responsive breakpoints at `900px` and `700px`.
- On smaller screens, HUD panels stop using absolute corner placement and become stacked.
- The inventory grid shrinks from ten columns to five columns on narrower layouts.
- Inventory and quest panels expand to full available width on smaller screens.
