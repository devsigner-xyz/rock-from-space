---
name: rock-from-space-operator
description: Operate a Rock from Space project: import content into an Obsidian-compatible vault, export public content, generate indexes, audit privacy, and verify Astro builds.
---

# Rock from Space Operator

## When to use

Use this skill when working inside a Rock from Space repository or adapting its Obsidian-compatible Markdown → Astro publishing pipeline.

## Core rules

- Keep the project agnostic: no private paths, personal vault assumptions, or domain-specific taxonomies.
- Treat `examples/demo-vault/` as disposable.
- Treat `content/` as public.
- Treat `src/generated/` as generated data for Astro.
- Astro must build from `content/` and `src/generated/`, not from a private vault.
- Run privacy/content audit before claiming success.

## Standard workflow

```bash
pnpm run reset:demo
pnpm run import:demo
pnpm run content:export
pnpm run content:index
pnpm run audit:content
pnpm run build
pnpm run check
```

If commands are not implemented yet, follow `docs/plans/master-plan.md` and the phase-specific plans.

## Verification checklist

- Demo vault can be regenerated.
- Public content is allowlisted.
- No drafts/private fields are exported.
- Generated JSON exists.
- Astro build passes.
- No private paths or obvious secrets appear in public outputs.
