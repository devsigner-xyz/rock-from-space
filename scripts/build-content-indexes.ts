import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { extractWikilinks, getString, getStringArray, listMarkdownFiles, parseMarkdown, readConfig, renderMarkdownToSafeHtml, resolveInsideRoot, slugify, toPosix, writeJson } from './lib/content.ts';
import type { PublicPage, PublicTopic } from './lib/content.ts';

const config = await readConfig();
const contentRoot = resolveInsideRoot(config.publish.output);
const files = await listMarkdownFiles(contentRoot);

const basePages: Omit<PublicPage, 'backlinks' | 'bodyHtml'>[] = [];
const titleToSlug = new Map<string, string>();

for (const absolute of files) {
  const relative = toPosix(path.relative(contentRoot, absolute));
  const source = await readFile(absolute, 'utf8');
  const parsed = parseMarkdown(source);
  const title = getString(parsed.frontmatter['title'], path.basename(relative, '.md'));
  const kind: PublicPage['kind'] = relative === 'index.md' ? 'index' : relative.startsWith('Topics/') ? 'topic' : 'note';
  const slug = kind === 'index' ? 'home' : slugify(title);
  const topics = getStringArray(parsed.frontmatter['topics']);
  const links = extractWikilinks(parsed.body);
  basePages.push({ title, slug, path: relative, kind, topics, body: parsed.body, links });
  titleToSlug.set(title, slug);
}

const pages: PublicPage[] = basePages.map((page) => {
  const backlinks = basePages
    .filter((candidate) => candidate.links.some((link) => titleToSlug.get(link) === page.slug))
    .map((candidate) => candidate.slug)
    .sort();
  const bodyHtml = renderMarkdownToSafeHtml(page.body, (label) => {
    const slug = titleToSlug.get(label) ?? slugify(label);
    const target = basePages.find((candidate) => candidate.slug === slug);
    if (!target) return null;
    if (target.kind === 'topic') return `${config.routes.topics}/${target.slug}/`;
    if (target.kind === 'note') return `${config.routes.notes}/${target.slug}/`;
    return '/';
  });
  return { ...page, backlinks, bodyHtml };
});

const notePages = pages.filter((page) => page.kind === 'note');
const topicPages = pages.filter((page) => page.kind === 'topic');
const topicsByTitle = new Map<string, PublicTopic>();

for (const topicPage of topicPages) {
  topicsByTitle.set(topicPage.title, {
    title: topicPage.title,
    slug: topicPage.slug,
    path: topicPage.path,
    description: topicPage.body.replace(/^# .*$/m, '').trim(),
    bodyHtml: topicPage.bodyHtml,
    noteSlugs: [],
    noteCount: 0
  });
}

for (const note of notePages) {
  for (const topicTitle of note.topics) {
    const existing = topicsByTitle.get(topicTitle) ?? {
      title: topicTitle,
      slug: slugify(topicTitle),
      path: null,
      description: '',
      bodyHtml: '',
      noteSlugs: [],
      noteCount: 0
    };
    existing.noteSlugs.push(note.slug);
    existing.noteSlugs.sort();
    existing.noteCount = existing.noteSlugs.length;
    topicsByTitle.set(topicTitle, existing);
  }
}

const topics = Array.from(topicsByTitle.values()).sort((a, b) => a.title.localeCompare(b.title));
const links = pages.flatMap((page) => page.links.map((target) => ({ from: page.slug, to: titleToSlug.get(target) ?? slugify(target), label: target })));
const meta = {
  pageCount: pages.length,
  noteCount: notePages.length,
  topicCount: topics.length,
  site: config.site
};

await writeJson('src/generated/pages.json', pages.sort((a, b) => a.title.localeCompare(b.title)));
await writeJson('src/generated/topics.json', topics);
await writeJson('src/generated/links.json', links);
await writeJson('src/generated/meta.json', meta);

console.log(`Generated indexes: ${pages.length} pages, ${notePages.length} notes, ${topics.length} topics, ${links.length} links`);
