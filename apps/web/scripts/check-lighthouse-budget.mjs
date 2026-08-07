#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const reportPath = process.argv[2];

if (!reportPath) {
  console.error('Usage: node scripts/check-lighthouse-budget.mjs <lighthouse-report.json>');
  process.exit(2);
}

const report = JSON.parse(await readFile(reportPath, 'utf8'));
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

const metrics = {
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
