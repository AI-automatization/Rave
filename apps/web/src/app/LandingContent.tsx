'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  FaPlay, FaUsers, FaTrophy, FaStar, FaChevronRight,
  FaFire, FaCheck, FaFilm,
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } };

const TMDB = 'https://image.tmdb.org/t/p/w342';

// TMDB poster paths — primary source
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
  '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', '/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
  '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
  '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', '/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg',
  '/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg', '/pIkRyD18kl4FhoCpzvk6WM5yWkG.jpg',
  '/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
];

// picsum fallbacks (guaranteed to load) — one per poster slot
const FALLBACKS = Array.from({ length: 30 }, (_, i) =>
  `https://picsum.photos/seed/cinema${i + 1}/342/513`
);

// 6 columns × 5 rows = 30 posters
const COLS = [
  POSTERS.slice(0, 5),   POSTERS.slice(5, 10),
  POSTERS.slice(10, 15), POSTERS.slice(15, 20),
  POSTERS.slice(20, 25), POSTERS.slice(25, 30),
];
const COL_OFFSETS = ['-80px', '40px', '-30px', '70px', '-50px', '20px'];

const BATTLE_USERS = [
  { rank: 1, name: 'Sardor_90', movies: 48, initials: 'S', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  { rank: 2, name: 'Zulfiya_N', movies: 41, initials: 'Z', color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)' },
  { rank: 3, name: 'Bobur_K',   movies: 37, initials: 'B', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)' },
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
    { name: t('t1name'), text: t('t1text'), stars: 5, initials: 'A' },
    { name: t('t2name'), text: t('t2text'), stars: 5, initials: 'N' },
    { name: t('t3name'), text: t('t3text'), stars: 4, initials: 'B' },
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
          {/* Movie poster mosaic background */}
          <div className="absolute inset-0 flex gap-2 p-2" aria-hidden="true">
            {COLS.map((col, ci) => (
              <div
                key={ci}
                className="flex flex-col gap-2 flex-1"
                style={{ marginTop: COL_OFFSETS[ci] }}
              >
                {col.map((path, rowIdx) => {
                  const globalIdx = ci * 5 + rowIdx;
                  return (
                    <div
                      key={path}
                      className="w-full rounded overflow-hidden flex-shrink-0 bg-[#12102a]"
                      style={{ aspectRatio: '2/3' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${TMDB}${path}`}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.src = FALLBACKS[globalIdx];
                          img.onerror = null;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Gradient overlays — dark vignette so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/85 to-[#0A0A0F]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/80 via-transparent to-[#0A0A0F]/80" />
          {/* Violet tint over everything */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(123,114,248,0.18),transparent)]" />
          {/* Animated violet pulse in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#7B72F8]/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-24 pb-16">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#7B72F8]/40 bg-[#7B72F8]/10 backdrop-blur-sm text-sm text-white/80 shadow-[0_0_24px_rgba(123,114,248,0.25)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#7B72F8] animate-pulse" />
              {t('badge')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-display uppercase leading-none tracking-tight mb-6 text-white"
              style={{ textShadow: '0 0 80px rgba(123,114,248,0.25)' }}
            >
              {t('heroTitle1')}<br />
              <span className="text-[#7B72F8]" style={{ textShadow: '0 0 50px rgba(123,114,248,0.7)' }}>
                {t('heroTitle2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {t('heroSub')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link href="/register"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#7B72F8] text-white font-semibold hover:bg-[#6B63E8] hover:shadow-[0_0_50px_rgba(123,114,248,0.75)] transition-all duration-300 active:scale-95 shadow-[0_0_24px_rgba(123,114,248,0.45)] text-sm">
                <FaPlay size={11} />
                <span className="hidden sm:inline">{t('startFree')}</span>
                <span className="sm:hidden">{t('startShort')}</span>
              </Link>
              <Link href="/features"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all duration-300 active:scale-95 text-sm">
                <span className="hidden sm:inline">{t('nav_features')}</span>
                <span className="sm:hidden">{t('detailsShort')}</span>
                <FaChevronRight size={11} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="mt-16 grid grid-cols-3 gap-6 max-w-xs mx-auto"
            >
              {[
                { val: '10K+', label: t('statUsers') },
                { val: '50K+', label: t('statMovies') },
                { val: '100K+', label: t('statParties') },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-display text-[#7B72F8]" style={{ textShadow: '0 0 20px rgba(123,114,248,0.6)' }}>{val}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
        </section>

        {/* ─── FEATURES ──────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0A0A0F]">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">{t('featuresTitle')}</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500">{t('featuresSub')}</motion.p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="group bg-[#111118] rounded-xl border border-zinc-800/80 hover:border-[#7B72F8]/50 hover:shadow-[0_0_40px_rgba(123,114,248,0.14)] transition-all duration-300 p-6"
                >
                  <div className="p-3 rounded-lg bg-[#7B72F8]/10 w-fit mb-4 group-hover:bg-[#7B72F8]/22 group-hover:shadow-[0_0_18px_rgba(123,114,248,0.35)] transition-all duration-300">
                    <Icon size={22} className="text-[#7B72F8]" />
                  </div>
                  <h3 className="font-display text-base uppercase text-white mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── WATCH PARTY SPOTLIGHT ─────────────────────────────── */}
        <section className="py-24 px-4 bg-[#111118] overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/30 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-6 shadow-[0_0_14px_rgba(123,114,248,0.2)]">
                <FaUsers size={10} /> Watch Party
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                {t('f1title')}<br />
                <span className="text-[#7B72F8]" style={{ textShadow: '0 0 30px rgba(123,114,248,0.55)' }}>{t('f4title')}</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('f4desc')}</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#7B72F8] text-white font-semibold hover:bg-[#6B63E8] hover:shadow-[0_0_36px_rgba(123,114,248,0.65)] transition-all duration-300 active:scale-95 shadow-[0_0_18px_rgba(123,114,248,0.35)] text-sm">
                <span className="hidden sm:inline">{t('watchPartyCta')}</span>
                <span className="sm:hidden">{t('startShort')}</span>
                <FaChevronRight size={11} />
              </Link>
            </motion.div>

            {/* Video player mockup — icons only, no external images */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="bg-[#0A0A0F] rounded-2xl border border-[#7B72F8]/30 overflow-hidden shadow-[0_4px_60px_rgba(123,114,248,0.2)]">
                {/* Screen */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    aspectRatio: '16/9',
                    background: 'radial-gradient(ellipse at 40% 40%, #2d1060, #0d0520 60%, #060010)',
                  }}
                >
                  {/* Decorative film icon */}
                  <FaFilm size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5" />
                  {/* Play button */}
                  <div className="w-16 h-16 rounded-full bg-[#7B72F8]/25 border-2 border-[#7B72F8]/70 flex items-center justify-center shadow-[0_0_50px_rgba(123,114,248,0.6)] hover:scale-110 transition-transform cursor-pointer">
                    <FaPlay size={18} className="text-white ml-1" />
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-[11px]">1:24:37</span>
                      <div className="h-1 flex-1 bg-white/10 rounded-full">
                        <div className="h-full w-2/5 bg-[#7B72F8] rounded-full shadow-[0_0_10px_rgba(123,114,248,0.9)]" />
                      </div>
                      <span className="text-white/40 text-[11px]">2:18:00</span>
                    </div>
                  </div>
                  {/* Members row */}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    {['A', 'N', 'B'].map((l, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[#111118] flex items-center justify-center text-[10px] font-bold text-white -ml-1 first:ml-0"
                        style={{ backgroundColor: ['#7B72F8', '#a855f7', '#6B63E8'][i] }}>
                        {l}
                      </div>
                    ))}
                    <span className="text-white/40 text-[11px] ml-1">+2</span>
                  </div>
                </div>
                {/* Chat panel */}
                <div className="p-4 space-y-2.5 bg-[#0d0d14]">
                  {[
                    { user: 'Alisher', msg: "🔥 Bu sahna juda zo'r!", time: '21:42', color: '#7B72F8' },
                    { user: 'Nodira',  msg: "Men ham shu sahnani xush ko'raman 😍", time: '21:43', color: '#a855f7' },
                  ].map(({ user, msg, time, color }) => (
                    <div key={user} className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}>
                        {user[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold" style={{ color }}>{user} </span>
                        <span className="text-zinc-300 text-xs">{msg}</span>
                      </div>
                      <span className="text-zinc-600 text-[10px] flex-shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Glow behind card */}
              <div className="absolute -inset-8 bg-[#7B72F8]/12 rounded-3xl blur-3xl -z-10" />
            </motion.div>
          </div>
        </section>

        {/* ─── BATTLE SPOTLIGHT ──────────────────────────────────── */}
        <section className="py-24 px-4 bg-[#0A0A0F]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Scoreboard */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 relative"
            >
              <div className="bg-[#111118] rounded-2xl border border-zinc-800 overflow-hidden shadow-[0_4px_50px_rgba(255,215,0,0.07)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFD700] font-display uppercase text-sm flex items-center gap-2">
                    <GiCrossedSwords size={16} /> {t('battleActive')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/25 text-[#7B72F8] text-xs font-semibold">5 {t('daysLeftDemo')}</span>
                </div>
                <div className="space-y-1">
                  {BATTLE_USERS.map(({ rank, name, movies, initials, color, bg }) => (
                    <div key={rank} className="flex items-center gap-3 py-3 border-b border-zinc-800/60 last:border-0">
                      <span className="font-display text-xl w-8 flex-shrink-0" style={{ color }}>{rank}</span>
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border"
                        style={{ backgroundColor: bg, color, borderColor: `${color}35` }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{movies} {t('filmsWatched')}</p>
                      </div>
                      <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${(movies / 48) * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">{t('yourPosition')}</span>
                  <span className="text-zinc-400 text-sm font-medium">#7 — 22 film</span>
                </div>
              </div>
              <div className="absolute -inset-6 bg-[#FFD700]/5 rounded-3xl blur-3xl -z-10" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-semibold uppercase tracking-widest mb-6">
                <FaFire size={10} /> {t('f2title')}
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase text-white leading-tight mb-6">
                {t('f2title')}<br />
                <span className="text-[#FFD700]">{t('f3title')}</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('f2desc')}</p>
              <Link href="/register"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-[#FFD700]/50 text-[#FFD700] font-semibold hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all duration-300 active:scale-95 text-sm w-fit">
                <span className="hidden sm:inline">{t('battleCta')}</span>
                <span className="sm:hidden">{t('startShort')}</span>
                <FaChevronRight size={11} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">{t('howTitle')}</motion.h2>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {STEPS.map(({ num, title, desc }) => (
                <motion.div key={num} variants={fadeUp} className="flex gap-4 items-start group">
                  <span className="text-4xl font-display text-[#7B72F8]/35 leading-none flex-shrink-0 group-hover:text-[#7B72F8]/65 transition-colors duration-300">{num}</span>
                  <div>
                    <h3 className="text-white font-medium mb-1">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ──────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0A0A0F]">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">{t('testimonialsTitle')}</motion.h2>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, text, stars, initials }) => (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  className="bg-[#111118] rounded-xl border border-zinc-800 hover:border-[#7B72F8]/35 hover:shadow-[0_0_32px_rgba(123,114,248,0.1)] transition-all duration-300 p-6"
                >
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: stars }).map((_, j) => (
                      <FaStar key={j} size={13} className="text-[#FFD700]" />
                    ))}
                  </div>
                  <p className="text-zinc-400 text-sm mb-5 leading-relaxed">&quot;{text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[#7B72F8]/18 border border-[#7B72F8]/40 flex items-center justify-center text-sm font-bold text-[#7B72F8]">
                      {initials}
                    </div>
                    <p className="text-white text-sm font-medium">{name}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── PRICING ───────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#111118]">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">{t('pricingTitle')}</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500">{t('pricingSub')}</motion.p>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {PLANS.map(({ name, price, period, features, cta, href, highlighted }) => (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  className={`rounded-xl border p-8 transition-all duration-300 ${
                    highlighted
                      ? 'bg-[#0e0720] border-[#7B72F8]/55 shadow-[0_0_60px_rgba(123,114,248,0.22)]'
                      : 'bg-[#0A0A0F] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {highlighted && (
                    <div className="text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-4">{t('mostPopular')}</div>
                  )}
                  <h3 className="font-display text-3xl uppercase text-white mb-2">{name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-display text-white">{price}</span>
                    {period && <span className="text-zinc-500 text-sm">{period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                        <FaCheck size={11} className={`flex-shrink-0 ${highlighted ? 'text-[#7B72F8]' : 'text-zinc-600'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={href}
                    className={`flex items-center justify-center h-11 rounded-lg font-semibold transition-all duration-300 active:scale-95 w-full ${
                      highlighted
                        ? 'bg-[#7B72F8] text-white hover:bg-[#6B63E8] hover:shadow-[0_0_28px_rgba(123,114,248,0.6)]'
                        : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                    }`}>
                    {cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-[#0A0A0F]">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.h2 variants={fadeUp} className="text-4xl font-display uppercase mb-3 text-white">{t('faqTitle')}</motion.h2>
            </motion.div>
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <motion.div key={q} variants={fadeUp}>
                  <details className="group bg-[#111118] rounded-xl border border-zinc-800 hover:border-[#7B72F8]/40 hover:shadow-[0_0_22px_rgba(123,114,248,0.09)] transition-all duration-300 overflow-hidden">
                    <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer font-medium text-white text-sm list-none [&::-webkit-details-marker]:hidden">
                      {q}
                      <span className="text-zinc-600 group-open:rotate-180 transition-transform duration-300 flex-shrink-0">▼</span>
                    </summary>
                    <div className="px-5 pb-5">
                      <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
                    </div>
                  </details>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── CTA — dark bg with violet glow (not solid purple!) ─ */}
        <section className="py-28 px-4 text-center bg-[#0A0A0F] relative overflow-hidden">
          {/* Layered violet glow — the main visual */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#7B72F8]/22 rounded-full blur-[130px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-[#6B63E8]/30 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[120px] bg-[#7B72F8]/40 rounded-full blur-[40px]" />
            {/* Subtle ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#7B72F8]/15 blur-[2px]" />
            {/* Corner accents */}
            <div className="absolute top-8 left-8 w-32 h-32 bg-[#4C1D95]/20 rounded-full blur-[60px]" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-[#4C1D95]/20 rounded-full blur-[60px]" />
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7B72F8]/15 border border-[#7B72F8]/40 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-8 shadow-[0_0_22px_rgba(123,114,248,0.35)]">
              <FaPlay size={8} /> CineSync
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-display uppercase text-white leading-tight mb-6"
              style={{ textShadow: '0 0 80px rgba(123,114,248,0.5)' }}
            >
              {t('ctaTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              {t('ctaSub')}
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/register"
                className="inline-flex items-center gap-3 h-14 px-10 rounded-lg bg-[#7B72F8] text-white font-bold hover:bg-[#6B63E8] hover:shadow-[0_0_70px_rgba(123,114,248,0.85)] transition-all duration-300 active:scale-95 text-base uppercase tracking-wide shadow-[0_0_36px_rgba(123,114,248,0.55)]">
                <FaPlay size={14} /> {t('ctaBtn')}
              </Link>
            </motion.div>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
