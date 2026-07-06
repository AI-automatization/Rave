import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, staticFile, Img } from 'remotion';

const sp = (f: number, delay = 0, damping = 18) =>
  spring({ frame: f, fps: 30, config: { damping, mass: 0.8, stiffness: 120 }, delay });

const BG_DARK   = '#0a0014';
const PURPLE    = '#8b5cf6';
const PURPLE2   = '#6366f1';
const LIGHT     = '#c4b5fd';
const WHITE     = '#ffffff';
const TEAL      = '#14b8a6';

const Glow: React.FC<{ x?: string; y?: string; color?: string; size?: number; opacity?: number }> = ({
  x = '50%', y = '50%', color = PURPLE, size = 600, opacity = 0.25,
}) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: size, height: size,
    transform: 'translate(-50%,-50%)', borderRadius: '50%',
    background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
    pointerEvents: 'none',
  }} />
);

// WeWatch logo — real SVG brand asset
const Logo: React.FC<{ width?: number }> = ({ width = 160 }) => (
  <Img
    src={staticFile('wewatch-logo-dark.svg')}
    style={{ width, height: 'auto' }}
  />
);

// ── Story 1: «Что смотришь сегодня?» ────────────────────────────────────────
export const SatStory1Poll: React.FC = () => {
  const f = useCurrentFrame();

  const pulse = interpolate(Math.sin((f / 30) * Math.PI * 1.4), [-1, 1], [0.97, 1.03]);
  const glowPulse = interpolate(Math.sin((f / 30) * Math.PI * 0.8), [-1, 1], [0.7, 1.0]);

  // floating particles
  const particles = [
    { x: 15, y: 20, size: 6,  delay: 0,  speed: 0.4 },
    { x: 85, y: 15, size: 10, delay: 10, speed: 0.3 },
    { x: 10, y: 60, size: 7,  delay: 20, speed: 0.5 },
    { x: 90, y: 55, size: 5,  delay: 5,  speed: 0.35 },
    { x: 50, y: 8,  size: 8,  delay: 15, speed: 0.45 },
    { x: 75, y: 82, size: 6,  delay: 8,  speed: 0.4 },
    { x: 25, y: 85, size: 9,  delay: 25, speed: 0.3 },
  ];

  return (
    <AbsoluteFill style={{ background: BG_DARK, overflow: 'hidden', fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
      {/* Dynamic glows */}
      <div style={{
        position: 'absolute', left: '25%', top: '20%', width: 800, height: 800,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${PURPLE}${Math.round(glowPulse * 0.28 * 255).toString(16).padStart(2,'0')} 0%, transparent 65%)`,
      }} />
      <div style={{
        position: 'absolute', left: '80%', top: '65%', width: 600, height: 600,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${PURPLE2}${Math.round(glowPulse * 0.22 * 255).toString(16).padStart(2,'0')} 0%, transparent 65%)`,
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '48%', width: 900, height: 900,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${TEAL}${Math.round(glowPulse * 0.08 * 255).toString(16).padStart(2,'0')} 0%, transparent 60%)`,
      }} />

      {/* Floating particles */}
      {particles.map((p, i) => {
        const floatY = Math.sin(((f + p.delay * 3) / 30) * Math.PI * p.speed) * 12;
        const particleOpacity = sp(f, p.delay) * (0.4 + Math.sin(((f + p.delay * 2) / 30) * Math.PI * 0.6) * 0.3);
        return (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: i % 2 === 0 ? PURPLE : LIGHT,
            opacity: particleOpacity,
            transform: `translate(-50%, calc(-50% + ${floatY}px))`,
          }} />
        );
      })}

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '110px 70px 130px',
        textAlign: 'center',
      }}>
        {/* Logo — bigger, centered */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: sp(f, 0), transform: `translateY(${(1 - sp(f, 0)) * -16}px)`,
        }}>
          <Logo width={220} />
          <div style={{
            width: 48, height: 2,
            background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)`,
            opacity: sp(f, 4),
          }} />
        </div>

        {/* Main question */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{
            fontSize: 136, color: WHITE, lineHeight: 0.92, textAlign: 'center',
            opacity: sp(f, 6),
            transform: `scale(${(0.82 + sp(f, 6) * 0.18) * pulse})`,
            textShadow: `0 0 80px ${PURPLE}66`,
          }}>
            ЧТО<br />СМОТРИШЬ<br />СЕГОДНЯ?
          </div>

          {/* Animated emoji */}
          <div style={{
            fontSize: 90,
            opacity: sp(f, 18),
            transform: `scale(${pulse}) rotate(${interpolate(Math.sin((f / 30) * Math.PI * 0.9), [-1,1], [-8, 8])}deg)`,
          }}>
            🎬
          </div>
        </div>

        {/* Answer prompt box */}
        <div style={{
          width: '100%',
          background: 'rgba(139,92,246,0.12)',
          border: `2px solid rgba(139,92,246,${0.3 + glowPulse * 0.25})`,
          borderRadius: 32,
          padding: '38px 44px',
          backdropFilter: 'blur(12px)',
          opacity: sp(f, 28),
          transform: `translateY(${(1 - sp(f, 28)) * 34}px)`,
          boxShadow: `0 8px 40px ${PURPLE}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}>
          <div style={{ fontSize: 40, color: LIGHT, marginBottom: 14, letterSpacing: 1 }}>
            Напиши в комментах 👇
          </div>
          <div style={{
            fontSize: 30, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Arial,sans-serif', fontWeight: 400,
          }}>
            Название фильма / сериала
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Story 2: «Смотришь один?» — эмоциональный хук ───────────────────────────
// Текст появляется слово за словом — идеально под медленную озвучку
export const SatStory2Hook: React.FC = () => {
  const f = useCurrentFrame();

  const words = [
    { text: 'Смотришь', delay: 0 },
    { text: 'фильм',   delay: 8 },
    { text: 'один?',   delay: 16, color: PURPLE },
  ];

  const words2 = [
    { text: 'Так',    delay: 35 },
    { text: 'не',     delay: 40 },
    { text: 'должно', delay: 45 },
    { text: 'быть.',  delay: 50, color: TEAL },
  ];

  return (
    <AbsoluteFill style={{ background: BG_DARK, overflow: 'hidden', fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
      <Glow x="50%" y="40%" color={PURPLE} size={800} opacity={0.2} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '120px 70px 140px',
        textAlign: 'center',
      }}>
        <div style={{ opacity: sp(f, 0) }}><Logo width={180} /></div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
          {/* Line 1 */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {words.map(({ text, delay, color }) => (
              <span key={text} style={{
                fontSize: 108, color: color ?? WHITE, lineHeight: 1,
                opacity: sp(f, delay),
                transform: `translateY(${(1 - sp(f, delay)) * 40}px)`,
                display: 'inline-block',
              }}>
                {text}
              </span>
            ))}
          </div>

          {/* Emoji */}
          <div style={{
            fontSize: 90, opacity: sp(f, 22),
            transform: `scale(${0.5 + sp(f, 22) * 0.5})`,
          }}>😔</div>

          {/* Line 2 */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {words2.map(({ text, delay, color }) => (
              <span key={text} style={{
                fontSize: 108, color: color ?? WHITE, lineHeight: 1,
                opacity: sp(f, delay),
                transform: `translateY(${(1 - sp(f, delay)) * 40}px)`,
                display: 'inline-block',
              }}>
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          opacity: sp(f, 62),
          transform: `translateY(${(1 - sp(f, 62)) * 20}px)`,
        }}>
          <div style={{ fontSize: 42, color: LIGHT }}>Позови кого-нибудь →</div>
          <div style={{
            background: PURPLE, borderRadius: 20, padding: '18px 52px',
            fontSize: 44, color: WHITE, letterSpacing: 1,
          }}>wewatch.uz</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Story 3: «Как это работает» — 3 шага ────────────────────────────────────
// Каждый шаг появляется с паузой — синхронизируется с озвучкой
export const SatStory3HowTo: React.FC = () => {
  const f = useCurrentFrame();

  const steps = [
    { n: '01', icon: '🔗', text: 'Создай\nкомнату', delay: 10 },
    { n: '02', icon: '📲', text: 'Пошли\nссылку другу', delay: 35 },
    { n: '03', icon: '🎬', text: 'Смотрите\nвместе', delay: 60 },
  ];

  return (
    <AbsoluteFill style={{ background: BG_DARK, overflow: 'hidden', fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
      <Glow x="20%" y="20%" color={TEAL}   size={500} opacity={0.18} />
      <Glow x="80%" y="80%" color={PURPLE} size={600} opacity={0.18} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '120px 70px 140px',
      }}>
        <div style={{ opacity: sp(f, 0) }}><Logo width={180} /></div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Title */}
          <div style={{
            fontSize: 72, color: WHITE, textAlign: 'center', marginBottom: 56,
            opacity: sp(f, 4), transform: `translateY(${(1 - sp(f, 4)) * -20}px)`,
          }}>
            КАК ЭТО<br />РАБОТАЕТ?
          </div>

          {/* Steps */}
          {steps.map(({ n, icon, text, delay }) => (
            <div key={n} style={{
              display: 'flex', alignItems: 'center', gap: 32,
              marginBottom: 36,
              opacity: sp(f, delay),
              transform: `translateX(${(1 - sp(f, delay)) * -40}px)`,
            }}>
              {/* Number circle */}
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `3px solid ${PURPLE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: 36, color: PURPLE,
              }}>{n}</div>

              {/* Icon */}
              <div style={{ fontSize: 64, flexShrink: 0 }}>{icon}</div>

              {/* Text */}
              <div style={{
                fontSize: 56, color: WHITE, lineHeight: 1.1,
                whiteSpace: 'pre-line',
              }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          width: '100%',
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          borderRadius: 24, padding: '28px 40px',
          textAlign: 'center',
          opacity: sp(f, 80),
          transform: `scale(${0.9 + sp(f, 80) * 0.1})`,
          boxShadow: `0 8px 32px ${PURPLE}44`,
        }}>
          <div style={{ fontSize: 48, color: WHITE }}>Бесплатно → wewatch.uz</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
