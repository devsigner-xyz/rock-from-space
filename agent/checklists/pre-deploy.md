# Pre-deploy checklist

Use before deploying, merging release work, or claiming production readiness.

## Required command gate

From a fresh or clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm run reset:demo
pnpm run content:export -- --report
pnpm run audit:content -- --report
pnpm run deploy:check
git diff --check
```

Expected result:

- [ ] Dependencies install from the lockfile.
- [ ] Demo vault regenerates successfully.
- [ ] Public export succeeds and can write `reports/export-report.json`.
- [ ] Public audit succeeds and can write `reports/audit-report.json`.
- [ ] `deploy:check` passes.
- [ ] `git diff --check` reports no whitespace errors.

## Public surface review

- [ ] `content/` contains only publishable content.
- [ ] `src/generated/*.json` contains no private source paths.
- [ ] `dist/` is generated from `content/` and `src/generated/`.
- [ ] No backend-only secrets or local absolute paths appear in public surfaces.
- [ ] No project-specific demo copy was introduced unless it is configurable sample content.

## Documentation sync

- [ ] `README.md` matches the current command contract.
- [ ] `AGENTS.md` matches current safety and deployment rules.
- [ ] `SECURITY.md` and `docs/deployment/` remain accurate.
- [ ] `agent/skills/`, `agent/prompts/` and `agent/checklists/` remain portable.
- [ ] `docs/plans/` reflects completed and pending phase scope.
