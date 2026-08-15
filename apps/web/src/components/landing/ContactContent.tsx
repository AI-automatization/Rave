'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FaEnvelope, FaArrowRight, FaMapMarkerAlt, FaPaperPlane, FaCheck } from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';
import { CONTACTS, CONTACT_EMAIL } from '@/data/tezcode';
import { useLocalizedHref } from '@/lib/i18n/use-localized-href';

const spring = { type: 'spring' as const, stiffness: 280, damping: 24 };
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...spring, stiffness: 200 } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.08 } } };

const inputCls =
  'w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#7B72F8]/60 focus:bg-[#7B72F8]/[0.04] transition-colors duration-200';

export function ContactContent() {
  const t = useTranslations('company');
  const L = useLocalizedHref();
  // Breadcrumb home link follows the page's own language, not the bare root
  // (which now 301s to /ru and would drop an Uzbek reader into Russian).
  const locale = useLocale();
  const reduce = useReducedMotion();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || !message.trim()) return;
    const subject = encodeURIComponent(`WeWatch — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="bg-page text-white overflow-x-hidden">
      <section className="relative px-4 pt-32 pb-28 overflow-hidden">
        {/* ambient background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full blur-[170px]"
            style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.2) 0%, rgba(168,85,247,0.07) 50%, transparent 70%)' }}
            animate={reduce ? {} : { scale: [0.95, 1.08, 0.95], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          />
          <div className="absolute bottom-[8%] right-[6%] w-[380px] h-[380px] rounded-full blur-[130px]"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ct-grid" width="72" height="72" patternUnits="userSpaceOnUse">
                <path d="M 72 0 L 0 0 0 72" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ct-grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* breadcrumb */}
          <motion.nav variants={fadeUp} initial="hidden" animate="visible" className="text-sm text-zinc-500 mb-8 text-center">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-400">{t('contactTag')}</span>
          </motion.nav>

          {/* header */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center mb-14 max-w-2xl mx-auto">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[#7B72F8]/35 bg-[#7B72F8]/[0.08] backdrop-blur-md text-xs text-white/80"
              style={{ boxShadow: '0 0 28px rgba(123,114,248,0.18)' }}>
              <FaEnvelope size={11} className="text-[#7B72F8]" aria-hidden="true" />
              {t('contactTag')}
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display uppercase text-white leading-[0.95] mb-4" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)' }}>
              {t('contactTitle')}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-zinc-400 text-base md:text-lg">{t('contactSub')}</motion.p>
          </motion.div>

          {/* two-column */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
            {/* ── LEFT: form ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-[28px] border border-white/10 overflow-hidden p-6 sm:p-9"
              style={{ background: 'linear-gradient(165deg, rgba(123,114,248,0.1) 0%, #0C0C14 55%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(123,114,248,0.6), transparent)' }} aria-hidden="true" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[90px] opacity-40 pointer-events-none"
                style={{ background: 'rgba(123,114,248,0.22)' }} aria-hidden="true" />

              <div className="relative z-10">
                <p className="text-[#7B72F8] text-xs uppercase tracking-[0.2em] font-semibold mb-5">{t('contactFormTag')}</p>

                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={spring}
                    className="flex flex-col items-center text-center py-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.4)' }}>
                      <FaCheck size={24} className="text-green-400" aria-hidden="true" />
                    </div>
                    <p className="text-white text-lg font-semibold mb-2">{t('contactSuccess')}</p>
                    <p className="text-zinc-500 text-sm select-all">{CONTACT_EMAIL}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs text-zinc-500 mb-1.5 block">{t('contactName')}</span>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                          placeholder={t('contactNamePh')} className={inputCls} />
                      </label>
                      <label className="block">
                        <span className="text-xs text-zinc-500 mb-1.5 block">Email</span>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com" className={inputCls} />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs text-zinc-500 mb-1.5 block">{t('contactMessage')}</span>
                      <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
                        placeholder={t('contactMessagePh')}
                        className={`${inputCls} h-auto py-3 resize-none leading-relaxed`} />
                    </label>
                    <button type="submit"
                      className="group inline-flex items-center justify-center gap-2.5 mt-1 px-8 py-3.5 rounded-xl text-white font-semibold cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #7B72F8, #6B63E8)', boxShadow: '0 0 40px rgba(123,114,248,0.5)' }}>
                      <FaPaperPlane size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                      {t('contactSend')}
                    </button>
                    <p className="flex items-center gap-2 text-zinc-600 text-xs mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                      {t('contactReplyNote')}
                    </p>
                  </form>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT: channels + location ── */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
              <motion.div variants={fadeUp}>
                <p className="text-white font-semibold text-base mb-1">{t('contactChannels')}</p>
                <p className="text-zinc-500 text-sm">{t('contactChannelsSub')}</p>
              </motion.div>

              {CONTACTS.map(({ name: cname, icon: Icon, label, href, color }) => (
                <motion.a
                  key={cname}
                  variants={fadeUp}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
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
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{cname}</p>
                    <p className="text-sm text-zinc-200 group-hover:text-white transition-colors truncate">{label}</p>
                  </div>
                  <FaArrowRight size={11} className="text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all relative z-10 flex-shrink-0" aria-hidden="true" />
                </motion.a>
              ))}

              {/* location card */}
              <motion.div variants={fadeUp}
                className="relative rounded-2xl border border-white/[0.07] overflow-hidden p-5"
                style={{ background: 'linear-gradient(160deg, rgba(34,211,238,0.06), #0C0C14 60%)' }}>
                {/* mini map */}
                <div className="absolute inset-0 opacity-[0.5]" aria-hidden="true">
                  <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="map-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                        <path d="M 26 0 L 0 0 0 26" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid)" />
                  </svg>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2" aria-hidden="true">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#7B72F8] opacity-50 animate-ping" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-[#7B72F8]" />
                    </span>
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(123,114,248,0.16)', border: '1px solid rgba(123,114,248,0.35)' }}>
                    <FaMapMarkerAlt size={17} className="text-[#7B72F8]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-0.5">{t('contactWhere')}</p>
                    <p className="text-sm text-zinc-100 font-medium">{t('contactCity')}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* link to company */}
          <motion.p variants={fadeUp} initial="hidden" animate="visible" className="text-center mt-12 text-sm text-zinc-500">
            <Link href={L('/ru/company')} className="text-[#7B72F8] hover:text-[#a855f7] transition-colors font-semibold inline-flex items-center gap-2">
              tezcode.dev <FaArrowRight size={11} aria-hidden="true" />
            </Link>
          </motion.p>
        </div>
      </section>
    </div>
  );
}
