'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import {
  FaPlay, FaUsers, FaFire, FaComment, FaApple,
  FaChevronRight, FaCheck, FaLink, FaHeart, FaUserFriends, FaGlobe,
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useTranslations } from 'next-intl';
import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

// ── Motion config ─────────────────────────────────────────────────────────────
// All durations comply with skill rule §7: 150–400ms
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
};
const screenVariants: Variants = {
  enter:  { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0,   transition: { duration: 0.3, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -8,  transition: { duration: 0.18 } },
};

const APP_STORE = 'https://apps.apple.com';
const TYPING_URL  = 'youtube.com';


const HERO_BUBBLES = [
  { top: '28%', left: '7%',  label: 'Sardor',  color: '#7B72F8', delay: 0   },
  { top: '62%', left: '5%',  label: 'Nilufar', color: '#a855f7', delay: 0.5 },
  { top: '22%', right: '7%', label: 'Bobur',   color: '#22d3ee', delay: 1   },
  { top: '65%', right: '5%', label: 'Akbar',   color: '#f43f5e', delay: 1.5 },
] as const;

const MARQUEE_ITEMS = [
  'YouTube', 'VK', 'Rutube', 'Uzmove', 'Cinerama',
  'YouTube', 'VK', 'Rutube', 'Uzmove', 'Cinerama',
];



// ── Noise overlay (static, не перерисовывается) ────────────────────────────
function NoiseOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.022] z-0 select-none" aria-hidden="true">
      <filter id="noise-f">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-f)" />
    </svg>
  );
}

// ── Marquee ────────────────────────────────────────────────────────────────
function Marquee() {
  return (
    <div className="relative overflow-hidden py-5 border-y border-zinc-800/50 bg-[#0D0D16]/80 backdrop-blur-sm" role="marquee" aria-label="Поддерживаемые платформы">
      <div className="absolute left-0 top-0 h-full w-20 z-10 bg-gradient-to-r from-[#0D0D16] to-transparent pointer-events-none" aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-20 z-10 bg-gradient-to-l from-[#0D0D16] to-transparent pointer-events-none" aria-hidden="true" />
      <motion.div
        className="marquee-track flex gap-10 whitespace-nowrap will-change-transform"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        aria-hidden="true"
      >
        {MARQUEE_ITEMS.map((item, i) => (
          <span key={i} className="flex items-center gap-2.5 text-sm text-zinc-500 font-medium tracking-wide flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-[#7B72F8]/60 flex-shrink-0" aria-hidden="true" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Stats Bar ────────────────────────────────────────────────────────────
function StatsBar() {
  const t = useTranslations('landing');
  const STATS = [
    { value: '∞',   label: t('statsLabel1') },
    { value: '4K',  label: t('statsLabel2') },
    { value: '±2s', label: t('statsLabel3') },
    { value: '0',   label: t('statsLabel4') },
  ];
  return (
    <section className="py-14 px-4 relative overflow-hidden" aria-label="Статистика">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0D0D1A] to-[#0A0A0F]" aria-hidden="true" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800/30 rounded-2xl overflow-hidden border border-zinc-800/50 shadow-[0_0_60px_rgba(123,114,248,0.06)]">
          {STATS.map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex flex-col items-center justify-center py-10 px-6 bg-[#0D0D16]/90 relative group cursor-default">
              <div className="absolute inset-0 bg-[#7B72F8]/0 group-hover:bg-[#7B72F8]/4 transition-colors duration-300" aria-hidden="true" />
              <dt className="sr-only">{label}</dt>
              <dd className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent mb-1"
                style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}>
                {value}
              </dd>
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{label}</span>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── GlassCard ────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', glowColor = '#7B72F8' }: {
  children: React.ReactNode; className?: string; glowColor?: string;
}) {
  return (
    <div className={`relative rounded-2xl border border-zinc-800/60 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:border-zinc-700/80 ${className}`}
      style={{ background: 'linear-gradient(145deg, rgba(17,17,24,0.96), rgba(13,13,22,0.99))' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor}0c 0%, transparent 65%)` }} aria-hidden="true" />
      <div className="absolute top-0 left-0 right-0 h-px opacity-35"
        style={{ background: `linear-gradient(90deg, transparent, ${glowColor}55, transparent)` }} aria-hidden="true" />
      {children}
    </div>
  );
}

// ── Bento Features Grid ───────────────────────────────────────────────────
function BentoFeatures({ t }: { t: ReturnType<typeof useTranslations<'landing'>> }) {
  return (
    <section className="py-24 px-4 bg-[#0A0A0F] relative overflow-hidden" aria-labelledby="features-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.05) 0%, transparent 70%)' }} />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.h2 variants={fadeUp} id="features-heading" className="text-4xl md:text-5xl font-display uppercase mb-3 text-white">
            {t('featTitle')}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-500 max-w-md mx-auto">{t('featSub')}</motion.p>
        </motion.div>

        {/* Bento Grid — Priority 4 (style: bento grid for entertainment SaaS) */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">

          {/* [1] Large — Watch Together (2 cols × 2 rows) */}
          <motion.div variants={fadeUp} className="md:col-span-2 md:row-span-2">
            <GlassCard className="h-full p-8 flex flex-col justify-between" glowColor="#7B72F8">
              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(123,114,248,0.14)', border: '1px solid rgba(123,114,248,0.28)' }}>
                  <FaUsers size={24} className="text-[#7B72F8]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl uppercase text-white mb-3">{t('f1title')}</h3>
                <p className="text-zinc-400 leading-relaxed max-w-sm">{t('f1desc')}</p>
              </div>
              {/* Mini sync visual */}
              <div className="flex gap-2 mt-4">
                {[['S', '#7B72F8', 58], ['N', '#a855f7', 58], ['B', '#6B63E8', 57]].map(([l, c, p], i) => (
                  <div key={String(l)} className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                        style={{ background: `${String(c)}22`, border: `1px solid ${String(c)}44` }}>{String(l)}</div>
                      <span className="text-[10px] text-zinc-600">{String(p)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                        whileInView={{ width: `${Number(p) + i}%` }} viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${String(c)}, ${String(c)}cc)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* [2] Real-time Chat (1 col × 1 row) */}
          <motion.div variants={fadeUp}>
            <GlassCard className="h-full p-6" glowColor="#22d3ee">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.22)' }}>
                <FaComment size={18} className="text-[#22d3ee]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f5title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f5desc')}</p>
            </GlassCard>
          </motion.div>

          {/* [3] Built-in Browser (1 col × 1 row) */}
          <motion.div variants={fadeUp}>
            <GlassCard className="h-full p-6" glowColor="#7B72F8">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(123,114,248,0.14)', border: '1px solid rgba(123,114,248,0.28)' }}>
                <FaGlobe size={18} className="text-[#7B72F8]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f6title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f6desc')}</p>
            </GlassCard>
          </motion.div>

          {/* [4] Friends — wide bottom (3 cols × 1 row) */}
          <motion.div variants={fadeUp} className="md:col-span-3">
            <GlassCard className="h-full p-6 flex flex-col md:flex-row items-center gap-6" glowColor="#a855f7">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <FaUserFriends size={20} className="text-[#a855f7]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl uppercase text-white mb-1">{t('f4title')}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{t('f4desc')}</p>
              </div>
              {/* Friend avatars mini */}
              <div className="flex -space-x-2 flex-shrink-0">
                {[['S', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8'], ['A', '#f43f5e']].map(([l, c]) => (
                  <div key={String(l)} className="w-9 h-9 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `${String(c)}` }}>{String(l)}</div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-[#0A0A0F] border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs">+</div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── WhyWeWatch ───────────────────────────────────────────────────────────
function WhyWeWatch() {
  const t = useTranslations('landing');
  const WHY_ITEMS = [
    {
      icon: FaGlobe,
      color: '#7B72F8',
      bg: 'rgba(123,114,248,0.12)',
      border: 'rgba(123,114,248,0.25)',
      title: t('whyBrowserTitle'),
      text: t('whyBrowserText'),
    },
    {
      icon: FaUsers,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.10)',
      border: 'rgba(34,211,238,0.22)',
      title: t('whySyncTitle'),
      text: t('whySyncText'),
    },
    {
      icon: FaCheck,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.10)',
      border: 'rgba(34,197,94,0.22)',
      title: t('whyFreeTitle'),
      text: t('whyFreeText'),
    },
  ];
  return (
    <section className="py-20 px-4 bg-[#0D0D16] relative overflow-hidden" aria-labelledby="why-heading">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">{t('whyTitle')}</motion.p>
          <motion.h2 variants={fadeUp} id="why-heading" className="text-3xl md:text-4xl font-display uppercase text-white">
            {t('whySubtitle')}
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {WHY_ITEMS.map(({ icon: Icon, color, bg, border, title, text }) => (
            <motion.div key={title} variants={fadeUp}>
              <GlassCard className="p-6 h-full flex flex-col gap-5" glowColor={color}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={22} style={{ color }} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Phone screens ─────────────────────────────────────────────────────────
type TFn = ReturnType<typeof useTranslations<'landing'>>;

function ScreenHome({ t }: { t: TFn }) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <IPhoneStatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#7B72F8] flex items-center justify-center shadow-[0_0_10px_rgba(123,114,248,0.6)]">
            <FaPlay size={7} className="text-white ml-0.5" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-wide">WeWatch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-[9px] text-green-400 font-medium">2 {t('screenOnline')}</span>
        </div>
      </div>
      {/* Browser selector — key differentiator */}
      <div className="mx-4 rounded-xl bg-[#111118] border border-[#7B72F8]/25 p-3.5 mb-3">
        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-2.5 font-medium">{t('openSite')}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'YouTube', color: '#FF4444', bg: 'rgba(255,68,68,0.12)' },
            { label: 'VK',      color: '#2787F5', bg: 'rgba(39,135,245,0.12)' },
            { label: 'Rutube',  color: '#E53935', bg: 'rgba(229,57,53,0.12)' },
          ].map(({ label, color, bg }, i) => (
            <motion.div key={label} className="rounded-lg py-2.5 text-center cursor-pointer"
              style={{ background: bg, border: `1px solid ${color}30` }}
              animate={i === 1 ? { scale: [1, 1.04, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.4 }}>
              <span className="text-[9px] font-semibold" style={{ color }}>{label}</span>
            </motion.div>
          ))}
        </div>
        <motion.div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
          style={{ background: 'linear-gradient(135deg, #7B72F8, #5B4FD8)' }}
          animate={{ boxShadow: ['0 0 8px rgba(123,114,248,0.35)', '0 0 20px rgba(123,114,248,0.65)', '0 0 8px rgba(123,114,248,0.35)'] }}
          transition={{ repeat: Infinity, duration: 2.5 }}>
          <FaGlobe size={11} className="text-white flex-shrink-0" aria-hidden="true" />
          <span className="text-white text-[11px] font-semibold">{t('openBrowser')}</span>
          <FaChevronRight size={8} className="text-white/60 ml-auto" aria-hidden="true" />
        </motion.div>
      </div>
      <div className="flex-1 px-4 overflow-hidden">
        <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-2.5 font-medium">{t('screenActiveRooms')}</p>
        <div className="space-y-2.5">
          {[
            { name: 'Sardor + 2', status: t('screenWatching'), color: '#7B72F8', initials: 'S' },
            { name: 'Nilufar + 1', status: t('screenWaiting'), color: '#a855f7', initials: 'N' },
          ].map((room, i) => (
            <motion.div key={room.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-[#111118] border border-zinc-800/60 px-3.5 py-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: `${room.color}30`, border: `1.5px solid ${room.color}50` }}>{room.initials}</div>
              <div className="min-w-0">
                <p className="text-[11px] text-white font-medium truncate">{room.name}</p>
                <p className="text-[9px] text-zinc-400">{room.status}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" aria-hidden="true" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mx-4 mb-2 rounded-xl p-3.5 flex items-center gap-3 border border-[#7B72F8]/30"
        style={{ background: 'rgba(123,114,248,0.08)' }}>
        <FaUsers size={13} className="text-[#7B72F8] flex-shrink-0" aria-hidden="true" />
        <span className="text-[#7B72F8] text-[11px] font-semibold">{t('screenCreateParty')}</span>
        <FaChevronRight size={9} className="text-[#7B72F8]/60 ml-auto" aria-hidden="true" />
      </div>
      <IPhoneHomeIndicator />
    </div>
  );
}

function ScreenRoom({ t }: { t: TFn }) {
  return (
    <div className="h-full flex flex-col bg-[#080812] select-none">
      <IPhoneStatusBar />
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-1 pb-3 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <FaChevronRight size={8} className="text-zinc-400 rotate-180" aria-hidden="true" />
        </div>
        <span className="text-[13px] font-bold text-white tracking-wide flex-1">{t('screenWPLabel')}</span>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            style={{ boxShadow: '0 0 6px #4ade80' }} aria-hidden="true" />
          <span className="text-[9px] text-green-400 font-semibold">{t('screenReady')}</span>
        </div>
      </div>

      {/* Video preview card */}
      <div className="mx-4 mt-3.5 rounded-2xl overflow-hidden"
        style={{ border: '1.5px solid rgba(123,114,248,0.25)', background: 'linear-gradient(145deg, #12073a 0%, #0d0520 60%, #080318 100%)' }}>
        {/* Thumbnail */}
        <div className="relative h-[68px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(rgba(123,114,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(123,114,248,1) 1px,transparent 1px)', backgroundSize: '16px 16px' }}
            aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(123,114,248,0.18) 0%, transparent 70%)' }} aria-hidden="true" />
          <motion.div
            className="w-11 h-11 rounded-full flex items-center justify-center relative z-10"
            style={{ background: 'rgba(123,114,248,0.22)', border: '2px solid rgba(123,114,248,0.55)' }}
            animate={{ boxShadow: ['0 0 0px rgba(123,114,248,0.3)', '0 0 20px rgba(123,114,248,0.7)', '0 0 0px rgba(123,114,248,0.3)'] }}
            transition={{ repeat: Infinity, duration: 2.2 }}>
            <FaPlay size={12} className="text-[#7B72F8] ml-0.5" aria-hidden="true" />
          </motion.div>
        </div>
        {/* URL row + progress */}
        <div className="px-3.5 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2.5">
            <FaLink size={8} className="text-[#7B72F8]/60 flex-shrink-0" aria-hidden="true" />
            <span className="text-[9px] text-zinc-400 font-mono truncate flex-1">youtube.com/watch?v=dQw...</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full w-0 rounded-full" style={{ background: 'linear-gradient(90deg, #7B72F8, #a855f7)' }} />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[8px] text-zinc-500 uppercase tracking-[0.14em] font-semibold">{t('screenParticipants')}</p>
          <span className="text-[9px] font-bold" style={{ color: '#7B72F8' }}>3 / 4</span>
        </div>
        <div className="flex gap-3.5 items-center">
          {[['A', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8']].map(([l, c], i) => (
            <motion.div key={String(l)} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.15, type: 'spring', stiffness: 300, damping: 22 }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${String(c)}35, ${String(c)}14)`,
                    border: `2px solid ${String(c)}`,
                    boxShadow: `0 0 12px ${String(c)}45`,
                  }}>{String(l)}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080812]"
                  style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} aria-hidden="true" />
              </div>
            </motion.div>
          ))}
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ border: '2px dashed rgba(255,255,255,0.20)' }}>
            <span className="text-zinc-500 text-sm font-semibold">+</span>
          </div>
        </div>
      </div>

      {/* Invite link */}
      <div className="mx-4 mt-4 rounded-xl px-3.5 py-3 flex items-center gap-3"
        style={{ background: 'rgba(123,114,248,0.08)', border: '1px solid rgba(123,114,248,0.22)' }}>
        <span className="text-[9px] text-zinc-400 font-mono flex-1 truncate">wewatch.app/join/xK9pQr</span>
        <div className="rounded-full px-2.5 py-1 flex-shrink-0"
          style={{ background: 'rgba(123,114,248,0.22)', border: '1px solid rgba(123,114,248,0.45)' }}>
          <span className="text-[9px] font-bold" style={{ color: '#7B72F8' }}>{t('screenCopy')}</span>
        </div>
      </div>

      {/* Start button */}
      <motion.div
        className="mx-4 mt-auto mb-2 rounded-2xl py-3.5 flex items-center justify-center gap-3 relative overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #7B72F8 0%, #6460E8 50%, #5348D4 100%)',
          boxShadow: '0 0 32px rgba(123,114,248,0.55), 0 4px 20px rgba(0,0,0,0.5)',
        }}
        animate={{ scale: [1, 1.016, 1] }}
        transition={{ repeat: Infinity, duration: 1.9 }}>
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 55%)' }} aria-hidden="true" />
        <FaPlay size={12} className="text-white relative z-10" aria-hidden="true" />
        <span className="text-white text-[13px] font-bold tracking-wide relative z-10">{t('screenStartBtn')}</span>
      </motion.div>
      <IPhoneHomeIndicator />
    </div>
  );
}

function ScreenWatching({ t, chatMsgs, visibleChats }: { t: TFn; chatMsgs: { u: string; msg: string; color: string }[]; visibleChats: number[] }) {
  const reduce = useReducedMotion();
  return (
    <div className="h-full flex flex-col bg-[#080812] select-none">
      {/* Video area */}
      <div className="relative flex-shrink-0 overflow-hidden"
        style={{ height: '42%', background: 'radial-gradient(ellipse at 30% 40%, #1a0640 0%, #0d0420 55%, #050010 100%)' }}>
        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(123,114,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(123,114,248,1) 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          aria-hidden="true" />
        {/* center glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(123,114,248,0.18) 0%, transparent 65%)' }} aria-hidden="true" />

        {/* Status bar over video */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <IPhoneStatusBar />
        </div>

        {/* Top bar: back + title (left) — sync pill + avatars (right) */}
        <div className="absolute top-10 left-3.5 right-3.5 flex items-start justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <FaChevronRight size={7} className="text-white/70 rotate-180" aria-hidden="true" />
            </div>
            <span className="text-[11px] font-bold text-white tracking-wide"
              style={{ textShadow: '0 0 10px rgba(123,114,248,0.55)' }}>Inception</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 backdrop-blur-md"
              style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.24)' }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                style={{ boxShadow: '0 0 6px #4ade80' }} aria-hidden="true" />
              <span className="text-[8px] text-green-400 font-semibold">{t('screenSyncLabel')}</span>
            </div>
            <div className="flex -space-x-1.5">
              {[['A', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8']].map(([l, c]) => (
                <div key={String(l)} className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${String(c)}45, ${String(c)}18)`,
                    border: `1.5px solid ${String(c)}`,
                    boxShadow: `0 0 8px ${String(c)}55`,
                  }}>{String(l)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(123,114,248,0.22)', border: '2px solid rgba(123,114,248,0.55)' }}
            animate={reduce ? undefined : { boxShadow: ['0 0 0px rgba(123,114,248,0.3)', '0 0 22px rgba(123,114,248,0.7)', '0 0 0px rgba(123,114,248,0.3)'] }}
            transition={{ repeat: Infinity, duration: 2.2 }}>
            <FaPlay size={13} className="text-[#7B72F8] ml-0.5" aria-hidden="true" />
          </motion.div>
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.14)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7B72F8, #a855f7)', boxShadow: '0 0 8px rgba(123,114,248,0.6)' }}
              initial={{ width: reduce ? '60%' : '28%' }}
              animate={{ width: '60%' }}
              transition={reduce ? { duration: 0 } : { duration: 10, ease: 'linear' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-white/60 font-medium tabular-nums">12:35</span>
              <FaUsers size={7} className="text-white/40" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <FaGlobe size={7} className="text-white/40" aria-hidden="true" />
              <span className="text-[8px] text-white/60 font-medium tabular-nums">48:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-4 pt-3 pb-2.5 border-b border-white/[0.07] flex items-center gap-2">
          <FaComment size={10} style={{ color: '#22d3ee' }} aria-hidden="true" />
          <span className="text-[10px] text-white/75 font-medium">{t('screenRealtimeChat')}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
              style={{ boxShadow: '0 0 6px #4ade80' }} aria-hidden="true" />
            <span className="text-[8px] text-white/50">3 {t('screenPeopleOnline')}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-3 space-y-2.5 overflow-hidden">
          {chatMsgs.map((msg, i) => (
            <AnimatePresence key={i}>
              {visibleChats.includes(i) && (
                <motion.div initial={{ opacity: 0, x: -10, y: 4, scale: 0.95 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${msg.color}, ${msg.color}99)`,
                      boxShadow: `0 0 8px ${msg.color}45`,
                    }}>{msg.u}</div>
                  <div className="rounded-2xl px-3 py-2 max-w-[80%]"
                    style={{ background: '#111122', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `2px solid ${msg.color}` }}>
                    <span className="text-[10px] text-zinc-200 leading-snug">{msg.msg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Chat input */}
        <div className="mx-4 mb-1.5 rounded-2xl flex items-center gap-2.5 pl-3 pr-1.5 py-2"
          style={{ background: '#0e0e1a', border: '1px solid rgba(123,114,248,0.20)' }}>
          <FaComment size={10} className="text-[#7B72F8]/40 flex-shrink-0" aria-hidden="true" />
          <span className="text-[9px] text-zinc-500 flex-1 truncate">{t('screenChatHint')}</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7B72F8, #6460E8)', boxShadow: '0 0 12px rgba(123,114,248,0.5)' }}>
            <FaChevronRight size={10} className="text-white" aria-hidden="true" />
          </div>
        </div>
        <IPhoneHomeIndicator />
      </div>
    </div>
  );
}

/* iPhone status bar — reusable across all screens */
function IPhoneStatusBar() {
  return (
    <div className="flex justify-between items-center px-6 pt-3.5 pb-1" aria-hidden="true">
      <span className="text-[10px] text-white/80 font-semibold tabular-nums" style={{ letterSpacing: '0.02em' }}>9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="rgba(255,255,255,0.8)" />
          <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="rgba(255,255,255,0.8)" />
          <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="rgba(255,255,255,0.8)" />
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="rgba(255,255,255,0.35)" />
        </svg>
        {/* WiFi */}
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M6 8.5a1 1 0 1 1 0 .01" fill="rgba(255,255,255,0.8)" />
          <path d="M3.5 6.8a3.5 3.5 0 0 1 5 0" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M1.5 4.6a6.2 6.2 0 0 1 9 0" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-[1px]">
          <div className="relative w-[18px] h-[9px] rounded-[2.5px] border border-white/50 flex items-center p-[1.5px]">
            <div className="h-full rounded-[1px]" style={{ width: '72%', background: 'rgba(255,255,255,0.8)' }} />
          </div>
          <div className="w-[1.5px] h-[4px] rounded-r-[1px] bg-white/40" />
        </div>
      </div>
    </div>
  );
}

/* iPhone home indicator */
function IPhoneHomeIndicator() {
  return (
    <div className="flex justify-center pb-2 pt-1" aria-hidden="true">
      <div className="w-[100px] h-[4px] rounded-full bg-white/20" />
    </div>
  );
}

function PhoneMockup({ t, activeScreen, visibleChats, chatMsgs }: {
  t: TFn; activeScreen: number; visibleChats: number[]; chatMsgs: { u: string; msg: string; color: string }[];
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div className="relative mx-auto" style={{ width: 280 }} aria-label="WeWatch ilovasi demo"
      initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.65 }}>
      <div className="absolute -inset-20 bg-[#7B72F8]/12 rounded-full blur-[80px] -z-10 pointer-events-none" aria-hidden="true" />
      <motion.div animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
        <div className="relative overflow-hidden"
          style={{
            borderRadius: 48,
            border: '3px solid rgba(60,60,70,0.6)',
            background: '#000',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset, 0 60px 120px rgba(0,0,0,0.95), 0 0 80px rgba(123,114,248,0.18), inset 0 0 0 1px rgba(255,255,255,0.03)',
            height: 580,
          }}>
          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center"
            style={{ width: 100, height: 28, borderRadius: 20, background: '#000' }}
            aria-hidden="true">
            {/* Camera dot */}
            <div className="absolute right-5 w-[6px] h-[6px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(30,30,50,0.9) 40%, rgba(20,20,40,0.5) 100%)', boxShadow: 'inset 0 0 2px rgba(100,100,255,0.3)' }} />
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 45 }}>
            <AnimatePresence mode="wait">
              {activeScreen === 0 && (<motion.div key="home" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenHome t={t} /></motion.div>)}
              {activeScreen === 1 && (<motion.div key="room"  className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenRoom t={t} /></motion.div>)}
              {activeScreen === 2 && (<motion.div key="watch" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenWatching t={t} chatMsgs={chatMsgs} visibleChats={visibleChats} /></motion.div>)}
            </AnimatePresence>
          </div>

          {/* Glass reflection */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, transparent 40%)', borderRadius: 45 }} aria-hidden="true" />
        </div>

        {/* Side buttons */}
        {/* Volume up */}
        <div className="absolute left-0 top-[120px] w-[3px] h-[28px] rounded-r-sm" aria-hidden="true"
          style={{ background: 'rgba(60,60,70,0.6)', transform: 'translateX(-3px)' }} />
        {/* Volume down */}
        <div className="absolute left-0 top-[158px] w-[3px] h-[28px] rounded-r-sm" aria-hidden="true"
          style={{ background: 'rgba(60,60,70,0.6)', transform: 'translateX(-3px)' }} />
        {/* Power button */}
        <div className="absolute right-0 top-[140px] w-[3px] h-[40px] rounded-l-sm" aria-hidden="true"
          style={{ background: 'rgba(60,60,70,0.6)', transform: 'translateX(3px)' }} />
      </motion.div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export function LandingContent() {
  const t = useTranslations('landing');
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', shouldReduceMotion ? '0%' : '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 1]);

  const [activeScreen, setActiveScreen] = useState(0);
  const [visibleChats, setVisibleChats] = useState<number[]>([]);
  const [urlText, setUrlText] = useState('');

  const DEMO_STEPS = [
    { step: '01', title: t('demoStep1title'), sub: t('demoStep1sub'), icon: FaGlobe },
    { step: '02', title: t('demoStep2title'), sub: t('demoStep2sub'), icon: FaUsers },
    { step: '03', title: t('demoStep3title'), sub: t('demoStep3sub'), icon: FaPlay  },
  ];

  const CHAT_MSGS = [
    { u: 'A', msg: t('chatMsg1'), color: '#7B72F8' },
    { u: 'N', msg: t('chatMsg2'), color: '#a855f7' },
    { u: 'B', msg: t('chatMsg3'), color: '#6B63E8' },
  ];

  const SYNC_NAMES = [
    { name: t('syncYou'),          initials: 'S', color: '#7B72F8', pos: 58 },
    { name: t('syncSectionName2'), initials: 'N', color: '#a855f7', pos: 58 },
    { name: t('syncSectionName3'), initials: 'B', color: '#6B63E8', pos: 57 },
  ];

  const SYNC_BULLETS   = [t('syncBullet1'), t('syncBullet2'), t('syncBullet3'), t('syncBullet4'), t('syncBullet5')];
  const BATTLE_BULLETS = [t('battleBullet1'), t('battleBullet2'), t('battleBullet3'), t('battleBullet4')];
  const APP_FEATURES   = [t('appFeat1'), t('appFeat2'), t('appFeat3'), t('appFeat4'), t('appFeat5'), t('appFeat6')];

  // URL typing animation
  useEffect(() => {
    if (shouldReduceMotion) { setUrlText(TYPING_URL); return; }
    let i = 0; let forward = true;
    const id = setInterval(() => {
      if (forward) { i++; setUrlText(TYPING_URL.slice(0, i)); if (i >= TYPING_URL.length) forward = false; }
      else { i--; setUrlText(TYPING_URL.slice(0, i)); if (i <= 0) forward = true; }
    }, 80);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  // Auto-cycle screens — skill §7: interruptible, not blocking
  useEffect(() => {
    const DURATIONS = [3500, 3500, 5000];
    const timeout = setTimeout(() => { setActiveScreen(s => (s + 1) % 3); setVisibleChats([]); }, DURATIONS[activeScreen]);
    return () => clearTimeout(timeout);
  }, [activeScreen]);

  // Progressive chat messages
  useEffect(() => {
    if (activeScreen !== 2) return;
    const timers = CHAT_MSGS.map((_, i) => setTimeout(() => setVisibleChats(p => [...p, i]), i * 900 + 700));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreen]);

  const switchScreen = (i: number) => { setActiveScreen(i); setVisibleChats([]); };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0A0A0F] overflow-x-hidden">
      <NoiseOverlay />
      <LandingNav />
      <main className="flex-1" id="main-content">

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-[#0A0A0F]"
          aria-labelledby="hero-heading">
          <motion.div className="absolute inset-0 pointer-events-none" style={{ y: heroY, opacity: heroOpacity }} aria-hidden="true">
            {/* Mesh gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full blur-[180px]"
              style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)' }} />
            <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full blur-[130px]"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] rounded-full blur-[110px]"
              style={{ background: 'radial-gradient(circle, rgba(107,99,232,0.09) 0%, transparent 70%)' }} />
            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
                  <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* Floating user bubbles */}
            {HERO_BUBBLES.map((b, i) => (
              <motion.div key={i}
                className="absolute hidden md:flex items-center gap-1.5 rounded-full px-3.5 py-2 backdrop-blur-md"
                style={{ top: b.top, ...('left' in b ? { left: b.left } : { right: b.right }), background: `${b.color}14`, border: `1px solid ${b.color}30` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9], y: [0, -8, -8, 0] }}
                transition={{ delay: b.delay, duration: 4.5, repeat: Infinity, repeatDelay: 2.5 }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: b.color }} aria-hidden="true" />
                <span className="text-xs text-white/70 font-medium">{b.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-32 pb-24">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/08 backdrop-blur-md text-sm text-white/80"
              style={{ boxShadow: '0 0 32px rgba(123,114,248,0.22), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
              {t('heroBadge')}
            </motion.div>

            {/* H1 — skill §6: bold display, clear hierarchy */}
            <motion.h1 id="hero-heading" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display uppercase leading-none tracking-tight mb-6 text-white"
              style={{ textShadow: '0 0 120px rgba(123,114,248,0.28)' }}>
              {t('heroTitle1')}<br />
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8 0%, #a855f7 50%, #7B72F8 100%)' }}>
                  {t('heroTitle2')}
                </span>
                <motion.span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" aria-hidden="true"
                  style={{ background: 'linear-gradient(90deg, transparent, #7B72F8, #a855f7, transparent)', opacity: 0.6 }}
                  animate={shouldReduceMotion ? {} : { scaleX: [0, 1] }} transition={{ delay: 0.9, duration: 0.6 }} />
              </span>
            </motion.h1>

            {/* Subtitle — §6: 1.5 line-height, ≤65 chars/line */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55, delay: 0.3 }}
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              {t('heroSub')}
            </motion.p>

            {/* CTA buttons — §1: cursor-pointer, min h-14 (>44px touch target) */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.45 }}
              className="flex gap-4 justify-center flex-wrap">
              <a href={APP_STORE} target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 h-14 px-8 rounded-xl text-white font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 32px rgba(123,114,248,0.55), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                aria-label="WeWatch-ni App Store-dan yuklab oling">
                <FaApple size={22} aria-hidden="true" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-70">Download on the</div>
                  <div className="text-[15px] font-bold">App Store</div>
                </div>
              </a>
              <a href="#demo"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl border border-zinc-700/80 text-zinc-400 hover:border-[#7B72F8]/50 hover:text-zinc-200 hover:bg-[#7B72F8]/05 transition-all duration-200 active:scale-95 text-sm backdrop-blur-sm cursor-pointer"
                aria-label="Посмотреть как работает WeWatch">
                {t('heroHowBtn')}
                <FaChevronRight size={11} aria-hidden="true" />
              </a>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
              className="mt-10 flex items-center justify-center gap-2 text-zinc-600 text-sm">
              <FaGlobe size={12} aria-hidden="true" />
              <span>{t('heroFooter')}</span>
            </motion.p>
          </div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}
              className="w-5 h-8 rounded-full border border-zinc-700/70 flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-zinc-600" />
            </motion.div>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" aria-hidden="true" />
        </section>

        {/* ── STATS ── */}
        <StatsBar />

        {/* ── MARQUEE ── */}
        <Marquee />

        {/* ── URL → WATCH TOGETHER ── */}
        <section className="py-28 px-4 bg-[#0D0D16] relative overflow-hidden" aria-labelledby="url-heading">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.07) 0%, transparent 70%)' }} />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-18">
              <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">{t('urlTag')}</motion.p>
              <motion.h2 variants={fadeUp} id="url-heading" className="text-4xl md:text-6xl font-display uppercase text-white mb-4">{t('urlTitle')}</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500 text-lg max-w-lg mx-auto">{t('urlSub')}</motion.p>
            </motion.div>

            {/* URL → sync visual */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-6 justify-center mb-20">
              <GlassCard className="flex-1 max-w-sm w-full p-4" glowColor="#7B72F8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7B72F8]/15 flex items-center justify-center border border-[#7B72F8]/25 flex-shrink-0">
                    <FaGlobe size={12} className="text-[#7B72F8]" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t('urlInputLabel')}</span>
                </div>
                {/* Browser address bar */}
                <div className="rounded-lg bg-[#0a0a14] border border-zinc-800 px-3 py-2 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-[10px] text-zinc-400 font-mono flex-1 truncate" aria-label={`Открывается: ${urlText}`}>
                    {urlText}<span className="animate-pulse text-[#7B72F8]" aria-hidden="true">|</span>
                  </span>
                </div>
                {/* Site tiles */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { name: 'YouTube', c: '#FF4444' },
                    { name: 'VK',      c: '#2787F5' },
                    { name: 'Rutube',  c: '#E53935' },
                  ].map(({ name, c }) => (
                    <div key={name} className="rounded-lg py-1.5 text-center"
                      style={{ background: `${c}12`, border: `1px solid ${c}25` }}>
                      <span className="text-[8px] font-medium" style={{ color: c }}>{name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 text-center">{t('urlFromSites')}</p>
              </GlassCard>

              <motion.div animate={shouldReduceMotion ? {} : { x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}
                className="text-[#7B72F8]" aria-hidden="true">
                <FaChevronRight size={22} />
              </motion.div>

              <GlassCard className="flex-1 max-w-sm w-full p-4" glowColor="#22c55e">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                  <span className="text-xs text-green-400 font-medium">{t('urlSyncActive')}</span>
                  <span className="ml-auto text-[10px] text-zinc-600">{t('urlPeople')}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2" role="progressbar" aria-label="Прогресс синхронизации">
                  <motion.div className="h-full bg-[#7B72F8] rounded-full"
                    animate={{ width: ['25%', '65%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear', repeatType: 'reverse' }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-600">12:35</span>
                  <span className="text-[10px] text-zinc-600">48:00</span>
                </div>
                <p className="text-xs text-zinc-600 text-center mt-3">{t('urlAllFrame')}</p>
              </GlassCard>
            </motion.div>

            {/* 3 numbered steps */}
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
              <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px" aria-hidden="true"
                style={{ background: 'linear-gradient(90deg, transparent, #7B72F8, #a855f7, #7B72F8, transparent)', opacity: 0.2 }} />
              {[
                { n: '01', icon: FaGlobe, color: '#7B72F8', title: t('urlStep1title'), desc: t('urlStep1desc') },
                { n: '02', icon: FaUsers, color: '#a855f7', title: t('urlStep2title'), desc: t('urlStep2desc') },
                { n: '03', icon: FaHeart, color: '#f43f5e', title: t('urlStep3title'), desc: t('urlStep3desc') },
              ].map(({ n, icon: Icon, color, title, desc }) => (
                <motion.div key={n} variants={fadeUp}>
                  <GlassCard className="p-6 text-center h-full" glowColor={color}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                      style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
                      <Icon size={22} style={{ color }} aria-hidden="true" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: color }} aria-hidden="true">{n}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2 text-sm">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── SYNC ── */}
        <section className="py-28 px-4 bg-[#0A0A0F] relative overflow-hidden" aria-labelledby="sync-heading">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="relative">
              <GlassCard className="p-6" glowColor="#7B72F8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white font-semibold text-sm">{t('syncCardTitle')}</span>
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                    <span className="text-[10px] text-green-400 font-medium">{t('syncCardActive')}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {SYNC_NAMES.map(({ name, initials, color, pos }, i) => (
                    <div key={name}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: `${color}20`, border: `1px solid ${color}45` }}>{initials}</div>
                        <span className="text-sm text-zinc-400">{name}</span>
                        <span className="ml-auto text-xs text-zinc-600">{pos}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden" role="progressbar"
                        aria-label={`${name}: ${pos}%`} aria-valuenow={pos} aria-valuemin={0} aria-valuemax={100}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          whileInView={{ width: `${pos + i * 0.3}%` }} viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
                  <span className="text-xs text-zinc-500">{t('syncCardFooter')}</span>
                </div>
              </GlassCard>
              <div className="absolute -inset-8 bg-[#7B72F8]/05 rounded-3xl blur-3xl -z-10" aria-hidden="true" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.12 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/28 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7B72F8]" aria-hidden="true" /> {t('syncTag')}
              </div>
              <h2 id="sync-heading" className="text-4xl md:text-5xl lg:text-6xl font-display uppercase text-white leading-tight mb-6">
                {t('syncTitle1')}<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}>
                  {t('syncTitle2')}
                </span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('syncDesc')}</p>
              <ul className="space-y-3" aria-label="Возможности синхронизации">
                {SYNC_BULLETS.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-[#7B72F8]/15 border border-[#7B72F8]/30 flex items-center justify-center flex-shrink-0">
                      <FaCheck size={8} className="text-[#7B72F8]" aria-hidden="true" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ── APP DEMO ── */}
        <section id="demo" className="py-32 px-4 bg-[#0D0D16] relative overflow-hidden" aria-labelledby="demo-heading">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px]"
              style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.06) 0%, transparent 70%)' }} />
          </div>
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">{t('appTag')}</motion.p>
              <motion.h2 variants={fadeUp} id="demo-heading" className="text-4xl md:text-6xl font-display uppercase text-white mb-4">{t('appTitle')}</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-500 text-lg max-w-lg mx-auto">{t('appSub')}</motion.p>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Step tabs */}
              <nav className="flex lg:flex-col gap-3 order-2 lg:order-1 lg:w-64 w-full overflow-x-auto pb-2 lg:pb-0"
                aria-label="Шаги демонстрации">
                {DEMO_STEPS.map(({ step, title, sub, icon: Icon }, i) => (
                  <button key={i} onClick={() => switchScreen(i)}
                    aria-pressed={activeScreen === i}
                    aria-label={`Шаг ${step}: ${title}`}
                    className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-250 flex-shrink-0 lg:flex-shrink lg:w-full border cursor-pointer ${
                      activeScreen === i
                        ? 'bg-[#7B72F8]/10 border-[#7B72F8]/40 shadow-[0_0_24px_rgba(123,114,248,0.10)]'
                        : 'bg-[#111118]/60 border-zinc-800/50 hover:border-zinc-700'
                    }`}>
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${activeScreen === i ? '' : 'bg-zinc-800'}`}
                      style={activeScreen === i ? { background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 14px rgba(123,114,248,0.45)' } : {}}>
                      <Icon size={13} className={activeScreen === i ? 'text-white' : 'text-zinc-500'} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold transition-colors ${activeScreen === i ? 'text-[#7B72F8]' : 'text-zinc-600'}`}>{step}</span>
                        <span className={`text-xs font-semibold transition-colors truncate ${activeScreen === i ? 'text-white' : 'text-zinc-400'}`}>{title}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 leading-relaxed">{sub}</p>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Phone mockup */}
              <div className="order-1 lg:order-2 flex-1 flex flex-col items-center gap-8">
                <PhoneMockup t={t} activeScreen={activeScreen} visibleChats={visibleChats} chatMsgs={CHAT_MSGS} />
                {/* Screen dots — §1: aria labels */}
                <div className="flex gap-2.5" role="tablist" aria-label="Переключение экранов">
                  {[0, 1, 2].map(i => (
                    <button key={i} onClick={() => switchScreen(i)} role="tab"
                      aria-selected={activeScreen === i}
                      aria-label={`Экран ${i + 1}: ${DEMO_STEPS[i]?.title}`}
                      className={`rounded-full transition-all duration-250 cursor-pointer ${activeScreen === i ? 'w-8 h-2.5' : 'w-2.5 h-2.5 bg-zinc-700 hover:bg-zinc-500'}`}
                      style={activeScreen === i ? { background: 'linear-gradient(90deg, #7B72F8, #a855f7)', boxShadow: '0 0 10px rgba(123,114,248,0.7)' } : {}} />
                  ))}
                </div>
              </div>

              {/* Feature list */}
              <div className="hidden lg:flex lg:flex-col gap-3 lg:w-64 order-3">
                <GlassCard className="p-5" glowColor="#7B72F8">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-4">{t('appFeatTitle')}</p>
                  <ul className="space-y-0" aria-label="Возможности приложения">
                    {APP_FEATURES.map(f => (
                      <li key={f} className="flex items-center gap-2.5 py-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#7B72F8]/12 flex items-center justify-center flex-shrink-0">
                          <FaCheck size={7} className="text-[#7B72F8]" aria-hidden="true" />
                        </div>
                        <span className="text-[11px] text-zinc-400">{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── BENTO FEATURES ── */}
        <BentoFeatures t={t} />

        {/* ── WHY WEWATCH ── */}
        <WhyWeWatch />

        {/* ── BATTLE ── */}
        <section className="py-28 px-4 bg-[#0A0A0F] relative overflow-hidden" aria-labelledby="battle-heading">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="relative">
              <GlassCard className="p-10 flex flex-col items-center justify-center text-center min-h-[280px]" glowColor="#FFD700">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.28)' }}>
                  <GiCrossedSwords size={28} className="text-[#FFD700]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl uppercase text-[#FFD700] mb-3">{t('battleCardTitle')}</h3>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-5">
                  {t('comingSoon')}
                </span>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{t('battleDesc')}</p>
              </GlassCard>
              <div className="absolute -inset-8 bg-[#FFD700]/04 rounded-3xl blur-3xl -z-10" aria-hidden="true" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.12 }}>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/28 text-[#FFD700] text-xs font-semibold uppercase tracking-widest">
                  <FaFire size={10} aria-hidden="true" /> {t('battleSectionTag')}
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  {t('comingSoon')}
                </span>
              </div>
              <h2 id="battle-heading" className="text-4xl md:text-5xl lg:text-6xl font-display uppercase text-white leading-tight mb-6">
                {t('battleTitle1')}<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FFD700, #FFA500)' }}>
                  {t('battleTitle2')}
                </span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{t('battleDesc')}</p>
              <ul className="space-y-3" aria-label="Особенности режима Battle">
                {BATTLE_BULLETS.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-[#FFD700]/12 border border-[#FFD700]/28 flex items-center justify-center flex-shrink-0">
                      <FaCheck size={8} className="text-[#FFD700]" aria-hidden="true" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 px-4 text-center relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-[#0A0A0F]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-[150px]"
              style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.22) 0%, rgba(168,85,247,0.12) 40%, transparent 70%)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[80px]"
              style={{ background: 'radial-gradient(ellipse, rgba(107,99,232,0.28) 0%, transparent 70%)' }} />
          </div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative z-10 max-w-3xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#7B72F8]/12 border border-[#7B72F8]/35 text-[#7B72F8] text-xs font-semibold uppercase tracking-widest mb-8"
              style={{ boxShadow: '0 0 24px rgba(123,114,248,0.28)' }}>
              <FaPlay size={8} aria-hidden="true" /> WeWatch
            </motion.div>

            <motion.h2 variants={fadeUp} id="cta-heading"
              className="text-4xl md:text-6xl lg:text-7xl font-display uppercase text-white leading-tight mb-6"
              style={{ textShadow: '0 0 100px rgba(123,114,248,0.5)' }}>
              {t('ctaTitle1')}<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8 0%, #a855f7 50%, #7B72F8 100%)' }}>
                {t('ctaTitle2')}
              </span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-zinc-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
              {t('ctaDesc')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href={APP_STORE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 h-16 px-12 rounded-xl text-white font-bold transition-all duration-200 active:scale-95 text-base cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 50px rgba(123,114,248,0.65), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                aria-label="WeWatch-ni App Store-dan bepul yuklab oling">
                <FaApple size={24} aria-hidden="true" />
                {t('ctaPlayBtn')}
              </a>
              <span className="text-zinc-600 text-sm">{t('ctaIosSoon')}</span>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-10 text-zinc-600 text-sm">
              {t('ctaFooter')}
            </motion.p>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
