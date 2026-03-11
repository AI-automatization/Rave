# CineSync — BAJARILGAN ISHLAR ARXIVI

# Yangilangan: 2026-03-10

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

---

---

---

---

_docs/Done.md | CineSync | Yangilangan: 2026-03-07 (Mobile Expo ga ko'chirildi, qayta qurilmoqda)_
