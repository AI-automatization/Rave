import React from 'react';
import {
  AbsoluteFill, interpolate, spring, Sequence,
  useCurrentFrame, useVideoConfig,
} from 'remotion';

export const REEL3_DURATION = 30 * 30;
const FPS = 30;

// ─── Animation helpers ────────────────────────────────────
const sm = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 26, mass: 0.85, stiffness: 110 }, delay });

const pop = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 11, mass: 0.7, stiffness: 260 }, delay });

// ─── Shared dark bg ───────────────────────────────────────
const DarkBg: React.FC<{ frame: number; hue?: number }> = ({ frame, hue = 265 }) => {
  const x = 38 + 9 * Math.sin(frame * 0.004);
  const y = 32 + 7 * Math.cos(frame * 0.003);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${x}% ${y}%, hsl(${hue},65%,11%) 0%, hsl(${hue},52%,5%) 55%, #020108 100%)`,
    }}>
      <AbsoluteFill style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E\")",
        backgroundSize: '256px',
      }} />
    </AbsoluteFill>
  );
};

// ─── Floating particles ───────────────────────────────────
const Pts: React.FC<{ frame: number; tint?: string }> = ({ frame, tint = '#A78BFA' }) => {
  const pts = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 137.5) % 100, baseY: (i * 79.4) % 100,
    speed: 0.013 + (i % 5) * 0.006, size: 1.0 + (i % 3) * 1.0,
    op: 0.018 + (i % 4) * 0.02, ph: (i * 1.618) % (2 * Math.PI),
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        {pts.map((p, i) => {
          const y = ((p.baseY - frame * p.speed) + 300) % 100;
          const x = p.x + Math.sin(frame * 0.013 + p.ph) * 1.4;
          const op = p.op * (0.5 + 0.5 * Math.sin(frame * 0.02 + p.ph));
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={p.size} fill={tint} opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ─── Glow orb ────────────────────────────────────────────
const Glow: React.FC<{ frame: number; x?: string; y?: string; color?: string; size?: number }> = ({
  frame, x = '50%', y = '50%', color = 'rgba(124,58,237,0.3)', size = 920,
}) => {
  const b = 0.55 + 0.35 * Math.sin(frame * 0.022);
  const s = 0.94 + 0.06 * Math.sin(frame * 0.016);
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
      width: size, height: size,
      left: `calc(${x} - ${size / 2}px)`, top: `calc(${y} - ${size / 2}px)`,
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      opacity: b, transform: `scale(${s})`,
    }} />
  );
};

// ─── Crossfade ────────────────────────────────────────────
const Fade: React.FC<{ frame: number; at: number; dur?: number }> = ({ frame, at, dur = 16 }) => {
  const p = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = p < 0.5 ? interpolate(p, [0, 0.5], [0, 0.9]) : interpolate(p, [0.5, 1], [0.9, 0]);
  return <AbsoluteFill style={{ background: '#000', opacity: op, pointerEvents: 'none' }} />;
};

// ══════════════════════════════════════════════════════════
// PHASE 1 — HOOK (0–5s): "DO'STING BOSHQA SHAHARDA?"
// Black bg, each word zoom-in from blur — Dowork style
// ══════════════════════════════════════════════════════════
const HookPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const w1 = sm(frame, fps, 2);
  const w2 = sm(frame, fps, 18);
  const w3 = sm(frame, fps, 36);
  const w4 = sm(frame, fps, 54);

  const word = (v: number, text: string, color = '#fff') => ({
    color,
    opacity: v,
    filter: `blur(${interpolate(v, [0, 1], [28, 0])}px)`,
    transform: `scale(${interpolate(v, [0, 1], [1.18, 1])})`,
    display: 'block',
  });

  return (
    <AbsoluteFill style={{
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'center',
      padding: '0 72px',
    }}>
      <div style={{ fontSize: 148, fontWeight: 900, lineHeight: 0.96, letterSpacing: '-0.04em', fontFamily: 'system-ui' }}>
        <span style={word(w1, "DO'STING")}>DO'STING</span>
        <span style={word(w2, 'BOSHQA', '#A78BFA')}>BOSHQA</span>
        <span style={word(w3, 'SHAHARDA?')}>SHAHARDA?</span>
      </div>
      <div style={{
        marginTop: 44, fontSize: 36, color: 'rgba(255,255,255,0.42)', fontWeight: 500,
        opacity: w4, transform: `translateY(${interpolate(w4, [0, 1], [16, 0])}px)`,
      }}>
        Birga kino ko'rmoqchimisan?
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// PHASE 2 — SOLUTION (5–9s): "BIZ — WeWatch."
// Dark purple bg, centered reveal
// ══════════════════════════════════════════════════════════
const SolutionPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = 1 + 0.018 * Math.sin(frame * 0.01);
  const tagIn  = sm(frame, fps, 4);
  const l1     = sm(frame, fps, 18);
  const l2     = sm(frame, fps, 36);
  const subIn  = sm(frame, fps, 58);
  const glow   = l2 > 0.85 ? 12 + 8 * Math.sin(frame * 0.04) : 0;

  const wRot = frame * 0.01;

  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 68%, #1a0540 0%, #0a0420 46%, #03010c 100%)',
        transform: `scale(${bgScale})`,
      }} />
      <Pts frame={frame} />
      <Glow frame={frame} x="75%" y="30%" color="rgba(124,58,237,0.4)" size={840} />

      {/* Ghost W watermark */}
      <div style={{
        position: 'absolute', top: -120, left: -90,
        opacity: 0.06, transform: `rotate(${wRot}deg)`,
        fontSize: 720, fontWeight: 900, color: '#A78BFA',
        letterSpacing: '-0.06em', lineHeight: 1, userSelect: 'none' as const,
      }}>W</div>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 72px', textAlign: 'center',
      }}>
        {/* Tag */}
        <div style={{
          opacity: tagIn, marginBottom: 44,
          transform: `translateY(${interpolate(tagIn, [0, 1], [-16, 0])}px)`,
          padding: '14px 34px', borderRadius: 100,
          border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(124,58,237,0.16)',
          fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.88)',
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>YECHIM</div>

        <div style={{ fontSize: 152, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
          <div style={{
            color: '#fff', opacity: l1,
            transform: `scale(${interpolate(l1, [0, 1], [0.86, 1])})`,
          }}>Biz —</div>
          <div style={{
            color: '#A78BFA', opacity: l2,
            transform: `scale(${interpolate(l2, [0, 1], [0.86, 1])})`,
            filter: glow > 0 ? `drop-shadow(0 0 ${glow}px rgba(167,139,250,0.55))` : 'none',
          }}>WeWatch.</div>
        </div>

        <div style={{
          opacity: subIn * 0.65, marginTop: 44,
          fontSize: 38, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, fontWeight: 400,
          transform: `translateY(${interpolate(subIn, [0, 1], [18, 0])}px)`,
        }}>
          Do'stlar bilan birga.{'\n'}Bir vaqtda. Istalgan joydan.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// PHASE 3 — FEATURES (9–15s): 4 large glass-clay pills
// Dark purple bg, pills pop in with strong bounce
// ══════════════════════════════════════════════════════════
const FeaturesPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = sm(frame, fps, 4);
  const p1 = pop(frame, fps, 12);
  const p2 = pop(frame, fps, 28);
  const p3 = pop(frame, fps, 44);
  const p4 = pop(frame, fps, 60);

  const pills = [
    { emoji: '🎬', label: 'WATCH PARTY',  color: '#7C3AED', hi: '#C4B5FD', rgb: '124,58,237'  },
    { emoji: '⚔️',  label: 'BATTLE MODE', color: '#EA580C', hi: '#FED7AA', rgb: '234,88,12'   },
    { emoji: '🔄', label: 'LIVE SYNC',    color: '#0369A1', hi: '#BAE6FD', rgb: '3,105,161'   },
    { emoji: '🏆', label: 'ACHIEVEMENT',  color: '#15803D', hi: '#BBF7D0', rgb: '21,128,61'   },
  ];
  const anims = [p1, p2, p3, p4];

  return (
    <AbsoluteFill>
      <DarkBg frame={frame} />
      <Pts frame={frame} />
      <Glow frame={frame} x="20%" y="80%" color="rgba(124,58,237,0.2)" size={700} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '110px 64px 100px' }}>
        {/* Logo */}
        <div style={{
          opacity: logoIn, marginBottom: 52,
          transform: `translateY(${interpolate(logoIn, [0, 1], [-16, 0])}px)`,
          fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff',
        }}>
          <span style={{ color: '#A78BFA' }}>W</span>eWatch
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
          {pills.map((p, i) => {
            const v = anims[i];
            return (
              <div key={p.label} style={{
                flex: 1,
                borderRadius: 28,
                background: `rgba(${p.rgb},0.12)`,
                border: `2px solid rgba(${p.rgb},0.35)`,
                boxShadow: `0 8px 32px rgba(${p.rgb},0.18), inset 0 1px 0 rgba(255,255,255,0.08)`,
                display: 'flex', alignItems: 'center', gap: 32, padding: '0 44px',
                opacity: Math.min(1, v * 1.2),
                transform: `scale(${interpolate(v, [0, 1], [0.65, 1])}) translateX(${interpolate(v, [0, 1], [-60, 0])}px)`,
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: 22, flexShrink: 0,
                  background: `rgba(${p.rgb},0.22)`, border: `1.5px solid rgba(${p.rgb},0.4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                  boxShadow: `0 0 18px rgba(${p.rgb},0.3)`,
                }}>{p.emoji}</div>
                <span style={{
                  fontSize: 56, fontWeight: 900, letterSpacing: '0.04em',
                  color: p.hi, textTransform: 'uppercase' as const,
                  textShadow: `0 0 32px rgba(${p.rgb},0.5)`,
                }}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// PHASE 4 — HOW IT WORKS (15–21s): 3 steps pop-in
// Replaces meaningless icon grid with clear story
// ══════════════════════════════════════════════════════════
const HowItWorksPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = sm(frame, fps, 4);
  const s1 = pop(frame, fps, 18);
  const s2 = pop(frame, fps, 42);
  const s3 = pop(frame, fps, 66);
  const s4 = pop(frame, fps, 90);

  const steps = [
    { num: '01', emoji: '📱', title: 'Ilovani yukla',       desc: 'wewatch.uz — bepul',          color: '124,58,237',  hi: '#C4B5FD' },
    { num: '02', emoji: '🏠', title: 'Xona yarating',       desc: '30 soniyada tayyor',           color: '14,165,233',  hi: '#7DD3FC' },
    { num: '03', emoji: '👥', title: "Do'stlarni taklif qil", desc: 'Link yubor — kirdi!',        color: '5,150,105',   hi: '#6EE7B7' },
    { num: '04', emoji: '🎬', title: 'Birga kino ko\'ring',  desc: 'Sync, chat, reaksiyalar',     color: '217,119,6',   hi: '#FCD34D' },
  ];
  const anims = [s1, s2, s3, s4];

  return (
    <AbsoluteFill>
      <DarkBg frame={frame} hue={255} />
      <Pts frame={frame} />
      <Glow frame={frame} x="80%" y="15%" color="rgba(14,165,233,0.14)" size={560} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '100px 60px 90px' }}>
        {/* Title */}
        <div style={{
          opacity: titleIn, marginBottom: 48,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-18, 0])}px)`,
        }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'rgba(167,139,250,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
            QANDAY ISHLAYDI?
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            4 qadam<span style={{ color: '#A78BFA' }}>.</span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {steps.map((s, i) => {
            const v = anims[i];
            return (
              <div key={i} style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: 28,
                padding: '0 32px', borderRadius: 24,
                background: `rgba(${s.color},0.1)`,
                border: `1.5px solid rgba(${s.color},0.28)`,
                opacity: Math.min(1, v * 1.2),
                transform: `translateX(${interpolate(v, [0, 1], [-80, 0])}px) scale(${interpolate(v, [0, 1], [0.88, 1])})`,
                boxShadow: `0 4px 24px rgba(${s.color},0.12)`,
              }}>
                {/* Number */}
                <div style={{
                  fontSize: 52, fontWeight: 900, color: `rgba(${s.color},0.35)`,
                  letterSpacing: '-0.04em', flexShrink: 0, width: 68,
                }}>{s.num}</div>

                {/* Emoji */}
                <div style={{
                  width: 76, height: 76, borderRadius: 20, flexShrink: 0,
                  background: `rgba(${s.color},0.18)`, border: `1.5px solid rgba(${s.color},0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34,
                }}>{s.emoji}</div>

                {/* Text */}
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: s.hi, lineHeight: 1.1 }}>{s.title}</div>
                  <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// PHASE 5 — STATS (21–27s): animated counter + chart
// ══════════════════════════════════════════════════════════

const LineChart: React.FC<{ progress: number }> = ({ progress }) => {
  const pts: [number, number][] = [
    [0, 160], [70, 148], [130, 118], [190, 128], [260, 84], [340, 62], [410, 44], [510, 18],
  ];
  const total = pts.length - 1;
  const drawTo = progress * total;
  const drawn = pts.slice(0, Math.floor(drawTo) + 2);
  if (drawn.length < 2) return null;
  const d = drawn.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const ei = Math.min(Math.floor(drawTo), total - 1);
  const fr = drawTo - ei;
  const [x1, y1] = pts[ei];
  const [x2, y2] = pts[Math.min(ei + 1, total)];
  const dx = x1 + (x2 - x1) * fr;
  const dy = y1 + (y2 - y1) * fr;
  return (
    <svg width="100%" height={200} viewBox="0 0 520 180" style={{ overflow: 'visible' }}>
      {[40, 100, 160].map((y) => (
        <line key={y} x1={0} y1={y} x2={520} y2={y} stroke="rgba(167,139,250,0.12)" strokeWidth={1} strokeDasharray="5,4" />
      ))}
      <path d={d} fill="none" stroke="#A78BFA" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      {progress > 0.06 && (
        <>
          <circle cx={dx} cy={dy} r={10} fill="rgba(124,58,237,0.25)" />
          <circle cx={dx} cy={dy} r={6} fill="#A78BFA" />
        </>
      )}
    </svg>
  );
};

const StatsPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn  = sm(frame, fps, 4);
  const cardIn  = sm(frame, fps, 14);
  const numIn   = sm(frame, fps, 24);
  const chartPg = interpolate(frame, [30, 155], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const badgeIn = sm(frame, fps, 110);

  const count = Math.round(interpolate(frame, [24, 145], [0, 1247], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <AbsoluteFill>
      <DarkBg frame={frame} hue={258} />
      <Pts frame={frame} />
      <Glow frame={frame} x="50%" y="38%" color="rgba(124,58,237,0.22)" size={860} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 52px 120px' }}>
        {/* Logo */}
        <div style={{ opacity: logoIn, marginBottom: 44, fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          <span style={{ color: '#A78BFA' }}>W</span>eWatch
        </div>

        {/* Stats card */}
        <div style={{
          width: '100%', borderRadius: 36,
          background: 'rgba(124,58,237,0.1)',
          border: '1.5px solid rgba(167,139,250,0.24)',
          boxShadow: '0 24px 64px rgba(124,58,237,0.18)',
          padding: '44px 44px 36px',
          opacity: Math.min(1, cardIn * 1.2),
          transform: `scale(${interpolate(cardIn, [0, 1], [0.88, 1])}) translateY(${interpolate(cardIn, [0, 1], [32, 0])}px)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(167,139,250,0.55)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                FOYDALANUVCHILAR
              </div>
              <div style={{
                fontSize: 76, fontWeight: 900, color: '#fff', lineHeight: 1.05,
                opacity: numIn, transform: `translateY(${interpolate(numIn, [0, 1], [16, 0])}px)`,
              }}>
                {count.toLocaleString()}
              </div>
            </div>
            <div style={{
              padding: '14px 24px', borderRadius: 100,
              background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.32)',
              fontSize: 28, fontWeight: 800, color: '#C4B5FD',
              opacity: badgeIn,
            }}>
              📈 +18%
            </div>
          </div>

          <div style={{ fontSize: 22, color: 'rgba(167,139,250,0.45)', marginBottom: 20, fontWeight: 600 }}>
            • VA TEZ SUR'ATLARDA RIVOJLANMOQDA
          </div>

          <LineChart progress={chartPg} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {['1Hafta', '2Hafta', '3Hafta', '4Hafta'].map((l) => (
              <div key={l} style={{ fontSize: 20, color: 'rgba(167,139,250,0.35)', fontWeight: 600 }}>{l}</div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// PHASE 6 — CTA (27–30s): circle rings + wewatch.uz
// ══════════════════════════════════════════════════════════
const CTAPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1In  = sm(frame, fps, 8);
  const t2In  = sm(frame, fps, 24);
  const btnIn = sm(frame, fps, 40);

  const glow = 0.32 + 0.14 * Math.sin(frame * 0.028);

  return (
    <AbsoluteFill>
      <DarkBg frame={frame} hue={268} />
      <Pts frame={frame} />

      {/* Rings */}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[860, 660, 480].map((size, i) => (
          <div key={i} style={{
            position: 'absolute', width: size, height: size, borderRadius: '50%',
            border: `1px solid rgba(167,139,250,${0.06 + i * 0.04})`,
            transform: `scale(${0.96 + 0.04 * Math.sin(frame * (0.016 + i * 0.005) + i * 1.2)})`,
          }} />
        ))}
        <div style={{
          position: 'absolute', width: 820, height: 820, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(124,58,237,${glow}) 0%, transparent 58%)`,
          transform: `scale(${0.96 + 0.04 * Math.sin(frame * 0.026)})`,
        }} />
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 80px', textAlign: 'center',
        paddingBottom: 280,
      }}>
        <div style={{ fontSize: 148, fontWeight: 900, lineHeight: 0.96, letterSpacing: '-0.04em' }}>
          <div style={{ color: '#fff', opacity: t1In, transform: `scale(${interpolate(t1In, [0, 1], [0.86, 1])})` }}>
            Birinchilar
          </div>
          <div style={{
            color: '#A78BFA', opacity: t2In,
            transform: `scale(${interpolate(t2In, [0, 1], [0.86, 1])})`,
            filter: t2In > 0.85 ? `drop-shadow(0 0 ${14 + 8 * Math.sin(frame * 0.036)}px rgba(167,139,250,0.52))` : 'none',
          }}>
            qatorida bo'l.
          </div>
        </div>

        <div style={{
          opacity: btnIn, transform: `translateY(${interpolate(btnIn, [0, 1], [20, 0])}px)`,
          marginTop: 52, padding: '42px 64px', borderRadius: 32,
          background: `rgba(124,58,237,${0.28 + 0.1 * Math.sin(frame * 0.032)})`,
          border: '1.5px solid rgba(167,139,250,0.45)',
          fontSize: 50, fontWeight: 900, color: '#C4B5FD',
          width: '100%', textAlign: 'center' as const,
          boxShadow: `0 0 48px rgba(124,58,237,${0.22 + 0.08 * Math.sin(frame * 0.032)})`,
        }}>
          🌐 wewatch.uz
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════
export const WeWatchReel3: React.FC = () => {
  const frame = useCurrentFrame();
  const transitions = [5, 9, 15, 21, 27].map((s) => s * FPS);

  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#000' }}>
      <Sequence from={0}         durationInFrames={5  * FPS}><HookPhase /></Sequence>
      <Sequence from={5  * FPS}  durationInFrames={4  * FPS}><SolutionPhase /></Sequence>
      <Sequence from={9  * FPS}  durationInFrames={6  * FPS}><FeaturesPhase /></Sequence>
      <Sequence from={15 * FPS}  durationInFrames={6  * FPS}><HowItWorksPhase /></Sequence>
      <Sequence from={21 * FPS}  durationInFrames={6  * FPS}><StatsPhase /></Sequence>
      <Sequence from={27 * FPS}  durationInFrames={3  * FPS}><CTAPhase /></Sequence>

      {transitions.map((at) => (
        <Fade key={at} frame={frame} at={at - 9} dur={16} />
      ))}
    </AbsoluteFill>
  );
};
