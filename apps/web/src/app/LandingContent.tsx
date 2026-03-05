'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FaPlay, FaUsers, FaTrophy, FaStar, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

export function LandingContent() {
  const t = useTranslations('landing');

  const FEATURES = [
    { icon: FaPlay, title: t('f1title'), desc: t('f1desc') },
    { icon: GiCrossedSwords, title: t('f2title'), desc: t('f2desc') },
    { icon: FaTrophy, title: t('f3title'), desc: t('f3desc') },
    { icon: FaUsers, title: t('f4title'), desc: t('f4desc') },
  ];

  const STEPS = [
    { num: '01', title: t('s1title'), desc: t('s1desc') },
    { num: '02', title: t('s2title'), desc: t('s2desc') },
    { num: '03', title: t('s3title'), desc: t('s3desc') },
    { num: '04', title: t('s4title'), desc: t('s4desc') },
  ];

  const TESTIMONIALS = [
    { name: t('t1name'), text: t('t1text'), stars: 5 },
    { name: t('t2name'), text: t('t2text'), stars: 5 },
    { name: t('t3name'), text: t('t3text'), stars: 4 },
  ];

  const PLANS = [
    {
      name: t('plan1name'),
      price: '0',
      period: null,
      features: ['Watch Party (4)', '3 Battle', 'HD'],
      cta: t('plan1cta'),
      href: '/register',
      highlighted: false,
    },
    {
      name: t('plan2name'),
      price: '29,000',
      period: t('plan2period'),
      features: ['Watch Party (10)', 'Unlimited Battle', '4K'],
      cta: t('plan2cta'),
      href: '/register?plan=pro',
      highlighted: true,
    },
  ];

  const FAQS = [
    { q: t('q0'), a: t('a0') },
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <LandingNav />
      <main className="flex-1">

        {/* Hero */}
        <section
          className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg-hero.png')" }}
        >
          {/* Dark overlays to make the background subtle and text readable */}
          <div className="absolute inset-0 bg-slate-900/85 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-3 rounded-full border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm text-cyan-50 text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              {t('badge')}
            </div>
            <h1 className="text-5xl md:text-7xl font-display leading-tight mb-6 text-white">
              {t('heroTitle1')}<br />
              <span className="text-cyan-400">{t('heroTitle2')}</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              {t('heroSub')}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95">
                <FaPlay size={20} className="fill-current" />
                {t('startFree')}
              </Link>
              <Link href="/features" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium active:scale-95">
                {t('learnMore')}
                <FaChevronRight size={16} />
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[
                { val: '10K+', label: t('statUsers') },
                { val: '50K+', label: t('statMovies') },
                { val: '100K+', label: t('statParties') },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-display text-cyan-400">{val}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <FaChevronDown size={28} className="text-base-content/30" />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3 text-white">{t('featuresTitle')}</h2>
              <p className="text-slate-400">{t('featuresSub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-slate-700/50 rounded-lg border border-slate-600 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all p-6">
                  <div className="p-3 rounded-lg bg-cyan-500/10 w-fit mb-3">
                    <Icon size={24} className="text-cyan-400" />
                  </div>
                  <h3 className="font-display text-lg text-white mb-2">{title.toUpperCase()}</h3>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-4 bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3 text-white">{t('howTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STEPS.map(({ num, title, desc }) => (
                <div key={num} className="flex gap-4 items-start">
                  <span className="text-4xl font-display text-cyan-500/30 leading-none">{num}</span>
                  <div>
                    <h3 className="font-medium mb-1 text-white">{title}</h3>
                    <p className="text-slate-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Testimonials */}
        <section className="py-20 px-4 bg-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3 text-white">{t('testimonialsTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, text, stars }) => (
                <div key={name} className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: stars }).map((_, i) => (
                      <FaStar key={i} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 mb-3">&quot;{text}&quot;</p>
                  <p className="text-sm font-medium text-slate-200">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4 bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3 text-white">{t('pricingTitle')}</h2>
              <p className="text-slate-400">{t('pricingSub')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {PLANS.map(({ name, price, period, features, cta, href, highlighted }) => (
                <div key={name} className={`rounded-lg border p-6 transition-all ${highlighted ? 'bg-cyan-500/20 border-cyan-500' : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-display text-2xl text-white">{name.toUpperCase()}</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-display text-white">{price}</span>
                        {period && <span className="text-sm text-slate-400">{period}</span>}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${highlighted ? 'bg-cyan-500 text-slate-900' : 'bg-lime-500 text-slate-900'}`}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={href} className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg transition-all font-medium active:scale-95 mt-2 w-full ${highlighted ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:border-cyan-500/50'}`}>
                      {cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 bg-slate-800">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display mb-3 text-white">{t('faqTitle')}</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="bg-slate-700/50 rounded-lg border border-slate-600 p-4 cursor-pointer hover:border-cyan-500/50 transition-colors">
                  <summary className="font-medium text-sm text-white flex items-center justify-between">
                    {q}
                    <span className="text-slate-400 flex-shrink-0">▼</span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-slate-600">
                    <p className="text-sm text-slate-300">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 text-center bg-slate-900 border-t border-slate-800">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-display mb-6 text-white leading-tight">
              {t('ctaTitle')}
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
              {t('ctaSub')}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-bold active:scale-95 text-base uppercase tracking-wider"
            >
              {t('ctaBtn')}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
