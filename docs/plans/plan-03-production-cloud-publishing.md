# Plan 03 — Production Cloud Publishing

## Goal

Make production cloud deployment a first-class output of Rock from Space.

Local-first means the editorial source and control surface are file-based and portable. It does not mean the website is local-only. The generated Astro site must be deployable to production cloud hosting with a repeatable build and audit workflow.

## Deliverables

- Production deployment contract.
- `site.url` / base path configuration model.
- Pre-deploy audit command requirement.
- CI-friendly build commands.
- Documentation for at least one static/cloud provider.
- Optional provider examples for Netlify, Vercel, Cloudflare Pages and Railway.
- Production smoke-test checklist.

## Deployment model

Default deployment target:

```text
Obsidian-compatible vault
        ↓
content export
        ↓
index generation
        ↓
privacy audit
        ↓
astro build
        ↓
dist/
        ↓
cloud static hosting / CDN
```

Default output should be static HTML/CSS/JS under `dist/`.

SSR/adapters are allowed later, but only as opt-in templates when a project needs runtime behavior.

## Config additions

Extend `rfs.config.json` with deployment-aware site config:

```json
{
  "site": {
    "title": "Rock from Space Demo",
    "description": "An Obsidian-compatible Markdown vault rendered with Astro.",
    "language": "en",
    "url": "https://example.com",
    "base": "/"
  },
  "deploy": {
    "target": "static",
    "output": "dist",
    "predeploy": ["content:export", "content:index", "audit:content", "build"]
  }
}
```

Rules:

- `site.url` should be optional for local dev but recommended for production SEO/canonical URLs.
- `base` must support subpath deployments.
- Public env vars only. No secret keys in frontend bundles.

## Package command contract

Add or document:

```bash
pnpm run build
pnpm run deploy:check
pnpm run preview:prod
```

Suggested behavior:

```json
{
  "scripts": {
    "deploy:check": "pnpm run content:export && pnpm run content:index && pnpm run audit:content && pnpm run build && pnpm run check",
    "preview:prod": "astro preview --host 127.0.0.1 --port 4321"
  }
}
```

Do not add provider-specific deploy commands until the first provider is selected.

## Provider docs

Create `docs/deployment/` later with:

```text
docs/deployment/static-hosting.md
docs/deployment/cloudflare-pages.md
docs/deployment/netlify.md
docs/deployment/vercel.md
docs/deployment/railway.md
```

Minimum provider doc shape:

- build command;
- output directory;
- Node/pnpm requirements;
- env vars;
- preview command;
- post-deploy smoke test.

## CI/CD expectations

A generic CI workflow should be able to run:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

The workflow must fail if:

- audit fails;
- Astro build fails;
- typecheck fails;
- generated indexes are missing;
- public output contains forbidden patterns.

## Production smoke checklist

After deploy, verify:

- homepage returns HTTP 200;
- `/notes/` returns HTTP 200;
- one generated note route returns HTTP 200;
- `/topics/` returns HTTP 200;
- one topic route returns HTTP 200;
- canonical/base URLs are correct;
- no local paths or private markers appear in HTML;
- console has no critical errors.

## Implementation status

Current repository support:

- `deploy:check` exists and is used by GitHub Actions CI.
- `preview:prod` exists for local production-like preview on `127.0.0.1:4321`.
- Generic static hosting documentation exists in `docs/deployment/static-hosting.md`.
- `content:export -- --report` writes a local ignored export report with scanned/exported/skipped paths.
- `audit:content -- --report` writes a local ignored audit report with scanned files, warnings and failures.
- Production smoke checklist exists in `docs/deployment/smoke-checklist.md`.

Provider-specific deploy commands should still wait until a canonical first provider is selected.

## Done when

- The docs make clear that Rock from Space is local-first editorially but cloud-ready operationally.
- `dist/` is treated as a production artifact.
- The repo has a deploy-check contract.
- At least one provider path is documented or explicitly selected for implementation.
