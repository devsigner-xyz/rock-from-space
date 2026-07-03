import { readConfig, resolveInsideRoot, writeJson } from './lib/content.ts';
import { auditPublicContent } from './lib/pipeline.ts';

function getReportPath(defaultPath: string): string | null {
  const index = process.argv.indexOf('--report');
  if (index === -1) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : defaultPath;
}

const config = await readConfig();
const failOnBrokenWikilinks = config.privacy.failOnBrokenWikilinks || process.argv.includes('--fail-on-broken-wikilinks');
const reportPath = getReportPath('reports/audit-report.json');
const scanRoots = [config.publish.output, 'src/generated'];
const absoluteScanRoots = scanRoots.map((root) => resolveInsideRoot(root));
const contentRoot = resolveInsideRoot(config.publish.output);

const result = await auditPublicContent({
  scanRoots: absoluteScanRoots,
  contentRoot,
  cwd: process.cwd(),
  forbiddenPatterns: config.privacy.forbiddenPatterns,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields,
  allowedEmbedDomains: config.privacy.allowedEmbedDomains,
  publish: config.publish,
  failOnBrokenWikilinks,
  collections: config.collections,
  taxonomies: config.taxonomies
});

if (reportPath) {
  await writeJson(reportPath, {
    type: 'audit',
    generatedAt: new Date().toISOString(),
    scanRoots,
    failOnBrokenWikilinks,
    summary: {
      scannedFileCount: result.scanned.length,
      failureCount: result.failures.length,
      warningCount: result.warnings.length,
      findingsByCategory: result.findings.reduce<Record<string, number>>((counts, finding) => {
        counts[finding.category] = (counts[finding.category] ?? 0) + 1;
        return counts;
      }, {})
    },
    ...result
  });
  console.log(`Wrote audit report to ${reportPath}`);
}

for (const warning of result.warnings) console.warn(`WARN ${warning}`);
if (result.failures.length > 0) {
  console.error(`Content audit failed with ${result.failures.length} issue(s):`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content audit passed. Scanned ${scanRoots.join(', ')} with ${result.scanned.length} file(s) and ${result.warnings.length} warning(s).`);
