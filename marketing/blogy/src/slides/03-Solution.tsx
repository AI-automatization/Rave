import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Bg } from '../components/Bg';
import { Logo, LogoIcon } from '../components/Logo';

export const Slide03Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowScale = spring({ frame, fps, config: { damping: 12, mass: 1.2 }, delay: 0 });
  const logoIn = spring({ frame, fps, config: { damping: 16 }, delay: 10 });
  const tagIn = spring({ frame, fps, config: { damping: 18 }, delay: 22 });
  const descIn = spring({ frame, fps, config: { damping: 18 }, delay: 32 });

  const pulseOpacity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3],
  );

  return (
    <AbsoluteFill>
      <Bg variant="purple" />

      {/* glow orb */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
            transform: `scale(${interpolate(glowScale, [0, 1], [0.4, 1])})`,
            opacity: pulseOpacity,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* logo reveal — icon + wordmark */}
        <div
          style={{
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.7, 1])})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <LogoIcon size={160} />
          <Logo size={44} />
        </div>

        {/* divider */}
        <div
          style={{
            width: interpolate(tagIn, [0, 1], [0, 240]),
            height: 2,
            background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)',
            borderRadius: 1,
          }}
        />

        <div
          style={{
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [20, 0])}px)`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: 'sans-serif',
            }}
          >
            Смотри фильмы
            <br />с друзьями{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #A78BFA, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              онлайн
            </span>
          </div>
        </div>

        <div
          style={{
            opacity: descIn,
            transform: `translateY(${interpolate(descIn, [0, 1], [16, 0])}px)`,
            fontSize: 30,
            color: '#9CA3AF',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 680,
            padding: '0 40px',
          }}
        >
          В реальном времени. С идеальной синхронизацией.
          <br />
          Как будто вы в одной комнате 🎬
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          bottom: 64,
          right: 72,
          fontSize: 22,
          color: '#4B5563',
          fontFamily: 'sans-serif',
        }}
      >
        3 / 8
      </div>
    </AbsoluteFill>
  );
};
