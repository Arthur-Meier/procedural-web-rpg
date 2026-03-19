# FIX BUG

Read `docs/AI_RULES.md`, `docs/TECH_ARCHITECTURE.md`, `docs/NAMING_CONVENTIONS.md`, and any bug-relevant docs such as `docs/GAMEPLAY_RULES.md`, `docs/UI_UX_RULES.md`, `docs/PERFORMANCE_RULES.md`, or `docs/SAVE_SYSTEM_RULES.md`.

Then:

- Identify the affected runtime flow and the likely source file or system.
- Confirm the root cause before changing code.
- Apply the narrowest fix that preserves the existing architecture.
- Call out any save-data, UI-state, or gameplay regression risk introduced by the change.
- Verify the fix with the project build or the closest available check.
