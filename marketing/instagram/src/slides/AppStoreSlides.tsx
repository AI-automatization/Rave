import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

const FONT = '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const W = 1080;
const H = 1920;

// ─── Background ───────────────────────────────────────────────────────────────
const Bg: React.FC<{ children: React.ReactNode; accent?: string }> = ({
  children, accent = '#7C3AED',
}) => (
  <AbsoluteFill style={{
    background: '#030212',
    fontFamily: FONT, width: W, height: H, overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 50% -5%, ${accent} 0%, #0e0525 38%, #030212 70%)`,
      opacity: 0.55,
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)',
      backgroundSize: '80px 80px', pointerEvents: 'none',
    }} />
    {children}
  </AbsoluteFill>
);

const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={44} height={34} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

const Pill: React.FC<{ text: string; color?: string }> = ({ text, color = '#A78BFA' }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '10px 28px', borderRadius: 100,
    background: `${color}18`, border: `1.5px solid ${color}44`,
    fontSize: 24, fontWeight: 700, color,
    letterSpacing: '0.06em', marginBottom: 32,
  }}>{text}</div>
);

const Phone: React.FC<{ src: string }> = ({ src }) => (
  <div style={{
    position: 'absolute', bottom: -140, left: '50%',
    transform: 'translateX(-50%)',
    width: 640,
    filter: 'drop-shadow(0 -40px 120px rgba(124,58,237,0.6)) drop-shadow(0 20px 60px rgba(0,0,0,0.9))',
  }}>
    <img src={staticFile(src)} style={{ width: '100%', height: 'auto', display: 'block' }} />
  </div>
);

const Slide: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  phoneSrc: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, phoneSrc, accent }) => (
  <Bg accent={accent}>
    <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo />
    </div>
    <div style={{
      position: 'absolute', top: 185, left: 60, right: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} />
      <div style={{ fontSize: 112, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 28 }}>
        {title}
      </div>
      <div style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    <Phone src={phoneSrc} />
    <div style={{
      position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center',
      fontSize: 26, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>
      wewatch.uz
    </div>
  </Bg>
);

// ═══ SLIDE 1 — Hero ═══════════════════════════════════════════════════════════
export const AS1Hero: React.FC = () => (
  <Slide
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты с реальными фильмами. Выбирай и подключайся."
    phoneSrc="mockup-home.png"
    accent="#7C3AED"
  />
);

// ═══ SLIDE 2 — Watch Party ════════════════════════════════════════════════════
export const AS2Rooms: React.FC = () => (
  <Slide
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Voix в реальном времени. Одна пауза — у всех сразу."
    phoneSrc="mockup-watchparty.png"
    accent="#BE185D"
  />
);

// ═══ SLIDE 3 — Chat ═══════════════════════════════════════════════════════════
export const AS3Chat: React.FC = () => (
  <Slide
    pill="💬 ЖИВОЙ ЧАТ"
    pillColor="#FBBF24"
    title={<>Реагируй<br /><span style={{ color: '#FBBF24' }}>вместе.</span></>}
    subtitle="Сообщения и эмодзи прямо во время просмотра. Как в кино рядом."
    phoneSrc="mockup-watchparty.png"
    accent="#92400E"
  />
);

// ═══ SLIDE 4 — Login ══════════════════════════════════════════════════════════
export const AS4Login: React.FC = () => (
  <Slide
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Google, Apple или Telegram — никаких форм. Сразу к просмотру."
    phoneSrc="mockup-login.png"
    accent="#1D4ED8"
  />
);
