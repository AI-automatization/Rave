# WeWatch Desktop — macOS

Mac uchun WeWatch klient: veb-ilova (`app.wewatch.uz`) oynada, plus Virtual Browser (VB) egasining kompyuterida,
VB oynasi **faqat o'z ovozi bilan** WebRTC orqali xonaga uzatiladi (server faqat signalling).

Holat: **M2 + M2b + M3** (oyna, menyu, deep link, Google login, Virtual Browser oynasi, VB ni ovozi bilan ulashish). Reklama bloki/DoH (M4) va UX ekranlari (M5) hali yo'q.

```bash
cd desktop-mac
npm install
node node_modules/electron/install.js   # electron binarini yuklaydi (npm postinstall ba'zan o'tkazib yuboradi)
npm run typecheck && npm test && npm run build
npm run smoke:m2b          # haqiqiy Electron + soxta auth server: Google login oqimi (internet/Google kerak emas)
npm run smoke:m3           # haqiqiy Electron + soxta veb-ilova: VB ochish + WebRTC orqali ulashish, ovoz/video o'lchovi (~1.5 daq, ovoz eshitiladi)
npm start                  # app.wewatch.uz
npm run dev                # lokal app-web :3000 ga qarshi
```

- Windows versiya (Polat): `desktop/` papkasi, `polat/dev` branchi (PR #265). Bu papka `desktop-mac/` — to'qnashmaydi.
- Til: TypeScript (strict), Electron 45.2.1. Tarqatish: imzosiz DMG (M6, hozircha yo'q). DRM (Widevine) 1-versiyada yo'q.

## Tuzilma
```
src/main/    index.ts (kirish) window.ts deeplink.ts menu.ts ipc.ts config.ts auth.ts vb.ts capture.ts permissions.ts urls.ts (sof mantiq, test qilinadi)
src/preload/ index.ts  → window.wewatchDesktop { platform:'macos', version:1, vb:{open,close,focus,onState,onBlocked,metrics} }
test/        urls.test.ts (vitest)
```

## Xavfsizlik qarorlari (Polat kodidan farqi)
- `shell.openExternal` faqat `http(s)`/`mailto` (kamida `file:`/maxsus schemalar OS'ga berilmaydi).
- IPC faqat ilova origin'idan (`scheme+host+port`) qabul qilinadi.
- `WW_*` muhit o'zgaruvchilari faqat dev (paketlangan ilova ularni e'tiborsiz qoldiradi).
- Auth manzili bitta konstantada (`config.ts`), faqat dev'da `WW_AUTH_URL` bilan almashtiriladi; ilova URL'i hardcode emas (dev'da `WW_APP_URL`).

## Virtual Browser va ulashish (M3)
- `window.wewatchDesktop.vb.open(url)` alohida oyna (`persist:vb` profili) ochadi; faqat `http(s)`; kamera/mik/lokatsiya yo'q;
  popup faqat o'sha sayt ichida; yuklanmasa xato sahifasi; oyna yopilsa kesh tozalanadi.
- Veb-ilova oddiy `navigator.mediaDevices.getDisplayMedia({video:true, audio:true})` chaqiradi — `capture.ts` handleri VB oynasining
  **ramkasini** (video + ovoz) beradi (usul E, M1 spike): faqat VB ovozi (ilovaning o'z ovozi/xona chati aralashmaydi),
  VB minimallashtirilgan bo'lsa ham ishlaydi, **hech qanday macOS ruxsatisiz**. VB yo'q bo'lsa yoki begona sahifa so'rasa — rad etiladi.
- Asosiy oynada ruxsatlar faqat ilova origin'iga beriladi (Electron'ning odatiy "hammasiga ruxsat"i o'rniga).

## Google login (M2b)
Veb-ilovaning "Google bilan kirish" tugmasi `<app>/api/auth/google/start` ga o'tadi; ilova buni ushlab, tizim brauzerida
auth-servisning mavjud mobil oqimini (`POST /google/init` → `GET /google/mobile` → `GET /google/poll`) ishlatadi, tokenlarni
veb bilan bir xil httpOnly cookie'larga (`access_token` 15 daq, `refresh_token` 30 kun) yozadi va `redirect` sahifasiga o'tadi.
Serverda o'zgarish kerak emas. Auth manzili `src/main/config.ts` (`DEFAULT_AUTH_URL`, `api.wewatch.uz` ishlaganda almashtiriladi).
`redirect` faqat `/` bilan boshlanadigan yo'l (`//evil.com` rad etiladi) — Polatning Windows kodidagi bo'shliq yopilgan.

## Hozircha YO'Q (reja bo'yicha)
Reklama bloki/DoH (M4), UX ekranlari (M5), DMG (M6), picker (M9).
macOS'da `open-url` deep linki paketlangan ilovada sinaladi (M6); dev'da `second-instance` argv orqali sinalgan.
