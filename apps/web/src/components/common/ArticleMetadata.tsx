import Link from 'next/link';
import { articleFor, type ArticleRecord } from '@/data/articles';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const LABELS = {
  ru: {
    author: 'Автор',
    published: 'Опубликовано',
    updated: 'Обновлено',
    section: { guides: 'Гайды', 'use-cases': 'Сценарии' },
    homePath: '/ru',
  },
  uz: {
    author: 'Muallif',
    published: 'Chop etilgan',
    updated: 'Yangilangan',
    section: { guides: 'Qo‘llanmalar', 'use-cases': 'Ssenariylar' },
    homePath: '/uz',
  },
  en: {
    author: 'Author',
    published: 'Published',
    updated: 'Updated',
    section: { guides: 'Guides', 'use-cases': 'Use cases' },
    homePath: '/en',
  },
} as const;

function schemaFor(article: ArticleRecord) {
  const url = `${SITE_URL}${article.path}`;
  const labels = LABELS[article.locale];
  const sectionPath = `${labels.homePath}/${article.section}`;
  const breadcrumbs = article.section === 'guides'
    ? [
        { '@type': 'ListItem', position: 1, name: 'WeWatch', item: `${SITE_URL}${labels.homePath}` },
        { '@type': 'ListItem', position: 2, name: labels.section.guides, item: `${SITE_URL}${sectionPath}` },
        { '@type': 'ListItem', position: 3, name: article.headline, item: url },
      ]
    : [
        { '@type': 'ListItem', position: 1, name: 'WeWatch', item: `${SITE_URL}${labels.homePath}` },
        { '@type': 'ListItem', position: 2, name: article.headline, item: url },
      ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: article.headline,
        image: `${SITE_URL}/og-image`,
        inLanguage: article.locale,
        author: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'WeWatch', url: SITE_URL },
        publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'WeWatch', url: SITE_URL },
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: breadcrumbs,
      },
    ],
  };
}

export function ArticleMetadata({ currentPath }: { currentPath: string }) {
  const article = articleFor(currentPath);
  if (!article) return null;

  const labels = LABELS[article.locale];
  const modifiedSeparately = article.dateModified !== article.datePublished;

  return (
    <>
      <script
        id="article-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFor(article)) }}
      />
      <aside
        data-editorial-meta
        className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 text-sm text-zinc-400"
        aria-label={`${labels.author}: WeWatch`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-zinc-800/60 pt-6">
          <span>{labels.author}: <Link href={labels.homePath} className="text-zinc-300 hover:text-white">WeWatch</Link></span>
          <span aria-hidden>·</span>
          <span>{labels.published}: <time data-date-published dateTime={article.datePublished}>{article.datePublished}</time></span>
          {modifiedSeparately && (
            <>
              <span aria-hidden>·</span>
              <span>{labels.updated}: <time data-date-modified dateTime={article.dateModified}>{article.dateModified}</time></span>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
