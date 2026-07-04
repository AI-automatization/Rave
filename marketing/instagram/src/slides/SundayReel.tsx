import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, staticFile, Img } from 'remotion';

const sp = (f: number, delay = 0, damping = 16) =>
  spring({ frame: f, fps: 30, config: { damping, mass: 1, stiffness: 100 }, delay });

const fade = (f: number, inAt: number, outAt: number, dur = 8) =>
  interpolate(f, [inAt, inAt + dur, outAt - dur, outAt], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const BG    = '#070010';
const DIM   = 'rgba(0,0,0,0.72)';
const WHITE = '#ffffff';
const MUTED = 'rgba(255,255,255,0.55)';
const PURPLE = '#9b7ff4';

// subtle floating particles
const Particles: React.FC<{ frame: number }> = ({ frame: f }) => {
  const pts = [
    { x: 12, y: 18, r: 3, s: 0.3 }, { x: 88, y: 12, r: 4, s: 0.25 },
    { x: 8,  y: 55, r: 2, s: 0.4 }, { x: 92, y: 60, r: 3, s: 0.35 },
    { x: 50, y: 6,  r: 4, s: 0.28 }, { x: 22, y: 88, r: 3, s: 0.32 },
    { x: 78, y: 85, r: 2, s: 0.38 },
  ];
  return (
    <>
      {pts.map((p, i) => {
        const fy = Math.sin(((f + i * 18) / 30) * Math.PI * p.s) * 10;
        const op = 0.15 + Math.sin(((f + i * 12) / 30) * Math.PI * 0.4) * 0.1;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.r * 2, height: p.r * 2, borderRadius: '50%',
            background: PURPLE, opacity: op,
            transform: `translate(-50%, calc(-50% + ${fy}px))`,
          }} />
        );
      })}
    </>
  );
};

// one line of text — fades in, stays, fades out
const Line: React.FC<{
  text: string; frame: number; inAt: number; outAt: number;
  size?: number; color?: string; weight?: number; letterSpacing?: number;
}> = ({ text, frame, inAt, outAt, size = 72, color = WHITE, weight = 700, letterSpacing = 0 }) => {
  const op = fade(frame, inAt, outAt, 10);
  const y  = interpolate(frame, [inAt, inAt + 14], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      fontSize: size, color, fontWeight: weight,
      letterSpacing, lineHeight: 1.2,
      opacity: op, transform: `translateY(${y}px)`,
      textAlign: 'center', padding: '0 60px',
      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
    }}>
      {text}
    </div>
  );
};

export const SUNDAY_REEL_DURATION = 16 * 30; // 16s

export const SundayReel: React.FC = () => {
  const f = useCurrentFrame();

  // scene: dark room glow — simulated with radial gradient animation
  const glowR = interpolate(f, [0, 60, 120, 180, 240, 480], [0.12, 0.20, 0.15, 0.22, 0.16, 0.12], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
      {/* Cinematic screen glow — like light from a TV */}
      <div style={{
        position: 'absolute', left: '50%', top: '38%', width: 900, height: 700,
        transform: 'translate(-50%,-50%)', borderRadius: '40%',
        background: `radial-gradient(ellipse, rgba(80,40,180,${glowR}) 0%, transparent 70%)`,
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '38%', width: 600, height: 400,
        transform: 'translate(-50%,-50%)', borderRadius: '40%',
        background: `radial-gradient(ellipse, rgba(120,80,240,${glowR * 0.6}) 0%, transparent 60%)`,
      }} />

      <Particles frame={f} />

      {/* Overlay dimmer for text readability */}
      <div style={{ position: 'absolute', inset: 0, background: DIM }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>

        {/* ── Block 1: POV label (f 0–90) ─────────────────────────── */}
        <div style={{
          position: 'absolute', top: 130,
          opacity: fade(f, 0, 95, 12),
          transform: `translateY(${interpolate(f, [0, 14], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
        }}>
          <div style={{
            background: 'rgba(155,127,244,0.18)',
            border: '1.5px solid rgba(155,127,244,0.5)',
            borderRadius: 50, padding: '14px 44px',
            fontSize: 38, color: PURPLE, letterSpacing: 3,
          }}>
            POV
          </div>
        </div>

        {/* ── Block 2: Main scenario lines (staggered) ─────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 28,
          marginTop: -40,
        }}>
          {/* Line 1 — f15..160 */}
          <Line frame={f} inAt={15} outAt={165}
            text="Вы с другом в разных городах."
            size={68} color={WHITE} weight={700}
          />

          {/* Line 2 — f50..160 */}
          <Line frame={f} inAt={50} outAt={165}
            text="Один и тот же фильм."
            size={68} color={WHITE} weight={700}
          />

          {/* Line 3 — f85..160 */}
          <Line frame={f} inAt={85} outAt={165}
            text="В одно и то же время."
            size={68} color={WHITE} weight={700}
          />
        </div>

        {/* ── Block 3: Emotional detail (f165..280) ────────────────── */}
        <div style={{
          position: 'absolute',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20,
          opacity: fade(f, 168, 290, 12),
          transform: `translateY(${interpolate(f, [168, 182], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
        }}>
          <div style={{ fontSize: 90 }}>😭</div>
          <div style={{
            fontSize: 64, color: WHITE, fontWeight: 700,
            textAlign: 'center', padding: '0 60px', lineHeight: 1.2,
          }}>
            И вы оба плачете
          </div>
          <div style={{
            fontSize: 48, color: MUTED, fontWeight: 400,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center', padding: '0 80px', lineHeight: 1.35,
          }}>
            на одной и той же сцене.
          </div>
        </div>

        {/* ── Block 4: Soft CTA (f300..end) ────────────────────────── */}
        <div style={{
          position: 'absolute',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 36,
          opacity: fade(f, 305, SUNDAY_REEL_DURATION, 10),
          transform: `translateY(${interpolate(f, [305, 320], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
        }}>
          {/* WeWatch logo */}
          <Img
            src={staticFile('wewatch-logo-dark.svg')}
            style={{ width: 260, height: 'auto', opacity: 0.95 }}
          />
          <div style={{
            fontSize: 44, color: MUTED,
            fontFamily: 'Arial, sans-serif', fontWeight: 400,
            textAlign: 'center', lineHeight: 1.4,
          }}>
            Смотрите вместе — где бы вы ни были
          </div>
          {/* URL — small, unobtrusive */}
          <div style={{
            fontSize: 36, color: 'rgba(255,255,255,0.28)',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: 1,
          }}>
            wewatch.uz
          </div>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
