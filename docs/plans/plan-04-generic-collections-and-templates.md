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
        "optional": ["topics", "summary", "date"]
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

## Tasks

### 1. Model collections

- Add typed collection config parsing.
- Keep `notes` as the default collection.
- Treat `topics` as taxonomy-like collection or relation depending on final schema.
- Ensure unknown collection config fails validation.

### 2. Validate frontmatter

- Define minimum common fields:
  - `title` string;
  - `publish` boolean;
  - `topics` string array optional.
- Add collection-specific optional/required fields.
- Fail export or audit on malformed public content.

### 3. Generate collection indexes

Generate data shaped for Astro, for example:

```text
src/generated/collections.json
src/generated/pages.json
src/generated/topics.json
src/generated/links.json
```

Do not include private source absolute paths.

### 4. Add generic Astro templates

- Preserve existing concrete routes while moving logic to reusable helpers/components.
- Avoid framework islands unless genuinely needed.
- Keep static `getStaticPaths()` self-contained.

### 5. Tests

Add fixtures for:

- valid collection page;
- missing required field;
- ignored collection file;
- collection-specific route generation;
- backlinks/topics across collections.

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
