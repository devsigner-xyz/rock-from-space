# Agent package format

Rock from Space keeps agent instructions portable and Markdown-first.

## Current format

```text
AGENTS.md
agent/
  skills/
    <skill-name>/
      SKILL.md
      references/
      templates/
      scripts/
  prompts/
  checklists/
```

`AGENTS.md` is the canonical root contract for agents. Repo-local skills are focused operating manuals that point back to `AGENTS.md` rather than overriding it.

## Why Markdown skills

Markdown `SKILL.md` files are readable by humans, Hermes-compatible, and usable by other LLM coding agents even without a specific runtime. This keeps the repository independent from Hermes, Claude, OpenAI, MCP or any vendor-specific agent loader.

## Deferred `.agents/` compatibility

Do not introduce a required `.agents/` directory in this phase. It may be documented later as an optional compatibility layer if a widely useful convention emerges, but the current source of truth remains:

- `AGENTS.md` for root rules;
- `agent/skills/*/SKILL.md` for focused procedures;
- `agent/prompts/` for copyable task prompts;
- `agent/checklists/` for verification gates.

If a future compatibility layer is added, it should reference or generate from these files instead of duplicating conflicting instructions.
