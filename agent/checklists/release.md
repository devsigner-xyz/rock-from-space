# Release checklist

Use this checklist before tagging, publishing or deploying Rock from Space. It is intentionally agent-readable and maintainer-readable.

## 1. Scope and release decision

- [ ] Release purpose is clear: patch, minor feature, documentation update or first public release.
- [ ] Version/tag decision is made.
- [ ] License is present and matches the release notes. Current repository license: MIT.
- [ ] Known non-blocking work is captured in `docs/plans/`.

## 2. Fresh clone verification

From a clean checkout, run:

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
```

Expected result:

- [ ] Demo vault can be regenerated.
- [ ] Public content export succeeds.
- [ ] Generated indexes are produced.
- [ ] Public audit passes.
- [ ] Astro build produces `dist/`.
- [ ] Typecheck and tests pass.

## 3. Privacy and public-surface scan

Scan tracked source files and public build artifacts while excluding dependency, VCS, Astro cache, local report and lockfile noise.

Recommended local scan:

```bash
pattern="$(printf '%s%s' Watch Out)|$(printf '%s%s' watch out)|$(printf '%s_%s_%s' SUPABASE SERVICE ROLE)|$(printf '%s_%s' SERVICE ROLE)|$(printf '%s://|%s://' postgres postgresql)|password[[:space:]_:-]*[=:]|secret[[:space:]_:-]*[=:]|api_key[[:space:]_:-]*[=:]|token[[:space:]_:-]*[=:]"
git grep -n -I -E "$pattern" -- ':!node_modules' ':!.git' ':!.astro' ':!dist' ':!reports' ':!pnpm-lock.yaml'
```

Also check for local absolute paths in public surfaces:

```bash
git grep -n -I -E '/Users/|/home/|C:\\Users\\' -- content src/generated dist ':!pnpm-lock.yaml'
```

Expected result:

- [ ] Optional local JSON reports under ignored `reports/` are generated when an agent/operator needs structured evidence.
- [ ] No private project names or private source paths in public output.
- [ ] No credential-like values in source or generated public artifacts.
- [ ] No unpublished draft content in `content/`, `src/generated/` or `dist/`.
- [ ] Generated indexes do not point to private source files.

## 4. Documentation and agent package

- [ ] `README.md` reflects current commands and project status.
- [ ] `AGENTS.md` reflects current safety and deployment rules.
- [ ] `docs/deployment/` is current for the supported hosting path.
- [ ] `docs/plans/` reflects completed and remaining work.
- [ ] `agent/skills/`, `agent/prompts/` and `agent/checklists/` are portable and free of private environment assumptions.
- [ ] `agent/checklists/pre-deploy.md`, `privacy-audit.md` and `route-smoke-test.md` match the current command contract.

## 5. Demo evidence

- [ ] Demo screenshots or preview notes are updated if used in the release.
- [ ] Screenshot paths or assets do not reveal a private machine path.
- [ ] The demo still uses disposable content only.

## 6. GitHub and CI

- [ ] GitHub Actions is green for `main` or the release branch.
- [ ] The release commit is pushed.
- [ ] The tag is created only after the local release gate and CI pass.
- [ ] Release notes mention known limitations and any release blockers.
