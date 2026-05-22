'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import {
  FaPlay, FaUsers, FaTrophy, FaFire, FaComment,
  FaChevronRight, FaCheck, FaLink, FaHeart, FaUserFriends, FaStar,
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

const PLAY_STORE  = 'https://play.google.com/store';
const TYPING_URL  = 'youtube.com/watch?v=dQw4w9Wgxcw';

const BATTLE_USERS = [
  { rank: 1, name: 'Sardor_90', videos: 48, initials: 'S', color: '#FFD700', bg: 'rgba(255,215,0,0.12)' },
  { rank: 2, name: 'Zulfiya_N', videos: 41, initials: 'Z', color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)' },
  { rank: 3, name: 'Bobur_K',   videos: 37, initials: 'B', color: '#CD7F32', bg: 'rgba(205,127,50,0.12)' },
];

const HERO_BUBBLES = [
  { top: '28%', left: '7%',  label: 'Sardor',  color: '#7B72F8', delay: 0   },
  { top: '62%', left: '5%',  label: 'Nilufar', color: '#a855f7', delay: 0.5 },
  { top: '22%', right: '7%', label: 'Bobur',   color: '#22d3ee', delay: 1   },
  { top: '65%', right: '5%', label: 'Akbar',   color: '#f43f5e', delay: 1.5 },
] as const;

const MARQUEE_ITEMS = [
  'YouTube', 'Twitch', 'Netflix', 'Vimeo', 'Dailymotion',
  'TikTok', 'Rutube', 'Kinogo', 'Rezka', 'Filmix',
  'YouTube', 'Twitch', 'Netflix', 'Vimeo', 'Dailymotion',
  'TikTok', 'Rutube', 'Kinogo', 'Rezka', 'Filmix',
];

const STATS = [
  { value: '50K+',  label: 'Пользователей' },
  { value: '2M+',   label: 'Часов вместе'  },
  { value: '99.9%', label: 'Синхронность'  },
  { value: '150+',  label: 'Платформ'      },
];

const TESTIMONIALS = [
  { name: 'Sardor M.', location: 'Tashkent', text: 'WeWatch изменил как я смотрю с друзьями за рубежом. Синхронизация идеальная!', rating: 5, color: '#7B72F8', initials: 'S' },
  { name: 'Nilufar K.', location: 'Moscow',  text: 'Battle Mode — это что-то! Уже на золотом ранге. Конкуренция реальная.', rating: 5, color: '#a855f7', initials: 'N' },
  { name: 'Bobur A.',   location: 'Istanbul', text: 'Ни одного кадра рассинхрона. Наконец-то смотрим кино всей семьёй онлайн.', rating: 5, color: '#22d3ee', initials: 'B' },
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

          {/* [2] Battle (1 col × 1 row) */}
          <motion.div variants={fadeUp}>
            <GlassCard className="h-full p-6" glowColor="#FFD700">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <GiCrossedSwords size={20} className="text-[#FFD700]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f2title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f2desc')}</p>
            </GlassCard>
          </motion.div>

          {/* [3] Leaderboard (1 col × 1 row) */}
          <motion.div variants={fadeUp}>
            <GlassCard className="h-full p-6" glowColor="#88CCFF">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(136,204,255,0.10)', border: '1px solid rgba(136,204,255,0.22)' }}>
                <FaTrophy size={18} className="text-[#88CCFF]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f3title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f3desc')}</p>
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

// ── Testimonials ─────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="py-20 px-4 bg-[#0D0D16] relative overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">Отзывы</motion.p>
          <motion.h2 variants={fadeUp} id="testimonials-heading" className="text-3xl md:text-4xl font-display uppercase text-white">
            Что говорят пользователи
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, location, text, rating, color, initials }) => (
            <motion.div key={name} variants={fadeUp}>
              <GlassCard className="p-6 h-full flex flex-col gap-4" glowColor={color}>
                <div className="flex gap-1" aria-label={`Оценка: ${rating} из 5`} role="img">
                  {[...Array(rating)].map((_, i) => (
                    <FaStar key={i} size={13} className="text-[#FFD700]" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-zinc-300 text-sm leading-relaxed flex-1">
                  &ldquo;{text}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/50">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: color }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{name}</p>
                    <p className="text-zinc-600 text-xs">{location}</p>
                  </div>
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
      <div className="flex justify-between items-center px-5 pt-2.5">
        <span className="text-[8px] text-white/50 font-medium">9:41</span>
        <div className="w-4 h-1.5 rounded-sm bg-white/40 border border-white/10" />
      </div>
      <div className="flex items-center justify-between px-4 pt-1.5 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#7B72F8] flex items-center justify-center shadow-[0_0_8px_rgba(123,114,248,0.6)]">
            <FaPlay size={6} className="text-white ml-0.5" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wide">WeWatch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-[8px] text-green-400">2 {t('screenOnline')}</span>
        </div>
      </div>
      <div className="mx-3 rounded-xl bg-[#111118] border border-[#7B72F8]/30 px-3 py-2.5 flex items-center gap-2">
        <FaLink size={9} className="text-[#7B72F8] flex-shrink-0" aria-hidden="true" />
        <motion.span className="text-[9px] text-zinc-500 flex-1 truncate font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.5 }}>
          {t('screenUrlHint')}
        </motion.span>
      </div>
      <div className="flex-1 px-3 pt-3 overflow-hidden">
        <p className="text-[7px] text-zinc-600 uppercase tracking-widest mb-2">{t('screenActiveRooms')}</p>
        <div className="space-y-2">
          {[
            { name: 'Sardor + 2', status: t('screenWatching'), color: '#7B72F8', initials: 'S' },
            { name: 'Nilufar + 1', status: t('screenWaiting'), color: '#a855f7', initials: 'N' },
          ].map((room, i) => (
            <motion.div key={room.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2.5 rounded-lg bg-[#111118] border border-zinc-800/60 px-3 py-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: `${room.color}30`, border: `1px solid ${room.color}40` }}>{room.initials}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-white font-medium truncate">{room.name}</p>
                <p className="text-[8px] text-zinc-500">{room.status}</p>
              </div>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" aria-hidden="true" />
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div className="mx-3 mb-5 rounded-xl p-3 flex items-center gap-2.5"
        style={{ background: 'linear-gradient(135deg, #7B72F8, #5B4FD8)' }}
        animate={{ boxShadow: ['0 0 10px rgba(123,114,248,0.35)', '0 0 24px rgba(123,114,248,0.65)', '0 0 10px rgba(123,114,248,0.35)'] }}
        transition={{ repeat: Infinity, duration: 2.5 }}>
        <FaUsers size={11} className="text-white flex-shrink-0" aria-hidden="true" />
        <span className="text-white text-[10px] font-semibold">{t('screenCreateParty')}</span>
        <FaChevronRight size={8} className="text-white/60 ml-auto" aria-hidden="true" />
      </motion.div>
    </div>
  );
}

function ScreenRoom({ t }: { t: TFn }) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-zinc-800/50">
        <span className="text-zinc-600 text-xs" aria-hidden="true">←</span>
        <span className="text-[11px] font-semibold text-white">{t('screenWPLabel')}</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-[8px] text-green-400">{t('screenReady')}</span>
        </div>
      </div>
      <div className="mx-3 mt-3 rounded-xl overflow-hidden border border-[#7B72F8]/20 flex flex-col justify-center gap-2 px-3 py-3"
        style={{ background: 'linear-gradient(135deg, #0d0520, #1a0a2e)' }}>
        <div className="flex items-center gap-2">
          <FaLink size={8} className="text-[#7B72F8] flex-shrink-0" aria-hidden="true" />
          <span className="text-[8px] text-zinc-400 font-mono truncate flex-1">youtube.com/watch?v=dQw...</span>
          <div className="w-5 h-5 rounded-full bg-[#7B72F8]/20 flex items-center justify-center border border-[#7B72F8]/40 flex-shrink-0">
            <FaPlay size={5} className="text-[#7B72F8] ml-0.5" aria-hidden="true" />
          </div>
        </div>
        <div className="h-0.5 bg-zinc-800 rounded-full" />
        <div className="h-1 bg-zinc-800/80 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-[#7B72F8]/40 rounded-full" />
        </div>
      </div>
      <div className="px-3 mt-3">
        <p className="text-[7px] text-zinc-600 uppercase tracking-widest mb-2">{t('screenParticipants')}</p>
        <div className="flex gap-2 items-center">
          {[['A', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8']].map(([l, c], i) => (
            <motion.div key={String(l)} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.12 + 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2"
                style={{ background: `${String(c)}25`, borderColor: String(c) }}>{String(l)}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
            </motion.div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">+</div>
          </div>
        </div>
      </div>
      <div className="mx-3 mt-3 rounded-lg bg-[#111118] border border-zinc-800 px-3 py-2 flex items-center gap-2">
        <span className="text-[8px] text-zinc-500 flex-1 truncate">wewatch.app/join/xK9pQr</span>
        <span className="text-[8px] text-[#7B72F8] font-semibold flex-shrink-0">{t('screenCopy')}</span>
      </div>
      <motion.div className="mx-3 mt-auto mb-5 rounded-xl py-3 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #7B72F8, #5B4FD8)' }}
        animate={{ scale: [1, 1.018, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
        <FaPlay size={9} className="text-white" aria-hidden="true" />
        <span className="text-white text-[11px] font-bold">{t('screenStartBtn')}</span>
      </motion.div>
    </div>
  );
}

function ScreenWatching({ t, chatMsgs, visibleChats }: { t: TFn; chatMsgs: { u: string; msg: string; color: string }[]; visibleChats: number[] }) {
  return (
    <div className="h-full flex flex-col bg-[#0A0A0F] select-none">
      <div className="relative flex-shrink-0"
        style={{ height: '44%', background: 'radial-gradient(ellipse at 40% 35%, #2d1060, #0d0520 55%, #060010)' }}>
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
            <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span className="text-[7px] text-white/70">{t('screenSyncLabel')}</span>
          </div>
          <div className="flex -space-x-1">
            {['A', 'N', 'B'].map((l, i) => (
              <div key={l} className="w-5 h-5 rounded-full border border-[#0A0A0F] flex items-center justify-center text-[7px] font-bold text-white"
                style={{ background: ['#7B72F8', '#a855f7', '#6B63E8'][i] }}>{l}</div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <FaPlay size={10} className="text-white ml-0.5" aria-hidden="true" />
          </div>
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <div className="h-0.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#7B72F8] rounded-full" initial={{ width: '28%' }} animate={{ width: '60%' }} transition={{ duration: 10, ease: 'linear' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] text-white/40">12:35</span>
            <span className="text-[7px] text-white/40">48:00</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-2 pb-1.5 border-b border-zinc-800/50 flex items-center gap-1.5">
          <FaComment size={8} className="text-zinc-600" aria-hidden="true" />
          <span className="text-[8px] text-zinc-500">{t('screenRealtimeChat')}</span>
          <span className="ml-auto text-[7px] text-zinc-700">3 {t('screenPeopleOnline')}</span>
        </div>
        <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
          {chatMsgs.map((msg, i) => (
            <AnimatePresence key={i}>
              {visibleChats.includes(i) && (
                <motion.div initial={{ opacity: 0, x: -10, y: 4 }} animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }} className="flex items-start gap-1.5">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: msg.color }}>{msg.u}</div>
                  <div className="rounded-lg px-2 py-1 bg-[#111118] border border-zinc-800/60 max-w-[80%]">
                    <span className="text-[9px] text-zinc-300">{msg.msg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        <div className="mx-3 mb-4 rounded-lg bg-[#111118] border border-zinc-800 px-3 py-2">
          <span className="text-[8px] text-zinc-600">{t('screenChatHint')}</span>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ t, activeScreen, visibleChats, chatMsgs }: {
  t: TFn; activeScreen: number; visibleChats: number[]; chatMsgs: { u: string; msg: string; color: string }[];
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div className="relative mx-auto" style={{ width: 240 }} aria-label="Демонстрация приложения WeWatch"
      initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.65 }}>
      <div className="absolute -inset-16 bg-[#7B72F8]/10 rounded-full blur-3xl -z-10 pointer-events-none" aria-hidden="true" />
      <motion.div animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
        <div className="relative overflow-hidden"
          style={{ borderRadius: 38, border: '1.5px solid rgba(123,114,248,0.25)', background: '#0A0A0F',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 50px 100px rgba(0,0,0,0.9), 0 0 80px rgba(123,114,248,0.18)', height: 504 }}>
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20" style={{ width: 76, height: 10, borderRadius: 6, background: '#000' }} aria-hidden="true" />
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 36 }}>
            <AnimatePresence mode="wait">
              {activeScreen === 0 && (<motion.div key="home" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenHome t={t} /></motion.div>)}
              {activeScreen === 1 && (<motion.div key="room"  className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenRoom t={t} /></motion.div>)}
              {activeScreen === 2 && (<motion.div key="watch" className="absolute inset-0" variants={screenVariants} initial="enter" animate="center" exit="exit"><ScreenWatching t={t} chatMsgs={chatMsgs} visibleChats={visibleChats} /></motion.div>)}
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)', borderRadius: 36 }} aria-hidden="true" />
        </div>
        <div className="absolute right-0 top-36 w-0.5 h-14 rounded-l-sm" aria-hidden="true"
          style={{ background: 'rgba(255,255,255,0.07)', transform: 'translateX(1px)' }} />
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
    { step: '01', title: t('demoStep1title'), sub: t('demoStep1sub'), icon: FaLink  },
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
  const APP_FEATURES   = [t('appFeat1'), t('appFeat2'), t('appFeat3'), t('appFeat4'), t('appFeat5')];

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
              <a href={PLAY_STORE} target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 h-14 px-8 rounded-xl text-white font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 32px rgba(123,114,248,0.55), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                aria-label="Скачать WeWatch в Google Play">
                <svg viewBox="0 0 22 24" width="20" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M1.22 0c-.55.3-.93.87-.93 1.55v20.9c0 .68.38 1.25.93 1.55l.1.06L12.36 12 1.32-.06 1.22 0zM15.75 8.67L4.17 1.38l9.7 9.7-1.12.96 2.99 1.72V8.67zM15.75 15.33v-3.1l-2.99 1.73 1.12.95-9.7 9.71 11.57-7.3.01-.99zM4.17 22.62l11.57-7.29v1.1L4.17 22.62z" />
                </svg>
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-70">Get it on</div>
                  <div className="text-[15px] font-bold">Google Play</div>
                </div>
              </a>
              <a href="#demo"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl border border-zinc-700/80 text-zinc-400 hover:border-[#7B72F8]/50 hover:text-zinc-200 hover:bg-[#7B72F8]/05 transition-all duration-200 active:scale-95 text-sm backdrop-blur-sm cursor-pointer"
                aria-label="Посмотреть как работает WeWatch">
                {t('heroHowBtn')}
                <FaChevronRight size={11} aria-hidden="true" />
              </a>
            </motion.div>

            {/* Social proof — §6: numbers for credibility */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
              className="mt-10 flex items-center justify-center gap-1.5 text-zinc-500 text-sm">
              <span className="flex gap-0.5" aria-label="Оценка 5 из 5" role="img">
                {[...Array(5)].map((_, i) => <FaStar key={i} size={12} className="text-[#FFD700]" aria-hidden="true" />)}
              </span>
              <span className="ml-1">50 000+ пользователей</span>
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7B72F8]/15 flex items-center justify-center border border-[#7B72F8]/25 flex-shrink-0">
                    <FaLink size={12} className="text-[#7B72F8]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">{t('urlInputLabel')}</div>
                    <span className="text-sm text-zinc-300 font-mono" aria-label={`Пример URL: ${urlText}`}>
                      {urlText}<span className="animate-pulse text-[#7B72F8]" aria-hidden="true">|</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 text-center mt-3">{t('urlFromSites')}</p>
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
                { n: '01', icon: FaLink,  color: '#7B72F8', title: t('urlStep1title'), desc: t('urlStep1desc') },
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
                <GlassCard className="p-5" glowColor="#FFD700">
                  <div className="flex items-center gap-2 mb-2.5">
                    <GiCrossedSwords size={13} className="text-[#FFD700]" aria-hidden="true" />
                    <span className="text-[10px] text-[#FFD700] font-bold uppercase tracking-wide">{t('appBattleTag')}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{t('appBattleDesc')}</p>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* ── BENTO FEATURES ── */}
        <BentoFeatures t={t} />

        {/* ── TESTIMONIALS ── */}
        <Testimonials />

        {/* ── BATTLE ── */}
        <section className="py-28 px-4 bg-[#0A0A0F] relative overflow-hidden" aria-labelledby="battle-heading">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }} className="relative">
              <GlassCard className="p-6" glowColor="#FFD700">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#FFD700] font-display uppercase text-sm flex items-center gap-2">
                    <GiCrossedSwords size={16} aria-hidden="true" /> {t('battleCardTitle')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#7B72F8]/10 border border-[#7B72F8]/22 text-[#7B72F8] text-xs font-semibold">{t('battleDaysLeft')}</span>
                </div>
                <ol className="space-y-1" aria-label="Топ участников">
                  {BATTLE_USERS.map(({ rank, name, videos, initials, color, bg }) => (
                    <li key={rank} className="flex items-center gap-3 py-3 border-b border-zinc-800/50 last:border-0">
                      <span className="font-display text-xl w-8 flex-shrink-0" style={{ color }} aria-label={`Место ${rank}`}>{rank}</span>
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border"
                        style={{ backgroundColor: bg, color, borderColor: `${color}30` }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{videos} {t('battleVideosWatched')}</p>
                      </div>
                      <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0"
                        role="progressbar" aria-valuenow={videos} aria-valuemax={48} aria-label={`${videos} видео`}>
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          whileInView={{ width: `${(videos / 48) * 100}%` }} viewport={{ once: true }}
                          transition={{ duration: 1, delay: rank * 0.15, ease: 'easeOut' }}
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">{t('battleYourPos')}</span>
                  <span className="text-zinc-400 text-sm font-medium">{t('battleChallenge')}</span>
                </div>
              </GlassCard>
              <div className="absolute -inset-8 bg-[#FFD700]/04 rounded-3xl blur-3xl -z-10" aria-hidden="true" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.12 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/28 text-[#FFD700] text-xs font-semibold uppercase tracking-widest mb-6">
                <FaFire size={10} aria-hidden="true" /> {t('battleSectionTag')}
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
              <a href={PLAY_STORE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 h-16 px-12 rounded-xl text-white font-bold transition-all duration-200 active:scale-95 text-base cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 50px rgba(123,114,248,0.65), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                aria-label="Скачать WeWatch бесплатно в Google Play">
                <svg viewBox="0 0 22 24" width="22" height="24" fill="currentColor" aria-hidden="true">
                  <path d="M1.22 0c-.55.3-.93.87-.93 1.55v20.9c0 .68.38 1.25.93 1.55l.1.06L12.36 12 1.32-.06 1.22 0zM15.75 8.67L4.17 1.38l9.7 9.7-1.12.96 2.99 1.72V8.67zM15.75 15.33v-3.1l-2.99 1.73 1.12.95-9.7 9.71 11.57-7.3.01-.99zM4.17 22.62l11.57-7.29v1.1L4.17 22.62z" />
                </svg>
                {t('ctaPlayBtn')}
              </a>
              <span className="text-zinc-600 text-sm">{t('ctaIosSoon')}</span>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-10 flex items-center justify-center gap-1.5 text-zinc-500 text-sm">
              <span className="flex gap-0.5" aria-label="Оценка 5 из 5 звёзд" role="img">
                {[...Array(5)].map((_, i) => <FaStar key={i} size={14} className="text-[#FFD700]" aria-hidden="true" />)}
              </span>
              <span className="ml-1">50 000+ пользователей по всему миру</span>
            </motion.p>
          </motion.div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
