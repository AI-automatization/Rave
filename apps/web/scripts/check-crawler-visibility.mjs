#!/usr/bin/env node
/**
 * check-crawler-visibility.mjs — verifies that AI crawlers see real text.
 *
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript: whatever
 * is missing from the raw HTML response is missing from the model's answer. This
 * script fetches each route with several user agents, strips markup, and fails if
 * any agent sees less text than the threshold.
 *
 * Usage:
 *   node scripts/check-crawler-visibility.mjs                 # https://wewatch.uz
 *   node scripts/check-crawler-visibility.mjs http://localhost:3000
 *   npm run check:crawlers -- http://localhost:3000
 */

const MIN_VISIBLE_CHARS = 1000;

const BASE = (process.argv[2] ?? 'https://wewatch.uz').replace(/\/$/, '');

const AGENTS = {
  GPTBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0; +claudebot@anthropic.com',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

/** Route → words that must be present in the served HTML for the page to be useful. */
const ROUTES = [
  { path: '/', keywords: ['WeWatch', 'watch party'] },
  { path: '/uz', keywords: ['WeWatch', 'birgalikda'] },
  { path: '/en', keywords: ['WeWatch', 'watch'] },
  { path: '/faq', keywords: ['watch party', 'синхрон'] },
  { path: '/how-it-works', keywords: ['комнат', 'ссылк'] },
  { path: '/guides/smotret-vmeste-onlayn', keywords: ['вместе'] },
  { path: '/uz/guides/birgalikda-tomosha-qilish', keywords: ['birgalikda'] },
];

/** Removes script/style bodies and tags, leaving what a text-only reader would see. */
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function check(path, agentName, userAgent, keywords) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const html = await res.text();
    const text = visibleText(html);
    const missing = keywords.filter((k) => !text.toLowerCase().includes(k.toLowerCase()));
    return {
      status: res.status,
      bytes: html.length,
      chars: text.length,
      missing,
      pass: res.status === 200 && text.length >= MIN_VISIBLE_CHARS && missing.length === 0,
    };
  } catch (err) {
    return { status: 0, bytes: 0, chars: 0, missing: keywords, pass: false, error: String(err) };
  }
}

const pad = (s, n) => String(s).padEnd(n);

let failures = 0;
console.log(`\nCrawler visibility — ${BASE}  (threshold: ${MIN_VISIBLE_CHARS} visible chars)\n`);

for (const route of ROUTES) {
  console.log(`── ${route.path}`);
  for (const [agentName, ua] of Object.entries(AGENTS)) {
    const r = await check(route.path, agentName, ua, route.keywords);
    if (!r.pass) failures++;
    const flag = r.pass ? 'PASS' : 'FAIL';
    const note = r.error
      ? ` ${r.error}`
      : r.missing.length
        ? ` missing: ${r.missing.join(', ')}`
        : '';
    console.log(
      `   ${pad(flag, 5)} ${pad(agentName, 15)} HTTP ${pad(r.status, 4)} ${pad(`${r.bytes}B raw`, 12)} ${pad(`${r.chars} chars`, 13)}${note}`,
    );
  }
  console.log('');
}

if (failures > 0) {
  console.error(`${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log('All routes are fully visible to crawlers without JavaScript.\n');
