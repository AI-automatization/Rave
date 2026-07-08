import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { Logo } from '../components/Logo';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, config: { damping: 20, mass: 0.9, stiffness: 140 }, delay });

const BG = '#0a0014';
const PURPLE = '#8b5cf6';
const LIGHT = '#c4b5fd';

const Glow: React.FC<{ x?: string; y?: string; color?: string; size?: number }> = ({
  x = '50%', y = '50%', color = PURPLE, size = 500,
}) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: size, height: size,
    transform: 'translate(-50%,-50%)', borderRadius: '50%',
    background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
    pointerEvents: 'none',
  }} />
);

// Slide W1-C1: Cover
export const W1C1Cover: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Bebas Neue','Arial Black',sans-serif", overflow: 'hidden' }}>
      <Glow x="50%" y="40%" size={700} />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ opacity: sp(f, 0), transform: `translateY(${(1 - sp(f, 0)) * -30}px)` }}>
          <Logo size={40} />
        </div>
        <div style={{
          fontSize: 96, color: '#fff', textAlign: 'center', lineHeight: 1.05,
          opacity: sp(f, 8), transform: `scale(${0.85 + sp(f, 8) * 0.15})`,
        }}>
          5 ПРИЧИН<br />СМОТРЕТЬ<br />ЧЕРЕЗ WEWATCH
        </div>
        <div style={{
          fontSize: 40, color: LIGHT, letterSpacing: 3, marginTop: 8,
          opacity: sp(f, 20),
        }}>
          листай дальше →
        </div>
      </AbsoluteFill>
      {/* number badge */}
      <div style={{
        position: 'absolute', bottom: 60, right: 60,
        fontSize: 32, color: LIGHT, opacity: 0.5,
      }}>1 / 5</div>
    </AbsoluteFill>
  );
};

// Shared reason slide
const ReasonSlide: React.FC<{
  num: number; icon: string; title: string; desc: string; accent?: string;
}> = ({ num, icon, title, desc, accent = PURPLE }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Bebas Neue','Arial Black',sans-serif", overflow: 'hidden' }}>
      <Glow x="20%" y="60%" color={accent} size={500} />
      <Glow x="80%" y="30%" color={accent} size={300} />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', padding: '80px 90px', justifyContent: 'space-between' }}>
        {/* number */}
        <div style={{
          fontSize: 200, color: accent, opacity: 0.12, lineHeight: 1,
          position: 'absolute', top: 40, right: 60,
        }}>{num}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{ fontSize: 120, lineHeight: 1, opacity: sp(f, 0), transform: `scale(${0.7 + sp(f, 0) * 0.3})` }}>
            {icon}
          </div>
          <div style={{
            fontSize: 88, color: '#fff', lineHeight: 1.05,
            opacity: sp(f, 6), transform: `translateX(${(1 - sp(f, 6)) * -40}px)`,
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 46, color: LIGHT, lineHeight: 1.3, fontFamily: 'Arial, sans-serif', fontWeight: 'normal',
            opacity: sp(f, 14), transform: `translateY(${(1 - sp(f, 14)) * 20}px)`,
          }}>
            {desc}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={24} />
          <div style={{ fontSize: 32, color: LIGHT, opacity: 0.5 }}>{num} / 5</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const W1C2Sync: React.FC = () => (
  <ReasonSlide num={1} icon="🔁" title="СИНХРОНИЗАЦИЯ" desc="Ты и друг смотрите кадр в кадр — в реальном времени, без задержек." accent="#6366f1" />
);
export const W1C3Chat: React.FC = () => (
  <ReasonSlide num={2} icon="🎙️" title="ГОЛОСОВОЙ ЧАТ" desc="Реагируй вместе, смейся вместе — голос прямо во время просмотра." accent="#8b5cf6" />
);
export const W1C4Battle: React.FC = () => (
  <ReasonSlide num={3} icon="⚔️" title="БАТЛЫ" desc="Кто посмотрит больше? Соревнуйся с другом и набирай очки." accent="#a855f7" />
);
export const W1C5Free: React.FC = () => (
  <ReasonSlide num={4} icon="🆓" title="БЕСПЛАТНО" desc="Никакой подписки, никаких скрытых платежей. WeWatch — бесплатно для всех." accent="#7c3aed" />
);
