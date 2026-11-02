# WeWatch for Windows

The web app (`app.wewatch.uz`) in a desktop window, plus a **Virtual Browser that runs on the
owner's own computer** instead of on our server. The owner's VB window is captured with sound and
sent to viewers over WebRTC; the watch-party service only relays signalling.

Not an npm workspace on purpose: Electron must not land in the root lockfile or in the services'
Docker builds. Install it separately.

```bash
cd desktop
npm install
npm start                 # against app.wewatch.uz
npm run dev               # against a local app-web on :3000
npm run dist              # Windows installer → desktop/dist/
```

## Contract for the web app

```ts
declare global {
  interface Window {
    wewatchDesktop?: {
      platform: 'windows'; version: 1;
      vb: {
        open(url: string): Promise<{ ok: true } | { ok: false; reason: string }>;
        close(): Promise<{ ok: boolean }>;
        focus(): Promise<{ ok: boolean }>;
        onState(cb: (s: { open: boolean; url?: string; title?: string; crashed?: string }) => void): () => void;
        onBlocked(cb: (b: { url: string; reason: string }) => void): () => void;
        metrics(): Promise<{ ramMb: number; cpu: number; processes: number }>;
      };
    };
  }
}
```

After `vb.open(url)`, the ordinary `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`
returns the VB window with system audio — the same send path as tab sharing in a normal browser.

## Sharing the VB with the room

The web app (`apps/app-web`) does this in `hooks/use-desktop-screen-share.ts`, only when built
with `NEXT_PUBLIC_DESKTOP_VB=1` and running inside this app:

- the room owner gets a **"VB on my computer"** button → `vb.open(<room link>)` → `getDisplayMedia`;
- each viewer gets the stream peer-to-peer (WebRTC, TURN from `/api/rooms/turn`), shown instead of
  the normal player; viewers can be in a normal browser;
- signalling is the watch-party `screen:*` relay (`services/watch-party/src/socket/screen.handlers.ts`):
  offers only from the owner, only to members of the same room; `SCREEN_SHARE_ENABLED=0` turns it off.

The owner uploads one copy per viewer — fine for ~4 viewers on a home connection.

Local test: run `apps/app-web` on :3000 with `.env.local` (`NEXT_PUBLIC_DESKTOP_VB=1` + backend
URLs), then `npm run dev` here.

## 18+ protection

1. Cloudflare Family DNS-over-HTTPS (adult + malware) for the whole app.
2. `src/blocklist.txt` — our own domains.
3. Forced SafeSearch (Google/Bing/DDG/Yandex), YouTube Restricted Mode header.
4. Sites in the VB get no camera/mic/location/notifications.

## Known gaps

- **Telegram sign-in**: hidden in the app (popup flow does not come back to Electron); Google and
  email work.
- **System audio**: loopback captures all PC sound, not only the VB window — including voice chat,
  so viewers may hear an echo of themselves.
- **Code signing**: unsigned builds trigger the SmartScreen warning on install.
