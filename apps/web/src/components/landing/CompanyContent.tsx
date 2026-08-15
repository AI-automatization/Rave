'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FaGlobe, FaPlay, FaMapMarkerAlt, FaChevronRight, FaArrowRight,
  FaLightbulb, FaDraftingCompass, FaCode, FaRocket,
} from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';
import { PRODUCTS, TEAM, TECH, TEZCODE_URL } from '@/data/tezcode';
import { TeamPortrait } from '@/components/common/TeamPortrait';
import { ContactSection } from './ContactSection';
import { spring, fadeUp, fadeUpScale, stagger } from './motion';
import { useLocalizedHref } from '@/lib/i18n/use-localized-href';

// ── Count-up ────────────────────────────────────────────────────────────────
function useCountUp(end: number, duration = 1.6) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let raf = 0; let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);
  return { count, start: () => setStarted(true) };
}

function StatNumber({ value }: { value: number }) {
  const { count, start } = useCountUp(value);
  return (
    <motion.span onViewportEnter={start} viewport={{ once: true }}>
      {count}
    </motion.span>
  );
}

export function CompanyContent() {
  const t = useTranslations('company');
  const L = useLocalizedHref();
  // Breadcrumb home link follows the page's own language, not the bare root
  // (which now 301s to /ru and would drop an Uzbek reader into Russian).
  const locale = useLocale();
  const reduce = useReducedMotion();

  const STATS = [
    { num: 8, label: t('statProducts'), href: L('/ru/products') },
    { num: 16, label: t('statTeam') },
    { num: 6, label: t('statDirections') },
    // Hardcoded 'Ташкент' until /uz/company and /en/company existed — the city
    // name is a word like any other and has to follow the page's language.
    { text: t('cityName'), label: t('statCity') },
  ];

  const STEPS = [
    { n: '01', icon: FaLightbulb, color: '#7B72F8', title: t('step1title'), desc: t('step1desc') },
    { n: '02', icon: FaDraftingCompass, color: '#22d3ee', title: t('step2title'), desc: t('step2desc') },
    { n: '03', icon: FaCode, color: '#a855f7', title: t('step3title'), desc: t('step3desc') },
    { n: '04', icon: FaRocket, color: '#4ade80', title: t('step4title'), desc: t('step4desc') },
  ];

  return (
    <div className="bg-page text-white overflow-x-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[1100px] h-[620px] rounded-full blur-[180px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.22) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)' }}
            animate={reduce ? {} : { scale: [0.95, 1.1, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
          <div className="absolute bottom-[12%] left-[12%] w-[420px] h-[420px] rounded-full blur-[130px]"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)' }} />
          <div className="absolute top-[22%] right-[10%] w-[360px] h-[360px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="co-grid" width="72" height="72" patternUnits="userSpaceOnUse">
                <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#co-grid)" />
          </svg>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.nav variants={fadeUp} className="text-sm text-zinc-500 mb-8">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-400">{t('breadcrumb')}</span>
          </motion.nav>

          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-9 px-5 py-2 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/[0.08] backdrop-blur-md text-sm text-white/80"
            style={{ boxShadow: '0 0 28px rgba(123,114,248,0.2)' }}
          >
            <FaMapMarkerAlt size={12} className="text-[#7B72F8]" aria-hidden="true" />
            {t('badge')}
          </motion.div>

          <motion.h1
            variants={fadeUpScale}
            className="font-display uppercase leading-[0.85] tracking-tight mb-7"
            style={{ fontSize: 'clamp(3.5rem, 15vw, 10rem)', textShadow: '0 0 120px rgba(123,114,248,0.3)' }}
          >
            tez
            <motion.span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg, #7B72F8 0%, #a855f7 45%, #22d3ee 100%)', backgroundSize: '200% 200%' }}
              animate={reduce ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            >
              code
            </motion.span>
            <span className="text-zinc-600">.dev</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[#a89ffc] text-lg md:text-2xl font-semibold mb-5">
            {t('slogan')}
          </motion.p>

          <motion.p variants={fadeUp} className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('heroSub')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3.5 justify-center">
            <a
              href={TEZCODE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-[52px] px-8 rounded-2xl text-white font-semibold transition-transform hover:scale-[1.04] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 40px rgba(123,114,248,0.5)' }}
            >
              tezcode.dev <FaArrowRight size={13} aria-hidden="true" />
            </a>
            <Link
              href={L('/ru/products')}
              className="inline-flex items-center gap-2 h-[52px] px-8 rounded-2xl border border-zinc-700/80 text-zinc-200 hover:text-white hover:border-[#7B72F8]/50 hover:bg-[#7B72F8]/[0.05] transition-colors"
            >
              {t('ctaProducts')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Products marquee */}
        <div className="relative z-10 w-full max-w-6xl mx-auto mt-16 overflow-hidden" aria-hidden="true">
          <div className="absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-[#0A0A0F] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-[#0A0A0F] to-transparent pointer-events-none" />
          <div className="flex w-max animate-marquee-scroll gap-3">
            {[...PRODUCTS, ...PRODUCTS, ...PRODUCTS].map((p, i) => (
              <span key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-800/70 bg-[#111118]/60 text-sm text-zinc-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="px-4 py-16 border-y border-zinc-800/50 bg-[#0C0C14]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4">
          {STATS.map((s, i) => {
            const body = (
              <div className="flex flex-col items-center text-center group">
                <span
                  className="font-display font-bold bg-clip-text text-transparent leading-none mb-2 flex items-center"
                  style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)', fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
                >
                  {'num' in s ? <><StatNumber value={s.num!} /><span className="text-[#a855f7]">+</span></> : s.text}
                </span>
                <span className="text-[11px] md:text-xs text-zinc-500 uppercase tracking-[0.18em] flex items-center gap-1.5 group-hover:text-zinc-300 transition-colors">
                  {s.label}
                  {'href' in s && s.href && <FaArrowRight size={9} className="text-[#7B72F8]" aria-hidden="true" />}
                </span>
              </div>
            );
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: i * 0.08 }}
                className="md:border-r md:last:border-r-0 border-zinc-800/50">
                {'href' in s && s.href ? <Link href={s.href} aria-label={s.label}>{body}</Link> : body}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ WHO WE ARE (asymmetric) ═══════════════ */}
      <section className="px-4 py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,114,248,0.07) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-5">{t('whoTag')}</p>
            <h2 className="font-display uppercase text-white leading-[0.95]" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}>
              {t('whoTitle1')}<br />
              <span className="text-zinc-600">{t('whoTitle2')}</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl leading-relaxed border-l-2 border-[#7B72F8]/40 pl-6"
          >
            {t('whoText')}
          </motion.p>
        </div>
      </section>

      {/* ═══════════════ PROCESS — как мы работаем ═══════════════ */}
      <section className="px-4 py-24 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,114,248,0.06) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('processTag')}</motion.p>
            <motion.h2 variants={fadeUp} className="font-display uppercase text-white" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)' }}>{t('processTitle')}</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 mt-4 max-w-lg mx-auto">{t('processSub')}</motion.p>
          </motion.div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* соединительная линия (desktop) */}
            <div className="hidden lg:block absolute top-[46px] left-[12%] right-[12%] h-px" aria-hidden="true"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.35), rgba(168,85,247,0.35), rgba(74,222,128,0.35), transparent)' }} />
            {STEPS.map(({ n, icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className="group relative rounded-3xl border border-zinc-800/60 p-6 overflow-hidden"
                style={{ background: 'linear-gradient(165deg, #111118 0%, #0D0D14 100%)' }}
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[45px] pointer-events-none"
                  style={{ background: color }} aria-hidden="true" />
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} aria-hidden="true" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                      <Icon size={19} style={{ color }} aria-hidden="true" />
                    </div>
                    <span className="font-display font-bold leading-none opacity-25 group-hover:opacity-60 transition-opacity"
                      style={{ color, fontSize: '2.75rem' }}>{n}</span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TEAM — большие портреты ═══════════════ */}
      <section className="px-4 py-24 bg-[#0C0C14] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[340px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.08) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('teamTag')}</motion.p>
            <motion.h2 variants={fadeUp} className="font-display uppercase text-white" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)' }}>{t('teamTitle')}</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-500 mt-4 max-w-lg mx-auto">{t('teamSub')}</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TEAM.map((m, i) => (
              <motion.div
                key={m.name}
                variants={fadeUpScale}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              >
                <TeamPortrait name={m.name} role={t(`role${m.key}`)} photo={m.photo} index={i} star={m.tag === 'lead'} />
                <p className="text-zinc-500 text-sm leading-relaxed mt-5 px-1">{t(`bio${m.key}`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TECH — marquee ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="text-center mb-12 px-4">
          <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('techTag')}</p>
          <h2 className="font-display uppercase text-white" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}>{t('techTitle')}</h2>
        </div>
        <div className="relative overflow-hidden py-2" aria-hidden="true">
          <div className="absolute left-0 top-0 h-full w-28 z-10 bg-gradient-to-r from-[#0A0A0F] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-28 z-10 bg-gradient-to-l from-[#0A0A0F] to-transparent pointer-events-none" />
          <div className="flex w-max animate-marquee-scroll gap-3.5">
            {[...TECH, ...TECH, ...TECH].map((tech, i) => (
              <span key={i} className="px-6 py-3 rounded-2xl text-base text-zinc-300 border border-zinc-800 bg-[#111118]/70 whitespace-nowrap">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WEWATCH BRIDGE ═══════════════ */}
      <section className="px-4 py-28 bg-[#0C0C14]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -26 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-4">{t('bridgeTag')}</p>
            <h2 className="font-display uppercase text-white leading-[0.95] mb-6" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)' }}>
              {t('bridgeTitle1')}<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}>
                {t('bridgeTitle2')}
              </span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">{t('bridgeText')}</p>
            <Link href={L('/ru/features')} className="inline-flex items-center gap-2 text-[#7B72F8] hover:text-[#a855f7] transition-colors text-sm font-semibold">
              {t('bridgeLink')} <FaChevronRight size={11} aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div
            aria-disabled="true"
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative rounded-[28px] border border-[#7B72F8]/30 p-10 text-center overflow-hidden block cursor-default select-none"
            style={{ background: 'linear-gradient(165deg, rgba(123,114,248,0.14) 0%, #0D0D14 100%)' }}
          >
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-[80px] opacity-45 pointer-events-none"
              style={{ background: 'rgba(123,114,248,0.28)' }} aria-hidden="true" />
            <div className="relative z-10">
              <div className="w-[72px] h-[72px] mx-auto rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(123,114,248,0.2)', border: '1px solid rgba(123,114,248,0.4)' }}>
                <FaPlay size={26} className="text-[#7B72F8] ml-1" aria-hidden="true" />
              </div>
              <p className="text-white font-display text-2xl md:text-3xl uppercase mb-2">{t('bridgeCardTitle')}</p>
              <p className="text-zinc-500 text-sm mb-6">{t('bridgeCardSub')}</p>
              <Link href={L('/')}
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-white/90 font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', opacity: 0.9, boxShadow: '0 0 30px rgba(123,114,248,0.4)' }}
              >
                <FaGlobe size={18} aria-hidden="true" /> WeWatch Web
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ CONTACT ═══════════════ */}
      <ContactSection />
    </div>
  );
}
