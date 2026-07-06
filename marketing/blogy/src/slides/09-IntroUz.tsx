import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SlideLayout } from '../components/SlideLayout';
import { Pill } from '../components/Pill';

export const Slide09IntroUz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagIn = spring({ frame, fps, config: { damping: 16 }, delay: 4 });
  const titleIn = spring({ frame, fps, config: { damping: 18, mass: 0.8 }, delay: 16 });
  const subtitleIn = spring({ frame, fps, config: { damping: 18 }, delay: 34 });
  const lineWidth = interpolate(frame, [20, 58], [0, 240], { extrapolateRight: 'clamp' });

  return (
    <SlideLayout current={1} total={5} footer="swipe">
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 72px',
          paddingTop: 60,
        }}
      >
        <div
          style={{
            opacity: tagIn,
            transform: `translateY(${interpolate(tagIn, [0, 1], [12, 0])}px)`,
            marginBottom: 36,
          }}
        >
          <Pill label="YANGI ILOVA" color="#7C3AED" />
        </div>

        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [44, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
            }}
          >
            Biz —
            <br />
            <span style={{ color: '#A78BFA' }}>WeWatch.</span>
          </div>
        </div>

        <div
          style={{
            width: lineWidth,
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #7C3AED, transparent)',
            margin: '30px 0',
          }}
        />

        <div
          style={{
            opacity: subtitleIn,
            transform: `translateY(${interpolate(subtitleIn, [0, 1], [22, 0])}px)`,
            fontSize: 34,
            color: 'rgba(255,255,255,0.52)',
            fontWeight: 400,
            lineHeight: 1.55,
            maxWidth: 600,
          }}
        >
          O'zbekistondagi birinchi onlayn
          <br />kino ijtimoiy tarmog'i.
        </div>
      </AbsoluteFill>
    </SlideLayout>
  );
};
