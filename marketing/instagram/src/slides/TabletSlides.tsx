import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

const FONT = '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ─── Shared primitives (parameterized by W/H) ─────────────────────────────────

const Bg: React.FC<{ children: React.ReactNode; accent?: string; w: number; h: number }> = ({
  children, accent = '#7C3AED', w, h,
}) => (
  <AbsoluteFill style={{ background: '#030212', fontFamily: FONT, width: w, height: h, overflow: 'hidden' }}>
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

const Logo7: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={48} height={38} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

const Logo10: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
    <svg width={64} height={50} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 56, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

const Pill: React.FC<{ text: string; color?: string; fontSize?: number }> = ({ text, color = '#A78BFA', fontSize = 24 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '10px 28px', borderRadius: 100,
    background: `${color}18`, border: `1.5px solid ${color}44`,
    fontSize, fontWeight: 700, color,
    letterSpacing: '0.06em', marginBottom: 32,
  }}>{text}</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 7-INCH TABLET — 1200×1920 (slightly wider phone, same portrait aspect ~8:5)
// Single phone mockup, scaled proportionally
// ═══════════════════════════════════════════════════════════════════════════════

const W7 = 1200;
const H7 = 1920;

const Slide7: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  phoneSrc: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, phoneSrc, accent }) => (
  <Bg accent={accent} w={W7} h={H7}>
    <div style={{ position: 'absolute', top: 88, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo7 />
    </div>
    <div style={{
      position: 'absolute', top: 205, left: 70, right: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fontSize={26} />
      <div style={{ fontSize: 124, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 30 }}>
        {title}
      </div>
      <div style={{ fontSize: 34, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    {/* Slightly wider phone */}
    <div style={{
      position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
      width: 720,
      filter: 'drop-shadow(0 -40px 120px rgba(124,58,237,0.6)) drop-shadow(0 20px 60px rgba(0,0,0,0.9))',
    }}>
      <img src={staticFile(phoneSrc)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
    <div style={{
      position: 'absolute', bottom: 48, left: 0, right: 0, textAlign: 'center',
      fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TAB7_1Home: React.FC = () => (
  <Slide7
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter. Присоединяйся!"
    phoneSrc="mockup-home.png"
    accent="#7C3AED"
  />
);

export const TAB7_2WatchParty: React.FC = () => (
  <Slide7
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    phoneSrc="mockup-watchparty.png"
    accent="#BE185D"
  />
);

export const TAB7_3Profile: React.FC = () => (
  <Slide7
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    phoneSrc="mockup-profile.png"
    accent="#065F46"
  />
);

export const TAB7_4Login: React.FC = () => (
  <Slide7
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    phoneSrc="mockup-login.png"
    accent="#1D4ED8"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// 10-INCH TABLET — 1600×2560 (two phones side by side)
// ═══════════════════════════════════════════════════════════════════════════════

const W10 = 1600;
const H10 = 2560;

const TwoPhones: React.FC<{ src1: string; src2: string }> = ({ src1, src2 }) => (
  <>
    <div style={{
      position: 'absolute', bottom: -160, left: '50%', transform: 'translateX(calc(-50% - 400px))',
      width: 660,
      filter: 'drop-shadow(0 -30px 100px rgba(124,58,237,0.5)) drop-shadow(0 20px 60px rgba(0,0,0,0.9))',
    }}>
      <img src={staticFile(src1)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
    <div style={{
      position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(calc(-50% + 400px))',
      width: 660,
      filter: 'drop-shadow(0 -30px 100px rgba(124,58,237,0.4)) drop-shadow(0 20px 60px rgba(0,0,0,0.8))',
      opacity: 0.82,
    }}>
      <img src={staticFile(src2)} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  </>
);

const Slide10: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  phoneSrc1: string; phoneSrc2: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, phoneSrc1, phoneSrc2, accent }) => (
  <Bg accent={accent} w={W10} h={H10}>
    <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo10 />
    </div>
    <div style={{
      position: 'absolute', top: 270, left: 100, right: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fontSize={34} />
      <div style={{ fontSize: 160, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 40 }}>
        {title}
      </div>
      <div style={{ fontSize: 44, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45, maxWidth: 1100 }}>
        {subtitle}
      </div>
    </div>
    <TwoPhones src1={phoneSrc1} src2={phoneSrc2} />
    <div style={{
      position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center',
      fontSize: 38, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TAB10_1Home: React.FC = () => (
  <Slide10
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter. Присоединяйся!"
    phoneSrc1="mockup-home.png"
    phoneSrc2="mockup-watchparty.png"
    accent="#7C3AED"
  />
);

export const TAB10_2WatchParty: React.FC = () => (
  <Slide10
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    phoneSrc1="mockup-watchparty.png"
    phoneSrc2="mockup-home.png"
    accent="#BE185D"
  />
);

export const TAB10_3Profile: React.FC = () => (
  <Slide10
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    phoneSrc1="mockup-profile.png"
    phoneSrc2="mockup-home.png"
    accent="#065F46"
  />
);

export const TAB10_4Login: React.FC = () => (
  <Slide10
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    phoneSrc1="mockup-login.png"
    phoneSrc2="mockup-home.png"
    accent="#1D4ED8"
  />
);
