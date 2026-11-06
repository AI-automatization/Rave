'use client';

// Video platforms offered when choosing what a room watches — shared by "Create room" and
// "Change video" so both show the same choice.

import type { ReactNode } from 'react';
import { Globe, Search } from 'lucide-react';

/* ── Platform interface ───────────────────────────────── */
export interface Platform {
  id: string;
  name: string;
  base: string;
  renderIcon: (size: number) => ReactNode;
  color: string;
  bg: string;
  border: string;
  urlPattern?: RegExp;
}

/* ── Platform list ────────────────────────────────────── */
export const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    base: 'https://youtube.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.13)',
    border: 'rgba(255,0,0,0.32)',
    urlPattern: /youtube\.com|youtu\.be/,
  },
  {
    id: 'vk',
    name: 'VK Видео',
    base: 'https://vkvideo.ru',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.01-1.49-.69-1.49.318v1.394H12.51c-2.785 0-4.52-1.814-4.52-5.008C7.99 9.42 9.754 7.5 12.58 7.5h1.542v1.572c0 .345.14.55.51.55.34 0 .55-.142.55-.55V7.5h1.748c1.035 0 1.497.49 1.497 1.553v4.988c0 .99-.346 1.47-1.05 1.47-.716 0-1.097-.49-1.097-1.47V12.57c0-1.17-.413-1.753-1.317-1.753-.883 0-1.317.583-1.317 1.753v1.493h-.002c0 .81.39 1.263 1.085 1.263.41 0 .738-.156.965-.465.27 2.11 2.037 2.262 2.037 2.262z"/>
      </svg>
    ),
    color: '#2787F5',
    bg: 'rgba(39,135,245,0.13)',
    border: 'rgba(39,135,245,0.32)',
    urlPattern: /vkvideo\.ru|vk\.com\/video/,
  },
  {
    id: 'rutube',
    name: 'Rutube',
    base: 'https://rutube.ru',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#E8232A"/>
        <path fill="white" d="M28 22h27c14.4 0 23 7.5 23 20 0 8.5-4.5 15-12 18l17 18H67L55 60H44v18H28V22zm16 27h11c6 0 9.5-3 9.5-7s-3.5-7-9.5-7H44v14z"/>
      </svg>
    ),
    color: '#E8232A',
    bg: 'rgba(232,35,42,0.13)',
    border: 'rgba(232,35,42,0.32)',
    urlPattern: /rutube\.ru/,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    base: 'https://twitch.tv',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
    color: '#9146FF',
    bg: 'rgba(145,70,255,0.13)',
    border: 'rgba(145,70,255,0.32)',
    urlPattern: /twitch\.tv/,
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    base: 'https://vimeo.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.179 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.753 6.762-5.674 2.473.06 3.628 1.664 3.494 4.844Z"/>
      </svg>
    ),
    color: '#1AB7EA',
    bg: 'rgba(26,183,234,0.13)',
    border: 'rgba(26,183,234,0.32)',
    urlPattern: /vimeo\.com/,
  },
  {
    id: 'dailymotion',
    name: 'Dailymotion',
    base: 'https://dailymotion.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 0h-17A3.5 3.5 0 0 0 0 3.5v17A3.5 3.5 0 0 0 3.5 24h17a3.5 3.5 0 0 0 3.5-3.5v-17A3.5 3.5 0 0 0 20.5 0Zm-2.34 18.3h-2.87v-1.28h-.04c-.5.94-1.6 1.52-2.75 1.52-2.7 0-4.5-2.12-4.5-4.85 0-2.5 1.66-4.84 4.32-4.84 1.1 0 2.2.44 2.83 1.32h.04V4.5h3l-.03 13.8Zm-4.9-2.15c1.34 0 2.05-1.13 2.05-2.36 0-1.26-.68-2.4-2.05-2.4-1.36 0-1.98 1.19-1.98 2.4 0 1.19.66 2.36 1.98 2.36Z"/>
      </svg>
    ),
    color: '#00D3FF',
    bg: 'rgba(0,211,255,0.13)',
    border: 'rgba(0,211,255,0.32)',
    urlPattern: /dailymotion\.com|dai\.ly/,
  },
  {
    id: 'peertube',
    name: 'PeerTube',
    base: 'https://framatube.org',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 14.5v-9l7 4.5-7 4.5Z"/>
      </svg>
    ),
    color: '#F1680D',
    bg: 'rgba(241,104,13,0.13)',
    border: 'rgba(241,104,13,0.32)',
    urlPattern: /\/videos\/watch\/[0-9a-f-]{36}|\/w\/[a-zA-Z0-9]{22}$/,
  },
  {
    id: 'trovo',
    name: 'Trovo',
    base: 'https://trovo.live',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.24 7 3.5v7.52l-7 3.5-7-3.5V7.74l7-3.5ZM9.5 8v8l7-4-7-4Z"/>
      </svg>
    ),
    color: '#19D66B',
    bg: 'rgba(25,214,107,0.13)',
    border: 'rgba(25,214,107,0.32)',
    urlPattern: /trovo\.live/,
  },
  {
    id: 'cinerama',
    name: 'Cinerama',
    base: 'https://cinerama.uz',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3zM8 17H6v-2h2zm0-4H6v-2h2zm0-4H6V7h2zm10 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V7h2z"/>
        <path d="M11 8l-3 4 3 4h2l-3-4 3-4z"/>
      </svg>
    ),
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.13)',
    border: 'rgba(245,158,11,0.32)',
    urlPattern: /cinerama\.uz/,
  },
  {
    id: 'live',
    name: 'YouTube Live',
    base: 'https://youtube.com/results?search_query=live',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#FF0000"/>
        <path fill="white" d="M17.5 6.5h-11C5.67 6.5 5 7.17 5 8v8c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5V8c0-.83-.67-1.5-1.5-1.5zM10 15V9l5 3-5 3z"/>
        <circle cx="19.5" cy="4.5" r="3" fill="#00C853"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.10)',
    border: 'rgba(255,0,0,0.25)',
    urlPattern: /youtube\.com\/.*live/,
  },
  {
    id: 'web',
    name: 'Web',
    base: '',
    renderIcon: (s) => <Globe size={s} />,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.13)',
    border: 'rgba(96,165,250,0.32)',
  },
];

export function detectPlatform(url: string): Platform | null {
  return PLATFORMS.find(p => p.urlPattern?.test(url)) ?? null;
}

/* ── Top sources shown up-front — the rest live behind "Other sources". A user thinks "what
   are we watching", not "which of these 12 logos is mine" — narrowing the first-glance choice
   to the platforms people actually use most keeps the decision fast without removing anything
   (Rutube/Vimeo/etc. are one click away under the toggle, not deleted). ── */
export const TOP_PLATFORM_IDS = ['youtube', 'vk', 'rutube', 'twitch'];

/** Where the desktop browser panel starts for a platform ('Web' has no site of its own → a search page). */
export function platformStartUrl(platform: Platform): string {
  return platform.base || 'https://www.google.com';
}

/** Web (no desktop app): the platform's site in a popup window, the user copies the link back. */
export function openPlatformPopup(platform: Platform): void {
  if (!platform.base) return;
  const popup = window.open(
    platform.base,
    'wewatch-browser',
    'width=1100,height=700,menubar=no,toolbar=yes,location=yes,status=no'
  );
  if (!popup) window.open(platform.base, '_blank');
}

// Idle-state brand tint, derived from each platform's own `color` hex — so the resting grid
// tile carries a whisper of brand identity instead of looking identical (flat gray) for every
// platform until hovered. Doesn't touch platform.bg/border (those stay the stronger hover/active
// treatment already tuned per platform).
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/** A platform choice tile. `badgeTitle` → the small search glyph (platform searchable in-app). */
export function PlatformTile({ platform, active, onClick, badgeTitle }: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
  badgeTitle?: string;
}) {
  const idleBg = hexToRgba(platform.color, 0.05);
  const idleBorder = hexToRgba(platform.color, 0.16);
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer"
      style={{
        background: active ? platform.bg : idleBg,
        borderColor: active ? platform.border : idleBorder,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = platform.bg;
          e.currentTarget.style.borderColor = platform.border;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = idleBg;
          e.currentTarget.style.borderColor = idleBorder;
        }
      }}
    >
      {badgeTitle && (
        <span
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.06]"
          title={badgeTitle}
        >
          <Search size={9} className="text-zinc-400" />
        </span>
      )}
      <span style={{ color: platform.color }}>
        {platform.renderIcon(26)}
      </span>
      <span
        className="text-[10px] font-medium leading-none text-center"
        style={{ color: active ? '#e2e8f0' : '#64748b' }}
      >
        {platform.name}
      </span>
    </button>
  );
}
