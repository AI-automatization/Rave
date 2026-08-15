import Link from 'next/link';
import { relatedGuides } from '@/data/guides';
import { ArticleMetadata } from './ArticleMetadata';

// Article-level furniture for the standalone SEO pages (/guides/*, /uz/guides/*):
// server components with zero client JS. The header and footer around them are
// the sitewide ones (SiteShell) — this file used to ship a second, narrower set
// of both, which is why /guides looked like a different site than the home page.
type GuideLocale = 'ru' | 'uz' | 'en';

// Hrefs live here alongside the labels: they used to be hardcoded to the Russian
// pages in the JSX, which meant an Uzbek or English guide linked its reader
// straight out of their language.
const LABELS: Record<GuideLocale, {
  related: string;
  allGuides: string;
  guidesHref: string;
}> = {
  ru: {
    related: 'Другие гайды',
    allGuides: 'Все гайды →',
    guidesHref: '/ru/guides',
  },
  uz: {
    related: 'Boshqa gaydlar',
    allGuides: 'Barcha gaydlar →',
    guidesHref: '/uz/guides',
  },
  en: {
    related: 'More guides',
    allGuides: 'All guides →',
    guidesHref: '/en/guides',
  },
};

/**
 * Cross-links between guides in the same language. Guides reachable only from
 * sitemap.xml stall in Google's "Discovered, currently not indexed" bucket —
 * these links are the crawl path that gets them picked up.
 */
export function RelatedGuides({
  currentPath,
  locale = 'ru',
}: {
  currentPath: string;
  locale?: GuideLocale;
}) {
  const t = LABELS[locale];
  const items = relatedGuides(currentPath, locale);
  if (items.length === 0) return null;

  return (
    // A <section>, not a <nav>: these are contextual links into related reading, and
    // search engines discount links inside navigation landmarks relative to links in
    // body content. The block sits at the end of the article and belongs to it.
    <section aria-labelledby="related-guides" className="max-w-4xl mx-auto px-4 sm:px-6 mt-14">
      <div className="border-t border-zinc-800/60 pt-8">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 id="related-guides" className="text-white font-semibold text-lg">{t.related}</h2>
          <Link href={t.guidesHref} className="text-[#7B72F8] hover:text-[#9B92FF] text-sm transition-colors">
            {t.allGuides}
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((g) => (
            <li key={g.path}>
              <Link
                href={g.path}
                className="block h-full rounded-xl border border-zinc-800/60 bg-[#0E0E14] px-5 py-4 hover:border-[#7B72F8]/40 transition-colors"
              >
                <span className="block text-white text-sm font-medium mb-1">{g.title}</span>
                <span className="block text-zinc-400 text-xs leading-relaxed">{g.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Everything that closes out a guide: the published/updated metadata and the
 * cross-links to sibling guides. Pass `currentPath` on the guides themselves;
 * omit it on the pages that merely use the same editorial template (the guide
 * index, FAQ, how-it-works), which have no siblings to link to.
 *
 * This replaced `GuideFooter`, which also drew a second site footer — copyright,
 * legal links, "back home" — underneath the real one's job. The sitewide
 * `Footer` carries those links for every page now.
 */
export function GuideArticleEnd({
  locale = 'ru',
  currentPath,
}: {
  locale?: GuideLocale;
  currentPath?: string;
}) {
  if (!currentPath) return null;
  return (
    <>
      <ArticleMetadata currentPath={currentPath} />
      <RelatedGuides currentPath={currentPath} locale={locale} />
    </>
  );
}
