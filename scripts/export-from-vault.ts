import { readConfig, resolveInsideRoot } from './lib/content.ts';
import { exportPublicContent } from './lib/pipeline.ts';

const config = await readConfig();
const vaultRoot = resolveInsideRoot(config.vault.path);
const outputRoot = resolveInsideRoot(config.publish.output);

const result = await exportPublicContent({
  vaultRoot,
  outputRoot,
  allow: config.vault.allow,
  ignore: config.vault.ignore,
  publish: config.publish,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields
});

console.log(`Exported ${result.exported.length} public Markdown files to ${config.publish.output}`);
for (const file of result.exported) console.log(`- ${file}`);
