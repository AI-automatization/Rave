/**
 * Classifies where a visit came from, for the `referrer_class` parameter of
 * `organic_landing_view` (docs/seo/measurement-plan.md §Event contract).
 *
 * `ai_assistant` is a class of its own rather than a kind of referral, and that is
 * the point of this file. The 2026-08-10 baseline measured 400 impressions in
 * Google's generative surfaces over 28 days and a GA4 "AI Assistant" channel that
 * grew 114% week over week; GEO work cannot be judged against a number that is
 * mixed into generic referral traffic.
 *
 * Honest limit: a click from a Google AI Overview or AI Mode answer arrives with a
 * plain `google.com` referrer and no marker distinguishing it from a blue-link
 * click. Those land in `organic_search` here, and Search Console's "Generative AI"
 * report stays the only source for that split. This function only separates the
 * assistants that are their own hosts.
 */

export type ReferrerClass =
  | 'ai_assistant'
  | 'organic_search'
  | 'social'
  | 'referral'
  | 'direct'
  | 'internal';

/** Assistants that send traffic as themselves. Checked before search engines: gemini.google.com is a google.com subdomain. */
const AI_ASSISTANT_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'openai.com',
  'perplexity.ai',
  'gemini.google.com',
  'bard.google.com',
  'claude.ai',
  'copilot.microsoft.com',
  'you.com',
  'poe.com',
  'phind.com',
  'deepseek.com',
  'chat.mistral.ai',
  'grok.com',
  'meta.ai',
];

const SEARCH_HOSTS = [
  'google.',
  'yandex.',
  'bing.com',
  'duckduckgo.com',
  'search.yahoo.com',
  'go.mail.ru',
  'rambler.ru',
  'ecosia.org',
  'search.brave.com',
  'baidu.com',
];

const SOCIAL_HOSTS = [
  't.me',
  'telegram.me',
  'instagram.com',
  'facebook.com',
  'fb.com',
  'vk.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'reddit.com',
  'linkedin.com',
  'ok.ru',
  'threads.net',
  'pinterest.com',
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function matches(host: string, needles: readonly string[]): boolean {
  return needles.some((needle) =>
    needle.endsWith('.') ? host.includes(needle) : host === needle || host.endsWith(`.${needle}`),
  );
}

/**
 * @param referrer `document.referrer` — empty string when there is none.
 * @param currentHost `location.hostname`, used to recognise same-site navigation.
 */
export function classifyReferrer(referrer: string, currentHost: string): ReferrerClass {
  if (!referrer) return 'direct';

  const host = hostOf(referrer);
  if (!host) return 'direct';

  const current = currentHost.toLowerCase();
  // app.wewatch.uz and wewatch.uz are one product on two hosts; a hop between them
  // is not an acquisition event.
  const site = current.replace(/^app\./, '');
  if (host === current || host === site || host.endsWith(`.${site}`)) return 'internal';

  if (matches(host, AI_ASSISTANT_HOSTS)) return 'ai_assistant';
  if (matches(host, SEARCH_HOSTS)) return 'organic_search';
  if (matches(host, SOCIAL_HOSTS)) return 'social';

  return 'referral';
}
