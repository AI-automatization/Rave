'use client';

// Desktop app only: picking a platform in "create room" opens the local Virtual Browser on that
// site. The user browses there as usual; the moment the VB lands on a single-video page we take its
// link, close the VB and hand the link to the dialog. The VB never streams anything here — it is
// only the place where the user finds the video, nothing keeps running on their machine after.

import { useCallback, useEffect, useRef, useState } from 'react';
import { DESKTOP_VB_ENABLED } from './use-desktop-screen-share';

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The VB page is ONE video (not a feed, search or channel) → the canonical link our player plays,
 * otherwise null. Deliberately narrow: a false hit closes the browser under the user's cursor.
 * Twitch channels, PeerTube, Trovo and arbitrary sites go through "Watch this page" instead.
 */
export function videoPageUrl(raw: string): string | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  const path = u.pathname;
  switch (host) {
    case 'youtube.com': {
      const shorts = /^\/shorts\//.test(path);
      const v = path === '/watch' ? u.searchParams.get('v') : /^\/(?:shorts|live)\/([^/]+)/.exec(path)?.[1];
      if (!v || !YT_ID.test(v)) return null;
      return shorts ? `https://www.youtube.com/shorts/${v}` : `https://www.youtube.com/watch?v=${v}`;
    }
    case 'vk.com':
    case 'vkvideo.ru': {
      // vk.com/video?z=video-1_2%2Fpl_… (modal) or vkvideo.ru/video-1_2
      const id = /^video(-?\d+_\d+)/.exec(u.searchParams.get('z') ?? '')?.[1]
        ?? /^\/video(-?\d+_\d+)\/?$/.exec(path)?.[1];
      return id ? `https://vkvideo.ru/video${id}` : null;
    }
    case 'rutube.ru': {
      const id = /^\/video\/([0-9a-f]{32})\/?$/i.exec(path)?.[1];
      return id ? `https://rutube.ru/video/${id}/` : null;
    }
    case 'twitch.tv': {
      const id = /^\/videos\/(\d+)\/?$/.exec(path)?.[1];
      return id ? `https://www.twitch.tv/videos/${id}` : null;
    }
    case 'dailymotion.com': {
      const id = /^\/video\/([a-zA-Z0-9]+)\/?$/.exec(path)?.[1];
      return id ? `https://www.dailymotion.com/video/${id}` : null;
    }
    case 'vimeo.com': {
      const id = /^\/(\d+)\/?$/.exec(path)?.[1];
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
// room that never plays, so "Watch this page" is off on them. Twitch channels are the exception —
// the player takes a channel and plays it live (VideoPlayer getTwitchIds).
const PLAYER_HOSTS = new Set(['youtube.com', 'youtu.be', 'vk.com', 'vkvideo.ru', 'rutube.ru', 'dailymotion.com', 'vimeo.com', 'tiktok.com', 'twitch.tv']);
const TWITCH_NOT_CHANNEL = new Set(['directory', 'videos', 'p', 'settings', 'search', 'downloads', 'subscriptions', 'inventory', 'wallet', 'drops', 'turbo', 'jobs', 'login', 'signup']);

/** May "Watch this page" take this url as the room's media? */
export function canTakePage(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  if (videoPageUrl(raw)) return true;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  if (!PLAYER_HOSTS.has(host)) return true;
  const channel = host === 'twitch.tv' ? /^\/([A-Za-z0-9_]{3,25})\/?$/.exec(u.pathname)?.[1] : undefined;
  return !!channel && !TWITCH_NOT_CHANNEL.has(channel.toLowerCase());
}

function getBridge() {
  if (!DESKTOP_VB_ENABLED || typeof window === 'undefined') return null;
  // Inside a room the VB may be the one being shown to viewers — never repurpose it from there.
  if (/^\/(uz\/)?room\//.test(window.location.pathname)) return null;
  return window.wewatchDesktop ?? null;
}

export interface VbPickerPage { url: string | null; title: string | null }

/**
 * onPick(url, title) — title only for "Watch this page" (an auto-pick fires on the SPA route change,
 * before the page retitles, so the VB title would still be the previous page's).
 */
export function useDesktopVbPicker(onPick: (url: string, title?: string) => void) {
  // null = not picking; otherwise the page currently open in the VB (null url until it loads).
  const [page, setPage] = useState<VbPickerPage | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => { onPickRef.current = onPick; });
  const unsubRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    setPage(null);
  }, []);

  /** Opens the VB on `url`. false → not in the desktop app (or VB refused) — caller keeps its old flow. */
  const start = useCallback(async (url: string): Promise<boolean> => {
    const bridge = getBridge();
    if (!bridge) return false;
    unsubRef.current?.();
    // Until the VB reports a full page load that started after open() — events of whatever page it
    // showed before (an SPA route change, a late title) must not count as the user's pick.
    let opened = false;
    let armed = false;
    setPage({ url: null, title: null });
    unsubRef.current = bridge.vb.onState((s) => {
      if (!s.open) { stop(); return; } // the user closed the VB window
      if (!s.url) return;
      if (!armed) {
        // No nav at all = a desktop build from before this field; its url events were full loads.
        if (!opened || s.nav === 'in-page') return;
        armed = true;
      }
      const picked = videoPageUrl(s.url);
      if (picked) {
        stop();
        void bridge.vb.close();
        onPickRef.current(picked);
        return;
      }
      setPage({ url: s.url, title: s.title ?? null });
    });
    const res = await bridge.vb.open(url);
    if (!res.ok) { stop(); return false; }
    opened = true;
    return true;
  }, [stop]);

  const take = useCallback(() => {
    const url = page?.url;
    if (!url || !canTakePage(url)) return;
    stop();
    void getBridge()?.vb.close();
    onPickRef.current(url, page?.title ?? undefined);
  }, [page, stop]);

  const cancel = useCallback(() => {
    if (!unsubRef.current) return;
    stop();
    void getBridge()?.vb.close();
  }, [stop]);

  const show = useCallback(() => { void getBridge()?.vb.focus(); }, []);

  // Dialog unmounted mid-pick (route change) — don't leave a VB nobody is waiting on.
  useEffect(() => () => {
    if (!unsubRef.current) return;
    unsubRef.current();
    unsubRef.current = null;
    void window.wewatchDesktop?.vb.close();
  }, []);

  /** Synchronous — the caller still holds the click's user gesture for its window.open fallback. */
  const canPick = useCallback(() => getBridge() !== null, []);

  const canTake = !!page?.url && canTakePage(page.url);

  return { picking: page !== null, page, canTake, canPick, start, take, cancel, show };
}
