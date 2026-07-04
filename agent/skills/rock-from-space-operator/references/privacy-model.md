# Rock from Space privacy model

This reference expands the privacy and public-surface rules from `AGENTS.md`. The default stance is fail closed: only explicitly public, schema-approved content reaches `content/`, `src/generated/` and `dist/`.

## Public surfaces

Review these as publishable surfaces:

- `content/`
- `src/generated/`
- `dist/`

Review ignored `reports/` as local evidence, not as public output.

Astro must render from `content/` and `src/generated/`. It must not read a private vault directly.

## Things that must not leak

Before declaring work complete, verify public surfaces do not contain:

- local absolute paths;
- tokens, passwords, API keys or secret-looking values;
- backend-only environment variable names;
- unpublished drafts;
- `Private/`, `Drafts/` or ignored vault folder material;
- private/blocked frontmatter fields;
- generated indexes pointing back to private source paths;
- raw HTML or embed tags unless explicitly allowlisted;
- project-specific or personal copy that was not part of a generic fixture/config.

## Evidence sources

Generate and inspect reports when privacy, content, export or indexing behavior changes:

```bash
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run content:doctor
```

Current local reports:

```text
reports/export-report.json
reports/audit-report.json
reports/doctor-report.json
```

A Markdown doctor report may be added by a later implementation slice. Until then, do not document it as required output.

Report files may be ignored local evidence. Do not commit them unless the project explicitly changes that policy.

## Checklist alignment

Use these repo checklists:

- `agent/checklists/privacy-audit.md`
- `agent/checklists/pre-deploy.md`
- `agent/checklists/pre-publish-audit.md`
- `agent/checklists/release.md`

When documenting repository-wide privacy scans, avoid self-matching sensitive literals where possible by constructing patterns at runtime. Exclude dependency, VCS, build and report noise unless the checklist says otherwise.

## Verification bundle

For privacy-sensitive edits, run:

```bash
git diff --check
pnpm run content:doctor
pnpm run deploy:check
```

If `deploy:check` fails, report the real failing command and do not claim production readiness.
