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

export const Slide08CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowIn = spring({ frame, fps, config: { damping: 12 }, delay: 0 });
  const logoIn = spring({ frame, fps, config: { damping: 16 }, delay: 8 });
  const titleIn = spring({ frame, fps, config: { damping: 18 }, delay: 18 });
  const badgeIn = spring({ frame, fps, config: { damping: 16 }, delay: 30 });
  const handleIn = spring({ frame, fps, config: { damping: 18 }, delay: 44 });

  const pulse = interpolate(frame % 90, [0, 45, 90], [0.5, 1, 0.5]);

  return (
    <AbsoluteFill>
      <Bg variant="purple" />

      {/* center glow */}
      <AbsoluteFill
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          style={{
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 65%)',
            transform: `scale(${interpolate(glowIn, [0, 1], [0.3, 1])})`,
            opacity: pulse * 0.8,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.7, 1])})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <LogoIcon size={180} />
          <Logo size={52} />
        </div>

        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 62,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: 'sans-serif',
            }}
          >
            Скоро в
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #A78BFA, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              App Store & Google Play
            </span>
          </div>
        </div>

        {/* store badges */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            opacity: badgeIn,
            transform: `translateY(${interpolate(badgeIn, [0, 1], [20, 0])}px)`,
          }}
        >
          {['🍎  App Store', '🤖  Google Play'].map((label) => (
            <div
              key={label}
              style={{
                padding: '16px 36px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16,
                fontSize: 26,
                color: '#FFFFFF',
                fontFamily: 'sans-serif',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            opacity: handleIn,
            transform: `translateY(${interpolate(handleIn, [0, 1], [12, 0])}px)`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: '#A78BFA',
              fontFamily: 'sans-serif',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            @wewatch.app
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#4B5563',
              fontFamily: 'sans-serif',
              marginTop: 6,
            }}
          >
            Подпишись чтобы не пропустить запуск 🚀
          </div>
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
        8 / 8
      </div>
    </AbsoluteFill>
  );
};
