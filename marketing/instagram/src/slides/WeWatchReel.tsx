import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { Logo, LogoIcon } from '../components/Logo';

// ─── Phase timing (frames) ────────────────────────────────────
const FPS = 30;
// Hook 3s | Problem 5s | Solution 4s | Features 7s | CTA 5s = 24s
const P = {
  intro:    [0,        3  * FPS],   // 0–90
  problem:  [3  * FPS, 8  * FPS],   // 90–240
  solution: [8  * FPS, 12 * FPS],   // 240–360
  feats:    [12 * FPS, 19 * FPS],   // 360–570
  cta:      [19 * FPS, 24 * FPS],   // 570–720
};
const TOTAL_FRAMES = 24 * FPS; // 720

// ─── Spring helpers ───────────────────────────────────────────
// Smooth gentle entrance
const spSmooth = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 26, mass: 1.0, stiffness: 75 }, delay });
// Pop with overshoot for cards
const spPop = (f: number, fps: number, delay = 0) =>
  spring({ frame: f, fps, config: { damping: 11, mass: 0.75, stiffness: 220 }, delay });

// ─── Floating particles ───────────────────────────────────────
const Particles: React.FC<{ frame: number; tint?: string; count?: number }> = ({
  frame, tint = '#A78BFA', count = 16,
}) => {
  const pts = Array.from({ length: count }, (_, i) => ({
    x: ((i * 137.508) % 100), baseY: ((i * 79.371) % 100),
    speed: 0.016 + (i % 5) * 0.007, size: 1.2 + (i % 3) * 1.1,
    op: 0.022 + (i % 4) * 0.025, ph: (i * 1.618) % (2 * Math.PI),
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        {pts.map((p, i) => {
          const y  = ((p.baseY - frame * p.speed) + 300) % 100;
          const x  = p.x + Math.sin(frame * 0.013 + p.ph) * 1.4;
          const op = p.op * (0.5 + 0.5 * Math.sin(frame * 0.022 + p.ph));
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={p.size} fill={tint} opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ─── Scan line ────────────────────────────────────────────────
const ScanLine: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0,
    top: ((frame * 1.1) % 2200) - 150, height: 200, pointerEvents: 'none',
    background: 'linear-gradient(180deg, transparent, rgba(167,139,250,0.018), transparent)',
  }} />
);

// ─── Breathing glow ───────────────────────────────────────────
const BreathGlow: React.FC<{
  frame: number; x?: string; y?: string; color?: string; size?: number;
}> = ({ frame, x = '50%', y = '50%', color = 'rgba(124,58,237,0.28)', size = 840 }) => {
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

// ─── Card shimmer ─────────────────────────────────────────────
const Shimmer: React.FC<{ frame: number; delay?: number }> = ({ frame, delay = 0 }) => {
  const pos = ((frame * 1.4 + delay) % 420) - 110;
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', overflow: 'hidden',
      background: `linear-gradient(105deg, transparent ${pos - 70}%, rgba(167,139,250,0.038) ${pos}%, transparent ${pos + 70}%)`,
    }} />
  );
};

// ─── Animated bg ─────────────────────────────────────────────
const AnimBg: React.FC<{ frame: number; hue?: string }> = ({ frame, hue = '260' }) => {
  const x = 28 + 7 * Math.sin(frame * 0.005);
  const y = 28 + 6 * Math.cos(frame * 0.004);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${x}% ${y}%, hsl(${hue},64%,13%) 0%, hsl(${hue},54%,5%) 52%, #020108 100%)`,
    }}>
      <AbsoluteFill style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        backgroundSize: '256px',
      }} />
    </AbsoluteFill>
  );
};

// ─── Tag pill ─────────────────────────────────────────────────
const Tag: React.FC<{ label: string; color?: string; v: number }> = ({ label, color = '#7C3AED', v }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', marginBottom: 42,
    padding: '13px 34px', borderRadius: 100,
    border: `1px solid ${color}42`, background: `${color}18`,
    fontSize: 27, fontWeight: 700, color: `${color}aa`,
    letterSpacing: '0.09em', textTransform: 'uppercase' as const,
    opacity: v, transform: `translateY(${interpolate(v, [0, 1], [14, 0])}px)`,
  }}>{label}</div>
);

// ─── Line wipe ────────────────────────────────────────────────
const LineWipe: React.FC<{ frame: number; from?: number; color?: string }> = ({
  frame, from = 14, color = 'linear-gradient(90deg,#7C3AED,transparent)',
}) => (
  <div style={{
    width: Math.min(460, interpolate(frame, [from, from + 55], [0, 460], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
    height: 4, borderRadius: 2, margin: '38px 0',
    background: color, opacity: 0.75 + 0.2 * Math.sin(frame * 0.045),
  }} />
);

// ─── Crossfade transition ─────────────────────────────────────
const CrossFade: React.FC<{ frame: number; at: number; dur?: number }> = ({ frame, at, dur = 24 }) => {
  const p  = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = p < 0.5
    ? interpolate(p, [0, 0.5], [0, 0.9])
    : interpolate(p, [0.5, 1], [0.9, 0]);
  return <AbsoluteFill style={{ background: '#03020a', opacity: op, pointerEvents: 'none' }} />;
};

// ═══════════════════════════════════════
// HOOK / INTRO  (3s) — stops the scroll
// ═══════════════════════════════════════
const IntroPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const w1  = spSmooth(frame, fps, 2);
  const w2  = spSmooth(frame, fps, 14);
  const sub = spSmooth(frame, fps, 30);
  const pulse = 1 + 0.04 * Math.sin(frame * 0.07);

  return (
    <AbsoluteFill>
      <AnimBg frame={frame} hue="265" />
      <Particles frame={frame} />
      <BreathGlow frame={frame} x="50%" y="46%" color="rgba(124,58,237,0.36)" size={920} />
      <ScanLine frame={frame} />

      {/* Small logo top-left */}
      <div style={{ position: 'absolute', top: 52, left: 52, opacity: w1 * 0.7 }}>
        <Logo size={40} />
      </div>

      {/* HOOK — question that stops scroll */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 72px', textAlign: 'center',
      }}>
        {/* Bouncing emoji above text */}
        <div style={{
          fontSize: 120,
          opacity: w1,
          transform: `translateY(${interpolate(w1, [0, 1], [-40, 0])}px) scale(${1 + 0.08 * Math.sin(frame * 0.12)}) rotate(${4 * Math.sin(frame * 0.09)}deg)`,
          marginBottom: 16,
          filter: `drop-shadow(0 0 ${16 + 8 * Math.sin(frame * 0.06)}px rgba(167,139,250,0.4))`,
        }}>🎬</div>

        <div style={{ fontSize: 152, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
          <div style={{
            color: '#fff', opacity: w1,
            transform: `translateY(${interpolate(w1, [0, 1], [30, 0])}px)`,
          }}>Do'sting</div>
          <div style={{
            color: '#A78BFA', opacity: w2,
            transform: `translateY(${interpolate(w2, [0, 1], [30, 0])}px) scale(${pulse})`,
            filter: w2 > 0.85 ? `drop-shadow(0 0 ${14 + 6 * Math.sin(frame * 0.04)}px rgba(167,139,250,0.5))` : 'none',
          }}>boshqa shaharda?</div>
        </div>

        <div style={{
          opacity: sub * 0.6, marginTop: 36,
          fontSize: 38, color: 'rgba(255,255,255,0.55)', fontWeight: 500,
          transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
        }}>
          Birga kino ko'rmoqchimisan?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════
// PROBLEM  (6s)
// ═══════════════════════════════════════
const ProblemPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Words appear slowly — 20 frame stagger
  const tagIn = spSmooth(frame, fps, 4);
  const w1    = spSmooth(frame, fps, 18);
  const w2    = spSmooth(frame, fps, 36);
  const w3    = spSmooth(frame, fps, 54);
  const subIn = spSmooth(frame, fps, 80);

  return (
    <AbsoluteFill>
      <AnimBg frame={frame} hue="42" />
      <Particles frame={frame} tint="#EAB308" count={12} />
      <BreathGlow frame={frame} x="70%" y="22%" color="rgba(234,179,8,0.14)" size={620} />
      <ScanLine frame={frame} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>
        <Tag label="MUAMMO" color="#EAB308" v={tagIn} />

        <div style={{ fontSize: 148, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em' }}>
          <div style={{ color: '#fff',    opacity: w1, transform: `translateY(${interpolate(w1, [0, 1], [26, 0])}px)` }}>Filmni</div>
          <div style={{ color: '#A78BFA', opacity: w2, transform: `translateY(${interpolate(w2, [0, 1], [26, 0])}px)` }}>yolg'iz</div>
          <div style={{ color: '#fff',    opacity: w3, transform: `translateY(${interpolate(w3, [0, 1], [26, 0])}px)` }}>ko'ryapsanmi?</div>
        </div>

        <LineWipe frame={frame} from={56} color="linear-gradient(90deg,#EAB308,transparent)" />

        <div style={{
          opacity: subIn, fontSize: 40, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, maxWidth: 860,
          transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
        }}>
          Do'stlaringiz boshqa shaharda —{'\n'}lekin kino birga ko'riladi.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════
// SOLUTION  (5s) — right-aligned, bottom-anchored, distinct from Problem
// ═══════════════════════════════════════
const SolutionPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = 1 + 0.022 * Math.sin(frame * 0.011);
  const tagIn   = spSmooth(frame, fps, 4);
  const l1      = spSmooth(frame, fps, 18);
  const l2      = spSmooth(frame, fps, 38);
  const subIn   = spSmooth(frame, fps, 64);
  const logoWm  = spSmooth(frame, fps, 2);

  const glow = l2 > 0.85 ? 13 + 7 * Math.sin(frame * 0.038) : 0;
  const wRot = frame * 0.012;

  return (
    <AbsoluteFill>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 70%, #1a0540 0%, #0a0420 46%, #03010c 100%)',
        transform: `scale(${bgScale})`,
      }} />
      <Particles frame={frame} count={18} />
      <BreathGlow frame={frame} x="75%" y="30%" color="rgba(124,58,237,0.38)" size={820} />
      <ScanLine frame={frame} />

      {/* Ghost watermark — large WeWatch "W" rotates slowly top-left */}
      <div style={{
        position: 'absolute', top: -120, left: -100,
        opacity: logoWm * 0.07,
        transform: `rotate(${wRot}deg) scale(${1 + 0.015 * Math.sin(frame * 0.018)})`,
        fontSize: 680, fontWeight: 900, color: '#A78BFA',
        letterSpacing: '-0.06em', lineHeight: 1, userSelect: 'none',
      }}>W</div>

      {/* Content — centered */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '0 80px', textAlign: 'center',
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 36,
          transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
          display: 'inline-flex', padding: '12px 30px', borderRadius: 100,
          border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.15)',
          fontSize: 26, fontWeight: 700, color: 'rgba(167,139,250,0.85)',
          letterSpacing: '0.09em', textTransform: 'uppercase' as const,
        }}>YECHIM</div>

        <div style={{ fontSize: 148, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', marginBottom: 28 }}>
          <div style={{
            color: '#fff', opacity: l1,
            transform: `scale(${interpolate(l1, [0, 1], [0.88, 1])})`,
          }}>Biz —</div>
          <div style={{
            color: '#A78BFA', opacity: l2,
            transform: `scale(${interpolate(l2, [0, 1], [0.88, 1])})`,
            filter: glow > 0 ? `drop-shadow(0 0 ${glow}px rgba(167,139,250,0.52))` : 'none',
          }}>WeWatch.</div>
        </div>

        <LineWipe frame={frame} from={36} color="linear-gradient(90deg, transparent, #7C3AED, transparent)" />

        <div style={{
          opacity: subIn, fontSize: 38, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65,
          transform: `translateY(${interpolate(subIn, [0, 1], [18, 0])}px)`,
        }}>
          Do'stlar bilan birga tomosha.{'\n'}Bir vaqtda. Istalgan joydan.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════
// FEATURES  (8s) — pop-in cards
// ═══════════════════════════════════════
const FeaturesPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn   = spSmooth(frame, fps, 2);
  const titleIn = spSmooth(frame, fps, 14);

  // Cards: sequential pop — each appears 18 frames after previous
  const CARD_START = 38;
  const STAGGER    = 20;
  const cardPops = [0, 1, 2, 3].map((i) =>
    spPop(frame, fps, CARD_START + i * STAGGER)
  );

  const features = [
    { icon: '🎬', title: 'WatchParty',         desc: "Xona yarating, do'stlarni taklif qiling", rgb: '124,58,237',  hi: '167,139,250' },
    { icon: '🔄', title: 'Sinxronizatsiya',    desc: 'Kadr aniqligida birga tomosha',            rgb: '14,165,233',  hi: '56,189,248'  },
    { icon: '💬', title: 'Chat & Reaksiyalar', desc: "His-tuyg'ularingizni real vaqtda ulashing", rgb: '5,150,105',  hi: '52,211,153'  },
    { icon: '🎥', title: "Ko'p manba",          desc: 'YouTube, VK, Rutube va boshqalar',         rgb: '217,119,6',  hi: '251,191,36'  },
  ];

  return (
    <AbsoluteFill>
      <AnimBg frame={frame} hue="172" />
      <Particles frame={frame} tint="#34D399" count={14} />
      <BreathGlow frame={frame} x="80%" y="18%" color="rgba(167,139,250,0.1)" size={520} />
      <ScanLine frame={frame} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 72px' }}>
        {/* Tag */}
        <div style={{
          opacity: tagIn, marginBottom: 26,
          transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
          display: 'inline-flex', padding: '12px 32px', borderRadius: 100,
          border: '1px solid rgba(124,58,237,0.38)', background: 'rgba(124,58,237,0.14)',
          fontSize: 27, fontWeight: 700, color: 'rgba(167,139,250,0.82)',
          letterSpacing: '0.09em', textTransform: 'uppercase' as const,
        }}>IMKONIYATLAR</div>

        {/* Title */}
        <div style={{
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [28, 0])}px)`,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 116, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>4 ta </span>
          <span style={{
            fontSize: 116, fontWeight: 900, letterSpacing: '-0.03em', color: '#A78BFA',
            filter: `drop-shadow(0 0 ${10 + 5 * Math.sin(frame * 0.038)}px rgba(167,139,250,0.38))`,
          }}>imkoniyat.</span>
        </div>
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.3)', marginBottom: 38 }}>Bitta platformada.</div>

        {/* Cards — pop in one by one */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f, i) => {
            const v = cardPops[i];
            // scale: spring naturally overshoots to ~1.1 then settles to 1
            const scale = interpolate(v, [0, 1], [0.82, 1]);
            return (
              <div key={i} style={{
                position: 'relative', overflow: 'hidden',
                opacity: Math.min(1, v * 1.5),
                transform: `scale(${scale}) translateY(${interpolate(v, [0, 1], [18, 0])}px)`,
                display: 'flex', alignItems: 'center', gap: 26,
                padding: '24px 28px', borderRadius: 22,
                background: `rgba(${f.rgb},0.12)`, border: `1px solid rgba(${f.hi},0.22)`,
              }}>
                <Shimmer frame={frame} delay={i * 95} />
                <div style={{
                  width: 72, height: 72, flexShrink: 0, borderRadius: 18,
                  background: `rgba(${f.rgb},0.26)`, border: `1px solid rgba(${f.hi},0.36)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
                  boxShadow: `0 0 18px rgba(${f.rgb},0.28)`,
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: `rgba(${f.hi},1)` }}>{f.title}</div>
                  <div style={{ fontSize: 25, color: 'rgba(255,255,255,0.42)', marginTop: 5 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════
// CTA  (6s)
// ═══════════════════════════════════════
const CTAPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = spSmooth(frame, fps, 6);
  const t1    = spSmooth(frame, fps, 22);
  const t2    = spSmooth(frame, fps, 38);
  const subIn = spSmooth(frame, fps, 56);
  const btn1  = spSmooth(frame, fps, 72);
  const btn2  = spSmooth(frame, fps, 86);

  const r1op = 0.18 + 0.1  * Math.sin(frame * 0.026);
  const r2op = 0.10 + 0.07 * Math.sin(frame * 0.022 + 1.4);
  const glow = 0.34 + 0.14 * Math.sin(frame * 0.026);

  return (
    <AbsoluteFill>
      <AnimBg frame={frame} hue="268" />
      <Particles frame={frame} count={20} />
      <ScanLine frame={frame} />

      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', width: 940, height: 940, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(124,58,237,${glow}) 0%, transparent 57%)`,
          transform: `scale(${0.96 + 0.04 * Math.sin(frame * 0.026)})`,
        }} />
        <div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          border: `1px solid rgba(167,139,250,${r1op})`,
          transform: `scale(${0.97 + 0.03 * Math.sin(frame * 0.022)})`,
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          border: `1px solid rgba(167,139,250,${r2op})`,
          transform: `scale(${1.0 + 0.025 * Math.sin(frame * 0.019 + 0.9)})`,
        }} />
      </AbsoluteFill>

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 88px',
        paddingBottom: 320,
      }}>
        <div style={{
          opacity: tagIn, marginBottom: 44,
          transform: `translateY(${interpolate(tagIn, [0, 1], [-14, 0])}px)`,
          padding: '14px 34px', borderRadius: 100,
          border: '1px solid rgba(234,179,8,0.38)', background: 'rgba(234,179,8,0.12)',
          fontSize: 27, fontWeight: 700, color: 'rgba(234,179,8,0.82)',
          letterSpacing: '0.09em', textTransform: 'uppercase' as const,
        }}>TEZ ORADA</div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontSize: 144, fontWeight: 900, lineHeight: 0.96, letterSpacing: '-0.03em', color: '#fff',
            opacity: t1, transform: `translateY(${interpolate(t1, [0, 1], [24, 0])}px)`,
          }}>Birinchilar</div>
          <div style={{
            fontSize: 144, fontWeight: 900, lineHeight: 0.96, letterSpacing: '-0.03em', color: '#A78BFA',
            opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [24, 0])}px)`,
            filter: t2 > 0.85 ? `drop-shadow(0 0 ${13 + 7 * Math.sin(frame * 0.036)}px rgba(167,139,250,0.48))` : 'none',
          }}>qatorida bo'l.</div>
        </div>

        <div style={{
          position: 'relative', overflow: 'hidden',
          opacity: btn1, transform: `translateY(${interpolate(btn1, [0, 1], [18, 0])}px)`,
          padding: '38px 56px', borderRadius: 28, textAlign: 'center', width: '100%',
          background: `rgba(124,58,237,${0.28 + 0.1 * Math.sin(frame * 0.032)})`,
          border: '1px solid rgba(167,139,250,0.42)',
          fontSize: 44, fontWeight: 900, color: '#C4B5FD',
          letterSpacing: '-0.01em',
        }}>
          <Shimmer frame={frame} delay={0} />
          🌐  wewatch.uz
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Corner branding ──────────────────────────────────────────
const CornerLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = Math.min(1, frame / 18);
  return (
    <div style={{
      position: 'absolute', top: 52, left: 52,
      opacity: fadeIn * 0.75,
      pointerEvents: 'none',
    }}>
      <Logo size={44} />
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────
export const WeWatchReel: React.FC = () => {
  const frame = useCurrentFrame();

  // Card pop timing (absolute frames) — mirrors FeaturesPhase CARD_START/STAGGER
  const CARD_START = 38;
  const STAGGER    = 20;
  const cardFrames = [0, 1, 2, 3].map((i) => P.feats[0] + CARD_START + i * STAGGER); // abs: 398,418,438,458

  return (
    <AbsoluteFill style={{ fontFamily: 'sans-serif', background: '#03020a', whiteSpace: 'pre-line' }}>
      {/* ── Background music (full 30s, fade in/out baked into file) ── */}
      <Audio src={staticFile('audio/bg.mp3')} volume={0.28} />

      {/* ── Whoosh at each phase transition ── */}
      {[P.problem[0], P.solution[0], P.feats[0], P.cta[0]].map((at) => (
        <Sequence key={`w${at}`} from={at - 14} durationInFrames={30}>
          <Audio src={staticFile('audio/whoosh.mp3')} volume={0.55} />
        </Sequence>
      ))}

      {/* ── Card pop SFX ── */}
      {cardFrames.map((at, i) => (
        <Sequence key={`p${i}`} from={at} durationInFrames={20}>
          <Audio src={staticFile('audio/pop.mp3')} volume={0.45} />
        </Sequence>
      ))}

      {/* ── Phases ── */}
      <Sequence from={P.intro[0]}    durationInFrames={P.problem[0]  - P.intro[0]}>   <IntroPhase />    </Sequence>
      <Sequence from={P.problem[0]}  durationInFrames={P.solution[0] - P.problem[0]}> <ProblemPhase />  </Sequence>
      <Sequence from={P.solution[0]} durationInFrames={P.feats[0]    - P.solution[0]}><SolutionPhase /> </Sequence>
      <Sequence from={P.feats[0]}    durationInFrames={P.cta[0]      - P.feats[0]}>   <FeaturesPhase /> </Sequence>
      <Sequence from={P.cta[0]}      durationInFrames={TOTAL_FRAMES  - P.cta[0]}>     <CTAPhase />      </Sequence>

      {[P.problem[0], P.solution[0], P.feats[0], P.cta[0]].map((at) => (
        <CrossFade key={at} frame={frame} at={at - 12} dur={24} />
      ))}

      {/* ── Corner logo — rendered last = always on top ── */}
      <Sequence from={P.problem[0]} durationInFrames={TOTAL_FRAMES - P.problem[0]}>
        <CornerLogo />
      </Sequence>
    </AbsoluteFill>
  );
};
