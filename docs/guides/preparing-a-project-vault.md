# Preparing a Rock from Space Vault

Rock from Space is Obsidian-first, but it is not a universal importer for arbitrary Obsidian vault structures.

To use Rock from Space, prepare or migrate your editorial source into the Rock from Space vault structure. This keeps the product simple, auditable and easy for LLM agents to operate safely.

## Required structure

Default vault shape:

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

Meaning:

- `index.md` — public home/source page when `publish: true`.
- `Notes/` — default publishable notes collection.
- `Topics/` — optional topic/taxonomy term pages.
- `Pages/` — future public pages such as about, now, uses, landing pages or archive pages.
- `Assets/` — future public assets only.
- `Drafts/` — non-public by default.
- `Private/` — never public.

Do not point Rock from Space at a broad personal vault and expect it to infer intent. Create a dedicated RFS vault, or copy/move the public project material into this structure first.

## Default config boundary

A minimal config should be explicit:

```json
"vault": {
  "path": "examples/my-rfs-vault",
  "mode": "project",
  "allow": ["index.md", "Notes/**", "Topics/**", "Pages/**"],
  "ignore": [".obsidian/**", "Drafts/**", "Private/**", "**/Private/**"]
}
```

Guidelines:

- Use `allow` as a publication allowlist.
- Keep `Drafts/` and `Private/` outside the public export.
- Keep raw research, credentials, operational notes and client/private material out of allowed folders.
- `Folder/**` matches files inside `Folder/`, not a same-named `Folder.md` root note.

## Mark public content

Default public gate:

```yaml
publish: true
```

A standard public note should look like:

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

Only fields allowlisted by the matching collection schema survive into `content/`. Fields that are private or blocked fail closed.

Rock from Space currently supports scalar publish gates for compatibility with real project vaults:

```json
"publish": {
  "requireField": "publicationStatus",
  "requireValue": "public-ready",
  "output": "content"
}
```

But the recommended RFS-native convention is still `publish: true`.

## Collections

Collections describe publishable groups and their public fields. The default collection is `Notes/`:

```json
{
  "name": "notes",
  "source": "Notes/**",
  "route": "/notes",
  "template": "note",
  "schema": {
    "required": ["title", "publish"],
    "optional": ["topics", "summary", "template", "order", "featured", "image", "imageAlt", "imageCaption"]
  }
}
```

Future collections should still follow the RFS structure and be documented before agents use them.

## Topics

Topics are the primary taxonomy:

```json
{
  "name": "topics",
  "field": "topics",
  "route": "/topics",
  "label": "Topics",
  "source": "Topics/**",
  "template": "topic"
}
```

Rules:

- A topic page route can be generated from note frontmatter alone.
- A matching `Topics/<Topic>.md` file enriches the topic route with body content.
- Topic counts include collection pages, not only notes.
- Full arbitrary taxonomy route folders are future work.

## Agentic workflow

Rock from Space should be operable by LLM agents using repo-local instructions.

Recommended loop:

```bash
pnpm run content:doctor
pnpm run build
pnpm run check
```

For release readiness:

```bash
pnpm run deploy:check
git diff --check
```

Agents should:

1. Edit Markdown/frontmatter in the RFS vault structure.
2. Avoid private folders and arbitrary vault mappings.
3. Run `content:doctor` after content edits.
4. Read `reports/doctor-report.json`, `reports/export-report.json` and `reports/audit-report.json` when diagnosing.
5. Run build/check gates before declaring success.
6. Never deploy or commit unless explicitly asked.

## Diagnostics

`pnpm run content:doctor` exports public content, regenerates indexes, audits the public surface and writes ignored local reports:

- `reports/export-report.json`
- `reports/audit-report.json`
- `reports/doctor-report.json`

The summary includes:

- scanned files;
- exported files;
- skipped drafts;
- ignored/not allowed files;
- broken wikilinks;
- private/secret-looking findings;
- topics with zero related pages;
- collection counts.

Future work should add a Markdown report that can be opened directly in Obsidian or pasted into an LLM task.

## Privacy checklist

Before using a real project vault:

- The vault follows the RFS folder structure.
- No local absolute paths in public content.
- No API keys, tokens, passwords or backend-only env names.
- No private/client/editorial fields in public frontmatter.
- No raw HTML or embeds unless domains are allowlisted.
- No links to private folders or unpublished source material.
- No project-specific examples committed to the generic repo unless intentionally approved.

If a realistic/private pilot is useful, keep it local and ignored; version only generic fictional fixtures.
