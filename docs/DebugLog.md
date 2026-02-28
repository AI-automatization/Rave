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

*docs/DebugLog.md | CineSync | Yangilangan: 2026-02-28*
