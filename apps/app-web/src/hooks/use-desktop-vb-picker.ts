'use client';

// Desktop app only: finding a room's video happens in the Virtual Browser shown as a panel INSIDE
// the WeWatch window (VbPickerOverlay). Picking a platform opens that platform's site there; the
// moment it lands on a single-video page we take the link and close the panel. On any other site (a
// film site, a pasted link) the user starts the video and presses "Take video" — we take the iframe
// that actually plays it (the player alone, without the site's ads around it). The VB never streams
// anything here; nothing keeps running on the user's machine afterwards.

import { useCallback, useEffect, useRef, useState } from 'react';
import { DESKTOP_VB_ENABLED } from './use-desktop-screen-share';

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const bareHost = (u: URL) => u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');

function parseHttp(raw: string): URL | null {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch { return null; }
}

/**
 * The page (or embedded player) is ONE video of a platform our player plays natively → its
 * canonical link, otherwise null. Deliberately narrow: an auto-pick closes the browser under the
 * user's cursor. Twitch channels, PeerTube, Trovo and arbitrary sites go through "Take video".
 */
export function videoPageUrl(raw: string): string | null {
  const u = parseHttp(raw);
  if (!u) return null;
  const path = u.pathname;
  switch (bareHost(u)) {
    case 'youtu.be': {
      const v = path.slice(1).split('/')[0];
      return YT_ID.test(v) ? `https://www.youtube.com/watch?v=${v}` : null;
    }
    case 'youtube.com':
    case 'youtube-nocookie.com': {
      const shorts = /^\/shorts\//.test(path);
      const v = path === '/watch' ? u.searchParams.get('v') : /^\/(?:shorts|live|embed)\/([^/?#]+)/.exec(path)?.[1];
      if (!v || !YT_ID.test(v)) return null;
      return shorts ? `https://www.youtube.com/shorts/${v}` : `https://www.youtube.com/watch?v=${v}`;
    }
    case 'vk.com':
    case 'vkvideo.ru': {
      // vk.com/video?z=video-1_2%2Fpl_… (modal), vkvideo.ru/video-1_2, or the embed video_ext.php?oid=-1&id=2
      const ext = path === '/video_ext.php' && /^-?\d+$/.test(u.searchParams.get('oid') ?? '') && /^\d+$/.test(u.searchParams.get('id') ?? '')
        ? `${u.searchParams.get('oid')}_${u.searchParams.get('id')}` : undefined;
      const id = ext
        ?? /^video(-?\d+_\d+)/.exec(u.searchParams.get('z') ?? '')?.[1]
        ?? /^\/video(-?\d+_\d+)\/?$/.exec(path)?.[1];
      return id ? `https://vkvideo.ru/video${id}` : null;
    }
    case 'rutube.ru': {
      const id = /^\/(?:video|play\/embed)\/([0-9a-f]{32})\/?$/i.exec(path)?.[1];
      return id ? `https://rutube.ru/video/${id}/` : null;
    }
    case 'twitch.tv': {
      const id = /^\/videos\/(\d+)\/?$/.exec(path)?.[1];
      return id ? `https://www.twitch.tv/videos/${id}` : null;
    }
    case 'player.twitch.tv': {
      const video = u.searchParams.get('video')?.replace(/^v/, '');
      if (video && /^\d+$/.test(video)) return `https://www.twitch.tv/videos/${video}`;
      const channel = u.searchParams.get('channel');
      return channel && /^[A-Za-z0-9_]{3,25}$/.test(channel) ? `https://www.twitch.tv/${channel}` : null;
    }
    case 'dailymotion.com': {
      const id = /^\/(?:embed\/)?video\/([a-zA-Z0-9]+)\/?$/.exec(path)?.[1];
      return id ? `https://www.dailymotion.com/video/${id}` : null;
    }
    case 'vimeo.com':
    case 'player.vimeo.com': {
      const id = /^\/(?:video\/)?(\d+)\/?$/.exec(path)?.[1];
      return id ? `https://vimeo.com/${id}` : null;
    }
    case 'tiktok.com': {
      const m = /^\/(@[^/]+)\/video\/(\d+)/.exec(path);
      return m ? `https://www.tiktok.com/${m[1]}/video/${m[2]}` : null;
    }
    default:
      return null;
  }
}

// Hosts whose rooms go to a dedicated player: a non-video page there (a feed, a search) would make a
// room that never plays, so "Take video" is off on them. Twitch channels are the exception — the
// player takes a channel and plays it live (VideoPlayer getTwitchIds).
const PLAYER_HOSTS = new Set(['youtube.com', 'youtu.be', 'vk.com', 'vkvideo.ru', 'rutube.ru', 'dailymotion.com', 'vimeo.com', 'tiktok.com', 'twitch.tv']);
const TWITCH_NOT_CHANNEL = new Set(['directory', 'videos', 'p', 'settings', 'search', 'downloads', 'subscriptions', 'inventory', 'wallet', 'drops', 'turbo', 'jobs', 'login', 'signup']);
const DIRECT_MEDIA = /\.(m3u8|mpd|mp4|webm|mkv|mov)$/i;

/** May "Take video" take this url as the room's media? */
export function canTakePage(raw: string): boolean {
  const u = parseHttp(raw);
  if (!u) return false;
  if (videoPageUrl(raw)) return true;
  const host = bareHost(u);
  if (!PLAYER_HOSTS.has(host)) return true;
  const channel = host === 'twitch.tv' ? /^\/([A-Za-z0-9_]{3,25})\/?$/.exec(u.pathname)?.[1] : undefined;
  return !!channel && !TWITCH_NOT_CHANNEL.has(channel.toLowerCase());
}

/**
 * A pasted link that needs the browser panel first (desktop app): an ordinary site (film site, own
 * source) — the user starts the film there and we take its player — or a platform page that is not
 * one video (youtube.com itself, a channel, a search) — the user picks the video there. Single-video
 * platform links and direct media files keep going straight to the room.
 */
export function opensInPicker(raw: string): boolean {
  const u = parseHttp(raw);
  if (!u || DIRECT_MEDIA.test(u.pathname) || videoPageUrl(raw)) return false;
  return !PLAYER_HOSTS.has(bareHost(u)) || !canTakePage(raw);
}

function getPicker() {
  if (!DESKTOP_VB_ENABLED || typeof window === 'undefined') return null;
  return window.wewatchDesktop?.picker ?? null;
}

export interface VbPickerPage { url: string | null; title: string | null }

/**
 * onPick(url, title) — title only for "Take video" (an auto-pick fires on the SPA route change,
 * before the page retitles, so the VB title would still be the previous page's).
 */
export function useDesktopVbPicker(onPick: (url: string, title?: string) => void) {
  // null = not picking; otherwise the page currently open in the panel (null url until it loads).
  const [page, setPage] = useState<VbPickerPage | null>(null);
  const [taking, setTaking] = useState(false);
  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; });
  const unsubRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    setPage(null);
  }, []);

  /** Opens the panel on `url`. false → not in the desktop app (or refused) — caller keeps its old flow. */
  const start = useCallback(async (url: string): Promise<boolean> => {
    const picker = getPicker();
    if (!picker) return false;
    unsubRef.current?.();
    // Until the panel reports a full page load that started after open() — events of whatever page
    // it showed before (an SPA route change, a late title) must not count as the user's pick.
    let opened = false;
    let armed = false;
    setPage({ url: null, title: null });
    unsubRef.current = picker.onState((s) => {
      if (!s.open) { stop(); return; } // closed from the desktop side (app page reloaded)
      if (!s.url) return;
      if (!armed) {
        if (!opened || s.nav === 'in-page') return;
        armed = true;
      }
      const picked = videoPageUrl(s.url);
      if (picked) {
        stop();
        void picker.close();
        onPickRef.current(picked);
        return;
      }
      setPage({ url: s.url, title: s.title ?? null });
    });
    const res = await picker.open(url);
    if (!res.ok) { stop(); return false; }
    opened = true;
    return true;
  }, [stop]);

  /** "Take video" → false when there is nothing usable to take yet (the user hasn't started a video). */
  const take = useCallback(async (): Promise<boolean> => {
    const picker = getPicker();
    if (!picker || !page?.url) return false;
    setTaking(true);
    try {
      const r = await picker.take();
      if (!r.ok) return false;
      const url = videoPageUrl(r.url) ?? r.url;
      if (!canTakePage(url)) return false;
      stop();
      void picker.close();
      onPickRef.current(url, r.title || page.title || undefined);
      return true;
    } finally {
      setTaking(false);
    }
  }, [page, stop]);

  const cancel = useCallback(() => {
    if (!unsubRef.current) return;
    stop();
    void getPicker()?.close();
  }, [stop]);

  const back = useCallback(() => { void getPicker()?.nav('back'); }, []);
  const reload = useCallback(() => { void getPicker()?.nav('reload'); }, []);
  const setBounds = useCallback((box: { x: number; y: number; width: number; height: number } | null) => {
    void getPicker()?.setBounds(box);
  }, []);

  // Unmounted mid-pick (route change) — don't leave a panel nobody is waiting on.
  useEffect(() => () => {
    if (!unsubRef.current) return;
    unsubRef.current();
    unsubRef.current = null;
    void getPicker()?.close();
  }, []);

  /** Synchronous — the caller still holds the click's user gesture for its window.open fallback. */
  const canPick = useCallback(() => getPicker() !== null, []);

  const canTake = !!page?.url && canTakePage(page.url);

  return { picking: page !== null, page, canTake, taking, canPick, start, take, cancel, back, reload, setBounds };
}

export type DesktopVbPicker = ReturnType<typeof useDesktopVbPicker>;
