# CineSync — Sessiya Konteksti
# Oxirgi yangilash: 2026-03-08

---

## Joriy Sessiya: Watch Party — Voice Chat + Twitch Overlay

### Bajarilgan ishlar:

#### 1. `shared/src/constants/socketEvents.ts`
- **Qo'shildi**: `VOICE_SPEAKING: 'voice:speaking'` — ham `SERVER_EVENTS`, ham `CLIENT_EVENTS` ga
- Maqsad: remote speaking relay uchun yangi socket event

#### 2. `services/watch-party/src/socket/watchParty.socket.ts`
- **Qo'shildi**: `socket.join('user:${userId}')` — personal room (voice relay uchun)
- **Qo'shildi** 6 ta yangi voice handler:
  - `voice:join` → voiceRooms ga qo'shish, `voice:joined` + `voice:user_joined` emit
  - `voice:leave` → voiceRooms dan o'chirish, `voice:user_left` emit
  - `voice:offer` → `user:${targetId}` personal room orqali relay
  - `voice:answer` → `user:${targetId}` personal room orqali relay
  - `voice:ice` → `user:${targetId}` personal room orqali relay
  - `voice:speaking` → xonadagi boshqalarga relay
- **Qo'shildi**: disconnect da voice cleanup (voiceRooms dan o'chirish + `voice:user_left`)
- **Eslatma**: WebRTC type larni `unknown` qildik (Node.js da browser typelari yo'q)

#### 3. `apps/web/src/hooks/useVoiceChat.ts`
- **Qo'shildi**: `lastSpeakingRef` — oldingi speaking state tracking
- **Qo'shildi**: speaking state o'zgarganda `voice:speaking` emit (faqat toggle paytida)
- **Qo'shildi**: `onRemoteSpeaking` listener — boshqa userlarning speaking statusi
- `SPEAKING_THRESHOLD = 18`, `SPEAKING_INTERVAL_MS = 150` konstantalari ajratildi

#### 4. `apps/web/src/components/party/FullscreenOverlay.tsx` — TO'LIQ QAYTA YOZILDI
- **Twitch-style chat**: bubble yo'q, `Username: message` formatda text
- **Username ranglari**: userId dan hash → 15 xil rang (Twitch palette)
- **`fadeSlideIn` animatsiya**: yangi xabarlar pastdan chiqadi
- **Voice section**: kompakt avatarlar, speaking ring (yashil, glow effekt), mute badge
- **Floating emojis**: `floatingEmojis` prop orqali fullscreen da ko'rsatiladi
  - Panel ochiq bo'lsa emojis chap tomonga siljiydi (`right: calc(x% + 280px)`)
- **Gradient background**: `linear-gradient` — yuqori qora, pastga yengil
- **Input**: kichikroq (`h-7`), `bg-black/40` pastki qism

#### 5. `apps/web/src/app/(app)/party/[roomId]/page.tsx`
- **Qo'shildi**: `floatingEmojis={floatingEmojis}` → `FullscreenOverlay` ga uzatildi

#### 6. `apps/web/src/app/globals.css`
- **Qo'shildi**: `@keyframes fadeSlideIn` — Twitch chat message animatsiyasi

---

## Uncommitted o'zgarishlar (bu sessiyaga qo'shilganlar):
- `shared/src/constants/socketEvents.ts`
- `services/watch-party/src/socket/watchParty.socket.ts`
- `apps/web/src/hooks/useVoiceChat.ts` (qayta yozildi)
- `apps/web/src/components/party/FullscreenOverlay.tsx` (qayta yozildi)
- `apps/web/src/components/party/VoicePanel.tsx` (oldingi sessiyada)
- `apps/web/src/app/(app)/party/[roomId]/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/Dockerfile` (oldingi sessiyadan)
- `apps/web/src/components/VideoPlayer.tsx` (oldingi sessiyadan)
- `apps/web/src/components/party/ChatPanel.tsx` (oldingi sessiyadan)
- `services/admin/src/controllers/admin.controller.ts` (tekshirilmadi)

---

## Arxitektura — Voice Chat oqimi:

```
Browser A                    Server (watch-party)           Browser B
─────────                    ────────────────────           ─────────
voice:join ──────────────→  voiceRooms.add(A)
                             voice:joined({members:[]}) ──→ (faqat A ga)
                             voice:user_joined({A}) ──────→ B ga

voice:offer({to:B, ...}) ─→ socket.to('user:B').emit() ──→ voice:offer({from:A})
                   ←────────────────────────────────────── voice:answer({to:A})
voice:ice ────────────────→ relay ──────────────────────→  voice:ice
speaking ─────────────────→ socket.to(roomId).emit() ───→  voice:speaking({userId:A, speaking:true})
```

---

## Keyingi qadamlar (bajarilmagan):
- [ ] Barcha o'zgarishlarni commit qilish
- [ ] VoicePanel.tsx — normal (non-fullscreen) panel ham yangilanishi mumkin
- [ ] Admin controller o'zgarishini tekshirish
