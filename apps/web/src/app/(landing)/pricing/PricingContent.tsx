'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function PricingContent() {
  const t = useTranslations('pricingPage');
  const tl = useTranslations('landing');

  const PLANS = [
    {
      name: tl('plan1name'),
      price: '0',
      period: null,
      desc: t('always'),
      features: [
        { label: 'Watch Party', val: '4' },
        { label: 'Battle', val: '3' },
        { label: 'Achievement', val: '15' },
        { label: 'Video', val: 'HD (720p)' },
        { label: 'Reklama', val: '—' },
        { label: 'Search', val: '✓' },
        { label: 'Friends', val: '∞' },
        { label: 'History', val: '30d' },
      ],
      cta: tl('plan1cta'),
      href: '/register',
      highlighted: false,
    },
    {
      name: tl('plan2name'),
      price: '29,000',
      period: tl('plan2period'),
      desc: '',
      features: [
        { label: 'Watch Party', val: '10' },
        { label: 'Battle', val: '∞' },
        { label: 'Achievement', val: '25+' },
        { label: 'Video', val: '4K (2160p)' },
        { label: 'Reklama', val: '✗' },
        { label: 'Search', val: '✓' },
        { label: 'Friends', val: '∞' },
        { label: 'History', val: '∞' },
      ],
      cta: tl('plan2cta'),
      href: '/register?plan=pro',
      highlighted: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-display mb-4">{t('title')}</h1>
        <p className="text-base-content/50">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {PLANS.map(({ name, price, period, desc, features, cta, href, highlighted }) => (
          <div
            key={name}
            className={`card ${highlighted ? 'bg-primary text-primary-content ring-2 ring-primary ring-offset-2 ring-offset-base-100' : 'bg-base-200'}`}
          >
            <div className="card-body gap-5">
              <div>
                {highlighted && (
                  <div className="badge bg-primary-content text-primary badge-sm mb-3">
                    {t('recommended')}
                  </div>
                )}
                <h2 className="font-display text-3xl">{name.toUpperCase()}</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-display">{price}</span>
                  {period ? (
                    <span className={`text-sm ${highlighted ? 'opacity-70' : 'text-base-content/60'}`}>
                      {period}
                    </span>
                  ) : (
                    <span className={`text-sm ${highlighted ? 'opacity-70' : 'text-base-content/60'}`}>
                      {desc}
                    </span>
                  )}
                </div>
              </div>

              <div className="divider my-0" />

              <ul className="space-y-3">
                {features.map(({ label, val }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className={highlighted ? 'opacity-80' : 'text-base-content/70'}>{label}</span>
                    <span className="font-medium">{val}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`btn btn-block ${
                  highlighted
                    ? 'bg-primary-content text-primary hover:opacity-90 border-0'
                    : 'btn-primary'
                }`}
              >
                {cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-base-content/40 mt-10">
        {t('footnote')}
      </p>
    </div>
  );
}
