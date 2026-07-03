import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  extractWikilinks,
  getString,
  getStringArray,
  isAllowed,
  listMarkdownFiles,
  matchesGlob,
  normalizePublicFrontmatter,
  parseMarkdown,
  renderMarkdownToSafeHtml,
  serializeMarkdown,
  slugify,
  toPosix,
  writeJson
} from './content.ts';
import type { CollectionConfig, PublicCollectionIndex, PublicPage, PublicTopic, RfsConfig, TaxonomyConfig } from './content.ts';

export interface ExportPublicContentOptions {
  vaultRoot: string;
  outputRoot: string;
  allow: string[];
  ignore: string[];
  publish: RfsConfig['publish'];
  blockedFrontmatterFields: string[];
  collections?: CollectionConfig[];
  taxonomies?: TaxonomyConfig[];
}

export interface ExportPublicContentResult {
  scanned: string[];
  exported: string[];
  skipped: Array<{ path: string; reason: 'not-allowed' | 'not-published' }>;
}

export async function exportPublicContent(options: ExportPublicContentOptions): Promise<ExportPublicContentResult> {
  await rm(options.outputRoot, { recursive: true, force: true });
  await mkdir(options.outputRoot, { recursive: true });

  const files = await listMarkdownFiles(options.vaultRoot);
  const scanned: string[] = [];
  const exported: string[] = [];
  const skipped: ExportPublicContentResult['skipped'] = [];

  for (const absolute of files) {
    const relative = toPosix(path.relative(options.vaultRoot, absolute));
    scanned.push(relative);
    if (!isAllowed(relative, options.allow, options.ignore)) {
      skipped.push({ path: relative, reason: 'not-allowed' });
      continue;
    }

    const source = await readFile(absolute, 'utf8');
    const parsed = parseMarkdown(source);
    if (parsed.frontmatter[options.publish.requireField] !== options.publish.requireValue) {
      skipped.push({ path: relative, reason: 'not-published' });
      continue;
    }

    for (const blocked of options.blockedFrontmatterFields) {
      if (Object.hasOwn(parsed.frontmatter, blocked)) {
        throw new Error(`Blocked frontmatter field '${blocked}' in ${relative}`);
      }
    }

    const contract = publicContractForPath(relative, options.collections ?? [], options.taxonomies ?? []);
    const { normalized, failures } = normalizePublicFrontmatter(parsed.frontmatter, relative, contract.required, contract.optional);
    if (failures.length > 0) {
      throw new Error(`Invalid public frontmatter in ${relative}: ${failures.join('; ')}`);
    }

    const title = getString(normalized['title'], path.basename(relative, '.md'));
    const topics = getStringArray(normalized['topics']);
    const publicFrontmatter = Object.fromEntries(
      Object.entries(normalized).filter(([field]) => field !== 'title' && field !== 'publish' && field !== 'topics')
    );
    const exportedFrontmatter = { title, publish: true, topics, ...publicFrontmatter };
    const normalizedMarkdown = serializeMarkdown(exportedFrontmatter, parsed.body);
    const target = path.join(options.outputRoot, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, normalizedMarkdown, 'utf8');
    exported.push(relative);
  }

  return {
    scanned: scanned.sort((a, b) => a.localeCompare(b)),
    exported: exported.sort((a, b) => a.localeCompare(b)),
    skipped: skipped.sort((a, b) => a.path.localeCompare(b.path))
  };
}

function publicContractForPath(
  relative: string,
  collections: CollectionConfig[],
  taxonomies: TaxonomyConfig[]
): { required: string[]; optional: string[] } {
  const collection = collections.find((candidate) => matchesGlob(relative, candidate.source));
  if (collection) return collection.schema;
  const taxonomy = taxonomies.find((candidate) => candidate.source && matchesGlob(relative, candidate.source));
  if (taxonomy) return { required: ['title', 'publish'], optional: [taxonomy.field] };
  return { required: ['title', 'publish'], optional: ['topics'] };
}

export interface BuildContentIndexesOptions {
  contentRoot: string;
  routes: RfsConfig['routes'];
  site: RfsConfig['site'];
  collections?: CollectionConfig[];
  taxonomies?: TaxonomyConfig[];
}

export interface ContentIndexes {
  pages: PublicPage[];
  topics: PublicTopic[];
  collections: PublicCollectionIndex[];
  links: Array<{ from: string; to: string; label: string }>;
  meta: {
    pageCount: number;
    noteCount: number;
    topicCount: number;
    collectionCount: number;
    site: RfsConfig['site'];
  };
}

export async function buildContentIndexes(options: BuildContentIndexesOptions): Promise<ContentIndexes> {
  const files = await listMarkdownFiles(options.contentRoot);
  const collections = options.collections ?? [];
  const taxonomies = options.taxonomies ?? [];
  const topicTaxonomy = taxonomies.find((taxonomy) => taxonomy.name === 'topics' || taxonomy.field === 'topics');

  const basePages: Omit<PublicPage, 'backlinks' | 'bodyHtml'>[] = [];
  const titleToRoute = new Map<string, string>();
  const titleToSlug = new Map<string, string>();

  for (const absolute of files) {
    const relative = toPosix(path.relative(options.contentRoot, absolute));
    const source = await readFile(absolute, 'utf8');
    const parsed = parseMarkdown(source);
    const title = getString(parsed.frontmatter['title'], path.basename(relative, '.md'));
    const collection = collections.find((candidate) => matchesGlob(relative, candidate.source));
    const isTopicTerm = topicTaxonomy?.source ? matchesGlob(relative, topicTaxonomy.source) : relative.startsWith('Topics/');
    const kind: PublicPage['kind'] = relative === 'index.md' ? 'index' : isTopicTerm ? 'topic' : collection ? (collection.name === 'notes' ? 'note' : 'collection') : 'note';
    const slug = kind === 'index' ? 'home' : slugify(title);
    const route = routeForPage(kind, slug, collection, options.routes, topicTaxonomy);
    const topics = getStringArray(parsed.frontmatter[topicTaxonomy?.field ?? 'topics']);
    const links = extractWikilinks(parsed.body);
    basePages.push({
      title,
      slug,
      path: relative,
      kind,
      collection: collection?.name ?? null,
      template: collection?.template ?? (kind === 'topic' ? topicTaxonomy?.template ?? 'taxonomy' : null),
      route,
      topics,
      body: parsed.body,
      links
    });
    titleToSlug.set(title, slug);
    titleToRoute.set(title, route);
  }

  const pages: PublicPage[] = basePages.map((page) => {
    const backlinks = basePages
      .filter((candidate) => candidate.links.some((link) => titleToSlug.get(link) === page.slug))
      .map((candidate) => candidate.slug)
      .sort();
    const bodyHtml = renderMarkdownToSafeHtml(page.body, (label) => titleToRoute.get(label) ?? null);
    return { ...page, backlinks, bodyHtml };
  });

  const notePages = pages.filter((page) => page.collection === 'notes' || page.kind === 'note');
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
      existing.noteSlugs = Array.from(new Set(existing.noteSlugs)).sort();
      existing.noteCount = existing.noteSlugs.length;
      topicsByTitle.set(topicTitle, existing);
    }
  }

  const collectionIndexes: PublicCollectionIndex[] = collections.map((collection) => {
    const collectionPages = pages
      .filter((page) => page.collection === collection.name)
      .sort((a, b) => a.title.localeCompare(b.title));
    return {
      name: collection.name,
      route: collection.route,
      template: collection.template,
      source: collection.source,
      schema: collection.schema,
      pages: collectionPages.map((page) => ({ title: page.title, slug: page.slug, path: page.path, topics: page.topics })),
      pageCount: collectionPages.length
    };
  });

  const topics = Array.from(topicsByTitle.values()).sort((a, b) => a.title.localeCompare(b.title));
  const links = pages.flatMap((page) => page.links.map((target) => ({ from: page.slug, to: titleToSlug.get(target) ?? slugify(target), label: target })));
  const meta = {
    pageCount: pages.length,
    noteCount: notePages.length,
    topicCount: topics.length,
    collectionCount: collectionIndexes.length,
    site: options.site
  };

  return {
    pages: pages.sort((a, b) => a.title.localeCompare(b.title)),
    topics,
    collections: collectionIndexes.sort((a, b) => a.name.localeCompare(b.name)),
    links,
    meta
  };
}

function routeForPage(
  kind: PublicPage['kind'],
  slug: string,
  collection: CollectionConfig | undefined,
  routes: RfsConfig['routes'],
  topicTaxonomy: TaxonomyConfig | undefined
): string {
  if (kind === 'index') return '/';
  if (kind === 'topic') return `${topicTaxonomy?.route ?? routes.topics}/${slug}/`;
  if (collection) return `${collection.route}/${slug}/`;
  return `${routes.notes}/${slug}/`;
}

export async function writeContentIndexes(indexes: ContentIndexes, generatedRoot = 'src/generated'): Promise<void> {
  await writeJson(`${generatedRoot}/pages.json`, indexes.pages);
  await writeJson(`${generatedRoot}/topics.json`, indexes.topics);
  await writeJson(`${generatedRoot}/collections.json`, indexes.collections);
  await writeJson(`${generatedRoot}/links.json`, indexes.links);
  await writeJson(`${generatedRoot}/meta.json`, indexes.meta);
}

export interface AuditPublicContentOptions {
  scanRoots: string[];
  contentRoot: string;
  cwd: string;
  forbiddenPatterns: string[];
  blockedFrontmatterFields: string[];
  allowedEmbedDomains: string[];
  publish: RfsConfig['publish'];
  failOnBrokenWikilinks: boolean;
  collections?: CollectionConfig[];
  taxonomies?: TaxonomyConfig[];
}

export interface AuditFinding {
  severity: 'failure' | 'warning';
  category: 'privacy' | 'secret' | 'frontmatter' | 'wikilink' | 'html' | 'embed';
  path: string;
  message: string;
  evidence?: string;
}

export interface AuditPublicContentResult {
  scanned: string[];
  failures: string[];
  warnings: string[];
  findings: AuditFinding[];
}

export async function auditPublicContent(options: AuditPublicContentOptions): Promise<AuditPublicContentResult> {
  const scanned: string[] = [];
  const findings: AuditFinding[] = [];
  const addFinding = (finding: AuditFinding): void => {
    findings.push(finding);
  };

  for (const root of options.scanRoots) {
    const files = await collectTextFiles(root);
    for (const file of files) {
      const relative = toPosix(path.relative(options.cwd, file));
      scanned.push(relative);
      const text = await readFile(file, 'utf8');
      for (const pattern of options.forbiddenPatterns) {
        if (text.toLowerCase().includes(pattern.toLowerCase())) {
          addFinding({ severity: 'failure', category: 'privacy', path: relative, message: `forbidden pattern '${pattern}'`, evidence: pattern });
        }
      }
      for (const name of backendOnlyEnvNames()) {
        if (text.includes(name)) {
          addFinding({ severity: 'failure', category: 'secret', path: relative, message: `backend-only environment name '${name}'`, evidence: name });
        }
      }
      if (/sk-[a-z0-9_-]{12,}/i.test(text) || /[a-z0-9_]*api[_-]?key\s*[:=]\s*['"][^'"]+/i.test(text)) {
        addFinding({ severity: 'failure', category: 'secret', path: relative, message: 'secret-looking value' });
      }
      if (file.endsWith('.md')) {
        let parsed: ReturnType<typeof parseMarkdown>;
        try {
          parsed = parseMarkdown(text);
        } catch (error) {
          addFinding({
            severity: 'failure',
            category: 'frontmatter',
            path: relative,
            message: `malformed frontmatter: ${error instanceof Error ? error.message : String(error)}`
          });
          continue;
        }
        if (parsed.frontmatter[options.publish.requireField] !== options.publish.requireValue) {
          addFinding({
            severity: 'failure',
            category: 'frontmatter',
            path: relative,
            message: `public export without ${options.publish.requireField}: ${String(options.publish.requireValue)}`
          });
        }
        for (const blocked of options.blockedFrontmatterFields) {
          if (Object.hasOwn(parsed.frontmatter, blocked)) {
            addFinding({ severity: 'failure', category: 'frontmatter', path: relative, message: `blocked frontmatter field '${blocked}'`, evidence: blocked });
          }
        }
        const contentRelative = toPosix(path.relative(options.contentRoot, file));
        const contract = publicContractForPath(contentRelative, options.collections ?? [], options.taxonomies ?? []);
        const contractFailures = normalizePublicFrontmatter(parsed.frontmatter, relative, contract.required, contract.optional).failures;
        for (const failure of contractFailures) {
          addFinding({ severity: 'failure', category: 'frontmatter', path: relative, message: stripPathPrefix(failure, relative) });
        }
        for (const finding of detectRawHtmlAndEmbeds(parsed.body, relative, options.allowedEmbedDomains)) {
          addFinding(finding);
        }
      }
    }
  }

  const markdownFiles = await listMarkdownFiles(options.contentRoot);
  const knownSlugs = new Set<string>();
  for (const file of markdownFiles) {
    const parsed = parseMarkdownSafely(await readFile(file, 'utf8'));
    if (!parsed) continue;
    const fallback = path.basename(file, '.md');
    const title = typeof parsed.frontmatter['title'] === 'string' ? parsed.frontmatter['title'] : fallback;
    knownSlugs.add(slugify(title));
  }
  for (const file of markdownFiles) {
    const parsed = parseMarkdownSafely(await readFile(file, 'utf8'));
    if (!parsed) continue;
    for (const link of extractWikilinks(parsed.body)) {
      if (!knownSlugs.has(slugify(link))) {
        addFinding({
          severity: options.failOnBrokenWikilinks ? 'failure' : 'warning',
          category: 'wikilink',
          path: toPosix(path.relative(options.contentRoot, file)),
          message: `unresolved wikilink [[${link}]]`,
          evidence: link
        });
      }
    }
  }

  const failures = findings.filter((finding) => finding.severity === 'failure').map(formatFinding);
  const warnings = findings.filter((finding) => finding.severity === 'warning').map(formatFinding);
  return { scanned: Array.from(new Set(scanned)).sort((a, b) => a.localeCompare(b)), failures, warnings, findings };
}

function parseMarkdownSafely(source: string): ReturnType<typeof parseMarkdown> | null {
  try {
    return parseMarkdown(source);
  } catch {
    return null;
  }
}

function stripPathPrefix(message: string, relative: string): string {
  return message.startsWith(`${relative}: `) ? message.slice(relative.length + 2) : message;
}

function formatFinding(finding: AuditFinding): string {
  return `${finding.path}: ${finding.message}`;
}

function backendOnlyEnvNames(): string[] {
  return [
    ['SUPABASE', 'SERVICE', 'ROLE'].join('_'),
    ['SERVICE', 'ROLE'].join('_'),
    ['DATABASE', 'URL'].join('_'),
    ['POSTGRES', 'URL'].join('_'),
    ['RESEND', 'API', 'KEY'].join('_')
  ];
}

function detectRawHtmlAndEmbeds(markdownBody: string, relative: string, allowedEmbedDomains: string[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const allowed = allowedEmbedDomains.map(normalizeAllowedDomain).filter((domain): domain is string => Boolean(domain));
  const rawTagPattern = /<(\/)?([a-z][a-z0-9-]*)(\s[^>]*)?>/gi;
  for (const match of markdownBody.matchAll(rawTagPattern)) {
    if (match[1]) continue;
    const tag = match[2]?.toLowerCase();
    const attributes = match[3] ?? '';
    if (!tag) continue;

    if (['iframe', 'embed', 'object'].includes(tag)) {
      const src = extractAttribute(attributes, 'src') ?? extractAttribute(attributes, 'data');
      if (!src) {
        findings.push({ severity: 'failure', category: 'embed', path: relative, message: `raw <${tag}> embed without src/data` });
        continue;
      }
      const hostname = hostnameForUrl(src);
      if (!hostname || !isAllowedEmbedHost(hostname, allowed)) {
        findings.push({ severity: 'failure', category: 'embed', path: relative, message: `raw <${tag}> embed domain is not allowlisted`, evidence: hostname ?? src });
      }
      continue;
    }

    if (tag === 'script') {
      findings.push({ severity: 'failure', category: 'html', path: relative, message: 'raw <script> tag is not allowed' });
      continue;
    }

    findings.push({ severity: 'failure', category: 'html', path: relative, message: `raw HTML tag <${tag}> is not allowed` });
  }
  return findings;
}

function extractAttribute(attributes: string, name: string): string | null {
  const pattern = new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, 'i');
  return pattern.exec(attributes)?.[2] ?? null;
}

function hostnameForUrl(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeAllowedDomain(value: string): string | null {
  if (!value.trim()) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed.includes('://')) return trimmed;
  return hostnameForUrl(trimmed);
}

function isAllowedEmbedHost(hostname: string, allowedDomains: string[]): boolean {
  return allowedDomains.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
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
