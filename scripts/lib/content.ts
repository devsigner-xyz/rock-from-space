import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const projectRoot = process.cwd();

const FieldSchema = z.string().min(1);

const CollectionConfigSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  route: z.string().min(1),
  template: z.string().min(1),
  schema: z.object({
    required: z.array(FieldSchema),
    optional: z.array(FieldSchema).default([])
  })
}).strict();

const TaxonomyConfigSchema = z.object({
  name: z.string().min(1),
  field: z.string().min(1),
  route: z.string().min(1),
  source: z.string().min(1).optional(),
  template: z.string().min(1).default('taxonomy')
}).strict();

const ConfigSchema = z.object({
  site: z.object({
    title: z.string(),
    description: z.string(),
    language: z.string(),
    url: z.string(),
    base: z.string()
  }),
  vault: z.object({
    path: z.string(),
    mode: z.string(),
    allow: z.array(z.string()),
    ignore: z.array(z.string())
  }),
  publish: z.object({
    requireField: z.string(),
    requireValue: z.boolean(),
    output: z.string()
  }),
  routes: z.object({
    notes: z.string(),
    topics: z.string()
  }),
  collections: z.array(CollectionConfigSchema).default([]),
  taxonomies: z.array(TaxonomyConfigSchema).default([]),
  privacy: z.object({
    forbiddenPatterns: z.array(z.string()),
    blockedFrontmatterFields: z.array(z.string()).default([]),
    allowedEmbedDomains: z.array(z.string()).default([]),
    failOnBrokenWikilinks: z.boolean().default(false)
  }),
  deploy: z.object({
    target: z.string(),
    output: z.string(),
    predeploy: z.array(z.string())
  }),
  agent: z.object({
    skillsPath: z.string(),
    promptsPath: z.string(),
    checklistsPath: z.string()
  }).optional()
});

export type RfsConfig = z.infer<typeof ConfigSchema>;
export type CollectionConfig = z.infer<typeof CollectionConfigSchema>;
export type TaxonomyConfig = z.infer<typeof TaxonomyConfigSchema>;

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface PublicPage {
  title: string;
  slug: string;
  path: string;
  kind: 'note' | 'topic' | 'index' | 'collection';
  collection: string | null;
  template: string | null;
  route: string;
  topics: string[];
  body: string;
  bodyHtml: string;
  links: string[];
  backlinks: string[];
}

export interface PublicTopic {
  title: string;
  slug: string;
  path: string | null;
  description: string;
  bodyHtml: string;
  noteSlugs: string[];
  noteCount: number;
}

export interface PublicCollectionIndex {
  name: string;
  route: string;
  template: string;
  source: string;
  schema: {
    required: string[];
    optional: string[];
  };
  pages: Array<{
    title: string;
    slug: string;
    path: string;
    topics: string[];
  }>;
  pageCount: number;
}

export async function readConfig(): Promise<RfsConfig> {
  const raw = await readFile(path.join(projectRoot, 'rfs.config.json'), 'utf8');
  const config = ConfigSchema.parse(JSON.parse(raw));
  assertUniqueNames(config.collections.map((collection) => collection.name), 'collection');
  assertUniqueNames(config.taxonomies.map((taxonomy) => taxonomy.name), 'taxonomy');
  return config;
}

function assertUniqueNames(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label} name: ${value}`);
    seen.add(value);
  }
}

export function resolveInsideRoot(relativePath: string): string {
  const resolved = path.resolve(projectRoot, relativePath);
  const rootWithSep = projectRoot.endsWith(path.sep) ? projectRoot : `${projectRoot}${path.sep}`;
  if (resolved !== projectRoot && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Refusing to operate outside project root: ${relativePath}`);
  }
  return resolved;
}

export async function resetDirectory(relativePath: string): Promise<string> {
  const target = resolveInsideRoot(relativePath);
  if (target === projectRoot) {
    throw new Error('Refusing to reset project root');
  }
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  return target;
}

export async function listMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(absolute);
      }
    }
  }
  await walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

export function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

export function isAllowed(relativePath: string, allow: string[], ignore: string[]): boolean {
  const posix = toPosix(relativePath);
  if (ignore.some((pattern) => matchesPattern(posix, pattern))) return false;
  return allow.some((pattern) => matchesPattern(posix, pattern));
}

export function matchesGlob(value: string, pattern: string): boolean {
  return matchesPattern(toPosix(value), pattern);
}

function matchesPattern(value: string, pattern: string): boolean {
  if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
    const segment = pattern.slice(3, -3);
    return value === segment || value.startsWith(`${segment}/`) || value.includes(`/${segment}/`);
  }
  if (pattern.endsWith('/**')) return value.startsWith(pattern.slice(0, -3));
  if (pattern.startsWith('**/')) return value.endsWith(pattern.slice(3));
  return value === pattern;
}

export function parseMarkdown(source: string): ParsedMarkdown {
  if (!source.startsWith('---\n')) return { frontmatter: {}, body: source.trim() };
  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: source.trim() };
  const yaml = source.slice(4, end);
  const body = source.slice(end + 5).trim();
  const parsed = parseYaml(yaml) as unknown;
  if (parsed == null) return { frontmatter: {}, body };
  if (!isPlainRecord(parsed)) throw new Error('Frontmatter must be a YAML object');
  return { frontmatter: parsed, body };
}

export function serializeMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => `${key}: ${formatYamlValue(value)}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`;
}

function formatYamlValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  if (typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizePublicFrontmatter(
  frontmatter: Record<string, unknown>,
  relativePath: string,
  required: string[],
  optional: string[]
): { normalized: Record<string, unknown>; failures: string[] } {
  const allowed = new Set([...required, ...optional]);
  const failures: string[] = [];
  const normalized: Record<string, unknown> = {};

  for (const field of required) {
    if (!Object.hasOwn(frontmatter, field)) {
      const validated = validatePublicField(field, undefined, relativePath);
      failures.push(validated.ok ? `${relativePath}: ${field} is required` : validated.message);
    }
  }

  for (const field of allowed) {
    if (!Object.hasOwn(frontmatter, field)) continue;
    const value = frontmatter[field];
    const validated = validatePublicField(field, value, relativePath);
    if (validated.ok) normalized[field] = validated.value;
    else failures.push(validated.message);
  }

  return { normalized, failures };
}

function validatePublicField(
  field: string,
  value: unknown,
  relativePath: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (field === 'title') {
    if (typeof value === 'string' && value.trim()) return { ok: true, value: value.trim() };
    return { ok: false, message: `${relativePath}: title must be a non-empty string` };
  }
  if (field === 'publish') {
    if (typeof value === 'boolean') return { ok: true, value };
    return { ok: false, message: `${relativePath}: publish must be a boolean` };
  }
  if (field === 'topics') {
    if (Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
      return { ok: true, value: value.map((item) => item.trim()) };
    }
    return { ok: false, message: `${relativePath}: topics must be an array of non-empty strings when provided` };
  }
  return { ok: true, value };
}

export function validatePublicFrontmatter(frontmatter: Record<string, unknown>, relativePath: string): string[] {
  return normalizePublicFrontmatter(frontmatter, relativePath, ['title', 'publish'], ['topics']).failures;
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

export function getString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

export function extractWikilinks(body: string): string[] {
  const matches = body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return Array.from(matches, (match) => match[1]?.trim()).filter((item): item is string => Boolean(item));
}

export function renderMarkdownToSafeHtml(markdown: string, linkResolver?: (label: string) => string | null): string {
  const paragraphs: string[] = [];
  let listItems: string[] = [];

  const flushList = (): void => {
    if (listItems.length > 0) {
      paragraphs.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      paragraphs.push(`<h2>${inlineMarkdown(line.slice(3), linkResolver)}</h2>`);
    } else if (line.startsWith('# ')) {
      flushList();
      paragraphs.push(`<h1>${inlineMarkdown(line.slice(2), linkResolver)}</h1>`);
    } else if (line.startsWith('- ')) {
      listItems.push(inlineMarkdown(line.slice(2), linkResolver));
    } else {
      flushList();
      paragraphs.push(`<p>${inlineMarkdown(line, linkResolver)}</p>`);
    }
  }
  flushList();
  return paragraphs.join('\n');
}

function inlineMarkdown(value: string, linkResolver?: (label: string) => string | null): string {
  const escaped = escapeHtml(value);
  return escaped.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match: string, rawLabel: string, rawAlias: string | undefined) => {
    const label = rawLabel.trim();
    const alias = rawAlias?.trim() ?? label;
    const href = linkResolver?.(label);
    return href ? `<a href="${escapeAttribute(href)}">${escapeHtml(alias)}</a>` : `<span class="unresolved-link">${escapeHtml(alias)}</span>`;
  });
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

export async function writeJson(relativePath: string, value: unknown): Promise<void> {
  const target = resolveInsideRoot(relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeText(relativePath: string, value: string): Promise<void> {
  const target = resolveInsideRoot(relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, value, 'utf8');
}
