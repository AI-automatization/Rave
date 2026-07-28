'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { CONTACTS, CONTACT_EMAIL } from '@/data/tezcode';
import { fadeUp, stagger } from './motion';

export function ContactSection() {
  const t = useTranslations('company');
  const reduce = useReducedMotion();

  return (
    <section className="px-4 py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.16) 0%, rgba(168,85,247,0.06) 50%, transparent 70%)' }}
          animate={reduce ? {} : { scale: [0.95, 1.06, 0.95], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto rounded-[36px] border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(165deg, rgba(123,114,248,0.10) 0%, #0C0C14 55%)' }}
      >
        {/* верхняя цветная линия */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.6), transparent)' }} aria-hidden="true" />
        {/* свечение */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[90px] opacity-40 pointer-events-none"
          style={{ background: 'rgba(123,114,248,0.25)' }} aria-hidden="true" />

        <div className="relative z-10 px-6 py-14 md:px-14 md:py-16 text-center">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ background: 'rgba(123,114,248,0.16)', border: '1px solid rgba(123,114,248,0.35)' }}>
              <FaEnvelope size={20} className="text-[#7B72F8]" aria-hidden="true" />
            </motion.div>
            <motion.p variants={fadeUp} className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-3">{t('contactTag')}</motion.p>
            <motion.h2 variants={fadeUp} className="font-display uppercase text-white mb-4" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)' }}>{t('contactTitle')}</motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 mb-9 max-w-md mx-auto">{t('contactSub')}</motion.p>

            {/* Основная кнопка — email */}
            <motion.a
              variants={fadeUp}
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2.5 h-[54px] px-9 rounded-2xl text-white font-semibold transition-transform hover:scale-[1.04] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 44px rgba(123,114,248,0.55)' }}
            >
              <FaEnvelope size={16} aria-hidden="true" /> {t('contactCta')}
            </motion.a>
            <motion.p variants={fadeUp} className="text-zinc-600 text-sm mt-3 select-all">{CONTACT_EMAIL}</motion.p>

            {/* разделитель */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 my-9 max-w-sm mx-auto">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-zinc-600 text-xs uppercase tracking-widest">{t('contactOr')}</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </motion.div>

            {/* Соцсети */}
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
    </section>
  );
}
