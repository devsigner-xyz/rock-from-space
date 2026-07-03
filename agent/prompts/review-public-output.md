# Review public output

Use this prompt with an agent inside a Rock from Space repository.

Task:

1. Read `AGENTS.md`, `rfs.config.json` and `agent/checklists/privacy-audit.md`.
2. Run or inspect the latest public export and audit reports:
   - `pnpm run content:export -- --report`
   - `pnpm run audit:content -- --report`
3. Inspect representative public surfaces:
   - `content/`
   - `src/generated/pages.json`
   - `src/generated/collections.json`
   - `src/generated/topics.json`
   - `dist/` after build if available.
4. Verify that public content contains no private paths, drafts, blocked frontmatter fields, credential-like values or private source references.
5. Run `pnpm run deploy:check` unless the user asked for review-only and no command execution.
6. Return a concise report with:
   - files or routes reviewed;
   - findings by severity;
   - commands run and results;
   - recommended fixes.

Rules:

- Do not read an external/private vault unless it is explicitly configured and needed for the task.
- Do not edit source files unless asked.
- Do not claim the public output is safe unless the audit and scan evidence supports it.
