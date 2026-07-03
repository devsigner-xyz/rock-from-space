# Rock from Space

Rock from Space is an open-source toolkit for building production-ready Astro websites from an Obsidian-compatible Markdown vault.

It is designed around a simple idea:

> Portable editorial source. Audited public export. Cloud-ready static website.

The project is intentionally agnostic: no private paths, no personal project assumptions, no fixed domain model, and no dependency on a specific LLM provider.

## Why

Many Markdown/Obsidian publishing workflows are either too local, too coupled to a personal vault, or too close to a blog starter. Rock from Space aims to be a safer publishing pipeline:

- edit and organize content in an Obsidian-compatible vault;
- export only explicitly public content;
- audit privacy and content integrity before publishing;
- generate typed indexes for Astro;
- build a static website that can be deployed to cloud hosting/CDNs;
- include portable agent instructions so LLMs can operate the system safely.

## Core flow

```text
Obsidian-compatible editorial vault
        ↓ curate / edit / link
Public export
        ↓ normalize / audit / sync
content/
        ↓ generated typed indexes
src/generated/*.json
        ↓ Astro templates
static website dist/
        ↓ deploy
production cloud hosting / CDN
```

Local-first describes the editorial/source workflow. It does **not** mean local-only publishing. The generated `dist/` output must be deployable to production cloud hosting.

## Design principles

- **Agnostic by default**: no domain-specific assumptions.
- **Privacy by design**: never publish a whole vault accidentally.
- **TypeScript-first**: use TypeScript for Astro, generated data contracts and project tooling when JavaScript would otherwise be used.
- **Static-first**: prefer static Astro output; opt into SSR/adapters only when a template needs runtime behavior.
- **SOLID-ish architecture**: small modules, explicit boundaries, dependency injection where useful, no hidden global state.
- **Deterministic pipeline**: export, index and audit scripts should be safe to rerun.
- **Cloud-ready output**: build artifacts must work in CI/CD and static hosting.
- **Agent-friendly**: `AGENTS.md`, skills, prompts and checklists are part of the product, not an afterthought.

## Repository map

```text
.
├── README.md
├── AGENTS.md
├── DESIGN.md
├── rfs.config.json
├── content/                 # Public exported content. Treat as publishable.
├── examples/
│   └── demo-vault/           # Disposable Obsidian-compatible demo vault.
├── scripts/                  # Planned TypeScript tooling scripts.
├── src/
│   ├── generated/            # Generated JSON/TS indexes consumed by Astro.
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

## Current status

Functional vertical slice with initial hardening is implemented. The project now has real Astro/Vite/TypeScript tooling, demo vault reset/export/index/audit/build commands, Vitest unit/integration tests and GitHub Actions CI.

The implementation roadmap lives in:

- `docs/plans/master-plan.md`
- `docs/plans/plan-01-foundation-scaffold.md`
- `docs/plans/plan-02-content-pipeline-vertical-slice.md`
- `docs/plans/plan-03-production-cloud-publishing.md`
- `docs/plans/plan-04-generic-collections-and-templates.md`
- `docs/plans/plan-05-agentic-operations-package.md`
- `docs/plans/plan-06-hardening-and-publishability.md`
- `docs/plans/plan-07-local-editorial-control-panel.md`

## Commands

Current command contract:

```bash
pnpm install
pnpm run reset:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run test
pnpm run build
pnpm run check
pnpm run deploy:check
pnpm run preview
pnpm run preview:prod
```

## Collections, taxonomies and frontmatter

`rfs.config.json` includes explicit `collections` and `taxonomies` contracts while preserving the existing `/notes/` and `/topics/` routes.

Current default:

- `notes` is the primary collection: `source: "Notes/**"`, `route: "/notes"`, `template: "note"`.
- `topics` is a taxonomy, not a primary collection: `field: "topics"`, `route: "/topics"`, optional term pages from `Topics/**`.
- A topic route is generated from note metadata even when no `Topics/<topic>.md` file exists.
- A matching `Topics/<topic>.md` file can enrich the generated topic page with body content.

The exporter parses real Obsidian-compatible YAML frontmatter, including multiline arrays and extra editorial metadata, then normalizes only schema-approved public fields into `content/`. Extra properties are ignored unless they are blocked/private fields, which fail closed for publishable notes.

Minimum public validation fails before deploy when a publishable/exported item has an empty or missing `title`, non-boolean `publish`, or `topics` that is not an array of non-empty strings.

Generated contracts currently include:

- `src/generated/pages.json`
- `src/generated/collections.json`
- `src/generated/topics.json`
- `src/generated/links.json`
- `src/generated/meta.json`

## CI

GitHub Actions runs the production safety gate on pushes and pull requests to `main`:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

`deploy:check` exports public content, generates indexes, audits the public surface, builds Astro and runs typecheck/tests. For agent/operator workflows, `content:export` and `audit:content` also support `-- --report` to write ignored local JSON reports under `reports/`.

## Security baseline

The public build must fail before deployment if it contains obvious private material:

- local absolute paths;
- tokens, passwords, API keys or secret-looking values;
- unpublished drafts;
- private frontmatter fields;
- references to ignored folders;
- generated data that points back to private source paths.

Frontend code must not receive backend-only secrets. If public environment variables are needed later, they should be clearly named and documented.

## Agentic operation

Rock from Space includes portable agent materials:

- `AGENTS.md` for coding agents;
- `agent/skills/rock-from-space-operator/SKILL.md` for Hermes-compatible but generally readable operation rules;
- `agent/prompts/` for repeatable tasks such as publishing from a vault, reviewing public output, adding a collection, troubleshooting failed audits and preparing release notes;
- `agent/checklists/` for pre-deploy, privacy audit, route smoke-test and release verification.

Agents should treat `content/` and `dist/` as public surfaces and run audit/build checks before declaring work complete.

`pnpm run check` runs Astro validation, TypeScript typechecking and the unit test suite. The test suite includes pure content utilities and integration fixtures for export/index/audit behavior.
