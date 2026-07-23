import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

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

export default function robots(): MetadataRoute.Robots {
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
