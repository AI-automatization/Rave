import React from 'react';
import { AbsoluteFill } from 'remotion';

// ─── Data ──────────────────────────────────────────────────────────────────
export const ROBUX_PACKAGES = [
  { rb: 40,    price: 10000 },
  { rb: 80,    price: 18000 },
  { rb: 120,   price: 26000 },
  { rb: 160,   price: 36000 },
  { rb: 200,   price: 45000 },
  { rb: 240,   price: 54000 },
  { rb: 320,   price: 72000 },
  { rb: 400,   price: 70000 },
  { rb: 500,   price: 85000 },
  { rb: 660,   price: 120000 },
  { rb: 800,   price: 140000 },
  { rb: 1000,  price: 165000 },
  { rb: 1240,  price: 215000 },
  { rb: 1500,  price: 250000 },
  { rb: 1700,  price: 275000 },
  { rb: 2000,  price: 310000 },
  { rb: 3000,  price: 475000 },
  { rb: 4500,  price: 660000 },
  { rb: 5250,  price: 710000 },
  { rb: 10000, price: 1320000 },
  { rb: 11000, price: 1400000 },
  { rb: 22500, price: 2600000 },
  { rb: 24000, price: 2750000 },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('ru-RU');
}

// ─── Sky background ────────────────────────────────────────────────────────
function SkyBg() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      viewBox="0 0 1080 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a6fd4" />
          <stop offset="40%"  stopColor="#2e8ce0" />
          <stop offset="80%"  stopColor="#56b6f0" />
          <stop offset="100%" stopColor="#7bcff5" />
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#e8c87a" />
          <stop offset="100%" stopColor="#d4a94c" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a8fcc" />
          <stop offset="100%" stopColor="#0d6aa0" />
        </linearGradient>
        <radialGradient id="sun" cx="0.78" cy="0.12" r="0.18">
          <stop offset="0%"  stopColor="#fff9a0" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffe566" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffb800" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="1080" height="1080" fill="url(#sky)" />

      {/* Sun glow */}
      <rect width="1080" height="1080" fill="url(#sun)" />
      <circle cx="840" cy="130" r="72" fill="#fff8a0" opacity="0.92" filter="url(#glow)" />
      <circle cx="840" cy="130" r="50" fill="#fffde0" />

      {/* Clouds */}
      <g opacity="0.82" fill="#fff">
        <ellipse cx="160" cy="110" rx="110" ry="38" />
        <ellipse cx="110" cy="120" rx="70" ry="32" />
        <ellipse cx="210" cy="118" rx="75" ry="30" />

        <ellipse cx="600" cy="70" rx="90" ry="30" />
        <ellipse cx="550" cy="78" rx="60" ry="26" />
        <ellipse cx="645" cy="76" rx="62" ry="25" />
      </g>

      {/* Sea strip */}
      <rect x="0" y="740" width="1080" height="160" fill="url(#sea)" opacity="0.88" />
      {/* Sea shimmer */}
      <g opacity="0.22" stroke="#fff" strokeWidth="2.5">
        {[760, 790, 820, 850, 875].map((y, i) => (
          <path key={i} d={`M ${60 + i*40} ${y} Q ${200 + i*50} ${y - 8} ${340 + i*40} ${y}`} fill="none" />
        ))}
        {[768, 800, 830, 858].map((y, i) => (
          <path key={`b${i}`} d={`M ${400} ${y} Q ${560 + i*30} ${y - 6} ${720 + i*20} ${y}`} fill="none" />
        ))}
      </g>

      {/* Sand bottom */}
      <path d="M0 880 Q 270 840 540 870 Q 810 900 1080 860 L1080 1080 L0 1080 Z" fill="url(#sand)" />
      {/* Sand texture dots */}
      <g fill="#c89a3a" opacity="0.18">
        {[...Array(30)].map((_, i) => (
          <circle key={i} cx={50 + (i * 37) % 980} cy={920 + (i * 23) % 120} r={3 + (i % 4)} />
        ))}
      </g>

      {/* Left palm tree */}
      <g transform="translate(-10, 360)">
        {/* trunk */}
        <path d="M 80 760 Q 95 640 115 500 Q 125 400 145 310" stroke="#7a5c2c" strokeWidth="22" fill="none" strokeLinecap="round" />
        {/* leaves */}
        <g fill="#2d8a40" stroke="#1f6b2e" strokeWidth="1.5">
          <path d="M 145 310 Q 30 270 -20 220 Q 10 265 145 310" />
          <path d="M 145 310 Q 80 230 100 160 Q 120 240 145 310" />
          <path d="M 145 310 Q 200 240 280 250 Q 210 270 145 310" />
          <path d="M 145 310 Q 220 280 300 310 Q 230 300 145 310" />
          <path d="M 145 310 Q 140 230 180 170 Q 155 240 145 310" />
        </g>
        {/* coconuts */}
        <circle cx="145" cy="320" r="14" fill="#6b4a1c" />
        <circle cx="158" cy="332" r="12" fill="#7a5420" />
        <circle cx="133" cy="335" r="11" fill="#6b4a1c" />
      </g>

      {/* Right palm tree */}
      <g transform="translate(870, 340)">
        <path d="M 100 740 Q 88 610 72 480 Q 60 380 44 295" stroke="#7a5c2c" strokeWidth="20" fill="none" strokeLinecap="round" />
        <g fill="#2d8a40" stroke="#1f6b2e" strokeWidth="1.5">
          <path d="M 44 295 Q 160 260 210 200 Q 175 255 44 295" />
          <path d="M 44 295 Q 110 220 95 145 Q 72 225 44 295" />
          <path d="M 44 295 Q -40 255 -120 270 Q -50 275 44 295" />
          <path d="M 44 295 Q -20 285 -90 315 Q -20 305 44 295" />
          <path d="M 44 295 Q 50 218 18 155 Q 38 235 44 295" />
        </g>
        <circle cx="44" cy="304" r="13" fill="#6b4a1c" />
        <circle cx="56" cy="315" r="11" fill="#7a5420" />
        <circle cx="33" cy="318" r="10" fill="#6b4a1c" />
      </g>

      {/* Treasure chest (bottom right) */}
      <g transform="translate(820, 870)">
        <rect x="0" y="20" width="140" height="90" rx="8" fill="#8B4513" stroke="#5a2c00" strokeWidth="3" />
        <rect x="0" y="20" width="140" height="42" rx="8" fill="#A0522D" stroke="#5a2c00" strokeWidth="3" />
        <rect x="50" y="38" width="40" height="28" rx="6" fill="#DAA520" stroke="#B8860B" strokeWidth="2" />
        <rect x="60" y="48" width="20" height="12" rx="3" fill="#FFD700" />
        {/* Gold coins spilling */}
        <circle cx="20"  cy="110" r="12" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
        <circle cx="45"  cy="115" r="10" fill="#FFC107" stroke="#DAA520" strokeWidth="2" />
        <circle cx="0"   cy="120" r="9"  fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
        <circle cx="150" cy="112" r="11" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
        <circle cx="165" cy="120" r="9"  fill="#FFC107" stroke="#DAA520" strokeWidth="2" />
      </g>

      {/* Beach ball */}
      <g transform="translate(45, 880)">
        <circle cx="55" cy="55" r="50" fill="#e74c3c" stroke="#fff" strokeWidth="3" />
        <path d="M 55 5 Q 90 55 55 105" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M 55 5 Q 20 55 55 105" stroke="#fff" strokeWidth="3" fill="none" />
        <ellipse cx="55" cy="55" rx="50" ry="12" stroke="#fff" strokeWidth="3" fill="none" />
      </g>

      {/* Subtle vignette */}
      <radialGradient id="vig" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="100%" stopColor="rgba(0,30,80,0.35)" />
      </radialGradient>
      <rect width="1080" height="1080" fill="url(#vig)" />
    </svg>
  );
}

// ─── Roblox logo mark (tilted square) ──────────────────────────────────────
function RobloxMark({ size = 220 }: { size?: number }) {
  const s = size;
  return (
    <div style={{
      width: s, height: s,
      background: '#111',
      borderRadius: s * 0.18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 ${s * 0.06}px ${s * 0.18}px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.08)`,
      flexShrink: 0,
    }}>
      <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 100 100">
        {/* Roblox icon: rotated square with inner square */}
        <rect x="15" y="15" width="70" height="70" rx="6"
          fill="#fff"
          transform="rotate(0 50 50)"
        />
        <rect x="34" y="34" width="32" height="32" rx="4"
          fill="#111"
          transform="rotate(0 50 50)"
        />
      </svg>
    </div>
  );
}

// ─── Robux coin ─────────────────────────────────────────────────────────────
function RobuxCoin({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFE066" />
          <stop offset="50%"  stopColor="#FFB800" />
          <stop offset="100%" stopColor="#CC8800" />
        </linearGradient>
        <linearGradient id="coinInner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#FFD740" />
          <stop offset="100%" stopColor="#B87B00" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <polygon points="50,4 96,28 96,72 50,96 4,72 4,28" fill="url(#coinGrad)" />
      <polygon points="50,12 88,32 88,68 50,88 12,68 12,32" fill="url(#coinInner)" />
      {/* Inner Robux mark */}
      <rect x="34" y="34" width="32" height="32" rx="3" fill="#7a4f00" />
      <rect x="42" y="42" width="16" height="16" rx="2" fill="#FFD740" />
    </svg>
  );
}

// ─── Main card component ────────────────────────────────────────────────────
interface RobloxCardProps {
  rb: number;
  price: number;
}

export const RobloxCard: React.FC<RobloxCardProps> = ({ rb, price }) => {
  const isLarge = rb >= 10000;

  return (
    <AbsoluteFill style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", overflow: 'hidden' }}>
      {/* Background */}
      <SkyBg />

      {/* === TOP: ROBLOX title === */}
      <div style={{
        position: 'absolute',
        top: 36,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 130,
          fontWeight: 900,
          letterSpacing: -2,
          color: '#fff',
          textShadow: [
            '0 6px 0 #0a4fa0',
            '0 10px 0 #093e80',
            '0 14px 30px rgba(0,0,0,0.5)',
            '-4px 0 0 rgba(0,0,0,0.2)',
            '4px 0 0 rgba(0,0,0,0.2)',
          ].join(', '),
          WebkitTextStroke: '3px rgba(0,50,120,0.4)',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          R<span style={{ color: '#fff', display: 'inline-block' }}>O</span>BL<span style={{ display: 'inline-block' }}>O</span>X
        </div>
      </div>

      {/* === TOP RIGHT: badge "БЫСТРО ВЫГОДНО НАДЁЖНО" === */}
      <div style={{
        position: 'absolute',
        top: 44,
        right: 44,
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        borderRadius: 16,
        padding: '14px 22px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
        border: '2px solid rgba(255,255,255,0.5)',
        transform: 'rotate(3deg)',
      }}>
        {['БЫСТРО', 'ВЫГОДНО', 'НАДЁЖНО'].map(word => (
          <div key={word} style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#1a0000',
            lineHeight: 1.25,
            letterSpacing: 1,
            textAlign: 'center',
          }}>{word}</div>
        ))}
      </div>

      {/* === CENTER: Roblox logo mark === */}
      <div style={{
        position: 'absolute',
        top: 200,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <RobloxMark size={260} />
      </div>

      {/* === AMOUNT BADGE === */}
      <div style={{
        position: 'absolute',
        bottom: 270,
        left: 50,
        right: 50,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.82), rgba(20,20,40,0.88))',
        borderRadius: 24,
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        boxShadow: '0 6px 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,215,0,0.3)',
        border: '2px solid rgba(255,215,0,0.35)',
      }}>
        <RobuxCoin size={72} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: isLarge ? 88 : 104,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 3px 12px rgba(0,0,0,0.5)',
            letterSpacing: -2,
          }}>
            {fmt(rb)}
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            color: '#FFD700',
            letterSpacing: 3,
            marginTop: 2,
          }}>
            РОБУКСОВ
          </div>
        </div>
        {/* Price tag */}
        <div style={{
          background: 'linear-gradient(135deg, #FF4757, #C0392B)',
          borderRadius: 16,
          padding: '10px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(255,0,0,0.4)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>ЦЕНА</div>
          <div style={{ fontSize: 30, color: '#fff', fontWeight: 900, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {fmt(price)}
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>СУМ</div>
        </div>
      </div>

      {/* === BOTTOM BADGES === */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: 40,
        right: 40,
        display: 'flex',
        gap: 16,
        justifyContent: 'space-between',
      }}>
        {[
          { icon: '⚡', label: 'МОМЕНТАЛЬНАЯ', sub: 'ДОСТАВКА' },
          { icon: '🛡', label: 'БЕЗОПАСНАЯ',   sub: 'ПОКУПКА' },
          { icon: '⭐', label: 'ЛУЧШЕЕ',        sub: 'ПРЕДЛОЖЕНИЕ' },
        ].map(({ icon, label, sub }) => (
          <div key={label} style={{
            flex: 1,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 18,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            border: '1.5px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ fontSize: 34 }}>{icon}</div>
            <div style={{
              fontSize: 19,
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: 0.5,
            }}>
              {label}<br />{sub}
            </div>
          </div>
        ))}
      </div>

      {/* Contact watermark */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        right: 50,
        fontSize: 22,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 700,
        letterSpacing: 1,
      }}>
        @Nyx1011
      </div>
    </AbsoluteFill>
  );
};
