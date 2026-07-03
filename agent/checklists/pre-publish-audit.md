# Pre-publish audit checklist

- [ ] `content/` contains only public/exported material.
- [ ] No `draft: true` notes are present in public content.
- [ ] No private frontmatter fields are present.
- [ ] No local absolute paths are present.
- [ ] No API keys, tokens, passwords or secrets are present.
- [ ] Wikilinks resolve or are explicitly accepted as warnings.
- [ ] Generated JSON has no private source paths.
- [ ] Astro build passes.
- [ ] Representative routes render in preview.
