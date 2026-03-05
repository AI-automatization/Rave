# CineSync Mobile — Setup Guide
# Yangi PC dan git clone qilgandan keyin ishga tushirish

---

## Talablar

```
Node.js  >= 18.18    → node --version
npm      >= 10.0     → npm --version
Java JDK    17       → java --version  (Android uchun)
Android Studio       → Emulator/SDK uchun
```

---

## 1. Clone va install

```bash
git clone https://github.com/AI-automatization/Rave.git
cd Rave
```

### MUHIM: apps/package.json yaratish

Bu fayl git da yo'q (`.gitignore` da), lekin Expo CLI uchun kerak:

```bash
echo '{"name":"cinesync-apps","private":true}' > apps/package.json
```

Bu fayl bo'lmasa quyidagi xato chiqadi:
```
ConfigError: The expected package.json path: C:\...\apps\package.json does not exist
```

### npm install — ROOT DAN (muhim!)

```bash
# Rave/ papkasida turib:
npm install

# Agar peer-dep xatosi bo'lsa:
npm install --legacy-peer-deps
```

> ❌ `apps/mobile/` dan `npm install` qilma — metro versiyalar noto'g'ri o'rnatiladi

---

## 2. Tekshirish

```bash
# TypeScript xato yo'qligini tekshir:
cd apps/mobile
npm run typecheck
# → 0 errors bo'lishi kerak
```

---

## 3. Metro Bundler ishga tushirish

```bash
cd apps/mobile
npx expo start
```

Muvaffaqiyatli bo'lganda:
```
Starting Metro Bundler
Waiting on http://localhost:8081
Logs for your project will appear below.
```

Cache bilan muammo bo'lsa:
```bash
npx expo start --clear
```

---

## 4. Qurilmaga ulash

### Android Emulator (tavsiya)

```bash
# 1. Android Studio → AVD Manager → emulatorni ishga tushir
# 2. Yangi terminалда:
cd apps/mobile
npx expo run:android
```

### Real Android qurilma (USB)

```bash
# Qurilmada: Settings → Developer Options → USB Debugging → ON
adb devices          # qurilma ko'rinishini tekshir
npx expo run:android
```

### iOS (faqat macOS)

```bash
npx expo run:ios
```

> ⚠️ **Expo Go ishlamaydi** — loyiha Bare Workflow, native build kerak

---

## 5. Environment (.env)

`apps/mobile/` papkasida `.env` fayl kerak bo'lsa (Saidazim dan URL lar so'rash):

```env
# Android emulator uchun:
API_BASE_URL=http://10.0.2.2:3001

# iOS simulator uchun:
# API_BASE_URL=http://localhost:3001

# Real qurilma uchun (WiFi IP):
# API_BASE_URL=http://192.168.x.x:3001
```

### Firebase fayllar (Saidazim dan olish)

```
google-services.json      → apps/mobile/android/app/
GoogleService-Info.plist  → apps/mobile/ios/
```

---

## 6. EAS Build (eas.json kerak bo'lsa)

`eas.json` git da yo'q. Kerak bo'lsa:

```bash
cd apps/mobile
npx eas build:configure
```

Yoki profillari bilan yaratish:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Tez-tez uchraydigan xatolar

| Xato | Yechim |
|------|--------|
| `ConfigError: apps/package.json does not exist` | `echo '{"name":"cinesync-apps","private":true}' > apps/package.json` |
| `TypeError: Cannot read properties of undefined (reading 'push')` | `cd Rave && npm install` (root dan qayta) |
| `Metro bundler version mismatch 0.83 vs 0.82` | Root `package.json` da barcha `metro-*: ~0.82.0` bo'lishi kerak |
| `Cannot find module 'react-native/package.json'` | Root dan `npm install` qil |
| `TypeScript errors (50+)` | `@types/react` versiya konflikti → `npm install` root dan |
| `EADDRINUSE: port 8081` | `npx expo start --port 8082` |
| `Module not found` runtime | `npx expo start --clear` |
| `Invariant Violation: "main" has not been registered` | `index.js` da `registerRootComponent` borligini tekshir |

---

## Muhim fayllar

```
Rave/
├── package.json              ← metro-* ~0.82.0 | overrides: react-native 0.79.6
├── apps/
│   ├── package.json          ← YARATISH KERAK (git da yo'q!)
│   └── mobile/
│       ├── package.json      ← react-native: 0.79.6 | expo: ~53.0.0
│       ├── tsconfig.json     ← extends: expo/tsconfig.base
│       ├── babel.config.js   ← @app-types alias (not @types!)
│       ├── metro.config.js   ← watchFolders: shared/ | assetExts: lottie
│       ├── app.json          ← expo config (slug, bundleId, plugins)
│       ├── index.js          ← registerRootComponent(App)
│       ├── eas.json          ← YARATISH KERAK (git da yo'q!)
│       └── src/
│           ├── screens/
│           ├── components/
│           ├── navigation/
│           ├── store/        ← Zustand
│           ├── api/          ← Axios + React Query
│           ├── socket/       ← Socket.io client
│           ├── hooks/
│           ├── theme/        ← colors, typography
│           ├── types/        ← @app-types alias
│           └── utils/
```

---

## Path aliases (import qilish)

```typescript
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { apiClient } from '@api/client';
import { useStore } from '@store/authStore';
import { colors } from '@theme/colors';
import type { Movie } from '@app-types/movie';  // NOT @types/!
import { formatDate } from '@shared/utils/date';
```

---

## Texnologiyalar

| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| React Native | 0.79.6 | Native app framework |
| Expo SDK | 53 | Bare workflow tooling |
| TypeScript | ~5.8 | Type safety |
| Zustand | ^5 | Global state |
| TanStack Query | ^5 | Server state + caching |
| Axios | ^1 | HTTP client |
| Socket.io-client | ^4 | Real-time (WatchParty, Battle) |
| React Navigation | ^7 | Navigation |
| expo-image | ~2.4 | Optimized images |
| expo-linear-gradient | ~14.1 | Gradient UI |
| react-native-reanimated | ~3.17 | Animations |
| react-native-mmkv | ^4 | Fast local storage |
| Firebase | ^23 | Push notifications (FCM) |

---

*docs/MOBILE_SETUP.md | CineSync | Emirhan | 2026-03-06*
