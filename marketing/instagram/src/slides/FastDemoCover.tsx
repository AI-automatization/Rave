import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

// Dedicated static cover — deliberately NOT a frame grabbed from the reel itself.
// Punchier composition than any single in-video beat: bigger headline, cleaner
// negative space, works as a small thumbnail in the Reels grid.

const FONT = "'Arial Black', Arial, sans-serif";
const BODY_FONT = 'Arial, sans-serif';
const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';
const WHITE = '#ffffff';
const BG = '#0A0912';

export const FastDemoCover: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{
        position: 'absolute', left: '50%', top: '18%', width: 1300, height: 1300,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', opacity: 0.35,
        background: `radial-gradient(circle, ${PURPLE} 0%, transparent 65%)`,
        filter: 'blur(10px)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', bottom: '-6%', width: 900, height: 900,
        transform: 'translate(-50%,0)', borderRadius: '50%', opacity: 0.2,
        background: `radial-gradient(circle, #4338CA 0%, transparent 65%)`,
      }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginTop: 150, textAlign: 'center', padding: '0 80px' }}>
          <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.55)', fontFamily: BODY_FONT, letterSpacing: 2, textTransform: 'uppercase' }}>
            WeWatch
          </div>
          <div style={{ fontSize: 88, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.05, marginTop: 18 }}>
            СМОТРЕТЬ<br />
            <span style={{ color: PURPLE_LIGHT }}>ВМЕСТЕ</span>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 260, left: '50%', transform: 'translateX(-50%) rotate(-3deg)',
          filter: `drop-shadow(0 40px 90px ${PURPLE}66)`,
        }}>
          <Img src={staticFile('mockup-watchparty.png')} style={{ width: 620, height: 'auto', display: 'block', borderRadius: 36 }} />
        </div>

        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
          }} />
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.6)', fontFamily: BODY_FONT }}>
            wewatch.uz
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
