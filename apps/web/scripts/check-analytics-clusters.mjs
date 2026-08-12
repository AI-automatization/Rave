#!/usr/bin/env node
/**
 * check-analytics-clusters.mjs — every indexable content page must have a source cluster.
 *
 * `source_cluster` is what ties a registration back to the SEO work that produced
 * it (docs/seo/measurement-plan.md §Event contract). A guide missing from
 * CLUSTER_BY_SLUG does not fail anything at runtime — it quietly reports as
 * `other`, and the cluster it belongs to looks smaller than it is. Since guides are
 * added one file at a time and the mapping lives in another file, that drift is a
 * matter of when, not if. This check makes it loud.
 *
 * Reads sources as text on purpose: the registries are TypeScript, and a check
 * that needed a build step would not survive being run casually.
 *
 * Usage:
 *   node scripts/check-analytics-clusters.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');

const read = (relative) => readFileSync(join(webRoot, relative), 'utf8');

/** Slugs the analytics layer knows a cluster for. */
function clusteredSlugs() {
  const source = read('src/lib/analytics/page-context.ts');
  const block = source.match(/const CLUSTER_BY_SLUG[^{]*\{([\s\S]*?)\n\};/);
  if (!block) {
    throw new Error('CLUSTER_BY_SLUG not found in src/lib/analytics/page-context.ts');
  }
  return new Set([...block[1].matchAll(/'([^']+)':/g)].map((m) => m[1]));
}

/** Last path segment of every guide in the registry. */
function guideSlugs() {
  const source = read('src/data/guides.ts');
  return [...source.matchAll(/^\s*path: '([^']+)',/gm)].map((m) => ({
    path: m[1],
    slug: m[1].split('/').filter(Boolean).pop(),
  }));
}

/** Last path segment of every use-case page, all locales. */
function useCaseSlugs() {
  const source = read('src/data/use-cases.ts');
  const block = source.match(/USE_CASE_GROUPS[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!block) throw new Error('USE_CASE_GROUPS not found in src/data/use-cases.ts');
  return [...block[1].matchAll(/'(\/[^']+)'/g)].map((m) => ({
    path: m[1],
    slug: m[1].split('/').filter(Boolean).pop(),
  }));
}

const known = clusteredSlugs();
const pages = [...guideSlugs(), ...useCaseSlugs()];
const missing = pages.filter((page) => !known.has(page.slug));

for (const page of pages) {
  const mark = known.has(page.slug) ? 'ok  ' : 'MISS';
  console.log(`${mark} ${page.path}`);
}

console.log(`\n${pages.length - missing.length}/${pages.length} pages have a source cluster.`);

if (missing.length > 0) {
  console.error(
    `\nFAIL — no source_cluster for:\n${missing.map((p) => `  ${p.path} (slug: ${p.slug})`).join('\n')}\n` +
      'Add each slug to CLUSTER_BY_SLUG in src/lib/analytics/page-context.ts.',
  );
  process.exit(1);
}
