import React from 'react';
import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig, Audio, staticFile,
} from 'remotion';

export const DONYAA_STARS_DURATION = 18 * 30; // 18s @ 30fps

const sp = (f: number, fps: number, delay = 0, d = 18) =>
  spring({ frame: f - delay, fps, config: { damping: d, mass: 0.75, stiffness: 180 } });

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const fade = (f: number, at: number, dur = 8) => clamp((f - at) / dur);

// ─── Manga speed lines ─────────────────────────────────────────────────────
function SpeedLines({ count = 48, opacity = 0.12, color = '#fff' }: { count?: number; opacity?: number; color?: string }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1080 1920">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const rad = (angle * Math.PI) / 180;
        const cx = 540, cy = 960;
        const len = 1200;
        const innerR = 80 + Math.random() * 40;
        const width = 3 + Math.random() * 8;
        const x1 = cx + Math.cos(rad) * innerR;
        const y1 = cy + Math.sin(rad) * innerR;
        const x2 = cx + Math.cos(rad) * len;
        const y2 = cy + Math.sin(rad) * len;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth={width} strokeOpacity={opacity + (i % 3 === 0 ? 0.06 : 0)} />
        );
      })}
    </svg>
  );
}

// ─── Impact burst (white flash) ────────────────────────────────────────────
function ImpactFlash({ progress }: { progress: number }) {
  const op = clamp(1 - progress * 3);
  if (op <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: op, pointerEvents: 'none' }} />
  );
}

// ─── Screen shake helper ───────────────────────────────────────────────────
function shake(f: number, at: number, strength = 12): string {
  const t = f - at;
  if (t < 0 || t > 20) return 'translate(0px,0px)';
  const decay = 1 - t / 20;
  const x = Math.sin(t * 1.7) * strength * decay;
  const y = Math.cos(t * 2.3) * strength * decay;
  return `translate(${x}px,${y}px)`;
}

// ─── Manga halftone dots ───────────────────────────────────────────────────
function Halftone({ opacity = 0.08 }: { opacity?: number }) {
  const dots: React.ReactElement[] = [];
  const step = 55;
  for (let x = 0; x < 1080; x += step) {
    for (let y = 0; y < 1920; y += step) {
      const r = 6 + ((x * 7 + y * 3) % 6);
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity={opacity} />);
    }
  }
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 1080 1920">
      {dots}
    </svg>
  );
}

// ─── Manga panel frame ─────────────────────────────────────────────────────
function MangaPanel({ children, borderColor = '#FBBF24' }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{
      border: `8px solid ${borderColor}`,
      boxShadow: `8px 8px 0 #000, 0 0 0 3px #000`,
      borderRadius: 4,
      background: '#fff',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {children}
    </div>
  );
}

// ─── Anime action text ("ドーン" style) ────────────────────────────────────
function ActionText({ text, top, left, rotation = 0, scale = 1, opacity = 1, size = 80, color = '#fff', stroke = '#000' }: {
  text: string; top: number; left: number; rotation?: number;
  scale?: number; opacity?: number; size?: number; color?: string; stroke?: string;
}) {
  return (
    <div style={{
      position: 'absolute', top, left,
      fontSize: size, fontWeight: 900,
      color, WebkitTextStroke: `4px ${stroke}`,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      opacity, lineHeight: 1,
      textShadow: `4px 4px 0 ${stroke}`,
      fontFamily: "'Bebas Neue', 'Arial Black', Impact, sans-serif",
      letterSpacing: -2,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  );
}

// ─── Chibi star mascot (pure CSS) ─────────────────────────────────────────
function StarMascot({ size = 200, bounce = 0 }: { size?: number; bounce?: number }) {
  const s = size;
  return (
    <div style={{
      width: s, height: s * 1.3,
      position: 'relative',
      transform: `translateY(${Math.sin(bounce * 0.12) * 10}px)`,
    }}>
      {/* Body — star shape */}
      <div style={{
        position: 'absolute', top: s * 0.2, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: s * 0.7, lineHeight: 1,
        filter: 'drop-shadow(0 8px 20px rgba(245,158,11,0.7)) drop-shadow(0 0 40px rgba(245,158,11,0.4))',
      }}>⭐</div>

      {/* Face */}
      <div style={{
        position: 'absolute', top: s * 0.22, left: '50%',
        transform: 'translateX(-50%)',
        width: s * 0.38, height: s * 0.28,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: s * 0.03,
      }}>
        {/* Eyes */}
        <div style={{ display: 'flex', gap: s * 0.08 }}>
          <div style={{ width: s * 0.08, height: s * 0.10, background: '#1a1a2e', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
          <div style={{ width: s * 0.08, height: s * 0.10, background: '#1a1a2e', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
        </div>
        {/* Smile */}
        <div style={{
          width: s * 0.18, height: s * 0.06,
          borderBottom: `${s * 0.025}px solid #1a1a2e`,
          borderRadius: '0 0 50px 50px',
        }} />
      </div>

      {/* Arms */}
      <div style={{
        position: 'absolute', top: s * 0.52, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: s * 0.45,
      }}>
        <div style={{
          width: s * 0.12, height: s * 0.20,
          background: '#FBBF24', borderRadius: 20,
          transform: `rotate(${-30 + Math.sin(bounce * 0.15) * 10}deg)`,
          transformOrigin: 'top center',
        }} />
        <div style={{
          width: s * 0.12, height: s * 0.20,
          background: '#FBBF24', borderRadius: 20,
          transform: `rotate(${30 + Math.sin(bounce * 0.15 + 1) * 10}deg)`,
          transformOrigin: 'top center',
        }} />
      </div>

      {/* Legs */}
      <div style={{
        position: 'absolute', top: s * 0.72, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: s * 0.15,
      }}>
        <div style={{ width: s * 0.14, height: s * 0.25, background: '#FBBF24', borderRadius: 20 }} />
        <div style={{ width: s * 0.14, height: s * 0.25, background: '#FBBF24', borderRadius: 20 }} />
      </div>

      {/* Sparkles around mascot */}
      {[[-0.3, 0.1], [0.35, 0.05], [-0.25, 0.55], [0.3, 0.5]].map(([dx, dy], i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s * (0.1 + dy), left: s * (0.5 + dx),
          fontSize: s * 0.18,
          animation: 'none',
          opacity: 0.6 + (i % 2 === 0 ? Math.sin(bounce * 0.2 + i) * 0.3 : Math.cos(bounce * 0.25 + i) * 0.3),
          transform: `scale(${0.7 + Math.sin(bounce * 0.18 + i) * 0.3}) rotate(${bounce * 2 + i * 45}deg)`,
        }}>✦</div>
      ))}
    </div>
  );
}

// ─── Phone mockup (compact) ────────────────────────────────────────────────
function Phone({ frame, fps }: { frame: number; fps: number }) {
  const sc   = sp(frame, fps, 0, 22);
  const fIn  = sp(frame, fps, 12);
  const qIn  = sp(frame, fps, 26);
  const bIn  = sp(frame, fps, 40);
  const stars = Math.round(interpolate(frame, [50, 90], [0, 150], { extrapolateRight: 'clamp' }));

  return (
    <div style={{
      width: 340, height: 460,
      borderRadius: 36, border: '6px solid rgba(255,215,0,0.30)',
      background: 'linear-gradient(160deg,#1a1040 0%,#0d1527 100%)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,215,0,0.10), inset 0 0 40px rgba(245,158,11,0.04)',
      overflow: 'hidden',
      transform: `scale(${0.55 + sc * 0.45}) translateY(${(1 - sc) * 80}px)`,
      opacity: clamp(sc * 2),
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⭐</div>
        <div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 900, fontFamily: 'sans-serif' }}>Telegram Stars</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'sans-serif' }}>1⭐ = 225 сум</div>
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* @ input */}
        <div style={{ opacity: fIn, transform: `translateX(${(1 - fIn) * -16}px)`, borderRadius: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'sans-serif', fontSize: 12 }}>@</span>
          <span style={{ color: '#fff', fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700 }}>donyaapay</span>
          <span style={{ width: 1.5, height: 12, background: '#fff', marginLeft: 1, opacity: Math.sin(frame * 0.18) > 0 ? 1 : 0, display: 'inline-block' }} />
        </div>
        {/* Qty */}
        <div style={{ opacity: qIn, transform: `translateX(${(1 - qIn) * -16}px)`, borderRadius: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'sans-serif', fontSize: 11 }}>⭐</span>
          <span style={{ color: '#fff', fontFamily: 'sans-serif', fontSize: 11, fontWeight: 900 }}>{stars > 0 ? stars : ''}</span>
          <span style={{ flex: 1 }} />
          {stars > 0 && <span style={{ color: '#FBBF24', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 900 }}>{(stars * 225).toLocaleString()} сум</span>}
        </div>
        {/* Button */}
        <div style={{ opacity: bIn, transform: `scale(${0.85 + bIn * 0.15})`, borderRadius: 12, padding: '11px 0', background: stars > 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.06)', textAlign: 'center', color: stars > 0 ? '#fff' : 'rgba(255,255,255,0.25)', fontFamily: 'sans-serif', fontSize: 12, fontWeight: 900, boxShadow: stars > 0 ? '0 4px 18px rgba(245,158,11,0.35)' : 'none' }}>
          {stars > 0 ? `⭐ Купить · ${(stars * 225).toLocaleString()} сум` : '⭐ Купить'}
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
const FPS = 30;
const PH = {
  intro:  [0,        4  * FPS],  // 0s–4s   Anime impact hook
  demo:   [4  * FPS, 10 * FPS],  // 4s–10s  phone + mascot
  steps:  [10 * FPS, 15 * FPS],  // 10s–15s steps manga style
  cta:    [15 * FPS, 18 * FPS],  // 15s–18s CTA burst
};

export const DonyaaStarsReel: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();

  const inIntro = f < PH.intro[1];
  const inDemo  = f >= PH.demo[0]  && f < PH.demo[1];
  const inSteps = f >= PH.steps[0] && f < PH.steps[1];
  const inCta   = f >= PH.cta[0];

  const STEPS = [
    { icon: '1', title: 'Открой', sub: '@doonya_shop_bot' },
    { icon: '2', title: 'Введи', sub: '@username получателя' },
    { icon: '3', title: 'Купи!', sub: 'мгновенное зачисление ⚡' },
  ];

  // Impact frame timings
  const impactAt  = 0;
  const impactAt2 = PH.steps[0];
  const impactAt3 = PH.cta[0];

  const speedLinesOp = inIntro
    ? interpolate(f, [0, 20], [0.25, 0.08], { extrapolateRight: 'clamp' })
    : inCta
    ? 0.20
    : 0.05;

  return (
    <AbsoluteFill style={{
      background: '#06080f',
      fontFamily: "'Bebas Neue', 'Arial Black', Impact, sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Voiceover (Луффи / Tanjiro) ── */}
      <Audio src={staticFile('audio/donyaa_vo.mp3')} volume={1.0} />

      {/* ── BG manga halftone (subtle) ── */}
      {!inDemo && <Halftone opacity={0.025} />}

      {/* ── Speed lines ── */}
      <div style={{ opacity: speedLinesOp, transition: 'opacity 0.3s' }}>
        <SpeedLines count={56} opacity={0.5} color={inCta ? '#FBBF24' : '#fff'} />
      </div>

      {/* ── Ambient glow ── */}
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,158,11,${inCta ? 0.18 : 0.07}) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* ═══ INTRO / HOOK ═══════════════════════════════════════════════ */}
      {inIntro && (() => {
        const relF  = f;
        const scBig = sp(relF, fps, 0, 8);
        const t1    = sp(relF, fps, 10, 20);
        const t2    = sp(relF, fps, 22, 20);
        const badge = sp(relF, fps, 35, 24);

        return (
          <AbsoluteFill style={{ transform: shake(f, impactAt, 18) }}>
            {/* Impact flash */}
            <ImpactFlash progress={f / 12} />

            {/* Giant star burst */}
            <div style={{
              position: 'absolute', top: '28%', left: '50%',
              transform: `translate(-50%,-50%) scale(${0.3 + scBig * 0.85}) rotate(${interpolate(f, [0, 30], [45, 0], { extrapolateRight: 'clamp' })}deg)`,
              fontSize: 260, lineHeight: 1,
              filter: 'drop-shadow(0 0 80px rgba(245,158,11,0.9))',
              opacity: clamp(scBig * 1.5),
            }}>⭐</div>

            {/* Action-style text lines */}
            <div style={{
              position: 'absolute', top: '52%', left: 0, right: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              {/* Manga text box */}
              <div style={{
                background: '#FBBF24',
                padding: '10px 40px',
                transform: `skewX(-5deg) scale(${0.5 + t1 * 0.55}) translateY(${(1 - t1) * 30}px)`,
                opacity: t1,
                boxShadow: '6px 6px 0 #000',
                border: '3px solid #000',
              }}>
                <span style={{ fontSize: 80, color: '#1a0a00', WebkitTextStroke: '2px #000', letterSpacing: 2, display: 'inline-block', transform: 'skewX(5deg)' }}>
                  ЕЩЁ УДОБНЕЕ
                </span>
              </div>

              <div style={{
                fontSize: 52, color: '#fff',
                WebkitTextStroke: '2px #000',
                textShadow: '4px 4px 0 #000',
                opacity: t2,
                transform: `translateY(${(1 - t2) * 24}px)`,
                textAlign: 'center', paddingInline: 60, lineHeight: 1.1,
              }}>
                покупай ⭐ прямо в боте
              </div>
            </div>

            {/* DonyaaPay badge top */}
            <div style={{
              position: 'absolute', top: 80, left: '50%', transform: `translateX(-50%) scale(${0.5 + badge * 0.5})`,
              background: '#cc0000', border: '3px solid #000',
              borderRadius: 6, padding: '8px 28px',
              fontSize: 30, color: '#fff', letterSpacing: 2,
              opacity: badge,
              boxShadow: '4px 4px 0 #000',
            }}>
              🟥 @DonyaaPay
            </div>

            {/* JP action text floating */}
            <ActionText text="ドーン!" top={600} left={60} rotation={-12} scale={0.4 + sp(f, fps, 5, 12) * 0.65} opacity={sp(f, fps, 5, 12)} size={72} color="#FBBF24" />
            <ActionText text="キラキラ" top={750} left={680} rotation={8} scale={0.4 + sp(f, fps, 14, 12) * 0.6} opacity={sp(f, fps, 14, 12) * 0.55} size={56} color="rgba(255,255,255,0.5)" />
          </AbsoluteFill>
        );
      })()}

      {/* ═══ DEMO ══════════════════════════════════════════════════════ */}
      {inDemo && (() => {
        const relF = f - PH.demo[0];
        const labelIn = sp(relF, fps, 0, 24);
        const mascotIn = sp(relF, fps, 8, 20);
        const phoneIn  = sp(relF, fps, 4, 22);

        return (
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>

            {/* Label */}
            <div style={{
              opacity: labelIn, transform: `translateY(${(1 - labelIn) * -20}px)`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 3, height: 44, background: '#FBBF24' }} />
              <div style={{ fontSize: 52, color: '#fff', letterSpacing: 2 }}>ВОТ КАК ЭТО РАБОТАЕТ</div>
              <div style={{ width: 3, height: 44, background: '#FBBF24' }} />
            </div>

            {/* Phone + Mascot row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
              <div style={{ opacity: phoneIn, transform: `scale(${0.6 + phoneIn * 0.4}) translateY(${(1 - phoneIn) * 40}px)` }}>
                <Phone frame={relF} fps={fps} />
              </div>
              <div style={{
                opacity: mascotIn, transform: `scale(${0.5 + mascotIn * 0.5}) translateX(${(1 - mascotIn) * 40}px)`,
                marginBottom: 20,
              }}>
                <StarMascot size={190} bounce={relF} />
              </div>
            </div>

            <div style={{
              fontSize: 38, color: 'rgba(255,255,255,0.40)', letterSpacing: 2,
              opacity: sp(relF, fps, 30, 24),
            }}>
              @doonya_shop_bot
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* ═══ STEPS ═════════════════════════════════════════════════════ */}
      {inSteps && (() => {
        const relF = f - PH.steps[0];

        return (
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, paddingInline: 60 }}>
            {/* Impact flash */}
            <ImpactFlash progress={(f - impactAt2) / 10} />
            <div style={{ transform: shake(f, impactAt2, 14) }}>

              {/* Title in manga box */}
              <div style={{
                background: '#000', padding: '12px 48px', marginBottom: 24,
                border: '4px solid #FBBF24',
                boxShadow: '6px 6px 0 #FBBF24',
                transform: `scale(${sp(relF, fps, 0, 22)}) skewX(-3deg)`,
                opacity: sp(relF, fps, 0, 22),
                alignSelf: 'center', display: 'inline-block',
              }}>
                <span style={{ fontSize: 64, color: '#FBBF24', letterSpacing: 2 }}>КАК КУПИТЬ?</span>
              </div>

              {STEPS.map((step, i) => {
                const delay = i * 20;
                const sc = sp(relF, fps, delay + 6, 20);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 18,
                    width: 860,
                    background: i === 1 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `3px solid ${i === 1 ? '#FBBF24' : 'rgba(255,255,255,0.10)'}`,
                    boxShadow: i === 1 ? '4px 4px 0 rgba(245,158,11,0.3)' : '3px 3px 0 rgba(0,0,0,0.5)',
                    borderRadius: 4,
                    padding: '16px 24px',
                    marginBottom: 14,
                    opacity: sc,
                    transform: `translateX(${(1 - sc) * -60}px) skewX(${(1 - sc) * -4}deg)`,
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 4, flexShrink: 0,
                      background: i === 1 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.08)',
                      border: '3px solid #000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 36, color: '#fff',
                      boxShadow: '3px 3px 0 #000',
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 48, color: '#fff', lineHeight: 1, WebkitTextStroke: '1px rgba(0,0,0,0.4)' }}>{step.title}</div>
                      <div style={{ fontSize: 30, color: '#FBBF24', lineHeight: 1.2 }}>{step.sub}</div>
                    </div>
                    {/* Manga motion lines on active step */}
                    {i === 1 && (
                      <div style={{ marginLeft: 'auto', fontSize: 36, opacity: 0.7 }}>→</div>
                    )}
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* ═══ CTA ════════════════════════════════════════════════════════ */}
      {inCta && (() => {
        const relF = f - PH.cta[0];
        const sc1  = sp(relF, fps, 0, 10);
        const sc2  = sp(relF, fps, 10, 20);
        const sc3  = sp(relF, fps, 20, 22);

        return (
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <ImpactFlash progress={relF / 10} />
            <div style={{ transform: shake(f, impactAt3, 20) }}>

              {/* Giant rotating star */}
              <div style={{
                fontSize: 200,
                transform: `scale(${0.3 + sc1 * 0.85}) rotate(${interpolate(relF, [0, 15], [180, 0], { extrapolateRight: 'clamp' })}deg)`,
                opacity: clamp(sc1 * 1.5),
                filter: 'drop-shadow(0 0 100px rgba(245,158,11,0.9))',
                lineHeight: 1, textAlign: 'center',
              }}>⭐</div>

              {/* Bot name manga box */}
              <div style={{
                background: '#FBBF24', padding: '14px 56px',
                border: '5px solid #000', boxShadow: '8px 8px 0 #000',
                transform: `skewX(-5deg) scale(${0.5 + sc2 * 0.55}) translateY(${(1 - sc2) * 30}px)`,
                opacity: sc2, marginTop: 16,
              }}>
                <span style={{ fontSize: 88, color: '#1a0a00', WebkitTextStroke: '2px #000', display: 'inline-block', transform: 'skewX(5deg)' }}>
                  @doonya_shop_bot
                </span>
              </div>

              {/* CTA button */}
              <div style={{
                marginTop: 20,
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                border: '4px solid #000', boxShadow: '6px 6px 0 #000',
                padding: '18px 60px', textAlign: 'center',
                fontSize: 52, color: '#fff',
                WebkitTextStroke: '1.5px #000',
                transform: `scale(${0.6 + sc3 * 0.45})`,
                opacity: sc3,
              }}>
                Открыть бота 👇
              </div>

              {/* Channel bottom */}
              <div style={{
                marginTop: 24, textAlign: 'center',
                fontSize: 32, color: 'rgba(255,255,255,0.40)', letterSpacing: 2,
                opacity: sp(relF, fps, 35, 24),
              }}>
                🟥 @DonyaaPay
              </div>

              {/* Floating action text */}
              <ActionText text="ゲット!" top={-140} left={30} rotation={-8} scale={0.5 + sp(relF, fps, 8) * 0.6} opacity={sp(relF, fps, 8) * 0.65} size={64} color="#fff" />
              <ActionText text="サイコー" top={-80} left={650} rotation={6} scale={0.4 + sp(relF, fps, 16) * 0.55} opacity={sp(relF, fps, 16) * 0.45} size={50} color="#FBBF24" />
            </div>
          </AbsoluteFill>
        );
      })()}
    </AbsoluteFill>
  );
};
