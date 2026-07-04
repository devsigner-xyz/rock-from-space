# Pre-publish audit checklist

This legacy checklist is kept as a short pre-publish summary. For the canonical current gate, use `agent/checklists/pre-deploy.md`, `agent/checklists/privacy-audit.md`, `agent/checklists/route-smoke-test.md` and the focused privacy workflow in `agent/skills/rfs-privacy-auditor/SKILL.md`.

- [ ] `pnpm run content:doctor` has been run when source content, reports or public surfaces changed.
- [ ] `content/` contains only public/exported material.
- [ ] Exported public frontmatter has `publish: true`, a non-empty `title`, and valid `topics` arrays when present.
- [ ] No unpublished source content, `Drafts/` material or `Private/` material is present in public output.
- [ ] No private frontmatter fields are present.
- [ ] No local absolute paths are present.
- [ ] No API keys, tokens, passwords or secrets are present.
- [ ] Wikilinks resolve or are explicitly accepted as warnings.
- [ ] Generated JSON has no private source paths.
- [ ] Astro build passes.
- [ ] Representative routes render in preview.
