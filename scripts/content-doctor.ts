import { readConfig, resolveInsideRoot, writeJson } from './lib/content.ts';
import { auditPublicContent, buildContentIndexes, exportPublicContent, writeContentIndexes } from './lib/pipeline.ts';

const config = await readConfig();
const vaultRoot = resolveInsideRoot(config.vault.path);
const outputRoot = resolveInsideRoot(config.publish.output);
const generatedRoot = 'src/generated';
const generatedRootAbsolute = resolveInsideRoot(generatedRoot);
const failOnBrokenWikilinks = config.privacy.failOnBrokenWikilinks || process.argv.includes('--fail-on-broken-wikilinks');

const exportResult = await exportPublicContent({
  vaultRoot,
  outputRoot,
  allow: config.vault.allow,
  ignore: config.vault.ignore,
  publish: config.publish,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields,
  collections: config.collections,
  taxonomies: config.taxonomies
});

const indexes = await buildContentIndexes({
  contentRoot: outputRoot,
  routes: config.routes,
  site: config.site,
  collections: config.collections,
  taxonomies: config.taxonomies
});
await writeContentIndexes(indexes, generatedRoot);

const auditResult = await auditPublicContent({
  scanRoots: [outputRoot, generatedRootAbsolute],
  contentRoot: outputRoot,
  cwd: process.cwd(),
  forbiddenPatterns: config.privacy.forbiddenPatterns,
  blockedFrontmatterFields: config.privacy.blockedFrontmatterFields,
  allowedEmbedDomains: config.privacy.allowedEmbedDomains,
  publish: config.publish,
  failOnBrokenWikilinks,
  collections: config.collections,
  taxonomies: config.taxonomies
});

const skippedDrafts = exportResult.skipped.filter((item) => item.reason === 'not-published');
const ignoredFiles = exportResult.skipped.filter((item) => item.reason === 'not-allowed');
const brokenWikilinks = auditResult.findings.filter((finding) => finding.category === 'wikilink');
const privateLookingFindings = auditResult.findings.filter((finding) => finding.category === 'privacy' || finding.category === 'secret');
const zeroRelatedTopics = indexes.topics.filter((topic) => topic.noteCount === 0);
const collectionSummaries = indexes.collections.map((collection) => ({
  name: collection.name,
  route: collection.route,
  pageCount: collection.pageCount
}));

const generatedAt = new Date().toISOString();
const doctorReport = {
  type: 'doctor',
  generatedAt,
  configPath: process.env['RFS_CONFIG_PATH'] ?? 'rfs.config.json',
  scannedFileCount: exportResult.scanned.length,
  exportedFileCount: exportResult.exported.length,
  skippedDrafts,
  ignoredFiles,
  brokenWikilinksByTarget: brokenWikilinks.reduce<Record<string, string[]>>((groups, finding) => {
    const target = finding.evidence ?? 'unknown';
    groups[target] = [...(groups[target] ?? []), finding.path];
    return groups;
  }, {}),
  privateLookingFindings,
  zeroRelatedTopics: zeroRelatedTopics.map((topic) => ({ title: topic.title, slug: topic.slug, path: topic.path })),
  collections: collectionSummaries,
  audit: {
    failureCount: auditResult.failures.length,
    warningCount: auditResult.warnings.length
  }
};

await writeJson('reports/export-report.json', { type: 'export', generatedAt, vault: config.vault.path, output: config.publish.output, ...exportResult });
await writeJson('reports/audit-report.json', {
  type: 'audit',
  generatedAt,
  scanRoots: [config.publish.output, generatedRoot],
  failOnBrokenWikilinks,
  ...auditResult
});
await writeJson('reports/doctor-report.json', doctorReport);

console.log('Rock from Space content doctor');
console.log(`Config: ${doctorReport.configPath}`);
console.log(`Scanned: ${doctorReport.scannedFileCount} Markdown file(s)`);
console.log(`Exported: ${doctorReport.exportedFileCount} public file(s)`);
console.log(`Skipped drafts: ${skippedDrafts.length}`);
console.log(`Ignored/not allowed: ${ignoredFiles.length}`);
console.log(`Broken wikilinks: ${brokenWikilinks.length}`);
console.log(`Private/secret-looking findings: ${privateLookingFindings.length}`);
console.log(`Topics with zero related pages: ${zeroRelatedTopics.length}`);
console.log(`Collections: ${collectionSummaries.map((collection) => `${collection.name}=${collection.pageCount}`).join(', ') || 'none'}`);
console.log('Reports: reports/export-report.json, reports/audit-report.json, reports/doctor-report.json');

if (auditResult.failures.length > 0) {
  console.error(`Content doctor found ${auditResult.failures.length} audit failure(s).`);
  process.exit(1);
}
