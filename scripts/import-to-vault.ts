import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { serializeMarkdown, slugify, resolveInsideRoot } from './lib/content.ts';

const ImportItemSchema = z.object({
  title: z.string().min(1),
  topics: z.array(z.string()).default([]),
  body: z.string().min(1)
});

const args = new Map<string, string | boolean>();
for (let i = 2; i < process.argv.length; i += 1) {
  const current = process.argv[i];
  if (!current?.startsWith('--')) continue;
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(current, next);
    i += 1;
  } else {
    args.set(current, true);
  }
}

const source = args.get('--source');
const target = args.get('--target');
const apply = args.get('--apply') === true;

if (typeof source !== 'string' || typeof target !== 'string') {
  throw new Error('Usage: tsx scripts/import-to-vault.ts --source <json> --target <vault> [--apply]');
}

if (!apply) {
  console.log('Dry run only. Pass --apply to write imported notes.');
}

const sourcePath = resolveInsideRoot(source);
const targetPath = resolveInsideRoot(target);
const raw = await readFile(sourcePath, 'utf8');
const items = z.array(ImportItemSchema).parse(JSON.parse(raw));
const outputDir = path.join(targetPath, 'Notes');

if (apply) await mkdir(outputDir, { recursive: true });

for (const item of items) {
  const filename = `${item.title}.md`;
  const notePath = path.join(outputDir, filename);
  const markdown = serializeMarkdown({
    title: item.title,
    publish: true,
    topics: item.topics
  }, item.body);
  if (apply) await writeFile(notePath, markdown, 'utf8');
  console.log(`${apply ? 'Imported' : 'Would import'}: Notes/${filename} (${slugify(item.title)})`);
}
