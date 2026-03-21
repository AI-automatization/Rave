# CineSync — OCHIQ VAZIFALAR

# Yangilangan: 2026-03-19

# 3 dasturchi: Saidazim (Backend) | Emirhan (Mobile) | Jafar (Mobile)

---

## 📌 QOIDALAR

```
1. Har topilgan bug/task → shu faylga DARHOL yoziladi
2. Sessiya boshida shu faylni O'QIB, oxirgi T-raqamdan davom
3. Fix bo'lgach → shu yerdan O'CHIRISH → docs/Done.md ga KO'CHIRISH
4. Prioritet: P0=kritik, P1=muhim, P2=o'rta, P3=past
5. Sprint: S1=hozir, S2=keyingi hafta, S3=keyingi sprint, S4-5=keyin
6. Oxirgi T-raqam: S→038, E→062, J→026, C→010
```

---

# ═══════════════════════════════════════

# 🔴 SAIDAZIM — BACKEND + ADMIN

### T-S038 | P1 | [BACKEND] | Watch Party — bo'sh xonani 5 daqiqada avtomatik yopish

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S4
- **Fayllar:** `services/watch-party/src/socket/roomEvents.handler.ts`, `services/watch-party/src/services/watchParty.service.ts`
- **Holat:** ❌ Boshlanmagan

**Muammo:**
Xona yaratilgandan keyin yoki oxirgi member chiqib ketgandan keyin xona abadiy "active" qoladi.
Kerak: oxirgi user chiqib ketgandan so'ng 5 daqiqa `inactive` bo'lsa → xona avtomatik `status: 'ended'` ga o'tsin.

**Yechim:**
- `leave` eventda: agar xonada member qolmasa → `setTimeout(5 * 60 * 1000, closeRoom)` ishga tushirish
- Agar 5 daqiqa ichida yangi member kelsa → timeout bekor qilish
- Room close bo'lganda `ROOM_CLOSED` event barcha socketlarga emit qilish
- Redis da timeout ID saqlash (xona restartda ham ishlashi uchun) YOKI Bull job ishlatish

---

# ═══════════════════════════════════════

## SPRINT 2 — Content + Watch Party

### ✅ T-S026 | TUGADI → Done.md F-118
### ✅ T-S027 | TUGADI → Done.md F-118
### ✅ T-S028 | TUGADI → Done.md F-118
### ✅ T-S029 | TUGADI → Done.md F-118

### ✅ T-S035 | TUGADI → Done.md F-144
### ✅ T-S036 | TUGADI → Done.md F-144
### ✅ T-S037 | TUGADI → Done.md F-144

### T-S033 | P1 | [BACKEND] | Video Extract endpoint — yt-dlp deploy + sayt qo'llab-quvvatlash kengaytirish

- **Sana:** 2026-03-18
- **Mas'ul:** pending[Saidazim]
- **Sprint:** S6
- **Bog'liqlik:** T-E040 (mobile shu endpoint ga bog'liq)
- **Fayl:** `services/content/src/services/videoExtractor/`
- **Holat:** ⚠️ Endpoint mavjud (`POST /content/extract`), lekin deploy va sayt qo'llab-quvvatlash kengaytirish kerak

**Mavjud infra:**
```
POST /api/v1/content/extract
├─ videoExtractor/ — detectPlatform → ytdl-core/yt-dlp/genericExtractor
├─ ytdl.service.ts — YouTube specific (LRU cache 2h)
├─ Redis cache — TTL 2h
├─ SSRF protection — private IP block
└─ 700+ sayt yt-dlp orqali
```

**Subtasklar:**

- [x] **S33-1.** yt-dlp musl binary Dockerfile ga qo'shildi ✅
- [x] **S33-2.** O'zbek saytlar — genericExtractor depth=2 + Referer ✅
- [x] **S33-3.** timeout 20s, depth=2, structured errors ✅
- [x] **S33-4.** YouTube proxy Range request — allaqachon mavjud ✅

---

### T-S005b | P2 | [BACKEND] | Content Service — HLS upload pipeline

- **Sana:** 2026-02-27
- **Mas'ul:** Saidazim
- **Fayl:** `services/content/src/`
- **Holat:** ❌ Boshlanmagan (requires FFmpeg + storage infra)
- **Qolgan ishlar:**
  - [ ] FFmpeg transcode endpoint — operator video yuklaydi → HLS m3u8 + .ts segments
  - [ ] Storage: local yoki S3-compatible (MinIO) video saqlash
  - [ ] Background job (Bull queue) — transcode async

---

## SPRINT 4 — Admin + Operator

## ARXITEKTURA REVIEW — 2026-03-11 (Bekzod QA)



### T-S009 | P2 | [ADMIN] | Admin Dashboard UI — React + Vite

- **Sana:** 2026-02-26
- **Mas'ul:** Saidazim
- **Fayl:** `apps/admin-ui/`
- **Holat:** ✅ TUGADI (2026-03-14)
- **Sprint:** S4-S5
- **Kerak bo'ladi:**
  - [ ] Vite + React + TypeScript + TailwindCSS setup
  - [ ] Login page (admin credentials, JWT)
  - [ ] Dashboard — stats cards, charts (Recharts)
  - [ ] Users table — filter, search, block/unblock actions
  - [ ] Content management table — publish/unpublish
  - [ ] Feedback list + reply form
  - [ ] Real-time stats (Socket.io yoki polling)

---

# ═══════════════════════════════════════

# 🟢 EMIRHAN — EXPO REACT NATIVE MOBILE (QAYTA QURILMOQDA)

# ═══════════════════════════════════════

> **2026-03-07:** Bare React Native → Expo React Native ga to'liq ko'chirildi.
> Eski `apps/mobile` o'chirildi. Yangi Expo app `create-expo-app` bilan yaratildi.
> Quyidagi barcha tasklar `pending[Emirhan]` — boshidan bajariladi.

---

## SPRINT 1 — Expo Setup + Auth

### ✅ T-E039 | TUGADI → Done.md F-121
### ✅ T-E038 | TUGADI → Done.md F-120

---

### ✅ T-E031 | TUGADI → Done.md F-109

**Backend tayyor** — faqat mobile UI va flow kerak.

**Flow:**
```
1. LoginScreen → "Telegram bilan kirish" tugmasi
2. POST /auth/telegram/init → { state, botUrl }
3. Linking.openURL(botUrl)  ← Telegram ilovasi ochiladi
4. Foydalanuvchi botda /start bosadi
5. Poll: GET /auth/telegram/poll?state=STATE (har 2 sek, max 2 daqiqa)
6. Response 200 (not 202) → { accessToken, refreshToken, user }
7. Token saqlash → HomeScreen ga o'tish
8. Background: Linking.openURL("https://t.me/gatsCinema_bot?start=USER_ID")
   ← Notification linking uchun (ixtiyoriy, user rozi bo'lsa)
```

**API Endpoints (production):**
```
POST https://auth-production-47a8.up.railway.app/api/v1/auth/telegram/init
  Response: { success: true, data: { state: "abc123", botUrl: "https://t.me/gatsCinema_bot?start=abc123" } }

GET  https://auth-production-47a8.up.railway.app/api/v1/auth/telegram/poll?state=abc123
  Pending:  { success: true, data: null, message: "Pending" }   → HTTP 202
  Success:  { success: true, data: { accessToken, refreshToken, user } } → HTTP 200
```

**UI:**
```tsx
// LoginScreen da qo'shish:
<TouchableOpacity onPress={handleTelegramLogin}>
  <Text>Telegram bilan kirish</Text>
</TouchableOpacity>

// handleTelegramLogin:
// 1. POST /init → botUrl olish
// 2. Linking.openURL(botUrl)
// 3. setInterval poll (har 2000ms)
// 4. 202 → kutish | 200 → login | error → xato ko'rsatish
// 5. Timeout 2 daqiqadan keyin "Amal qilmadi, qayta urinib ko'ring"
```

**Kerakli packages:** faqat `Linking` (Expo built-in), axios (allaqachon bor)

---

## SPRINT 2 — Asosiy ekranlar



## SPRINT 3 — Ijtimoiy ekranlar

## SPRINT 4 — Profil + Bildirishnoma





## SPRINT 5 — Sifat + Test

---

### ✅ T-E043 | TUGADI → Done.md F-137

---

## SPRINT 2 — Asosiy ekranlar

### ✅ T-E044 | TUGADI → Done.md F-138
### ✅ T-E045 | TUGADI → Done.md F-138
### ✅ T-E046 | TUGADI → Done.md F-138
### ✅ T-E047 | TUGADI → Done.md F-138

---

## SPRINT 3 — Ijtimoiy ekranlar

### ✅ T-E048 | TUGADI → Done.md F-139
### ✅ T-E049 | TUGADI → Done.md F-139
### ✅ T-E050 | TUGADI → Done.md F-139
### ✅ T-E051 | TUGADI → Done.md F-139

---

## SPRINT 4 — Profil + Bildirishnoma

### ✅ T-E052 | TUGADI → Done.md F-140
### ✅ T-E053 | TUGADI → Done.md F-140
### ✅ T-E054 | TUGADI → Done.md F-140
### ✅ T-E055 | TUGADI → Done.md F-140

---

## SPRINT 5 — Sifat + Test

### T-E062 | P1 | [MOBILE] | FCM token registration + notification deep links

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S4
- **Fayllar:** `apps/mobile/src/hooks/useNotifications.ts` (yoki yangi), `apps/mobile/src/navigation/`
- **Holat:** ❌ Boshlanmagan

**Muammo:**
Backend FCM push yuboradi, lekin mobile:
1. FCM token ni backendga ro'yxatdan o'tkazishi kerak
2. Notification bosilganda to'g'ri ekranga yo'naltirishi kerak

**Yechim:**

**A. FCM token registration:**
```typescript
// App startup yoki login dan keyin:
import messaging from '@react-native-firebase/messaging';
import { apiClient } from '../api/client';

const token = await messaging().getToken();
await apiClient.post('/users/me/fcm-token', { fcmToken: token });

// Token yangilanganda:
messaging().onTokenRefresh(async (newToken) => {
  await apiClient.post('/users/me/fcm-token', { fcmToken: newToken });
});
```

**B. Notification tap → deep link:**
```typescript
// FCM data payload dan screen olish:
// data.screen = 'Friends' | 'WatchParty' | 'Battles' | 'Home'
// data.roomId, data.battleId, data.friendshipId — qo'shimcha params

messaging().onNotificationOpenedApp((remoteMessage) => {
  const { screen, roomId, battleId } = remoteMessage.data ?? {};
  if (screen === 'WatchParty' && roomId) navigation.navigate('WatchParty', { roomId });
  else if (screen === 'Battles') navigation.navigate('Battles');
  else if (screen === 'Friends') navigation.navigate('Friends');
  else navigation.navigate('Home');
});

// App birinchi ochilganda (notification tap bilan):
const initial = await messaging().getInitialNotification();
if (initial?.data?.screen) { /* same logic */ }
```

**Subtasklar:**
- [ ] `useNotifications` hook — token register + foreground/background handler
- [ ] `AppNavigator` da `onNotificationOpenedApp` + `getInitialNotification`
- [ ] Permission so'rash (iOS: `messaging().requestPermission()`)
- [ ] Background message handler (`setBackgroundMessageHandler`)
- [ ] FCM topic `all` ga subscribe: `messaging().subscribeToTopic('all')`
- [ ] Test: backend dan broadcast → telefonga push keladi

---

### ✅ T-E061 | TUGADI → Done.md F-142

---

### ✅ T-E056 | TUGADI → Done.md F-141

---

### T-E057 | P1 | [MOBILE] | Unit testlar — hooks va API layer

- **Sana:** 2026-03-19
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S5
- **Fayllar:** `__tests__/hooks/useHomeData.test.ts`, `__tests__/hooks/useSearch.test.ts`, `__tests__/api/content.api.test.ts`, `__tests__/hooks/useBattle.test.ts`
- **Holat:** ❌ Boshlanmagan
- **Subtasklar:**
  - [ ] Jest setup tekshirish
  - [ ] `useHomeData` test (mock contentApi)
  - [ ] `useSearch` test (debounce, history)
  - [ ] `contentApi` test (axios mock)
  - [ ] `useBattle` test (accept/reject mutations)
  - [ ] Coverage: 70%+ hooks, 80%+ API

---

### T-E058 | P2 | [MOBILE] | Performance — React.memo + FlatList getItemLayout + expo-image cache

- **Sana:** 2026-03-19
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S5
- **Fayllar:** `components/movie/MovieCard.tsx`, `components/movie/MovieRow.tsx`, barcha FlatList komponentlar
- **Holat:** ❌ Boshlanmagan
- **Subtasklar:**
  - [ ] `MovieCard`, `FriendRow`, `BattleCard` → `React.memo`
  - [ ] FlatList `getItemLayout` (fixed height bo'lsa)
  - [ ] `expo-image` `{ cachePolicy: 'memory-disk' }` barcha Image larga

---

### T-E059 | P2 | [MOBILE] | E2E smoke test — critical user flows

- **Sana:** 2026-03-19
- **Mas'ul:** pending[Emirhan]
- **Sprint:** S5
- **Fayllar:** `__tests__/e2e/auth.flow.test.ts`, `__tests__/e2e/watchparty.flow.test.ts`
- **Holat:** ❌ Boshlanmagan
- **Subtasklar:**
  - [ ] Login → Home → MovieDetail → VideoPlayer oqimi
  - [ ] Register → VerifyEmail → ProfileSetup oqimi
  - [ ] WatchPartyCreate → WatchPartyScreen → Leave oqimi
  - [ ] Notification tap → deep link → to'g'ri ekran

---

### ✅ T-E060 | TUGADI → Done.md F-143

---

## SPRINT 6 — Universal Video Extraction + Sync

### ✅ T-E040 | TUGADI → Done.md F-131

---

### ✅ T-E041 | TUGADI → Done.md F-134

### ✅ T-E042 | TUGADI → Done.md F-136
- **Sprint:** S6
- **Fayllar:** `VideoSection.tsx`, `WatchPartyScreen.tsx`, `ModalNavigator.tsx`
- **Subtasklar:**
  - [x] `gestureEnabled: false` — WatchParty modal swipe dismiss o'chirish ✅
  - [x] Fullscreen toggle — video katta/kichik, RoomInfoBar/Emoji yashirish ✅
  - [x] Stop tugmasi — owner stop → pause + seekTo(0) + emitPause(0) → members sync ✅

---

#### 🎯 ASOSIY VAZIFA — Member lock overlay

**Muammo:** Hozir WatchParty da member ham WebView da click/tap/scroll qila oladi — saytning o'z playeri ularda ham interactive. Bu noto'g'ri: faqat owner boshqarishi kerak.

**Kerak:** Member WebView ni ko'radi (bir xil URL, bir xil sayt), lekin hech narsa bosa olmaydi.

**Yechim — 5 qator kod:**

```tsx
// WebView bilan birgalikda (error yo'q holat):
) : (
  <View style={{ flex: 1 }}>
    <WebView ... />   {/* mavjud kod — o'zgartirma */}

    {/* Member lock: shaffof overlay, barcha touch larni ushlab oladi */}
    {!isOwner && (
      <View style={StyleSheet.absoluteFill} />
    )}
  </View>
)}
```

`StyleSheet.absoluteFill` = `{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }` — React Native da default `backgroundColor` yo'q, ya'ni shaffof. Vizual ko'rinmaydi, lekin barcha touch larni bloklaydi.

**Natija:**

| | Owner | Member |
|--|-------|--------|
| Saytni ko'radi | ✅ | ✅ |
| Click/tap | ✅ | ❌ (overlay bloklaydi) |
| Scroll | ✅ | ❌ |
| Fullscreen tugma | ✅ | ❌ |
| Play/Pause/Seek | ✅ (o'zi bosadi) | ✅ (Socket.io sync, JS inject) |

---

#### 🐛 BUG TEKSHIRUV — WebViewPlayer

Quyidagilarni tekshirib, ishlayotganini tasdiqlash yoki bug tuzatish:

**B1. `isOwner` events tekshiruvi**
```
Tekshirish: Owner WebView da play bosadi → Socket.io ga ketadimi?
Tekshirish: Member Socket.io dan event oladi → video sync bo'ladimi?

handleMessage ichida (line ~214):
  case 'PLAY': if (isOwner) onPlay(...)  ← faqat owner yuboradi ✅ (mavjud)
  case 'PAUSE': if (isOwner) onPause(...) ← ✅ (mavjud)
  case 'SEEK': if (isOwner) onSeek(...)  ← ✅ (mavjud)

Agar member da ham onPlay/onPause chaqirilayotgan bo'lsa → bug, tuzatish kerak
```

**B2. `injectWithRetry` member da ishlashini tekshirish**
```
Member Socket.io dan 'video:play' oladi → ref.play() → injectWithRetry('window._csVideo.play();')
Bu WebView ga inject bo'ladimi? Test qilish kerak.

Agar video element topilmasa → _csVideo undefined → inject ishlamaydi
Adapter to'g'ri ishlayotganini tekshirish
```

**B3. YouTube `youtubeVideoId` prop bo'sh holat**
```tsx
// UniversalPlayer.tsx da:
<WebViewPlayer
  url={url}
  youtubeVideoId={youtubeVideoId}  // undefined bo'lsa nima bo'ladi?
  ...
/>

// WebViewPlayer ichida:
const isYouTubeMode = !!youtubeVideoId;  // ✅ undefined → false (ok)
```
Tekshirish: YouTube rejimda `buildYouTubeHtml('')` bo'sh videoId bilan chaqirilmasligiga ishonch hosil qilish.

**B4. `onProgress` undefined holati**
```tsx
onProgress?.(data.currentTime, data.duration);  // ✅ optional chaining bor
```
Agar `onProgress` berilmagan bo'lsa — ishlamaydi (ok, optional).

**B5. Redirect warning — member da ham ko'rinadi**
```
Hozir: isOwner tekshirilmaydi — member ham redirect warning ko'radi
Kerak: member da redirect warning ko'rsatmaslik (yoki ko'rsatish — muhim emas)
Bu kichik UX muammo, critical emas
```

**B6. Error retry — member da ishlashini tekshirish**
```
Member da sayt yuklanmasa → retry tugma ko'rinadi → bosadi → reload()
Bu okmi yoki member retry bosa olmasligi kerakmi?
Tavsiya: member ham retry bosa olsin (sayt muammosi, control muammosi emas)
```

---

#### ✅ Qabul qilish mezonlari

```
□ Member WebView ni ko'radi (bir xil URL)
□ Member hech narsani bosa olmaydi (overlay ishlaydi)
□ Owner play → member 1-3 sek ichida sync bo'ladi
□ YouTube rejimda member ham video ko'radi, bosa olmaydi
□ Overlay faqat member da ko'rinadi, owner da yo'q
□ TypeScript xatosi yo'q (tsc --noEmit o'tadi)
```

---


# ═══════════════════════════════════════

# 🔵 JAFAR — REACT NATIVE MOBILE

# ═══════════════════════════════════════

> **2026-03-18:** Jafar Web → Mobile ga o'tdi. Quyidagi web tasklar mas'ulsiz qoldi.
> Eski tugallangan tasklar arxivda qoladi.

## Tugallangan (arxiv)

### ✅ T-J012 | TUGADI → Done.md F-122
### ✅ T-J013 | TUGADI → Done.md F-123
### ✅ T-J014 | TUGADI → Done.md F-124

---

## SPRINT 5 — Ochiq tasklar

### ✅ T-J016 | TUGADI → Done.md F-144
### ✅ T-J017 | TUGADI → Done.md F-144
### ✅ T-J018 | TUGADI → Done.md F-144

### ✅ T-J021 | TUGADI → Done.md F-145

---

### T-J022 | P1 | [MOBILE] | WatchParty — member lock overlay (WebView)

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Jafar]
- **Sprint:** S6
- **Fayl:** `apps/mobile/src/screens/WatchParty/components/WebViewPlayer.tsx` (yoki `VideoSection.tsx`)
- **Holat:** ❌ Boshlanmagan

**Muammo:**
Hozir WatchParty da member ham WebView da tap/scroll/click qila oladi — saytning o'z playeri ularda ham interactive. Faqat owner boshqarishi kerak.

**Yechim — 5 qator:**
```tsx
// WebView dan keyingi qatorda:
{!isOwner && (
  <View style={StyleSheet.absoluteFill} />
)}
// StyleSheet.absoluteFill — shaffof, touch larni to'sadi
```

**Qo'shimcha — Bug tekshiruv (`isOwner` events):**
- Owner WebView da play bosadi → Socket.io ga `video:play` ketadimi? ✓ tekshirish
- Member `video:play` oladi → `injectWithRetry` WebView ga inject bo'ladimi? ✓ tekshirish
- Agar member da ham `onPlay/onPause` chaqirilayotgan bo'lsa → bug: `if (isOwner)` guard qo'shish

**Subtasklar:**
- [ ] `WebViewPlayer.tsx` da `isOwner` prop bor-yo'qligini tekshirish
- [ ] `{!isOwner && <View style={StyleSheet.absoluteFill} />}` — WebView ustiga qo'shish
- [ ] Test: member tap bosadi → video boshqarilmaydi ✅
- [ ] Test: owner play bosadi → member sync bo'ladi ✅
- [ ] TypeScript: `tsc --noEmit` o'tadi ✅

---

### T-J023 | P1 | [MOBILE] | Notification ekrani — to'liq implementatsiya

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Jafar]
- **Sprint:** S4
- **Fayllar:** `apps/mobile/src/screens/Notifications/NotificationsScreen.tsx`, `apps/mobile/src/api/notifications.api.ts`
- **Holat:** ❌ Boshlanmagan

**Backend API (production):**
```
GET  /notifications?page=1&limit=20        → list (paginated)
GET  /notifications/unread-count           → { count: number }
PATCH /notifications/:id/read              → mark one read
PATCH /notifications/read-all             → mark all read
DELETE /notifications/:id                  → delete
```

**Notification types va ularning action:**
| type | Ko'rinish | Tap action |
|------|-----------|------------|
| `friend_request` | "X do'stlik so'rovi yubordi" | → Friends ekrani |
| `friend_accepted` | "X do'stingiz bo'ldi" | → Friends ekrani |
| `watch_party_invite` | "X Watch Party ga taklif qildi" | → WatchPartyJoin ekrani (inviteCode bilan) |
| `battle_invite` | "X battle taklifi yubordi" | → Battles ekrani |
| `battle_result` | "Battle rad etildi/yakunlandi" | → Battles ekrani |
| `achievement_unlocked` | "Achievement ochildi! 🏆" | → Profile/Achievements ekrani |

**Notification data payload (backend dan keladi):**
```typescript
// data field ichida:
{ screen: 'Friends' | 'WatchParty' | 'Battles' | 'Home', inviteCode?: string, battleId?: string }
```

**Subtasklar:**
- [ ] `notifications.api.ts` — barcha endpoint lar (GET, PATCH, DELETE)
- [ ] `NotificationsScreen` — FlatList, unread badge (qizil), pull-to-refresh
- [ ] Har bir notification tapping → `data.screen` asosida navigate
- [ ] Unread count badge — tab bar yoki header da
- [ ] "Hammasini o'qilgan deb belgilash" tugmasi
- [ ] Empty state — "Hozircha bildirishnoma yo'q"
- [ ] TypeScript: `tsc --noEmit` o'tadi ✅

---

### T-J024 | P2 | [MOBILE] | Battle invite — qabul qilish/rad etish + battle detail ekrani

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Jafar]
- **Sprint:** S4
- **Fayllar:** `apps/mobile/src/screens/Battles/BattleDetailScreen.tsx`, `apps/mobile/src/api/battles.api.ts`
- **Holat:** ❌ Boshlanmagan

**Backend API:**
```
GET    /battles/:id                  → battle detail (participants, status, leaderboard)
POST   /battles/:id/accept           → invite qabul qilish
POST   /battles/:id/reject           → invite rad etish
GET    /battles/:id/leaderboard      → sorted participants list
GET    /battles                      → my battles list
```

**Battle statuses:** `pending` | `active` | `completed` | `cancelled` | `rejected`

**Invite flow:**
```
Notification tap (battle_invite) →
  data.battleId bilan BattleDetailScreen.navigate →
    Accept / Reject tugmalari ko'rinadi (status === 'pending' && !hasAccepted) →
      Accept: POST /battles/:id/accept → battle 'active' bo'ladi →
              toast "Battle boshlandi! Kim ko'proq film ko'radi?"
      Reject: POST /battles/:id/reject → creator ga notification ketadi (backend avtomatik)
```

**Subtasklar:**
- [ ] `battles.api.ts` — getBattle, getLeaderboard, acceptInvite, rejectInvite, getMyBattles
- [ ] `BattleDetailScreen` — status, davomiylik, leaderboard (score bo'yicha sorted)
- [ ] Accept/Reject tugmalari — faqat `pending` va `!hasAccepted` holda ko'rinadi
- [ ] Leaderboard: har bir ishtirokchi: avatar, username, score (balls), moviesWatched, minutesWatched
- [ ] Winner ko'rsatish — `completed` statusda, winner yuqorida 🏆
- [ ] My Battles list — active/pending/completed filtr
- [ ] TypeScript: `tsc --noEmit` o'tadi ✅

---

### T-J025 | P2 | [MOBILE] | Profil settings ekrani — bio edit, avatar upload, account

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Jafar]
- **Sprint:** S5
- **Fayllar:** `apps/mobile/src/screens/Profile/EditProfileScreen.tsx`, `apps/mobile/src/screens/Profile/SettingsScreen.tsx`
- **Holat:** ❌ Boshlanmagan

**Backend API:**
```
GET    /users/me                     → o'z profil ma'lumotlari
PATCH  /users/me                     → { bio: string } yangilash
POST   /users/me/avatar              → multipart/form-data, field: 'avatar' (image/jpeg, image/png, max 5MB)
DELETE /auth/account                 → akkauntni o'chirish (confirmation kerak!)
POST   /auth/logout                  → logout (refresh token invalid qilinadi)
```

**Subtasklar:**

**A. Edit Profile:**
- [ ] Bio maydon (max 200 belgi)
- [ ] Avatar tanlash — `expo-image-picker` (gallery) yoki kamera
- [ ] Avatar yuklash — `FormData` bilan multipart POST
- [ ] Saqlash tugmasi — `PATCH /users/me` + avatar bo'lsa `POST /users/me/avatar`

**B. Settings:**
- [ ] Notification sozlamalari (local toggle — FCM subscription on/off)
- [ ] "Chiqish" (Logout) — `POST /auth/logout` → token tozalash → LoginScreen ga redirect
- [ ] "Akkauntni o'chirish" — confirmation modal → `DELETE /auth/account`
- [ ] App versiyasi ko'rsatish (static, `expo-constants`)

**C. Security:**
- [ ] Avatar yuklashda mimetype tekshirish (`image/jpeg` | `image/png` faqat)
- [ ] Fayl hajmi: max 5MB (client side check)
- [ ] TypeScript: `tsc --noEmit` o'tadi ✅

---

### T-J026 | P1 | [MOBILE] | Bloklangan akkaunt — to'liq handle qilish

- **Sana:** 2026-03-21
- **Mas'ul:** pending[Jafar]
- **Sprint:** S4
- **Fayllar:** `apps/mobile/src/navigation/AppNavigator.tsx`, `apps/mobile/src/screens/Auth/BlockedScreen.tsx`, `apps/mobile/src/api/client.ts`
- **Holat:** ❌ Boshlanmagan

**Backend tomonida nima bo'ladi (allaqachon tayyor):**
1. Admin userga blok qo'yadi → Redis `auth:blocked:{userId}` set qilinadi
2. Barcha refresh tokenlar o'chiriladi (qayta login qila olmaydi)
3. Socket.io ulanishi uziladi (`ROOM_CLOSED { reason: 'account_blocked' }` yuboriladi)
4. Keyingi har qanday API so'rov → **HTTP 403** `{ success: false, message: 'Account is blocked' }`

**Mobile da bajarilishi kerak:**

**A. API client interceptor — 403 ushlab olish:**
```typescript
// apps/mobile/src/api/client.ts — response interceptor:
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 &&
        error.response?.data?.message === 'Account is blocked') {
      // Token tozalash
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      // BlockedScreen ga redirect
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Blocked' }] });
    }
    return Promise.reject(error);
  }
);
```

**B. BlockedScreen:**
```
- Qizil qalqon/lock icon (tasvir)
- "Akkauntingiz bloklangan" sarlavha
- Admin bilan bog'lanish: support email (ilovaga hardcode)
- "Chiqish" tugmasi → token tozalash → LoginScreen
- Login tugmasini ko'rsatma (qayta login qilib ham kirish imkoni yo'q)
```

**C. Socket eventlarni handle qilish:**
```typescript
// WatchPartyScreen da:
socket.on('ROOM_CLOSED', ({ reason }) => {
  if (reason === 'account_blocked') {
    navigation.reset({ index: 0, routes: [{ name: 'Blocked' }] });
    return;
  }
  // boshqa reason lar uchun oldingi logika
});
```

**D. Navigation:**
- `Blocked` ekranini `AppNavigator` ga qo'shish
- Auth guard: login check + block check (token bor lekin `isBlocked` tekshirish kerak emas, backend handle qiladi)

**Subtasklar:**
- [ ] `BlockedScreen.tsx` — UI
- [ ] `client.ts` da 403 interceptor — `Account is blocked` case uchun
- [ ] `AppNavigator` da `Blocked` ekrani + reset navigation
- [ ] `WatchPartyScreen` da `account_blocked` reason handler
- [ ] Test: admin blocks → 5 sekund ichida app BlockedScreen ko'rsatadi
- [ ] TypeScript: `tsc --noEmit` o'tadi ✅

---

### T-J019 | P2 | [MOBILE] | FriendSearch — backend search natijasi bo'sh kelishi mumkin

- **Sana:** 2026-03-21
- **Muammo:** Backend `searchUsers` avval `authId` qaytarardi, `_id` emas — mobile `_id` kutadi. Fix qilindi (authId → _id mapping), lekin Redis ishlamaganda online status tekshirish xato berishi mumkin
- **Ta'sir:** Do'st qidirish ishlashi, lekin online status noto'g'ri ko'rinishi mumkin
- **Bog'liq:** T-J016 (Redis config)

### T-J020 | P2 | [MOBILE] | Docker Compose build xatosi — service containerlar build bo'lmaydi

- **Sana:** 2026-03-21
- **Muammo:** `docker compose -f docker-compose.dev.yml up -d` da service containerlar (auth, user, content...) build vaqtida `npm install` xato beradi
- **Ta'sir:** Faqat infra (mongo, redis, elasticsearch) Docker orqali ishlaydi, servicelar lokal ishga tushiriladi
- **Fayl:** `Dockerfile.dev`, `docker-compose.dev.yml`

---

## ⚠️ MAS'ULSIZ WEB TASKLAR (Jafar endi mobile da)

### T-J015 | P1 | [WEB] | BUG: Auth hydration flash + authFetch duplicate + socket stale token + middleware

- **Sana:** 2026-03-11
- **Mas'ul:** ❌ MAS'UL YO'Q (Jafar mobile ga o'tdi 2026-03-18)
- **Holat:** ❌ Boshlanmagan
- **Fayllar:**
  - `apps/web/src/store/auth.store.ts` (25-75-qator)
  - `apps/web/src/app/(app)/friends/page.tsx` (21-36-qator)
  - `apps/web/src/app/(app)/battle/page.tsx` (12-27-qator)
  - `apps/web/src/lib/socket.ts` (7-16-qator)
  - `apps/web/src/middleware.ts` (9-qator)
  - `apps/web/src/app/(app)/watch/[movieId]/page.tsx` (37, 50-61-qator)
- **Muammo:**
  - Zustand `persist` hydration: SSR da `user=null` → client da `user=obj` → **flash of unauthenticated UI** + hydration mismatch
  - `friends/page.tsx` va `battle/page.tsx` da **duplicate** `authFetch` utility — `apiClient` ishlatmaydi → token refresh interceptor **bypass**
  - Socket: birinchi token bilan yaratiladi, refresh dan keyin **eski token** qoladi
  - Middleware: cookie **mavjudligini** tekshiradi, **validligini** emas — expired token bilan protected page flash
  - Watch page: raw `fetch` auth header siz — progress saqlash **ishlamaydi**
- **Bajarilishi kerak:**
  - [ ] Zustand `onRehydrateStorage` + `_hasHydrated` flag qo'shish
  - [ ] `authFetch` larni o'chirish → `apiClient` ishlatish
  - [ ] Socket: token o'zgarganda reconnect qilish
  - [ ] Middleware: JWT expiry tekshirish (decode, exp field)
  - [ ] Watch page: `apiClient` ga o'tish

---

### T-J007 | P2 | [WEB] | SEO + Performance + i18n + PWA — qolgan qismi

- **Sprint:** S5
- **Mas'ul:** ❌ MAS'UL YO'Q (Jafar mobile ga o'tdi 2026-03-18)
- **Holat:** ⚠️ QISMAN (manifest.json + robots.txt ✅, Playwright tests qisman ✅)
- **Subtasks:** TASK-J-030..TASK-J-038
- **Qolgan ishlar:**
  - [ ] `next-intl` — uz/ru/en i18n setup
  - [ ] Dynamic OG images (`/api/og` endpoint)
  - [ ] WCAG AA accessibility audit + fixes
  - [ ] Playwright E2E to'liq test suite

---

# ═══════════════════════════════════════

# 🟣 UMUMIY — BARCHA JAMOA

# ═══════════════════════════════════════

### T-C006 | P1 | [IKKALASI] | WebView Video Player — har qanday saytdan video ko'rish

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan (Mobile — asosiy), Saidazim (Backend — minimal)
- **Holat:** ✅ Mobile M1-M7 TUGADI (2026-03-19) | Backend B1-B2 pending[Saidazim] | Web W1 ochiq
- **Sprint:** S2-S3
- **Prioritet:** P1 — foydalanuvchilar faqat YouTube ko'ra olmoqda, boshqa saytlar ishlamayapti

---

#### MUAMMO

Hozirda CineSync da video faqat 2 xil manba bilan ishlaydi:
1. **YouTube** — embed iframe API orqali ✅
2. **Direct .mp4/.m3u8** — VideoPlayer (HLS.js) orqali ✅

Boshqa saytlar (uzmovi.tv, kinogo.cc, filmix va h.k.) **ishlamaydi** chunki:
- `X-Frame-Options: SAMEORIGIN` — iframe da ochib bo'lmaydi
- yt-dlp — faqat ~30% saytlarni qo'llab-quvvatlaydi, CORS/Referer muammo qoladi
- Headless browser (Puppeteer) — server resursi og'ir, sekin, bandwidth qimmat

**Yechim:** React Native **WebView** yondashuvi (Rave.io modeli).
WebView = ichki brauzer. Saytni to'g'ridan-to'g'ri ichida ochadi, X-Frame-Options muammo emas.
Video URL ni extract qilish KERAK EMAS — sayt o'zi video ni o'ynatadi, biz faqat JS injection
orqali `<video>` elementni topib, play/pause/seek ni boshqaramiz.

---

#### ARXITEKTURA

```
Foydalanuvchi URL kiritadi (uzmovi.tv/..., kinogo.cc/..., har qanday sayt)
        │
        ▼
┌────────────────────── React Native ──────────────────────┐
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  react-native-webview                                │ │
│  │                                                      │ │
│  │  Sayt sahifasi yuklangan (uzmovi.tv/...)            │ │
│  │  Sayt O'ZI video ni o'ynatadi                       │ │
│  │  X-Frame-Options MUAMMO EMAS (WebView ≠ iframe)     │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │  JS Injection Layer                                  │ │
│  │                                                      │ │
│  │  1. MutationObserver — <video> element paydo         │ │
│  │     bo'lishini kuzatadi (nested iframe ham)          │ │
│  │  2. video.play/pause/seek — boshqarish               │ │
│  │  3. video.currentTime/duration — holatni olish       │ │
│  │  4. postMessage → React Native ga yuborish           │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │                                         │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │  Sync Engine (mavjud Watch Party infra)              │ │
│  │                                                      │ │
│  │  Owner: WebView → JS inject → video event →          │ │
│  │         postMessage → React Native → Socket.io →     │ │
│  │         Backend → Members                            │ │
│  │                                                      │ │
│  │  Member: Socket.io → React Native →                  │ │
│  │          injectJavaScript → video.currentTime =      │ │
│  │          video.play()/pause()                        │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

#### MOBILE TASKLARI (Emirhan — `apps/mobile/`)

**Fayl:** `apps/mobile/src/components/video/WebViewPlayer.tsx` (yangi)
**Fayl:** `apps/mobile/src/components/video/UniversalPlayer.tsx` (o'zgartirish)
**Fayl:** `apps/mobile/src/screens/party/WatchPartyScreen.tsx` (o'zgartirish)

- [x] **M1. `WebViewPlayer` komponenti yaratish** ✅ 2026-03-19
- [x] **M2. JS Injection — video elementni topish** ✅ 2026-03-19 (MutationObserver + iframe detect — WebViewAdapters.ts)
- [x] **M3. JS Injection — video boshqarish (Owner)** ✅ 2026-03-19 (play/pause/seeked/progress events → postMessage)
- [x] **M4. JS Injection — video boshqarish (Member)** ✅ 2026-03-19 (injectWithRetry — useImperativeHandle)
- [x] **M5. UniversalPlayer ga WebView integratsiya** ✅ 2026-03-19 (detectVideoPlatform → 'webview' branch)

- [x] **M6. UX yaxshilash** ✅ 2026-03-17
  - Loading overlay — sahifa yuklanayotganda spinner
  - Sayt reklamalarini bloklash (reklama domainlarni intercept qilish)
  - `onNavigationStateChange` — sayt redirect qilsa ogohlantirish
  - Fullscreen mode — statusbar yashirish, WebView to'liq ekran
  - Error handling — sayt yuklanmasa fallback UI

- [x] **M7. Saytga moslashgan adapterlar** ✅ 2026-03-17
  - uzmovi.tv uchun maxsus adapter (iframe tuzilishi ma'lum)
  - kinogo.cc uchun maxsus adapter
  - Generic fallback — `<video>` tag qidirish
  - Adapter registry: `{ hostname: adapterFunction }`

---

#### BACKEND TASKLARI (Saidazim — `services/watch-party/`)

**Backend o'zgarishlar MINIMAL — mavjud sync engine allaqachon ishlaydi.**

- [x] **B1. Room model — `videoPlatform` ga `'webview'` qo'shish** ✅ Done.md F-131
- [x] **B2. Sync event tolerance** ✅ Done.md F-131

---

#### SHARED TYPES (kelishib o'zgartirish — LOCK PROTOCOL)

- [x] **SH1. `shared/types/` — VideoPlatform type yangilash** ✅ Done.md F-131

---

#### WEB FALLBACK (Jafar — `apps/web/`)

Web brauzerda WebView yondashuvi **IMKONSIZ** (brauzer sandbox). Shuning uchun:

- [ ] **W1. "Faqat mobile da" xabar**
  - `UniversalPlayer` da `platform === 'other'` bo'lganda:
  - "Bu video faqat CineSync mobile ilovasida ko'rish mumkin" xabar ko'rsatish
  - App Store / Play Store havola berish
  - Bu faqat 1 ta UI o'zgartirish

---

#### MA'LUM MUAMMOLAR VA CHEKLOVLAR

```
⚠️ Nested iframe: Same-origin policy tufayli cross-domain iframe ichidagi
   <video> ga JS injection bilan kirish MUMKIN EMAS. Yechim: iframe src URL
   ni aniqlash va to'g'ridan WebView da ochish.

⚠️ DRM kontentlar: Netflix, Disney+ kabi Widevine DRM himoyalangan saytlar
   ISHLAMAYDI (rasmiy shartnoma kerak — Rave.io modeli). Bu task faqat
   DRM-SIZ saytlar uchun (uzmovi.tv, kinogo.cc va shu kabilar).

⚠️ Sync aniqligi: ~150-400ms kechikish (JS inject + postMessage + Socket).
   YouTube embed (~50ms) dan past. Ko'p hollarda sezilmaydi.

⚠️ Sayt tuzilishi o'zgarsa: Adapter buzilishi mumkin. Maintenance kerak.

⚠️ Reklama/popup: Ba'zi saytlar aggressive reklama ko'rsatadi.
   Ad-blocker logika kerak (ixtiyoriy).

⚠️ Expo compatibility: react-native-webview Expo da ishlaydi
   (expo-dev-client kerak, Expo Go da cheklov bor).
```

---

#### TESTLASH REJASI

```
1. uzmovi.tv → WebView da ochilishi, video topilishi, play/pause ishlashi
2. YouTube → mavjud YouTubePlayer ishlatilishi (regresiya tekshirish)
3. Direct .mp4 → mavjud DirectPlayer ishlatilishi (regresiya tekshirish)
4. Watch Party sync — Owner WebView da play → Member sinxron ko'rishi
5. Nested iframe sayt — iframe URL aniqlanishi, video topilishi
6. Xato URL — error handling, fallback UI ko'rinishi
```

---

#### KUTILGAN NATIJA

Foydalanuvchi **har qanday** video sayt URL ni kiritganda:
- Mobile: WebView ochiladi → sayt o'zi video o'ynatadi → sync ishlaydi
- Web: "Mobile da ko'ring" xabar ko'rinadi
- Watch Party: Owner WebView da ko'radi → Members sinxron ko'radi

---

### ✅ T-C008 | TUGADI → Done.md F-125

---

### T-C009 | P1 | [IKKALASI] | Socket event payload mismatch + web hardcoded event strings

- **Sana:** 2026-03-11
- **Mas'ul:** Emirhan (Mobile) + Saidazim (Backend payload)
- **Holat:** ✅ Mobile qismi TUGADI (2026-03-12) | Web qismi ochiq (T-C008 dan keyin)
- **Fayllar:**
  - `apps/web/src/hooks/useWatchParty.ts` — 14+ hardcoded event string
  - `apps/web/src/hooks/useVoiceChat.ts` — 8+ hardcoded event string
  - `services/watch-party/src/socket/watchParty.socket.ts` (93, 116-119-qator)
  - `shared/src/constants/socketEvents.ts`
- **Qolgan ishlar (❌ MAS'UL YO'Q — Jafar mobile ga o'tdi 2026-03-18):**
  - [ ] **Web:** `@cinesync/shared` dan `SERVER_EVENTS`/`CLIENT_EVENTS` import qilish (T-C008 dan keyin)
  - [ ] **Web:** barcha hardcoded event string larni shared constant bilan almashtirish
  - [ ] **Backend (ixtiyoriy):** Server payload ga `members[]` qo'shish

---


### T-C010 | P1 | [IKKALASI] | Universal Video Sync — extract → play → sync pipeline end-to-end

- **Sana:** 2026-03-18
- **Mas'ul:** Saidazim (Backend ✅ TAYYOR) + Emirhan (Mobile ✅ TAYYOR)
- **Sprint:** S6
- **Holat:** ✅ TUGADI → Done.md F-135
- **Maqsad:** Foydalanuvchi HAR QANDAY URL ni WatchParty ga qo'yib, do'stlar bilan sinxron ko'ra olishi

---

## 🟢 BACKEND — TAYYOR (Saidazim, 2026-03-18)

### Endpoint: `POST /api/v1/content/extract`

**Production URL:** `https://content-production-4e08.up.railway.app/api/v1/content/extract`

**Auth:** `Authorization: Bearer <accessToken>` header kerak

**Request:**
```json
POST /api/v1/content/extract
Content-Type: application/json
Authorization: Bearer <accessToken>

{ "url": "https://uzmovi.tv/film/..." }
```

**Response — muvaffaqiyat:**
```json
HTTP 200
{
  "success": true,
  "data": {
    "title": "Film nomi",
    "videoUrl": "https://cdn.example.com/video.m3u8",
    "poster": "https://cdn.example.com/poster.jpg",
    "platform": "generic",
    "type": "hls",
    "duration": 5400,
    "isLive": false,
    "useProxy": false
  }
}
```

**Response — YouTube (maxsus holat):**
```json
HTTP 200
{
  "success": true,
  "data": {
    "title": "YouTube video nomi",
    "videoUrl": "...",
    "platform": "youtube",
    "type": "mp4",
    "useProxy": true   ← BU MUHIM! true bo'lsa backend proxy ishlatiladi
  }
}
```

> ⚠️ YouTube da `useProxy: true` bo'lsa — `videoUrl` ni bevosita ishlatma!
> Buning o'rniga: `GET /api/v1/youtube/stream?url=<original-youtube-url>&token=<accessToken>`
> Bu endpoint Range request qo'llab-quvvatlaydi (seeking ishlaydi).

**Response — extract muvaffaqiyatsiz:**
```json
HTTP 422
{
  "success": false,
  "data": null,
  "message": "Could not extract a playable video URL from: uzmovi.tv",
  "errors": null,
  "reason": "unsupported_site"   ← "unsupported_site" | "drm" | "timeout"
}
```

**reason turlari:**
| reason | Ma'nosi | Mobile da nima qilish kerak |
|--------|---------|----------------------------|
| `unsupported_site` | Sayt qo'llab-quvvatlanmaydi | WebView fallback |
| `drm` | DRM himoyalangan (Netflix kabi) | "Bu kontent DRM himoyalangan" xabar |
| `timeout` | 20 sekundda javob kelmadi | Retry yoki WebView fallback |

**Qo'llab-quvvatlanadigan platformalar (yt-dlp + scraper):**
- YouTube, Vimeo, TikTok, Dailymotion, Rutube, Facebook, Instagram, Twitch, VK
- tv.mover.uz, uzmovi.tv → genericExtractor (iframe depth=2, Referer header)
- To'g'ridan `.mp4` yoki `.m3u8` URL → hech narsa qilmasdan qaytaradi
- 700+ sayt yt-dlp orqali

**Redis cache:** 2 soat — bir URL uchun backend qayta hisoblamas

---

## 📱 EMIRHAN — MOBILE DA NIMA QILISH KERAK

### Holat tekshiruvi (muhim!)

T-E040 "TUGADI" belgilangan, lekin quyidagi integratsiyalar tekshirilishi kerak:

**Savol 1:** `UniversalPlayer.tsx` da `POST /content/extract` chaqirilayaptimi?
- Agar YO'Q → quyidagi E40-1..E40-3 larni bajarish kerak

**Savol 2:** YouTube da `useProxy: true` bo'lganda `/youtube/stream` endpoint ishlatilayaptimi?
- Agar YO'Q → E40-6 ni bajarish kerak

---

### E40-1. `content.api.ts` — `extractVideo()` metodi

```typescript
// apps/mobile/src/api/content.api.ts ga qo'shish:

export interface VideoExtractResult {
  title: string;
  videoUrl: string;
  poster: string;
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'generic' | 'unknown';
  type: 'mp4' | 'hls';
  duration?: number;
  isLive?: boolean;
  useProxy?: boolean;
}

export interface VideoExtractError {
  success: false;
  reason: 'unsupported_site' | 'drm' | 'timeout';
  message: string;
}

export async function extractVideo(
  url: string
): Promise<VideoExtractResult | null> {
  try {
    const response = await apiClient.post<{ success: true; data: VideoExtractResult }>(
      '/content/extract',
      { url }
    );
    return response.data.data;
  } catch (error: unknown) {
    // 422 = extract failed (unsupported_site / drm / timeout)
    // null qaytarish → WebView fallback
    return null;
  }
}
```

---

### E40-2. `useVideoExtraction` hook

```typescript
// apps/mobile/src/hooks/useVideoExtraction.ts

import { useState } from 'react';
import { extractVideo, VideoExtractResult } from '../api/content.api';

interface ExtractionState {
  loading: boolean;
  result: VideoExtractResult | null;
  fallbackMode: boolean;  // true → WebView ishlatilsin
  error: string | null;
}

export function useVideoExtraction() {
  const [state, setState] = useState<ExtractionState>({
    loading: false,
    result: null,
    fallbackMode: false,
    error: null,
  });

  const extract = async (url: string) => {
    // To'g'ridan stream URL bo'lsa — backend ga yuborma
    if (/\.(mp4|m3u8|webm)(\?|$)/i.test(url)) {
      const type = /\.m3u8/i.test(url) ? 'hls' : 'mp4';
      setState({
        loading: false,
        result: { title: '', videoUrl: url, poster: '', platform: 'generic', type },
        fallbackMode: false,
        error: null,
      });
      return;
    }

    setState({ loading: true, result: null, fallbackMode: false, error: null });

    const result = await extractVideo(url);

    if (result) {
      setState({ loading: false, result, fallbackMode: false, error: null });
    } else {
      // Extract muvaffaqiyatsiz → WebView fallback
      setState({ loading: false, result: null, fallbackMode: true, error: null });
    }
  };

  return { ...state, extract };
}
```

---

### E40-3. `UniversalPlayer.tsx` — extraction flow

```typescript
// UniversalPlayer ichida:
// URL kelganda avval extractVideo() chaqir

useEffect(() => {
  if (!videoUrl) return;
  void extract(videoUrl);
}, [videoUrl]);

// Player tanlash:
if (loading) {
  return <ExtractionLoading />; // spinner + "Video aniqlanmoqda..."
}

if (fallbackMode || !result) {
  return <WebViewPlayer url={videoUrl} ... />; // mavjud WebView
}

if (result.platform === 'youtube' && result.useProxy) {
  // ⚠️ MUHIM: YouTube proxy endpoint ishlatilsin
  const token = await getAccessToken(); // tokenni olish
  const proxyUrl = `https://content-production-4e08.up.railway.app/api/v1/youtube/stream?url=${encodeURIComponent(videoUrl)}&token=${token}`;
  return <DirectPlayer url={proxyUrl} type="mp4" />;
}

// Boshqa barcha holat — expo-av to'g'ridan
return <DirectPlayer url={result.videoUrl} type={result.type} />;
```

---

### E40-4. WatchPartyScreen — URL kiritish UX

```typescript
// URL kiritilganda loading state ko'rsatish:
const { loading, result, fallbackMode, extract } = useVideoExtraction();

const handleUrlSubmit = async (url: string) => {
  await extract(url);
  // extract() tugagach state avtomatik yangilanadi
};

// UI:
{loading && (
  <View>
    <ActivityIndicator />
    <Text>Video aniqlanmoqda... (max 20 sek)</Text>
  </View>
)}

{fallbackMode && (
  <View>
    <Text>⚠️ Bu sayt to'g'ridan ochiladi (WebView rejimi)</Text>
    <Text>Sinxronlash qisman ishlashi mumkin</Text>
  </View>
)}

{result && !fallbackMode && (
  <View>
    <Text>✅ Video topildi: {result.title}</Text>
    {result.poster ? <Image source={{ uri: result.poster }} /> : null}
  </View>
)}
```

---

### E40-5. ExtractionLoading komponenti (oddiy)

```typescript
// apps/mobile/src/components/video/ExtractionLoading.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function ExtractionLoading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E50914" />
      <Text style={styles.text}>Video aniqlanmoqda...</Text>
      <Text style={styles.sub}>Saytdan video URL olinmoqda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0F' },
  text: { color: '#fff', marginTop: 16, fontSize: 16 },
  sub: { color: '#888', marginTop: 8, fontSize: 13 },
});
```

---

### ✅ Tekshirish ro'yxati (Emirhan uchun)

```
□ content.api.ts da extractVideo() bor
□ useVideoExtraction hook ishlaydi
□ UniversalPlayer extraction loading ko'rsatadi
□ extraction muvaffaqiyatli → expo-av da ochiladi
□ extraction fail → WebView da ochiladi
□ YouTube useProxy:true → /youtube/stream endpoint ishlatiladi
□ To'g'ridan .mp4/.m3u8 URL → extract chaqirilmaydi, to'g'ri play
□ WatchParty: URL kiritganda extraction loading ko'rinadi

Test URL lar:
  Direct:   https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8  (ishlashi kerak, extract yo'q)
  YouTube:  https://www.youtube.com/watch?v=dQw4w9WgXcQ          (useProxy:true)
  Generic:  har qanday video sayt URL
```

---

**Acceptance criteria:**
- [ ] tv.mover.uz dan video URL → WatchParty da sinxron ko'rish
- [ ] uzmovi.tv dan video URL → WatchParty da sinxron ko'rish
- [ ] YouTube URL → backend extract → expo-av (proxy) → sinxron ko'rish
- [ ] Noma'lum sayt → WebView fallback → hech bo'lmasa ko'rsa bo'ladi
- [ ] Extract vaqtida loading UI ko'rinadi
- [ ] Extract fail bo'lsa foydalanuvchiga tushunarli xabar

---

### T-C004 | P2 | [IKKALASI] | Dizayn Tasklari

- **Sprint:** S2-S5
- **Subtasks:** TASK-D-002..TASK-D-010
- **Output:** MovieCard hover, Hero backdrop, online status vizual, emoji float, achievement animation, battle progress, skeleton loading, Storybook, dark mode QA

---

## 📊 STATISTIKA (2026-03-15 yangilandi)

| Jamoa    | Tugallandi | Qolgan | Yangi (2026-03-15) |
| -------- | ---------- | ------ | ---- |
| Saidazim | T-S001..T-S008, T-S010, T-S011, T-S030, T-S031, T-S032 ✅ | T-S005b, T-S016 | T-S032 (video extractor) |
| Emirhan  | T-E015..T-E037 ✅ | T-E038, T-E039 | T-E038 (search crash), T-E039 (video extractor) |
| Jafar    | T-J001..T-J006, T-J008..T-J014 ✅ | ~~T-J007, T-J015~~ (web, mas'ulsiz) | 2026-03-18 dan MOBILE zona |
| Umumiy   | T-C001..T-C003, T-C005 ✅ | T-C004, T-C006 | Code: T-C007 \| Arch: T-C008, T-C009 |

### Code Review + Architecture Review Summary — 2026-03-11

```
JAMI TOPILGAN MUAMMOLAR:  ~160 ta (kod + arxitektura)

Code Review:     ~100 ta (3 zona)
Architecture:     ~60 ta (infra + types + events)

P0 (kritik):              17 ta  → DARHOL tuzatish kerak
P1 (muhim):               38 ta  → Sprint ichida tuzatish
P2 (o'rta):               42 ta  → Keyingi sprint
P3 (past):                32 ta  → Backlog

22 ta YANGI TASK yaratildi:
  Backend (Saidazim):  T-S017..T-S025 (9 task)
  Mobile (Emirhan):    T-E020..T-E023 (4 task)
  Web (Jafar):         T-J012..T-J015 (4 task)
  Umumiy (IKKALASI):   T-C007..T-C009 (3 task)
  + oldingi:           T-C006 (WebView)

TOP 5 XAVFLI:
  🔴 T-S017 — Internal API ochiq (har kim ball qo'sha oladi)
  🔴 T-C008 — Web shared types yo'q (20+ type divergence)
  🔴 T-S023 — Admin DB anti-pattern + Docker healthcheck yo'q
  🔴 T-J012 — Token XSS xavfi (localStorage)
  🔴 T-J013 — tsc/ESLint build da o'chirilgan

TOP 3 ARXITEKTURA:
  🏗️ T-S023 — Admin shared DB anti-pattern → REST API ga o'tish
  🏗️ T-S024 — Socket.io scale qilolmaydi (Redis adapter yo'q)
  🏗️ T-C008 — Web client shared package bilan bog'lanmagan (ROOT CAUSE)
```

---

_docs/Tasks.md | CineSync | Yangilangan: 2026-03-11_
