'use client';

import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { CONTACTS, CONTACT_EMAIL } from '@/data/tezcode';

const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

export function ContactContent() {
  const t = useTranslations('company');
  const reduce = useReducedMotion();

  return (
    <div className="bg-[#0A0A0F] text-white overflow-x-hidden">
      <section className="relative px-4 pt-32 pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full blur-[170px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.2) 0%, rgba(168,85,247,0.07) 50%, transparent 70%)' }}
            animate={reduce ? {} : { scale: [0.95, 1.08, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ct-grid" width="72" height="72" patternUnits="userSpaceOnUse">
                <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ct-grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.nav variants={fadeUp} initial="hidden" animate="visible" className="text-sm text-zinc-500 mb-10 text-center">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-400">{t('contactTag')}</span>
          </motion.nav>

          {/* Premium panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[36px] border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(165deg, rgba(123,114,248,0.1) 0%, #0C0C14 55%)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.6), transparent)' }} aria-hidden="true" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[90px] opacity-40 pointer-events-none"
              style={{ background: 'rgba(123,114,248,0.25)' }} aria-hidden="true" />

            <div className="relative z-10 px-6 py-16 md:px-14 md:py-20 text-center">
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-7"
                  style={{ background: 'rgba(123,114,248,0.16)', border: '1px solid rgba(123,114,248,0.35)' }}>
                  <FaEnvelope size={24} className="text-[#7B72F8]" aria-hidden="true" />
                </motion.div>
                <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('contactTag')}</motion.p>
                <motion.h1 variants={fadeUp} className="font-display uppercase text-white mb-4" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)' }}>{t('contactTitle')}</motion.h1>
                <motion.p variants={fadeUp} className="text-zinc-400 mb-10 max-w-md mx-auto">{t('contactSub')}</motion.p>

                <motion.a
                  variants={fadeUp}
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2.5 h-[54px] px-9 rounded-2xl text-white font-semibold transition-transform hover:scale-[1.04] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 44px rgba(123,114,248,0.55)' }}
                >
                  <FaEnvelope size={16} aria-hidden="true" /> {t('contactCta')}
                </motion.a>
                <motion.p variants={fadeUp} className="text-zinc-600 text-sm mt-3 select-all">{CONTACT_EMAIL}</motion.p>

                <motion.div variants={fadeUp} className="flex items-center gap-4 my-10 max-w-sm mx-auto">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-zinc-600 text-xs uppercase tracking-widest">{t('contactOr')}</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </motion.div>

                <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CONTACTS.filter((c) => c.name !== 'Email').map(({ name, icon: Icon, label, href, color }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-4 hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}55`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; }}
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[35px] pointer-events-none"
                        style={{ background: color }} aria-hidden="true" />
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                        style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                        <Icon size={18} style={{ color }} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 relative z-10 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{name}</p>
                        <p className="text-sm text-zinc-200 group-hover:text-white transition-colors truncate">{label}</p>
                      </div>
                      <FaArrowRight size={11} className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all relative z-10 flex-shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* link to company */}
          <motion.p variants={fadeUp} initial="hidden" animate="visible" className="text-center mt-10 text-sm text-zinc-500">
            <Link href="/company" className="text-[#7B72F8] hover:text-[#a855f7] transition-colors font-semibold inline-flex items-center gap-2">
              tezcode.dev <FaArrowRight size={11} aria-hidden="true" />
            </Link>
          </motion.p>
        </div>
      </section>
    </div>
  );
}
