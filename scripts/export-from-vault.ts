import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getString, getStringArray, isAllowed, listMarkdownFiles, parseMarkdown, readConfig, resolveInsideRoot, serializeMarkdown, toPosix } from './lib/content.ts';

const config = await readConfig();
const vaultRoot = resolveInsideRoot(config.vault.path);
const outputRoot = resolveInsideRoot(config.publish.output);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const files = await listMarkdownFiles(vaultRoot);
const exported: string[] = [];

for (const absolute of files) {
  const relative = toPosix(path.relative(vaultRoot, absolute));
  if (!isAllowed(relative, config.vault.allow, config.vault.ignore)) continue;

  const source = await readFile(absolute, 'utf8');
  const parsed = parseMarkdown(source);
  if (parsed.frontmatter[config.publish.requireField] !== config.publish.requireValue) continue;

  for (const blocked of config.privacy.blockedFrontmatterFields) {
    if (Object.hasOwn(parsed.frontmatter, blocked)) {
      throw new Error(`Blocked frontmatter field '${blocked}' in ${relative}`);
    }
  }

  const title = getString(parsed.frontmatter['title'], path.basename(relative, '.md'));
  const topics = getStringArray(parsed.frontmatter['topics']);
  const normalized = serializeMarkdown({ title, publish: true, topics }, parsed.body);
  const target = path.join(outputRoot, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, normalized, 'utf8');
  exported.push(relative);
}

console.log(`Exported ${exported.length} public Markdown files to ${config.publish.output}`);
for (const file of exported.sort()) console.log(`- ${file}`);
