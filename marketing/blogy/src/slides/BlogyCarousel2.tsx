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

// ── V2-B1: НАБОР ОТКРЫТ (без изменений) ─────────────────────────────────────
export const V2B1Cover: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: ORANGE, overflow: 'hidden', fontFamily: "'Arial Black',sans-serif" }}>
      <div style={{
        position: 'absolute', right: -60, top: -80,
        fontSize: 750, color: 'rgba(255,255,255,0.07)', lineHeight: 1, fontWeight: 900,
      }}>B</div>

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

        <div style={{ opacity: sp(f, 26) }}>
          <span style={{ fontSize: 34, color: WHITE, fontFamily: 'Arial,sans-serif', opacity: 0.75 }}>
            листай → посмотри как подать заявку
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── V2-B2: Слайд под РЕАЛЬНЫЙ скрин из TG ───────────────────────────────────
export const V2B2Screenshot: React.FC = () => {
  const f = useCurrentFrame();

  // Проверяем есть ли реальный скрин
  const hasScreenshot = false; // поменяй на true и укажи путь когда добавишь скрин

  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden', fontFamily: 'Arial,sans-serif' }}>
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '68px 70px' }}>

        {/* Заголовок */}
        <div style={{
          fontSize: 54, fontWeight: 900, color: ORANGE_DARK, lineHeight: 1.05, marginBottom: 10,
          opacity: sp(f, 0), fontFamily: "'Arial Black',sans-serif",
        }}>
          МЫ УЖЕ ПИШЕМ
        </div>
        <div style={{ fontSize: 30, color: '#999', marginBottom: 36, opacity: sp(f, 5) }}>
          Реальное общение с блогерами
        </div>

        {/* Место под скрин */}
        <div style={{
          flex: 1,
          borderRadius: 28,
          overflow: 'hidden',
          opacity: sp(f, 10),
          transform: `scale(${0.93 + sp(f, 10) * 0.07})`,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          {hasScreenshot ? (
            // Когда добавишь скрин — замени 'tg-screenshot.jpg' на реальный файл в public/
            <Img
              src={staticFile('tg-screenshot.jpg')}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          ) : (
            // Placeholder пока нет скрина
            <div style={{
              width: '100%', height: '100%',
              background: '#E8F4FD',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20,
              border: '3px dashed #90CAF9',
              borderRadius: 28,
            }}>
              {/* Telegram icon */}
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2AABEE, #229ED9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 56,
              }}>✈️</div>

              <div style={{ textAlign: 'center', padding: '0 40px' }}>
                <div style={{
                  fontSize: 36, fontWeight: 700, color: '#1565C0',
                  fontFamily: "'Arial Black',sans-serif", marginBottom: 12,
                }}>
                  СКРИН ИЗ TELEGRAM
                </div>
                <div style={{ fontSize: 26, color: '#555', lineHeight: 1.4 }}>
                  Добавь скрин переписки с блогером<br />в папку{' '}
                  <span style={{ background: '#fff', padding: '2px 10px', borderRadius: 8, fontFamily: 'monospace', fontSize: 22, color: ORANGE }}>
                    public/tg-screenshot.jpg
                  </span>
                </div>
              </div>

              {/* Mock Telegram messages inside placeholder */}
              <div style={{
                background: 'rgba(255,255,255,0.7)', borderRadius: 20,
                padding: '18px 24px', margin: '0 30px', width: 'calc(100% - 60px)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { side: 'right', text: 'Привет! Мы из Blogy 👋', color: '#2AABEE', textColor: '#fff' },
                    { side: 'left',  text: 'Расскажите подробнее 🙂', color: '#F0F0F0', textColor: '#333' },
                    { side: 'right', text: 'Открой @BlogyUz_bot ✅', color: '#2AABEE', textColor: '#fff' },
                  ].map(({ side, text, color, textColor }, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: color, color: textColor,
                        padding: '10px 16px', borderRadius: 14,
                        fontSize: 22, maxWidth: '70%',
                        opacity: 0.85,
                      }}>{text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <BlogyLogo size={28} />
          <div style={{ fontSize: 26, color: '#ccc' }}>2 / 4</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── V2-B3: Как войти — 3 шага (без изменений) ───────────────────────────────
export const V2B3Steps: React.FC = () => {
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
              <div style={{ fontSize: 36, color: '#1a1a1a', lineHeight: 1.35, fontWeight: 500 }}>{text}</div>
            </div>
          ))}
        </div>

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

// ── V2-B4: CTA финал (без изменений) ────────────────────────────────────────
export const V2B4CTA: React.FC = () => {
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
