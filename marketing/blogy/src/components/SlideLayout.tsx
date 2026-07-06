import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from './Logo';

interface SlideLayoutProps {
  current: number;
  total: number;
  footer?: 'swipe' | 'dots';
  children: React.ReactNode;
}

const Dots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === current - 1 ? 28 : 8,
          height: 8,
          borderRadius: 4,
          background: i === current - 1 ? '#A78BFA' : 'rgba(255,255,255,0.18)',
        }}
      />
    ))}
  </div>
);

export const SlideLayout: React.FC<SlideLayoutProps> = ({ current, total, footer = 'dots', children }) => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at 25% 20%, #1e0f3a 0%, #0c0918 50%, #040407 100%)',
      fontFamily: 'sans-serif',
    }}
  >
    {/* grain overlay */}
    <AbsoluteFill
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundSize: '200px 200px',
        opacity: 0.35,
      }}
    />

    {/* Logo top-left */}
    <div style={{ position: 'absolute', top: 60, left: 64 }}>
      <Logo size={36} />
    </div>

    {/* Counter pill top-right */}
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 64,
        padding: '10px 24px',
        borderRadius: 100,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: 22,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.04em',
      }}
    >
      {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </div>

    {/* Slot for slide content */}
    {children}

    {/* Footer */}
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 64,
        right: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: '#7C3AED' }}>wewatch.uz</div>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.28)' }}>
        by <span style={{ color: 'rgba(167,139,250,0.6)' }}>tezcode.dev</span>
      </div>
      {footer === 'swipe' ? (
        <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>Swipe →</div>
      ) : (
        <Dots total={total} current={current} />
      )}
    </div>
  </AbsoluteFill>
);
