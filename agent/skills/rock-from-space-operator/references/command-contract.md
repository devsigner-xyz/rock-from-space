# Rock from Space command contract

This reference expands the command contract from `AGENTS.md`. `AGENTS.md` remains the canonical root contract; update it first if the command model changes.

## Core commands

Use repository scripts instead of inventing shell pipelines:

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

## Normal edit loop

For documentation, skill, prompt or checklist changes:

```bash
git diff --check
pnpm run test
pnpm run build
pnpm run check
```

For content, privacy, report, export, index or public-surface changes, also run:

```bash
pnpm run content:doctor
pnpm run deploy:check
```

## Generated outputs

These commands may regenerate public outputs:

- `content/`
- `src/generated/`
- `dist/`
- ignored `reports/`

Before summarizing, inspect `git status --short` so generated changes are not confused with source edits.

## Alternate vault/config smoke

Use `RFS_CONFIG_PATH` to test a fixture without overwriting `rfs.config.json`:

```bash
RFS_CONFIG_PATH=examples/configs/realistic-vault.config.json pnpm run build
```

This still regenerates `content/`, `src/generated/` and `dist/` for that run. Restore default demo outputs with:

```bash
pnpm run reset:demo && pnpm run build
```

## Failure rule

If a command is missing or fails, do not claim success. Either fix the contract in code/docs or report the blocker with the real command output.
