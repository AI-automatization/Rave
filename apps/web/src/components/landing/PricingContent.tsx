'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FaCheck, FaTimes, FaBolt, FaGift, FaSyncAlt, FaTag, FaArrowRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

export function PricingContent() {
  const t = useTranslations('pricingPage');
  const tl = useTranslations('landing');
  const reduce = useReducedMotion();

  // Pro has no published price on purpose: checkout does not exist in production and
  // the plan's pricing has not been decided yet (owner decision, 2026-08-10). Publishing
  // a placeholder number would put an unbuyable offer into search results and AI answers,
  // which is exactly what the claims gate exists to prevent.
  const PLANS = [
    {
      name: tl('plan1name'),
      price: '0',
      priceNote: t('plan1desc'),
      features: [
        { label: 'Watch Party', val: t('plan1people'), on: true },
        { label: t('rowQuality'), val: 'HD 720p', on: true },
        { label: t('rowSearch'), val: '✓', on: true },
        { label: t('rowFriends'), val: '∞', on: true },
        { label: t('rowHistory'), val: t('plan1historyVal'), on: true },
        { label: t('rowAds'), val: t('rowAdsYes'), on: false },
      ],
      cta: tl('plan1cta'),
      href: '/register',
      highlighted: false,
      comingSoon: false,
    },
    {
      name: tl('plan2name'),
      price: null,
      priceNote: t('plan2priceTba'),
      features: [
        { label: 'Watch Party', val: t('plan2people'), on: true },
        { label: t('rowQuality'), val: '4K 2160p', on: true },
        { label: t('rowSearch'), val: '✓', on: true },
        { label: t('rowFriends'), val: '∞', on: true },
        { label: t('rowHistory'), val: '∞', on: true },
        { label: t('rowAds'), val: t('rowAdsNo'), on: true },
      ],
      cta: tl('plan2cta'),
      href: '/register?plan=pro',
      highlighted: true,
      comingSoon: true,
    },
  ];

  const TRUST = [
    { icon: FaGift, color: '#7B72F8', title: t('trust1'), sub: t('trust1sub') },
    { icon: FaSyncAlt, color: '#22d3ee', title: t('trust2'), sub: t('trust2sub') },
    { icon: FaTag, color: '#4ade80', title: t('trust3'), sub: t('trust3sub') },
  ];

  return (
    <div className="bg-page text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative px-4 pt-28 pb-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[900px] h-[440px] rounded-full blur-[160px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.18) 0%, rgba(168,85,247,0.06) 50%, transparent 70%)' }}
            animate={reduce ? {} : { scale: [0.95, 1.07, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
        </div>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/[0.08] backdrop-blur-md text-xs text-white/80">
            <FaTag size={10} className="text-[#7B72F8]" aria-hidden="true" /> {t('badge')}
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display uppercase text-white leading-none mb-4"
            style={{ fontSize: 'clamp(2.8rem, 9vw, 5rem)', textShadow: '0 0 90px rgba(123,114,248,0.25)' }}>
            {t('title')}
          </motion.h1>
          <motion.p variants={fadeUp} className="text-zinc-400 text-lg">{t('subtitle')}</motion.p>
        </motion.div>
      </section>

      {/* PLANS */}
      <section className="px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto items-stretch">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...spring, delay: i * 0.1 }}
              className={`relative rounded-[28px] border p-8 flex flex-col ${
                p.highlighted
                  ? 'border-[#7B72F8]/50 md:-mt-3 md:mb-3 shadow-[0_0_60px_rgba(123,114,248,0.22)]'
                  : 'border-zinc-800/70'
              }`}
              style={{
                background: p.highlighted
                  ? 'linear-gradient(165deg, rgba(123,114,248,0.14) 0%, #0C0C14 60%)'
                  : 'linear-gradient(165deg, #111118 0%, #0D0D14 100%)',
              }}
            >
              {p.highlighted && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-px rounded-full" aria-hidden="true"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.7), transparent)' }} />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #7B72F8, #a855f7)', boxShadow: '0 0 20px rgba(123,114,248,0.5)' }}>
                    <FaBolt size={9} aria-hidden="true" /> {t('popular')}
                  </div>
                </>
              )}

              {/* Name */}
              <div className="flex items-center gap-2 mb-4 mt-1">
                <h2 className="font-display text-3xl uppercase text-white">{p.name}</h2>
                {p.highlighted && <span className="text-[#7B72F8]">★</span>}
              </div>

              {/* Price — Pro shows a status instead of a number until pricing is decided */}
              <div className="flex items-baseline gap-2 mb-1">
                {p.price !== null && (
                  <span className="text-5xl font-display font-bold text-white">{p.price}</span>
                )}
                <span className={p.price === null ? 'text-zinc-300 text-lg' : 'text-zinc-500 text-sm'}>
                  {p.priceNote}
                </span>
              </div>
              {p.price === '0' && (
                <span className="inline-flex w-fit items-center gap-1 text-[10px] uppercase tracking-widest text-[#4ade80] mt-1">
                  <FaCheck size={8} /> {t('freeTag')}
                </span>
              )}

              <div className="border-t border-zinc-800/70 my-6" />

              {/* Features */}
              <ul className="space-y-3.5 mb-8 flex-1">
                {p.features.map(({ label, val, on }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400 flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        on ? (p.highlighted ? 'bg-[#7B72F8]/20' : 'bg-zinc-800') : 'bg-zinc-800/60'
                      }`}>
                        {on
                          ? <FaCheck size={9} className={p.highlighted ? 'text-[#7B72F8]' : 'text-zinc-400'} aria-hidden="true" />
                          : <FaTimes size={9} className="text-zinc-600" aria-hidden="true" />}
                      </span>
                      {label}
                    </span>
                    <span className={`font-semibold ${on ? (p.highlighted ? 'text-white' : 'text-zinc-200') : 'text-zinc-600'}`}>{val}</span>
                  </li>
                ))}
              </ul>

              {/* CTA — a plan that cannot be purchased gets a disabled state, not a link */}
              {p.comingSoon ? (
                <span
                  aria-disabled="true"
                  className="flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold w-full cursor-default select-none border border-[#7B72F8]/40 text-zinc-300"
                  style={{ background: 'linear-gradient(135deg, rgba(123,114,248,0.18), rgba(107,99,232,0.10))' }}
                >
                  {tl('soon')}
                </span>
              ) : (
                <Link
                  href={p.href}
                  className={`group flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold transition-all duration-300 active:scale-[0.98] w-full ${
                    p.highlighted
                      ? 'text-white hover:shadow-[0_0_34px_rgba(123,114,248,0.6)]'
                      : 'border border-zinc-700 text-zinc-200 hover:border-[#7B72F8]/50 hover:text-white'
                  }`}
                  style={p.highlighted ? { background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 20px rgba(123,114,248,0.4)' } : undefined}
                >
                  {p.cta}
                  <FaArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8 max-w-md mx-auto">{t('footnote')}</p>
      </section>

      {/* TRUST STRIP */}
      <section className="px-4 py-16 bg-[#0C0C14] border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TRUST.map(({ icon: Icon, color, title, sub }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...spring, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                <Icon size={18} style={{ color }} aria-hidden="true" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
