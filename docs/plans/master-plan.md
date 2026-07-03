# Rock from Space — Master Plan

## Product definition

Rock from Space is an open-source toolkit for building static Astro websites from an Obsidian-compatible editorial vault, with bidirectional content workflows and portable agent operations.

It should let a user:

1. clone the repo;
2. run the disposable demo vault;
3. import content into the vault from simple external sources;
4. edit/curate in Obsidian or any Markdown editor;
5. export only public content into `content/`;
6. generate Astro indexes;
7. audit privacy and content integrity;
8. build a static website;
9. deploy the generated website to production cloud hosting;
10. use included agent skills/prompts/checklists to operate and extend the system.

## Non-goals

- Not a personal vault publisher by default.
- Not a fixed blog starter.
- Not a hosted CMS.
- Not dependent on Hermes, Obsidian app runtime, or any LLM provider.
- Not a tool that publishes an entire vault without explicit allowlist rules.

## Architecture

```text
External content sources
  Markdown / JSON / YAML / CSV / APIs
          ↓
Import layer
          ↓
Obsidian-compatible editorial vault
          ↓
Export + normalize + audit
          ↓
content/
          ↓
Index generation
          ↓
src/generated/*.json
          ↓
Astro templates
          ↓
dist/
          ↓
Production cloud hosting / CDN
```

## Repository target structure

```text
rock-from-space/
├── README.md
├── AGENTS.md
├── DESIGN.md
├── rfs.config.json
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── content/
├── examples/
│   └── demo-vault/
├── scripts/
│   ├── import-to-vault.ts
│   ├── export-from-vault.ts
│   ├── normalize-content.ts
│   ├── build-content-indexes.ts
│   ├── audit-public-content.ts
│   └── reset-demo-vault.ts
├── src/
│   ├── generated/
│   ├── layouts/
│   ├── pages/
│   └── styles/
├── agent/
│   ├── skills/
│   ├── prompts/
│   └── checklists/
├── docs/
│   └── plans/
└── tests/
```

## Configuration model

The project should be driven by `rfs.config.json`.

Minimum config areas:

- `site`: title, description, language, production URL, base path.
- `vault`: source path, mode, allow rules, ignore rules.
- `import`: source definitions and templates.
- `publish`: public field/tag requirements and output path.
- `routes`: route prefixes for notes, topics and collections.
- `privacy`: forbidden patterns, blocked frontmatter fields, allowed embed domains.
- `agent`: optional metadata for agent workflows.

- TypeScript-first implementation baseline: Astro code, generated data contracts and project tooling should use TypeScript where JavaScript would otherwise be used.
- SOLID-ish module boundaries: parsing, normalization, export, indexing and auditing should be separate modules with explicit inputs/outputs.
- Schema validation for unknown config/import/frontmatter data.

## Roadmap

### Plan 01 — Foundation scaffold

Goal: create a clean, generic project foundation that is safe to clone and reason about.

Deliverables:

- repo structure;
- README;
- AGENTS;
- DESIGN placeholder;
- `rfs.config.json` draft;
- disposable demo vault skeleton;
- initial agent folder;
- command contract documented.

Detailed plan: `docs/plans/plan-01-foundation-scaffold.md`.

### Plan 02 — Content pipeline vertical slice

Goal: implement the first end-to-end pipeline from demo import to Astro build.

Deliverables:

- demo content reset;
- JSON/Markdown import into vault;
- vault export into `content/`;
- generated JSON indexes;
- privacy/content audit;
- basic Astro pages.

Detailed plan: `docs/plans/plan-02-content-pipeline-vertical-slice.md`.

### Plan 03 — Production cloud publishing

Goal: make production cloud deployment a first-class supported output, not an afterthought.

Deliverables:

- production build contract;
- deployment guide for at least one static/cloud provider;
- environment variable model for public-only config;
- CI-friendly commands;
- optional examples for Netlify/Vercel/Cloudflare Pages/Railway;
- pre-deploy audit checklist.

### Plan 04 — Generic collections and templates

Goal: make the system useful beyond a simple notes/topics demo.

Deliverables:

- configurable collections;
- route templates;
- frontmatter schemas;
- collection landing pages;
- richer backlink/topic graph.

### Plan 05 — Agentic operations package

Goal: make LLM-assisted operation portable and versioned.

Deliverables:

- Hermes-compatible skills in `agent/skills/`;
- generic prompts;
- checklists;
- examples of safe agent tasks;
- optional future MCP design.

### Plan 06 — Hardening and publishability

Goal: make the project stable enough for public release.

Deliverables:

- tests for import/export/index/audit;
- fixtures;
- docs site or expanded README;
- example screenshots;
- license;
- contribution guide;
- release checklist.

## Success criteria for MVP

A fresh clone should support this flow:

```bash
pnpm install
pnpm run reset:demo
pnpm run import:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run preview
```

The built site must:

- render a homepage;
- list notes;
- render note detail pages;
- list topics;
- render topic pages;
- contain no local private paths or obvious secrets;
- be generated from a demo vault that can be deleted and recreated;
- produce a `dist/` artifact suitable for deployment to production cloud hosting.

## Open product questions

- Should the first public positioning say “Obsidian-compatible” or “Markdown vault” first?
- Should the default public gate be `publish: true`, `status: public`, or tag-based?
- Should imports overwrite notes, create timestamped versions, or require explicit IDs?
- Should wikilinks become clean routes by default or remain visible as text when unresolved?
- Should the agentic package be documented as Hermes-first or agent-agnostic with Hermes-compatible skills?

Initial recommendation:

- Use “Obsidian-compatible Markdown vault” as the public framing.
- Require `publish: true` by default.
- Make import dry-run by default when overwriting existing notes.
- Fail audit on unresolved public wikilinks unless configured as warnings.
- Keep agentic docs agent-agnostic, with Hermes skill compatibility as a concrete implementation format.
