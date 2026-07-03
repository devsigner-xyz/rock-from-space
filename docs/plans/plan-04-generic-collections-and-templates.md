# Plan 04 — Generic Collections and Templates

## Goal

Generalize Rock from Space beyond the initial `notes` + `topics` demo while keeping the core file-first, static-first and provider-agnostic.

The system should support multiple content collections with explicit schemas, routes and templates, without turning into a fixed blog starter or a hosted CMS.

## Product principles

- Collections are configured, not hardcoded.
- The default remains simple notes/topics.
- Frontmatter schemas are explicit and validated.
- Astro reads public generated indexes, not private vault files.
- Templates remain static-first and HTML-first.
- Existing demo behaviour must keep working.

## Proposed config shape

Extend `rfs.config.json` with a future `collections` section:

```json
{
  "collections": [
    {
      "name": "notes",
      "source": "Notes/**",
      "route": "/notes",
      "template": "note",
      "schema": {
        "required": ["title", "publish"],
        "optional": ["topics"]
      }
    }
  ]
}
```

Initial implementation can keep deriving `notes` and `topics` from the current config, then migrate to explicit collections when tests cover parity.

## Deliverables

- Collection config model.
- Collection-aware export/index types.
- Frontmatter schema validation per collection.
- Generated collection index JSON.
- Generic collection landing route.
- Generic item route.
- Backward compatibility for `/notes/` and `/topics/`.
- Tests for collection routing and schema failures.

## Subplan 04A — Flexible Obsidian frontmatter support

Goal: support real Obsidian Properties/YAML while keeping Rock from Space strict about what becomes public.

Current limitation: the first implementation uses a minimal YAML parser that supports strings, booleans and inline arrays such as `topics: ["Markdown", "Privacy"]`. Obsidian can also write valid YAML in richer forms, including multiline arrays, dates and additional custom properties. The project should parse that broader Obsidian-compatible YAML, then validate and normalize only the public contract.

Recommended boundary:

```text
Obsidian-compatible YAML frontmatter
        ↓ parse with a real YAML/frontmatter parser
unknown/editorial frontmatter
        ↓ validate collection schema with Zod
normalized public frontmatter
        ↓ export to content/
```

Tasks:

- [x] Replace the custom `parseSimpleYaml` implementation with a real parser such as `yaml` or `gray-matter`.
- [x] Add fixtures for Obsidian-style multiline properties:
  - `topics` as a YAML list;
  - extra editorial/private fields;
  - dates or non-string metadata that should be ignored unless schema-approved.
- [x] Keep public validation strict after parsing:
  - `title` must be a non-empty string;
  - `publish` must be boolean;
  - `topics`, when present, must normalize to an array of non-empty strings.
- [x] Introduce a per-collection public-field allowlist so extra Obsidian properties can exist in source notes without leaking into `content/`.
- [x] Keep blocked/private fields fail-closed for publishable notes, even when the parser supports richer YAML.
- [x] Document the supported Obsidian Properties shape in README and AGENTS.
- [x] Add regression tests proving multiline Obsidian YAML exports and audits correctly.

Non-goals for this subplan:

- Do not make arbitrary frontmatter public by default.
- Do not depend on the Obsidian app runtime.
- Do not turn frontmatter into a hosted CMS model; it remains file-first Markdown metadata.

## Tasks

### 1. Model collections

- [x] Add typed collection config parsing for the initial `notes` collection.
- [x] Keep `notes` as the default collection while preserving existing notes/topics behavior.
- [x] Treat `topics` as taxonomy-like collection or relation depending on final schema.
- [x] Ensure unknown collection config fails validation.

### 2. Validate frontmatter

- [x] Define minimum common fields:
  - `title` non-empty string;
  - `publish` boolean;
  - `topics` string array optional.
- [x] Add collection-specific optional/required fields beyond the initial `notes` schema.
- [x] Fail export or audit on malformed public content.

### 3. Generate collection indexes

Generate data shaped for Astro, for example:

```text
src/generated/collections.json
src/generated/pages.json
src/generated/topics.json
src/generated/links.json
```

Do not include private source absolute paths.

Status: implemented with `src/generated/collections.json` while preserving `pages.json`, `topics.json`, `links.json` and `meta.json`.

### 4. Add generic Astro templates

- Preserve existing concrete routes while moving logic to reusable helpers/components.
- Avoid framework islands unless genuinely needed.
- Keep static `getStaticPaths()` self-contained.

Status: implemented with compatibility routes for `/notes/` and `/topics/` plus generic non-`notes` collection routes under `src/pages/[collection]/`.

### 5. Tests

Add fixtures for:

- valid collection page;
- missing required field;
- ignored collection file;
- collection-specific route generation;
- backlinks/topics across collections.

Additional coverage added for YAML multiline Obsidian frontmatter, generated topics without term pages, enriched topics with optional `Topics/*.md`, second collection representation and schema/frontmatter errors.

## Final product decision

- `notes` is a collection.
- `topics` is a taxonomy, not a primary collection.
- `Topics/*.md` are optional term pages for enriching topics.
- `/topics/[slug]/` must be generated from note metadata even if no `Topics/<topic>.md` file exists.

## Verification

Run:

```bash
pnpm run test
pnpm run reset:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run check
pnpm run deploy:check
```

Smoke:

- `/`
- `/notes/`
- one `/notes/[slug]/`
- `/topics/`
- one `/topics/[slug]/`
- one future collection route when implemented.

## Done when

- The demo site still works unchanged.
- A second collection can be represented without hardcoding new one-off scripts.
- Malformed public frontmatter fails before build/deploy.
- Generated indexes remain deterministic.
