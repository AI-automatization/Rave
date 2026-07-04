'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  FaApple, FaGlobe, FaUsers, FaComment, FaBolt, FaArrowRight, FaChevronRight,
} from 'react-icons/fa';
import { useTranslations } from 'next-intl';

const APP_STORE = 'https://apps.apple.com';
const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};
const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

export function AboutContent() {
  const t = useTranslations('aboutPage');
  const reduce = useReducedMotion();

  const STATS = [
    { v: t('stat1v'), l: t('stat1l') },
    { v: t('stat2v'), l: t('stat2l') },
    { v: t('stat3v'), l: t('stat3l') },
    { v: t('stat4v'), l: t('stat4l') },
  ];

  const FEATURES = [
    { icon: FaBolt, color: '#7B72F8', t: t('f1t'), d: t('f1d') },
    { icon: FaGlobe, color: '#22d3ee', t: t('f2t'), d: t('f2d') },
    { icon: FaUsers, color: '#a855f7', t: t('f3t'), d: t('f3d') },
    { icon: FaComment, color: '#4ade80', t: t('f4t'), d: t('f4d') },
  ];

  return (
    <div className="bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[72vh] flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full blur-[175px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.2) 0%, rgba(168,85,247,0.07) 50%, transparent 70%)' }}
            animate={reduce ? {} : { scale: [0.95, 1.08, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ab-grid" width="72" height="72" patternUnits="userSpaceOnUse">
                <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ab-grid)" />
          </svg>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.nav variants={fadeUp} className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-400">{t('breadcrumb')}</span>
          </motion.nav>

          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/[0.08] backdrop-blur-md text-sm text-white/80"
            style={{ boxShadow: '0 0 28px rgba(123,114,248,0.2)' }}>
            {t('badge')}
          </motion.div>

          <motion.h1 variants={fadeUpScale}
            className="font-display uppercase leading-[0.9] tracking-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 12vw, 8rem)', textShadow: '0 0 110px rgba(123,114,248,0.3)' }}>
            {t('title1')}<br />
            <motion.span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg, #7B72F8 0%, #a855f7 50%, #22d3ee 100%)', backgroundSize: '200% 200%' }}
              animate={reduce ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
              {t('title2')}
            </motion.span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            {t('sub')}
          </motion.p>

          <motion.a variants={fadeUp} href={APP_STORE} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 h-[52px] px-8 rounded-2xl text-white font-semibold transition-transform hover:scale-[1.04] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 40px rgba(123,114,248,0.5)' }}>
            <FaApple size={18} aria-hidden="true" /> {t('download')}
          </motion.a>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="px-4 py-16 border-y border-zinc-800/50 bg-[#0C0C14]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4">
          {STATS.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: i * 0.08 }}
              className="flex flex-col items-center text-center md:border-r md:last:border-r-0 border-zinc-800/50">
              <span className="font-display font-bold bg-clip-text text-transparent leading-none mb-2"
                style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)', fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
                {s.v}
              </span>
              <span className="text-[11px] md:text-xs text-zinc-500 uppercase tracking-[0.18em]">{s.l}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WHAT */}
      <section className="px-4 py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,114,248,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-5">{t('whatTag')}</p>
            <h2 className="font-display uppercase text-white leading-[0.95]" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)' }}>{t('whatTitle')}</h2>
          </motion.div>
          <motion.p initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl leading-relaxed border-l-2 border-[#7B72F8]/40 pl-6">
            {t('whatText')}
          </motion.p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-24 bg-[#0C0C14]">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('featTag')}</motion.p>
            <motion.h2 variants={fadeUp} className="font-display uppercase text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>{t('featTitle')}</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, color, t: title, d }, i) => (
              <motion.div key={title} variants={fadeUpScale} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="group relative rounded-3xl border border-zinc-800/60 p-6 overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #111118 0%, #0D0D14 100%)' }}>
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[45px] pointer-events-none"
                  style={{ background: color }} aria-hidden="true" />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 relative z-10"
                  style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                  <Icon size={19} style={{ color }} aria-hidden="true" />
                </div>
                <h3 className="text-white font-semibold text-base mb-2 relative z-10">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed relative z-10 group-hover:text-zinc-400 transition-colors">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MADE BY */}
      <section className="px-4 py-24">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center rounded-3xl border border-[#7B72F8]/25 p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(165deg, rgba(123,114,248,0.1) 0%, #0D0D14 100%)' }}>
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[80px] opacity-40 pointer-events-none"
            style={{ background: 'rgba(123,114,248,0.22)' }} aria-hidden="true" />
          <div className="relative z-10">
            <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-4">{t('madeTag')}</p>
            <h2 className="font-display uppercase text-white text-2xl md:text-3xl mb-4">{t('madeTitle')}</h2>
            <p className="text-zinc-400 leading-relaxed max-w-xl mx-auto mb-6">{t('madeText')}</p>
            <Link href="/company" className="inline-flex items-center gap-2 text-[#7B72F8] hover:text-[#a855f7] transition-colors text-sm font-semibold">
              {t('madeLink')} <FaChevronRight size={11} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-4 py-28 text-center relative overflow-hidden bg-[#0C0C14]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.14) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="font-display uppercase text-white mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>{t('ctaTitle')}</h2>
          <p className="text-zinc-400 mb-9">{t('ctaSub')}</p>
          <a href={APP_STORE} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 h-[54px] px-9 rounded-2xl text-white font-semibold transition-transform hover:scale-[1.04] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 44px rgba(123,114,248,0.55)' }}>
            <FaApple size={19} aria-hidden="true" /> {t('download')}
            <FaArrowRight size={13} className="opacity-70" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
