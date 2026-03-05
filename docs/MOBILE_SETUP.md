# CineSync Mobile — Setup Guide
# Yangi PC dan git clone qilgandan keyin ishga tushirish

---

## Muhim tushuncha: Qanday ishlaydi?

### Expo Bare Workflow nima?

CineSync **Expo Bare Workflow** da yozilgan. Bu 2 ta qatlam demak:

```
┌─────────────────────────────────────┐
│  JavaScript (React Native kodi)     │  ← Metro Bundler orqali (localhost:8081)
│  screens/, components/, store/ ...  │  ← Hot Reload — o'zgarish INSTANT ko'rinadi
├─────────────────────────────────────┤
│  Native Shell (Android APK)         │  ← Bir marta build qilinadi
│  Firebase, MMKV, Reanimated ...     │  ← Java/Kotlin native modullar
└─────────────────────────────────────┘
```

**Nima uchun APK build kerak?**
Bu loyihada `react-native-mmkv`, `Firebase`, `react-native-reanimated`,
`react-native-gesture-handler` kabi **native (Java/Kotlin) kodli** paketlar bor.
Expo Go bu kodlarni bilmaydi → ishlamaydi.
Shuning uchun bir marta native shell (APK) build qilish kerak.

> ⚠️ **Expo Go ishlamaydi** — u faqat pure-JS loyihalar uchun

**APK bir marta kerak, keyin emas:**
1. Bir marta `expo run:android` → APK build → emulatorga install
2. Keyingi safar faqat `npx expo start` → Metro → JS o'zgarishlar **instant** (hot reload)
3. Native kod o'zgarmasa (yangi native paket qo'shilmasa) → qayta build YO'Q

**APK qayerga tushadi?**
```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```
`expo run:android` uni avtomatik `adb install` orqali emulatorga o'rnatadi.
Siz hech narsa qilmaysiz — app o'zi ochiladi.

---

## Talablar

| Tool | Versiya | Tekshirish | Nima uchun |
|------|---------|------------|-----------|
| Node.js | >= 18.18 | `node --version` | Metro Bundler, Expo CLI |
| npm | >= 10.0 | `npm --version` | Package manager |
| Java JDK | 17 | `java --version` | Gradle (Android build) |
| Android Studio | Yangi | — | Android SDK + Emulator |
| Android SDK | API 33+ | Android Studio orqali | APK kompilyatsiya |

---

## 1-qadam: Clone va install

```bash
git clone https://github.com/AI-automatization/Rave.git
cd Rave
```

### MUHIM: apps/package.json yaratish

Bu fayl **git da yo'q** (`.gitignore` da), lekin Expo CLI uchun majburiy:

```bash
echo '{"name":"cinesync-apps","private":true}' > apps/package.json
```

**Nima uchun kerak?**
Expo CLI monorepo da har bir `apps/` papkasida `package.json` borligini tekshiradi.
Bu fayl bo'lmasa quyidagi xato chiqadi:
```
ConfigError: The expected package.json path: C:\...\apps\package.json does not exist
```

### npm install — ROOT DAN (MUHIM!)

```bash
# Rave/ papkasida turib (apps/mobile/ DAN EMAS!):
npm install

# Agar peer-dep xatosi bo'lsa:
npm install --legacy-peer-deps
```

**Nima uchun root dan?**
Root `package.json` da barcha `metro-*` paketlar `~0.82.0` da pin qilingan.
`apps/mobile/` dan install qilsang, metro@0.83.x o'rnatiladi → bundler ishlamaydi.

```
# Root npm install nima qiladi:
Rave/node_modules/
  metro@0.82.5          ← @expo/cli kutgan versiya
  metro-core@0.82.5     ← 0.83.x da API o'zgargan, ishlamaydi
  react-native@0.79.6   ← overrides orqali force qilingan
  ...barcha paketlar
```

---

## 2-qadam: TypeScript tekshirish

```bash
cd apps/mobile
npm run typecheck
# → Found 0 errors bo'lishi kerak
```

**Nima uchun?**
Kodda type xato bo'lsa, build jarayonida vaqt yo'qotiladi.
Avval tekshirib, tozalab olish tezroq.

---

## 3-qadam: Metro Bundler ishga tushirish

```bash
cd apps/mobile
npx expo start
```

**Metro nima qiladi?**
JavaScript fayllarni bundle qiladi va `localhost:8081` da serve qiladi.
Emulator/qurilmadagi native app shu serverga ulanadi.

Muvaffaqiyatli bo'lganda:
```
Starting Metro Bundler
Waiting on http://localhost:8081
Logs for your project will appear below.
```

Cache muammo bo'lsa:
```bash
npx expo start --clear
```

> Bu terminal **ochiq turishi kerak** — Metro yopilsa app ishlamaydi.

---

## 4-qadam: Android APK build va install (birinchi marta)

### Emulator ishga tushirish
Android Studio → Device Manager → ▶ Play tugmasi

```bash
# Emulator ulanganimikni tekshir:
adb devices
# → emulator-5554   device   bo'lishi kerak
```

### Build va install

```bash
cd apps/mobile
npx expo run:android
```

**Nima bo'ladi (ketma-ket):**

| Etap | Vaqt | Nima qiladi |
|------|------|-------------|
| Gradle setup | ~1 min | Gradle yuklab oladi, konfiguratsiya |
| React Native compile | ~5-10 min | Java/Kotlin native modullar kompilyatsiya |
| APK yig'ish | ~2 min | `app-debug.apk` yaratiladi |
| adb install | ~30 soniya | APK emulatorga o'rnatiladi |
| App launch | ~10 soniya | App ochiladi, Metro ga ulanadi |
| **Jami (birinchi marta)** | **~10-15 min** | |
| **Keyingi safar** | **~1-2 min** | Faqat o'zgargan fayl rebuild |

**APK manzili:**
```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

> Keyingi safar faqat `npx expo start` — APK qayta build bo'lmaydi,
> JS o'zgarishlar hot reload orqali instant ko'rinadi.

---

## 5-qadam: Keyingi safar (kunlik ishlatish)

```bash
# 1. Emulatorni ishga tushir (Android Studio)

# 2. Metro start:
cd apps/mobile
npx expo start

# 3. Emulatorda app avtomatik ochiladi
# Kod o'zgartirsang → app hot reload qiladi (qayta build yo'q)
```

---

## Real qurilma (USB)

```bash
# Qurilmada: Settings → Developer Options → USB Debugging → ON
adb devices   # qurilma ko'rinishini tekshir
npx expo run:android
```

**Muhim:** Real qurilmada `API_BASE_URL` localhost bo'lmaydi:
```env
# .env faylda (apps/mobile/.env):
API_BASE_URL=http://192.168.x.x:3001   # Wi-Fi IP (ipconfig orqali top)
```

---

## iOS (faqat macOS)

```bash
npx expo run:ios
```

Windows da iOS run qilib bo'lmaydi — macOS + Xcode kerak.

---

## Environment (.env)

`apps/mobile/` papkasida `.env` fayl (Saidazim dan URL so'rash):

```env
# Android emulator uchun (10.0.2.2 = PC ning localhost):
API_BASE_URL=http://10.0.2.2:3001

# iOS simulator uchun:
# API_BASE_URL=http://localhost:3001

# Real qurilma uchun (Wi-Fi, ipconfig orqali top):
# API_BASE_URL=http://192.168.x.x:3001
```

### Firebase fayllar (Saidazim dan olish)

```
google-services.json       → apps/mobile/android/app/google-services.json
GoogleService-Info.plist   → apps/mobile/ios/GoogleService-Info.plist
```

Bu fayllar **git da yo'q** (`.gitignore`) — secret kalitlar bor.

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|------|-------|--------|
| `ConfigError: apps/package.json does not exist` | Git da yo'q fayl | `echo '{"name":"cinesync-apps","private":true}' > apps/package.json` |
| `TypeError: Cannot read properties of undefined (reading 'push')` | `metro-core@0.83.x` da API o'zgargan | `cd Rave && npm install` (root dan) |
| `Metro bundler version mismatch` | `metro-*` versiyalar aralash | Root `package.json` da barcha `metro-*: ~0.82.0` tekshir |
| `@react-native/gradle-plugin does not exist` | npm workspace hoisting muammo | `cd Rave && npm install` (root dan) |
| `TypeScript errors (50+)` | `@types/react` dual version | Root dan `npm install` |
| `EADDRINUSE: port 8081` | Metro allaqachon ishlamoqda | `npx expo start --port 8082` yoki eski Metro o'chir |
| `Module not found` runtime | Metro cache eskirgan | `npx expo start --clear` |
| `Invariant Violation: "main" not registered` | `index.js` muammo | `index.js` da `registerRootComponent(App)` borligini tekshir |
| `Expo Go ishlamaydi` | Bare Workflow — native kod bor | `expo run:android` (native build kerak) |

---

## Muhim fayllar

```
Rave/
├── package.json              ← metro-* ~0.82.0 pin | overrides: react-native 0.79.6
│                               (root dan npm install — shu fayl boshqaradi)
├── apps/
│   ├── package.json          ← YARATISH KERAK: git da yo'q!
│   └── mobile/
│       ├── package.json      ← react-native 0.79.6 | expo ~53.0.0
│       ├── tsconfig.json     ← extends expo/tsconfig.base
│       ├── babel.config.js   ← @app-types alias (@types emas!)
│       ├── metro.config.js   ← monorepo shared/ + lottie extension
│       ├── app.json          ← expo slug, bundleId, plugins
│       ├── index.js          ← registerRootComponent(App)
│       ├── eas.json          ← YARATISH KERAK: git da yo'q (EAS Build uchun)
│       └── android/
│           └── app/build/outputs/apk/debug/
│               └── app-debug.apk   ← build dan keyin shu yerda
```

---

## Path aliases

```typescript
import { Button }    from '@components/Button';
import { useAuth }   from '@hooks/useAuth';
import { apiClient } from '@api/client';
import { useStore }  from '@store/authStore';
import { colors }    from '@theme/colors';
import type { Movie} from '@app-types/movie';   // ← @types EMAS, @app-types!
import { formatDate} from '@shared/utils/date';
```

---

## Texnologiyalar

| Texnologiya | Versiya | Nima uchun ishlatiladi |
|-------------|---------|----------------------|
| React Native | 0.79.6 | Native app framework (Expo 53 bilan mos) |
| Expo SDK | ~53 | Bare workflow tooling, EAS Build |
| TypeScript | ~5.8 | Type safety, xatoliklarni oldindan topish |
| Zustand | ^5 | Global state (auth, user ma'lumotlari) |
| TanStack Query | ^5 | Server state, caching, refetch |
| Axios | ^1 | HTTP so'rovlar (backend API) |
| Socket.io-client | ^4 | Real-time (WatchParty sinxron, Battle) |
| React Navigation | ^7 | Ekranlar orasida o'tish |
| expo-image | ~2.4 | Optimallashtirilgan rasm yuklash |
| expo-linear-gradient | ~14.1 | Gradient UI (banner, kartalar) |
| react-native-reanimated | ~3.17 | Silliq animatsiyalar |
| react-native-mmkv | ^4 | Tez lokal storage (token saqlash) |
| Firebase (@react-native-firebase) | ^23 | Push notification (FCM) |
| react-native-gesture-handler | ~2.24 | Swipe, drag gesture |

---

*docs/MOBILE_SETUP.md | CineSync | Emirhan | 2026-03-06*
