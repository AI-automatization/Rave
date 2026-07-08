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

const Avatar: React.FC<{ emoji: string; name: string; x: number; y: number; delay: number; frame: number; fps: number }> = ({
  emoji, name, x, y, delay, frame, fps,
}) => {
  const anim = spring({ frame, fps, config: { damping: 16 }, delay });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: anim,
        transform: `scale(${interpolate(anim, [0, 1], [0.6, 1])})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(124,58,237,0.2)',
          border: '2px solid rgba(124,58,237,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          boxShadow: '0 0 20px rgba(124,58,237,0.25)',
        }}
      >
        {emoji}
      </div>
      <div style={{ fontSize: 22, color: '#9CA3AF', fontFamily: 'sans-serif' }}>
        {name}
      </div>
    </div>
  );
};

export const Slide05Sync: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 18 }, delay: 6 });
  const barIn = spring({ frame, fps, config: { damping: 14 }, delay: 14 });

  // progress bar animation
  const progress = interpolate(frame, [20, 100], [0, 1], { extrapolateRight: 'clamp' });
  const timeStr = `${Math.floor(progress * 47)}:${String(Math.floor((progress * 47 * 60) % 60)).padStart(2, '0')}`;

  // pulse animation for sync dot
  const pulse = interpolate(frame % 40, [0, 20, 40], [0.4, 1, 0.4]);

  return (
    <AbsoluteFill>
      <Bg variant="split" />

      <div style={{ position: 'absolute', top: 72, left: 72 }}>
        <Logo size={36} />
      </div>

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 72px',
        }}
      >
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [16, 0])}px)`,
            textAlign: 'center',
            marginBottom: 60,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              fontFamily: 'sans-serif',
            }}
          >
            Идеальная
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              синхронизация
            </span>
          </div>
        </div>

        {/* fake player UI */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '32px 40px',
            opacity: barIn,
          }}
        >
          {/* title */}
          <div
            style={{
              fontSize: 26,
              color: '#D1D5DB',
              fontFamily: 'sans-serif',
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            Inception (2010) · Комната #42
          </div>

          {/* progress bar */}
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                borderRadius: 3,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 22,
              color: '#6B7280',
              fontFamily: 'sans-serif',
              marginBottom: 28,
            }}
          >
            <span>{timeStr}</span>
            <span>1:47:32</span>
          </div>

          {/* sync badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 10,
              padding: '10px 20px',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#22C55E',
                opacity: pulse,
              }}
            />
            <span
              style={{ fontSize: 24, color: '#22C55E', fontFamily: 'sans-serif', fontWeight: 600 }}
            >
              Sync — drift &lt; 300ms
            </span>
          </div>
        </div>

        {/* avatars */}
        <div style={{ position: 'relative', width: '100%', height: 130, marginTop: 24 }}>
          <Avatar emoji="🧑" name="Ты" x={60} y={10} delay={30} frame={frame} fps={fps} />
          <Avatar emoji="👩" name="Алия" x={280} y={10} delay={38} frame={frame} fps={fps} />
          <Avatar emoji="👨" name="Тимур" x={500} y={10} delay={46} frame={frame} fps={fps} />
          <Avatar emoji="👩‍🦱" name="Зара" x={720} y={10} delay={54} frame={frame} fps={fps} />

          {/* connecting line */}
          <svg
            style={{ position: 'absolute', top: 44, left: 100, width: 660, height: 2 }}
          >
            <line
              x1="0" y1="1" x2={interpolate(barIn, [0, 1], [0, 660])} y2="1"
              stroke="rgba(124,58,237,0.35)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          </svg>
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
        5 / 8
      </div>
    </AbsoluteFill>
  );
};
