import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo } from '../components/Logo';

const FONT = 'system-ui, -apple-system, sans-serif';

// ─── Base — shared purple layout ─────────────────────────────────────────────
const Base: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <AbsoluteFill style={{ background: '#0e0020', fontFamily: FONT, overflow: 'hidden' }}>
    {/* Top color block */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '62%',
      background: 'linear-gradient(135deg, #3b0764 0%, #1e0852 100%)',
    }} />
    {/* Diagonal cut */}
    <div style={{
      position: 'absolute', top: '58%', left: 0, right: 0, height: 120,
      background: 'linear-gradient(135deg, #3b0764 0%, #1e0852 50%, transparent 51%)',
    }} />
    {/* Logo */}
    <div style={{ position: 'absolute', top: 56, left: 56 }}><Logo size={42} /></div>
    {/* Counter */}
    <div style={{ position: 'absolute', top: 68, right: 56, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>{n} / 5</div>
    {/* Footer */}
    <div style={{
      position: 'absolute', bottom: 44, left: 56, right: 56,
      display: 'flex', justifyContent: 'space-between',
      fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.15)',
    }}>
      <span>wewatch.uz</span>
      {n < 5 && <span>swipe →</span>}
    </div>
    {children}
  </AbsoluteFill>
);

const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    padding: '10px 24px', borderRadius: 100, display: 'inline-flex', marginBottom: 28,
    background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)',
    fontSize: 22, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.09em',
  }}>{text}</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Hook
// ═══════════════════════════════════════════════════════════════════════════════
export const TK1Cover: React.FC = () => (
  <Base n={1}>
    <div style={{ position: 'absolute', top: 148, left: 56 }}><Pill text="✦ TEZ KUNDA ✦" /></div>
    <div style={{ position: 'absolute', top: 220, left: 56, right: 56, fontSize: 148, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
      <div style={{ color: '#fff' }}>Do'sting</div>
      <div style={{ color: '#A78BFA' }}>boshqa</div>
      <div style={{ color: '#fff' }}>shaharda?</div>
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 56, right: 56 }}>
      <div style={{ width: 60, height: 4, background: '#7C3AED', borderRadius: 2, marginBottom: 20 }} />
      <div style={{ fontSize: 40, fontWeight: 500, color: 'rgba(255,255,255,0.48)', lineHeight: 1.4 }}>
        Birga kino ko'rish mumkin.
      </div>
    </div>
  </Base>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Problem
// ═══════════════════════════════════════════════════════════════════════════════
export const TK2Problem: React.FC = () => (
  <Base n={2}>
    <div style={{ position: 'absolute', top: 148, left: 56 }}><Pill text="MUAMMO" /></div>
    <div style={{ position: 'absolute', top: 230, left: 56, right: 56, fontSize: 118, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em' }}>
      <div style={{ color: '#fff' }}>Filmni</div>
      <div style={{ color: '#A78BFA' }}>yolg'iz</div>
      <div style={{ color: '#fff' }}>ko'ryapsanmi?</div>
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 56, right: 56, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {["Do'sting boshqa shaharda", 'Videocall da sifat past', 'Vaqtlar mos kelmaydi'].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#A78BFA', flexShrink: 0 }} />
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{t}</div>
        </div>
      ))}
    </div>
  </Base>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Solution
// ═══════════════════════════════════════════════════════════════════════════════
export const TK3Solution: React.FC = () => (
  <Base n={3}>
    {/* Big W watermark */}
    <div style={{
      position: 'absolute', fontSize: 580, fontWeight: 900, color: 'rgba(124,58,237,0.08)',
      top: '30%', left: '50%', transform: 'translate(-50%, -50%)', lineHeight: 1, letterSpacing: '-0.05em',
    }}>W</div>
    <div style={{ position: 'absolute', top: 148, left: 56 }}><Pill text="YECHIM" /></div>
    <div style={{ position: 'absolute', top: 228, left: 56, right: 56, fontSize: 148, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
      <div style={{ color: '#fff' }}>Biz —</div>
      <div style={{ color: '#A78BFA', textShadow: '0 0 32px rgba(167,139,250,0.4)' }}>WeWatch.</div>
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 56, right: 56 }}>
      <div style={{ width: 60, height: 4, background: '#7C3AED', borderRadius: 2, marginBottom: 20 }} />
      <div style={{ fontSize: 38, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
        Do'stlar bilan birga tomosha.{'\n'}Bir vaqtda. Istalgan joydan.
      </div>
    </div>
  </Base>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Features
// ═══════════════════════════════════════════════════════════════════════════════
const feats = [
  { icon: '🎬', title: 'WatchParty',      desc: "Xona yarating, do'stlarni taklif qiling" },
  { icon: '🔄', title: 'Sinxronizatsiya', desc: 'Kadr aniqligida birga tomosha'            },
  { icon: '💬', title: 'Chat',            desc: 'Real vaqtda reaksiyalar'                  },
  { icon: '🎥', title: "Ko'p manba",      desc: 'YouTube, VK, Rutube va boshqalar'         },
];

export const TK4Features: React.FC = () => (
  <Base n={4}>
    <div style={{ position: 'absolute', top: 148, left: 56 }}><Pill text="IMKONIYATLAR" /></div>
    <div style={{ position: 'absolute', top: 228, left: 56, right: 56 }}>
      <span style={{ fontSize: 110, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>4 ta </span>
      <span style={{ fontSize: 110, fontWeight: 900, color: '#A78BFA', letterSpacing: '-0.04em' }}>kuch.</span>
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 56, right: 56, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {feats.map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '18px 22px', borderRadius: 16,
          background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(167,139,250,0.2)',
        }}>
          <div style={{
            width: 54, height: 54, flexShrink: 0, borderRadius: 12, fontSize: 26,
            background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{f.icon}</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#C4B5FD' }}>{f.title}</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </Base>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — CTA
// ═══════════════════════════════════════════════════════════════════════════════
export const TK5CTA: React.FC = () => (
  <Base n={5}>
    <div style={{ position: 'absolute', top: 148, left: 56 }}><Pill text="BIRINCHI BO'L" /></div>
    <div style={{ position: 'absolute', top: 228, left: 56, right: 56, fontSize: 136, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
      <div style={{ color: '#fff' }}>Birinchilar</div>
      <div style={{ color: '#A78BFA' }}>qatorida</div>
      <div style={{ color: '#fff' }}>bo'l.</div>
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 56, right: 56 }}>
      <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.38)', marginBottom: 28, lineHeight: 1.5 }}>
        Tez kunda ishga tushadi.{'\n'}Hoziroq ro'yxatdan o't.
      </div>
      <div style={{
        padding: '22px 0', borderRadius: 100, textAlign: 'center',
        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
        fontSize: 40, fontWeight: 800, color: '#fff',
        boxShadow: '0 6px 40px rgba(124,58,237,0.45)',
      }}>wewatch.uz</div>
    </div>
  </Base>
);
