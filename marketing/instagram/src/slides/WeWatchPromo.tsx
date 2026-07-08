import React from 'react';
import {
  AbsoluteFill, Audio, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig, Video,
  Sequence,
} from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const W = 1080;
const H = 1080;

// Segment durations (frames at 30fps)
const LOGIN_DUR  = 4 * 30;   // 4s — login lifestyle
const TEXT_DUR   = 2 * 30;   // 2s — transition text
const VIDEO_DUR  = 5 * 30;   // 5s — tap transition video
const CTA_DUR    = 3 * 30;   // 3s — CTA
const TOTAL      = LOGIN_DUR + TEXT_DUR + VIDEO_DUR + CTA_DUR; // 14s

// ─── Logo ────────────────────────────────────────────────────────────────────
const Logo: React.FC<{ size?: number }> = ({ size = 38 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <svg width={size * 1.26} height={size} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: size, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

// ─── Segment 1: Login photo + text ──────────────────────────────────────────
const LoginSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn  = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 4 });
  const pillIn  = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 10 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.85 }, delay: 18 });

  // Fade out near end
  const fadeOut = interpolate(frame, [LOGIN_DUR - 15, LOGIN_DUR], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <img src={staticFile('hands-login.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,3,22,0.92) 0%, rgba(8,3,22,0.6) 30%, rgba(8,3,22,0.0) 58%)' }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: logoIn, transform: `translateY(${interpolate(logoIn, [0,1], [8,0])}px)` }}>
        <Logo size={34} />
      </div>

      {/* Text */}
      <div style={{ position: 'absolute', top: 140, left: 52, right: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ opacity: pillIn, transform: `translateY(${interpolate(pillIn, [0,1], [10,0])}px)`, display: 'inline-flex', padding: '10px 26px', borderRadius: 100, background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.38)', fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.08em', marginBottom: 24 }}>
          01 — RO'YXATDAN O'TING
        </div>
        <div style={{ opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0,1], [30,0])}px)`, fontSize: 92, fontWeight: 900, lineHeight: 0.94, letterSpacing: '-0.035em', textAlign: 'center' }}>
          <span style={{ color: '#fff' }}>Bir bosimda</span><br />
          <span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>boshlang.</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'rgba(167,139,250,0.65)' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ─── Segment 2: Text transition ──────────────────────────────────────────────
const TextSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textIn  = spring({ frame, fps, config: { damping: 16, mass: 0.8 }, delay: 4 });
  const fadeOut = interpolate(frame, [TEXT_DUR - 12, TEXT_DUR], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 20%, #2a1060 0%, #0e0525 50%, #030212 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 28, opacity: fadeOut,
    }}>
      <div style={{ opacity: textIn, transform: `scale(${interpolate(textIn, [0,1], [0.85,1])})`, textAlign: 'center' }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.08em', marginBottom: 20 }}>ENDI...</div>
        <div style={{ fontSize: 100, fontWeight: 900, color: '#fff', lineHeight: 0.94, letterSpacing: '-0.035em', textAlign: 'center' }}>
          Birga<br />
          <span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tomosha.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Segment 3: Tap transition video ─────────────────────────────────────────
const VideoSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const pillIn  = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 20 });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Video src={staticFile('tap-transition.mp4')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,3,22,0.7) 0%, transparent 35%)' }} />

      {/* Top label */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: pillIn, transform: `translateY(${interpolate(pillIn, [0,1], [-10,0])}px)` }}>
        <div style={{ display: 'inline-flex', padding: '10px 26px', borderRadius: 100, background: 'rgba(167,139,250,0.18)', border: '1.5px solid rgba(167,139,250,0.4)', fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.08em' }}>
          03 — BIRGA TOMOSHA
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'rgba(167,139,250,0.65)' }}>wewatch.uz</div>
    </AbsoluteFill>
  );
};

// ─── Segment 4: CTA ──────────────────────────────────────────────────────────
const CTASegment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const logoIn  = spring({ frame, fps, config: { damping: 20, mass: 0.7 }, delay: 6 });
  const textIn  = spring({ frame, fps, config: { damping: 18, mass: 0.85 }, delay: 14 });
  const urlIn   = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 24 });

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 30%, #2a1060 0%, #0e0525 50%, #030212 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 40, opacity: fadeIn,
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />

      <div style={{ opacity: logoIn, transform: `scale(${interpolate(logoIn, [0,1], [0.8,1])})` }}>
        <Logo size={52} />
      </div>

      <div style={{ opacity: textIn, transform: `translateY(${interpolate(textIn, [0,1], [30,0])}px)`, textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', textAlign: 'center' }}>
          Hoziroq<br />
          <span style={{ background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>yuklab oling.</span>
        </div>
      </div>

      <div style={{ opacity: urlIn, transform: `translateY(${interpolate(urlIn, [0,1], [20,0])}px)`, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 48px', borderRadius: 100, background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(167,139,250,0.4)' }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: '#C4B5FD' }}>wewatch.uz</span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════
export const WeWatchPromo: React.FC = () => (
  <AbsoluteFill style={{ width: W, height: H, fontFamily: FONT, background: '#030212' }}>
    {/* Background music */}
    <Audio src={staticFile('audio/bg.mp3')} volume={0.25} />

    <Sequence from={0}            durationInFrames={LOGIN_DUR}>
      <LoginSegment />
    </Sequence>

    <Sequence from={LOGIN_DUR}    durationInFrames={TEXT_DUR}>
      <TextSegment />
    </Sequence>

    <Sequence from={LOGIN_DUR + TEXT_DUR} durationInFrames={VIDEO_DUR}>
      <VideoSegment />
    </Sequence>

    <Sequence from={LOGIN_DUR + TEXT_DUR + VIDEO_DUR} durationInFrames={CTA_DUR}>
      <CTASegment />
    </Sequence>
  </AbsoluteFill>
);

export const WEWATCH_PROMO_DURATION = TOTAL;
