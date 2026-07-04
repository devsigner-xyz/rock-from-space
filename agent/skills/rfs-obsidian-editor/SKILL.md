---
name: rfs-obsidian-editor
description: Safely create and edit content in a Rock from Space structured Obsidian-compatible Markdown vault, then verify export/index/audit results.
---

# RFS Obsidian Editor

## When to use

Use this skill when creating, editing, repairing or reviewing source-vault Markdown for a Rock from Space project.

Load `AGENTS.md` first. It is the canonical project contract. This skill adds focused editorial workflow guidance and must not override root source-boundary or privacy rules.

## Source contract

Rock from Space expects the RFS vault shape:

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

Default meanings:

- `index.md` — public home/source page when publishable.
- `Notes/` — primary publishable note collection.
- `Topics/` — optional taxonomy term pages.
- `Pages/` — future stable public pages.
- `Assets/` — future public assets only.
- `Drafts/` — non-public by default.
- `Private/` — never public.

Do not invent arbitrary personal-vault mappings. If the source vault does not follow this shape, document migration/preparation work instead of silently mapping folders.

## Frontmatter baseline

Use or repair public frontmatter toward this shape:

```yaml
---
title: "Example note"
publish: true
topics:
  - Markdown
summary: "Short public summary."
template: note
order: 10
featured: false
image: ""
imageAlt: ""
imageCaption: ""
---
```

Rules:

- `title` must be a non-empty string.
- Public exported `publish` must normalize to boolean `true`.
- `topics` should be an array of non-empty strings.
- Optional fields are safe only when allowed by the collection schema and supported by templates.
- Never add private fields to publishable items.

## Editing workflow

1. Inspect `git status --short --branch` before edits.
2. Identify the configured vault from `rfs.config.json`; do not infer local personal paths.
3. Keep edits inside the RFS vault structure.
4. Move non-public work to `Drafts/` or keep `publish` non-public.
5. Keep sensitive content in `Private/` and do not link it from public pages.
6. Maintain topic names consistently; create `Topics/<topic>.md` only when useful public term metadata exists.
7. Preserve user-authored editorial language. Product docs/config examples stay English, but vault prose may be any language.
8. Run `pnpm run content:doctor` after source-vault edits.
9. Inspect reports and summarize exported routes, warnings and failures.

## Verification

For content edits, run:

```bash
pnpm run content:doctor
pnpm run build
pnpm run check
git diff --check
```

If privacy, reports, export behavior or generated public surfaces are affected, also run:

```bash
pnpm run deploy:check
```

## Output summary

Report:

- edited vault files;
- generated/public files changed by commands;
- exported routes or skipped files from reports;
- warnings/failures and next actions;
- exact commands run and whether the repo is ready for commit.
