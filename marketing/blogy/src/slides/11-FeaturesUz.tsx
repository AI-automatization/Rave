import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideLayout } from '../components/SlideLayout';
import { Pill } from '../components/Pill';

const features = [
  { icon: '🎬', title: 'WatchParty', desc: 'Xona yarating, do\'stlarni taklif qiling' },
  { icon: '🔄', title: 'Sinxronizatsiya', desc: 'Kadr aniqligida birga tomosha' },
  { icon: '💬', title: 'Chat va reaksiyalar', desc: 'His-tuyg\'ularingizni ulashing' },
];

export const Slide11FeaturesUz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = spring({ frame, fps, config: { damping: 16 }, delay: 4 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 14 });
  const card0In = spring({ frame, fps, config: { damping: 18 }, delay: 26 });
  const card1In = spring({ frame, fps, config: { damping: 18 }, delay: 36 });
  const card2In = spring({ frame, fps, config: { damping: 18 }, delay: 46 });
  const cardIns = [card0In, card1In, card2In];

  return (
    <SlideLayout current={3} total={5}>
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 64px',
          paddingTop: 140,
          gap: 0,
        }}
      >
        <div
          style={{
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [12, 0])}px)`,
            marginBottom: 24,
          }}
        >
          <Pill label="IMKONIYATLAR" color="#7C3AED" />
        </div>

        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [36, 0])}px)`,
            marginBottom: 44,
          }}
        >
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
            }}
          >
            3 ta <span style={{ color: '#A78BFA' }}>yechim.</span>
          </div>
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: 400 }}>
            Bitta platformada.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                opacity: cardIns[i],
                transform: `translateY(${interpolate(cardIns[i], [0, 1], [28, 0])}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '22px 28px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF' }}>{f.title}</div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SlideLayout>
  );
};
