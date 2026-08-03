import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring } from 'remotion';
import { StatusBar } from './AppScreens';

// Hand-recreated WatchParty screen — not a screenshot. Colors/spacing/structure lifted directly
// from the real RN source (apps/mobile/src/components/watchParty/*.tsx and their .styles.ts,
// checked live against the files during T-S189 follow-up work, not from memory):
//   RoomInfoBar.tsx        — header bar, live dot, meta row, action buttons
//   VideoSection.tsx/.styles.ts — video area, gradients, center play button, badges
//   EmojiFloat.tsx          — quick-react pill bar (post spacing fix: gap 6, not the old gap 2)
//   VoiceStrip.tsx          — voice card, avatar row, join button (colors.primary = #7C3AED)
//   ChatPanel.styles.ts     — message bubbles (#7B72F8 mine / #1C1C2E other), input row
const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const ease = (frame: number, from: number, to: number, delay = 0, duration = 20) =>
  interpolate(frame, [delay, delay + duration], [from, to], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });

// ─── Icons not already covered by AppScreens' Icon set ───────────────────────
const MicIcon: React.FC<{ size?: number; color?: string; muted?: boolean }> = ({ size = 18, color = '#fff', muted }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" fill={color} />
    <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" fill={color} />
    {muted && <path d="M3 3L21 21" stroke="#F87171" strokeWidth={2.4} strokeLinecap="round" />}
  </svg>
);
const AddPersonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 17, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="4" fill={color} />
    <path d="M2 21c0-3.87 3.13-6 7-6s7 2.13 7 6" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M19 8v6M16 11h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);
const ExitIcon: React.FC<{ size?: number; color?: string }> = ({ size = 17, color = '#F87171' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const ChatBubbleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 17, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16v12H8l-4 4V4z" stroke={color} strokeWidth={2} strokeLinejoin="round" fill="none" />
  </svg>
);
const PlayIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
);
const StarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 10, color = '#FFD700' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
);
const PeopleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 11, color = 'rgba(255,255,255,0.35)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
);

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '😢', '🎉', '👍', '💯', '🍿'];
const VOICE_AVATARS = [
  { initial: 'B', color: '#7B72F8', speaking: true },
  { initial: 'S', color: '#34D399', speaking: false },
  { initial: 'K', color: '#F472B6', speaking: false },
];

export const WatchPartyMockReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Mount-in stagger for the whole stack — each section springs up + fades in.
  const s1 = spring({ frame, fps, config: { damping: 24, mass: 0.85 }, delay: 2 });
  const s2 = spring({ frame, fps, config: { damping: 24, mass: 0.85 }, delay: 8 });
  const s3 = spring({ frame, fps, config: { damping: 24, mass: 0.85 }, delay: 14 });
  const s4 = spring({ frame, fps, config: { damping: 24, mass: 0.85 }, delay: 20 });
  const s5 = spring({ frame, fps, config: { damping: 24, mass: 0.85 }, delay: 26 });

  const livePulse = 0.4 + Math.sin(frame * 0.15) * 0.3;
  const speakingPulse = 1 + Math.sin(frame * 0.25) * 0.06;

  // Play/pause toggles once mid-clip, purely cosmetic (this is a mock, not a real player).
  const isPlaying = frame > durationInFrames * 0.55;
  const progressPct = ease(frame, 12, 78, 0, durationInFrames);

  // Emoji float — one drifts up from the reaction bar every ~26 frames, looping.
  const EMOJI_CYCLE = ['🔥', '❤️', '😂', '🎉'];
  const emojiFloats = EMOJI_CYCLE.map((emoji, i) => {
    const start = 40 + i * 26;
    const local = frame - start;
    if (local < 0 || local > 55) return null;
    const y = interpolate(local, [0, 55], [0, -160], { extrapolateRight: 'clamp' });
    const opacity = interpolate(local, [0, 8, 40, 55], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
    const x = 40 + i * 55 + Math.sin(local * 0.2) * 10;
    return { emoji, x, y, opacity, key: `${emoji}-${start}` };
  }).filter(Boolean) as { emoji: string; x: number; y: number; opacity: number; key: string }[];

  // Second chat bubble slides in partway through.
  const bubble2In = ease(frame, 40, 0, 95, 18);
  const bubble2Opacity = ease(frame, 0, 1, 95, 18);

  return (
    <AbsoluteFill style={{ background: '#0A0A0F', fontFamily: FONT, overflow: 'hidden' }}>
      <StatusBar />

      {/* ── RoomInfoBar — bg #0F0F1C, real padding (13/16, gap 14) post spacing-fix ── */}
      <div style={{
        opacity: s1, transform: `translateY(${(1 - s1) * -14}px)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', gap: 14, minHeight: 60,
        background: '#0F0F1C', borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(74,222,128,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: 2.5, background: '#4ADE80', opacity: livePulse }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210 }}>
              Interstellar Watch Party
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <PeopleIcon />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>4 ishtirokchi</span>
              <div style={{ width: 2, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.18)', margin: '0 2px' }} />
              <StarIcon />
              <span style={{ fontSize: 11, color: '#FFD700', fontWeight: 600 }}>Xo'jayin</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {[<AddPersonIcon key="a" />, <ChatBubbleIcon key="c" />, <MicIcon key="m" color="#4ADE80" />].map((icon, i) => (
            <div key={i} style={{
              width: 38, height: 38, borderRadius: 19,
              background: i === 2 ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}>
              {icon}
              {i === 1 && <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 3.5, background: '#7B72F8', border: '1.5px solid #0F0F1C' }} />}
            </div>
          ))}
          <div style={{ width: 38, height: 38, borderRadius: 19, background: 'rgba(248,113,113,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
            <ExitIcon />
          </div>
        </div>
      </div>

      {/* ── Video area — 16:9, gradients, center play control, live/sync badges ── */}
      <div style={{
        opacity: s2, transform: `translateY(${(1 - s2) * -14}px)`,
        width: '100%', aspectRatio: '16/9', position: 'relative',
        background: 'linear-gradient(135deg, #1a2a3a 0%, #0d1a2e 50%, #1a1a2e 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(107,152,200,0.18) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, background: 'rgba(0,0,0,0.48)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: 'rgba(0,0,0,0.55)' }} />

        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.52)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4ADE80' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#4ADE80', letterSpacing: 1.2 }}>LIVE</span>
        </div>
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.48)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(123,114,248,0.22)' }}>
          <div style={{ width: 5, height: 5, borderRadius: 2.5, background: '#7B72F8' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#7B72F8', letterSpacing: 1.2 }}>P2P</span>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32, background: '#7B72F8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(123,114,248,0.55)', border: '2px solid rgba(255,255,255,0.15)',
          }}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: '#7B72F8' }} />
        </div>
      </div>

      {/* ── Quick emoji reaction pill — gap 6, post spacing-fix (was 2) ── */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: 14, opacity: s3, transform: `translateY(${(1 - s3) * -10}px)` }}>
        {emojiFloats.map((f) => (
          <span key={f.key} style={{ position: 'absolute', bottom: 40, left: f.x, fontSize: 26, opacity: f.opacity, transform: `translateY(${f.y}px)` }}>
            {f.emoji}
          </span>
        ))}
        <div style={{ display: 'flex', gap: 6, padding: '7px 12px', background: 'rgba(8,8,18,0.88)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.07)' }}>
          {QUICK_EMOJIS.slice(0, 8).map((e) => (
            <div key={e} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{e}</div>
          ))}
        </div>
      </div>

      {/* ── Voice strip — violet-tinted card, real join/participant styling ── */}
      <div style={{
        opacity: s4, transform: `translateY(${(1 - s4) * -10}px)`,
        margin: '14px 16px 0', padding: 12, borderRadius: 14, gap: 8,
        background: 'rgba(123,114,248,0.06)', border: '1px solid rgba(123,114,248,0.16)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Ovozli chat
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {VOICE_AVATARS.map((a) => (
              <div key={a.initial} style={{
                width: 32, height: 32, borderRadius: 16,
                background: a.speaking ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${a.speaking ? '#4ADE80' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: a.speaking ? `scale(${speakingPulse})` : undefined,
                boxShadow: a.speaking ? '0 0 6px rgba(74,222,128,0.6)' : undefined,
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{a.initial}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat panel preview — real bubble colors (#7B72F8 mine / #1C1C2E other) ── */}
      <div style={{ opacity: s5, transform: `translateY(${(1 - s5) * 10}px)`, flex: 1, margin: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>S</span>
          </div>
          <div style={{ background: '#1C1C2E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, borderBottomLeftRadius: 5, padding: '9px 13px', maxWidth: 260 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: '20px', display: 'block', overflowWrap: 'break-word' }}>bu sahna aql bovar qilmaydi 😱</span>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          opacity: bubble2Opacity,
          transform: `translateX(${bubble2In}px)`,
        }}>
          <div style={{ background: '#7B72F8', borderRadius: 18, borderBottomRightRadius: 5, padding: '9px 13px', maxWidth: 240 }}>
            <span style={{ fontSize: 14, color: '#fff', lineHeight: '20px', display: 'block', overflowWrap: 'break-word' }}>bilaman!! 🍿</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 22px', background: '#111120', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ flex: 1, background: '#1C1C2E', borderRadius: 22, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Xabar yozing...</span>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 21, background: '#7B72F8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(123,114,248,0.55)' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WATCH_PARTY_MOCK_DURATION = 6 * 30;
