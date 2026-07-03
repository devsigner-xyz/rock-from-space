import { describe, expect, it } from 'vitest';
import {
  extractWikilinks,
  isAllowed,
  parseMarkdown,
  renderMarkdownToSafeHtml,
  serializeMarkdown,
  slugify
} from '../scripts/lib/content.ts';

describe('content utilities', () => {
  it('slugifies titles deterministically', () => {
    expect(slugify('Obsidian compatible publishing')).toBe('obsidian-compatible-publishing');
    expect(slugify('Café & Space Rocks!')).toBe('cafe-space-rocks');
    expect(slugify('---')).toBe('untitled');
  });

  it('parses markdown frontmatter and body', () => {
    const parsed = parseMarkdown('---\ntitle: "Hello"\npublish: true\ntopics: ["Astro", "Privacy"]\n---\n\n# Body\n');

    expect(parsed.frontmatter).toEqual({
      title: 'Hello',
      publish: true,
      topics: ['Astro', 'Privacy']
    });
    expect(parsed.body).toBe('# Body');
  });

  it('serializes markdown frontmatter and body', () => {
    expect(serializeMarkdown({ title: 'Hello', publish: true, topics: ['Astro', 'Privacy'] }, 'Body')).toBe(
      '---\ntitle: "Hello"\npublish: true\ntopics: ["Astro", "Privacy"]\n---\n\nBody\n'
    );
  });

  it('extracts wikilinks without aliases', () => {
    expect(extractWikilinks('See [[Astro]] and [[Privacy by design|privacy]].')).toEqual(['Astro', 'Privacy by design']);
  });

  it('renders markdown to safe HTML and escapes basic HTML', () => {
    const html = renderMarkdownToSafeHtml('# Hello <script>alert(1)</script>\n\nSee [[Astro|Astro guide]].', (label) =>
      label === 'Astro' ? '/topics/astro/' : null
    );

    expect(html).toContain('<h1>Hello &lt;script&gt;alert(1)&lt;/script&gt;</h1>');
    expect(html).toContain('<a href="/topics/astro/">Astro guide</a>');
    expect(html).not.toContain('<script>');
  });

  it('checks allow and ignore patterns', () => {
    expect(isAllowed('Notes/Public.md', ['Notes/**'], ['**/Private/**'])).toBe(true);
    expect(isAllowed('Notes/Private/Secret.md', ['Notes/**'], ['**/Private/**'])).toBe(false);
    expect(isAllowed('.obsidian/workspace.json', ['Notes/**'], ['.obsidian/**'])).toBe(false);
    expect(isAllowed('Drafts/Idea.md', ['Notes/**'], [])).toBe(false);
  });
});
