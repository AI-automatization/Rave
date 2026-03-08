'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { type Variants } from 'framer-motion';
import {
  FaPlay, FaUsers, FaTrophy, FaBell, FaStar,
  FaWifi, FaShieldAlt, FaCheck, FaArrowRight,
} from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useTranslations } from 'next-intl';

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

export function FeaturesContent() {
  const t = useTranslations('featuresPage');
  const tl = useTranslations('landing');

  const FEATURE_LIST = [
    {
      icon: FaPlay,
      key: 'Watch Party',
      tagline: t('f1tagline'),
      color: '#7C3AED',
      glow: 'rgba(124,58,237,0.25)',
      badge: t('badgePrimary'),
      features: [
        'Sinxron video playback (±2s)',
        'Real-vaqt chat va emoji',
        'Xona egasi nazorati',
        "A'zolarni boshqarish",
        'Taklif havolasi',
      ],
    },
    {
      icon: GiCrossedSwords,
      key: 'Battle',
      tagline: t('f2tagline'),
      color: '#FFD700',
      glow: 'rgba(255,215,0,0.2)',
      badge: tl('mostPopular'),
      features: [
        '3 / 5 / 7 kunlik musobaqa',
        'Real-vaqt leaderboard',
        "G'olibga points",
        'Statistika va tarix',
        'Guruhli battle (tez kunda)',
      ],
    },
    {
      icon: FaTrophy,
      key: 'Achievement',
      tagline: t('f3tagline'),
      color: '#88CCFF',
      glow: 'rgba(136,204,255,0.2)',
      badge: t('badge25'),
      features: [
        '5 rarity daraja',
        'Maxfiy yutuqlar',
        'Unlock animatsiyasi',
        'Points mukofoti',
        "Profilda ko'rsatish",
      ],
    },
    {
      icon: FaUsers,
      key: t('f4key'),
      tagline: t('f4tagline'),
      color: '#7C3AED',
      glow: 'rgba(124,58,237,0.2)',
      badge: null,
      features: [
        "Do'st qo'shish/qabul",
        'Online status (real-vaqt)',
        "Profilni ko'rish",
        'Qidiruv',
        'Blok qilish',
      ],
    },
    {
      icon: FaBell,
      key: t('f5key'),
      tagline: t('f5tagline'),
      color: '#7C3AED',
      glow: 'rgba(124,58,237,0.2)',
      badge: null,
      features: [
        'Push notifications (FCM)',
        'In-app bildirishnomalar',
        'Battle natijasi',
        'Watch Party taklifi',
        'Achievement unlock',
      ],
    },
    {
      icon: FaStar,
      key: t('f6key'),
      tagline: t('f6tagline'),
      color: '#FFD700',
      glow: 'rgba(255,215,0,0.15)',
      badge: null,
      features: [
        'Film reyting (1-10)',
        'Sharhlar yozish',
        "O'rtacha reyting",
        "Ko'rish tarixi",
        'Davom etish',
      ],
    },
    {
      icon: FaWifi,
      key: 'HLS Video',
      tagline: t('f7tagline'),
      color: '#7C3AED',
      glow: 'rgba(124,58,237,0.2)',
      badge: '4K',
      features: [
        'HLS streaming (m3u8)',
        'Keyboard shortcuts',
        "To'liq ekran",
        'Progress bar',
        'Safari native HLS',
      ],
    },
    {
      icon: FaShieldAlt,
      key: t('f8key'),
      tagline: t('f8tagline'),
      color: '#4ade80',
      glow: 'rgba(74,222,128,0.15)',
      badge: null,
      features: [
        'JWT RS256 autentifikatsiya',
        'bcrypt 12 rounds',
        'Rate limiting (Redis)',
        '2FA Email tasdiqlash',
        'Brute force himoya',
      ],
    },
  ];

  const STATS = [
    { val: '10K+', label: tl('statUsers') },
    { val: '50K+', label: tl('statMovies') },
    { val: '25+',  label: t('statAchievements') },
    { val: '4K',   label: t('statQuality') },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#7C3AED]/15 rounded-full blur-[130px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold uppercase tracking-widest mb-6 shadow-[0_0_18px_rgba(124,58,237,0.3)]"
          >
            <FaPlay size={8} /> {t('heroTag')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-display uppercase text-white leading-none mb-5"
            style={{ textShadow: '0 0 80px rgba(124,58,237,0.3)' }}
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

      {/* ── STATS STRIP ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="border-y border-zinc-800/60 bg-[#111118]/60 backdrop-blur-sm"
      >
        <div className="max-w-3xl mx-auto px-4 py-5 grid grid-cols-4 gap-4">
          {STATS.map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl sm:text-3xl font-display text-[#7C3AED]" style={{ textShadow: '0 0 20px rgba(124,58,237,0.5)' }}>{val}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── FEATURE CARDS ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURE_LIST.map(({ icon: Icon, key, tagline, color, glow, badge, features }) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="group relative bg-[#111118] rounded-2xl border border-zinc-800 hover:border-opacity-60 transition-all duration-300 overflow-hidden p-5 flex flex-col"
              style={{
                '--hover-border': color,
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${color}60`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {/* Top glow on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />

              {/* Icon + badge row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${color}15`, boxShadow: `0 0 0 0 ${color}` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                {badge && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {badge}
                  </span>
                )}
              </div>

              {/* Title + tagline */}
              <h3 className="font-display text-lg uppercase text-white mb-1">{key}</h3>
              <p className="text-zinc-600 text-xs leading-relaxed mb-4">{tagline}</p>

              {/* Feature list */}
              <ul className="space-y-1.5 mt-auto">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-500">
                    <FaCheck size={9} className="shrink-0" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#7C3AED]/18 rounded-full blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h2 className="text-4xl sm:text-5xl font-display uppercase text-white mb-4"
            style={{ textShadow: '0 0 60px rgba(124,58,237,0.35)' }}>
            {t('ctaTitle')}
          </h2>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">{t('ctaSub')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_40px_rgba(124,58,237,0.7)] transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(124,58,237,0.4)] text-sm"
            >
              <FaPlay size={11} />
              <span>{tl('startShort')}</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all duration-300 active:scale-95 text-sm"
            >
              {tl('nav_pricing')} <FaArrowRight size={11} />
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
