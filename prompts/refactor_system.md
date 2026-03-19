# REFACTOR SYSTEM

Read `docs/AI_RULES.md`, `docs/TECH_ARCHITECTURE.md`, `docs/NAMING_CONVENTIONS.md`, and `docs/PERFORMANCE_RULES.md` before changing structure.

Then:

- Describe the current responsibility split of the system you are refactoring.
- Preserve current behavior and public data contracts unless the task explicitly allows behavior changes.
- Reuse existing host, factory, renderer, and panel patterns where they already exist.
- Keep names and file organization aligned with current project conventions.
- Verify the refactor with the project build and summarize any unchanged constraints that still shape the system.
