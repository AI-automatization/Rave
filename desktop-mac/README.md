# WeWatch Desktop — macOS

Mac uchun WeWatch klient: veb-ilova (`app.wewatch.uz`) oynada, plus Virtual Browser (VB) egasining kompyuterida,
VB oynasi **faqat o'z ovozi bilan** WebRTC orqali xonaga uzatiladi (server faqat signalling).

Holat: **M2 + M2b + M3 + M4 + M5.1 + M5.2** (oyna, menyu, deep link, Google login, Virtual Browser, ovoz bilan ulashish, reklama bloki, DoH, native Mac qobig'i va Bosh sahifa). DMG (M6) hali yo'q.

```bash
cd desktop-mac
npm install
node node_modules/electron/install.js   # electron binarini yuklaydi (npm postinstall ba'zan o'tkazib yuboradi)
npm run typecheck && npm test && npm run build
npm run smoke:m2b          # haqiqiy Electron + soxta auth server: Google login oqimi (internet/Google kerak emas)
npm run smoke:m4           # reklama bloki, YouTube istisnosi, VB ruxsatlari/UA, DNS-over-HTTPS (DoH qismi internet talab qiladi)
npm run smoke:m5           # native qobiq: sidebar, toolbar, navigatsiya (soxta veb-ilova)
npm run smoke:m5b          # native Bosh sahifa: xonalar, qidiruv, token yangilash, til, obuna bloki (4+1 ishga tushirish)
npm run smoke:m3           # haqiqiy Electron + soxta veb-ilova: VB ochish + WebRTC orqali ulashish, ovoz/video o'lchovi (~1.5 daq, ovoz eshitiladi)
npm start                  # app.wewatch.uz
npm run dev                # lokal app-web :3000 ga qarshi
```

- Windows versiya (Polat): `desktop/` papkasi, `polat/dev` branchi (PR #265). Bu papka `desktop-mac/` — to'qnashmaydi.
- Til: TypeScript (strict), Electron 45.2.1. Tarqatish: imzosiz DMG (M6, hozircha yo'q). DRM (Widevine) 1-versiyada yo'q.

## Tuzilma
```
src/main/    index.ts (kirish) window.ts deeplink.ts menu.ts ipc.ts config.ts auth.ts vb.ts capture.ts permissions.ts dns.ts
             urls.ts adblock.ts (sof mantiq, unit test qilinadi)
src/preload/ index.ts  → window.wewatchDesktop { platform:'macos', version:1, vb:{open,close,focus,onState,onBlocked,metrics} }
test/        urls.test.ts (vitest)
```

## Native Mac qobig'i (M5, Stitch "WeWatch macOS" — Variant 1, qorong'i)
- **Uch ko'rinish** (`src/main/shell.ts`): `shell` (chap panel + toolbar, oynaning shaffof/vibrancy materiali ustida), `home` (ilovaning o'z Bosh sahifasi) va
  `content` (veb-ilova). Veb ko'rinishi faqat kerak bo'lganda yaratiladi (xona, Do'stlar, Sozlamalar, login) va Bosh sahifaga qaytilganda **yo'q qilinadi**:
  kirish tokenlari aylanadi, shuning uchun ularni bir vaqtda faqat bitta narsa yangilashi kerak.
- **Bosh sahifa** xonalarni `<app>/api/rooms` dan oladi (asosiy jarayon, sessiya cookie'lari bilan; 401 bo'lsa bir marta `/api/auth/refresh`, keyin veb login).
  Holatlar serverniki: `waiting | playing | paused` (veb'dagi `'active'` serverdan hech qachon kelmaydi). Banner = eng ko'p tomoshabinli `playing` xona.
- **Renderer faqat chizadi.** U faqat id so'raydi (`wewatchShell.navigate(id)`, `wewatchHome.open(id)`); asosiy jarayon jo'natuvchini (o'z ko'rinishi va sahifasi) va id'ni
  tekshiradi, URL'ni o'zi quradi. Matnlar `textContent` bilan, CSP: faqat o'z skripti/uslubi (+ Home'da `https:` rasmlar).
- **Poster qatorlari** (Haftaning top kinolari — `/api/rooms/trending`, Ko'rganlarim — `/api/rooms/history`): xonalardan keyin, alohida yuklanadi (xato qatorni bo'sh qiladi, xonalarni emas).
  Videoga bosish veb'dagidek yopiq xona yaratadi (`POST /api/rooms`), server 409 ("ochiq xonangiz bor") desa o'sha xona `?play=<video>` bilan ochiladi.
  Renderer faqat "qator + o'rin" yuboradi; havola va so'rov tanasi asosiy jarayondagi o'z ro'yxatidan olinadi (`home:watch`). Qidiruv paytida qatorlar yashiriladi. "Davom ettirish" (Pro) yo'q.
- **Til** (`src/main/i18n.ts`): veb-ilovaning `wewatch-locale` cookie'si (`uz|ru|en`, yo'q bo'lsa `ru` — veb bilan bir xil); o'zgarganda panel va Bosh sahifa darhol yangilanadi.
  Veb'da tarjimasi bor satrlar aynan o'sha (test `apps/app-web/messages` bilan solishtiradi).
- **Obuna (Pro/tarif) Mac ilovada yo'q** (Abdulaziz va Bekzod aka qarori): `/api/payment/*` so'rovlari bekor qilinadi, `/pricing` ochilmaydi, Sozlamalardagi "TARIF" paneli
  yashiriladi (`section.ww-panel:has(svg.lucide-crown)` — veb o'zgarsa buzilishi mumkin, `smoke:m5b` E senariysi qo'riqlaydi).
- Veb-ilovaning o'z chap paneli content ichida yashiriladi (`--ww-sidebar: 0`, `aside.fixed`) — vaqtincha, hamma ekran native bo'lguncha.

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
Serverda o'zgarish kerak emas. Auth manzili `src/main/config.ts` (`DEFAULT_AUTH_URL` = core servisi `core-production-dbd0…/api/v1/auth`; `api.wewatch.uz` DNS'i core'ga ulanganda shunga almashtiriladi).
`redirect` faqat `/` bilan boshlanadigan yo'l (`//evil.com` rad etiladi) — Polatning Windows kodidagi bo'shliq yopilgan.

## Xavfsizlik va tarmoq (M4)
- **Reklama bloki** (`adblock.ts`, `vb.ts`): reklama tarmoqlari VB'da tarmoq darajasida bekor qilinadi (har qanday resurs turi; popunder, pre-roll,
  tracker). Ro'yxat — Windows versiya bilan bir xil (faqat reklama domenlari; CDN/pleyer SDK yo'q, `rtbcdn.ru` Rutube'ning o'z CDN'i — bloklanmaydi).
  **YouTube sahifalarida reklama saqlanadi** (mahsulot qarori, YouTube shartlari). Bloklangan soni `vb.metrics().adsBlocked` da.
- **VB profili:** UA'da "Electron/WeWatch" yo'q; kamera/mik/lokatsiya/bildirishnoma rad etiladi.
- **DNS-over-HTTPS** (`dns.ts`): butun ilova uchun Cloudflare DoH. Windows'dan FARQI: rejim `automatic` (DoH birinchi, tizim DNS zaxira),
  `secure` emas — DoH serveri bloklangan tarmoqda ilova butunlay ishlamay qolmasligi uchun. `UseDnsHttpsSvcb*` o'chirilgan (Windows'da websocket
  reset bo'lgan; macOS'da tasdiqlanmagan, zararsiz).
- Sinalgan: smoke:m4 — reklama so'rovlari serverga yetmaydi, oddiy CDN yuklanadi, YouTube reklamasi saqlanadi, `secure` rejim + o'lik DoH → DNS yiqiladi
  (DoH yo'lda ekanini isbotlaydi), `automatic` → zaxiraga o'tadi.
- Sinalmagan: haqiqiy reklama tarmoqlari/kino saytlari; `will-attach-webview` handleri (`webviewTag` sukut bo'yicha o'chiq — ikkinchi qulf).

## Hozircha YO'Q (reja bo'yicha)
UX ekranlari (M5), DMG (M6), picker (M9).
macOS'da `open-url` deep linki paketlangan ilovada sinaladi (M6); dev'da `second-instance` argv orqali sinalgan.
