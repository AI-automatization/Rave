#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

// 2026-08-10 (T-S197 follow-up, found by Yakubov + verified live by Saidazim via `gh run view
// --log-failed`): a single cold-runner Lighthouse run is not a stable signal — the same commit
// passed on push (warm-ish runner) and failed on PR (cold runner) with TBT 2809ms vs the same
// code's own 145/126ms on the next two tries. That flakiness was silently SKIPPING the Railway
// deploy step (Typecheck gate -> FAILURE -> Deploy to Railway -> SKIPPED), which is how prod sat
// 13 days stale. Accepts one or more report paths now; the workflow runs Lighthouse 3x and this
// takes the MEDIAN per metric across all runs, so one cold first-run outlier can no longer decide
// pass/fail. Still works exactly as before with a single path (median of 1 = that value).
const reportPaths = process.argv.slice(2);

if (reportPaths.length === 0) {
  console.error('Usage: node scripts/check-lighthouse-budget.mjs <report1.json> [report2.json ...]');
  process.exit(2);
}

function extractMetrics(report) {
  const audits = report.audits;
  const categories = report.categories;
  const baseHost = new URL(report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl).host;
  const requests = audits['network-requests']?.details?.items ?? [];
  const scripts = requests.filter((request) => request.resourceType === 'Script');
  const kib = (bytes) => bytes / 1024;
  const scriptBytes = (items) => items.reduce((sum, request) => sum + (request.transferSize ?? 0), 0);
  const firstPartyScripts = scripts.filter((request) => new URL(request.url).host === baseHost);
  const thirdPartyScripts = scripts.filter((request) => new URL(request.url).host !== baseHost);
  const totalTransferBytes = requests.reduce((sum, request) => sum + (request.transferSize ?? 0), 0);

  return {
    performance: categories.performance.score * 100,
    accessibility: categories.accessibility.score * 100,
    bestPractices: categories['best-practices'].score * 100,
    seo: categories.seo.score * 100,
    lcpMs: audits['largest-contentful-paint'].numericValue,
    tbtMs: audits['total-blocking-time'].numericValue,
    cls: audits['cumulative-layout-shift'].numericValue,
    firstPartyScriptKiB: kib(scriptBytes(firstPartyScripts)),
    thirdPartyScriptKiB: kib(scriptBytes(thirdPartyScripts)),
    totalTransferKiB: kib(totalTransferBytes),
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const runs = await Promise.all(
  reportPaths.map(async (path) => extractMetrics(JSON.parse(await readFile(path, 'utf8')))),
);

const metricKeys = Object.keys(runs[0]);
const metrics = {};
if (runs.length > 1) {
  console.log(`\n${runs.length} Lighthouse runs — per-metric values and median used for the budget check below:\n`);
}
for (const key of metricKeys) {
  const values = runs.map((r) => r[key]);
  metrics[key] = median(values);
  if (runs.length > 1) {
    console.log(`  ${key}: [${values.map((v) => v.toFixed(1)).join(', ')}] -> median ${metrics[key].toFixed(1)}`);
  }
}

// These are regression guards, not the final Core Web Vitals targets. The
// stricter p75 goals remain in docs/seo/measurement-plan.md and are evaluated
// from production field data after enough traffic has accumulated.
const budgets = [
  ['Performance score', metrics.performance, 60, 'min'],
  ['Accessibility score', metrics.accessibility, 100, 'min'],
  ['Best Practices score', metrics.bestPractices, 100, 'min'],
  ['SEO score', metrics.seo, 100, 'min'],
  ['LCP (ms)', metrics.lcpMs, 4500, 'max'],
  ['TBT (ms)', metrics.tbtMs, 1500, 'max'],
  ['CLS', metrics.cls, 0.05, 'max'],
  ['First-party script (KiB)', metrics.firstPartyScriptKiB, 350, 'max'],
  ['Third-party script (KiB)', metrics.thirdPartyScriptKiB, 190, 'max'],
  ['Total transfer (KiB)', metrics.totalTransferKiB, 850, 'max'],
];

let failed = false;

console.log('\nLighthouse regression budget\n');
for (const [label, value, limit, direction] of budgets) {
  const pass = direction === 'min' ? value >= limit : value <= limit;
  failed ||= !pass;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${value.toFixed(1)} (${direction} ${limit})`);
}

if (failed) {
  console.error('\nLighthouse regression budget failed.');
  process.exit(1);
}

console.log('\nAll Lighthouse regression budgets passed.');
