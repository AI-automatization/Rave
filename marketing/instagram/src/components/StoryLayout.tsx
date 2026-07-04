import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Logo } from './Logo';

// ─── Shared story primitives ──────────────────────────────────

export const StoryBg: React.FC<{ frame: number; hue?: string }> = ({ frame, hue = '265' }) => {
  const x = 28 + 7 * Math.sin(frame * 0.005);
  const y = 22 + 6 * Math.cos(frame * 0.004);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${x}% ${y}%, hsl(${hue},64%,13%) 0%, hsl(${hue},48%,5%) 52%, #020108 100%)`,
    }}>
      <AbsoluteFill style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        backgroundSize: '256px',
      }} />
    </AbsoluteFill>
  );
};

export const StoryParticles: React.FC<{ frame: number; tint?: string; count?: number }> = ({
  frame, tint = '#A78BFA', count = 20,
}) => {
  const pts = Array.from({ length: count }, (_, i) => ({
    x: (i * 137.508) % 100, baseY: (i * 79.371) % 100,
    speed: 0.014 + (i % 5) * 0.007, size: 1.1 + (i % 3) * 1.0,
    op: 0.02 + (i % 4) * 0.022, ph: (i * 1.618) % (2 * Math.PI),
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        {pts.map((p, i) => {
          const y = ((p.baseY - frame * p.speed) + 300) % 100;
          const x = p.x + Math.sin(frame * 0.013 + p.ph) * 1.4;
          const op = p.op * (0.5 + 0.5 * Math.sin(frame * 0.022 + p.ph));
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={p.size} fill={tint} opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const StoryGlow: React.FC<{
  frame: number; x?: string; y?: string; color?: string; size?: number;
}> = ({ frame, x = '50%', y = '50%', color = 'rgba(124,58,237,0.28)', size = 900 }) => {
  const b = 0.55 + 0.35 * Math.sin(frame * 0.022);
  const s = 0.94 + 0.06 * Math.sin(frame * 0.016);
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
      width: size, height: size,
      left: `calc(${x} - ${size / 2}px)`, top: `calc(${y} - ${size / 2}px)`,
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      opacity: b, transform: `scale(${s})`,
    }} />
  );
};

export const StoryScanLine: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0,
    top: ((frame * 1.1) % 2400) - 150, height: 200, pointerEvents: 'none',
    background: 'linear-gradient(180deg, transparent, rgba(167,139,250,0.016), transparent)',
  }} />
);

export const sp = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 22, mass: 0.9, stiffness: 100 }, delay });

export const spPop = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 11, mass: 0.75, stiffness: 220 }, delay });

// ─── Base story layout: progress bars + logo + footer ─────────

interface StoryLayoutProps {
  storyNum: number;
  totalStories: number;
  showLogo?: boolean;
  children: React.ReactNode;
}

export const StoryLayout: React.FC<StoryLayoutProps> = ({
  storyNum, totalStories, showLogo = true, children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 6));
  const logoIn = Math.min(1, frame / 14);

  return (
    <AbsoluteFill style={{ fontFamily: 'sans-serif', background: '#020108', whiteSpace: 'pre-line' }}>
      {/* Instagram-style progress bars */}
      <div style={{
        position: 'absolute', top: 52, left: 28, right: 28,
        display: 'flex', gap: 5, zIndex: 30,
      }}>
        {Array.from({ length: totalStories }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: 'rgba(255,255,255,0.22)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'rgba(255,255,255,0.9)',
              width: i < storyNum - 1 ? '100%'
                   : i === storyNum - 1 ? `${progress * 100}%`
                   : '0%',
            }} />
          </div>
        ))}
      </div>

      {showLogo && (
        <div style={{ position: 'absolute', top: 74, left: 36, opacity: logoIn, zIndex: 30 }}>
          <Logo size={30} />
        </div>
      )}

      {/* Footer branding */}
      <div style={{
        position: 'absolute', bottom: 96, left: 0, right: 0,
        textAlign: 'center', fontSize: 24, color: 'rgba(255,255,255,0.32)',
        fontWeight: 600, letterSpacing: '0.05em', zIndex: 30,
      }}>
        @wewatch.uz
      </div>

      {children}
    </AbsoluteFill>
  );
};
