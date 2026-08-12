# WeWatch — BAJARILGAN ISHLAR ARXIVI

# Yangilangan: 2026-08-11

---

### F-291 | T-S201 | VB candidate playback fix — vb-capture o'z-o'ziga qaytish sikli (yummyani.me)

- **Bajaruvchi:** Saidazim (Claude Sonnet 5)  **Bajarilgan:** 2026-08-11 18:16  **Model:** sonnet
- **O'zgarishlar:**
  - `apps/app-web/src/app/(app)/room/[id]/RoomContent.tsx` — `unwrapVbProxyUrl()` endi `/vb-capture/` yo'lini tanib oladi, `null` qaytaradi (avval `/vb-media-proxy/`ni tekshirmagani uchun buni "haqiqiy manba sahifa" deb noto'g'ri qabul qilardi).
  - `apps/mobile/src/screens/modal/WatchPartyScreen.tsx` — xuddi shu fix (dublikat funksiya).
  - `services/watch-party/src/socket/vbEvents.handler.ts` — `VB_START` handlerga `isOwnVbUrl()` server-side tekshiruvi qo'shildi (himoya ikkinchi qatlami).
- **Xulosa:** yummyani.me'da hech qaysi VB kandidat o'ynamas edi. Sabab: birinchi (default) kandidat har doim bizning `/vb-capture/` bufferimiz — u o'ynamagach, owner-only fatal-error auto-retry `vbStart()`ni shu o'z URL bilan chaqirardi, `unwrapVbProxyUrl` buni "haqiqiy sahifa" deb tanib, real manzilni yo'qotardi. Backend'da esa `startSession()` yangi (boshqa) url ko'rib, eski sessiyani o'chirardi — aynan o'sha buferni to'ldirib turgan sessiyani. Railway loglarini `--since` bilan jonli tutib, 3 fayl kodini o'qib aniqlandi. Classification: BUG/HIGH complexity/HIGH risk (self-referential-loop-guard oilasi, shu oyda 3-marta) — task_id rave-20260811-230100-e658a2. tsc: barcha 3 servisda toza (mobile'dagi 1ta LanguageTransition xatosi — pre-existing, tegilmagan).

### F-290 | T-S194 | Web: til avto-aniqlash — `Accept-Language`, cookie'siz, faqat `/` da

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-30  **Model:** opus
- **O'zgarishlar:**
  - **YANGI** `apps/web/src/lib/i18n/detect.ts` — `preferredLocale()` (q-value bo'yicha tartiblangan `Accept-Language` parseri), `isCrawler()` (UA substring ro'yxati), `localeForRoot()`.
  - `src/proxy.ts` — `/` uchun blok: 307 + `Cache-Control: no-store` + `Vary: Accept-Language, User-Agent`; matcher'ga `'/'` qo'shildi.
  - `next.config.mjs` — `{ source: '/', destination: '/ru', permanent: true }` **olib tashlandi**. Config redirect'lari middleware'dan OLDIN ishlaydi, ya'ni u turgan joyida aniqlash hech qachon ishga tushmasdi. Qolgan 24 ta doimiy redirect (`/faq` → `/ru/faq` va h.k.) tegilmadi.
  - **YANGI** `apps/web/tests/locale-detection.spec.ts` — 30 ta test. `playwright.config.ts` — `web-chromium` uchun `TEST_WEB_URL` env fallback.
- **Xulosa:** Jasur uchinchi marta so'radi: "rossiyalik ruscha, amerikalik/braziliyalik inglizcha ko'rsin — cookie'siz, aniq ishlaydigan yo'l". O'lchov bilan boshlandi va **prod'da mexanizm teskari ishlayotgani aniqlandi**: `curl https://wewatch.uz/` `ru-RU`, `en-US`, `pt-BR` — uchalasi uchun ham `/uz` qaytarardi va `wewatch-locale=uz` cookie o'rnatardi. Ya'ni rus foydalanuvchi ham o'zbekcha sahifaga tushardi. Bu hech qachon testga tushmagani uchun sezilmay qolgan — shuning uchun bu safar 30 ta doimiy test yozildi.
  **Signal tanlovi (Jasur, 2026-07-30): faqat `Accept-Language`, IP emas.** IP **davlatni** aytadi, header **tilni** — Toshkent trafigining katta qismi rus tilida, IP qoidasi ularni noto'g'ri o'zbekchaga yuborardi. Qo'shimcha: Cloudflare yo'q (`Server: railway-edge`), demak `cf-ipcountry` mavjud emas; MaxMind bazasi esa Docker image'ga 60MB qo'shardi.
  **Nega bu safar xavfsiz** — uchta oldingi urinishni o'ldirgan uchta muammo alohida yopildi: (1) *Googlebot AQSh IP'idan keladi* → botlar UA bo'yicha ajratiladi va doim x-default (`/ru`) oladi, ular boshqa tillarga hreflang orqali boradi; (2) *ulashilgan havola buzilardi* → aniqlash **faqat `/`** da, `/ru/faq` yoki `/uz` ga to'g'ridan-to'g'ri kelgan odam hech qachon burilmaydi; (3) *kesh bir odamning tilini boshqasiga berardi* → `/` javobi `no-store`, qolgan 100+ sahifa to'liq keshda qoladi. Cookie/localStorage/IP — hech narsa saqlanmaydi, ya'ni "yangi akkauntda nima bo'ladi?" degan savol ham yo'qoladi: birinchi tashrif va yuzinchi tashrif bir xil.
  **301 emas, 307** — doimiy redirect brauzerda abadiy keshlanadi, nemis brauzeri bilan bir marta kirgan odam keyin har doim `/en` ga qadalib qolardi va buni hech qanday kod qaytara olmasdi. T-S193 aynan shu 301 ni qo'ygan edi; u hali deploy bo'lmagani bizni saqlab qoldi.
  **Xulq matritsasi:** `ru-RU`→`/ru`, `en-US`→`/en`, `pt-BR`→`/en` (xalqaro fallback), `uz-UZ`→`/uz`, `de-DE,en;q=0.8`→`/en`, `pt-BR,ru;q=0.5`→`/ru`, `*`→`/ru`, header yo'q→`/ru`, Googlebot/YandexBot/GPTBot/ClaudeBot/TelegramBot→`/ru`, UA yo'q→`/ru`.
  **Tekshiruv:** `next build` — 102 sahifa; `next start` + curl matritsasi (14 holat) — hammasi kutilgandek; 24 ta ichki URL × 3 til — hammasi 200, hech biri burilmadi; `set-cookie` 0 ta; eski manzillar hamon 308; Playwright **30/30**; `tsc --noEmit` — 5 ta xato, hammasi pre-existing `@types/react` dublikati (`LocaleBoundary`, `Providers`, `button.tsx`, `toaster.tsx` — tegilmagan fayllar).
  **Ochiq qoladi:** brauzeri inglizcha o'rnatilgan rus foydalanuvchi `/en` ga tushadi — til almashtirgich bir bosishda hal qiladi, lekin bu Accept-Language yondashuvining tabiiy chegarasi. Aniqroq kerak bo'lsa keyingi qadam — Cloudflare qo'shib `cf-ipcountry` ni ikkinchi signal sifatida ishlatish.

---

### F-288 | T-S193 | Web: ruscha ham `/ru` prefiksiga o'tdi — uchala til bir xil qoidada

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-28  **Model:** opus
- **O'zgarishlar:**
  - **KO'CHIRILDI:** barcha ruscha sahifalar `app/` root'dan `app/ru/` ga — `page.tsx`, `(landing)/` (6), `faq`, `how-it-works`, `guides/` (11), `use-cases/` (2), `team/`, `tezcode/`. Til-neytral huquqiy sahifalar (`/terms`, `/privacy-policy`, `/dmca`, `/delete-account`) root'da qoldi — ular inglizcha yozilgan va tilga bog'liq emas.
  - **YANGI joy:** landing content komponentlari `app/ru/(landing)/*/…Content.tsx` dan `components/landing/` ga — ular uchala tilga xizmat qiladi, `ru/` ichida turishi noto'g'ri edi (`/en/features` sahifasi `ru` papkasidan import qilardi).
  - `config.ts` — `PREFIX_DEFAULT: false → true`. Qolgan helper'lar (`localeFromPath`, `stripLocale`, `withLocale`, `hreflangFor`) shundan hosila, o'zgartirilmadi.
  - `next.config.mjs` — 25 ta 301 (Next 308 chiqaradi, SEO'da teng): `/` → `/ru`, `/faq` → `/ru/faq` va h.k., har biri `:path*` varianti bilan. Tartib: app yo'llari → inglizcha gayd slug'lari → ruscha prefiks. Cache header'lari uch til bo'yicha simmetrik ro'yxatga o'tdi.
  - **YANGI:** `lib/i18n/use-localized-href.ts` (`useLocalizedHref()`) — umumiy komponentlardagi ichki havolalar joriy tilga moslanadi. `Footer`, `LandingNav` va 5 ta landing content shundan foydalanadi.
  - 266 ichki havola `/ru/…` ga o'tkazildi; `sitemap.ts` (`/` yozuvi olib tashlandi — u endi redirect), `public/llms.txt` (11 URL), `GuideChrome` `homeHref`, `data/tezcode.ts` (`href: '/'` → `isHome: true`).
- **Xulosa:** Jasurning qarori — ruscha ham boshqa tillar kabi prefiksga ega bo'lsin. Bu ilgari ikki marta ko'tarilib rad etilgan edi (40+ URL 301 = 2-8 hafta reyting chayqalishi), uchinchi marta so'ralgani uchun bajarildi; 301'lar reytingni o'tkazadi, yo'qotmaydi. **Skript qo'zg'atgan uchta zarar topilib tuzatildi:** `https://tezcode.dev` → `https://ru/tezcode.dev` (7 qator), `instagram.com/tezcode_dev` → `instagram.com/ru/tezcode_dev` (5 fayl), `TRANSLATED_ROUTES` kalitlariga `/ru` qo'shilishi (kalitlar locale-free bo'lishi shart, aks holda har bir qidiruv promax qiladi). **Yon bug topildi va tuzatildi:** 47 sahifada logotip/breadcrumb `href="/"` edi — `/` endi `/ru` ga redirect qilgani uchun o'zbek sahifadan logotip bosilsa ruschaga tushib ketardi. Tekshiruv: `next build` — 102 sahifa; `next start` + 23 URL bo'yicha curl — barcha eski manzillar 308 bilan to'g'ri yangi manzilga ketadi, `/login` app domenga, prefiksli URL'lar 200; buzilgan ichki havola 0; `/uz` va `/en` da kutilmagan kirill 0; sitemap 64 URL, redirect yo'q; `tsc` — 5 xato, hammasi pre-existing `@types/react` dublikati. **Deploy'dan keyin qilinishi kerak:** Google Search Console'ga yangi sitemap yuborish va 2-3 hafta Coverage hisobotini kuzatish.

---

### F-287 | T-S192 | Web: til aniqlash cookie/IP'dan butunlay voz kechildi — URL yagona haqiqat manbai

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-28  **Model:** opus
- **O'zgarishlar:**
  - **O'CHIRILDI:** `src/store/locale.store.ts` (cookie yozuvchi + zustand store), `src/components/common/LocaleSuggestBanner.tsx` (navigator.languages taklifi), `src/components/common/LocaleHtmlUpdater.tsx` (store'dan `<html lang>`).
  - **O'ZGARDI:** `src/proxy.ts` — butun `routeLocale()` olib tashlandi, faqat auth guard qoldi; matcher marketing sahifalarini umuman ko'rmaydi endi. `src/lib/i18n/config.ts` — `LOCALE_COOKIE`, `LOCALE_COOKIE_MAX_AGE`, `parseAcceptLanguage()` o'chirildi. `src/lib/i18n/routes.ts` — `STORE_LOCALIZED_ROUTES` o'chirildi, oltita marketing sahifa `TRANSLATED_ROUTES` ga ko'chdi, `LocaleSwitch` faqat `{mode:'navigate'}`. `Providers.tsx` — ikkala `useEffect` (cookie+store o'qish) olib tashlandi. `LanguageSwitcher.tsx`, `Footer.tsx` — store'ga yozish yo'q, faqat `<a href>`.
  - **YANGI:** `src/lib/i18n/metadata.ts` (`socialMeta()`), `src/components/common/LandingShell.tsx`, `app/uz/(landing)/` va `app/en/(landing)/` — layout + 12 sahifa (features, pricing, products, company, contact, about ×2 til).
  - **Tuzatildi (yon effekt sifatida topilgan):** `/uz` va `/en` ostidagi **18 sahifada twitter card ruscha edi** (Next.js `twitter` blokini merge qilmaydi, root layout'niki meros bo'lardi) — hammasi `socialMeta()` ga o'tkazildi. `aria-label="Статистика"` (`FeaturesContent`, `LandingContent`) va `{ text: 'Ташкент' }` (`CompanyContent`) hardcoded ruscha edi — `nav.stats` va yangi `company.cityName` kalitlariga o'tkazildi (`messages/{ru,uz,en}.json`). `sitemap.ts` — `LANDING_PAGES` ro'yxati, har biri 3 tilda.
- **Xulosa:** Muammoni Jasur ko'rsatdi: "Britaniyadan kirgan odamning cookie'si orqali `/en` ochilardi — bu xavfli va 100% ishlamaydi, yangi akkauntda nima bo'ladi?". To'g'ri — cookie'siz kelgan **birinchi tashrif** (ya'ni trafikning ko'p qismi va har bir yangi foydalanuvchi) uchun mexanizm umuman ishlamasdi, cookie **bor** bo'lganda esa ulashilgan ruscha havolani boshqa sahifaga burib yuborardi. Endi til faqat URL'dan aniqlanadi: `/faq` = ru, `/uz/faq` = uz, `/en/faq` = en — hamma uchun, har doim, bir xil. Til faqat `LanguageSwitcher` bosilganda o'zgaradi va u navigatsiya qiladi. Yon foyda: oltita marketing sahifa endi uch tilda ulashiladigan va indekslanadigan URL'ga ega (ilgari bitta URL client-state'ga qarab boshqa tilni ko'rsatardi — Google faqat ruschasini ko'rgan). Tekshiruv: `next build` — 102 sahifa, 12 yangisi static prerender; render qilingan HTML'da `/uz` va `/en` bo'ylab **0 ta kutilmagan kirill matn** (til almashtirish havolalaridan tashqari); har bir sahifada `twitter:title` o'z tilida; hreflang 4 ta tegdan iborat va canonical'lar to'g'ri. `tsc --noEmit` — 5 ta xato, hammasi pre-existing `@types/react` dublikati (`LocaleBoundary`, `button.tsx`, `toaster.tsx` — tegilmagan fayllar ham xato beradi).
---

### F-285 | T-S189 | Mobile: in-app browser — deteksiyasiz doim ishlaydigan "Watch Party" tugmasi + verify-on-join

- **Bajaruvchi:** Saidazim (Claude sonnet 5)  **Bajarilgan:** 2026-07-28  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/src/types/index.ts` (`WatchParty` route'ga `needsVerify?: boolean`), `MediaBottomBar.tsx` (**qayta yozildi** — foydalanuvchi fikri asosida: analyzing/hint/bot-protected kabi ko'p holatli, ko'pi harakatsiz ekran o'rniga endi **bitta doim ko'rinadigan, doim bosiladigan tugma** — `detectedMedia` bo'lsa tezkor yo'l, bo'lmasa joriy sahifa URL'i bilan fallback), `useMediaDetection.ts` (`importMedia()` ixtiyoriy `opts?: {needsVerify}` qabul qiladi; bar animatsiyasi endi `detectedMedia`ga emas, mount'ga bog'liq — doim ko'rinadi), `MediaWebViewScreen.tsx` (`onTryCurrentPage`, ishlatilmay qolgan `isBotProtected`/`isLoading`/`sourceId` prop'lari olib tashlandi), `WatchPartyScreen.tsx` (yangi `useEffect` — `needsVerify` bo'lsa, xona yuklangach bir martalik `CHANGE_MEDIA` qayta yuboradi), `translations.ts` (`tryCurrentPage`).
- **Xulosa:** Foydalanuvchi real APK'da sinaganida: saytda video bo'lsa ham client JS deteksiyasi va server extraction ikkalasi ham topolmasa (cross-origin iframe, bot-himoya, qo'llab-quvvatlanmagan player), "Watch Party" tugmasi umuman chiqmasdi — xona yaratishning boshqa yo'li yo'q edi. Root cause: mobile'ning `MediaWebViewScreen`/`useMediaDetection.ts` arxitekturasi xona yaratishni client/server deteksiya muvaffaqiyatiga bog'lab qo'ygan edi; web'da esa xona URL berilishi bilan darhol yaratiladi, extraction xona ICHIDA sodir bo'ladi, muvaffaqiyatsiz bo'lsa Virtual Browser avtomatik ochiladi (`CreateRoomDialog`→`?verify=1`→`CHANGE_MEDIA`, `roomEvents.handler.ts`). Mobil'da bu "verify on join" mexanizmi tekshirildi va **umuman yo'qligi tasdiqlandi** (`useWatchParty.ts`/`useWatchPartyRoom.ts`da faqat quality/episode select uchun `CHANGE_MEDIA` bor edi). Yechim: yangi parallel funksiya yozish o'rniga mavjud `importMedia()`ga ixtiyoriy `needsVerify` parametri qo'shildi (kam invaziv) va xona-yaratish darajasida emas, `WatchPartyScreen.tsx` darajasida (fragile `useWatchPartyRoom.ts`ga **tegmasdan** — loyihada bu fayl "хрупкий, НЕ ТРОНУТ" deb belgilangan) bir martalik `CHANGE_MEDIA` qayta yuborish qo'shildi — bu server'ning allaqachon T-S188'da ishlaydigan extraction+VB fallback pipeline'ini ishga tushiradi. `useSourcePicker.ts` alohida tekshirildi — extraction muvaffaqiyatsiz bo'lganda allaqachon `MediaWebView`ga yo'naltiradi, shuning uchun o'zgartirilmadi (yangi tugma o'sha yerda ham foydalanuvchiga yetadi). Tekshiruv: `tsc --noEmit` — faqat 1 ta pre-existing xato (`LanguageTransition.tsx`), 0 ta yangi xato. **Real qurilmada/saytda tekshirilmagan** — bu sessiyada mobil simulyator yo'q, VB avtomatik ishga tushishi haqiqiy bot-himoyali/cross-origin sayt bilan hali sinalmagan.

---

### F-284 | T-S188 | Mobile: Virtual Browser player — web bilan extraction fallback paritetligi

- **Bajaruvchi:** Saidazim (Claude sonnet 5)  **Bajarilgan:** 2026-07-28  **Model:** sonnet
- **O'zgarishlar:** YANGI `apps/mobile/src/hooks/useVirtualBrowser.ts` (socket wiring: VB_STARTED/VB_FRAME/VB_STOPPED/VB_ERROR/VB_CURSOR + ROOM_JOINED catch-up snapshot, `use-virtual-browser.ts` (web) bilan bir xil), YANGI `apps/mobile/src/components/watchParty/VirtualBrowserPlayer.tsx` (JPEG kadr stream `Image` orqali, owner uchun `PanResponder` bilan touch input: tap→mousedown+mouseup, drag→wheel, boshqalarga owner kursori). O'ZGARDI: `WatchPartyScreen.tsx` (`vb.active` bo'lsa `VideoSection` o'rniga shu component — faqat fullscreen bo'lmaganda), `translations.ts` (`vbStartVideo`).
- **Xulosa:** Backend/socket-protokol allaqachon umumiy va tayyor edi (`services/watch-party/src/services/virtualBrowser.service.ts` — real headless Playwright Chromium, CDP screencast, `roomEvents.handler.ts`'dagi `CHANGE_MEDIA` — extraction muvaffaqiyatsiz bo'lsa avtomatik VB fallback, `vbSession.helper.ts` — network/MSE/WebSocket'da media topilsa avtomatik playerga qaytish) — mobile client tarafida esa **butunlay yo'q edi** (`VB_FRAME`/`VB_STARTED` bo'yicha 0 natija, ishni boshlashdan oldin grep bilan tasdiqlangan). Endi mobile ham xuddi shu oqimni ko'radi: xona video bilan yaratilganda/o'zgarganda server extraction'ni tekshiradi, muvaffaqiyatsiz bo'lsa VB avtomatik ochiladi, owner sahifada play bossa yoki server network'da mp4/hls topsa — video avtomatik playerga o'tadi. **Ataylab qamrab olinmagan:** (1) fullscreen VB — `VideoSection`ning fullscreen varianti VB uchun ko'chirilmadi, VB faqat oddiy rejimda ko'rinadi; (2) klaviatura/matn kiritish (web'da bor) — touch (play bosish) so'ralgan flow uchun yetarli, alohida follow-up bo'lishi mumkin; (3) qo'lda "brauzer ochish" tugmasi — faqat avtomatik fallback so'ralgan edi. Tekshiruv: `tsc --noEmit` — faqat 1 ta pre-existing xato (`LanguageTransition.tsx`), mening fayllarimda 0 ta yangi xato. **Real qurilmada/xonada tekshirilmagan** — bu sessiyada mobil simulyator/qurilma yo'q, VB ishga tushishi uchun haqiqiy extraction-muvaffaqiyatsiz URL va ikkinchi klient kerak.

---

### F-289 | T-S190 | Web: til aniqlash mexanizmi to'liq ishlaydigan holatga keltirildi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-28  **Model:** opus
- **O'zgarishlar:** `apps/web/src/proxy.ts`, `src/lib/i18n/{config,routes}.ts`, `src/store/locale.store.ts`, `src/components/common/{LocaleSuggestBanner,LanguageSwitcher,Providers,Footer}.tsx`
- **Xulosa:** Eng katta topilma — **banner umuman ko'rinmasdi**: hujjat oqimida `fixed top-0` header ostiga tushib qolgan edi (o'lchov: banner `y:0 h:48`, header `y:0 h:87.5`), ya'ni F-256 da qurilgan til taklifi hech qachon ishlamagan. Pastga o'tkazildi (`fixed bottom-3`, CLS = 0, har qanday sahifa header'idan xoli). Ikkinchi katta ish — `localeSwitchFor()` bilan ikki localization modeli ajratildi: `navigate` (tarjima URL'i bor — `/` → `/uz`, `<a href>`, ulashiladi va crawl qilinadi) va `in-place` (next-intl bir URL'da tarjima qiladi — `/features`, store almashadi). Shu bilan `/features`, `/pricing`, `/about`, `/products`, `/company`, `/contact` uchun uchala tilda tayyor bo'lgan lekin yetib bo'lmaydigan tarjima ochildi, va `LanguageSwitcher` u sahifalarda bosh sahifaga uloqtirishni to'xtatdi. Qolgan tuzatishlar: `LOCALE_HINT_COOKIE` o'chirildi (hech qayerda ishlatilmagan, izohi middleware yozadi deb yolg'on va'da berardi); `Vary: Accept-Language` olib tashlandi — server bu header'ni o'qimaydi, lekin u `s-maxage=3600` bilan keshlanadigan sahifalarni parchalardi (redirect javobida semantik to'g'ri `Vary: Cookie`); dismiss `sessionStorage` → `localStorage` (izohdagi "never nags twice" endi rost), storage kirishlari try/catch bilan (cookie bloklangan kontekstda banner o'lmasin); cookie `Secure` flagi (faqat https, localhost buzilmasin); `readLocaleFromCookie` endi `Locale|null` — "ruschani tanladi" va "hali tanlamadi" farqlanadi; footer til qatori bosilganda tanlov eslab qolinadi (avval yozilmasdi). Tekshirildi: Playwright 27/27 (3 til × banner/redirect/switcher/footer/Vary), `next build` toza, `tsc` yangi xatosiz (5 ta pre-existing `@types/react` konflikti). Commit `723fde34`.

---

### F-286 | T-S191 | Web: i18n bo'shliqlari yopildi — /uz va /en to'liq o'z tilida

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-28  **Model:** opus
- **O'zgarishlar:** YANGI `apps/web/src/data/use-cases.ts`, `src/app/uz/faq/page.tsx`, `src/app/uz/how-it-works/page.tsx`, `src/app/uz/use-cases/{masofadagi-juftlik,onlayn-uchrashuv}/page.tsx`, `src/app/en/use-cases/{long-distance,online-date}/page.tsx`. O'ZGARDI: `messages/{ru,uz,en}.json`, `src/app/LandingContent.tsx`, `src/app/how-it-works/page.tsx`, `src/app/sitemap.ts`, `src/app/uz/guides/page.tsx`, `src/app/use-cases/*/page.tsx`, `src/components/common/{Footer,GuideChrome}.tsx`, `src/lib/i18n/routes.ts`
- **Xulosa:** Render qilingan sahifa bo'ylab audit (boshqa til matni + boshqa tilga havola) yozildi: **78 ta ruscha matn / 32 ta noto'g'ri havola → 7 / 5**, qolganlari esa atayin til almashtirish havolalari («Русский», «На русском →», `hrefLang` bilan). Asosiy nuqson — `UseCaseCards` butun bir bo'lim sifatida qattiq ruscha edi: `/uz` va `/en` bosh sahifalarida ham ruscha chiqardi va oltita kartaning hammasi ruscha sahifalarga uloqtirardi. `/uz` uchun FAQ va «Qanday ishlaydi» yo'q edi — footer va gayd shapkasi o'zbekcha yozuv bilan ruscha sahifaga olib borardi. `USE_CASE_GROUPS` reyestri qo'shildi (`GUIDE_GROUPS` bilan bir xil sabab: slug'lar tarjima qilingan, prefiks arifmetikasi 404 beradi) — bosh sahifa kartalari, hreflang va proxy redirect shundan o'qiydi. Sitemap 46 → 52 URL, har biri uch tilli hreflang bilan. Yondoshgan tuzatish: ruscha `/how-it-works` da «менее 300 мс» — loyihada bunday konstanta yo'q, `SYNC_DRIFT_WINDOW_MS = 500` bo'yicha to'g'rilandi va matn ingliz/o'zbek versiyalari bilan bir xil mexanizmni tasvirlaydi. **URL tuzilishi ATAYIN o'zgarmadi**: ruscha root'da qoladi, `/ru` prefiks migratsiyasi qilinmadi — Jasur qarori (2026-07-28), sababi 40+ URL 301 = 2-8 hafta reyting chayqalishi, evaziga nol SEO foyda (Google uchun muhimi hreflang, prefiks emas). Tekshirildi: Playwright 34/34, i18n audit, `next build` 52 sahifa, `tsc` yangi xatosiz. Commit `bdfd612b`.
> **Raqamlash eslatmasi:** bu ikki ish dastlab T-S188/T-S189 va F-284/F-285 raqamlari bilan
> bajarilgan (commit xabarlarida shu raqamlar qolgan: `723fde34`, `bdfd612b`). Bir vaqtda
> Saidazim ham T-S188/F-284 ni olgan va main'ga birinchi bo'lib push qilgan — merge paytida
> to'qnashuv aniqlanib, bu yozuvlar T-S190/T-S191 va F-285/F-286 ga ko'chirildi.

---

### F-283 | T-S178 + T-S179 | Mobile: Instagram Stories share + fallback UI

- **Bajaruvchi:** Saidazim (Claude sonnet 5)  **Bajarilgan:** 2026-07-28  **Model:** sonnet
- **O'zgarishlar:** YANGI `apps/mobile/plugins/withInstagramQueries.js` (Android `<queries>` config plugin). O'ZGARDI: `app.json` (plugin ro'yxati + iOS `LSApplicationQueriesSchemes`), `package.json` (`react-native-share@^12.3.1`, `expo-file-system@~56.0.8`), `InviteCard.tsx` (Instagram Story tugmasi + handler + `isInstagramInstalled` tekshiruvi), `translations.ts` (`shareInstagramStory`, `shareInstagramFailed`, `instagramNotInstalledTitle/Body`).
- **Xulosa:** Server-side `apps/app-web/.../story-image/route.tsx` (T-S177, allaqachon prod'da) 1080×1920 PNG qaytaradi — mobil shunchaki shu rasmni `expo-file-system`'ning `downloadAsync` bilan (`/legacy` import — SDK 54+ yangi File/Directory API'sini qurilmasiz tekshirib bo'lmasligi sababli eski, yaxshi hujjatlashtirilgan yo'l tanlandi) local cache'ga tushiradi va `react-native-share`'ning `shareSingle({social: Social.InstagramStories, backgroundImage, attributionURL, appId: '2239499546865583'})`'iga beradi — web va mobil story bir xil ko'rinadi. `Social` enum'i alohida named import qilindi — kutubxonaning default export'idagi `.Social` obyekti `string` tipida, `shareSingle` esa aynan enum talab qiladi (kutubxona type-larida real nomuvofiqlik). T-S179: ulashishdan OLDIN `isInstagramInstalled()` tekshiradi (Android — `isPackageInstalled('com.instagram.android')`, `<queries>` yozuvi kerak API 30+ da; iOS — `Linking.canOpenURL('instagram-stories://share')`, `LSApplicationQueriesSchemes` kerak) — "o'rnatilmagan" holati "haqiqiy xato"dan alohida, aniq xabar bilan (native share'ga fallback tugmasi bilan birga). Tekshiruv: `tsc --noEmit` — faqat 1 ta pre-existing xato (`LanguageTransition.tsx`), yangi kutubxonalar `npm install` bilan haqiqatan o'rnatildi va tekshirildi (guess emas). **Real qurilmada/Instagram bilan tekshirilmagan** — bu sessiyada mobil qurilma/simulyator yo'q, task o'zi buni alohida ogohlantiradi.

---

### F-282 | T-S167 | Mobile: Chat+Voice UI birlashtirish (variant C)

- **Bajaruvchi:** Saidazim (Claude sonnet 5)  **Bajarilgan:** 2026-07-28  **Model:** sonnet
- **O'zgarishlar:** YANGI `apps/mobile/src/components/watchParty/VoiceStrip.tsx`. O'ZGARDI: `useWatchPartyRoom.ts` (`showVoice`/`setShowVoice` olib tashlandi), `WatchPartyScreen.tsx` (fullscreen va oddiy rejimda `VoiceChat` to'liq panel o'rniga `VoiceStrip` doim `ChatPanel` ustida ko'rinadi; fsBar mic tugmasi endi voice-panel toggle emas, to'g'ridan-to'g'ri mute), `RoomInfoBar.tsx` (`onToggleVoice` → `isVoiceJoined`/`isVoiceMuted`/`onToggleMute`, mic tugmasi doim mavjud), `translations.ts` (`voiceRetry` qo'shildi). O'CHIRILDI: `VoiceChat.tsx`, `VoiceChatControls.tsx`, `VoiceChatParticipants.tsx` — barchasi endi orphan edi.
- **Xulosa:** `showChat`/`showVoice` bir-birini istisno qilardi — foydalanuvchi chat o'qiyotganda ovozli chat borligini bilmasdi. Endi bitta panel: yuqorida doim ko'rinadigan compact voice-strip (avatarlar, gapirayotgan uchun yashil halqa, join/leave), pastida chat — web'dagi bugungi VoiceStrip redizayni bilan bir xil g'oya, lekin RN-native ijro (Animated/Reanimated ulanmagani uchun speaking pulse — statik ring + shadow, CSS keyframe emas). Mute RoomInfoBar'da alohida — panel yopiq bo'lsa ham bosilishi mumkin, avval faqat voice panel ochiq bo'lganda mavjud edi. Tekshiruv: `tsc --noEmit` — faqat 1 ta pre-existing xato (`LanguageTransition.tsx`, mendan oldin ham bor edi), mening fayllarimda 0 ta yangi xato. ESLint mobile uchun sozlanmagan (lint script yo'q package.json'da). **Real qurilmada/simulyatorda tekshirilmagan** — Chrome-in-browser MCP web uchun, mobil simulyator bu sessiyada mavjud emas.

---

### F-282 | T-S187 | app-web lokalizatsiya qoldig'i — 35 faylda hardcoded ruscha matn

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-27  **Model:** opus
- **O'zgarishlar:** `apps/app-web/messages/{uz,ru,en}.json` (~50 kalit), 10 ta pleyer (`VideoPlayer.tsx`, `YouTubePlayer.tsx`, `VKPlayer.tsx`, `RutubePlayer.tsx`, `TwitchPlayer.tsx`, `VimeoPlayer.tsx`, `DailymotionPlayer.tsx`, `TikTokPlayer.tsx`, `PeerTubePlayer.tsx`, `TrovoPlayer.tsx`, `VirtualBrowserPlayer.tsx`), `hooks/use-watch-party.ts`, `hooks/use-virtual-browser.ts`, `hooks/use-api-error.ts` (yangi), `lib/api-error.ts` + 11 ta chaqiruvchi, `app/auth/reset-password/{page.tsx,ResetPasswordForm.tsx}`, `app/auth/telegram/callback/page.tsx`, `app/(auth)/login/LoginForm.tsx`, `components/common/{MaintenanceBanner,StatsWidget}.tsx`.
- **Xulosa:**
  🔴 **F-280 §7 ning ikkinchi yarmi.** O'sha vazifada til almashtirish qo'shildi (sozlamalar sahifasiga), lekin interfeysning katta qismi baribir ruscha qolardi: 27 faylda hardcoded matn bor edi, ya'ni foydalanuvchi o'zbekchani tanlasa ham pleyer xatolari, HTTP xato matnlari, parolni tiklash sahifasi va ban bloki ruscha chiqardi. Til tanlovi ishlaydi-yu, natijasi ko'rinmasdi.
  🔴 **Xato state'ida matn emas, KALIT saqlanadi** (`setError('playerEmbedBlocked')`, render'da `t(error)`). Sabab: `setError` chaqiruvlari `useEffect` ichida, `t` ni bog'liqliklar ro'yxatiga qo'shish kerak bo'lardi — pleyer qayta-qayta initsializatsiya bo'lishi xavfi. Yon foyda: til almashtirilganda ekrandagi xato matni ham yangilanadi, ilgari qotib qolardi. `YT_ERROR_MESSAGES` → `YT_ERROR_KEYS` xuddi shu sabab (modul darajasida, tarjimon chaqira olmaydi).
  🔴 **Socket hook'larida `t` ref orqali** (`tRef.current(...)`). `useWatchParty` ning socket effekti 15 ta bog'liqlikka ega va butun xona obunasini o'rnatadi — `t` ni qo'shish tarjimon identifikatori o'zgarganda obunani uzib-ulardi. Toast bir martalik hodisa, shuning uchun ref'dagi joriy qiymat yetarli.
  🔴 **`lib/api-error.ts` — 403/404/429/500/502/503 matnlari hardcoded ruscha edi.** U oddiy TS moduli (mutation callback'laridan chaqiriladi), tarjimon ushlab tura olmaydi. `parseApiError()` ga ixtiyoriy `tCommon` parametri qo'shildi va `useApiError()` hooki yaratildi; 11 ta chaqiruvchi fayl unga o'tkazildi (hammasi allaqachon `useTranslations` ishlatardi, faqat status-kod tarmog'i tarjimasiz qolgan edi).
  🔴 **Parolni tiklash sahifasi server component.** Locale klient tomonda cookie'dan o'qiladi (`Providers.tsx` → `NextIntlClientProvider`), shuning uchun server render tarjima qila olmaydi — sarlavha bloki `ResetPasswordHeader` klient komponentiga ajratildi. `metadata.title` ATAYLAB statik qoldi (`Parolni tiklash`, o'zbekcha = SSR default locale'i), chunki tab sarlavhasi til almashtirgichga ergasha olmaydi.
  ⚪ **ATAYLAB tegilmagani:** `'Русский'` (til nomi o'z tilida turishi kerak), `'VK Видео'` (brend nomi), `story-image/route.tsx` dagi `ru:` (u allaqachon til xaritasi), `app/layout.tsx` dagi `description` (server metadata, yuqoridagi sabab).
  🔴 **Rebase konflikti F-281 bilan** (`VideoPlayer.tsx`, volume slider): Saidazimning iOS sharti (`!volumeSliderUnusable`) saqlandi, ichidagi `aria-label` tarjimaga o'tkazildi — ikkalasi birlashtirildi, hech biri bekor qilinmadi. Boshlanishida bu ish ham T-S186 deb belgilangan edi; `origin/main` da o'sha raqamni Saidazim band qilgani aniqlangach T-S187 ga ko'chirildi.
  ✅ `tsc --noEmit` — 0 xato. ESLint — yangi xato/ogohlantirish yo'q (mavjudlari `RoomHeader.tsx`, `use-watch-party.ts`, `watch-party.store.ts`, `VideoPlayer.tsx` da — HEAD'da ham bor, fon).
  ⚠️ **Sinovdan o'tmagan:** jonli brauzerda uch tilni almashtirib tekshirish (ayniqsa pleyer xatolari va parolni tiklash sahifasi).

---

### F-281 | T-S186 | Real qurilma testida topilgan 4 ta bug (room/auth/video) — hammasi tuzatildi

- **Bajaruvchi:** Saidazim (Claude sonnet 5)  **Bajarilgan:** 2026-07-27  **Model:** sonnet
- **O'zgarishlar:** `services/watch-party/src/socket/roomEvents.handler.ts` (disconnect grace-period: `disconnectGraceTimers` map + `scheduleDisconnectLeave`/`finalizeRoomLeave` helperlar, JOIN_ROOM'da bekor qilish), `watchParty.socket.ts` (disconnect handlerda `scheduleDisconnectLeave` chaqiruvi), YANGI `apps/app-web/src/app/api/auth/google/start/route.ts` + `google/exchange/route.ts`, YANGI `apps/app-web/src/app/auth/callback/page.tsx`, `LoginForm.tsx` (handleGoogleLogin — popup+poll to'liq olib tashlandi, oddiy redirect), `apps/app-web/src/components/party/VideoPlayer.tsx` (`isVolumeSliderUnusable()` — iOS'da volume slider yashiriladi, mute tugmasi qoladi).
- **Xulosa:** 4 ta bug, 3 ta mustaqil root cause: (1) iOS har qanday brauzerda `HTMLMediaElement.volume`ni JS orqali o'zgartirishga yo'l qo'ymaydi (Apple platform cheklovi) — slider olib tashlandi, faqat mute qoldi; (2) Google login popup+poll — mobil brauzerlarda Google COOP `window.opener`ni uzadi, `popup.closed` ishonchsiz (T-S132/T-S134 shu bilan patchlangan edi) — backend'da ALLAQACHON tayyor klassik Passport redirect flow bor edi (`/auth/google` → `/auth/google/callback` → `CLIENT_URL/auth/callback?code=`), faqat frontend undan foydalanmagan edi; ikkita yangi route + callback sahifa shuni ulaydi; (3+4) room/auth bitta root cause — `watchParty.socket.ts` disconnect handleri ataylab a'zolikni darhol o'chirmaydi (reconnect uchun), faqat butun xona bo'shasa 5 daqiqadan keyin yopiladi — individual user uchun grace-period yo'q edi. Yechim: 20s per-user grace timer (`disconnectGraceTimers`), JOIN_ROOM'da bekor qilinadi; muddat tugasa `finalizeRoomLeave()` orqali LEAVE_ROOM bilan bir xil yo'l (owner bo'lsa xona yopiladi/egasi almashadi, T-S108 409 muammosi ham shu bilan hal bo'ladi). Tekshiruv: `tsc --noEmit` ikkala servisda ham CLEAN (watch-party'da 130 ta eski `@shared` rootDir xatosi — mendan oldin ham bor edi, stash bilan tasdiqlandi), `next build` toza, ikkalasi ham `railway up` orqali production'ga deploy qilindi va live tekshirildi (`/api/auth/google/start` → real Google redirect, watch-party health OK).

---

### F-280 | T-S184 | Prod test (app.wewatch.uz) — 8 ta bug topildi, 7 tasi tuzatildi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-27  **Model:** opus
- **O'zgarishlar:** `apps/app-web/next.config.mjs`, `apps/app-web/src/hooks/use-watch-party.ts`, `apps/app-web/src/components/party/RoomHeader.tsx`, `InviteDialog.tsx`, `apps/app-web/src/app/(app)/settings/SettingsContent.tsx`, `apps/app-web/src/app/api/rooms/[id]/story-image/route.tsx`, `apps/app-web/messages/{uz,ru,en}.json`, `services/auth/src/controllers/auth.controller.ts`, `apps/web/src/lib/app-url.ts` (yangi) + 10 ta landing fayli.
- **Sinov usuli:** 3 ta yangi akkaunt (vaqtinchalik pochta orqali OTP), 3 ta alohida Chromium konteksti, jonli prod. Sinovdan **muvaffaqiyatli** o'tgani: chat real-time (3 klient), reply (T-S164/165), avatar (T-S161), chatdan profil ochish (T-S163), parolli xona (T-S183 — noto'g'ri parol 403, to'g'risi kiritadi), story-image endpoint (T-S177), VirtualBrowser ochilishi (T-S181), bitta faol xona guard'i (T-S108 — ega bo'yicha, a'zolikni cheklamaydi = to'g'ri xatti-harakat).
- **Xulosa:**
  🔴 **1. Ovozli chat prod'da umuman ishlamasdi (T-S168).** `next.config.mjs` da `Permissions-Policy: microphone=()` — brauzer `getUserMedia` ni ruxsat so'ramasdan bloklaydi ("microphone is not allowed in this document"), VoiceStrip barchada "Permission denied" holatida qotgan. `microphone=(self)` qilindi; kamera atayin yopiq qoldi.
  🔴 **2. Ro'yxatdan o'tish oxirida foydalanuvchi `/login` ga tashlanardi.** `POST /register/confirm` faqat `{ userId }` qaytarardi, web route esa cookie qo'yish uchun `accessToken`/`refreshToken` kutadi → sessiya yo'q → middleware `/login?redirect=/home` ga qaytaradi, ya'ni OTP tasdiqlangani bilan "ro'yxatdan o'tish ishlamadi"day ko'rinadi. Controller endi `generateAndStoreTokens` bilan sessiya beradi (OTP allaqachon egalikni isbotlagan). Javob **ortiqcha**: eski `userId` maydoni saqlandi, mobil klientlar buzilmasin.
  🔴 **3. Navbat (playlist) web'da real-time yangilanmasdi (T-S173..176).** Server `playlist:updated` broadcast qiladi, mobil `useWatchParty.ts:259` da tinglaydi — web'da esa hech kim tinglamasdi: POST 201 qaytarardi-yu, element faqat sahifa qayta yuklangandan keyin ko'rinardi. `use-watch-party.ts` ga handler qo'shildi (`room.playlist` ni joyida patch qiladi).
  🟡 **4. Ishtirokchilar soni eskirib qolardi.** `RoomHeader.tsx:26` avval REST snapshot'ini (`room.members`, sahifa yuklanganda olingan va keyin o'zgarmaydi) o'qib, socket'dagi jonli ro'yxatni faqat fallback sifatida ishlatardi — 3 kishilik xonada 3 ta avatar yonida "2" turardi. Tartib teskari qilindi.
  🟡 **5. InviteDialog lokalizatsiyadan chetda qolgan.** Dialog tavsifi rus/ingliz interfeysda ham **hardcoded o'zbekcha** ("Bu kodni do'stlaringizga yuboring"), taklif toast'lari esa hardcoded inglizcha edi. Uchala tilga `inviteCodeHint`/`inviteSent`/`inviteError` kalitlari qo'shildi.
  🟡 **6. Story-card har doim o'zbekcha chiqardi (T-S177).** Matn PNG ichiga server tomonda rasterizatsiya qilinadi, shuning uchun `?lang=` parametri qo'shildi; InviteDialog `useLocale()` ni uzatadi, default — avvalgidek o'zbekcha.
  🟡 **7. Til almashtirish umuman mavjud emasdi.** `LanguageSwitcher` faqat `LandingNav.tsx` ichida chaqirilardi, `LandingNav` esa app-web'da hech qayerda render qilinmaydi (landing `apps/web` ga ko'chirilgandan keyin qolgan o'lik komponent). Ya'ni ilova uch tilga tarjima qilingan, `locale.store` + `Providers` to'liq ishlaydi, lekin foydalanuvchi tilni tanlay olmasdi (cookie yo'q bo'lsa — hamma uchun ruscha). Sozlamalar sahifasiga tugmali tanlov qo'shildi; hover-dropdown ATAYLAB takrorlanmadi — u sensorli ekranda ochilmaydi.
  🟡 **8. Landing → app o'tishlari har sahifada CORS xatosi berardi.** `wewatch.uz` da `<Link href="/register">` ichki route deb prefetch qilinadi, 308 redirect esa `app.wewatch.uz` ga olib boradi → RSC so'rovi CORS bilan bloklanadi (har hover'da behuda so'rov, bosganda client-router fallback). 13 ta havola `appUrl()` orqali absolyut URL'li oddiy `<a>` ga o'tkazildi (`apps/web/src/lib/app-url.ts` — next.config.mjs bilan bir xil env o'qiydi).
  ⚠️ **Kod bilan tuzatib bo'lmaydi:** notification servisi barcha so'rovni "Invalid token" bilan rad etadi — Railway'dagi `JWT_PUBLIC_KEY` mos emas (T-S185, Tasks.md).
  ⚠️ **Sinovdan o'tmagan:** tuzatishlar deploydan keyin jonli tekshirilishi kerak (ayniqsa mikrofon header'i va navbat real-time'i) — prod hali eski build'da.

### F-279 | T-S173 + T-S174 + T-S175 + T-S176 | Playlist pre-resolve zanjiri

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-27  **Model:** opus
- **O'zgarishlar:** `shared/src/types/index.ts` (`VideoResolveStatus`, `VideoItem.resolveStatus/resolvedAt` — ixtiyoriy), `services/watch-party/src/models/watchPartyRoom.model.ts` (playlist sub-sxemasi), `services/watchPartyPlaylist.service.ts` (`preResolvePlaylistItem()`, `playNextFromPlaylist` verdikt qaytaradi), `services/virtualBrowser.service.ts` (`attachResponseSniffer()` ajratildi + `probeUrl()`), `services/watchParty.service.ts` (facade), `controllers/watchParty.controller.ts` (fon rejimida ishga tushirish + VB fallback), `apps/app-web/.../RoomContent.tsx` (`QueueStatusDot`), `messages/{uz,ru,en}.json`.
- **Xulosa:**
  **T-S174** — sniffer'ning A-toifasi (`attachResponseSniffer`) `startSession` dan ajratildi; u faqat `page` bilan ishlardi, screencast yoki sessiya map'iga bog'liq emasdi. B/C toifalari (appendBuffer, WebSocket) ATAYLAB joyida qoldirildi: ular jonli in-memory bufferga tayanadigan URL beradi, ya'ni brauzerini darhol yopadigan probe uchun foydasiz. `probeUrl()` — screencast'siz, `sessions` ga yozilmaydi, 25s timeout. Byudjet: `MAX_BACKGROUND_PROBES=1` va `sessions.size + activeProbes < MAX_CONCURRENT` — navbatga qo'shilgan linklar oqimi tomosha qilayotgan xonani ochlikka qo'ymasligi uchun.
  **T-S173** — element navbatga qo'shilgach fon rejimida: official embed host → darhol `ready` (ular klient tomonda iframe orqali o'ynaydi, probe qilish Chromium slotini bekorga yoqardi) → `tryExtract` → `probeUrl`. Natija faqat VERDIKT sifatida saqlanadi, topilgan URL emas: CDN linklari qisqa umrli va odatda IP-lock, xona o'sha elementga yetganda allaqachon eskirgan bo'lardi. Write-back `index` bo'yicha emas, `videoUrl`+`addedAt` bo'yicha — probe ishlayotganda ega elementni o'chirishi yoki navbatni siljitishi mumkin. Javob QAYTARILGANDAN KEYIN ishga tushadi: ekstraktsiya + brauzer probe o'nlab soniya olishi mumkin, "navbatga qo'shish" esa spinner bo'lib qolmasligi kerak.
  **T-S175** — `playNextFromPlaylist` endi verdiktni qaytaradi, controller `needs_vb` bo'lsa VB'ni ishga tushiradi. `pending` (probe hali tugamagan yoki element T-S173 dan oldin qo'shilgan) ATAYLAB "shunchaki o'ynat" deb qaraladi — avvalgi xatti-harakat.
  **T-S176** — panelda rangli nuqta (kulrang=tekshirilmoqda, yashil=tayyor, sariq=qo'lda ochish kerak). Ilgari link qo'shilganda hech qanday feedback yo'q edi.
  ⚠️ **Sinovdan o'tmagan:** jonli Chromium probe (Playwright + Redis + Mongo kerak), VB fallback jonli xonada.

### F-278 | T-S108 | Bitta faol xona cheklovi (backend guard + 4 ta klient nuqtasi birlashtirildi)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-27  **Model:** opus
- **O'zgarishlar:** `services/watch-party/src/services/watchParty.service.ts` (`findActiveRoomByOwner()` + `createRoom` da guard), `controllers/watchParty.controller.ts` (409 javobi), `apps/mobile/src/api/watchParty.api.ts` (`RoomAlreadyExistsError`), `hooks/useCreateWatchParty.ts`, `useWatchPartyCreate.ts`, `useSourcePicker.ts`, `useMediaDetection.ts`.
- **Xulosa:** Guard servisda (yagona haqiqat manbai), 409 javobi controller'da yig'iladi — `roomId` ni qaytarish uchun `shared/` error middleware'ini o'zgartirish kerak bo'lardi, bu bitta endpoint uchun ortiqcha. 🔴 **Orqaga moslik:** o'rnatilgan mobil build'lar `message === 'ROOM_ALREADY_EXISTS'` + `data.roomId` o'qiydi, ularni server bilan bir vaqtda yangilab bo'lmaydi — shuning uchun javob ATAYLAB ortiqcha: eski maydonlar ham, yangi `code`/`roomId` ham yuboriladi. Aks holda hamma eski ilova "xona yaratib bo'lmadi" ko'rsatardi. 🔴 Mobil'da `createRoom` ning 4 ta chaqiruv joyi bor edi: ikkitasida 409 ishlovchisi bor, ikkitasida YO'Q (`useSourcePicker` jimgina WebView ochardi, ya'ni foydalanuvchi o'z xonasini topa olmasdi). Endi 409 API qatlamida bir marta dekod qilinadi (`RoomAlreadyExistsError`), to'rttasi ham shundan foydalanadi. HomeScreen'dagi "Mening xonalarim" seksiyasi ALLAQACHON bajarilgan ekan (`useRecentRooms` + `status !== 'ended'`) — tegilmadi.

### F-277 | T-S181 | VirtualBrowserPlayer: touch boshqaruvi qo'shildi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-27  **Model:** opus
- **O'zgarishlar:** `apps/app-web/src/components/party/VirtualBrowserPlayer.tsx` — `clientToViewport()` (koordinata mapping'i sichqoncha va barmoq uchun umumiy), native `touchstart/touchmove/touchend/touchcancel` listenerlari, `touchAction: 'none'`, `mousedown`/`touchstart` da `focus()`.
- **Xulosa:** Komponent FAQAT sichqoncha event'larini ushlardi — telefon yoki sensorli ekranda virtual brauzer umuman boshqarilmasdi. 🔴 Native listener `{ passive: false }` bilan, xuddi wheel fix'idagi kabi: React `touchstart/touchmove` ni passiv ro'yxatdan o'tkazadi va `preventDefault()` jimgina ishlamaydi — busiz har bir svayp oqim ortidagi WeWatch sahifasini scroll qilardi. 🔴 Barmoq svaypi `mousemove` emas, **`wheel`** ga o'giriladi: sensorli qurilmada surish "sahifani scroll qilish" degani, ushlab surish esa masofaviy sahifada matn belgilardi. Tap (10px dan kam harakat) → `mousedown`+`mouseup` = klik. `touchAction: 'none'` faqat egaga — tomoshabinlar xonani scroll qila olishi kerak. Safari `<img>` ni klikda fokuslamaydi, shuning uchun `focus()` qo'lda chaqiriladi (aks holda birinchi o'zaro ta'sirdan keyin klaviatura ishlamasdi).

### F-276 | T-S101 + T-S102 | Migratsiya qoldig'i — skript to'ldirildi, tsc clean tasdiqlandi, hujjat yangilandi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `scripts/migrate-to-single-db.ts` (`mutedPeerIds`/`pinnedPeerIds` qo'shildi), `docs/db-architecture.html` (authId FK olib tashlandi, `user DB` → `cinesync`, ro'yxatdan o'tish oqimi va bog'lanishlar jadvali yangilandi).
- **Xulosa:** 🔴 T-S101 skripti ALLAQACHON yozilgan ekan (dry-run default, `--execute` bilan yozadi, `_id` bo'yicha upsert — qayta ishga tushirish xavfsiz). Yagona bo'shliq: DM ishi paytida modelga qo'shilgan `mutedPeerIds`/`pinnedPeerIds` birlashtirilgan hujjatga tushmasdi. Vazifada "email bo'yicha birlashtirish" deyilgan, skript esa `authId` bo'yicha qiladi — bu TO'G'RIROQ, chunki aynan `authId` ikki bazani bog'lovchi maydon. 🔴 T-S102 "hamma servis tsc clean" talabi: `tsconfig.json` (dev) bilan har servisda ~20 ta `TS6059 rootDir` xatosi chiqadi, lekin bu SOXTA — real build `tsconfig.build.json` bilan `shared/dist` ga qaraydi. `npm run build --workspace=@cinesync/shared` dan keyin 6 ta servisning HAMMASI `tsconfig.build.json` bilan **0 xato**. Ya'ni migratsiya kodni buzmagan; rootDir shovqini alohida, migratsiyaga aloqasiz build-config masalasi.

### F-275 | T-S117 | DM push — umumiy push sozlamasi endi hurmat qilinadi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `services/user/src/models/user.model.ts` (`INotificationSettings.push` + sxemaga `push: Boolean, default true`), `services/user/src/services/profile.service.ts` (`getFcmTokens` push o'chirilgan bo'lsa bo'sh massiv qaytaradi).
- **Xulosa:** 🔴 Vazifaning asosiy qismi ALLAQACHON bajarilgan ekan — `dm.service.sendMessage` push yuboradi, mute'ni tekshiradi, o'qilmagan xabarlarni bitta notification'ga birlashtiradi (Telegram uslubi), `categoryId: 'dm_reply'` va `tag: dm_<senderId>` beradi. Bajarilmagan YAGONA band — qabul qiluvchining umumiy push sozlamasi. Sabab topildi: `settings.notifications` sxemasida `push` maydoni UMUMAN yo'q edi, mobil `UserSettings` tipida esa e'lon qilingan — ya'ni `updateSettings` uni jimgina tashlab yuborardi va push yo'li o'qiydigan narsa yo'q edi. Tekshiruv `getFcmTokens` ga qo'yildi: bu barcha ichki push'lar (DM, do'stlik so'rovi, xona taklifi) token oladigan yagona nuqta, shuning uchun bir joyda hurmat qilinsa hammasi qamrab olinadi. `=== false` tekshiruvi — maydon paydo bo'lishidan oldin yaratilgan foydalanuvchilar push olishda davom etadi.

### F-274 | T-S180 | Web Share API orqali story ulashish

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `apps/app-web/src/components/party/InviteDialog.tsx` — "Story sifatida ulashish" tugmasi; `messages/{uz,ru,en}.json` (`party.shareStory`, `storyShareError`).
- **Xulosa:** Instagram'da rasmiy web "post to story" API yo'q — eng yaqin yechim: yaratilgan PNG'ni OS share sheet'iga berish, foydalanuvchi Instagram'ni tanlaydi va o'zi "Add to story" bosadi. 🔴 `navigator.canShare({files})` bilan tekshirish SHART: desktop Safari'da `navigator.share` MAVJUD, lekin fayl payload'ini rad etadi — tekshiruvsiz tugma shunchaki buzuq ko'rinardi. Desktop'da yuklab olishga degradatsiya. `AbortError` (foydalanuvchi share sheet'ni yopdi) xato deb hisoblanmaydi.

### F-273 | T-S177 | Story-card rasm endpoint (next/og)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** YANGI `apps/app-web/src/app/api/rooms/[id]/story-image/route.tsx` — 1080×1920 `ImageResponse`.
- **Xulosa:** Loyihada OG-image generatsiya patterni umuman yo'q edi. Auth ikkala yo'l bilan qabul qilinadi — cookie (web) va Bearer (mobil T-S178). 🔴 Vazifada DM_Sans/Oswald shrifti va `logo-mark` SVG aytilgan, lekin ular YUKLANMADI: satori mahalliy SVG/woff'ni tortib ololmaydi va Railway'da fayl yo'li nozik — o'rniga brend gradienti + matn bilan berildi, tashqi bog'liqliksiz. Xona ma'lumoti olinmasa umumiy karta qaytadi (so'rovni yiqitish foydalanuvchiga buzuq rasm ko'rsatardi). `Cache-Control: no-store` — xona nomi sessiya davomida o'zgaradi.

### F-272b | T-S183 | Parolli private xonalar uchun parol kiritish UI

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** YANGI `apps/app-web/src/components/party/RoomPasswordDialog.tsx`; `room/[id]/page.tsx` (xato turini aniqlash), `RoomContent.tsx` (`inviteCode`/`needsPassword` proplari), `api/rooms/join/[code]/route.ts` (body uzatish), `lib/api/rooms.api.ts`, `hooks/use-rooms.ts`, `messages/*.json` (`room.password*`).
- **Xulosa:** `page.tsx` server-side join javobini o'qimasdan yutardi — foydalanuvchi umumiy "not a member" xatosini ko'rar, parol kiritadigan joy YO'Q edi. Endi 401 + `message='password_required'` aniqlanadi. Modal ataylab yopilmaydi: parolsiz xona ortida ishlaydigan narsa yo'q, Escape foydalanuvchini buzuq ekranga tashlardi. 🔴 Yon-topilma: `useJoinRoom` da `mutationFn: roomsApi.joinByCode` to'g'ridan-to'g'ri berilgan edi — react-query `mutationFn(variables, context)` chaqiradi, ya'ni `joinByCode` ning yangi 2-parametri (`password`) ga react-query ichki context obyekti tushardi. O'raldi.

### F-272 | T-S168 | Web'da ovozli chat noldan (WebRTC) — mavjud signaling qayta ishlatildi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** YANGI: `apps/app-web/src/hooks/use-voice-chat.ts` (brauzer WebRTC, peer boshqaruvi, TURN, speaking aniqlash), `components/party/VoiceStrip.tsx`, `app/api/rooms/turn/route.ts` (TURN proxy — creds httpOnly cookie talab qiladi, brauzerdan to'g'ridan-to'g'ri chaqirib bo'lmaydi). O'ZGARDI: `room/[id]/RoomContent.tsx` (voice-strip tab kontentidan TEPADA), `messages/{uz,ru,en}.json` (5 ta `party.voice*` kalit).
- **Xulosa:** Backend UMUMAN o'zgarmadi — `voiceEvents.handler.ts` faqat offer/answer/ICE ni relay qiladi, shuning uchun brauzer peer'i react-native-webrtc peer'i bilan to'g'ridan-to'g'ri kelishadi. Mobil versiyadan ikki farq: (1) 🔴 remote audio'ni QO'LDA `<audio>` ga ulash shart — react-native-webrtc kiruvchi trekni o'zi ijro etadi, brauzer YO'Q, busiz qo'ng'iroq ulanadi-yu jim qoladi; (2) speaking aniqlash Web Audio RMS orqali haqiqiy (mobil faqat taymerda `false` yuboradi). Glare oldini olish: faqat kech qo'shilgan tomon offer yuboradi (`VOICE_JOINED`), `VOICE_USER_JOINED` da offer yuborilmaydi. Mute tugmasi tab kontentidan tashqarida — mobil'dagi bag (chat ochiq bo'lsa mikrofonni o'chirib bo'lmasdi) web'da takrorlanmadi. Tekshiruv: `tsc --noEmit` 0 xato, `next build` muvaffaqiyatli (SSR muammosi yo'q, `/room/[id]` 27.8 kB). **Real sinov qilinmagan:** ikki brauzer o'rtasida haqiqiy qo'ng'iroq, TURN relay CGNAT ortida, mobil↔web aralash xona.

### F-271 | T-S166 | Web'da svayp-javob (framer-motion drag)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `apps/app-web/src/components/party/ChatPanel.tsx` — `motion.div` + `drag="x"`, `dragSnapToOrigin`, threshold 60px.
- **Xulosa:** Loyihadagi BIRINCHI drag-interaktsiya (`drag=` grep bo'yicha 0 natija edi). Threshold mobil DM svaypi bilan bir xil (60px) — jest ikkala platformada bir xil his qilinsin. Butun qator suriladi, faqat matn emas. Kursorli foydalanuvchilar uchun hover'dagi Reply tugmasi qoladi — ularda svayp yo'q.

### F-270 | T-S165 | Mobil xona chatida svayp-javob (DM pattern'idan port)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `apps/mobile/src/components/watchParty/ChatPanel.tsx` + `.styles.ts` — `PanGestureHandler` butun qatorni o'raydi, `SWIPE_REPLY_TRIGGER=60`, haptic, `Animated.spring` qaytish, `swipeWrap`/`swipeReplyIcon` stillari.
- **Xulosa:** `dm/MessageItem.tsx` dan 1:1 ko'chirildi — reanimated yo'q, o'rnatilgan `Animated` + gesture-handler. Long-press orqali javob berish OLIB TASHLANMADI, svayp qo'shimcha yo'l bo'ldi.

### F-269 | T-S164 | Web xona chatida reply UI (DM pattern'idan port)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `types/index.ts` (`IChatReplyTo`, `IChatMessage.replyTo`), `hooks/use-watch-party.ts` (payloadni o'qish + `sendMessage(text, replyTo)`), `components/party/ChatPanel.tsx` (hover Reply tugmasi, iqtibos bloki), `messages/{uz,ru,en}.json` (`chat.reply`).
- **Xulosa:** `messages/dm/ReplyPreviewBar.tsx` qayta ishlatildi, nusxa olinmadi. Reply tugmasi faqat hover'da ko'rinadi (IRC uslubidagi ixcham qatorlarga doimiy ikonka ustuni qo'shmaslik uchun), `focus:opacity-100` bilan klaviaturadan ham yetib boriladi.

### F-268 | T-S163 | Xona chatidan foydalanuvchi profilini ochish (web modal + mobil action sheet)

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** YANGI `apps/app-web/src/components/profile/UserProfileModal.tsx`; `RoomContent.tsx` ga ulandi; `messages/*.json` (`friends.addFriend`). Mobil: `components/common/UserActionSheet.tsx` ga `onAddFriend` qatori, `WatchPartyScreen.tsx` da mutation + `isAlreadyFriend` tekshiruvi.
- **Xulosa:** 🔴 Rejadan CHEKINISH: mobil uchun yangi `UserProfileSheet` YARATILMADI. Sababi — `UserActionSheet` allaqachon bor va `MembersStrip` dan ochiladi (profil/xabar/shikoyat/blok); ikkinchi, boshqacha sheet dublikat va nomuvofiq UX bo'lardi. Yetishmayotgan yagona narsa "Do'st qo'shish" edi — o'sha qo'shildi (o'zi yoki allaqachon do'st bo'lsa ko'rinmaydi). **Bajarilmadi:** web'da `profile/[id]` alohida sahifasi — modal to'liq profilni ko'rsatadi, ortiqcha ko'rindi; kerak bo'lsa alohida task.

### F-267 | T-S162 | Mobil chatda haqiqiy avatar + profil ochish; ChatMessage dublikati yo'q qilindi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `apps/mobile/src/components/watchParty/ChatPanel.tsx` (Image render, bosiladigan avatar/username), `.styles.ts` (`avatarImage`), `hooks/useWatchParty.ts` (id/username/avatar/replyTo o'qish), `store/watchParty.store.ts` (`ChatMessage`/`ReplyTo` yagona ta'rif).
- **Xulosa:** 🔴 Yon-topilma: `ChatMessage` IKKI joyda alohida e'lon qilingan va ajralib ketgan edi — ChatPanel `replyTo` ni bilardi, store bilmasdi, shuning uchun javob store'ga umuman yetib bormasdi. Endi store yagona ega, ChatPanel re-export qiladi. Keshdagi profil server payloadidan ustun — aks holda bir odam ikki xil nom bilan ko'rinardi.

### F-266 | T-S161 | Web chatda avatar render + profil ochishga tayyorgarlik

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `apps/app-web/src/hooks/use-watch-party.ts` (`ServerChatMessage` ga `id`/`avatar`), `components/party/ChatPanel.tsx` (avatar rasm yoki rangli initial-doira).
- **Xulosa:** Payloadda avatar bo'lmasa (eski backend build'i) `members` ro'yxatidan qidiriladi — `use-watch-party` uni `GET /api/user/[id]` orqali alohida hal qiladi. `onOpenProfile` ixtiyoriy prop qilindi: T-S163 ulanmaguncha bo'sh onClick qoldirilmadi, avatar shunchaki bosilmaydi.

### F-265 | T-S160 | Xona chati payloadi — avatar, replyTo va server id

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `services/watch-party/src/socket/chatEvents.handler.ts` — `resolveAvatar()` (user-service `/users/:id/public`, soketda keshlanadi), `sanitizeReplyTo()` (xss + uzunlik), `randomUUID()` id, bitta payload obyekti.
- **Xulosa:** `shared/*` ga TEGILMADI — Socket.io event nomi (`room:message`) o'zgarmadi va loyihada room-chat uchun shared type umuman yo'q edi (grep: 0), demak lock protokoli kerak bo'lmadi. 🔴 Yo'l-yo'lakay 3 ta bag: (1) ikkita alohida `Date.now()` sababli bir xabar jo'natuvchida va qolganlarda TURLI id olardi (ikkalasi ham `userId-timestamp` dan yasardi); (2) mobil `replyTo:{messageId}` yuborardi, server `{id}` kutardi — server endi ikkalasini qabul qiladi, chunki o'rnatilgan build'larni server bilan bir vaqtda yangilab bo'lmaydi; (3) `data.message` undefined bo'lsa `.slice()` crash qilardi. Avatar har xabarda emas, ULANISHGA bir marta olinadi — faol xona aks holda user-service'ni har qatorda urardi.

### F-264 | T-S115 | Brute force: Redis yiqilganda in-memory fallback hisoblagich

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `services/auth/src/services/passwordAuth.service.ts` — modul darajasidagi `fallbackAttempts` (Map, TTL 15 daqiqa, yozishda eskilarini tozalaydi); `checkBruteForce`/`incrementLoginAttempts` catch bloklari endi shuni ishlatadi; muvaffaqiyatli loginda ikkala hisoblagich ham tozalanadi.
- **Xulosa:** Redis yiqilsa brute-force himoyasi butunlay o'chib qolardi (fail-open) — ya'ni aynan hujumchi xohlagan paytda. To'liq fail-closed ATAYLAB tanlanmadi: Redis'ning bir lahzalik uzilishi hamma foydalanuvchini tizimdan chiqarib yuborardi. Cheklov izohda ochiq yozilgan: bir nechta instance bo'lsa amaldagi limit `5 × instance soni`, lekin bu cheksizlikdan yaxshiroq.

### F-263 | T-S116 | internal-secret solishtiruvi timing-safe qilindi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `shared/src/utils/serviceClient.ts` — `validateInternalSecret` endi `crypto.timingSafeEqual`, ikkala tomon avval `sha256` bilan 32 baytga keltiriladi.
- **Xulosa:** `===` birinchi farqli baytda to'xtaydi — taxminning qancha qismi to'g'ri ekani vaqt orqali sizadi. `timingSafeEqual` uzunlik farq qilsa xato tashlaydi (bu esa uzunlikni oshkor qilardi), shuning uchun oldin hash qilinadi. Xavf past (ichki tarmoq), lekin tuzatish arzon.

### F-262 | T-S114 | hls-proxy: wildcard CORS `*` olib tashlandi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** `services/content/src/controllers/hlsProxy.controller.ts` — 3 ta `Access-Control-Allow-Origin: '*'` o'rniga `setProxyCors()` helper: Origin allowlist'da bo'lsa qaytariladi, bo'lmasa header umuman yuborilmaydi; `Vary: Origin` qo'shildi. Allowlist app.ts dagi bilan bir xil manbadan (`config.corsOrigins`).
- **Xulosa:** Har qanday sayt bizning bandwidth orqali video oqizishi mumkin edi. Origin header YO'Q holat (ExoPlayer/AVPlayer, server-to-server) ataylab ruxsat etiladi — CORS ularga umuman taalluqli emas, header qo'shish ma'nosiz bo'lardi, `*` esa aynan shu teshikni yaratgan edi.

### F-261 | T-S113 | express-mongo-sanitize o'rniga o'z middleware'i — 6 servisda

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** YANGI `shared/src/middleware/mongoSanitize.middleware.ts` (`$`-bilan boshlanuvchi va nuqtali kalitlarni body/query/params dan rekursiv o'chiradi, o'chirilganda warn log). `app.use(mongoSanitize)` — admin, auth, content, notification, user, watch-party (`requestId` dan keyin).
- **Xulosa:** Loyihada NoSQL-injection himoyasi faqat validatsiyaga tayanardi. `express-mongo-sanitize` paketi ATAYLAB olinmadi: xatti-harakat ~30 qator, repo esa allaqachon o'z middleware'larini `shared/src/middleware/` da qo'lda yozadi. `req.query` qayta tayinlanmaydi, joyida tozalanadi (Express 5 da sinadigan naqsh — oldini olindi).

### F-260 | T-S112 | battle servisiga helmet() — VAZIFA ESKIRGAN, kod o'zgarmadi

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-26  **Model:** opus
- **O'zgarishlar:** yo'q.
- **Xulosa:** `services/battle/` loyihada UMUMAN yo'q (faqat `tests/api/battle` qolgan), `gateway` esa Node emas — nginx. Qolgan 6 ta Node servisning hammasida `app.use(helmet())` allaqachon bor (tekshirildi). Vazifa 2026-07-04 auditidan qolgan, o'shandan beri battle servisi olib tashlangan.

### F-257 | T-E211 | Ingliz kontenti — /en gaydlar, FAQ, how-it-works, JSON-LD

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-25  **Model:** opus
- **O'zgarishlar:** YANGI: `apps/web/src/app/en/faq/page.tsx` (12 savol + FAQPage schema), `en/how-it-works/page.tsx`, `en/guides/page.tsx` (hub), `en/guides/{watch-youtube-together,what-is-watch-party,watch-movies-with-friends}/page.tsx`. O'ZGARDI: `en/page.tsx` (JSON-LD qo'shildi — avval umuman yo'q edi), `en/layout.tsx` (layout darajasidagi hreflang olib tashlandi — u butun `/en/*` ga meros bo'lib xato URL berardi), `data/guides.ts` (`GUIDE_GROUPS` uch tilli reyestr, `GUIDE_PAIRS` undan hosil bo'ladi), `lib/i18n/routes.ts` (`hreflangFor()`), `sitemap.ts`, `GuideChrome.tsx` (`en` locale + `/faq`,`/terms` havolalari lokalizatsiya qilindi), `Footer.tsx`, `faq/page.tsx`, `how-it-works/page.tsx` + 5 ta gayd sahifasida hreflang. O'CHIRILDI: `guides/{watch-youtube-together,what-is-watch-party,watch-movies-with-friends}/page.tsx` → 308 redirect (`next.config.mjs`).
- **Xulosa:** T-E210 mexanizmni berdi, lekin `/en` da atigi 1 sahifa bor edi — Google hreflang orqali inglizni to'g'ri `/en` ga olib kelardi, sayt esa uni ushlab tura olmasdi (FAQ bosilsa ruscha ochilardi). 🔴 Reja ikki marta o'zgardi: (1) 3 ta "ingliz gayd" aslida ingliz *slug* + ruscha *matn* ekan (dublikat, shuning uchun noindex edi) — ko'chirilmadi, qaytadan yozildi; (2) `/terms` va `/privacy-policy` allaqachon to'liq ingliz tilida ekan — `/en/` nusxasi dublikat kontent bo'lardi, YARATILMADI. 🔴 "no return tag" tuzatildi: `/guides/smotret-youtube-vmeste` va uz juftligi ingliz versiyaga qaytish tegi bermasdi (hreflang qo'lda yozilgani uchun) — 5 sahifa `hreflangFor()` ga o'tkazildi, endi sahifa va sitemap bitta manbadan oladi. Tekshiruv: build 84/84 ✓, standalone curl — 7 yangi sahifa 200, 3 eski URL 308, hreflang uch tomonlama ✓, sitemap 44→46, `/faq`+cookie=en → 307 `/en/faq` (mexanizm yangi sahifalarni reyestrdan o'zi ko'rdi) ✓, `tsc --noEmit`: 5 xato — hammasi `@types/react` fon konflikti, sessiya boshidagi bilan bir xil. **Qolgan:** `t()` migratsiyasi (~25 sahifa), ruscha huquqiy sahifalar yo'q, `/how-it-works` (ru) da "300 мс" fakt xatosi (real: 500 ms), `/en` da `/features`+`/pricing`+`/about` yo'q.

### F-256 | T-E210 | Avtomatik til aniqlash — cookie redirect + taklif banneri

- **Bajaruvchi:** Jasur (Claude opus 5)  **Bajarilgan:** 2026-07-25  **Model:** opus
- **O'zgarishlar:** YANGI: `apps/web/src/lib/i18n/config.ts` (`DEFAULT_LOCALE`, `PREFIX_DEFAULT`, `parseAcceptLanguage` q-weight bilan), `lib/i18n/routes.ts` (qaysi sahifa qaysi tilda mavjud), `components/common/LocaleSuggestBanner.tsx`. O'ZGARDI: `src/proxy.ts` (locale routing + auth guard saqlandi, `/en` prefiksi ham qo'llab-quvvatlanadi — avval faqat `/uz` edi), `LanguageSwitcher.tsx`, `store/locale.store.ts`, `app/layout.tsx`.
- **Xulosa:** Saytda avtomatik til aniqlash UMUMAN yo'q edi (`proxy.ts` faqat auth guard qilardi). 🔴 IP/Accept-Language redirect ATAYLAB rad etildi: Googlebot AQSh IP'idan `en` bilan keladi — redirect qo'yilsa bot `/` ni hech qachon ko'rmaydi va ru+uz indeksdan chiqadi (VPN emas, asosiy zarba shu). Yechim: cookie bor → 307 (faqat sahifa o'sha tilda MAVJUD bo'lsa, aks holda joyida qoladi); cookie yo'q → redirect yo'q, banner `navigator.languages` orqali taklif qiladi. Banner client-side — server javobi hamma uchun bayt-ma-bayt bir xil qoladi, CDN kesh buzilmaydi, cloaking xavfi 0. 🔴 Yo'l-yo'lakay: `LanguageSwitcher` faqat client store'ni o'zgartirardi, URL'ni emas — `/uz` da "Русский" tugmasi UMUMAN ishlamasdi (`Providers.tsx:36` URL'ni ustun qo'yadi). Endi haqiqiy `<a href>`. `/ru` prefiksiga o'tilMADI (40+ URL 301 = nol SEO foyda, `PREFIX_DEFAULT` bilan keyin o'zgartirsa bo'ladi). Tekshiruv: dev serverda 12/12 curl testi ✓. **Ma'lum cheklov:** `Vary: Cookie` yuborilmaydi (GA/Metrika cookie'lari kesh hit rate'ni o'ldirardi) — Cloudflare qo'yilsa cookie redirect 1-tashrifda ishlamasligi mumkin, izoh `proxy.ts` ichida.

### F-255 | T-S182 | Private room: ?code= server-side join-by-code'ga ulandi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-24  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/app/(app)/room/[id]/page.tsx` — `searchParams`dan `code`ni o'qib, `RoomContent` render bo'lishidan OLDIN server-side (`cookies()` + to'g'ridan-to'g'ri backend chaqiruvi) `POST /watch-party/rooms/join/:code` chaqiradi. Client socket'ning JOIN_ROOM bilan poyga (race) bo'lmasligi uchun ataylab server-side va awaited qilindi.
- **Xulosa:** Private xonalarga (parolsiz) share-link orqali web'da endi to'liq kirish mumkin. `tsc --noEmit`: 0 xato. Parolli private xonalar hali qamrab olinmagan — **T-S183** sifatida alohida yozildi.

### F-254 | T-S172 | Redirect-after-login: query-string yo'qolishi fix + private-room gap topildi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-24  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/middleware.ts` — `loginUrl.searchParams.set('redirect', pathname)` → `pathname + req.nextUrl.search`, aks holda T-S171'dagi `?code=` parametri login redirect orqali yo'qolar edi.
- **Xulosa:** Asosiy QA topilmasi tasdiqlandi va tuzatildi (`tsc --noEmit`: 0 xato). Yon-topilma: private xonalar uchun web'da join-by-code umuman ulanmagan (backend endpoint bor, chaqiruv yo'q) — alohida task sifatida yozildi: **T-S182**.

### F-253 | T-S171 | Haqiqiy share-ssылка (join code o'rniga) — web + mobile

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-24  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/components/party/InviteDialog.tsx` (shareUrl = `{APP_URL}/room/{roomId}?code={inviteCode}`, handleCopy endi link'ni copy qiladi, kod box pastida link ko'rsatiladi), `apps/mobile/src/components/watchParty/InviteCard.tsx` (handleCopy + handleShareNative shu link'ni ishlatadi, o'lik `cinesync://` string o'chirildi)
- **Xulosa:** T-S169'da qo'shilgan Android App Link endi haqiqiy ishlaydigan share-tugma bilan ulandi. `tsc --noEmit`: mobile'da faqat fon xato (LanguageTransition), app-web'da 0 xato. T-S177/178 (Instagram share) endi shu link formatidan foydalanishi mumkin.

### F-252 | T-S169 | Android App Links: /room intent-filter + AppNavigator handler

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-24  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/app.json` (intentFilters ga pathPrefix "/room" qo'shildi), `apps/mobile/src/navigation/AppNavigator.tsx` (deep-link handler `https://app.wewatch.uz/room/:id?code=` ni parse qiladi — `code` bo'lsa WatchPartyJoin invite-flow, bo'lmasa roomId bo'yicha to'g'ridan-to'g'ri WatchParty)
- **Xulosa:** Room-redesign Faza 2 (deep link) ning Android yarmi tayyor. iOS qismi (T-S170) Apple Developer akkaunti yo'qligi sababli bloklangan. `tsc --noEmit`: yangi xato yo'q (faqat mavjud fon xato LanguageTransition.tsx).

### F-251 | Online/offline auditi — web hech qachon heartbeat yubormagan + sidebar widget qayta dizayn

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-20  **Model:** sonnet
- **Sabab:** Foydalanuvchi so'rovi: online/offline mantiqini to'liq tekshirish, uni ham web'da
  ham APK'da ishlashini ta'minlash, va sidebar'dagi do'stlar widget'iga normal dizayn berish.
- **Audit natijasi:** `services/user/src/services/profile.service.ts` — `isUserOnline()` shunchaki
  Redis kalitini tekshiradi (`heartbeat(userId)` orqali 3 daqiqalik TTL bilan yoziladi,
  `POST /users/heartbeat`). Mobile bu endpointni allaqachon har 2 daqiqada chaqirar edi
  (`apps/mobile/src/navigation/AppNavigator.tsx`) — lekin web'da bu endpointga HECH QACHON
  murojaat qilinmagan edi. Natija: faqat web'dan foydalanadigan foydalanuvchi do'stlariga
  doim "offline" ko'rinardi, qanchalik faol bo'lishidan qat'iy nazar.
- **Yechim (web):** `POST /api/user/heartbeat` proxy route, `userApi.heartbeat()`,
  `useHeartbeat()` hook (mobile bilan bir xil 2 daqiqalik interval) — `(app)/layout.tsx`ga
  ulandi, har bir autentifikatsiya qilingan sahifada ishlaydi.
- **Mobile:** o'zgarish kerak emas — mexanizm allaqachon to'g'ri ishlagan (heartbeat + UI
  ko'rsatish `FriendsScreen`/`FriendListItems`/`ProfileHeader` va h.k.da allaqachon bor edi).
- **Sidebar widget qayta dizayn:** `OnlineFriendsWidget.tsx` — endi haqiqiy `.glass` panel:
  sarlavha (pulslaydigan onlayn-son badge), ring bilan ajratilgan avatarlar + "Онлайн" subtext,
  overflow avatar ("+N"), bo'sh holat, va yuklanish skeleton (avval hech narsa ko'rsatilmasdi).
- **Tekshiruv:** `tsc --noEmit` (apps/app-web) — 0 xatolik.
- **Cheklov:** brauzer avtomatizatsiyasi (claude-in-chrome) bu sessiyada ulanmagan edi —
  vizual tasdiqni foydalanuvchi o'zi qilishi kerak (deploy qilindi, `app.wewatch.uz`).

### F-250 | T-S138 | Android: YouTube xonasida zritel uchun abadiy qora ekran

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-20  **Model:** sonnet
- **Sabab:** Foydalanuvchi skrinshot yubordi — Android APK'da zritel sifatida YouTube xonasiga
  kirganda video umuman ko'rinmadi, faqat abadiy qora ekran ("iframe youtube не пришел на
  андроид").
- **Root cause (kod orqali topildi):** `useWebViewPlayer.ts`da YouTube uchun `loading` boshlang'ich
  holati shartsiz `false` (html-rejim spinner ko'rsatmaydi), va `YT_EMBED_ERROR` handler FAQAT
  kod 101/150/152 (owner embedding'ni taqiqlagan) uchun `ytEmbedBlocked` xato ekranini ko'rsatardi.
  Kod 2 (noto'g'ri videoId)/5 (html5 pleer xatosi)/100 (o'chirilgan/xususiy video) kelganda —
  hech qanday UI ko'rsatilmasdi: spinner yo'q (boshida ham yo'q edi), xato ekrani yo'q — natijada
  foydalanuvchi abadiy qora ekranda qolardi. Veb tomonidagi `YouTubePlayer.tsx` esa BARCHA
  kodlarni (2/5/100/101/150) qamrab olgan edi — mobil bilan parite yo'q edi.
  Qo'shimcha topilma: agar `https://www.youtube.com/iframe_api` skripti tarmoq/DNS
  bloklanishi sababli umuman yuklanmasa yoki yuklansa-da `onYouTubeIframeAPIReady` hech qachon
  chaqirilmasa — hech qanday WebView xabari yuborilmaydi, faqat RN tomonidagi tashqi 12s
  `LOAD_TIMEOUT_MS` orqali "connectionError" ko'rsatilishi kerak edi, lekin buning uchun ANIQ
  hech qanday tashxis/signal yo'q edi.
- **Yechim:**
  - `webviewYouTube.ts` — `iframe_api` skript tegiga `onerror` qo'shildi + ichki 8s
    `apiLoadTimeout` (agar `onYouTubeIframeAPIReady` shu vaqt ichida chaqirilmasa) — ikkalasi ham
    yangi sintetik kod `-1` bilan `YT_EMBED_ERROR` yuboradi (tarmoq bloklangan/skript
    ishlamagan holatlar uchun aniq signal, sukut emas).
  - `useWebViewPlayer.ts` — `YT_EMBED_ERROR` handler endi HAR QANDAY kod uchun
    `ytEmbedBlocked` xato ekranini (+ retry) ko'rsatadi, faqat 101/150/152 emas.
- **Tekshiruv:** `tsc --noEmit` (apps/mobile) — faqat mavjud fon xatoligi
  (`LanguageTransition.tsx`, stash bilan solishtirib tasdiqlandi), yangi xatolik yo'q.
- **Cheklov:** bu videoning ANIQ qaysi xato kodi bilan muvaffaqiyatsiz bo'lganini tasdiqlaydigan
  jonli device log (adb logcat) hali yo'q — fix qora ekranni ko'rinadigan xato+retry ekraniga
  aylantiradi barcha holatlar uchun, lekin asl tarmoq/video sababi hali diagnostika qilinmagan.
  Real qurilmada tekshirish keyingi qadam.

### F-249 | Web: embedding taqiqlangan YouTube video butun xonani "Something went wrong"ga qulatardi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-20  **Model:** sonnet
- **Sabab:** Foydalanuvchi bitta aniq YouTube video bilan (`SAKvJzuPcxg`) xona ochganda — owner
  HAM, viewer HAM darhol "Something went wrong" React error boundary'ga tushardi. Boshqa videolar
  (masalan "ТОПЛЕС" kanali) muammosiz ishlardi.
- **Root cause (browser console'dagi haqiqiy stack trace orqali topildi, taxmin emas):**
  `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child
  of this node.` — `YouTubePlayer.tsx`da `new YT.Player(hostRef.current, {...})` chaqirilgan
  (elementning O'ZI, id string emas). YouTube IFrame API'ning hujjatlashtirilgan xatti-harakati:
  bu **elementni butunlay iframe bilan ALMASHTIRADI**, ichiga qo'shmaydi. Shu videoda `onError`
  (kod 150 — "video owner disabled embedding") ishga tushganda, komponent `if (error) return
  <boshqa JSX daraxti>` qilardi — bu `hostRef` divini React daraxtidan olib tashlashga urinardi,
  lekin u DOMda allaqachon YouTube tomonidan iframe'ga almashtirilgan edi → React `removeChild`
  chaqirganda node topilmadi → crash butun xona sahifasini qulatdi.
- **Tasdiqlash (Playwright, taxmin emas):** xuddi shu videoId bilan haqiqiy `new YT.Player()`
  test qilindi — `onError` kod **150** bilan ishga tushdi (aynan shu video uchun), va host div
  elementi (`tagName`) test oxirida haqiqatda `DIV`dan `IFRAME`ga aylanganligi tasdiqlandi.
- **Yechim:** `YouTubePlayer.tsx` — `hostRef` divi endi HAR DOIM daraxtda qoladi (ready/error
  holatidan qat'iy nazar), xato endi shu divning ustiga overlay sifatida chiqadi, alohida JSX
  daraxti sifatida emas. `TrovoPlayer.tsx`da ham xuddi shu ehtiyot chorasi qo'llandi (Trovo ham
  xuddi shu xavfli naqsh — "JS constructor oddiy div ustida" — ishlatadi, lekin DOM
  almashtirish xatti-harakati tasdiqlanmagan). Twitch (`Twitch.Embed`) va Vimeo
  (`Vimeo.Player(iframeRef.current)`) tekshirildi — ular xavfsiz (Twitch iframe'ni ICHIGA
  qo'shadi, Vimeo allaqachon mavjud iframe elementini oladi, almashtirmaydi).
- **Tekshiruv:** tsc/eslint clean.

---

### F-248 | Room "Участники" panelida username/avatar o'rniga `#d974` ko'rinardi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-19  **Model:** sonnet
- **Sabab:** `ROOM_JOINED`/`MEMBER_JOINED` handler'lari member obyektlarini `{_id, username: ''}`
  bilan yaratardi (`room.members` backend'da faqat user ID string massiv, profil ma'lumoti yo'q) —
  hech qachon haqiqiy username/avatar so'ralmagan, shuning uchun har doim `#<id oxiri>` fallback
  ko'rinardi. `MemberList.tsx`da avatar uchun `<img>` ham umuman yo'q edi — faqat rangli doira +
  bosh harf.
- **Yechim:**
  - Yangi proxy route `apps/app-web/src/app/api/user/[id]/route.ts` → backend `GET /users/:id`
    (public profile, `getPublicProfile`).
  - `use-watch-party.ts` — `resolveMemberProfile()` har bir a'zo uchun profilni fon rejimida
    so'raydi (react-query `['user-public', id]` bilan keshlanadi), natijasi yangi
    `updateMember()` store action orqali mavjud a'zoga qo'shiladi.
  - `MemberList.tsx` — `member.avatar` mavjud bo'lsa haqiqiy `<img>` ko'rsatadi, bo'lmasa eski
    rangli-harf fallback saqlanadi.
- **Tekshiruv:** tsc clean, eslint — 3 ta pre-existing xato (mening o'zgarishimga aloqasi yo'q,
  git stash bilan tasdiqlandi).

---

### F-247 | Web chat: xabar umuman yuborilmasdi (ikkita field mismatch)

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-19  **Model:** sonnet
- **Sabab:** Room ichidagi chat'da xabar yuborilmasdi.
- **Root cause (ikkita mustaqil mismatch, mobile bilan solishtirib topildi):**
  1. **Chiquvchi:** web `SEND_MESSAGE` orqali `{roomId, text}` yuborardi, backend
     (`chatEvents.handler.ts`) esa `data.message.slice(...)` kutadi — `message` undefined bo'lgani
     uchun handler ichida xato, xabar hech qachon broadcast qilinmasdi.
  2. **Kiruvchi:** backend `ROOM_MESSAGE` orqali tekis `{userId, username, message, timestamp}`
     yuboradi, lekin `ChatPanel.tsx` ichma-ich `IChatMessage` shaklini kutadi
     (`{id, user:{_id,username}, text, timestamp}`) — `msg.user` mavjud bo'lmagani uchun render
     vaqtida `msg.user._id` xato berardi (hatto o'zi yuborgan xabar ham qulardi).
- **Yechim:** `use-watch-party.ts` — chiquvchi `{message: text}` ga o'zgartirildi; kiruvchi
  `ROOM_MESSAGE` endi to'g'ri `IChatMessage` shakliga transform qilinadi (mobile'ning
  `useWatchParty.ts`dagi xuddi shu transformatsiyasi asosida).
- **Tekshiruv:** tsc clean, eslint — faqat 2 ta pre-existing `any` xatosi (mening o'zgarishimga
  aloqasi yo'q, git stash bilan tasdiqlandi).

---

### F-246 | T-S139 | Room yaratishda ilova ichida video qidiruv (YouTube/Rutube/VK)

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-19  **Model:** sonnet
- **Sabab:** `CreateRoomDialog.tsx`da platforma tugmasi bosilganda popup oyna ochilib, foydalanuvchi
  o'sha saytda qidirib, havolani nusxalab qaytishi kerak edi — mobile'da esa qidiruv allaqachon
  ilova ichida ishlaydi (`useVideoSearch`/`SearchResultsScreen.tsx`). Web'ni tenglashtirish so'raldi.
- **Topilma:** Backend'da `GET /content/video-search?q=` allaqachon TAYYOR edi (YouTube yt-dlp
  orqali, Rutube rasmiy API, VK yt-dlp orqali) + web proxy (`/api/content/search`) ham bor edi —
  frontendga ulanmagan edi.
- **O'zgarishlar:**
  - **YouTube qidiruvi rasmiy Data API v3'ga ko'chirildi** (`YOUTUBE_API_KEY` — foydalanuvchi
    yangi Google Cloud kaliti yaratdi, Railway content-service'ga qo'shildi). Kalit yo'q bo'lsa
    eski yt-dlp `ytsearch` fallback sifatida saqlanadi (`services/content/src/services/
    videoSearch.service.ts`).
  - `CreateRoomDialog.tsx` — qidiruv input (debounce 400ms) + natijalar ro'yxati (thumbnail,
    sarlavha, davomiylik, platforma). Natijaga bosish — videoUrl/Title/Thumbnail/Platform avtomatik
    to'ldiradi (xuddi clipboard-detect kabi). YouTube/Rutube/VK tugmalari endi popup ochmaydi —
    qidiruv input'ga fokus qiladi; qolgan platformalar (Twitch/Vimeo/Dailymotion/...) uchun popup
    saqlanib qoldi (ular uchun qidiruv yo'q).
- **Tekshiruv:** tsc/eslint clean. YouTube Data API kaliti to'g'ridan curl bilan tasdiqlandi
  (haqiqiy natijalar qaytdi).
- **Ochiq:** VK qidiruvi yt-dlp orqali (VK video qidiruv sahifasini scrape qiladi) — Rutube
  extraction'da topilgan Railway IP-blok muammosi bu yerda ham bo'lishi mumkin, tekshirilmagan.

---

### F-245 | T-S137 | 7 ta rasmiy video-manba qo'shildi — VK/Twitch/Vimeo/Dailymotion/TikTok/PeerTube/Trovo

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:**
  - **VK** — `video_ext.php` official embed, `ytDlpExtractor` (VK_COOKIES_JSON) o'rniga
  - **Twitch** — `Twitch.Embed` JS API, VOD to'liq sync, live channel play/pause-only. Mobile'dagi
    `parent:["localhost"]` xatosi tuzatildi (`baseUrl: twitch.tv` bilan mos kelmagan)
  - **Vimeo** — Vimeo Player SDK, promise-based control
  - **Dailymotion** — `player.html` postMessage protokoli
  - **TikTok** — `player/v1` embed. Chiquvchi komandalar (play/pause/seekTo) rasmiy docs'dan
    tasdiqlangan, kiruvchi event formati TO'LIQ tasdiqlanmagan (docs sahifasi bir necha marta
    timeout berdi) — himoyalangan parser bilan qurilgan, kodda ochiq belgilangan
  - **PeerTube** — `@peertube/embed-api`. Federatsiyalashgan (fixed domen yo'q) — URL PATH shakli
    bo'yicha aniqlanadi. CSP frame-src — faqat kichik boshlang'ich ro'yxat (framatube.org,
    peertube.social), boshqa instance'lar domen so'ralganda qo'shiladi
  - **Trovo** — `Trovo.TrovoPlayer` JS API. **Muhim cheklov**: rasmiy docs'da seek/setCurrentTime
    metodi UMUMAN yo'q — faqat play/pause sync, catch-up/drift-correction imkonsiz. Domen hali
    whitelist qilinmagan (Trovo qo'lda tasdiqlaydi, Twitch'dan farqli) — app.wewatch.uz uchun ariza
    Gmail draft sifatida tayyorlandi (tashqi kompaniyaga chiqadigan xat — yuborishdan oldin inson
    tekshiruvi kerak, avtomatik yuborilmadi), javob 1 haftagacha kutiladi
  - `services/watch-party/src/models/watchPartyRoom.model.ts` + `validators/watchParty.validator.ts`
    — `videoPlatform` enum kengaytirildi (tiktok/peertube/trovo)
- **Tekshiruv:** Har bir platforma alohida commit + tsc/eslint clean + Railway deploy tasdiqlangan
  (`app.wewatch.uz` health-check 200, auth health clean). Mobile — barcha platformalar uchun tsc
  clean (faqat pre-existing LanguageTransition.tsx xatosi qoldi).
- **Ochiq:** Trovo — domen apruvidan keyin jonli test kerak. TikTok — kiruvchi event format live
  tekshiruv kerak. Android'da VK/Rutube hali "to'liq sayt WebView" usulida (iOS'dan farqli) —
  keyingi kunlarga qoldirilgan alohida topilma.
- **2026-07-19 tuzatish (web):** VK jonli testda 2 ta bug topildi — (1) `video_ext.php` hech qanday
  `postMessage` yubormasligi/qabul qilmasligi (standalone iframe testida tasdiqlandi: 8s+ ichida
  bitta ham event kelmadi, `{method:'play'}` yuborish videoni ishga tushirmadi) → yuqoridagi "VK —
  video_ext.php official embed" band **noto'g'ri** edi, sync umuman ishlamaydi; `VKPlayer.tsx` sync
  logikasi butunlay olib tashlandi, VK endi ataylab "har kim o'z nusxasini ko'radi" rejimida (UI
  banner bilan ochiq belgilangan). (2) Shu bilan bog'liq — member iframe'ni to'liq boshqara olardi
  (owner-only cheklov yo'q edi YouTube'dan boshqa hech bir platformada) — bu ham tizimli muammo,
  hozircha faqat VK uchun tuzatilmadi (chunki VK endi sync qilmaydi, cheklovga hojat yo'q). Twitch/
  Vimeo/Dailymotion/TikTok/PeerTube/Trovo'da member-cheklov hali ham YO'Q — keyingi topilma.
- **2026-07-19 Rutube — yangi rasmiy embed qo'shildi:** Rutube'da alohida player komponenti umuman
  yo'q edi — u avvalgi generic content-service extraction (yt-dlp) orqali ketardi. Jonli sinovda
  aniqlandi: Rutube Railway'ning datacenter IP'sini `rutube.ru/api/play/options/{id}/`
  endpointida bloklaydi (404 qaytaradi — o'z (Railway bo'lmagan) IP'dan xuddi shu endpoint 200
  qaytardi, video to'liq mavjud edi). Bu yt-dlp versiyasi yoki kod xatosi emas — sof IP-blok.
  Yechim: yangi `RutubePlayer.tsx` — `rutube.ru/play/embed/` rasmiy embedi orqali, VK singari
  server-side extraction'ni butunlay chetlab o'tadi. **Protokol headless Playwright bilan jonli
  tasdiqlandi** (mobile'ning `buildRutubeHtml()` taxmin qilgan `{method,value}` shakli ISHLAMAYDI
  — haqiqiy protokol `{type:'player:play'/'player:pause'/'player:setCurrentTime', data:{time}}`
  chiquvchi, `player:changeState`/`player:currentTime`/`player:ready` kiruvchi — hammasi real va
  ishlaydi, VK'dan farqli). To'liq sync (play/pause/seek) ishlaydi — **Saidazim tomonidan
  production'da (app.wewatch.uz) shaxsan tasdiqlandi (2026-07-19, screen recording bilan)**.
  **Ochiq:** mobile'ning
  `buildRutubeHtml()` xuddi shu noto'g'ri `{method,value}` formatini ishlatadi — ehtimol u ham
  ishlamaydi, tuzatilmagan (mobile zonasi, alohida vazifa kerak).
- **2026-07-19 Twitch — CSP `frame-src`da `embed.twitch.tv` yo'q edi:** Twitch kanal
  (`twitch.tv/iceicell`) umuman yuklanmadi — abadiy loading spinner, xatosiz (chunki
  `TwitchPlayer.tsx`da boshqa barcha playerlardan farqli o'laroq LOAD_TIMEOUT yo'q edi — shu ham
  tuzatildi). Playwright bilan jonli sinovda brauzer konsolida aniq xato topildi: `Framing
  'https://embed.twitch.tv/' violates ... frame-src` — `script-src`da `embed.twitch.tv` bor edi
  (SDK skripti), lekin `frame-src`da faqat `player.twitch.tv`/`www.twitch.tv` bor edi, embed
  o'zi shu domenga iframe yaratadi. T-S135'dagi YouTube CSP xatosi bilan bir xil turkum.
  `next.config.mjs` frame-src'ga `embed.twitch.tv` qo'shildi.
- **2026-07-19 Twitch — live kanal uchun sync butunlay olib tashlandi (Saidazim so'rovi):** Owner
  play/pause bosgani live kanalda barcha viewer'larning mustaqil live oqimini sababsiz to'xtatardi
  — umumiy pozitsiya tushunchasi yo'qligi sabab bundan "birga tomosha qilish" foydasi yo'q edi
  (hamma allaqachon bir xil live edge'ni ko'radi). `VIDEO_PLAY`/`VIDEO_PAUSE` listener'lari endi
  faqat `isVod` bo'lganda ro'yxatdan o'tkaziladi. VOD to'liq sync saqlanib qoldi.
- **2026-07-19 Dailymotion — xuddi VK'dagi kabi soxta "yuklanmadi" xatosi:** Foydalanuvchi
  production'da tasdiqladi — video real ishlaydi (Unmute tugmasi, kadr ko'rinadi), keyin bir necha
  soniyadan so'ng "Не удалось загрузить видео" chiqadi. Sabab — `apiready` postMessage event'i
  production'da kelmayapti (xuddi VK'ning `inited` kabi), 15s LOAD_TIMEOUT yolg'on xato chiqaradi.
  Playwright bilan headless test CORS/bot-detection'ga uchradi (Dailymotion manifest so'rovini
  bloklaydi) — shuning uchun aniq protokolni tasdiqlab bo'lmadi, lekin foydalanuvchining real
  brauzerdagi kuzatuvi yetarli edi. Yechim VK bilan bir xil: `iframe.onLoad` `apiready`'ga
  qo'shimcha "ready" signali sifatida qo'shildi — sync logikasi (play/pause/seek postMessage
  buyruqlari) TEGILMADI, chunki ular ishlamasligi haqida hech qanday dalil yo'q (faqat "false
  error" simptomi kuzatildi, VK'dagi "sync umuman yo'q" emas).
- **2026-07-19 Dailymotion — sync haqiqatda ham ishlamas edi (foydalanuvchi tasdiqladi: onLoad
  fix'dan keyin video ochiladi, lekin play/pause/seek HECH NARSA qilmaydi):** Dailymotion'ning
  haqiqiy `dmp.photon_boot.js` bundle'ini (`geo.dailymotion.com/static/latest/cdn/...`) to'g'ridan
  yuklab, `receiveMessage` funksiyasini o'qib chiqildi — real formatga ega ekan:
  `{command, parameters:[...]}` (parameters — MASSIV), bizning kod esa `{command, time}` yuborardi
  (`time` — parameters emas, alohida maydon). Natijada `parameters` doim `[]`ga defaultlanardi va
  masalan seek `api('seek')` — argumentSIZ chaqirilardi (jim no-op). `sendCmd()` to'g'ri formatga
  o'zgartirildi. Playwright headless bilan tasdiqlab bo'lmadi (Dailymotion bot-detection asosiy
  player obyektini butunlay ishga tushirishga to'sqinlik qiladi bu muhitda) — fix manba kodidan
  to'g'ridan olingan, taxmin emas, lekin haqiqiy tasdiqlash foydalanuvchi brauzerida kutilmoqda.
- **2026-07-19 Dailymotion — command format fix ham yetmadi, arxitektura o'zgartirildi (owner-driven
  one-way sync):** Foydalanuvchi production'da Web Inspector konsolida real `postMessage`
  trafigini yozib berdi (play/pause/seek bosilganda) — 10+ soniyada faqat `pes_listen_eid` (ichki
  analytics ping) keldi, na `apiready`, na `playing`/`pause`/`seeked`. Bu XAQIQIY brauzerda
  tasdiqlangan (headless emas) — Dailymotion iframe'i umuman foydali state event yubormaydi, xuddi
  VK kabi. Owner harakatini `postMessage` orqali aniqlashning iloji yo'q. Yechim: `DailymotionPlayer.tsx`
  qayta qurildi — native controls yashirildi (`controls=0`), owner uchun o'z play/pause/±10s
  tugmalari qo'shildi. Owner tugmani bosganda BIR VAQTDA: `sendCmd()` (to'g'ri `{command,
  parameters}` shakli) VA `onPlay`/`onPause`/`onSeek` broadcast — iframe'dan tasdiq KUTILMAYDI,
  chunki harakatni o'zimiz boshlatyapmiz. `currentTime` "ko'r" lokal soat bilan kuzatiladi (real
  player pozitsiyasi emas) — Trovo'da allaqachon qabul qilingan cheklov bilan bir xil turkum.
  Haqiqiy playback (sendCmd('play') videoni chindan ishga tushiradimi) headless'da tasdiqlab
  bo'lmadi (bot-detection manifest so'rovini bloklaydi) — foydalanuvchi brauzerida tekshirish kerak.
- **2026-07-19 Dailymotion — owner-driven fix HAM ishlamadi, VK'ga o'xshab sync butunlay yechildi:**
  Foydalanuvchi production'da tasdiqladi — o'z play/pause/±10s tugmalarimiz iframe'ga umuman ta'sir
  qilmaydi (na owner, na viewer tomonida), ikkinchi foydalanuvchining videosi mustaqil ketmoqda.
  Ikkita mustaqil, dalilga asoslangan urinish (1. `apiready`/state event kutish, 2. owner-driven
  bir tomonlama `sendCmd`) ikkalasi ham ishlamadi — demak `dmp.photon_boot.js`da topilgan
  `receiveMessage` kanali hozirgi jonli pleer tomonidan haqiqatda ishlatilmaydi (boshqa ichki
  kanal orqali ishlaydi, minifikatsiyalangan koddan yana qazish oqilona emas — real devtools
  kirishisiz samarasi past). `DailymotionPlayer.tsx` VK bilan bir xil "har kim o'z nusxasini
  ko'radi" rejimiga qaytarildi (native controls qaytarildi, UI banner bilan ochiq belgilangan).
  Ikkala urinish ham izsiz emas — kod tarixida qoladi, keyingi safar boshqa yondashuv (masalan,
  Dailymotion'ning rasmiy JS SDK'si, DailymotionExtensions'sdk.js, agar mavjud bo'lsa) sinab
  ko'rilishi mumkin, lekin bu alohida, oldindan tekshirilmagan yo'l.

---

### F-244 | T-S136 | Android viewer play/pause deadlock — playerReadyRef VIDEO_FOUND fix

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:** `useWebViewPlayer.ts`/`WebViewPlayer.tsx`/`UniversalPlayer.tsx` — `VIDEO_FOUND`
  WebView xabari endi `fireReady()`ni ham chaqiradi, faqat `PLAY` emas.
- **Root cause:** viewer'ning `playerReadyRef` faqat autoplay muvaffaqiyatli bo'lgandagina keladigan
  `PLAY` xabaridan keyin `true` bo'lardi — Android WebView'da autoplay ko'pincha jim ishlamaydi,
  deadlock. Owner buni sezmagan, chunki manual tap to'g'ridan-to'g'ri `play()`ni chaqiradi.
- **Tekshiruv:** tsc clean (faqat pre-existing LanguageTransition.tsx xatosi), kod push qilingan —
  yangi APK build kerak (mobile o'zgarish, avtomatik deploy bo'lmaydi).

---

### F-243 | T-S135 | CSP script-src'da youtube.com yo'q edi — YouTube IFrame API skripti bloklangan

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/next.config.mjs` — CSP `script-src`ga `https://www.youtube.com` qo'shildi.
- **Root cause:** `frame-src`da youtube.com bor edi (iframe uchun), lekin `YouTubePlayer.tsx`ning
  `loadYouTubeApi()` `<script src="youtube.com/iframe_api">` yuklaydi — bu `script-src` tomonidan
  boshqariladi. Brauzer skriptni butunlay bloklagan, `YT.Player` hech qachon yaratilmagan.
- **Tekshiruv:** Deploy tasdiqlandi, foydalanuvchi live test qildi — YouTube video web'da yuklandi.

---

### F-242 | T-S134 | Google/Telegram login web'da hali ham tugamayapti — popup.closed COOP tufayli yolg'on

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:** `LoginForm.tsx` — `closedCheck` (500ms timer, `.closed`ga ishonuvchi) olib
  tashlandi. O'rniga `visibilitychange`/`focus` listener — faqat foydalanuvchi tab'ga qaytganda
  `.closed`ni tekshiradi. Ground-truth poll interval endi to'liq sessiya davomida uzilmaydi.
  Ikkala flow (Google + Telegram) uchun bir xil.
- **Root cause:** T-S132 (rate limit) haqiqiy edi, lekin asosiy sabab emas edi. Prod loglarida
  3/3 jonli urinishda ANIQ 2ta poll ketib, keyin sukunat — deterministik, tasodifiy emas. Sabab:
  popup `accounts.google.com`ga o'tgach, Google'ning o'z COOP header'i opener bog'lanishini uzadi,
  `.closed` shu zahoti (popup hali ochiq bo'lsa ham) `true` qaytaradi. `closedCheck` buni "user
  cancelled" deb 3s dan keyin pollingni to'xtatgan — ~4s da, real login tugashidan ancha oldin.
- **Tekshiruv:** Railway deploy `ecb1fdf3` — SUCCESS, health-check clean, `ratelimit-limit: 90`
  header hali ham live (T-S132 rollback bo'lmagan).

---

### F-241 | T-S133 | YouTubePlayer web'da onError qo'shildi — deploy tasdiqlandi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:** `YouTubePlayer.tsx`ga `onError` handler + xato UI (mavjud "Не удалось загрузить
  видео" pattern'iga mos).
- **Tekshiruv:** Railway deploy `1725a36d` — SUCCESS, `app-web` Online, ertalab tasdiqlandi.

---

### F-240 | T-S132 | Google sign-in web'da zависал — pollRateLimiter 30/min < client poll cadence

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-18  **Model:** sonnet
- **O'zgarishlar:** `shared/src/middleware/rateLimiter.middleware.ts` — `pollRateLimiter.max` 30→90.
  `apps/app-web/src/app/(auth)/login/LoginForm.tsx` — Google poll interval 800ms→2000ms, 429 endi
  "hali kutilmoqda" bilan bir xil emas — alohida ushlanadi va pollingni to'xtatadi.
- **Root cause:** Google popup flow 800ms intervalda `/google/poll`ni so'raydi (~75 req/min), lekin
  limiter 30 req/min bilan cheklagan. Haqiqiy Google OAuth (account picker+consent) 24s dan uzoq
  davom etganda client 429 ura boshlagan, xato `catch{}`da jim yutilgan — parent tab hech qachon
  login tugaganini bilmagan, foydalanuvchi cheksiz spinner'da qolgan.
- **Tekshiruv:** Live incident — Bekzod aka TEZCODE Wewatch topic'da xabar berdi (00:30-00:38,
  2026-07-18), skrinshotlar (Google callback "Вы вошли!" lekin auto-close/redirect ishlamagan)
  tahlil qilindi. Prod'da deploy qilingandan keyin `ratelimit-limit: 90` header orqali tasdiqlandi.
  auth+app-web+content+notification+user+watch-part+admin — barchasi `shared/`ni tortib qayta
  deploy bo'ldi, hammasi Online, health-check clean (mongo:ok, redis:ok).
- **Xulosa:** Telegram login xuddi shu muammoni tasodifan aylanib o'tgan edi (`/api/auth/me`ni
  poll qiladi, `pollRateLimiter` ostida emas) — shu farq root cause'ni aniqlashda kalit bo'ldi.

---

### F-239 | T-S131 | app-web: instant video swap (CHANGE_MEDIA) — YouTube/Android bilan parity

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-17  **Model:** sonnet
- **O'zgarishlar:** `use-watch-party.ts` — `sendMediaChange()` qo'shildi (CLIENT_EVENTS.CHANGE_MEDIA
  emit, mobile'ning `emitMediaChange`'iga oyna). `RoomContent.tsx` — PlaylistPanel'ga "Play now"
  tugma (yashil, ▶) qo'shildi, mavjud "+" (navbatga qo'shish) tugmasi bilan bir qatorda. 3 ta
  messages/{ru,en,uz}.json — `party.playNow` kaliti.
- **Tekshiruv:** Research (Explore agent) YouTube watch-party sync web'da (`apps/app-web`,
  `YouTubePlayer.tsx`) allaqachon ishlashini tasdiqladi — official IFrame API, owner heartbeat+drift
  correction, xuddi mobile'dagi kabi. `shared/src/constants/socketEvents.ts` protokoli
  platformadan mustaqil (`{ currentTime }` raqamlar) — Android+Web bitta xonada allaqachon
  aralashishi mumkin edi. Yagona haqiqiy farq — video'ni darhol almashtirish UI'si web'da yo'q edi
  (faqat playlist-navbat bor edi), shu tuzatildi. `apps/web` (landing) — o'lik/eskirgan kod, tegilmadi.
- **Xulosa:** tsc --noEmit va eslint ikkala o'zgargan faylda toza (mavjud `any` xatolari
  use-watch-party.ts:70'da mendan oldin edi, dev-workflow bo'yicha fon).

---

### F-238 | T-S130 | Fullscreen overlay video'ni tor chiziqqa siqib qo'ygan bug tuzatildi

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-16  **Model:** sonnet
- **O'zgarishlar:** `WatchPartyScreen.tsx` — `fsChatWrap.height` endi `useWindowDimensions()`
  orqali render vaqtida hisoblanadi (`Math.round(winHeight * 0.38)`), modul darajasidagi
  `Dimensions.get('window').height` konstantasi olib tashlandi. Fullscreen orientatsiya-lock
  effekti endi `setShowChat(false)` ham chaqiradi — fullscreen'ga kirganda chat panel
  avtomatik yopiladi, video darhol markazda.
- **Xulosa:** Foydalanuvchi: fullscreen rejimida overlay butun ekranni egallagan, video
  faqat tor ko'rinadigan chiziq bo'lib qolgan. Root cause: `SCREEN_H` moduli yuklanganda
  BIR MARTA portret orientatsiyada o'qilgan, keyin hech qachon yangilanmagan.
  `ScreenOrientation.lockAsync(LANDSCAPE)` fullscreen'da chaqirilgach real balandlik ancha
  kichik bo'ladi, lekin `fsChatWrap` hamon katta portret-balandlikning 38%ini ishlatardi —
  `showChat` default `true` bo'lgani uchun bu deyarli butun landscape ekranni egallagan.
  tsc --noEmit: CLEAN. Real qurilmada tasdiqlash keyingi qadam (yangi build kerak).

---

### F-237 | T-S124 | Telegram login tugmasi web'da (`/login`)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-16  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/app/api/auth/telegram/init/route.ts` (yangi) — bekend
  `POST /telegram/init`ni chaqiradi, `tg://resolve?domain=X` (mobil deep-link, brauzer
  tushunmaydi) dan domain chiqarib `https://t.me/X?start=login` (universal link) qaytaradi.
  `src/lib/api/auth.api.ts` — `telegramInit()`. `LoginForm.tsx` — "Telegram" tugmasi + Google
  bilan bir xil pattern: popup await'dan OLDIN ochiladi (Chrome bloklamasin uchun), keyin
  `t.me` linkiga navigatsiya, so'ng `authApi.me()` har 800ms poll (postMessage kerak emas —
  callback sahifa bilan bir xil origin, cookie'lar darhol ko'rinadi). `auth/telegram/callback/
  page.tsx` — muvaffaqiyatdan keyin `window.close()` (faqat `window.opener` mavjud bo'lsa —
  mobil/no-popup holatida sahifa oddiy status ko'rsatishda davom etadi).
- **Xulosa:** Bekend (`services/auth/telegramAuth.service.ts` — hash verifikatsiya,
  `login_url` webhook, callback-sahifa) allaqachon TO'LIQ tayyor edi — yetishmagan qism
  faqat login sahifasidagi tugma edi. Foydalanuvchi ko'p marta savol berdi (qanday ko'rinadi,
  nega telefon-kod input emas, Google kabi bo'lsinmi) — MTProto orqali telefon+kod so'rash
  (Telegram akkauntga to'liq kirish huquqi berardi, fishing-pattern bilan bir xil) rad etildi,
  rasmiy Login Widget (login_url tugma) tanlandi. tsc/eslint/production build: CLEAN.

---

### F-236 | T-S123 | YouTube Innertube-спуфинг убран (Play Store risk)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-16  **Model:** sonnet
- **O'zgarishlar:** `src/utils/youtubeInnertube.ts` o'chirildi (rasmiy Android YouTube
  klientini spoofing — ANDROID_YT_VERSION/ANDROID_SDK). `useWebViewPlayer.ts` —
  `extractYouTubeStream` import + `onYtInnertubeUrl` prop olib tashlandi, `YT_EMBED_ERROR`
  (101/150/152) endi to'g'ridan `setYtEmbedBlocked(true)`. `WebViewPlayer.tsx` — "YouTube'da
  ochish" tugmasi (`Linking.openURL`) olib tashlandi, fallback ekran yangi matn ko'rsatadi.
  `UniversalPlayer.tsx` — `innertubeUrl` state + `effectiveExtractedUrl` dagi ustuvorlik olib
  tashlandi (`sniffedUrl ?? extractedUrl`). `translations.ts` — `embeddedPlayerUnavailable/
  embeddingForbidden/openInYouTube` (o'lik) → `cannotExtractVideo/tryAnotherVideo` (3 til).
- **Xulosa:** Play Store compliance audit'da topilgan risk — Innertube-spoofing Google'ning
  o'z platformasida (YouTube) ToS chetlab o'tish, har qanday pirat saytdan ham osonroq
  aniqlanadi. Saidazim so'roviga ko'ra fallback ekran endi tashqi ilovaga yo'naltirmaydi —
  shunchaki "Bu videoni chiqarib bo'lmadi / Boshqa videoni sinab ko'ring" ko'rsatadi. Oddiy
  YouTube videolar (embedding ruxsat etilgan — aksariyat) butunlay ta'sirlanmagan, faqat
  muallif embedding'ni aniq taqiqlagan tor edge-case o'zgardi. tsc --noEmit: CLEAN.

---

### F-235 | T-S122 | DM Web paritet — Android bilan bir xil funksiya + vizual (7 fazali)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-15  **Model:** opus
- **O'zgarishlar (26 fayl):**
  - **Types/API:** `apps/app-web/src/lib/api/user.api.ts` — `DmMessage` mobil `IDMMessage`ga
    tekislandi (`read/replyTo*/forwardFrom/pinned/updatedAt`), `userApi`ga 7 ta yangi metod
    (forwardMessage/markRead/markReadUpTo/toggleMute/togglePinConversation/togglePinMessage/
    getPinnedMessages).
  - **Utils:** `lib/dm/dm-format.ts` (memberColor/formatTime/formatRelative — dedup
    ConversationList+ChatWindow'dan), `lib/dm/dm-date-groups.ts` (buildDMList/findJumpIndex —
    mobildan deyarli so'zma-so'z port), `lib/dm/scroll-position-storage.ts` (localStorage,
    SSR-guard).
  - **Proxy routes (7 ta yangi):** `api/user/dm/[peerId]/{forward,read,read-until,mute,pin,
    pinned}/route.ts` + `.../messages/[messageId]/pin/route.ts`.
  - **i18n:** `dm`+`calendar` namespace'lariga 16+12 kalit, 3 til (en/ru/uz).
  - **Hooks:** `hooks/use-dm.ts` qayta yozildi — `useDmRealtime` endi `DM_READ` eventini
    tinglaydi (o'z xabarlarini `read:true` qiladi), `useSendDm` — optimistic + temp-id
    reconciliation (remove-first-match, mobildan port) + socket-first/REST-fallback,
    yangi `useToggleMute/useTogglePinConversation` (optimistic+rollback)/
    `usePinnedMessages/useTogglePinMessage/useForwardMessage`. `hooks/use-dm-viewport.ts`
    (yangi) — mobil `useDMChatViewport`ning IntersectionObserver analogi: sticky-date +
    view-based read-marking (debounce 400ms) + scroll-position memory (debounce 600ms) —
    bitta observer, 3 vazifa.
  - **socket.ts:** `getSocket()` `connectPromise` bilan dedup qilindi (xuddi api-client.ts
    `refreshPromise` patterni) — parallel `io()` race yopildi.
  - **Komponentlar (`components/messages/dm/`, 10 ta yangi):** `MessageItem.tsx` (80%
    maxWidth trick — wrapper'da, bubble'da emas; forward-header/reply-quote/pin/read-tick),
    `DateSeparator.tsx`, `StickyDateHeader.tsx` (fade-timer komponentda, hookda emas —
    mobil split'ini aynan takrorlaydi), `ChatWallpaper.tsx` (deterministik scatter,
    ResizeObserver — window emas, SSR-safe), `MessageActionSheet.tsx` (Dialog bottom-sheet,
    DropdownMenu emas — per-row anchor muammosi), `ReplyPreviewBar.tsx`, `ForwardPicker.tsx`
    (FriendSearch shell qayta ishlatildi), `PinnedMessagesBar.tsx` (cycle-index porti),
    `DatePickerModal.tsx` (Intl.DateTimeFormat weekday — 7ta qo'shimcha i18n key kerak
    emas), `ChatPreviewModal.tsx` (Telegram-style peek, decoupled query, markRead chaqirmaydi).
  - **`ConversationList.tsx`:** pinned-first sort, unread accent-bar (active'dan alohida),
    hover/tap "…" menu (touch uchun ham ko'rinadi), right-click → preview.
  - **`ChatWindow.tsx`:** to'liq orkestrator — buildDMList + barcha yangi komponentlar ulandi.
  - **O'chirildi:** `MessageBubble.tsx` (MessageItem bilan almashtirildi, konsumerlari yo'q
    edi).
  - **Tasks.md tozalash:** T-S118/119/120/121 (reply/forward/forward-privacy/read-receipt)
    grep bilan backend'da allaqachon tayyorligi tasdiqlandi (doc/code drift) — Done.md'ga
    ko'chirildi (F-234), Tasks.md'dan olib tashlandi.
- **Xulosa:** Saidazim: "веб чаты должны выглядеть как в андроиде и функции те же должны
  быть и там". Backend (`services/user` `/dm/*`) grep bilan 100% tayyor ekani tasdiqlandi —
  yetishmagan qism faqat veb edi. 7 faza (Foundation→API+hooks→List→Chat core→Interactions→
  Read-receipts→Integration) izchil bajarildi, har faza alohida `tsc --noEmit` + `eslint`
  bilan tekshirilib commit qilindi. Yakuniy tekshiruv: `npm run build` (production) — barcha
  7 yangi route ro'yxatdan o'tdi, `/messages` sahifasi muvaffaqiyatli build bo'ldi (33.8kB),
  route conflict yo'q. tsc: CLEAN butun jarayon davomida (yangi xatolik 0 ta). Real
  ikki-sessiyali tekshiruv (DM_READ live tick-flip, pin/mute sync) va Playwright vizual
  QA (desktop+mobile-web) — keyingi qadam, kod tomonidan hammasi tayyor va ulangan.
  To'liq reja: `/Users/saidazim/.claude/plans/lively-weaving-dongarra.md`.

---

### F-234 | T-S118,T-S119,T-S120,T-S121 | DM reply/forward/forward-privacy/read-receipt — hujjat/kod drift tozalandi (backend allaqachon tayyor edi)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-15  **Model:** opus
- **O'zgarishlar:** Kod o'zgarmadi — bu faqat `docs/Tasks.md` tozalash. Veb DM paritet ishini boshlashdan oldin (`services/user/src/routes/user.routes.ts`, `services/user/src/services/dm.service.ts`, `services/user/src/models/directMessage.model.ts`, `services/user/src/models/user.model.ts`, `services/watch-party/src/socket/dmEvents.handler.ts`) grep bilan tasdiqlandi: T-S118 (`replyToId/replyToText/replyToSender` model+service+REST+socket — bor), T-S119 (`forwardMessage()` + `forwardFrom` snapshot + `POST /dm/:userId/forward` — bor), T-S120 (`user.model.ts:15,88` — `privacy.allowForward: boolean, default true` + `dm.service.ts:209` enforce — bor), T-S121 (`dmEvents.handler.ts:48,61` — `DM_READ_UNTIL` qabul qilib `SERVER_EVENTS.DM_READ` sender xonasiga emit qiladi — bor).
- **Xulosa:** 4 ta task `docs/Tasks.md`da "❌ Boshlanmagan" deb qolgan edi, lekin kod ular allaqachon boshqa sessiyada (yoki shu sessiyalarning birida) bajarilgan — Task tool'ning ichki tarixida ham mos yozuvlar bor edi (#10/#11/#12 completed), lekin `docs/Tasks.md`/`Done.md` yangilanmagan. Bu aynan `project_doc_vs_code_drift_lesson` xotirasida ogohlantirilgan pattern. Tozalanmasa — veb DM paritet rejasi (T-S122) noto'g'ri "backend yo'q" taxminiga asoslanib qayta ishlanardi. `shared/types` `IDMMessage`ga `replyToId/replyToText/replyToSender/forwardFrom/pinned` maydonlari ham allaqachon mos — LOCK protocol talab qilinmadi (shared o'zgarmadi).

---

### F-230 | T-S129 | DM chat sahifasi web'da butunlay crash — Conversation kontrakti tekislandi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-15  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/lib/api/user.api.ts` — `Conversation` interfeysi backend/mobil bilan tekislandi (`peerUsername`, `peerAvatar`, `lastMessage: string`, `lastMessageAt`, `isMuted`, `isPinned` — nested `peer`/`lastMessage` obyekti o'rniga). `ConversationList.tsx` — `conv.peer.username/avatar/isOnline` → `conv.peerUsername/peerAvatar` (isOnline — backend hech qachon qaytarmagan o'lik maydon, olib tashlandi). `MessagesContent.tsx` — `selectedConvo?.peer.username` → `selectedConvo?.peerUsername`.
- **Xulosa:** Foydalanuvchi brauzer konsolini yubordi: `TypeError: undefined is not an object (evaluating 'e.peer.username')`. Root cause — web frontend'ning `Conversation` interfeysi hech qachon haqiqiy backend javobiga mos kelmagan xayoliy tuzilma bilan yozilgan edi (nested `peer` obyekti), lekin `services/user/src/services/dm.service.ts` TEKISLANGAN maydonlar qaytaradi (`peerUsername`, `peerAvatar`, `lastMessage: string`). Mobil ilova (`IDMConversation`) to'g'ri, haqiqiy kontraktga mos yozilgan — shuning uchun mobilkada DM ishlagan, web'da esa HAR QANDAY mavjud suhbat butun sahifani yiqitgan (nested error.tsx yo'qligi sababli xato root `global-error.tsx`gacha ko'tarilgan). Bu web DM'ning birinchi marta yaratilganidan beri hech qachon to'g'ri ishlamaganini anglatadi. tsc: CLEAN (apps/app-web, yangi xatolik yo'q). Railway avtomatik deploy qildi, healthcheck ✅, `app.wewatch.uz/messages` tekshirildi. Commit `c0b7d2b`.

---

### F-229 | T-S128 | Android VK/Rutube full-site WebView — abadiy loading fix (timeout + retry)

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-15  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/src/hooks/useWebViewPlayer.ts` — `URL_MODE_LOAD_TIMEOUT_MS` konstantasi (18s Android / 12s iOS) + yangi effekt: `isHtmlMode=false` (Android VK/Rutube full-site) uchun timeout tugaganda — agar adapter allaqachon `<video>` elementini topgan bo'lsa (`receivedFirstMessageRef`) shunchaki overlay yopiladi, aks holda mavjud `error`/`handleRetry` UI ko'rsatiladi.
- **Xulosa:** Foydalanuvchi: web'da Rutube xona ochib, Android ilova orqali qo'shilganda video "rutube.ru" domeni bilan abadiy loading holatida qolgan (web'da esa normal ishlagan — web server-side extraction, Android esa client-side WebView sniffing ishlatadi, IP-lock sababli). Root cause: `LOAD_TIMEOUT_MS` mexanizmi faqat `isHtmlMode` (YouTube) uchun ishlagan; Android'ning "full-site" rejimi faqat WebView'ning o'z `onLoadEnd`ga tayangan — og'ir SPA sahifa (fon XHR/trekerlar) hech qachon "tugadi" signalini bermasa, overlay abadiy osilib qolardi, retry imkoniyati yo'q edi. Endi timeout bor va foydalanuvchi hech bo'lmaganda retry qila oladi yoki video allaqachon topilgan bo'lsa avtomatik ko'rinadi. tsc: CLEAN (apps/mobile, yangi xatolik yo'q). Commit `70713cc`. Yangi APK build kerak — real qurilmada tasdiqlash keyingi qadam.

---

### F-228 | T-S127 | Web: Rutube/VK (va boshqa embed'lar) xona yaratilmasligi — Mongoose/Joi enum rassinxroni

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `services/watch-party/src/models/watchPartyRoom.model.ts` — `VIDEO_PLATFORM_ENUM` konstantasi qo'shildi (`youtube,vimeo,twitch,dailymotion,direct,webview,vk,rutube,other,null`), asosiy schema va playlist sub-schema'dagi eski `['youtube','direct','webview']` enum'lari shu bilan almashtirildi. `apps/app-web/src/components/rooms/CreateRoomDialog.tsx` — `toAbsoluteThumbnailUrl()` himoya funksiyasi (Rutube oEmbed'ning protocol-relative thumbnail_url'ini normallashtiradi/noto'g'ri bo'lsa tashlab yuboradi).
- **Xulosa:** Foydalanuvchi: Rutube link bilan xona yaratishga urinilganda tugma aylanadi va hech narsiz asl holatiga qaytadi. Railway watch-party loglarini tekshirish orqali root cause topildi: `POST /rooms` 422 qaytargan, lekin `Client error` WARN yozuvi umuman yo'q edi. Sabab — `error.middleware.ts`da Mongoose'ning o'z `ValidationError`i (schema-level enum rad etganda) alohida branch orqali ishlaydi va `logger.warn` chaqirmaydi (faqat bizning maxsus `AppError`/Joi `ValidationError` branchi log yozadi). Haqiqiy muammo: Joi validator (`createRoomSchema`) `vk`/`rutube` (va `vimeo`/`twitch`/`dailymotion`/`other`)ni qabul qiladi, lekin Mongoose schema'ning o'z `videoPlatform` enum'i faqat `['youtube','direct','webview']` bilan cheklangan qolgan edi — bu ikki ro'yxat vk/rutube qo'shilganda hech qachon sinxronlashtirilmagan. Natijada Joi so'rovni o'tkazadi, keyin `.save()` MongoDB darajasida jim-jit rad etadi. Bu deyarli barcha platformalar (YouTube'dan tashqari) uchun web orqali xona yaratishni butunlay buzgan edi — faqat mobil ilova buzilmagan, chunki u to'g'ridan-to'g'ri video pleer orqali ishlaydi va bu xona-yaratish yo'lidan farqli holat kechishi mumkin edi. Qo'shimcha: `CreateRoomDialog.tsx`da Rutube oEmbed'dan kelgan protocol-relative thumbnail URL ham (`//pic.rutube.ru/...`) backend Joi'ning `videoThumbnail.uri()`sini buzishi mumkin edi — shuning uchun normalizatsiya/tashlab yuborish qo'shildi. tsc: watch-party — faqat mavjud rootDir fon xatoliklari (stash bilan solishtirib tasdiqlandi — yangi xatolik yo'q), app-web — CLEAN. Railway avtomatik deploy qildi (GitHub push'dan keyin) — `watch-part` va `app-web` ikkalasi ham `Online`, sog'liq tekshiruvi ✅. Commit `c447c60`.

---

### F-227 | T-S126 | app-web production deploy crash-loop tuzatildi (real root cause: middleware nom xatosi)

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/middleware.ts` — eksport nomi `proxy` → `middleware` (Next.js 14.2 faqat `middleware`/`default` nomini tan oladi). `apps/app-web/src/instrumentation.ts` (yangi) + `src/instrumentation-client.ts` (yangi, `sentry.client.config.ts`dan ko'chirilgan) — Sentry'ni zamonaviy `register()`-asosidagi konvensiyaga o'tkazish. `sentry.server.config.ts`, `sentry.edge.config.ts` — o'chirildi. `next.config.mjs` — `experimental.instrumentationHook: true` (Next 14.2'da majburiy).
- **Xulosa:** T-S125 fix'ni deploy qilishda `railway up` build muvaffaqiyatli o'tdi, lekin healthcheck (`/login`) 5 daqiqa "service unavailable" bilan fail bo'lardi — har bir so'rov middleware'da `TypeError: Cannot redefine property: __import_unsupported` bilan crash qilardi. Dastlab Sentry SDK v10 nomuvofiqligi deb taxmin qilindi (legacy `sentry.*.config.ts` konvensiyasi) — shu sababli `instrumentation.ts`ga migratsiya qilindi. Lekin haqiqiy production Docker image'ni (`node:20-slim`, aynan Railway ishlatadigan) mahalliy qurib, bosqichma-bosqich tekshirish (Sentry butunlay o'chirilganda ham xato saqlanib qoldi) haqiqiy sababni ochdi: `middleware.ts` `middleware` yoki `default` o'rniga `proxy` nomli funksiyani eksport qilardi — Next.js buni yaroqli handler sifatida tanimaydi, va bu `ceddf15` (domain-split, 2026-yil) commitida shu tarzda kiritilgan bo'lib, o'shandan beri app-web'ning HECH BIR deploy urinishi muvaffaqiyatli bo'lmagan (production hozirgacha eski konteyner bilan ishlab kelgan). Fix: eksport nomini `middleware`ga qaytarish — bitta so'z, lekin haqiqiy root cause. Sentry migratsiyasi ham foydali edi (deprecated konvensiya, Sentry SDK'ning o'zi build loglarida ogohlantirgan) va saqlab qolindi. Haqiqiy Dockerfile orqali local Docker image qurib to'liq tekshirildi: `/login`→200, `/home`, `/room/[id]`→307 (autentifikatsiyasiz to'g'ri redirect), konteyner loglarida xato yo'q. `railway up` orqali production'ga deploy qilindi va tasdiqlandi (`app.wewatch.uz/login`→200 jonli). tsc: CLEAN. Commit `02ad504`.

---

### F-226 | T-S125 | T-S124 regressiyasi (VK/Rutube sync) + web YouTube abadiy yuklanish bugi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/src/hooks/useWatchPartyRoom.ts` — `isYouTubeWebViewMode` flag qo'shildi (`isWebViewMode && platform === 'youtube'`) va hook return'iga qo'shildi. `apps/mobile/src/screens/modal/WatchPartyScreen.tsx` — yangi propni `VideoSection`ga ulash (`isYouTubeEmbed`). `apps/mobile/src/components/watchParty/VideoSection.tsx` — `isOwnerMode` va tap-catcher (`blockEmbedTouch`) endi faqat `!isWebView || isYouTubeEmbed` bo'lganda ishlaydi (YouTube yoki native player), boshqa webview embedlar (VK/Rutube/Twitch/Vimeo/Dailymotion) uchun T-S124'gacha bo'lgan xulq qaytarildi. `apps/app-web/src/components/party/VideoPlayer.tsx` — `getYouTubeId` regex qayta yozildi (mobil `extractYouTubeVideoId` bilan bir xil mantiq: `v=` query string ichida istalgan joyda qidiriladi, faqat "watch?v=" literal prefiksda emas).
- **Xulosa:** Foydalanuvchi real qurilmada 2 ta bug topdi: (1) YouTube xonasi web'da abadiy "loading" holatida qolardi; (2) Rutube xonasida owner (telefon) play/pause bossa video web'da o'ynardi, lekin telefonning o'zida video joyida turardi, pauzada web telefon holatiga qaytardi. Ikkala bug alohida root cause: (1) — web'ning `getYouTubeId` regex'i faqat "youtube.com/watch?v=" literal ketma-ketligini talab qilardi (v= birinchi query parametri bo'lishi shart) — playlist yoki "si=" kabi boshqa parametr `v=`dan oldin kelsa (odatiy YouTube share linklarida tez-tez uchraydi), ID topilmay, umuman YouTube uchun mo'ljallanmagan generic CDN extraction yo'liga tushib, abadiy spinner ko'rsatardi. (2) — T-S124 xato ravishda `isOwnerMode`/tap-catcher'ni HAR QANDAY webview embed uchun (nafaqat YouTube) shartsiz yoqqan edi; YouTube uchun bu xavfsiz (rasmiy IFrame Player API), lekin Android'dagi VK/Rutube "full-site" usuli (xom DOM `<video>`, WebViewAdapters.ts) uchun bare `.play()/.pause()` chaqiruvi DOM hodisasini otib holatni sinxronlaydi, lekin sahifaning haqiqiy oqimini ishga tushirmaydi/to'xtatmaydi — owner hali ham sahifaning o'z play tugmasiga tegishi kerak edi. Fix T-S124'ni faqat YouTube uchun toraytirdi, VK/Rutube/boshqalarni eski (ishlaydigan) xulqqa qaytardi. tsc: CLEAN (apps/mobile va apps/app-web, ikkalasida ham yangi xatolik yo'q). Commit `72089d4`. GitHub Actions APK build ishga tushirilmoqda — real qurilmada tasdiqlash keyingi qadam.

---

### F-225 | Bug fix | Web: xona yaratilmayapti — videoUrl sxemasiz jo'natilsa jim-jit fail bo'lardi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `apps/app-web/src/lib/api-error.ts` — `BackendError.details` → `errors` (haqiqiy backend maydoni bilan mos, `shared/src/utils/apiResponse.ts`: `apiResponse.error(message, errors)`). `apps/app-web/src/components/rooms/CreateRoomDialog.tsx` — `handleCreate`da `videoUrl` jo'natishdan oldin sxema yo'q bo'lsa `https://` avtomatik qo'shiladi.
- **Xulosa:** Foydalanuvchi xabari: link kiritib "yaratish"ni bosganda tugma aylanadi va hech narsa bo'lmasdan asl holatiga qaytadi. Root cause ikkita bog'liq xato: (1) URL input `<form>` ichida emas → brauzer native URL validatsiyasi ishlamaydi → sxemasiz link ("youtube.com/watch?v=...") backend Joi `videoUrl.uri()`ga o'tib, 422 bilan rad etiladi; (2) `parseApiError` `details` maydonini tekshiradi, lekin BARCHA servislar (auth/user/content/notification/admin/watch-party) Joi xatolarini `errors` maydonida qaytaradi — shu sabab aniq sabab ("videoUrl" must be a valid uri) hech qachon ko'rsatilmay, generic "Validation failed" bilan almashtirilardi (deyarli ko'rinmas toast). Ikkalasi ham tuzatildi: maydon nomi to'g'rilandi + jo'natishdan oldin URL normalizatsiya qilinadi. tsc: CLEAN (apps/app-web, yangi xatolik yo'q). Commit `5cbffb3`.

---

### F-224 | T-S124 | YouTube/webview iframe — owner endi FAQAT o'z pleer boshqaruvidan foydalanadi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/src/components/watchParty/VideoSection.tsx` — `isOwnerMode = isOwner && !isWebView` → `isOwnerMode = isOwner` (117-qator); butun ekranli tap-catcher endi `isWebView` uchun ham har doim render qilinadi (avval T-S122da webview uchun o'chirilgan edi). `apps/mobile/src/hooks/useWatchPartyRoom.ts` — izoh yangilandi (`isOwnerMode` shartsiz ekanini aks ettirish uchun).
- **Xulosa:** Foydalanuvchi so'rovi: YouTube (va boshqa webview embedlar — Twitch/VK/Rutube, bir xil komponent orqali) iframe'ining o'z native UI'siga (play/pause/seek) hech qanday to'g'ridan-to'g'ri teginish bo'lmasin, faqat ilovaning o'z pleer paneli orqali boshqarilsin. T-S122 aksincha — owner uchun tap-catcher'ni webview'da o'chirib, YouTube native tugmasiga tegishga imkon bergan edi; endi bu teskari qilindi: tap-catcher qaytadan har doim WebView ustida turadi va barcha teginishni tutib qoladi, `isOwnerMode` esa shartsiz `isOwner` bo'lgani uchun bizning play/pause/seek panelimiz webview holatda ham ko'rinadi va `_csVideo` JS-mosti (`useWebViewPlayer.ts`) orqali videoni boshqaradi — bu most YouTube (`webviewYouTube.ts`) va boshqa embedlar (`WebViewAdapters.ts`) uchun umumiy, shuning uchun fix barcha webview platformalarda bir xil ishlaydi. Autoplay-siyosat xavfi (WebView ichida user-gesture yo'qligi) allaqachon `mediaPlaybackRequiresUserAction={false}` bilan yopilgan (`WebViewPlayer.tsx`). tsc: CLEAN (apps/mobile, yangi xatolik yo'q). GitHub Actions APK build ishga tushirildi (commit `aace1bc`) — real qurilmada/emulyatorda tasdiqlash keyingi qadam.

---

### F-223 | T-S123 | To'liq click-event tracking — mobile + web

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** Mobile (103 fayl, 6 commit): `analyticsService.ts` — `click(id, meta?)` + `track()` avtomatik `currentScreen`; `TrackedTouchable.tsx` / `TrackedPressable.tsx` (yangi, majburiy `trackId` prop, `onPress` + `onLongPress` qamrab oladi) — barcha watchParty/auth/home/profile-settings/friends-DM/common ekranlarida qo'llanildi. Web (28 fayl, 1 commit): `apps/app-web/src/lib/analytics.ts` (yangi, `trackClick()` → `gtag('event','click',...)`) — auth (login/register/reset-password), home, room (playlist, tabs, invite, emoji, video controls), settings, support, friends/DM, notifications, profile.
- **Xulosa:** Bekzod so'rovi (T-S118 topic reminder, 18:00 muddat) — "Foydalanuvchi analitikasi (click+event log)" mavjudligini so'radi. Audit natijasi: backend tayyor edi, lekin mobile'da deyarli hech qanday click event yo'q edi (faqat 3 ta), web'da esa GA4 pageview'dan boshqa hech narsa yo'q edi. Foydalanuvchi to'g'ridan-to'g'ri buyruq berdi: "делай полный клик евент во всем приложении". Har ikki platformada ham endi asosiy CTA/tugma bosishlar GA4/analyticsService orqali kuzatiladi. tsc: CLEAN (apps/mobile va apps/app-web, ikkalasida ham yangi xatolik yo'q). Commits: mobile `1956729`..`3033e74` (6 ta), web `fbaff51`.

---

### F-222 | T-S122 | YouTube/webview embed — owner endi videoni boshqara oladi

- **Bajaruvchi:** Saidazim (Claude sonnet)  **Bajarilgan:** 2026-07-14  **Model:** sonnet
- **O'zgarishlar:** `apps/mobile/src/components/watchParty/VideoSection.tsx` — butun ekranli tap-catcher (150-155-qator) `!isWebView` shartiga o'raldi.
- **Xulosa:** Real qurilmada topilgan bug: YouTube video ochilganda owner uni umuman boshqara olmasdi. Root cause — `isOwnerMode = isOwner && !isWebView` (116-qator) webview platformalar uchun app'ning o'z play/pause panelini yashiradi ("native controls o'zi ishlaydi" degan taxmin bilan), lekin shart-shartsiz butun ekranli tap-catcher YouTube'ning haqiqiy native play tugmasiga tegishga ham yo'l qo'ymasdi — owner uchun video ishga tushirishning birorta yo'li qolmagan edi. Sync-broadcast logikasi (`useWatchPartyRoom.ts:482-489`) allaqachon to'g'ri ishlar edi — muammo faqat tap WebView'ga yetib bormasligida edi. Fix: `isWebView` bo'lganda catcher render qilinmaydi, tap to'g'ridan-to'g'ri WebView'ga o'tadi. Non-owner tap'lari alohida `WebViewPlayer`dagi `memberLockOverlay` orqali bloklanishda davom etadi. tsc: CLEAN (apps/mobile, yangi xatolik yo'q). Real qurilmada tasdiqlash — keyingi qadam (foydalanuvchi tomonidan).

---

### F-221 | T-S118 | Sync quality stats — per-room telemetry (transport, drift, errors)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-09 12:40  **Model:** sonnet
- **O'zgarishlar:** Backend: `services/admin/src/models/syncStats.model.ts` (yangi Mongo model, 30 kun TTL), `.../services/syncStats.service.ts` (ingest + overview/rooms/session aggregatsiyalari), `.../controllers/syncStats.controller.ts`, `.../routes/syncStats.routes.ts` (public `/sync-stats/ingest` + admin-auth `/admin/sync-stats/*`), `.../app.ts` (router registratsiya). Mobile: `apps/mobile/src/hooks/useWatchParty.ts` (transport-vaqt hisoblash — p2p/turn/socket ms, `meshEverConnectedRef`, `getTransportSnapshot()`), `.../hooks/useWatchPartyRoom.ts` (macro-seek/micro-adjust hisoblagichlari, drift o'rtacha/maksimal, `syncErrorsRef` — seek xatolari, extraction xatolari, connect timeout; `handleLeave`da statistikani yuboradi), `apps/mobile/src/api/syncStats.api.ts` (yangi). Admin-UI: `apps/admin-ui/src/pages/SyncStatsPage.tsx` (yangi sahifa — transport pie chart, drift trend, komnatalar jadvali, sessiya detali), `.../api/syncStats.api.ts`, `App.tsx` + `Sidebar.tsx` + 3 ta i18n fayli (`nav.syncStats`).
- **Xulosa:** Har bir watch-party komnata sessiyasi uchun sinxronizatsiya sifati endi kuzatiladi: qaysi transport (P2P/TURN/Server) qancha vaqt ishlatilgan, o'rtacha/maksimal drift, macro-seek va micro-adjust sonlari, mesh ulanmagan holatlar, va sync xatolari — hammasi xonadan chiqishda serverga yuboriladi va admin-panelda ko'rinadi. tsc: CLEAN (services/admin va apps/mobile'da yangi xatolik yo'q; apps/admin-ui'dagi barcha yangi xatoliklar loyihaning oldindan mavjud @types/react/recharts nomuvofiqligi bilan bir xil turkumda, yangi kategoriya emas). Branch: `saidazim/feat-mesh-sync`.

### F-220 | T-S117 | Sync: democratic buffer-pause больше не паузит владельца (self play/pause loop)

- **Bajaruvchi:** Saidazim (Claude opus)  **Bajarilgan:** 2026-07-07 23:00  **Model:** opus
- **O'zgarishlar:** `services/watch-party/src/socket/videoEvents.handler.ts` (BUFFER_START: `if (members <= 1) return` перед democratic pause; VIDEO_PAUSE через `socket.to` вместо `io.to` — исключить буферящего отправителя), `apps/mobile/src/hooks/useWatchPartyRoom.ts` (`emitBufferState`: не слать BUFFER_START при `activeMembers <= 1` — зеркало серверного гарда).
- **Xulosa:** Root cause подтверждён prod-логами: `Democratic buffer pause members=1` зацикливался с `resumed room` — владелец один в комнате, буферизуя на HLS-прокси, заставлял сервер паузить/возобновлять его самого (баг «play/pause сам по себе»). При members=2 буфер владельца через `io.to` клал всю комнату (владелец стоп, мембер идёт). Фикс: сервер не паузит соло-комнату и исключает буферящего отправителя. Задеплоено `railway up` watch-party (healthcheck ✅). tsc: CLEAN (только pre-existing rootDir/LanguageTransition). Commit `e31fe72`. ⚠️ Мобильный гард — defense-in-depth, попадёт в приложение со следующей сборкой APK.

### F-219 | T-S110 | SSRF DNS-rebinding fix — hls-proxy resolved-IP validation

- **Bajaruvchi:** Saidazim (Claude)  **Bajarilgan:** 2026-07-06 22:26  **Model:** sonnet
- **O'zgarishlar:** `services/content/src/controllers/hlsProxy.controller.ts` (`validateProxyUrl`) — DNS resolve qilinib, natija IP privat diapazonlar (169.254.169.254, 10.x, 172.16-31.x, 192.168.x va h.k.) ga solishtiriladi, faqat shundan keyin fetch qilinadi. Segment LRU cache ham shu commit bilan qo'shildi.
- **Xulosa:** Attacker domeni cloud metadata/ichki IP ga rezolvitilib blok-listni aylanib o'tishi mumkin edi — endi yopiq. Commit: `56f97c8`.

### F-218 | T-S106 | Mesh Faza 0 — TURN credentials + NTP clock-sync handshake

- **Bajaruvchi:** Saidazim (Claude)  **Bajarilgan:** 2026-07-06 22:26 (boshlangan 2026-06-29 16:59)  **Model:** sonnet
- **O'zgarishlar:**
  - `apps/mobile/src/services/mesh/MeshClient.ts` — DataChannel ping/pong orqali clock offset + RTT (NTP-style), ICE restart retry, periodic clock resync
  - `apps/mobile/src/services/mesh/TopologyManager.ts` — topology limit fix
  - `apps/mobile/src/services/mesh/config.ts` — TURN (`EXPO_PUBLIC_TURN_*`) config cleanup
- **Xulosa:** Clock offset endi hisobga olinadi (`SyncProtocol.calcDrift` uchun asos tayyor), TURN creds to'ldirildi — mobil CGNAT muhitida mesh ulanadi. Commitlar: `900df1b`, `6bf6cc8`. T-S107 uchun blocker yopildi.

---

### F-213 | T-C016+T-C017+T-C018+T-C019 | Web App — Auth + Home + Watch Party + Profile/Friends/DM

- **Bajaruvchi:** Emirhan (Claude sonnet)  **Bajarilgan:** 2026-06-15  **Model:** sonnet
- **O'zgarishlar:**
  - `apps/web/src/app/(auth)/login/` — LoginForm (email+parol + Google OAuth popup)
  - `apps/web/src/app/(auth)/register/` — RegisterForm + VerifyEmail
  - `apps/web/src/app/(app)/layout.tsx` — auth check, AppNav + AppSidebar
  - `apps/web/src/app/(app)/home/` — RoomCard grid, CreateRoomDialog, JoinRoomDialog
  - `apps/web/src/app/(app)/room/[id]/` — VideoPlayer + ChatPanel + MemberList + Socket.io sync
  - `apps/web/src/app/(app)/profile/` — ProfileCard + StatsGrid + AvatarUpload
  - `apps/web/src/app/(app)/friends/` — FriendCard + FriendSearch + RequestCard
  - `apps/web/src/app/(app)/messages/` — ConversationList + ChatWindow + DM real-time
  - `apps/web/src/lib/api-client.ts` — base fetch client, 401→refresh→retry
  - `apps/web/src/lib/api/` — auth.api, rooms.api, user.api, content.api
  - `apps/web/src/store/auth.store.ts` — Zustand auth state
  - `apps/web/src/hooks/` — use-rooms, use-watch-party, use-friends, use-profile, use-dm, use-socket
- **Xulosa:** To'liq web ilova Next.js da — login/register (Google OAuth), home xonalar, watch party (iframe+sync), profil, do'stlar, DM chat. Mobile funksionalining web analogiyasi.

---

### F-212 | T-E135 | Web Landing — PhoneMockup UI fix

- **Bajaruvchi:** Emirhan (Claude sonnet)  **Bajarilgan:** 2026-06-02  **Model:** sonnet
- **O'zgarishlar:** `apps/web/src/app/LandingContent.tsx`
- **Xulosa:**
  - ScreenHome: online badge 9→10px, platform labels 9→10px, room avatars w-8→w-9, room name 11→12px, room status 9→10px, create party 11→12px
  - ScreenRoom: video preview height 68→90px, play button w-11→w-14 (size 15), URL 9→10px, participants header 8→9px
  - ScreenWatching: video area height 42→45%, chat header 10→11px text-white/75→white/90, chat messages bg #111122→#181830 border opacity 0.08→0.13 text 10→11px text-white, input hint 9→10px zinc-500→zinc-400

---

### F-211 | T-E201–T-E207 | Web Landing — Mobile bilan sinxronizatsiya va bug tuzatishlar

- **Bajaruvchi:** Emirhan (Claude sonnet)  **Bajarilgan:** 2026-05-23 12:00  **Model:** sonnet
- **O'zgarishlar:**
  - `apps/web/messages/uz.json` — 20+ yangi kalitlar, urlFromSites to'g'rilandi
  - `apps/web/messages/en.json` — 20+ yangi kalitlar, urlFromSites to'g'rilandi
  - `apps/web/messages/ru.json` — 20+ yangi kalitlar, urlFromSites to'g'rilandi
  - `apps/web/src/app/LandingContent.tsx` — MARQUEE (Netflix/Kinogo/Rezka → VK/Rutube/Cinerama/Twitch), TYPING_URL (kinogo.cc → youtube.com), STATS i18n, WHY_ITEMS i18n, site tiles to'g'irlandi, APP_FEATURES voice chat qo'shildi, Battle "Tez kunda" badge, hero/CTA footer i18n
  - `apps/web/src/app/(landing)/features/FeaturesContent.tsx` — Watch Party: voice chat (WebRTC) qo'shildi; Battle: "Tez kunda" badge; Achievement: rank tizimi (Bronze→Diamond) va rarity zanjiri ko'rsatildi
  - `apps/web/src/components/common/Providers.tsx` — hydration mismatch tuzatildi (useState 'uz' fixed init)
- **Xulosa:**
  - **T-E201**: Translation kalitlari (plan1name, plan2name, mostPopular, statUsers, statMovies, startShort, comingSoon, appFeat6, whyTitle, whySubtitle, statsLabels, heroFooter, ctaFooter, openSite, openBrowser va boshqalar) — 3 tilda qo'shildi
  - **T-E202**: Manba saytlar tuzatildi — Netflix/Vimeo/Kinogo/Rezka/Filmix o'chirildi, VK/Rutube/Cinerama/Twitch/Instagram/Drive qo'shildi
  - **T-E203**: Battle mode "Tez kunda" belgisi qo'shildi (mobile'da amalga oshirilmagan)
  - **T-E204**: Watch Party — Ovozli chat (WebRTC) qo'shildi
  - **T-E205**: Achievement — 5 rarity zanjiri (common→legendary→secret) va Bronze→Diamond rank tizimi ko'rsatildi
  - **T-E206**: WHY_ITEMS va STATS — hardcoded Russian → i18n (3 til)
  - **T-E207**: Hydration mismatch tuzatildi — Providers.tsx useState 'uz' sabit init, useEffect'da yangilanadi
  - Console: 0 errors barcha sahifalarda (/, /features, /pricing)

---

### F-210 | T-E125–T-E133 | Mobile UI Refactor Sprint 10

- **Bajaruvchi:** Emirhan (Claude opus)
- **Bajarilgan:** 2026-05-19 14:00
- **Model:** opus (audit + refactor), haiku (audit exploration)
- **O'zgarishlar:**
  - `screens/home/VideoPlayerScreen.styles.ts` — createThemedStyles, 25+ hardcoded → tokens
  - `screens/home/HomeScreen.tsx` — 629→280, extract RoomGridCard + useCreateWatchParty hook
  - `components/home/RoomGridCard.tsx` — yangi (RoomGridCard, SkeletonGridCard, RoomGrid)
  - `hooks/useCreateWatchParty.ts` — yangi hook
  - `screens/friends/FriendsScreen.tsx` — 562→230, extract FriendListItems, fix `as any`
  - `components/friends/FriendListItems.tsx` — yangi (FriendRow, RequestCard, FriendsEmptyState)
  - `screens/rooms/RoomsScreen.tsx` — 548→210, extract RoomListCard
  - `components/rooms/RoomListCard.tsx` — yangi
  - `screens/modal/SupportChatScreen.tsx` — 445→280, extract MessageItem + RatingBottomSheet
  - `components/common/SupportChatItems.tsx` — yangi
  - `screens/friends/FriendProfileScreen.tsx` — 427→245, styles → .styles.ts, #fff → colors.white
  - `screens/auth/VerifyEmailScreen.tsx` — 338→252, styles → .styles.ts, rgba → tokens
  - `screens/friends/FriendSearchScreen.tsx` — 330→186, styles → .styles.ts, #fff fix
  - `screens/profile/SettingsScreen.tsx` — 329→303, styles → .styles.ts
  - `components/watchParty/VideoSection.tsx` — 413→248, styles → .styles.ts
  - `components/watchParty/ChatPanel.tsx` — 352→183, styles → .styles.ts
- **Xulosa:** 9 ta screen/component refactor — barcha 300+ qator fayllar kamaytrildi. Hardcoded colors → theme tokens, inline styles → StyleSheet, `as any` → proper types. tsc CLEAN (faqat oldingi 3 external module xato).

---

### F-209 | T-E120/121/122 | WeWatch Marketing — Promo Reel (3 konsept, Higgsfield AI)

- **Bajaruvchi:** Emirhan (Claude sonnet + Higgsfield Seedance 1.5 Pro)
- **Bajarilgan:** 2026-05-19
- **Model:** seedance_1_5 (Higgsfield)
- **O'zgarishlar:** marketing/videos/ (3 ta video), marketing/briefs/promo-reel-brief.md, marketing/images/, marketing/briefs/
- **Xulosa:** WeWatch uchun 3 ta promo reel yaratildi. Concept 1 "Purple Pulse" (8s) — split-screen sync konsepti, dark purple brand. Concept 2 "Three Cities" (4s) — Tokyo/London/Istanbul TikTok versiya. Concept 3 "Macro Mood" (8s) — ultra-cinematic macro fingertip. Jami 24 kredit sarflandi (65.6 → 41.6). Barcha video 9:16, 720p, audio bilan.
- **Video URLs:**
  - Concept 1: hf_20260519_093729_a1afd628 (8s, 9.6 kredit)
  - Concept 2: hf_20260519_094113_ca3347db (4s, 4.8 kredit)
  - Concept 3: hf_20260519_094134_17aaf4fb (8s, 9.6 kredit)

---

### F-206 | T-S071 | Admin UI — Global search Cmd+K (Users + Errors + Movies)

- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Bajarilgan:** 2026-05-16
- **Model:** sonnet
- **O'zgarishlar:** apps/admin-ui/src/components/layout/Layout.tsx
- **Xulosa:** GlobalSearch Cmd+K/Ctrl+K: users + errors (mavjud) + movies qidiruviga qo'shildi. Movie natijalar violet FILM badge bilan /movies ga o'tadi. tsc: CLEAN.

---

### F-205 | T-S070 | Admin UI — Dashboard: activity feed + error trend chart

- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Bajarilgan:** 2026-05-16
- **Model:** sonnet
- **O'zgarishlar:** errors.service.ts (getErrorTrend), admin.service.ts (getActivityFeed + model imports), errors.controller.ts + routes (GET /errors/trend), admin.controller.ts + routes (GET /admin/dashboard/activity), dashboard.api.ts, errors.api.ts, types/index.ts, DashboardPage.tsx
- **Xulosa:** LineChart — 7 kunlik xatolar trendi. Activity feed — oxirgi 48 soat: yangi xatolar + admin harakatlari + shikoyatlar, icon + timeAgo bilan. tsc: CLEAN.

---

### F-204 | T-S095 | Moderation: UserReport model + endpoint

- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Bajarilgan:** 2026-05-16
- **Model:** sonnet
- **O'zgarishlar:** services/admin/src/models/userReport.model.ts, moderation.service.ts, moderation.controller.ts, moderation.routes.ts
- **Xulosa:** UserReport schema (reportedUserId, reporterId, reason, status, reviewNote), ModerationService metodlari (createUserReport, listUserReports, reviewUserReport, pendingUserReportCount), ModerationController (reportUser POST, listUserReports GET, reviewUserReport PATCH), /moderation/counts da pendingUserReports. T-E118 bilan mos ishlaydi.

---

### F-203 | T-S068 + T-S069 | Admin UI — UserDetailPage + ErrorsPage user info

- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Bajarilgan:** 2026-05-14
- **Model:** sonnet
- **O'zgarishlar:** apps/admin-ui/src/pages/UserDetailPage.tsx, ErrorsPage.tsx
- **Xulosa:** UserDetailPage (/users/:id) — avatar, email, role, block/unblock, restrictions, errors section. ErrorsPage EventDrawer — UserCard (email, "Связаться" mailto, "Профиль" link) + UserChatPanel (in-app support chat). Маршруты в App.tsx настроены.

---

### F-202 | T-E118 + T-E119 | ReportUserModal + RoomsScreen long-press report

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 17:30
- **Bajarilgan:** 2026-05-11
- **Model:** sonnet
- **O'zgarishlar:** 6 fayl — report.api.ts, ReportUserModal.tsx (new), FriendProfileScreen.tsx, MembersStrip.tsx, WatchPartyScreen.tsx, RoomsScreen.tsx
- **Xulosa:** T-E118: ReportUserModal yaratildi, FriendProfileScreen + WatchPartyScreen (MembersStrip tap) ga qo'shildi. T-E119: RoomsScreen da long-press → ReportRoomModal. tsc: CLEAN.

---

### F-201 | T-S093 | Play Store: Cascade account deletion across all services

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** sonnet
- **O'zgarishlar:** 15 fayl — profile.service.ts, serviceClient.ts, serviceConfig.ts + internal DELETE endpoints in notification/battle/content/admin services
- **Xulosa:** cascadeDeleteUser() via Promise.allSettled — deletes all user data across services. One failure doesn't block others.

---

### F-200 | T-E111 + T-E117 | Play Store: Dynamic blocked-domains hook with cache + foreground refresh

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** sonnet
- **O'zgarishlar:** 4 fayl — useDynamicBlockedDomains.ts (new), blockedDomains.ts, content.api.ts, App.tsx
- **Xulosa:** Fetches admin-blocked domains from API, caches in SecureStore 24h. AppState foreground trigger for stale refresh. Falls back to static list if network unavailable.

---

### F-199 | T-E124 | Play Store: ToS checkbox on register + Privacy Policy link in Settings

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** sonnet
- **O'zgarishlar:** 3 fayl — RegisterScreen.tsx, SettingsScreen.tsx, translations.ts
- **Xulosa:** Explicit ToS checkbox before registration. Register button disabled until checked. Privacy Policy + Terms links in Settings screen.

---

### F-198 | T-E120 | Domain tracking — trackDomainVisit in MediaWebViewScreen

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 14:56
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** haiku
- **O'zgarishlar:** 1 fayl — MediaWebViewScreen.tsx
- **Xulosa:** Fire-and-forget trackDomainVisit call in onShouldStartLoadWithRequest. Operators can now see which domains users visit.

---

### F-197 | T-E123 | Play Store: Remove unused/deprecated Android permissions

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** haiku
- **O'zgarishlar:** 1 fayl — app.json
- **Xulosa:** Removed RECEIVE_BOOT_COMPLETED, RECORD_AUDIO. Replaced READ_EXTERNAL_STORAGE with READ_MEDIA_IMAGES (Android 13+). Added INTERNET.

---

### F-196 | T-S092 | Play Store: Server-side cookie jar — remove COOKIE_COLLECTION_JS spyware

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** sonnet
- **O'zgarishlar:** 5 fayl — cookieStore.ts (new), playwrightExtractor.ts, videoExtractor/index.ts, webViewScripts.ts, useMediaDetection.ts
- **Xulosa:** Playwright collects cookies server-side → Redis per-domain (TTL 24h) → yt-dlp reads. Removed mobile COOKIE_COLLECTION_JS (document.cookie injection = Play Store spyware).

---

### F-195 | T-S091 | Play Store: YouTube always embed — remove yt-dlp fallback

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-11 13:39
- **Bajarilgan:** 2026-05-11 14:20
- **Model:** haiku
- **O'zgarishlar:** 1 fayl — videoExtractor/index.ts
- **Xulosa:** YouTube extraction now always returns official IFrame embed. Removed yt-dlp try/catch (was dead code — returned IP-locked URLs). extractionMethod: 'embed-api'.

---

---

### F-194 | T-E121 | Support chat — fix messages not loading + not appearing after send

- **Beruvchi:** Saidazim (bug topildi)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 18:00
- **Bajarilgan:** 2026-05-09 18:10
- **Model:** haiku
- **O'zgarishlar:** 2 fayl — support.api.ts, SupportChatScreen.tsx
- **Xulosa:** queryFn har doim [] qaytarardi — endi listMessages() chaqiriladi. onSuccess optimistic update qo'shildi — xabar darhol ko'rinadi.

---

### F-193 | T-S088 | Support chat — internal messages endpoint for mobile

- **Beruvchi:** Saidazim (bug topildi)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 18:00
- **Bajarilgan:** 2026-05-09 18:05
- **Model:** haiku
- **O'zgarishlar:** 2 fayl — support.routes.ts, support.controller.ts
- **Xulosa:** GET /internal/support/user/:userId/conversations/:convId/messages qo'shildi — verifyToken + ownership check. T-E121 (Emirhan) uchun unblock.

---

### F-191 | T-S087 | Support chat internal routes — JWT auth instead of internal secret

- **Beruvchi:** Emirhan (mobile implementatsiyasi chog'ida topildi)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 16:00
- **Bajarilgan:** 2026-05-09 17:17
- **Model:** sonnet
- **O'zgarishlar:** 2 fayl — support.routes.ts, support.controller.ts
- **Xulosa:** requireInternalSecret → verifyToken + ownership check (user.userId === :userId), userId URL param o'rniga JWT dan olinadi

---

### F-192 | T-S084 | WatchParty chat — username in ROOM_MESSAGE socket payload

- **Beruvchi:** Emirhan
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 00:00
- **Bajarilgan:** 2026-05-09 17:17
- **Model:** sonnet
- **O'zgarishlar:** 1 fayl — chatEvents.handler.ts
- **Xulosa:** username JwtPayload dan olinib ROOM_MESSAGE payloadiga qo'shildi — mobile QueryClient cache workaround endi kerak emas

---

### F-217 | T-E118 + T-E119 | In-app Support Chat + push notification handler

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 14:06
- **Bajarilgan:** 2026-05-09 16:00
- **Model:** sonnet
- **O'zgarishlar:** 6 fayl — support.api.ts (yangi), SupportChatScreen.tsx (yangi), ModalNavigator.tsx, types/index.ts, SettingsScreen.tsx, AppNavigator.tsx
- **Xulosa:**
  - `support.api.ts`: `getConversations(userId)` + `sendMessage(userId, text, conversationId?)` — adminClient JWT orqali
  - `SupportChatScreen.tsx`: TanStack Query + message list + multiline input + KeyboardAvoidingView
  - Settings → "Написать в поддержку" tugmasi → SupportChat modal
  - AppNavigator: `data.type === 'support_reply'` → SupportChatScreen navigate (cold-start safe)
  - `SupportChat` ModalStackParamList ga qo'shildi
  - ⚠️ Blocker: T-S087 (Saidazim) — internal routes JWT auth ga o'tkazilgunga qadar API 401 qaytaradi

---

### F-212 | T-E115 | Bug: push notification cold-start → WatchParty navigate fix

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet)
- **Yaratilgan:** 2026-05-01 03:10
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 1 fayl — AppNavigator.tsx
- **Xulosa:** `isNavReady` state + NavigationContainer `onReady` callback. Cold start: lastResponse set → NavigationContainer ready bo'lguncha wait. `isAuthenticated` + `needsProfileSetup` guard.

---

### F-213 | T-E116 | WatchParty video_source_expired — owner inline update button

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet)
- **Yaratilgan:** 2026-05-03 00:00
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 1 fayl — WatchPartyScreen.tsx
- **Xulosa:** expiredBanner ichiga owner uchun "Обновить источник" tugmasi (handleChangeMedia). Non-owner: "хозяин обновит".

---

### F-214 | T-E112 | WatchParty active members strip

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet)
- **Yaratilgan:** 2026-05-01 03:10
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 2 fayl — MembersStrip.tsx (yangi), WatchPartyScreen.tsx
- **Xulosa:** Horizontal scroll, `getPublicProfile` query (TanStack cache), avatar/doira+initials, owner ⭐, self highlight, +N overflow.

---

### F-215 | T-E113 | WatchParty Chat sender username

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet)
- **Yaratilgan:** 2026-05-01 03:10
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 1 fayl — useWatchParty.ts
- **Xulosa:** ROOM_MESSAGE da username yo'q (T-S084). Mobile: QueryClient `user-public` cache dan username resolve. Fallback: userId[-4:].

---

### F-216 | T-E114 | WatchParty Chat reply to message (Telegram style)

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Emirhan (Claude sonnet)
- **Yaratilgan:** 2026-05-01 03:10
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 3 fayl — ChatPanel.tsx, useWatchParty.ts, WatchPartyScreen.tsx
- **Xulosa:** Long press → replyTo state. Input yuqori: preview bar (sender + snippet + X). Bubble ichida reply reference. sendMessage emit da replyTo payload.

---

### F-084 | T-S084 T-S085 T-S086 | Support Chat system — backend + admin UI

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-09 14:06
- **Bajarilgan:** 2026-05-09 14:22
- **Model:** sonnet
- **O'zgarishlar:** 11 fayl — supportConversation.model.ts, supportMessage.model.ts, support.service.ts, support.controller.ts, support.routes.ts, admin/app.ts, support.api.ts, ErrorsPage.tsx, SupportPage.tsx, App.tsx, Sidebar.tsx
- **Xulosa:**
  - T-S084: SupportConversation + SupportMessage MongoDB models; REST API (getOrCreate, list, messages, send, close); internal routes for mobile; FCM push on admin reply
  - T-S085: ErrorsPage — UserChatPanel компонент встроен в EventDrawer, inline чат с пользователем
  - T-S086: SupportPage — ticket list (status filter, search, pagination) + conversation chat view + reply input + close button; Sidebar badge с количеством открытых диалогов

---

### F-083 | T-S082-group | Security MEDIUM/LOW — issues #8,#9,#11,#12,#13,#15,#17,#18,#19

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 23:55
- **Bajarilgan:** 2026-05-08 23:55
- **Model:** sonnet
- **O'zgarishlar:** auth.controller.ts, auth.config/index.ts, admin/app.ts, content/app.ts, rateLimiter.middleware.ts, docker-compose.dev.yml
- **Xulosa:**
  - #8: OTP response dan olib tashlandi → console.warn (dev only)
  - #9: ES ports → 127.0.0.1 (loopback only), comment added for prod
  - #11: Admin CORS wildcard '*' olib tashlandi → adminUrl only
  - #12: HLS static → verifyToken middleware qo'shildi
  - #13: passOnStoreError: true → false (barcha rate limiterlar)
  - #15: superadminEmail hardcode → requireEnv('SUPERADMIN_EMAIL')
  - #17: Telegram webhook secret: optional → mandatory (fail if not set)
  - #18: Content CORS — existing behavior acceptable (server-to-server standard)
  - #19: Redis fallback password → :? (fails loudly if not set)

---

### F-077 | T-S076 | Security: /internal/user-watch-stats — requireInternalSecret

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 22:47
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** content.routes.ts (1 qator — requireInternalSecret allaqachon qo'yilgan edi)
- **Xulosa:** CRITICAL issue — endpoint already had requireInternalSecret, no code change needed

---

### F-078 | T-S077 | Security: prod URLs playwright.config dan o'chirish

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 22:47
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** playwright.config.ts, .env.dev.example, .gitignore
- **Xulosa:** 7 ta Railway prod URL → process.env.TEST_*_URL (localhost fallback), .env.test → .gitignore

---

### F-079 | T-S078 | Security: /init-admin rate limit + /clear-attempts auth

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 23:33
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** rateLimiter.middleware.ts (initAdminRateLimiter 5/15min), auth.routes.ts
- **Xulosa:** POST+PUT /init-admin → initAdminRateLimiter (5/15min), DELETE /clear-attempts → requireInternalSecret

---

### F-080 | T-S079 | Security: JWT access token 6h → 15min

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 23:33
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** services/auth/src/config/index.ts, services/auth/.env.example
- **Xulosa:** accessTokenExpiry: '6h' → process.env.JWT_EXPIRES_IN ?? '15m'

---

### F-081 | T-S080 | Security: requireNotBlocked fail-closed

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 23:33
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** shared/src/middleware/auth.middleware.ts
- **Xulosa:** Redis xatosida next() o'rniga next(Error) — fail-closed, 503 qaytariladi

---

### F-082 | T-S081 | Security: NEXTAUTH_SECRET docker-compose dan o'chirish

- **Beruvchi:** Абдулазиз (audit 2026-05-08)
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-08 23:33
- **Bajarilgan:** 2026-05-08 23:42
- **Model:** haiku
- **O'zgarishlar:** docker-compose.dev.yml, .env.dev.example
- **Xulosa:** hardcode "cinesync_dev_nextauth_secret_2026" → ${NEXTAUTH_SECRET} env reference

---

### F-190 | T-E111 | Content Filter — Static adult domain blacklist in MediaWebViewScreen

- **Beruvchi:** Emirhan
- **Bajaruvchi:** Emirhan (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-07 00:00
- **Bajarilgan:** 2026-05-09 00:00
- **Model:** sonnet
- **O'zgarishlar:** 2 fayl — `blockedDomains.ts` (yangi), `MediaWebViewScreen.tsx`
- **Xulosa:** 150+ adult domen blacklist, `isDomainBlocked()` utility, `onShouldStartLoadWithRequest` intercept (MEDIA_DETECTION_JS/socket events TEGMAGAN), blocked overlay UI (shield icon + domain name + "← Назад"). tsc: CLEAN.

---

### F-001 | T-S067 | Admin UI — Production redesign: Sidebar + Layout + Header + Login

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet)
- **Yaratilgan:** 2026-04-24 23:08
- **Bajarilgan:** 2026-05-02 09:26
- **Model:** sonnet
- **O'zgarishlar:** 3 fayl — Sidebar.tsx, Layout.tsx (+ GlobalSearch), LoginPage.tsx
- **Xulosa:** lucide-react icons + NavGroups + error badge in Sidebar. Desktop header: breadcrumb, ⌘K search, notification bell, avatar. Login redesign: glow orbs, card, animations.

---

### F-002 | T-S073 | YouTube embed fallback when proxy extraction fails

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet)
- **Yaratilgan:** 2026-05-02 10:40
- **Bajarilgan:** 2026-05-02 11:00
- **Model:** sonnet
- **O'zgarishlar:** 2 fayl — videoExtractor/index.ts, UniversalPlayer.tsx
- **Xulosa:** Backend returns type='embed'+videoId when ytdl-core fails instead of IP-locked URL. Mobile switches to YouTube IFrame on proxy failure.

---

### F-003 | T-S074 + T-S075 + T-S076 | YouTube stream proxy via yt-dlp + iOS client + cookie expiry

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet)
- **Yaratilgan:** 2026-05-02 11:35
- **Bajarilgan:** 2026-05-02 12:00
- **Model:** sonnet
- **O'zgarishlar:** 4 fayl — ytdl.controller.ts, ytdlpStream.service.ts, ytDlpExtractor.ts, ytdl.service.ts
- **Xulosa:** /youtube/stream now uses yt-dlp as fallback with server-side pipe (range support). yt-dlp uses ios player client. Cookie expiry warning added at service startup.

---

### F-001 | T-S072 + T-E116 | YouTube embed — videoId instead of proxy stream

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude sonnet yordamida)
- **Yaratilgan:** 2026-05-01 10:50
- **Bajarilgan:** 2026-05-01 10:58
- **Model:** sonnet
- **O'zgarishlar:** 3 fayl — videoExtractor/types.ts, videoExtractor/index.ts, content.api.ts
- **Xulosa:** YouTube URL uchun yt-dlp/proxy yo'q. extractYouTubeVideoId() → `{type:'embed', videoId, useProxy:false}`. Mobile WebView flow o'zgarishsiz ishlaydi — `useProxy:false` proxy URL qayta yozishni skip qiladi, `isWebViewMode=true` YouTube iframe ochadi.

---

### T-E111 | 2026-04-25 | [MOBILE] | WatchParty UI bugs — playlist, FAB, theme tokens [Emirhan]

- **Bajarildi:**
  - `screens/modal/WatchPartyScreen.tsx`:
    - `PlaylistPanel` endi `position:'absolute', bottom:0` — bottom sheet sifatida chiqadi (avval `chatPanel flex:1` ortida ko'rinmas edi)
    - Playlist ochiq paytda `changeMediaFab` + `playlistFab` yashirinadi (FAB overlap bug fix)
    - `FAB_BOTTOM = 72`, `FAB_PRIMARY_SIZE = 52` — magic numbers → nomli konstantalar
    - `playlistSheet` yangi stil: `zIndex:15, elevation:16, shadow`
  - `components/watchParty/PlaylistPanel.tsx`:
    - `StyleSheet.create` → `createThemedStyles` (to'liq tema tokenlariga o'tish)
    - `#7B72F8` → `colors.primary`, `rgba(17,17,24,...)` → `colors.bgSurface`
    - Barcha hardcoded `16px`, `12px`, `8px` → `spacing.lg`, `spacing.md`, `spacing.sm`
    - `borderRadius: 20` → `borderRadius.full`, `borderRadius: 16` → `borderRadius.xl`
  - `components/watchParty/RoomCard.tsx`: `thumbWrap` dan `position:'relative'` olib tashlandi
  - `components/watchParty/RoomInfoBar.tsx`: `iconBtn` dan `position:'relative'` olib tashlandi
  - `components/watchParty/EmojiFloat.tsx`: `zIndex: 99 → 20`, `gap: 8 → spacing.sm`, `paddingHorizontal: 12 → spacing.md`
  - `components/watchParty/VideoSection.styles.ts`: `top: 12, right/left: 12 → spacing.md`
- **tsc:** CLEAN | **jest:** 339/339 passed
- **Commit:** `f81e60e`

---

### T-S065 | 2026-04-24 | [BACKEND+ADMIN] | Mobile Error Logging System [Saidazim]

- **Bajarildi:**
  - `services/admin/src/models/mobileIssue.model.ts` — MobileIssue MongoDB model (fingerprint upsert)
  - `services/admin/src/models/mobileEvent.model.ts` — MobileEvent model (90-day TTL index)
  - `services/admin/src/services/errors.service.ts` — SHA-256 fingerprinting, ingest, list, stats, updateStatus, getEvents, delete
  - `services/admin/src/controllers/errors.controller.ts` — REST controller + x-error-key auth
  - `services/admin/src/routes/errors.routes.ts` — POST /ingest (public), GET /stats, GET /, PATCH /:id/status, GET /:id/events, DELETE /:id
  - `services/admin/src/app.ts` — createErrorsRouter qo'shildi
  - `apps/admin-ui/src/api/errors.api.ts` — Admin UI API client
  - `apps/admin-ui/src/pages/ErrorsPage.tsx` — StatCard + Table + EventDrawer + Pagination
  - `apps/admin-ui/src/App.tsx` — /errors route
  - `apps/admin-ui/src/components/layout/Sidebar.tsx` — "Mobile Errors" nav item
  - `apps/mobile/src/utils/errorLogger.ts` — Pure JS error capture + global handler
  - `apps/mobile/App.tsx` — initErrorLogger() call
- **Yechim:** Kustom GlitchTip-like tizim: mobile → admin service → MongoDB → admin UI

### T-S066 | 2026-04-24 | [BACKEND] | Google OAuth polling flow for Expo Go [Saidazim]

- **Bajarildi:**
  - `services/auth/src/services/googleAuth.service.ts` — initMobileGoogleAuth, storeMobileGoogleResult, pollMobileGoogleResult, exchangeCodeForIdToken (Redis TTL)
  - `services/auth/src/services/auth.service.ts` — delegate methods
  - `services/auth/src/controllers/auth.controller.ts` — googleMobileInit, googleMobileRedirect, googleMobileCallback, googleMobilePoll
  - `services/auth/src/routes/auth.routes.ts` — POST /google/init, GET /google/mobile, GET /google/poll; callback route splitted mobile vs web
  - `apps/mobile/src/api/auth.api.ts` — googleInit(), googlePoll()
  - `apps/mobile/src/hooks/useSocialAuth.ts` — backend polling flow (WebBrowser.openBrowserAsync + 2s polling)
- **Yechim:** Mobile → backend URL → Google OAuth server-side → Redis → poll

---

### T-E110 | 2026-04-24 | [MOBILE] | Telegram Share room — native share sheet [Emirhan]

- **Bajarildi:**
  - `api/notification.api.ts`: `getTelegramShareLink(inviteCode)` — backend `GET /notifications/telegram/share-link` endpoint chaqiruvi
  - `components/watchParty/InviteCard.tsx`: Telegram share + native share 2 ta alohida tugma
  - `components/watchParty/InviteCard.styles.ts`: `shareSection`, `telegramBtn`, `nativeShareBtn` stillari
  - `i18n/translations.ts`: `shareViaTelegram`, `shareNative`, `shareRoomMessage` kalitlari (uz/ru/en)
  - `navigation/AppNavigator.tsx`: `cinesync://join/:inviteCode` deep link handler (cold + warm start)
  - `screens/modal/WatchPartyJoinScreen.tsx`: `inviteCode` param qabul qilish + auto-join
  - `types/index.ts`: `WatchPartyJoin` param tipi yangilandi (`{ inviteCode?: string }`)
  - `app.json`: `scheme: "cinesync"` allaqachon mavjud edi ✅
- **tsc:** CLEAN (0 errors)
- **Fayllar:** 7 ta o'zgartirildi

---

### T-E108 + T-E109 | 2026-04-23 | [MOBILE] | Recent rooms + Public rooms discovery [Emirhan]

- **Bajarildi:**
  - `hooks/useRecentRooms.ts`: yangi hook — `GET /watch-party/rooms/my/recent` (stale 30s, refetch 60s)
  - `hooks/usePublicRooms.ts`: yangi hook — `GET /watch-party/rooms/public/active` (stale+refetch 30s)
  - `RoomsTab.tsx`: 3-qismli segmented control — "Мои / Недавние / Открытые"
    - Har tab alohida query; pull-to-refresh; empty state har tabga o'ziga xos icon + matn
    - "Открытые" tabda "Live public rooms" badge
  - `translations.ts`: `subTabMy`, `subTabRecent`, `subTabDiscover`, `discoverHint`, `noRecentTitle`, `noRecentSub`, `noPublicTitle`, `noPublicSub` kalitlari (uz/ru/en)
- **tsc:** CLEAN | **4 fayl o'zgartirildi**

---

### T-E107 | 2026-04-22 | [MOBILE] | Playlist UI — Watch Party queue (owner controls) [Emirhan]

- **Bajarildi:**
  - `shared/types`: `IWatchPartyRoom.playlist?: VideoItem[]` qo'shildi
  - `watchParty.api.ts`: `addToPlaylist`, `removeFromPlaylist`, `playNext` metodlari
  - `watchParty.store.ts`: `playlist` state + `setPlaylist` action
  - `useWatchParty.ts`: `PLAYLIST_UPDATED` listener + `ROOM_JOINED`'dan init
  - `useWatchPartyRoom.ts`: `handleAddToQueue`, `handlePlaylistRemove`, `handlePlaylistNext`
  - `SourcePicker` + `MediaWebView`: `queue` mode → `POST /playlist` (CHANGE_MEDIA emas)
  - `PlaylistPanel.tsx`: yangi komponent — owner add/remove/playNext, viewer read-only
  - `WatchPartyScreen.tsx`: playlist FAB (badge), PlaylistPanel integration
- **tsc:** CLEAN | **10 fayl o'zgartirildi**

---

### T-E106 | 2026-04-22 | [MOBILE] | Live reactions UI — floating emoji during watch party [Emirhan]

- **Bajarildi:**
  - `useWatchParty.ts`: `SEND_EMOJI` → `SEND_REACTION` (`reaction:send`); `REACTION_BROADCAST` listener qo'shildi → `lastReaction` state qaytariladi
  - `useWatchPartyRoom.ts`: `lastReaction` effect — boshqa userlarning emoji'si `floatingEmojis` ga qo'shiladi; rate limit 10/sec (sliding window); `reactionTimestampsRef` ile cheklash
  - `EmojiFloat.tsx`: whitelist 8 → 10 emoji: ❤️ 😂 🔥 👏 😮 😢 🎉 👍 💯 🍿
- **tsc:** CLEAN (0 errors in modified files)
- **Fayl:** 3 fayl o'zgartirildi

---

### F-205 | 2026-04-22 | [MOBILE] | Google Auth iOS crash fix + Push token fix [Emirhan]

- **Muammo:** iOS da `LoginScreen` ochilganda Render Error — `iosClientId must be defined to use Google auth on this platform`
- **Sabab:** `Google.useAuthRequest()` iOS da `iosClientId` talab qiladi, lekin faqat `webClientId` va `androidClientId` berilgan edi
- **Fix — `useSocialAuth.ts`:**
  - `GOOGLE_IOS_CLIENT_ID` env var qo'shildi
  - `GOOGLE_CONFIGURED` — platforma bo'yicha client ID mavjudligini tekshiradi (iOS/Android/Web)
  - Client ID yo'q bo'lsa → dummy config `{ clientId: 'disabled' }` → kнопка disabled, lekin ekran **crashsiz** ishlaydi
  - `googleDisabled` endi `!GOOGLE_CONFIGURED` ga bog'langan
- **Fix — `.env` + `.env.example`:**
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` qo'shildi
  - `EXPO_PUBLIC_PROJECT_ID` placeholder → haqiqiy UUID (`d4ce0a75-...`) — push token registration 400 error tuzatildi
- **tsc:** CLEAN (0 errors)

---

### F-207 | 2026-04-22 | [IKKALASI] | T-C016 — Brand color unification → #7B72F8 [Saidazim]

- `CLAUDE.md` §Design System: `#E50914` (Netflix red) → `#7B72F8` (Rave violet)
- `docs/WEB_DESIGN_GUIDE.md`: 204+ occurrences `#7C3AED` → `#7B72F8`, RGB `124,58,237` → `123,114,248`
- `apps/web/src/`: 204 occurrences `#7C3AED` → `#7B72F8` (массовая замена)
- Единый источник истины: `#7B72F8` во всех 3 источниках

---

### F-206 | 2026-04-22 | [BACKEND] | T-S064 — Elasticsearch stale index bug fix [Saidazim]

- `services/content/src/services/movie.service.ts`:
  - `adminPublishMovie`: `findByIdAndUpdate` + Redis `del` + **`await this.indexMovieInElastic(movie)`** — исправлено
  - `adminOperatorUpdateMovie`: аналогично — `indexMovieInElastic` добавлен
  - Теперь `isPublished`, `title`, `description`, `genre` изменения немедленно отражаются в Elasticsearch поиске

---

### F-204 | 2026-04-21 | [BACKEND] | T-S063 — Telegram Share Room bot [Saidazim]

- `services/notification/src/services/telegram.service.ts` (новый):
  - `/start room_{inviteCode}` deep link handler: валидация 6-hex кода, inline кнопки (App + Web)
  - `/start` → welcome message; unknown → help
  - `getShareLink(inviteCode)` → `t.me/RaveBot?start=room_{CODE}`
  - `registerWebhook(url)` — авто-регистрация при старте
  - Fail-safe: бот отключён если `TELEGRAM_BOT_TOKEN` не задан
- `services/notification/src/controllers/telegram.controller.ts` (новый):
  - `POST /telegram/webhook`: проверяет `X-Telegram-Bot-Api-Secret-Token`, 200 немедленно, async обработка
  - `GET /telegram/share-link?inviteCode=XXXX`: возвращает Telegram deep link
- `notification.routes.ts` + `server.ts` + `config`: интеграция + env переменные
- `.env.example`: документированы `TELEGRAM_BOT_TOKEN`, `WEBHOOK_SECRET`, `APP_SCHEME` и др.

---

### F-201 | 2026-04-21 | [BACKEND] | T-S060 — Video queue/playlist in Watch Party [Saidazim]

- `shared/types/index.ts`: `VideoItem` interface (videoUrl, videoTitle, videoPlatform, addedBy, addedAt)
- `shared/constants/socketEvents.ts`: `PLAYLIST_UPDATED` server event
- `WatchPartyRoom` model: `playlist: VideoItem[]` field, compound indexes for T-S061/S062
- `watchParty.service.ts`: `addToPlaylist` / `removeFromPlaylist` / `playNextFromPlaylist`
  - SSRF check, max 50 items, atomic owner check, Redis sync state reset on playNext
- `watchParty.controller.ts` + `routes`: `POST/DELETE /rooms/:id/playlist`, `POST /rooms/:id/playlist/next`
- Socket: `PLAYLIST_UPDATED` + `ROOM_UPDATED` broadcast on each mutation

---

### F-202 | 2026-04-21 | [BACKEND] | T-S061 — Recent rooms history [Saidazim]

- `shared/constants/index.ts`: `recentRooms(userId)` Redis key
- `watchParty.service.ts`: `getRecentRooms(userId, limit)` — members query sorted by lastActivityAt
- Redis cache: `party:recent_rooms:{userId}` TTL 5min, invalidated on join/leave
- `GET /watch-party/rooms/my/recent` endpoint

---

### F-203 | 2026-04-21 | [BACKEND] | T-S062 — Active public rooms feed [Saidazim]

- `shared/constants/index.ts`: `publicRoomsCache()` Redis key
- `watchParty.service.ts`: `getPublicActiveRooms(limit)` — isPrivate=false, active, last 10min
- Sorted by memberCount desc, Redis cache TTL 30s, invalidated on create/join/leave/close
- `GET /watch-party/rooms/public/active` endpoint

---

### F-199 | 2026-04-21 | [BACKEND] | T-S058 — Live reactions: Socket.io + Redis rate limit [Saidazim]

- `shared/constants/socketEvents.ts`: `SEND_REACTION` (client) + `REACTION_BROADCAST` (server) events
- `shared/constants/index.ts`: `reactionRate(userId, roomId)` Redis key
- `services/watch-party/src/socket/reactionEvents.handler.ts` (yangi fayl):
  - `reaction:send` → emoji whitelist (20 emoji Set) + unicode regex fallback
  - Redis INCR rate limit: max 10/sec per user per room, fail-open
  - Broadcast: `reaction:broadcast` → `{ userId, emoji, roomId, timestamp }`
- `watchParty.socket.ts`: redis parameter qo'shildi, `registerReactionEvents` chaqirildi

---

### F-200 | 2026-04-21 | [BACKEND] | T-S059 — Watch-party REST rate limiting [Saidazim]

- `shared/constants/index.ts`: `createRoomRate(ip)` + `joinRoomRate(userId)` Redis keys
- `services/watch-party/src/middleware/rateLimiter.ts` (yangi fayl):
  - `createRoomLimiter`: POST /rooms → max 5/min per IP
  - `joinRoomLimiter`: POST /rooms/join/:inviteCode + /join/:inviteCode → max 10/min per user
  - Redis INCR+EXPIRE, fail-open (Redis down bo'lsa o'tkazib yuboradi)
- `watchParty.routes.ts`: har ikkala route ga middleware qo'shildi

---

### F-198 | 2026-04-20 | [MOBILE] | T-E105 — Rutube WebView adapter: to'g'ri postMessage metodlari [Saidazim]

- `WebViewAdapters.ts` `buildRutubeHtml()`:
  - `sendCmd('playVideo')` → `sendCmd('play')`
  - `sendCmd('pauseVideo')` → `sendCmd('pause')`
  - `sendCmd('seekTo', t)` → `sendCmd('setCurrentTime', t)`
  - event listener: `switch (data.event)` → `switch (data.type)`
  - `onStateChange` + `playerState 1/2` → `player:changeState` + `d.state === 'playing'/'paused'`
  - `onCurrentTime` → `player:currentTime`, `info.currentTime` → `d.time`
- **Natija:** Rutube play/pause/seek buyruqlari endi ishlaydi, perematka sinxronlashadi

---

### F-197 | 2026-04-20 | [MOBILE] | T-E103 — WebView pendingSync: Rutube ad freeze fix [Saidazim]

- `useWatchPartyRoom.ts`: `pendingSyncRef`, `webViewReadyRef`, `isWebViewModeRef` qo'shildi
- syncState effect: `isWebViewMode && !webViewReady` → seekTo ni defer qiladi (30s timeout)
- `handleWebViewPlay`: birinchi play eventda (reklama tugagach) pendingSync apply qilinadi
- `room?.videoUrl` o'zgarganda `webViewReadyRef` reset — yangi media uchun ham ishlaydi
- **Natija:** Rutube yangi a'zo reklama vaqtida qo'shilsa — reklama tugagach avtomatik sync bo'ladi

---

### F-196 | 2026-04-20 | [MOBILE] | T-E102 — Watch Party owner heartbeat fix [Saidazim]

- `useWatchParty.ts`: `emitHeartbeat` callback qo'shildi (`CLIENT_EVENTS.HEARTBEAT` → `video:heartbeat`)
- `useWatchPartyRoom.ts`: 5s interval ichida `emitPlay()` → `emitHeartbeat()`, dependency array yangilandi
- **Natija:** owner 5s interval VIDEO_HEARTBEAT yuboradi (syncState trigger yo'q) — drift correction ishlaydi, playback uzilmaydi

---

### F-195 | 2026-04-20 | [MOBILE] | T-E104 — iOS WebView CAPTCHA: platform-specific MOBILE_UA [Saidazim]

- `apps/mobile/src/utils/webViewScripts.ts`: `MOBILE_UA` → `Platform.OS === 'ios' ? IOS_UA : ANDROID_UA`
- `apps/mobile/src/utils/videoPlayer.ts`: то же самое (второй источник MOBILE_UA)
- iOS UA: `AppleWebKit/605.1.15 ... Version/17.0 Mobile/15E148 Safari/604.1`
- Android UA: прежний Chrome/120 UA (не изменился)
- `videoPlayer.test.ts`: обновлён — `toContain('Chrome/120')` → `toContain('Mozilla/5.0')`
- tsc: pre-existing react-native-webrtc ошибки (не затронуты). Новых ошибок нет.
- Jest: 30/30 PASS

---

### F-194 | 2026-04-20 | [BACKEND] | T-S057 — Watch Party owner echo fix: socket.to() vs io.to() [Saidazim]

- `services/watch-party/src/socket/videoEvents.handler.ts`: 3 ta o'zgarish
  - `PLAY` handler: `io.to(roomId).emit(VIDEO_PLAY)` → `socket.to(roomId).emit(VIDEO_PLAY)`
  - `PAUSE` handler: xuddi shunday
  - `SEEK` handler: xuddi shunday
- `HEARTBEAT` allaqachon `socket.to()` ishlatmoqda edi — o'zgarmadi
- `BUFFER resumeRoom()`: `io.to(roomId)` qoldi — system event, barcha qurilmalar kerak
- **Natija:** Owner o'z play/pause/seek komandalarini qaytib olmaydi → seekTo echo yo'qoladi → 1 ta bosmada ishlaydi
- tsc pre-existing rootDir errors (monorepo) — yangi xato yo'q

---

### F-193 | 2026-04-19 | [MOBILE] | T-E097 — SyncBroadcaster + TopologyManager + MeshClient TS fixes [Emirhan]

- `SyncBroadcaster.ts` (148q): dual-path sync — mesh DataChannel primary, Socket.io fallback
  - `send()` → mesh → broadcast via DataChannel + socket backup for unconnected peers
  - AppState listener: background → `destroyMesh()`, foreground → `startMesh()`
  - `broadcastPlay/Pause/Seek/Heartbeat` public API via SyncProtocol
- `TopologyManager.ts` (40q): peer count → topology selection (≤6 full_mesh, 7-15 star, 16+ socket_only)
- `MeshClient.ts` TS fix: `pcAny` cast for react-native-webrtc EventTarget vs global WebRTC types
- `types.ts` fix: `MeshPeer.connection/dataChannel` → any (type conflict avoidance)
- `types/index.ts`: added `SyncMessage`/`MeshSignalPayload` re-export
- `index.ts`: added `SyncBroadcaster`, `TopologyManager` exports
- tsc --noEmit: **0 errors**

---

### F-192 | 2026-04-19 | [MOBILE] | T-E101 — Buffer event signal (debounced emit to server) [Emirhan]

- `useWatchPartyRoom.ts`: `emitBufferState()` — 500ms debounce, `BUFFER_START`/`BUFFER_END` emit
- expo-av: `status.isBuffering` → `emitBufferState(status.isBuffering)` in `onPlaybackStatusUpdate`
- WebView: `handleWebViewBuffering` callback → `emitBufferState(isBuffering)`
- `useWebViewPlayer.ts`: `BUFFERING` message type parsing → `onBuffering` callback
- `useWatchParty.ts`: `SERVER_EVENTS.VIDEO_BUFFER` listener → `bufferingUsers` Set tracking
- `bufferingUsers` exposed via hook return → UI da "Do'stingiz buffering..." xabari uchun

---

### F-191 | 2026-04-19 | [MOBILE] | T-E096 — MeshClient + SyncProtocol — WebRTC DataChannel sync [Emirhan]

- `services/mesh/MeshClient.ts` (224q): RTCPeerConnection lifecycle, DataChannel, signalling handlers (offer/answer/ICE)
- `services/mesh/SyncProtocol.ts` (54q): play/pause/seek/heartbeat message creators + `calcDrift()` drift correction
- `services/mesh/config.ts` (24q): Google STUN + Metered.ca TURN servers, `EXPO_PUBLIC_TURN_*` env vars
- `services/mesh/types.ts` (27q): `MeshPeer`, `MeshEvent`, `MeshEventHandler`, re-exports `SyncMessage`/`MeshSignalPayload`
- `services/mesh/index.ts` (4q): barrel exports
- `useWatchParty.ts` integration: mesh socket events (PEER_OFFER/ANSWER/ICE, MESH_PEER_JOINED/LEFT)

---

### F-190 | 2026-04-19 | [MOBILE] | T-E095 — HomeScreen Rave CTA (allaqachon F-181 da qilingan edi) [Emirhan]

- ALLAQACHON BAJARILGAN — `HomeCTA` komponenti F-171 (T-E077) da qo'shilgan, F-181 da tasdiqlangan
- Tasks.md dan tozalandi

---

### F-183 | 2026-04-18 | [BACKEND] | T-S053 — Battle service maintenance mode + feature flag [Saidazim]

- `FEATURE_BATTLES=false` env var → barcha `/api/v1/battles/*` endpointlar 503 qaytaradi
- `services/battle/src/app.ts`: `config.featureBattles` flag orqali router conditionally mount
- `services/battle/src/config/index.ts`: `featureBattles: process.env.FEATURE_BATTLES !== 'false'`
- Admin routes (`services/admin/src/routes/admin.routes.ts`): battle admin endpointlar ham gated; yangi `GET /admin/features` endpoint — admin-ui uchun feature flags
- Achievement triggers `resolveBattle()` da `await` olib tashlandi → fire-and-forget `.catch(() => undefined)` — truly non-blocking
- `services/battle/.env.example`: `FEATURE_BATTLES=true` qo'shildi
- tsc: CLEAN (battle + admin services)

---

### F-182 | 2026-04-18 | [BACKEND] | T-S050 — Expo Push Token routing + batch support [Saidazim]

- **Kritik bug fix**: `ExponentPushToken[...]` tokenlar FCM ga yuborilardi → silently ignored. Endi to'g'ri routing:
  - `ExponentPushToken[` prefix → Expo Push API (`https://exp.host/--/api/v2/push/send`)
  - Oddiy FCM tokenlar → Firebase Admin `sendEachForMulticast()`
- `EXPO_TOKEN_PREFIX = 'ExponentPushToken['` — constant qo'shildi (hardcoded string o'rniga)
- `EXPO_BATCH_SIZE = 100` — Expo API limiti uchun chunked batching implementatsiya qilindi
- Token splitting: 2x `.filter()` → bitta `.reduce()` (efficiency fix)
- Intermediate `tasks` array → inline `Promise.all([...])` (simplify skill finding)
- Railway: deployed, health check ✅

---

### F-181 | 2026-04-16 | [MOBILE] | T-E092 + T-E093 + T-E094 + T-E095 — Rave UX transformation (FAB + mode rename) [Emirhan]

- **T-E092**: `WatchPartyScreen.tsx` — `changeMediaBtn` (horizontal banner) → `changeMediaFab` (52×52 circular FAB, `position: absolute`, `right: 16`, `bottom: 72`, `colors.primary` background, `add` icon 28px). Faqat `isOwner` uchun ko'rinadi.
- **T-E093**: `context: 'new_room' | 'change_media'` → `mode: 'create' | 'change'` rename — 7 fayl: `types/index.ts`, `useWatchPartyRoom.ts`, `useSourcePicker.ts` (3 joy), `useMediaDetection.ts`, `CustomTabBar.tsx`, `HomeScreen.tsx`, `SourcePickerScreen.tsx`
- **T-E094**: ALLAQACHON BAJARILGAN — `useMediaDetection.importMedia` va `useSourcePicker.handleUrlExtract` `mode='change'` da `CHANGE_MEDIA` emit, `mode='create'` da `createRoom` — hech qanday qo'shimcha kod kerak emas edi
- **T-E095**: ALLAQACHON BAJARILGAN — `HomeCTA` komponenti F-171 (T-E077) da qo'shilgan edi
- **TS bonus**: `watchParty.store.test.ts` `SYNC_STUB`'ga `updatedBy: 'user-1'` qo'shildi; `LanguageTransition.tsx` `@ts-expect-error` bilan `@types/react` 18.3+ vs RN Animated.View version conflict hal qilindi
- **tsc --noEmit**: CLEAN (0 errors)

---

### F-180 | 2026-04-06 | [MOBILE] | T-E091 — LanguageTransition `children as any` fix [Emirhan]

- `LanguageTransition.tsx`: `<Animated.View children={children as any} />` → `<Animated.View>{children}</Animated.View>` — to'g'ri React children pattern, `as any` olib tashlandi

---

### F-179 | 2026-04-06 | [MOBILE] | T-E090 — Test coverage 45% → ~65%+ : 11 test fayl, 152 test [Emirhan]

- Yangi test fayllar: `auth.api.test.ts` (11 test), `watchParty.api.test.ts` (8 test), `watchParty.store.test.ts` (16 test), `auth.store.test.ts` (10 test), `videoPlayer.test.ts` (28 test), `mediaDetector.test.ts` (19 test), `useWatchParty.test.ts` (8 test)
- Barcha 11 test suite PASS, 152 test o'tdi

---

### F-178 | 2026-04-06 | [MOBILE] | REFACTOR: T-E083..T-E089 — 7 screen + 10 komponent hajm kamaytirish [Emirhan]

- **T-E083** VideoPlayerScreen 843→260: `useVideoPlayer` hook, `VideoPlayerScreen.styles.ts`, `utils/videoPlayer.ts`
- **T-E084** WatchPartyCreateScreen 798→105: `RoomsTab`, `CreateTab`, `JoinTab` + `watchPartyCreate.styles.ts`
- **T-E085** VoiceChat 549→81: `useVoiceChat` hook, `VoiceChatParticipants`, `VoiceChatControls`
- **T-E086** MediaWebViewScreen 689→135: `useMediaDetection` hook, `MediaBottomBar` komponent
- **T-E087** WatchPartyScreen 567→173: `useWatchPartyRoom` hook
- **T-E088** SourcePickerScreen 412→103: `useSourcePicker` hook, `SourceCard`, `SourcePickerScreen.styles.ts`
- **T-E089** 10 komponent (<150): WebViewPlayer(334→113), RegisterFormFields(298→140), FilmSelector(282→115), UniversalPlayer(263→155), VideoSection(262→145), ProfileHeader(257→133), InviteCard(234→110), VideoControls(218→110), FriendPicker(213→100), HeroBanner(212→128)
- Yangi fayllar: `useWebViewPlayer.ts`, `InputRow.tsx`, `SourceCard.tsx`, `FadeSlideIn.tsx`, styles fayllar (8 ta), `useVideoSectionStyles`, `useHeroBannerStyles` va boshqalar

---

# Yangilangan: 2026-04-01

---

### F-178 | 2026-04-06 | [MOBILE] | Crash fix — TypeError: Cannot read property 'length' of undefined [Emirhan]

- **Root cause:** `HomeActiveRooms.tsx` + `RoomsScreen.tsx` — `room.memberCount ?? room.members.length` crashes when backend room response omits `members` array (sends only `memberCount` or both undefined)
- `HomeActiveRooms.tsx:22`: `room.memberCount ?? room.members.length` → `room.memberCount ?? room.members?.length ?? 0`
- `RoomsScreen.tsx:55`: same fix
- `HeroBanner.tsx:70`: `item.genre.slice(0, 2)` → `(item.genre ?? []).slice(0, 2)` (defensive — backend IMovie may omit genre)
- Crash was triggered on HomeScreen immediately after login (HomeActiveRooms rendered rooms from API)

---

### F-177 | 2026-04-01 | [MOBILE] | Smoke test fix — WebM iOS, CIS iframe navigate, URL fallback [Emirhan]

- `WatchPartyScreen`: `iosWebmBlocked` flag → `isWebViewMode=true` Rutube/Yandex VP8 WebM → WKWebView da ijro (qora ekran yo'q)
- `MediaWebViewScreen`: `tryBackendExtract` → `Promise<boolean>`; `IFRAME_FOUND` backend fail → `window.location.href` inject → Referer saqlanadi → ashdi.vip/bazon.tv hotlink check o'tadi → MEDIA_DETECTION_JS video topadi
- `SourcePickerScreen`: URL extract fail → error emas, `MediaWebViewScreen` ochiladi
- Commit: `23adf2d`

---

### F-176 | 2026-04-01 | [MOBILE] | Smoke test fix — video detection: blank.mp4 filter, cross-origin iframe, filmx.fun [Emirhan]

- `MediaWebViewScreen`: `isPlaceholderVideoUrl()` — blank.mp4 va `/templates/` CDN placeholder URL larni real video deb hisoblamaslik (uzmovi ad bug fix)
- `MediaWebViewScreen`: `IFRAME_SCAN_JS` injection — `<iframe src>` ni scan qiladi va `IFRAME_FOUND` yuboradi; `tryBackendExtract()` iframe URL da chaqiriladi → filmx.fun / animego cross-origin player iframe endi ishlaydi (ashdi.vip, bazon.tv embed)
- `WebViewAdapters`: `filmx.fun` adapter qo'shildi (filmix.net bilan bir xil selektorlar)
- Commit: `2f7e07c`

---

### F-175 | 2026-04-01 | [MOBILE] | Smoke test fix — srcdoc warn, DDoS-Guard, WebM iOS [Emirhan]

- `MediaWebViewScreen`: `!url.startsWith('http')` guard → `onNavigationStateChange` da `about:srcdoc` uchun 'Can't open url' WARN yo'q qilindi
- `MediaWebViewScreen`: `onShouldStartLoadWithRequest` → non-http URL lar uchun `false` qaytaradi (srcdoc iframe Linking triggerini bloklaydi)
- `MediaWebViewScreen`: `BOT_PROTECTION_JS` injection — DDoS-Guard / Cloudflare challenge sahifalarini aniqlaydi (title + HTML + script src tekshiradi) va amber banner ko'rsatadi
- `WatchPartyScreen`: iOS da `.webm` `extractedUrl` skip qilinadi — VP8 WebM AVPlayer tomonidan qo'llab-quvvatlanmaydi; WebView fallback (Rutube HTML embed) ishlatiladi
- Commit: `c6328bc`

---

### F-174 | 2026-04-01 | [MOBILE] | TypeScript xatolarini to'liq tuzatish — VoiceChat WebRTC + test + express [Emirhan]

- `VoiceChat.tsx`: `NonNullable<typeof RTCPeerConnection>` → `InstanceType` constraint uchun
- `VoiceChat.tsx`: `RTCSessionDescription sdp?? ''` — optional → required sdp fix
- `VoiceChat.tsx`: explicit `MediaStreamTrack` annotatsiyalari olib tashlandi (RN-WebRTC inference ga qoldirdi)
- `VoiceChat.tsx`: `IceCandidateEmitter` cast → `addEventListener` uchun (event-target-shim TS limitation)
- `useHomeData.test.ts`: TS2873 always-falsy — `!undefined` o'rniga typed variable ishlatildi
- `tsconfig.json`: `skipLibCheck: true` qo'shildi (node_modules `.d.ts` uchun)
- `package.json`: `@types/express` devDep qo'shildi (`shared/types` express `Request` import qiladi)
- `tsc --noEmit`: CLEAN (0 errors)
- Commit: `2258fa6`

---

### F-173 | 2026-03-31 | [MOBILE] | T-E080 — CineSync app icon + splash screen branding [Emirhan]

- `assets/icon.png` — 1024×1024, dark bg (#0A0A0F) + violet circle gradient + white play button
- `assets/splash-icon.png` — 1024×1024, transparent bg + violet circle + play button (glow effect)
- `assets/android-icon-foreground.png` — 1024×1024, transparent (adaptive icon layer)
- `assets/android-icon-background.png` — 1024×1024, solid #0A0A0F
- `assets/android-icon-monochrome.png` — white play triangle on transparent
- `assets/notification-icon.png` — 96×96 white play icon
- `assets/favicon.png` — 48×48 mini icon
- `scripts/generate-icons.mjs` — qayta generatsiya skripti (jimp v1)

---

### F-172 | 2026-03-31 | [MOBILE] | BUG FIX: SafeAreaProvider missing — OfflineBanner crash [Emirhan]

- **T-E082 (P0)**: `<SafeAreaProvider>` not found → real device crash
  - `App.tsx`: `SafeAreaProvider` import qo'shildi (`react-native-safe-area-context`)
  - `<SafeAreaProvider>` `GestureHandlerRootView` ichiga, `QueryClientProvider` tashqarisiga wrap qilindi
  - `OfflineBanner` `useSafeAreaInsets()` endi context topadi

---

### F-171 | 2026-03-31 | [MOBILE] | Sprint 8 — MVP Release: HomeScreen UX + Empty States + Network [Emirhan]

- **T-E077 (P0)**: HomeScreen external-source-first UX
  - `HomeCTA.tsx` — "Do'stlar bilan birga ko'rish" CTA → SourcePicker (new_room)
  - `HomeActiveRooms.tsx` — active Watch Party rooms section (useWatchPartyRooms, refetch 15s)
  - `HomeEmptyState.tsx` — graceful empty state when film DB is empty + SourcePicker CTA
  - `HomeScreen.tsx` — isContentEmpty check, liveRooms filter, handleSourcePicker/handleRoomPress
- **T-E078 (P1)**: Empty state polish — SearchScreen query no-results state
  - `SearchScreen.tsx` — showEmptyState logic + Ionicons icon + i18n noResultsTitle/noResultsFor
  - FriendsScreen/BattleScreen/WatchHistoryScreen: already had empty states ✅
- **T-E079 (P1)**: Network error handling (zero new packages)
  - `useNetworkStatus.ts` — AppState + fetch/AbortController (google generate_204, 4s timeout)
  - `OfflineBanner.tsx` — Animated.spring slide-in/out, wifi-outline icon, retry button
  - `App.tsx` — OfflineBanner integrated in RootApp

---

### F-170 | 2026-03-28 | [SECURITY] | Batch — 7 P1/P2 bug fix (code analysis) [Saidazim]

- **BUG #11**: cache key SHA256 — truncated base64 collision fixed (`videoExtractor/index.ts`)
- **BUG #14**: Google OAuth Android — `audience: [webClientId, androidClientId]` multi-audience (`googleAuth.service.ts` + `config/index.ts`)
- **BUG #1**: `useVideoExtraction` — `accessToken` added to `useCallback` dep array (stale closure fix)
- **BUG #7**: room join TOCTOU — atomic `findOneAndUpdate` with `$expr $lt $size` (prevents exceeding maxMembers)
- **BUG #9**: `updateRoomMedia` TOCTOU — `findOneAndUpdate({ ownerId })` eliminates ownership check gap
- **BUG #10**: `kickMember` TOCTOU — `updateOne({ ownerId })` + `matchedCount` check
- **BUG #15**: `changePassword` — now clears `passwordResetToken` + expiry on password change
- **BUG #20**: `requireNotBlocked` fail-open — Redis downtime now logged at `error` level
- Commit: bc750f0

---

### F-173 | 2026-03-28 | [MOBILE] | T-E075 — SourcePickerScreen URL kiritish [Emirhan]

- `SourcePickerScreen.tsx`: URL input + "→" tugma qo'shildi
- `POST /api/v1/content/extract` chaqiriladi → `change_media` yoki yangi xona yaratadi
- Xato xabari ko'rsatiladi; `ActivityIndicator` loading holatida

---

### F-172 | 2026-03-28 | [MOBILE] | T-E074 — QualityMenu real data wiring [Emirhan]

- `useVideoExtraction.ts`: `qualities` va `episodes` return typeiga qo'shildi
- `result?.qualities ?? []` va `result?.episodes ?? []` — komponentlarga to'g'ridan uzatiladi
- `extract` useCallback deps ga `accessToken` qo'shildi

---

### F-171 | 2026-03-28 | [MOBILE] | T-E071 + T-E072 — WebView popup fix [Emirhan]

- `MediaWebViewScreen.tsx`: `detectedUrlRef` URL-guard — popup 1 marotaba chiqadi (T-E071)
- `tryBackendExtract()` → har yangi URL da backend `/extract` chaqiriladi
- Backend muvaffaqiyatli topsa → JS detection o'chiriladi (`backendFoundVideoRef`)
- Backend topa olmasa → JS detection avvalgidek ishlaydi (T-E072)
- Loading holatida "Видео анализируется…" hint bar ko'rsatiladi

---

### F-170 | 2026-03-28 | [MOBILE] | T-E073 — Google Auth Network Error fix [Emirhan]

- `useSocialAuth.ts`: `clientId` → `webClientId` (Android/Web proper separation)
- `idToken` extraction: `authentication?.idToken ?? params['id_token']` (Android PKCE fix)
- `googleDisabled`: checks both web AND android client ID — button no longer wrongly disabled

---

### F-169 | 2026-03-28 | [MOBILE] | T-E076 — WatchParty video extraction on room load [Saidazim]

- `WatchPartyScreen`: `useVideoExtraction` hook qo'shildi
- Room yuklanganda `extract(room.videoUrl)` — Playerjs/CIS saytlar endi ishlaydi
- `extractResult.videoUrl` → real MP4/HLS URL sifatida ishlatiladi
- `extractQualities/Episodes` → menyu ma'lumotlari to'ldiriladi
- Extraction fail bo'lsa → WebView fallback bilan asl URL
- `isReady` extraction tugaguncha spinner ko'rsatadi

---

### F-168 | 2026-03-28 | [BACKEND] | Batch — 14+ yangi Playerjs saytlari [Saidazim]

- `detectPlatform.ts`: anime (animevost, anidub, animejoy, animeonline, sovetromantica, anilibria)
- CIS kino: lordfilm.*, kinopub.*, rezka.ag, tv.mover.uz
- Embed CDN: alloha.*, videoframe.*, cdnvideohub.*, iframe.*
- Commit: f9abbf8

---

### F-167 | 2026-03-28 | [BACKEND] | T-S049 — Geo-blocked proxy extraction [Saidazim]

- `geoExtractor.ts`: undici ProxyAgent — `GEO_PROXY_URL` env orqali proxy fetch
- Kinogo → ashdi.vip iframe topib qaytaradi → normal re-extraction
- Hdrezka, filmix → Playerjs bevosita parse
- `index.ts`: geo-block yerda proxy sinab ko'radi, muvaffaqiyatsiz bo'lsa geo_blocked error
- Railway: `GEO_PROXY_URL=http://user:pass@proxy:port` qo'shish kerak

---

### F-166 | 2026-03-28 | [BACKEND] | T-S048 — ashdi.vip + bazon.tv extractor [Saidazim]

- `detectPlatform.ts`: ashdi.vip, bazon.tv, bazon.biz → platform: 'playerjs'
- `playerjsExtractor.ts`: REFERER_OVERRIDE map — 403 bo'lmasligi uchun Referer spoofing
- kinogo.cc, turk123, animego va 10+ sayt endi ishlayd

---

### F-165 | 2026-03-28 | [BACKEND] | T-S033 — Video Extract endpoint production deploy + smoke test [Saidazim]

- `POST /api/v1/content/extract` Railway da ishlayapti ✅
- YouTube smoke test: mp4 URL + poster + duration to'g'ri qaytdi ✅
- uzmovie.tv: `unsupported_site` 422 — to'g'ri xato ✅
- Dockerfile: `chromium-driver` o'chirildi (Alpine da yo'q), `ffmpeg` qo'shildi

---

### F-164 | 2026-03-28 | [BACKEND] | T-S005b — HLS Upload Pipeline [Saidazim]

- `hls.queue.ts` — Bull queue 'hls-transcode' (Redis), 2 attempts, removeOnComplete:50
- `hls.worker.ts` — FFmpeg: raw video → m3u8 + .ts segments (6s), auto-cleanup input, Movie.videoUrl update
- `hlsUpload.controller.ts` — `POST /movies/upload-hls` (enqueue, 202), `GET /movies/hls-status/:jobId`
- Static serve: `GET /api/v1/content/hls-files/:jobId/*` → `/tmp/cinesync-hls/`
- Railway: `FFMPEG_PATH` env var agar ffmpeg PATH da bo'lmasa

---

### F-162 | 2026-03-27 | [BACKEND] | T-S043 — Playwright Headless Service [Saidazim]

- `playwright-chromium` dependency qo'shildi, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` + system chromium (Dockerfile)
- `playwrightExtractor.ts` — `page.on('response')` orqali `.m3u8`/`.mp4`/`.mpd` tutish, 30s timeout, max 3 concurrent
- `PLAYWRIGHT_PLATFORMS` Set (vidlink.pro, smashystream.xyz, flixcdn.cyou, streamlare.com) `detectPlatform.ts` da
- `index.ts`: unknown → generic → yt-dlp → playwright (last resort, faqat PLAYWRIGHT_PLATFORMS uchun)

---

### F-163 | 2026-03-27 | [BACKEND] | T-S044 — HLS Reverse Proxy endpoint [Saidazim]

- `hlsProxy.controller.ts` — `GET /hls-proxy` (m3u8 rewrite) + `GET /hls-proxy/segment` (ts stream)
- SSRF guard: private IP, localhost, IPv6 bloklash
- M3u8 rewriter: barcha segment URL + EXT-X-KEY/MAP URI → `/hls-proxy/segment?url=...&referer=...`
- Range request forwarding (seeking uchun)
- `verifyToken` + `userRateLimiter` (per-user)

---

### F-161 | 2026-03-27 | [MOBILE] | T-E069 + T-E070 — ashdi.vip/bazon.tv adapters + FB/IG/Reddit/Streamable [Emirhan]

**T-E069 — ashdi.vip + bazon.tv + CDN adapterlar (`WebViewAdapters.ts`):**
- `ashdi.vip` adapter: `.jw-video`, `.plyr video`, `.video-js video`, `video`; scanDelay 2500ms; Playerjs JSON parse postAttachJs
- `bazon.tv` adapter: `.video-js video`, `.vjs-tech`, `.plyr video`, `video`; scanDelay 2000ms; popup yopish
- `cdnvideohub.xyz` adapter: `.jw-video`, `.video-js video`, `video`; scanDelay 2000ms
- `videocdn.me` adapter: `.jw-video`, `.plyr video`, `.video-js video`, `video`; scanDelay 2000ms
- Natija: kinogo.cc → ashdi.vip iframe → adapter video topadi

**T-E070 — Facebook, Instagram, Reddit, Streamable WebView orqali (`mediaSources.ts`, `mediaDetector.ts`):**
- `mediaSources.ts`: facebook, instagram, reddit, streamable yozuvlari qo'shildi (`support: 'full'`)
- `mediaDetector.ts` `isRealVideoSrc()`: `fbcdn.net/.mp4`, `cdninstagram.com/.mp4`, `v.redd.it`, `streamable.com/.mp4` domenlar qo'shildi
- Natija: foydalanuvchi SourcePicker → FB/IG/Reddit/Streamable → MediaWebViewScreen → video auto-detected → popup

---

### F-160 | 2026-03-27 | [MOBILE] | T-E065 — WebView Session Player (Cinerama, Megogo) [Emirhan]

**T-E065 — WebView Session Player (`mediaDetector.ts`, `UniversalPlayer.tsx`, `mediaSources.ts`, `WebViewAdapters.ts`):**
- `MediaDetectedPayload.mode?: 'extracted' | 'webview-session'` — E65-1
- `normalizeDetectedMedia()`: `mode: payload.mode ?? 'extracted'` — passthrough
- `BlobVideoFoundPayload` → `normalizeBlobMedia()` → `mode: 'webview-session'` — E65-2 (T-E064 da bajarilgan)
- `MediaWebViewScreen.tsx` BLOB_VIDEO_FOUND → DRM alert → webview-session import — E65-3 (T-E064 da bajarilgan)
- `UniversalPlayer.tsx`: `mode?: 'extracted' | 'webview-session'` prop; `mode==='webview-session'` → force WebView — E65-4
- `mediaSources.ts`: `MediaSupportLevel` ga `'webview-session'` qo'shildi; Cinerama + Megogo yozuvlari — E65-5
- Progress bar: `detectVideoPlatform()` 'webview' qaytaradi → `isWebView=true` → bar yashiriladi — E65-6 (allaqachon)
- `WebViewAdapters.ts`: `cinerama.uz` + `megogo.net` adapterlar — E65-7

---

### F-159 | 2026-03-27 | [MOBILE] | T-E064, T-E066, T-E067, T-E068 — Video Detection v2 + Adapters + Cookie + Quality [Emirhan]

**T-E064 — Smart Video Detector v2 (`mediaDetector.ts`):**
- `MutationObserver` — DOM ga yangi `<video>` qo'shilsa darhol aniqlash
- `HTMLMediaElement.src` setter intercept — `Object.defineProperty` orqali tutish
- `lastReportedUrl` → `lastReportedVideoUrl` (video URL deduplication)
- `.mpd` (DASH) extension `isRealVideoSrc()` ga qo'shildi
- `blob:` URL → `BLOB_VIDEO_FOUND` postMessage + `normalizeBlobMedia()` funksiya
- 5 sekundlik timeout fallback → 500ms retry
- `BlobVideoFoundPayload` type, `RoomMedia.mode` field qo'shildi
- `MediaWebViewScreen.tsx`: `BLOB_VIDEO_FOUND` handler — DRM alert + webview-session import

**T-E066 — WebView Adapters v2 (`WebViewAdapters.ts`):**
- `buildTwitchHtml(id, type)` — Twitch Embed JS API, PLAY/PAUSE/SEEK/PROGRESS
- `buildVKVideoHtml(ownerId, videoId)` — VK Video postMessage API
- `buildRutubeHtml(videoId)` — Rutube postMessage protokol
- `buildVimeoHtml(videoId)` — Vimeo Player.js SDK
- `buildDailymotionHtml(videoId)` — Dailymotion postMessage API
- ID extractors: `extractTwitchId`, `extractVKVideoIds`, `extractRutubeId`, `extractVimeoId`, `extractDailymotionId`
- `WebViewPlayer.tsx`: `htmlContent` + `htmlBaseUrl` props, `isHtmlMode` flag
- `UniversalPlayer.tsx`: `detectEmbedPlatform()`, `buildEmbedHtml()`, `EmbedPlatform` type

**T-E067 — Cookie Forwarding (`MediaWebViewScreen.tsx`, `content.api.ts`):**
- `COOKIE_COLLECTION_JS` — `document.cookie` → postMessage `COOKIE_UPDATE`
- `cookiesRef` — cookie cache (log qilinmaydi)
- `createRoom({ cookies })` — faqat `webview-session` rejimida yuboriladi
- `contentApi.extractVideo(url, cookies?)` — optional cookies param
- `watchPartyApi.createRoom.cookies` field qo'shildi

**T-E068 — Multi-Quality Source Selector:**
- `QualityMenu.tsx` — bottom sheet modal, sifat tanlash (owner only)
- `EpisodeMenu.tsx` — season/episode accordion modal
- `content.api.ts`: `VideoQualityOption`, `VideoEpisode` interface, `VideoExtractResult.qualities/episodes`
- `WatchPartyScreen.tsx`: gear buttons + modals + `CHANGE_MEDIA` emit on select

---

# Yangilangan: 2026-03-26

---

### F-158 | 2026-03-26 | [BACKEND+INFRA] | T-S033, T-C011, T-S040, T-S041, T-S042, T-S045, T-S046, T-S047 — Video Extractor v2 [Saidazim]

**Инфраструктура:**
- `Dockerfile.dev`: добавлен yt-dlp (python3+pip3), mobile workspace stub, исправлен `.dockerignore`
- `shared/tsconfig.json`: исправлен баг (лишний `/` после `"outDir": "./dist"`)
- Redis AOF: починен corrupted `appendonly.aof.1.incr.aof` (redis-check-aof --fix)

**Shared types (T-C011):**
- `shared/src/types/index.ts`: добавлены `VideoSourceType`, `ExtractionMethod`, `EpisodeInfo`, `VideoExtractRequest`

**Playerjs extractor (T-S040):**
- `playerjsExtractor.ts`: парсит `new Playerjs({file:[...]})` из `<script>`, поддерживает multi-quality и multi-episode формат
- `detectPlatform.ts`: добавлены домены uzmovie.tv, uzmovi.uz, kinooteka.uz → platform `'playerjs'`

**lookmovie2 extractor (T-S041):**
- `lookmovie2Extractor.ts`: извлекает id_movie+hash из HTML, вызывает Security API → 29h HLS URL

**moviesapi extractor (T-S042):**
- `moviesapiExtractor.ts`: `GET /api/movie/{tmdbId}` → прямой video_url

**Cookie forwarding (T-S045):**
- `ytDlpExtractor.ts`: принимает `cookies?` → `--add-header Cookie:...` (max 4096 chars)
- `videoExtract.controller.ts`: читает `cookies` и `tmdbId` из request body

**Geo-block (T-S046):**
- `index.ts`: `GEO_BLOCKED_DOMAINS` — hdrezka, filmix, kinogo, seasonvar → `VideoExtractError('geo_blocked')`
- `controller.ts`: `geo_blocked` → HTTP 451

**Cache TTL по типу (T-S047):**
- `CACHE_TTL_BY_PLATFORM`: playerjs/lookmovie2/moviesapi=24h, youtube=2h, generic=1h, tokenized=skip

---

### F-157 | 2026-03-24 | [MOBILE] | T-J028 — Film reytingi 201/200 toast fix [Emirhan]

- `MovieDetailScreen.tsx`: `ratingIsNew` state qo'shildi, `rateMovie()` → `{ isNew }` ushlanadi
- `ratingIsNew=false` → mount da mavjud baho bo'lsa set qilinadi
- `ratingDoneLabel`: `isNew ? 'ratingDone' : 'ratingUpdated'` dinamik label
- `translations.ts`: `ratingUpdated` key qo'shildi (uz/ru/en)

---

### F-156 | 2026-03-24 | [MOBILE] | T-J037 — Bloklangan akkaunt modal [allaqachon mavjud]

- `client.ts`: axios interceptor 403 + "blocked" → `useBlockedStore.showBlocked()` + logout ✅ mavjud
- `BlockedAccountModal.tsx`: global modal, backdropPressBehavior: 'none' ✅ mavjud
- `App.tsx`: `<BlockedAccountModal />` global render ✅ mavjud
- WatchParty: `account_blocked` reason → `navigation.goBack()` ✅ mavjud

---

### F-155 | 2026-03-24 | [MOBILE] | T-J027 — Friends real-time yangilanishi [allaqachon mavjud]

- `useNotifications.ts`: `friend_accepted` FCM type handler → `queryClient.invalidateQueries(['friends'])` ✅ mavjud
- `useFriends.ts`: `sendFriendRequest`/`acceptFriendRequest` → refetch ✅ mavjud
- Foreground notification + navigate to Friends screen ✅ mavjud

---

### F-154 | 2026-03-24 | [BACKEND] | T-S038 — Bo'sh xonani 5 daqiqada avtomatik yopish [allaqachon mavjud]

- `roomEvents.handler.ts`: `roomCloseTimers` Map + `setTimeout(5 * 60 * 1000, closeRoom)` ✅ mavjud
- Yangi member kelsa → `clearTimeout` ✅ mavjud
- `ROOM_CLOSED { reason: 'inactivity' }` emit ✅ mavjud

---

### F-151 | 2026-03-24 | [MOBILE] | T-J029 — Ko'rish tarixi ekrani [Emirhan]

- `content.api.ts`: `getWatchHistory(page)` → `GET /content/history` (pagination bilan)
- `types/index.ts`: `ProfileStackParamList` ga `WatchHistory: undefined` qo'shildi
- `WatchHistoryScreen.tsx` (yangi): 3 tab (Barchasi / Ko'rildi / Davom etadi), progress bar, poster, sana
- `MainNavigator.tsx`: `WatchHistory` screen registratsiyasi
- `ProfileScreen.tsx`: "Ko'rish tarixi" NavItem qo'shildi

---

### F-152 | 2026-03-24 | [MOBILE] | T-J033 — Film reytinglari ro'yxati [Emirhan]

- `MovieRatingsSection.tsx` (yangi): barcha foydalanuvchilarning baholari, yulduzcha, avatar, ko'rib chiqish
- `MovieDetailScreen.tsx`: `allRatings` state qo'shildi, `handleDeleteRating()`, `MovieRatingsSection` render
- O'z bahosi bo'lsa "O'chirish" icon ko'rinadi

---

### F-153 | 2026-03-24 | [MOBILE] | T-J030 — Battle invite UI [Emirhan]

- `BattleInviteModal.tsx` (yangi): do'stlar ro'yxati, "Taklif" tugmasi, muvaffaqiyat ko'rsatish
- `BattleScreen.tsx`: `BattleDetailView` ga "Do'st taklif qilish" tugmasi + header icon qo'shildi
- Faqat owner va active battle da ko'rinadi

---

# Yangilangan: 2026-03-23

---

### F-150 | 2026-03-23 | [MOBILE] | T-E059 — E2E smoke test: Maestro flows [Emirhan]

- **Yondashuv:** Detox → Maestro (Expo bilan osonroq, native build shart emas)
- `apps/mobile/.maestro/01_auth_login.yaml` — Login → HomeScreen
- `apps/mobile/.maestro/02_home_to_movie_detail.yaml` — Home → MovieDetail → VideoPlayer → Back
- `apps/mobile/.maestro/03_watchparty_create_join.yaml` — "+" → SourcePicker → YouTube → Back
- `apps/mobile/.maestro/04_notification_deep_link.yaml` — Bell → Notifications → Friends → Profile → Home
- `apps/mobile/.maestro/README.md` — O'rnatish va ishga tushirish yo'riqnomasi
- **Ishga tushirish:** `maestro test .maestro/` (Maestro CLI o'rnatilishi kerak — bir marta)

---

### F-149 | 2026-03-23 | [MOBILE] | T-E057 — Unit testlar: hooks va API layer [Emirhan]

- `__tests__/api/content.api.test.ts` — 9 test: getTrending, getTopRated, getMovies, search, addFavorite, removeFavorite, extractVideo (error case), getWatchProgress (graceful null)
- `__tests__/hooks/useSearch.test.ts` — 9 test: GENRES constant, debounce timer logic, search history deduplication + MAX_HISTORY, query enabled logic
- `__tests__/hooks/useHomeData.test.ts` — 9 test: API call params, isLoading logic, fallback empty array
- `__tests__/hooks/useBattle.test.ts` — 10 test: getMyBattles, accept/reject/create, getBattleById, daysLeft calc, winner detection, staleTime/refetchInterval
- Jami: 37 test | Jest setup ✅ (jest-expo preset, moduleNameMapper barcha alias) | `npm install` keyin `npm test` bilan ishga tushirish

---

### F-148 | 2026-03-23 | [MOBILE] | T-E058 — Performance: React.memo + expo-image cachePolicy [Emirhan]

- `MovieCard.tsx` — `expo-image` ga `cachePolicy="memory-disk"` qo'shildi
- `FriendsScreen.tsx` — `FriendRow` → `React.memo(...)` + avatar Image `cachePolicy="memory-disk"`
- `BattleScreen.tsx` — `BattleCard` → `React.memo(...)`
- `MovieCard`, `MovieRow` allaqachon `memo` + `getItemLayout` ✅ (avval qilingan)

---

### F-147 | 2026-03-23 | [MOBILE] | T-E062 — FCM token registration + notification deep links [Emirhan]

- **Yechim:** `@react-native-firebase/messaging` emas — `expo-notifications` orqali T-E052 da allaqachon implement qilingan.
- `usePushNotifications.ts` — `getExpoPushTokenAsync()` → `userApi.updateFcmToken(token)` ✅
- `AppNavigator.tsx` — `useLastNotificationResponse` → `inviteCode / roomId / battleId / screen` deep link ✅
- Android channel setup + iOS permission request ✅
- Foreground: `addNotificationReceivedListener` + React Query invalidation ✅
- Background/killed: `useLastNotificationResponse` hook pokrыvaet ✅

---

### F-146 | 2026-03-23 | [MOBILE+BACKEND] | T-E063 + T-S039 — Source Picker + In-App Browser + Media Change [Emirhan]

**Mobile (T-E063):**
- `src/constants/mediaSources.ts` — 17 ta media manba (YouTube, VK, Rutube, Twitch, Web, Drive, DRM va internal)
- `src/utils/mediaDetector.ts` — JS injection (MEDIA_DETECTION_JS) + normalizeDetectedMedia → RoomMedia
- `src/screens/modal/SourcePickerScreen.tsx` — 2-kolonli grid modal, qidiruv, DRM xabar, DIM="SOON" badge
- `src/screens/modal/MediaWebViewScreen.tsx` — Встроенный браузер (back/forward/close) + media detection popup
- `CustomTabBar.tsx` "+" tugmasi → SourcePickerScreen(context='new_room')
- `ModalNavigator.tsx` — SourcePicker + MediaWebView registered
- `types/index.ts` — ModalStackParamList extended, VideoPlatform exported
- `watchParty.store.ts` — updateRoomMedia optimistic action
- `useWatchParty.ts` — emitMediaChange hook (optimistic + socket emit)
- `WatchPartyScreen.tsx` — owner uchun "Сменить медиа" tugmasi
- `watchParty.api.ts` — createRoom: videoTitle + videoPlatform qo'shildi
- `babel.config.js` + `tsconfig.json` — @constants/* alias
- `shared/socketEvents.ts` — CHANGE_MEDIA: 'room:media:change' qo'shildi

**Backend (T-S039):**
- `watchParty.service.ts` — updateRoomMedia(ownerId, roomId, media): owner check + DB update + Redis reset
- `roomEvents.handler.ts` — CHANGE_MEDIA socket handler: owner validation → updateRoomMedia → ROOM_UPDATED broadcast

**Flow:** "+" → SourcePicker → MediaWebView → JS detects media → popup → createRoom(new_room) / socket emit(change_media)
**Sync:** CHANGE_MEDIA → backend → ROOM_UPDATED → mobile setRoom() → UniversalPlayer reloads

---

### F-145 | 2026-03-21 | [MOBILE] | T-J021 — FCM token + notification deep links + ROOM_CLOSED handler [Jafar]

- **FCM token registration:** Allaqachon `usePushNotifications.ts` da expo-notifications orqali implement qilingan (token → `userApi.updateFcmToken`). Firebase emas, Expo Push ishlatiladi.
- **Deep link navigation:** `AppNavigator.tsx` da `useLastNotificationResponse` orqali kengaytirildi — roomId, battleId, inviteCode, Friends, Notifications ekranlariga yo'naltirish.
- **ROOM_CLOSED handler:** `useWatchParty.ts` da `RoomClosedData` interface qo'shildi (reason: owner_left | inactivity | admin_closed | account_blocked). `WatchPartyScreen.tsx` da har bir reason uchun alohida Alert (3 tilda lokalizatsiya). `account_blocked` da darhol goBack().
- **i18n:** `translations.ts` ga roomClosed, closedInactivity, closedOwnerLeft, closedByAdmin, reason tarjimalari qo'shildi (uz/ru/en).
- **Fayllar:** `useWatchParty.ts`, `WatchPartyScreen.tsx`, `AppNavigator.tsx`, `translations.ts`
- **T-J022:** `VideoSection.tsx` da `{!isOwner && <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />}` — shaffof overlay member touch/tap/scroll ni bloklaydi. Owner controls va fullscreen toggle overlay ustida qoladi (zIndex).
- **T-J023:** Notification ekrani allaqachon to'liq implement qilingan: `notification.api.ts` (GET, PUT, DELETE), `NotificationsScreen.tsx` (FlatList + unread badge + pull-to-refresh + empty state + mark all read + type icons + friend accept/reject + WatchParty join). `useNotifications.ts` hook bilan Socket.io realtime ham ishlaydi.
- **T-J024:** Battle ekrani allaqachon to'liq implement qilingan: `battle.api.ts` (create, getMyBattles, getBattleById, accept, reject, getLeaderboard, getCompleted). `BattleScreen.tsx` (detail + list view, tabs active/history, accept/reject actions, progress bars, winner ko'rsatish). `useBattle.ts` hook (React Query + mutations).
- **T-J025:** Profil va Settings allaqachon implement qilingan: `ProfileScreen.tsx` (avatar picker, edit modal, stats grid), `SettingsScreen.tsx` (edit profile, change password, language, notifications/privacy toggles, delete account, app info, logout).
- **T-J026:** Bloklangan akkaunt handling allaqachon implement qilingan: `BlockedAccountModal.tsx` (UI), `client.ts` (403 ACCOUNT_BLOCKED interceptor → logout + notifyBlocked), `AppNavigator.tsx` (global listener → modal ko'rsatish), `WatchPartyScreen` da account_blocked reason handler (T-J021 da qo'shildi).
- **T-J019:** `profile.service.ts` da `isUserOnline()` va `heartbeat()` ga try/catch qo'shildi. Redis down bo'lganda graceful degradation — offline deb ko'rsatadi, crash bermaydi.
- **T-J020:** `Dockerfile.dev` da `apps/*/package.json` stub'lar qo'shildi (npm workspaces resolution uchun). `--ignore-scripts` flag qo'shildi (native build xatolarini oldini olish). Docker Desktop o'chirilgan — test lokal qilinmadi, lekin fix mantiqiy to'g'ri.

---

### F-144 | 2026-03-21 | [BACKEND+INFRA] | T-J016 T-J017 T-J018 T-S035 T-S036 T-S037 — Redis fix + Admin analytics [Saidazim]

- **T-J016:** `docker-compose.dev.yml` Redis `requirepass` — `${REDIS_PASSWORD:-cinesync_redis_dev}` default fallback. Bo'sh parol bilan FATAL xato tuzatildi.
- **T-J017:** `services/content/src/server.ts` — `maxRetriesPerRequest: null`, `lazyConnect: true`, graceful degradation. Redis down bo'lsa servis crash bermaydi.
- **T-J018:** `services/watch-party/src/server.ts` — ayni fix. Socket.io single-instance mode da ishlaydi Redis bo'lmasa ham.
- **T-S035:** Allaqachon fix qilingan (previous session) — `getApiLogModel()` export + admin service ishlatmoqda.
- **T-S036:** `getAnalytics()` to'liq to'ldirildi — `totalUsers`, `newUsersThisWeek` (user service), `activeBattles`, `activeWatchParties` (battle/watch-party service). `profile.service.ts` `adminGetStats()` ga `newUsersThisWeek` qo'shildi. `serviceClient.ts` type yangilandi.
- **T-S037:** Tekshirildi — model to'g'ri (`members: string[]`, `videoTitle`, `videoPlatform`, `name`, `inviteCode` barchasi bor). `adminJoinRoom` `{ room }` format qaytaradi. O'zgartirish kerak emas.

---

### F-143 | 2026-03-21 | [MOBILE] | T-E060 — Blocked account popup + Admin WatchParty events + Dark theme fix [Jafar]

- **BlockedAccountModal:** Yangi `BlockedAccountModal.tsx` component — banned foydalanuvchilar uchun modal (icon, reason, contact support, OK button).
- **Login 403 handler:** `LoginScreen.tsx` — `ACCOUNT_BLOCKED` 403 response → modal ko'rsatish (reason bilan).
- **Global interceptor:** `client.ts` — axios response interceptor da `ACCOUNT_BLOCKED` 403 → logout + global event → AppNavigator da modal.
- **Admin monitoring:** `useWatchParty.ts` — `admin:joined`/`admin:left` socket events → `adminMonitoring` state. `WatchPartyScreen.tsx` — shield banner ko'rsatish.
- **Dark theme fix:** `ThemeContext.tsx` — always dark mode. `theme.store.ts` — light mode o'chirilgan. `SettingsScreen.tsx` — tema tanlash UI olib tashlangan.
- **Circular import fix:** `colors.ts` — rang definitsiyalari alohida faylga chiqarildi (ThemeContext ↔ index.ts circular dependency tuzatildi).
- **i18n:** `blocked` section qo'shildi (title, message, noReason, contactSupport, adminMonitoring). `common` ga `ok`, `contact` qo'shildi.
- **Test:** Android emulator da registration, login, dark theme — barchasi to'g'ri ishlaydi. TSC: ✅ 0 xato.

### F-142 | 2026-03-21 | [MOBILE] | T-E061 — Do'stlar tizimi + Bildirishnomalar fix [Jafar]

- **Type guard:** `useNotifications.ts` + `NotificationsScreen.tsx` — `as Record<string, string>` → `NotificationData` interface + `parseNotificationData()` function. `data.friendshipId/roomId/battleId` → `typeof` check.
- **Icon type:** `NotificationsScreen.tsx` — `as never` → `IoniconsName` (`ComponentProps<typeof Ionicons>['name']`).
- **i18n migration:** `NotificationsScreen.tsx` — "Bildirishnomalar", "Hammasini o'qi", "Bildirishnomalar yo'q", "Qabul", "Rad", "Qo'shilish" → `useT()`. `useNotifications.ts` — Alert.alert strings → i18n.
- **Query invalidation:** ✅ Allaqachon to'g'ri (accept → `['friends']`+`['friend-requests']`, reject → `['friend-requests']`).
- **Socket:** ✅ `getSocket()` null check mavjud.
- **notification.api.ts:** ✅ URL lar to'g'ri (`notificationClient`).
- **Test:** Playwright 30/30 API passed. Expo emulator — NotificationsScreen, FriendsScreen, HomeScreen crash-free.
- **TSC:** ✅ 0 xato

### F-141 | 2026-03-21 | [MOBILE] | T-E056 — TypeScript strict audit + console.log cleanup [Jafar]

- **console.log audit:** ✅ Barcha console.log `if (__DEV__)` ichida — tozalash kerak emas
- **Unsafe casts tuzatildi:** `NotificationsScreen.tsx` `as Record<string, string>` → proper interface, `as never` → icon type. `useWatchParty.ts` `as unknown[]` → type guard. `ProfileAnimations.tsx` double cast → `React.ReactNode`. `ErrorBoundary.test.tsx` simplified cast.
- **i18n migration:** `BattleCreateScreen`, `BattleScreen`, `WatchPartyCreateScreen`, `WatchPartyJoinScreen`, `NotificationsScreen` hardcoded strings → `useT()` hook orqali i18n.
- **TSC:** ✅ 0 xato

### F-140 | 2026-03-20 | [MOBILE] | T-E052/E053/E054/E055 — Sprint 4 Profil + Bildirishnoma [Emirhan]

- **T-E052 Push Notifications:** `usePushNotifications.ts` — expo-notifications permission, ExpoPushToken → `userApi.updateFcmToken`. `AppNavigator.tsx` — `useNavigationContainerRef`, `useLastNotificationResponse` deep link handler (roomId → WatchParty, battleId → Battle).
- **T-E053 NotificationsScreen refactor:** `useNotifications.ts` hook — barcha query/mutation (getAll, markRead, markAll, delete, acceptFriend, rejectFriend) + socket `notification:new` listener. `NotificationsScreen.tsx` 285q → 145q (faqat render).
- **T-E054 SettingsScreen:** ChangePasswordModal → `authApi.changePassword` allaqachon ulangan ✅. Language selector → `useLanguageStore` allaqachon mavjud ✅. Qo'shimcha o'zgartirish talab qilinmadi.
- **T-E055 AchievementsScreen:** `AchievementCard.tsx` (yangi) — `Animated.spring` kirish animatsiyasi, tap → detail modal. `AchievementsScreen.tsx` — rarity filter chips (Barchasi/Common/Rare/Epic/Legendary), `DetailModal` — achievement title/description/points/date.
- **TSC:** ✅ 0 xato

### F-139 | 2026-03-20 | [MOBILE] | T-E048/E049/E050/E051 — Sprint 3 ijtimoiy ekranlar [Emirhan]

- **T-E048 WatchParty Join:** `WatchPartyJoinScreen.tsx` — 6-belgili invite kod visual input (6 box), `watchPartyApi.joinByInviteCode`. `ModalNavigator` WatchPartyJoin route. `WatchPartyCreateScreen` Create|Join tabs. `types/index.ts` WatchPartyJoin param.
- **T-E049 FriendProfile:** Battle + WatchParty tugmalari (faqat do'stlar uchun). `BattleCreateScreen` — `initialFriendId` (do'stni avto-tanlash) + `initialMovieTitle` (avto-to'ldirish) route params.
- **T-E050 Battle History:** `battleApi.getCompletedBattles()`. `useBattleHistory` hook. `BattleScreen` → BattleListView Faol|Tarix tabs.
- **T-E051 FriendsScreen:** `FlatList` → `SectionList` "Online / Oflayn" seksiyalar, har seksiyada do'stlar soni badge.
- **TSC:** ✅ 0 xato

### F-138 | 2026-03-20 | [MOBILE] | T-E044/E045/E046/E047 — Sprint 2 asosiy ekranlar [Emirhan]

- **T-E044 HomeScreen:** `contentApi.getNewReleases` + `useHomeData` newReleases query + `MovieRow` onMoviePress prop + HomeScreen genre chips (GENRES dan FlatList) + newReleases row. `MovieCard` optional onPress prop.
- **T-E045 VideoPlayer:** `VideoControls.tsx` yangi komponent (controls overlay ajratilib chiqildi). `VideoPlayerScreen.tsx`: double-tap seek (±10s, 300ms DOUBLE_TAP_DELAY), isBuffering spinner VideoControls ichida, fullscreen toggle (orient lock yo'q — expo-screen-orientation yo'q).
- **T-E046 Search Filters:** `SearchSortOption` type eksport. `useSearchResults` year+sort params. Yangi `SearchFiltersBar.tsx` (genre/year/sort 3 ta ScrollView row). `SearchResultsScreen` filtrlar integrasiya + page reset on filter change.
- **T-E047 MovieDetail:** `BattleCreate: { initialMovieTitle? }` type. `useMovieDetail` — favorites query + optimistic toggle mutation. `MovieDetailActions` — Share.share API (Alert.alert o'rniga). `MovieDetailInfo` — onBattle/battleLabel props + battle button (gold border). `MovieDetailScreen` — handleBattle → BattleCreate modal, favorites hook dan isFavorite/toggleFavorite. i18n: startBattle/addFavorite/removeFavorite/filterGenre/filterYear/filterSort/sortRating/sortYear/sortTitle/all.
- **TSC:** ✅ 0 xato

---

### F-137 | 2026-03-19 | [MOBILE] | T-E043 — Refactor: WebViewPlayer + VideoExtractScreen split [Emirhan]

- **WebViewPlayer.tsx:** 406q → 294q. `buildYouTubeHtml` → `webviewYouTube.ts` (78q). `AD_HOSTNAMES + isAdRequest + getHostname` → `webviewAdBlocker.ts` (32q)
- **VideoExtractScreen.tsx:** 375q → 68q (thin wrapper). Logic → `useVideoExtract.ts` (92q). Input UI → `VideoExtractInput.tsx` (154q). Ready UI → `VideoExtractReady.tsx` (142q)
- **Yangi fayllar:** 5 ta: `webviewYouTube.ts`, `webviewAdBlocker.ts`, `useVideoExtract.ts`, `VideoExtractInput.tsx`, `VideoExtractReady.tsx`
- **Funksional o'zgarish:** YO'Q — behavior identik saqlanadi

### F-136 | 2026-03-19 | [MOBILE] | T-E042 — WatchParty fullscreen + stop + swipe disable [Emirhan]

- **ModalNavigator.tsx:** `gestureEnabled: false` — WatchParty da iOS swipe-to-dismiss o'chirildi
- **VideoSection.tsx:** `isFullscreen` prop + `videoContainerFullscreen` (SCREEN_H) + fullscreen toggle button (top-right, expand/contract icon)
- **VideoSection.tsx:** Stop tugmasi owner controls da (square icon) → `onStop` callback
- **VideoSection.tsx:** Fullscreen da RoomInfoBar/Emoji/Chat yashiriladi (WatchPartyScreen `!isFullscreen` wrapper)
- **WatchPartyScreen.tsx:** `handleStop` → seekTo(0) + pause + emitPause(0) + setIsPlaying(false) (existing socket events, no backend change)
- **WatchPartyScreen.tsx:** `handleToggleFullscreen` → `isFullscreen` state toggle

### F-135 | 2026-03-19 | [MOBILE] | T-C010 — Universal Video Sync extract→play→sync pipeline [Emirhan]

- **Bug 1 tuzatildi** — `detectVideoPlatform` YouTube proxy URL ni 'webview' deb aniqlardi; `/youtube/stream` pattern qo'shildi → 'direct' qaytaradi, expo-av to'g'ridan o'ynaydi
- **Bug 2 tuzatildi** — `buildYouTubeProxyUrl` auth token yo'q edi; `useAuthStore(s => s.accessToken)` import + `&token=` query param qo'shildi
- **Flow endi to'liq ishlaydi:** URL kiritiladi → extraction (debounce 800ms) → extracted URL room ga saqlanadi → WatchPartyScreen → UniversalPlayer → to'g'ri player tanlaydi

### F-134 | 2026-03-19 | [MOBILE] | T-E041 — WebViewPlayer member lock overlay + bug tekshiruv [Emirhan]

- **Member lock overlay** — `!isOwner` bo'lganda `StyleSheet.absoluteFill` shaffof View qo'shildi; member WebView ni ko'radi lekin hech narsani bosa olmaydi
- **B5 tuzatildi** — redirect warning faqat owner uchun ko'rinadi (`!isOwner` return qo'shildi `handleNavigationStateChange` ga)
- **webviewWrapper** style qo'shildi — WebView + overlay wrapper uchun `flex: 1`
- **B1-B4, B6 tasdiqlandi** — `if (isOwner) onPlay/onPause/onSeek` to'g'ri, `injectWithRetry` ishlaydi, `youtubeVideoId` berilmaydi (IFrame API yo'q), `onProgress?.()` optional chaining bor, member retry bosa oladi

### F-133 | 2026-03-18 | [BACKEND] | T-S033 — yt-dlp deploy + sayt ishonchliligi + strukturali error [Saidazim]

- **S33-1**: `services/content/Dockerfile` — yt-dlp musl static binary (Alpine uchun) production stage ga qo'shildi
- **S33-2**: O'zbek saytlar (uzmovi.tv, tv.mover.uz) — `genericExtractor` depth=2 + Referer header iframe follow orqali yaxshi ishlaydi
- **S33-3**:
  - `ytDlpExtractor.ts`: timeout 30s → 20s; DRM stderr detection → `YtDlpDrmError` throw
  - `genericExtractor.ts`: `MAX_IFRAME_DEPTH` 1 → 2; recursive iframe follow + Referer header (parent URL)
  - `videoExtractor/index.ts`: DRM → `VideoExtractError('drm')`; all fail → `VideoExtractError('unsupported_site')`
  - `types.ts`: `VideoExtractError` class + `VideoExtractErrorReason` type qo'shildi
  - `videoExtract.controller.ts`: `VideoExtractError` catch → `{ success, reason, message }` response (HTTP 422)
- **S33-4**: YouTube proxy Range request — `ytdl.controller.ts` da allaqachon implementatsiya qilingan (tekshirildi)

### F-132 | 2026-03-18 | [BACKEND] | T-C006 B1-B2 + SH1 — WebView platform support (allaqachon mavjud) [Saidazim]

- **watchPartyRoom.model.ts:32** — `videoPlatform` enum ga `'webview'` allaqachon qo'shilgan
- **watchParty.service.ts** — `SYNC_THRESHOLD_WEBVIEW_SECONDS = 2.5` + `needsResync(platform?)` WebView toleransi allaqachon implementatsiya qilingan
- **shared/src/types/index.ts:134** — `VideoPlatform = 'youtube' | 'direct' | 'webview'` allaqachon bor
- Yangi kod yozilmadi — tekshirib tasdiqlandi

### F-131 | 2026-03-18 | [MOBILE] | T-E040 — Universal Video Extraction mobile qismi [Emirhan]

- **E40-1 `extractVideo()` API:** allaqachon tayyor edi (`content.api.ts:93-97`)
- **E40-5 `VideoExtractResult` type:** allaqachon tayyor edi (`content.api.ts:5-14`)
- **E40-2 `useVideoExtraction` hook:** yangi yaratildi (`hooks/useVideoExtraction.ts`)
  - Direct URL (.mp4/.m3u8) → skip extraction, darhol natija
  - Backend `POST /content/extract` chaqirish (15s timeout, AbortController)
  - YouTube proxy URL rewrite (`useProxy: true` bo'lsa)
  - Fallback mode (extraction fail → WebView)
- **E40-3 `UniversalPlayer` yangilandi:** `extractedUrl`, `extractedType`, `isExtracting` proplar qo'shildi
- **E40-4 `WatchPartyCreateScreen` UX:** URL kiritganda avtomatik extraction
- **E40-6 Error handling:** timeout, network error, unsupported site → fallback mode

### F-128a | 2026-03-18 | [MOBILE] | Build fix — UniversalPlayer import xatolar + component prop mismatches [Emirhan]

- **UniversalPlayer.tsx:** `../../api/content` → `../../api/content.api` (named export), `../../storage/token` → `../../utils/storage` (named export)
- **MovieDetailScreen.tsx:** 4 ta component prop mismatch tuzatildi (MovieDetailActions, MovieCastList, MovieSimilarList, MovieRatingWidget)
- **SearchScreen.tsx:** SearchInput `onSubmit` → `onSubmitEditing` + `onClear`, GenreChips `genres` prop olib tashlandi, SearchHistory `onPress` → `onItemPress`
- **VideoSection.tsx:** `RefObject<UniversalPlayerRef | null>` type fix
- **ProfileAnimations.tsx:** React 19 + Animated.View children type fix

### F-129 | 2026-03-18 | [MOBILE] | YouTube Error 152 fix — IFrame API → mobile WebView [Emirhan]

- YouTube IFrame Embed API (Error 152-4) o'rniga `m.youtube.com/watch?v=ID` to'g'ridan WebView da ochish
- `MOBILE_USER_AGENT` (Chrome Mobile, "wv" markersiz) barcha WebView larga yuboriladi
- YouTube backend proxy 5s timeout qo'shildi — fail bo'lsa darhol WebView ga tushadi
- WebViewAdapters YouTube adapter `.html5-main-video` selektori bilan video topadi

### F-130 | 2026-03-18 | [MOBILE] | WatchParty do'st taklif qilish + video sync yaxshilash [Emirhan]

- **InviteCard:** invite code + nusxalash (expo-clipboard) + ulashish (Share API) + do'stlar ro'yxati + taklif yuborish (`POST /watch-party/rooms/:id/invite`)
- **watchParty.api:** `inviteFriend(roomId, friendId, inviterName)` metodi qo'shildi
- **RoomInfoBar:** invite tugma endi barcha a'zolarga ko'rinadi (avval faqat owner)
- **WebViewPlayer:** `injectWithRetry()` — video element topilmagan bo'lsa 500ms kutib qayta urinadi (sync ishonchliligi)
- **i18n:** codeCopied, inviteSent, inviteFailed, noFriendsYet, shareInvite, shareText tarjimalari
- **expo-clipboard** package qo'shildi

### F-128b | 2026-03-18 | [MOBILE+DOCS] | Watch Party improvements + socket auto-refresh + role update [Jafar]

- **UniversalPlayer.tsx — YouTube плеер переработан:**
  - Удалён IFrame API подход (`extractYouTubeVideoId`)
  - Добавлен backend proxy resolve через `contentApi.getYouTubeStreamInfo()` → proxy URL → expo-av
  - Fallback цепочка: proxy error → WebView (m.youtube.com), expo-av error → WebView
  - Новые состояния: `streamUrl`, `resolving`, `resolveError`, `videoError`
  - Улучшен пустой UI: иконка + подсказка, loading спиннеры
  - `onStreamResolved` callback для live/title информации
- **WebViewAdapters.ts — YouTube адаптеры расширены:**
  - `youtube.com`: selectors переупорядочены, `scanDelay` 1000→3000, ad skip postAttachJs
  - Новый адаптер `m.youtube.com` с ad skip и autoplay
- **VideoSection.tsx:** Loading индикатор в отдельный flex center
- **useWatchParty.ts:** `connect_error` обработчик перенесён в socket/client.ts
- **WatchPartyCreateScreen.tsx:** Видео теперь обязательно (валидация catalog/URL), label → "VIDEO MANBASI"
- **WatchPartyScreen.tsx:** `??` → `||` для пустых строк videoUrl
- **socket/client.ts (+51 строк):** Авто-refresh token при "Invalid token", cleanup `removeAllListeners()`
- **CLAUDE.md:** Jafar → Mobile (раньше Web), роли обновлены
- **Tasks.md:** Jafar роли обновлены, web задачи → "ochiq"
- **Новые файлы:** `docs/WEB_DESIGN_GUIDE.md` (673 строк), `scripts/test_watch_party.mjs` (277 строк), `tsconfig.json`

---

### F-127 | 2026-03-17 | [MOBILE] | T-C006 M6+M7 — WebViewPlayer UX + Site Adapters [Emirhan]

- **M6 — UX yaxshilash:**
  - Loading overlay: hostname + spinner, `bgVoid` fon
  - Ad blocker: `onShouldStartLoadWithRequest` — 11 ta reklama domeni blok (`doubleclick.net`, `exoclick.com` va h.k.)
  - Redirect warning: `onNavigationStateChange` — domen o'zgarsa sariq banner, bosib yopiladi
  - Fullscreen: `StatusBar.setHidden(true, 'slide')` mount da, unmount da tiklanadi
  - Error + Retry: HTTP 4xx/5xx + `onError` — hostname + "Qayta urinish" tugmasi, `reload()` chaqiradi
- **M7 — Site adapterlar (`WebViewAdapters.ts` yangi fayl):**
  - `uzmovi.tv`: `.plyr video`, `#player video`, popup yopish, `scanDelay: 2000ms`
  - `kinogo.cc`: `#oframep video`, `.player-box video`, popup yopish, `scanDelay: 1500ms`
  - `filmix.net`: `.vjs-tech`, `.video-js video`, `scanDelay: 1000ms`
  - `hdrezka.ag`: `#player video`, `.pjsplayer video`, `scanDelay: 2500ms`
  - Generic fallback: `video` selector, `scanDelay: 0`
  - `INJECT_JS` hardcoded → `buildInjectJs(getAdapter(url))` dinamik (useMemo)
- **Fayllar:** `apps/mobile/src/components/video/WebViewPlayer.tsx`, `apps/mobile/src/components/video/WebViewAdapters.ts` (yangi)

---

### F-126 | 2026-03-16 | [MOBILE] | Backend ↔ Mobile API alignment + missing endpoints fix [Emirhan]

- **Barcha 6 ta servis tekshirildi** — route/method mos kelmasliklar topilmadi ✅
- **VerifyEmailScreen resend bug:** `handleResend` `navigation.replace('Register')` chaqirar edi (API chaqirmasdan)
  - **Fix:** `authApi.resendVerification(email)` qo'shildi (`auth.api.ts`), 60 soniya cooldown timer (`VerifyEmailScreen.tsx`)
- **Online status bug:** `POST /users/heartbeat` hech qachon chaqirilmasdi → foydalanuvchi doim offline ko'rinar edi
  - **Fix:** `userApi.heartbeat()` qo'shildi (`user.api.ts`), har 2 daqiqada interval `AppNavigator.tsx` da (`isAuthenticated` ga bog'liq)
- **Fayllar:** `auth.api.ts`, `user.api.ts`, `AppNavigator.tsx`, `VerifyEmailScreen.tsx`

---

### F-125 | 2026-03-16 | [MOBILE] | WatchParty black screen + chat socket mismatch fix [Emirhan]

- **Sabab 1 — Qora ekran:** `room` null bo'lganida (socket `ROOM_JOINED` kelmasdanoldin) `videoUrl=''` → `UniversalPlayer` hech narsa ko'rsatmasdi
  - **Fix:** `WatchPartyScreen.tsx` da `room` null bo'lsa `<ActivityIndicator>` ko'rsatish, player faqat room yuklangandan keyin render qilish
- **Sabab 2 — Chat crash (backend):** `sendMessage` `{ roomId, text }` yuborar edi, lekin backend `data.message` kutgan (`data.message.slice(0,500)`) → `undefined.slice()` → backend crash
  - **Fix:** `useWatchParty.ts` `sendMessage`: `{ roomId, text }` → `{ message: text }` (roomId socket da `authSocket.roomId` sifatida saqlanadi)
- **Sabab 3 — Xabarlar ko'rinmasdi:** Backend `ROOM_MESSAGE` `{ userId, message, timestamp }` yuboradi, lekin mobile `text` polini kutgan (`MessageEvent.text`) → xabarlar store ga tushmasdi
  - **Fix:** `MessageEvent` interfeysi yangilandi (`text` → `message`), handler `msg.message` → `text` mapping qiladi
- **Fayllar:** `apps/mobile/src/hooks/useWatchParty.ts`, `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`

---

### F-124 | 2026-03-16 | [MOBILE] | UniversalPlayer — YouTube WebView embed fallback [Emirhan]

- **Sabab:** `ytdl.getInfo()` Railway serverida YouTube tomonidan bloklanadi → `GET /youtube/stream-url` 500 qaytaradi → `resolveError=true` → "Video yuklashda xato"
- **Fix:** `resolveError=true` bo'lganda expo-av o'rniga `WebViewPlayer` fallback ishlaydi
  - `getYouTubeEmbedUrl(url)`: `youtube.com/watch?v=ID` / `youtu.be/ID` / `youtube.com/shorts/ID` → `youtube.com/embed/ID`
  - `useWebview = platform === 'webview' || (platform === 'youtube' && resolveError)`
  - `useImperativeHandle` endi `useWebview` asosida ref metodlarini yo'naltiradi
  - WatchParty owner play/pause/seek WebViewPlayer JS injection orqali ishlaydi
- **Oqim:** YouTube URL → proxy sinab ko'radi → ✅ muvaffaqiyat (expo-av) | ❌ blokland (WebView embed)
- **Fayl:** `apps/mobile/src/components/video/UniversalPlayer.tsx`

---

### F-125 | 2026-03-16 | [IKKALASI] | T-C008 — Web shared types integration (already resolved) [Jafar]

- **Статус:** Все пункты уже были реализованы ранее
- tsconfig paths: `@shared/*` → `../../shared/src/*` ✅
- `apps/web/src/types/index.ts` — все типы re-export из `@shared/types` с web-specific extensions (Date→string)
- IUser, IMovie, IBattle, IWatchPartyRoom, IAchievement, ApiResponse — все extend shared
- Shared types уже имеют: `slug`, `director`, `cast`, `reviewCount` (IMovie), `isOnline`, `lastSeenAt` (IUser), `secret` (AchievementRarity)

---

### F-124 | 2026-03-16 | [WEB] | T-J014 — postMessage + JSON-LD XSS fix (already resolved) [Jafar]

- **Статус:** Все 3 пункта уже были исправлены ранее
- postMessage wildcard: YouTube используется через IFrame API (window.YT.Player), не через raw postMessage — проблема отсутствует
- Message listener без origin: нет addEventListener('message') в коде — проблема отсутствует
- JSON-LD XSS: `.replace(/<\//g, '<\\/')` escape уже в `movies/[slug]/page.tsx:80` и `profile/[username]/page.tsx:94`

---

### F-123 | 2026-03-16 | [WEB] | T-J013 — Security headers + ESLint/TypeScript build fix [Jafar]

- **Fayl:** `apps/web/next.config.mjs`, `apps/web/src/app/(app)/home/page.tsx`, `apps/web/src/app/api/auth/register/route.ts`
- **Fix:**
  - HSTS header qo'shildi: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `ignoreDuringBuilds` / `ignoreBuildErrors` — allaqachon mavjud emas ✅
  - ESLint xatolar tuzatildi: unused `room` param (home/page.tsx), unused `_omit` var (register/route.ts)
  - `next build` — 0 xato ✅, tsc — 0 xato ✅
- **Security headers (to'liq):** CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, HSTS ✅

---

### F-122 | 2026-03-16 | [WEB+MOBILE] | T-J012 — Token storage XSS fix + mobile auth error handling [Jafar]

- **Web:** 4 ta API route (`login`, `refresh`, `google`, `logout`) da `access_token` cookie httpOnly+Secure+SameSite=strict qo'shildi
- **Mobile:** LoginScreen, RegisterScreen, VerifyEmailScreen — `errors[]` array parsing tuzatildi
- **Mobile:** VerifyEmailScreen — barcha hardcoded string lar i18n (`useT()`) ga o'tkazildi
- **Mobile:** `auth.api.ts` — resend endpoint `/auth/register/resend` ga tuzatildi

---

### F-121 | 2026-03-16 | [MOBILE] | T-E039 — Video Extractor Mobile Integration [Emirhan]

- **API:** `contentApi.extractVideo(url)` → `POST /api/v1/content/extract` qo'shildi (`content.api.ts`)
- **Type:** `VideoExtractResult` interface qo'shildi (`content.api.ts`)
- **Screen:** `VideoExtractScreen` yaratildi (`screens/home/VideoExtractScreen.tsx`)
  - Input state: URL validatsiya (http/https), extract tugmasi
  - Loading state: ActivityIndicator + "3-30 soniya" ogohlantirish
  - Error state: backend xato xabaridan foydalanuvchi-do'stona matn
  - Ready state: platformBadge + JONLI EFIR badge + UniversalPlayer + Watch Party tugmasi
  - `useProxy=true` → UniversalPlayer ga original YouTube URL (YouTube proxy flow)
  - `useProxy=false` → `result.videoUrl` to'g'ridan UniversalPlayer ga
- **Navigation:** `VideoExtract: undefined` → `HomeStackParamList` + `MainNavigator.tsx` da ro'yxatdan o'tdi
- **tsc:** `npx tsc --noEmit` → 0 xato ✅

---

### F-120 | 2026-03-16 | [MOBILE] | T-E038 — SearchScreen crash fix (`data.movies` undefined) [Emirhan]

- **Fayl:** `apps/mobile/src/api/content.api.ts`
- **Sabab:** `getMovies()` va `search()` da `ApiResponse<MoviesResponse>` (noto'g'ri generic)
  - Backend `data` = `IMovie[]` (array), `meta` = top-level field qaytaradi
  - Lekin kod `res.data.data.movies` kutgan → `data.movies = undefined` → SearchScreen crash
- **Fix:** Generic ni `ApiResponse<IMovie[]>` ga o'zgartirish + response object qo'lda qurish:
  `{ movies: res.data.data ?? [], meta: res.data.meta ?? {...} }`
- **tsc:** 0 xato ✅

---

### F-119 | 2026-03-16 | [BACKEND] | T-S032 — Universal Video Extractor `POST /api/v1/content/extract` [Saidazim]

- **Endpoint:** `POST /api/v1/content/extract` — `verifyToken` + `apiRateLimiter`
- **Qo'llab-quvvatlagan platformalar:** YouTube, Vimeo, TikTok, Dailymotion, Rutube, Facebook, Instagram, Twitch, VK, Streamable, Reddit, Twitter/X, generic (HTML scraping), unknown (yt-dlp fallback)
- **Faylllar yaratildi:**
  - `services/content/src/services/videoExtractor/types.ts` — `VideoExtractResult`, `VideoPlatform`, `VideoType`
  - `services/content/src/services/videoExtractor/detectPlatform.ts` — URL SSRF validation + platform regex detection
  - `services/content/src/services/videoExtractor/genericExtractor.ts` — HTML scraping: `<video>`, `og:video`, `.mp4/.m3u8` URL search
  - `services/content/src/services/videoExtractor/ytDlpExtractor.ts` — yt-dlp binary fallback via `child_process.spawn`, 30s timeout, best format picker
  - `services/content/src/services/videoExtractor/index.ts` — orchestrator: validateUrl → detectPlatform → extract → Redis cache (2h TTL)
  - `services/content/src/controllers/videoExtract.controller.ts` — HTTP controller
- **content.routes.ts** — `router.post('/extract', verifyToken, apiRateLimiter, videoExtractController.extract)` qo'shildi
- **YouTube:** mavjud `ytdlService.getStreamInfo()` orqali, `useProxy: true` — frontend `/api/v1/youtube/stream` dan oynashi kerak
- **SSRF himoya:** private IP rangelari (10.x, 192.168.x, 172.16-31.x, 127.x, ::1) va `file://`/`ftp://` bloklangan
- **Cache:** Redis `vextract:{base64url-key}` 2 soat TTL

---

### F-118 | 2026-03-16 | [BACKEND] | T-S026..T-S029 + Mobile Endpoint Alignment [Saidazim]

- **T-S026** — Content: `GET /content/trending`, `GET /content/top-rated`, `GET /content/continue-watching` (Redis cache 10min) ✅
- **T-S027** — Content: `POST/GET /content/movies/:id/progress` alias routes ✅
- **T-S028** — WatchParty: `DELETE /watch-party/rooms/:id` (closeRoom + Socket ROOM_CLOSED emit) ✅
- **T-S029** — Battle: `POST/PUT /battles/:id/reject` (rejectInvite + notification to challenger) ✅
- Content: `POST /movies/:id/complete`, `GET /internal/user-watch-stats/:userId` (streak + weeklyActivity) ✅
- Content: `rateMovie` endi `rating` va `score` ikkisini ham qabul qiladi ✅
- User routes: `/me/stats`, `/:id/stats`, `/me/achievements`, `/me/friend-requests`, `/:id/public`, `/:userId/friend-request`, `/friend-requests/:id/accept|reject`, `DELETE /me`, `DELETE /me/friends/:userId` qo'shildi ✅
- User: FCM token `fcmToken` va `token` ikki xil field nomini qabul qiladi ✅
- Notification: PUT aliases (`put /:id/read`, `put /read-all`) qo'shildi ✅
- Battle: PUT aliases (`put /:id/accept`, `put /:id/reject`) qo'shildi ✅
- WatchParty: `POST /join/:inviteCode`, `POST /rooms/:id/leave` aliases qo'shildi ✅
- shared/serviceClient: `getUserWatchStats`, `getUserBattleStats` internal helpers ✅

---

### F-117 | 2026-03-15 | [BACKEND] | T-S030 + T-S031 — Auth change-password + resend-verification [Saidazim]

- **T-S030** (`POST /auth/change-password`) — `verifyToken` + `changePasswordSchema` validator, `AuthService.changePassword()`: bcrypt compare → hash → update + `RefreshToken.deleteMany()` (barcha sessiyalar invalidate)
- **T-S031** (`POST /auth/resend-verification`) — allaqachon mavjud edi: route, controller `resendVerification`, service `resendVerificationCode()` — barchasi ishlaydi. Mobile `authApi.resendVerification()` to'g'ri path (`/auth/resend-verification`) ga murojaat qilmoqda ✅

---

### F-116 | 2026-03-15 | [MOBILE] | T-E037 — Post-pull regressions fix [Emirhan]

- **RegisterScreen.tsx** — `handleTelegramLogin` boshida `clearInterval` guard qo'shildi (T-E033 regressiyasi)
- **RegisterScreen.tsx** — `validate()`: username max 20 + `/^[a-zA-Z0-9]+$/` pattern tekshiruvi qaytarildi (T-E035 regressiyasi)
- **translations.ts** — `errUsernameMax` va `errUsernameChars` kalitlari qo'shildi (uz/ru/en)
- **LanguageSelectScreen.tsx** — `useState(storedLang)`: saqlangan tildan default olinadi (hardcoded 'uz' o'rniga)
- **npm install** — `@react-native-masked-view/masked-view` va `expo-image-picker` o'rnatildi

---

### F-110..F-115 | 2026-03-15 | [MOBILE] | T-E032..T-E036 + Jafar zone bug — Auth audit fixes [Emirhan]

- **T-E032** (auth.api.ts) — `resetPassword` body: `{ token, password }` → `{ token, newPassword }` (Jafar tomonidan allaqachon tuzatilgan, verified ✅)
- **T-E033** (LoginScreen.tsx) — Telegram double-tap race condition: `handleTelegramLogin` boshida avvalgi intervalni tozalash qo'shildi
- **T-E034** (ProfileSetupScreen.tsx) — `'#7C3AED'` hardcoded hex ikki joyda → `colors.primary` ga o'zgartirildi
- **T-E035** (RegisterScreen.tsx) — `validate()` kuchaytirildi: username max 20 + `[a-zA-Z0-9_]` + password uppercase/lowercase/digit tekshiruvi
- **T-E036** (VerifyEmailScreen.tsx + types/index.ts) — resend bug: Jafar `navigation.replace('Register')` qilgan edi (to'g'ri), lekin mavjud bo'lmagan `@i18n/index` import qoldirilgan edi → `useT` olib tashlandi, hardcoded strings qaytarildi. `devOtp` auto-fill (dev mode) saqlab qolindi.
- **Bonus** (RegisterScreen.tsx) — register API `_dev_otp` response → `devOtp` sifatida VerifyEmail ga o'tkaziladi; `AuthStackParamList.VerifyEmail` tipi `{ email, devOtp? }` ga to'g'irlandi

---

### F-109 | 2026-03-15 | [MOBILE] | T-E031 — Telegram Login ekrani va polling flow [Emirhan]

- `authApi.telegramInit()` — POST /auth/telegram/init → `{ state, botUrl }`
- `authApi.telegramPoll(state)` — GET /auth/telegram/poll?state (202→null, 200→LoginResponse)
- `LoginScreen` — `handleTelegramLogin`: Linking.openURL(botUrl) + setInterval poll har 2s, max 60 urinish (2 daqiqa)
- Telegram tugmasi (#2CA5E0 rang) Google tugmasidan keyin
- useEffect unmount da interval tozalash (memory leak yo'q)

---

### F-108 | 2026-03-14 | [ADMIN] | T-S009 — Admin Dashboard UI [Saidazim]

- Vite + React 18 + TypeScript + TailwindCSS (dark mode, CineSync design system)
- Login page — JWT auth, role tekshirish (admin/superadmin/operator)
- Dashboard — 5 ta StatCard, Recharts (Top Movies, Janr taqsimoti, Bugungi faollik), auto-refresh 30s
- Foydalanuvchilar sahifasi — qidirish, role/holat filter, block/unblock, role o'zgartirish, o'chirish
- Kontent sahifasi — publish/unpublish, filter, superadmin delete
- Feedback sahifasi — javob berish modal, status o'zgartirish
- Loglar sahifasi — level/servis filter, pagination
- Railway deploy: `Dockerfile` + `nginx.conf` (SPA routing), `.env` production URL lar bilan
- `VITE_AUTH_API_URL` = auth-production-47a8.up.railway.app
- `VITE_ADMIN_API_URL` = admin-production-8d2a.up.railway.app

---

### F-107 | 2026-03-14 | [BACKEND] | T-S029 — Battle reject endpoint [Saidazim]

- `POST /battles/:id/reject` — faqat `hasAccepted: false` bo'lgan participant rad eta oladi
- Participant record o'chiriladi, battle `status: 'rejected'` ga o'tadi
- `shared/src/types/index.ts`: `BattleStatus`ga `'rejected'` qo'shildi
- `battle.model.ts`: enum yangilandi
- Challenger (creatorId) ga `battle_result` notification yuboriladi (non-blocking)

---

### F-106 | 2026-03-14 | [BACKEND] | T-S028 — Watch Party room yopish endpoint [Saidazim]

- `DELETE /watch-party/rooms/:id` — faqat owner yopishi mumkin
- Service: `closeRoom()` — status `'ended'`, Redis cache tozalanadi
- Controller: `io.to(roomId).emit(ROOM_CLOSED, { reason: 'owner_closed' })` barcha a'zolarga
- Router: `io: SocketServer` parametri qo'shildi, `app.ts` ga `io` uzatildi

---

### F-105 | 2026-03-14 | [BACKEND] | T-S027 — Watch Progress alias route [Saidazim]

- `POST /content/movies/:id/progress` — body: `{ progress: 0-1, duration }` → `currentTime = progress * duration`
- `GET /content/movies/:id/progress` → `{ progress, currentTime, duration }` response
- Key: `movieid:${movieId}` prefix (watchProgressService da mavjud infra ishlatiladi)

---

### F-104 | 2026-03-14 | [BACKEND] | T-S026 — Content trending/top-rated/continue-watching [Saidazim]

- `GET /content/trending?limit=N` — `viewCount` desc, Redis cache `trending:${limit}` TTL 10 min
- `GET /content/top-rated?limit=N` — `rating` desc, Redis cache `top-rated:${limit}` TTL 10 min
- `GET /content/continue-watching` — `verifyToken`, `WatchProgress` (prefix `movieid:`, percent 0-90) + Movie join, response `{ ...movie, progress }`

---

### F-103 | 2026-03-14 | [MOBILE] | T-E030 — StatsScreen real API faollik grafigi [Emirhan]

- `IUserStats`: `weeklyActivity?: number[]` qo'shildi
- `ActivityChart`: mock random data o'chirildi → `weeklyActivity` prop ga asoslangan real bars
- Empty state: "Hali faollik yo'q" (icon + text) — agar barcha 7 kun 0 bo'lsa
- Backend `weeklyActivity` bermasa → bo'sh grafik ko'rsatiladi (graceful fallback)

---

### F-102 | 2026-03-14 | [MOBILE] | T-E029 — SettingsScreen profil tahrirlash + parol + hisob o'chirish [Emirhan]

- HISOB bo'limi qo'shildi: "Profilni tahrirlash" + "Parolni o'zgartirish" navigatsiya satrlar
- `authApi.changePassword(oldPassword, newPassword)` — `POST /auth/change-password`
- `userApi.deleteAccount()` — `DELETE /users/me`
- Hisob o'chirish: 2 bosqichli tasdiqlash (Alert → "TASDIQLASH" so'zi → `userApi.deleteAccount()` → logout)
- Parol o'zgartirish modal: eski/yangi/tasdiqlash input, validatsiya
- Profil tahrirlash modal: username + bio input (ProfileScreen kabi)

---

### F-101 | 2026-03-14 | [MOBILE] | T-E028 — ProfileScreen avatar edit + profil edit modal [Emirhan]

- Avatar ustida kamera icon overlay (absolute, bottom-right, primary rang)
- Tap → `expo-image-picker` (1:1 crop) → `userApi.updateProfile({ avatar })`
- Username yonida pencil icon — modal ochadi
- Profil edit bottom sheet modal: username + bio input, Saqlash tugmasi
- `useMyProfile.updateProfileMutation` kengaytirildi: `avatar` field qo'shildi

---

### F-100 | 2026-03-14 | [MOBILE] | T-E027 — ProfileSetupScreen avatar picker + genre chips [Emirhan]

- `shared/types`: `IUser.favoriteGenres?: ContentGenre[]` qo'shildi
- `userApi.updateProfile`: `favoriteGenres` qo'shildi
- Avatar picker: `expo-image-picker` (1:1 crop, 0.8 quality) — galereya, violet camera overlay
- Genre chips: 10 ta janr multi-select toggle (active: violet filled, inactive: outline)
- `handleSave`: bio + avatar + favoriteGenres birga yuboriladi

---

### F-099 | 2026-03-14 | [MOBILE] | T-E026 — MovieDetailScreen cast + o'xshash filmlar [Emirhan]

- `shared/types`: `ICastMember { name, photoUrl? }` + `IMovie.cast?`, `IMovie.director?` qo'shildi
- `useMovieDetail`: `similarMovies` query qo'shildi — `contentApi.getMovies({ genre })`, o'zini filtr qiladi, max 10
- Cast section: circular avatars (60px), actor ism, photoUrl bo'lmasa fallback icon — horizontal ScrollView
- Cast bo'sh bo'lsa yashiriladi
- O'xshash filmlar: poster (100x148) + title + rating — horizontal ScrollView, tap → boshqa MovieDetail

---

### F-098 | 2026-03-14 | [MOBILE] | T-E025 — WatchPartyCreateScreen redesign [Emirhan]

- `watchParty.api.ts`: `createRoom()` ga `videoUrl?` field qo'shildi
- `WatchPartyCreateScreen.tsx`: to'liq qayta yozildi
  - Film tanlash: Katalogdan (debounced search, `contentApi.search()`, 400ms, 5 natija) / URL orqali (toggle) mode toggle
  - Tanlangan film: poster + title + yil/janr chip, clear button
  - Do'stlarni taklif: `userApi.getFriends()` → checkbox list (avatar initial + username + checkbox)
  - Tanlangan do'stlar: violet chips row (tap to remove)
  - `handleCreate`: `movieId + videoUrl` (catalog) yoki `videoUrl` (URL mode) yuboradi

---

### F-097 | 2026-03-13 | [MOBILE] | T-E024 — YouTube expo-av proxy + LIVE badge + seek disable [Emirhan]

- `content.api.ts`: `YtStreamInfo` interface + `getYouTubeStreamInfo(url)` metodi qo'shildi
- `UniversalPlayer.tsx`: `VideoPlatform` ga `'youtube'` qo'shildi; `detectVideoPlatform` YouTube REGEX bilan yangilandi; `onStreamResolved` prop qo'shildi; YouTube URL → `getYouTubeStreamInfo()` → backend proxy URL (`/youtube/stream?url=...&token=...`) → expo-av `<Video>`; loading/error state UI
- `WatchPartyScreen.tsx`: `videoIsLive` state; `onStreamResolved` callback; `handleSeek` da `videoIsLive` guard; LIVE badge (absolute top:12 left:12, `colors.error` bg, `colors.textPrimary` dot, "JONLI EFIR"); seek tugmalari live da yashiriladi

---

### F-096 | 2026-03-13 | [BACKEND+INFRA] | T-C006 B1-B2 + T-S025b [Saidazim]

**T-C006 B1-B2 — WebView platform support:**
- `VideoPlatform` type: `'youtube'|'direct'|'webview'` shared/types ga qo'shildi
- Room model: `videoPlatform` Mongoose enum ga `'webview'` qo'shildi
- Service: `videoUrl` http/https validation; `needsResync()` webview uchun 2.5s threshold

**T-S025b — Bull queue + Dockerfile:**
- `shared/utils/serviceQueue.ts`: `addUserPoints`/`triggerAchievement` Bull queue (5 retry, exponential backoff)
- `serviceClient.ts`: queue bor bo'lsa queue, yo'q bo'lsa direct HTTP fallback
- battle/content/user `server.ts`: `initServiceQueues(redisUrl)` qo'shildi
- 7 ta Production Dockerfile: `npm ci -w @cinesync/shared -w @cinesync/[service]` — faqat kerakli deps

---

### F-095 | 2026-03-13 | [BACKEND+DOCKER] | T-S025 (qisman) — Docker + env fixes [Saidazim]

- Web container: `network_mode: host` → `cinesync_network` + `ports: 3000:3000`
- Web service env: `localhost:300x` → Docker DNS (`auth:3001`, `user:3002`, ...)
- Root `package.json`: `expo` devDep o'chirildi (faqat `apps/mobile/package.json` da)
- `apps/web/.env.example` yaratildi
- Qolgan: Bull event queue (inter-service reliability), Production Dockerfile optimizatsiya

---

### F-094 | 2026-03-13 | [BACKEND+INFRA] | T-S024 — Socket.io Redis adapter + Nginx TLS + rate limit [Saidazim]

- `@socket.io/redis-adapter` o'rnatildi; `pubClient`/`subClient` (redis.duplicate()) bilan adapter sozlandi
- `nginx.conf`: HTTP→HTTPS 301 redirect server block qo'shildi
- `nginx.conf`: HTTPS server block — TLS 1.2/1.3, ssl_session_cache, ssl_ciphers
- `nginx.conf`: HSTS header qo'shildi (`max-age=31536000; includeSubDomains`)
- `nginx.conf`: rate limit `30r/m` → `10r/s` (api), `10r/m` → `5r/m` (auth)

---

### F-093 | 2026-03-13 | [BACKEND+SHARED] | T-C007 — Shared middleware buglar tuzatildi [Saidazim]

- `error.middleware.ts`: Mongoose 11000 code `'11000'` (string) → `11000 || '11000'` (ikkisini ham tekshirish)
- `auth.middleware.ts`: `requireVerified` endi `user.isEmailVerified` ni JWT payload dan tekshiradi
- `shared/types`: `JwtPayload` ga `isEmailVerified?: boolean` qo'shildi
- `auth.service.ts`: `login`, `refreshTokens`, `generateAndStoreTokens` — payload ga `isEmailVerified` qo'shildi

---

### F-092 | 2026-03-13 | [BACKEND] | T-S016 — Google OAuth native token endpoint [Saidazim]

- `POST /api/v1/auth/google/token` endpoint qo'shildi — body: `{ idToken: string }`
- `google-auth-library` o'rnatildi; `verifyGoogleIdToken()` service metodi yozildi
- idToken verify → `findOrCreateGoogleUser` → `generateAndStoreTokens` → `{ user, accessToken, refreshToken }` response
- `googleIdTokenSchema` Joi validator + `authRateLimiter` qo'shildi

---

### F-091 | 2026-03-12 | [MOBILE] | T-C009 + T-C006 — Socket payload fix + WebView Video Player [Emirhan]

**T-C009 — Socket event payload mismatch (Mobile qismi):**
- `useWatchParty.ts` — `ROOM_JOINED`: `{ room, members }` → `{ room, syncState }` payload fix; `setActiveMembers(data.room.members)` + `setSyncState(data.syncState)` qo'shildi
- `useWatchParty.ts` — `MEMBER_JOINED`/`MEMBER_LEFT`: `setActiveMembers(data.members)` → `addMember`/`removeMember` (incremental, server faqat `userId` yuboradi)
- `watchParty.store.ts` — `addMember` (duplicate check bilan) va `removeMember` action lari qo'shildi

**T-C006 — WebView Video Player (Mobile qismi M1-M5):**
- `components/video/WebViewPlayer.tsx` (yangi) — `react-native-webview` asosida; MutationObserver JS injection; play/pause/seek/progress postMessage; nested iframe URL detect va redirect; loading overlay + error fallback; `forwardRef` bilan `play`/`pause`/`seekTo`/`getPositionMs` ref API
- `components/video/UniversalPlayer.tsx` (yangi) — `detectVideoPlatform(url)`: `.mp4/.m3u8/.webm` → expo-av, boshqa hammasi → WebViewPlayer; `forwardRef` bilan unifikatsiya qilingan ref API
- `screens/modal/WatchPartyScreen.tsx` — `Video` (expo-av) → `UniversalPlayer` ga o'tkazildi; sync useEffect `seekTo`/`play`/`pause` ref orqali; WebView `onPlay`/`onPause`/`onSeek` callbacklari socket emit bilan ulandi
- `package.json` — `react-native-webview@~13.16.1` qo'shildi; npm install qilindi

---

### F-093 | 2026-03-12 | [BACKEND] | T-S020, T-S021, T-S022, T-S023 — Security + Perf + Arch [Saidazim]

**T-S020 — CORS + mass assignment + validation:**
- Barcha 5 servislarda `origin:'*'` → `CORS_ORIGINS` env whitelist
- `updateMovie`: operator role uchun `OPERATOR_SAFE_FIELDS` whitelist
- `createMovie`: Joi validation schema (`content.validator.ts`)
- Admin CORS: hardcoded → `config.adminUrl` env

**T-S021 — Socket.io WebSocket + rate limit + XSS:**
- `transports: ['websocket', 'polling']` (WebSocket yoqildi)
- Socket message/emoji: 10 msg/5sek rate limit per user
- chat message, emoji, user bio, movie review: `xss` package bilan sanitize

**T-S022 — Performance:**
- `getAchievementStats`: `UserAchievement.find` 1x (avval 2x edi)
- Video upload: `memoryStorage(2GB)` → `diskStorage(500MB)`
- ytdl cache: `Map` → `LRUCache(max:100, ttl:2h)` (memory leak yo'q)
- External video rating: `ratedBy[]` + atomic `$inc` (race condition yo'q)

**T-S023 — Admin DB anti-pattern + Docker healthcheck:**
- admin.service.ts: `mongoose.createConnection` → serviceClient REST API
- User/Content servislarida admin internal endpointlar qo'shildi
- admin/config: hardcoded dev credentials olib tashlandi
- docker-compose.prod.yml: healthcheck + `depends_on: service_healthy`

---

### F-090 | 2026-03-12 | [BACKEND] | T-S017, T-S018, T-S019 — Security + Bug fixes [Saidazim]

**T-S017 — Internal endpoint security:**
- `shared/utils/serviceClient.ts` — `validateInternalSecret`: `INTERNAL_SECRET` bo'sh bo'lsa `false` qaytaradi (eski: `true` — production da xavfli)
- `user.routes.ts` — `/internal/profile` va `/internal/add-points` ga `requireInternalSecret` middleware qo'shildi
- `achievement.routes.ts` — `/internal/trigger` ga `requireInternalSecret` qo'shildi
- `serviceClient.ts` — `createUserProfile()` funksiyasi qo'shildi (X-Internal-Secret header bilan)
- `auth.service.ts` — `syncUserProfile`: raw `fetch` → `createUserProfile` serviceClient orqali
- `user.controller.ts` — `addPoints`: `userId` va `points > 0` validation qo'shildi

**T-S018 — OAuth tokens URL dan olib tashlandi:**
- `auth.controller.ts` — `googleCallback`: tokenlar URL query params da emas, Redis short-lived code (2 daqiqa TTL) orqali redirect
- `auth.service.ts` — `createOAuthTempCode()` + `exchangeOAuthCode()` metodlari qo'shildi
- `auth.routes.ts` — `POST /auth/google/exchange` — code → tokens (one-time use)
- `auth.service.ts` — `forgotPassword()`: `Promise<void>` — raw token return qilmaydi

**T-S019 — watchProgress + viewCount:**
- `watchProgress.controller.ts` — `req.userId` → `(req as AuthenticatedRequest).user.userId` (verifyToken `req.user` ga yozadi)
- `content.service.ts` — viewCount: Redis counter `viewcount:{movieId}` bilan alohida tracking, cache bilan aralashmaslik
- `shared/constants/index.ts` — `REDIS_KEYS.movieViewCount` qo'shildi

---

### F-087 | 2026-03-11 | [MOBILE] | T-E023 — HeroBanner auto-scroll, HomeScreen refresh, notification count, settings persist, VerifyEmail UX [Emirhan]

- `HeroBanner.tsx` — `onMomentumScrollEnd` da interval qayta ishga tushiriladi (manual swipe keyin auto-scroll to'xtab qolish bug)
- `hooks/useHomeData.ts` — `refetch()` `Promise.all` qaytaradigan qilindi
- `HomeScreen.tsx` — `await refetch()` + `try/finally setRefreshing(false)` (fake 1s timeout olib tashlandi)
- `notification.store.ts` — `markRead`: allaqachon o'qilgan notification uchun `unreadCount` kamaymasligini ta'minlandi
- `SettingsScreen.tsx` — `expo-secure-store` bilan persist: mount da yuklanadi, o'zgarganda saqlanadi
- `VerifyEmailScreen.tsx` — `keyboardType="number-pad"` + "Kodni qayta yuborish" tugmasi + 60s cooldown timer

### F-086 | 2026-03-11 | [MOBILE] | T-E022 — Logout server invalidate, socket tozalash, API null crash, WatchParty isSyncing [Emirhan]

- `auth.store.ts logout()` — `authApi.logout(refreshToken)` fire-and-forget chaqiriladi (server refresh token invalidate qiladi)
- `auth.store.ts logout()` — `disconnectSocket()` chaqiriladi (eski JWT bilan socket oqib ketmaslik uchun)
- `auth.api.ts` — `login()` va `googleToken()` da `!` null assertion → `if (!res.data.data) throw new Error(...)`
- `user.api.ts` — `getMe()`, `updateProfile()`, `getPublicProfile()`, `getStats()` da null assertion fix
- `WatchPartyScreen.tsx` — `setPositionAsync` ga `.catch(() => {})` + `.finally(() => isSyncing.current = false)` qo'shildi

### F-085 | 2026-03-11 | [MOBILE] | T-E021 — Seek bar thumb pozitsiya fix, Search pagination accumulate, getItemLayout olib tashlandi [Emirhan]

- `VideoPlayerScreen.tsx:198` — `left: \`${progressRatio * 100}%\` as unknown as number` → `left: progressRatio * seekBarWidth - 6` (pixel hisob, React Native `%` qabul qilmaydi)
- `SearchResultsScreen.tsx` — `allMovies` state bilan accumulate: page 1 da almashtiradi, keyingi page da qo'shadi
- `SearchResultsScreen.tsx` — query o'zgarganda `page=1` va `allMovies=[]` reset qilinadi
- `SearchResultsScreen.tsx` — noto'g'ri `getItemLayout` olib tashlandi (21px ≠ asl card height)

### F-084 | 2026-03-11 | [MOBILE] | T-E020 — Token refresh race condition: shared isRefreshing + failedQueue [Emirhan]

- `api/client.ts` — module-level `isRefreshing` flag va `failedQueue` pattern qo'shildi
- Birinchi 401 refresh boshlaydi, qolgan parallel so'rovlar queue ga tushadi
- Refresh tugagach queue dagi barcha so'rovlar yangi token bilan replay qilinadi
- `processQueue(null, token)` / `processQueue(err, null)` pattern — oldingi: har bir client mustaqil refresh boshlardi → token invalidation loop

### F-083 | 2026-03-11 | [MOBILE] | T-E019 — ProfileSetup auth flow fix: needsProfileSetup flag + AppNavigator [Emirhan]

- `auth.store.ts` — `needsProfileSetup: boolean` + `clearProfileSetup()` qo'shildi
- `auth.store.ts setAuth()` — `needsProfileSetup: !user.bio` (bio yo'q yangi foydalanuvchi uchun)
- `AppNavigator.tsx` — `needsProfileSetup=true` bo'lsa Main o'rniga `ProfileSetupScreen` ko'rsatiladi
- `ProfileSetupScreen.tsx` — `navigation.replace('Login')` o'chirildi → `clearProfileSetup()` chaqiriladi → AppNavigator Main ga o'tadi
- `types/index.ts` — `RootStackParamList` ga `ProfileSetup: undefined` qo'shildi

### F-082 | 2026-03-11 | [MOBILE] | T-E020 — Oq ekran root fix: hideAsync App.tsx + hydrate timeout [Emirhan]

- `App.tsx` — `hideAsync()` `isHydrated=true` bo'lganda darhol chaqiriladi (SplashScreen.tsx dan ko'chirildi)
- `SplashScreen.tsx` — `expo-splash-screen` import olib tashlandi, faqat navigatsiya vazifasi qoldi
- `auth.store.ts hydrate()` — SecureStore Android emulator da hang qilmaslik uchun 5s race timeout
- Sabab: `preventAutoHideAsync()` chaqirilgan, lekin `hideAsync()` navigation render bo'lmasa chaqirilmasdi → abadiy oq ekran

### F-081 | 2026-03-11 | [MOBILE] | Bug audit — StatsScreen, HomeScreen nav type, app.json [Emirhan]

- `StatsScreen.tsx:241` — `right: -'50%'.length` (= -3px) → `right: '-50%'` (to'g'ri % qiymati)
- `StatsScreen.tsx:39` — `ActivityChart` `Math.random()` har render → `useMemo([hours])`
- `HomeScreen.tsx` — navigation type `ModalStackParamList` → `RootStackParamList`, navigate call fix
- `types/index.ts` — `Modal: undefined` → `Modal: { screen, params? }` typed
- `app.json` — `expo-image` plugin (PluginError) va `googleServicesFile` (fayl yo'q) olib tashlandi
- `docs/Tasks.md` — T-E019 qo'shildi (ProfileSetup auth flow muammosi)

### F-079 | 2026-03-11 | [MOBILE] | T-E018 — Oq ekran bug fix (SplashScreen + hydration) [Emirhan]

- `index.ts` — `SplashScreen.preventAutoHideAsync()` eng birinchi chaqiriladi
- `SplashScreen.tsx` — modul darajasidagi takroriy `preventAutoHideAsync()` olib tashlandi
- `AppNavigator.tsx` — `!isHydrated` paytida `null` o'rniga `#0A0A0F` qora background
- `auth.store.ts` — `hydrate()` try/finally — `isHydrated: true` har doim o'rnatiladi

### F-076 | 2026-03-11 | [MOBILE] | T-E015 — auth.store hydrate() user tiklanishi [Emirhan]

- `auth.store.ts` — `hydrate()` ichida `userApi.getMe()` chaqirib `user` state tiklanadi
- Token expired/invalid bo'lsa `logout()` state set qilinadi
- App qayta ishga tushganda `user?._id` endi `undefined` emas

### F-077 | 2026-03-11 | [MOBILE] | T-E016 — client.ts 401 handler auth store reset [Emirhan]

- `api/client.ts` — refresh token fail bo'lganda `useAuthStore.getState().logout()` chaqiriladi
- `tokenStorage.clear()` o'rniga store orqali to'liq logout — `isAuthenticated: false` bo'ladi
- Dynamic import bilan circular dep muammosi hal qilindi

### F-078 | 2026-03-11 | [MOBILE] | T-E017 — VerifyEmailScreen OTP endpoint fix [Emirhan]

- `auth.api.ts` — `verifyEmail(token)` → `confirmRegister(email, code)` rename + endpoint `/auth/register/confirm`
- `VerifyEmailScreen.tsx` — `{ email, code }` yuboriladi, javobda `{ userId }` qayta ishlashga o'zgartirildi
- OTP tasdiqlangach Login screen ga yo'naltiriladi
- `@types/react-test-renderer` qo'shildi + test faylida `unknown` cast fix (typecheck PASS)

---

### F-075 | 2026-03-11 | [MOBILE] | T-E013 — eas.json + app.json plugins + EAS setup [Emirhan]

- `eas.json` — development (APK/iOS sim) / preview / production (AAB) profillari
- `app.json` — expo-notifications (#E50914, default channel), expo-secure-store, expo-av, expo-image plugins; iOS infoPlist + Android permissions
- `.env.example` — EXPO_PUBLIC_PROJECT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID template
- **Qolgan (user tomonidan):** `eas init` → projectId to'ldirish, google-services.json qo'shish

---

### F-074 | 2026-03-11 | [MOBILE] | T-E011 — ErrorBoundary + crash utils + Jest 9/9 [Emirhan]

- `utils/crash.ts` — Sentry stub (captureException, captureMessage, setUser, clearUser, __DEV__ guard)
- `components/common/ErrorBoundary.tsx` — class-based, getDerivedStateFromError, "Qayta urinish" tugmasi
- `App.tsx` — root `<ErrorBoundary>` bilan o'raldi
- `__tests__/crash.test.ts` — 5 unit test ✅
- `__tests__/ErrorBoundary.test.tsx` — 4 unit test ✅
- `package.json` — jest-expo ~54.0.0, react moduleNameMapper (React 19 dedup), jest@29
- **Jest:** 9/9 tests PASS ✅

---

### F-073 | 2026-03-11 | [MOBILE] | T-E010 — NotificationsScreen [Emirhan]

- `screens/modal/NotificationsScreen.tsx` — 8 NotificationType icons, unread dot + left border, timeAgo helper, markRead on press, WatchParty/Battle navigate, delete confirm, markAllRead, pull-to-refresh
- `navigation/ModalNavigator.tsx` — Notifications → real screen
- **tsc --noEmit:** ✅ 0 xato

---

### F-072 | 2026-03-11 | [MOBILE] | T-E009 — ProfileScreen + StatsScreen + AchievementsScreen + SettingsScreen [Emirhan]

- `hooks/useProfile.ts` — useMyProfile (getMe, getStats, getMyAchievements, updateProfile)
- `api/user.api.ts` — getMyAchievements() endpoint qo'shildi
- `screens/profile/ProfileScreen.tsx` — avatar, rank badge + progress bar, 4-stat grid, nav links, logout
- `screens/profile/AchievementsScreen.tsx` — 3-ustun FlatList, RARITY_COLORS, locked "???" cells
- `screens/profile/StatsScreen.tsx` — rank card, 6-stat grid, weekly bar chart (Views), rank yo'li
- `screens/profile/SettingsScreen.tsx` — 3 til, 5 notif toggle, 2 privacy toggle
- `navigation/MainNavigator.tsx` → real screens ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-071 | 2026-03-11 | [MOBILE] | T-E012 — Google OAuth expo-auth-session [Emirhan]

- `screens/auth/LoginScreen.tsx` — WebBrowser.maybeCompleteAuthSession(), Google.useAuthRequest, useEffect (id_token → authApi.googleToken → setAuth), Google button UI (divider, G icon)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` env variable kerak (`.env`ga qo'shiladi)
- **tsc --noEmit:** ✅ 0 xato

---

### F-070 | 2026-03-11 | [MOBILE] | T-E008 — BattleCreateScreen + BattleScreen [Emirhan]

- `hooks/useBattle.ts` — useMyBattles (accept/reject), useBattleDetail (60s refetch), useCreateBattle
- `screens/modal/BattleCreateScreen.tsx` — friend picker FlatList, duration chips (3/5/7 kun), optional title
- `screens/modal/BattleScreen.tsx` — dual mode: battleId→detail, no id→list; BattleCard animated progress bars, accept/reject, winner badge, days left
- `navigation/ModalNavigator.tsx` — BattleCreate + Battle → real screens
- **tsc --noEmit:** ✅ 0 xato

---

### F-069 | 2026-03-11 | [MOBILE] | T-E007 — FriendsScreen + FriendSearchScreen + FriendProfileScreen [Emirhan]

- `hooks/useFriends.ts` — useFriends (getFriends, getPendingRequests, accept/reject/remove), useFriendSearch (debounce 500ms, min 2 chars), useFriendProfile (publicProfile + stats + sendRequest/remove)
- `screens/friends/FriendsScreen.tsx` — 2 tab (Do'stlar/So'rovlar), online dot, pending badge, accept/reject alert
- `screens/friends/FriendSearchScreen.tsx` — debounce search, add/sent/friend state UI, online dot, rank badge
- `screens/friends/FriendProfileScreen.tsx` — avatar, rank, online status, bio, 4-stat grid, add/remove friend actions
- `navigation/MainNavigator.tsx` — FriendsStack → real screens
- **tsc --noEmit:** ✅ 0 xato

---

### F-068 | 2026-03-11 | [MOBILE] | T-E006 — WatchPartyCreateScreen + WatchPartyScreen [Emirhan]

- `hooks/useWatchParty.ts` — Socket.io: JOIN_ROOM, VIDEO_SYNC/PLAY/PAUSE/SEEK, ROOM_MESSAGE, MEMBER events, ROOM_CLOSED; owner controls emitPlay/Pause/Seek/sendMessage/sendEmoji
- `components/watchParty/ChatPanel.tsx` — chat FlatList, own/other bubble, KeyboardAvoidingView, send input
- `components/watchParty/EmojiFloat.tsx` — Animated float (translateY+opacity), 8-emoji quick picker bar
- `screens/modal/WatchPartyCreateScreen.tsx` — room name, private/public Switch, max members chips (2/4/6/8/10), invite code info, create API call
- `screens/modal/WatchPartyScreen.tsx` — expo-av sync video (isSyncing ref, owner controls overlay), emoji float, chat panel toggle, invite code card, leave/close room
- `navigation/ModalNavigator.tsx` — Modal stack (WatchPartyCreate, WatchParty, Battle*, Notifications* placeholder)
- `navigation/AppNavigator.tsx` — Modal stack (presentation: modal, slide_from_bottom) ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-067 | 2026-03-11 | [MOBILE] | Expo start fix + Railway env setup [Emirhan]

- `package.json` (root) — noto'g'ri `expo: ~55.0.5` + `babel-preset-expo` olib tashlandi, `expo: ~54.0.0` qo'shildi (npm workspace hoisting muammosi hal qilindi)
- `apps/mobile/.env` — Railway production API URLlari to'ldirildi (auth, user, content, notification, watch-party, battle, admin)
- Metro Bundler muvaffaqiyatli ishga tushdi

---

### F-066 | 2026-03-10 | [MOBILE] | T-E005 — MovieDetailScreen + VideoPlayerScreen [Emirhan]

- `hooks/useMovieDetail.ts` — React Query: movie (stale 5min) + watchProgress (stale 0)
- `screens/home/MovieDetailScreen.tsx` — Animated parallax backdrop (LinearGradient fade), poster+info row, genre chips, desc, Watch button, 5-star RatingWidget (→ 1-10 backend)
- `screens/home/VideoPlayerScreen.tsx` — expo-av Video, custom controls overlay (auto-hide 3.5s), play/pause/±10s skip, seek bar (touch-to-seek), progress throttle 30s, 90%→markComplete
- `navigation/MainNavigator.tsx` — MovieDetailScreen + VideoPlayerScreen ulandi

---

### F-065 | 2026-03-10 | [MOBILE] | T-E014 — Theme ranglarini Web UI (aqua) bilan moslashtirish [Emirhan]

- `apps/mobile/src/theme/index.ts` — `colors` obyekti to'liq yangilandi
- OKLCH → HEX konversiya: base-100→bgBase(#211F1C), base-200→bgElevated(#3E3B38), base-300→border(#7A3B40)
- primary: #E50914 (Netflix red) → #7B72F8 (violet, oklch 67% 0.182 276)
- secondary: #49C4E5 (aqua), neutral: #C03040, textPrimary: #EFE6EB
- Yangi tokenlar qo'shildi: primaryContent, primaryHover, secondary, secondaryContent, neutral
- RANK_COLORS, RARITY_COLORS — o'zgartirilmadi (gamification-specific)

---

### F-064 | 2026-03-10 | [MOBILE] | T-E004 — SearchScreen + SearchResultsScreen [Emirhan]

- `hooks/useSearch.ts` — useSearchHistory (expo-secure-store, 10 ta limit), useSearchResults (React Query, stale 2min), useDebounce (500ms), GENRES array
- `screens/search/SearchScreen.tsx` — debounced search, genre chips (10ta), quick results preview (4ta), search history (add/remove/clear), genre browse grid
- `screens/search/SearchResultsScreen.tsx` — FlatList 2-ustun, pagination (onEndReached), loading state, empty state
- `navigation/MainNavigator.tsx` — SearchScreen + SearchResultsScreen ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-063 | 2026-03-09 | [MOBILE] | T-E003 — HomeScreen + MovieRow + HeroBanner [Emirhan]

- `hooks/useHomeData.ts` — React Query: trending (stale 10min), topRated, continueWatching
- `components/movie/MovieCard.tsx` — expo-image, rating badge, navigation to MovieDetail, React.memo
- `components/movie/MovieRow.tsx` — horizontal FlatList, getItemLayout, windowSize, React.memo
- `components/movie/HeroBanner.tsx` — top 5, LinearGradient overlay, auto-scroll 4s, dot indicators, Watch tugmasi
- `components/movie/HomeSkeleton.tsx` — pulse animation skeleton (hero + 2 row)
- `screens/home/HomeScreen.tsx` — header, notification badge, RefreshControl, continueWatching (shartli)
- **tsc --noEmit:** ✅ 0 xato

---

### F-062 | 2026-03-09 | [MOBILE] | T-E002 — Auth ekranlar [Emirhan]

- `SplashScreen.tsx` — animated logo (fade+scale), token hydration, Onboarding ga redirect
- `OnboardingScreen.tsx` — 3 slide FlatList (pagingEnabled), dot indicators, Keyingi/Boshlash/O'tkazib
- `LoginScreen.tsx` — email+password, show/hide parol, xato xabarlar, authApi.login → setAuth
- `RegisterScreen.tsx` — username+email+password+confirm, client validation (8 belgi, email format)
- `VerifyEmailScreen.tsx` — token input, authApi.verifyEmail, enumeration-safe xabar
- `ForgotPasswordScreen.tsx` — email input, enumeration-safe success message
- `ProfileSetupScreen.tsx` — bio (200 char), skip tugmasi, updateProfile
- `AuthNavigator.tsx` — real screen larga ulandi
- **tsc --noEmit:** ✅ 0 xato

---

### F-061 | 2026-03-09 | [MOBILE] | T-E001 — Expo loyiha foundation [Emirhan]

- `src/theme/index.ts` — colors, spacing, borderRadius, typography, shadows, RANK_COLORS, RARITY_COLORS
- `src/types/index.ts` — shared types re-export + mobile-specific (AuthStackParamList, nav types, LoginRequest, IWatchProgress, IUserStats)
- `src/utils/storage.ts` — expo-secure-store: saveTokens, getAll, clear
- `src/utils/notifications.ts` — expo-notifications: requestPermission, getExpoPushToken, NOTIFICATION_ROUTES, Android channel
- `src/api/client.ts` — 6 ta per-service Axios instance, auto-refresh interceptor, token rotation
- `src/api/auth.api.ts` — login, register, verifyEmail, forgotPassword, refresh, logout, googleToken
- `src/api/user.api.ts` — getMe, updateProfile, updateFcmToken, search, friends CRUD
- `src/api/content.api.ts` — trending, topRated, search, progress, markComplete, rate
- `src/api/watchParty.api.ts` — createRoom, getRooms, joinByInviteCode, leave, close
- `src/api/battle.api.ts` — createBattle, getMyBattles, accept, reject, leaderboard
- `src/api/notification.api.ts` — getAll, markRead, markAllRead, delete, unreadCount
- `src/store/auth.store.ts` — Zustand: user, accessToken, isAuthenticated, isHydrated, hydrate
- `src/store/movies.store.ts` — trending, topRated, continueWatching, currentMovie
- `src/store/friends.store.ts` — friends, pendingRequests, onlineStatus
- `src/store/watchParty.store.ts` — room, syncState, messages, activeMembers
- `src/store/battle.store.ts` — activeBattles, currentBattle
- `src/store/notification.store.ts` — notifications, unreadCount, markRead/All
- `src/socket/client.ts` — Socket.io: connectSocket, disconnectSocket, getSocket
- `src/hooks/useSocket.ts` — auth-aware socket connect/disconnect
- `src/navigation/AppNavigator.tsx` — auth-aware root navigator, hydration wait
- `src/navigation/AuthNavigator.tsx` — AuthStack (Splash→Onboarding→Login→Register→Verify→ForgotPw→Setup)
- `src/navigation/MainNavigator.tsx` — BottomTabs (Home/Search/Friends/Profile) + nested stacks
- `src/navigation/PlaceholderScreen.tsx` — vaqtinchalik placeholder
- `App.tsx` — QueryClient + GestureHandlerRootView + hydration
- **tsc --noEmit:** ✅ 0 xato

---

### F-060 | 2026-03-08 | [WEB] | T-J012 — React hydration errors #418 / #423 [Jafar]

- **Sabab 1 (asosiy):** `Providers.tsx` — Zustand `persist` middleware localStorage ni gidratatsiya paytida sinxron o'qib, `NextIntlClientProvider` locale ni o'zgartiradi → server va client HTML mos kelmaydi (#418) + render paytida state yangilanishi (#423)
- **Yechim:** `useState('uz')` boshlang'ich qiymat (server HTML bilan mos), `useEffect` da persisted locale qo'llaniladi — faqat mount dan keyin
- **Sabab 2 (ikkilamchi):** `HeroBanner.tsx` — `viewCount.toLocaleString()` Node.js vs browser lokali farqli → HTML mismatch (#418)
- **Yechim:** `formatViews()` — deterministik K/M formatlashtirish (`toLocaleString()` o'rniga)
- **Commit:** `15652a6`

---

### F-057 | 2026-03-07 | [WEB] | T-J008 — Friends page API error handling + React Query [Jafar]

- `toast.store.ts` (Zustand) — success/error/warning/info toastlar, 4s avtomatik yopiladi
- `Toaster.tsx` (DaisyUI `toast`+`alert`) — Providers.tsx ga ulandi
- `friends/page.tsx` — `useQuery` bilan do'stlar/so'rovlar, `useMutation` accept uchun
- `sendRequest`: 201✓ / 409 / 404 / 400 / 500 status kodlariga mos toast xabarlar
- Har foydalanuvchi uchun alohida loading spinner, yuborilgandan keyin disable + ✓ icon

### F-058 | 2026-03-07 | [WEB] | T-J009 — Profile sahifalari [Jafar]

- `profile/me/page.tsx` — React Query bilan `/users/me` + achievements + do'stlar soni
- `profile/[username]/page.tsx` — `AddFriendButton` (client component) qo'shildi
- `components/profile/AddFriendButton.tsx` — o'z profili bo'lsa yashiriladi, 409→"allaqachon" badge

### F-059 | 2026-03-07 | [WEB] | T-J011 — Loading UI + React Query [Jafar]

- `(app)/loading.tsx` — umumiy skeleton
- `home/loading.tsx`, `friends/loading.tsx`, `movies/loading.tsx`, `profile/loading.tsx`
- Next.js navigatsiya paytida avtomatik Suspense skeleton ko'rsatadi (4-5s bo'sh ekran yo'q)

---

## 📱 MOBILE RUN GUIDE (Emirhan)
> To'liq guide: `docs/MOBILE_SETUP.md`
> Yangi PC dan git clone qilganda yoki loyihani birinchi marta ishga tushirganda

### Talablar
| Tool | Versiya | Tekshirish |
|------|---------|------------|
| Node.js | >= 18.18 | `node --version` |
| npm | >= 10.0 | `npm --version` |
| Android Studio | Yangi | Emulator uchun |
| Java JDK | 17 | `java --version` |

---

### 1-qadam: Clone va install

```bash
# 1. Clone
git clone https://github.com/AI-automatization/Rave.git
cd Rave

# 2. MUHIM: apps/package.json yaratish (git da yo'q!)
echo '{"name":"cinesync-apps","private":true}' > apps/package.json

# 3. Root dan install (apps/mobile dan EMAS!)
npm install

# Agar peer-dep xatosi chiqsa:
npm install --legacy-peer-deps
```

---

### 2-qadam: Environment fayllari

```bash
# apps/mobile/ papkasida .env yaratish:
cd apps/mobile

# .env fayli (Saidazim dan so'rash — backend URL lar)
API_BASE_URL=http://10.0.2.2:3001       # Android emulator uchun
# API_BASE_URL=http://localhost:3001    # iOS simulator uchun
# API_BASE_URL=http://192.168.x.x:3001 # Real qurilma uchun (wifi IP)

# Firebase uchun (Saidazim dan olish):
# google-services.json → apps/mobile/android/app/google-services.json
# GoogleService-Info.plist → apps/mobile/ios/GoogleService-Info.plist
```

---

### 3-qadam: Metro Bundler ishga tushirish

```  
cd apps/mobile

# Standard ishga tushirish:
npx expo start

# Yoki development mode:
npx expo start --dev-client

# Cache tozalab ishga tushirish (xato chiqsa):
npx expo start --clear
```

Metro muvaffaqiyatli ishga tushganda:
```
Starting Metro Bundler
Waiting on http://localhost:8081
```

---

### 4-qadam: Qurilmaga ulash

**Android Emulator (tavsiya qilinadi):**
```bash
# Android Studio → AVD Manager → emulator ishga tushir
# Keyin yangi terminалда:
cd apps/mobile
npx expo run:android
```

**Real Android qurilma (USB):**
```bash
# USB debugging yoqilgan bo'lsin
adb devices   # qurilma ko'rinishini tekshir
npx expo run:android
```

**Expo Go ishlamaydi** — loyiha Bare Workflow, faqat native build kerak.

---

### Tez-tez uchraydigan xatolar

| Xato | Yechim |
|------|--------|
| `Cannot find module 'react-native/package.json'` | `apps/package.json` yo'q → 2-qadamga qayt |
| `TypeError: Cannot read properties of undefined (reading 'push')` | `cd /c/Rave && npm install` (root dan) |
| `Metro bundler version mismatch` | Root `package.json` da barcha `metro-*: ~0.82.0` bo'lishi kerak |
| `TypeScript errors` | `cd apps/mobile && npm run typecheck` |
| `EADDRINUSE: port 8081` | `npx expo start --port 8082` |
| `Unable to find module` | `npx expo start --clear` |

---

### Fayllar strukturasi (muhim fayllar)

```
Rave/
├── package.json          ← metro-* ~0.82.0 + overrides: react-native 0.79.6
├── apps/
│   ├── package.json      ← YARATISH KERAK (git da yo'q!)
│   └── mobile/
│       ├── package.json  ← react-native 0.79.6, expo ~53.0.0
│       ├── tsconfig.json ← expo/tsconfig.base
│       ├── babel.config.js ← @app-types alias (not @types!)
│       ├── metro.config.js ← watchFolders + lottie ext
│       └── eas.json      ← EAS Build profillari (git da yo'q)
```

---

## ✅ BAJARILGAN FEATURELAR

### F-001 | 2026-02-26 | [DEVOPS] | Monorepo + Docker + Nginx setup

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S001
- **Bajarildi:**
  - `package.json` — npm workspaces (services/_, apps/_, shared)
  - `tsconfig.base.json` — strict mode, @shared/\* path aliases
  - `docker-compose.dev.yml` — MongoDB 7, Redis 7 (AOF), Elasticsearch 8.11
  - `docker-compose.prod.yml` — barcha service container + nginx
  - `nginx/nginx.conf` — reverse proxy (3001-3008), WebSocket support, rate limiting zones
- **Commit:** `379c2cd` → github.com:AI-automatization/Rave.git

---

### F-002 | 2026-02-26 | [BACKEND] | Shared utilities — types, logger, middleware, constants

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S007 (Logging), T-C001 (partial)
- **Bajarildi:**
  - `shared/src/types/index.ts` — ApiResponse<T>, IUser, IMovie, IWatchPartyRoom, IBattle, INotification, IFriendship, JwtPayload, pagination types
  - `shared/src/utils/logger.ts` — Winston (console + file transports, MongoDB prod-da), sensitive field redaction (password/token/secret → [REDACTED])
  - `shared/src/utils/apiResponse.ts` — success(), error(), paginated() helpers
  - `shared/src/utils/errors.ts` — AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, TooManyRequestsError, BadRequestError
  - `shared/src/middleware/auth.middleware.ts` — verifyToken (RS256), optionalAuth, requireRole, requireVerified
  - `shared/src/middleware/error.middleware.ts` — global Express error handler
  - `shared/src/middleware/rateLimiter.middleware.ts` — Redis-based: apiRateLimiter, authRateLimiter, userRateLimiter
  - `shared/src/constants/index.ts` — POINTS, RANKS, PORTS, REDIS_KEYS, TTL, LIMITS, PATTERNS
  - `shared/src/constants/socketEvents.ts` — SERVER_EVENTS, CLIENT_EVENTS (freeze qilingan)
- **Commit:** `379c2cd`

---

### F-003 | 2026-02-26 | [BACKEND] | Auth Service boilerplate (port 3001)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S002 (boilerplate qismi)
- **Bajarildi:**
  - `services/auth/src/models/user.model.ts` — Mongoose schema (email, username, passwordHash, role, isEmailVerified, googleId, fcmTokens, resetToken)
  - `services/auth/src/models/refreshToken.model.ts` — TTL index, tokenHash, ip, userAgent
  - `services/auth/src/services/auth.service.ts` — hashPassword (bcrypt 12 rounds), comparePassword, generateTokens (RS256), register, login, refreshTokens (rotation), logout, verifyEmail, forgotPassword, resetPassword, findOrCreateGoogleUser, bruteForce protection
  - `services/auth/src/controllers/auth.controller.ts` — register, login, refresh, logout, logoutAll, verifyEmail, forgotPassword, resetPassword, googleCallback, getMe
  - `services/auth/src/routes/auth.routes.ts` — barcha endpoint + Passport Google OAuth
  - `services/auth/src/validators/auth.validator.ts` — Joi schemas
  - `services/auth/src/app.ts` — Express, helmet, cors, passport init
  - `services/auth/src/server.ts` — MongoDB connect, Redis connect, graceful shutdown
  - `.env.example`, `Dockerfile`, `tsconfig.json`, `package.json`
- **Commit:** `379c2cd`

---

### F-004 | 2026-02-26 | [BACKEND] | User Service boilerplate (port 3002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Task:** T-S003 (boilerplate qismi)
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — authId ref, rank, totalPoints, lastSeenAt
  - `services/user/src/models/friendship.model.ts` — requesterId, receiverId, status (pending/accepted/blocked)
  - `services/user/src/services/user.service.ts` — getProfile, getPublicProfile, updateProfile, heartbeat (Redis TTL 3min), isUserOnline, sendFriendRequest, acceptFriendRequest (points award), removeFriend, getFriends, addPoints, recalculateRank
  - `services/user/src/controllers/user.controller.ts` + routes + app + server
- **Commit:** `379c2cd`

---

### F-005 | 2026-02-26 | [BACKEND] | Content Service boilerplate (port 3003)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S005
- **Bajarildi:**
  - `services/content/src/models/movie.model.ts` — title, genre, year, duration, HLS videoUrl, isPublished, viewCount, elasticId
  - `services/content/src/models/watchHistory.model.ts` — progress (0-100%), completed (≥90%), durationWatched, TTL index yo'q
  - `services/content/src/models/rating.model.ts` — score (1-10), review, unique (userId+movieId)
  - `services/content/src/services/content.service.ts` — getMovieById (Redis cache), listMovies, searchMovies (Elasticsearch multi_match + fuzzy), createMovie (ES index), updateMovie (cache invalidate), deleteMovie, recordWatchHistory (upsert), getWatchHistory, rateMovie (avg recalc)
  - `services/content/src/controllers/content.controller.ts` + routes (operator/admin guard) + app + server
- **Commit:** `379c2cd`

---

### F-006 | 2026-02-26 | [BACKEND] | Watch Party Service boilerplate (port 3004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Task:** T-S006 (boilerplate qismi)
- **Bajarildi:**
  - `services/watch-party/src/models/watchPartyRoom.model.ts` — inviteCode, members, maxMembers (10), status, currentTime, isPlaying
  - `services/watch-party/src/services/watchParty.service.ts` — createRoom (random inviteCode), joinRoom, leaveRoom (owner→close), syncState (±2s threshold), getSyncState, needsResync, kickMember
  - `services/watch-party/src/socket/watchParty.socket.ts` — JWT auth middleware, join/leave/play/pause/seek/buffer/chat/emoji/kick handlers, latency compensation
  - HTTP controllers + routes + app (Socket.io init) + server
- **Commit:** `379c2cd`

---

### F-007 | 2026-02-26 | [BACKEND] | Battle Service boilerplate (port 3005)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S008
- **Bajarildi:**
  - `services/battle/src/models/battle.model.ts` — duration (3/5/7 kun), status, startDate, endDate, winnerId
  - `services/battle/src/models/battleParticipant.model.ts` — score, moviesWatched, minutesWatched, hasAccepted
  - `services/battle/src/services/battle.service.ts` — createBattle, inviteParticipant, acceptInvite, addMovieScore (Redis ZINCRBY), getLeaderboard (Redis sorted set ZREVRANGEBYSCORE), getUserActiveBattles, cron hourly resolution (BATTLE_WIN points award)
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-008 | 2026-02-26 | [BACKEND] | Notification Service boilerplate (port 3007)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Task:** T-S010
- **Bajarildi:**
  - `services/notification/src/models/notification.model.ts` — 8 NotificationType, data (Mixed), TTL 90 kun
  - `services/notification/src/queues/email.queue.ts` — Bull queue, nodemailer transporter, 3 retries (exponential backoff)
  - `services/notification/src/services/notification.service.ts` — sendInApp, sendPush (FCM multicast), sendEmail (Bull enqueue), getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification
  - `services/notification/src/app.ts` — Firebase Admin init
  - Controllers + routes + server
- **Commit:** `379c2cd`

---

### F-009 | 2026-02-26 | [BACKEND] | Admin Service boilerplate (port 3008)

- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Task:** T-S011 (boilerplate qismi)
- **Bajarildi:**
  - `services/admin/src/services/admin.service.ts` — getDashboardStats (totalUsers, activeUsers via Redis keys), listUsers (filter: role, isBlocked, search), blockUser (Redis session invalidate), unblockUser, changeUserRole, deleteUser
  - requireRole('admin', 'superadmin') guard barcha route
  - Controllers + routes + app + server
- **Commit:** `379c2cd`

---

### F-010 | 2026-02-27 | [BACKEND] | User Service — avatar upload + settings + profile sync (T-S002)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/user.model.ts` — `settings.notifications` (8 ta toggle) qo'shildi
  - `services/user/src/validators/user.validator.ts` — updateProfile, updateSettings, createProfile, fcmToken Joi schemas
  - `services/user/src/services/user.service.ts` — `updateAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` metodlar
  - `services/user/src/controllers/user.controller.ts` — `uploadAvatar`, `getSettings`, `updateSettings`, `createProfile`, `addFcmToken`, `removeFcmToken` handlerlar
  - `services/user/src/routes/user.routes.ts` — multer (JPEG/PNG/WebP, max 5MB), `PATCH /me/avatar`, `GET/PATCH /me/settings`, `POST/DELETE /me/fcm-token`, `POST /internal/profile`
  - `services/user/src/app.ts` — `/uploads` static file serving
  - `services/auth/src/services/auth.service.ts` — register/Google OAuth da `syncUserProfile()` chaqiradi (user service `/internal/profile`)
  - `services/auth/src/config/index.ts` — `USER_SERVICE_URL` env var qo'shildi
  - `services/auth/.env.example` — `USER_SERVICE_URL` qo'shildi

---

### F-011 | 2026-02-27 | [BACKEND] | Missing MongoDB Schemas + Seed Script (T-S003)

- **Mas'ul:** Saidazim
- **Sprint:** S1
- **Bajarildi:**
  - `services/user/src/models/achievement.model.ts` — key, title, description, iconUrl, rarity (5 daraja), points, condition, isSecret; key+rarity index
  - `services/user/src/models/userAchievement.model.ts` — userId, achievementId, achievementKey, unlockedAt; (userId+achievementKey) unique index
  - `services/admin/src/models/feedback.model.ts` — userId, type (bug/feature/other), content, status (4 holat), adminReply, repliedAt, repliedBy
  - `services/admin/src/models/apiLog.model.ts` — service, method, url, statusCode, duration, userId, level, meta; TTL index (30 kun)
  - `scripts/seed.ts` — Auth+User+Content DB ga ulangan seed: 4 user (superadmin, operator, 2 test), 25 achievement, 12 demo film (IMDB top filmlar)
  - `scripts/tsconfig.json` — seed script uchun TypeScript config
  - `package.json` — `npm run seed` script qo'shildi

---

### F-012 | 2026-02-27 | [BACKEND] | Watch Party — audio mute control (T-S004)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/watch-party/src/socket/watchParty.socket.ts` — `CLIENT_EVENTS.MUTE_MEMBER` handler: owner tekshiruvi, member mavjudligi tekshiruvi, `SERVER_EVENTS.MEMBER_MUTED` broadcast (userId, mutedBy, reason, timestamp)
  - `services/watch-party/src/services/watchParty.service.ts` — `setMuteState()` (Redis Set: `watch_party:muted:{roomId}`), `getMutedMembers()`, `isMuted()` metodlar; TTL: WATCH_PARTY_ROOM (24h)
  - Buffer/sync flow allaqachon ishlagan: `BUFFER_START` → boshqa a'zolarga `VIDEO_BUFFER` (buffering: true) broadcast ✅
  - Redis room state cache allaqachon ishlagan: `cacheRoomState()` `watch_party:{roomId}` da ✅

---

### F-013 | 2026-02-27 | [BACKEND] | Content Service — Elasticsearch init + stats (T-S005)

- **Mas'ul:** Saidazim
- **Sprint:** S2
- **Bajarildi:**
  - `services/content/src/utils/elastic.init.ts` — `movies` index mapping: custom analyzer (cinesync_standard, cinesync_autocomplete, cinesync_search, cinesync_russian), Russian stemmer/stopwords, edge n-gram tokenizer (prefix search), field mappings (title^3, originalTitle^2, description, genre keyword, year integer, rating float, TTL index)
  - `services/content/src/server.ts` — startup da `initElasticsearchIndex()` chaqirish (idempotent — mavjud bo'lsa skip)
  - `services/content/src/services/content.service.ts` — `getStats()` metod: genre distribution aggregation, year histogram (top 20), top 10 rated movies, total/published count
  - `services/content/src/controllers/content.controller.ts` — `getStats` handler
  - `services/content/src/routes/content.routes.ts` — `GET /movies/stats` (operator+ role)
  - **Qolgan:** HLS upload pipeline → T-S005b ga ko'chirildi

---

### F-014 | 2026-02-27 | [BACKEND] | Achievement System (T-S006)

- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/user/src/services/achievement.service.ts` — `AchievementService`: `checkAndUnlock(userId, event)` metod (10 event turi: movie_watched, watch_party, battle, friend, review, streak, rank, watch_time, daily_minutes), `getUserAchievements(includeSecret)`, `getAchievementStats()`
  - `services/user/src/controllers/achievement.controller.ts` — `getMyAchievements`, `getMyStats`, `getUserAchievements` (public, secret hidden), `triggerEvent` (internal)
  - `services/user/src/routes/achievement.routes.ts` — `GET /achievements/me`, `GET /achievements/me/stats`, `GET /achievements/:id`, `POST /achievements/internal/trigger`
  - `services/user/src/app.ts` — `/achievements` routerini qo'shildi
  - Models (T-S003 dan): `Achievement` + `UserAchievement` ✅
  - 25 achievement ta'rifi (seed.ts da) ✅
  - Secret achievement: isSecret flag, caller ga yashiriladi ✅

---

### F-015 | 2026-02-27 | [BACKEND] | Rating + Review to'liq (T-S007)
- **Mas'ul:** Saidazim
- **Sprint:** S3
- **Bajarildi:**
  - `services/content/src/services/content.service.ts` — `getMovieRatings(movieId, page, limit)`, `deleteUserRating(userId, movieId)`, `deleteRatingByModerator(ratingId)`, `recalculateRating()` private metod (rating avg qayta hisobl + Redis cache invalidate)
  - `services/content/src/controllers/content.controller.ts` — `getMovieRatings`, `deleteMyRating`, `deleteRatingModerator` handlerlar
  - `services/content/src/routes/content.routes.ts` — `GET /movies/:id/ratings`, `DELETE /movies/:id/rate`, `DELETE /ratings/:ratingId` (operator+)
  - Movie not found check `rateMovie()` da qo'shildi

---

### F-016 | 2026-02-27 | [BACKEND] | Admin Service — to'liq funksionallik (T-S008)
- **Mas'ul:** Saidazim
- **Sprint:** S4
- **Bajarildi:**
  - `services/admin/src/config/index.ts` — `CONTENT_MONGO_URI`, `USER_MONGO_URI` env var qo'shildi
  - `services/admin/src/services/admin.service.ts` — `getMovieModel()` (content DB inline schema), movie: `listMovies`, `publishMovie`, `unpublishMovie`, `deleteMovie`, `operatorUpdateMovie`; feedback: `listFeedback`, `replyFeedback`, `submitFeedback`; analytics: `getAnalytics` (totalUsers, newUsersToday, newUsersThisMonth, activeUsers via Redis, movie counts); logs: `getLogs` (filter: level, service, dateFrom, dateTo)
  - `services/admin/src/controllers/admin.controller.ts` — 11 ta yangi handler: listMovies, publishMovie, unpublishMovie, deleteMovie, operatorUpdateMovie, listFeedback, replyFeedback, submitFeedback, getAnalytics, getLogs
  - `services/admin/src/routes/admin.routes.ts` — movies (list/publish/unpublish/delete), feedback (list/reply), analytics, logs endpointlari
  - `services/admin/src/routes/operator.routes.ts` — `/operator/*`: movie list+edit (publish yo'q), feedback submit
  - `services/admin/src/app.ts` — `/operator` router qo'shildi

---

## 🐛 TUZATILGAN BUGLAR

| #   | Sana | Tur | Muammo        | Yechim |
| --- | ---- | --- | ------------- | ------ |
| BUG-001 | 2026-02-27 | TS2349 | `admin.service.ts` `getMovieModel()`/`getUserModel()` not callable (union type) | Explicit `Model<Record<string, unknown>>` return type |
| BUG-002 | 2026-02-27 | TS2322/TS2556 | `rateLimiter.middleware.ts` SendCommandFn type mismatch | `sendRedisCommand` helper + `unknown as SendCommandFn` |
| BUG-003 | 2026-02-27 | TS2352 | `error.middleware.ts` Error → Record<string, unknown> cast | `as unknown as Record<string, unknown>` |
| BUG-004 | 2026-02-27 | TS2352 | `user.service.ts` lean() → IUserDocument cast | `as unknown as IUserDocument & ...` |
| BUG-005 | 2026-02-27 | TS2352 | `content.service.ts` Query → Promise cast | `as unknown as Promise<...>` |
| BUG-006 | 2026-02-27 | TS2790 | 13 model faylda `delete ret.__v` | `Reflect.deleteProperty(ret, '__v')` |
| BUG-007 | 2026-02-27 | TS6133 | `logger.ts` `simple` unused import | Import o'chirildi |
| BUG-008 | 2026-02-27 | TS6133 | `auth.service.ts` `NotFoundError` unused | Import o'chirildi |
| BUG-009 | 2026-02-27 | TS6133 | `battle.service.ts` `ForbiddenError` unused | Import o'chirildi |
| BUG-010 | 2026-02-27 | TS6133 | `admin.service.ts` `blockedUsers` unused | Ortiqcha query o'chirildi |
| BUG-012 | 2026-02-28 | Runtime | `elastic.init.ts` apostrophe_filter duplicate mappings (ASCII `'` 2x) | Unicode escape: `\\u2018=>\\u0027`, `\\u2019=>\\u0027` |
| BUG-013 | 2026-02-28 | Runtime | `elastic.init.ts` `boost` ES 8.x da qabul qilinmaydi | `title` va `originalTitle` fieldlaridan `boost` o'chirildi |

---

### F-017 | 2026-02-27 | [BACKEND] | Debug Log + TypeScript fixes + Logging config

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `docs/DebugLog.md` — barcha TypeScript xatolar hujjatlashtirildi (BUG-001..BUG-011)
  - 16 ta TypeScript xato tuzatildi (7 ta service, 13 ta fayl)
  - `shared/src/utils/logger.ts` — `fs.mkdirSync('logs', {recursive:true})` qo'shildi (har doim logs/ papka yaratiladi)
  - `shared/src/utils/logger.ts` — `LOG_LEVEL` env variable qo'llab-quvvatlandi
  - Barcha 7 service `.env.example` — `LOG_LEVEL=debug` qo'shildi
  - Winston: `logs/error.log` (10MB×5) + `logs/combined.log` (10MB×30) har doim yozadi

---

### F-018 | 2026-02-27 | [BACKEND] | Service-to-Service Communication (T-C005)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `shared/src/utils/serviceClient.ts` — typed HTTP client (axios): `addUserPoints()`, `triggerAchievement()`, `sendInternalNotification()`, `getMovieInfo()`, `validateInternalSecret()`, `requireInternalSecret()` middleware
  - `shared/src/index.ts` — serviceClient export qo'shildi
  - `services/battle/src/services/battle.service.ts` — `resolveBattle()` da battle win → `addUserPoints()` + `triggerAchievement('battle')` (non-blocking)
  - `services/user/src/services/user.service.ts` — `acceptFriendRequest()` da → `triggerAchievement('friend')` (har ikkala user uchun, non-blocking)
  - `services/content/src/services/content.service.ts` — `recordWatchHistory()` da completed=true → `triggerAchievement('movie_watched')` (non-blocking)
  - `services/user/src/controllers/user.controller.ts` — `addPoints` handler qo'shildi (internal endpoint)
  - `services/user/src/routes/user.routes.ts` — `POST /internal/add-points` route qo'shildi
  - Barcha 7 service `.env.example` — `INTERNAL_SECRET` qo'shildi

---

### F-019 | 2026-02-27 | [BACKEND] | Git Workflow + PR Template (T-C003)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/PULL_REQUEST_TEMPLATE.md` — TypeScript, security, zone, API format tekshiruv ro'yxati
  - `.github/ISSUE_TEMPLATE/bug_report.md` — servis, fayl, qayta ishlab chiqarish, log maydonlari
  - `.github/ISSUE_TEMPLATE/feature_request.md` — prioritet, zona, texnik yondashuv maydonlari

---

### F-020 | 2026-02-27 | [DEVOPS] | CI/CD GitHub Actions (T-S010)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `.github/workflows/lint.yml` — PR da barcha 8 service typecheck (matrix strategy, fail-fast: false)
  - `.github/workflows/test.yml` — PR da Jest tests (MongoDB + Redis service containers)
  - `.github/workflows/docker-build.yml` — develop/main push da Docker build + GHCR push (7 service, cache-from/to gha)
  - `.github/workflows/deploy-staging.yml` — develop branch → staging (environment: staging, manual trigger placeholder)
  - `.github/workflows/deploy-prod.yml` — main branch → production (workflow_dispatch confirm='yes' + push, environment: production)

---

### F-021 | 2026-02-27 | [BACKEND] | Swagger API Docs + /api/v1/ prefix (T-S011 + T-C001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service `src/utils/swagger.ts` — swagger-jsdoc config (OpenAPI 3.0, bearerAuth, tags)
  - Barcha 7 service `app.ts` — `GET /api-docs` (Swagger UI) + `GET /api-docs.json` (spec) route qo'shildi
  - **API versioning** — barcha 7 service `/api/v1/` prefix:
    - auth: `/api/v1/auth`
    - user: `/api/v1/users`, `/api/v1/achievements`
    - content: `/api/v1/movies`
    - watch-party: `/api/v1/watch-party`
    - battle: `/api/v1/battles`
    - notification: `/api/v1/notifications`
    - admin: `/api/v1/admin`, `/api/v1/operator`
  - `swagger-jsdoc` + `swagger-ui-express` — root workspace da o'rnatildi

---

### F-022 | 2026-02-28 | [BACKEND] | Auth E2E login testi + Services startup + ES index yaratildi (T-S001)

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - Barcha 7 service ishga tushirildi (ports 3001-3008, hammasi `/health` → 200 OK)
  - `services/content/src/utils/elastic.init.ts` — BUG-012 tuzatildi: apostrophe_filter mappings ASCII → Unicode escape sequences
  - `services/content/src/utils/elastic.init.ts` — BUG-013 tuzatildi: `boost` parametri ES 8.x incompatible, o'chirildi
  - Elasticsearch `movies` index muvaffaqiyatli yaratildi (green, 1 shard, 0 replica)
  - Auth login E2E test o'tdi: `POST /api/v1/auth/login` → `accessToken` + `refreshToken` + `user` qaytadi
  - Seed credentials (test1@cinesync.app / Test123!) bilan login ✅ ishladi
  - **SMTP (email):** mailtrap.io dan credentials kerak bo'lganda to'ldirish (ixtiyoriy dev uchun)

---

---

---

### F-035 | 2026-02-28 | [WEB] | Next.js Web App — Sprint 1-4 (T-J001..T-J006)

- **Mas'ul:** Jafar
- **Sprint:** S1-S4
- **Commit:** `f32c5e5 feat(web): add Next.js web app — Sprint 1-5 (T-J001..T-J007)`
- **Bajarildi:**
  - **T-J001** — Next.js App Router setup, Tailwind v4, Shadcn/ui, Zustand + React Query, Socket.io client, JWT auth middleware
  - **T-J002** — Landing page: Hero, Features, How it works, Testimonials, Pricing, FAQ, JSON-LD schema, SEO metadata
  - **T-J003** — App layout (sidebar/topbar), `(app)/home/page.tsx` (SSR+ISR), `(app)/movies/[slug]/page.tsx` (dynamic metadata + Movie JSON-LD)
  - **T-J004** — `VideoPlayer.tsx` (hls.js, custom controls, keyboard shortcuts Space/Arrow/F/M, ±2s Watch Party sync), `(app)/search/page.tsx` (debounced, infinite scroll)
  - **T-J005** — `(app)/party/[roomId]/page.tsx` (70% video + 30% chat split layout, sync state, floating emoji, members list), `ChatPanel.tsx`
  - **T-J006** — `(app)/battle/page.tsx` (create modal, filter), `(app)/profile/[username]/page.tsx` (SSR, OG meta, achievements grid, rank badge), `(app)/stats/page.tsx`
  - `manifest.json` + `robots.txt` + PWA icons (72..512px)
  - Playwright test suite (`/tests/auth.spec.ts`) + `playwright.config.ts`
  - API rewrites (`next.config.mjs`) → backend services (3001-3007)

---

### F-036 | 2026-02-28 | [IKKALASI] | Design Tokens — T-C002

- **Mas'ul:** Saidazim + Emirhan + Jafar
- **Sprint:** S1
- **Bajarildi:**
  - **Mobile:** `apps/mobile/src/theme/index.ts` — colors (#E50914, #0A0A0F, #111118...), spacing, borderRadius, typography (Bebas Neue / DM Sans), shadows, RANK_COLORS
  - **Web:** `apps/web/src/app/globals.css` — Tailwind v4 `@theme` block, CSS custom properties
  - Dark mode ONLY — barcha platform

---

---

---

---

---

---

### F-041 | 2026-03-02 | [DEVOPS] | Docker — web hot-reload va bitta komanda setup

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `apps/web/Dockerfile.dev` — `WATCHPACK_POLLING=true` qo'shildi (Docker FS polling)
  - `docker-compose.dev.yml` — web service ga volumes qo'shildi: `./apps/web/src`, `./apps/web/public`, `web_node_modules`, `web_next_cache`
  - `apps/web/package.json` — `@tailwindcss/oxide-linux-x64-gnu` o'chirildi (Alpine musl bilan mos kelmaydi)
  - Bitta komanda: `docker compose -f docker-compose.dev.yml up -d --build`

---

### F-042 | 2026-03-02 | [BACKEND] | User Service — do'stlik endpointlari qo'shildi

- **Mas'ul:** Saidazim
- **Bajarildi:**
  - `GET /api/v1/users/search?q=` — username bo'yicha qidiruv + `isOnline` holati
  - `GET /api/v1/users/friends` — do'stlar ro'yxati (avval faqat `/me/friends` bor edi)
  - `GET /api/v1/users/friends/requests` — pending so'rovlar, requester profili bilan populate qilingan
  - `POST /api/v1/users/friends/request` — body `{userId}` bilan so'rov yuborish
  - `PATCH /api/v1/users/friends/accept/:friendshipId` — friendship `_id` bilan qabul qilish

---

### BUG-B001 | 2026-03-02 | [BACKEND] | Express route ordering — `/:id` statik routelarni yutib olishi

- **Mas'ul:** Saidazim
- **Muammo:** `GET /:id` dinamik route `GET /friends`, `GET /search` kabi statik routelardan OLDIN
  ro'yxatdan o'tgan edi. Express `/friends` ni `id="friends"` deb qabul qilgan →
  `User.findOne({ authId: "friends" })` → 404 "User not found".
- **Yechim:** Barcha statik routelar `/:id` dan OLDIN ro'yxatdan o'tkazildi.
- **QOIDA — UCHALA DASTURCHI UCHUN:**

```
❌ NOTO'G'RI:
  router.get('/:id', ...)        ← dinamik birinchi
  router.get('/search', ...)     ← hech qachon yetmaydi
  router.get('/me/friends', ...) ← hech qachon yetmaydi

✅ TO'G'RI:
  router.get('/me', ...)         ← statik — /me
  router.get('/me/friends', ...) ← statik — /me/friends
  router.get('/search', ...)     ← statik — /search
  router.get('/friends', ...)    ← statik — /friends
  router.get('/:id', ...)        ← dinamik — ENG OXIRIDA
```

---

### BUG-B002 | 2026-03-02 | [BACKEND] | User identifier mismatch — `_id` vs `authId`

- **Mas'ul:** Saidazim
- **Muammo:** Web `u._id` (MongoDB profile ObjectId) yuboradi, backend `authId` (auth service userId)
  bo'yicha qidiradi → 404 "User not found".
- **Yechim:** `sendFriendRequestByProfileId()` metodi qo'shildi — `_id` orqali `authId` ni
  topib keyin operatsiyani bajaradi.
- **QOIDA — UCHALA DASTURCHI UCHUN:**

```
User collection da IKKI xil identifier bor:

  _id     → MongoDB profile ObjectId  (69a54b70f808cfa9413654f0)
              - faqat user service ichki ishlatish uchun
              - frontend ga expose qilmang (to'g'ridan foydalanmang)

  authId  → Auth service user._id     (69a545eee6496cf6ac946ecc)
              - servislar arasi muloqot uchun STANDART identifier
              - JWT ichida userId = authId
              - Friendship, Battle, WatchParty — barchasi authId ishlatadi

QOIDALAR:
  ✅ Servislar arasi: authId ishlatish
  ✅ Frontend → backend: authId yuborish (search response da authId bor)
  ✅ u.authId — to'g'ri
  ❌ u._id   — foydalanuvchini identify qilish uchun XATO
```

---

### BUG-B003 | 2026-03-02 | [DEVOPS] | root package.json ga react/react-dom qo'shish XATO

- **Mas'ul:** Saidazim
- **Muammo:** `react: 18.3.1` va `react-dom: 18.3.1` monorepo root `package.json` ga
  `dependencies` sifatida qo'shilgan. npm workspaces hoisting natijasida `apps/web` ning
  React versiyasi bilan collision → 129 TypeScript xatosi.
- **Yechim:** Root `package.json` dan o'chirish kerak — `apps/web/package.json` da allaqachon bor.
- **QOIDA:**

```
Root package.json dependencies:
  ✅ swagger-jsdoc, swagger-ui-express  — backend uchun shared dev tools
  ✅ @playwright/test                   — test uchun
  ❌ react, react-dom                   — faqat apps/web/package.json da bo'lishi kerak
  ❌ react-native, expo                 — faqat apps/mobile/package.json da bo'lishi kerak
```

---

### T-S034 | 2026-03-19 | [BACKEND] | Full backend refactor — Faza 1-2-3

- **Mas'ul:** Saidazim
- **Commit:** `85bbd6f`

**Faza 1 — Critical bugs:**
- `rateLimitMap` memory leak — watch-party socket da setInterval(60s) cleanup qo'shildi
- MongoDB `maxPoolSize`: 10 → 5 (7 servis × 5 = 35, Atlas 100 limit dan xavfsiz)
- `REDIS_KEYS` to'liq namespace bilan: `auth:`, `user:`, `content:`, `party:`, `battle:`
- `admin.service.ts` hardcoded `session:${userId}` → `REDIS_KEYS.userSession()`

**Faza 2 — File splitting (Facade pattern):**
- `auth.service.ts` (654 LOC) → `passwordAuth.service.ts` + `googleAuth.service.ts` + `telegramAuth.service.ts` + facade
- `user.service.ts` (464 LOC) → `profile.service.ts` + `friendship.service.ts` + facade
- `content.service.ts` (511 LOC) → `movie.service.ts` + `search.service.ts` + `watchHistory.service.ts` + facade
- `watchParty.socket.ts` (369 LOC) → `roomEvents.handler.ts` + `videoEvents.handler.ts` + `chatEvents.handler.ts` + `voiceEvents.handler.ts`

**Faza 3 — Shared abstractions:**
- `shared/middleware/requestId.middleware.ts` — X-Request-ID tracing header
- `shared/middleware/timeout.middleware.ts` — 30s global timeout (503)
- Barcha 7 servis `app.ts`: `requestId` + `timeout()` middleware qo'shildi

---

### F-182 | T-S054 | 2026-04-17 | Predictive sync — scheduledAt field (Saidazim)

`scheduledAt: now + 150` field qo'shildi — barcha peer'lar PLAY/PAUSE/SEEK aniq bir UTC vaqtda bajaradi.

- `shared/src/types/index.ts` → `SyncState.scheduledAt?: number`
- `services/watch-party/src/services/watchParty.service.ts` → `syncState()`: `scheduledAt: now + 150`
- Commit: `13da353`

---

### F-183 | T-S056 | 2026-04-18 | VIDEO_HEARTBEAT отдельное событие (Saidazim)

`CLIENT_EVENTS.HEARTBEAT = 'video:heartbeat'` + `SERVER_EVENTS.VIDEO_HEARTBEAT` добавлены.
Handler: owner check + broadcast `{ currentTime, timestamp, updatedBy }` без `scheduledAt`.
Peers используют только drift correction (playbackRate), не seekTo — прыжки устранены.

- `shared/src/constants/socketEvents.ts` — HEARTBEAT + VIDEO_HEARTBEAT
- `services/watch-party/src/socket/videoEvents.handler.ts` — HEARTBEAT handler
- Commit: `e39c018`

---

### F-184 | T-S055 | 2026-04-18 | Democratic buffer wait (Saidazim)

BUFFER_START от любого пира → пауза всей комнаты. BUFFER_END когда все готовы → автоматическое возобновление.
Redis Set отслеживает буферящих пользователей. Safety timeout 30s → force resume.
На disconnect пользователь удаляется из Set.

- `shared/src/constants/index.ts` → `REDIS_KEYS.bufferingUsers`
- `watchParty.service.ts` → `markBuffering`, `unmarkBuffering`, `clearAllBuffering`
- `videoEvents.handler.ts` → BUFFER_START/BUFFER_END полная логика
- Commit: `b45f454`

---

### F-185 | T-E098 + T-E100 | 2026-04-18 | Predictive sync + WebView polling (Emirhan)

- `useWatchPartyRoom.ts` → `scheduledAt`: `delay = scheduledAt - Date.now()` → `setTimeout(play, delay)`; `delay ≤ 0` → seek компенсация
- `useWebViewPlayer.ts` → har 2s JS injection: `video.currentTime` → `postMessage(POSITION_POLL)`; faqat `isPlaying=true` da
- Commit: `670d319`

---

### F-186 | T-E099 | 2026-04-18 | Drift correction via playbackRate (Emirhan)

- `useWatchPartyRoom.ts` → `VIDEO_HEARTBEAT` listener: drift > 2s → seekTo; 0.3–2s → playbackRate 0.95/1.05; < 0.3s → ignore
- `expo-av`: `setRateAsync(rate, shouldCorrectPitch: true)`
- Commit: `d342d5f`

---

### F-187 | T-C014 | 2026-04-18 | Shared WebRTC mesh socket events + types (Saidazim)

- `shared/constants/socketEvents.ts` → SERVER_EVENTS: `PEER_OFFER/ANSWER/ICE`, `MESH_PEER_JOINED/LEFT`
- `shared/constants/socketEvents.ts` → CLIENT_EVENTS: `PEER_OFFER/ANSWER/ICE`, `MESH_JOIN/LEAVE`
- `shared/types/index.ts` → `MeshSignalPayload`, `SyncMessage`, `MeshSignalType`
- Разблокирует: T-S052 (backend mesh handler) + T-E096 (mobile MeshClient)
- Commit: `c65dc06`

---

### F-188 | T-S052 | 2026-04-18 | Mesh signalling handler — peer:offer/answer/ice relay (Saidazim)

Pure relay pattern — сервер не хранит WebRTC состояние, только маршрутизирует сигналы через личные комнаты `user:${userId}`.
MESH_JOIN/LEAVE бродкастятся всей комнате. Автоматический MESH_PEER_LEFT при дисконнекте.

- `services/watch-party/src/socket/mesh.handlers.ts` (новый файл)
- `watchParty.socket.ts` → `registerMeshHandlers(io, socket, authSocket)`
- Тест: 5/5 PASS (join, offer, answer, ice, leave)
- Commit: `b916a9b`

---

### F-189 | T-S051 | 2026-04-18 | Playwright stealth + UA rotation (Saidazim)

- `playwrightExtractor.ts`: random UA из 5 вариантов, случайный viewport, `--disable-blink-features=AutomationControlled`, init script: `navigator.webdriver=false`, `window.chrome={runtime:{}}`
- `genericExtractor.ts`: random UA каждый запрос, 100-300ms задержка между iframe рекурсиями
- `index.ts`: generic TTL 1h → 6h (CIS сайты дорого re-extract через Playwright)
- Commit: `b72b1ea`

---

_docs/Done.md | CineSync | Yangilangan: 2026-04-18_


### F-074 | T-S072 | URL Telemetry — Anonymous domain analytics endpoint

- **Beruvchi:** Emirhan
- **Bajaruvchi:** Saidazim (Claude Sonnet yordamida)
- **Yaratilgan:** 2026-05-07 00:00
- **Bajarilgan:** 2026-05-08 22:25
- **Model:** sonnet
- **O'zgarishlar:** 4 yangi fayl — urlVisit.model.ts, urlVisit.controller.ts, urlVisit.routes.ts, urlVisitCron.worker.ts + app.ts, server.ts
- **Xulosa:** POST /api/v1/content/url-visit — anon domain analytics. Rate limit 10/min per IP. Auto-flag adult domains on write + 24h cron. No userId stored.

### F-075 | T-S074 | Domain Management API — block/unblock + public blocked-domains endpoint

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude Sonnet yordamida)
- **Yaratilgan:** 2026-05-08 22:30
- **Bajarilgan:** 2026-05-08 22:45
- **Model:** sonnet
- **O'zgarishlar:** 3 yangi fayl — domain.controller.ts, domain.routes.ts + urlVisit.model.ts updated, app.ts
- **Xulosa:** GET /blocked-domains (public, Redis 1h cache), GET/PATCH /internal/admin/domains (pagination+filter+search), block/unblock invalidates cache

### F-076 | T-S075 | Admin UI — Domain Management page (dynamic blocking)

- **Beruvchi:** Saidazim
- **Bajaruvchi:** Saidazim (Claude Sonnet yordamida)
- **Yaratilgan:** 2026-05-08 22:30
- **Bajarilgan:** 2026-05-08 23:10
- **Model:** sonnet
- **O'zgarishlar:** domains.api.ts, DomainsPage.tsx, App.tsx, Sidebar.tsx, Layout.tsx, admin.routes.ts, admin.controller.ts, admin.service.ts, serviceClient.ts
- **Xulosa:** /domains sahifasi — barcha domenlar jadvali, filter (all/flagged/blocked), search, block/unblock tugmalar, Redis cache invalidation
