export interface TopicRelatedPage {
  title: string;
  slug: string;
  kind: 'note' | 'topic' | 'index' | 'collection';
  route: string;
}

export interface TopicWithRelatedSlugs {
  noteSlugs: string[];
}

export function relatedContentForTopic<TPage extends TopicRelatedPage>(topic: TopicWithRelatedSlugs, pages: TPage[]): TPage[] {
  return topic.noteSlugs
    .map((slug) => pages.find((page) => page.slug === slug && page.kind !== 'index' && page.kind !== 'topic'))
    .filter((page): page is TPage => Boolean(page));
}