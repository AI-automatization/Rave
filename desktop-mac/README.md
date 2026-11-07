# WeWatch Desktop — macOS

Mac uchun WeWatch klient: veb-ilova (`app.wewatch.uz`) oynada, plus Virtual Browser (VB) egasining kompyuterida,
VB oynasi **faqat o'z ovozi bilan** WebRTC orqali xonaga uzatiladi (server faqat signalling).

Holat: **M2 skelet** (oyna, menyu, deep link, single-instance, `window.wewatchDesktop` kontrakti). VB hali yo'q (M3).

```bash
cd desktop-mac
npm install
node node_modules/electron/install.js   # electron binarini yuklaydi (npm postinstall ba'zan o'tkazib yuboradi)
npm run typecheck && npm test && npm run build
npm start                  # app.wewatch.uz
npm run dev                # lokal app-web :3000 ga qarshi
```

- Windows versiya (Polat): `desktop/` papkasi, `polat/dev` branchi (PR #265). Bu papka `desktop-mac/` — to'qnashmaydi.
- Til: TypeScript (strict), Electron 45.2.1. Tarqatish: imzosiz DMG (M6, hozircha yo'q). DRM (Widevine) 1-versiyada yo'q.

## Tuzilma
```
src/main/    index.ts (kirish) window.ts deeplink.ts menu.ts ipc.ts config.ts urls.ts (sof mantiq, test qilinadi)
src/preload/ index.ts  → window.wewatchDesktop { platform:'macos', version:1, vb:{open,close,focus,onState,onBlocked,metrics} }
test/        urls.test.ts (vitest)
```

## Xavfsizlik qarorlari (Polat kodidan farqi)
- `shell.openExternal` faqat `http(s)`/`mailto` (kamida `file:`/maxsus schemalar OS'ga berilmaydi).
- IPC faqat ilova origin'idan (`scheme+host+port`) qabul qilinadi.
- `WW_*` muhit o'zgaruvchilari faqat dev (paketlangan ilova ularni e'tiborsiz qoldiradi).
- Hardcode qilingan Railway URL yo'q.

## Ovoz usuli (M1 spike natijasi)
`getDisplayMedia` uchun `setDisplayMediaRequestHandler` → `{ video: vbWin.webContents.mainFrame, audio: vbWin.webContents.mainFrame }`
(usul E): faqat VB ovozi, oyna minimallashtirilgan bo'lsa ham, **hech qanday macOS ruxsatisiz**. M3'da qo'llanadi.

## Hozircha YO'Q (reja bo'yicha)
Google login (system-browser oqimi, M2b), VB oynasi + capture (M3), reklama bloki/DoH (M4), UX ekranlari (M5), DMG (M6), picker (M9).
macOS'da `open-url` deep linki paketlangan ilovada sinaladi (M6); dev'da `second-instance` argv orqali sinalgan.
