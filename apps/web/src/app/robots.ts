import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const CANONICAL_HOST = new URL(BASE).host.toLowerCase();

// AI answer engines and search crawlers are explicitly allowed so WeWatch can be
// cited by ChatGPT, Claude, Perplexity, Google AI Overviews, Yandex and others.
// An explicit `allow` entry outranks the wildcard rule for that agent, so adding a
// bot here is what makes the permission unambiguous rather than merely implied.
const AI_AND_SEARCH_BOTS = [
  // Search
  'Googlebot',
  'Bingbot',
  'YandexBot',
  'Applebot',
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google / Apple AI training
  'Google-Extended',
  'Applebot-Extended',
  // Others
  'Amazonbot',
  'meta-externalagent',
  'Bytespider',
  'cohere-ai',
  'Diffbot',
  'Timpibot',
  'CCBot',
];

// App routes (/room, /login, /profile …) are 301-redirected to app.wewatch.uz by
// next.config.mjs, so they are not listed here — this host serves marketing and
// legal pages only. /api/ is the one path that answers on this domain and must
// stay out of the index.
const DISALLOW = ['/api/'];

// The same deployment answers on more than one host: the canonical apex plus whatever
// technical domain the platform assigns (web-production-*.up.railway.app). Until now the
// rules below were emitted verbatim on every one of them, so a full copy of the landing
// site advertised itself as crawlable on a second host — only `sitemap`/`host` followed
// NEXT_PUBLIC_APP_URL, and neither of those keeps a crawler out.
//
// Non-canonical hosts therefore serve `Disallow: /`, the same stance apps/admin-ui and
// apps/app-web already take in their static robots.txt. Deliberately not `noindex`:
// those pages carry rel=canonical to wewatch.uz, and Google may propagate a noindex
// across a canonical pair to the target — the one page we cannot afford to lose.
function isCanonicalHost(host: string): boolean {
  const name = host.toLowerCase().split(':')[0];
  // www.* is 301'd to the apex by next.config.mjs and never serves this route; treating
  // it as canonical keeps the redirect the single place that decides host collapsing.
  // An absent Host header means a non-HTTP caller (build-time render), which must get
  // the production rules — otherwise a prerender would bake in the blocking variant.
  return name === '' || name === CANONICAL_HOST || name === `www.${CANONICAL_HOST}`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? '';

  if (!isCanonicalHost(host)) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_AND_SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
