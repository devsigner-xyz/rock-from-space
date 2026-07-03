import { readConfig, resolveInsideRoot } from './lib/content.ts';
import { buildContentIndexes, writeContentIndexes } from './lib/pipeline.ts';

const config = await readConfig();
const contentRoot = resolveInsideRoot(config.publish.output);
const indexes = await buildContentIndexes({
  contentRoot,
  routes: config.routes,
  site: config.site,
  collections: config.collections,
  taxonomies: config.taxonomies
});

await writeContentIndexes(indexes);

console.log(
  `Generated indexes: ${indexes.pages.length} pages, ${indexes.meta.noteCount} notes, ${indexes.topics.length} topics, ${indexes.collections.length} collections, ${indexes.links.length} links`
);
