# Troubleshoot a failed public audit

Use this prompt with an agent inside a Rock from Space repository.

Task:

1. Run `pnpm run audit:content -- --report` and read `reports/audit-report.json` if it is created.
2. Identify whether the failure comes from:
   - exported draft content;
   - blocked/private frontmatter fields;
   - forbidden privacy patterns;
   - unresolved or invalid public links;
   - generated indexes pointing to private source files;
   - malformed public frontmatter.
3. Trace the issue to the smallest source boundary:
   - demo vault fixture;
   - external configured vault input;
   - export normalization;
   - index generation;
   - Astro rendering.
4. Fix the source of the leak or validation problem. Prefer fail-closed export logic over UI hiding.
5. Re-run:
   - `pnpm run content:export -- --report`
   - `pnpm run audit:content -- --report`
   - `pnpm run deploy:check`
6. Report the failing evidence, fix, and passing evidence.

Rules:

- Do not weaken privacy checks just to pass the audit.
- Do not publish or paste sensitive values in the report.
- If the configured input vault contains private data, report only file-relative evidence needed for the fix.
