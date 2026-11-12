'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PlayCircle, Mic2, Swords } from 'lucide-react';
import { WIcon } from '@/components/common/WeWatchLogo';

// A stack of 4 avatars + a live "in sync" pill — the same room-presence visual language the
// actual watch-party UI uses (FloatingNav/RoomHeader), just built as a static mockup so the
// panel shows a concrete room rather than an abstract illustration.
const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706'];

function RoomPreviewCard() {
  return (
    <div className="liquid-glass-sm w-full max-w-[300px] p-4 flex flex-col gap-3">
      <div className="relative aspect-video rounded-xl bg-gradient-to-br from-violet-900/40 to-black overflow-hidden flex items-center justify-center">
        <PlayCircle size={36} className="text-white/70" />
        <span className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          В прямом эфире
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {AVATAR_COLORS.map((c, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full ring-2 ring-[#0e0a20] flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: c }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-[11px] text-white/50">4 смотрят вместе</span>
      </div>
    </div>
  );
}

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  const features = [
    { icon: PlayCircle, label: t('authPanelFeature1') },
    { icon: Mic2, label: t('authPanelFeature2') },
    { icon: Swords, label: t('authPanelFeature3') },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#06050E]">
      {/* Left — brand/visual panel. Full-bleed on desktop (not a floating card in empty space),
          hidden on small screens so the form stays the priority there (ui-ux-pro-max: mobile
          content-first). This is the actual "full redesign" — a split-screen composition, not a
          repositioned version of the old single centered card. */}
      <div
        className="hidden md:flex md:w-[46%] lg:w-1/2 relative flex-col justify-between px-12 lg:px-16 py-12 overflow-hidden shrink-0"
        style={{
          background: [
            'radial-gradient(ellipse 90% 70% at 20% 10%, rgba(124,58,237,0.55) 0%, rgba(88,28,180,0.25) 45%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 90% 90%, rgba(34,211,238,0.20) 0%, transparent 60%)',
            '#0A0714',
          ].join(', '),
        }}
      >
        <Link href="/" className="flex items-center gap-2 relative z-10" aria-label="WeWatch">
          <WIcon size={30} />
          <span className="font-bold text-[18px] tracking-tight text-white">
            We<span style={{ color: '#A78BFA' }}>Watch</span>
          </span>
        </Link>

        <div className="relative z-10 flex flex-col gap-8 max-w-[440px]">
          <div className="flex flex-col gap-4">
            <h1 className="text-[34px] lg:text-[40px] font-bold text-white leading-[1.12] tracking-tight whitespace-pre-line">
              {t('authPanelHeadline')}
            </h1>
            <p className="text-[15px] text-white/55 leading-relaxed">
              {t('authPanelSub')}
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-violet-300" />
                </div>
                <span className="text-[13px] text-white/70">{label}</span>
              </div>
            ))}
          </div>

          <RoomPreviewCard />
        </div>

        <span className="relative z-10 text-[11px] text-white/25">© {new Date().getFullYear()} WeWatch</span>
      </div>

      {/* Right — the form itself, directly on the page background (no floating card wrapper —
          the whole right half already reads as "the form's space", a card inside it would just
          be a box inside a box). Generous max-width and padding instead of the old cramped
          400px column. */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-10 relative">
        {/* Mobile-only logo (desktop shows it in the left panel instead) */}
        <Link href="/" className="md:hidden flex items-center gap-2 mb-8" aria-label="WeWatch">
          <WIcon size={28} />
          <span className="font-bold text-[17px] tracking-tight text-white">
            We<span style={{ color: '#7C3AED' }}>Watch</span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
