---
name: rfs-privacy-auditor
description: Audit Rock from Space public surfaces, generated reports and build outputs for privacy leaks, malformed public content and unsafe publication state.
---

# RFS Privacy Auditor

## When to use

Use this skill when reviewing export/audit/report behavior, preparing a deploy or commit, investigating privacy findings, or checking public surfaces before publication.

Load `AGENTS.md` first. It is the canonical project contract. This skill specializes the privacy review workflow.

## Surfaces to inspect

Treat these as public or publication-adjacent:

- `content/` — exported public Markdown.
- `src/generated/` — generated public data consumed by Astro.
- `dist/` — built static site output.
- `reports/` — ignored local evidence from export/audit/doctor commands.

Astro must not read a private vault directly. It should render from `content/` and `src/generated/`.

## Findings to detect

Public surfaces must not contain:

- local absolute paths such as `/home/`, `/Users/` or `C:\\Users\\`;
- API keys, tokens, passwords, secret-looking values or database URLs;
- backend-only environment variable names;
- unpublished drafts or ignored/private folders;
- `Private/`, `Drafts/` or source-vault-only operational material;
- blocked/private frontmatter fields;
- generated indexes pointing back to private source paths;
- raw HTML or embed tags unless allowlisted in config;
- personal/project-specific copy that is not a generic fixture or configured sample.

Minimum public frontmatter expectations:

- `title` is a non-empty string;
- `publish` is boolean in exported Markdown;
- optional `topics` is an array of non-empty strings.

## Audit workflow

1. Inspect `git status --short --branch`.
2. Run report-producing commands when needed:

```bash
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run content:doctor
```

3. Read generated reports:

```text
reports/export-report.json
reports/audit-report.json
reports/doctor-report.json
```

If a future slice adds `reports/doctor-report.md`, inspect it as human-readable evidence too.

4. Inspect representative files in `content/`, `src/generated/` and `dist/` if build output exists.
5. Use `agent/checklists/privacy-audit.md` and `agent/checklists/pre-deploy.md` for command and scan alignment.
6. If privacy-sensitive behavior changed, run `pnpm run deploy:check`.

## Verification

For a full privacy-sensitive review, run:

```bash
git diff --check
pnpm run content:doctor
pnpm run deploy:check
```

When requested as part of a broader implementation slice, also run:

```bash
pnpm run test
pnpm run build
pnpm run check
```

## Reporting format

Return evidence, not assumptions:

- commands run and pass/fail status;
- report paths inspected;
- concrete findings with file paths and categories;
- whether findings are blocking or warnings;
- generated files changed by the audit/build commands;
- remaining privacy debt;
- whether the working tree appears ready for commit.

Never print secrets. If a suspected secret exists, identify the file/category and redact the value.
