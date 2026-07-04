<p align="center">
  <img src="docs/assets/rock-from-space-icon.png" alt="Rock from Space icon" width="144" height="144">
</p>

# Rock from Space

Rock from Space is an open-source, Obsidian-first toolkit for building production-ready Astro websites from a Rock from Space structured Markdown vault.

It is designed around a simple idea:

> Portable editorial source. Audited public export. Cloud-ready static website.

The project is intentionally strict at the vault boundary: it avoids private paths and personal project assumptions, but it does expect users and agents to adopt the Rock from Space vault structure instead of importing arbitrary Obsidian layouts.

## Why

Many Markdown/Obsidian publishing workflows are either too local, too coupled to a personal vault, or too close to a blog starter. Rock from Space aims to be a safer publishing pipeline:

- edit and organize content in Obsidian using the Rock from Space vault structure;
- export only explicitly public content;
- audit privacy and content integrity before publishing;
- generate typed indexes for Astro;
- build a static website that can be deployed to cloud hosting/CDNs;
- include portable agent instructions so LLMs can operate the vault and publishing pipeline safely.

## Core flow

```text
Rock from Space structured Obsidian vault
        ↓ curate / edit / link with humans or LLM agents
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

- **Opinionated vault contract**: one expected RFS vault structure instead of arbitrary Obsidian imports.
- **Agnostic content**: no domain-specific assumptions.
- **Privacy by design**: never publish a whole vault accidentally.
- **TypeScript-first**: use TypeScript for Astro, generated data contracts and project tooling when JavaScript would otherwise be used.
- **Static-first**: prefer static Astro output; opt into SSR/adapters only when a template needs runtime behavior.
- **SOLID-ish architecture**: small modules, explicit boundaries, dependency injection where useful, no hidden global state.
- **Deterministic pipeline**: export, index and audit scripts should be safe to rerun.
- **Cloud-ready output**: build artifacts must work in CI/CD and static hosting.
- **Agentic by design**: `AGENTS.md`, repo-local skills, prompts and checklists are part of the product, not an afterthought.

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
│   ├── realistic-vault/      # Generic fictional multi-collection fixture.
│   └── configs/              # Example configs for alternate fixtures.
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
- `docs/plans/plan-07-obsidian-first-agentic-workflow.md`
- `docs/plans/plan-08-multi-publication-vault-profiles.md` (deferred; current focus is one RFS-structured vault)
- `docs/plans/plan-09-real-vault-compatibility.md`
- `docs/plans/plan-10-agentic-skills-and-references.md`
- `docs/guides/preparing-a-project-vault.md`
- `docs/guides/obsidian-authoring-workflow.md`

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
pnpm run content:doctor
pnpm run content:status
pnpm run test
pnpm run build
pnpm run check
pnpm run deploy:check
pnpm run preview
pnpm run preview:prod
```

To test an alternate config without overwriting `rfs.config.json`, set `RFS_CONFIG_PATH` for the command:

```bash
RFS_CONFIG_PATH=examples/configs/realistic-vault.config.json pnpm run build
```

This still regenerates `content/`, `src/generated/` and `dist/` for that run, so run `pnpm run reset:demo && pnpm run build` afterwards when you want the default demo outputs restored.

## Quickstart

From a fresh clone:

```bash
pnpm install --frozen-lockfile
pnpm run reset:demo
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run deploy:check
pnpm run preview:prod
```

Then open `http://127.0.0.1:4321` and smoke `/`, `/notes/`, one generated note route, `/topics/` and one generated topic route.

Deployment guidance lives in `docs/deployment/static-hosting.md`; production smoke checks live in `docs/deployment/smoke-checklist.md`.

## Collections, taxonomies and frontmatter

`rfs.config.json` includes explicit `collections` and `taxonomies` contracts while preserving the existing `/notes/` and `/topics/` routes. The default product contract is an RFS-structured Obsidian vault, not arbitrary vault-shape detection.

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

Future metadata such as `template`, `summary`, `order`, `featured`, `image`, `imageAlt` and `imageCaption` should be added as explicit frontmatter contracts before templates depend on them.

Current default:

- `notes` is the primary collection: `source: "Notes/**"`, `route: "/notes"`, `template: "note"`.
- `topics` is a taxonomy, not a primary collection: `field: "topics"`, `route: "/topics"`, optional term pages from `Topics/**`.
- A topic route is generated from note metadata even when no `Topics/<topic>.md` file exists.
- A matching `Topics/<topic>.md` file can enrich the generated topic page with body content.
- Topic counts and topic pages include all public content pages, including configured collection pages, and links use each page's generated route.

The exporter parses real Obsidian-compatible YAML frontmatter, including multiline arrays and extra editorial metadata, then normalizes only schema-approved public fields into `content/`. Extra properties are ignored unless they are blocked/private fields, which fail closed for publishable notes.

`publish.requireValue` may be a boolean, string or number. This supports source vault gates such as `publicationStatus: public-ready` while keeping exported public Markdown normalized to `publish: true`.

Minimum public validation fails before deploy when a publishable/exported item has an empty or missing `title`, non-boolean `publish`, or `topics` that is not an array of non-empty strings.

Taxonomy field, route and UI label are configurable in generated data, but the current Astro route folders still implement one primary taxonomy under `/topics/` and `/topics/[slug]/`. Full arbitrary taxonomy routes belong to later routing work.

Generated contracts currently include:

- `src/generated/pages.json`
- `src/generated/collections.json`
- `src/generated/topics.json`
- `src/generated/taxonomies.json`
- `src/generated/links.json`
- `src/generated/meta.json`

## CI

GitHub Actions runs the production safety gate on pushes and pull requests to `main`:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

`deploy:check` exports public content, generates indexes, audits the public surface, builds Astro and runs typecheck/tests. For agent/operator workflows, `content:export` and `audit:content` also support `-- --report` to write ignored local JSON reports under `reports/`. `pnpm run content:doctor` / `content:status` runs export, index and audit together and writes `reports/doctor-report.json` with a human-friendly summary for preparing realistic project vaults.

## License

Rock from Space is released under the MIT License. See `LICENSE`.

## Security baseline

The public build must fail before deployment if it contains obvious private material:

- local absolute paths;
- tokens, passwords, API keys or secret-looking values;
- unpublished drafts;
- private frontmatter fields;
- references to ignored folders;
- generated data that points back to private source paths;
- raw HTML or embed tags that are not explicitly allowlisted;
- backend-only environment variable names.

Frontend code must not receive backend-only secrets. If public environment variables are needed later, they should be clearly named and documented.

## Agentic operation

Rock from Space includes portable agent materials:

- `AGENTS.md` for the canonical coding-agent contract;
- `agent/skills/rock-from-space-operator/SKILL.md` for the executive repo-local operator workflow;
- `agent/skills/rfs-obsidian-editor/SKILL.md` for focused RFS vault editing;
- `agent/skills/rfs-privacy-auditor/SKILL.md` for focused public-surface/privacy review;
- `agent/skills/rock-from-space-operator/references/` for command, vault, privacy and agent-format details;
- `agent/prompts/` for repeatable tasks such as publishing from a vault, reviewing public output, adding a collection, troubleshooting failed audits and preparing release notes;
- `agent/checklists/` for pre-deploy, privacy audit, route smoke-test and release verification.

Agents should treat Obsidian vault files as the editorial source, `content/` and `dist/` as public surfaces, and `reports/` as local evidence. They should edit the RFS vault structure directly, run `content:doctor`, then run audit/build checks before declaring work complete.

`pnpm run check` runs Astro validation, TypeScript typechecking and the unit test suite. The test suite includes pure content utilities and integration fixtures for export/index/audit behavior.
