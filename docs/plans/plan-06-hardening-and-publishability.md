# Plan 06 — Hardening and Publishability

## Goal

Make Rock from Space stable enough for public release: clear license, contribution workflow, release checklist, stronger tests, documentation and examples.

Some hardening is already implemented: Vitest, integration fixtures, deterministic indexes, GitHub Actions CI and `deploy:check`.

## Deliverables

- Tests for export/index/audit.
- Fixtures for happy paths and negative paths.
- Expanded README or docs site.
- Example screenshots or generated demo captures.
- License.
- Contribution guide.
- Release checklist.
- Security/privacy checklist.

## Current completed hardening

- Unit tests for content utilities.
- Integration tests for export/index/audit.
- Deterministic generated indexes without timestamps.
- Config/CLI option to fail on broken wikilinks.
- GitHub Actions CI running `pnpm install --frozen-lockfile` and `pnpm run deploy:check`.
- Initial public project process docs: `CONTRIBUTING.md`, `SECURITY.md` and `agent/checklists/release.md`.

## Remaining tasks

### 1. Licensing and contribution

Added:

```text
CONTRIBUTING.md
SECURITY.md
```

Still pending:

```text
LICENSE
```

Decide license before release. If undecided, keep a TODO in the release checklist rather than guessing.

### 2. Release checklist

Added:

```text
agent/checklists/release.md
```

Minimum checks covered:

- fresh clone commands pass;
- CI green;
- privacy scan clean;
- no private paths;
- docs current;
- demo screenshots updated if used;
- version/tag decision made;
- license decision remains explicit and unresolved.

### 3. Stronger audit coverage

Add tests and implementation for:

- HTML/iframe/embed detection;
- allowed embed domains;
- structured JSON audit reports;
- blocked backend-only env names;
- malformed frontmatter.

### 4. Documentation polish

- README quickstart with current commands.
- Deployment guide linked from README.
- Clear explanation of local-first editorial workflow vs cloud-hosted output.
- Agentic operation section linked to `agent/` package.

### 5. Demo evidence

Optional but useful:

- screenshots of homepage, notes, topics;
- generated demo preview description;
- short GIF or image later if UI stabilizes.

## Verification

Release readiness must include:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

Plus the repository privacy scan documented in `agent/checklists/release.md`, excluding generated dependencies/build artifacts. Keep that scan current with the forbidden-pattern contract in `rfs.config.json`; do not hardcode real secrets in fixtures or documentation.

## Done when

- Public release materials exist.
- CI and local release gate pass.
- README and deployment docs are sufficient for a fresh user.
- Known remaining product work is captured in later plans, not hidden as undocumented debt.
