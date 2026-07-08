import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s0 = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 0 });
  const s1 = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 10 });
  const s2 = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 22 });
  const s3 = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 34 });
  const s4 = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 46 });

  const steps = [
    { num: '01', text: 'Ro\'yxatdan o\'ting', sub: 'Google, Apple yoki Telegram' },
    { num: '02', text: 'Video tanlang',      sub: 'YouTube, VK, Rutube...' },
    { num: '03', text: 'Birga tomosha',      sub: 'Real vaqtda sinxron + chat' },
  ];
  const springs = [s2, s3, s4];

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% -10%, #2a1060 0%, #0e0525 45%, #030212 100%)',
      fontFamily: FONT, width: 1080, height: 1080, overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(167,139,250,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.025) 1px, transparent 1px)', backgroundSize: '90px 90px' }} />

      {/* Glow */}
      <div style={{ position: 'absolute', top: -300, left: '50%', transform: 'translateX(-50%)', width: 900, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: s0, transform: `translateY(${interpolate(s0, [0,1], [10,0])}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width={48} height={37} viewBox="0 0 52 40" fill="none">
            <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>we<span style={{ color: '#A78BFA' }}>Watch</span></span>
        </div>
      </div>

      {/* Main title */}
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', opacity: s1, transform: `translateY(${interpolate(s1, [0,1], [20,0])}px)` }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.1em', marginBottom: 12 }}>QANDAY ISHLAYDI?</div>
        <div style={{ fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 0.94, letterSpacing: '-0.035em' }}>
          3 ta<br /><span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>qadam.</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ position: 'absolute', top: 380, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            opacity: springs[i],
            transform: `translateX(${interpolate(springs[i], [0,1], [-30,0])}px)`,
            display: 'flex', alignItems: 'center', gap: 28,
            padding: '28px 36px', borderRadius: 22,
            background: 'rgba(124,58,237,0.1)',
            border: '1.5px solid rgba(167,139,250,0.2)',
          }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#A78BFA', opacity: 0.5, letterSpacing: '-0.04em', minWidth: 60 }}>{step.num}</div>
            <div style={{ width: 2, height: 48, background: 'rgba(167,139,250,0.25)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{step.text}</div>
              <div style={{ fontSize: 24, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontSize: 24, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};
