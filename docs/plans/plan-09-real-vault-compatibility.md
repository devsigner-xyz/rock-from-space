# Real Vault Compatibility Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Convert the WatchOut Bitcoin local pilot findings into generic Rock from Space capabilities for realistic Obsidian-compatible project vaults.

**Architecture:** Keep Rock from Space agnostic. Use the copied WatchOut vault as a local/realistic fixture to expose generic gaps, but implement only reusable behavior: collection-aware taxonomies, related pages, safer glob matching, configurable publish gates, and better diagnostics. Astro must still read only `content/` and `src/generated/`, never a private vault directly.

**Tech Stack:** TypeScript, Astro static output, Zod config validation, existing export/index/audit pipeline, Vitest integration fixtures.

**Current status (2026-07-04):** Plan 09 is functionally complete for the generic compatibility slice. Implemented pieces include safe folder glob matching, taxonomy counts across collection pages, related collection content on topic pages, boolean/string/number publish gates with `publish: true` public normalization, a generic realistic fixture, `content:doctor`/`content:status`, generated taxonomy metadata and the project-vault preparation guide. Remaining taxonomy limitation is explicit: Astro currently renders one primary taxonomy through `/topics/` route folders; fully arbitrary taxonomy route folders belong to later routing work.

---

## Context from the WatchOut pilot

A sanitized copy of a dedicated WatchOut Bitcoin vault was tested in a separate sandbox at:

```text
/home/strh/projects/rock-from-space-watchout-pilot
```

The pilot proved that Rock from Space can publish a realistic vault with multiple collections, but exposed generic assumptions that still come from the small demo:

- topic counts originally counted only `kind === "note"`, not collection pages;
- topic pages rendered only related notes, so related collection pages were hidden;
- `Folder/**` glob matching accidentally matched `Folder.md`;
- the publication gate only accepts boolean `publish: true`, while real vaults may use fields such as `publicationStatus: public-ready`;
- route and UI labels still assume English `notes` / `topics` in several places;
- realistic vault work benefits from a local copied fixture, but the product must not become WatchOut-specific.

## Non-goals

- Do not turn Rock from Space into a WatchOut-specific publisher.
- Do not require real WatchOut data to be versioned for public releases.
- Do not publish a whole personal vault by default.
- Do not make Astro read source vault files directly.
- Do not implement Plan 08 multi-publication profiles in this plan.
- Do not build a UI/control panel yet.

## Local realistic fixture policy

Decision for the generic repo: keep WatchOut-specific material local/ignored, and version a generic fictional fixture instead.

The local WatchOut copy may live under:

```text
examples/watchout-vault/
```

as a development fixture while this plan is being worked on, but it should not be committed to the generic product repo. The durable versioned fixture lives under:

```text
examples/realistic-vault/
```

Before any public release, keep this policy:

1. keep `examples/watchout-vault/` as a local ignored fixture only;
2. use `examples/realistic-vault/` for versioned tests/docs;
3. publish project-specific examples only if the content is explicitly approved and project-specific coupling is acceptable.

The durable generic fixture is:

```text
examples/realistic-vault/
├── index.md
├── Project.md
├── Talks/
├── People/
├── Editions/
├── Topics/
├── Sources.md
├── Drafts/
└── Private/
```

inspired by the WatchOut shape, but not tied to WatchOut naming or data.

Alternate configs can be tested without overwriting `rfs.config.json`:

```bash
RFS_CONFIG_PATH=examples/configs/realistic-vault.config.json pnpm run build
```

The command reads the alternate config but still regenerates `content/`, `src/generated/` and `dist/` for that run.

## Phase 09A — Generic fixes discovered by the pilot

### Task 1: Fix folder glob matching

**Objective:** Ensure `Folder/**` matches `Folder/child.md`, not `Folder.md`.

**Files:**

- Modify: `scripts/lib/content.ts`
- Modify: `tests/content.test.ts`

**Steps:**

1. Add a test proving:

```ts
expect(isAllowed('Topics/Bitcoin.md', ['Topics/**'], [])).toBe(true);
expect(isAllowed('Topics.md', ['Topics/**'], [])).toBe(false);
```

2. Update `matchesPattern()` so a pattern ending in `/**` only matches the directory itself or children:

```ts
if (pattern.endsWith('/**')) {
  const directory = pattern.slice(0, -3);
  return value === directory || value.startsWith(`${directory}/`);
}
```

3. Run:

```bash
pnpm run test
```

### Task 2: Count taxonomy membership across all public content pages

**Objective:** Topic/taxonomy counts should include collection pages, not just notes.

**Files:**

- Modify: `scripts/lib/pipeline.ts`
- Modify: `tests/pipeline.test.ts`

**Steps:**

1. Add/extend a fixture with a non-`notes` collection item that has `topics: ["Shared Topic"]`.
2. Assert `buildContentIndexes()` returns `Shared Topic.noteCount === 1` and includes the collection page slug.
3. Replace the topic aggregation source from `notePages` to all content pages except `index` and `topic` pages.
4. Run:

```bash
pnpm run test
```

### Task 3: Render related pages on topic pages

**Objective:** Topic pages should show related collection pages and use each page's generated route.

**Files:**

- Modify: `src/pages/topics/[slug].astro`
- Optional test later: Astro integration/smoke fixture once route smoke tests exist.

**Steps:**

1. Expand the `PublicPage` interface to include `route`, `collection` and `kind: 'note' | 'topic' | 'index' | 'collection'`.
2. Replace `relatedNotes` with `relatedPages`.
3. Resolve pages by slug without filtering to `kind === 'note'`.
4. Render links with `page.route`, not `/notes/${slug}/`.
5. Change UI copy from `Related notes` to `Related content`.
6. Run:

```bash
pnpm run build
pnpm run check
```

## Phase 09B — Config flexibility for realistic vaults

### Task 4: Allow non-boolean publish gates

**Objective:** Support fields such as `publicationStatus: public-ready` without requiring users to mutate a source vault into `publish: true`.

**Files:**

- Modify: `scripts/lib/content.ts`
- Modify: `scripts/lib/pipeline.ts` if needed
- Modify: `tests/pipeline.test.ts`
- Modify: README/AGENTS docs

**Target config:**

```json
"publish": {
  "requireField": "publicationStatus",
  "requireValue": "public-ready",
  "output": "content"
}
```

**Steps:**

1. Change `publish.requireValue` schema from boolean-only to scalar allowed values: boolean/string/number.
2. Keep current boolean behavior backwards compatible.
3. Add export tests for string gate and boolean gate.
4. Document the behavior.
5. Run:

```bash
pnpm run test
pnpm run deploy:check
```

### Task 5: Make taxonomy naming less hardcoded

**Objective:** Separate taxonomy `name`, frontmatter `field`, route and UI label.

**Files:**

- Modify: config schema in `scripts/lib/content.ts`
- Modify: index generation where it assumes `topics`
- Modify: Astro topic routes only as far as current architecture allows
- Modify: docs

**Target config direction:**

```json
{
  "name": "topics",
  "field": "topics",
  "route": "/topics",
  "label": "Topics",
  "source": "Topics/**"
}
```

**Important:** Full dynamic route folders for arbitrary taxonomy routes may require a later routing refactor. This task can start by fixing generated data and labels while documenting remaining route limitations.

## Phase 09C — Realistic fixtures and diagnostics

### Task 6: Create a generic realistic vault fixture

**Objective:** Preserve the learning from WatchOut without coupling the public repo to WatchOut.

**Files:**

- Create: `examples/realistic-vault/**`
- Create or modify: `tests/fixtures/realistic-vault/**`
- Modify: `tests/pipeline.test.ts`

**Fixture requirements:**

- at least 2 collections besides `notes`;
- at least 1 taxonomy with term pages;
- at least 1 private ignored folder;
- at least 1 draft skipped by publish gate;
- resolved wikilinks between collections;
- related topic pages with collection content;
- no private source paths or project-specific data.

### Task 7: Add a human-friendly diagnostic report

**Objective:** Make realistic vault preparation easier without a UI.

**Candidate command:**

```bash
pnpm run content:doctor
```

or enhance:

```bash
pnpm run audit:content -- --report
```

**Report should summarize:**

```text
Scanned files
Exported files
Skipped drafts
Ignored files
Broken wikilinks grouped by target
Private-looking links
Topics with zero related pages
Collections and page counts
```

## Phase 09D — Documentation

### Task 8: Document preparing a project vault

**Files:**

- Create: `docs/guides/preparing-a-project-vault.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Content:**

- what a project vault is;
- how to choose allow/ignore rules;
- how to mark public notes;
- how to structure collections and taxonomies;
- how to handle index notes and root notes;
- how to use audit reports;
- how to avoid leaking personal/operational context.

## Verification checklist

Before considering Plan 09 complete:

```bash
pnpm run reset:demo
pnpm run deploy:check
pnpm run content:export -- --report
pnpm run audit:content -- --report
```

For the realistic fixture:

```bash
pnpm run test
```

Manual/browser smoke should verify:

- home shows non-zero taxonomy counts;
- a topic page shows related collection pages;
- related links use each page's generated route;
- no fake `Topics (0)` topic appears from a same-named index note;
- audit has no private source path or secret-like findings.

## Done when

- The default demo still passes unchanged.
- The real-vault bugs discovered by the WatchOut pilot are covered by tests.
- Topic pages render related content from collections, not only notes.
- Folder glob matching is safe.
- A realistic generic fixture exists or the WatchOut local fixture policy is explicitly documented.
- The docs explain how to prepare a realistic project vault without coupling Rock from Space to a specific project.
