/**
 * WeWatch App Screens — pixel-faithful HTML/CSS recreation
 * Built from: HomeScreen.tsx, LoginScreen.tsx, WatchPartyScreen.tsx, ProfileScreen.tsx
 * Colors from: darkColors in apps/mobile/src/theme/colors.ts
 */
import React from 'react';

// ─── Design tokens (from darkColors) ─────────────────────────────────────────
const C = {
  primary:     '#7C3AED',
  primaryLight:'#9333EA',
  secondary:   '#60A5FA',
  bgVoid:      '#060608',
  bgBase:      '#0A0A0F',
  bgElevated:  '#111118',
  bgSurface:   '#1C1C28',
  bgMuted:     '#242433',
  textPrimary: '#FFFFFF',
  textSec:     '#D4D4D8',
  textMuted:   '#71717A',
  textDim:     '#52525B',
  border:      'rgba(255,255,255,0.06)',
  borderStrong:'rgba(255,255,255,0.08)',
  success:     '#34D399',
  error:       '#F87171',
  warning:     '#FBBF24',
  link:        '#A855F7',
  telegramBlue:'#2AABEE',
};

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// ─── Shared micro-components ──────────────────────────────────────────────────

const WeWatchLogo: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 * size }}>
    <svg width={30 * size} height={23 * size} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{ fontSize: 18 * size, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: FONT }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

// Icon SVGs (mapped from Ionicons to inline SVG)
const Icon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color = C.textPrimary }) => {
  const paths: Record<string, string> = {
    'search':        'M11 3a8 8 0 100 16A8 8 0 0011 3zM2 11a9 9 0 1116.32 5.906l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.386A9 9 0 012 11z',
    'key':           'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    'bell':          'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    'people':        'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'play':          'M8 5v14l11-7z',
    'close':         'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    'mail':          'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    'lock':          'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    'eye':           'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    'chevron-right': 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    'person':        'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    'tv':            'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
    'chat':          'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    'star':          'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    'settings':      'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  };
  const d = paths[name] || paths['close'];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={d} />
    </svg>
  );
};

// ─── Status bar ───────────────────────────────────────────────────────────────
const StatusBar: React.FC = () => (
  <div style={{
    height: 28, display: 'flex', alignItems: 'center',
    paddingLeft: 16, paddingRight: 16,
    justifyContent: 'space-between',
    background: 'transparent',
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: FONT }}>9:41</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {/* Signal bars */}
      <svg width={16} height={12} viewBox="0 0 16 12" fill="white">
        <rect x="0" y="9" width="3" height="3" rx="0.5" />
        <rect x="4" y="6" width="3" height="6" rx="0.5" />
        <rect x="8" y="3" width="3" height="9" rx="0.5" />
        <rect x="12" y="0" width="3" height="12" rx="0.5" />
      </svg>
      {/* WiFi */}
      <svg width={16} height={12} viewBox="0 0 16 12" fill="none">
        <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="white" />
        <path d="M2.5 6C4.2 4.2 5.98 3 8 3s3.8 1.2 5.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M0 3C2.5 1 5.1 0 8 0s5.5 1 8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
      {/* Battery */}
      <svg width={25} height={12} viewBox="0 0 25 12" fill="none">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="white" strokeOpacity="0.4" />
        <rect x="2" y="2" width="17" height="8" rx="1.5" fill="white" />
        <path d="M23 4v4a2 2 0 000-4z" fill="white" fillOpacity="0.4" />
      </svg>
    </div>
  </div>
);

// Bottom tab bar
const TabBar: React.FC<{ active?: number }> = ({ active = 0 }) => {
  const tabs = [
    { icon: 'tv', label: 'Главная' },
    { icon: 'search', label: 'Поиск' },
    { icon: 'people', label: 'Друзья' },
    { icon: 'person', label: 'Профиль' },
  ];
  return (
    <div style={{
      height: 60, display: 'flex',
      background: C.bgBase,
      borderTop: `1px solid ${C.borderStrong}`,
      paddingBottom: 8,
    }}>
      {tabs.map((tab, i) => (
        <div key={i} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <Icon name={tab.icon} size={22} color={i === active ? C.primary : C.textDim} />
          <span style={{ fontSize: 9, fontFamily: FONT, color: i === active ? C.primary : C.textDim, fontWeight: i === active ? 600 : 400 }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── SCREEN 1: HOME ───────────────────────────────────────────────────────────
const movies = [
  { title: 'The Lord of the Rings', year: '2001', bg: 'linear-gradient(180deg,#2d4a1e 0%,#1a2d12 100%)', members: '5/10', live: false, color: '#86a86e' },
  { title: 'Interstellar', year: '2014', bg: 'linear-gradient(180deg,#1a2a3a 0%,#0d1a2e 100%)', members: '4/8', live: true,  color: '#6b98c8' },
  { title: 'Harry Potter', year: '2001', bg: 'linear-gradient(180deg,#2a1a3a 0%,#1a0d2e 100%)', members: '3/6', live: false, color: '#9b6ec8' },
  { title: 'Dune: Part Two', year: '2024', bg: 'linear-gradient(180deg,#3a2a0d 0%,#2a1a05 100%)', members: '2/4', live: false, color: '#c8a86e' },
];

export const HomeScreenUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgBase, fontFamily: FONT,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', position: 'relative',
  }}>
    {/* Top glow */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 140,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.22) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    <StatusBar />

    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingLeft: 20, paddingRight: 16, paddingTop: 4, paddingBottom: 10,
    }}>
      <WeWatchLogo />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${C.secondary}15`, border: `1px solid ${C.secondary}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="key" size={14} color={C.secondary} />
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: C.bgElevated, border: `1px solid ${C.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Icon name="bell" size={18} color={C.textPrimary} />
          <div style={{
            position: 'absolute', top: 5, right: 5, width: 8, height: 8,
            background: C.error, borderRadius: '50%', border: `1.5px solid ${C.bgBase}`,
          }} />
        </div>
      </div>
    </div>

    {/* Search */}
    <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.bgElevated, borderRadius: 14,
        padding: '0 14px', height: 40,
        border: `1px solid ${C.border}`,
      }}>
        <Icon name="search" size={14} color={C.textDim} />
        <span style={{ fontSize: 13, color: C.textDim, fontFamily: FONT }}>Поиск видео...</span>
      </div>
    </div>

    {/* HomeCTA card */}
    <div style={{
      marginLeft: 14, marginRight: 14, marginBottom: 10,
      background: C.bgElevated, borderRadius: 14,
      border: `1px solid ${C.primary}40`,
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: `${C.primary}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="people" size={22} color={C.primary} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: FONT, marginBottom: 2 }}>Do'stlar bilan birga ko'rish</div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT, lineHeight: 1.4 }}>YouTube, VK, Rutube va boshqa manbalardan video tanlang</div>
        </div>
      </div>
      <div style={{
        height: 36, borderRadius: 10,
        background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name="play" size={16} color="#fff" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FONT }}>Video tanlash</span>
      </div>
    </div>

    {/* Divider */}
    <div style={{ height: 1, background: C.border, marginLeft: 14, marginRight: 14, marginBottom: 10 }} />

    {/* Active rooms header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      paddingLeft: 18, paddingRight: 18, marginBottom: 8,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.3, fontFamily: FONT }}>АКТИВНЫЕ КОМНАТЫ</span>
      <div style={{
        background: C.bgElevated, borderRadius: 4, padding: '1px 6px',
        border: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, fontFamily: FONT }}>3</span>
      </div>
    </div>

    {/* Rooms grid */}
    <div style={{ flex: 1, paddingLeft: 14, paddingRight: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {movies.map((m, i) => (
          <div key={i} style={{
            borderRadius: 12, overflow: 'hidden', position: 'relative',
            aspectRatio: '1/1.48',
            background: m.bg,
            border: `1px solid rgba(255,255,255,0.06)`,
          }}>
            {/* Movie poster texture */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `radial-gradient(circle at 30% 30%, ${m.color}20, transparent 50%)`,
            }} />
            {/* Film strip at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" size={18} color={m.color} />
              </div>
            </div>
            {/* Bottom info */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              padding: '20px 8px 8px',
            }}>
              {m.live && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: '#ef4444', borderRadius: 4, padding: '1px 5px', marginBottom: 3,
                }}>
                  <div style={{ width: 5, height: 5, background: '#fff', borderRadius: '50%' }} />
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', fontFamily: FONT }}>LIVE</span>
                </div>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: FONT, lineHeight: 1.3, marginBottom: 3 }}>{m.title} ({m.year})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="people" size={9} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: FONT }}>{m.members}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <TabBar active={0} />
  </div>
);

// ─── SCREEN 2: LOGIN ──────────────────────────────────────────────────────────
export const LoginScreenUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgVoid, fontFamily: FONT,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', position: 'relative',
  }}>
    {/* Grid background */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
    }} />
    {/* Accent glow */}
    <div style={{
      position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
      width: '120%', height: '60%',
      background: `radial-gradient(ellipse, ${C.primary}22 0%, transparent 65%)`,
    }} />

    <StatusBar />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 24px', position: 'relative' }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 8 }}>
        <svg width={56} height={42} viewBox="0 0 52 40" fill="none">
          <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>we<span style={{ color: '#A78BFA' }}>Watch</span></span>
        <span style={{ fontSize: 12, color: C.textMuted, letterSpacing: 0.4, fontFamily: FONT }}>Войдите в аккаунт</span>
      </div>

      {/* Email input */}
      <div style={{
        width: '100%', height: 48, borderRadius: 14, marginBottom: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 14, gap: 10,
      }}>
        <Icon name="mail" size={15} color={C.textDim} />
        <span style={{ fontSize: 13, color: C.textDim, fontFamily: FONT }}>Email</span>
      </div>

      {/* Password input */}
      <div style={{
        width: '100%', height: 48, borderRadius: 14, marginBottom: 6,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 14, paddingRight: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="lock" size={15} color={C.textDim} />
          <span style={{ fontSize: 13, color: C.textDim, fontFamily: FONT }}>Пароль</span>
        </div>
        <Icon name="eye" size={15} color={C.textDim} />
      </div>

      {/* Forgot */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>Забыли пароль?</span>
      </div>

      {/* Login button */}
      <div style={{
        width: '100%', height: 48, borderRadius: 14, marginBottom: 22,
        background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: FONT }}>Войти</span>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 11, color: C.textDim, fontFamily: FONT }}>или войти через</span>
        <div style={{ flex: 1, height: 0.5, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Social buttons */}
      <div style={{ width: '100%', display: 'flex', gap: 8, marginBottom: 24 }}>
        {/* Google */}
        <div style={{
          flex: 1, height: 44, borderRadius: 12,
          background: C.bgElevated, border: `1px solid ${C.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, fontFamily: FONT }}>Google</span>
        </div>
        {/* Telegram */}
        <div style={{
          flex: 1, height: 44, borderRadius: 12,
          background: `${C.telegramBlue}15`, border: `1px solid ${C.telegramBlue}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill={C.telegramBlue}>
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.08l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.953l-.166-.474z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.telegramBlue, fontFamily: FONT }}>Telegram</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT }}>Нет аккаунта?</span>
        <span style={{ fontSize: 12, color: C.link, fontWeight: 700, fontFamily: FONT }}>Зарегистрируйтесь</span>
      </div>
    </div>
  </div>
);

// ─── SCREEN 3: WATCH PARTY ────────────────────────────────────────────────────
const chatMessages = [
  { user: 'Alex', text: 'Вот это момент!! 🔥', time: '14:23', avatar: '#7C3AED' },
  { user: 'Maria', text: 'Не могу остановиться смотреть 😍', time: '14:23', avatar: '#34D399' },
  { user: 'Dima', text: 'Подождите не спойлерьте!!', time: '14:24', avatar: '#F472B6' },
  { user: 'You', text: 'Ахахах точно 😂', time: '14:24', avatar: '#60A5FA', isMe: true },
];

export const WatchPartyScreenUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: '#060608', fontFamily: FONT,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <StatusBar />

    {/* Video player */}
    <div style={{
      width: '100%', aspectRatio: '16/9',
      background: 'linear-gradient(135deg, #1a2a3a 0%, #0d1a2e 50%, #1a1a2e 100%)',
      position: 'relative', flexShrink: 0,
    }}>
      {/* Film grain texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(107,152,200,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(107,152,200,0.08) 0%, transparent 50%)',
      }} />
      {/* Play button */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(124,58,237,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="play" size={20} color="#fff" />
      </div>
      {/* Movie title overlay */}
      <div style={{
        position: 'absolute', top: 8, left: 10, right: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}>Interstellar (2014)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: FONT }}>LIVE</span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
        <div style={{ width: '45%', height: '100%', background: C.primary }} />
      </div>
    </div>

    {/* Room info bar */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 14px',
      background: C.bgElevated, borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>Interstellar Watch Party</div>
        <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>4 участника · Владелец: Alex</div>
      </div>
      <div style={{ display: 'flex', gap: -4 }}>
        {['#7C3AED','#34D399','#F472B6','#60A5FA'].map((c, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: c, border: '2px solid #111118',
            marginLeft: i > 0 ? -6 : 0,
          }} />
        ))}
      </div>
    </div>

    {/* Chat messages */}
    <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
      {chatMessages.map((msg, i) => (
        <div key={i} style={{
          display: 'flex', gap: 7,
          flexDirection: msg.isMe ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: msg.avatar,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{msg.user[0]}</span>
          </div>
          <div style={{
            maxWidth: '75%',
            background: msg.isMe ? `${C.primary}30` : C.bgElevated,
            border: `1px solid ${msg.isMe ? C.primary + '40' : C.border}`,
            borderRadius: msg.isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            padding: '6px 10px',
          }}>
            {!msg.isMe && <div style={{ fontSize: 10, fontWeight: 700, color: msg.avatar, fontFamily: FONT, marginBottom: 2 }}>{msg.user}</div>}
            <div style={{ fontSize: 12, color: C.textPrimary, fontFamily: FONT }}>{msg.text}</div>
            <div style={{ fontSize: 9, color: C.textDim, fontFamily: FONT, textAlign: 'right', marginTop: 2 }}>{msg.time}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Emoji bar */}
    <div style={{ padding: '4px 12px', display: 'flex', gap: 8 }}>
      {['❤️','😂','🔥','😱','👏','🤩'].map((e, i) => (
        <div key={i} style={{
          width: 32, height: 32, borderRadius: 10,
          background: C.bgElevated, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>{e}</div>
      ))}
    </div>

    {/* Message input */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px 12px',
    }}>
      <div style={{
        flex: 1, height: 38, borderRadius: 20,
        background: C.bgElevated, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', paddingLeft: 14, paddingRight: 14,
      }}>
        <span style={{ fontSize: 12, color: C.textDim, fontFamily: FONT }}>Напишите сообщение...</span>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: C.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="play" size={16} color="#fff" />
      </div>
    </div>
  </div>
);

// ─── SCREEN 4: PROFILE ────────────────────────────────────────────────────────
const navItems = [
  { icon: 'tv', label: 'История просмотров', sub: '47 фильмов' },
  { icon: 'star', label: 'Достижения', sub: '12 из 30' },
  { icon: 'people', label: 'Друзья', sub: '8 друзей' },
  { icon: 'settings', label: 'Настройки', sub: '' },
];

export const ProfileScreenUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgBase, fontFamily: FONT,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    {/* Top purple glow */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 160,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    <StatusBar />

    {/* Profile header */}
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 20px 16px', position: 'relative',
    }}>
      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `3px solid ${C.primary}50`,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: FONT }}>S</span>
        </div>
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 16, height: 16, borderRadius: '50%',
          background: C.success, border: `2px solid ${C.bgBase}`,
        }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, fontFamily: FONT, marginBottom: 3 }}>Saidazim</div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT, marginBottom: 12 }}>@forger • Ташкент</div>

      {/* Rank badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${C.primary}18`, border: `1px solid ${C.primary}40`,
        borderRadius: 20, padding: '4px 12px', marginBottom: 14,
      }}>
        <Icon name="star" size={12} color={C.primary} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, fontFamily: FONT }}>Gold · 2,840 баллов</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, width: '100%' }}>
        {[{ n: '47', l: 'Просмотров' }, { n: '12', l: 'Достижений' }, { n: '8', l: 'Друзей' }].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
            paddingTop: 8, paddingBottom: 8,
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, fontFamily: FONT }}>{s.n}</div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Divider */}
    <div style={{ height: 6, background: C.bgVoid }} />

    {/* Nav items */}
    <div style={{ flex: 1, paddingTop: 4, overflow: 'hidden' }}>
      {navItems.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 18px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.bgElevated,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={item.icon} size={18} color={C.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, fontFamily: FONT }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>{item.sub}</div>}
          </div>
          <Icon name="chevron-right" size={18} color={C.textDim} />
        </div>
      ))}
    </div>

    <TabBar active={3} />
  </div>
);

// ─── TABLET SIDEBAR ───────────────────────────────────────────────────────────
// Shared left sidebar for all tablet screens
const TabletSidebar: React.FC<{ active?: number }> = ({ active = 0 }) => {
  const navItems = [
    { icon: 'tv',     label: 'Главная' },
    { icon: 'search', label: 'Поиск' },
    { icon: 'people', label: 'Друзья' },
    { icon: 'person', label: 'Профиль' },
    { icon: 'settings', label: 'Настройки' },
  ];
  return (
    <div style={{
      width: 180, height: '100%', flexShrink: 0,
      background: C.bgVoid,
      borderRight: `1px solid rgba(255,255,255,0.05)`,
      display: 'flex', flexDirection: 'column',
      padding: '16px 12px',
    }}>
      <div style={{ marginBottom: 24 }}>
        <svg width={26} height={20} viewBox="0 0 52 40" fill="none">
          <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: FONT, marginLeft: 6 }}>
          we<span style={{ color: '#A78BFA' }}>Watch</span>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {navItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 10,
            background: i === active ? `${C.primary}18` : 'transparent',
            border: i === active ? `1px solid ${C.primary}30` : '1px solid transparent',
          }}>
            <Icon name={item.icon} size={16} color={i === active ? C.primary : C.textDim} />
            <span style={{
              fontSize: 12, fontWeight: i === active ? 700 : 400,
              color: i === active ? C.textPrimary : C.textMuted,
              fontFamily: FONT,
            }}>{item.label}</span>
          </div>
        ))}
      </div>
      {/* User chip at bottom */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', borderRadius: 10,
        background: C.bgElevated, border: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: FONT }}>S</span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>Saidazim</div>
          <div style={{ fontSize: 9, color: C.textMuted, fontFamily: FONT }}>@forger</div>
        </div>
      </div>
    </div>
  );
};

// ─── TABLET SCREEN 1: HOME (landscape) ───────────────────────────────────────
export const TabletHomeScreenUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgVoid, fontFamily: FONT,
    display: 'flex', overflow: 'hidden', position: 'relative',
  }}>
    {/* Top glow */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 100,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    }} />
    <TabletSidebar active={0} />
    {/* Main content */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, fontFamily: FONT }}>Главная</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>3 активные комнаты</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: C.bgElevated, borderRadius: 10, padding: '6px 12px',
            border: `1px solid ${C.border}`,
          }}>
            <Icon name="search" size={12} color={C.textDim} />
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: FONT }}>Поиск видео...</span>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: C.bgElevated, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <Icon name="bell" size={14} color={C.textPrimary} />
            <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: C.error, borderRadius: '50%' }} />
          </div>
        </div>
      </div>
      {/* CTA banner */}
      <div style={{
        margin: '10px 14px 8px',
        background: C.bgElevated, borderRadius: 12,
        border: `1px solid ${C.primary}40`,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${C.primary}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="people" size={18} color={C.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>Do'stlar bilan birga ko'ring</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>YouTube, VK, Rutube va boshqa manbalardan video tanlang</div>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 8,
          background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="play" size={12} color="#fff" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: FONT }}>Video tanlash</span>
        </div>
      </div>
      {/* Room grid — 3 columns */}
      <div style={{ flex: 1, padding: '0 14px', overflow: 'hidden' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1.2, fontFamily: FONT, marginBottom: 8 }}>АКТИВНЫЕ КОМНАТЫ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, height: 'calc(100% - 24px)' }}>
          {movies.map((m, i) => (
            <div key={i} style={{
              borderRadius: 10, overflow: 'hidden', position: 'relative',
              background: m.bg, border: `1px solid rgba(255,255,255,0.05)`,
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 30% 30%, ${m.color}20, transparent 50%)` }} />
              <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: `${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" size={14} color={m.color} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '16px 8px 8px' }}>
                {m.live && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#ef4444', borderRadius: 3, padding: '1px 4px', marginBottom: 3 }}>
                    <div style={{ width: 4, height: 4, background: '#fff', borderRadius: '50%' }} />
                    <span style={{ fontSize: 7, fontWeight: 800, color: '#fff', fontFamily: FONT }}>LIVE</span>
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT, lineHeight: 1.3 }}>{m.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Icon name="people" size={8} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontFamily: FONT }}>{m.members}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── TABLET SCREEN 2: WATCH PARTY (landscape) ────────────────────────────────
export const TabletWatchPartyUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: '#060608', fontFamily: FONT,
    display: 'flex', overflow: 'hidden',
  }}>
    <TabletSidebar active={0} />
    {/* Left — video + controls */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Video */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a2a3a 0%, #0d1a2e 50%, #1a1a2e 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(107,152,200,0.15) 0%, transparent 50%)' }} />
        {/* Live badge */}
        <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px' }}>
          <div style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: FONT }}>LIVE</span>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 12 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: FONT }}>Interstellar (2014)</span>
        </div>
        {/* Play */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(124,58,237,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={18} color="#fff" />
        </div>
        {/* Progress */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ width: '45%', height: '100%', background: C.primary }} />
        </div>
      </div>
      {/* Room info */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: C.bgBase, borderTop: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>Interstellar Watch Party</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>4 участника · Владелец: Alex</div>
        </div>
        {/* Emoji row */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['❤️','😂','🔥','😱','👏'].map((e, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: C.bgSurface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{e}</div>
          ))}
        </div>
      </div>
    </div>
    {/* Right — chat */}
    <div style={{
      width: 220, flexShrink: 0,
      background: C.bgVoid, borderLeft: `1px solid rgba(255,255,255,0.05)`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary, fontFamily: FONT }}>Чат комнаты</div>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: FONT }}>4 участника онлайн</div>
      </div>
      <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, flexDirection: msg.isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: msg.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{msg.user[0]}</span>
            </div>
            <div style={{
              maxWidth: '75%',
              background: msg.isMe ? `${C.primary}30` : C.bgElevated,
              border: `1px solid ${msg.isMe ? C.primary + '40' : C.border}`,
              borderRadius: msg.isMe ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
              padding: '5px 8px',
            }}>
              {!msg.isMe && <div style={{ fontSize: 8, fontWeight: 700, color: msg.avatar, fontFamily: FONT, marginBottom: 1 }}>{msg.user}</div>}
              <div style={{ fontSize: 10, color: C.textPrimary, fontFamily: FONT }}>{msg.text}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div style={{ padding: '8px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, height: 30, borderRadius: 15, background: C.bgElevated, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
          <span style={{ fontSize: 10, color: C.textDim, fontFamily: FONT }}>Сообщение...</span>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={13} color="#fff" />
        </div>
      </div>
    </div>
  </div>
);

// ─── TABLET SCREEN 3: PROFILE (landscape) ────────────────────────────────────
export const TabletProfileUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgVoid, fontFamily: FONT,
    display: 'flex', overflow: 'hidden', position: 'relative',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <TabletSidebar active={3} />
    {/* Left pane — profile info */}
    <div style={{
      width: 240, flexShrink: 0,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 16px',
    }}>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${C.primary}50` }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: FONT }}>S</span>
        </div>
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: '50%', background: C.success, border: `2px solid ${C.bgBase}` }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, fontFamily: FONT, marginBottom: 2 }}>Saidazim</div>
      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT, marginBottom: 10 }}>@forger • Ташкент</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${C.primary}18`, border: `1px solid ${C.primary}40`, borderRadius: 16, padding: '3px 10px', marginBottom: 14 }}>
        <Icon name="star" size={10} color={C.primary} />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, fontFamily: FONT }}>Gold · 2,840 pts</span>
      </div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, width: '100%', marginBottom: 16 }}>
        {[{ n: '47', l: 'Просмотров' }, { n: '12', l: 'Достиж.' }, { n: '8', l: 'Друзей' }].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.border}` : 'none', padding: '6px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, fontFamily: FONT }}>{s.n}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: FONT }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ width: '100%', height: 1, background: C.border, marginBottom: 12 }} />
      {navItems.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
          <Icon name={item.icon} size={15} color={C.primary} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: FONT, flex: 1 }}>{item.label}</span>
          <Icon name="chevron-right" size={13} color={C.textDim} />
        </div>
      ))}
    </div>
    {/* Right pane — watch history */}
    <div style={{ flex: 1, padding: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: FONT, marginBottom: 10 }}>История просмотров</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flex: 1, overflow: 'hidden' }}>
        {movies.map((m, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', background: m.bg, border: `1px solid rgba(255,255,255,0.05)` }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 30% 30%, ${m.color}20, transparent 50%)` }} />
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 26, height: 26, borderRadius: '50%', background: `${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={13} color={m.color} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '14px 7px 7px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: FONT, lineHeight: 1.3 }}>{m.title}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontFamily: FONT }}>{m.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── TABLET SCREEN 4: LOGIN (landscape) ──────────────────────────────────────
export const TabletLoginUI: React.FC = () => (
  <div style={{
    width: '100%', height: '100%',
    background: C.bgVoid, fontFamily: FONT,
    display: 'flex', overflow: 'hidden', position: 'relative',
  }}>
    {/* Grid bg */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
    {/* Left — branding */}
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '30px',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '60%', background: `radial-gradient(ellipse, ${C.primary}18 0%, transparent 65%)` }} />
      <svg width={60} height={46} viewBox="0 0 52 40" fill="none">
        <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontFamily: FONT, marginTop: 10 }}>
        we<span style={{ color: '#A78BFA' }}>Watch</span>
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT, textAlign: 'center', marginTop: 10, lineHeight: 1.5, maxWidth: 200 }}>
        Смотри фильмы вместе с друзьями в реальном времени
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {['🎬', '🍿', '👥'].map((e, i) => (
          <div key={i} style={{ width: 40, height: 40, borderRadius: 10, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{e}</div>
        ))}
      </div>
    </div>
    {/* Divider */}
    <div style={{ width: 1, background: C.border, alignSelf: 'stretch', margin: '20px 0' }} />
    {/* Right — login form */}
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 32px',
    }}>
      <div style={{ width: '100%', maxWidth: 280 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, fontFamily: FONT, marginBottom: 4 }}>Добро пожаловать</div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT, marginBottom: 20 }}>Войдите в аккаунт чтобы продолжить</div>
        {/* Email */}
        <div style={{ width: '100%', height: 42, borderRadius: 12, marginBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 8 }}>
          <Icon name="mail" size={13} color={C.textDim} />
          <span style={{ fontSize: 12, color: C.textDim, fontFamily: FONT }}>Email</span>
        </div>
        {/* Password */}
        <div style={{ width: '100%', height: 42, borderRadius: 12, marginBottom: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={13} color={C.textDim} />
            <span style={{ fontSize: 12, color: C.textDim, fontFamily: FONT }}>Пароль</span>
          </div>
          <Icon name="eye" size={13} color={C.textDim} />
        </div>
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT }}>Забыли пароль?</span>
        </div>
        <div style={{ width: '100%', height: 42, borderRadius: 12, marginBottom: 16, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FONT }}>Войти</span>
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 10, color: C.textDim, fontFamily: FONT }}>или войти через</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Google', color: C.textSec, bg: C.bgElevated, border: C.borderStrong },
            { label: 'Telegram', color: C.telegramBlue, bg: `${C.telegramBlue}15`, border: `${C.telegramBlue}30` },
          ].map((b, i) => (
            <div key={i} style={{ flex: 1, height: 38, borderRadius: 10, background: b.bg, border: `1px solid ${b.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: b.color, fontFamily: FONT }}>{b.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 14 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT }}>Нет аккаунта?</span>
          <span style={{ fontSize: 11, color: C.link, fontWeight: 700, fontFamily: FONT }}>Зарегистрируйтесь</span>
        </div>
      </div>
    </div>
  </div>
);
