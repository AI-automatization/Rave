import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideLayout } from '../components/SlideLayout';
import { Pill } from '../components/Pill';

const actions = [
  { icon: '✉️', title: 'DM yozing', desc: 'Yangiliklar uchun', num: '1' },
  { icon: '🌐', title: 'wewatch.uz', desc: 'Early access uchun', num: '2', highlight: true },
];

export const Slide13CTAUz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = spring({ frame, fps, config: { damping: 16 }, delay: 4 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 16 });
  const card0In = spring({ frame, fps, config: { damping: 18 }, delay: 30 });
  const card1In = spring({ frame, fps, config: { damping: 18 }, delay: 44 });
  const cardIns = [card0In, card1In];

  return (
    <SlideLayout current={5} total={5} footer="dots">
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 64px',
          paddingTop: 160,
        }}
      >
        <div
          style={{
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [12, 0])}px)`,
            marginBottom: 28,
          }}
        >
          <Pill label="TEZ ORADA" color="#EAB308" />
        </div>

        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [44, 0])}px)`,
            marginBottom: 64,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
            }}
          >
            Biz bilan
            <br />
            <span style={{ color: '#A78BFA' }}>qoling.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {actions.map((a, i) => (
            <div
              key={i}
              style={{
                opacity: cardIns[i],
                transform: `translateY(${interpolate(cardIns[i], [0, 1], [28, 0])}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '24px 28px',
                background: a.highlight ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                border: a.highlight ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: a.highlight ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: a.highlight ? '#A78BFA' : '#FFFFFF' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.42)', marginTop: 4 }}>{a.desc}</div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: a.highlight ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: a.highlight ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                }}
              >
                {a.num}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SlideLayout>
  );
};
