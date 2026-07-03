import { readConfig, resolveInsideRoot } from './lib/content.ts';
import { auditPublicContent } from './lib/pipeline.ts';

const config = await readConfig();
const failOnBrokenWikilinks = config.privacy.failOnBrokenWikilinks || process.argv.includes('--fail-on-broken-wikilinks');
const scanRoots = [config.publish.output, 'src/generated'];
const absoluteScanRoots = scanRoots.map((root) => resolveInsideRoot(root));
const contentRoot = resolveInsideRoot(config.publish.output);

const result = await auditPublicContent({
  scanRoots: absoluteScanRoots,
  contentRoot,
  cwd: process.cwd(),
  forbiddenPatterns: config.privacy.forbiddenPatterns,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields,
  publish: config.publish,
  failOnBrokenWikilinks
});

for (const warning of result.warnings) console.warn(`WARN ${warning}`);
if (result.failures.length > 0) {
  console.error(`Content audit failed with ${result.failures.length} issue(s):`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content audit passed. Scanned ${scanRoots.join(', ')} with ${result.warnings.length} warning(s).`);
