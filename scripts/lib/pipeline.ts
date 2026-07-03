import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  extractWikilinks,
  getString,
  getStringArray,
  isAllowed,
  listMarkdownFiles,
  parseMarkdown,
  renderMarkdownToSafeHtml,
  serializeMarkdown,
  slugify,
  toPosix,
  writeJson
} from './content.ts';
import type { PublicPage, PublicTopic, RfsConfig } from './content.ts';

export interface ExportPublicContentOptions {
  vaultRoot: string;
  outputRoot: string;
  allow: string[];
  ignore: string[];
  publish: RfsConfig['publish'];
  blockedFrontmatterFields: string[];
}

export interface ExportPublicContentResult {
  exported: string[];
}

export async function exportPublicContent(options: ExportPublicContentOptions): Promise<ExportPublicContentResult> {
  await rm(options.outputRoot, { recursive: true, force: true });
  await mkdir(options.outputRoot, { recursive: true });

  const files = await listMarkdownFiles(options.vaultRoot);
  const exported: string[] = [];

  for (const absolute of files) {
    const relative = toPosix(path.relative(options.vaultRoot, absolute));
    if (!isAllowed(relative, options.allow, options.ignore)) continue;

    const source = await readFile(absolute, 'utf8');
    const parsed = parseMarkdown(source);
    if (parsed.frontmatter[options.publish.requireField] !== options.publish.requireValue) continue;

    for (const blocked of options.blockedFrontmatterFields) {
      if (Object.hasOwn(parsed.frontmatter, blocked)) {
        throw new Error(`Blocked frontmatter field '${blocked}' in ${relative}`);
      }
    }

    const title = getString(parsed.frontmatter['title'], path.basename(relative, '.md'));
    const topics = getStringArray(parsed.frontmatter['topics']);
    const normalized = serializeMarkdown({ title, publish: true, topics }, parsed.body);
    const target = path.join(options.outputRoot, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, normalized, 'utf8');
    exported.push(relative);
  }

  return { exported: exported.sort((a, b) => a.localeCompare(b)) };
}

export interface BuildContentIndexesOptions {
  contentRoot: string;
  routes: RfsConfig['routes'];
  site: RfsConfig['site'];
}

export interface ContentIndexes {
  pages: PublicPage[];
  topics: PublicTopic[];
  links: Array<{ from: string; to: string; label: string }>;
  meta: {
    pageCount: number;
    noteCount: number;
    topicCount: number;
    site: RfsConfig['site'];
  };
}

export async function buildContentIndexes(options: BuildContentIndexesOptions): Promise<ContentIndexes> {
  const files = await listMarkdownFiles(options.contentRoot);

  const basePages: Omit<PublicPage, 'backlinks' | 'bodyHtml'>[] = [];
  const titleToSlug = new Map<string, string>();

  for (const absolute of files) {
    const relative = toPosix(path.relative(options.contentRoot, absolute));
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
      if (target.kind === 'topic') return `${options.routes.topics}/${target.slug}/`;
      if (target.kind === 'note') return `${options.routes.notes}/${target.slug}/`;
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
    site: options.site
  };

  return {
    pages: pages.sort((a, b) => a.title.localeCompare(b.title)),
    topics,
    links,
    meta
  };
}

export async function writeContentIndexes(indexes: ContentIndexes, generatedRoot = 'src/generated'): Promise<void> {
  await writeJson(`${generatedRoot}/pages.json`, indexes.pages);
  await writeJson(`${generatedRoot}/topics.json`, indexes.topics);
  await writeJson(`${generatedRoot}/links.json`, indexes.links);
  await writeJson(`${generatedRoot}/meta.json`, indexes.meta);
}

export interface AuditPublicContentOptions {
  scanRoots: string[];
  contentRoot: string;
  cwd: string;
  forbiddenPatterns: string[];
  blockedFrontmatterFields: string[];
  publish: RfsConfig['publish'];
  failOnBrokenWikilinks: boolean;
}

export interface AuditPublicContentResult {
  failures: string[];
  warnings: string[];
}

export async function auditPublicContent(options: AuditPublicContentOptions): Promise<AuditPublicContentResult> {
  const failures: string[] = [];
  const warnings: string[] = [];

  for (const root of options.scanRoots) {
    const files = await collectTextFiles(root);
    for (const file of files) {
      const relative = toPosix(path.relative(options.cwd, file));
      const text = await readFile(file, 'utf8');
      for (const pattern of options.forbiddenPatterns) {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          failures.push(`${relative}: forbidden pattern '${pattern}'`);
        }
      }
      if (/sk-[a-z0-9_-]{12,}/i.test(text) || /[a-z0-9_]*api[_-]?key\s*[:=]\s*['"][^'"]+/i.test(text)) {
        failures.push(`${relative}: secret-looking value`);
      }
      if (file.endsWith('.md')) {
        const parsed = parseMarkdown(text);
        if (parsed.frontmatter[options.publish.requireField] !== options.publish.requireValue) {
          failures.push(`${relative}: public export without ${options.publish.requireField}: ${String(options.publish.requireValue)}`);
        }
        for (const blocked of options.blockedFrontmatterFields) {
          if (Object.hasOwn(parsed.frontmatter, blocked)) {
            failures.push(`${relative}: blocked frontmatter field '${blocked}'`);
          }
        }
      }
    }
  }

  const markdownFiles = await listMarkdownFiles(options.contentRoot);
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
        const message = `${toPosix(path.relative(options.contentRoot, file))}: unresolved wikilink [[${link}]]`;
        if (options.failOnBrokenWikilinks) failures.push(message);
        else warnings.push(message);
      }
    }
  }

  return { failures, warnings };
}

async function collectTextFiles(root: string): Promise<string[]> {
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
