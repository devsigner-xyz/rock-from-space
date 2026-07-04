import { describe, expect, it } from 'vitest';
import { relatedContentForTopic } from '../src/lib/topic-related.ts';

describe('topic related content', () => {
  it('returns related collection pages and keeps their generated routes', () => {
    const pages = [
      { title: 'Home', slug: 'home', kind: 'index' as const, route: '/' },
      { title: 'Privacy', slug: 'privacy', kind: 'topic' as const, route: '/topics/privacy/' },
      { title: 'Private notes', slug: 'private-notes', kind: 'note' as const, route: '/notes/private-notes/' },
      { title: 'A related talk', slug: 'related-talk', kind: 'collection' as const, route: '/talks/related-talk/' }
    ];

    expect(relatedContentForTopic({ noteSlugs: ['privacy', 'related-talk', 'private-notes', 'missing'] }, pages)).toEqual([
      expect.objectContaining({ slug: 'related-talk', route: '/talks/related-talk/' }),
      expect.objectContaining({ slug: 'private-notes', route: '/notes/private-notes/' })
    ]);
  });
});