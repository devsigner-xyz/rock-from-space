---
name: rock-from-space-operator
description: Operate a Rock from Space project: edit the RFS-structured Obsidian vault, export public content, generate indexes, audit privacy, verify Astro builds, and prepare safe commits or releases.
---

# Rock from Space Operator

## When to use

Use this skill when working inside a Rock from Space repository or adapting its Obsidian-first Markdown → Astro publishing pipeline.

This skill is Hermes-compatible, but the instructions are intentionally portable. Do not assume a specific agent runtime, model provider, private vault, or local machine path.

## Mission

Rock from Space is an opinionated Obsidian-first publishing toolkit:

1. write and curate content in a Rock from Space structured Obsidian-compatible vault;
2. operate that vault with humans and LLM agents;
3. export only explicitly public content into `content/`;
4. generate typed indexes in `src/generated/`;
5. audit privacy and content integrity;
6. render a static Astro site into `dist/`;
7. deploy the generated artifact to static/cloud hosting only after the deploy gate passes.

The project is not a generic importer for arbitrary Obsidian layouts. If a user wants to use RFS, they should adopt the RFS vault structure and frontmatter conventions first. Migration helpers may come later, but do not invent broad vault-shape support during normal operation.

## Required RFS vault structure

Default source vault shape:

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

Semantics:

- `index.md` — public home/source page when publishable.
- `Notes/` — default publishable notes collection.
- `Topics/` — optional topic/taxonomy term pages.
- `Pages/` — future stable pages such as about/now/landing/archive pages.
- `Assets/` — future public assets only.
- `Drafts/` — non-public by default.
- `Private/` — never public.

Do not map random personal-vault folders into public output unless a plan explicitly adds a safe migration/adaptation layer.

## Source boundaries

Respect these boundaries at all times:

- `examples/demo-vault/` is disposable RFS-structured demo input and may be regenerated.
- An external vault is optional and must be configured in `rfs.config.json`; never infer a personal path.
- `content/` is public exported content. Treat everything here as publishable.
- `src/generated/` is generated public data for Astro.
- `dist/` is generated production output.
- `reports/` is ignored local evidence from report commands.
- Astro must read from `content/` and `src/generated/`, not from a private vault.

Do not introduce domain-specific taxonomies, personal project names, private source material, or hardcoded local paths.

## Focused repo-local skills

Use the focused skills when a task narrows beyond general operation:

- `agent/skills/rfs-obsidian-editor/SKILL.md` — create, edit or repair RFS vault Markdown/frontmatter.
- `agent/skills/rfs-privacy-auditor/SKILL.md` — inspect public surfaces, reports and build output for privacy leaks.

This skill remains the executive workflow. `AGENTS.md` remains the canonical root contract.

## References

Long-lived details live under `references/`:

- `references/command-contract.md`
- `references/rfs-vault-contract.md`
- `references/privacy-model.md`
- `references/agent-package-format.md`

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
pnpm run content:doctor
pnpm run content:status
pnpm run build
pnpm run check
pnpm run deploy:check
pnpm run preview:prod
```

`content:doctor` is the normal agent/operator diagnostic command. It exports public content, regenerates indexes, runs audit and writes ignored local reports.

`deploy:check` is the canonical production-readiness gate. It should include export, index generation, public audit, Astro build, typecheck and tests.

If a documented command is missing or fails, do not claim success. Fix the contract or update the relevant plan/docs.

## Standard operation sequence

For content or pipeline work:

1. Inspect `git status --short --branch` and `rfs.config.json`.
2. Confirm the task does not require reading a private vault unless the configured path is explicit.
3. Make the smallest portable change.
4. If editing vault content/frontmatter, keep edits inside the RFS structure and avoid `Drafts/` / `Private/` publication.
5. Run:

```bash
pnpm run content:doctor
pnpm run build
pnpm run check
```

6. For release/commit confidence, also run:

```bash
pnpm run deploy:check
git diff --check
```

7. Run the repository privacy scan from `agent/checklists/privacy-audit.md` or `agent/checklists/release.md` before commit/release.

## Frontmatter conventions

Recommended RFS-native public note:

```yaml
---
title: "Example note"
publish: true
topics:
  - Markdown
summary: "Short public summary."
template: note
order: 10
featured: false
image: ""
imageAlt: ""
imageCaption: ""
---
```

Current implementation may not render every optional field yet. Do not rely on a field publicly until the collection schema, pipeline and template support it.

Rules:

- `title` must be a non-empty string.
- `publish` should be `true` for RFS-native public notes.
- `topics` should be an array of non-empty strings.
- Optional template/media/order fields must be allowlisted in the collection schema before export.
- Blocked private fields fail closed.

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

1. Prefer fitting it into the RFS vault structure first (`Notes/`, `Pages/`, future documented folders).
2. Update `rfs.config.json` with `name`, `source`, `route`, `template` and schema.
3. Add demo vault content for the collection only if it is generic and disposable.
4. Ensure export normalizes only schema-approved public fields.
5. Ensure index generation includes collection metadata without private source paths.
6. Add or update Astro routes/templates using generic copy.
7. Add tests/fixtures for the collection behavior.
8. Run `pnpm run deploy:check`.

Do not make `topics` a primary collection unless the product contract changes; it is a taxonomy by default.

## Review public output

When reviewing generated output:

- run `pnpm run content:doctor`;
- read `reports/doctor-report.json`, `reports/export-report.json` and `reports/audit-report.json` if generated;
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
- `DESIGN.md` — editorial/static-site design contract.
- `SECURITY.md` — security model.
- `docs/guides/preparing-a-project-vault.md` — RFS vault preparation guide.
- `docs/guides/obsidian-authoring-workflow.md` — Obsidian-first human/agent authoring workflow.
- `docs/deployment/` — deployment/smoke guidance.
- `agent/skills/rfs-obsidian-editor/SKILL.md` — focused source-vault editing workflow.
- `agent/skills/rfs-privacy-auditor/SKILL.md` — focused public-surface/privacy review workflow.
- `agent/skills/rock-from-space-operator/references/` — command, vault, privacy and agent-format details.
- `agent/prompts/` — reusable task prompts.
- `agent/checklists/` — pre-deploy, privacy, route smoke and release checklists.
- `docs/plans/` — roadmap and phase scopes.
