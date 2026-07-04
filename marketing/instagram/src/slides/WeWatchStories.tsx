import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoIcon } from '../components/Logo';
import {
  StoryBg, StoryGlow, StoryParticles, StoryScanLine, StoryLayout,
  sp, spPop,
} from '../components/StoryLayout';

// ══════════════════════════════════════════════════════════
// DAY 1 — TANISHUV
// ══════════════════════════════════════════════════════════

// D1-S1: Logo reveal + teaser
export const StoryD1S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconIn  = sp(frame, fps, 8);
  const tagIn   = sp(frame, fps, 28);
  const t1In    = sp(frame, fps, 44);
  const t2In    = sp(frame, fps, 60);
  const subIn   = sp(frame, fps, 80);
  const pulse   = 1 + 0.04 * Math.sin(frame * 0.07);
  const glow    = 8 + 6 * Math.sin(frame * 0.05);

  return (
    <StoryLayout storyNum={1} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} />
      <StoryGlow frame={frame} x="50%" y="44%" color="rgba(124,58,237,0.32)" size={920} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 72px 160px', textAlign: 'center',
      }}>
        <div style={{
          opacity: iconIn, marginBottom: 28,
          transform: `scale(${interpolate(iconIn, [0, 1], [0.5, 1])})`,
          filter: `drop-shadow(0 0 ${glow}px rgba(167,139,250,0.5))`,
        }}>
          <LogoIcon size={148} />
        </div>

        <div style={{
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [16, 0])}px)`,
          padding: '10px 28px', borderRadius: 100,
          border: '1px solid rgba(167,139,250,0.38)', background: 'rgba(124,58,237,0.14)',
          fontSize: 23, fontWeight: 700, color: 'rgba(167,139,250,0.85)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 32,
        }}>
          YANGI PLATFORMA
        </div>

        <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 36 }}>
          <div style={{
            color: '#fff', opacity: t1In,
            transform: `translateY(${interpolate(t1In, [0, 1], [28, 0])}px)`,
          }}>Birga</div>
          <div style={{
            color: '#A78BFA', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [28, 0])}px) scale(${pulse})`,
            filter: t2In > 0.85 ? `drop-shadow(0 0 ${glow}px rgba(167,139,250,0.5))` : 'none',
          }}>kino ko'r.</div>
        </div>

        <div style={{
          opacity: subIn * 0.62, fontSize: 34, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.55, fontWeight: 400,
          transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`,
        }}>
          Do'stlar bilan birga film tomosha{'\n'}istalgan joydan 🎬
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D1-S2: Poll background — "Filmni yolg'iz ko'rasanmi?"
// Static PNG: Instagram "Opros" stikeri shu joyga qo'yiladi
export const StoryD1S2: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <StoryLayout storyNum={2} totalStories={3}>
      <StoryBg frame={frame} hue="42" />
      <StoryParticles frame={frame} tint="#EAB308" count={12} />
      <StoryGlow frame={frame} x="72%" y="24%" color="rgba(234,179,8,0.12)" size={580} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        {/* Emoji */}
        <div style={{
          fontSize: 118, marginBottom: 28,
          filter: 'drop-shadow(0 0 18px rgba(234,179,8,0.45))',
          transform: 'rotate(-4deg)',
        }}>🍿</div>

        {/* Question */}
        <div style={{
          fontSize: 76, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.025em',
          color: '#fff', marginBottom: 60,
        }}>
          Filmni yolg'iz{'\n'}ko'rasanmi?
        </div>

        {/* Poll sticker placeholder */}
        <div style={{
          width: '100%', borderRadius: 28,
          border: '2px dashed rgba(234,179,8,0.35)',
          padding: '52px 32px', textAlign: 'center',
          background: 'rgba(234,179,8,0.05)',
        }}>
          <div style={{ fontSize: 36, color: 'rgba(253,224,71,0.45)', fontWeight: 700, letterSpacing: '0.04em' }}>
            ☝️ "OPROS" STIKERI
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.22)', marginTop: 10, fontWeight: 500 }}>
            Ha / Yo'q
          </div>
        </div>

        <div style={{ marginTop: 32, fontSize: 26, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
          WeWatch — do'stlar bilan birga 🚀
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D1-S3: CTA — bio linkiga o'tish
export const StoryD1S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1In    = sp(frame, fps, 8);
  const t2In    = sp(frame, fps, 24);
  const arrowIn = sp(frame, fps, 42);
  const btnIn   = sp(frame, fps, 58);
  const subIn   = sp(frame, fps, 76);

  const arrowY  = interpolate(Math.sin(frame * 0.11), [-1, 1], [-9, 9]);
  const btnGlow = 0.3 + 0.12 * Math.sin(frame * 0.04);

  return (
    <StoryLayout storyNum={3} totalStories={3}>
      <StoryBg frame={frame} hue="268" />
      <StoryParticles frame={frame} count={22} />
      <StoryGlow frame={frame} x="50%" y="50%" color={`rgba(124,58,237,${btnGlow})`} size={960} />

      {/* Rings */}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[720, 560, 410].map((size, i) => (
          <div key={i} style={{
            position: 'absolute', width: size, height: size, borderRadius: '50%',
            border: `1px solid rgba(167,139,250,${0.06 + i * 0.04})`,
            transform: `scale(${0.97 + 0.03 * Math.sin(frame * (0.017 + i * 0.004) + i * 1.1)})`,
          }} />
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 68px 180px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 122, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 16 }}>
          <div style={{
            color: '#fff', opacity: t1In,
            transform: `scale(${interpolate(t1In, [0, 1], [0.88, 1])})`,
          }}>Sinab</div>
          <div style={{
            color: '#A78BFA', opacity: t2In,
            transform: `scale(${interpolate(t2In, [0, 1], [0.88, 1])})`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 14px rgba(167,139,250,0.5))' : 'none',
          }}>ko'r 🚀</div>
        </div>

        <div style={{ fontSize: 84, marginBottom: 16, opacity: arrowIn, transform: `translateY(${arrowY}px)` }}>👆</div>

        <div style={{
          opacity: arrowIn * 0.7, fontSize: 32, color: 'rgba(255,255,255,0.55)',
          fontWeight: 600, marginBottom: 44,
          transform: `translateY(${interpolate(arrowIn, [0, 1], [16, 0])}px)`,
        }}>
          Bio'dagi linkdan yukla
        </div>

        <div style={{
          position: 'relative', overflow: 'hidden',
          opacity: btnIn, transform: `translateY(${interpolate(btnIn, [0, 1], [18, 0])}px)`,
          padding: '40px 60px', borderRadius: 30,
          background: `rgba(124,58,237,${0.3 + 0.1 * Math.sin(frame * 0.032)})`,
          border: '1.5px solid rgba(167,139,250,0.48)',
          fontSize: 48, fontWeight: 900, color: '#C4B5FD',
          width: '100%', textAlign: 'center' as const,
        }}>
          🌐 wewatch.uz
        </div>

        <div style={{
          marginTop: 28, fontSize: 27, color: 'rgba(255,255,255,0.35)',
          opacity: subIn, fontWeight: 500,
        }}>
          Bepul yuklab olish 👇
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// ══════════════════════════════════════════════════════════
// DAY 2 — DEMO
// ══════════════════════════════════════════════════════════

// D2-S1: Reels teaser
export const StoryD2S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn  = sp(frame, fps, 10);
  const t1In   = sp(frame, fps, 26);
  const t2In   = sp(frame, fps, 44);
  const playIn = spPop(frame, fps, 62);
  const subIn  = sp(frame, fps, 88);

  const playPulse = 1 + 0.06 * Math.sin(frame * 0.08);

  return (
    <StoryLayout storyNum={1} totalStories={2}>
      <StoryBg frame={frame} hue="172" />
      <StoryParticles frame={frame} tint="#34D399" count={14} />
      <StoryGlow frame={frame} x="30%" y="70%" color="rgba(52,211,153,0.14)" size={600} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 72px 160px', textAlign: 'center',
      }}>
        <div style={{
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [16, 0])}px)`,
          padding: '10px 28px', borderRadius: 100,
          border: '1px solid rgba(52,211,153,0.38)', background: 'rgba(5,150,105,0.14)',
          fontSize: 23, fontWeight: 700, color: 'rgba(110,231,183,0.85)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 36,
        }}>
          YANGI REELS
        </div>

        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 44 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [28, 0])}px)` }}>
            30 soniya
          </div>
          <div style={{
            color: '#6EE7B7', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [28, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(52,211,153,0.5))' : 'none',
          }}>
            WeWatch nima?
          </div>
        </div>

        {/* Play button */}
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(52,211,153,0.18)', border: '2px solid rgba(110,231,183,0.42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: playIn, transform: `scale(${interpolate(playIn, [0, 1], [0.6, 1])} ) scale(${playPulse})`,
          filter: playIn > 0.85 ? 'drop-shadow(0 0 18px rgba(52,211,153,0.36))' : 'none',
          marginBottom: 36,
        }}>
          <div style={{ fontSize: 72, marginLeft: 10 }}>▶</div>
        </div>

        <div style={{
          opacity: subIn * 0.62, fontSize: 30, color: 'rgba(255,255,255,0.5)', fontWeight: 500,
          transform: `translateY(${interpolate(subIn, [0, 1], [14, 0])}px)`,
        }}>
          Reelsni ko'r 👆 Qanday ishlashini bilib ol
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D2-S2: Quiz — "Watch Party necha kishi?"
export const StoryD2S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconIn  = sp(frame, fps, 6);
  const qIn     = sp(frame, fps, 22);
  const a1In    = spPop(frame, fps, 44);
  const a2In    = spPop(frame, fps, 58);
  const a3In    = spPop(frame, fps, 72);
  const a4In    = spPop(frame, fps, 86);
  const ansIn   = sp(frame, fps, 140);

  const options = ['5 kishi', '10 kishi', '50 kishi', '100+ kishi'];
  const anim    = [a1In, a2In, a3In, a4In];
  const correct = 2; // 50 kishi

  return (
    <StoryLayout storyNum={2} totalStories={2}>
      <StoryBg frame={frame} hue="250" />
      <StoryParticles frame={frame} count={16} />
      <StoryGlow frame={frame} x="50%" y="35%" color="rgba(124,58,237,0.28)" size={700} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 90, opacity: iconIn, marginBottom: 20,
          transform: `scale(${interpolate(iconIn, [0, 1], [0.5, 1])})`,
          filter: `drop-shadow(0 0 ${6 + 5 * Math.sin(frame * 0.06)}px rgba(167,139,250,0.4))`,
        }}>🧠</div>

        <div style={{
          fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.82)',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          marginBottom: 20, opacity: qIn,
        }}>QUIZ</div>

        <div style={{
          fontSize: 60, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: 48, opacity: qIn,
          transform: `translateY(${interpolate(qIn, [0, 1], [20, 0])}px)`,
        }}>
          Watch Party'da{'\n'}necha kishi{'\n'}bo'lishi mumkin?
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%' }}>
          {options.map((opt, i) => {
            const v = anim[i];
            const isCorrect = frame > 140 && i === correct;
            const isWrong   = frame > 140 && i !== correct;
            return (
              <div key={i} style={{
                borderRadius: 20, padding: '28px 20px', textAlign: 'center',
                background: isCorrect ? 'rgba(52,211,153,0.22)' : isWrong ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${isCorrect ? 'rgba(110,231,183,0.5)' : isWrong ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.25)'}`,
                opacity: (isWrong ? 0.4 : 1) * Math.min(1, v * 1.3),
                transform: `scale(${interpolate(v, [0, 1], [0.78, 1])})`,
              }}>
                <span style={{
                  fontSize: 32, fontWeight: 800,
                  color: isCorrect ? '#6EE7B7' : '#fff',
                  filter: isCorrect ? 'drop-shadow(0 0 8px rgba(52,211,153,0.6))' : 'none',
                }}>
                  {isCorrect ? '✅ ' : ''}{opt}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 28, fontSize: 26, color: 'rgba(52,211,153,0.72)',
          opacity: ansIn, fontWeight: 600,
        }}>
          To'g'ri! 50 kishigacha 🎉
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// ══════════════════════════════════════════════════════════
// DAY 3 — WATCH PARTY
// ══════════════════════════════════════════════════════════

// D3-S1: Before / After comparison
export const StoryD3S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = sp(frame, fps, 8);
  const leftIn   = sp(frame, fps, 28);
  const vsIn     = spPop(frame, fps, 60);
  const rightIn  = sp(frame, fps, 72);
  const subIn    = sp(frame, fps, 108);

  return (
    <StoryLayout storyNum={1} totalStories={3}>
      <StoryBg frame={frame} hue="260" />
      <StoryParticles frame={frame} count={14} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 52px 160px',
      }}>
        {/* Header */}
        <div style={{
          fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          marginBottom: 40, opacity: headerIn,
        }}>
          Farqni ko'r 👀
        </div>

        <div style={{ display: 'flex', gap: 16, width: '100%', alignItems: 'stretch' }}>
          {/* LEFT — before */}
          <div style={{
            flex: 1, borderRadius: 24,
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.28)',
            padding: '36px 28px', textAlign: 'center',
            opacity: leftIn, transform: `translateX(${interpolate(leftIn, [0, 1], [-40, 0])}px)`,
          }}>
            <div style={{ fontSize: 68, marginBottom: 16 }}>😔</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#FCA5A5', marginBottom: 12 }}>Yolg'iz</div>
            <div style={{ fontSize: 23, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
              {`Reaksiyalarni\nyolg'iz sezish`}
            </div>
            <div style={{ marginTop: 20, fontSize: 22, color: 'rgba(239,68,68,0.7)' }}>
              ✗ Zerikish{'\n'}✗ Bir xil{'\n'}✗ Ko'ngilsiz
            </div>
          </div>

          {/* VS */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: vsIn, transform: `scale(${interpolate(vsIn, [0, 1], [0.4, 1])})`,
          }}>
            <div style={{
              fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.05em',
            }}>VS</div>
          </div>

          {/* RIGHT — after */}
          <div style={{
            flex: 1, borderRadius: 24,
            background: 'rgba(124,58,237,0.14)', border: '1.5px solid rgba(167,139,250,0.36)',
            padding: '36px 28px', textAlign: 'center',
            opacity: rightIn, transform: `translateX(${interpolate(rightIn, [0, 1], [40, 0])}px)`,
          }}>
            <div style={{ fontSize: 68, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#C4B5FD', marginBottom: 12 }}>WeWatch</div>
            <div style={{ fontSize: 23, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>
              {`Do'stlar bilan\nbirga kino`}
            </div>
            <div style={{ marginTop: 20, fontSize: 22, color: 'rgba(167,139,250,0.7)' }}>
              ✓ Quvonchli{'\n'}✓ Live chat{'\n'}✓ Reaksiyalar
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 36, fontSize: 28, color: 'rgba(255,255,255,0.4)',
          opacity: subIn, fontWeight: 500, textAlign: 'center',
        }}>
          Tanlov aniq 👆 wewatch.uz
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D3-S2: Question box — "Qaysi filmni ko'rmoqchisiz?"
export const StoryD3S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgGlow  = sp(frame, fps, 4);
  const tagIn   = sp(frame, fps, 14);
  const qIn     = sp(frame, fps, 30);
  const boxIn   = spPop(frame, fps, 52);
  const subIn   = sp(frame, fps, 84);

  const boxGlow = 0.22 + 0.1 * Math.sin(frame * 0.05);

  return (
    <StoryLayout storyNum={2} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} count={18} />
      <StoryGlow frame={frame} x="50%" y="55%" color={`rgba(124,58,237,${bgGlow})`} size={860} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        <div style={{
          opacity: tagIn,
          transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
          padding: '10px 28px', borderRadius: 100,
          border: '1px solid rgba(167,139,250,0.38)', background: 'rgba(124,58,237,0.14)',
          fontSize: 23, fontWeight: 700, color: 'rgba(167,139,250,0.82)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 32,
        }}>
          SAVOL
        </div>

        <div style={{ fontSize: 80, marginBottom: 8, opacity: qIn }}>🎬</div>

        <div style={{
          fontSize: 62, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em',
          color: '#fff', marginBottom: 44,
          opacity: qIn, transform: `translateY(${interpolate(qIn, [0, 1], [24, 0])}px)`,
        }}>
          Qaysi filmni{'\n'}ko'rmoqchisiz?
        </div>

        {/* Question box (Instagram UI) */}
        <div style={{
          width: '100%', borderRadius: 28,
          background: `rgba(124,58,237,${boxGlow})`,
          border: '2px solid rgba(167,139,250,0.48)',
          padding: '36px 32px',
          opacity: boxIn, transform: `scale(${interpolate(boxIn, [0, 1], [0.82, 1])})`,
          boxShadow: boxIn > 0.9 ? '0 0 40px rgba(124,58,237,0.25)' : 'none',
        }}>
          <div style={{ fontSize: 26, color: 'rgba(167,139,250,0.7)', marginBottom: 16, fontWeight: 600 }}>
            💬 Javobingizni yozing...
          </div>
          <div style={{
            height: 3, borderRadius: 2,
            background: 'rgba(167,139,250,0.3)',
            width: `${50 + 30 * Math.sin(frame * 0.04)}%`,
          }} />
        </div>

        <div style={{
          marginTop: 30, fontSize: 26, color: 'rgba(255,255,255,0.38)',
          opacity: subIn, fontWeight: 500,
        }}>
          Eng yaxshi javobga WeWatch invite! 🎁
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D3-S3: Watch Party feature showcase
export const StoryD3S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn  = sp(frame, fps, 8);
  const t1In   = sp(frame, fps, 24);
  const t2In   = sp(frame, fps, 40);
  const f1In   = spPop(frame, fps, 56);
  const f2In   = spPop(frame, fps, 74);
  const f3In   = spPop(frame, fps, 92);
  const ctaIn  = sp(frame, fps, 120);

  const feats = [
    { icon: '🎬', text: 'Xona yarating — 1 daqiqada' },
    { icon: '👥', text: "Do'stlarni link orqali taklif qiling" },
    { icon: '🔄', text: 'Sync — kadr aniqligida birga' },
  ];
  const fanims = [f1In, f2In, f3In];

  return (
    <StoryLayout storyNum={3} totalStories={3}>
      <StoryBg frame={frame} hue="220" />
      <StoryParticles frame={frame} tint="#56CFE1" count={12} />
      <StoryGlow frame={frame} x="80%" y="20%" color="rgba(14,165,233,0.16)" size={560} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 60px 160px',
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 20,
          transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
          display: 'inline-flex', alignSelf: 'flex-start',
          padding: '10px 26px', borderRadius: 100,
          border: '1px solid rgba(56,189,248,0.38)', background: 'rgba(14,165,233,0.12)',
          fontSize: 22, fontWeight: 700, color: 'rgba(125,211,252,0.85)',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        }}>WATCH PARTY</div>

        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 40 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)` }}>3 qadam</div>
          <div style={{
            color: '#7DD3FC', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [26, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(14,165,233,0.5))' : 'none',
          }}>xolos.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {feats.map((f, i) => {
            const v = fanims[i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 22,
                padding: '24px 26px', borderRadius: 22,
                background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                opacity: Math.min(1, v * 1.3), transform: `translateX(${interpolate(v, [0, 1], [-28, 0])}px)`,
              }}>
                <div style={{
                  width: 66, height: 66, flexShrink: 0, borderRadius: 16,
                  background: 'rgba(14,165,233,0.18)', border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                }}>
                  <span style={{ fontSize: 30 }}>{i + 1}</span>
                </div>
                <div style={{ fontSize: 34, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                  {f.icon} {f.text}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 32, opacity: ctaIn, fontSize: 28, color: 'rgba(125,211,252,0.6)', fontWeight: 600,
        }}>
          wewatch.uz → Hoziroq sinab ko'r ✨
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// ══════════════════════════════════════════════════════════
// DAY 4 — BATTLE MODE
// ══════════════════════════════════════════════════════════

// D4-S1: Battle scoreboard
export const StoryD4S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn   = sp(frame, fps, 8);
  const t1In    = sp(frame, fps, 24);
  const t2In    = sp(frame, fps, 42);
  const card1In = spPop(frame, fps, 60);
  const card2In = spPop(frame, fps, 76);
  const ctaIn   = sp(frame, fps, 110);

  const score1  = Math.round(interpolate(frame, [60, 150], [0, 1248], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const score2  = Math.round(interpolate(frame, [76, 160], [0, 836], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <StoryLayout storyNum={1} totalStories={3}>
      <StoryBg frame={frame} hue="16" />
      <StoryParticles frame={frame} tint="#F97316" count={16} />
      <StoryGlow frame={frame} x="50%" y="30%" color="rgba(249,115,22,0.18)" size={700} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 60px 160px', textAlign: 'center',
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 24,
          padding: '10px 26px', borderRadius: 100,
          border: '1px solid rgba(249,115,22,0.42)', background: 'rgba(249,115,22,0.12)',
          fontSize: 22, fontWeight: 700, color: 'rgba(253,186,116,0.85)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>⚔️ BATTLE MODE</div>

        <div style={{ fontSize: 104, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 44 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)` }}>
            Kim ko'proq
          </div>
          <div style={{
            color: '#FB923C', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [26, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(249,115,22,0.5))' : 'none',
          }}>
            ko'rdi? 🔥
          </div>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {/* Player 1 — winning */}
          <div style={{
            borderRadius: 22, padding: '28px 28px',
            background: 'rgba(249,115,22,0.16)', border: '2px solid rgba(253,186,116,0.4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: Math.min(1, card1In * 1.3), transform: `scale(${interpolate(card1In, [0, 1], [0.8, 1])})`,
            boxShadow: card1In > 0.9 ? '0 0 28px rgba(249,115,22,0.2)' : 'none',
          }}>
            <div>
              <div style={{ fontSize: 22, color: 'rgba(253,186,116,0.7)', marginBottom: 4 }}>🥇 Birinchi</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>@you</div>
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#FB923C' }}>
              {score1.toLocaleString()}
            </div>
          </div>

          {/* Player 2 */}
          <div style={{
            borderRadius: 22, padding: '24px 28px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: Math.min(1, card2In * 1.3), transform: `scale(${interpolate(card2In, [0, 1], [0.8, 1])})`,
          }}>
            <div>
              <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🥈 Ikkinchi</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>@do'sting</div>
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
              {score2.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 28, fontSize: 26, color: 'rgba(253,186,116,0.55)',
          opacity: ctaIn, fontWeight: 600,
        }}>
          Do'stingni battle'ga chaqir 🔥
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D4-S2: Battle poll background — "Battle'da yutasanmi?"
// Static PNG: Instagram "Opros" stikeri qo'yiladi
export const StoryD4S2: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <StoryLayout storyNum={2} totalStories={3}>
      <StoryBg frame={frame} hue="16" />
      <StoryParticles frame={frame} tint="#F97316" count={14} />
      <StoryGlow frame={frame} x="60%" y="25%" color="rgba(249,115,22,0.14)" size={620} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        {/* Emoji */}
        <div style={{
          fontSize: 122, marginBottom: 28,
          filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.5))',
        }}>⚔️</div>

        {/* Question */}
        <div style={{
          fontSize: 78, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.025em',
          color: '#fff', marginBottom: 60,
        }}>
          Battle'da{'\n'}yutasanmi?
        </div>

        {/* Poll sticker placeholder */}
        <div style={{
          width: '100%', borderRadius: 28,
          border: '2px dashed rgba(249,115,22,0.38)',
          padding: '52px 32px', textAlign: 'center',
          background: 'rgba(249,115,22,0.05)',
        }}>
          <div style={{ fontSize: 36, color: 'rgba(253,186,116,0.48)', fontWeight: 700, letterSpacing: '0.04em' }}>
            ☝️ "OPROS" STIKERI
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.22)', marginTop: 10, fontWeight: 500 }}>
            Ha 💪 / Yo'q 😅
          </div>
        </div>

        <div style={{ marginTop: 32, fontSize: 26, color: 'rgba(253,186,116,0.45)', fontWeight: 500 }}>
          WeWatch'da battle'ga kirish bepul 🎯
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D4-S3: Battle CTA
export const StoryD4S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1In  = sp(frame, fps, 10);
  const t2In  = sp(frame, fps, 28);
  const t3In  = sp(frame, fps, 48);
  const btnIn = sp(frame, fps, 72);

  const fireGlow = 10 + 8 * Math.sin(frame * 0.08);

  return (
    <StoryLayout storyNum={3} totalStories={3}>
      <StoryBg frame={frame} hue="16" />
      <StoryParticles frame={frame} tint="#F97316" count={20} />
      <StoryGlow frame={frame} x="50%" y="50%" color={`rgba(249,115,22,${0.22 + 0.08 * Math.sin(frame * 0.04)})`} size={900} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 68px 180px', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 120, marginBottom: 16,
          filter: `drop-shadow(0 0 ${fireGlow}px rgba(249,115,22,0.6))`,
          transform: `scale(${1 + 0.05 * Math.sin(frame * 0.09)})`,
        }}>🔥</div>

        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 12 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [28, 0])}px)` }}>Do'stingni</div>
          <div style={{ color: '#FB923C', opacity: t2In, transform: `translateY(${interpolate(t2In, [0, 1], [28, 0])}px)`, filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.5))' }}>battle'ga</div>
          <div style={{ color: '#fff', opacity: t3In, transform: `translateY(${interpolate(t3In, [0, 1], [28, 0])}px)` }}>chaqir!</div>
        </div>

        <div style={{
          marginTop: 44, opacity: btnIn,
          transform: `translateY(${interpolate(btnIn, [0, 1], [18, 0])}px)`,
          padding: '40px 56px', borderRadius: 30, width: '100%', textAlign: 'center' as const,
          background: `rgba(249,115,22,${0.28 + 0.1 * Math.sin(frame * 0.032)})`,
          border: '1.5px solid rgba(253,186,116,0.48)',
          fontSize: 46, fontWeight: 900, color: '#FED7AA',
        }}>
          ⚔️ wewatch.uz
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// ══════════════════════════════════════════════════════════
// DAY 5 — TIPS (4 stories)
// ══════════════════════════════════════════════════════════

interface TipStoryProps {
  num: number;
  icon: string;
  title: string;
  desc: string;
  hue: string;
  tint: string;
  accentColor: string;
}

const TipStory: React.FC<TipStoryProps> = ({ num, icon, title, desc, hue, tint, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn   = spPop(frame, fps, 8);
  const iconIn  = spPop(frame, fps, 22);
  const t1In    = sp(frame, fps, 40);
  const descIn  = sp(frame, fps, 58);
  const lineIn  = sp(frame, fps, 50);

  const lineW = interpolate(frame, [50, 110], [0, 540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <StoryLayout storyNum={num} totalStories={4}>
      <StoryBg frame={frame} hue={hue} />
      <StoryParticles frame={frame} tint={tint} count={16} />
      <StoryGlow frame={frame} x="30%" y="65%" color={`${tint}18`} size={600} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 68px 160px',
      }}>
        {/* Number badge */}
        <div style={{
          width: 88, height: 88, borderRadius: 24, marginBottom: 32,
          background: `${tint}20`, border: `2px solid ${tint}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: Math.min(1, numIn * 1.3), transform: `scale(${interpolate(numIn, [0, 1], [0.6, 1])})`,
        }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: accentColor }}>{num}</span>
        </div>

        {/* Icon */}
        <div style={{
          fontSize: 96, marginBottom: 20,
          opacity: iconIn,
          transform: `scale(${interpolate(iconIn, [0, 1], [0.5, 1])}) rotate(${4 * Math.sin(frame * 0.06)}deg)`,
          filter: `drop-shadow(0 0 ${8 + 5 * Math.sin(frame * 0.05)}px ${tint}50)`,
        }}>{icon}</div>

        {/* Title */}
        <div style={{
          fontSize: 88, fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
          color: accentColor, marginBottom: 8,
          opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [28, 0])}px)`,
          filter: t1In > 0.85 ? `drop-shadow(0 0 10px ${tint}50)` : 'none',
          textShadow: 'none',
        }}>{title}</div>

        {/* Line */}
        <div style={{
          width: lineW, height: 4, borderRadius: 2,
          background: `linear-gradient(90deg, ${tint}, transparent)`,
          marginBottom: 28, opacity: 0.7,
        }} />

        {/* Description */}
        <div style={{
          fontSize: 38, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, fontWeight: 400,
          opacity: descIn, transform: `translateY(${interpolate(descIn, [0, 1], [16, 0])}px)`,
        }}>{desc}</div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

export const StoryD5S1: React.FC = () => (
  <TipStory num={1} icon="🔄" title="Lag yo'q" hue="220"
    desc="Kadr aniqligida do'stlar bilan birga sinxron tomosha"
    tint="#38BDF8" accentColor="#7DD3FC" />
);
export const StoryD5S2: React.FC = () => (
  <TipStory num={2} icon="⚔️" title="Battle" hue="16"
    desc="Kim ko'proq film ko'rdi? Do'stingni battle'ga chaqir"
    tint="#FB923C" accentColor="#FDBA74" />
);
export const StoryD5S3: React.FC = () => (
  <TipStory num={3} icon="💬" title="Reaksiya" hue="142"
    desc="His-tuyg'ularingizni real vaqtda emoji + chat orqali ulashing"
    tint="#34D399" accentColor="#6EE7B7" />
);
export const StoryD5S4: React.FC = () => (
  <TipStory num={4} icon="🏆" title="Achievement" hue="38"
    desc="Ko'proq ko'r — ko'proq badge yig'ish. Gamification!"
    tint="#FDE047" accentColor="#FEF08A" />
);

// ══════════════════════════════════════════════════════════
// DAY 6 — SOCIAL PROOF
// ══════════════════════════════════════════════════════════

// D6-S1: User quote
export const StoryD6S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgIn   = sp(frame, fps, 4);
  const qIn    = spPop(frame, fps, 20);
  const textIn = sp(frame, fps, 38);
  const userIn = sp(frame, fps, 80);
  const starIn = sp(frame, fps, 100);

  return (
    <StoryLayout storyNum={1} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} count={14} />
      <StoryGlow frame={frame} x="50%" y="40%" color="rgba(124,58,237,0.26)" size={860} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        {/* Quote mark */}
        <div style={{
          fontSize: 140, color: 'rgba(167,139,250,0.18)', fontWeight: 900,
          lineHeight: 0.8, marginBottom: -20,
          opacity: qIn, transform: `scale(${interpolate(qIn, [0, 1], [0.6, 1])})`,
        }}>"</div>

        {/* Quote text */}
        <div style={{
          padding: '44px 40px', borderRadius: 32,
          background: 'rgba(124,58,237,0.1)', border: '1.5px solid rgba(167,139,250,0.22)',
          marginBottom: 28,
          opacity: textIn, transform: `scale(${interpolate(textIn, [0, 1], [0.92, 1])})`,
        }}>
          <div style={{
            fontSize: 50, fontWeight: 800, color: '#fff', lineHeight: 1.35,
            letterSpacing: '-0.015em',
          }}>
            Har haftasida 3–4 film ko'ramiz. WeWatch yoqdi!
          </div>
        </div>

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          opacity: userIn, transform: `translateY(${interpolate(userIn, [0, 1], [14, 0])}px)`,
        }}>
          <div style={{
            width: 62, height: 62, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            border: '2px solid rgba(167,139,250,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>😊</div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#C4B5FD' }}>@foydalanuvchi</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>WeWatch beta user</div>
          </div>
        </div>

        {/* Stars */}
        <div style={{
          marginTop: 28, fontSize: 42,
          opacity: starIn, transform: `translateY(${interpolate(starIn, [0, 1], [12, 0])}px)`,
        }}>⭐⭐⭐⭐⭐</div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D6-S2: Share CTA
export const StoryD6S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1In   = sp(frame, fps, 8);
  const t2In   = sp(frame, fps, 26);
  const arrIn  = sp(frame, fps, 48);
  const btnIn  = spPop(frame, fps, 64);

  const arrY = interpolate(Math.sin(frame * 0.09), [-1, 1], [-10, 10]);

  return (
    <StoryLayout storyNum={2} totalStories={3}>
      <StoryBg frame={frame} hue="320" />
      <StoryParticles frame={frame} tint="#E879F9" count={16} />
      <StoryGlow frame={frame} x="50%" y="45%" color="rgba(192,38,211,0.22)" size={880} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 68px 180px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 32 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)` }}>Do'stingga</div>
          <div style={{
            color: '#E879F9', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [26, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(232,121,249,0.5))' : 'none',
          }}>ulash! 📤</div>
        </div>

        <div style={{
          fontSize: 38, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
          marginBottom: 44, opacity: t2In * 0.7,
        }}>
          Do'stingni WeWatch'ga taklif qil{'\n'}va birga kino tomoshaga boshlang 🎬
        </div>

        <div style={{ fontSize: 80, opacity: arrIn, transform: `translateY(${arrY}px)` }}>👇</div>

        <div style={{
          position: 'relative', overflow: 'hidden', marginTop: 16,
          opacity: btnIn, transform: `scale(${interpolate(btnIn, [0, 1], [0.82, 1])})`,
          padding: '38px 52px', borderRadius: 28, width: '100%', textAlign: 'center' as const,
          background: `rgba(192,38,211,${0.22 + 0.08 * Math.sin(frame * 0.032)})`,
          border: '1.5px solid rgba(232,121,249,0.42)',
          fontSize: 44, fontWeight: 900, color: '#F5D0FE',
        }}>
          📤 Story ulash
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D6-S3: Tag & mention
export const StoryD6S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1In  = sp(frame, fps, 8);
  const t2In  = sp(frame, fps, 28);
  const c1In  = spPop(frame, fps, 50);
  const c2In  = spPop(frame, fps, 66);
  const c3In  = spPop(frame, fps, 82);
  const ctaIn = sp(frame, fps, 110);

  return (
    <StoryLayout storyNum={3} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} count={18} />
      <StoryGlow frame={frame} x="50%" y="40%" color="rgba(124,58,237,0.26)" size={860} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 36 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [24, 0])}px)` }}>Sinab</div>
          <div style={{
            color: '#A78BFA', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [24, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(167,139,250,0.5))' : 'none',
          }}>ko'rdingizmi?</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          {[
            { icon: '🏷️', text: '@wewatch.uz ni tag qiling' },
            { icon: '📸',  text: 'Screenshotni story ga qo\'ying' },
            { icon: '🎁',  text: 'Eng yaxshi rasm — premium 1 oy' },
          ].map((item, i) => {
            const v = [c1In, c2In, c3In][i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 22,
                padding: '26px 28px', borderRadius: 22,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(167,139,250,0.22)',
                opacity: Math.min(1, v * 1.3), transform: `translateY(${interpolate(v, [0, 1], [20, 0])}px)`,
              }}>
                <div style={{ fontSize: 40 }}>{item.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textAlign: 'left' as const }}>
                  {item.text}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 32, fontSize: 26, color: 'rgba(167,139,250,0.6)',
          opacity: ctaIn, fontWeight: 600,
        }}>
          Deadline: 7 iyun 23:59 ⏰
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// ══════════════════════════════════════════════════════════
// DAY 7 — HAFTA YAKUNI
// ══════════════════════════════════════════════════════════

// D7-S1: Weekly stats
export const StoryD7S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn   = sp(frame, fps, 8);
  const t1In    = sp(frame, fps, 24);
  const s1In    = spPop(frame, fps, 46);
  const s2In    = spPop(frame, fps, 62);
  const s3In    = spPop(frame, fps, 78);
  const ctaIn   = sp(frame, fps, 110);

  const users   = Math.round(interpolate(frame, [46, 140], [0, 1247], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const parties = Math.round(interpolate(frame, [62, 155], [0, 384], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const hours   = Math.round(interpolate(frame, [78, 170], [0, 2186], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const stats = [
    { icon: '👥', val: `${users.toLocaleString()}`, label: 'yangi foydalanuvchi', color: '#A78BFA' },
    { icon: '🎬', val: `${parties}`,                label: 'Watch Party o\'tkazildi',  color: '#38BDF8' },
    { icon: '⏱️', val: `${hours.toLocaleString()}`, label: 'soat birga tomosha', color: '#34D399' },
  ];

  return (
    <StoryLayout storyNum={1} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} count={18} />
      <StoryGlow frame={frame} x="50%" y="35%" color="rgba(124,58,237,0.24)" size={800} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 60px 160px',
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 24,
          display: 'inline-flex', alignSelf: 'flex-start',
          padding: '10px 26px', borderRadius: 100,
          border: '1px solid rgba(167,139,250,0.38)', background: 'rgba(124,58,237,0.14)',
          fontSize: 22, fontWeight: 700, color: 'rgba(167,139,250,0.82)',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        }}>📊 HAFTALIK NATIJALAR</div>

        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 44 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)` }}>
            Bu hafta
          </div>
          <div style={{
            color: '#A78BFA', opacity: t1In,
            transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)`,
            filter: t1In > 0.85 ? 'drop-shadow(0 0 10px rgba(167,139,250,0.5))' : 'none',
          }}>ajoyib edi 🎉</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stats.map((s, i) => {
            const v = [s1In, s2In, s3In][i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 22,
                padding: '22px 26px', borderRadius: 20,
                background: `${s.color}14`, border: `1px solid ${s.color}30`,
                opacity: Math.min(1, v * 1.3), transform: `translateX(${interpolate(v, [0, 1], [-30, 0])}px)`,
              }}>
                <div style={{ fontSize: 44, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, fontSize: 26, color: 'rgba(255,255,255,0.35)', opacity: ctaIn, fontWeight: 500 }}>
          Keyingi hafta yanada ko'proq 🚀
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D7-S2: Coming soon teaser
export const StoryD7S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = sp(frame, fps, 8);
  const t1In  = sp(frame, fps, 26);
  const t2In  = sp(frame, fps, 44);
  const f1In  = spPop(frame, fps, 66);
  const f2In  = spPop(frame, fps, 82);
  const ctaIn = sp(frame, fps, 112);

  return (
    <StoryLayout storyNum={2} totalStories={3}>
      <StoryBg frame={frame} hue="38" />
      <StoryParticles frame={frame} tint="#FDE047" count={14} />
      <StoryGlow frame={frame} x="60%" y="25%" color="rgba(234,179,8,0.14)" size={620} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '120px 60px 160px',
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 24, display: 'inline-flex', alignSelf: 'flex-start',
          padding: '10px 26px', borderRadius: 100,
          border: '1px solid rgba(234,179,8,0.42)', background: 'rgba(234,179,8,0.1)',
          fontSize: 22, fontWeight: 700, color: 'rgba(253,224,71,0.85)',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        }}>👀 TEZDA</div>

        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 44 }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `translateY(${interpolate(t1In, [0, 1], [26, 0])}px)` }}>Yangi</div>
          <div style={{
            color: '#FDE047', opacity: t2In,
            transform: `translateY(${interpolate(t2In, [0, 1], [26, 0])}px)`,
            filter: t2In > 0.85 ? 'drop-shadow(0 0 12px rgba(234,179,8,0.5))' : 'none',
          }}>feature'lar ✨</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '📱', text: 'Mobile app — App Store + Play Store', v: f1In },
            { icon: '🎭', text: 'Karaoke mode — qo\'shiq ayt', v: f2In },
          ].map((item) => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '26px 26px', borderRadius: 22,
              background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.22)',
              opacity: Math.min(1, item.v * 1.3), transform: `translateX(${interpolate(item.v, [0, 1], [-28, 0])}px)`,
            }}>
              <div style={{ fontSize: 44, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>{item.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, fontSize: 26, color: 'rgba(253,224,71,0.55)', opacity: ctaIn, fontWeight: 600 }}>
          Notifikatsiyani yoq — birinchi bo'l 🔔
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};

// D7-S3: End-of-week poll background — "Qaysi feature eng yoqdi?"
// Static PNG: Instagram "Viktorina" (quiz) yoki "Opros" stikeri qo'yiladi
export const StoryD7S3: React.FC = () => {
  const frame = useCurrentFrame();

  const opts = [
    { emoji: '🎬', text: 'WatchParty', color: 'rgba(124,58,237,0.18)', border: 'rgba(167,139,250,0.28)' },
    { emoji: '⚔️',  text: 'Battle mode',    color: 'rgba(249,115,22,0.14)',  border: 'rgba(253,186,116,0.28)' },
    { emoji: '🏆', text: 'Achievements',    color: 'rgba(234,179,8,0.12)',   border: 'rgba(253,224,71,0.28)' },
  ];

  return (
    <StoryLayout storyNum={3} totalStories={3}>
      <StoryBg frame={frame} hue="265" />
      <StoryParticles frame={frame} count={16} />
      <StoryGlow frame={frame} x="50%" y="40%" color="rgba(124,58,237,0.24)" size={840} />
      <StoryScanLine frame={frame} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '120px 64px 160px', textAlign: 'center',
      }}>
        {/* Emoji */}
        <div style={{
          fontSize: 108, marginBottom: 24,
          filter: 'drop-shadow(0 0 16px rgba(167,139,250,0.4))',
        }}>🗳️</div>

        {/* Question */}
        <div style={{
          fontSize: 68, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.025em',
          color: '#fff', marginBottom: 48,
        }}>
          Qaysi feature{'\n'}eng yoqdi?
        </div>

        {/* 3 option cards — visual hint, no votes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginBottom: 32 }}>
          {opts.map((opt) => (
            <div key={opt.text} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '22px 28px', borderRadius: 20,
              background: opt.color, border: `1px solid ${opt.border}`,
            }}>
              <span style={{ fontSize: 38 }}>{opt.emoji}</span>
              <span style={{ fontSize: 34, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{opt.text}</span>
            </div>
          ))}
        </div>

        {/* Poll sticker placeholder */}
        <div style={{
          width: '100%', borderRadius: 24,
          border: '2px dashed rgba(167,139,250,0.32)',
          padding: '32px', textAlign: 'center',
          background: 'rgba(124,58,237,0.05)',
        }}>
          <div style={{ fontSize: 28, color: 'rgba(167,139,250,0.45)', fontWeight: 700, letterSpacing: '0.04em' }}>
            ☝️ "VIKTORINA" STIKERI
          </div>
        </div>
      </AbsoluteFill>
    </StoryLayout>
  );
};
