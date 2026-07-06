import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const HayitSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const moonIn   = spring({ frame, fps, config: { damping: 26, mass: 0.8 }, delay: 2 });
  const logoIn   = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 10 });
  const line1In  = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 18 });
  const line2In  = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 26 });
  const subIn    = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 34 });
  const urlIn    = spring({ frame, fps, config: { damping: 22, mass: 0.9 }, delay: 44 });

  // Slow breathe on glow
  const glowScale   = 1 + Math.sin(frame * 0.06) * 0.08;
  const starsFloat  = Math.sin(frame * 0.04) * 6;

  return (
    <AbsoluteFill style={{
      width: 1080, height: 1080,
      fontFamily: FONT,
      background: 'radial-gradient(ellipse at 50% 20%, #1e0d4e 0%, #0e0525 45%, #030212 100%)',
      overflow: 'hidden',
    }}>
      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(167,139,250,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.02) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

      {/* Pulsing glow orb */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%',
        transform: `translateX(-50%) scale(${glowScale})`,
        width: 900, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Gold warm glow — festive feel */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Crescent moon — top center */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: moonIn,
        transform: `translateY(${interpolate(moonIn, [0,1], [-20, 0])}px) translateY(${starsFloat}px)`,
      }}>
        <svg width={120} height={120} viewBox="0 0 120 120" fill="none">
          {/* Crescent */}
          <path
            d="M 60 10 A 50 50 0 1 0 60 110 A 35 35 0 1 1 60 10 Z"
            fill="url(#moonGrad)"
          />
          {/* Star */}
          <polygon
            points="85,28 88,38 98,38 90,44 93,54 85,48 77,54 80,44 72,38 82,38"
            fill="url(#moonGrad)"
            opacity={0.9}
          />
          <defs>
            <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo — below moon */}
      <div style={{
        position: 'absolute', top: 210, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
        opacity: logoIn,
        transform: `translateY(${interpolate(logoIn, [0,1], [14, 0])}px)`,
      }}>
        <img src={staticFile('logo.svg')} style={{ width: 44, height: 44, borderRadius: 8 }} />
        <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          we<span style={{ color: '#A78BFA' }}>Watch</span>
        </span>
      </div>

      {/* Main text — center */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 80,
      }}>
        {/* Pill */}
        <div style={{
          opacity: line1In,
          transform: `translateY(${interpolate(line1In, [0,1], [16, 0])}px)`,
          display: 'inline-flex', padding: '10px 28px', borderRadius: 100,
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
          fontSize: 20, fontWeight: 700, color: '#FDE68A', letterSpacing: '0.1em',
          marginBottom: 28,
        }}>
          MUBORAK BO'LSIN
        </div>

        {/* Qurbon Hayit */}
        <div style={{
          opacity: line1In,
          transform: `translateY(${interpolate(line1In, [0,1], [20, 0])}px)`,
          fontSize: 96, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.035em', textAlign: 'center',
          background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #FDE68A 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          Qurbon
        </div>
        <div style={{
          opacity: line2In,
          transform: `translateY(${interpolate(line2In, [0,1], [20, 0])}px)`,
          fontSize: 96, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.035em', textAlign: 'center',
          color: '#fff',
          marginBottom: 40,
        }}>
          Hayiti
        </div>

        {/* Subtitle */}
        <div style={{
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0,1], [16, 0])}px)`,
          fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.5)',
          textAlign: 'center', lineHeight: 1.5, maxWidth: 680,
        }}>
          Barcha oilangizga tinchlik, baxt va baraka tilaymiz 🤲
        </div>
      </div>

      {/* Bottom — wewatch.uz */}
      <div style={{
        position: 'absolute', bottom: 52, left: 0, right: 0,
        textAlign: 'center',
        opacity: urlIn,
        transform: `translateY(${interpolate(urlIn, [0,1], [12, 0])}px)`,
        fontSize: 24, fontWeight: 700, color: 'rgba(167,139,250,0.6)',
      }}>
        wewatch.uz
      </div>
    </AbsoluteFill>
  );
};
