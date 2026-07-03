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
- Initial local structured reports for export/audit via `content:export -- --report` and `audit:content -- --report`.
- MIT license via `LICENSE` and `package.json`.
- Audit coverage for raw HTML, iframe/embed/object allowlist domains, backend-only environment variable names and malformed frontmatter.
- Richer audit reports with structured findings and summary counts.

## Remaining tasks

### 1. Licensing and contribution

Added:

```text
CONTRIBUTING.md
SECURITY.md
LICENSE
```

LICENSE
```

License decision: MIT.

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
- license decision is explicit and documented.

### 3. Stronger audit coverage

Implemented:

- HTML/iframe/embed detection;
- allowed embed domains;
- richer structured JSON audit reports beyond the initial local report output;
- blocked backend-only env names;
- malformed frontmatter.

Remaining hardening can add more fixture classes and provider-specific smoke examples, but the first Plan 06 audit block is complete.

### 4. Documentation polish

- [x] README quickstart with current commands.
- [x] Deployment guide linked from README.
- [x] Clear explanation of local-first editorial workflow vs cloud-hosted output.
- [x] Agentic operation section linked to `agent/` package.

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
