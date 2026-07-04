# Obsidian Authoring Workflow

Rock from Space is designed to be operated from Obsidian first. Obsidian is the editorial/admin UI; Rock from Space is the export, audit and static-site build pipeline.

## Core rule

Use the Rock from Space vault structure. Do not expect the pipeline to infer arbitrary personal-vault layouts.

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

## Authoring loop

1. Write or edit content in Obsidian.
2. Keep public notes in `Notes/`, future public pages in `Pages/`, topic term pages in `Topics/`.
3. Keep drafts in `Drafts/` and private material in `Private/`.
4. Add explicit public frontmatter.
5. Run diagnostics:

```bash
pnpm run content:doctor
```

6. Fix reported issues in Obsidian.
7. Build and preview:

```bash
pnpm run build
pnpm run preview:prod
```

8. For release readiness:

```bash
pnpm run deploy:check
git diff --check
```

## Public note frontmatter

Recommended baseline:

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

Minimum current fields:

- `title`: non-empty string.
- `publish`: boolean, normally `true` for public content.
- `topics`: optional array of non-empty strings.

Future/frontmatter fields:

- `template`: public rendering template, once implemented.
- `summary`: index card or meta description.
- `order`: manual ordering.
- `featured`: homepage/featured selection.
- `image`, `imageAlt`, `imageCaption`: public image metadata.

Do not rely on future fields until the collection schema and templates support them.

## Topics

Use topic names in note frontmatter:

```yaml
topics:
  - Privacy
  - Static Sites
```

Optionally create term pages:

```text
Topics/Privacy.md
Topics/Static Sites.md
```

A term page can enrich the public topic route, but topic routes can also be generated from frontmatter alone.

## Draft and private boundaries

Use these rules strictly:

- `Drafts/` is not public.
- `Private/` is never public.
- Raw research, credentials, client notes, operational notes and local planning should stay outside allowed folders.
- A note should only become public when both its folder and frontmatter make it public.

## Working with LLM agents

When asking an agent to edit the vault:

- Give the repo path and config path.
- Point it at the RFS vault path.
- Tell it to preserve the required structure.
- Ask it to run `pnpm run content:doctor` after edits.
- Ask it to summarize changed files, generated routes, warnings/failures and verification commands.
- Do not ask it to publish/deploy unless that is the explicit task.

Good task shape:

```text
Edit the RFS vault under examples/demo-vault. Add one public note under Notes/ using RFS frontmatter, link it to an existing topic, run content:doctor and build, and report generated routes. Do not deploy or commit.
```

## What belongs in future templates

Rock from Space may later provide copyable Obsidian templates for:

- note;
- topic;
- page;
- collection item;
- essay;
- profile/landing pages.

Until then, use the baseline frontmatter above and keep optional fields explicit.
