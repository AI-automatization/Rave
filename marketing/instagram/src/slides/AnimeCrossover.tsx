import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, staticFile, Img } from 'remotion';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, config: { damping: 20, mass: 0.9, stiffness: 130 }, delay });

// Eren — AOT green/teal
const EREN_COLOR  = '#4ade80';
const EREN_BG     = '#166534';
const EREN_BUBBLE = '#1a3a2a';

// Guts — Berserk black/red
const GUTS_COLOR  = '#f87171';
const GUTS_BG     = '#7f1d1d';
const GUTS_BUBBLE = '#2a1010';

const BG      = '#0d0d0d';
const CHAT_BG = '#111111';
const WHITE   = '#ffffff';

// ── Avatar circle ────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; color: string; bg: string; size?: number }> = ({
  name, color, bg, size = 52,
}) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: bg, border: `2.5px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    fontSize: size * 0.38, fontWeight: 900, color,
    fontFamily: "'Arial Black',sans-serif",
  }}>
    {name[0]}
  </div>
);

// ── Chat bubble ──────────────────────────────────────────────────────────────
const Msg: React.FC<{
  frame: number; delay: number;
  from: 'eren' | 'guts';
  text: string; subtext?: string;
  isRead?: boolean;
}> = ({ frame, delay, from, text, subtext, isRead }) => {
  const p = sp(frame, delay);
  const isEren = from === 'eren';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isEren ? 'row' : 'row-reverse',
      alignItems: 'flex-end', gap: 12,
      opacity: p,
      transform: `translateY(${(1 - p) * 20}px) scale(${0.92 + p * 0.08})`,
      marginBottom: 18,
    }}>
      <Avatar
        name={isEren ? 'Э' : 'Г'}
        color={isEren ? EREN_COLOR : GUTS_COLOR}
        bg={isEren ? EREN_BG : GUTS_BG}
        size={48}
      />
      <div style={{
        maxWidth: '72%',
        background: isEren ? EREN_BUBBLE : GUTS_BUBBLE,
        border: `1.5px solid ${isEren ? EREN_COLOR + '33' : GUTS_COLOR + '33'}`,
        borderRadius: isEren ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        padding: '14px 20px',
      }}>
        {/* Name tag */}
        <div style={{
          fontSize: 22, fontWeight: 900,
          color: isEren ? EREN_COLOR : GUTS_COLOR,
          fontFamily: "'Arial Black',sans-serif",
          marginBottom: 6,
          letterSpacing: 0.5,
        }}>
          {isEren ? 'Эрен Йегер' : 'Гатс'}
          <span style={{
            fontSize: 18, opacity: 0.5,
            marginLeft: 8, fontWeight: 400,
            fontFamily: 'Arial,sans-serif',
            color: WHITE,
          }}>
            {isEren ? '• Атака Титанов' : '• Берсерк'}
          </span>
        </div>
        <div style={{
          fontSize: 32, color: WHITE, lineHeight: 1.4,
          fontFamily: 'Arial,sans-serif', fontWeight: 400,
        }}>
          {text}
        </div>
        {subtext && (
          <div style={{
            fontSize: 24, color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Arial,sans-serif', marginTop: 6, lineHeight: 1.3,
          }}>
            {subtext}
          </div>
        )}
        {isRead && (
          <div style={{
            fontSize: 20, color: isEren ? EREN_COLOR : GUTS_COLOR,
            textAlign: 'right', marginTop: 4, opacity: 0.7,
          }}>✓✓</div>
        )}
      </div>
    </div>
  );
};

// ── "Typing..." indicator ────────────────────────────────────────────────────
const Typing: React.FC<{ frame: number; delay: number; from: 'eren' | 'guts' }> = ({ frame, delay, from }) => {
  const p = sp(frame, delay);
  const dot = (d: number) => interpolate(
    Math.sin(((frame - delay * 0) / 30) * Math.PI * 2 + d),
    [-1, 1], [0.3, 1],
  );
  const isEren = from === 'eren';
  return (
    <div style={{
      display: 'flex', flexDirection: isEren ? 'row' : 'row-reverse',
      alignItems: 'center', gap: 12, marginBottom: 18,
      opacity: p * 0.7,
    }}>
      <Avatar name={isEren ? 'Э' : 'Г'} color={isEren ? EREN_COLOR : GUTS_COLOR} bg={isEren ? EREN_BG : GUTS_BG} size={48} />
      <div style={{
        background: isEren ? EREN_BUBBLE : GUTS_BUBBLE,
        border: `1.5px solid ${isEren ? EREN_COLOR + '22' : GUTS_COLOR + '22'}`,
        borderRadius: 18, padding: '16px 24px',
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        {[0, 1.2, 2.4].map((d, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isEren ? EREN_COLOR : GUTS_COLOR,
            opacity: dot(d),
          }} />
        ))}
      </div>
    </div>
  );
};

export const ANIME_REEL_DURATION = 18 * 30; // 18s

export const AnimeCrossover: React.FC = () => {
  const f = useCurrentFrame();

  // title fade
  const titleOp = interpolate(f, [0, 15, 55, 70], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // chat fade in
  const chatOp = interpolate(f, [60, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // solution screen
  const solOp = interpolate(f, [380, 400], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // chat fade out before solution
  const chatFade = interpolate(f, [360, 380], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>

      {/* ── TITLE CARD ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: titleOp, gap: 24,
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 52, textAlign: 'center', lineHeight: 1.3 }}>⚔️🗡️</div>
        <div style={{
          fontSize: 68, color: WHITE, fontWeight: 900, textAlign: 'center',
          fontFamily: "'Arial Black',sans-serif", lineHeight: 1.1,
          padding: '0 60px',
        }}>
          АНИМЕ КРОССОВЕР
        </div>
        <div style={{
          fontSize: 36, color: 'rgba(255,255,255,0.5)', fontFamily: 'Arial,sans-serif',
          textAlign: 'center',
        }}>
          которого мы не заслужили
        </div>
      </div>

      {/* ── CHAT SCREEN ── */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: chatOp * chatFade,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          background: '#0a0a0a', padding: '52px 40px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4ade80, #f87171)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>⚔️</div>
          <div>
            <div style={{ fontSize: 30, color: WHITE, fontWeight: 700, fontFamily: 'Arial,sans-serif' }}>Аниме чат</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', fontFamily: 'Arial,sans-serif' }}>2 участника</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, padding: '32px 30px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          background: CHAT_BG,
        }}>
          {/* Eren message 1 */}
          <Msg frame={f} delay={0} from="eren"
            text="Гатс, давай сегодня вечером посмотрим фильм? 🎬"
          />

          {/* Typing indicator */}
          {f > 55 && f < 110 && <Typing frame={f} delay={55} from="guts" />}

          {/* Guts reply 1 */}
          <Msg frame={f} delay={110} from="guts"
            text="...ты же из другого аниме."
            subtext="Мы даже в одной вселенной не существуем"
          />

          {/* Eren reply */}
          <Msg frame={f} delay={170} from="eren"
            text="Ну и что 😭"
            subtext="Мне всё равно скучно. Все титаны мертвы"
          />

          {/* Guts final */}
          {f > 220 && f < 360 && <Typing frame={f} delay={220} from="guts" />}
          <Msg frame={f} delay={255} from="guts"
            text="...ладно. Но как?"
            isRead
          />
        </div>
      </div>

      {/* ── SOLUTION SCREEN ── */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: solOp,
        background: 'linear-gradient(160deg, #0d001a 0%, #000a00 50%, #1a0000 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, textAlign: 'center', padding: '60px',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', left: '50%', top: '40%', width: 700, height: 700,
          transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,60,200,0.25) 0%, transparent 65%)',
        }} />

        <div style={{ fontSize: 72, opacity: sp(f, 400) }}>⚔️ + 🗡️</div>

        <div style={{
          fontSize: 72, color: WHITE, fontWeight: 900,
          fontFamily: "'Arial Black',sans-serif", lineHeight: 1.05,
          opacity: sp(f, 408),
          transform: `scale(${0.85 + sp(f, 408) * 0.15})`,
        }}>
          РАЗНЫЕ МИРЫ —<br />ОДИН ЭКРАН
        </div>

        <div style={{
          fontSize: 36, color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Arial,sans-serif', lineHeight: 1.5,
          opacity: sp(f, 425),
        }}>
          WeWatch синхронизирует просмотр<br />для любых двух людей — из любых миров
        </div>

        {/* Logo */}
        <div style={{ opacity: sp(f, 440), transform: `scale(${0.8 + sp(f, 440) * 0.2})` }}>
          <Img
            src={staticFile('wewatch-logo-dark.svg')}
            style={{ width: 240, height: 'auto' }}
          />
        </div>

        <div style={{
          fontSize: 32, color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Arial,sans-serif',
          opacity: sp(f, 455),
        }}>
          wewatch.uz
        </div>
      </div>

    </AbsoluteFill>
  );
};
