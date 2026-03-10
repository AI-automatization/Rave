# CineSync Mobile — Setup Guide
# Expo SDK 54 · React Native 0.81.5 · TypeScript · Expo Go
# Yangi PC dan git clone qilgandan keyin ishga tushirish

---

## Muhim tushuncha: Qanday ishlaydi?

### Expo Go Workflow (Managed)

CineSync mobile **Expo Go (Managed Workflow)** da ishlatiladi:

```
┌─────────────────────────────────────────┐
│  JavaScript (React Native kodi)         │  ← Metro Bundler (localhost:8081)
│  screens/, components/, store/, ...     │  ← Hot Reload — o'zgarish INSTANT
├─────────────────────────────────────────┤
│  Expo Go App (telefon/emulator)         │  ← App Store / Play Store dan yuklab
│  Barcha Expo SDK modullari ichida       │  ← expo-av, expo-image, expo-notifications ...
└─────────────────────────────────────────┘
```

**Afzallik:**
- APK build kerak emas — faqat `npx expo start` + QR scan
- Hot Reload — kod o'zgarishi 1-2 sekundda telefonida ko'rinadi
- Barcha Expo SDK paketlari Expo Go ichida tayyor

**Monorepo muammosi (MUHIM — hal qilingan):**
Root `node_modules/` va `apps/mobile/node_modules/` da `react`, `react-native`,
`react-native-reanimated` ning 2 ta nusxasi paydo bo'lib app crash qilardi.
`metro.config.js` da `extraNodeModules` orqali **deduplication** qilingan — endi ishlamaydi.

> ❌ Eski Bare Workflow (`expo run:android`, APK build) — ishlatilmaydi
> ✅ Expo Go — `npx expo start` + QR scan

---

## Talablar

| Tool | Versiya | Tekshirish | Nima uchun |
|------|---------|------------|-----------|
| Node.js | >= 20.0.0 | `node --version` | Metro Bundler, Expo CLI |
| npm | >= 10.0 | `npm --version` | Package manager |
| Expo Go | SDK 54 | App Store / Play Store | Telefon/emulatorga app o'rnatish |
| Android Studio | Ixtiyoriy | — | Emulator ishlatmoqchi bo'lsang |

> iOS uchun macOS + Xcode kerak emas — Expo Go iPhone da ham ishlaydi

---

## 1-qadam: Clone va install

```bash
git clone https://github.com/AI-automatization/Rave.git
cd Rave
```

### ROOT dan npm install (MAJBURIY)

```bash
# Rave/ papkasida turib (apps/mobile/ DAN EMAS!):
npm install

# Agar peer-dep xatosi:
npm install --legacy-peer-deps
```

**Nima uchun root dan?**
Root `package.json` npm workspaces ni boshqaradi:
```
"workspaces": ["services/*", "apps/*", "shared"]
```
Root dan install qilsang `apps/mobile/node_modules/` ham to'g'ri sozlanadi.
`apps/mobile/` dan install qilsang — Metro deduplication ishlarmaydi → crash.

```
# Root npm install nima qiladi:
Rave/node_modules/
  react@19.1.0              ← asosiy nusxa
  react-native@0.81.5       ← asosiy nusxa
  ...barcha workspace paketlar

apps/mobile/node_modules/
  react-native-reanimated   ← mobile-specific (deduplication orqali boshqariladi)
  zustand                   ← mobile-specific
  ...
```

---

## 2-qadam: Environment (.env)

`apps/mobile/` papkasida `.env` fayl yaratish (git da yo'q):

```env
# Android emulator uchun (10.0.2.2 = PC ning localhost):
API_BASE_URL=http://10.0.2.2:3001

# Real qurilma uchun (Wi-Fi IP, ipconfig orqali top):
# API_BASE_URL=http://192.168.x.x:3001

# iOS Simulator uchun:
# API_BASE_URL=http://localhost:3001

# Socket.io:
SOCKET_URL=http://10.0.2.2:3004
```

> URL larni Saidazim dan so'rash (backend portlar: Auth 3001, Socket 3004)

---

## 3-qadam: TypeScript tekshirish

```bash
cd apps/mobile
npm run typecheck
# → Found 0 errors bo'lishi kerak
```

Xato chiqsa — task boshlashdan avval tuzatish kerak.

---

## 4-qadam: Metro Bundler ishga tushirish

```bash
cd apps/mobile
npx expo start
```

Muvaffaqiyatli bo'lganda:
```
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀█ █◀  ← QR kod
█ █   █ █▀▀▀ ▀
█ █▄▄▄█ █▀▄█▄█
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
Metro waiting on exp://192.168.x.x:8081
```

Cache muammo bo'lsa:
```bash
npx expo start --clear
```

Tunnel orqali (Wi-Fi muammo bo'lsa):
```bash
npx expo start --tunnel
```

> Bu terminal **ochiq turishi kerak** — Metro yopilsa app ishlamaydi.

---

## 5-qadam: Expo Go bilan ulash

### Variant A — Telefon (tavsiya etiladi)

1. Telefoningizga **Expo Go** yuklab oling:
   - Android: [Play Store → "Expo Go"](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store → "Expo Go"](https://apps.apple.com/app/expo-go/id982107779)
2. Expo Go ni oching → **Scan QR Code**
3. Metro terminalida ko'rsatilgan QR kodni scan qiling
4. App ochiladi ✅

> Telefon va PC **bitta Wi-Fi** da bo'lishi kerak

### Variant B — Android Emulator

```bash
# Android Studio → Device Manager → ▶ (play) tugmasi
# Emulator ishga tushgach:
npx expo start
# → "a" tugmachasini bos (emulatorga ochish)
```

### Variant C — iOS Simulator (faqat macOS)

```bash
npx expo start
# → "i" tugmachasini bos
```

---

## 6-qadam: Kunlik ishlatish

```bash
# Har kuni boshida:
git pull origin main
cd apps/mobile
npx expo start

# Telefon/emulator — Expo Go da app avtomatik yangilanadi
# Kod o'zgartirish → Hot Reload (1-2 soniya)
```

---

## Monorepo: Metro Deduplication (muhim)

`metro.config.js` da quyidagi paketlar **bitta nusxaga** majburlangan:

```javascript
config.resolver.extraNodeModules = {
  'react':                    path.resolve(projectRoot, 'node_modules/react'),
  'react-native':             path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-reanimated':  path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
  'react-native-gesture-handler': path.resolve(projectRoot, 'node_modules/react-native-gesture-handler'),
  'zustand':                  path.resolve(projectRoot, 'node_modules/zustand'),
  '@tanstack/react-query':    path.resolve(projectRoot, 'node_modules/@tanstack/react-query'),
};
```

**Bu nima uchun kerak?**
Monorepo da har bir workspace o'z `node_modules/` ini yuklashi mumkin.
Agar `react` 2 joyda bo'lsa:
```
TypeError: Cannot read properties of undefined (reading 'push')
Invariant Violation: Hooks can only be called inside a function component
```
`extraNodeModules` bu xatolarni bartaraf qiladi.

> ⚠️ Yangi paket qo'shsang — `apps/mobile/` dan install qil, root dan emas.

---

## Path Aliases

```typescript
import { HomeScreen }   from '@screens/home/HomeScreen';
import { MovieCard }    from '@components/movie/MovieCard';
import { moviesApi }    from '@api/content.api';
import { useAuthStore } from '@store/auth.store';
import { connectSocket } from '@socket/client';
import { colors }       from '@theme/index';
import { formatDate }   from '@utils/date';
import type { IMovie }  from '@app-types/index';   // ← @types EMAS, @app-types!
import { AppNavigator } from '@navigation/AppNavigator';
import { useHomeData }  from '@hooks/useHomeData';
import type { IUser }   from '@shared/types/user';  // ← shared/ dan
```

`tsconfig.json` va `babel.config.js` da sozlangan — to'g'ridan import qilish mumkin.

---

## Texnologiyalar

| Texnologiya | Versiya | Nima uchun ishlatiladi |
|-------------|---------|----------------------|
| Expo SDK | ~54.0.0 | Managed workflow tooling, Expo Go |
| React Native | 0.81.5 | Native app framework |
| React | 19.1.0 | UI library |
| TypeScript | ~5.9.2 | Type safety, strict mode |
| Zustand | ^5.0.3 | Global state (auth, movies, friends) |
| TanStack Query | ^5.66.0 | Server state, caching, refetch |
| Axios | ^1.8.3 | HTTP so'rovlar (backend API) |
| Socket.io-client | ^4.8.1 | Real-time (WatchParty, Battle) |
| React Navigation | ^6 | Ekranlar orasida o'tish (Stack + BottomTabs) |
| expo-av | ~16.0.8 | Video player (HLS m3u8) |
| expo-image | ~3.0.11 | Optimallashtirilgan rasm yuklash |
| expo-auth-session | ~7.0.10 | Google OAuth (PKCE flow) |
| expo-notifications | ~0.32.16 | Push notifications (FCM) |
| expo-secure-store | ~15.0.8 | Token saqlash (encrypted keychain) |
| expo-web-browser | ~15.0.10 | OAuth browser (expo-auth-session bilan) |
| expo-linear-gradient | ~15.0.8 | Gradient UI (banner, cards) |
| expo-haptics | ~15.0.8 | Tactile feedback |
| react-native-reanimated | ~4.1.1 | Animatsiyalar |
| react-native-gesture-handler | ~2.28.0 | Swipe, drag gestures |

---

## Muhim fayllar

```
Rave/
├── package.json              ← Root workspaces (npm install shu yerdan)
│                               Node >=20.0.0, npm >=10.0.0
├── apps/
│   └── mobile/
│       ├── package.json      ← expo ~54, react-native 0.81.5
│       ├── tsconfig.json     ← extends expo/tsconfig.base, strict, path aliases
│       ├── babel.config.js   ← babel-preset-expo + module-resolver (path aliases)
│       ├── metro.config.js   ← monorepo deduplication (extraNodeModules)
│       ├── app.json          ← Expo config: slug, bundleId, splash, plugins
│       ├── index.ts          ← registerRootComponent(App)
│       ├── App.tsx           ← Root: QueryClient + GestureHandlerRootView + AppNavigator
│       └── src/
│           ├── screens/      ← UI (max 300 qator)
│           ├── components/   ← Reusable UI (max 150 qator)
│           ├── navigation/   ← AppNavigator, AuthNavigator, MainNavigator
│           ├── hooks/        ← useHomeData, useSearch, useSocket
│           ├── api/          ← Axios layer (client.ts + *api.ts)
│           ├── store/        ← Zustand stores
│           ├── socket/       ← Socket.io client
│           ├── theme/        ← colors, spacing, typography
│           ├── types/        ← TypeScript types
│           └── utils/        ← storage.ts (SecureStore), notifications.ts
```

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|------|-------|--------|
| `TypeError: Cannot read properties of undefined (reading 'push')` | Duplicate react/react-native nusxa | `cd Rave && npm install` (root dan) |
| `Invariant Violation: Hooks can only be called inside a function` | Duplicate react | Root dan install + `metro.config.js` extraNodeModules tekshir |
| `Metro bundler version mismatch` | Metro versiyalar aralash | Root dan `npm install` |
| `EADDRINUSE: port 8081` | Metro allaqachon ishlamoqda | `npx expo start --port 8082` yoki eski Metro o'chir |
| `Module not found` runtime | Metro cache eskirgan | `npx expo start --clear` |
| `Expo Go: SDK version mismatch` | Expo Go SDK != loyiha SDK | Expo Go ni yangilash (SDK 54 kerak) |
| `Network request failed` | API URL noto'g'ri | `.env` da `API_BASE_URL` tekshir (emulator: `10.0.2.2`, real: Wi-Fi IP) |
| `expo-secure-store: error` | SecureStore simulator da cheklangan | Real qurilma yoki Android emulator ishlatish |
| `Found 0 errors` bo'lmasa | TypeScript strict xato | `npm run typecheck` → xatoni tuzat |

---

## EAS Build (Production / Custom Dev Client)

Yangi **native modul** qo'shilganda yoki **production build** uchun:

```bash
# EAS CLI o'rnatish:
npm install -g eas-cli
eas login

# Development build (custom dev client):
eas build --platform android --profile development

# Preview build (APK — internal test):
eas build --platform android --profile preview

# Production build:
eas build --platform android --profile production
```

> `eas.json` fayl — T-E013 da yaratiladi (hali bajarilmagan)

---

## Git qoidalari (eslatma)

```bash
# Task boshlashdan oldin:
git pull origin main

# Branch:
git checkout -b emirhan/feat-[screen-name]

# Commit:
git commit -m "feat(mobile): add MovieDetailScreen"
git push origin emirhan/feat-[screen-name]
```

---

*docs/MOBILE_SETUP.md | CineSync | Emirhan | Expo SDK 54 | v2.0 | 2026-03-10*
