# AI RULES

- Start from [knowledge/index.md](../knowledge/index.md) and read only the concepts, ADRs and source files relevant to the task.
- Follow [KNOWLEDGE_STANDARD.md](KNOWLEDGE_STANDARD.md) for OKF metadata, ADR decisions, source drift and local Graphify commands.
- Before editing, use `npm run knowledge:impact -- <repository-relative paths>` to identify affected knowledge; update concepts, indexes and the log with the implementation.
- A proposed ADR, source hash observation, build or Graphify snapshot does not establish human approval or semantic verification.
- Read `GAME_VISION.md` before making gameplay changes.
- Preserve the existing architecture documented in `TECH_ARCHITECTURE.md`.
- Do not introduce breaking changes without explicit justification.
- Treat empty files in `/docs` as "no project standard has been established yet".
- Prefer extending the existing domain systems (`movement`, `combat`, `progression`, `spawn`, `quest`, `session`) instead of creating parallel subsystems.
- Keep file, symbol, and import naming aligned with `NAMING_CONVENTIONS.md`.
- When a change affects persistence, review `SAVE_SYSTEM_RULES.md` before modifying snapshot or load behavior.
