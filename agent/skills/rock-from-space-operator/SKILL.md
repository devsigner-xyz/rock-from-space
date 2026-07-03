---
name: rock-from-space-operator
description: Operate a Rock from Space project: export public content from an Obsidian-compatible Markdown vault, generate indexes, audit privacy, verify Astro builds, and prepare safe commits or releases.
---

# Rock from Space Operator

## When to use

Use this skill when working inside a Rock from Space repository or adapting its Obsidian-compatible Markdown → Astro publishing pipeline.

This skill is Hermes-compatible, but the instructions are intentionally portable. Do not assume a specific agent runtime, model provider, private vault, or local machine path.

## Mission

Rock from Space is a generic editorial publishing toolkit:

1. write and curate content in an Obsidian-compatible Markdown vault;
2. export only explicitly public content into `content/`;
3. generate typed indexes in `src/generated/`;
4. audit privacy and content integrity;
5. render a static Astro site into `dist/`;
6. deploy the generated artifact to static/cloud hosting only after the deploy gate passes.

## Source boundaries

Respect these boundaries at all times:

- `examples/demo-vault/` is disposable demo input and may be regenerated.
- An external vault is optional and must be configured in `rfs.config.json`; never infer a personal path.
- `content/` is public exported content. Treat everything here as publishable.
- `src/generated/` is generated public data for Astro.
- `dist/` is generated production output.
- Astro must read from `content/` and `src/generated/`, not from a private vault.
- `reports/` is ignored local evidence from report commands.

Do not introduce domain-specific taxonomies, personal project names, private source material, or hardcoded local paths.

## Command contract

Use the repository scripts rather than inventing commands:

```bash
pnpm install --frozen-lockfile
pnpm run reset:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run build
pnpm run check
pnpm run deploy:check
pnpm run preview:prod
```

`deploy:check` is the canonical production-readiness gate. It should include export, index generation, public audit, Astro build, typecheck and tests.

If a documented command is missing or fails, do not claim success. Fix the contract or update the relevant plan/docs.

## Standard operation sequence

For content or pipeline work:

1. Inspect `git status --short --branch` and `rfs.config.json`.
2. Confirm the task does not require reading a private vault unless the configured path is explicit.
3. Make the smallest portable change.
4. Run:

```bash
pnpm run reset:demo
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run deploy:check
```

5. Inspect generated changes in `content/`, `src/generated/`, `dist/` and ignored `reports/` as relevant.
6. Run `git diff --check` before commit.
7. Run the repository privacy scan from `agent/checklists/privacy-audit.md` or `agent/checklists/release.md`.

## Privacy and safety rules

Before declaring work complete, verify public surfaces do not contain:

- local absolute paths;
- unpublished drafts;
- ignored vault folders;
- private frontmatter fields;
- credential-like values;
- backend-only environment variable names;
- generated indexes pointing to private source files;
- personal or project-specific copy not present in demo/config input.

Treat Markdown and frontmatter as untrusted input. Use allowlists for exported fields and fail closed on blocked fields.

## Adding or changing collections

When adding a collection:

1. Update `rfs.config.json` with `name`, `source`, `route`, `template` and schema.
2. Add demo vault content for the collection only if it is generic and disposable.
3. Ensure export normalizes only schema-approved public fields.
4. Ensure index generation includes collection metadata without private source paths.
5. Add or update Astro routes/templates using generic copy.
6. Add tests/fixtures for the collection behavior.
7. Run `pnpm run deploy:check`.

Do not make `topics` a primary collection unless the product contract changes; it is a taxonomy by default.

## Review public output

When reviewing generated output:

- read `reports/export-report.json` and `reports/audit-report.json` if generated;
- inspect representative files in `content/`, `src/generated/` and `dist/`;
- smoke `/`, `/notes/`, one note route, `/topics/`, one topic route, and any configured non-`notes` collection route;
- summarize concrete evidence, not assumptions.

## Commit and deploy rules

- Do not commit unless explicitly asked.
- Do not deploy unless explicitly asked.
- Before commit: run the requested verification gate, `git diff --check`, and privacy scan.
- Keep generated outputs clearly separated from source changes in the summary.
- After push: verify branch status and CI when GitHub Actions is available.

## Useful repository materials

- `AGENTS.md` — canonical agent rules.
- `README.md` — human-facing overview and commands.
- `SECURITY.md` — security model.
- `docs/deployment/` — deployment/smoke guidance.
- `agent/prompts/` — reusable task prompts.
- `agent/checklists/` — pre-deploy, privacy, route smoke and release checklists.
- `docs/plans/` — roadmap and phase scopes.
