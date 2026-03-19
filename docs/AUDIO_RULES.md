# AUDIO RULES

## Current Status

- The project currently has no audio system, no audio assets, and no audio-related runtime modules.

## Minimal Standard For Future Audio

- Keep audio optional and non-blocking. Missing or failed audio playback must not interrupt gameplay, UI, save, or rendering flows.
- Reuse the current architecture pattern: trigger audio from existing gameplay or UI systems, not from render layers.
- Prefer browser-native audio support before adding external audio libraries or complex middleware.
- Keep audio control centralized in a small dedicated module instead of scattering playback code across many files.

## Integration Rules

- Gameplay sounds should be triggered from existing systems such as combat, progression, quest, or session logic.
- UI sounds should be triggered from existing DOM or overlay flows such as panel open, panel close, save, load, and button actions.
- Rendering code under `src/game/render/` should stay visual-only.

## Scope Rules

- Start with short sound effects first. Add background music only if the project explicitly needs it.
- Use conservative defaults for volume so audio does not overpower the current UI and gameplay feedback.
- Keep the first audio pass small and focused on high-value actions such as attack, hit, pickup, quest completion, and menu actions.

## Naming And Organization

- If audio assets are added, keep file naming lowercase and kebab-case to match the project file style.
- If an audio folder is added, keep it simple and feature-oriented, for example grouping UI and gameplay sounds separately only when needed.
