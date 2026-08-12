import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, interpolate, staticFile, Img, Sequence, Easing } from 'remotion';
import { WatchPartyMockReel, WATCH_PARTY_MOCK_DURATION } from './WatchPartyMockReel';

// "Друзья не могут выбрать что смотреть" — universal, relatable problem, no third-party IP
// involved anywhere (no movie titles, no franchise references) — chat UI pattern reused from
// AnimeCrossover.tsx's proven Msg/Typing/Avatar components, recolored to WeWatch brand.

const FONT = "'Arial Black', Arial, sans-serif";
const BODY_FONT = 'Arial, sans-serif';
const EASE = Easing.inOut(Easing.cubic);
const ei = (f: number, range: number[], out: number[]) =>
  interpolate(f, range, out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';
const PINK = '#EC4899';
const TEAL = '#22D3EE';
const BG = '#0A0912';
const CHAT_BG = '#0d0c14';
const WHITE = '#ffffff';

const sp = (f: number, delay = 0) =>
  spring({ frame: f, fps: 30, delay, config: { damping: 22, mass: 0.9, stiffness: 120 } });

const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 52 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color + '22', border: `2.5px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: size * 0.4, fontWeight: 900, color,
    fontFamily: FONT,
  }}>
    {name[0]}
  </div>
);

type Sender = 'a' | 'b' | 'c';
const SENDER_INFO: Record<Sender, { name: string; color: string; align: 'row' | 'row-reverse' }> = {
  a: { name: 'Амир', color: PURPLE_LIGHT, align: 'row' },
  b: { name: 'Дина', color: PINK, align: 'row-reverse' },
  c: { name: 'Бек', color: TEAL, align: 'row' },
};

const Msg: React.FC<{ frame: number; delay: number; from: Sender; text: string }> = ({ frame, delay, from, text }) => {
  const p = sp(frame, delay);
  const info = SENDER_INFO[from];
  return (
    <div style={{
      display: 'flex', flexDirection: info.align, alignItems: 'flex-end', gap: 12,
      opacity: p, transform: `translateY(${(1 - p) * 20}px) scale(${0.92 + p * 0.08})`,
      marginBottom: 18,
    }}>
      <Avatar name={info.name} color={info.color} size={48} />
      <div style={{
        maxWidth: '68%', background: '#16141f',
        border: `1.5px solid ${info.color}33`,
        borderRadius: info.align === 'row' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        padding: '14px 20px',
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: info.color, fontFamily: FONT, marginBottom: 4 }}>
          {info.name}
        </div>
        <div style={{ fontSize: 30, color: WHITE, lineHeight: 1.35, fontFamily: BODY_FONT }}>
          {text}
        </div>
      </div>
    </div>
  );
};

const Typing: React.FC<{ frame: number; delay: number; from: Sender }> = ({ frame, delay, from }) => {
  const p = sp(frame, delay);
  const info = SENDER_INFO[from];
  const dot = (d: number) => interpolate(Math.sin((frame / 6) + d), [-1, 1], [0.3, 1]);
  return (
    <div style={{
      display: 'flex', flexDirection: info.align, alignItems: 'center', gap: 12, marginBottom: 18, opacity: p * 0.7,
    }}>
      <Avatar name={info.name} color={info.color} size={48} />
      <div style={{ background: '#16141f', border: `1.5px solid ${info.color}22`, borderRadius: 18, padding: '16px 24px', display: 'flex', gap: 8 }}>
        {[0, 1.2, 2.4].map((d, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: info.color, opacity: dot(d) }} />
        ))}
      </div>
    </div>
  );
};

// ── timing ─────────────────────────────────────────────────────────────────
const TITLE_END    = 70;
const CHAT_START    = 45;
const CHAT_END       = 330;
const SOLUTION_START = 330;
const SOLUTION_END   = 470;
const MOCK_START     = 470;
const MOCK_DUR       = WATCH_PARTY_MOCK_DURATION;
const CTA_START       = MOCK_START + MOCK_DUR;
const CTA_END         = CTA_START + 170;
export const FRIENDS_REEL_DURATION = CTA_END;

const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  const op = ei(f, [0, 14, TITLE_END - 14, TITLE_END], [0, 1, 1, 0]);
  const p = sp(f, 0);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 22, textAlign: 'center', padding: '0 70px' }}>
      <div style={{ fontSize: 54, transform: `scale(${0.85 + p * 0.15})` }}>🎬🤔</div>
      <div style={{ fontSize: 60, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.15 }}>
        Когда друзья<br />не могут выбрать<br />что смотреть
      </div>
    </div>
  );
};

const ChatScene: React.FC = () => {
  const f = useCurrentFrame();
  const op = ei(f, [CHAT_START, CHAT_START + 20, CHAT_END - 25, CHAT_END], [0, 1, 1, 0]);
  const local = f - CHAT_START;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0a0a0a', padding: '60px 40px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎬</div>
        <div>
          <div style={{ fontSize: 28, color: WHITE, fontWeight: 700, fontFamily: BODY_FONT }}>Смотрим сегодня?</div>
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontFamily: BODY_FONT }}>3 участника</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: CHAT_BG }}>
        <Msg frame={local} delay={0} from="a" text="Го ужастик сегодня? 👻" />
        <Msg frame={local} delay={45} from="b" text="Не, я боюсь ужастиков 😭" />
        {local > 80 && local < 120 && <Typing frame={local} delay={80} from="c" />}
        <Msg frame={local} delay={110} from="c" text="Может комедию? Я знаю одну" />
        <Msg frame={local} delay={150} from="a" text="Уже смотрел её раз 5 🙄" />
        {local > 175 && local < 210 && <Typing frame={local} delay={175} from="b" />}
        <Msg frame={local} delay={200} from="b" text="Документалку про китов? 🐋" />
        <Msg frame={local} delay={235} from="a" text="...мы так и не посмотрим ничего 💀" />
      </div>
    </div>
  );
};

const Solution: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - SOLUTION_START;
  const op = ei(f, [SOLUTION_START, SOLUTION_START + 16, MOCK_START - 16, MOCK_START], [0, 1, 1, 0]);
  const p = sp(Math.max(local, 0), 0);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, padding: '0 80px', textAlign: 'center', gap: 24 }}>
      <div style={{ opacity: p, transform: `scale(${0.85 + p * 0.15})` }}>
        <Img src={staticFile('wewatch-logo-dark.svg')} style={{ width: 250, height: 'auto' }} />
      </div>
      <div style={{ fontSize: 54, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.15, marginTop: 12 }}>
        Каждый включает<br /><span style={{ color: PURPLE_LIGHT }}>своё.</span> Смотрите<br />вместе синхронно.
      </div>
      <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.55)', fontFamily: BODY_FONT }}>
        Голосуй, спорь, договаривайся — прямо в комнате
      </div>
    </div>
  );
};

const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const local = f - CTA_START;
  const op = ei(f, [CTA_START, CTA_START + 16], [0, 1]);
  const p = sp(Math.max(local, 0), 10);
  const pulse = 1 + Math.sin(f / 12) * 0.02;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op, gap: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 54, color: WHITE, fontFamily: FONT, fontWeight: 900, lineHeight: 1.15, padding: '0 70px' }}>
        Хватит спорить.<br />Начните смотреть.
      </div>
      <div style={{
        opacity: p, transform: `scale(${(0.9 + p * 0.1) * pulse})`,
        background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
        borderRadius: 100, padding: '22px 56px', fontSize: 38, color: WHITE, fontFamily: FONT, fontWeight: 900,
      }}>
        wewatch.uz
      </div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', fontFamily: BODY_FONT, opacity: sp(Math.max(local - 20, 0), 0) }}>
        Бесплатно · Без установки
      </div>
    </div>
  );
};

const BgLayer: React.FC = () => {
  const f = useCurrentFrame();
  const glowX = Math.sin(f / 95) * 60;
  const glowY = Math.cos(f / 115) * 45;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{
        position: 'absolute', left: `calc(50% + ${glowX}px)`, top: `calc(28% + ${glowY}px)`, width: 1000, height: 1000,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', opacity: 0.35,
        background: `radial-gradient(circle, ${PURPLE} 0%, transparent 65%)`,
      }} />
      {Array.from({ length: 16 }).map((_, i) => {
        const seed = i * 137.5;
        const px = (Math.sin(seed) * 0.5 + 0.5) * 1080;
        const baseY = (Math.cos(seed * 1.7) * 0.5 + 0.5) * 1920;
        const py = (baseY + f * (0.5 + (i % 3) * 0.25)) % 1920;
        const size = 3 + (i % 4);
        return (
          <div key={i} style={{ position: 'absolute', left: px, top: py, width: size, height: size, borderRadius: '50%', background: i % 2 ? PURPLE_LIGHT : PINK, opacity: 0.18 }} />
        );
      })}
    </AbsoluteFill>
  );
};

export const FriendsCantDecideReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <BgLayer />
      <Sequence from={0}><TitleCard /></Sequence>
      <Sequence from={0}><ChatScene /></Sequence>
      <Sequence from={0}><Solution /></Sequence>
      <Sequence from={MOCK_START} durationInFrames={MOCK_DUR}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 1080, height: 1920, transform: 'scale(0.94)', borderRadius: 32, overflow: 'hidden', boxShadow: `0 30px 90px -20px ${PURPLE}88` }}>
            <WatchPartyMockReel />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={0}><CTA /></Sequence>
    </AbsoluteFill>
  );
};
