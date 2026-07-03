# Production smoke checklist

Run this checklist after any production deploy or production-like preview.

## Local preview

```bash
pnpm run deploy:check
pnpm run preview:prod
```

Open `http://127.0.0.1:4321` and verify:

- `/` loads and links to notes/topics;
- `/notes/` lists public notes;
- one generated `/notes/[slug]/` page renders body HTML and wikilinks;
- `/topics/` lists topics;
- one generated `/topics/[slug]/` page lists related notes;
- browser console has no critical errors.

## Production URL

For the deployed URL, verify:

- homepage returns HTTP 200;
- `/notes/` returns HTTP 200;
- one generated note route returns HTTP 200;
- `/topics/` returns HTTP 200;
- one generated topic route returns HTTP 200;
- page source does not contain local absolute paths;
- page source does not contain private markers, backend-only env names or obvious secrets;
- base path and canonical URLs match the provider configuration.

## Required command gate

Do not deploy or publish release instructions unless this command passes locally or in CI:

```bash
pnpm run deploy:check
```
