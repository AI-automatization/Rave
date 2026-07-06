import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, staticFile, Img } from 'remotion';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, config: { damping: 18, mass: 0.8, stiffness: 120 }, delay });

const ORANGE      = '#E8622A';
const ORANGE_DARK = '#C04C1A';
const BG          = '#FDF4F0';
const BG_DARK     = '#130A06';
const WHITE       = '#FFFFFF';

const BlogyLogo: React.FC<{ size?: number; dark?: boolean }> = ({ size = 40, dark = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
    <Img
      src={staticFile('blogy-logo.jpg')}
      style={{ width: size, height: size, borderRadius: size * 0.22, objectFit: 'cover' }}
    />
    <span style={{
      fontFamily: "'Arial Black','Helvetica Neue',sans-serif",
      fontWeight: 900, fontSize: size * 0.68,
      color: dark ? WHITE : ORANGE_DARK,
      letterSpacing: 1,
    }}>BLOGY</span>
  </div>
);

// ── B1: НАБОР ОТКРЫТ ─────────────────────────────────────────────────────────
export const BlogyB1Cover: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: ORANGE, overflow: 'hidden', fontFamily: "'Arial Black',sans-serif" }}>
      {/* watermark */}
      <div style={{
        position: 'absolute', right: -60, top: -80,
        fontSize: 750, color: 'rgba(255,255,255,0.07)', lineHeight: 1, fontWeight: 900,
      }}>B</div>

      {/* НОВЫЙ badge */}
      <div style={{
        position: 'absolute', top: 90, right: 80,
        background: WHITE, borderRadius: 50, padding: '14px 36px',
        opacity: sp(f, 4),
      }}>
        <span style={{ fontSize: 32, color: ORANGE, fontWeight: 900, letterSpacing: 1 }}>НОВЫЙ НАБОР</span>
      </div>

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '100px 88px', justifyContent: 'space-between' }}>
        <div style={{ opacity: sp(f, 0) }}>
          <BlogyLogo size={46} dark />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            fontSize: 130, color: WHITE, lineHeight: 0.95,
            opacity: sp(f, 6), transform: `scale(${0.88 + sp(f, 6) * 0.12})`,
          }}>
            НАБОР<br />ОТКРЫТ
          </div>
          <div style={{
            fontSize: 44, color: 'rgba(255,255,255,0.88)', fontFamily: 'Arial,sans-serif',
            fontWeight: 400, lineHeight: 1.4,
            opacity: sp(f, 18),
          }}>
            Ищем блогеров, бренды<br />и фрилансеров 🇺🇿
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, opacity: sp(f, 26),
        }}>
          <span style={{ fontSize: 34, color: WHITE, fontFamily: 'Arial,sans-serif', opacity: 0.75 }}>
            листай → посмотри как подать заявку
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── B2: Мы уже пишем — скрин переписки ──────────────────────────────────────
export const BlogyB2Proof: React.FC = () => {
  const f = useCurrentFrame();

  const Bubble: React.FC<{ text: string; from: 'us'|'them'; delay: number }> = ({ text, from, delay }) => {
    const p = sp(f, delay);
    const isUs = from === 'us';
    return (
      <div style={{
        display: 'flex', justifyContent: isUs ? 'flex-end' : 'flex-start',
        opacity: p, transform: `translateY(${(1 - p) * 14}px)`, marginBottom: 16,
      }}>
        {!isUs && (
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginRight: 10, flexShrink: 0, alignSelf: 'flex-end',
          }}>👤</div>
        )}
        <div style={{
          maxWidth: '74%', padding: '16px 22px',
          background: isUs ? ORANGE : WHITE,
          color: isUs ? WHITE : '#1a1a1a',
          borderRadius: isUs ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          fontSize: 28, lineHeight: 1.45, fontFamily: 'Arial,sans-serif',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          {text}
          {isUs && <span style={{ marginLeft: 8, fontSize: 20, opacity: 0.7 }}>✓✓</span>}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: 'Arial,sans-serif' }}>
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '68px 70px' }}>
        <div style={{
          fontSize: 56, fontWeight: 900, color: ORANGE_DARK, lineHeight: 1.05, marginBottom: 10,
          opacity: sp(f, 0), fontFamily: "'Arial Black',sans-serif",
        }}>
          МЫ УЖЕ ПИШЕМ
        </div>
        <div style={{ fontSize: 30, color: '#999', marginBottom: 40, opacity: sp(f, 5) }}>
          Каждый день находим новых авторов
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Bubble from="us"   delay={8}  text="Привет! Мы из Blogy — платформа для блогеров 🇺🇿 Хотим пригласить тебя" />
          <Bubble from="them" delay={20} text="Интересно! А что нужно делать?" />
          <Bubble from="us"   delay={32} text="Просто создай карточку в нашем боте — бренды сами найдут тебя ✅" />
          <Bubble from="them" delay={44} text="Круто, пришли ссылку!" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <BlogyLogo size={28} />
          <div style={{ fontSize: 26, color: '#ccc' }}>2 / 4</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── B3: Как подать заявку — 3 шага ───────────────────────────────────────────
export const BlogyB3Steps: React.FC = () => {
  const f = useCurrentFrame();
  const steps = [
    { n: '1', text: 'Открой @BlogyUz_bot в Telegram' },
    { n: '2', text: 'Заполни карточку (2 минуты)' },
    { n: '3', text: 'Жди заказов от брендов 🎉' },
  ];
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: 'Arial,sans-serif' }}>
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '68px 70px' }}>
        <div style={{
          fontSize: 56, fontWeight: 900, color: ORANGE_DARK, lineHeight: 1.05, marginBottom: 10,
          opacity: sp(f, 0), fontFamily: "'Arial Black',sans-serif",
        }}>
          КАК ВОЙТИ?
        </div>
        <div style={{ fontSize: 30, color: '#999', marginBottom: 52, opacity: sp(f, 5) }}>
          Всего 3 шага
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, flex: 1, justifyContent: 'center' }}>
          {steps.map(({ n, text }, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 30,
              opacity: sp(f, 10 + i * 10),
              transform: `translateX(${(1 - sp(f, 10 + i * 10)) * -32}px)`,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: ORANGE, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 44, color: WHITE, fontWeight: 900,
                fontFamily: "'Arial Black',sans-serif",
                boxShadow: `0 6px 20px ${ORANGE}55`,
              }}>{n}</div>
              <div style={{
                fontSize: 36, color: '#1a1a1a', lineHeight: 1.35, fontWeight: 500,
              }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Не веришь? */}
        <div style={{
          background: WHITE, borderRadius: 20, padding: '22px 28px',
          display: 'flex', alignItems: 'center', gap: 16, marginTop: 32,
          boxShadow: '0 4px 16px rgba(232,98,42,0.10)',
          opacity: sp(f, 38),
        }}>
          <span style={{ fontSize: 34 }}>🔗</span>
          <span style={{ fontSize: 28, color: '#555' }}>Сомневаешься? Напиши нам — покажем как это работает</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <BlogyLogo size={28} />
          <div style={{ fontSize: 26, color: '#ccc' }}>3 / 4</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── B4: CTA финал ────────────────────────────────────────────────────────────
export const BlogyB4CTA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG_DARK, overflow: 'hidden', fontFamily: 'Arial,sans-serif' }}>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 800, height: 800,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${ORANGE}2E 0%, transparent 70%)`,
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 80px', gap: 32, textAlign: 'center',
      }}>
        <div style={{ opacity: sp(f, 0), transform: `scale(${0.75 + sp(f, 0) * 0.25})` }}>
          <BlogyLogo size={52} dark />
        </div>

        <div style={{
          fontSize: 96, fontWeight: 900, color: WHITE, lineHeight: 0.98,
          fontFamily: "'Arial Black',sans-serif",
          opacity: sp(f, 7), transform: `scale(${0.88 + sp(f, 7) * 0.12})`,
        }}>
          ЗАЯВИ<br />О СЕБЕ<br />ПЕРВЫМ
        </div>

        <div style={{
          fontSize: 36, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45,
          opacity: sp(f, 18),
        }}>
          Набор ограничен.<br />Лучшие места займут первые.
        </div>

        {/* Bot button */}
        <div style={{
          background: ORANGE, borderRadius: 26, padding: '28px 60px',
          display: 'flex', alignItems: 'center', gap: 18,
          opacity: sp(f, 24), transform: `scale(${0.85 + sp(f, 24) * 0.15})`,
          boxShadow: `0 10px 36px ${ORANGE}55`,
        }}>
          <span style={{ fontSize: 44 }}>✈️</span>
          <span style={{
            fontSize: 44, color: WHITE, fontWeight: 900,
            fontFamily: "'Arial Black',sans-serif",
          }}>@BlogyUz_bot</span>
        </div>

        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)', opacity: sp(f, 32) }}>4 / 4</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
