# Add a generic collection

Use this prompt with an agent inside a Rock from Space repository.

Task:

1. Read `AGENTS.md`, `README.md`, `rfs.config.json` and the current collection/index code.
2. Add a new collection without introducing domain-specific assumptions.
3. Update the config contract with:
   - collection `name`;
   - source glob;
   - route prefix;
   - template name;
   - required and optional public frontmatter fields.
4. Add minimal disposable demo content only when needed to verify the collection.
5. Update export/index/audit logic only if the existing generic collection support is insufficient.
6. Add or update Astro routes/templates generically.
7. Add tests or fixtures for the new behavior.
8. Run:
   - `pnpm run reset:demo`
   - `pnpm run content:export -- --report`
   - `pnpm run audit:content -- --report`
   - `pnpm run deploy:check`
   - `git diff --check`
9. Summarize changed files, generated files and verification output.

Rules:

- Keep `topics` as a taxonomy unless the maintainer explicitly changes the product contract.
- Do not hardcode personal vault paths or example domains.
- Do not expose private frontmatter fields in `content/` or `src/generated/`.
