'use client';

import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export function PricingContent() {
  const t = useTranslations('pricingPage');
  const tl = useTranslations('landing');

  const PLANS = [
    {
      name: tl('plan1name'),
      price: '0',
      period: null,
      desc: t('plan1desc'),
      features: [
        { label: 'Watch Party', val: '4 kishi' },
        { label: 'Battle', val: '3 ta' },
        { label: 'Achievement', val: '15 ta' },
        { label: t('rowQuality'), val: 'HD 720p' },
        { label: t('rowAds'), val: t('rowAdsYes') },
        { label: t('rowSearch'), val: '✓' },
        { label: t('rowFriends'), val: '∞' },
        { label: t('rowHistory'), val: '30 kun' },
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
        { label: 'Watch Party', val: '10 kishi' },
        { label: 'Battle', val: '∞' },
        { label: 'Achievement', val: '25+ ta' },
        { label: t('rowQuality'), val: '4K 2160p' },
        { label: t('rowAds'), val: t('rowAdsNo') },
        { label: t('rowSearch'), val: '✓' },
        { label: t('rowFriends'), val: '∞' },
        { label: t('rowHistory'), val: '∞' },
      ],
      cta: tl('plan2cta'),
      href: '/register?plan=pro',
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display uppercase text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-zinc-500">{t('subtitle')}</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map(({ name, price, period, desc, features, cta, href, highlighted }) => (
            <div
              key={name}
              className={`rounded-2xl border p-8 transition-all duration-300 ${
                highlighted
                  ? 'bg-[#0e0720] border-[#7B72F8]/60 shadow-[0_0_60px_rgba(123,114,248,0.22)]'
                  : 'bg-[#111118] border-zinc-800'
              }`}
            >
              {highlighted && (
                <div className="inline-block px-2.5 py-1 rounded-full bg-[#7B72F8]/15 border border-[#7B72F8]/40 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-4">
                  {t('recommended')}
                </div>
              )}

              <h2 className="font-display text-3xl uppercase text-white mb-1">{name}</h2>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-4xl font-display text-white">{price}</span>
                <span className="text-zinc-500 text-sm">{period ?? desc}</span>
              </div>

              <div className="border-t border-zinc-800 my-5" />

              <ul className="space-y-3 mb-8">
                {features.map(({ label, val }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <FaCheck size={10} className={highlighted ? 'text-[#7B72F8]' : 'text-zinc-700'} />
                      {label}
                    </span>
                    <span className={`font-medium ${highlighted ? 'text-white' : 'text-zinc-300'}`}>{val}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`flex items-center justify-center h-11 rounded-lg font-semibold transition-all duration-300 active:scale-95 w-full ${
                  highlighted
                    ? 'bg-[#7B72F8] text-white hover:bg-[#6B63E8] hover:shadow-[0_0_30px_rgba(123,114,248,0.6)]'
                    : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-700 mt-10">
          {t('footnote')}
        </p>
      </div>
    </div>
  );
}
