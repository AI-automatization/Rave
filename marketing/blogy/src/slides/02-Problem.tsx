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

const ProblemItem: React.FC<{
  icon: string;
  text: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ icon, text, delay, frame, fps }) => {
  const anim = spring({ frame, fps, config: { damping: 18 }, delay });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        opacity: anim,
        transform: `translateX(${interpolate(anim, [0, 1], [-30, 0])}px)`,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 32,
          color: '#D1D5DB',
          fontFamily: 'sans-serif',
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Slide02Problem: React.FC = () => {
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
            transform: `translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
            fontSize: 28,
            fontWeight: 700,
            color: '#EF4444',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
            marginBottom: 36,
          }}
        >
          😤 Знакомые ситуации
        </div>

        <ProblemItem
          icon="📍"
          text="Друзья в разных городах — не посмотреть вместе"
          delay={12}
          frame={frame}
          fps={fps}
        />
        <ProblemItem
          icon="📞"
          text="Синк по видеозвонку — постоянно рассинхрон"
          delay={22}
          frame={frame}
          fps={fps}
        />
        <ProblemItem
          icon="💬"
          text="Скриншоты в чат вместо реакций вживую"
          delay={32}
          frame={frame}
          fps={fps}
        />
        <ProblemItem
          icon="😴"
          text="Смотришь один — половина удовольствия теряется"
          delay={42}
          frame={frame}
          fps={fps}
        />
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
        2 / 8
      </div>
    </AbsoluteFill>
  );
};
