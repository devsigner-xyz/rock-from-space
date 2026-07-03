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

    expect(result.exported).toEqual(['index.md', 'Notes/Public Alpha.md', 'Topics/Markdown.md']);
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
    expect(first.meta).toEqual({ pageCount: 3, noteCount: 1, topicCount: 1, site });
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
      publish,
      failOnBrokenWikilinks: false
    });
    expect(warningResult.failures).toEqual([]);
    expect(warningResult.warnings).toEqual(['Notes/Broken.md: unresolved wikilink [[Missing Target]]']);

    const failureResult = await auditPublicContent({
      scanRoots: [contentRoot],
      contentRoot,
      cwd: fixturesRoot,
      forbiddenPatterns: ['/home/', 'password', 'secret', 'api_key', 'token'],
      blockedFrontmatterFields: ['private', 'secret', 'internal'],
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
      publish,
      failOnBrokenWikilinks: true
    });

    expect(result.warnings).toEqual([]);
    expect(result.failures).toEqual([
      `content/Notes/Leak.md: forbidden pattern '${keyName}'`,
      'content/Notes/Leak.md: secret-looking value'
    ]);
  });
});
