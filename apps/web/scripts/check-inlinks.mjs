#!/usr/bin/env node
/**
 * check-inlinks.mjs — counts internal inbound links per indexable page.
 *
 * Reads the live sitemap index (single source of truth: sitemap-entries.ts serves
 * it), fetches every listed page's HTML, and tallies how many *distinct* other
 * pages link to each one. A page with zero or few inbound internal links is
 * effectively an orphan for crawlers and PageRank flow, even if it's in the
 * sitemap. Multiple links from the same source page to the same target (e.g. a
 * nav + a body link) count once — otherwise a shared footer would drown out the
 * real signal.
 *
 * Usage:
 *   node scripts/check-inlinks.mjs                 # https://wewatch.uz
 *   node scripts/check-inlinks.mjs http://localhost:3000
 *   npm run check:inlinks -- http://localhost:3000
 */

const BASE = (process.argv[2] ?? 'https://wewatch.uz').replace(/\/$/, '');
const CONCURRENCY = 6;

function normalizePath(href, originHost) {
  try {
    const u = new URL(href, `${BASE}/`);
    if (u.hostname !== originHost) return null; // external link
    let p = u.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p || '/';
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

console.log(`\nInternal inbound links — ${BASE}\n`);

const originHost = new URL(BASE).hostname;

const indexXml = await fetchText(`${BASE}/sitemap.xml`);
const subSitemaps = extractLocs(indexXml);
if (subSitemaps.length === 0) throw new Error('No sub-sitemaps found in sitemap.xml');

const pageUrlSets = await Promise.all(subSitemaps.map((u) => fetchText(u).then(extractLocs)));
const pages = [...new Set(pageUrlSets.flat())];
const pagePaths = new Set(pages.map((u) => normalizePath(u, originHost)));

console.log(`${pages.length} pages in sitemap.\n`);

const inbound = new Map(); // target path -> Set(source path)
for (const p of pagePaths) inbound.set(p, new Set());

const errors = [];

await mapWithConcurrency(pages, CONCURRENCY, async (pageUrl) => {
  const sourcePath = normalizePath(pageUrl, originHost);
  let html;
  try {
    html = await fetchText(pageUrl);
  } catch (err) {
    errors.push(`${pageUrl}: ${err.message}`);
    return;
  }
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((m) => m[1]);
  const targets = new Set();
  for (const href of hrefs) {
    const target = normalizePath(href, originHost);
    if (target && target !== sourcePath && pagePaths.has(target)) targets.add(target);
  }
  for (const target of targets) inbound.get(target).add(sourcePath);
});

if (errors.length) {
  console.log(`Fetch errors (${errors.length}):`);
  for (const e of errors) console.log(`   ${e}`);
  console.log('');
}

const rows = [...inbound.entries()]
  .map(([path, sources]) => ({ path, count: sources.size }))
  .sort((a, b) => a.count - b.count);

const pad = (s, n) => String(s).padEnd(n);

console.log('Sorted lowest → highest inbound internal links:\n');
for (const { path, count } of rows) {
  const flag = count === 0 ? 'ORPHAN' : count <= 1 ? 'LOW   ' : '      ';
  console.log(`   ${flag} ${pad(count, 4)} ${path}`);
}

const orphans = rows.filter((r) => r.count === 0);
console.log(`\n${orphans.length} page(s) with zero internal inbound links.\n`);
