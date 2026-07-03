# AGENTS.md

Operational guide for AI agents working on Rock from Space.

## Project mission

Rock from Space is a generic Obsidian-compatible editorial pipeline plus Astro static rendering toolkit.

It should let users write and curate content in a Markdown/Obsidian editorial vault, export only public content, generate typed indexes, render an Astro site and deploy the resulting `dist/` artifact to production cloud hosting.

The system must remain agnostic:

- no references to personal vaults;
- no hardcoded local user paths;
- no project-specific taxonomies;
- no private source material;
- no assumptions about a specific LLM provider or agent runtime;
- no runtime dependency on the Obsidian app.

## Source boundaries

Expected boundaries:

1. `examples/demo-vault/` — disposable Obsidian-compatible demo vault.
2. Optional external vault — configured by `rfs.config.json`, never assumed.
3. `content/` — public export input for Astro. Treat everything here as publishable.
4. `src/generated/` — generated indexes/contracts consumed by Astro.
5. `dist/` — generated production deployment artifact.

Astro must not read a private vault directly. It should build from `content/` and `src/generated/`.

Local-first describes the editorial/source workflow, not the hosting model. The generated site must be suitable for production cloud hosting or CDN deployment.

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

- `agent/skills/*/SKILL.md` for Hermes-compatible skills that are also readable by other agents;
- `agent/prompts/` for reusable task prompts;
- `agent/checklists/` for verification workflows;
- `docs/plans/` for implementation plans.

These files must not depend on strh's private environment.

## Commands

Use these project commands:

```bash
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
pnpm run preview:prod
```

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
- malformed public frontmatter: `title` must be a non-empty string, `publish` must be boolean, and optional `topics` must be an array of non-empty strings.

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
