'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { FaChevronRight, FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';
import { PRODUCTS, TEZCODE_URL } from '@/data/tezcode';
import { useLocalizedHref } from '@/lib/i18n/use-localized-href';

const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.06 } } };

export function ProductsContent() {
  const t = useTranslations('products');
  const L = useLocalizedHref();
  // Breadcrumb home link follows the page's own language, not the bare root
  // (which now 301s to /ru and would drop an Uzbek reader into Russian).
  const locale = useLocale();

  return (
    <div className="bg-page text-white overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pt-32 pb-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full blur-[150px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.14) 0%, rgba(168,85,247,0.05) 50%, transparent 70%)' }}
            animate={{ scale: [0.95, 1.06, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          />
        </div>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.nav variants={fadeUp} className="text-sm text-zinc-500 mb-8">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <Link href={L('/ru/company')} className="hover:text-white transition-colors">tezcode.dev</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-400">{t('breadcrumb')}</span>
          </motion.nav>

          <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-widest font-semibold mb-4">{t('heroTag')}</motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-6xl font-display uppercase leading-none tracking-tight mb-6"
            style={{ textShadow: '0 0 90px rgba(123,114,248,0.25)' }}
          >
            {t('heroTitle1')}{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7B72F8 0%, #a855f7 50%, #7B72F8 100%)' }}>
              {t('heroTitle2')}
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            {t('heroSub')}
          </motion.p>
        </motion.div>
      </section>

      {/* ── PRODUCTS GRID ── */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {PRODUCTS.map(({ key, name, icon: Icon, color, highlight, soon, url, isHome }) => {
              // WeWatch links at the home page of the language on screen — the
              // registry cannot hardcode it, there are three home pages.
              const href = isHome ? `/${locale}` : undefined;
              const isLink = highlight || !!url || !!href;
              const inner = (
                <>
                  <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[50px] pointer-events-none"
                    style={{ background: color }} aria-hidden="true" />
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <Icon size={20} style={{ color }} aria-hidden="true" />
                    </div>
                    {isLink && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5"
                        style={{ color, background: `${color}14`, border: `1px solid ${color}40` }}>
                        {t('open')}
                        {url && <FaExternalLinkAlt size={7} aria-hidden="true" />}
                      </span>
                    )}
                    {soon && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-zinc-500 border border-zinc-700">
                        {t('soon')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-white font-semibold text-lg mb-2 relative z-10 flex items-center gap-2">
                    {name}
                    {isLink && (
                      url
                        ? <FaExternalLinkAlt size={11} style={{ color }} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                        : <FaArrowRight size={12} className="text-[#7B72F8] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    )}
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed relative z-10 group-hover:text-zinc-400 transition-colors">{t(`desc.${key}`)}</p>
                </>
              );

              const cardClass = `group relative rounded-2xl border p-6 overflow-hidden block h-full transition-colors ${isLink ? 'cursor-pointer' : ''}`;
              const cardStyle = {
                background: highlight
                  ? 'linear-gradient(165deg, rgba(123,114,248,0.12) 0%, #0D0D14 100%)'
                  : 'linear-gradient(165deg, #111118 0%, #0D0D14 100%)',
                borderColor: highlight ? 'rgba(123,114,248,0.4)' : 'rgba(39,39,42,0.6)',
              };

              return (
                <motion.div key={key} variants={fadeUp} whileHover={isLink ? { y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}>
                  {href ? (
                    <Link href={href} className={cardClass} style={cardStyle}>{inner}</Link>
                  ) : url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={cardClass} style={cardStyle}>{inner}</a>
                  ) : (
                    <div className={cardClass} style={cardStyle}>{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center mt-14">
            <Link
              href={L('/ru/company')}
              className="inline-flex items-center gap-2 text-[#7B72F8] hover:text-[#a855f7] transition-colors text-sm font-semibold"
            >
              <FaChevronRight size={11} className="rotate-180" aria-hidden="true" /> {t('back')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-24 text-center relative overflow-hidden bg-[#0D0D16]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[130px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.12) 0%, transparent 70%)' }} aria-hidden="true" />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display uppercase text-white mb-4">{t('ctaTitle')}</h2>
          <p className="text-zinc-400 mb-8">{t('ctaSub')}</p>
          <a
            href={TEZCODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 30px rgba(123,114,248,0.45)' }}
          >
            tezcode.dev <FaArrowRight size={12} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
