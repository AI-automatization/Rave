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

const Step: React.FC<{
  num: number;
  icon: string;
  title: string;
  sub: string;
  delay: number;
  frame: number;
  fps: number;
  active?: boolean;
}> = ({ num, icon, title, sub, delay, frame, fps, active }) => {
  const anim = spring({ frame, fps, config: { damping: 16 }, delay });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24,
        opacity: anim,
        transform: `translateX(${interpolate(anim, [0, 1], [-24, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: active
            ? 'linear-gradient(135deg, #7C3AED, #A78BFA)'
            : 'rgba(124,58,237,0.15)',
          border: active ? 'none' : '1px solid rgba(124,58,237,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
          boxShadow: active ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: active ? '#A78BFA' : '#FFFFFF',
            fontFamily: 'sans-serif',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{ fontSize: 26, color: '#6B7280', fontFamily: 'sans-serif' }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
};

export const Slide04WatchParty: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18 }, delay: 6 });

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
            marginBottom: 52,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#7C3AED',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              marginBottom: 10,
            }}
          >
            🎉 Watch Party
          </div>
          <div
            style={{
              fontSize: 62,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.05,
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Три шага —
            <br />и вы вместе
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Step
            num={1}
            icon="🎬"
            title="Создай комнату"
            sub="Вставь ссылку на видео — YouTube, Rutube, VK и другие"
            delay={18}
            frame={frame}
            fps={fps}
            active
          />
          <Step
            num={2}
            icon="🔗"
            title="Пригласи друзей"
            sub="Поделись ссылкой — никакой регистрации не нужно"
            delay={28}
            frame={frame}
            fps={fps}
          />
          <Step
            num={3}
            icon="▶️"
            title="Смотрите синхронно"
            sub="Play, пауза, перемотка — у всех одновременно"
            delay={38}
            frame={frame}
            fps={fps}
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
        4 / 8
      </div>
    </AbsoluteFill>
  );
};
