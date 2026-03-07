'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FaPlay, FaUsers, FaTrophy, FaStar, FaChevronRight, FaFire, FaCheck, FaFilm } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

const TMDB = 'https://image.tmdb.org/t/p/w342';

const POSTERS = [
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '/d5NXSklpcvzsGFimocnHKldiO0N.jpg',
  '/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',  '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  '/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg', '/jE5o7y9K6pZtWNNMEw3IdpHuncR.jpg',
  '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
  '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', '/gEU2QniE6E77NI6lZM9RUPe9seb.jpg',
  '/AA54E8dGLQq2F7sftRTAW55zqBa.jpg', '/sv1xJUazXoQuIDfIFKEMRbxwWrh.jpg',
  '/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg', '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
  '/wqnLdwVXoBjKibFRR5U3y0aDUhs.jpg', '/v4yVTbbl8dE1UP2dWu5rBsn4feE.jpg',
  '/ld5V6RZHbdGKlKjdQzFCwwLdJAm.jpg', '/qNBAXBIQlnOThrVvA6mA2B5ggkN.jpg',
];

const COLS = [
  POSTERS.slice(0, 4),  POSTERS.slice(4, 8),
  POSTERS.slice(8, 12), POSTERS.slice(12, 16),
  POSTERS.slice(16, 20),
];
const COL_OFFSETS = ['-60px', '40px', '-20px', '60px', '-40px'];

const BATTLE_USERS = [
  { rank: 1, name: 'Sardor_90',  movies: 48, img: 11, color: '#FFD700' },
  { rank: 2, name: 'Zulfiya_N',  movies: 41, img: 12, color: '#C0C0C0' },
  { rank: 3, name: 'Bobur_K',    movies: 37, img: 13, color: '#CD7F32' },
];

export function LandingContent() {
  const t = useTranslations('landing');

  const FEATURES = [
    { icon: FaFilm,          title: t('f1title'), desc: t('f1desc') },
    { icon: GiCrossedSwords, title: t('f2title'), desc: t('f2desc') },
    { icon: FaTrophy,        title: t('f3title'), desc: t('f3desc') },
    { icon: FaUsers,         title: t('f4title'), desc: t('f4desc') },
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
      name: t('plan1name'), price: '0', period: null,
      features: ['Watch Party (4)', '3 Battle', 'HD'],
      cta: t('plan1cta'), href: '/register', highlighted: false,
    },
    {
      name: t('plan2name'), price: '29,000', period: t('plan2period'),
      features: ['Watch Party (10)', 'Unlimited Battle', '4K'],
      cta: t('plan2cta'), href: '/register?plan=pro', highlighted: true,
    },
  ];

  const FAQS = [
    { q: t('q0'), a: t('a0') }, { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') }, { q: t('q3'), a: t('a3') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <LandingNav />
      <main className="flex-1">

        {/* ─── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0F]">
          {/* Poster mosaic background */}
          <div className="absolute inset-0 flex gap-1.5 p-1.5" aria-hidden="true">
            {COLS.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1.5 flex-1" style={{ marginTop: COL_OFFSETS[ci] }}>
                {col.map((path) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={path} src={`${TMDB}${path}`} alt=""
                    className="w-full rounded-sm object-cover"
                    style={{ aspectRatio: '2/3' }} loading="lazy"
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/90 to-[#0A0A0F]/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/85 via-transparent to-[#0A0A0F]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(124,58,237,0.13),transparent)]" />

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-24 pb-16">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#7C3AED]/40 bg-black/60 backdrop-blur-sm text-sm text-white/80">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
              {t('badge')}
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display uppercase leading-none tracking-tight mb-6 text-white drop-shadow-2xl">
              {t('heroTitle1')}<br />
              <span className="text-[#7C3AED]">{t('heroTitle2')}</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('heroSub')}
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all active:scale-95">
                <FaPlay size={14} /> {t('startFree')}
              </Link>
              <Link href="/login"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-lg border border-white/20 text-white/80 hover:border-white/40 hover:bg-white/5 transition-all active:scale-95">
                {t('learnMore')} <FaChevronRight size={12} />
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[{ val: '10K+', label: t('statUsers') }, { val: '50K+', label: t('statMovies') }, { val: '100K+', label: t('statParties') }]
                .map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-display text-[#7C3AED]">{val}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* ─── POSTER STRIP ──────────────────────────────────────── */}
        <div className="bg-[#111118] py-8 overflow-hidden">
          <div className="flex gap-3 overflow-x-auto px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[...POSTERS, ...POSTERS.slice(0, 5)].map((path, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={`${TMDB}${path}`} alt=""
                className="flex-shrink-0 w-24 h-36 rounded-lg object-cover opacity-60 hover:opacity-100 hover:scale-105 transition-all cursor-pointer"
                loading="lazy"
              />
            ))}
          </div>
        </div>

        {/* ─── FEATURES ──────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display uppercase mb-3 text-white">{t('featuresTitle')}</h2>
              <p className="text-zinc-500">{t('featuresSub')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group bg-[#0A0A0F] rounded-xl border border-zinc-800 hover:border-[#7C3AED]/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.08)] transition-all p-6">
                  <div className="p-3 rounded-lg bg-[#7C3AED]/10 w-fit mb-4 group-hover:bg-[#7C3AED]/20 transition-colors">
                    <Icon size={22} className="text-[#7C3AED]" />
                  </div>
                  <h3 className="font-display text-base uppercase text-white mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WATCH PARTY SPOTLIGHT ─────────────────────────────── */}
        <section className="py-24 px-4 bg-[#0A0A0F] overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#7C3AED] text-xs font-semibold uppercase tracking-widest mb-6">
                <FaUsers size={10} /> Watch Party
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                {t('f1title')}<br />
                <span className="text-[#7C3AED]">{t('f4title')}</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('f4desc')}</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition-all active:scale-95">
                {t('startFree')} <FaChevronRight size={12} />
              </Link>
            </div>

            {/* Video player mockup */}
            <div className="relative">
              <div className="bg-[#111118] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://image.tmdb.org/t/p/w780/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" alt=""
                    className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
                        <FaPlay size={10} className="text-white ml-0.5" />
                      </div>
                      <div className="h-1 flex-1 bg-white/20 rounded-full">
                        <div className="h-full w-2/5 bg-[#7C3AED] rounded-full" />
                      </div>
                      <span className="text-white/60 text-xs flex-shrink-0">1:24:37</span>
                    </div>
                    <div className="flex items-center">
                      {[11, 12, 13].map((n, i) => (
                        <div key={n} className="w-7 h-7 rounded-full border-2 border-[#111118] -ml-2 first:ml-0"
                          style={{ backgroundImage: `url(https://i.pravatar.cc/50?img=${n})`, backgroundSize: 'cover' }} />
                      ))}
                      <span className="text-white/50 text-xs ml-2">+2</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  {[
                    { user: 'Alisher', msg: "🔥 Bu sahna juda zo'r!", time: '21:42' },
                    { user: 'Nodira',  msg: 'Men ham shu sahnani xush ko\'raman 😍', time: '21:43' },
                  ].map(({ user, msg, time }) => (
                    <div key={user} className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[#7C3AED] text-xs font-semibold">{user} </span>
                        <span className="text-zinc-300 text-xs">{msg}</span>
                      </div>
                      <span className="text-zinc-600 text-[10px] flex-shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-6 bg-[#7C3AED]/5 rounded-3xl blur-3xl -z-10" />
            </div>
          </div>
        </section>

        {/* ─── BATTLE SPOTLIGHT ──────────────────────────────────── */}
        <section className="py-24 px-4 bg-[#111118]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Scoreboard */}
            <div className="order-2 lg:order-1 relative">
              <div className="bg-[#0A0A0F] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFD700] font-display uppercase text-sm flex items-center gap-2">
                    <GiCrossedSwords size={16} /> Battle Aktiv
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold">5 kun qoldi</span>
                </div>
                <div className="space-y-1">
                  {BATTLE_USERS.map(({ rank, name, movies, img, color }) => (
                    <div key={rank} className="flex items-center gap-3 py-3 border-b border-zinc-800/60 last:border-0">
                      <span className="font-display text-xl w-8 flex-shrink-0" style={{ color }}>{rank}</span>
                      <div className="w-10 h-10 rounded-full flex-shrink-0 bg-zinc-700"
                        style={{ backgroundImage: `url(https://i.pravatar.cc/80?img=${img})`, backgroundSize: 'cover' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{movies} film ko&apos;rildi</p>
                      </div>
                      <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(movies / 48) * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">Sizning o&apos;rningiz</span>
                  <span className="text-zinc-400 text-sm font-medium">#7 — 22 film</span>
                </div>
              </div>
              <div className="absolute -inset-6 bg-[#FFD700]/5 rounded-3xl blur-3xl -z-10" />
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-semibold uppercase tracking-widest mb-6">
                <FaFire size={10} /> {t('f2title')}
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                {t('f2title')}<br />
                <span className="text-[#FFD700]">{t('f3title')}</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('f2desc')}</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#FFD700] text-black font-semibold hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all active:scale-95">
                {t('startFree')} <FaChevronRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0A0A0F]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display uppercase mb-3 text-white">{t('howTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {STEPS.map(({ num, title, desc }) => (
                <div key={num} className="flex gap-4 items-start">
                  <span className="text-4xl font-display text-[#7C3AED]/30 leading-none flex-shrink-0">{num}</span>
                  <div>
                    <h3 className="text-white font-medium mb-1">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ──────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display uppercase mb-3 text-white">{t('testimonialsTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, text, stars }, i) => (
                <div key={name} className="bg-[#0A0A0F] rounded-xl border border-zinc-800 p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: stars }).map((_, j) => (
                      <FaStar key={j} size={14} className="text-[#FFD700] fill-[#FFD700]" />
                    ))}
                  </div>
                  <p className="text-zinc-400 text-sm mb-5 leading-relaxed">&quot;{text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 bg-zinc-700"
                      style={{ backgroundImage: `url(https://i.pravatar.cc/60?img=${i + 20})`, backgroundSize: 'cover' }} />
                    <p className="text-white text-sm font-medium">{name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ───────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0A0A0F]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display uppercase mb-3 text-white">{t('pricingTitle')}</h2>
              <p className="text-zinc-500">{t('pricingSub')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {PLANS.map(({ name, price, period, features, cta, href, highlighted }) => (
                <div key={name} className={`rounded-xl border p-8 transition-all ${highlighted
                  ? 'bg-[#7C3AED]/5 border-[#7C3AED] shadow-[0_0_50px_rgba(124,58,237,0.12)]'
                  : 'bg-[#111118] border-zinc-800'}`}>
                  {highlighted && (
                    <div className="text-[#7C3AED] text-xs font-semibold uppercase tracking-widest mb-4">Most Popular</div>
                  )}
                  <h3 className="font-display text-3xl uppercase text-white mb-2">{name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-display text-white">{price}</span>
                    {period && <span className="text-zinc-500 text-sm">{period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                        <FaCheck size={11} className={highlighted ? 'text-[#7C3AED] flex-shrink-0' : 'text-zinc-600 flex-shrink-0'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className={`flex items-center justify-center h-11 rounded-lg font-semibold transition-all active:scale-95 w-full ${highlighted
                    ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]'
                    : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}>
                    {cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-display uppercase mb-3 text-white">{t('faqTitle')}</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group bg-[#0A0A0F] rounded-xl border border-zinc-800 hover:border-[#7C3AED]/40 transition-colors overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer font-medium text-white text-sm list-none [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="text-zinc-600 group-open:rotate-180 transition-transform duration-200 flex-shrink-0">▼</span>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────────────── */}
        <section className="py-28 px-4 text-center bg-[#7C3AED] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_65%)]" />
          {/* Poster strip in background */}
          <div className="absolute inset-0 flex gap-1.5 opacity-[0.06] pointer-events-none" aria-hidden="true">
            {POSTERS.slice(0, 8).map((path, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={`${TMDB}${path}`} alt="" className="flex-1 object-cover h-full" loading="lazy" />
            ))}
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display uppercase text-white leading-tight mb-6">
              {t('ctaTitle')}
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-md mx-auto leading-relaxed">{t('ctaSub')}</p>
            <Link href="/register"
              className="inline-flex items-center gap-3 h-14 px-10 rounded-lg bg-white text-[#7C3AED] font-bold hover:bg-zinc-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all active:scale-95 text-base uppercase tracking-wide">
              <FaPlay size={14} /> {t('ctaBtn')}
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
