import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { Logo } from '../components/Logo';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, config: { damping: 22, mass: 1, stiffness: 100 }, delay });

export const W1Quote: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(145deg, #0a0014 0%, #150025 50%, #0a0014 100%)',
      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
      overflow: 'hidden',
    }}>
      {/* glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
      }} />

      {/* top quote mark */}
      <div style={{
        position: 'absolute', top: 80, left: 80,
        fontSize: 220, color: 'rgba(139,92,246,0.2)', lineHeight: 1,
        fontFamily: 'Georgia, serif',
      }}>
        "
      </div>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 100px', gap: 48,
      }}>
        {/* quote line 1 */}
        <div style={{
          fontSize: 76, color: '#fff', textAlign: 'center', lineHeight: 1.1,
          opacity: sp(f, 0), transform: `translateY(${(1 - sp(f, 0)) * 30}px)`,
        }}>
          КИНО — ЭТО НЕ ТО,
        </div>
        <div style={{
          fontSize: 76, color: '#c4b5fd', textAlign: 'center', lineHeight: 1.1,
          opacity: sp(f, 8), transform: `translateY(${(1 - sp(f, 8)) * 30}px)`,
        }}>
          ЧТО ТЫ СМОТРИШЬ.
        </div>
        <div style={{
          fontSize: 76, color: '#fff', textAlign: 'center', lineHeight: 1.1,
          opacity: sp(f, 16), transform: `translateY(${(1 - sp(f, 16)) * 30}px)`,
        }}>
          ЭТО С КЕМ
        </div>
        <div style={{
          fontSize: 96, color: '#a78bfa', textAlign: 'center', lineHeight: 1.1,
          opacity: sp(f, 22), transform: `scale(${0.85 + sp(f, 22) * 0.15})`,
          textShadow: '0 0 40px rgba(167,139,250,0.5)',
        }}>
          ТЫ СМОТРИШЬ.
        </div>

        {/* divider */}
        <div style={{
          width: 200, height: 2, background: 'rgba(139,92,246,0.5)',
          opacity: sp(f, 28),
        }} />

        {/* logo */}
        <div style={{ opacity: sp(f, 32) }}>
          <Logo size={32} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
