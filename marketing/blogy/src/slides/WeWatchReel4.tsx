import React from 'react';
import {
  AbsoluteFill, interpolate, spring, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, Img,
} from 'remotion';

export const REEL4_DURATION = 30 * 30; // 900 frames
const FPS = 30;

// ─── Timing (seconds → frames) ──────────────────────────
const S = [0, 4, 7.5, 11.5, 16, 20, 24, 27.5].map((s) => Math.round(s * FPS));
// S[0]=0 S[1]=120 S[2]=225 S[3]=345 S[4]=480 S[5]=600 S[6]=720 S[7]=825

// ─── Spring helpers ───────────────────────────────────────
const sm = (f: number, fps: number, d = 0) =>
  spring({ frame: f, fps, config: { damping: 26, mass: 0.9, stiffness: 110 }, delay: d });

const pop = (f: number, fps: number, d = 0) =>
  spring({ frame: f, fps, config: { damping: 14, mass: 0.75, stiffness: 240 }, delay: d });

// ─── Shared dark bg ───────────────────────────────────────
const Bg: React.FC<{ frame: number }> = ({ frame }) => {
  const x = 30 + 6 * Math.sin(frame * 0.004);
  const y = 25 + 5 * Math.cos(frame * 0.003);
  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at ${x}% ${y}%, #150b2e 0%, #0b0620 45%, #050310 100%)`,
    }}>
      <AbsoluteFill style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        backgroundSize: '200px',
      }} />
    </AbsoluteFill>
  );
};

// ─── Header (persists across all slides) ─────────────────
const SlideHeader: React.FC<{ current: number; total?: number }> = ({ current, total = 8 }) => {
  const frame = useCurrentFrame();
  const fadeIn = Math.min(1, frame / 14);
  return (
    <div style={{
      position: 'absolute', top: 64, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 60px', zIndex: 50, opacity: fadeIn,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
        }}>W</div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#A78BFA' }}>W</span>eWatch
          </div>
          <div style={{ fontSize: 18, color: 'rgba(167,139,250,0.55)', fontWeight: 500, marginTop: -2 }}>
            Birga kino ko'rish platformasi
          </div>
        </div>
      </div>
      {/* Slide counter */}
      <div style={{
        padding: '12px 24px', borderRadius: 100,
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.35)',
        fontSize: 26, fontWeight: 800, color: '#C4B5FD', letterSpacing: '0.02em',
      }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </div>
  );
};

// ─── Footer (persists across all slides) ─────────────────
const SlideFooter: React.FC<{ current: number; total?: number }> = ({ current, total = 8 }) => {
  const frame = useCurrentFrame();
  const fadeIn = Math.min(1, frame / 14);
  return (
    <div style={{
      position: 'absolute', bottom: 56, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 60px', zIndex: 50, opacity: fadeIn,
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.04em' }}>
        wewatch.uz
      </div>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: i === current - 1 ? 28 : 8, height: 8,
            borderRadius: 4,
            background: i === current - 1 ? '#A78BFA' : 'rgba(167,139,250,0.22)',
            transition: 'none',
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Tag pill ─────────────────────────────────────────────
const Tag: React.FC<{ label: string; v: number; color?: string }> = ({ label, v, color = '#A78BFA' }) => (
  <div style={{
    display: 'inline-flex', padding: '10px 26px', borderRadius: 100,
    border: `1px solid ${color}55`, background: `${color}18`,
    fontSize: 22, fontWeight: 700, color: `${color}cc`,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    marginBottom: 28, opacity: v,
    transform: `translateY(${interpolate(v, [0, 1], [-12, 0])}px)`,
  }}>{label}</div>
);

// ─── Floating stat card ───────────────────────────────────
const StatCard: React.FC<{
  value: string; label: string; v: number;
  side: 'left' | 'right'; top: string; color?: string;
}> = ({ value, label, v, side, top, color = '#A78BFA' }) => (
  <div style={{
    position: 'absolute', top,
    [side]: side === 'left' ? -20 : -20,
    width: 180,
    borderRadius: 22, padding: '22px 24px',
    background: 'rgba(20,12,40,0.92)',
    border: `1.5px solid ${color}44`,
    boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`,
    opacity: Math.min(1, v * 1.2),
    transform: `translateX(${interpolate(v, [0, 1], [side === 'left' ? -40 : 40, 0])}px) scale(${interpolate(v, [0, 1], [0.82, 1])})`,
    zIndex: 10,
  }}>
    <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

// ─── Phone mockup wrapper ─────────────────────────────────
const Phone: React.FC<{ src: string; v: number; scale?: number }> = ({ src, v, scale = 1 }) => (
  <div style={{
    opacity: Math.min(1, v * 1.1),
    transform: `scale(${interpolate(v, [0, 1], [0.88, scale])}) translateY(${interpolate(v, [0, 1], [40, 0])}px)`,
    filter: v > 0.9 ? 'drop-shadow(0 24px 48px rgba(0,0,0,0.55))' : 'none',
  }}>
    <Img src={staticFile(src)} style={{ width: 320, display: 'block' }} />
  </div>
);

// ─── Crossfade between slides ─────────────────────────────
const Fade: React.FC<{ frame: number; at: number; dur?: number }> = ({ frame, at, dur = 14 }) => {
  const p = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = p < 0.5 ? interpolate(p, [0, 0.5], [0, 0.88]) : interpolate(p, [0.5, 1], [0.88, 0]);
  return <AbsoluteFill style={{ background: '#030110', opacity: op, pointerEvents: 'none', zIndex: 40 }} />;
};

// ══════════════════════════════════════════════════════════
// SLIDE 01 — HOOK: "Filmni yolg'iz ko'rasanmi?"
// ══════════════════════════════════════════════════════════
const Slide01: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn = sm(frame, fps, 6);
  const h1    = sm(frame, fps, 18);
  const h2    = sm(frame, fps, 34);
  const h3    = sm(frame, fps, 50);
  const sub   = sm(frame, fps, 72);
  const lineW = interpolate(frame, [20, 80], [0, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <SlideHeader current={1} />
      <SlideFooter current={1} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '160px 60px 120px' }}>
        <Tag label="Tanish holat?" v={tagIn} color="#EAB308" />

        <div style={{ fontSize: 106, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', color: '#fff' }}>
          <div style={{ opacity: h1, transform: `translateY(${interpolate(h1, [0, 1], [28, 0])}px)` }}>Filmni</div>
          <div style={{ opacity: h2, transform: `translateY(${interpolate(h2, [0, 1], [28, 0])}px)`, color: '#A78BFA',
            filter: h2 > 0.9 ? 'drop-shadow(0 0 12px rgba(167,139,250,0.45))' : 'none',
          }}>yolg'iz</div>
          <div style={{ opacity: h3, transform: `translateY(${interpolate(h3, [0, 1], [28, 0])}px)` }}>ko'rasanmi?</div>
        </div>

        <div style={{ width: lineW, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#EAB308,transparent)', margin: '32px 0', opacity: 0.7 }} />

        <div style={{
          opacity: sub, fontSize: 36, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontWeight: 400,
          transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
        }}>
          Do'stlaringiz boshqa shaharda —{'\n'}lekin kino birga ko'riladi.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 02 — SOLUTION: "Biz — WeWatch."
// ══════════════════════════════════════════════════════════
const Slide02: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn = sm(frame, fps, 4);
  const l1    = sm(frame, fps, 18);
  const l2    = sm(frame, fps, 36);
  const sub   = sm(frame, fps, 60);
  const glow  = l2 > 0.88 ? 14 + 8 * Math.sin(frame * 0.04) : 0;

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      {/* Centre glow */}
      <div style={{
        position: 'absolute', width: 900, height: 900, borderRadius: '50%',
        left: '50%', top: '48%', transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, rgba(124,58,237,${0.28 + 0.1 * Math.sin(frame * 0.022)}) 0%, transparent 62%)`,
        pointerEvents: 'none',
      }} />
      <SlideHeader current={2} />
      <SlideFooter current={2} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '160px 60px 120px', textAlign: 'center' }}>
        <Tag label="YECHIM" v={tagIn} />
        <div style={{ fontSize: 152, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 28 }}>
          <div style={{ color: '#fff', opacity: l1, transform: `scale(${interpolate(l1, [0, 1], [0.86, 1])})` }}>Biz —</div>
          <div style={{ color: '#A78BFA', opacity: l2, transform: `scale(${interpolate(l2, [0, 1], [0.86, 1])})`,
            filter: glow > 0 ? `drop-shadow(0 0 ${glow}px rgba(167,139,250,0.55))` : 'none',
          }}>WeWatch.</div>
        </div>
        <div style={{
          opacity: sub * 0.65, fontSize: 36, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55,
          transform: `translateY(${interpolate(sub, [0, 1], [16, 0])}px)`,
        }}>
          Do'stlar bilan birga tomosha.{'\n'}Bir vaqtda. Istalgan joydan.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 03 — WATCH PARTY: phone mockup + stat cards
// ══════════════════════════════════════════════════════════
const Slide03: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn   = sm(frame, fps, 4);
  const h1      = sm(frame, fps, 16);
  const h2      = sm(frame, fps, 30);
  const sub     = sm(frame, fps, 48);
  const phoneIn = sm(frame, fps, 22);
  const c1      = pop(frame, fps, 52);
  const c2      = pop(frame, fps, 66);
  const c3      = pop(frame, fps, 80);

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <SlideHeader current={3} />
      <SlideFooter current={3} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '160px 60px 100px' }}>
        {/* Text block */}
        <div style={{ marginBottom: 28 }}>
          <Tag label="WATCH PARTY · REAL VAQTDA" v={tagIn} />
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', color: '#fff' }}>
            <div style={{ opacity: h1, transform: `translateY(${interpolate(h1, [0, 1], [24, 0])}px)` }}>Barcha do'stlar</div>
            <div style={{ opacity: h2, transform: `translateY(${interpolate(h2, [0, 1], [24, 0])}px)`, color: '#A78BFA',
              filter: h2 > 0.9 ? 'drop-shadow(0 0 10px rgba(167,139,250,0.42))' : 'none',
            }}>bir ekranda.</div>
          </div>
          <div style={{ opacity: sub * 0.6, fontSize: 28, color: 'rgba(255,255,255,0.48)', marginTop: 16, lineHeight: 1.5 }}>
            Xona yarating, do'stlarni taklif qiling,{'\n'}birga kino boshlang.
          </div>
        </div>

        {/* Phone + cards */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
          <Phone src="screen-home.jpg" v={phoneIn} scale={0.98} />

          <StatCard value="50" label="kishi bir xonada" v={c1} side="left" top="60px" color="#A78BFA" />
          <StatCard value="99.9%" label="sync aniqlik" v={c2} side="right" top="200px" color="#38BDF8" />
          <StatCard value="3" label="faol xona" v={c3} side="left" top="280px" color="#34D399" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 04 — LIVE CHAT: watchparty screen + cards
// ══════════════════════════════════════════════════════════
const Slide04: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn   = sm(frame, fps, 4);
  const h1      = sm(frame, fps, 16);
  const h2      = sm(frame, fps, 30);
  const sub     = sm(frame, fps, 48);
  const phoneIn = sm(frame, fps, 22);
  const c1      = pop(frame, fps, 50);
  const c2      = pop(frame, fps, 64);

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <SlideHeader current={4} />
      <SlideFooter current={4} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '160px 60px 100px' }}>
        <div style={{ marginBottom: 28 }}>
          <Tag label="LIVE CHAT & REAKSIYALAR" v={tagIn} color="#34D399" />
          <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.97, letterSpacing: '-0.03em', color: '#fff' }}>
            <div style={{ opacity: h1, transform: `translateY(${interpolate(h1, [0, 1], [24, 0])}px)` }}>His-tuyg'ularingiz</div>
            <div style={{ opacity: h2, transform: `translateY(${interpolate(h2, [0, 1], [24, 0])}px)`, color: '#6EE7B7',
              filter: h2 > 0.9 ? 'drop-shadow(0 0 10px rgba(52,211,153,0.4))' : 'none',
            }}>real vaqtda.</div>
          </div>
          <div style={{ opacity: sub * 0.6, fontSize: 28, color: 'rgba(255,255,255,0.48)', marginTop: 16, lineHeight: 1.5 }}>
            Emoji reaksiyalar, xona chati,{'\n'}bir vaqtda pauza — birga.
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
          <Phone src="screen-watchparty-nobg.png" v={phoneIn} scale={0.98} />
          <StatCard value="❤️🔥😂" label="jonli reaksiyalar" v={c1} side="left" top="80px" color="#34D399" />
          <StatCard value="8" label="xabar / daqiqa" v={c2} side="right" top="200px" color="#F472B6" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 05 — BEFORE / AFTER
// ══════════════════════════════════════════════════════════
const Slide05: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = sm(frame, fps, 4);
  const leftIn  = sm(frame, fps, 18);
  const arrIn   = pop(frame, fps, 46);
  const rightIn = sm(frame, fps, 52);
  const r1      = sm(frame, fps, 60);
  const r2      = sm(frame, fps, 72);
  const r3      = sm(frame, fps, 84);

  const bads  = ["Yolg'iz tomosha", 'Zerikish', "Reaksiya yo'q"];
  const goods = ["Do'stlar bilan birga", 'Live chat & emoji', 'Battle mode'];

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <SlideHeader current={5} />
      <SlideFooter current={5} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '160px 52px 120px' }}>
        <div style={{
          fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          marginBottom: 16, opacity: titleIn,
        }}>Farqni ko'r</div>
        <div style={{
          fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em',
          marginBottom: 40, opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
        }}>
          Oldin <span style={{ color: '#EF4444' }}>vs</span> Keyin
        </div>

        <div style={{ display: 'flex', gap: 14, flex: 1 }}>
          {/* LEFT — before */}
          <div style={{
            flex: 1, borderRadius: 28,
            background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)',
            padding: '28px 24px',
            opacity: leftIn, transform: `translateX(${interpolate(leftIn, [0, 1], [-40, 0])}px)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 26, fontWeight: 700, color: '#FCA5A5' }}>Hozir</span>
            </div>
            {bads.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#EF4444',
                }}>✕</div>
                <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: arrIn, transform: `scale(${interpolate(arrIn, [0, 1], [0.4, 1])})`,
            flexShrink: 0,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#fff', fontWeight: 900,
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}>→</div>
          </div>

          {/* RIGHT — after */}
          <div style={{
            flex: 1, borderRadius: 28,
            background: 'rgba(124,58,237,0.1)', border: '1.5px solid rgba(167,139,250,0.3)',
            padding: '28px 24px',
            opacity: rightIn, transform: `translateX(${interpolate(rightIn, [0, 1], [40, 0])}px)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A78BFA' }} />
              <span style={{ fontSize: 26, fontWeight: 700, color: '#C4B5FD' }}>WeWatch bilan</span>
            </div>
            {goods.map((t, i) => {
              const v = [r1, r2, r3][i];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20,
                  opacity: v, transform: `translateX(${interpolate(v, [0, 1], [20, 0])}px)`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    background: 'rgba(124,58,237,0.22)', border: '1.5px solid rgba(167,139,250,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#A78BFA',
                  }}>✓</div>
                  <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>{t}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          marginTop: 24, textAlign: 'center' as const, fontSize: 26,
          color: 'rgba(167,139,250,0.55)', fontWeight: 600,
          opacity: sm(frame, fps, 110),
        }}>
          Kino — do'stlar bilan ko'riladi.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 06 — HOW TO: 3 steps
// ══════════════════════════════════════════════════════════
const Slide06: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn = sm(frame, fps, 4);
  const tIn   = sm(frame, fps, 16);
  const s1    = pop(frame, fps, 28);
  const s2    = pop(frame, fps, 46);
  const s3    = pop(frame, fps, 64);

  const steps = [
    { n: '01', emoji: '📱', title: 'Ilovani yukla', desc: 'wewatch.uz — bepul',          color: '124,58,237',  hi: '#C4B5FD' },
    { n: '02', emoji: '🏠', title: 'Xona yarating', desc: '30 soniyada tayyor',           color: '14,165,233',  hi: '#7DD3FC' },
    { n: '03', emoji: '🎬', title: "Birga kino ko'ring", desc: 'Sync, chat, reaksiyalar', color: '52,211,153',  hi: '#6EE7B7' },
  ];

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <SlideHeader current={6} />
      <SlideFooter current={6} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '160px 60px 120px' }}>
        <Tag label="QANDAY BOSHLASH?" v={tagIn} color="#38BDF8" />
        <div style={{
          fontSize: 88, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.97,
          marginBottom: 52, opacity: tIn, transform: `translateY(${interpolate(tIn, [0, 1], [24, 0])}px)`,
        }}>
          3 qadam<span style={{ color: '#A78BFA' }}>.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {steps.map((s, i) => {
            const v = [s1, s2, s3][i];
            return (
              <div key={i} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 28, padding: '0 32px',
                borderRadius: 26, background: `rgba(${s.color},0.1)`, border: `1.5px solid rgba(${s.color},0.28)`,
                boxShadow: `0 4px 20px rgba(${s.color},0.1)`,
                opacity: Math.min(1, v * 1.2),
                transform: `translateX(${interpolate(v, [0, 1], [-70, 0])}px) scale(${interpolate(v, [0, 1], [0.9, 1])})`,
              }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: `rgba(${s.color},0.3)`, letterSpacing: '-0.04em', flexShrink: 0, width: 60 }}>{s.n}</div>
                <div style={{
                  width: 74, height: 74, borderRadius: 20, flexShrink: 0,
                  background: `rgba(${s.color},0.18)`, border: `1.5px solid rgba(${s.color},0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: s.hi, lineHeight: 1.1 }}>{s.title}</div>
                  <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontWeight: 500 }}>{s.desc}</div>
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
// SLIDE 07 — STATS: counter + line chart
// ══════════════════════════════════════════════════════════
const LineChart: React.FC<{ progress: number }> = ({ progress }) => {
  const pts: [number, number][] = [[0,160],[70,148],[130,115],[195,125],[265,80],[345,58],[415,40],[520,16]];
  const tot = pts.length - 1;
  const dt = progress * tot;
  const drawn = pts.slice(0, Math.floor(dt) + 2);
  if (drawn.length < 2) return null;
  const d = drawn.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const ei = Math.min(Math.floor(dt), tot - 1);
  const fr = dt - ei;
  const [x1, y1] = pts[ei]; const [x2, y2] = pts[Math.min(ei + 1, tot)];
  const dx = x1 + (x2 - x1) * fr; const dy = y1 + (y2 - y1) * fr;
  return (
    <svg width="100%" height={180} viewBox="0 0 520 180" style={{ overflow: 'visible' }}>
      {[40, 100, 160].map((y) => <line key={y} x1={0} y1={y} x2={520} y2={y} stroke="rgba(167,139,250,0.1)" strokeWidth={1} strokeDasharray="5,4" />)}
      <path d={d} fill="none" stroke="#A78BFA" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      {progress > 0.05 && <>
        <circle cx={dx} cy={dy} r={10} fill="rgba(124,58,237,0.22)" />
        <circle cx={dx} cy={dy} r={5.5} fill="#A78BFA" />
      </>}
    </svg>
  );
};

const Slide07: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tagIn  = sm(frame, fps, 4);
  const cardIn = sm(frame, fps, 14);
  const numIn  = sm(frame, fps, 22);
  const b1     = pop(frame, fps, 50);
  const b2     = pop(frame, fps, 64);
  const b3     = pop(frame, fps, 78);
  const chartP = interpolate(frame, [28, 155], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const count = Math.round(interpolate(frame, [22, 148], [0, 1247], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
      <div style={{
        position: 'absolute', width: 860, height: 860, borderRadius: '50%',
        left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, rgba(124,58,237,${0.18 + 0.08 * Math.sin(frame * 0.02)}) 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
      <SlideHeader current={7} />
      <SlideFooter current={7} />

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '160px 52px 120px' }}>
        <Tag label="HOZIRGI KUN" v={tagIn} />

        {/* Main stat card */}
        <div style={{
          width: '100%', borderRadius: 32,
          background: 'rgba(124,58,237,0.1)', border: '1.5px solid rgba(167,139,250,0.22)',
          padding: '40px 40px 32px',
          opacity: Math.min(1, cardIn * 1.2),
          transform: `scale(${interpolate(cardIn, [0, 1], [0.9, 1])}) translateY(${interpolate(cardIn, [0, 1], [28, 0])}px)`,
          boxShadow: '0 20px 52px rgba(124,58,237,0.16)',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(167,139,250,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                FOYDALANUVCHILAR
              </div>
              <div style={{
                fontSize: 80, fontWeight: 900, color: '#fff', lineHeight: 1.0,
                opacity: numIn, transform: `translateY(${interpolate(numIn, [0, 1], [14, 0])}px)`,
              }}>{count.toLocaleString()}</div>
            </div>
            <div style={{
              padding: '12px 22px', borderRadius: 100,
              background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.3)',
              fontSize: 26, fontWeight: 800, color: '#C4B5FD',
              opacity: pop(frame, fps, 100),
            }}>📈 +18%</div>
          </div>
          <div style={{ fontSize: 20, color: 'rgba(167,139,250,0.4)', marginBottom: 20, fontWeight: 600 }}>
            • VA TEZ SUR'ATLARDA RIVOJLANMOQDA
          </div>
          <LineChart progress={chartP} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {['1-hafta','2-hafta','3-hafta','4-hafta'].map((l) => (
              <div key={l} style={{ fontSize: 18, color: 'rgba(167,139,250,0.3)', fontWeight: 600 }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Mini stat badges */}
        <div style={{ display: 'flex', gap: 14, width: '100%' }}>
          {[
            { v: b1, val: '384', label: "Watch Party o'tkazildi", color: '#A78BFA' },
            { v: b2, val: '2.1K', label: 'soat birga tomosha', color: '#38BDF8' },
            { v: b3, val: '96%', label: 'ijobiy baho', color: '#34D399' },
          ].map((b) => (
            <div key={b.label} style={{
              flex: 1, borderRadius: 20, padding: '20px 18px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              opacity: Math.min(1, b.v * 1.3), transform: `scale(${interpolate(b.v, [0, 1], [0.78, 1])})`,
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: b.color }}>{b.val}</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontWeight: 500 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// SLIDE 08 — CTA
// ══════════════════════════════════════════════════════════
const Slide08: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t1    = sm(frame, fps, 8);
  const t2    = sm(frame, fps, 24);
  const btnIn = sm(frame, fps, 44);
  const subIn = sm(frame, fps, 62);
  const glow  = 0.3 + 0.14 * Math.sin(frame * 0.028);
  const arrY  = interpolate(Math.sin(frame * 0.1), [-1, 1], [-8, 8]);

  return (
    <AbsoluteFill>
      <Bg frame={frame} />
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
      <SlideHeader current={8} />
      <SlideFooter current={8} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '160px 68px 180px', textAlign: 'center',
        paddingBottom: 320,
      }}>
        <div style={{ fontSize: 152, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 16 }}>
          <div style={{ color: '#fff', opacity: t1, transform: `scale(${interpolate(t1, [0, 1], [0.86, 1])})` }}>Birinchilar</div>
          <div style={{
            color: '#A78BFA', opacity: t2, transform: `scale(${interpolate(t2, [0, 1], [0.86, 1])})`,
            filter: t2 > 0.88 ? `drop-shadow(0 0 ${14 + 8 * Math.sin(frame * 0.036)}px rgba(167,139,250,0.55))` : 'none',
          }}>qatorida bo'l.</div>
        </div>

        <div style={{ fontSize: 60, opacity: btnIn * 0.8, transform: `translateY(${arrY}px)`, marginBottom: 8 }}>👆</div>

        <div style={{
          opacity: btnIn, transform: `translateY(${interpolate(btnIn, [0, 1], [18, 0])}px)`,
          padding: '44px 68px', borderRadius: 32, width: '100%', textAlign: 'center' as const,
          background: `rgba(124,58,237,${0.3 + 0.1 * Math.sin(frame * 0.032)})`,
          border: '2px solid rgba(167,139,250,0.48)',
          fontSize: 52, fontWeight: 900, color: '#C4B5FD',
          boxShadow: `0 0 52px rgba(124,58,237,${0.25 + 0.1 * Math.sin(frame * 0.032)})`,
        }}>🌐 wewatch.uz</div>

        <div style={{ marginTop: 24, fontSize: 28, color: 'rgba(255,255,255,0.32)', opacity: subIn, fontWeight: 500 }}>
          Bepul yuklab olish
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════
export const WeWatchReel4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#030110' }}>
      <Sequence from={S[0]} durationInFrames={S[1] - S[0]}><Slide01 /></Sequence>
      <Sequence from={S[1]} durationInFrames={S[2] - S[1]}><Slide02 /></Sequence>
      <Sequence from={S[2]} durationInFrames={S[3] - S[2]}><Slide03 /></Sequence>
      <Sequence from={S[3]} durationInFrames={S[4] - S[3]}><Slide04 /></Sequence>
      <Sequence from={S[4]} durationInFrames={S[5] - S[4]}><Slide05 /></Sequence>
      <Sequence from={S[5]} durationInFrames={S[6] - S[5]}><Slide06 /></Sequence>
      <Sequence from={S[6]} durationInFrames={S[7] - S[6]}><Slide07 /></Sequence>
      <Sequence from={S[7]} durationInFrames={REEL4_DURATION - S[7]}><Slide08 /></Sequence>

      {S.slice(1).map((at) => (
        <Fade key={at} frame={frame} at={at - 8} dur={14} />
      ))}
    </AbsoluteFill>
  );
};
