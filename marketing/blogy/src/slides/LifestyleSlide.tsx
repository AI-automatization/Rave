import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ─── Reusable lifestyle layout ───────────────────────────────────────────────
const LifestyleBase: React.FC<{
  photo: string;
  pill: string;
  title: React.ReactNode;
  subtitle: string;
}> = ({ photo, pill, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 0 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.85 }, delay: 8 });
  const subIn   = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 18 });

  return (
    <AbsoluteFill style={{ width: 1080, height: 1080, fontFamily: FONT, overflow: 'hidden' }}>
      {/* Photo — cropped to square, focus on top where phone is */}
      <img src={staticFile(photo)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      {/* Gradient: strong top for text, subtle bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,3,22,0.92) 0%, rgba(8,3,22,0.6) 28%, rgba(8,3,22,0.0) 55%)' }} />

      {/* Logo — top left */}
      <div style={{ position: 'absolute', top: 52, left: 52, display: 'flex', alignItems: 'center', gap: 12, opacity: fadeIn, transform: `translateY(${interpolate(fadeIn, [0, 1], [8, 0])}px)` }}>
        <svg width={36} height={28} viewBox="0 0 52 40" fill="none">
          <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>we<span style={{ color: '#A78BFA' }}>Watch</span></span>
      </div>

      {/* Text — top center */}
      <div style={{ position: 'absolute', top: 140, left: 52, right: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Pill */}
        <div style={{ opacity: fadeIn, transform: `translateY(${interpolate(fadeIn, [0, 1], [10, 0])}px)`, display: 'inline-flex', alignItems: 'center', padding: '10px 26px', borderRadius: 100, background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.38)', fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.08em', marginBottom: 24 }}>
          {pill}
        </div>
        {/* Title */}
        <div style={{ opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`, fontSize: 96, fontWeight: 900, lineHeight: 0.94, letterSpacing: '-0.035em', textAlign: 'center' }}>
          {title}
        </div>
      </div>

      {/* Bottom — wewatch.uz */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontSize: 24, fontWeight: 700, color: 'rgba(167,139,250,0.65)' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export const LifestyleSlide: React.FC = () => (
  <LifestyleBase
    photo="hands-home.jpg"
    pill="02 — VIDEO TANLANG"
    title={<><span style={{ color: '#fff' }}>Istalgan</span><br /><span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>video.</span></>}
    subtitle=""
  />
);

export const LifestyleWatchParty: React.FC = () => (
  <LifestyleBase
    photo="hands-watchparty.jpg"
    pill="03 — BIRGA TOMOSHA"
    title={<><span style={{ color: '#fff' }}>Birga</span><br /><span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>his eting.</span></>}
    subtitle=""
  />
);

export const LifestyleLogin: React.FC = () => (
  <LifestyleBase
    photo="hands-login.jpg"
    pill="01 — RO'YXATDAN O'TING"
    title={<><span style={{ color: '#fff' }}>Bir bosimda</span><br /><span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>boshlang.</span></>}
    subtitle=""
  />
);
