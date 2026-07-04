import React from 'react';
import { AbsoluteFill } from 'remotion';

export const ReelCover: React.FC = () => {
  return (
    <AbsoluteFill style={{
      background: '#03020a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 900, height: 900, top: -200, left: -200,
        background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: 700, height: 700, bottom: 100, right: -200,
        background: 'radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%)',
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Top logo */}
      <div style={{
        position: 'absolute', top: 72, left: 72,
        fontSize: 44, fontWeight: 900, letterSpacing: '-0.02em',
        color: 'rgba(255,255,255,0.9)',
      }}>
        <span style={{ color: '#A78BFA' }}>W</span>eWatch
      </div>

      {/* Center content */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 80px', textAlign: 'center',
      }}>
        {/* Emoji */}
        <div style={{
          fontSize: 140, marginBottom: 32,
          filter: 'drop-shadow(0 0 32px rgba(167,139,250,0.5))',
        }}>🎬</div>

        {/* Tag */}
        <div style={{
          display: 'inline-flex', padding: '14px 36px', borderRadius: 100,
          border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.18)',
          fontSize: 30, fontWeight: 700, color: 'rgba(167,139,250,0.9)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          marginBottom: 40,
        }}>TEZ KUNDA</div>

        {/* Main text */}
        <div style={{
          fontSize: 128, fontWeight: 900, lineHeight: 0.96,
          letterSpacing: '-0.04em', marginBottom: 32,
        }}>
          <div style={{ color: '#fff' }}>Do'sting</div>
          <div style={{
            color: '#A78BFA',
            filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.45))',
          }}>boshqa</div>
          <div style={{ color: '#fff' }}>shaharda?</div>
        </div>

        {/* Sub */}
        <div style={{
          fontSize: 38, color: 'rgba(255,255,255,0.45)',
          fontWeight: 500, lineHeight: 1.5,
        }}>
          Birga kino ko'rish mumkin.
        </div>
      </AbsoluteFill>

      {/* Bottom URL */}
      <div style={{
        position: 'absolute', bottom: 90, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          padding: '16px 48px', borderRadius: 100,
          background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(167,139,250,0.3)',
          fontSize: 34, fontWeight: 700, color: '#A78BFA',
          letterSpacing: '0.04em',
        }}>wewatch.uz</div>
      </div>
    </AbsoluteFill>
  );
};
