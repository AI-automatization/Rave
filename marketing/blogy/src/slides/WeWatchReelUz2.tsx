import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Logo } from '../components/Logo';

const FPS = 30;
// 15s reel — "WeWatch nima?"
const P = {
  hook:     [0,        3  * FPS],  // 0–90   "Filmni yolg'iz ko'rasanmi?"
  solution: [3  * FPS, 7  * FPS],  // 90–210  WeWatch + tagline
  feats:    [7  * FPS, 12 * FPS],  // 210–360 3 ta funksiya
  cta:      [12 * FPS, 15 * FPS],  // 360–450 wewatch.uz
};
export const REEL_UZ2_DURATION = 15 * FPS;

const sp = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 18, mass: 0.8, stiffness: 160 }, delay });

const WORDS = ["Filmni", "yolg'iz", "ko'rasanmi?"];

const FEATS = [
  { icon: '🎬', text: 'Bir vaqtda tomosha' },
  { icon: '🔁', text: 'Avtomatik sinxron' },
  { icon: '💬', text: 'Chat + ovozli' },
];

export const WeWatchReelUz2: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();

  const inSolution = f >= P.solution[0];
  const inFeats    = f >= P.feats[0];
  const inCta      = f >= P.cta[0];

  return (
    <AbsoluteFill style={{
      background: '#0a0014',
      fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
      }} />

      {/* HOOK */}
      {!inSolution && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {WORDS.map((word, i) => {
            const wordStart = (P.hook[1] - P.hook[0]) * (i / WORDS.length);
            const sc = sp(f - wordStart, fps);
            return (
              <div key={i} style={{
                fontSize: 140, color: i === 2 ? '#c4b5fd' : '#fff',
                lineHeight: 1,
                opacity: Math.min(1, Math.max(0, (f - wordStart) / 8)),
                transform: `scale(${0.6 + sc * 0.4}) translateY(${(1 - sc) * 40}px)`,
                textShadow: '0 0 40px rgba(139,92,246,0.5)',
              }}>
                {word}
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* SOLUTION */}
      {inSolution && !inFeats && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36 }}>
          <div style={{
            opacity: sp(f - P.solution[0], fps),
            transform: `scale(${0.7 + sp(f - P.solution[0], fps) * 0.3})`,
          }}>
            <Logo size={60} />
          </div>
          <div style={{
            fontSize: 52, color: '#c4b5fd', letterSpacing: 5, textAlign: 'center',
            opacity: sp(f - P.solution[0] - 12, fps),
            transform: `translateY(${(1 - sp(f - P.solution[0] - 12, fps)) * 30}px)`,
          }}>
            DO'STLAR BILAN BIRGA KINO
          </div>
          <div style={{
            fontSize: 32, color: 'rgba(196,181,253,0.6)', letterSpacing: 3,
            opacity: sp(f - P.solution[0] - 25, fps),
          }}>
            YouTube · Rutube · VK · MP4
          </div>
        </AbsoluteFill>
      )}

      {/* FEATURES */}
      {inFeats && !inCta && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '0 80px' }}>
          <div style={{
            fontSize: 38, color: 'rgba(196,181,253,0.5)', letterSpacing: 4, marginBottom: 16,
            opacity: sp(f - P.feats[0], fps),
          }}>
            NIMA BERADI?
          </div>
          {FEATS.map((feat, i) => {
            const delay = i * 18;
            const sc = sp(f - P.feats[0] - delay, fps);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 28,
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 20, padding: '24px 48px',
                width: '100%',
                opacity: Math.min(1, Math.max(0, sc)),
                transform: `translateX(${(1 - sc) * -60}px)`,
              }}>
                <span style={{ fontSize: 56 }}>{feat.icon}</span>
                <span style={{ fontSize: 48, color: '#fff', letterSpacing: 2 }}>{feat.text}</span>
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* CTA */}
      {inCta && (
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          {/* Rings */}
          {[1, 0.65, 0.35].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 500 * s, height: 500 * s, borderRadius: '50%',
              border: `${2 - i * 0.5}px solid rgba(139,92,246,${0.15 + i * 0.08})`,
              opacity: interpolate(f - P.cta[0], [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
            }} />
          ))}
          <div style={{
            fontSize: 38, color: 'rgba(196,181,253,0.7)', letterSpacing: 4,
            opacity: sp(f - P.cta[0], fps),
          }}>
            BEPUL YUKLAB OL
          </div>
          <div style={{
            fontSize: 80, color: '#fff', letterSpacing: 3,
            opacity: sp(f - P.cta[0] - 8, fps),
            transform: `scale(${0.8 + sp(f - P.cta[0] - 8, fps) * 0.2})`,
            textShadow: '0 0 60px rgba(139,92,246,0.8)',
          }}>
            WEWATCH.UZ
          </div>
          <div style={{
            fontSize: 30, color: '#c4b5fd', letterSpacing: 6,
            opacity: sp(f - P.cta[0] - 20, fps),
          }}>
            DO'STINGNI HAM TAKLIF QIL 👥
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
