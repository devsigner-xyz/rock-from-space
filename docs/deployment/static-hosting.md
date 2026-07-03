# Static hosting deployment

Rock from Space produces a static Astro artifact in `dist/`. The editorial workflow is local/file-first, but the generated site is intended to run on any static hosting provider or CDN.

## Production build contract

Use this command as the production safety gate:

```bash
pnpm install --frozen-lockfile
pnpm run deploy:check
```

`deploy:check` performs:

1. export public content from the configured vault;
2. generate `src/generated/*.json` indexes;
3. audit public content and generated indexes;
4. build the Astro static site;
5. run Astro check, TypeScript check and Vitest tests.

## Generic provider settings

Use these settings for any static provider:

```text
Build command: pnpm install --frozen-lockfile && pnpm run deploy:check
Output directory: dist
Node version: 22
pnpm version: 11.4.0 or compatible >=9
```

No secret environment variables are required for the demo site. Public env vars may be added later, but backend-only secrets must never be exposed to the Astro client bundle.

## Local production preview

Before deploying, run:

```bash
pnpm run deploy:check
pnpm run preview:prod
```

Then smoke these routes at `http://127.0.0.1:4321`:

- `/`
- `/notes/`
- one generated `/notes/[slug]/` page
- `/topics/`
- one generated `/topics/[slug]/` page

## Post-deploy smoke checklist

After deployment, verify:

- homepage returns HTTP 200;
- `/notes/` returns HTTP 200;
- one generated note route returns HTTP 200;
- `/topics/` returns HTTP 200;
- one generated topic route returns HTTP 200;
- no local absolute paths or private markers appear in HTML;
- browser console has no critical errors;
- canonical/base URL behaviour is correct for the provider path.

## Provider examples

### Cloudflare Pages

```text
Framework preset: Astro or None
Build command: pnpm install --frozen-lockfile && pnpm run deploy:check
Build output directory: dist
Node version: 22
```

### Netlify

```text
Build command: pnpm install --frozen-lockfile && pnpm run deploy:check
Publish directory: dist
Node version: 22
```

### Vercel

```text
Framework preset: Astro
Build command: pnpm run deploy:check
Output directory: dist
Install command: pnpm install --frozen-lockfile
Node version: 22
```

### Railway static service

Use a static/Nixpacks-compatible service that runs:

```bash
pnpm install --frozen-lockfile && pnpm run deploy:check
```

Serve the generated `dist/` directory with the selected static server/provider mode. Do not add provider deploy commands to this repo until a first canonical provider is selected.
