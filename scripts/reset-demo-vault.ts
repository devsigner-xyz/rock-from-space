import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { resetDirectory, writeText } from './lib/content.ts';

const demoVault = 'examples/demo-vault';
await resetDirectory(demoVault);
await mkdir(path.join(process.cwd(), demoVault, 'Notes'), { recursive: true });
await mkdir(path.join(process.cwd(), demoVault, 'Topics'), { recursive: true });
await mkdir(path.join(process.cwd(), demoVault, '.obsidian'), { recursive: true });

const files: Record<string, string> = {
  'examples/demo-vault/index.md': `---
title: "Rock from Space Demo Vault"
publish: true
topics: ["Markdown", "Privacy"]
---

# Rock from Space Demo Vault

This disposable vault shows how public Markdown can become a static Astro site.

Start with [[Obsidian compatible publishing]] and [[Astro static rendering]].
`,
  'examples/demo-vault/Notes/Obsidian compatible publishing.md': `---
title: "Obsidian compatible publishing"
publish: true
topics: ["Markdown", "Privacy"]
---

# Obsidian compatible publishing

A portable editorial vault should work in Obsidian, other Markdown editors and automated pipelines.

- Keep private notes out of public exports.
- Use explicit frontmatter such as \`publish: true\`.
- Link concepts with wikilinks like [[Markdown]].
`,
  'examples/demo-vault/Notes/Astro static rendering.md': `---
title: "Astro static rendering"
publish: true
topics: ["Markdown", "Static Sites"]
---

# Astro static rendering

Astro turns generated content indexes into deployable static HTML.

The public site reads from exported content, never directly from a private vault.
`,
  'examples/demo-vault/Topics/Markdown.md': `---
title: "Markdown"
publish: true
topics: ["Markdown"]
---

# Markdown

Markdown is the portable source format for the editorial layer.
`,
  'examples/demo-vault/Topics/Privacy.md': `---
title: "Privacy"
publish: true
topics: ["Privacy"]
---

# Privacy

Privacy-by-design means publishing from allowlisted content and failing closed during audits.
`,
  'examples/demo-vault/Topics/Static Sites.md': `---
title: "Static Sites"
publish: true
topics: ["Static Sites"]
---

# Static Sites

Static outputs are easy to deploy to cloud hosting and CDNs.
`,
  'examples/demo-vault/.obsidian/app.json': `{"alwaysUpdateLinks":true}\n`
};

for (const [file, body] of Object.entries(files)) {
  await writeText(file, body);
}

console.log(`Reset demo vault at ${demoVault}`);
for (const file of Object.keys(files).sort()) {
  console.log(`- ${file}`);
}
