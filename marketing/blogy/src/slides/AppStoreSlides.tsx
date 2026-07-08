import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const W = 1080;
const H = 1920;

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
const PhoneMockup: React.FC<{ src: string; scale?: number; top?: number; right?: number }> = ({
  src, scale = 1, top = 520, right = -40,
}) => (
  <div style={{
    position: 'absolute',
    top,
    right,
    width: 420 * scale,
    height: 856 * scale,
    borderRadius: 52 * scale,
    background: '#111',
    border: `3px solid rgba(255,255,255,0.12)`,
    boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }}>
    {/* Notch */}
    <div style={{
      position: 'absolute', top: 12 * scale, left: '50%', transform: 'translateX(-50%)',
      width: 110 * scale, height: 28 * scale,
      background: '#000', borderRadius: 20 * scale, zIndex: 10,
    }} />
    <img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────
const Logo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <svg width={52} height={40} viewBox="0 0 52 40" fill="none">
      <path d="M2 4L14 36L26 10L38 36L50 4" stroke="#A78BFA" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
      we<span style={{ color: '#A78BFA' }}>Watch</span>
    </span>
  </div>
);

// ─── Pill ─────────────────────────────────────────────────────────────────────
const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '14px 32px', borderRadius: 100,
    background: 'rgba(167,139,250,0.15)', border: '1.5px solid rgba(167,139,250,0.4)',
    fontSize: 26, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.08em',
    marginBottom: 36,
  }}>{text}</div>
);

// ─── Background ──────────────────────────────────────────────────────────────
const Bg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{
    background: 'radial-gradient(ellipse at 20% 10%, #1e0b3e 0%, #0d0720 55%, #040310 100%)',
    fontFamily: FONT,
    width: W,
    height: H,
    overflow: 'hidden',
  }}>
    {/* Glow orb */}
    <div style={{
      position: 'absolute', top: -200, left: -200,
      width: 800, height: 800, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
    }} />
    <div style={{
      position: 'absolute', bottom: 100, right: -150,
      width: 600, height: 600, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
    }} />
    {children}
  </AbsoluteFill>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Hero
// ═══════════════════════════════════════════════════════════════════════════════
export const AS1Hero: React.FC = () => (
  <Bg>
    {/* Top logo */}
    <div style={{ position: 'absolute', top: 100, left: 80 }}><Logo /></div>

    {/* Big W watermark */}
    <div style={{
      position: 'absolute', fontSize: 900, fontWeight: 900,
      color: 'rgba(124,58,237,0.05)', top: 200, left: -80,
      lineHeight: 1, letterSpacing: '-0.06em', userSelect: 'none',
    }}>W</div>

    {/* Headline */}
    <div style={{ position: 'absolute', top: 260, left: 80, right: 80 }}>
      <div style={{ fontSize: 108, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
        Do'stlar<br />
        <span style={{ color: '#A78BFA' }}>bilan</span><br />
        birga<br />
        tomosha.
      </div>
    </div>

    {/* Subtext */}
    <div style={{ position: 'absolute', top: 750, left: 80, right: 80 }}>
      <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontWeight: 500 }}>
        YouTube, VK, Rutube va boshqa manbalar.{'\n'}Real vaqtda, sinxron.
      </div>
    </div>

    {/* Phone mockup — home screen */}
    <PhoneMockup src="screen-home.jpg" scale={1.05} top={900} right={-30} />

    {/* Bottom */}
    <div style={{
      position: 'absolute', bottom: 70, left: 80, right: 80,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>wewatch.uz</div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }}>by tezcode.dev</div>
    </div>
  </Bg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Rooms / Browse
// ═══════════════════════════════════════════════════════════════════════════════
export const AS2Rooms: React.FC = () => (
  <Bg>
    <div style={{ position: 'absolute', top: 100, left: 80 }}><Logo /></div>

    {/* Left content */}
    <div style={{ position: 'absolute', top: 240, left: 80, right: 460 }}>
      <Pill text="🎬 KOMNATALAR" />
      <div style={{ fontSize: 110, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
        Aktiv<br />
        <span style={{ color: '#A78BFA' }}>komnata</span><br />
        qo'shil.
      </div>
      <div style={{ marginTop: 48, fontSize: 34, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        Interstellar, Harry Potter,<br />LOTR — hozir kimdir tomosha qilyapti
      </div>

      {/* Stats pills */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { icon: '👥', text: 'Har komnatada 2–10 kishi' },
          { icon: '🔴', text: 'LIVE — real vaqtda sinxron' },
          { icon: '🌐', text: 'Ochiq yoki yopiq xona' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 24px', borderRadius: 18,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(167,139,250,0.18)',
          }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Phone */}
    <PhoneMockup src="screen-home.jpg" scale={0.95} top={480} right={-20} />

    <div style={{ position: 'absolute', bottom: 70, left: 80, fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>wewatch.uz</div>
  </Bg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Live Chat
// ═══════════════════════════════════════════════════════════════════════════════
export const AS3Chat: React.FC = () => (
  <Bg>
    <div style={{ position: 'absolute', top: 100, left: 80 }}><Logo /></div>

    <div style={{ position: 'absolute', top: 240, left: 80, right: 460 }}>
      <Pill text="💬 CHAT" />
      <div style={{ fontSize: 110, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
        Birga<br />
        <span style={{ color: '#A78BFA' }}>his</span><br />
        eting.
      </div>
      <div style={{ marginTop: 48, fontSize: 34, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        Real vaqtda xabar, emoji reaksiyalar va ovozli chat
      </div>

      {/* Chat preview bubbles */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { user: 'alex_rave', msg: 'OMG this scene is insane 😱', color: '#6EE7B7' },
          { user: 'mila_k',   msg: 'первый раз смотрю и плачу 😭', color: '#C4B5FD' },
          { user: 'superadmin', msg: 'кстати топ-5 нолана 🔥',    color: '#FCA5A5' },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${b.color}44, ${b.color}22)`,
              border: `2px solid ${b.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: b.color,
            }}>{b.user[0].toUpperCase()}</div>
            <div style={{
              padding: '12px 18px', borderRadius: 16, borderTopLeftRadius: 4,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: 280,
            }}>
              <div style={{ fontSize: 18, color: b.color, fontWeight: 700, marginBottom: 4 }}>{b.user}</div>
              <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.75)' }}>{b.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Phone */}
    <PhoneMockup src="screen-chat.jpg" scale={0.95} top={480} right={-20} />

    <div style={{ position: 'absolute', bottom: 70, left: 80, fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>wewatch.uz</div>
  </Bg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Easy Login
// ═══════════════════════════════════════════════════════════════════════════════
export const AS4Login: React.FC = () => (
  <Bg>
    <div style={{ position: 'absolute', top: 100, left: 80 }}><Logo /></div>

    <div style={{ position: 'absolute', top: 240, left: 80, right: 460 }}>
      <Pill text="⚡ OSON KIRISH" />
      <div style={{ fontSize: 106, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.03em' }}>
        Bir<br />
        <span style={{ color: '#A78BFA' }}>bosimda</span><br />
        boshlang.
      </div>
      <div style={{ marginTop: 48, fontSize: 34, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        Ro'yxatdan o'tishsiz — Google, Apple yoki Telegram orqali
      </div>

      {/* Auth options */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { icon: 'G', label: 'Google orqali', color: '#4285F4' },
          { icon: '⌘', label: 'Apple orqali',  color: '#fff'    },
          { icon: '✈', label: 'Telegram orqali', color: '#26A5E4' },
        ].map((opt, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '18px 28px', borderRadius: 20,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${opt.color}22`, border: `1.5px solid ${opt.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: opt.color,
            }}>{opt.icon}</div>
            <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{opt.label}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Phone */}
    <PhoneMockup src="screen-login.jpg" scale={0.95} top={480} right={-20} />

    <div style={{ position: 'absolute', bottom: 70, left: 80, fontSize: 28, fontWeight: 700, color: 'rgba(167,139,250,0.6)' }}>wewatch.uz</div>
  </Bg>
);
