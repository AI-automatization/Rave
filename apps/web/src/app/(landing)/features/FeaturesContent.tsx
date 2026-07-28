'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { type Variants } from 'framer-motion';
import {
  FaPlay, FaUsers, FaBell,
  FaWifi, FaShieldAlt, FaCheck, FaArrowRight,
} from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { appUrl } from '@/lib/app-url';

/* ── Animation configs ─────────────────────────────── */
const springConfig = { type: 'spring' as const, stiffness: 260, damping: 22 };

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } };

/* ── Animated Counter ──────────────────────────────── */
function useCountUp(end: number, duration = 1.8) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return { count, setHasStarted };
}

/* ── Star Field (full-page) ────────────────────────── */
function PageStarField() {
  const [stars, setStars] = useState<{ top: string; left: string; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 0.8,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      }))
    );
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ repeat: Infinity, duration: star.duration, delay: star.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ── Feature Card ──────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, tagline, color, glow, badge, features, index,
}: {
  icon: React.ComponentType<{ size: number; style: React.CSSProperties }>;
  title: string; tagline: string; color: string; glow: string;
  badge: string | null; features: string[]; index: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
      className="group relative rounded-2xl border border-zinc-800/60 overflow-hidden p-6 flex flex-col cursor-default"
      style={{ background: `linear-gradient(165deg, #111118 0%, #0D0D14 100%)` }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${color}50`;
        el.style.boxShadow = `0 0 50px ${glow}, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${color}25`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      {/* Corner glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-[60px] pointer-events-none"
        style={{ background: color }}
        aria-hidden="true"
      />

      {/* Icon + badge */}
      <div className="flex items-start justify-between mb-5">
        <motion.div
          className="p-3.5 rounded-xl relative"
          style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}
          whileHover={{ scale: 1.12, rotate: 5, boxShadow: `0 0 24px ${glow}` }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Icon size={24} style={{ color }} />
          {/* Pulse ring on hover */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: `0 0 0 2px ${color}25, 0 0 0 6px ${color}10` }}
          />
        </motion.div>
        {badge && (
          <motion.span
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}25` }}
            whileHover={{ scale: 1.1, boxShadow: `0 0 12px ${glow}` }}
          >
            {badge}
          </motion.span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-display text-xl uppercase text-white mb-1.5 group-hover:text-opacity-100 transition-all duration-300"
        style={{ textShadow: 'none' }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.textShadow = `0 0 20px ${glow}`; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.textShadow = 'none'; }}
      >
        {title}
      </h3>
      <p className="text-zinc-500 text-sm leading-relaxed mb-5 group-hover:text-zinc-400 transition-colors duration-300">
        {tagline}
      </p>

      {/* Feature list */}
      <ul className="space-y-2.5 mt-auto">
        {features.map((f, fi) => (
          <motion.li
            key={f}
            className="flex items-center gap-2.5 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors duration-200"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 + fi * 0.05, duration: 0.35 }}
          >
            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
              <FaCheck size={8} style={{ color }} />
            </span>
            {f}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── Main Component ────────────────────────────────── */
export function FeaturesContent() {
  const t = useTranslations('featuresPage');
  const tl = useTranslations('landing');
  // aria-label was hardcoded Russian — a screen reader on /uz/features and
  // /en/features announced the section in a language the page is not in.
  const tNav = useTranslations('nav');
  const { count: subCount, setHasStarted: startSubCounter } = useCountUp(150, 2.2);

  const FEATURE_LIST = [
    {
      icon: FaPlay,
      title: 'Watch Party',
      tagline: t('f1tagline'),
      color: '#7B72F8',
      glow: 'rgba(123,114,248,0.3)',
      badge: t('badgePrimary'),
      features: [t('f1b1'), t('f1b2'), t('f1b3'), t('f1b4'), t('f1b5')],
    },
    {
      icon: FaUsers,
      title: t('f4key'),
      tagline: t('f4tagline'),
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.25)',
      badge: null,
      features: [t('f4b1'), t('f4b2'), t('f4b3'), t('f4b4'), t('f4b5')],
    },
    {
      icon: FaBell,
      title: t('f5key'),
      tagline: t('f5tagline'),
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.25)',
      badge: null,
      features: [t('f5b1'), t('f5b2'), t('f5b3')],
    },
    {
      icon: FaWifi,
      title: 'Video Player',
      tagline: t('f7tagline'),
      color: '#f43f5e',
      glow: 'rgba(244,63,94,0.25)',
      badge: '4K',
      features: [t('f7b1'), t('f7b2'), t('f7b3'), t('f7b4'), t('f7b5')],
    },
    {
      icon: FaShieldAlt,
      title: t('f8key'),
      tagline: t('f8tagline'),
      color: '#4ade80',
      glow: 'rgba(74,222,128,0.2)',
      badge: null,
      features: [t('f8b1'), t('f8b2'), t('f8b3'), t('f8b4'), t('f8b5')],
    },
  ];

  const STATS = [
    { val: '∞',   label: tl('statsLabel1'), isCounter: false },
    { val: '4K',  label: t('statQuality'), isCounter: false },
    { val: '±2s', label: t('statSync'), isCounter: false },
    { val: '150+', label: tl('statsLabel4'), isCounter: true },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative">

      {/* ── Full-page star particles ── */}
      <PageStarField />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-8 px-4 text-center z-10">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[150px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)' }}
            animate={{ scale: [0.92, 1.1, 0.92], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(123,114,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(123,114,248,1) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springConfig }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 35px rgba(123,114,248,0.5)' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7B72F8]/40 bg-[#7B72F8]/10 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-6 shadow-[0_0_18px_rgba(123,114,248,0.3)] cursor-default"
          >
            <FaPlay size={8} /> {t('heroTag')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-display uppercase text-white leading-none mb-5"
            style={{ textShadow: '0 0 80px rgba(123,114,248,0.3)' }}
          >
            {t('title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto"
          >
            {t('heroSub')}
          </motion.p>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────── */}
      <section className="py-10 px-4 relative z-10" aria-label={tNav('stats')}>
        <div className="max-w-4xl mx-auto">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800/30 rounded-2xl overflow-hidden border border-zinc-800/50 shadow-[0_0_60px_rgba(123,114,248,0.06)]">
            {STATS.map(({ val, label, isCounter }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...springConfig, delay: i * 0.08 }}
                className="flex flex-col items-center justify-center py-8 px-4 bg-[#0D0D16]/90 relative group cursor-default hover:bg-[#7B72F8]/[0.06] transition-colors duration-300"
                onViewportEnter={isCounter ? () => startSubCounter(true) : undefined}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 50% 50%, rgba(123,114,248,0.08) 0%, transparent 70%)' }}
                  aria-hidden="true"
                />
                <dt className="sr-only">{label}</dt>
                <motion.dd
                  className="text-3xl md:text-4xl font-display font-bold bg-clip-text text-transparent mb-1"
                  style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {isCounter ? `${subCount}+` : val}
                </motion.dd>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium group-hover:text-zinc-400 transition-colors duration-200">
                  {label}
                </span>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── FEATURE CARDS ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-12 relative z-10">
        {/* Top row: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {FEATURE_LIST.slice(0, 3).map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <FeatureCard {...feat} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Bottom row: 2 cards centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {FEATURE_LIST.slice(3).map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <FeatureCard {...feat} index={i + 3} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Divider glow ────────────────────────────── */}
      <div className="relative h-px max-w-2xl mx-auto z-10" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.3), transparent)' }} />
      </div>

      {/* ── BOTTOM CTA ──────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-4 text-center z-10">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h2 className="text-4xl sm:text-5xl font-display uppercase text-white mb-4"
            style={{ textShadow: '0 0 60px rgba(123,114,248,0.35)' }}>
            {t('ctaTitle')}
          </h2>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">{t('ctaSub')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.95 }} transition={springConfig}>
              <a
                href={appUrl('/register')}
                className="group/btn inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-[#7B72F8] text-white font-semibold shadow-[0_0_24px_rgba(123,114,248,0.5)] hover:shadow-[0_0_50px_rgba(123,114,248,0.8)] hover:bg-[#6B63E8] transition-all duration-300 text-sm relative overflow-hidden"
              >
                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <FaPlay size={11} />
                <span>{tl('startShort')}</span>
              </a>
            </motion.div>
            {/* Secondary CTA */}
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={springConfig}>
              <Link
                href="/pricing"
                className="group/btn inline-flex items-center gap-2.5 h-12 px-8 rounded-xl border border-zinc-700 text-zinc-400 hover:border-[#7B72F8]/60 hover:text-white hover:shadow-[0_0_24px_rgba(123,114,248,0.2)] transition-all duration-300 text-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[#7B72F8]/10 to-transparent" />
                {tl('nav_pricing')} <FaArrowRight size={11} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
