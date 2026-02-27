# CineSync — DEBUG LOG
# Yaratildi: 2026-02-27
# Mas'ul: Saidazim (Backend)

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

## 🔧 WINSTON LOGGING KONFIGURATSIYA

Winston har doim fayl ga yozadi (logger.ts da sozlangan):
- `logs/error.log` — faqat ERROR darajasi (max 10MB × 5 fayl)
- `logs/combined.log` — barcha loglar (max 10MB × 30 fayl)
- Console — development da rang bilan, production da JSON

Har service ishga tushganda `logs/` papka avtomatik yaratiladi (Winston o'zi yaratadi).

---

*docs/DebugLog.md | CineSync | Yaratildi: 2026-02-27*
