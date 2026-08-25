'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { FaPlay, FaComments, FaLink, FaUserPlus, FaUsers, FaBolt, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';

// Icon components can't cross the server→client prop boundary (React can't
// serialize a function reference from a Server Component page.tsx into a
// 'use client' component) — so callers pass a string key instead, and the
// lookup happens in here, inside the client boundary.
const ICONS = {
  link: FaLink,
  invite: FaUserPlus,
  play: FaPlay,
  users: FaUsers,
  chat: FaComments,
  bolt: FaBolt,
  shield: FaShieldAlt,
  mobile: FaMobileAlt,
} as const;

export type GuideIconKey = keyof typeof ICONS;

// Shared premium building blocks for guide-article pages (/guides/*), matching
// the glass/glow/motion language already used on the landing pages (see
// components/landing/FeaturesContent.tsx) — guides shipped with a plain,
// flat template that never got that treatment. These are presentational only;
// each guide page still owns its own copy/data.
//
// LCP note: nothing here animates hero text (H1/subtitle) — only sections
// below the fold, via `whileInView` + `viewport: { once: true }`. A hero that
// fades in from SSR opacity:0 was a measured Lighthouse regression elsewhere
// in this codebase's history; the glow orbs below are decorative and don't
// gate content visibility, so they're safe to animate unconditionally.

const spring = { type: 'spring' as const, stiffness: 260, damping: 22 };

// No hero-glow component here on purpose: `.article::before/::after` in
// globals.css already paint the sitewide glow + grid (fixed, full viewport),
// so a second one inside the hero just stacked two gradients. Guide pages use
// the existing pair of layout classes — `page-hero` on the header block,
// `article` on the body — and inherit both the glow and the typography.

/** One step in GuideSteps. `icon` is optional — falls back to the plain number. */
export type GuideStep = { n: number; title: string; desc: string; icon?: GuideIconKey };

/**
 * Numbered walkthrough as glass cards instead of bare text + a purple circle.
 * On desktop, cards connect with a thin arrow-tipped line so the sequence
 * reads left-to-right at a glance instead of requiring the numbers to carry
 * that on their own. Reveals with a stagger on scroll — this is below the
 * fold on every guide, so animating it costs nothing and reads as
 * intentional rather than static.
 */
/**
 * `timeline` renders the same data as a vertical rail with a connecting line
 * instead of a card row. Two layouts, one data shape — this is what stops
 * every guide from opening with the identical three-across grid.
 */
export function GuideSteps({ steps, variant = 'cards' }: { steps: GuideStep[]; variant?: 'cards' | 'timeline' }) {
  if (variant === 'timeline') return <StepsTimeline steps={steps} />;

  // Guides run 3 or 4 steps. A hardcoded 3-column grid orphans the 4th step onto
  // its own row; these two cases keep every row full at each breakpoint.
  const columns = steps.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <ol className={`grid gap-4 ${columns}`}>
      {steps.map(({ n, title, desc, icon }, i) => {
        const Icon = icon ? ICONS[icon] : null;
        return (
        <motion.li
          key={n}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...spring, delay: i * 0.08 }}
          className="relative rounded-2xl border border-white/[0.08] p-5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          {/* Connector to the next card — only shown at the breakpoint where the
              whole sequence sits on one row, otherwise it would point off the
              end of a wrapped row into empty space. */}
          {i < steps.length - 1 && (
            <div
              className={`hidden ${steps.length === 4 ? 'lg:flex' : 'sm:flex'} absolute top-9 -right-4 w-4 items-center justify-center text-[#7B72F8]/40 z-10`}
              aria-hidden="true"
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
          <div
            className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-[40px] pointer-events-none"
            style={{ background: '#7B72F8' }}
            aria-hidden="true"
          />
          <span
            className="relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold text-white mb-4"
            style={{ background: 'linear-gradient(135deg, #7B72F8, #9B72F8)', boxShadow: '0 0 20px rgba(123,114,248,0.4)' }}
          >
            {Icon ? <Icon size={14} /> : n}
          </span>
          <h3 className="relative font-semibold text-white mb-1.5">{title}</h3>
          <p className="relative text-zinc-400 text-sm leading-relaxed">{desc}</p>
        </motion.li>
        );
      })}
    </ol>
  );
}

/** Vertical rail layout for GuideSteps — see the `timeline` variant. */
function StepsTimeline({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="relative">
      {/* The rail itself. Stops short of the last marker so it doesn't dangle. */}
      <div
        className="absolute left-[19px] top-3 bottom-10 w-px"
        style={{ background: 'linear-gradient(180deg, rgba(123,114,248,0.5), rgba(123,114,248,0.05))' }}
        aria-hidden="true"
      />
      {steps.map(({ n, title, desc, icon }, i) => {
        const Icon = icon ? ICONS[icon] : null;
        return (
          <motion.li
            key={n}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ ...spring, delay: i * 0.1 }}
            className="relative flex gap-5 pb-8 last:pb-0"
          >
            <span
              className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7B72F8, #9B72F8)', boxShadow: '0 0 24px rgba(123,114,248,0.45)' }}
            >
              {Icon ? <Icon size={15} /> : n}
            </span>
            <div className="pt-1.5">
              <h3 className="font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** One card in GuideBenefits. */
export type GuideBenefit = { icon: GuideIconKey; title: string; desc: string };

/**
 * "Why this is useful" icon-card row — the summary a reader checks before
 * committing to the full how-to below. Same glass treatment as GuideSteps,
 * grid-of-4 on desktop collapsing to 2 on mobile.
 */
export function GuideBenefits({ items, variant = 'grid' }: { items: GuideBenefit[]; variant?: 'grid' | 'bento' }) {
  // `bento` promotes the first item to a full-width banner and lets the rest
  // share the row below, so the block reads as a composition rather than four
  // identical tiles. Deliberately not a row/col span puzzle: with 4 items a
  // 2x2 feature in a 3-column grid orphans the last card into a half-empty row.
  // Class strings are written out in full — Tailwind's JIT scans source text,
  // so an interpolated `grid-cols-${n}` would never be generated.
  const REST_COLS = ['sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3'] as const;
  const wrap = variant === 'bento'
    ? `grid grid-cols-1 gap-4 ${REST_COLS[Math.min(items.length - 1, 3) - 1] ?? 'sm:grid-cols-3'}`
    : 'grid grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className={wrap}>
      {items.map(({ icon, title, desc }, i) => {
        const Icon = ICONS[icon];
        const feature = variant === 'bento' && i === 0;
        return (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...spring, delay: i * 0.06 }}
          className={`rounded-2xl border border-white/[0.08] p-5 ${feature ? 'col-span-full sm:flex sm:items-center sm:gap-6 sm:p-7' : ''}`}
          style={{
            background: feature
              ? 'linear-gradient(150deg, rgba(123,114,248,0.14) 0%, rgba(255,255,255,0.03) 60%)'
              : 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <span
            className={`flex items-center justify-center rounded-xl text-[#7B72F8] mb-4 shrink-0 ${feature ? 'w-14 h-14 sm:mb-0' : 'w-10 h-10'}`}
            style={{ background: 'rgba(123,114,248,0.12)', border: '1px solid rgba(123,114,248,0.2)' }}
          >
            <Icon size={feature ? 24 : 17} />
          </span>
          <div>
            {/* text-sm, not text-xs: 12px body copy fails the readability half of the
                accessibility rules even when its contrast ratio passes. */}
            <h3 className={`font-semibold text-white mb-1.5 ${feature ? 'text-lg' : 'text-sm'}`}>{title}</h3>
            <p className={`text-zinc-300 leading-relaxed ${feature ? 'text-base' : 'text-sm'}`}>{desc}</p>
          </div>
        </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Product-UI mockup for the hero's second column — a stylised representation
 * of an actual room (fake player chrome + a floating chat panel with sample
 * messages), not a stock photo or AI illustration. Deliberately abstract:
 * it depicts the real feature set (synced player + chat) without claiming a
 * specific film is playing or showing real people, so there's nothing here
 * that needs a licence or that overstates what the product does.
 */
/**
 * Wide, centred hero: heading stacked above a full-width mockup instead of the
 * side-by-side split. Used by the broad "what is / how to watch together"
 * guides so they don't open identically to the scenario ones.
 */
export function GuideHeroWide({ children, locale = 'ru' }: { children: ReactNode; locale?: 'ru' | 'uz' | 'en' }) {
  return (
    <>
      <div className="max-w-3xl">{children}</div>
      <div className="mt-10 max-w-4xl mx-auto">
        <GuideRoomMockup locale={locale} wide />
      </div>
    </>
  );
}

const MOCKUP_COPY = {
  ru: { chat: 'Чат', lines: [['Андрей', 'Отличный фильм 🔥'], ['Маша', 'Да, сюжет топ 👌']] },
  uz: { chat: 'Chat', lines: [['Aziz', 'Zo‘r kino 🔥'], ['Nilufar', 'Ha, syujet top 👌']] },
  en: { chat: 'Chat', lines: [['Alex', 'Great movie 🔥'], ['Mia', 'Yeah, the plot 👌']] },
} as const;

export function GuideRoomMockup({ locale = 'ru', wide = false }: { locale?: 'ru' | 'uz' | 'en'; wide?: boolean }) {
  const copy = MOCKUP_COPY[locale];
  return (
    // Plain <div>, no entrance animation: this sits in the hero, and hero
    // content that starts at opacity:0 stays invisible until hydration —
    // the exact pattern that tanked LCP on a sibling project. Hover states
    // are fine (post-load); reveal-on-mount is not.
    <div
      // Decorative illustration of the product UI — the sample chat names and
      // 10px labels inside are visual texture, not content a screen reader
      // should read out mid-article.
      aria-hidden="true"
      className={`relative rounded-2xl border border-white/[0.08] overflow-hidden ${wide ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
      style={{ background: 'linear-gradient(160deg, #15121f 0%, #0c0b12 100%)' }}
    >
      {/* Fake player surface */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(123,114,248,0.18) 0%, transparent 65%)' }}
        />
        <span
          className="relative flex items-center justify-center w-16 h-16 rounded-full text-white"
          style={{ background: 'rgba(123,114,248,0.9)', boxShadow: '0 0 40px rgba(123,114,248,0.5)' }}
        >
          <FaPlay size={20} />
        </span>
      </div>

      {/* Bottom player chrome bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
        <div className="h-full w-2/5" style={{ background: 'linear-gradient(90deg, #7B72F8, #a855f7)' }} />
      </div>

      {/* Floating chat panel — static for the same hero/LCP reason as above. */}
      <div
        className="absolute top-4 right-4 w-[46%] rounded-xl border border-white/10 p-3"
        style={{ background: 'rgba(13,13,20,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium mb-2.5">
          <FaComments size={10} className="text-[#7B72F8]" /> {copy.chat}
        </div>
        <div className="space-y-2">
          {copy.lines.map(([name, msg], i) => (
            <div key={name} className="text-[10px] leading-snug">
              <span className="font-semibold" style={{ color: i === 0 ? '#7B72F8' : '#22d3ee' }}>{name}</span>
              <span className="text-zinc-400"> {msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One entry in GuideFAQ. */
export type GuideFAQItem = { q: string; a: string };

/**
 * FAQ accordion on native <details>/<summary> — keeps native keyboard/screen-
 * reader behaviour (no JS state needed for open/close). Visual treatment
 * (glass background, border glow, the +/− marker) comes entirely from the
 * sitewide `.article details` rules in globals.css — every other guide's FAQ
 * already uses that class chain, so this only adds the scroll-reveal motion
 * on top instead of introducing a second, conflicting marker style.
 */
export function GuideFAQ({ items }: { items: GuideFAQItem[] }) {
  return (
    <div className="space-y-3">
      {items.map(({ q, a }, i) => (
        <motion.details
          key={q}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
        >
          <summary className="text-white font-medium cursor-pointer">{q}</summary>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
        </motion.details>
      ))}
    </div>
  );
}

/**
 * Bottom conversion block — glow-backed, matching the landing-page CTA
 * treatment. `children` is the button row so callers keep control of hrefs/labels.
 */
export function GuideCTA({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[#7B72F8]/25 p-8 text-center"
      style={{ background: 'rgba(123,114,248,0.06)' }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[240px] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(ellipse, rgba(123,114,248,0.22) 0%, transparent 70%)' }}
        />
      </div>
      <div className="relative">
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
        <p className="text-zinc-400 mb-6">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">{children}</div>
      </div>
    </motion.div>
  );
}
