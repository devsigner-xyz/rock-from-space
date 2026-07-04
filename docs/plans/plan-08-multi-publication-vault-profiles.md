# Plan 08 — Multi-publication Vault Profiles

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Status:** Deferred. Current product direction is one RFS-structured Obsidian vault operated through Obsidian and LLM agents. Do not implement this plan until Plan 07's Obsidian-first contract, docs, skills and templates are stable.

**Goal:** Let Rock from Space publish multiple independent public sites from either dedicated project vaults or separate project scopes inside one larger personal vault.

**Architecture:** Introduce first-class publication profiles. A publication profile defines its source vault, selection scope, publication gate, site metadata, generated outputs and safety audit boundaries. The public Astro site must continue to read only exported `content/` and generated indexes, never directly from a private vault.

**Tech Stack:** TypeScript, Astro static output, Zod/config validation, existing export/index/audit pipeline, Vitest integration fixtures.

---

## Product thesis

Rock from Space should not assume `one vault = one website`.

The core abstraction should become:

```text
publication profile = source + scope + gate + templates + outputs + audit boundary
```

This supports both intended workflows:

1. **Dedicated project vaults** — a whole vault belongs to one project, but publication still requires explicit gates such as `publish: true`.
2. **Multiple projects in one personal vault** — a larger private vault contains several publishable public surfaces, each selected by folder, entrypoint note, frontmatter metadata or a safe hybrid of those.

## Non-goals

- Do not publish an entire personal vault by default.
- Do not let linked notes leak into a publication without passing explicit gates.
- Do not turn Rock from Space into a hosted CMS.
- Do not make the public Astro build depend on private vault files.
- Do not require Obsidian runtime APIs.
- Do not couple this feature to Hermes or any specific agent runtime.

## Recommended model

Add publication profiles to `rfs.config.json` while preserving the existing single-publication config as a compatibility shortcut.

Example target shape:

```json
{
  "publications": [
    {
      "name": "civic-archive",
      "site": {
        "title": "Civic Archive",
        "description": "A public knowledge base about Civic Tech.",
        "url": "https://civic.example.com",
        "base": "/"
      },
      "source": {
        "vaultPath": "/path/to/personal-vault",
        "mode": "hybrid",
        "include": [
          "Projects/Civic Archive/**",
          "References/Civic Tech/**"
        ],
        "ignore": [
          ".obsidian/**",
          "**/Privado/**",
          "**/Diario/**"
        ]
      },
      "gate": {
        "publishField": "publish",
        "publishValue": true,
        "publicationField": "publications",
        "publicationName": "civic-archive",
        "requirePublication": true
      },
      "output": {
        "content": "content/civic-archive",
        "generated": "src/generated/civic-archive",
        "dist": "dist/civic-archive"
      }
    }
  ]
}
```

## Source modes

Support source modes incrementally.

### 1. `vault`

A whole dedicated vault is the project source.

Rules:

- source root is `source.vaultPath`;
- still require `publish: true` by default;
- ignore `.obsidian/**` and configured private folders;
- output remains profile-specific.

Example:

```json
{
  "name": "hay-talks",
  "source": {
    "vaultPath": "/home/user/vaults/hay-talks",
    "mode": "vault",
    "include": ["**/*.md"],
    "ignore": [".obsidian/**", "Private/**"]
  }
}
```

### 2. `folder`

A folder or set of folders inside a larger vault define the project scope.

Rules:

- only files matching `include` can be considered;
- `publish: true` remains required;
- optional `publications` gate can further restrict membership.

Example:

```json
{
  "name": "strh-site",
  "source": {
    "vaultPath": "/home/user/Obsidian Vault",
    "mode": "folder",
    "include": ["Projects/strh/**"]
  }
}
```

### 3. `metadata`

A larger vault is scanned within allowed folders, and notes opt into one or more publications through frontmatter.

Example note:

```yaml
---
title: How to run a civic data room
publish: true
publications:
  - civic-archive
topics:
  - Civic Tech
---
```

Rules:

- `publish: true` is required;
- `publications` must include the current profile when `requirePublication` is true;
- blocked/private fields still fail closed;
- `include` should still restrict scan scope for safety and performance.

### 4. `entrypoint`

A root note defines a public subgraph by wikilinks.

Example:

```json
{
  "name": "civic-archive",
  "source": {
    "vaultPath": "/home/user/Obsidian Vault",
    "mode": "entrypoint",
    "entrypoint": "Projects/Civic Archive.md",
    "linkDepth": 2,
    "include": ["Projects/Civic Archive/**", "References/Civic Tech/**"]
  }
}
```

Rules:

- never publish every linked note automatically;
- a linked note must also pass `include`, `ignore`, `publish: true`, blocked-field checks and optional `publications` membership;
- cycles must be handled deterministically;
- skipped linked notes should appear in reports as skipped/blocked, not silently disappear.

### 5. `hybrid`

Recommended long-term default for personal vaults.

A note is published only if all relevant conditions pass:

```text
inside allowed scope
AND not ignored
AND publish: true
AND belongs to this publication when required
AND passes privacy/content audit
```

## Output isolation

Each profile must have isolated generated surfaces.

Recommended output shape:

```text
content/
├── civic-archive/
├── strh-site/
└── hay-talks/

src/generated/
├── civic-archive/
├── strh-site/
└── hay-talks/

dist/
├── civic-archive/
├── strh-site/
└── hay-talks/
```

Alternative implementation: separate site workspaces under `sites/<publication>/` if Astro config isolation becomes cleaner later.

## CLI contract

Add profile-aware commands or flags while preserving current defaults.

Target examples:

```bash
pnpm run content:export -- --profile civic-archive
pnpm run content:index -- --profile civic-archive
pnpm run audit:content -- --profile civic-archive
pnpm run build -- --profile civic-archive
pnpm run deploy:check -- --profile civic-archive
```

Optional convenience command:

```bash
pnpm run publish -- --profile civic-archive
```

List configured publications:

```bash
pnpm run rfs:publications
```

Status/report command, useful before any UI:

```bash
pnpm run rfs:status -- --profile civic-archive
```

Expected status summary:

```text
Publication: civic-archive
Scanned: 120
Exported: 18
Draft: 43
Ignored: 51
Blocked by audit: 2
Broken public wikilinks: 6
```

## Safety rules

- Existing single-publication behavior must continue to work.
- A profile may only write inside its configured `output` paths.
- A profile must not overwrite another profile's `content`, generated indexes or `dist` output.
- Generated indexes must not contain private absolute source paths.
- Shared notes are allowed only when a note explicitly belongs to multiple publications or the selected profile does not require publication membership.
- Cross-publication links should be handled deliberately:
  - internal link if target note is exported in the same profile;
  - warning or external-link mapping if target belongs to another profile;
  - audit failure if configured as strict.
- Entrypoint graph traversal must be bounded by depth, allowlist and publication gates.

## Implementation phases

### Phase 08A — Config model and compatibility

**Objective:** Add publication profile parsing without breaking the current `rfs.config.json`.

**Files:**

- Modify: `scripts/lib/config.ts` or equivalent config module.
- Modify: `scripts/lib/content.ts` if config helpers live there.
- Modify: `rfs.config.json` only if needed to include a commented/example-compatible shape elsewhere.
- Test: config unit tests under `tests/`.

**Tasks:**

- [ ] Define `PublicationConfig` TypeScript type.
- [ ] Add Zod validation for `publications[]`.
- [ ] Convert the existing single-publication config into an implicit default profile when `publications` is absent.
- [ ] Reject duplicate publication names.
- [ ] Reject output paths that overlap dangerously.
- [ ] Add tests for legacy config compatibility and invalid profile config.

**Verification:**

```bash
pnpm run test
pnpm run deploy:check
```

### Phase 08B — Profile-aware export

**Objective:** Let `content:export` run for a selected profile and write to that profile's public output.

**Files:**

- Modify: `scripts/export-from-vault.ts`.
- Modify: `scripts/lib/pipeline.ts`.
- Modify: export fixtures.
- Test: export integration tests.

**Tasks:**

- [ ] Parse `--profile <name>`.
- [ ] Resolve the selected publication profile.
- [ ] Use profile-specific source vault, include/ignore rules and output path.
- [ ] Support `gate.publicationField` / `gate.publicationName` for metadata-based membership.
- [ ] Preserve `publish: true` behavior.
- [ ] Ensure reports include profile name and output path.

**Verification:**

```bash
pnpm run content:export -- --profile demo
pnpm run content:export -- --profile demo --report
pnpm run test
```

### Phase 08C — Profile-aware indexes and Astro data loading

**Objective:** Generate and consume profile-specific indexes without mixing publications.

**Files:**

- Modify: `scripts/build-content-indexes.ts`.
- Modify: generated data loading helpers in `src/`.
- Modify: Astro pages if needed.
- Test: index integration tests.

**Tasks:**

- [ ] Write `src/generated/<profile>/*.json` or another isolated generated-data structure.
- [ ] Keep legacy `src/generated/*.json` behavior for default single-publication mode.
- [ ] Ensure pages/topics/collections are generated from the selected profile only.
- [ ] Add fixtures where two publications share a source vault but export different notes.
- [ ] Add fixture where one note belongs to two publications intentionally.

**Verification:**

```bash
pnpm run content:index -- --profile demo
pnpm run test
pnpm run build
```

### Phase 08D — Profile-aware audit and reports

**Objective:** Audit one publication at a time and make cross-profile leakage visible.

**Files:**

- Modify: `scripts/audit-public-content.ts`.
- Modify: audit report schema/types.
- Test: audit fixtures.

**Tasks:**

- [ ] Include selected profile in audit reports.
- [ ] Fail if a profile's public output contains another profile's private-only notes.
- [ ] Fail if generated data includes private absolute source paths.
- [ ] Add tests for blocked fields, drafts, ignored folders and cross-publication leakage.
- [ ] Add tests for shared notes that are explicitly allowed in multiple publications.

**Verification:**

```bash
pnpm run audit:content -- --profile demo --report
pnpm run test
pnpm run deploy:check
```

### Phase 08E — Entrypoint/subgraph selection spike

**Objective:** Add safe root-note/subgraph publication without leaking arbitrary linked notes.

**Files:**

- Modify or create: wikilink graph traversal module under `scripts/lib/`.
- Modify: export pipeline selection logic.
- Test: graph traversal fixtures.

**Tasks:**

- [ ] Parse wikilinks from candidate notes.
- [ ] Traverse from `source.entrypoint` up to `source.linkDepth`.
- [ ] Apply include/ignore/publish/publication gates to every traversed note.
- [ ] Handle cycles deterministically.
- [ ] Report skipped linked notes with reasons.
- [ ] Add strict mode option to fail on linked-but-not-public notes.

**Verification:**

```bash
pnpm run test
pnpm run content:export -- --profile entrypoint-demo --report
pnpm run audit:content -- --profile entrypoint-demo --report
```

### Phase 08F — Documentation and examples

**Objective:** Make the feature understandable for real users.

**Files:**

- Create: `docs/guides/multi-publication-vaults.md`.
- Modify: `README.md`.
- Modify: `AGENTS.md`.
- Modify: `agent/skills/rock-from-space-operator/SKILL.md`.
- Modify: release/checklist docs if profile-aware commands become part of the release gate.

**Tasks:**

- [ ] Document dedicated-vault workflow.
- [ ] Document multi-project-in-one-vault workflow.
- [ ] Document recommended hybrid safety model.
- [ ] Document frontmatter examples.
- [ ] Document commands and reports.
- [ ] Add privacy warning against unbounded graph publishing.

**Verification:**

```bash
pnpm run deploy:check
```

## Test matrix

Add fixtures covering:

- dedicated vault publication;
- two publication profiles from one vault;
- folder-scoped profile;
- metadata-scoped profile;
- hybrid folder + metadata gate;
- entrypoint profile with bounded links;
- linked private note is not exported;
- draft note is not exported;
- note from another publication is not exported;
- note shared by two publications is exported to both;
- output directories do not overlap;
- reports identify skipped/blocked reasons;
- generated indexes contain no private absolute source paths.

## Done when

- Current single-publication demo still passes `pnpm run deploy:check` unchanged.
- At least two publication profiles can be configured from the same demo vault and export different public outputs.
- A dedicated-vault profile works.
- A folder-scoped profile inside a larger vault works.
- Optional metadata membership via `publications: [...]` works.
- Reports and audits are profile-aware.
- Documentation explains both supported user stories:
  - one vault per project;
  - many projects inside one vault.
- Entrypoint/subgraph publication is either implemented safely or explicitly postponed behind a documented strict safety model.
