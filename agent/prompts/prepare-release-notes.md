# Prepare release notes

Use this prompt with an agent inside a Rock from Space repository.

Task:

1. Read `README.md`, `SECURITY.md`, `docs/plans/` and `agent/checklists/release.md`.
2. Inspect Git history since the previous release tag, or since the initial commit if no tag exists.
3. Group changes into:
   - pipeline/export/index/audit;
   - Astro site/rendering;
   - agent operations/docs;
   - tests/CI/security;
   - known limitations.
4. Run the release verification gate unless already run in the same task:
   - `pnpm install --frozen-lockfile`
   - `pnpm run deploy:check`
   - `git diff --check`
   - privacy scan from `agent/checklists/release.md`.
5. Draft release notes with:
   - summary;
   - highlights;
   - verification evidence;
   - migration notes if any;
   - known pending work.

Rules:

- Do not invent a version, tag or license decision.
- Do not include private paths, private project names or credentials in release notes.
- Do not publish a release unless explicitly instructed.
