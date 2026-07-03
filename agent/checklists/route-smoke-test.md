# Route smoke-test checklist

Use after `pnpm run deploy:check` and before production deployment or release evidence.

## Start production-like preview

```bash
pnpm run preview:prod
```

Default local URL: `http://127.0.0.1:4321`.

## Required routes

Verify these representative routes return HTTP 200 and render expected content:

- [ ] `/` — homepage with links to public sections.
- [ ] `/notes/` — notes collection index.
- [ ] One `/notes/[slug]/` page — note title/body and links render.
- [ ] `/topics/` — taxonomy index.
- [ ] One `/topics/[slug]/` page — related notes render.
- [ ] One configured non-`notes` collection route, if `rfs.config.json` includes another public collection.

## Browser checks

- [ ] No critical browser console errors.
- [ ] Navigation links do not point to private source files.
- [ ] Page source does not contain local absolute paths or credential-like values.
- [ ] Base path/canonical URL behavior matches `rfs.config.json` for the target hosting setup.

## Command-line fallback

When a browser is not available, use HTTP checks against preview output:

```bash
curl -fsS http://127.0.0.1:4321/ >/dev/null
curl -fsS http://127.0.0.1:4321/notes/ >/dev/null
curl -fsS http://127.0.0.1:4321/topics/ >/dev/null
```

Add representative generated note/topic URLs from `src/generated/pages.json` and `src/generated/topics.json`.
