import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const W = 1080;
const H = 1920;

// ─── Shared background ────────────────────────────────────────────────────────
const Bg: React.FC<{ children: React.ReactNode; glowColor?: string }> = ({
  children,
  glowColor = 'rgba(124,58,237,0.28)',
}) => (
  <AbsoluteFill style={{
    background: 'radial-gradient(ellipse at 50% -10%, #2a1060 0%, #0e0525 45%, #030212 100%)',
    fontFamily: FONT,
    width: W,
    height: H,
    overflow: 'hidden',
  }}>
    {/* Top glow */}
    <div style={{
      position: 'absolute', top: -250, left: '50%', transform: 'translateX(-50%)',
      width: 900, height: 700, borderRadius: '50%',
      background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    {/* Subtle grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'linear-gradient(rgba(167,139,250,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.025) 1px, transparent 1px)',
      backgroundSize: '90px 90px',
      pointerEvents: 'none',
    }} />
    {children}
  </AbsoluteFill>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────
const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <svg width={48} height={37} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

// ─── Pill label ───────────────────────────────────────────────────────────────
const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '12px 32px', borderRadius: 100,
    background: 'rgba(167,139,250,0.13)',
    border: '1.5px solid rgba(167,139,250,0.38)',
    fontSize: 26, fontWeight: 700, color: '#C4B5FD',
    letterSpacing: '0.08em', marginBottom: 40,
  }}>{text}</div>
);

// ─── Phone image (transparent bg PNG, with glow) ──────────────────────────────
const Phone: React.FC<{
  src: string;
  opacity: number;
  translateY: number;
  width?: number;
}> = ({ src, opacity, translateY, width = 720 }) => (
  <div style={{
    position: 'absolute',
    bottom: -420,
    left: '50%',
    transform: `translateX(-50%) translateY(${translateY}px)`,
    opacity,
    width,
    filter: 'drop-shadow(0 -30px 100px rgba(124,58,237,0.55))',
  }}>
    <img src={staticFile(src)} style={{ width: '100%', height: 'auto', display: 'block' }} />
  </div>
);

// ─── Shared slide layout ──────────────────────────────────────────────────────
const Slide: React.FC<{
  pill: string;
  title: React.ReactNode;
  subtitle: string;
  phoneSrc: string;
  phoneWidth?: number;
  glowColor?: string;
}> = ({ pill, title, subtitle, phoneSrc, phoneWidth, glowColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 0 });
  const titleIn  = spring({ frame, fps, config: { damping: 18, mass: 0.85 }, delay: 8 });
  const subIn    = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 18 });
  const phoneIn  = spring({ frame, fps, config: { damping: 22, mass: 1.0 }, delay: 12 });

  return (
    <Bg glowColor={glowColor}>
      {/* Logo — centered */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: headerIn,
        transform: `translateY(${interpolate(headerIn, [0, 1], [10, 0])}px)`,
      }}>
        <Logo />
      </div>

      {/* Top text block — centered, compact */}
      <div style={{
        position: 'absolute', top: 190, left: 60, right: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Pill */}
        <div style={{
          opacity: headerIn,
          transform: `translateY(${interpolate(headerIn, [0, 1], [12, 0])}px)`,
        }}>
          <Pill text={pill} />
        </div>

        {/* Title — 2 lines max */}
        <div style={{
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
          fontSize: 104,
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 0.94,
          letterSpacing: '-0.035em',
          marginBottom: 28,
          textAlign: 'center',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`,
          fontSize: 30,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.36)',
          lineHeight: 1.4,
          textAlign: 'center',
        }}>
          {subtitle}
        </div>
      </div>

      {/* Phone */}
      <Phone
        src={phoneSrc}
        opacity={phoneIn}
        translateY={interpolate(phoneIn, [0, 1], [80, 0])}
        width={phoneWidth}
      />

      {/* Bottom URL — centered */}
      <div style={{
        position: 'absolute', bottom: 56, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 28, fontWeight: 700,
        color: 'rgba(167,139,250,0.55)',
        zIndex: 10,
      }}>
        wewatch.uz
      </div>
    </Bg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Home / Browse
// ═══════════════════════════════════════════════════════════════════════════════
export const PS1Home: React.FC = () => (
  <Slide
    pill="🎬 FAOL KOMNATALAR"
    title={<>Do'stlar<br /><span style={{ color: '#A78BFA' }}>bilan birga.</span></>}
    subtitle="Hozir kimdir tomosha qilyapti — qo'shiling!"
    phoneSrc="screen-home-nobg.png"
    phoneWidth={720}
    glowColor="rgba(124,58,237,0.3)"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — WatchParty / Live Chat
// ═══════════════════════════════════════════════════════════════════════════════
export const PS2WatchParty: React.FC = () => (
  <Slide
    pill="💬 JONLI CHAT"
    title={<>Birga<br /><span style={{ color: '#A78BFA' }}>his eting.</span></>}
    subtitle="Tomosha qilayotganda real vaqtda fikr almashin."
    phoneSrc="screen-watchparty-nobg.png"
    phoneWidth={720}
    glowColor="rgba(220,38,38,0.18)"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Profile / Achievements
// ═══════════════════════════════════════════════════════════════════════════════
export const PS3Profile: React.FC = () => (
  <Slide
    pill="👤 SHAXSIY PROFIL"
    title={<>Tarix va<br /><span style={{ color: '#A78BFA' }}>sozlamalar.</span></>}
    subtitle="Ko'rish tarixi, obunalar va hisob sozlamalari."
    phoneSrc="screen-profile-nobg.png"
    phoneWidth={720}
    glowColor="rgba(124,58,237,0.28)"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Login / Onboarding
// ═══════════════════════════════════════════════════════════════════════════════
export const PS4Login: React.FC = () => (
  <Slide
    pill="⚡ KIRISH OSON"
    title={<>Bir bosimda<br /><span style={{ color: '#A78BFA' }}>boshlang.</span></>}
    subtitle="Google, Apple yoki Telegram — 10 soniyada."
    phoneSrc="screen-login-nobg.png"
    phoneWidth={720}
    glowColor="rgba(124,58,237,0.26)"
  />
);
