# RFS vault contract

This reference details the Obsidian-first source model. `AGENTS.md` remains canonical for source boundaries and safety rules.

## Required structure

Rock from Space expects a dedicated RFS-structured Obsidian-compatible Markdown vault:

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

Semantics:

- `index.md` is the public home/source page when publishable.
- `Notes/` is the default publishable note collection.
- `Topics/` contains optional taxonomy term pages; topic routes can be generated from note metadata even without term pages.
- `Pages/` is reserved for stable pages such as about, now, archive or landing pages.
- `Assets/` is reserved for public assets once asset handling is implemented.
- `Drafts/` is non-public by default.
- `Private/` must never be public.

## Frontmatter baseline

Recommended public note shape:

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

Current hard requirements:

- `title` is a non-empty string.
- `publish` is boolean in exported public Markdown.
- `topics`, when present, is an array of non-empty strings.
- Optional metadata must be allowlisted by collection schema before the public site depends on it.
- Blocked private fields fail closed for publishable items.

## Editing rules for agents

- Edit the vault through Markdown and YAML frontmatter; do not add a public admin route or hosted CMS.
- Keep drafts in `Drafts/` or with a non-public publish gate.
- Keep private material in `Private/`; never link it as public output.
- Do not invent mappings for arbitrary personal vault folders during normal operation.
- Translate durable product examples to generic English if a real non-English vault reveals a product gap; do not rewrite user-authored editorial prose just for English consistency.
- After content edits, run `pnpm run content:doctor` and inspect generated reports.

## Topic and collection rules

- Treat `notes` as a collection.
- Treat `topics` as the primary taxonomy by default, not a primary collection.
- Optional `Topics/*.md` files enrich topic pages; membership comes from content frontmatter.
- Generated topic pages should use generated routes, not hardcoded `/notes/<slug>/` paths.
