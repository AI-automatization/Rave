import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

const FONT = '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ─── Shared background ────────────────────────────────────────────────────────
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

const Logo: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 * size }}>
    <svg width={44 * size} height={34 * size} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 36 * size, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

const Pill: React.FC<{ text: string; color?: string; fontSize?: number }> = ({ text, color = '#A78BFA', fontSize = 24 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '10px 28px', borderRadius: 100,
    background: `${color}18`, border: `1.5px solid ${color}44`,
    fontSize, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 28,
  }}>{text}</div>
);

// ─── CSS Android Phone frame ──────────────────────────────────────────────────
// Pure CSS device — no iPhone notch, punch-hole camera, flat Android edges
const AndroidPhoneFrame: React.FC<{
  screenSrc: string;
  w?: number;
  h?: number;
}> = ({ screenSrc, w = 580, h = 1210 }) => {
  const bezel = 8;
  const radius = 52;
  const screenW = w - bezel * 2;
  const screenH = h - bezel * 2;
  return (
    <div style={{
      width: w, height: h, position: 'relative',
      background: 'linear-gradient(145deg, #1c1c1e 0%, #111 60%, #0a0a0a 100%)',
      borderRadius: radius,
      border: '1.5px solid #2a2a2a',
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,0.08)',
        '0 0 0 1px #111',
        '0 40px 100px rgba(0,0,0,0.95)',
        '0 -20px 80px rgba(124,58,237,0.35)',
      ].join(', '),
    }}>
      {/* Screen area */}
      <div style={{
        position: 'absolute',
        top: bezel, left: bezel,
        width: screenW, height: screenH,
        borderRadius: radius - 4,
        overflow: 'hidden',
        background: '#000',
      }}>
        <img
          src={staticFile(screenSrc)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
        {/* Status bar overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 44,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
          zIndex: 2,
        }} />
        {/* Punch-hole camera (in screen) */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: 14, height: 14,
          background: '#000',
          borderRadius: '50%',
          zIndex: 5,
          boxShadow: '0 0 0 1.5px #1a1a1a',
        }} />
        {/* Bottom nav bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
        }}>
          <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.35)', borderRadius: 4 }} />
        </div>
      </div>
      {/* Volume buttons (left) */}
      <div style={{ position: 'absolute', left: -4, top: 260, width: 4, height: 56, background: '#1a1a1a', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -4, top: 330, width: 4, height: 56, background: '#1a1a1a', borderRadius: '2px 0 0 2px' }} />
      {/* Power button (right) */}
      <div style={{ position: 'absolute', right: -4, top: 300, width: 4, height: 80, background: '#1a1a1a', borderRadius: '0 2px 2px 0' }} />
    </div>
  );
};

// ─── CSS Android Tablet frame ─────────────────────────────────────────────────
// 7" or 10" tablet — two app screens shown side by side inside
const AndroidTabletFrame: React.FC<{
  screenSrc1: string;
  screenSrc2: string;
  w?: number;
  h?: number;
}> = ({ screenSrc1, screenSrc2, w = 980, h = 740 }) => {
  const bezel = 16;
  const radius = 24;
  const screenH = h - bezel * 2;
  const halfW = (w - bezel * 2) / 2 - 2;

  return (
    <div style={{
      width: w, height: h, position: 'relative',
      background: 'linear-gradient(145deg, #1c1c1e 0%, #111 60%, #0a0a0a 100%)',
      borderRadius: radius,
      border: '1.5px solid #2a2a2a',
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,0.08)',
        '0 0 0 1px #111',
        '0 30px 80px rgba(0,0,0,0.95)',
        '0 -10px 60px rgba(124,58,237,0.30)',
      ].join(', '),
    }}>
      {/* Left screen */}
      <div style={{
        position: 'absolute',
        top: bezel, left: bezel,
        width: halfW, height: screenH,
        borderRadius: radius - 8,
        overflow: 'hidden',
        background: '#000',
        borderRight: '1px solid #111',
      }}>
        <img
          src={staticFile(screenSrc1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}>
          <div style={{ width: 70, height: 3, background: 'rgba(255,255,255,0.35)', borderRadius: 4 }} />
        </div>
      </div>
      {/* Right screen */}
      <div style={{
        position: 'absolute',
        top: bezel, left: bezel + halfW + 4,
        width: halfW, height: screenH,
        borderRadius: radius - 8,
        overflow: 'hidden',
        background: '#000',
      }}>
        <img
          src={staticFile(screenSrc2)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}>
          <div style={{ width: 70, height: 3, background: 'rgba(255,255,255,0.35)', borderRadius: 4 }} />
        </div>
      </div>
      {/* Front camera dot (top center, on bezel) */}
      <div style={{
        position: 'absolute', top: bezel / 2 - 4, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, background: '#222', borderRadius: '50%', zIndex: 10,
      }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID PHONE — 1080×1920
// ═══════════════════════════════════════════════════════════════════════════════

const W = 1080;
const H = 1920;

const AndroidPhoneSlide: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screenSrc: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screenSrc, accent }) => (
  <Bg accent={accent} w={W} h={H}>
    <div style={{ position: 'absolute', top: 80, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo />
    </div>
    <div style={{
      position: 'absolute', top: 185, left: 60, right: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} />
      <div style={{ fontSize: 108, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 24 }}>
        {title}
      </div>
      <div style={{ fontSize: 29, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    <div style={{
      position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
      filter: 'drop-shadow(0 -40px 120px rgba(124,58,237,0.6))',
    }}>
      <AndroidPhoneFrame screenSrc={screenSrc} w={580} h={1210} />
    </div>
    <div style={{
      position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center',
      fontSize: 26, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const AND1Home: React.FC = () => (
  <AndroidPhoneSlide
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter. Присоединяйся!"
    screenSrc="screen-home-nobg.png"
    accent="#7C3AED"
  />
);

export const AND2WatchParty: React.FC = () => (
  <AndroidPhoneSlide
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    screenSrc="screen-watchparty-nobg.png"
    accent="#BE185D"
  />
);

export const AND3Profile: React.FC = () => (
  <AndroidPhoneSlide
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screenSrc="screen-profile-nobg.png"
    accent="#065F46"
  />
);

export const AND4Login: React.FC = () => (
  <AndroidPhoneSlide
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    screenSrc="screen-login-nobg.png"
    accent="#1D4ED8"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID 7" TABLET — 1200×1920 (landscape tablet in portrait slide)
// ═══════════════════════════════════════════════════════════════════════════════

const W7 = 1200;
const H7 = 1920;

const TabletSlide7: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screenSrc1: string; screenSrc2: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screenSrc1, screenSrc2, accent }) => (
  <Bg accent={accent} w={W7} h={H7}>
    <div style={{ position: 'absolute', top: 88, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo size={1.08} />
    </div>
    <div style={{
      position: 'absolute', top: 200, left: 70, right: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fontSize={26} />
      <div style={{ fontSize: 118, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 26 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    {/* Tablet frame centered in lower half */}
    <div style={{
      position: 'absolute',
      bottom: 120, left: '50%', transform: 'translateX(-50%)',
      filter: 'drop-shadow(0 -20px 80px rgba(124,58,237,0.5)) drop-shadow(0 20px 50px rgba(0,0,0,0.9))',
    }}>
      <AndroidTabletFrame screenSrc1={screenSrc1} screenSrc2={screenSrc2} w={1060} h={760} />
    </div>
    <div style={{
      position: 'absolute', bottom: 52, left: 0, right: 0, textAlign: 'center',
      fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TAB7A_1Home: React.FC = () => (
  <TabletSlide7
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter."
    screenSrc1="screen-home-nobg.png"
    screenSrc2="screen-watchparty-nobg.png"
    accent="#7C3AED"
  />
);

export const TAB7A_2WatchParty: React.FC = () => (
  <TabletSlide7
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    screenSrc1="screen-watchparty-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#BE185D"
  />
);

export const TAB7A_3Profile: React.FC = () => (
  <TabletSlide7
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screenSrc1="screen-profile-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#065F46"
  />
);

export const TAB7A_4Login: React.FC = () => (
  <TabletSlide7
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    screenSrc1="screen-login-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#1D4ED8"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID 10" TABLET — 1600×2560
// ═══════════════════════════════════════════════════════════════════════════════

const W10 = 1600;
const H10 = 2560;

const TabletSlide10: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screenSrc1: string; screenSrc2: string; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screenSrc1, screenSrc2, accent }) => (
  <Bg accent={accent} w={W10} h={H10}>
    <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo size={1.5} />
    </div>
    <div style={{
      position: 'absolute', top: 280, left: 100, right: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fontSize={36} />
      <div style={{ fontSize: 160, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 36 }}>
        {title}
      </div>
      <div style={{ fontSize: 44, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45, maxWidth: 1200 }}>
        {subtitle}
      </div>
    </div>
    <div style={{
      position: 'absolute',
      bottom: 180, left: '50%', transform: 'translateX(-50%)',
      filter: 'drop-shadow(0 -20px 100px rgba(124,58,237,0.5)) drop-shadow(0 20px 60px rgba(0,0,0,0.9))',
    }}>
      <AndroidTabletFrame screenSrc1={screenSrc1} screenSrc2={screenSrc2} w={1400} h={1020} />
    </div>
    <div style={{
      position: 'absolute', bottom: 68, left: 0, right: 0, textAlign: 'center',
      fontSize: 40, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TAB10A_1Home: React.FC = () => (
  <TabletSlide10
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter. Присоединяйся!"
    screenSrc1="screen-home-nobg.png"
    screenSrc2="screen-watchparty-nobg.png"
    accent="#7C3AED"
  />
);

export const TAB10A_2WatchParty: React.FC = () => (
  <TabletSlide10
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    screenSrc1="screen-watchparty-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#BE185D"
  />
);

export const TAB10A_3Profile: React.FC = () => (
  <TabletSlide10
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screenSrc1="screen-profile-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#065F46"
  />
);

export const TAB10A_4Login: React.FC = () => (
  <TabletSlide10
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    screenSrc1="screen-login-nobg.png"
    screenSrc2="screen-home-nobg.png"
    accent="#1D4ED8"
  />
);
