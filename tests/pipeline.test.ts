import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditPublicContent, buildContentIndexes, exportPublicContent } from '../scripts/lib/pipeline.ts';

const fixturesRoot = path.resolve('tests/fixtures');
const publish = { requireField: 'publish', requireValue: true, output: 'content' };
const site = {
  title: 'Fixture Site',
  description: 'A fixture site.',
  language: 'en',
  url: 'https://example.com',
  base: '/'
};
const routes = { notes: '/notes', topics: '/topics' };
const notesCollection = {
  name: 'notes',
  source: 'Notes/**',
  route: '/notes',
  template: 'note',
  schema: { required: ['title', 'publish'], optional: ['topics'] }
};
const topicsTaxonomy = { name: 'topics', field: 'topics', route: '/topics', source: 'Topics/**', template: 'topic' };

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs = [];
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'rfs-test-'));
  tempDirs.push(dir);
  return dir;
}

describe('content pipeline integration', () => {
  it('exports only allowed published content from a vault fixture', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    const result = await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'valid-vault'),
      outputRoot,
      allow: ['index.md', 'Notes/**', 'Topics/**'],
      ignore: ['.obsidian/**', '**/Private/**'],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal']
    });

    expect(result.scanned).toEqual([
      'index.md',
      'Notes/Draft Beta.md',
      'Notes/Private/Ignored.md',
      'Notes/Public Alpha.md',
      'Topics/Markdown.md'
    ]);
    expect(result.exported).toEqual(['index.md', 'Notes/Public Alpha.md', 'Topics/Markdown.md']);
    expect(result.skipped).toEqual([
      { path: 'Notes/Draft Beta.md', reason: 'not-published' },
      { path: 'Notes/Private/Ignored.md', reason: 'not-allowed' }
    ]);
    await expect(readFile(path.join(outputRoot, 'Notes/Public Alpha.md'), 'utf8')).resolves.toContain('title: "Public Alpha"');
    await expect(readFile(path.join(outputRoot, 'Notes/Draft Beta.md'), 'utf8')).rejects.toThrow();
    await expect(readFile(path.join(outputRoot, 'Notes/Private/Ignored.md'), 'utf8')).rejects.toThrow();
  });

  it('fails export when a publishable note contains blocked frontmatter', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    await expect(
      exportPublicContent({
        vaultRoot: path.join(fixturesRoot, 'blocked-frontmatter-vault'),
        outputRoot,
        allow: ['Notes/**'],
        ignore: [],
        publish,
        blockedFrontmatterFields: ['private', 'secret', 'internal']
      })
    ).rejects.toThrow("Blocked frontmatter field 'private' in Notes/Blocked.md");
  });

  it('exports a publishable note with valid collection frontmatter', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    const result = await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'frontmatter-vault'),
      outputRoot,
      allow: ['Notes/Valid Note.md'],
      ignore: [],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal']
    });

    expect(result.exported).toEqual(['Notes/Valid Note.md']);
    const exported = await readFile(path.join(outputRoot, 'Notes/Valid Note.md'), 'utf8');
    expect(exported).toContain('topics: ["Markdown"]');
  });

  it('exports Obsidian-style multiline YAML while keeping only public allowlisted fields', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    const result = await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'obsidian-yaml-vault'),
      outputRoot,
      allow: ['Notes/**'],
      ignore: [],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      collections: [notesCollection],
      taxonomies: [topicsTaxonomy]
    });

    expect(result.exported).toEqual(['Notes/Multiline Properties.md']);
    const exported = await readFile(path.join(outputRoot, 'Notes/Multiline Properties.md'), 'utf8');
    expect(exported).toContain('title: "Multiline Properties"');
    expect(exported).toContain('topics: ["Markdown", "Privacy"]');
    expect(exported).not.toContain('editorial_status');
    expect(exported).not.toContain('created:');
  });

  it('generates a topic route from note metadata even without a Topics term page', async () => {
    const outputRoot = path.join(await tempDir(), 'content');
    await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'generated-topic-vault'),
      outputRoot,
      allow: ['Notes/**', 'Topics/**'],
      ignore: [],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      collections: [notesCollection],
      taxonomies: [topicsTaxonomy]
    });

    const indexes = await buildContentIndexes({ contentRoot: outputRoot, routes, site, collections: [notesCollection], taxonomies: [topicsTaxonomy] });

    expect(indexes.topics).toEqual([
      expect.objectContaining({ title: 'Unwritten Topic', slug: 'unwritten-topic', path: null, noteSlugs: ['generated-topic'], noteCount: 1 })
    ]);
  });

  it('enriches a generated topic when a matching Topics term page exists', async () => {
    const outputRoot = path.join(await tempDir(), 'content');
    await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'enriched-topic-vault'),
      outputRoot,
      allow: ['Notes/**', 'Topics/**'],
      ignore: [],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      collections: [notesCollection],
      taxonomies: [topicsTaxonomy]
    });

    const indexes = await buildContentIndexes({ contentRoot: outputRoot, routes, site, collections: [notesCollection], taxonomies: [topicsTaxonomy] });
    const topic = indexes.topics.find((candidate) => candidate.slug === 'enriched-topic');

    expect(topic).toEqual(expect.objectContaining({ title: 'Enriched Topic', path: 'Topics/Enriched Topic.md', noteSlugs: ['enriched-topic-note'], noteCount: 1 }));
    expect(topic?.bodyHtml).toContain('term page can enrich generated topic output');
  });

  it('represents a second collection without hardcoded note routing', async () => {
    const outputRoot = path.join(await tempDir(), 'content');
    const guidesCollection = {
      name: 'guides',
      source: 'Guides/**',
      route: '/guides',
      template: 'article',
      schema: { required: ['title', 'publish'], optional: ['topics'] }
    };

    await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'second-collection-vault'),
      outputRoot,
      allow: ['Guides/**'],
      ignore: [],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      collections: [notesCollection, guidesCollection],
      taxonomies: [topicsTaxonomy]
    });
    const indexes = await buildContentIndexes({
      contentRoot: outputRoot,
      routes,
      site,
      collections: [notesCollection, guidesCollection],
      taxonomies: [topicsTaxonomy]
    });

    expect(indexes.collections.find((collection) => collection.name === 'guides')).toEqual(
      expect.objectContaining({ route: '/guides', template: 'article', pageCount: 1, pages: [expect.objectContaining({ slug: 'first-guide' })] })
    );
    expect(indexes.pages.find((page) => page.slug === 'first-guide')).toEqual(expect.objectContaining({ collection: 'guides', kind: 'collection', route: '/guides/first-guide/' }));
  });

  it('fails export when a publishable note has no title', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    await expect(
      exportPublicContent({
        vaultRoot: path.join(fixturesRoot, 'frontmatter-vault'),
        outputRoot,
        allow: ['Notes/Missing Title.md'],
        ignore: [],
        publish,
        blockedFrontmatterFields: ['private', 'secret', 'internal']
      })
    ).rejects.toThrow('Notes/Missing Title.md: title must be a non-empty string');
  });

  it('fails export when a publishable note has malformed topics', async () => {
    const outputRoot = path.join(await tempDir(), 'content');

    await expect(
      exportPublicContent({
        vaultRoot: path.join(fixturesRoot, 'frontmatter-vault'),
        outputRoot,
        allow: ['Notes/Malformed Topics.md'],
        ignore: [],
        publish,
        blockedFrontmatterFields: ['private', 'secret', 'internal']
      })
    ).rejects.toThrow('Notes/Malformed Topics.md: topics must be an array of non-empty strings when provided');
  });

  it('audits invalid public frontmatter in exported content', async () => {
    const contentRoot = path.join(fixturesRoot, 'frontmatter-vault');

    const result = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: fixturesRoot,
      forbiddenPatterns: ['/home/', 'password', 'secret', 'api_key', 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      allowedEmbedDomains: [],
      publish,
      failOnBrokenWikilinks: true
    });

    expect(result.warnings).toEqual([]);
    expect(result.failures).toContain('frontmatter-vault/Notes/Missing Title.md: title must be a non-empty string');
    expect(result.failures).toContain(
      'frontmatter-vault/Notes/Malformed Topics.md: topics must be an array of non-empty strings when provided'
    );
  });

  it('builds deterministic indexes from exported content', async () => {
    const outputRoot = path.join(await tempDir(), 'content');
    await exportPublicContent({
      vaultRoot: path.join(fixturesRoot, 'valid-vault'),
      outputRoot,
      allow: ['index.md', 'Notes/**', 'Topics/**'],
      ignore: ['.obsidian/**', '**/Private/**'],
      publish,
      blockedFrontmatterFields: ['private', 'secret', 'internal']
    });

    const first = await buildContentIndexes({ contentRoot: outputRoot, routes, site });
    const second = await buildContentIndexes({ contentRoot: outputRoot, routes, site });

    expect(second).toEqual(first);
    expect(first.meta).toEqual({ pageCount: 3, noteCount: 1, topicCount: 1, collectionCount: 0, site });
    expect(first.pages.map((page) => page.slug)).toEqual(['home', 'markdown', 'public-alpha']);
    expect(first.links).toEqual([
      { from: 'home', to: 'public-alpha', label: 'Public Alpha' },
      { from: 'public-alpha', to: 'markdown', label: 'Markdown' }
    ]);
  });

  it('audits broken wikilinks as warnings or failures based on config', async () => {
    const contentRoot = path.join(fixturesRoot, 'broken-link-content');

    const warningResult = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: fixturesRoot,
      forbiddenPatterns: ['/home/', 'password', 'secret', 'api_key', 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      allowedEmbedDomains: [],
      publish,
      failOnBrokenWikilinks: false
    });
    expect(warningResult.scanned).toEqual(['broken-link-content/Notes/Broken.md']);
    expect(warningResult.failures).toEqual([]);
    expect(warningResult.warnings).toEqual(['Notes/Broken.md: unresolved wikilink [[Missing Target]]']);

    const failureResult = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: fixturesRoot,
      forbiddenPatterns: ['/home/', 'password', 'secret', 'api_key', 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      allowedEmbedDomains: [],
      publish,
      failOnBrokenWikilinks: true
    });
    expect(failureResult.warnings).toEqual([]);
    expect(failureResult.failures).toEqual(['Notes/Broken.md: unresolved wikilink [[Missing Target]]']);
  });

  it('audits private leak patterns and secret-looking values', async () => {
    const contentRoot = path.join(await tempDir(), 'content');
    const notesRoot = path.join(contentRoot, 'Notes');
    const keyName = ['api', 'key'].join('_');
    await mkdir(notesRoot, { recursive: true });
    await writeFile(
      path.join(notesRoot, 'Leak.md'),
      `---\ntitle: "Leak"\npublish: true\ntopics: []\n---\n\n# Leak\n\nThis contains ${keyName}: "example-test-key" for audit testing.\n`,
      'utf8'
    );

    const result = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: path.dirname(contentRoot),
      forbiddenPatterns: ['/home/', 'password', 'secret', keyName, 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      allowedEmbedDomains: [],
      publish,
      failOnBrokenWikilinks: true
    });

    expect(result.warnings).toEqual([]);
    expect(result.failures).toEqual([
      `content/Notes/Leak.md: forbidden pattern '${keyName}'`,
      'content/Notes/Leak.md: secret-looking value'
    ]);
  });

  it('audits raw HTML, embeds, backend env names and malformed frontmatter', async () => {
    const contentRoot = path.join(await tempDir(), 'content');
    const notesRoot = path.join(contentRoot, 'Notes');
    const backendEnv = ['SERVICE', 'ROLE'].join('_');
    await mkdir(notesRoot, { recursive: true });
    await writeFile(
      path.join(notesRoot, 'Bad.md'),
      `---\ntitle: "Bad"\npublish: true\ntopics: []\n---\n\n# Bad\n\n<p>raw html</p>\n\n<iframe src="https://evil.example/embed"></iframe>\n\n${backendEnv}=example\n`,
      'utf8'
    );
    await writeFile(
      path.join(notesRoot, 'Allowed.md'),
      `---\ntitle: "Allowed"\npublish: true\ntopics: []\n---\n\n# Allowed\n\n<iframe src="https://videos.example.com/embed/demo"></iframe>\n`,
      'utf8'
    );
    await writeFile(path.join(notesRoot, 'Malformed.md'), '---\ntitle: [\n---\n\n# Broken\n', 'utf8');

    const result = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: path.dirname(contentRoot),
      forbiddenPatterns: ['/home/', 'password', 'secret', 'api_key', 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
      allowedEmbedDomains: ['example.com'],
      publish,
      failOnBrokenWikilinks: true
    });

    expect(result.warnings).toEqual([]);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        `content/Notes/Bad.md: backend-only environment name '${backendEnv}'`,
        'content/Notes/Bad.md: raw HTML tag <p> is not allowed',
        'content/Notes/Bad.md: raw <iframe> embed domain is not allowlisted'
      ])
    );
    expect(result.failures.some((failure) => failure.startsWith('content/Notes/Malformed.md: malformed frontmatter:'))).toBe(true);
    expect(result.findings.some((finding) => finding.path === 'content/Notes/Allowed.md')).toBe(false);
  });
});
