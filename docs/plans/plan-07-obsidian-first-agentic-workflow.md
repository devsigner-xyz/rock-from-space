# Plan 07 — Obsidian-First Agentic Workflow

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make Rock from Space excellent as a strict Obsidian-first publishing system operated by LLM agents, without building a separate admin panel or supporting arbitrary vault structures.

**Architecture:** Obsidian remains the only editorial/admin UI. Rock from Space defines a required vault structure, frontmatter contract, agent skills, prompts, checklists, diagnostics and build pipeline. Agents operate the vault and repo through documented file contracts, not through a custom CMS.

**Tech Stack:** Obsidian-compatible Markdown, YAML frontmatter, TypeScript CLI pipeline, Astro static output, Vitest, portable repo-local agent skills/prompts/checklists.

---

## Product direction

Rock from Space is not a generic importer for any possible Obsidian vault layout.

It is an opinionated publishing system:

```text
RFS-structured Obsidian vault
        ↓ edited by humans and LLM agents
RFS export/index/audit pipeline
        ↓
Astro static website
```

If a user wants to use Rock from Space, they should adopt the Rock from Space vault structure and frontmatter conventions. Later plans may add migration helpers, validation autofixes or optional adapters, but the core product should remain strict and agent-friendly.

## Required vault shape

Default RFS vault structure:

```text
index.md
Notes/
Topics/
Pages/
Assets/
Drafts/
Private/
```

Initial semantics:

- `index.md` — public home/source page when `publish: true`.
- `Notes/` — default publishable notes collection.
- `Topics/` — optional taxonomy term pages; topic routes are generated even without term pages.
- `Pages/` — future stable pages such as about, now, uses, archive, landing-style pages.
- `Assets/` — public assets only, once asset handling is implemented.
- `Drafts/` — non-public by default.
- `Private/` — never public.

The demo and realistic fixtures should model this structure. Docs should teach this structure as the expected way to use RFS.

## Required frontmatter direction

Baseline public note:

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

Current implementation does not need to support every field immediately. The plan is to make these fields first-class gradually:

- `template` — chooses public rendering template later.
- `summary` — card/meta description.
- `order` — manual ordering inside indexes/collections.
- `featured` — homepage/featured content selection.
- `image`, `imageAlt`, `imageCaption` — public image metadata.

## Non-goals

- No local/admin web panel in this phase.
- No hosted CMS.
- No public admin route.
- No support for arbitrary personal-vault structures as a core promise.
- No multi-publication profile system in this phase.
- No Obsidian plugin yet.
- No full Markdown editor outside Obsidian.

## Agentic operating model

The repo itself must contain enough operational knowledge for an LLM agent to safely run the project:

- `AGENTS.md` — canonical agent rules and source boundaries.
- `DESIGN.md` — visual/editorial design contract.
- `agent/skills/rock-from-space-operator/SKILL.md` — repo-local operator skill.
- Future `agent/skills/rfs-obsidian-editor/SKILL.md` or references — how to edit an RFS vault safely.
- `agent/prompts/` — repeatable prompts for publishing, reviewing, adding content and fixing audit failures.
- `agent/checklists/` — predeploy, privacy audit, route smoke, release.
- `docs/guides/` — human-facing usage docs.

Agents should use Obsidian/vault files as the editorial surface, then run `content:doctor`, `build`, `check` and privacy scans as evidence.

## Phase 07A — Make the RFS vault contract explicit

### Task 1: Rename and reframe Plan 07

**Objective:** Replace the local admin/control-panel concept with this Obsidian-first agentic workflow plan.

**Files:**

- Rename: `docs/plans/plan-07-local-editorial-control-panel.md` → `docs/plans/plan-07-obsidian-first-agentic-workflow.md`
- Modify: `docs/plans/master-plan.md`
- Modify: `README.md`

**Verification:**

```bash
git diff --check
```

### Task 2: Update the project contract docs

**Objective:** Make AGENTS/README/DESIGN say that RFS expects its own vault structure instead of arbitrary Obsidian shapes.

**Files:**

- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `DESIGN.md`
- Modify: `docs/guides/preparing-a-project-vault.md`

**Verification:**

Search for stale admin-panel language and ensure it is either removed or marked future/deferred.

### Task 3: Strengthen repo-local skills

**Objective:** Make `rock-from-space-operator` explicitly cover Obsidian-first RFS vault operation.

**Files:**

- Modify: `agent/skills/rock-from-space-operator/SKILL.md`
- Optional future create: `agent/skills/rock-from-space-operator/references/obsidian-first-workflow.md`

**Verification:**

The skill should tell an agent how to:

- respect the required vault structure;
- edit frontmatter safely;
- run `content:doctor`;
- interpret reports;
- avoid publishing private folders;
- avoid inventing arbitrary vault mappings.

## Phase 07B — Improve Obsidian-native authoring

### Task 4: Add Obsidian authoring guide

**Objective:** Document how humans and agents should create/edit content in the RFS vault.

**Files:**

- Create: `docs/guides/obsidian-authoring-workflow.md`
- Link from: `README.md`
- Link from: `AGENTS.md`

**Content:**

- required folder structure;
- frontmatter fields;
- publish/draft workflow;
- topic term pages;
- private/draft boundaries;
- how to use `content:doctor` after editing;
- how LLM agents should propose and verify edits.

### Task 5: Add Obsidian templates as docs artifacts

**Objective:** Provide copyable Obsidian note templates without building a UI.

**Files:**

- Create: `docs/obsidian-templates/note.md`
- Create: `docs/obsidian-templates/topic.md`
- Create: `docs/obsidian-templates/page.md`
- Create: `docs/obsidian-templates/collection-item.md`

**Rules:**

Templates should be generic, English, privacy-safe and compatible with the current schema. Future fields may be included but marked optional.

### Task 6: Add a Markdown doctor report

**Objective:** Make diagnostics easy to read from Obsidian or paste into an LLM task.

**Files:**

- Modify: `scripts/content-doctor.ts`
- Test: `tests/pipeline.test.ts` or add a focused CLI/report test if CLI tests exist later.

**Target output:**

- Keep `reports/doctor-report.json`.
- Add `reports/doctor-report.md`.
- Summarize public/draft/ignored counts, failures, warnings, broken links and next actions.

## Phase 07C — Metadata/template model

### Task 7: Promote optional editorial metadata

**Objective:** Make future template assignment possible through frontmatter while keeping current output safe.

**Candidate fields:**

- `template`
- `summary`
- `order`
- `featured`
- `image`
- `imageAlt`
- `imageCaption`

**Rules:**

- Fields must be allowlisted per collection schema.
- Invalid public values should fail in audit or normalize safely.
- Do not render a template that has not been implemented.

### Task 8: Document template assignment before implementing templates

**Objective:** Avoid premature UI/template complexity.

**Files:**

- Create: `docs/guides/templates-and-frontmatter.md`
- Modify: `DESIGN.md` if new visual template types become stable.

**Initial template concepts:**

- `note`
- `essay`
- `page`
- `index`
- `profile`
- `landing`

## Done when

- No roadmap text presents a local admin panel as the next direction.
- RFS docs clearly say users should adopt the RFS vault structure.
- The repo-local skill tells agents how to operate the RFS vault safely.
- Human docs explain Obsidian-first authoring and doctor/build workflow.
- The next implementation work is docs/templates/doctor-report, not an admin UI.

## Verification checklist

Before merging this direction:

```bash
git diff --check
pnpm run test
pnpm run build
pnpm run check
```

Also run a text search for stale language:

```bash
rg -n "admin|control panel|arbitrary vault|multi-publication|profiles" README.md AGENTS.md DESIGN.md docs agent
```

Stale terms may remain only when explicitly marked as future/deferred/non-goal.
