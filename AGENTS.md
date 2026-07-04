# AGENTS.md

Operational guide for AI agents working on Rock from Space.

## Project mission

Rock from Space is an Obsidian-first editorial pipeline plus Astro static rendering toolkit for a Rock from Space structured Markdown vault.

It should let users and LLM agents write and curate content in the RFS vault structure, export only public content, generate typed indexes, render an Astro site and deploy the resulting `dist/` artifact to production cloud hosting.

The public repo must remain content/domain agnostic:

- no references to personal vaults;
- no hardcoded local user paths;
- no project-specific taxonomies;
- no private source material;
- no assumptions about a specific LLM provider or agent runtime;
- no runtime dependency on the Obsidian app.

The vault contract is intentionally opinionated. Do not try to support every possible Obsidian layout as a core feature. If someone wants to use Rock from Space, they should adopt the RFS vault structure and frontmatter conventions first; migration helpers can come later.

Rock from Space project surfaces must use English naming by default: config keys, example config values, collection/taxonomy names, routes, labels, docs, plans, tests and agent materials. Editorial vault content may be written in any language; do not rewrite user-authored vault prose just to make it English. When a non-English real vault exposes a generic product gap, translate the durable Rock from Space example to an English, fictional equivalent before committing it.

## Source boundaries

Expected boundaries:

1. `examples/demo-vault/` — disposable RFS-structured Obsidian-compatible demo vault.
2. Optional external vault — configured by `rfs.config.json`, never assumed.
3. `content/` — public export input for Astro. Treat everything here as publishable.
4. `src/generated/` — generated indexes/contracts consumed by Astro.
5. `dist/` — generated production deployment artifact.

Astro must not read a private vault directly. It should build from `content/` and `src/generated/`.

Local-first describes the editorial/source workflow, not the hosting model. The generated site must be suitable for production cloud hosting or CDN deployment.

## Required RFS vault structure

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

- `index.md` is the public home/source page when publishable.
- `Notes/` is the default publishable note collection.
- `Topics/` contains optional taxonomy term pages.
- `Pages/` is reserved for future stable pages such as about/now/landing pages.
- `Assets/` is reserved for public assets once asset handling is implemented.
- `Drafts/` is non-public by default.
- `Private/` must never be public.

Agents should edit this structure directly through Markdown/frontmatter, then verify with `pnpm run content:doctor`, build/check commands and privacy scans. Do not create an admin panel, hosted CMS, public admin route or arbitrary vault-shape adapter unless a later plan explicitly reintroduces it.

## Architecture principles

- TypeScript-first for app code, Astro code and Node/project tooling when JavaScript would otherwise be used.
- ESM-first Node setup.
- Strict TypeScript once `tsconfig.json` exists.
- Small modules with clear responsibilities.
- Prefer pure functions for parsing, normalization, slugging, indexing and auditing.
- Keep side effects at the edges: filesystem reads/writes, process exit, logging.
- Validate unknown input with schemas before processing.
- Make export/index/audit deterministic and safe to rerun.
- Do not hide broken links, private leaks or malformed frontmatter in UI; surface them via audits.

## Planned technical baseline

When implemented, prefer:

- package manager: `pnpm`;
- runtime/tooling language: TypeScript;
- script runner: `tsx` or compiled TypeScript;
- validation: schema-based validation, e.g. Zod or equivalent;
- static site: Astro, static output by default;
- tests: fast unit tests for parser/export/index/audit logic;
- formatting/linting: one explicit toolchain, preferably fast and CI-friendly.

Avoid:

- untyped JavaScript utility scripts;
- hidden global config mutation;
- shell-dependent parsing when TypeScript code is clearer;
- direct string concatenation for paths where safe path utilities are needed;
- generated files that silently include private source paths.

## Agentic package

The repo should include portable agent materials:

- `agent/skills/rock-from-space-operator/SKILL.md` for Hermes-compatible skills that are also readable by other agents;
- `agent/prompts/` for reusable task prompts covering publish/review/collection/audit/release work;
- `agent/checklists/` for pre-deploy, privacy audit, route smoke-test and release workflows;
- `docs/plans/` for implementation plans.
- `docs/guides/` for human and agent-facing operating guides.

These files must not depend on strh's private environment.

Agentic operation is optional and portable. The repository must remain usable by humans and other automation without Hermes or any specific LLM provider.

Agentic operation is a product primitive: repo-local skills, prompts, checklists, `AGENTS.md` and `DESIGN.md` should be good enough for an LLM to safely edit the RFS vault, diagnose publication state and verify public output.

## Commands

Use these project commands:

```bash
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
pnpm run preview:prod
```

To test a fixture or alternate vault config without replacing `rfs.config.json`, scope the command with `RFS_CONFIG_PATH`, for example:

```bash
RFS_CONFIG_PATH=examples/configs/realistic-vault.config.json pnpm run build
```

This is non-destructive to the config file, but it still regenerates `content/`, `src/generated/` and `dist/` for that run. Restore default demo outputs with `pnpm run reset:demo && pnpm run build` when needed.

For UI/routing changes:

```bash
pnpm run preview -- --host 127.0.0.1 --port 4321
```

Smoke at least:

- `/`
- `/notes/`
- one `/notes/[slug]/` page
- `/topics/`
- one `/topics/[slug]/` page
- one configured non-`notes` collection route when `collections` includes another public collection

If commands are not implemented yet, do not pretend they passed. Update docs/plans or implement the missing command.

## Security and privacy rules

Before declaring work complete, verify that public outputs do not contain:

- local absolute paths;
- API keys, tokens, secrets or passwords;
- private frontmatter fields;
- unpublished drafts;
- references to ignored vault folders;
- accidental personal/project-specific copy;
- backend-only environment variable names in frontend bundles;
- generated indexes that point to private source files;
- malformed public frontmatter: `title` must be a non-empty string, `publish` must be boolean, and optional `topics` must be an array of non-empty strings;
- raw HTML or embed tags unless explicitly allowlisted by `privacy.allowedEmbedDomains`;
- backend-only environment variable names.

Frontmatter contract:

- parse source Markdown as real Obsidian-compatible YAML, including multiline lists and extra editorial properties;
- normalize only fields listed in the matching collection schema into `content/`;
- keep blocked/private fields fail-closed for publishable items;
- treat `notes` as a collection and `topics` as the current primary taxonomy from the configured taxonomy field;
- allow `publish.requireValue` to be a boolean, string or number, while normalizing exported public Markdown to `publish: true`;
- generate `/topics/[slug]/` from primary taxonomy metadata even when no optional `Topics/<topic>.md` term page exists;
- write `src/generated/collections.json` and `src/generated/taxonomies.json` together with `pages.json`, `topics.json`, `links.json` and `meta.json`;
- document that full arbitrary taxonomy route folders remain later routing work.

Security defaults:

- Do not use secrets in client-side Astro code.
- Public env vars must be explicitly documented.
- Treat vault Markdown/frontmatter as untrusted input.
- Escape or sanitize rendered content where applicable.
- Avoid raw HTML rendering unless audited and sanitized.
- Use allowlists rather than blocklists for public export.
- Fail closed when config is missing or ambiguous.

## CI rules

GitHub Actions runs `.github/workflows/ci.yml` on pushes and pull requests to `main` with:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

Keep `deploy:check` as the canonical CI gate for production readiness: public export, index generation, content audit, Astro build, typecheck and tests. Use `pnpm run content:export -- --report` and `pnpm run audit:content -- --report` when an agent or local operator needs structured JSON evidence under ignored `reports/`.

## Deployment rules

Production deployment must be preceded by:

```bash
pnpm run deploy:check
```

The deploy check should eventually include:

1. export public content;
2. generate indexes;
3. audit content/privacy;
4. Astro build;
5. typecheck/tests.

`pnpm run check` is expected to include the fast unit test suite. Keep export/index/audit logic testable through reusable modules and integration fixtures, with CLI scripts as thin wrappers.

Do not deploy unless explicitly asked.

## Documentation sync rules

When changing architecture, commands, pipeline behavior, generated files or deployment assumptions, update these together:

- `README.md` for human-facing overview;
- `AGENTS.md` for agent-facing workflow and safety;
- `DESIGN.md` when visual/UI conventions change;
- `docs/plans/*.md` when roadmap or phase scope changes;
- `agent/skills/*/SKILL.md` when agent procedures change.

## Git rules

- Do not commit unless explicitly asked.
- Do not deploy unless explicitly asked.
- Keep generated outputs clearly separated from source files.
- Before committing in future, show `git status --short` and summarize generated/deleted files.
