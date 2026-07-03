import { readConfig, resolveInsideRoot, writeJson } from './lib/content.ts';
import { exportPublicContent } from './lib/pipeline.ts';

function getReportPath(defaultPath: string): string | null {
  const index = process.argv.indexOf('--report');
  if (index === -1) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : defaultPath;
}

const config = await readConfig();
const vaultRoot = resolveInsideRoot(config.vault.path);
const outputRoot = resolveInsideRoot(config.publish.output);
const reportPath = getReportPath('reports/export-report.json');

const result = await exportPublicContent({
  vaultRoot,
  outputRoot,
  allow: config.vault.allow,
  ignore: config.vault.ignore,
  publish: config.publish,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields,
  collections: config.collections,
  taxonomies: config.taxonomies
});

console.log(`Exported ${result.exported.length} public Markdown files to ${config.publish.output}`);
console.log(`Scanned ${result.scanned.length} Markdown file(s); skipped ${result.skipped.length}.`);
for (const file of result.exported) console.log(`- ${file}`);
if (reportPath) {
  await writeJson(reportPath, {
    type: 'export',
    generatedAt: new Date().toISOString(),
    vault: config.vault.path,
    output: config.publish.output,
    ...result
  });
  console.log(`Wrote export report to ${reportPath}`);
}
