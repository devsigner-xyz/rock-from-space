# Privacy audit checklist

Use for content reviews, release prep and pre-deploy verification.

## Built-in audit

```bash
pnpm run content:export -- --report
pnpm run audit:content -- --report
```

Expected result:

- [ ] `reports/export-report.json` contains only expected exported public files.
- [ ] `reports/audit-report.json` reports no blocking findings.
- [ ] Publishable items have valid public frontmatter.
- [ ] Drafts and ignored folders are not exported.
- [ ] Blocked/private frontmatter fields fail closed.

## Repository privacy scan

Run a scan from the repository root. Keep the patterns constructed at runtime so the checklist itself does not become a self-match.

```bash
pattern="$(printf '%s%s' Watch Out)|$(printf '%s%s' watch out)|$(printf '%s_%s_%s' SUPABASE SERVICE ROLE)|$(printf '%s_%s' SERVICE ROLE)|$(printf '%s://|%s://' postgres postgresql)|password[[:space:]_:-]*[=:]|secret[[:space:]_:-]*[=:]|api_key[[:space:]_:-]*[=:]|token[[:space:]_:-]*[=:]"
git grep -n -I -E "$pattern" -- ':!node_modules' ':!.git' ':!.astro' ':!dist' ':!reports' ':!pnpm-lock.yaml'
```

Expected result:

- [ ] No matches in tracked source or generated public inputs.

Also scan public surfaces for local absolute paths:

```bash
git grep -n -I -E '/Users/|/home/|C:\\Users\\' -- content src/generated dist ':!pnpm-lock.yaml'
```

Expected result:

- [ ] No local absolute paths in public surfaces.

## Manual review

- [ ] No credential-like values in Markdown, generated JSON or built HTML.
- [ ] No private source filenames or ignored directories in generated indexes.
- [ ] No unpublished notes in `content/`, `src/generated/` or `dist/`.
- [ ] No backend-only env var names in frontend bundles.
- [ ] Any allowed external embeds are explicitly configured.
