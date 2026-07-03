import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

export const projectRoot = process.cwd();

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
  import: z.object({
    sources: z.array(z.object({
      name: z.string(),
      type: z.string(),
      input: z.string(),
      output: z.string()
    }))
  }).optional(),
  publish: z.object({
    requireField: z.string(),
    requireValue: z.boolean(),
    output: z.string()
  }),
  routes: z.object({
    notes: z.string(),
    topics: z.string()
  }),
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

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface PublicPage {
  title: string;
  slug: string;
  path: string;
  kind: 'note' | 'topic' | 'index';
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

export async function readConfig(): Promise<RfsConfig> {
  const raw = await readFile(path.join(projectRoot, 'rfs.config.json'), 'utf8');
  return ConfigSchema.parse(JSON.parse(raw));
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
  return { frontmatter: parseSimpleYaml(yaml), body };
}

export function serializeMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => `${key}: ${formatYamlValue(value)}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`;
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    result[key] = parseYamlValue(rawValue);
  }
  return result;
}

function parseYamlValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => item.trim().replace(/^['\"]|['\"]$/g, ''));
  }
  return value.replace(/^['\"]|['\"]$/g, '');
}

function formatYamlValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  if (typeof value === 'boolean') return String(value);
  return JSON.stringify(String(value));
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
