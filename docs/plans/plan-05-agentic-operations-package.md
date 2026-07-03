# Plan 05 — Agentic Operations Package

## Goal

Make LLM-assisted operation portable, explicit and safe without making Rock from Space depend on Hermes, Obsidian app runtime, OpenAI, Claude or any other provider.

The repo should include reusable agent materials that humans can read and agents can execute carefully.

## Product principles

- Agent materials are part of the product, not private automation glue.
- Instructions must be provider-agnostic where possible.
- Hermes compatibility is useful, but not a runtime requirement.
- Every agent workflow must respect source boundaries and public/private separation.
- Agents must run audit/build checks before claiming success.

## Deliverables

- `agent/skills/rock-from-space-operator/SKILL.md` complete enough for repo operation.
- Generic prompts for common tasks.
- Checklists for export/audit/deploy.
- Safe task examples.
- Optional future MCP/control-surface design note.

## Proposed files

```text
agent/skills/rock-from-space-operator/SKILL.md
agent/prompts/publish-from-vault.md
agent/prompts/review-public-output.md
agent/prompts/add-collection.md
agent/checklists/pre-deploy.md
agent/checklists/privacy-audit.md
agent/checklists/release.md
docs/plans/plan-07-local-editorial-control-panel.md
```

## Tasks

### 1. Complete operator skill

The skill should include:

- repo mission;
- source boundaries;
- command contract;
- export/index/audit/build sequence;
- privacy scan patterns;
- commit/deploy rules.

### 2. Add prompts

Prompts should be short and task-specific:

- review generated public output;
- add a new collection;
- troubleshoot failed audit;
- prepare release notes.

### 3. Add checklists

Checklists should be machine- and human-readable:

- pre-deploy gate;
- public privacy audit;
- route smoke test;
- release readiness.

### 4. Optional MCP/control-surface design

Do not implement MCP yet. Document possible operations:

- list vault notes;
- update frontmatter;
- run dry-run export;
- run audit;
- return report JSON from `content:export -- --report` and `audit:content -- --report`.

The design must keep file ownership explicit and avoid exposing private vault data to a public site.

## Verification

Run:

```bash
pnpm run deploy:check
```

Manual checks:

- agent files contain no private paths;
- no provider-specific requirement is presented as mandatory;
- commands match `package.json`;
- safety rules match `AGENTS.md`.

## Done when

- A new coding agent can operate the repo from `AGENTS.md` + `agent/skills/*`.
- Prompts and checklists cover common safe tasks.
- Agentic operation is documented as optional and portable.
