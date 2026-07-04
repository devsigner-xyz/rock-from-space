Work in this repository. Load `AGENTS.md`, `README.md`, `DESIGN.md`, `docs/plans/master-plan.md`, `docs/plans/plan-07-obsidian-first-agentic-workflow.md` and `docs/plans/plan-10-agentic-skills-and-references.md`.

Goal: continue Plan 10 in small slices. Keep `AGENTS.md` as the canonical contract, keep repo-local skills under `agent/skills/*/SKILL.md`, and do not introduce a required `.agents/` directory unless a future plan explicitly adds it as an optional compatibility layer.

Rules: no deploy, no push, no commit unless explicitly asked. Do not touch unrelated working-tree changes. Keep docs and agent materials portable: no private local paths, personal vault assumptions or provider-specific runtime requirements.

Verify with `git diff --check`, `pnpm run test`, `pnpm run build` and `pnpm run check`. If the slice touches privacy, reports, export/index behavior or public surfaces, also run `pnpm run content:doctor` and `pnpm run deploy:check`.

Summarize changed files, real commands run, remaining debt and whether the result is ready for commit.
