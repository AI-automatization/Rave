# CineSync — DEBUG LOG
# Yaratildi: 2026-02-27
# Mas'ul: Saidazim (Backend) | Emirhan (Mobile)

---

## 📋 MUAMMO TURLARI

| Kod | Ma'nosi | Jiddiyligi |
|-----|---------|------------|
| TS2349 | Expression not callable (union type conflict) | 🔴 KRITIK |
| TS2322/TS2556 | Type mismatch / spread argument error | 🟠 MUHIM |
| TS2352 | Unsafe type conversion | 🟡 O'RTA |
| TS2790 | delete operator — property must be optional | 🟡 O'RTA |
| TS6133 | Unused variable/import | 🟢 PAST |
| TS6059 | rootDir scope error (monorepo tsconfig) | ℹ️ INFRA |

---

## 🔴 KRITIK XATOLAR (Runtime crash qiladi)

### BUG-001 | admin.service.ts | TS2349 — getMovieModel() not callable
- **Fayl:** `services/admin/src/services/admin.service.ts`
- **Qatorlar:** 113, 122, 133, 144, 179, 187, 194, 319
- **Xato:** `This expression is not callable. Each member of the union type ... has signatures, but none of those signatures are compatible with each other.`
- **Sabab:** `getMovieModel()` return type aniq ko'rsatilmagan. TypeScript union type yasaydi: `conn.models['AdminMovie']` (Model<Record<string,any>>) va `conn.model('AdminMovie', schema)` (boshqa Model tipi). Bu union type callable emas.
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `getMovieModel(): Model<Record<string, unknown>>` return type qo'shildi

---

## 🟠 MUHIM XATOLAR (Compile fail)

### BUG-002 | rateLimiter.middleware.ts | TS2322 + TS2556 — SendCommandFn mismatch
- **Fayl:** `shared/src/middleware/rateLimiter.middleware.ts`
- **Qatorlar:** 34, 47, 64
- **Xato:** `Type '(...args: string[]) => Promise<unknown>' is not assignable to type 'SendCommandFn'` va `A spread argument must either have a tuple type or be passed to a rest parameter.`
- **Sabab:** `rate-limit-redis` kutubxonasining `SendCommandFn` tipi `Promise<RedisReply>` kutadi, lekin `ioredis.call()` `Promise<unknown>` qaytaradi. Shuningdek `...args` string[] tuple emas.
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `args as [string, ...string[]]` tuple cast + `as unknown as SendCommandFn`

---

## 🟡 O'RTA XATOLAR (Compile xato, runtime ta'sir qilmasligi mumkin)

### BUG-003 | error.middleware.ts | TS2352 — Error → Record cast
- **Fayl:** `shared/src/middleware/error.middleware.ts`
- **Qator:** 36
- **Xato:** `Conversion of type 'Error' to type 'Record<string, unknown>' may be a mistake`
- **Sabab:** `error as Record<string, unknown>` — Error tipida index signature yo'q
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `error as unknown as Record<string, unknown>`

### BUG-004 | user.service.ts | TS2352 — lean() result type cast
- **Fayl:** `services/user/src/services/user.service.ts`
- **Qator:** 23
- **Xato:** `Conversion of type 'FlattenMaps<IUserDocument>' to type 'IUserDocument & { isOnline: boolean }'`
- **Sabab:** `.lean()` Mongoose dokumentini plain object ga aylantiradi — `FlattenMaps` tipi `IUserDocument` bilan to'g'ri cast bo'lmaydi
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `as unknown as IUserDocument & { isOnline: boolean }`

### BUG-005 | content.service.ts | TS2352 — Query → Promise cast
- **Fayl:** `services/content/src/services/content.service.ts`
- **Qator:** 245
- **Xato:** `Conversion of type 'Query<...>' to type 'Promise<{ _id: string; title: string; rating: number; }[]>'`
- **Sabab:** `Movie.find().lean()` Mongoose Query qaytaradi, to'g'ri Promise tipi emas
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `as unknown as Promise<{ _id: string; title: string; rating: number }[]>`

### BUG-006 | Barcha model fayllari | TS2790 — delete operator
- **Fayllar:** 12 ta model fayli (auth, user, content, watch-party, admin, battle, notification)
- **Xato:** `The operand of a 'delete' operator must be optional.`
- **Sabab:** `toJSON` transform da `delete ret.__v`, `delete ret.password` — bu maydonlar optional emas
- **Holat:** ✅ TUZATILDI (2026-02-27)
- **Yechim:** `Reflect.deleteProperty(ret, '__v')` ishlatildi — TypeScript type constraints aylanib o'tildi

---

## 🟢 PAST DARAJALI XATOLAR (Faqat linting)

### BUG-007 | logger.ts | TS6133 — 'simple' unused import
- **Fayl:** `shared/src/utils/logger.ts`
- **Qator:** 3
- **Holat:** ✅ TUZATILDI (2026-02-27)

### BUG-008 | auth.service.ts | TS6133 — 'NotFoundError' unused import
- **Fayl:** `services/auth/src/services/auth.service.ts`
- **Qator:** 13
- **Holat:** ✅ TUZATILDI (2026-02-27)

### BUG-009 | battle.service.ts | TS6133 — 'ForbiddenError' unused import
- **Fayl:** `services/battle/src/services/battle.service.ts`
- **Qator:** 6
- **Holat:** ✅ TUZATILDI (2026-02-27)

### BUG-010 | admin.service.ts | TS6133 — 'blockedUsers' unused variable
- **Fayl:** `services/admin/src/services/admin.service.ts`
- **Qator:** 75
- **Holat:** ✅ TUZATILDI (2026-02-27)

---

## ℹ️ INFRA XATOLAR (tsconfig — hal qilish kerak emas hozir)

### BUG-011 | Barcha servicelar | TS6059 — rootDir scope
- **Sabab:** Har bir service tsconfig'i `rootDir: './src'` deydi, lekin `@shared/*` fayllar import qilinadi — ular `rootDir` tashqarida
- **Ta'sir:** `npm run typecheck` root darajasida xato, lekin har service o'z `typecheck` da ishlaydi (path alias orqali)
- **Yechim:** TypeScript project references yoki `rootDir: '../../'` bilan to'liq monorepo tsconfig — kelajakdagi sprint

---

## 📊 XULOSA

| Servis | Kritik | Muhim | O'rta | Past | Jami |
|--------|--------|-------|-------|------|------|
| shared | 0 | 1 (BUG-002) | 1 (BUG-003) | 1 (BUG-007) | 3 |
| auth | 0 | 0 | 1 (BUG-006×7) | 1 (BUG-008) | 2 |
| user | 0 | 0 | 2 (BUG-004, BUG-006×4) | 0 | 2 |
| content | 0 | 0 | 2 (BUG-005, BUG-006×3) | 0 | 2 |
| watch-party | 0 | 0 | 1 (BUG-006×1) | 0 | 1 |
| admin | 1 (BUG-001) | 0 | 1 (BUG-006×2) | 1 (BUG-010) | 3 |
| battle | 0 | 0 | 1 (BUG-006×2) | 1 (BUG-009) | 2 |
| notification | 0 | 0 | 1 (BUG-006×1) | 0 | 1 |
| **JAMI** | **1** | **1** | **10** | **3** | **16** |

---

---

## ✅ SESSIYA: 2026-02-27 (Kecha yakunlandi)

### Typecheck natijasi — BARCHA YASHIL
| Servis | Xatolar | Holat |
|--------|---------|-------|
| shared | 0 | ✅ |
| auth | 0 | ✅ |
| user | 0 | ✅ |
| content | 0 | ✅ |
| watch-party | 0 | ✅ |
| battle | 0 | ✅ |
| notification | 0 | ✅ |
| admin | 0 | ✅ |

### Yangi o'zgarishlar tekshirildi (F-018..F-021)
- `serviceClient.ts` — axios AxiosError tipi to'g'ri, non-blocking pattern ✅
- `battle.service.ts` — `addUserPoints` + `triggerAchievement` import qo'shildi, 0 TS xato ✅
- `user.service.ts` — `triggerAchievement` import, 0 TS xato ✅
- `content.service.ts` — `triggerAchievement` import, 0 TS xato ✅
- Barcha `app.ts` swagger import — `swaggerUi` + `swaggerSpec` 0 TS xato ✅

### Qolgan infra xato (hali ham bor)
#### BUG-011 | TS6059 — root tsconfig rootDir scope
- Holat: ⚠️ HALI HAM BOR (root darajada, har service alohida ✅)
- Sabab: `tsconfig.base.json` `rootDir: ./src` — monorepo uchun mos emas
- Yechim: TypeScript project references — kelajakdagi sprint

---

## 🔧 WINSTON LOGGING KONFIGURATSIYA

Winston har doim fayl ga yozadi (logger.ts da sozlangan):
- `logs/error.log` — faqat ERROR darajasi (max 10MB × 5 fayl)
- `logs/combined.log` — barcha loglar (max 10MB × 30 fayl)
- Console — development da rang bilan, production da JSON

Har service ishga tushganda `logs/` papka avtomatik yaratiladi (Winston o'zi yaratadi).

---

## SESSION: 2026-02-28 (Services startup + ES fix)

### Muhim topilmalar
- **Auth login:** `--data-raw` bilan ham curl shell quoting xatosi berdi. Python urllib bilan to'g'ri ishladi → server kodi CORRECT ✅
- **Auth service:** Login `{"success":true}` + `accessToken` + `refreshToken` qaytardi ✅

### BUG-012 | content/elastic.init.ts — duplicate char_filter mappings
- **Fayl:** `services/content/src/utils/elastic.init.ts:29`
- **Xato:** `illegal_argument_exception: match "'" was already added`
- **Sabab:** `apostrophe_filter.mappings` da `"' => '"` 2 marta (ikkisi ham ASCII U+0027, curly quotes emas)
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `\\u2018=>\\u0027`, `\\u2019=>\\u0027`, `\\u201C=>\\u0022`, `\\u201D=>\\u0022` Unicode escape sequences ishlatildi

### BUG-013 | content/elastic.init.ts — `boost` ES 8.x da qabul qilinmaydi
- **Fayl:** `services/content/src/utils/elastic.init.ts:99,113`
- **Xato:** `mapper_parsing_exception: Unknown parameter [boost] on mapper [originalTitle]`
- **Sabab:** `boost` ES 7.x da deprecated, ES 8.x da mapping time da ruxsat berilmaydi
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `title` va `originalTitle` fieldlaridan `boost` parametri o'chirildi (query time da ber)

### Services holati (2026-02-28 session yakunida)
| Service | Port | Health | Xato |
|---------|------|--------|------|
| auth | 3001 | ✅ OK | yo'q |
| user | 3002 | ✅ OK | yo'q |
| content | 3003 | ✅ OK | ES index yaratildi |
| watch-party | 3004 | ✅ OK | yo'q |
| battle | 3005 | ✅ OK | yo'q |
| notification | 3007 | ✅ OK | yo'q |
| admin | 3008 | ✅ OK | yo'q |

Elasticsearch `movies` index: ✅ yaratildi (green, 1 shard, 0 replicas)

---

---

## 📱 MOBILE — EMIRHAN (React Native)

### BUG-M001 | socket/client.ts | TS2345 — `room: unknown` type xatosi
- **Fayl:** `apps/mobile/src/socket/client.ts`
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Muammo:** `SERVER_EVENTS.ROOM_JOINED` handleri `room` ni `unknown` deb type berganda, `store().setRoom(room)` ga uzatolmadi. Murakkab `Parameters<typeof store>` workaround ishlatilgan.
- **Yechim:** `{ room: IWatchPartyRoom; syncState: SyncState }` to'g'ridan type berildi, `IWatchPartyRoom` import qo'shildi.

### BUG-M002 | App.tsx | TS6133 — `setAuth` unused variable
- **Fayl:** `apps/mobile/src/App.tsx`
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Muammo:** `useAuthStore()` dan `setAuth` destructure qilingan lekin bootstrap da faqat `setUser` ishlatiladi.
- **Yechim:** `setAuth` destructuradan olib tashlandi.

### BUG-M003 | ProfileSetupScreen.tsx | TS6133 — `Image` unused import
- **Fayl:** `apps/mobile/src/screens/auth/ProfileSetupScreen.tsx`
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Muammo:** `Image` react-native'dan import qilingan lekin ishlatilmagan.
- **Yechim:** Import ro'yxatidan olib tashlandi.

### BUG-M004 | package.json | babel-plugin-module-resolver yo'q
- **Fayl:** `apps/mobile/package.json`
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Muammo:** `babel.config.js` da `module-resolver` plugin ishlatilgan lekin `devDependencies` da yo'q edi.
- **Yechim:** `"babel-plugin-module-resolver": "^5.0.2"` devDependencies ga qo'shildi.

### ⚠️ ESLATMA — Google OAuth (LoginScreen)
- **Fayl:** `apps/mobile/src/screens/auth/LoginScreen.tsx`
- **Holat:** 🟡 STUB (to'liq implement kerak)
- **Muammo:** Backend Google OAuth redirect flow (browser orqali) ishlaydi, lekin RN da deep link bilan token qabul qilish kerak.
- **Kerak:** `react-native-app-auth` yoki Google `idToken` → backend `/auth/google-mobile` endpoint (Saidazim bilan kelishish kerak).

### ⚠️ ESLATMA — Android emulator base URL
- **Fayl:** `apps/mobile/src/api/client.ts`
- **Holat:** ℹ️ KONFIGURATSIYA
- **Ma'lumot:** Android emulator uchun `10.0.2.2` (localhost proxy). iOS simulator uchun `localhost` yoki Mac IP. Fizik qurilma uchun kompyuter IP adresi kerak.

---

---

## SESSION: 2026-02-28 (Mobile Sprint 4 — buglar)

### BUG-M005 | ProfileScreen.tsx:72 | Runtime crash — `username[0]` unsafe index
- **Fayl:** `apps/mobile/src/screens/profile/ProfileScreen.tsx`
- **Qator:** 72
- **Xato:** `user?.username[0]?.toUpperCase()` — `username` bo'sh string `""` bo'lsa, `username[0]` → `undefined`, lekin `.toUpperCase()` chaqirilmaydi (optional chaining to'g'ri). Ammo TypeScript strict modeda `string[0]` indeks tipi `string`, opsional emas — real qurilmada `undefined` qaytadi va crash bo'ladi.
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `user?.username?.[0]?.toUpperCase()` — bracket notation bilan optional chaining

### BUG-M006 | ProfileScreen.tsx:119 | Runtime NaN — division by zero
- **Fayl:** `apps/mobile/src/screens/profile/ProfileScreen.tsx`
- **Qator:** 119
- **Xato:** `(stats.totalPoints / stats.nextMilestone) * 100` — agar `nextMilestone === 0` bo'lsa, natija `NaN` bo'ladi. Progress bar `width: "NaN%"` — style xatosi, ekran buziladi.
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `stats.nextMilestone > 0 ? (stats.totalPoints / stats.nextMilestone) * 100 : 100`

### BUG-M007 | ProfileScreen.tsx:112 | UI bug — manfiy qoldiq ko'rinishi
- **Fayl:** `apps/mobile/src/screens/profile/ProfileScreen.tsx`
- **Qator:** 112
- **Xato:** `stats.nextMilestone - stats.totalPoints` — agar user milestone'dan oshib ketsa, manfiy son ko'rinadi (masalan: "-500 pt").
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `Math.max(0, stats.nextMilestone - stats.totalPoints)`

### BUG-M008 | package.json:66 | Jest config xato — setupFiles ishlamaydi
- **Fayl:** `apps/mobile/package.json`
- **Qator:** 66
- **Xato:** `"setupFilesAfterFramework"` — bu Jest konfiguratsiya kaliti mavjud emas. To'g'risi `"setupFilesAfterFramework"` emas, `"setupFilesAfterEnv"`. Shu sababdan `@testing-library/jest-native/extend-expect` jest ishga tushganda yuklanmaydi, custom matchers ishlamaydi.
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `"setupFilesAfterFramework"` → `"setupFilesAfterEnv"` ga o'zgartirildi

---

### BUG-M009 | HeroBanner.tsx | Performance — getItemLayout yo'q
- **Fayl:** `apps/mobile/src/components/HeroBanner.tsx`
- **Xato:** `FlatList` horizontal paging uchun `getItemLayout` berilmagan edi — React Native har scroll da barcha itemni o'lchab, performance pasayadi
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}` + `initialNumToRender=1`, `maxToRenderPerBatch=2`, `windowSize=3`

---

---

## 📦 KUTUBXONA YANGILANISHI — 2026-02-28

### BUG-M010 | package.json | react-native-animated-charts — noto'g'ri versiya
- **Fayl:** `apps/mobile/package.json`
- **Xato:** `"react-native-animated-charts": "^1.0.3"` — bu paket npm'da hech qachon v1.x da chiqmagan. Eng yuqori versiya `0.0.5`. Kod ichida ham ishlatilmagan.
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** `package.json` dan to'liq o'chirildi

### BUG-M011 | Barcha store fayllar | Zustand v4 → v5 — curried form
- **Fayllar:** 6 ta store (auth, movies, friends, watchParty, battle, notification)
- **Xato:** `create<State>((set) => ...)` — zustand v5 da TypeScript type inference ishlamaydi. Curried form talab qilinadi.
- **Holat:** ✅ TUZATILDI (2026-02-28)
- **Yechim:** Barcha 6 store da `create<State>()((set) => ...)` — qo'shimcha `()` qo'shildi

---

### 📋 VERSIYA YANGILASH JADVALI

| Paket | Eski | Yangi | Holat |
|-------|------|-------|-------|
| react | 18.2.0 | 19.2.4 | ⚠️ Native rebuild kerak |
| react-native | 0.74.5 | 0.84.1 | ⚠️ Native rebuild kerak |
| @react-navigation/* | v6 | v7 | ⚠️ `lazy` opsiyasini tab'larga qo'shish kerak |
| react-native-screens | v3 | v4.24.0 | ⚠️ Native rebuild |
| react-native-safe-area-context | v4 | v5.7.0 | ⚠️ Native rebuild |
| react-native-reanimated | v3 | v4.2.2 | ⚠️ Worklets API o'zgardi |
| zustand | v4 | v5.0.11 | ✅ Tuzatildi (BUG-M011) |
| @tanstack/react-query | v5.51 | v5.90.21 | ✅ Backward compat |
| axios | v1.7 | v1.13.6 | ✅ Minor update |
| socket.io-client | v4.7 | v4.8.3 | ✅ Minor update |
| @react-native-async-storage | v1 | v3.0.1 | ⚠️ API slight changes |
| react-native-mmkv | v2 | v4.1.2 | ⚠️ Native rebuild |
| react-native-video | v6.3 | v6.19.0 | ✅ Minor update |
| @react-native-firebase | v20 | v23.8.6 | ✅ Backward compat |
| react-native-vector-icons | v10.1 | v10.3.0 | ✅ Minor update |
| @react-native-community/netinfo | v11 | v12.0.1 | ✅ Minor update |
| react-native-haptic-feedback | v2.2 | v2.3.3 | ✅ Minor update |
| react-native-permissions | v4 | v5.4.4 | ⚠️ API o'zgardi |
| react-native-device-info | v11 | v15.0.2 | ✅ Mostly compat |
| @react-native-google-signin | v12 | v16.1.1 | ⚠️ API o'zgardi (stub) |
| react-native-toast-message | v2.2 | v2.3.3 | ✅ Minor update |
| date-fns | v3.6 | v4.1.0 | ✅ formatDistanceToNow compat |
| react-native-animated-charts | ^1.0.3 | ❌ O'chirildi | BUG-M010 |
| @babel/core | v7.20 | v7.29.0 | ✅ |
| @types/react | v18 | v19.2.14 | ✅ |
| jest | v29.6 | v30.2.0 | ✅ |
| @testing-library/react-native | v12 | v13.3.3 | ✅ |
| typescript | 5.0.4 | 5.9.3 | ✅ |
| eslint | v8.19 | v8.57.1 | ✅ v8 da qoldi (v9/10 flat config RN'da tayyor emas) |
| detox | — | v20.47.0 | ✅ Yangi qo'shildi |

### ⚠️ NATIVE REBUILD KERAK BO'LGAN PAKETLAR

React Native, react-native-screens, react-native-safe-area-context, react-native-mmkv, react-native-reanimated versiyalari yangilangandan keyin:

```bash
# iOS:
cd ios && pod install && cd ..

# Android:
cd android && ./gradlew clean && cd ..

# Metro cache tozalash:
npx react-native start --reset-cache
```

### ⚠️ REACT NATIVE 0.74 → 0.84 MIGRATION QADAMLARI

1. **New Architecture** — RN 0.84 da yangi arxitektura default. `android/gradle.properties` va `ios/Podfile` da sozlash kerak.
2. **Android Gradle** — `android/build.gradle` da `kotlinVersion`, `buildToolsVersion` yangilash.
3. **iOS Podfile** — `platform :ios, '13.4'` → `'15.1'` (RN 0.84 minimum iOS talabi).
4. **react-navigation v7** — Tab navigatorda `lazy` prop o'zgardi: `tabBar` opsiyasini tekshirish.
5. **react-native-reanimated v4** — `Animated.View` o'rniga `Reanimated.View` faqat reanimated hooks bilan ishlanganda.

---

---

## SESSION: 2026-03-01 (Mobile — Emirhan bug audit)

### BUG-M012 | auth.store.ts | KRITIK — setUser() isAuthenticated ni o'zgartirmaydi
- **Fayl:** `apps/mobile/src/store/auth.store.ts:29`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `setUser: (user) => set({ user })` faqat `user` ni set qiladi. `App.tsx` bootstrap'da: token bor → `/auth/me` → `setUser(res.data)`. Lekin `isAuthenticated` hech qachon `true` bo'lmaydi. Natija: app qayta ishga tushirilganda (restart) foydalanuvchi login sahifasida qolib ketadi — tokenlar bor bo'lsa ham.
- **Yechim:** `setUser: (user) => set({ user, isAuthenticated: true })`

---

### BUG-M013 | WatchPartyScreen.tsx:108 | KRITIK — videoUrl har doim bo'sh string
- **Fayl:** `apps/mobile/src/screens/modal/WatchPartyScreen.tsx:108`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `const videoUrl = room ? '' : '';` — har ikki branch ham `''` qaytaradi. Watch Party da video hech qachon yuklanmaydi (bo'sh URL).
- **Yechim:** `const videoUrl = room?.movie?.videoUrl ?? '';`

---

### BUG-M014 | VideoPlayerScreen.tsx | O'RTA — timer reflar unmount'da tozalanmaydi
- **Fayl:** `apps/mobile/src/screens/home/VideoPlayerScreen.tsx`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `saveTimerRef` va `controlsTimer` ref'lari component unmount bo'lganda `clearTimeout` chaqirilmaydi. Component yo'q bo'lgandan keyin timer ot'sa: `saveProgress()` → destroyed store'ga yozish → memory leak / stale closure.
- **Yechim:** `useEffect(() => () => { clearTimeout(saveTimerRef.current); clearTimeout(controlsTimer.current); }, [])` qo'shildi

---

### BUG-M015 | SearchScreen.tsx:32 | O'RTA — movie bosganda SearchResults ga o'tadi (MovieDetail o'rniga)
- **Fayl:** `apps/mobile/src/screens/search/SearchScreen.tsx:32`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `handleMoviePress` → `navigation.navigate('SearchResults', { query: movie.title })` — film nomini qayta qidiradi. Foydalanuvchi film detail sahifasiga o'tishini kutadi.
- **Yechim:** `SearchStackParams` ga `MovieDetail` qo'shildi, `SearchNavigator` ga screen qo'shildi, handler → `navigation.navigate('MovieDetail', { movieId: movie._id })`

---

### BUG-M016 | SearchResultsScreen.tsx:38 | O'RTA — movie bosganda Search ga qaytadi
- **Fayl:** `apps/mobile/src/screens/search/SearchResultsScreen.tsx:38`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `handleMoviePress` → `navigation.navigate('Search')` — natijalar ekranida film bosganda bosh qidiruv sahifasiga qaytadi. Film detail ko'rinmaydi.
- **Yechim:** BUG-M015 bilan bir fix — `navigation.navigate('MovieDetail', { movieId: movie._id })`

---

### BUG-M017 | socket/client.ts | O'RTA — MEMBER_JOINED/LEFT/KICKED va ROOM_UPDATED event handlerlari yo'q
- **Fayl:** `apps/mobile/src/socket/client.ts`
- **Holat:** ✅ TUZATILDI (2026-03-01)
- **Muammo:** `SERVER_EVENTS` da `MEMBER_JOINED`, `MEMBER_LEFT`, `MEMBER_KICKED`, `MEMBER_MUTED`, `ROOM_UPDATED` konstantalari bor lekin hech bir handler `socket.on(...)` bilan ulangan emas. Watch Party da a'zo qo'shilsa/chiqsa/chiqarilsa — xona holati real-time yangilanmaydi.
- **Yechim:** `watchParty.store.ts` ga `updateMembers` action qo'shildi. `socket/client.ts` ga 5 ta yangi handler ulandi.

---

*docs/DebugLog.md | CineSync | Yangilangan: 2026-03-01*
