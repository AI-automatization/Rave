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

const Feature: React.FC<{
  icon: string;
  title: string;
  desc: string;
  delay: number;
  frame: number;
  fps: number;
  accent?: string;
}> = ({ icon, title, desc, delay, frame, fps, accent = '#7C3AED' }) => {
  const anim = spring({ frame, fps, config: { damping: 16 }, delay });
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}30`,
        borderRadius: 24,
        padding: '32px 28px',
        opacity: anim,
        transform: `translateY(${interpolate(anim, [0, 1], [30, 0])}px)`,
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 16 }}>{icon}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{ fontSize: 22, color: '#6B7280', fontFamily: 'sans-serif', lineHeight: 1.5 }}
      >
        {desc}
      </div>
    </div>
  );
};

export const Slide06Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18 }, delay: 4 });

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
          padding: '100px 72px 80px',
        }}
      >
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [16, 0])}px)`,
            fontSize: 58,
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            fontFamily: 'sans-serif',
            marginBottom: 44,
            lineHeight: 1.1,
          }}
        >
          Больше чем просто
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            «нажали Play»
          </span>
        </div>

        {/* row 1 */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <Feature
            icon="💬"
            title="Живой чат"
            desc="Реагируй прямо во время просмотра"
            delay={14}
            frame={frame}
            fps={fps}
          />
          <Feature
            icon="😂"
            title="Реакции"
            desc="Смайлы поверх экрана в нужный момент"
            delay={22}
            frame={frame}
            fps={fps}
            accent="#F59E0B"
          />
        </div>
        {/* row 2 */}
        <div style={{ display: 'flex', gap: 20 }}>
          <Feature
            icon="⚔️"
            title="Battle режим"
            desc="Соревнуйся с друзьями — кто лучше знает кино?"
            delay={30}
            frame={frame}
            fps={fps}
            accent="#EF4444"
          />
          <Feature
            icon="🏆"
            title="Достижения"
            desc="Ачивки, статистика просмотров, рейтинг"
            delay={38}
            frame={frame}
            fps={fps}
            accent="#22C55E"
          />
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
        6 / 8
      </div>
    </AbsoluteFill>
  );
};
