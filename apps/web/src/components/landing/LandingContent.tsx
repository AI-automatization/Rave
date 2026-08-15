'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from './MotionLite';
import {
  FaPlay, FaUsers, FaComment, FaMobileAlt,
  FaChevronRight, FaCheck, FaLink, FaHeart, FaUserFriends, FaGlobe, FaShieldAlt,
  FaFilm, FaTv, FaArrowRight,
} from 'react-icons/fa';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { StatsWidget } from '@/components/common/StatsWidget';
import { LONG_DISTANCE, ONLINE_DATE } from '@/data/use-cases';
import { WIcon, BRAND_PURPLE } from '@/components/common/WeWatchLogo';

const NewsletterSectionIsland = dynamic(() => import('./NewsletterSection').then(module => module.NewsletterSection));
const FAQAccordionIsland = dynamic(() => import('./FAQAccordion').then(module => module.FAQAccordion));
const WaitlistForm = dynamic(() => import('./WaitlistForm').then(module => module.WaitlistForm));

// ── Motion config ─────────────────────────────────────────────────────────────
// Spring physics — natural feel (skill §spring-physics)
const springConfig = { type: 'spring' as const, stiffness: 280, damping: 24 };

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ...springConfig, stiffness: 200 } },
};
const fadeUpScale: Variants = {
  hidden:  { opacity: 0, y: 28, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springConfig },
};
const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.06 } },
};
const screenVariants: Variants = {
  enter:  { opacity: 0, y: 12, scale: 0.98 },
  center: { opacity: 1, y: 0, scale: 1, transition: { ...springConfig, stiffness: 320 } },
  exit:   { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
};

const TYPING_URL  = 'youtube.com';

// Hero preview — real thumbnails that cycle inside the mini watch-party card.
// `cat` is a translation key, not a label: the category chips used to render
// Russian ("Кино", "Клип", "VK Видео") on /uz and /en as well. Platform names
// stay literal because they are proper nouns in every language.
const HERO_MOVIES = [
  { cat: 'catMovie',   meta: '4K', bg: '#1a1230', img: 'https://beam-images.warnermediacdn.com/BEAM_LWM_DELIVERABLES/aa5b9295-8f9c-44f5-809b-3f2b84badfbf/8a7dd34b09c9c25336a3d850d4c431455e1aaaf0.jpg?host=wbd-images.prod-vod.h264.io&partner=beamcom&w=500' },
  { cat: 'YouTube',    meta: 'HD', bg: '#2a1020', img: 'https://i.ytimg.com/vi/yGcXBa9lUco/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAj71HTI9a9MYcxHumJjckddZqMpA' },
  { cat: 'YouTube',    meta: '4K', bg: '#102a38', img: 'https://i.ytimg.com/vi/BXX6vH4kr7Q/maxresdefault.jpg' },
  { cat: 'catClip',    meta: 'HD', bg: '#301a40', img: 'https://i.ytimg.com/vi/xjrsvzKKYSg/maxresdefault.jpg' },
  { cat: 'catVkVideo', meta: 'HD', bg: '#14301f', img: 'https://sun9-50.userapi.com/impg/okCxVqdOOAzS8koDhTbej4dU46CTdWEnWGexHg/ZY8YieXzMNg.jpg?size=1152x648&quality=95&sign=96c3734375874b3e64eca8077a807080&type=video_thumb' },
] as const;

/** Category chip label: a `landing` key when translatable, else the name itself. */
const CATEGORY_KEYS = new Set(['catMovie', 'catClip', 'catVkVideo']);


// ── Noise overlay (static, не перерисовывается) ────────────────────────────
// ── Marquee ────────────────────────────────────────────────────────────────
function MarqueeItem({ name, color }: { name: string; color: string }) {
  return (
    <motion.div
      className="group relative flex items-center gap-3 px-6 py-2.5 rounded-xl cursor-default flex-shrink-0 transition-colors duration-300"
      style={{ background: 'transparent' }}
      whileHover={{
        background: `${color}12`,
        scale: 1.08,
        y: -2,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      {/* Glow dot */}
      <motion.span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        whileHover={{ scale: 1.5, boxShadow: `0 0 14px ${color}` }}
        aria-hidden="true"
      />
      {/* Platform name */}
      <span
        className="text-sm font-semibold tracking-wide transition-colors duration-300 group-hover:text-white"
        style={{ color: 'rgba(212,212,216,0.82)' }}
      >
        {name}
      </span>
      {/* Hover underline */}
      <motion.div
        className="absolute bottom-1 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

function Marquee() {
  const items = [
    { name: 'YouTube', color: '#FF4444' },
    { name: 'VK', color: '#2787F5' },
    { name: 'Rutube', color: '#E53935' },
    { name: 'MP4', color: '#22d3ee' },
  ];

  const renderSet = () =>
    items.map((item, i) => <MarqueeItem key={i} name={item.name} color={item.color} />);

  return (
    <div className="relative overflow-hidden py-6 border-y border-zinc-800/40 bg-[#0D0D16]/80 backdrop-blur-sm" role="marquee" aria-label="Поддерживаемые платформы">
      {/* Edge fade gradients */}
      <div className="absolute left-0 top-0 h-full w-24 z-10 bg-gradient-to-r from-[#0D0D16] to-transparent pointer-events-none" aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-24 z-10 bg-gradient-to-l from-[#0D0D16] to-transparent pointer-events-none" aria-hidden="true" />
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #7B72F8, transparent)' }} aria-hidden="true" />

      {/* CSS animation marquee — two identical tracks side by side */}
      <div className="flex w-max animate-marquee-scroll" aria-hidden="true">
        {/* Track 1 */}
        <div className="flex gap-2 pr-2">
          {renderSet()}
          {renderSet()}
          {renderSet()}
        </div>
        {/* Track 2 — identical copy for seamless loop */}
        <div className="flex gap-2 pr-2">
          {renderSet()}
          {renderSet()}
          {renderSet()}
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ────────────────────────────────────────────────────────────
function StatsBar({ t, statsLabel }: { t: TFn; statsLabel: string }) {
  const STATS = [
    { value: '∞',   label: t('statsLabel1') },
    { value: '4K',  label: t('statsLabel2') },
    { value: '±2s', label: t('statsLabel3') },
    { value: 'counter', label: t('statsLabel4') },
  ];
  return (
    <section className="py-14 px-4 relative overflow-hidden" aria-label={statsLabel}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-[#0D0D1A] to-[#0A0A0F]" aria-hidden="true" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div role="list" className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800/30 rounded-2xl overflow-hidden border border-zinc-800/50 shadow-[0_0_60px_rgba(123,114,248,0.06)]">
          {STATS.map(({ value, label }, i) => (
            <motion.div key={label} role="listitem" initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }} transition={{ ...springConfig, delay: i * 0.06 }}
              className="flex flex-col items-center justify-center py-10 px-6 bg-[#0D0D16]/90 relative group cursor-default hover:bg-[#7B72F8]/[0.04] transition-colors duration-300">
              {/* Top glow line on hover */}
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(90deg, transparent, #7B72F8, transparent)' }} aria-hidden="true" />
              {/* Radial glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 30%, rgba(123,114,248,0.12) 0%, transparent 60%)' }} aria-hidden="true" />
              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-[20%] right-[20%] h-12 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-[25px] pointer-events-none bg-[#7B72F8]" aria-hidden="true" />
              <motion.span className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent mb-1 relative"
                style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.15, textShadow: '0 0 30px rgba(123,114,248,0.6)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                {value === 'counter' ? '150+' : value}
              </motion.span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium group-hover:text-zinc-400 group-hover:tracking-[0.2em] transition-all duration-300">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GlassCard with mouse-tracking glow ──────────────────────────────────
function GlassCard({ children, className = '', glowColor = '#7B72F8', hover = true }: {
  children: React.ReactNode; className?: string; glowColor?: string; hover?: boolean;
}) {
  return (
    <motion.div
      className={`relative rounded-2xl border border-zinc-800/60 backdrop-blur-sm overflow-hidden group transition-colors duration-300 hover:border-zinc-700/80 ${className}`}
      style={{ background: 'linear-gradient(145deg, rgba(17,17,24,0.96), rgba(13,13,22,0.99))' }}
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      {/* Dynamic glow following cursor */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(400px circle at 50% 0%, ${glowColor}14 0%, transparent 65%)` }} aria-hidden="true" />
      <div className="absolute top-0 left-0 right-0 h-px opacity-35"
        style={{ background: `linear-gradient(90deg, transparent, ${glowColor}55, transparent)` }} aria-hidden="true" />
      {/* Bottom shine on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-25 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${glowColor}44, transparent)` }} aria-hidden="true" />
      {children}
    </motion.div>
  );
}

// ── Bento Features Grid ───────────────────────────────────────────────────
function BentoFeatures({ t }: { t: TFn }) {
  return (
    <section className="py-24 px-4 bg-page relative overflow-hidden" aria-labelledby="features-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.05) 0%, transparent 70%)' }} />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.h2 variants={fadeUp} id="features-heading" className="text-4xl md:text-5xl font-display uppercase mb-3 text-white">
            {t('featTitle')}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-400 max-w-md mx-auto">{t('featSub')}</motion.p>
        </motion.div>

        {/* Bento Grid — Priority 4 (style: bento grid for entertainment SaaS) */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">

          {/* [1] Large — Watch Together (2 cols × 2 rows) */}
          <motion.div variants={fadeUpScale} className="md:col-span-2 md:row-span-2" whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
            <GlassCard className="h-full p-8 flex flex-col justify-between" glowColor="#7B72F8">
              <div className="relative">
                <motion.div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative"
                  style={{ background: 'rgba(123,114,248,0.14)', border: '1px solid rgba(123,114,248,0.28)' }}
                  whileHover={{ scale: 1.12, rotate: 5, boxShadow: '0 0 24px rgba(123,114,248,0.4)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  <FaUsers size={24} className="text-[#7B72F8]" aria-hidden="true" />
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: '0 0 0 3px rgba(123,114,248,0.15), 0 0 0 7px rgba(123,114,248,0.06)' }} />
                </motion.div>
                <h3 className="font-display text-2xl uppercase text-white mb-3">{t('f1title')}</h3>
                <p className="text-zinc-400 leading-relaxed max-w-sm">{t('f1desc')}</p>
                {/* Floating connection lines */}
                <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                  <motion.div
                    className="w-16 h-16"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
                    <svg viewBox="0 0 64 64" fill="none">
                      <circle cx="12" cy="12" r="3" fill="#7B72F8" />
                      <circle cx="52" cy="12" r="3" fill="#a855f7" />
                      <circle cx="32" cy="52" r="3" fill="#6B63E8" />
                      <line x1="12" y1="12" x2="52" y2="12" stroke="#7B72F8" strokeWidth="0.5" strokeDasharray="4 2" />
                      <line x1="52" y1="12" x2="32" y2="52" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="4 2" />
                      <line x1="32" y1="52" x2="12" y2="12" stroke="#6B63E8" strokeWidth="0.5" strokeDasharray="4 2" />
                    </svg>
                  </motion.div>
                </div>
              </div>
              {/* Animated sync visual */}
              <div className="flex gap-3 mt-6">
                {[['S', '#7B72F8', 58], ['N', '#a855f7', 58], ['B', '#6B63E8', 57]].map(([l, c, p], i) => (
                  <motion.div key={String(l)} className="flex-1"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 22 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: `${String(c)}25`, border: `1.5px solid ${String(c)}55`, boxShadow: `0 0 12px ${String(c)}30` }}
                        animate={{ scale: [1, 1.1, 1], boxShadow: [`0 0 8px ${String(c)}20`, `0 0 16px ${String(c)}50`, `0 0 8px ${String(c)}20`] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}>
                        {String(l)}
                      </motion.div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-medium">{String(p)}%</span>
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                        whileInView={{ width: `${Number(p) + i}%` }} viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${String(c)}, ${String(c)}cc)`, boxShadow: `0 0 8px ${String(c)}60` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* [2] Real-time Chat (1 col × 1 row) */}
          <motion.div variants={fadeUpScale} whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
            <GlassCard className="h-full p-6 relative overflow-hidden" glowColor="#22d3ee">
              <motion.div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative"
                style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.22)' }}
                whileHover={{ scale: 1.12, rotate: -5, boxShadow: '0 0 20px rgba(34,211,238,0.35)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <FaComment size={18} className="text-[#22d3ee]" aria-hidden="true" />
              </motion.div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f5title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f5desc')}</p>
              {/* Floating chat dots */}
              <div className="absolute bottom-3 right-3 flex gap-1 opacity-20 group-hover:opacity-50 transition-opacity duration-500" aria-hidden="true">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]"
                  animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]"
                  animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]"
                  animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
              </div>
            </GlassCard>
          </motion.div>

          {/* [3] Supported video sources (1 col × 1 row) */}
          <motion.div variants={fadeUpScale} whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
            <GlassCard className="h-full p-6 relative overflow-hidden" glowColor="#7B72F8">
              <motion.div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 relative"
                style={{ background: 'rgba(123,114,248,0.14)', border: '1px solid rgba(123,114,248,0.28)' }}
                whileHover={{ scale: 1.12, boxShadow: '0 0 20px rgba(123,114,248,0.35)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <FaGlobe size={18} className="text-[#7B72F8]" aria-hidden="true" />
              </motion.div>
              <h3 className="font-display text-lg uppercase text-white mb-1.5">{t('f6title')}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{t('f6desc')}</p>
              {/* Orbiting dot */}
              <div className="absolute bottom-4 right-4 w-8 h-8 opacity-15 group-hover:opacity-40 transition-opacity duration-500" aria-hidden="true">
                <motion.div className="w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>
                  <div className="w-2 h-2 rounded-full bg-[#7B72F8] absolute top-0 left-1/2 -translate-x-1/2" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>

          {/* [4] Friends — wide bottom (3 cols × 1 row) */}
          <motion.div variants={fadeUpScale} className="md:col-span-3" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
            <GlassCard className="h-full p-6 flex flex-col md:flex-row items-center gap-6" glowColor="#a855f7">
              <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
                whileHover={{ scale: 1.12, rotate: 5, boxShadow: '0 0 20px rgba(168,85,247,0.35)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <FaUserFriends size={20} className="text-[#a855f7]" aria-hidden="true" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-display text-xl uppercase text-white mb-1">{t('f4title')}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{t('f4desc')}</p>
              </div>
              {/* Friend avatars mini */}
              <div className="flex -space-x-2 flex-shrink-0">
                {[['S', '#7B72F8'], ['N', '#a855f7'], ['B', '#6B63E8'], ['A', '#f43f5e']].map(([l, c], ai) => (
                  <motion.div key={String(l)} className="w-9 h-9 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center text-xs font-bold text-white cursor-default"
                    style={{ background: `${String(c)}` }}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: ai * 0.08 }}
                    whileHover={{ scale: 1.25, y: -4, zIndex: 10, boxShadow: `0 0 16px ${String(c)}60` }}>
                    {String(l)}
                  </motion.div>
                ))}
                <motion.div className="w-9 h-9 rounded-full border-2 border-[#0A0A0F] border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs cursor-default"
                  whileHover={{ scale: 1.2, borderColor: '#7B72F8', color: '#7B72F8' }}
                  animate={{ rotate: [0, 90, 180, 270, 360] }}
                  transition={{ rotate: { repeat: Infinity, duration: 12, ease: 'linear' } }}>
                  +
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── LiveWatchGlobe ───────────────────────────────────────────────────────
const GLOBE_CONNECTIONS = [
  { from: { x: 38, y: 28, city: 'Moskva' }, to: { x: 48, y: 38, city: 'Toshkent' }, user1: 'Bobur', user2: 'Sevara', movie: 'Inception' },
  { from: { x: 52, y: 30, city: 'Istanbul' }, to: { x: 55, y: 32, city: 'Anqara' }, user1: 'Emir', user2: 'Ayşe', movie: 'Dark Knight' },
  { from: { x: 20, y: 30, city: 'London' }, to: { x: 12, y: 32, city: 'New York' }, user1: 'John', user2: 'Emma', movie: 'Interstellar' },
  { from: { x: 78, y: 28, city: 'Tokyo' }, to: { x: 74, y: 30, city: 'Seoul' }, user1: 'Yuki', user2: 'Min', movie: 'Parasite' },
  { from: { x: 45, y: 38, city: 'Dubai' }, to: { x: 38, y: 28, city: 'Moskva' }, user1: 'Ali', user2: 'Dmitry', movie: 'Dune' },
];

function LiveWatchGlobe({ t }: { t: TFn }) {
  const activeConnection = 0;
  const showTooltip = true;
  // Continent outline paths (viewBox 0 0 100 80, center 50,40, r36)
  const continentPaths = [
    // North America
    'M 16,12 L 18,10 L 21,10.5 L 23,12 L 25,14 L 26,17 L 26,20 L 25,23 L 23,25 L 21,27 L 19,29 L 17,30.5 L 16,29 L 15,26 L 14.5,23 L 14,20 L 14.5,16 L 15,14 Z',
    // Alaska
    'M 14,12 L 16,11 L 16,12 L 15,13 L 13.5,13 Z',
    // Central America
    'M 17,30.5 L 18,32 L 19,34 L 18,35.5 L 17,34 L 16.5,32 Z',
    // South America
    'M 19,36 L 21,35 L 23,36 L 25,38 L 26,41 L 26,45 L 25,49 L 24,53 L 22,56 L 20,57 L 19,55 L 18,51 L 17.5,47 L 17.5,43 L 18,40 Z',
    // Europe
    'M 33,20 L 35,18 L 37,17.5 L 39,18 L 41,17.5 L 43,18 L 44,20 L 44.5,22 L 43.5,24 L 44.5,25.5 L 43,27 L 41,28 L 39,27.5 L 37,28 L 35,27 L 33.5,25.5 L 32.5,23 L 32,21.5 Z',
    // Scandinavia
    'M 35,14 L 37,12.5 L 38.5,14 L 38,17 L 36.5,17.5 L 35.5,16.5 L 35,15 Z',
    // UK
    'M 30,20 L 31.5,18.5 L 32.5,19.5 L 32,21 L 30.5,21 Z',
    // Asia (mainland)
    'M 44.5,17 L 48,15 L 52,13 L 57,11 L 62,10.5 L 67,12 L 71,14 L 74,17 L 76,20 L 77,24 L 75,27 L 73,29 L 70,31 L 67,33 L 63,34 L 59,35 L 55,34 L 52,32 L 49,30 L 47,27 L 45.5,24 L 44.5,20 Z',
    // India
    'M 56,34 L 58,36 L 59,39 L 58.5,42 L 57,41 L 55.5,38 L 55.5,35 Z',
    // SE Asia
    'M 67,33 L 69,35 L 71,37 L 70,39 L 68,38 L 66.5,36 Z',
    // Korea
    'M 74,27 L 75,25 L 76,27 L 75.5,29 L 74.5,28.5 Z',
    // Japan
    'M 78,19 L 79.5,17 L 80,19 L 79.5,22 L 78.5,23 L 78,21 Z',
    // Africa
    'M 35,29 L 38,28.5 L 41,29.5 L 43,31 L 44.5,33 L 46,36 L 47,40 L 47,44 L 46,48 L 44.5,51 L 42.5,53 L 40.5,54 L 39,53 L 37,51 L 36,48 L 35,44 L 34,40 L 34,36 L 34,33 L 34.5,31 Z',
    // Madagascar
    'M 48,47 L 49,45.5 L 49.5,48 L 48.5,49.5 Z',
    // Australia
    'M 69,46 L 72,44 L 75,43.5 L 78,45 L 79,48 L 78,51 L 75,52 L 72,52 L 70,50.5 L 69,48 Z',
    // New Zealand
    'M 81,51 L 82,49.5 L 82.5,51.5 L 82,53 L 81,52.5 Z',
  ];

  const conn = GLOBE_CONNECTIONS[activeConnection];

  const cities = [
    { x: 38, y: 28, name: 'Moskva' },
    { x: 48, y: 38, name: 'Toshkent' },
    { x: 52, y: 30, name: 'Istanbul' },
    { x: 20, y: 30, name: 'London' },
    { x: 12, y: 32, name: 'New York' },
    { x: 78, y: 28, name: 'Tokyo' },
    { x: 74, y: 30, name: 'Seoul' },
    { x: 55, y: 32, name: 'Anqara' },
    { x: 45, y: 38, name: 'Dubai' },
  ];

  const arcPath = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    const my = Math.min(y1, y2) - 8 - Math.abs(x2 - x1) * 0.15;
    return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  };

  return (
    <section className="py-24 px-4 bg-page relative overflow-hidden" aria-label="Global watch">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(123,114,248,0.08) 0%, transparent 60%)' }}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold">{t('globeTag')}</span>
          <h2 className="text-4xl md:text-5xl font-display uppercase text-white mt-3 mb-2">
            {t('globeTitle')}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}>
              {t('globeSubtitle')}
            </span>
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto mt-3">{t('globeDesc')}</p>
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-2xl mx-auto"
        >
          <svg viewBox="0 0 100 80" className="w-full" aria-hidden="true">
            {/* Globe circle background */}
            <defs>
              <radialGradient id="globe-bg" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="rgba(123,114,248,0.06)" />
                <stop offset="70%" stopColor="rgba(123,114,248,0.02)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="globe-edge" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(123,114,248,0.1)" />
              </radialGradient>
              <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B72F8" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7B72F8" />
              </linearGradient>
              <clipPath id="globe-clip">
                <circle cx="50" cy="40" r="36" />
              </clipPath>
            </defs>

            {/* Globe background circle */}
            <circle cx="50" cy="40" r="36" fill="url(#globe-bg)" stroke="rgba(123,114,248,0.12)" strokeWidth="0.3" />
            <circle cx="50" cy="40" r="36" fill="url(#globe-edge)" />

            {/* Grid + continents clipped to globe circle */}
            <g clipPath="url(#globe-clip)">
              {/* Grid lines (latitude/longitude) */}
              {[20, 30, 40, 50, 60].map(y => (
                <ellipse key={`lat-${y}`} cx="50" cy="40" rx={36 - Math.abs(y - 40) * 0.6} ry={0.3}
                  transform={`translate(0, ${y - 40})`}
                  fill="none" stroke="rgba(123,114,248,0.06)" strokeWidth="0.15" />
              ))}
              {[30, 40, 50, 60, 70].map(x => (
                <line key={`lon-${x}`} x1={x} y1="4" x2={x} y2="76"
                  stroke="rgba(123,114,248,0.04)" strokeWidth="0.15" />
              ))}

              {/* Continent outlines */}
              {continentPaths.map((d, i) => (
                <path key={`continent-${i}`} d={d}
                  fill="rgba(123,114,248,0.06)" stroke="rgba(123,114,248,0.2)" strokeWidth="0.25"
                  strokeLinejoin="round" strokeLinecap="round" />
              ))}
            </g>

            {/* City dots */}
            {cities.map((city, i) => (
              <g key={city.name}>
                {/* Outer pulse ring */}
                <circle cx={city.x} cy={city.y} r="1.5"
                  fill="none" stroke="rgba(123,114,248,0.3)" strokeWidth="0.15">
                  <animate attributeName="r" values="1.5;3;1.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
                {/* City dot */}
                <circle cx={city.x} cy={city.y} r="0.8"
                  fill="#7B72F8">
                  <animate attributeName="r" values="0.6;0.9;0.6" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                </circle>
                {/* City label */}
                <text x={city.x} y={city.y - 2.5} textAnchor="middle"
                  fill="rgba(123,114,248,0.5)" fontSize="1.8" fontFamily="sans-serif" fontWeight="600">
                  {city.name}
                </text>
              </g>
            ))}

            {/* Active connection arc */}
            <path
              d={arcPath(conn.from.x, conn.from.y, conn.to.x, conn.to.y)}
              fill="none" stroke="url(#arc-gradient)" strokeWidth="0.4" strokeLinecap="round"
              opacity="0.8">
              <animate attributeName="stroke-dasharray" values="0,200;60,200;0,200" dur="4.5s" repeatCount="indefinite" />
            </path>

            {/* Signal dot moving along arc */}
            <circle r="0.7" fill="#a855f7">
              <animateMotion
                path={arcPath(conn.from.x, conn.from.y, conn.to.x, conn.to.y)}
                dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Active city highlights */}
            <circle cx={conn.from.x} cy={conn.from.y} r="1.2" fill="none" stroke="#7B72F8" strokeWidth="0.3">
              <animate attributeName="r" values="1.2;2.5;1.2" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={conn.to.x} cy={conn.to.y} r="1.2" fill="none" stroke="#a855f7" strokeWidth="0.3">
              <animate attributeName="r" values="1.2;2.5;1.2" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Tooltip card */}
          <AnimatePresence mode="wait">
            {showTooltip && (
              <motion.div
                key={activeConnection}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border border-zinc-800/60 backdrop-blur-md shadow-[0_0_40px_rgba(123,114,248,0.1)]"
                style={{ background: 'linear-gradient(145deg, rgba(17,17,24,0.95), rgba(13,13,22,0.98))' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-semibold">{conn.user1}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-white font-semibold">{conn.user2}</span>
                  </div>
                  <div className="h-4 w-px bg-zinc-800" />
                  <span className="text-[#7B72F8] text-xs font-medium">🎬 {conn.movie}</span>
                </div>
                <p className="text-zinc-600 text-[10px] mt-1 text-center">
                  {conn.from.city} → {conn.to.city}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats below globe */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-12 mt-8"
        >
          {[
            { val: t('globeStat1'), label: t('globeStat1Label') },
            { val: t('globeStat2'), label: t('globeStat2Label') },
          ].map(({ val, label }) => (
            <div key={label} className="text-center group cursor-default">
              <motion.p
                className="text-3xl font-display font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8, #a855f7)' }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {val}
              </motion.p>
              <p className="text-zinc-600 text-xs uppercase tracking-widest mt-1 group-hover:text-zinc-400 transition-colors">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── WhyWeWatch ───────────────────────────────────────────────────────────
function WhyWeWatch({ t }: { t: TFn }) {
  const WHY_ITEMS = [
    {
      icon: FaGlobe,
      color: '#7B72F8',
      bg: 'rgba(123,114,248,0.12)',
      border: 'rgba(123,114,248,0.25)',
      title: t('whyBrowserTitle'),
      text: t('whyBrowserText'),
      gradient: 'linear-gradient(135deg, rgba(123,114,248,0.15) 0%, transparent 60%)',
    },
    {
      icon: FaUsers,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.10)',
      border: 'rgba(34,211,238,0.22)',
      title: t('whySyncTitle'),
      text: t('whySyncText'),
      gradient: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, transparent 60%)',
    },
    {
      icon: FaShieldAlt,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.10)',
      border: 'rgba(74,222,128,0.22)',
      title: t('whySecureTitle'),
      text: t('whySecureText'),
      gradient: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, transparent 60%)',
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {WHY_ITEMS.map(({ icon: Icon, color, bg, border, title, text, gradient }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
              className="group relative rounded-2xl border border-zinc-800/60 p-7 flex flex-col gap-5 cursor-default overflow-hidden"
              style={{ background: 'linear-gradient(165deg, #111118 0%, #0D0D14 100%)' }}
            >
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              {/* Corner gradient glow */}
              <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[60px] pointer-events-none"
                style={{ background: color }} aria-hidden="true" />
              {/* Bottom glow */}
              <div className="absolute bottom-0 left-[15%] right-[15%] h-16 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-[40px] pointer-events-none"
                style={{ background: color }} aria-hidden="true" />

              {/* Icon */}
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10"
                style={{ background: bg, border: `1px solid ${border}` }}
                whileHover={{ scale: 1.12, rotate: 8, boxShadow: `0 0 24px ${color}40` }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Icon size={24} style={{ color }} aria-hidden="true" />
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 0 3px ${color}20, 0 0 0 7px ${color}08` }} />
              </motion.div>

              {/* Text */}
              <div className="flex-1 relative z-10">
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-opacity-100 transition-all duration-300">
                  {title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-400 transition-colors duration-300">{text}</p>
              </div>

              {/* Number indicator */}
              <div className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold opacity-20 group-hover:opacity-60 transition-opacity duration-300"
                style={{ color, border: `1px solid ${color}30` }}>
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Phone screens ─────────────────────────────────────────────────────────
type TFn = (key: string) => string;

function ScreenHome({ t }: { t: TFn }) {
  return (
    <div className="h-full flex flex-col bg-page select-none">
      <IPhoneStatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-3">
        <div className="flex items-center gap-1.5">
          <WIcon size={20} />
          <span className="text-[12px] font-extrabold text-white tracking-tight">
            We<span style={{ color: BRAND_PURPLE }}>Watch</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] text-green-400 font-medium">2 {t('screenOnline')}</span>
        </div>
      </div>
      {/* Browser selector — key differentiator */}
      <div className="mx-4 rounded-xl bg-[#111118] border border-[#7B72F8]/25 p-3.5 mb-3">
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">{t('openSite')}</p>
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
              <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
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
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2 font-medium">{t('screenActiveRooms')}</p>
        <div className="space-y-2.5">
          {[
            { name: 'Sardor + 2', status: t('screenWatching'), color: '#7B72F8', initials: 'S' },
            { name: 'Nilufar + 1', status: t('screenWaiting'), color: '#a855f7', initials: 'N' },
          ].map((room, i) => (
            <motion.div key={room.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-[#111118] border border-zinc-800/60 px-3.5 py-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: `${room.color}30`, border: `1.5px solid ${room.color}50` }}>{room.initials}</div>
              <div className="min-w-0">
                <p className="text-[12px] text-white font-medium truncate">{room.name}</p>
                <p className="text-[10px] text-zinc-400">{room.status}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" aria-hidden="true" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mx-4 mb-2 rounded-xl p-3.5 flex items-center gap-3 border border-[#7B72F8]/30"
        style={{ background: 'rgba(123,114,248,0.08)' }}>
        <FaUsers size={13} className="text-[#7B72F8] flex-shrink-0" aria-hidden="true" />
        <span className="text-[#7B72F8] text-[12px] font-semibold">{t('screenCreateParty')}</span>
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
        <div className="relative h-[90px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(rgba(123,114,248,1) 1px,transparent 1px),linear-gradient(90deg,rgba(123,114,248,1) 1px,transparent 1px)', backgroundSize: '16px 16px' }}
            aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(123,114,248,0.18) 0%, transparent 70%)' }} aria-hidden="true" />
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center relative z-10"
            style={{ background: 'rgba(123,114,248,0.22)', border: '2px solid rgba(123,114,248,0.55)' }}
            animate={{ boxShadow: ['0 0 0px rgba(123,114,248,0.3)', '0 0 20px rgba(123,114,248,0.7)', '0 0 0px rgba(123,114,248,0.3)'] }}
            transition={{ repeat: Infinity, duration: 2.2 }}>
            <FaPlay size={15} className="text-[#7B72F8] ml-0.5" aria-hidden="true" />
          </motion.div>
        </div>
        {/* URL row + progress */}
        <div className="px-3.5 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2.5">
            <FaLink size={8} className="text-[#7B72F8]/60 flex-shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-zinc-400 font-mono truncate flex-1">youtube.com/watch?v=dQw...</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full w-0 rounded-full" style={{ background: 'linear-gradient(90deg, #7B72F8, #a855f7)' }} />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-[0.14em] font-semibold">{t('screenParticipants')}</p>
          <span className="text-[10px] font-bold" style={{ color: '#7B72F8' }}>3 / 4</span>
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
        style={{ height: '45%', background: 'radial-gradient(ellipse at 30% 40%, #1a0640 0%, #0d0420 55%, #050010 100%)' }}>
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
          <span className="text-[11px] text-white/90 font-medium">{t('screenRealtimeChat')}</span>
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
                <motion.div initial={{ opacity: 0, x: -10, y: 4, scale: 0.95 }} animate={{ opacity: 1, x: 0, y: [0, -3, 0], scale: 1 }}
                  transition={{ opacity: { duration: 0.25 }, x: { duration: 0.25 }, y: { repeat: Infinity, duration: 2.5, delay: i * 0.3 }, scale: { duration: 0.25 } }} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${msg.color}, ${msg.color}99)`,
                      boxShadow: `0 0 8px ${msg.color}45`,
                    }}>{msg.u}</div>
                  <div className="rounded-2xl px-3 py-2 max-w-[80%]"
                    style={{ background: '#181830', border: '1px solid rgba(255,255,255,0.13)', borderLeft: `2px solid ${msg.color}` }}>
                    <span className="text-[11px] text-white leading-snug">{msg.msg}</span>
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
          <span className="text-[10px] text-zinc-400 flex-1 truncate">{t('screenChatHint')}</span>
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

// ── Star particles background ────────────────────────────────────────────
function StarField({ count = 12 }: { count?: number }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    top: `${(i * 37 + 11) % 100}%`,
    left: `${(i * 61 + 7) % 100}%`,
    size: (i % 3) + 1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            delay: (i % 4) * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
// ── Use-case scenarios (aisolution-style scannable cards) ──────────────────
/**
 * Every card links into the *reader's own* language. The block used to be
 * hardcoded Russian on all three locales, so an Uzbek visitor on /uz read
 * Russian copy and every click dropped them onto a Russian page.
 *
 * Targets are explicit per locale rather than derived: not every scenario has a
 * counterpart in every language, and pointing at a nonexistent /uz/... would be
 * a 404 reachable from the home page. Where a scenario has no own page yet, the
 * nearest existing guide in that language is used — a real page in the right
 * language beats an exact match in the wrong one.
 */
type UseCaseKey = 'longDistance' | 'date' | 'friends' | 'series' | 'anime' | 'youtube';

const USE_CASE_ORDER: readonly UseCaseKey[] = ['longDistance', 'date', 'friends', 'series', 'anime', 'youtube'];

const USE_CASE_ICONS: Record<UseCaseKey, typeof FaHeart> = {
  longDistance: FaHeart,
  date: FaFilm,
  friends: FaUserFriends,
  series: FaTv,
  anime: FaPlay,
  youtube: FaGlobe,
};

const USE_CASE_HREFS: Record<UseCaseKey, Record<'ru' | 'uz' | 'en', string>> = {
  // Scenario pages come from the registry so these cards and hreflang cannot
  // drift apart; the guide targets below are spelled out because they are
  // editorial choices, not one-to-one translations.
  longDistance: LONG_DISTANCE,
  date: ONLINE_DATE,
  friends: {
    ru: '/ru/guides/smotret-film-vdvoem',
    // Нет отдельного uz/en гайда «фильм вдвоём» — ближайший по смыслу про кино.
    uz: '/uz/guides/kino-birgalikda',
    en: '/en/guides/watch-movies-with-friends',
  },
  series: {
    ru: '/ru/guides/smotret-serialy-vmeste-besplatno',
    uz: '/uz/guides/serial-birgalikda',
    en: '/en/guides/what-is-watch-party',
  },
  anime: {
    ru: '/ru/guides/smotret-anime-vmeste',
    uz: '/uz/guides/anime-birgalikda',
    en: '/en/guides/watch-movies-with-friends',
  },
  youtube: {
    ru: '/ru/guides/smotret-youtube-vmeste',
    uz: '/uz/guides/youtube-birgalikda',
    en: '/en/guides/watch-youtube-together',
  },
};

function UseCaseCards({ t, locale }: { t: TFn; locale: 'ru' | 'uz' | 'en' }) {

  return (
    <section className="relative py-24 px-4 bg-page overflow-hidden" aria-labelledby="usecases-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.06) 0%, transparent 70%)' }} />
      </div>
      <div className="max-w-6xl mx-auto relative">
        <div className="mb-12 text-center">
          <p className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">{t('eyebrow')}</p>
          <h2 id="usecases-heading" className="text-4xl md:text-5xl font-display uppercase text-white mb-4">{t('title')}</h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASE_ORDER.map((key) => {
            const Icon = USE_CASE_ICONS[key];
            const href = USE_CASE_HREFS[key][locale];
            return (
              <Link key={key} href={href}
                className="group relative rounded-2xl border border-zinc-800/60 p-6 overflow-hidden transition-all duration-300 hover:border-[#7B72F8]/50 hover:-translate-y-1"
                style={{ background: 'linear-gradient(145deg, rgba(17,17,24,0.96), rgba(13,13,22,0.99))' }}>
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.5), transparent)' }} />
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#7B72F8]/12 border border-[#7B72F8]/25 flex items-center justify-center">
                    <Icon size={20} className="text-[#7B72F8]" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-[#a99cff] bg-[#7B72F8]/10 border border-[#7B72F8]/20 px-2.5 py-1 rounded-full">{t(`${key}Hook`)}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#a99cff] transition-colors">{t(`${key}Title`)}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{t(`${key}Desc`)}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7B72F8] group-hover:gap-2.5 transition-all">{t('more')} <FaArrowRight size={11} /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingContent({ locale }: { locale: 'ru' | 'uz' | 'en' }) {
  const t = useTranslations('landing') as TFn;
  const tNav = useTranslations('nav') as TFn;
  const tUseCases = useTranslations('useCases') as TFn;
  const shouldReduceMotion = useReducedMotion();
  const [activeScreen, setActiveScreen] = useState(0);
  const visibleChats = activeScreen === 2 ? [0, 1, 2] : [];
  const urlText = TYPING_URL;
  const movieIdx = 0;
  const switchScreen = (screen: number) => setActiveScreen(screen);

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
  const APP_FEATURES   = [t('appFeat1'), t('appFeat2'), t('appFeat3'), t('appFeat4'), t('appFeat5'), t('appFeat6')];

  // Nav and footer used to be rendered here, which is why the home page was the
  // only page that had them for a long time. They now come from the locale
  // layout (SiteShell) like on every other page, and this component is the page
  // body alone.
  return (
    <>
      <StatsWidget />
      <main className="flex-1 overflow-x-hidden" id="main-content">

        {/* ── HERO ── */}
        <section className="relative min-h-dvh flex items-start justify-center overflow-hidden bg-page bg-[radial-gradient(circle_at_50%_25%,rgba(123,114,248,0.10),transparent_52%)]"
          aria-labelledby="hero-heading">
          <motion.div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Mesh gradient */}
            <motion.div className="absolute top-1/2 left-1/2 hidden lg:block -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full blur-[180px]"
              style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)' }}
              animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }} />
            <div className="absolute top-1/4 left-1/5 hidden lg:block w-[500px] h-[500px] rounded-full blur-[130px]"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)' }} />
            <div className="absolute bottom-1/3 right-1/5 hidden lg:block w-[400px] h-[400px] rounded-full blur-[110px]"
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
            <StarField />
          </motion.div>

          <div className="relative z-10 w-full px-4 sm:px-6 max-w-7xl mx-auto pt-32 pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
            {/* ── LEFT: copy ── */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: -16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(123,114,248,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}
                className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/[0.08] lg:backdrop-blur-md text-xs sm:text-sm text-white/80 cursor-default"
                style={{ boxShadow: '0 0 32px rgba(123,114,248,0.22), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#7B72F8] opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7B72F8]" />
                </span>
                {t('heroBadge')}
              </motion.div>

              {/* H1 — skill §6: bold display, clear hierarchy */}
              <h1 id="hero-heading"
                className="hero-lcp-title text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-display uppercase leading-[0.9] tracking-tight mb-6 text-white"
                style={{ textShadow: '0 0 120px rgba(123,114,248,0.28)' }}>
                {t('heroTitle1')}<br />
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8 0%, #a855f7 50%, #7B72F8 100%)' }}>
                    {t('heroTitle2')}
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" aria-hidden="true"
                    style={{ background: 'linear-gradient(90deg, transparent, #7B72F8, #a855f7, transparent)', opacity: 0.6 }} />
                </span>
              </h1>

              {/* Subtitle — §6: 1.5 line-height, ≤65 chars/line */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55, delay: 0.3 }}
                className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t('heroSub')}
              </motion.p>

              {/* Feature checks */}
              <motion.ul initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 mb-9">
                {[t('heroCheck1'), t('heroCheck2'), t('heroCheck3')].map((c) => (
                  <li key={c} className="inline-flex items-center gap-2 text-sm text-zinc-300">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500/15" aria-hidden="true">
                      <FaCheck size={9} className="text-green-400" />
                    </span>
                    {c}
                  </li>
                ))}
              </motion.ul>

              {/* CTA buttons — §1: cursor-pointer, min h-14 (>44px touch target) */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 }}
                className="flex gap-4 justify-center lg:justify-start flex-wrap">
                <motion.span aria-disabled="true"
                  className="group relative inline-flex items-center gap-3 h-14 px-8 rounded-xl text-white font-semibold cursor-default select-none overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', opacity: 0.92, boxShadow: '0 0 32px rgba(123,114,248,0.5), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                  <motion.div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'linear', repeatDelay: 2.5 }} />
                  <FaMobileAlt size={22} className="relative z-10" aria-hidden="true" />
                  <div className="text-[15px] font-bold relative z-10">{t('heroBadge')}</div>
                  <span className="relative z-10 ml-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">{t('soon')}</span>
                </motion.span>
                <motion.a href="#demo"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-xl border border-zinc-700/80 text-zinc-300 hover:border-[#7B72F8]/50 hover:text-white hover:bg-[#7B72F8]/[0.06] transition-colors duration-200 text-sm lg:backdrop-blur-sm cursor-pointer"
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                  <FaPlay size={11} aria-hidden="true" />
                  {t('heroHowBtn')}
                </motion.a>
              </motion.div>

              {/* Trust badge */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500">
                <FaShieldAlt size={11} className="text-[#7B72F8]" aria-hidden="true" />
                <span>{t('heroTrust')}</span>
              </motion.div>
            </div>

            {/* ── RIGHT: live sync demo card ── */}
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.35 }}
              className="relative mx-auto hidden w-full max-w-md lg:block lg:max-w-none">
              {/* floating badge — top */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-4 right-3 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12121b]/90 border border-zinc-700/70 backdrop-blur-md shadow-xl text-xs font-semibold text-white">
                <FaUsers size={11} className="text-[#7B72F8]" aria-hidden="true" />
                {t('heroCardBadge')}
              </motion.div>

              <GlassCard className="p-3.5 sm:p-4" glowColor="#7B72F8" hover={false}>
                {/* browser chrome */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1.5 shrink-0" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/80" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 h-7 px-3 rounded-lg bg-[#0A0A0F]/80 border border-zinc-800 text-xs text-zinc-400">
                    <FaGlobe size={10} className="text-zinc-600 shrink-0" aria-hidden="true" />
                    <span className="truncate">{urlText}</span>
                    <span className="w-px h-3.5 bg-[#7B72F8] animate-pulse" aria-hidden="true" />
                  </div>
                </div>

                {/* video frame — content types cycle here */}
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-video mb-3 bg-page">
                  {/* rotating thumbnail — crossfade + ken-burns */}
                  <AnimatePresence>
                    <motion.div key={movieIdx} className="absolute inset-0 bg-cover bg-center" aria-hidden="true"
                      initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: 'easeInOut' }}
                      style={{ backgroundColor: HERO_MOVIES[movieIdx].bg, backgroundImage: `url("${HERO_MOVIES[movieIdx].img}")` }}>
                      {/* brand tint + legibility vignette */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.25) 0%, transparent 28%, transparent 52%, rgba(0,0,0,0.85) 100%)' }} />
                      <div className="absolute inset-0 mix-blend-soft-light" style={{ background: 'linear-gradient(135deg, rgba(123,114,248,0.35), transparent 60%)' }} />
                    </motion.div>
                  </AnimatePresence>

                  {/* source label — swaps cleanly on top of the crossfade */}
                  <div className="absolute bottom-8 left-3 right-3 z-10 flex items-end justify-between gap-2">
                    <motion.span key={movieIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-sm border border-white/10 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7B72F8]" aria-hidden="true" />
                      {CATEGORY_KEYS.has(HERO_MOVIES[movieIdx].cat)
                        ? t(HERO_MOVIES[movieIdx].cat)
                        : HERO_MOVIES[movieIdx].cat}
                    </motion.span>
                    <motion.span key={`m${movieIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
                      className="px-2 py-1 rounded-md bg-black/45 backdrop-blur-sm text-[10px] text-white font-medium shrink-0">{HERO_MOVIES[movieIdx].meta}</motion.span>
                  </div>

                  {/* LIVE badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse" aria-hidden="true" /> Live
                  </div>
                  {/* viewers */}
                  <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white">
                    <FaUsers size={9} aria-hidden="true" /> 3
                  </div>
                  {/* play */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <motion.div
                      animate={shouldReduceMotion ? {} : { scale: [1, 1.09, 1] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(123,114,248,0.92)', boxShadow: '0 0 40px rgba(123,114,248,0.6)' }}>
                      <FaPlay size={18} className="text-white ml-0.5" />
                    </motion.div>
                  </div>
                  {/* sync scrubber — everyone clustered at the same frame */}
                  <div className="absolute bottom-3 left-3 right-3 z-10" aria-hidden="true">
                    <div className="relative h-1 rounded-full bg-white/20">
                      <div className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-[#7B72F8]" />
                      <div className="absolute -top-[7px] left-[58%] -translate-x-1/2 flex -space-x-1.5">
                        {['#7B72F8', '#a855f7', '#6B63E8'].map((c, i) => (
                          <span key={i} className="w-4 h-4 rounded-full border-2 border-[#0A0A0F]" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* live chat */}
                <div className="space-y-2 mb-3">
                  {CHAT_MSGS.slice(0, 2).map((m, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.3 }}
                      className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: m.color }}>{m.u}</span>
                      <span className="px-2.5 py-1 rounded-lg rounded-tl-sm bg-[#0A0A0F]/70 border border-zinc-800 text-xs text-zinc-300 truncate">{m.msg}</span>
                    </motion.div>
                  ))}
                </div>

                {/* footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                    </span>
                    <span className="text-zinc-400"><span className="text-zinc-200 font-semibold">3</span> {t('heroCardStat')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium">
                    <FaCheck size={9} aria-hidden="true" /> ±2s {t('statsLabel3')}
                  </span>
                </div>
              </GlassCard>

              {/* floating badge — bottom (live reactions) */}
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-4 left-3 z-20 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#12121b]/90 border border-zinc-700/70 backdrop-blur-md shadow-xl">
                <span className="flex -space-x-1" aria-hidden="true">
                  {['❤️', '🔥', '😂'].map((e, i) => (
                    <motion.span key={i} className="text-sm"
                      animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.2, ease: 'easeInOut' }}>{e}</motion.span>
                  ))}
                </span>
                <span className="text-xs font-semibold text-zinc-300">+12</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, 7, 0], borderColor: ['rgba(63,63,77,0.7)', 'rgba(123,114,248,0.5)', 'rgba(63,63,77,0.7)'] }} transition={{ repeat: Infinity, duration: 2.2 }}
              className="w-5 h-8 rounded-full border border-zinc-700/70 flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-zinc-600" />
            </motion.div>
          </motion.div>
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" aria-hidden="true" />
        </section>

        {/* ── USE CASES (scannable scenario cards) ── */}
        <UseCaseCards t={tUseCases} locale={locale} />

        {/* ── STATS ── */}
        <StatsBar t={t} statsLabel={tNav('stats')} />

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
              <motion.p variants={fadeUp} className="text-zinc-400 text-lg max-w-lg mx-auto">{t('urlSub')}</motion.p>
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

              <motion.div className="relative flex items-center" aria-hidden="true">
                <motion.div animate={shouldReduceMotion ? {} : { x: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  className="text-[#7B72F8]">
                  <FaChevronRight size={22} />
                </motion.div>
                <motion.div animate={shouldReduceMotion ? {} : { x: [0, 8, 0], opacity: [0, 0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
                  className="absolute left-0 text-[#a855f7]">
                  <FaChevronRight size={22} />
                </motion.div>
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
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-950"
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
        <section className="py-28 px-4 bg-page relative overflow-hidden" aria-labelledby="sync-heading">
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
                  <button key={i} type="button" onClick={() => switchScreen(i)}
                    aria-pressed={activeScreen === i}
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
                        <span className={`text-[10px] font-bold transition-colors ${activeScreen === i ? 'text-[#9B92FF]' : 'text-zinc-400'}`}>{step}</span>
                        <span className={`text-xs font-semibold transition-colors truncate ${activeScreen === i ? 'text-white' : 'text-zinc-400'}`}>{title}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">{sub}</p>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Phone mockup */}
              <div className="order-1 lg:order-2 flex-1 flex flex-col items-center gap-8">
                <PhoneMockup t={t} activeScreen={activeScreen} visibleChats={visibleChats} chatMsgs={CHAT_MSGS} />
                {/* Screen dots — §1: aria labels */}
                <div className="flex gap-2.5" role="tablist" aria-label={t('appTitle')}>
                  {[0, 1, 2].map(i => (
                    <button key={i} type="button" onClick={() => switchScreen(i)} role="tab"
                      aria-selected={activeScreen === i}
                      aria-label={`${DEMO_STEPS[i]?.title}: ${DEMO_STEPS[i]?.sub}`}
                      className="group w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
                      <span
                        aria-hidden="true"
                        className={`block rounded-full transition-all duration-250 ${activeScreen === i ? 'w-8 h-2.5' : 'w-2.5 h-2.5 bg-zinc-700 group-hover:bg-zinc-500'}`}
                        style={activeScreen === i ? { background: 'linear-gradient(90deg, #7B72F8, #a855f7)', boxShadow: '0 0 10px rgba(123,114,248,0.7)' } : {}}
                      />
                    </button>
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

        {/* ── LIVE WATCH GLOBE ── */}
        <LiveWatchGlobe t={t} />

        {/* ── WHY WEWATCH ── */}
        <WhyWeWatch t={t} />

        {/* ── NEWSLETTER CAMPAIGNS ── */}
        <NewsletterSectionIsland />

        {/* ── CTA ── */}
        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="py-24 px-4 relative bg-page" aria-labelledby="faq-heading">
          <div className="max-w-2xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-3">{t('faqEyebrow')}</motion.p>
              <motion.h2 id="faq-heading" variants={fadeUp} className="text-3xl md:text-4xl font-display uppercase text-white">{t('faqTitle')}</motion.h2>
            </motion.div>
            <FAQAccordionIsland />
          </div>
        </section>

        <section className="py-32 px-4 text-center relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-page" />
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
              <motion.span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8 0%, #a855f7 50%, #7B72F8 100%)', backgroundSize: '200% 200%' }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
                  {t('ctaTitle2')}
                </motion.span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-zinc-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
              {t('ctaDesc')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.span aria-disabled="true"
                className="relative inline-flex items-center gap-3 h-16 px-12 rounded-xl text-white font-bold text-base cursor-default select-none overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', opacity: 0.92, boxShadow: '0 0 50px rgba(123,114,248,0.6), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                <motion.div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }} />
                <FaMobileAlt size={24} className="relative z-10" aria-hidden="true" />
                <span className="relative z-10">{t('ctaPlayBtn')}</span>
                <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">{t('soon')}</span>
              </motion.span>

              {/* Mobile apps waitlist */}
              <WaitlistForm />
            </motion.div>

            <motion.p variants={fadeUp} className="mt-10 text-zinc-600 text-sm">
              {t('ctaFooter')}
            </motion.p>
          </motion.div>
        </section>

      </main>
    </>
  );
}
