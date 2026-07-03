# Plan 02 — Content Pipeline Vertical Slice

## Goal

Implement the first working end-to-end pipeline:

```text
reset demo vault → import demo content → export public content → generate indexes → audit → build Astro site
```

The slice must prove that Rock from Space is not just documentation. It should generate a real static website from a disposable Obsidian-compatible vault.

## Deliverables

- `package.json` with real scripts.
- `astro.config.mjs` and `tsconfig.json`.
- `scripts/reset-demo-vault.ts`.
- `scripts/import-to-vault.ts`.
- `scripts/export-from-vault.ts`.
- `scripts/build-content-indexes.ts`.
- `scripts/audit-public-content.ts`.
- Basic Astro pages:
  - `/`
  - `/notes/`
  - `/notes/[slug]/`
  - `/topics/`
  - `/topics/[slug]/`
- Generated JSON:
  - `src/generated/pages.json`
  - `src/generated/topics.json`
  - `src/generated/links.json`
  - `src/generated/meta.json`

## Command contract

Target commands:

```bash
pnpm run reset:demo
pnpm run import:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run check
pnpm run preview
```

Suggested `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev --host 0.0.0.0",
    "reset:demo": "tsx scripts/reset-demo-vault.ts",
    "import:demo": "tsx scripts/import-to-vault.ts --source examples/import/demo-notes.json --target examples/demo-vault",
    "content:export": "tsx scripts/export-from-vault.ts",
    "content:index": "tsx scripts/build-content-indexes.ts",
    "audit:content": "tsx scripts/audit-public-content.ts",
    "build": "pnpm run content:export && pnpm run content:index && pnpm run audit:content && astro build",
    "check": "astro check && tsc --noEmit",
    "preview": "astro preview --host 0.0.0.0"
  }
}
```

## Script behavior

### `reset-demo-vault.ts`

Responsibilities:

- delete and recreate only `examples/demo-vault/`;
- seed safe fictitious notes;
- create minimal `.obsidian/` only if useful;
- never touch external vaults.

Safety:

- must refuse to operate outside the project directory;
- should print changed files.

### `import-to-vault.ts`

Responsibilities:

- read JSON or Markdown source;
- create/update notes in the configured vault;
- preserve stable IDs if provided;
- generate frontmatter;
- link topics with wikilinks when configured.

Initial source fixture:

`examples/import/demo-notes.json`

Safety:

- default to no destructive overwrite unless `--apply` or deterministic managed demo mode;
- for the demo command, overwrite is acceptable because the demo vault is disposable.

### `export-from-vault.ts`

Responsibilities:

- read `rfs.config.json`;
- copy only allowed notes with `publish: true`;
- ignore `.obsidian`, drafts and private folders;
- write to `content/`;
- normalize basic frontmatter;
- preserve Markdown body;
- produce an export report.

Safety:

- never export everything by default;
- fail on missing configured vault unless running reset/import demo first.

### `build-content-indexes.ts`

Responsibilities:

- parse frontmatter;
- slugify notes;
- collect topics;
- extract wikilinks;
- generate backlinks;
- write JSON to `src/generated/`.

Minimum JSON shapes:

```json
{
  "title": "Obsidian compatible publishing",
  "slug": "obsidian-compatible-publishing",
  "path": "Notes/Obsidian compatible publishing.md",
  "topics": ["Markdown", "Privacy"],
  "body": "..."
}
```

### `audit-public-content.ts`

Responsibilities:

- scan `content/` and `src/generated/`;
- fail on forbidden privacy patterns;
- fail on drafts in public content;
- fail on private frontmatter fields;
- warn or fail on broken wikilinks depending on config;
- print summary.

Initial forbidden patterns:

- `/home/`
- `password`
- `secret`
- `api_key`
- `token`

## Astro implementation

### Pages

- `src/pages/index.astro`: homepage and project stats.
- `src/pages/notes/index.astro`: all public notes.
- `src/pages/notes/[slug].astro`: note detail.
- `src/pages/topics/index.astro`: all topics.
- `src/pages/topics/[slug].astro`: topic detail with related notes.

### Layout

- `src/layouts/BaseLayout.astro`.
- Use semantic HTML and neutral CSS.
- No framework islands in the first slice.

### Styling

- `src/styles/global.css`.
- Neutral, readable, not brand-heavy.
- CSS variables for color, spacing and typography.

## Verification

Run:

```bash
pnpm install
pnpm run reset:demo
pnpm run import:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run check
```

Then preview:

```bash
pnpm run preview -- --host 127.0.0.1 --port 4321
```

Smoke routes:

- `/`
- `/notes/`
- one generated note route;
- `/topics/`
- one generated topic route.

## Done when

- A fresh clone can build the demo site without external data.
- The demo vault can be deleted and recreated.
- Public content is generated from the vault, not handwritten directly into Astro pages.
- The audit catches obvious privacy leaks.
- Astro renders generated content from JSON indexes.
- No private or project-specific references exist.
