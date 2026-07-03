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

const Platform: React.FC<{
  name: string;
  color: string;
  emoji: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ name, color, emoji, delay, frame, fps }) => {
  const anim = spring({ frame, fps, config: { damping: 16, mass: 0.8 }, delay });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 18,
        padding: '18px 28px',
        opacity: anim,
        transform: `scale(${interpolate(anim, [0, 1], [0.85, 1])})`,
      }}
    >
      <span style={{ fontSize: 34 }}>{emoji}</span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: '#D1D5DB',
          fontFamily: 'sans-serif',
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const Slide07Content: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18 }, delay: 4 });
  const plusIn = spring({ frame, fps, config: { damping: 14 }, delay: 52 });

  return (
    <AbsoluteFill>
      <Bg variant="dark" />

      <div style={{ position: 'absolute', top: 72, left: 72 }}>
        <Logo size={36} />
      </div>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 80px',
        }}
      >
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [16, 0])}px)`,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#7C3AED',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              marginBottom: 10,
            }}
          >
            🎥 Контент
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontFamily: 'sans-serif',
            }}
          >
            Смотри откуда
            <br />хочешь
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Platform name="YouTube" color="#FF0000" emoji="▶️" delay={14} frame={frame} fps={fps} />
          <Platform name="Rutube" color="#FF6B35" emoji="🇷🇺" delay={22} frame={frame} fps={fps} />
          <Platform name="VK Video" color="#0077FF" emoji="💙" delay={30} frame={frame} fps={fps} />
          <Platform name="Прямые .mp4 ссылки" color="#22C55E" emoji="🔗" delay={40} frame={frame} fps={fps} />
        </div>

        <div
          style={{
            marginTop: 32,
            opacity: plusIn,
            transform: `translateX(${interpolate(plusIn, [0, 1], [-16, 0])}px)`,
            fontSize: 26,
            color: '#6B7280',
            fontFamily: 'sans-serif',
          }}
        >
          + kinogo, online.anwap и другие платформы
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
        7 / 8
      </div>
    </AbsoluteFill>
  );
};
