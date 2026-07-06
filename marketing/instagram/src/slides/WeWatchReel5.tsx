import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { Logo } from '../components/Logo';

const FPS = 30;
// 15s hook reel — "Смотришь фильм один?"
const P = {
  hook:     [0,        3  * FPS],  // 0–90   "Смотришь фильм один?"
  solution: [3  * FPS, 7  * FPS],  // 90–210  WeWatch logo + tagline
  feats:    [7  * FPS, 12 * FPS],  // 210–360 3 фичи
  cta:      [12 * FPS, 15 * FPS],  // 360–450 wewatch.uz
};
export const REEL5_DURATION = 15 * FPS;

const sp = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 18, mass: 0.8, stiffness: 160 }, delay });

const WORDS = ['Смотришь', 'фильм', 'один?'];
const FEATS = [
  { icon: '🔁', text: 'Синхронизация' },
  { icon: '💬', text: 'Голосовой чат' },
  { icon: '⚔️', text: 'Батлы' },
];

export const WeWatchReel5: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();

  const hookProgress = f / (P.hook[1] - P.hook[0]);
  const inSolution   = f >= P.solution[0];
  const inFeats      = f >= P.feats[0];
  const inCta        = f >= P.cta[0];

  return (
    <AbsoluteFill style={{ background: '#0a0014', fontFamily: "'Bebas Neue', 'Arial Black', sans-serif", overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
      }} />

      {/* HOOK phase */}
      {!inSolution && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {WORDS.map((word, i) => {
            const wordStart = (P.hook[1] - P.hook[0]) * (i / WORDS.length);
            const sc = sp(f - wordStart, fps);
            return (
              <div key={i} style={{
                fontSize: 148, color: '#fff', lineHeight: 1,
                opacity: Math.min(1, Math.max(0, (f - wordStart) / 8)),
                transform: `scale(${0.6 + sc * 0.4}) translateY(${(1 - sc) * 40}px)`,
                textShadow: '0 0 40px rgba(139,92,246,0.6)',
              }}>
                {word}
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* SOLUTION phase */}
      {inSolution && !inFeats && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <div style={{
            opacity: sp(f - P.solution[0], fps),
            transform: `scale(${0.7 + sp(f - P.solution[0], fps) * 0.3})`,
          }}>
            <Logo size={56} />
          </div>
          <div style={{
            fontSize: 56, color: '#c4b5fd', letterSpacing: 4,
            opacity: sp(f - P.solution[0] - 15, fps),
          }}>
            СМОТРИ КИНО ВМЕСТЕ
          </div>
        </AbsoluteFill>
      )}

      {/* FEATURES phase */}
      {inFeats && !inCta && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <div style={{ fontSize: 52, color: '#9d7fff', marginBottom: 8 }}>Почему WeWatch?</div>
          {FEATS.map((feat, i) => {
            const sc = sp(f - P.feats[0] - i * 18, fps);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 24,
                background: 'rgba(139,92,246,0.15)', borderRadius: 20,
                padding: '22px 48px', width: 700,
                border: '1px solid rgba(139,92,246,0.3)',
                opacity: sc, transform: `translateX(${(1 - sc) * -60}px)`,
              }}>
                <span style={{ fontSize: 56 }}>{feat.icon}</span>
                <span style={{ fontSize: 64, color: '#fff' }}>{feat.text}</span>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* CTA phase */}
      {inCta && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{
            fontSize: 96, color: '#fff',
            opacity: sp(f - P.cta[0], fps),
            transform: `scale(${0.8 + sp(f - P.cta[0], fps) * 0.2})`,
          }}>
            СКАЧАЙ БЕСПЛАТНО
          </div>
          <div style={{
            fontSize: 72, color: '#a78bfa', letterSpacing: 6,
            opacity: sp(f - P.cta[0] - 10, fps),
          }}>
            wewatch.uz
          </div>
        </AbsoluteFill>
      )}

      {/* Corner logo */}
      {f > 20 && (
        <div style={{ position: 'absolute', top: 60, right: 50, opacity: 0.7 }}>
          <Logo size={20} />
        </div>
      )}
    </AbsoluteFill>
  );
};
