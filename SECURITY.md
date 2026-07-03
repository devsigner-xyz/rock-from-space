# Security Policy

Rock from Space is a static publishing toolkit, but it still handles untrusted Markdown/frontmatter and public build artifacts. Security work focuses on privacy boundaries, safe content export and predictable deployment gates.

## Supported versions

The project is pre-release. Until the first public release, security fixes target the `main` branch.

## Reporting a vulnerability

Please do not publish exploit details in a public issue before maintainers have had time to review them.

Preferred reporting path:

1. Use GitHub private vulnerability reporting or a repository security advisory if available.
2. If that is not available, open a minimal public issue that says a private security report is needed, without exploit details or sensitive values.

A useful report includes:

- affected command, page or content pipeline step;
- expected behavior;
- actual behavior;
- reproduction steps using demo content when possible;
- whether the issue can expose private source material in `content/`, `src/generated/` or `dist/`.

## Security and privacy model

Rock from Space should preserve these boundaries:

- Astro reads public `content/` and `src/generated/`, not private vault source folders.
- Export requires explicit public rules such as `publish: true`.
- Ignored vault folders and blocked frontmatter fields must not appear in public output.
- Generated indexes must not point back to private source files.
- Public builds must not contain local absolute paths or credential-like values.
- Imported Markdown/frontmatter should be treated as untrusted input.
- Raw HTML is blocked by audit unless explicitly implemented and reviewed.
- Raw iframe/embed/object tags must point to an allowlisted domain from `rfs.config.json`.
- Backend-only environment variable names must not appear in public content or generated indexes.

## Maintainer verification before release

Before publishing a release or deployment artifact, run:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
git diff --check
```

Also run the repository privacy scan described in `agent/checklists/release.md`, excluding dependency, VCS and build-output directories.
