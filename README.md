# Rock from Space

Rock from Space is an open-source toolkit for building production-ready Astro websites from an Obsidian-compatible Markdown vault, while also supporting imports back into the vault from external content sources.

It is designed around a simple idea:

> Portable editorial source. Audited public export. Cloud-ready static website.

The project is intentionally agnostic: no private paths, no personal project assumptions, no fixed domain model, and no dependency on a specific LLM provider.

## Why

Many Markdown/Obsidian publishing workflows are either too local, too coupled to a personal vault, or too close to a blog starter. Rock from Space aims to be a safer publishing pipeline:

- edit and organize content in an Obsidian-compatible vault;
- import content from structured sources into that vault;
- export only explicitly public content;
- audit privacy and content integrity before publishing;
- generate typed indexes for Astro;
- build a static website that can be deployed to cloud hosting/CDNs;
- include portable agent instructions so LLMs can operate the system safely.

## Core flow

```text
External sources / Markdown / JSON / YAML / CSV / APIs
        ↓ import
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
- **Deterministic pipeline**: import, export, index and audit scripts should be safe to rerun.
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
│   ├── demo-vault/           # Disposable Obsidian-compatible demo vault.
│   └── import/               # Demo import sources.
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

Planning scaffold. The initial architecture and implementation plans are in:

- `docs/plans/master-plan.md`
- `docs/plans/plan-01-foundation-scaffold.md`
- `docs/plans/plan-02-content-pipeline-vertical-slice.md`
- `docs/plans/plan-03-production-cloud-publishing.md`

## Planned commands

These commands are part of the intended implementation and may not exist yet:

```bash
pnpm install
pnpm run reset:demo
pnpm run import:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run test
pnpm run build
pnpm run check
pnpm run deploy:check
pnpm run preview
```

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
- `agent/skills/` for Hermes-compatible but generally readable skills;
- `agent/prompts/` for repeatable tasks;
- `agent/checklists/` for verification.

Agents should treat `content/` and `dist/` as public surfaces and run audit/build checks before declaring work complete.

`pnpm run check` runs Astro validation, TypeScript typechecking and the unit test suite.
