# CineSync Mobile — Error Log
# Barcha run/build xatolari va yechimlari
# Yangi xato topilganda shu faylga qo'sh

---

## FORMAT

```
### ERR-M-XXX | Sana | [KATEGORIYA] | Sarlavha
- **Xato:** konsoldagi to'liq xato matni
- **Fayl:** qaysi fayl/qator
- **Sabab:** nima uchun chiqdi
- **Yechim:** nima qilindi
- **Holat:** ✅ Bartaraf / ⚠️ Kutilmoqda
```

Kategoriyalar: BUILD | RUNTIME | NAVIGATION | NETWORK | FIREBASE | SOCKET | METRO

---

## ✅ BARTARAF QILINGAN XATOLAR

### ERR-M-001 | 2026-03-06 | [RUNTIME] | Bearer null socket ulanishda
- **Xato:** `WebSocket connection failed: 401 Unauthorized`
- **Fayl:** `src/socket/client.ts`
- **Sabab:** Token null bo'lganda `auth: { token: null }` → server `"Bearer null"` oladi
- **Yechim:** `connectSocket()` da `if (!token) return null` guard qo'shildi
- **Holat:** ✅ Bartaraf (BUG-M002)

### ERR-M-002 | 2026-03-06 | [RUNTIME] | Notification badge noto'g'ri tab da
- **Xato:** Notification unreadCount HomeTab da ko'rinadi, Notifications tab da emas
- **Fayl:** `src/navigation/MainTabs.tsx`
- **Sabab:** Badge `HomeTab` ga biriktirilgan
- **Yechim:** Badge `ProfileTab` ga (Notifications screen shu stack ichida) ko'chirildi
- **Holat:** ✅ Bartaraf (BUG-M014)

---

### ERR-M-003 | 2026-03-06 | [RUNTIME] | username[0] — bo'sh string da crash
- **Xato:** `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`
- **Fayl:** `FriendsScreen.tsx:53,137`, `FriendProfileScreen.tsx:74`
- **Sabab:** `username[0]` bo'sh string (`''`) uchun `undefined` qaytaradi → `.toUpperCase()` crash
- **Yechim:** `username?.[0]?.toUpperCase() ?? '?'` — optional chaining + fallback `'?'`
- **Holat:** ✅ Bartaraf

### ERR-M-004 | 2026-03-06 | [RUNTIME] | FriendSearchScreen bo'sh avatar initial
- **Xato:** Avatar placeholder bo'sh ko'rinadi
- **Fayl:** `FriendSearchScreen.tsx:96`
- **Sabab:** `charAt(0)` bo'sh string uchun `''` qaytaradi — fallback yo'q
- **Yechim:** `charAt(0).toUpperCase() || '?'` — OR fallback qo'shildi
- **Holat:** ✅ Bartaraf

### ERR-M-005 | 2026-03-06 | [RUNTIME] | WatchParty cheksiz spinner — video topilmadi
- **Xato:** Room yuklangandan keyin ham spinner o'chmasdi
- **Fayl:** `WatchPartyScreen.tsx:144-148`
- **Sabab:** `room` null vs `room.movie.videoUrl` empty farqlanmagan
- **Yechim:** `room` null → "yuklanmoqda", `room` bor ammo URL yo'q → "Video topilmadi" xabari
- **Holat:** ✅ Bartaraf

## ⚠️ KUZATILAYOTGAN / OCHIQ XATOLAR

### ERR-M-006 | 2026-03-06 | [BUILD] | Metro bundler ishga tushmayapti — metro versiya konflikti
- **Xato:**
  ```
  Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Error loading Metro config
  Package subpath './src/stores/FileStore' is not defined by "exports"
  in node_modules/metro-cache/package.json
  ```
- **Fayl:** `metro.config.js` (yuklashda crash)
- **Sabab:** `react-native@0.84.1` → `metro@0.83.4`, expo@53 → `metro@^0.82.0` kutadi
- **Yechim:** `npx expo install` + manual package.json tuzatish → `react-native@0.79.6`
- **Holat:** ✅ Bartaraf

### ERR-M-007 | 2026-03-06 | [BUILD] | react-native versiyasi Expo SDK 53 ga mos emas
- **Xato:** 16 ta paket versiya xatosi
- **Sabab:** `react-native@0.84.1` edi, `expo@53` → `0.79.6` kerak edi
- **Yechim:** `npx expo install` + devDependencies tartibga solinди
- **Holat:** ✅ Bartaraf

### ERR-M-008 | 2026-03-06 | [BUILD] | @types/react ikkita versiya — type conflict
- **Xato:**
  ```
  Type 'ReactElement' is not assignable to type 'ReactNode'
  Property 'children' is missing in type 'ReactPortal'
  ```
- **Fayl:** ~50 ta fayl, `Toast`, `Video`, `SkeletonPlaceholder`, navigation components
- **Sabab:** root `node_modules/@types/react@19.2.14` vs `apps/mobile/@types/react@19.0.10`
  — third-party paketlar root versiyani, app kodi local versiyani ko'rdi
- **Yechim:** `apps/mobile/devDependencies/@types/react` → `^19.2.14` (root bilan moslashtirish)
- **Holat:** ✅ Bartaraf

### ERR-M-009 | 2026-03-06 | [BUILD] | LinearGradient style type xatosi
- **Xato:**
  ```
  Type 'RegisteredStyle<AbsoluteFillStyle>' is not assignable to type 'StyleProp<ViewStyle>'
  ```
- **Fayl:** `src/screens/home/MovieDetailScreen.tsx:79`
- **Sabab:** `expo-linear-gradient@14.1.5` da `style` prop `StyleProp<ViewStyle>` kutadi,
  lekin `StyleSheet.absoluteFill` (`RegisteredStyle`) berilgan edi
- **Yechim:** `StyleSheet.absoluteFill` → `StyleSheet.absoluteFillObject`
- **Holat:** ✅ Bartaraf

### ERR-M-010 | 2026-03-06 | [BUILD] | tsconfig extends yo'li ishlamadi
- **Xato:** `error TS5083: Cannot read file '@react-native/typescript-config/tsconfig.json'`
- **Fayl:** `tsconfig.json`
- **Sabab:** Expo migration dan keyin `@react-native/typescript-config` root `node_modules` da yo'q
- **Yechim:** `extends` → `expo/tsconfig.base` ga o'zgartirildi
- **Holat:** ✅ Bartaraf

### ERR-M-011 | 2026-03-06 | [METRO] | metro-core@0.83.5 private class field — _logLines undefined
- **Xato:** `TypeError: Cannot read properties of undefined (reading 'push')` at `instantiateMetro.ts:45`
- **Fayl:** `node_modules/@expo/cli` → `LogRespectingTerminal` class
- **Sabab:** Root `node_modules/metro-core@0.83.5` private field `#logLines` ga o'tdi, lekin
  `@expo/cli` (metro 0.82.x API) `this._logLines` deb murojaat qiladi → `undefined`
- **Yechim:** Root `package.json` ga barcha `metro-*` paketlar `~0.82.0` da qo'shildi:
  `metro-core`, `metro-runtime`, `metro-source-map`, `metro-symbolicate` + boshqalar
- **Holat:** ✅ Bartaraf — `expo start` → `Waiting on http://localhost:8081` ✅

### ERR-M-012 | 2026-03-06 | [BUILD] | @react-native/gradle-plugin topilmadi
- **Xato:** `Included build 'C:\Rave\apps\mobile\node_modules\@react-native\gradle-plugin' does not exist`
- **Fayl:** `android/settings.gradle`
- **Sabab:** npm workspaces `@react-native/gradle-plugin` ni root `node_modules` ga hoisting qildi,
  lekin Gradle `../node_modules/` (mobile local) dan qidiradi
- **Yechim:**
  1. `apps/mobile/package.json` ga `"@react-native/gradle-plugin": "0.79.6"` qo'shildi
  2. `android/settings.gradle` — path `../../../node_modules/@react-native/gradle-plugin` ga o'zgartirildi
- **Holat:** ✅ Bartaraf

### ERR-M-013 | 2026-03-06 | [BUILD] | Gradle 9.0 + Kotlin 2.2 vs RN 0.79.6 Kotlin 2.0 konflikti
- **Xato:** `Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 2.2.0, expected version is 2.0.0`
- **Fayl:** `android/gradle/wrapper/gradle-wrapper.properties`
- **Sabab:** `gradle-9.0.0-bin` Kotlin 2.2.0 bilan keladi, `@react-native/gradle-plugin@0.79.6` Kotlin 2.0 da yozilgan
- **Yechim:** `gradle-wrapper.properties` da `gradle-9.0.0` → `gradle-8.13` ga o'zgartirildi
- **Holat:** ✅ Bartaraf — Kotlin kompilyatsiya muvaffaqiyatli

### ERR-M-014 | 2026-03-06 | [BUILD] | ANDROID_HOME yo'q — SDK topilmadi ⚠️
- **Xato:** `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file`
- **Fayl:** `android/local.properties` (yo'q)
- **Sabab:** `ANDROID_HOME` environment variable o'rnatilmagan, `local.properties` fayl yo'q
- **Yechim:** Android SDK path ni `local.properties` ga yozish kerak:
  ```
  sdk.dir=C\:\\Users\\User\\AppData\\Local\\Android\\Sdk
  ```
- **Holat:** ⚠️ Kutilmoqda — Android SDK path aniqlanmadi

_(xato topilganda shu bo'limga qo'sh, bartaraf bo'lgach yuqoriga ko'chir)_

---

## 📋 BUILD XATOLARI ARXIVI

_(EAS Build log xatolari shu yerga)_

---

_docs/mobile-errors.md | CineSync | Emirhan | Boshlangan: 2026-03-06_
