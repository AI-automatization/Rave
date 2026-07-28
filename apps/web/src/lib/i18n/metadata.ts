import type { Metadata } from 'next';
import { OG_LOCALE, type Locale } from './config';

/**
 * OpenGraph + Twitter blocks for a localized page.
 *
 * Exists because Next.js *replaces* these two blocks rather than deep-merging
 * them with the root layout's. A page that set only `openGraph.title` inherited
 * the root layout's Russian `twitter` block wholesale — so every /uz and /en page
 * except the two home pages shared to X as "WeWatch — Смотреть видео вместе с
 * друзьями", in Russian, regardless of the language of the page being shared.
 *
 * Passing through this helper means a localized page cannot declare half its
 * social metadata: both blocks are written together, from the same strings.
 */
export function socialMeta({
  locale,
  title,
  description,
  url,
  type = 'website',
}: {
  locale: Locale;
  title: string;
  description: string;
  url: string;
  type?: 'website' | 'article';
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      type,
      locale: OG_LOCALE[locale],
      siteName: 'WeWatch',
      url,
      title,
      description,
      images: [{ url: '/og-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@wewatch_app',
      creator: '@wewatch_app',
      title,
      description,
      images: ['/og-image'],
    },
  };
}
