import React from 'react';
import {
  AbsoluteFill, Audio, Easing, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig, Video,
  Sequence,
} from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const W = 1080;
const H = 1920;

const INTRO_DUR = 3 * 30;
const LOGIN_DUR = 4 * 30;
const TEXT_DUR  = 2 * 30;
const VIDEO_DUR = 5 * 30;
const CTA_DUR   = 3 * 30;
export const REEL2_DURATION = INTRO_DUR + LOGIN_DUR + TEXT_DUR + VIDEO_DUR + CTA_DUR;

const ease = (frame: number, from: number, to: number, delay = 0, duration = 24) =>
  interpolate(frame, [delay, delay + duration], [from, to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

// ─── Logo — official logo-dark.svg (icon + wordmark) ─────────────────────────
const Logo: React.FC<{ height?: number }> = ({ height = 52 }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    {/* Subtle glow */}
    <div style={{
      position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
      width: height * 0.8, height: height * 0.8,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <img
      src={staticFile('logo-full.svg')}
      style={{ height, width: 'auto', position: 'relative' }}
    />
  </div>
);

// Thin divider line
const Divider: React.FC<{ opacity?: number }> = ({ opacity = 0.12 }) => (
  <div style={{ width: 48, height: 1.5, background: `rgba(167,139,250,${opacity})`, borderRadius: 1 }} />
);

// Flash between segments — soft white
const FlashTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 9], [0, 0.35, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  return <AbsoluteFill style={{ background: '#fff', opacity, pointerEvents: 'none' }} />;
};

// ─── Segment 0: Intro ─────────────────────────────────────────────────────────
const IntroSeg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn  = spring({ frame, fps, config: { damping: 28, mass: 0.8 }, delay: 2 });
  const titleIn = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 10 });
  const s1      = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 20 });
  const s2      = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 28 });
  const s3      = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 36 });
  const fadeOut = ease(frame, 1, 0, INTRO_DUR - 8, 8);
  const glowY   = Math.sin(frame * 0.03) * 24;

  const steps = [
    { num: '01', title: 'Регистрация',    sub: 'Google, Apple или Telegram', sp: s1 },
    { num: '02', title: 'Выбери видео',   sub: 'YouTube, VK, Rutube...',    sp: s2 },
    { num: '03', title: 'Смотри вместе',  sub: 'Синхронно в реальном времени', sp: s3 },
  ];

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% -8%, #2a1060 0%, #0e0525 42%, #030212 100%)',
      opacity: fadeOut, overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(167,139,250,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.022) 1px, transparent 1px)', backgroundSize: '90px 90px' }} />
      <div style={{ position: 'absolute', top: -180 + glowY, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 720, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo — центр сверху */}
      <div style={{ position: 'absolute', top: 140, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: logoIn, transform: `translateY(${interpolate(logoIn,[0,1],[16,0])}px)` }}>
        <Logo />
      </div>

      {/* Заголовок */}
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: titleIn, transform: `translateY(${interpolate(titleIn,[0,1],[18,0])}px)` }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.14em', marginBottom: 16 }}>КАК ЭТО РАБОТАЕТ?</div>
        <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.038em' }}>
          <span style={{ color: '#fff' }}>3 </span>
          <span style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>шага.</span>
        </div>
      </div>

      {/* Шаги */}
      <div style={{ position: 'absolute', top: 690, left: 56, right: 56, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {steps.map(({ num, title, sub, sp }, i) => (
          <div key={i} style={{
            opacity: sp,
            transform: `translateY(${interpolate(sp,[0,1],[20,0])}px)`,
            display: 'flex', alignItems: 'center', gap: 0,
            borderRadius: 22,
            background: 'rgba(124,58,237,0.07)',
            border: '1px solid rgba(167,139,250,0.15)',
            overflow: 'hidden',
          }}>
            {/* Left accent bar */}
            <div style={{ width: 4, alignSelf: 'stretch', background: `rgba(167,139,250,${0.3 + i * 0.1})`, flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '32px 36px', flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#A78BFA', opacity: 0.55, minWidth: 56, letterSpacing: '-0.04em' }}>{num}</div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 68, left: 0, right: 0, textAlign: 'center', fontSize: 24, fontWeight: 600, color: 'rgba(167,139,250,0.45)', opacity: logoIn, letterSpacing: '0.04em' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ─── Segment 1: Login ─────────────────────────────────────────────────────────
const LoginSeg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn  = spring({ frame, fps, config: { damping: 28, mass: 0.8 }, delay: 4 });
  const pillIn  = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 12 });
  const line1In = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 20 });
  const line2In = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 28 });
  const fadeOut = ease(frame, 1, 0, LOGIN_DUR - 10, 10);

  const kenBurns = interpolate(frame, [0, LOGIN_DUR], [1.0, 1.06], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const panX = interpolate(frame, [0, LOGIN_DUR], [0, -12], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const glowY = Math.sin(frame * 0.025) * 18;

  return (
    <AbsoluteFill style={{ opacity: fadeOut, overflow: 'hidden' }}>
      <img src={staticFile('hands-login.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', transform: `scale(${kenBurns}) translateX(${panX}px)`, transformOrigin: 'center center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,3,22,0.93) 0%, rgba(8,3,22,0.52) 26%, rgba(8,3,22,0.0) 50%, rgba(8,3,22,0.48) 100%)' }} />
      <div style={{ position: 'absolute', top: 60 + glowY, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo сверху по центру */}
      <div style={{ position: 'absolute', top: 108, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: logoIn, transform: `translateY(${interpolate(logoIn,[0,1],[12,0])}px)` }}>
        <Logo height={52} />
      </div>

      {/* Текст */}
      <div style={{ position: 'absolute', top: 256, left: 64, right: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          opacity: pillIn,
          transform: `translateY(${interpolate(pillIn,[0,1],[10,0])}px)`,
          display: 'inline-flex', padding: '10px 28px', borderRadius: 100,
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)',
          fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.1em', marginBottom: 28,
        }}>
          01 — ВОЙДИТЕ
        </div>

        <div style={{ fontSize: 116, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.036em', textAlign: 'center' }}>
          <div style={{ color: '#fff', opacity: line1In, transform: `translateY(${interpolate(line1In,[0,1],[20,0])}px)` }}>
            Один клик —
          </div>
          <div style={{
            background: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            opacity: line2In, transform: `translateY(${interpolate(line2In,[0,1],[20,0])}px)`,
          }}>
            вы внутри.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 68, left: 0, right: 0, textAlign: 'center', fontSize: 24, fontWeight: 600, color: 'rgba(167,139,250,0.45)', opacity: logoIn, letterSpacing: '0.04em' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ─── Segment 2: Text transition ───────────────────────────────────────────────
const TextSeg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelIn = spring({ frame, fps, config: { damping: 28, mass: 0.8 }, delay: 3 });
  const word1In = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 9 });
  const word2In = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 17 });
  const fadeOut = ease(frame, 1, 0, TEXT_DUR - 10, 10);

  const glowScale = ease(frame, 0.55, 1, 0, 22);

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 30%, #2a1060 0%, #0e0525 50%, #030212 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${glowScale})`, width: 840, height: 840, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ opacity: labelIn, transform: `translateY(${interpolate(labelIn,[0,1],[-12,0])}px)`, fontSize: 34, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.14em', marginBottom: 22 }}>
          А ТЕПЕРЬ...
        </div>
        <div style={{ fontSize: 138, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
          <div style={{ color: '#fff', opacity: word1In, transform: `translateY(${interpolate(word1In,[0,1],[26,0])}px)` }}>
            Смотри
          </div>
          <div style={{
            background: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            opacity: word2In, transform: `translateY(${interpolate(word2In,[0,1],[26,0])}px)`,
          }}>
            вместе.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Segment 3: Tap video ─────────────────────────────────────────────────────
const VideoSeg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = ease(frame, 0, 1, 0, 12);
  const pillIn  = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 14 });
  const line1In = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 22 });
  const line2In = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 30 });

  const videoZoom = interpolate(frame, [0, VIDEO_DUR], [1.0, 1.04], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill style={{ background: '#030212', opacity: fadeIn, overflow: 'hidden' }}>
      <Video src={staticFile('tap-transition-reel.mp4')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${videoZoom})`, transformOrigin: 'center center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,3,22,0.75) 0%, rgba(8,3,22,0.0) 36%, rgba(8,3,22,0.42) 100%)' }} />

      {/* Top */}
      <div style={{ position: 'absolute', top: 114, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div style={{
          opacity: pillIn, transform: `translateY(${interpolate(pillIn,[0,1],[-12,0])}px)`,
          display: 'inline-flex', padding: '10px 28px', borderRadius: 100,
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)',
          fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.1em',
        }}>
          03 — ВМЕСТЕ
        </div>
        <div style={{ fontSize: 116, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.036em', textAlign: 'center' }}>
          <div style={{ color: '#fff', opacity: line1In, transform: `translateY(${interpolate(line1In,[0,1],[18,0])}px)` }}>
            Один экран.
          </div>
          <div style={{
            background: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            opacity: line2In, transform: `translateY(${interpolate(line2In,[0,1],[18,0])}px)`,
          }}>
            Одни эмоции.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 68, left: 0, right: 0, textAlign: 'center', fontSize: 24, fontWeight: 600, color: 'rgba(167,139,250,0.45)', opacity: pillIn, letterSpacing: '0.04em' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ─── Segment 4: CTA ───────────────────────────────────────────────────────────
const CTASeg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn   = ease(frame, 0, 1, 0, 12);
  const logoIn   = spring({ frame, fps, config: { damping: 28, mass: 0.8 }, delay: 4 });
  const divIn    = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 14 });
  const textIn   = spring({ frame, fps, config: { damping: 26, mass: 0.85 }, delay: 18 });
  const tagIn    = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 28 });
  const urlIn    = spring({ frame, fps, config: { damping: 24, mass: 0.9 }, delay: 36 });

  const glowScale   = 1 + Math.sin(frame * 0.07) * 0.06;
  const glowOpacity = 0.18 + Math.sin(frame * 0.07) * 0.05;
  const settled     = interpolate(logoIn, [0.97, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoFloat   = Math.sin(frame * 0.08) * 5 * settled;

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 28%, #2a1060 0%, #0e0525 48%, #030212 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0, opacity: fadeIn,
    }}>
      {/* Breathing glow */}
      <div style={{ position: 'absolute', top: '16%', left: '50%', transform: `translateX(-50%) scale(${glowScale})`, width: 740, height: 740, borderRadius: '50%', background: `radial-gradient(circle, rgba(124,58,237,${glowOpacity}) 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Logo — крупнее чем в остальных сегментах */}
      <div style={{ opacity: logoIn, transform: `scale(${interpolate(logoIn,[0,1],[0.8,1])}) translateY(${logoFloat}px)`, marginBottom: 36 }}>
        <Logo height={72} />
      </div>

      {/* Разделитель */}
      <div style={{ opacity: divIn, transform: `scaleX(${interpolate(divIn,[0,1],[0,1])})`, width: 60, height: 1.5, background: 'rgba(167,139,250,0.3)', borderRadius: 1, marginBottom: 36 }} />

      {/* Заголовок */}
      <div style={{ opacity: textIn, transform: `translateY(${interpolate(textIn,[0,1],[32,0])}px)`, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.034em' }}>
          Уже<br />
          <span style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>скоро.</span>
        </div>
      </div>

      {/* Тэглайн */}
      <div style={{ opacity: tagIn, transform: `translateY(${interpolate(tagIn,[0,1],[14,0])}px)`, fontSize: 26, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginBottom: 48, letterSpacing: '0.01em' }}>
        Бесплатно. Для всех.
      </div>

      {/* URL кнопка */}
      <div style={{
        opacity: urlIn, transform: `translateY(${interpolate(urlIn,[0,1],[20,0])}px)`,
        display: 'flex', alignItems: 'center', padding: '22px 62px', borderRadius: 100,
        background: 'rgba(124,58,237,0.16)',
        border: '1.5px solid rgba(167,139,250,0.35)',
      }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: '#C4B5FD', letterSpacing: '0.01em' }}>wewatch.uz</span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export const WeWatchReel2: React.FC = () => (
  <AbsoluteFill style={{ width: W, height: H, fontFamily: FONT, background: '#030212' }}>
    <Audio src={staticFile('audio/bg.mp3')} volume={0.28} />

    <Sequence from={0}                                                durationInFrames={INTRO_DUR}><IntroSeg /></Sequence>
    <Sequence from={INTRO_DUR}                                        durationInFrames={LOGIN_DUR}><LoginSeg /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR}                            durationInFrames={TEXT_DUR}><TextSeg /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR + TEXT_DUR}                 durationInFrames={VIDEO_DUR}><VideoSeg /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR + TEXT_DUR + VIDEO_DUR}     durationInFrames={CTA_DUR}><CTASeg /></Sequence>

    <Sequence from={INTRO_DUR - 2}                                    durationInFrames={10}><FlashTransition /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR - 2}                        durationInFrames={10}><FlashTransition /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR + TEXT_DUR - 2}             durationInFrames={10}><FlashTransition /></Sequence>
    <Sequence from={INTRO_DUR + LOGIN_DUR + TEXT_DUR + VIDEO_DUR - 2} durationInFrames={10}><FlashTransition /></Sequence>
  </AbsoluteFill>
);
