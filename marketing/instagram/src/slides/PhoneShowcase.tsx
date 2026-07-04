import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={44} height={34} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: FONT }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PhoneShowcase — centered phone with headline, 1080×1920
// ═══════════════════════════════════════════════════════════════════════════════
export const PhoneShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn   = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 0 });
  const slideUp  = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 6 });
  const phoneIn  = spring({ frame, fps, config: { damping: 22, mass: 1.1 }, delay: 14 });

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 30% 0%, #1e0b3e 0%, #0d0720 50%, #030212 100%)',
      fontFamily: FONT,
      overflow: 'hidden',
      width: 1080,
      height: 1920,
    }}>
      {/* Glow top-left */}
      <div style={{
        position: 'absolute', top: -300, left: -300,
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Glow bottom-right */}
      <div style={{
        position: 'absolute', bottom: -200, right: -200,
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Grid lines (subtle) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(167,139,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Logo */}
      <div style={{
        position: 'absolute', top: 90, left: 80,
        opacity: fadeIn,
        transform: `translateY(${interpolate(fadeIn, [0, 1], [10, 0])}px)`,
      }}>
        <Logo />
      </div>

      {/* Headline */}
      <div style={{
        position: 'absolute', top: 220, left: 80, right: 80,
        opacity: slideUp,
        transform: `translateY(${interpolate(slideUp, [0, 1], [30, 0])}px)`,
      }}>
        {/* Label pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '10px 28px', borderRadius: 100,
          background: 'rgba(167,139,250,0.12)',
          border: '1.5px solid rgba(167,139,250,0.35)',
          fontSize: 24, fontWeight: 700,
          color: '#C4B5FD', letterSpacing: '0.1em',
          marginBottom: 32,
        }}>⚡ BOSHLASH OSON</div>

        <div style={{
          fontSize: 112, fontWeight: 900,
          color: '#fff', lineHeight: 0.96,
          letterSpacing: '-0.035em',
        }}>
          Kirish —
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #A78BFA, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>bir</span>
          <br />
          bosim.
        </div>

        <div style={{
          marginTop: 36,
          fontSize: 34, fontWeight: 400,
          color: 'rgba(255,255,255,0.38)',
          lineHeight: 1.5,
        }}>
          Google, Apple yoki Telegram —
          <br />
          1 soniyada tizimga kiring.
        </div>
      </div>

      {/* Phone image */}
      <div style={{
        position: 'absolute',
        bottom: 180,
        left: '50%',
        transform: `translateX(-50%) translateY(${interpolate(phoneIn, [0, 1], [60, 0])}px)`,
        opacity: phoneIn,
        width: 520,
        filter: 'drop-shadow(0 40px 80px rgba(124,58,237,0.45)) drop-shadow(0 0 120px rgba(124,58,237,0.2))',
      }}>
        <img
          src={staticFile('screen-login-real.png')}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 70, left: 80, right: 80,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: fadeIn,
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>
          wewatch.uz
        </div>
        <div style={{
          fontSize: 22, color: 'rgba(255,255,255,0.18)', fontWeight: 500,
        }}>by tezcode.dev</div>
      </div>
    </AbsoluteFill>
  );
};
