import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Bg } from '../components/Bg';
import { Logo } from '../components/Logo';

export const Slide01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 8 });
  const subtitleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 22 });
  const logoIn = spring({ frame, fps, config: { damping: 20 }, delay: 38 });

  const lineWidth = interpolate(frame, [15, 55], [0, 280], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Bg variant="dark" />

      {/* top logo */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 72,
          opacity: logoIn,
          transform: `translateY(${interpolate(logoIn, [0, 1], [14, 0])}px)`,
        }}
      >
        <Logo size={40} />
      </div>

      {/* center content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 90,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.05,
              fontFamily: 'sans-serif',
              letterSpacing: '-0.03em',
            }}
          >
            Смотришь
            <br />
            фильмы
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              один?
            </span>
          </div>
        </div>

        {/* accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #7C3AED, transparent)',
            margin: '32px 0',
          }}
        />

        <div
          style={{
            opacity: subtitleIn,
            transform: `translateY(${interpolate(subtitleIn, [0, 1], [24, 0])}px)`,
            fontSize: 34,
            color: '#9CA3AF',
            fontFamily: 'sans-serif',
            fontWeight: 400,
            lineHeight: 1.5,
            maxWidth: 560,
          }}
        >
          Это нормально — но теперь
          <br />
          есть лучший способ 👇
        </div>
      </AbsoluteFill>

      {/* slide counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 64,
          right: 72,
          fontSize: 22,
          color: '#4B5563',
          fontFamily: 'sans-serif',
          fontWeight: 500,
        }}
      >
        1 / 8
      </div>
    </AbsoluteFill>
  );
};
