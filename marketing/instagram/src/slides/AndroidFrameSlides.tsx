import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { HomeScreenUI, LoginScreenUI, WatchPartyScreenUI, ProfileScreenUI, TabletHomeScreenUI, TabletWatchPartyUI, TabletProfileUI, TabletLoginUI } from './AppScreens';

// ─── Frame data from image analysis ──────────────────────────────────────────
// android-frame-transparent.png (1440×1000, PNG mode P)
// Device in PNG: x=507–933, y=48–950  (427×903 px)
// Screen in PNG: x=510–933, y=68–930  (423×862 px)

// tablet-frame-transparent.png (1000×1000, Samsung Tab S7 landscape)
// Device in PNG: x=30–970, y=195–807  (941×613 px)
// Screen in PNG: x=62–938, y=228–775  (876×547 px)

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

const Logo: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s }}>
    <svg width={44 * s} height={34 * s} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 36 * s, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

const Pill: React.FC<{ text: string; color?: string; fs?: number }> = ({ text, color = '#A78BFA', fs = 24 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '10px 28px', borderRadius: 100,
    background: `${color}18`, border: `1.5px solid ${color}44`,
    fontSize: fs, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 28,
  }}>{text}</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID PHONE — 1080×1920
// Device (427×903) → scale to 560×1180 (factor 1.31)
// PNG at scale: 1886×1310
// Device left in slide: 260 (centered in 1080)
// Device top in slide: 720
// PNG offset: left = 260 - 507×1.31 = -404 | top = 720 - 48×1.31 = 657
// Screen in slide: x=264, y=746, w=554, h=1129
// ═══════════════════════════════════════════════════════════════════════════════

const PHONE_SC = 560 / 427;  // 1.311
const PHONE_PNG_W = 1440 * PHONE_SC;
const PHONE_PNG_H = 1000 * PHONE_SC;
const PHONE_DEV_LEFT = 260; // device left edge in slide
const PHONE_DEV_TOP  = 720; // device top edge in slide
const PHONE_PNG_LEFT = PHONE_DEV_LEFT - 507 * PHONE_SC;
const PHONE_PNG_TOP  = PHONE_DEV_TOP  -  48 * PHONE_SC;
// Screen area in slide:
const PHONE_SCR_X = PHONE_DEV_LEFT + (510 - 507) * PHONE_SC; // ≈ 264
const PHONE_SCR_Y = PHONE_DEV_TOP  + ( 68 -  48) * PHONE_SC; // ≈ 746
const PHONE_SCR_W = (933 - 510) * PHONE_SC; // ≈ 554
const PHONE_SCR_H = (930 -  68) * PHONE_SC; // ≈ 1130

const AndroidPhoneDevice: React.FC<{ screen: React.ReactNode }> = ({ screen }) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    {/* App screen content — HTML/CSS recreation, behind the frame */}
    <div style={{
      position: 'absolute',
      left: PHONE_SCR_X, top: PHONE_SCR_Y,
      width: PHONE_SCR_W, height: PHONE_SCR_H,
      overflow: 'hidden',
      borderRadius: 38,
    }}>
      {screen}
    </div>
    {/* Android frame overlay — dark pixels only, rest transparent */}
    <img
      src={staticFile('android-frame-transparent.png')}
      style={{
        position: 'absolute',
        left: PHONE_PNG_LEFT, top: PHONE_PNG_TOP,
        width: PHONE_PNG_W, height: PHONE_PNG_H,
        pointerEvents: 'none',
      }}
    />
    {/* Glow under device */}
    <div style={{
      position: 'absolute',
      left: PHONE_SCR_X - 20, top: PHONE_DEV_TOP + 80,
      width: PHONE_SCR_W + 40, height: 60,
      background: 'rgba(124,58,237,0.35)',
      filter: 'blur(40px)',
      borderRadius: '50%',
      zIndex: -1,
    }} />
  </div>
);

const PhoneSlide: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screen: React.ReactNode; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screen, accent }) => (
  <Bg accent={accent} w={1080} h={1920}>
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
      <div style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    <AndroidPhoneDevice screen={screen} />
    <div style={{
      position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center',
      fontSize: 26, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

const RealScreen: React.FC<{ src: string }> = ({ src }) => (
  <img
    src={staticFile(src)}
    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
  />
);

export const ANDR1Home: React.FC = () => (
  <PhoneSlide
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Создай комнату и смотри фильмы с друзьями в реальном времени!"
    screen={<RealScreen src="real-home.jpg" />}
    accent="#7C3AED"
  />
);

export const ANDR2WatchParty: React.FC = () => (
  <PhoneSlide
    pill="👥 ДРУЗЬЯ"
    pillColor="#F472B6"
    title={<>Смотри<br /><span style={{ color: '#F472B6' }}>с друзьями.</span></>}
    subtitle="Добавляй друзей и приглашай их в комнату одним нажатием."
    screen={<RealScreen src="real-friends.jpg" />}
    accent="#BE185D"
  />
);

export const ANDR3Profile: React.FC = () => (
  <PhoneSlide
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screen={<RealScreen src="real-profile.jpg" />}
    accent="#065F46"
  />
);

export const ANDR4Login: React.FC = () => (
  <PhoneSlide
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Telegram.</span></>}
    subtitle="Никаких долгих регистраций. Google или Telegram — и сразу в эфир."
    screen={<RealScreen src="real-login.jpg" />}
    accent="#1D4ED8"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID 7" TABLET — 1200×1920
// Samsung Tab S7 landscape frame (1000×1000)
// Device (941×613) → scale to 1100×719 (factor 1.169)
// Screen in slide: x=87, y=979, w=1025, h=640
// ═══════════════════════════════════════════════════════════════════════════════

const TAB_SC = 1100 / 941;   // 1.169
const TAB_PNG_W = 1000 * TAB_SC;
const TAB_PNG_H = 1000 * TAB_SC;
const TAB_DEV_LEFT = 50;
const TAB_DEV_TOP  = 940;
const TAB_PNG_LEFT = TAB_DEV_LEFT -  30 * TAB_SC;
const TAB_PNG_TOP  = TAB_DEV_TOP  - 195 * TAB_SC;
const TAB_SCR_X = TAB_DEV_LEFT + ( 62 -  30) * TAB_SC; // ≈ 87
const TAB_SCR_Y = TAB_DEV_TOP  + (228 - 195) * TAB_SC; // ≈ 979
const TAB_SCR_W = (938 -  62) * TAB_SC; // ≈ 1025
const TAB_SCR_H = (775 - 228) * TAB_SC; // ≈ 640

const TabletDevice: React.FC<{ screen: React.ReactNode }> = ({ screen }) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <div style={{
      position: 'absolute',
      left: TAB_SCR_X, top: TAB_SCR_Y,
      width: TAB_SCR_W, height: TAB_SCR_H,
      overflow: 'hidden', borderRadius: 8,
    }}>
      {screen}
    </div>
    <img
      src={staticFile('tablet-frame-transparent.png')}
      style={{
        position: 'absolute',
        left: TAB_PNG_LEFT, top: TAB_PNG_TOP,
        width: TAB_PNG_W, height: TAB_PNG_H,
        pointerEvents: 'none',
      }}
    />
  </div>
);

const Tab7Slide: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screen: React.ReactNode; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screen, accent }) => (
  <Bg accent={accent} w={1200} h={1920}>
    <div style={{ position: 'absolute', top: 88, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo s={1.08} />
    </div>
    <div style={{
      position: 'absolute', top: 200, left: 70, right: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fs={26} />
      <div style={{ fontSize: 118, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 26 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </div>
    <TabletDevice screen={screen} />
    <div style={{
      position: 'absolute', bottom: 52, left: 0, right: 0, textAlign: 'center',
      fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TABL7_1Home: React.FC = () => (
  <Tab7Slide
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter."
    screen={<TabletHomeScreenUI />}
    accent="#7C3AED"
  />
);

export const TABL7_2WatchParty: React.FC = () => (
  <Tab7Slide
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    screen={<TabletWatchPartyUI />}
    accent="#BE185D"
  />
);

export const TABL7_3Profile: React.FC = () => (
  <Tab7Slide
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screen={<TabletProfileUI />}
    accent="#065F46"
  />
);

export const TABL7_4Login: React.FC = () => (
  <Tab7Slide
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    screen={<TabletLoginUI />}
    accent="#1D4ED8"
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ANDROID 10" TABLET — 1600×2560
// Scale to width=1500 (factor 1500/941=1.594)
// Screen: x≈101, y≈1253, w≈1395, h≈871
// ═══════════════════════════════════════════════════════════════════════════════

const TAB10_SC = 1500 / 941;
const TAB10_PNG_W = 1000 * TAB10_SC;
const TAB10_PNG_H = 1000 * TAB10_SC;
const TAB10_DEV_LEFT = 50;
const TAB10_DEV_TOP  = 1200;
const TAB10_PNG_LEFT = TAB10_DEV_LEFT -  30 * TAB10_SC;
const TAB10_PNG_TOP  = TAB10_DEV_TOP  - 195 * TAB10_SC;
const TAB10_SCR_X = TAB10_DEV_LEFT + ( 62 -  30) * TAB10_SC;
const TAB10_SCR_Y = TAB10_DEV_TOP  + (228 - 195) * TAB10_SC;
const TAB10_SCR_W = (938 -  62) * TAB10_SC;
const TAB10_SCR_H = (775 - 228) * TAB10_SC;

const Tablet10Device: React.FC<{ screen: React.ReactNode }> = ({ screen }) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <div style={{
      position: 'absolute',
      left: TAB10_SCR_X, top: TAB10_SCR_Y,
      width: TAB10_SCR_W, height: TAB10_SCR_H,
      overflow: 'hidden', borderRadius: 10,
    }}>
      {screen}
    </div>
    <img
      src={staticFile('tablet-frame-transparent.png')}
      style={{
        position: 'absolute',
        left: TAB10_PNG_LEFT, top: TAB10_PNG_TOP,
        width: TAB10_PNG_W, height: TAB10_PNG_H,
        pointerEvents: 'none',
      }}
    />
  </div>
);

const Tab10Slide: React.FC<{
  pill: string; pillColor?: string;
  title: React.ReactNode; subtitle: string;
  screen: React.ReactNode; accent?: string;
}> = ({ pill, pillColor, title, subtitle, screen, accent }) => (
  <Bg accent={accent} w={1600} h={2560}>
    <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Logo s={1.5} />
    </div>
    <div style={{
      position: 'absolute', top: 280, left: 100, right: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    }}>
      <Pill text={pill} color={pillColor} fs={36} />
      <div style={{ fontSize: 160, fontWeight: 900, color: '#fff', lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 36 }}>
        {title}
      </div>
      <div style={{ fontSize: 44, fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45, maxWidth: 1300 }}>
        {subtitle}
      </div>
    </div>
    <Tablet10Device screen={screen} />
    <div style={{
      position: 'absolute', bottom: 68, left: 0, right: 0, textAlign: 'center',
      fontSize: 40, fontWeight: 700, color: 'rgba(167,139,250,0.55)', zIndex: 10,
    }}>wewatch.uz</div>
  </Bg>
);

export const TABL10_1Home: React.FC = () => (
  <Tab10Slide
    pill="🎬 ОНЛАЙН КИНОТЕАТР"
    title={<>Смотри<br /><span style={{ color: '#A78BFA' }}>вместе.</span></>}
    subtitle="Активные комнаты — Lord of the Rings, Interstellar, Harry Potter. Присоединяйся!"
    screen={<TabletHomeScreenUI />}
    accent="#7C3AED"
  />
);

export const TABL10_2WatchParty: React.FC = () => (
  <Tab10Slide
    pill="🍿 WATCH PARTY"
    pillColor="#F472B6"
    title={<>Синхронно<br /><span style={{ color: '#F472B6' }}>до кадра.</span></>}
    subtitle="Чат в реальном времени прямо во время просмотра. Как будто рядом."
    screen={<TabletWatchPartyUI />}
    accent="#BE185D"
  />
);

export const TABL10_3Profile: React.FC = () => (
  <Tab10Slide
    pill="👤 ПРОФИЛЬ"
    pillColor="#34D399"
    title={<>История<br /><span style={{ color: '#34D399' }}>просмотров.</span></>}
    subtitle="Все что смотрел, достижения, статистика и настройки аккаунта."
    screen={<TabletProfileUI />}
    accent="#065F46"
  />
);

export const TABL10_4Login: React.FC = () => (
  <Tab10Slide
    pill="⚡ ВХОД ЗА 10 СЕК"
    pillColor="#60A5FA"
    title={<>Google.<br /><span style={{ color: '#60A5FA' }}>Apple. TG.</span></>}
    subtitle="Никаких долгих регистраций. Google, Apple или Telegram — и сразу в эфир."
    screen={<TabletLoginUI />}
    accent="#1D4ED8"
  />
);
