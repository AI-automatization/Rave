import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideLayout } from '../components/SlideLayout';
import { Pill } from '../components/Pill';

const steps = [
  { num: '1', title: 'Xona yarating', desc: 'Bir soniyada WatchParty boshlang' },
  { num: '2', title: 'Do\'stingizni taklif qiling', desc: 'Havola orqali — hech qanday ro\'yxatdan o\'tmasdan' },
  { num: '3', title: 'Birga tomosha qiling', desc: 'Real vaqtda sinxronizatsiya bilan' },
];

export const Slide12HowItWorksUz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = spring({ frame, fps, config: { damping: 16 }, delay: 4 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 14 });
  const step0In = spring({ frame, fps, config: { damping: 18 }, delay: 26 });
  const step1In = spring({ frame, fps, config: { damping: 18 }, delay: 38 });
  const step2In = spring({ frame, fps, config: { damping: 18 }, delay: 50 });
  const stepIns = [step0In, step1In, step2In];

  return (
    <SlideLayout current={4} total={5}>
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 64px',
          paddingTop: 140,
        }}
      >
        <div
          style={{
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [12, 0])}px)`,
            marginBottom: 24,
          }}
        >
          <Pill label="QANDAY ISHLAYDI" color="#7C3AED" />
        </div>

        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [36, 0])}px)`,
            marginBottom: 52,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
            }}
          >
            3 qadam —
            <br />
            <span style={{ color: '#A78BFA' }}>tayyor.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                opacity: stepIns[i],
                transform: `translateX(${interpolate(stepIns[i], [0, 1], [-30, 0])}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: i === 2 ? 'rgba(124,58,237,0.85)' : 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                {s.num}
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#FFFFFF' }}>{s.title}</div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.42)', marginTop: 4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SlideLayout>
  );
};
