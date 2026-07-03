import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { extractWikilinks, listMarkdownFiles, parseMarkdown, readConfig, resolveInsideRoot, slugify, toPosix } from './lib/content.ts';

const config = await readConfig();
const failOnBrokenWikilinks = config.privacy.failOnBrokenWikilinks || process.argv.includes('--fail-on-broken-wikilinks');
const scanRoots = [config.publish.output, 'src/generated'];
const failures: string[] = [];
const warnings: string[] = [];

for (const root of scanRoots) {
  const absoluteRoot = resolveInsideRoot(root);
  const files = await collectTextFiles(absoluteRoot);
  for (const file of files) {
    const relative = toPosix(path.relative(process.cwd(), file));
    const text = await readFile(file, 'utf8');
    for (const pattern of config.privacy.forbiddenPatterns) {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        failures.push(`${relative}: forbidden pattern '${pattern}'`);
      }
    }
    if (/sk-[a-z0-9_-]{12,}/i.test(text) || /[a-z0-9_]*api[_-]?key\s*[:=]\s*['\"][^'\"]+/i.test(text)) {
      failures.push(`${relative}: secret-looking value`);
    }
    if (file.endsWith('.md')) {
      const parsed = parseMarkdown(text);
      if (parsed.frontmatter[config.publish.requireField] !== config.publish.requireValue) {
        failures.push(`${relative}: public export without ${config.publish.requireField}: ${String(config.publish.requireValue)}`);
      }
      for (const blocked of config.privacy.blockedFrontmatterFields) {
        if (Object.hasOwn(parsed.frontmatter, blocked)) {
          failures.push(`${relative}: blocked frontmatter field '${blocked}'`);
        }
      }
    }
  }
}

const contentRoot = resolveInsideRoot(config.publish.output);
const markdownFiles = await listMarkdownFiles(contentRoot);
const knownSlugs = new Set<string>();
for (const file of markdownFiles) {
  const parsed = parseMarkdown(await readFile(file, 'utf8'));
  const fallback = path.basename(file, '.md');
  const title = typeof parsed.frontmatter['title'] === 'string' ? parsed.frontmatter['title'] : fallback;
  knownSlugs.add(slugify(title));
}
for (const file of markdownFiles) {
  const parsed = parseMarkdown(await readFile(file, 'utf8'));
  for (const link of extractWikilinks(parsed.body)) {
    if (!knownSlugs.has(slugify(link))) {
      const message = `${toPosix(path.relative(contentRoot, file))}: unresolved wikilink [[${link}]]`;
      if (failOnBrokenWikilinks) failures.push(message);
      else warnings.push(message);
    }
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
if (failures.length > 0) {
  console.error(`Content audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content audit passed. Scanned ${scanRoots.join(', ')} with ${warnings.length} warning(s).`);

async function collectTextFiles(root: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const files: string[] = [];
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && /\.(md|json|html|css|js|mjs|txt)$/i.test(entry.name)) files.push(absolute);
    }
  }
  await walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}
