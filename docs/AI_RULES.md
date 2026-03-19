# AI RULES

- Read `GAME_VISION.md` before making gameplay changes.
- Preserve the existing architecture documented in `TECH_ARCHITECTURE.md`.
- Do not introduce breaking changes without explicit justification.
- Treat empty files in `/docs` as "no project standard has been established yet".
- Prefer extending the existing domain systems (`movement`, `combat`, `progression`, `spawn`, `quest`, `session`) instead of creating parallel subsystems.
- Keep file, symbol, and import naming aligned with `NAMING_CONVENTIONS.md`.
- When a change affects persistence, review `SAVE_SYSTEM_RULES.md` before modifying snapshot or load behavior.
