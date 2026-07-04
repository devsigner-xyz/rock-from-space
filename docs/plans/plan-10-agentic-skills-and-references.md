# Plan 10 — Agentic Skills and References

> **For Hermes:** Use this plan to make Rock from Space more agentic without introducing autonomous runtime complexity or a public/admin UI.

**Goal:** Turn the repo-local agent package into a clear, portable system of skills, references, prompts and checklists that most LLM coding agents can read and follow.

**Architecture:** Keep `AGENTS.md` as the canonical root instruction file. Keep repo-local skills under `agent/skills/`, using Markdown-only `SKILL.md` files plus optional `references/`, `templates/` and `scripts/` folders. Do not require a vendor-specific `.agents/` layout unless a later compatibility layer proves useful.

## Direction

Rock from Space should stay portable:

```text
AGENTS.md
README.md
DESIGN.md
docs/
agent/
  skills/
  prompts/
  checklists/
```

There is no universal LLM-agent standard yet. Markdown files with obvious names are the most portable contract. `AGENTS.md` is the nearest common convention; `agent/skills/*/SKILL.md` is Hermes/Claude-skills inspired but still readable by any LLM.

## Current status

As of `3c10f56 feat: modularize agentic skills package`, Plan 10 is advanced but not fully closed:

- Phase 10A is implemented: `rock-from-space-operator` is concise and delegates durable detail to clean references under `agent/skills/rock-from-space-operator/references/`.
- Phase 10B is implemented: `rfs-obsidian-editor` and `rfs-privacy-auditor` exist as focused repo-local skills.
- Phase 10C is mostly implemented: `agent/prompts/execute-agentic-skills-plan.md` exists and the main docs link the agentic package.
- Remaining work should be small alignment slices: keep prompts and checklists synced with the modular skills, remove stale wording when found, and avoid introducing `.agents/` except as documented future compatibility.

## Non-goals

- Do not create autonomous background agents.
- Do not introduce a required `.agents/` directory yet.
- Do not depend on Hermes-specific runtime behavior inside generic repo docs.
- Do not commit stale references that still point to the old admin-panel direction.
- Do not create duplicate instructions that conflict with `AGENTS.md`.

## Phase 10A — Clean the existing operator skill references

### Task 1: Inspect untracked references

**Objective:** Decide whether `agent/skills/rock-from-space-operator/references/` should be incorporated, rewritten or discarded.

**Steps:**

1. Read every file under `agent/skills/rock-from-space-operator/references/`.
2. Identify stale admin-panel or multi-publication language.
3. Keep only durable, generic, Obsidian-first material.
4. Rewrite references to match Plan 07 and the RFS vault contract.

**Verification:**

```bash
rg -n "admin|control panel|multi-publication|profiles|arbitrary vault" agent/skills/rock-from-space-operator/references AGENTS.md README.md docs
```

Stale terms may remain only as explicit non-goals or deferred future work.

### Task 2: Split long knowledge out of SKILL.md

**Objective:** Keep `SKILL.md` actionable and move long stable explanations to references.

**Target shape:**

```text
agent/skills/rock-from-space-operator/
  SKILL.md
  references/
    command-contract.md
    rfs-vault-contract.md
    privacy-model.md
```

`SKILL.md` should remain the executive workflow. References hold detailed rationale and examples.

## Phase 10B — Add focused repo-local skills

### Task 3: Create `rfs-obsidian-editor`

**Path:**

```text
agent/skills/rfs-obsidian-editor/SKILL.md
```

**Purpose:** Safely create/edit content in the RFS-structured Obsidian vault.

**Responsibilities:**

- Use required vault shape: `index.md`, `Notes/`, `Topics/`, `Pages/`, `Assets/`, `Drafts/`, `Private/`.
- Add/repair RFS frontmatter.
- Maintain topics and topic term pages.
- Keep drafts/private material out of public folders.
- Run `pnpm run content:doctor` after edits.
- Report generated routes and warnings.

### Task 4: Create `rfs-privacy-auditor`

**Path:**

```text
agent/skills/rfs-privacy-auditor/SKILL.md
```

**Purpose:** Review public surfaces and reports for leakage.

**Responsibilities:**

- Inspect `content/`, `src/generated/`, `dist/` and `reports/`.
- Interpret `audit-report.json`, `export-report.json` and `doctor-report.json`.
- Detect local paths, secrets, private folders, unpublished drafts, blocked frontmatter and backend env names.
- Run the repo privacy scan/checklists.
- Produce evidence-based findings.

### Task 5: Defer future skills until templates/releases mature

Future candidates:

```text
agent/skills/rfs-template-designer/SKILL.md
agent/skills/rfs-release-manager/SKILL.md
```

Do not add them until the template metadata model and release workflow need specialization.

## Phase 10C — Prompt and docs alignment

### Task 6: Add a short continuation prompt

**Path:**

```text
agent/prompts/execute-agentic-skills-plan.md
```

The prompt should be short enough to paste into a new session and should instruct the agent to load context, avoid deploy/push unless asked, update references/skills, and verify with tests/checks.

Status: implemented. Keep it aligned with the focused skills and current verification contract when Plan 10 changes.

### Task 7: Link the plan

Update:

- `README.md`
- `docs/plans/master-plan.md`
- `agent/skills/rock-from-space-operator/SKILL.md` if useful.

Status: implemented in the main roadmap/docs. Continue to keep `README.md`, `AGENTS.md`, `docs/plans/master-plan.md` and `rock-from-space-operator` aligned when new agent materials are added.

## Done when

- `AGENTS.md` remains the canonical root agent contract.
- `rock-from-space-operator` is concise and points to references.
- `rfs-obsidian-editor` exists and covers vault editing.
- `rfs-privacy-auditor` exists and covers public-surface/privacy review.
- Old admin-panel references are removed or explicitly marked as deferred/non-goal.
- No tool-specific runtime is required to understand the agent package.

## Verification

Run:

```bash
git diff --check
pnpm run test
pnpm run build
pnpm run check
```

For safety-sensitive changes, also run:

```bash
pnpm run content:doctor
pnpm run deploy:check
```
