# CineSync → Rave Transformation Plan

**Loyiha:** CineSync (papka: `Rave/`) — Rave (rave.io) ning funktsional klonini qurish
**Hujjat versiyasi:** 1.0
**Yaratilgan:** 2026-04-14
**Muallif:** Claude (Opus 4.6) + Project owner

---

## MUNDARIJA

1. [Qisqa Xulosa (Executive Summary)](#1-qisqa-xulosa)
2. [Muammo Tahlili](#2-muammo-tahlili)
3. [Rave Reverse Engineering](#3-rave-reverse-engineering)
4. [UX Flow Spetsifikatsiyasi](#4-ux-flow-spetsifikatsiyasi)
5. [Texnik Arxitektura Variantlari](#5-texnik-arxitektura-variantlari)
6. [Tavsiya Etilgan Implementatsiya (Hybrid)](#6-tavsiya-etilgan-implementatsiya)
7. [Scope Cleanup](#7-scope-cleanup)
8. [Vaqt va Xarajat](#8-vaqt-va-xarajat)
9. [Keyingi Qadamlar](#9-keyingi-qadamlar)
10. [Ilovalar (Appendix)](#10-ilovalar)

---

## 1. QISQA XULOSA

### Maqsad
CineSync mobile ilovasini Rave (rave.io watch-party app) ning **funktsional klonini** qilish. Interfeys (brending, ranglar) o'zgacha bo'lishi mumkin, lekin **UX flow va funksionallik Rave bilan bir xil** bo'lishi shart.

### Asosiy Muammo
Loyihaning 3 hafta davomida 173 commit'dan ~50% vaqti **Rave da kerak bo'lmagan** narsalarga sarflangan:
- Movie catalog + Elasticsearch
- yt-dlp + Playwright + HLS pipeline
- Battle / Achievement / Stats gamification
- Admin panel
- Web app (Next.js)

Birinchi haqiqiy Rave-style commit (`da133f4`) faqat **5-haftada** paydo bo'lgan. Bundan oldingi vaqt CineSync (catalog-centric Netflix-style app) qurishga ketgan.

### Asosiy Yechim
1. **Entry point tuzatish** — App ochilganda Rooms tab (Source Picker emas, chunki user avval room yaratadi)
2. **Room ichidan "+" tugma** → Source Picker → Browser → URL → Video topilgach popup → `CHANGE_MEDIA` event
3. **Sync mexanizmini Hybrid qilish** (Socket.io + WebRTC DataChannel)
4. **Scope cleanup** — Battle, Achievement, Stats, Movie catalog, Admin panel'ni ikkinchi darajaga tushirish

---

## 2. MUAMMO TAHLILI

### 2.1 Joriy holat (CineSync hozir qanday ishlaydi)

```
App ochiladi
  ↓
Home tab (Netflix-stil: trending filmlar, genre chiplari, Continue Watching)
  ↓  [4-5 tap kerak Watch Party ga]
Rooms tab ga o'tish
  ↓
Create tugmasi
  ↓
3-tab modal (Rooms/Create/Join)
  ↓
Source Picker (modal ichida)
  ↓
URL kiritish
  ↓
Video topilgach bottom bar chiqadi
  ↓
"Roomga qo'shilish" bosilganda YANGI ROOM YARATILADI (hozir)
```

**Muammolar:**
- **Entry point buzilgan** — Rave'da 1-2 tap, CineSync'da 5+ tap
- **Source Picker Create-flow ichida** — roomga kirgach browser ocha olmaysiz
- **Bottom bar mantiq noto'g'ri** — yangi room yaratadi, mavjud roomga `CHANGE_MEDIA` yubormaydi
- **Sync lag** — Socket.io server-authoritative, 50-150ms lag

### 2.2 Maqsad holat (Rave-style)

```
App ochiladi
  ↓
Rooms tab (yoki asosiy ekran)
  ↓  [1 tap]
"Room yaratish" tugma
  ↓
Bo'sh room ochiladi (placeholder player)
  ↓
"+" tugma (owner only) bosiladi
  ↓
Source Picker chiqadi:
  ┌────────────────────────────┐
  │ 🌐 Browser                 │
  │ ▶ YouTube                  │
  │ 🎵 Spotify                 │
  │ 📺 Twitch                  │
  │ 📱 VK / Rutube             │
  │ ... boshqalar              │
  └────────────────────────────┘
  ↓
"Browser" tanlanadi
  ↓
URL bar ochiladi: https://...
  ↓
User istalgan saytga kiradi (uzmovi, kinogo, youtube, anime sayti...)
  ↓
Video o'ynay boshlaganda DOM scan + URL intercept aniqlaydi
  ↓
Popup chiqadi: "Видео найдено → Roomga uzatish"
  ↓
Bosiladi → CHANGE_MEDIA event socket orqali yuboriladi
  ↓
Browser yopiladi → Roomga qaytadi
  ↓
Player avtomatik yangi videoni yuklaydi
  ↓
Owner play/pause/seek → BARCHA A'ZOLARDA SYNC
```

### 2.3 Asosiy bo'shliqlar (Gaps)

| # | Komponent | Joriy holat | Kerak | Fayl |
|---|---|---|---|---|
| 1 | Entry point | `HomeScreen` (Netflix) | `RoomsScreen` (yoki SourcePicker) | `apps/mobile/src/screens/home/HomeScreen.tsx:79-193` |
| 2 | Roomda "+" tugma | ❌ Yo'q | Kerak — Source Picker ochadi | `apps/mobile/src/screens/modal/WatchPartyScreen.tsx:394-403` (hozir `changeMediaBtn` bor) |
| 3 | MediaWebView popup | Bottom bar (f71e5b9 da o'zgartirilgan) | Popup qaytarish yoki bar'ni to'g'rilash | `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx:2` |
| 4 | "Roomga uzatish" mantiq | Yangi room yaratadi | `CHANGE_MEDIA` event yuboradi, yangi room EMAS | `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx:209` |
| 5 | Sync mexanizmi | Socket.io (50-150ms lag) | Hybrid (WebRTC DataChannel, 5-30ms) | `apps/mobile/src/socket/client.ts`, `apps/mobile/src/hooks/useWatchParty.ts` |
| 6 | Brand ranglari | 3 xil spec (Netflix red, Violet, Aqua) | 1 ta source-of-truth | `apps/mobile/src/theme/colors.ts`, `CLAUDE.md:423`, `docs/SCREENFLOW_DESIGN_PROMPT.md` |

---

## 3. RAVE REVERSE ENGINEERING

### 3.1 Binary tahlil jarayoni

`Rave-x64-Setup-1.18.6.exe` (151 MB) installer ochildi quyidagi tartibda:

```bash
# 1. 7zip-bin npm paketi o'rnatildi (Windows'da 7-Zip binary bilan)
npm install --no-save 7zip-bin

# 2. NSIS installer ochildi
node unpack-rave.mjs
# Natija: rave-unpack/ — Electron app + resources
# 187 fayl, 39 papka

# 3. app.asar ochildi (@electron/asar paketi)
node extract-asar.mjs
# Natija: rave-app-src/ — JavaScript kod + node_modules
```

**Yordamchi skriptlar (loyihada saqlangan):**
- `unpack-rave.mjs` — NSIS installer → rave-unpack/
- `extract-asar.mjs` — app.asar → rave-app-src/

### 3.2 Fayl tuzilishi (asosiy komponentlar)

```
rave-app-src/
├── package.json                    (metadata: rave-desktop v1.18.6)
├── app.html                        (asosiy oyna HTML)
├── dm-window.html                  (Direct Message oyna)
├── login.html, notifications.html, splashPage.html
├── *.proto                         (Google FCM / Protobuf push)
├── dist/
│   ├── main.prod.js       (6.1 MB)  — Electron main process
│   ├── vendor.prod.js     (21.8 MB) — React + Redux + 3rd party
│   ├── renderer.prod.js   (909 KB)  — UI render logic
│   ├── common.prod.js     (1.5 MB)  — shared code
│   ├── dmWindow.prod.js   (786 KB)  — DM oyna
│   ├── preload.js         (17 KB)   — IPC bridge (O'QILDI ✅)
│   ├── switchboard.child.js (5.8 KB) — P2P SYNC ENGINE
│   ├── honeygain.child.js (3.7 KB)  — Bandwidth sharing SDK
│   ├── infatica.child.js  (3.8 KB)  — Bandwidth sharing SDK
│   ├── pawns.child.js     (5.5 KB)  — Bandwidth sharing SDK
│   ├── repocket.child.js  (8.8 KB)  — Bandwidth sharing SDK
│   └── botGuardScript.js  (4.9 KB)  — YouTube PoToken / bot guard
└── node_modules/
    ├── switchboard-js/             — Rust NAPI-RS native binding
    ├── @aracna/fcm/                — FCM push receiver
    ├── @honeygain/node-sdk/        — Honeygain integration
    └── @geonode/repocket-peer-client/ — Repocket integration
```

### 3.3 Switchboard P2P Mesh Arxitekturasi

**Switchboard** — Rave'ning o'z **Rust-asoslangan P2P mesh sync engine**'i.

```
┌──────────────────────────────────────────────────────────┐
│ Rave Desktop (Electron)                                  │
├──────────────────────────────────────────────────────────┤
│ renderer.prod.js (React UI)                              │
│    ↓ window.switchboard.call(params)                     │
│ preload.js (IPC bridge)                                  │
│    ↓ ipcRenderer.invoke('SWITCHBOARD_METHOD')            │
│ main.prod.js (Electron main)                             │
│    ↓ child_process.fork()                                │
│ switchboard.child.js (Node.js worker)                    │
│    ↓ require('switchboard-js')                           │
│ switchboard-js (NAPI-RS Rust binding)                    │
│    ↓ native binary (.node)                               │
│ ┌──────────┬──────────┬──────────┐                       │
│ │  Client  │  Proxy   │  Relay   │                       │
│ └──────────┴──────────┴──────────┘                       │
│    ↓                                                      │
│ WSS Signalling:                                           │
│   wss://cdn01.godmademefunky.com (blue deployment)       │
│   wss://cdn02.godmademefunky.com (red deployment)        │
│    ↓                                                      │
│ WebRTC Full-Mesh P2P                                     │
│   RTCPeerConnection + RTCDataChannel                     │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Muhim IPC kanallar (preload.js dan aniqlangan)

**Video sync uchun:**
```
sync                          ← video sync action
reset_sync                    ← sync qayta boshlash
open_video                    ← video ochish
open_playlist                 ← playlist ochish
SWITCHBOARD_METHOD            ← sync engine chaqiruv
SWITCHBOARD_SET_BANDWIDTH     ← bandwidth sozlash
switchboard-proxy-configured  ← proxy tayyor
peer-id-response              ← peer ID
mesh-reset-complete           ← mesh qurilgan
go-to-mesh                    ← mesh'ga qo'shilish
reset-mesh-reducer            ← mesh state reset
```

**Service-specific cookie scraping:**
```
netflix_get_cookies           ← Netflix session
set_google_drive_headers      ← Google Drive
set_hbo_main                  ← HBO
youtube-timestamp-hash-ipc    ← YouTube sync
youtube-generate-po-token     ← YouTube bot-protection
```

**Web API (renderer'ga exposed):**
```javascript
window.hgSdk        // HoneyGain (bandwidth sharing)
window.infaticaSdk  // Infatica
window.pawnsSdk     // Pawns
window.repocketSdk  // Repocket
window.switchboard  // SYNC ENGINE
window.sessionProxy // proxy
window.adsenseAPI   // reklama
window.freestarAPI  // reklama
window.adAPI        // reklama
```

### 3.5 Monetizatsiya modeli (strategik kontekst)

Rave 4 ta **bandwidth sharing SDK** bilan integratsiya qilingan:
- **Honeygain** — foydalanuvchi internet bandwidth'ini sotadi
- **Infatica** — shu
- **Pawns** — shu
- **Repocket** — shu

**3 ta reklama tarmog'i:**
- Adsense, Freestar, adAPI

**Strategik xulosa:** Rave bepul + reklamasiz ko'rinadi, lekin foydalanuvchilar **bilmagan holda internet bandwidth sotishadi**. Bu sizning loyihada qo'llash MAJBURIY emas, lekin bilishingiz kerak — Rave'ning asosiy daromad manbai.

---

## 4. UX FLOW SPETSIFIKATSIYASI

### 4.1 Aniqlangan yakuniy flow

```
┌─────────────────────────────────────────────────────┐
│ 1. APP OCHILADI                                     │
│    → Rooms tab (yoki "Create Room" tugma bilan)     │
├─────────────────────────────────────────────────────┤
│ 2. ROOM YARATISH yoki qo'shilish                    │
│    → Yangi room ochiladi (bo'sh player)             │
│    → Invite link + QR ko'rsatiladi                  │
├─────────────────────────────────────────────────────┤
│ 3. ROOM ICHIDA                                      │
│    → Member list, chat, voice chat ishlaydi         │
│    → "+" tugma (owner-only) ko'rinadi               │
├─────────────────────────────────────────────────────┤
│ 4. "+" TUGMA BOSILADI (WatchPartyScreen ichida)     │
│    → Source Picker modal chiqadi:                   │
│      ┌────────────────────────────┐                 │
│      │ 🌐 Browser                 │                 │
│      │ ▶ YouTube                  │                 │
│      │ 🎵 Spotify (coming soon)   │                 │
│      │ 📺 Twitch                  │                 │
│      │ 📱 VK / Rutube             │                 │
│      │ 🎬 uzmovi / kinogo         │                 │
│      │ ▶ Vimeo / Dailymotion      │                 │
│      └────────────────────────────┘                 │
├─────────────────────────────────────────────────────┤
│ 5. "BROWSER" TANLANADI                              │
│    → MediaWebView ochiladi                          │
│    → URL bar: foydalanuvchi istalgan URL yozadi     │
│    → Yoki default google.com ochiladi               │
├─────────────────────────────────────────────────────┤
│ 6. SAYTGA KIRILADI                                  │
│    → WebView cookie'larni to'playdi                 │
│    → User kino/video tanlaydi                       │
│    → Video o'ynay boshlagach:                       │
│      - DOM scanner <video> tag topadi               │
│      - Network intercept .m3u8/.mp4 URL ushlaydi    │
│      - Backend extract API chaqiriladi (fallback)   │
├─────────────────────────────────────────────────────┤
│ 7. VIDEO TOPILGACH                                  │
│    → Popup (yoki bottom bar) chiqadi:               │
│      "Видео найдено — Roomga uzatish"               │
│    → Preview + thumbnail ko'rsatiladi               │
├─────────────────────────────────────────────────────┤
│ 8. "ROOMGA UZATISH" BOSILADI                        │
│    → CHANGE_MEDIA socket event yuboriladi           │
│    → MediaWebView yopiladi                          │
│    → Roomga qaytadi                                 │
├─────────────────────────────────────────────────────┤
│ 9. ROOMDA BARCHADA VIDEO YUKLANADI                  │
│    → UniversalPlayer yangi URL ni yuklaydi          │
│    → Owner play/pause/seek → barchada sync          │
│    → Chat, voice, emoji davom etadi                 │
└─────────────────────────────────────────────────────┘
```

### 4.2 Fayl-by-fayl o'zgartirishlar

#### Fayl 1: `apps/mobile/src/screens/modal/WatchPartyScreen.tsx`

**Joriy holat (394-403):**
```tsx
{isOwner && (
  <TouchableOpacity style={s.changeMediaBtn} onPress={handleChangeMedia}>
    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
    <Text style={s.changeMediaText}>
      {room?.videoTitle ? room.videoTitle.slice(0, 36) : 'Выбрать источник'}
    </Text>
    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
  </TouchableOpacity>
)}
```

**Mavjud `handleChangeMedia` funksiyasi:** Source Picker'ga navigate qiladi (yaxshi).

**O'zgartirish kerak:**
- Tugmani kattaroq qilish (FAB style) — kichik text-button emas
- `add-circle-outline` → `add-outline` yoki `plus` — katta "+" bo'lsin
- Ko'rinishi Rave'dagi "Add Source" tugmasiga o'xshashi kerak
- Owner-only ✅ (mavjud, qoldirish)

**Yangi versiya taklifi:**
```tsx
{isOwner && (
  <TouchableOpacity 
    style={s.addSourceFab}          // FAB style (floating)
    onPress={handleOpenSourcePicker}
    activeOpacity={0.8}
  >
    <Ionicons name="add" size={28} color="#fff" />
  </TouchableOpacity>
)}

// yoki yonma-yon "change source" tekst bilan:
<TouchableOpacity style={s.addSourceBar} onPress={handleOpenSourcePicker}>
  <Ionicons name="add-circle" size={20} color={colors.primary} />
  <Text style={s.addSourceText}>
    {room?.videoTitle ? `${room.videoTitle} — o'zgartirish` : 'Manba tanlash'}
  </Text>
</TouchableOpacity>
```

#### Fayl 2: `apps/mobile/src/screens/modal/SourcePickerScreen.tsx`

**Joriy holat:** Create-flow ichida chaqiriladi (new room yaratish jarayoni).

**O'zgartirish:**
- `navigation.params` ga `mode: 'create' | 'change'` qo'shish
- Agar `mode === 'change'` → `CHANGE_MEDIA` yo'naltirish (yangi room emas)
- Agar `mode === 'create'` → avvalgidek (yangi room yaratish)

**Yangi flow:**
```typescript
// WatchPartyScreen'dan chaqiruv:
navigation.navigate('SourcePicker', {
  mode: 'change',
  roomId: currentRoom.id,
});

// Create-flow'dan chaqiruv (eski):
navigation.navigate('SourcePicker', {
  mode: 'create',
});

// SourcePickerScreen ichida:
const handleSourceSelected = (source: MediaSource) => {
  navigation.navigate('MediaWebView', {
    defaultUrl: source.defaultUrl,
    mode: params.mode,      // 'change' yoki 'create'
    roomId: params.roomId,  // 'change' bo'lsa mavjud room
  });
};
```

#### Fayl 3: `apps/mobile/src/screens/modal/MediaWebViewScreen.tsx`

**Joriy holat (2-qator kommenti):**
```typescript
// In-app browser: video topilganda pastda "Watch Party" bar chiqadi — popup yo'q
```

**Avvalgi versiyada popup bor edi** (`f71e5b9` da olib tashlangan).

**Joriy bottom bar mantiq (209-qator):**
```typescript
getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, { ... });
```

**O'zgartirish:**
- Popup qaytarilishi mumkin (yoki bottom bar saqlanadi — UX qarori)
- Agar `params.mode === 'change'` → faqat `CHANGE_MEDIA` yuboriladi, yangi room yaratilmaydi
- Agar `params.mode === 'create'` → `createRoom` chaqiriladi

```typescript
const handleSendToRoom = async (videoData: ExtractedMedia) => {
  if (params.mode === 'change' && params.roomId) {
    // MAVJUD ROOMGA UZATISH
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
      roomId: params.roomId,
      videoUrl: videoData.url,
      videoTitle: videoData.title,
      videoPlatform: videoData.platform,
      videoReferer: videoData.referer,
    });
    navigation.goBack(); // Roomga qaytish
  } else {
    // YANGI ROOM YARATISH (eski mantiq)
    await watchPartyApi.createRoom({
      videoUrl: videoData.url,
      // ...
    });
    navigation.replace('WatchParty', { roomId: newRoom.id });
  }
};
```

#### Fayl 4: `apps/mobile/src/screens/home/HomeScreen.tsx`

**Muammo:** Netflix-stil film katalog, Rave-launcher emas.

**2 ta yo'l:**

**A. Saqlab qolish, lekin "Watch Party" CTA qo'shish (minimal o'zgartirish):**
```tsx
// HomeScreen header'iga:
<View style={s.heroCTA}>
  <Text style={s.heroTitle}>Watch together</Text>
  <TouchableOpacity 
    style={s.createRoomBtn}
    onPress={() => navigation.navigate('Rooms', { screen: 'RoomsScreen' })}
  >
    <Text>Room yaratish</Text>
  </TouchableOpacity>
</View>
```

**B. HomeScreen'ni RoomsScreen'ga redirect qilish (radikal):**
```tsx
// Tab bar'da Home'ni olib tashlash yoki Rooms'ni asosiy qilish:
// navigation/MainTabs.tsx ni o'zgartirish
```

**Tavsiya:** A variant — Home'da film katalog qoldirish (o'xshashlik, content discovery), lekin eng ko'zga tashlanadigan CTA "Create Room" bo'lsin.

### 4.3 Socket event kontrakt

`shared/constants/socket-events.ts` da quyidagilar allaqachon bor:

```typescript
// Client → Server
CHANGE_MEDIA: 'room:change-media'

// Payload:
{
  roomId: string;
  videoUrl: string;
  videoTitle?: string;
  videoPlatform?: 'direct' | 'youtube' | 'playerjs' | 'webview-session';
  videoReferer?: string;
  thumbnailUrl?: string;
  duration?: number;
  qualities?: VideoQualityOption[];
  episodes?: VideoEpisode[];
}

// Server → Client broadcast (room-wide)
MEDIA_CHANGED: 'room:media-changed'
```

**Backend (services/watch-party) allaqachon ishlatadi — kod tayyor (T-E062, T-E076 da qilingan).**

---

## 5. TEXNIK ARXITEKTURA VARIANTLARI

Sync mexanizmi uchun 3 ta yondashuv tahlil qilindi.

### 5.1 🅰️ Variant 1: Socket.io'da qolish + Optimizatsiya

#### 5.1.1 Arxitektura
```
OWNER (play bosadi, 00:15)
    ↓
socket.emit('video:play', {position: 15, ts})
    ↓ [10-30ms internet]
SERVER (Railway — Socket.io)
    ↓ room.broadcast()
    ↓ [10-30ms internet, har peer'ga]
PEER-1, PEER-2, PEER-3: video.play() at 15

Jami lag: 20-60ms (2 hop)
```

#### 5.1.2 Optimizatsiyalar (joriy muammolarga yechim)

**A. Predictive sync (lag yashirish):**
```typescript
// Owner:
const handlePlay = () => {
  video.play();                                        // 1. Darhol o'zida
  socket.emit('video:play', {
    position: video.currentTime,
    scheduledAt: Date.now() + 200,                     // 2. Kelajak vaqt
  });
};

// Peer:
socket.on('video:play', ({ position, scheduledAt }) => {
  const delay = scheduledAt - Date.now();
  if (delay > 0) {
    setTimeout(() => video.play(), delay);             // Kelajakda play
  } else {
    video.currentTime = position + (Date.now() - scheduledAt) / 1000;
    video.play();
  }
});
```

**B. Heartbeat + Silent correction:**
```typescript
// Owner har 10 sekunda:
setInterval(() => {
  socket.emit('video:heartbeat', {
    position: video.currentTime,
    timestamp: Date.now(),
  });
}, 10_000);

// Peer:
socket.on('video:heartbeat', ({ position, timestamp }) => {
  const expected = position + (Date.now() - timestamp) / 1000;
  const diff = Math.abs(video.currentTime - expected);
  
  if (diff > 2.0) {
    video.currentTime = expected;                      // Force seek
  } else if (diff > 0.3) {
    video.playbackRate = diff < 0 ? 0.95 : 1.05;       // Silent correction
    setTimeout(() => video.playbackRate = 1.0, 3000);
  }
});
```

**C. Democratic buffer wait:**
```typescript
video.addEventListener('waiting', () => {
  socket.emit('video:buffering', { userId, position });
});

// Backend:
socket.on('video:buffering', (data) => {
  io.to(roomId).emit('video:pause-for-buffer', { userId: data.userId });
});
```

#### 5.1.3 Baho

| ✅ Afzallik | ❌ Kamchilik |
|---|---|
| Kod allaqachon bor — faqat optimizatsiya | Lag hech qachon 50ms'dan past tushmaydi |
| Mobile'da 100% ishonchli | Server xarajati o'sib boradi |
| Battery-friendly | Server down = barcha roomlar o'lik |
| NAT/firewall muammo yo'q | Scale limit: 1 server ~5000 connection |
| TURN server kerak emas | Rave tajribasidan uzoq |

**Vaqt:** 3-5 kun
**Xarajat:** $0

### 5.2 🅲️ Variant 2: HYBRID (Socket.io + WebRTC DataChannel) ⭐ TAVSIYA

#### 5.2.1 Arxitektura
```
BIRINCHI: Peer connection o'rnatish (1 marta)

Owner ──▶ socket ──▶ Server ──▶ socket ──▶ Peer
              (WebRTC offer/answer/ICE exchange)

Bog'lanish tayyor bo'lgach — server kerak emas.

IKKINCHI: Sync — to'g'ridan-to'g'ri P2P

OWNER (play bosadi)
    ↓ dataChannel.send('play')
    ↓ [5-20ms — direct P2P]
PEER-1, PEER-2, PEER-3: play()

Jami lag: 5-20ms (1 hop, direct)

FALLBACK: WebRTC uzilsa → Socket.io
if (!dataChannel.readyState === 'open') {
  socket.emit('video:play', data);
}
```

#### 5.2.2 Mesh topology — peer soniga qarab

**Kichik room (2-6 kishi) — FULL MESH:**
```
     A ─────── B
     │  \   /  │
     │   \ /   │
     │    X    │
     │   / \   │
     │  /   \  │
     C ─────── D

Har peer boshqa barchasi bilan bog'langan.
A play qilsa: 3 DataChannel orqali 3 peer'ga yuboradi.
```

**Katta room (7-15 kishi) — STAR TOPOLOGY:**
```
     A ─── OWNER ─── C
            ╱ │ ╲
           D  E  F

Faqat owner barchasi bilan bog'langan.
Peer'lar bir-biri bilan bog'lanmagan.
```

**Juda katta room (16+ kishi) — Socket.io fallback.**

#### 5.2.3 Implementatsiya

**Backend signalling** — `services/watch-party/src/socket/mesh.handlers.ts`:
```typescript
io.on('connection', (socket) => {
  socket.on('peer:offer', ({ toUserId, sdp }) => {
    io.to(userSocketMap[toUserId]).emit('peer:offer', {
      fromUserId: socket.userId,
      sdp,
    });
  });
  
  socket.on('peer:answer', ({ toUserId, sdp }) => {
    io.to(userSocketMap[toUserId]).emit('peer:answer', {
      fromUserId: socket.userId,
      sdp,
    });
  });
  
  socket.on('peer:ice', ({ toUserId, candidate }) => {
    io.to(userSocketMap[toUserId]).emit('peer:ice', {
      fromUserId: socket.userId,
      candidate,
    });
  });
});
```

**Mobile mesh client** — `apps/mobile/src/services/mesh/MeshClient.ts`:
```typescript
import { 
  RTCPeerConnection, 
  RTCSessionDescription, 
  RTCIceCandidate 
} from 'react-native-webrtc';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { 
    urls: 'turn:your-turn-server.com:3478',
    username: 'user',
    credential: 'pass',
  },
];

export class MeshClient {
  private peers = new Map<string, RTCPeerConnection>();
  private channels = new Map<string, any>();
  private onSyncCallback?: (msg: SyncMessage) => void;
  
  constructor(private roomId: string, private userId: string) {
    this.setupSignalling();
  }
  
  private setupSignalling() {
    const socket = getSocket()!;
    
    socket.on('peer:offer', async ({ fromUserId, sdp }) => {
      const pc = this.createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('peer:answer', { toUserId: fromUserId, sdp: answer });
    });
    
    socket.on('peer:answer', async ({ fromUserId, sdp }) => {
      const pc = this.peers.get(fromUserId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });
    
    socket.on('peer:ice', async ({ fromUserId, candidate }) => {
      const pc = this.peers.get(fromUserId);
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
  
  async connectToPeer(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    const channel = pc.createDataChannel('sync', { ordered: true });
    this.setupDataChannel(peerId, channel);
    
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    getSocket()!.emit('peer:offer', { toUserId: peerId, sdp: offer });
  }
  
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    pc.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        getSocket()!.emit('peer:ice', { 
          toUserId: peerId, 
          candidate: e.candidate 
        });
      }
    });
    
    pc.addEventListener('datachannel', (e) => {
      this.setupDataChannel(peerId, e.channel);
    });
    
    this.peers.set(peerId, pc);
    return pc;
  }
  
  private setupDataChannel(peerId: string, channel: any) {
    channel.onmessage = (e: any) => {
      const msg = JSON.parse(e.data);
      this.onSyncCallback?.(msg);
    };
    channel.onopen = () => console.log(`[mesh] ${peerId} connected`);
    channel.onclose = () => {
      this.channels.delete(peerId);
      console.log(`[mesh] ${peerId} disconnected`);
    };
    this.channels.set(peerId, channel);
  }
  
  broadcast(msg: SyncMessage) {
    const data = JSON.stringify(msg);
    for (const channel of this.channels.values()) {
      if (channel.readyState === 'open') {
        channel.send(data);
      }
    }
  }
  
  get connectedPeers(): number {
    return Array.from(this.channels.values())
      .filter(ch => ch.readyState === 'open').length;
  }
  
  destroy() {
    for (const pc of this.peers.values()) pc.close();
    this.peers.clear();
    this.channels.clear();
  }
}
```

**Sync protokoli:**
```typescript
interface SyncMessage {
  type: 'play' | 'pause' | 'seek' | 'buffer';
  position: number;        // video ms
  timestamp: number;       // Date.now()
  owner: string;
}

// Drift correction (peer'da):
// Har peer local clock'ini owner timestamp'iga solishtiradi
// Agar |localPos - (ownerPos + Date.now() - ownerTimestamp)| > 2000ms → seek
```

**Integratsiya** — `apps/mobile/src/hooks/useWatchParty.ts`:
```typescript
const meshClient = useRef<MeshClient | null>(null);

useEffect(() => {
  meshClient.current = new MeshClient(roomId, userId);
  
  socket.on('room:member-joined', ({ memberId }) => {
    if (memberId !== userId) {
      meshClient.current?.connectToPeer(memberId);
    }
  });
  
  return () => meshClient.current?.destroy();
}, [roomId, userId]);

const handlePlay = useCallback(() => {
  video.current?.play();
  
  const msg = {
    type: 'play',
    position: video.current?.currentTime ?? 0,
    timestamp: Date.now(),
    owner: userId,
  };
  
  // Mesh orqali yuborishga harakat
  if (meshClient.current && meshClient.current.connectedPeers > 0) {
    meshClient.current.broadcast(msg);
  } else {
    // Fallback: Socket.io
    socket.emit('video:sync', msg);
  }
}, [userId]);
```

#### 5.2.4 Mobile cheklovlarini boshqarish

```typescript
// Agar room > 6 peer → mesh'dan faqat owner foydalanadi (star topology)
if (room.memberCount > 6) {
  if (isOwner) {
    // Owner hammasiga broadcast qiladi (O(N) connections)
  } else {
    // Non-owner'lar faqat owner'dan oladi (1 connection)
  }
}

// Battery optimization:
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    meshClient.current?.destroy();
    // Socket.io fallback davom etadi
  } else if (state === 'active') {
    meshClient.current?.reconnect();
  }
});
```

#### 5.2.5 Baho

| ✅ Afzallik | ❌ Kamchilik |
|---|---|
| **10-30ms lag** (Socket.io'da 50-150ms edi) | Kod murakkablashadi |
| Socket.io fallback ishonchli | TURN server kerak ($10/oy yoki bepul pul-tier) |
| `react-native-webrtc` allaqachon o'rnatilgan | Mesh max 6 peer samarali |
| Server yuki kamayadi | Mobile background'da WebRTC uziladi |
| Rave-ga o'xshash tajriba | Battery consumption +10-15% |
| Chat, voice ham DataChannel'ga o'tishi mumkin | Debug murakkabroq |

**Vaqt:** 7-9 kun
**Xarajat:** $0-10/oy (TURN server uchun Metered.ca bepul pul-tier yoki Coturn VPS)

### 5.3 🅳️ Variant 3: LiveKit (SFU)

#### 5.3.1 LiveKit nima?

**LiveKit** — open-source WebRTC SFU + managed cloud xizmati. Discord, OpenAI (ChatGPT Voice) ishlatadi.

**SFU (Selective Forwarding Unit) arxitekturasi:**
```
Har peer faqat SFU server bilan bog'langan

    A ──┐
    B ──┤
    C ──┼──▶ LiveKit SFU Server
    D ──┤         ↓
    E ──┘    routes to all peers

Har peer 1 upload, (N-1) download
Server: media'ni ko'chiradi (decode qilmaydi)
```

#### 5.3.2 Implementatsiya — 5 qator!

```typescript
import { Room, RoomEvent, DataPacket_Kind } from '@livekit/react-native';

const room = new Room();
await room.connect(LIVEKIT_URL, accessToken);

// Sync yuborish:
const data = new TextEncoder().encode(JSON.stringify({
  type: 'play',
  position: video.currentTime,
  timestamp: Date.now(),
}));
room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);

// Sync qabul qilish:
room.on(RoomEvent.DataReceived, (payload, participant) => {
  const msg = JSON.parse(new TextDecoder().decode(payload));
  handleSync(msg);
});
```

**Backend token service** (yangi endpoint):
```typescript
// services/watch-party/src/controllers/livekit.controller.ts
import { AccessToken } from 'livekit-server-sdk';

export const generateToken = async (req, res) => {
  const { roomId, userId } = req.body;
  
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: userId }
  );
  
  token.addGrant({
    roomJoin: true,
    room: roomId,
    canPublishData: true,
    canSubscribe: true,
  });
  
  res.json({ token: await token.toJwt() });
};
```

#### 5.3.3 Xarajat

**LiveKit Cloud:**
```
Free tier:
    100 GB bandwidth/oy
    50 concurrent participant
    10,000 daqiqa konnektsiya

Build plan ($50/oy):
    500 GB bandwidth
    200 concurrent
    50,000 daqiqa
    
Ship plan ($500/oy):
    5 TB bandwidth
    2000 concurrent
    500,000 daqiqa

Usage beyond: $0.12/GB, $0.004/daqiqa
```

**LiveKit Self-Hosted:**
```
Server: $40-100/oy (DigitalOcean / Hetzner)
TURN:   ichida
Vaqt:   1-2 kun deploy
```

#### 5.3.4 Baho

| ✅ Afzallik | ❌ Kamchilik |
|---|---|
| **2 kunda integratsiya** | Oyiga $50+ xarajat (cloud) |
| 20-200 peer scale | 3rd party bog'liqlik |
| DataChannel + Audio + Video + Chat | Vendor lock-in |
| Recording, transcription, AI | React Native'da bug'lar bor |
| NAT traversal ichida | Self-hosted murakkabroq |
| Production-ready (Discord) | Rave-style P2P emas (SFU hop) |

**Vaqt:** 2-3 kun (cloud) / 4-5 kun (self-hosted)
**Xarajat:** $50-500/oy (cloud) yoki $40-100/oy (self-hosted)

### 5.4 Taqqoslash jadvali

| Parametr | 🅰️ Socket.io | 🅲️ Hybrid | 🅳️ LiveKit |
|---|---|---|---|
| **Lag (sync event)** | 50-150ms | **5-30ms** | 20-40ms |
| **Development vaqti** | 3-5 kun | 7-9 kun | **2-3 kun** |
| **Oylik xarajat** | **$0** | $0-10 | $50-500 |
| **Max room hajmi** | 50+ | 10 optimal | **200+** |
| **Mobile battery** | **Eng yaxshi** | -10-15% | -15-20% |
| **Ishonchlilik** | **Yuqori** | O'rta (P2P uzilish) | Yuqori (SFU) |
| **Kod murakkabligi** | **Past** | Yuqori | O'rta |
| **Voice chat** | Manual | Allaqachon bor | **Ichida** |
| **Recording** | Manual | Manual | **Tayyor** |
| **NAT traversal** | Kerak emas | TURN server | **Ichida** |
| **Rave-darajada** | ❌ | ✅ | ⚠️ (SFU) |
| **Debug qulayligi** | **Oson** | Qiyin | O'rta |
| **Vendor risk** | Yo'q | Yo'q | Bor |

---

## 6. TAVSIYA ETILGAN IMPLEMENTATSIYA

**Tavsiya: 🅲️ HYBRID yondashuvi**

### 6.1 Sabab

1. Sizda `react-native-webrtc` allaqachon o'rnatilgan (voice chat uchun, `da133f4` commit)
2. Socket.io ham bor — fallback ishonchli
3. $0-10/oy qo'shimcha xarajat
4. Rave-essence'ni his etasiz (5-30ms lag)
5. Backend minimal o'zgaradi
6. Keyinchalik LiveKit'ga o'tish oson (modular kod)

### 6.2 Implementatsiya qadam-baqadam

#### Qadam 1: Backend signalling — 1 kun

**Fayl:** `services/watch-party/src/socket/mesh.handlers.ts` (yangi)

```typescript
import { Socket, Server } from 'socket.io';

export function registerMeshHandlers(io: Server, socket: Socket) {
  socket.on('peer:offer', ({ toUserId, sdp }) => {
    const targetSocket = getUserSocket(toUserId);
    if (targetSocket) {
      targetSocket.emit('peer:offer', {
        fromUserId: socket.data.userId,
        sdp,
      });
    }
  });
  
  socket.on('peer:answer', ({ toUserId, sdp }) => {
    const targetSocket = getUserSocket(toUserId);
    if (targetSocket) {
      targetSocket.emit('peer:answer', {
        fromUserId: socket.data.userId,
        sdp,
      });
    }
  });
  
  socket.on('peer:ice', ({ toUserId, candidate }) => {
    const targetSocket = getUserSocket(toUserId);
    if (targetSocket) {
      targetSocket.emit('peer:ice', {
        fromUserId: socket.data.userId,
        candidate,
      });
    }
  });
  
  socket.on('mesh:join', ({ roomId }) => {
    // Boshqa a'zolarga "yangi peer qo'shildi" xabari
    socket.to(roomId).emit('mesh:peer-joined', {
      peerId: socket.data.userId,
    });
  });
}
```

**Ulash:** `services/watch-party/src/socket/index.ts`:
```typescript
import { registerMeshHandlers } from './mesh.handlers';

io.on('connection', (socket) => {
  // ... mavjud handler'lar
  registerMeshHandlers(io, socket);
});
```

**Shared types** — `shared/constants/socket-events.ts`:
```typescript
export const CLIENT_EVENTS = {
  // ... mavjud
  PEER_OFFER: 'peer:offer',
  PEER_ANSWER: 'peer:answer',
  PEER_ICE: 'peer:ice',
  MESH_JOIN: 'mesh:join',
} as const;

export const SERVER_EVENTS = {
  // ... mavjud
  PEER_OFFER: 'peer:offer',
  PEER_ANSWER: 'peer:answer',
  PEER_ICE: 'peer:ice',
  MESH_PEER_JOINED: 'mesh:peer-joined',
} as const;
```

#### Qadam 2: Mobile MeshClient — 2 kun

**Fayl:** `apps/mobile/src/services/mesh/MeshClient.ts` (yangi)

(Kod 5.2.3 bo'limda to'liq berilgan — 80 qator)

**Fayl:** `apps/mobile/src/services/mesh/types.ts` (yangi):
```typescript
export interface SyncMessage {
  type: 'play' | 'pause' | 'seek' | 'buffer' | 'heartbeat';
  position: number;
  timestamp: number;
  owner: string;
}

export interface MeshConfig {
  iceServers: RTCIceServer[];
  maxPeers: number;
  heartbeatInterval: number;
}
```

**Fayl:** `apps/mobile/src/services/mesh/config.ts` (yangi):
```typescript
export const MESH_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: process.env.TURN_URL!,
      username: process.env.TURN_USER!,
      credential: process.env.TURN_PASS!,
    },
  ],
  maxPeers: 6,              // Full mesh limit
  heartbeatInterval: 10_000, // 10 sekund
};
```

#### Qadam 3: Sync protokoli + drift correction — 1.5 kun

**Fayl:** `apps/mobile/src/services/mesh/SyncProtocol.ts` (yangi):
```typescript
import type { SyncMessage } from './types';

const DRIFT_THRESHOLD = 2.0;          // 2 sek — force seek
const SILENT_THRESHOLD = 0.3;          // 0.3 sek — playbackRate correction

export class SyncProtocol {
  private ownerTimeOffset = 0;
  
  constructor(
    private video: React.RefObject<any>,
    private isOwner: boolean,
  ) {}
  
  handleIncoming(msg: SyncMessage) {
    if (msg.owner === this.myUserId) return; // O'zim yuborgan
    
    switch (msg.type) {
      case 'play':
        this.handlePlay(msg);
        break;
      case 'pause':
        this.handlePause(msg);
        break;
      case 'seek':
        this.handleSeek(msg);
        break;
      case 'heartbeat':
        this.handleHeartbeat(msg);
        break;
    }
  }
  
  private handlePlay({ position, timestamp }: SyncMessage) {
    const now = Date.now();
    const networkDelay = (now - timestamp) / 1000;
    const targetPosition = position + networkDelay;
    
    this.video.current?.setPositionAsync(targetPosition * 1000);
    this.video.current?.playAsync();
  }
  
  private handlePause({ position }: SyncMessage) {
    this.video.current?.pauseAsync();
    this.video.current?.setPositionAsync(position * 1000);
  }
  
  private handleSeek({ position }: SyncMessage) {
    this.video.current?.setPositionAsync(position * 1000);
  }
  
  private async handleHeartbeat({ position, timestamp }: SyncMessage) {
    const status = await this.video.current?.getStatusAsync();
    if (!status?.isLoaded) return;
    
    const expected = position + (Date.now() - timestamp) / 1000;
    const actual = status.positionMillis / 1000;
    const diff = actual - expected;
    
    if (Math.abs(diff) > DRIFT_THRESHOLD) {
      // Force seek
      await this.video.current?.setPositionAsync(expected * 1000);
    } else if (Math.abs(diff) > SILENT_THRESHOLD) {
      // Silent correction via playback rate
      const rate = diff > 0 ? 0.95 : 1.05;
      await this.video.current?.setRateAsync(rate, true);
      setTimeout(() => {
        this.video.current?.setRateAsync(1.0, true);
      }, 3000);
    }
  }
  
  startHeartbeat(broadcast: (msg: SyncMessage) => void) {
    if (!this.isOwner) return;
    
    setInterval(async () => {
      const status = await this.video.current?.getStatusAsync();
      if (!status?.isLoaded) return;
      
      broadcast({
        type: 'heartbeat',
        position: status.positionMillis / 1000,
        timestamp: Date.now(),
        owner: this.myUserId,
      });
    }, 10_000);
  }
}
```

#### Qadam 4: Fallback mantiq — 0.5 kun

**Fayl:** `apps/mobile/src/services/mesh/SyncBroadcaster.ts` (yangi):
```typescript
import type { MeshClient } from './MeshClient';
import type { SyncMessage } from './types';
import { getSocket } from '@/socket/client';

export class SyncBroadcaster {
  constructor(
    private meshClient: MeshClient,
    private roomId: string,
  ) {}
  
  broadcast(msg: SyncMessage) {
    const connectedCount = this.meshClient.connectedPeers;
    
    if (connectedCount > 0) {
      // Mesh ishlayapti — P2P yuborish
      this.meshClient.broadcast(msg);
      
      // Ham Socket.io'ga yuborish (peer'lar mesh'da bo'lmaganda uchun)
      getSocket()?.emit('video:sync', {
        ...msg,
        roomId: this.roomId,
        viaMesh: true,
      });
    } else {
      // Mesh ishlamayapti — faqat Socket.io
      getSocket()?.emit('video:sync', {
        ...msg,
        roomId: this.roomId,
        viaMesh: false,
      });
    }
  }
}
```

#### Qadam 5: Topology selection — 1 kun

**Fayl:** `apps/mobile/src/services/mesh/TopologyManager.ts` (yangi):
```typescript
import type { MeshClient } from './MeshClient';

const FULL_MESH_LIMIT = 6;
const STAR_LIMIT = 15;

export class TopologyManager {
  constructor(
    private meshClient: MeshClient,
    private isOwner: boolean,
    private memberCount: number,
  ) {}
  
  async applyTopology(members: string[]) {
    if (this.memberCount <= FULL_MESH_LIMIT) {
      await this.applyFullMesh(members);
    } else if (this.memberCount <= STAR_LIMIT) {
      await this.applyStar(members);
    } else {
      // 16+ — Socket.io fallback, mesh yopiladi
      this.meshClient.destroy();
    }
  }
  
  private async applyFullMesh(members: string[]) {
    for (const peerId of members) {
      if (peerId !== this.myUserId) {
        await this.meshClient.connectToPeer(peerId);
      }
    }
  }
  
  private async applyStar(members: string[]) {
    if (this.isOwner) {
      // Owner barchasi bilan bog'lanadi
      for (const peerId of members) {
        if (peerId !== this.myUserId) {
          await this.meshClient.connectToPeer(peerId);
        }
      }
    } else {
      // Non-owner faqat owner bilan bog'lanadi
      const ownerId = members.find(m => m !== this.myUserId && isOwner(m));
      if (ownerId) {
        await this.meshClient.connectToPeer(ownerId);
      }
    }
  }
}
```

#### Qadam 6: Testing — 2 kun

**Scenarios:**
1. 2 peer room — full mesh, 1 connection har peer'da
2. 5 peer room — full mesh, 4 connection har peer'da
3. 10 peer room — star topology, owner 9 connection, boshqa 1 connection
4. Peer drop — qolganlar davom etadi
5. Owner drop — yangi owner saylanadi (yoki room yopiladi)
6. Mobile background — WebRTC uziladi, Socket.io fallback
7. Poor network — ICE fails, Socket.io fallback
8. Drift test — 2 peer'da artificial drift yaratib tiklanishi

**Test fayllari:**
- `apps/mobile/src/__tests__/services/mesh/MeshClient.test.ts`
- `apps/mobile/src/__tests__/services/mesh/SyncProtocol.test.ts`
- `.maestro/flows/mesh-sync-flow.yaml`

### 6.3 Konfiguratsiya o'zgarishlari

**`.env.example` (qo'shilishi kerak):**
```
# TURN server (NAT traversal uchun)
TURN_URL=turn:your-turn-server.com:3478
TURN_USER=username
TURN_PASS=password

# Yoki Metered.ca bepul tier:
TURN_URL=turn:openrelay.metered.ca:80
TURN_USER=openrelayproject
TURN_PASS=openrelayproject
```

**`apps/mobile/package.json` (agar yo'q bo'lsa):**
```json
{
  "dependencies": {
    "react-native-webrtc": "^124.0.0"
  }
}
```

**`app.json` (Expo config):**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Voice chat",
        "NSMicrophoneUsageDescription": "Voice chat"
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.INTERNET"
      ]
    }
  }
}
```

---

## 7. SCOPE CLEANUP

Rave-essence'ga qaytish uchun quyidagi scope-creep'ni olib tashlash yoki yashirish kerak:

### 7.1 Mobile'da

| Nima | Joriy holat | Tavsiya |
|---|---|---|
| **Battle feature** | `BattleCreateScreen`, `BattleScreen` | Menu'dan olib tashlash, feature flag ostida yashirish |
| **Achievement system** | `AchievementsScreen`, rarity colors | Profile ichida "Coming soon" yoki disable |
| **Stats / Ranks** | `StatsScreen`, Bronze→Diamond | Profile ichida to'liq olib tashlash |
| **Movie catalog Home** | Netflix-style rows | Ixtiyoriy Browse tab'iga ko'chirish |
| **"CineSync DJ", "Karaoke", "Likes"** | `mediaSources.ts:182-212` | Olib tashlash (Rave'da yo'q) |

### 7.2 Backend'da

| Nima | Joriy holat | Tavsiya |
|---|---|---|
| **services/battle** | To'liq service (MongoDB + Redis + Bull) | Maintenance mode (ishga tushirilmaydi, endpoint'lar 503) |
| **Elasticsearch** | Movie search | Saqlansin (Browse tab uchun) yoki disable |
| **yt-dlp + Playwright pipeline** | Extract service | Saqlansin — Rave'da ham shunga o'xshash narsa bor, lekin optional |
| **Admin panel** | To'liq Vite + React app | Minimal qilish (faqat feedback + user block) |

### 7.3 Web'da

`apps/web/` — Jafar mobile'ga ko'chgan, web orfaned. Quyidagilar:
- **T-J015** (auth hydration) — mobile'ga o'tkazish kerak emas, web uchun tejangan
- **T-J007** (SEO + i18n + PWA) — web uchun, saqlash
- Yoki **butun `apps/web/` ni pause qilish** (maintenance branch'ga ko'chirish)

---

## 8. VAQT VA XARAJAT

### 8.1 Hybrid implementatsiya (tavsiya)

```
KODLASH (7-9 kun):
    Qadam 1: Backend signalling             1 kun
    Qadam 2: MeshClient                     2 kun
    Qadam 3: Sync protokoli + drift         1.5 kun
    Qadam 4: Fallback logic                 0.5 kun
    Qadam 5: Topology selection             1 kun
    Qadam 6: Testing                        2 kun
    Buffer: Bug fix + polish                1 kun

UX FLOW TUZATISH (3-4 kun, paralel):
    WatchPartyScreen "+" tugma              0.5 kun
    SourcePicker mode: create/change        0.5 kun
    MediaWebView CHANGE_MEDIA mantiq        1 kun
    HomeScreen CTA qo'shish                 0.5 kun
    Brand ranglar unification               0.5 kun
    Testing                                 1 kun

SCOPE CLEANUP (1-2 kun, paralel):
    Battle/Achievement/Stats feature flag   1 kun
    mediaSources.ts tozalash                0.5 kun
    Admin panel minimal versiya             0.5 kun

───────────────────────────────────────────
JAMI:                                       10-13 kun (2 hafta)
                                            3 paralel ishchilar bilan
```

### 8.2 Xarajat

```
Development:
    ├─ Dasturchilar (mavjud jamoa)          $0 (xodim)
    └─ Jami development cost                $0

Infrastructure:
    ├─ TURN server (Metered.ca bepul)       $0 (50GB/oy)
    ├─ Yoki Coturn VPS (agar kerak)         $10/oy (DigitalOcean)
    ├─ Railway server (mavjud)              o'zgarmaydi
    └─ Jami infra cost                      $0-10/oy

Scale vaqt (1000+ user):
    ├─ TURN bandwidth                       ~$20/oy
    ├─ Yoki LiveKit Cloud Build             $50/oy
    └─ Migratsiya xarajati                  2-3 kun

───────────────────────────────────────────
MVP XARAJAT:                                $0-10/oy
PRODUCTION XARAJAT:                         $20-70/oy (1000 user)
```

### 8.3 Socket.io variant (agar Hybrid imkoniyat bo'lmasa)

```
Kodlash:                                    3-5 kun
Xarajat:                                    $0
Natija:                                     50-150ms lag saqlanadi
```

### 8.4 LiveKit variant (agar 2 kunda natija kerak)

```
Kodlash:                                    2-3 kun
Xarajat:                                    $50/oy (200 user gacha)
                                            $500/oy (2000 user)
Natija:                                     20-40ms lag, voice/video/recording bonus
```

---

## 9. KEYINGI QADAMLAR

### 9.1 Darhol (bugun)

- [ ] Ushbu hujjat jamoa bilan tekshirilishi
- [ ] Variant tanlash: 🅰️ / 🅲️ / 🅳️
- [ ] UX flow tasdiqlash (4.1 bo'lim)

### 9.2 1-hafta (sprint 1)

- [ ] **Task T-C012**: WatchPartyScreen "+" tugma UX (Emirhan)
- [ ] **Task T-C013**: SourcePicker mode prop (Emirhan)
- [ ] **Task T-C014**: MediaWebView CHANGE_MEDIA mantiq (Emirhan)
- [ ] **Task T-S050**: Mesh signalling backend handler (Saidazim)
- [ ] **Task T-C015**: HomeScreen CTA (Jafar — allaqachon mobile'da)

### 9.3 2-hafta (sprint 2)

- [ ] **Task T-E078**: MeshClient + SyncProtocol (Emirhan)
- [ ] **Task T-E079**: Topology Manager (Emirhan)
- [ ] **Task T-J038**: Fallback + Testing (Jafar)
- [ ] **Task T-S051**: Scope cleanup backend (Saidazim)

### 9.4 Sprint Done kriteryalari

```
✓ Room yaratish — 1 tap
✓ Roomda "+" bosib Source Picker
✓ Browser orqali istalgan saytga kirish
✓ Video aniqlanganda popup/bar chiqishi
✓ "Roomga uzatish" — CHANGE_MEDIA event (yangi room EMAS)
✓ Sync lag < 30ms (mesh peer'lar uchun)
✓ Socket.io fallback ishlaydi
✓ 2-6 peer rooms — mesh full
✓ 7+ peer rooms — star yoki socket
✓ Mobile background — Socket.io fallback
✓ Poor network — graceful degradation
```

---

## 10. ILOVALAR (APPENDIX)

### 10.1 Rave IPC kanallar to'liq ro'yxati

**preload.js dan aniqlangan (strings array):**

```
sync, reset_sync, open_video, open_playlist
join, activate, holiday, home_mounted, handlemi
main_error_crash, notification_action_response

SWITCHBOARD_METHOD, SWITCHBOARD_SET_BANDWIDTH
set-switchboard-bandwidth, switchboard-proxy-configured

request-peer-id, peer-id-response
go-to-mesh, mesh-reset-complete, reset-mesh-reducer

netflix_get_cookies, netflix_get_cookies_response
set_google_drive_headers, set_hbo_main, set_hbo_main
facebook-clear-cookies

youtube-timestamp-hash-ipc, youtube-generate-po-token
getYTCoreVideoInfo, getYTCoreVideoInfoResponse

internal-hg-sdk:start, internal-hg-sdk:stop, internal-hg-sdk:status
internal-repocket-sdk:enable, internal-repocket-sdk:disable
internal-pawns-sdk:start, internal-pawns-sdk:stop
infatica:start, infatica:stop, infatica:getId

window-close, window-minimize, window-maximize, window-unmaximize
window-show, window-restore, window-focus, window-blur
window-setFullScreen, window-enter-full-screen, window-leave-full-screen
window-isMaximized, window-isMinimized, window-isFullScreen, window-isVisible
set-acrylic-window, add-window-style-flag, remove-window-style-flag

create-dm-window, destroy-dm-window, show-dm-window, hide-dm-window
dm-window-ready, dm-active-tab-response, dm-add-tab, dm-trigger-hanging-get
dm-logout-notification, dm-window-logout, dm-window-initial-state
open-dm-thread, send-to-dm-window

PUSH_RECEIVER:::NOTIFICATION_RECEIVED
PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED
PUSH_RECEIVER:::NOTIFICATION_SERVICE_RESTARTED
PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR
PUSH_RECEIVER:::START_NOTIFICATION_SERVICE
PUSH_RECEIVER:::TOKEN_UPDATED
NOTIFICATION_SERVICE_STARTED, NOTIFICATION_SERVICE_RESTARTED
NOTIFICATION_SERVICE_ERROR, NOTIFICATION_RECEIVED

get-active-dm-tab, is-main-window-open, app-logout
destroyNotification, update-badge, update-tray-icon
messageFromNotification, messageToNotification

freestar-register-webview, freestar-open-ad
adsense-register-webview, adsense-open-ad
ad-register-webview, ad-open-ad

setup-main, app-close-completed, main-setup-complete
main-window-isVisible, request-app-close
sentry-ipc, set-sentry-tags

scrape-renderer-storage, scrape-domain-cookies
copy-image-to-clipboard, node::openExternal, node::getVideoFromClipboard
webRequest-onBeforeRedirect, createWebResource
estimate-download-bps, estimate-upload-bps
removeCookies, get-mic-access

jumpToTimeStamp, jumpToTimeStamp-channel
super-search-webview-fetch, get-initial-translations
redux-state-response, redux-sync-action, redux-request-state
redux-request-initial-state
```

### 10.2 Fayl lokatsiyalari

**Rave manba fayllar (yordamchi):**
```
rave-unpack/              — NSIS installer content
├── Rave.exe
├── resources/app.asar    — Electron app bundle
└── *.dll                 — Chromium, FFmpeg, Vulkan

rave-app-src/             — app.asar extracted
├── dist/                 — Compiled JS (minified)
├── node_modules/         — Dependencies
│   ├── switchboard-js/   — Rust native binding (.node)
│   ├── @aracna/fcm/      — FCM push
│   └── ...
└── package.json          — v1.18.6, rave-desktop
```

**CineSync asosiy fayllar (o'zgartiriladigan):**
```
apps/mobile/src/
├── screens/
│   ├── home/HomeScreen.tsx                        (HomeScreen redesign)
│   ├── modal/WatchPartyScreen.tsx:394-403        (+ tugma)
│   ├── modal/SourcePickerScreen.tsx               (mode prop)
│   ├── modal/MediaWebViewScreen.tsx:209           (CHANGE_MEDIA mantiq)
│   └── rooms/RoomsScreen.tsx                      (asosiy ekran)
├── services/
│   └── mesh/                                      (YANGI)
│       ├── MeshClient.ts
│       ├── SyncProtocol.ts
│       ├── SyncBroadcaster.ts
│       ├── TopologyManager.ts
│       ├── config.ts
│       └── types.ts
├── hooks/useWatchParty.ts                         (mesh integratsiyasi)
├── components/video/UniversalPlayer.tsx           (sync callback'lar)
├── theme/colors.ts                                (brand unification)
└── socket/client.ts                               (peer:* event'lar)

services/watch-party/src/
└── socket/
    ├── index.ts                                   (registerMeshHandlers chaqiruv)
    └── mesh.handlers.ts                           (YANGI)

shared/constants/
└── socket-events.ts                               (PEER_OFFER/ANSWER/ICE qo'shish)
```

### 10.3 Foydalanilgan manbalar

**Industry docs:**
- [WebRTC Mesh Architecture — WebRTC.ventures](https://webrtc.ventures/2021/06/webrtc-mesh-architecture/)
- [Mesh vs SFU vs MCU — AntMedia](https://antmedia.io/webrtc-network-topology/)
- [Complete Guide to WebRTC Scalability — AntMedia](https://antmedia.io/webrtc-scalability/)
- [WebRTC Architectures: P2P vs SFU vs MCU vs XDN — Red5 Pro](https://www.red5.net/blog/webrtc-architecture-p2p-sfu-mcu-xdn/)
- [LiveKit Distributed Mesh Network](https://blog.livekit.io/scaling-webrtc-with-distributed-mesh/)
- [fybrrStream P2P Live Streaming (arXiv)](https://arxiv.org/pdf/2105.07558)
- [SFU, MCU, or P2P — GetStream](https://getstream.io/blog/what-is-a-selective-forwarding-unit-in-webrtc/)

**React Native:**
- [React Native WebRTC Complete Guide 2025 — Viewlytics](https://viewlytics.ai/blog/react-native-webrtc-complete-guide)
- [React Native WebRTC GitHub Docs](https://github.com/react-native-webrtc/react-native-webrtc)
- [react-native-webrtc RTCDataChannel examples](https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/BasicUsage.md)

**LiveKit:**
- [LiveKit React Native SDK](https://github.com/livekit/react-native-webrtc)
- [LiveKit Cloud Pricing](https://livekit.io/pricing)

**TURN servers:**
- [Metered.ca free TURN tier](https://www.metered.ca/tools/openrelay/)
- [Coturn self-hosted](https://github.com/coturn/coturn)

### 10.4 Taqqoslash qisqa (memo)

```
MUAMMO:   CineSync Rave-ga o'xshamayapti
SABAB:    5 haftalik scope-creep (catalog/battle/gamification)
YECHIM:   Hybrid P2P sync + UX flow to'g'rilash + scope cleanup
VAQT:     10-13 kun (3 dasturchi paralel)
XARAJAT:  $0-10/oy (TURN server)
NATIJA:   Rave-essence + scalable arxitektura
```

### 10.5 Ogohlantirish va tavakkallar

**Mobile WebRTC cheklovlari:**
- Android background — foreground service kerak (WebRTC 30s'dan keyin o'chiriladi)
- iOS background — CallKit yoki PushKit kerak
- Battery drain — har RTCPeerConnection ~5-10% soatiga
- Cellular (4G/5G) — Symmetric NAT holatida TURN relay majburiy
- Expo Go — `react-native-webrtc` Expo Go da ishlamaydi, **development build kerak**

**Scope cleanup tavakkal:**
- Battle/Achievement olib tashlash jamoa ruhiyatiga ta'sir qilishi mumkin (oylar ketgan)
- Admin panel kamaytirish — moderator kerak bo'lsa keyin qo'shish qiyin
- Movie catalog to'xtatish — user discovery pasayadi

**LiveKit'ga migratsiya tavakkal:**
- Vendor lock-in — LiveKit tarif o'zgartirsa alternativa kerak
- Self-hosted — kamida 1 DevOps odam kerak
- Free tier — 50 concurrent participant, keyin to'lov

---

## ENDING NOTES

**Bu hujjat yashaydigan (living document).** Sprint natijalariga qarab yangilanadi.

**Oxirgi yangilanish:** 2026-04-14
**Keyingi review:** Sprint 1 oxirida (taxminan 2026-04-21)

**Savol/shubha bo'lsa:**
- UX flow aniqligi — 4.1 bo'limni ko'ring
- Texnik variant tanlash — 5.4 jadval
- Implementatsion kod — 6.2 bo'lim
- Vaqt/xarajat — 8-bo'lim

---

*CineSync → Rave Transformation Plan | v1.0 | 2026-04-14*
