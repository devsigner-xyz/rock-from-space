# Publish from a Rock from Space vault

Use this prompt with an agent inside the repo.

Task:

1. Read `rfs.config.json`.
2. Inspect the configured vault path and publication rules.
3. Do not create or import notes into the vault unless explicitly asked by the maintainer.
4. Export public content.
5. Regenerate indexes.
6. Run privacy/content audit.
7. Optionally write structured reports with:
   - `pnpm run content:export -- --report`
   - `pnpm run audit:content -- --report`
8. Build Astro.
9. Summarize changed files and verification output.

Do not publish private content. Do not introduce personal paths or domain-specific assumptions.
