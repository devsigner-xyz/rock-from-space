# Plan 01 — Foundation Scaffold

## Goal

Create the clean project foundation for Rock from Space without implementing the full pipeline yet.

This phase establishes the repo shape, naming, source boundaries, demo vault convention, configuration draft and agent-facing operating docs.

## Deliverables

- Base directory structure.
- `README.md` with product definition and planned commands.
- `AGENTS.md` with agent operating rules.
- `DESIGN.md` with neutral design principles and machine-readable tokens.
- `rfs.config.json` draft.
- `examples/demo-vault/` skeleton.
- `content/.gitkeep`.
- `src/generated/.gitkeep`.
- `agent/skills/`, `agent/prompts/`, `agent/checklists/` skeleton.
- Initial portable skill stub.

## Tasks

### 1. Create base folders

Create:

```text
content/
examples/demo-vault/
scripts/
src/generated/
src/layouts/
src/pages/
src/styles/
agent/skills/rock-from-space-operator/
agent/prompts/
agent/checklists/
docs/plans/
tests/fixtures/
```

### 2. Add neutral documentation

Files:

- `README.md`
- `AGENTS.md`
- `DESIGN.md`

Rules:

- TypeScript-first baseline for Astro and project tooling;
- security/privacy-by-design from the first scaffold;
- SOLID-ish module boundaries for future scripts;
- no personal paths;
- no private project references;
- no references to unrelated private or domain-specific projects;
- no domain-specific examples except generic notes/topics.

### 3. Add `rfs.config.json` draft

Minimum fields:

```json
{
  "site": {
    "title": "Rock from Space Demo",
    "description": "An Obsidian-compatible Markdown vault rendered with Astro.",
    "language": "en",
    "url": "https://example.com",
    "base": "/"
  },
  "vault": {
    "path": "examples/demo-vault",
    "mode": "managed",
    "allow": ["index.md", "Notes/**", "Topics/**"],
    "ignore": [".obsidian/**", "**/Private/**"]
  },
  "publish": {
    "requireField": "publish",
    "requireValue": true,
    "output": "content"
  },
  "routes": {
    "notes": "/notes",
    "topics": "/topics"
  },
  "privacy": {
    "forbiddenPatterns": ["/home/", "password", "secret", "api_key", "token"]
  },
  "deploy": {
    "target": "static",
    "output": "dist",
    "predeploy": ["content:export", "content:index", "audit:content", "build"]
  }
}
```

### 4. Add demo vault seed notes

Initial notes:

```text
examples/demo-vault/index.md
examples/demo-vault/Notes/Obsidian compatible publishing.md
examples/demo-vault/Notes/Astro template engine.md
examples/demo-vault/Topics/Markdown.md
examples/demo-vault/Topics/Privacy.md
```

Every public note should include:

```yaml
---
title: ""
publish: true
topics: []
---
```

### 5. Add first portable skill

Create:

`agent/skills/rock-from-space-operator/SKILL.md`

Purpose:

- explain source boundaries;
- list commands;
- describe safe import/export workflow;
- require audit before declaring success.

### 6. Add placeholder command contract

Do not fake implementation. If scripts are not implemented yet, docs should say “planned command”.

Later phases will add actual commands to `package.json`.

## Verification

After this phase:

```bash
find . -maxdepth 4 -type f | sort
```

Manual checks:

- project has no private paths;
- docs mention bidirectional import/export;
- agent docs are portable;
- demo vault exists and is safe/fictitious;
- all files are plain text and easy to inspect;
- README, AGENTS and DESIGN encode TypeScript-first, security-first and cloud-ready principles.

## Done when

- A new contributor or agent can understand the project from README + AGENTS + master plan.
- The folder structure exists.
- The next phase can implement scripts without deciding architecture again.
