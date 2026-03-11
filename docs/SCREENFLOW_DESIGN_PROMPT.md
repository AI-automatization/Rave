# CineSync Mobile App — Screenflow Design Prompt

> **Maqsad:** Figma yoki boshqa design tool uchun CineSync mobile ilovasining to'liq screenflow dizayni yaratish.
> **Platforma:** iOS & Android (React Native + Expo)
> **Tema:** Dark mode ONLY
> **Stil:** Cinematic, premium, gamified social streaming

---

## DESIGN SYSTEM

### Color Palette

```
Primary:          #7B72F8  (Violet — asosiy accent)
Secondary:        #49C4E5  (Aqua — ikkinchi accent)
Neutral/Danger:   #C03040  (Red — xato, ogohlantirish)
Success:          #22C55E  (Green — muvaffaqiyat)
Warning:          #F59E0B  (Amber — ogohlantirish)

Background Void:     #131110  (Eng qorong'i — status bar, asos)
Background Base:     #211F1C  (Asosiy fon — screenlar)
Background Surface:  #2A2825  (Card, panel foni)
Background Elevated: #3E3B38  (Modal, dropdown foni)

Text Primary:     #EFE6EB           (Oq — sarlavhalar, asosiy matn)
Text Secondary:   rgba(239,230,235, 0.7)  (70% — ikkinchi darajali matn)
Text Muted:       rgba(239,230,235, 0.4)  (40% — hint, placeholder)

Border:           #7A3B40  (Subtle border — cardlar, inputlar)
```

### Rank Colors (Gamifikatsiya)

```
Bronze:    #CD7F32   (0-999 points)
Silver:    #C0C0C0   (1000-4999)
Gold:      #FFD700   (5000-14999)
Platinum:  #E5E4E2   (15000-29999)
Diamond:   #88CCFF   (30000+)
```

### Achievement Rarity Colors

```
Common:     #9CA3AF  (Kulrang)
Rare:       #3B82F6  (Ko'k)
Epic:       #8B5CF6  (Binafsha)
Legendary:  #F59E0B  (Oltin)
Secret:     #EC4899  (Pushti)
```

### Typography

```
Display:    32px  Bold        (Katta sarlavhalar)
Heading 1:  24px  Bold        (Sahifa sarlavhasi)
Heading 2:  20px  Semi-Bold   (Section sarlavhasi)
Heading 3:  16px  Semi-Bold   (Card sarlavhasi)
Body:       14px  Regular     (Asosiy matn)
Caption:    12px  Regular     (Kichik matn)
Label:      12px  Semi-Bold   (Badge, tag, button)

Font Family: DM Sans (yoki System Default)
```

### Spacing System

```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   20px
xxl:  24px
xxxl: 32px
```

### Border Radius

```
Card:    12px
Button:  8px
Avatar:  50% (circle)
Input:   8px
Badge:   16px (pill shape)
Modal:   20px (top corners)
```

### Shadows

```
Small:   0 2px 4px rgba(0,0,0,0.3)   — cardlar
Medium:  0 4px 8px rgba(0,0,0,0.4)   — elevated
Large:   0 8px 16px rgba(0,0,0,0.5)  — modal, overlay
```

---

## GLOBAL UI ELEMENTLARI

### Status Bar
- Style: `light-content` (oq ikonkalar)
- Background: transparent (content ostida ko'rinadi)

### Bottom Tab Bar
- Background: `#211F1C` with top border `rgba(122,59,64, 0.3)`
- 4 ta tab: Home, Search, Friends, Profile
- Active: `#7B72F8` (violet) ikon + label
- Inactive: `rgba(239,230,235, 0.4)` (muted)
- Icon size: 24px
- Label: 10px
- Height: 60px (+ safe area bottom)
- Badge: notification count (qizil dot yoki raqam)

### Header / App Bar
- Background: transparent yoki `#211F1C`
- Title: center-aligned, 18px semi-bold
- Left: back arrow yoki menu
- Right: action buttons (notification bell, settings gear)
- Height: 56px

### Loading States
- Skeleton shimmer: `#2A2825` → `#3E3B38` animation
- Spinner: `#7B72F8` violet
- Pull-to-refresh: violet spinner

### Empty States
- Centered icon (64px, muted)
- Title: 18px semi-bold
- Description: 14px muted
- Optional CTA button

### Error States
- Red accent border yoki background tint
- Error icon + message
- "Qayta urinish" button

---

## SCREENFLOW — BARCHA EKRANLAR

---

### 1. SPLASH SCREEN

**Maqsad:** App yuklanayotganda ko'rsatiladigan boshlang'ich ekran

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│      [CineSync Logo]    │
│       Animated glow     │
│                         │
│    ── Loading bar ──    │
│                         │
│                         │
│                         │
└─────────────────────────┘
```

**Elementlar:**
- Full screen `#131110` background
- CineSync logo markazda (animated fade-in + subtle glow/pulse)
- Logo ostida loading indicator (thin progress bar yoki spinner)
- Auto-navigate: token bor → MainNavigator, yo'q → Onboarding
- Duration: 2-3 soniya (hydration + token tekshirish)

---

### 2. ONBOARDING SCREEN (3-4 slides carousel)

**Maqsad:** Yangi foydalanuvchilarga app xususiyatlarini tanishtirish

```
┌─────────────────────────┐
│                         │
│   [Illustration/Lottie] │
│    Full-width graphic   │
│                         │
│   ─────────────────     │
│   "Birga Film Ko'ring"  │
│   Do'stlaringiz bilan   │
│   real-time sinxron      │
│                         │
│       ● ○ ○ ○           │
│                         │
│   [  Boshlash  →  ]     │
│   [  Tashlab ketish  ]  │
└─────────────────────────┘
```

**Slide 1:** "Birga Film Ko'ring" — Watch Party illustration
**Slide 2:** "Do'stlar Bilan Bellashing" — Battle illustration
**Slide 3:** "Yutuqlar Qo'lga Kiring" — Achievement/gamification illustration
**Slide 4:** "Boshladik!" — CTA to Login/Register

**Elementlar:**
- Swipeable carousel (horizontal paging)
- Dot indicators (active: violet, inactive: muted)
- "Keyingi" yoki "Boshlash" button (primary violet)
- "Tashlab ketish" link (muted text, Login ga olib boradi)
- Illustrations: Lottie animations yoki high-quality vectors
- Background: gradient `#131110` → `#211F1C`

---

### 3. LOGIN SCREEN

**Maqsad:** Mavjud foydalanuvchilar uchun kirish

```
┌─────────────────────────┐
│                         │
│      [CineSync Logo]    │
│      Xush kelibsiz!     │
│                         │
│  ┌─────────────────────┐│
│  │ 📧  Email           ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🔒  Parol       👁  ││
│  └─────────────────────┘│
│                         │
│  [Parolni unutdingizmi?]│
│                         │
│  [████ Kirish ████████] │
│                         │
│  ──────── yoki ──────── │
│                         │
│  [G  Google bilan kirish]│
│                         │
│  Hisob yo'qmi? [Ro'yxat]│
└─────────────────────────┘
```

**Elementlar:**
- Logo + "Xush kelibsiz!" heading (h1)
- Email input: text input, keyboard type `email-address`
- Password input: secure text + eye toggle (show/hide)
- "Parolni unutdingizmi?" — ForgotPassword ga navigatsiya
- "Kirish" button: full-width, violet primary, disabled until valid
- Divider: "yoki" text with lines
- Google Sign-In button: white background, Google "G" logo
- "Ro'yxatdan o'tish" link → RegisterScreen
- Keyboard avoiding view
- Error state: input border red + error message below
- Loading state: button spinner

---

### 4. REGISTER SCREEN

**Maqsad:** Yangi foydalanuvchi ro'yxatdan o'tish

```
┌─────────────────────────┐
│  ←                      │
│      Ro'yxatdan o'tish  │
│                         │
│  ┌─────────────────────┐│
│  │ 👤  Username        ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 📧  Email           ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🔒  Parol       👁  ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🔒  Tasdiqlash   👁 ││
│  └─────────────────────┘│
│                         │
│  Password strength bar  │
│  ■■■■□  Kuchli          │
│                         │
│  [████ Ro'yxatdan ████] │
│                         │
│  ──────── yoki ──────── │
│  [G  Google bilan]      │
│                         │
│  Hisobingiz bor? [Kirish]│
└─────────────────────────┘
```

**Elementlar:**
- Back button (←) → LoginScreen
- Username: 3-20 belgi, unique tekshiruvi (real-time)
- Email: valid format
- Password: 8+ belgi, strength indicator (weak/medium/strong)
- Confirm password: match tekshiruvi
- Password strength bar: red → yellow → green
- "Ro'yxatdan o'tish" button
- Google Sign-In
- "Kirish" link → LoginScreen
- Inline validation: ✓ green check yoki ✗ red X har input yonida
- Terms of Service va Privacy Policy havola (caption)

---

### 5. VERIFY EMAIL SCREEN

**Maqsad:** Email tasdiqlash kodi kiritish

```
┌─────────────────────────┐
│  ←                      │
│                         │
│      📧                 │
│   Email Tasdiqlash      │
│                         │
│   user@email.com ga     │
│   6 xonali kod          │
│   yuborildi             │
│                         │
│   ┌──┬──┬──┬──┬──┬──┐  │
│   │ 4│ 2│ 8│ 1│  │  │  │
│   └──┴──┴──┴──┴──┴──┘  │
│                         │
│   Kod kelmadimi?        │
│   [Qayta yuborish] 45s  │
│                         │
│   [████ Tasdiqlash ███] │
│                         │
└─────────────────────────┘
```

**Elementlar:**
- Back button
- Email icon (animated)
- 6 ta individual input box (OTP style)
- Auto-focus va auto-submit
- "Qayta yuborish" — 60 soniya countdown timer
- Tasdiqlash button
- Countdown: `0:45` format, tugagach "Qayta yuborish" active bo'ladi
- Success → ProfileSetup ga yoki MainNavigator ga

---

### 6. FORGOT PASSWORD SCREEN

**Maqsad:** Parolni tiklash

```
┌─────────────────────────┐
│  ←                      │
│                         │
│      🔑                 │
│   Parolni Tiklash       │
│                         │
│   Email manzilingizni   │
│   kiriting, tiklash     │
│   havolasi yuboramiz    │
│                         │
│  ┌─────────────────────┐│
│  │ 📧  Email           ││
│  └─────────────────────┘│
│                         │
│  [████ Yuborish ██████] │
│                         │
│  [← Kirish sahifasiga]  │
└─────────────────────────┘
```

**Elementlar:**
- Back button
- Icon + heading + description text
- Email input
- Submit button
- Success state: "Email yuborildi!" message + check icon
- Back to login link

---

### 7. PROFILE SETUP SCREEN

**Maqsad:** Yangi foydalanuvchi profilini sozlash (registration dan keyin)

```
┌─────────────────────────┐
│                         │
│   Profilingizni         │
│   Sozlang               │
│                         │
│      ┌────────┐         │
│      │ Avatar │         │
│      │  📷    │         │
│      └────────┘         │
│   [Rasm tanlash]        │
│                         │
│  ┌─────────────────────┐│
│  │ Display Name        ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ Bio (ixtiyoriy)     ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  Sevimli janrlar:       │
│  [Action] [Comedy]      │
│  [Drama] [Horror]       │
│  [Sci-Fi] [Thriller]    │
│                         │
│  [████ Davom etish ███] │
│  [Keyinroq sozlash]    │
└─────────────────────────┘
```

**Elementlar:**
- Avatar picker: kameradan yoki galereyadan
- Avatar preview: 100px circle, border violet
- Display name input
- Bio textarea (max 150 belgi, counter)
- Genre selection: chip/tag toggle (multi-select)
- "Davom etish" button → MainNavigator
- "Keyinroq" skip link
- Smooth keyboard avoiding

---

## MAIN APP (Authenticated)

---

### 8. HOME SCREEN (Tab 1: Home)

**Maqsad:** Asosiy landing — trendlar, davom etish, tavsiyalar

```
┌─────────────────────────┐
│ CineSync    🔔(3)       │
│─────────────────────────│
│┌───────────────────────┐│
││                       ││
││    HERO BANNER        ││
││  [Movie Poster BG]    ││
││                       ││
││  Movie Title          ││
││  ⭐ 8.5 | Action      ││
││  [▶ Ko'rish] [+ List] ││
││       ● ○ ○ ○ ○       ││
│└───────────────────────┘│
│                         │
│ 🔥 Trendda              │
│ ┌────┐┌────┐┌────┐┌──  │
│ │ 🎬 ││ 🎬 ││ 🎬 ││    │
│ │    ││    ││    ││    │
│ │8.1 ││7.9 ││9.0 ││    │
│ └────┘└────┘└────┘└──  │
│                         │
│ ⭐ Eng Yuqori Reyting    │
│ ┌────┐┌────┐┌────┐┌──  │
│ │ 🎬 ││ 🎬 ││ 🎬 ││    │
│ └────┘└────┘└────┘└──  │
│                         │
│ ▶ Davom Ettirish        │
│ ┌────────┐┌────────┐   │
│ │ Movie  ││ Movie  │   │
│ │ ██░░░░ ││ ████░░ │   │
│ │ 35%    ││ 72%    │   │
│ └────────┘└────────┘   │
│                         │
│[Home][Search][Friends][Profile]│
└─────────────────────────┘
```

**Elementlar:**

**Header:**
- Left: "CineSync" logo text (violet gradient)
- Right: Notification bell icon with unread count badge (red circle)

**Hero Banner (auto-scroll carousel):**
- Full-width, 220px height
- Background: movie backdrop (blurred edges)
- LinearGradient overlay: transparent → `#211F1C`
- Movie title (h1, bold, white)
- Rating badge: ⭐ + score
- Genre tags (small chips)
- "Ko'rish" primary button + "Listga qo'shish" secondary button
- Dot indicators (5 ta, active: violet)
- Auto-scroll: 4 soniya interval
- Manual swipe: stops auto-scroll

**Movie Row — "Trendda":**
- Section title: "🔥 Trendda" (h2) + "Hammasi →" link
- Horizontal FlatList
- MovieCard: 120x180px poster, bottom: title (caption, 1 line) + rating badge
- Card radius: 12px
- Shadow: small

**Movie Row — "Eng Yuqori Reyting":**
- Xuddi Trendda kabi, lekin top-rated data

**Movie Row — "Davom Ettirish":**
- MovieCard + progress bar (violet fill)
- Progress text: "35% ko'rildi"
- Faqat agar foydalanuvchi avval ko'rgan bo'lsa

**Pull-to-refresh:** violet spinner
**Skeleton loading:** 3 ta shimmer row

---

### 9. MOVIE DETAIL SCREEN

**Maqsad:** Film haqida to'liq ma'lumot + ko'rish boshlash

```
┌─────────────────────────┐
│ ← ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ♡ ↗ │ ← Animated header (scroll da paydo)
│─────────────────────────│
│                         │
│  [Backdrop Image]       │
│  Parallax effect        │
│  Gradient overlay ↓     │
│                         │
│  Movie Title            │
│  2024 | 2h 15m | PG-13  │
│                         │
│  ⭐⭐⭐⭐☆  4.2/5  (1.2k) │
│  [Tap to rate]          │
│                         │
│  [Action] [Thriller]    │
│  [Sci-Fi]               │
│                         │
│  ▶ Ko'rish  ██████░░ 65%│
│  [Watch Party Yaratish] │
│                         │
│  ── Tavsif ──────────── │
│  Lorem ipsum dolor sit  │
│  amet, consectetur...   │
│  [Ko'proq ko'rish]      │
│                         │
│  ── Aktyorlar ───────── │
│  ┌──┐┌──┐┌──┐┌──┐      │
│  │👤││👤││👤││👤│      │
│  │  ││  ││  ││  │      │
│  └──┘└──┘└──┘└──┘      │
│                         │
│  ── O'xshash Filmlar ── │
│  ┌────┐┌────┐┌────┐    │
│  │ 🎬 ││ 🎬 ││ 🎬 │    │
│  └────┘└────┘└────┘    │
└─────────────────────────┘
```

**Elementlar:**

**Parallax Header:**
- Backdrop image: full-width, 300px, parallax scroll effect
- Gradient overlay: transparent → `#211F1C` (bottom 40%)
- Scroll da header animated: title appears in nav bar

**Nav Bar (scroll da):**
- Back button (←)
- Movie title (fade-in on scroll)
- Favorite (♡) + Share (↗) icons

**Movie Info:**
- Title: h1, bold
- Meta: year | duration | rating badge
- Star rating widget: 5 stars, interactive (tap to rate)
- "Sizning bahoyingiz: 4/5" — agar baholangan bo'lsa
- Rating count: "(1.2k baho)"
- Genre chips: filled badges

**Action Buttons:**
- "▶ Ko'rish" — primary violet button, full-width
  - Agar progress bor: progress bar ko'rinadi + "Davom ettirish 65%"
  - Agar progress yo'q: "Ko'rishni Boshlash"
- "Watch Party Yaratish" — outlined secondary button

**Synopsis Section:**
- Collapsible text (3 qator, "Ko'proq" toggle)
- Full text expand/collapse animation

**Cast Section:**
- Horizontal scroll
- Circular avatars (60px) + actor name below
- Tap → actor detail (optional)

**Similar Movies:**
- Horizontal MovieCard row
- Tap → boshqa MovieDetail

---

### 10. VIDEO PLAYER SCREEN

**Maqsad:** Film ko'rish — to'liq ekran video player

```
┌─────────────────────────┐
│                         │
│  ← Movie Title      ⚙  │ ← Top bar (auto-hide)
│                         │
│                         │
│                         │
│   [VIDEO CONTENT]       │
│                         │
│                         │
│                         │
│          advancement     │
│  ⏪10  ▶/⏸  ⏩10       │ ← Center controls (auto-hide)
│                         │
│                         │
│  01:23:45 ══●═══ 02:15:00│ ← Seek bar (auto-hide)
│                         │
└─────────────────────────┘
```

**Elementlar:**

**Video Container:**
- Full screen, landscape support
- expo-av player (HLS/MP4 streaming)
- Background: pure black

**Top Bar (auto-hide 3.5s):**
- Left: back button (←) + movie title
- Right: settings gear (quality, subtitles)
- Semi-transparent dark gradient overlay

**Center Controls (auto-hide 3.5s):**
- Skip backward 10s (⏪)
- Play/Pause (▶/⏸) — large center button (56px)
- Skip forward 10s (⏩)
- Tap anywhere to toggle controls visibility

**Bottom Seek Bar (auto-hide 3.5s):**
- Current time (left)
- Seek slider: violet track, white thumb
- Total duration (right)
- Buffered indicator: lighter violet

**Progress Tracking:**
- Auto-save: har 30 soniyada server ga
- 90% ko'rilganda → "Completed" deb belgilash
- Resume: oxirgi to'xtagan joydan davom etish

**Orientation:**
- Landscape mode support
- Auto-rotate yoki manual toggle

---

### 11. SEARCH SCREEN (Tab 2: Search)

**Maqsad:** Film qidirish va genre bo'yicha filter

```
┌─────────────────────────┐
│  Qidirish               │
│ ┌─────────────────────┐ │
│ │ 🔍 Film qidiring... │ │
│ └─────────────────────┘ │
│                         │
│  Janrlar:               │
│  [All] [Action] [Comedy]│
│  [Drama] [Horror]       │
│  [Sci-Fi] [Thriller]    │
│  [Romance] [Animation]  │
│                         │
│  ── So'nggi Qidiruvlar ─│
│  🕐 Inception       ✕   │
│  🕐 Dark Knight     ✕   │
│  🕐 Interstellar    ✕   │
│            [Tozalash]   │
│                         │
│  ── Tavsiya Etilgan ─── │
│  ┌────┐┌────┐┌────┐    │
│  │ 🎬 ││ 🎬 ││ 🎬 │    │
│  └────┘└────┘└────┘    │
│                         │
│[Home][Search][Friends][Profile]│
└─────────────────────────┘
```

**Elementlar:**

**Search Input:**
- Rounded input, placeholder: "Film qidiring..."
- Left icon: 🔍
- Right: clear (✕) button (agar matn bor)
- Debounce: 300ms
- Focus da keyboard ochiladi

**Genre Filter:**
- Horizontal scrollable chips
- "All" default selected
- Active: violet filled
- Inactive: outline/surface
- Multi-select support

**Search History:**
- Recent searches list
- Each item: clock icon + text + remove (✕)
- "Tozalash" button — barcha tarixni o'chirish
- Tap → search avtomatik bajaradi
- AsyncStorage based

**Suggested/Popular:**
- Grid yoki horizontal row
- Agar search history bo'sh → popular movies

---

### 12. SEARCH RESULTS SCREEN

**Maqsad:** Qidiruv natijalari

```
┌─────────────────────────┐
│ ← "inception" natijalari│
│                         │
│ 42 ta natija topildi    │
│                         │
│ ┌───────────────────┐   │
│ │[Poster]  Title    │   │
│ │         ⭐ 8.8    │   │
│ │         2010|148m │   │
│ │         [Action]  │   │
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │[Poster]  Title    │   │
│ │         ⭐ 7.5    │   │
│ │         2022|120m │   │
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │[Poster]  Title    │   │
│ └───────────────────┘   │
│                         │
│  [Loading more...]      │
│                         │
│[Home][Search][Friends][Profile]│
└─────────────────────────┘
```

**Elementlar:**
- Back button + search query title
- Results count
- Vertical FlatList
- Each item: horizontal card
  - Left: movie poster (80x120px)
  - Right: title, rating, year|duration, genre chips
- Infinite scroll pagination
- Empty state: "Natija topilmadi" + illustration
- Loading: skeleton cards

---

### 13. FRIENDS SCREEN (Tab 3: Friends)

**Maqsad:** Do'stlar ro'yxati va so'rovlar

```
┌─────────────────────────┐
│ Do'stlar           [➕]  │
│─────────────────────────│
│ [Do'stlar (12)] [So'rovlar (3)]│
│─────────────────────────│
│                         │
│ 🟢 AhmadK    Gold 🥇    │
│    12,450 pts           │
│ ─────────────────────── │
│ 🟢 LazizbZ   Silver 🥈  │
│    3,200 pts            │
│ ─────────────────────── │
│ ⚫ DiloromA   Bronze 🥉  │
│    850 pts              │
│ ─────────────────────── │
│ 🟢 SardorM   Diamond 💎 │
│    45,000 pts           │
│ ─────────────────────── │
│                         │
│  (Pull to refresh)      │
│                         │
│[Home][Search][Friends][Profile]│
└─────────────────────────┘
```

**Tab: Do'stlar**

**Elementlar:**
- Header: "Do'stlar" + "➕" add button → FriendSearchScreen
- Tab toggle: "Do'stlar (count)" | "So'rovlar (count)"
- Friend list item:
  - Online indicator: 🟢 green (online), ⚫ gray (offline)
  - Avatar (40px circle)
  - Username (bold)
  - Rank badge (colored): Bronze/Silver/Gold/Platinum/Diamond
  - Points
- Tap → FriendProfileScreen
- Pull-to-refresh
- Empty state: "Hali do'stlar yo'q" + "Qo'shish" button

**Tab: So'rovlar**

```
┌─────────────────────────┐
│ [Do'stlar (12)] [So'rovlar (3)]│
│─────────────────────────│
│                         │
│ 👤 NewUser123           │
│    2 kun oldin          │
│    [✓ Qabul] [✗ Rad]   │
│ ─────────────────────── │
│ 👤 MovieFan99           │
│    5 soat oldin         │
│    [✓ Qabul] [✗ Rad]   │
│ ─────────────────────── │
│                         │
│  So'rovlar yo'q         │
│                         │
└─────────────────────────┘
```

**Elementlar:**
- Pending request item:
  - Avatar + username
  - Time ago
  - Accept (✓ green) + Reject (✗ red) buttons
- Empty state: "So'rovlar yo'q"

---

### 14. FRIEND SEARCH SCREEN

**Maqsad:** Yangi do'st qidirish va qo'shish

```
┌─────────────────────────┐
│ ← Do'st Qidirish       │
│ ┌─────────────────────┐ │
│ │ 🔍 Username...      │ │
│ └─────────────────────┘ │
│                         │
│ 👤 FoundUser1  Silver   │
│    [Do'st qo'shish]    │
│ ─────────────────────── │
│ 👤 FoundUser2  Gold     │
│    [Yuborildi ✓]        │
│ ─────────────────────── │
│ 👤 FoundUser3  Bronze   │
│    [Do'stingiz ✓]       │
│                         │
└─────────────────────────┘
```

**Elementlar:**
- Search input (username bo'yicha)
- Result list:
  - Avatar + username + rank
  - Button states: "Do'st qo'shish" / "Yuborildi ✓" / "Do'stingiz ✓"
- Debounce search

---

### 15. FRIEND PROFILE SCREEN

**Maqsad:** Do'stning profili, statistikasi

```
┌─────────────────────────┐
│ ←                       │
│                         │
│      [Avatar 80px]      │
│      username123        │
│      Gold 🥇 | 12,450   │
│      "Bio text here"    │
│                         │
│ ┌────────┬────────┐     │
│ │🎬 Films│⏱ Soat │     │
│ │  156   │  234   │     │
│ ├────────┼────────┤     │
│ │⚔ G'alaba│🏅 Badge│    │
│ │   42   │   18   │     │
│ └────────┴────────┘     │
│                         │
│ [⚔ Bellashish]          │
│ [📺 Watch Party Taklif] │
│                         │
│ ── Yutuqlar ─────────── │
│ [🏆][🏆][🏆][🏆][🏆]  │
│                         │
│ [Do'stlikdan chiqish]   │
└─────────────────────────┘
```

**Elementlar:**
- Avatar (80px), username, rank badge + points, bio
- Stats grid (2x2): films, hours, wins, achievements
- Action buttons:
  - "Bellashish" → BattleCreateScreen (pre-filled)
  - "Watch Party Taklif" → WatchPartyCreateScreen
- Achievements preview (horizontal row, first 5-10)
- "Do'stlikdan chiqish" button (danger, confirmation dialog)

---

### 16. PROFILE SCREEN (Tab 4: Profile)

**Maqsad:** O'z profilim — statistika, yutuqlar, sozlamalar

```
┌─────────────────────────┐
│ Profilim           ⚙    │
│─────────────────────────│
│                         │
│      [Avatar 90px]      │
│      MyUsername          │
│      Gold 🥇             │
│      "My bio here..."   │
│                         │
│  ████████████░░ 12,450  │
│  Gold → Platinum: 2,550 │
│                         │
│ ┌────────┬────────┐     │
│ │🎬 Films│⏱ Soat │     │
│ │  89    │  156   │     │
│ ├────────┼────────┤     │
│ │⚔ G'alaba│🏅 Badge│    │
│ │   23   │   12   │     │
│ └────────┴────────┘     │
│                         │
│ [📊 Statistika →]       │
│ [🏅 Yutuqlar →]         │
│ [⚙ Sozlamalar →]        │
│                         │
│ [🚪 Chiqish]            │
│                         │
│[Home][Search][Friends][Profile]│
└─────────────────────────┘
```

**Elementlar:**
- Settings gear (⚙) → SettingsScreen
- Avatar (90px, circle) + edit overlay icon
- Username (h1) + rank badge (colored)
- Bio text
- Rank progress bar:
  - Violet filled bar
  - "Gold → Platinum: 2,550 points kerak"
  - Current points / next rank threshold
- Stats grid (2x2):
  - 🎬 Ko'rilgan filmlar
  - ⏱ Ko'rilgan soatlar
  - ⚔ G'alabalar (battles)
  - 🏅 Yutuqlar (achievements)
- Navigation links:
  - "Statistika →" → StatsScreen
  - "Yutuqlar →" → AchievementsScreen
  - "Sozlamalar →" → SettingsScreen
- "Chiqish" button (red, confirmation dialog)

---

### 17. STATS SCREEN

**Maqsad:** Batafsil statistika va faollik grafigi

```
┌─────────────────────────┐
│ ← Statistika            │
│─────────────────────────│
│                         │
│ ┌───────────────────┐   │
│ │  Gold 🥇           │   │
│ │  12,450 / 15,000  │   │
│ │  ████████████░░░  │   │
│ │  2,550 kerak      │   │
│ └───────────────────┘   │
│                         │
│  Win Rate               │
│  ████████████░░  78%    │
│  18 / 23 battles        │
│                         │
│ ┌────────┬────────┐     │
│ │🎬  89  │⏱  156h │     │
│ │ Films  │ Hours  │     │
│ ├────────┼────────┤     │
│ │⚔  23   │👥  45  │     │
│ │Battles │Friends │     │
│ ├────────┼────────┤     │
│ │🔥  12  │📅  28  │     │
│ │Streak  │Longest │     │
│ └────────┴────────┘     │
│                         │
│  Haftalik Faollik       │
│  ┌─┐                   │
│  │ │┌─┐   ┌─┐         │
│  │ ││ │┌─┐│ │┌─┐┌─┐■ │
│  Du Se Ch Pa Ju Sh Ya   │
│                         │
└─────────────────────────┘
```

**Elementlar:**

**Rank Card:**
- Current rank icon + name
- Points progress: current / next threshold
- Progress bar (colored by rank)
- "X points kerak" text

**Win Rate:**
- Circular yoki linear progress
- Percentage (bold, large)
- "X / Y battles" subtitle

**Stats Grid (3x2):**
- Films watched (🎬)
- Hours watched (⏱)
- Battles total (⚔)
- Friends count (👥)
- Current streak (🔥)
- Longest streak (📅)
- Har birida: icon + number (large) + label (caption)

**Activity Chart (7 kun):**
- Bar chart: 7 bar (Du-Ya)
- Violet bars, oxirgi kun accent (brighter)
- Y-axis: soat yoki film soni
- Animated bars (mount da o'sadi)

---

### 18. ACHIEVEMENTS SCREEN

**Maqsad:** Barcha yutuqlar (ochilgan va qulflangan)

```
┌─────────────────────────┐
│ ← Yutuqlar              │
│   12 / 48 ochilgan      │
│─────────────────────────│
│                         │
│ ┌──────┐┌──────┐┌──────┐│
│ │  🏆  ││  🎬  ││  ⚔   ││
│ │      ││      ││      ││
│ │First ││Movie ││Battle││
│ │Watch ││Buff  ││King  ││
│ │Common││ Rare ││ Epic ││
│ └──────┘└──────┘└──────┘│
│ ┌──────┐┌──────┐┌──────┐│
│ │  🔥  ││  🔒  ││  🔒  ││
│ │      ││ ???  ││ ???  ││
│ │7-Day ││      ││      ││
│ │Streak││Locked││Locked││
│ │Legend.││      ││      ││
│ └──────┘└──────┘└──────┘│
│ ┌──────┐┌──────┐┌──────┐│
│ │  🔒  ││  🔒  ││  🔒  ││
│ │ ???  ││ ???  ││ ???  ││
│ └──────┘└──────┘└──────┘│
│                         │
└─────────────────────────┘
```

**Elementlar:**

**Header:**
- Title + progress: "12 / 48 ochilgan"

**Achievement Grid (3 ustunli):**

**Ochilgan Achievement Card:**
- Background: `#2A2825` + rarity colored border (left yoki full border)
- Icon/emoji (32px)
- Title (caption, bold)
- Rarity label: colored text
  - Common: gray
  - Rare: ko'k
  - Epic: binafsha
  - Legendary: oltin glow
  - Secret: pushti
- Subtle glow effect (legendary/secret)

**Qulflangan Achievement Card:**
- Background: `#2A2825` (darker, desaturated)
- "🔒" lock icon
- "???" text
- No border color

**Tap interaction:**
- Ochilgan: modal/bottom sheet with full description + unlock date
- Qulflangan: "Bu yutuqni qanday ochish mumkin" hint (agar mavjud)

---

### 19. SETTINGS SCREEN

**Maqsad:** App sozlamalari

```
┌─────────────────────────┐
│ ← Sozlamalar            │
│─────────────────────────│
│                         │
│  👤 Profil              │
│ ┌───────────────────┐   │
│ │ Profilni tahrirlash →││
│ │ Parolni o'zgartirish →││
│ └───────────────────┘   │
│                         │
│  🔔 Bildirishnomalar    │
│ ┌───────────────────┐   │
│ │ Push notifikatsiya ○ ││
│ │ Watch Party taklif ● ││
│ │ Battle taklif      ● ││
│ │ Achievement        ● ││
│ └───────────────────┘   │
│                         │
│  🎬 Video               │
│ ┌───────────────────┐   │
│ │ Auto-play        ○  ││
│ │ Video sifati    [HD]││
│ │ WiFi da yuklash  ●  ││
│ └───────────────────┘   │
│                         │
│  📱 Ilova               │
│ ┌───────────────────┐   │
│ │ Til          [O'z] ││
│ │ Cache tozalash   → ││
│ │ Versiya    1.0.0   ││
│ └───────────────────┘   │
│                         │
│  [🚪 Hisobni o'chirish] │
│                         │
└─────────────────────────┘
```

**Elementlar:**

**Profile Section:**
- "Profilni tahrirlash" → edit profile modal/screen
- "Parolni o'zgartirish" → change password

**Notifications Section:**
- Toggle switches (●/○) for each notification type
- Push, Watch Party, Battle, Achievement

**Video Section:**
- Auto-play toggle
- Quality selector: dropdown (Auto/SD/HD/Full HD)
- WiFi only download toggle

**App Section:**
- Language selector
- Clear cache
- App version

**Danger Zone:**
- "Hisobni o'chirish" — red text, confirmation dialog (double confirm)

---

### 20. NOTIFICATIONS SCREEN (Modal)

**Maqsad:** Barcha bildirishnomalar

```
┌─────────────────────────┐
│ ← Bildirishnomalar      │
│           [Hammasini ✓]  │
│─────────────────────────│
│                         │
│ 🔵 AhmadK sizni Watch   │
│    Party ga taklif qildi │
│    2 daqiqa oldin       │
│    [Qo'shilish] [Rad]  │
│ ─────────────────────── │
│ 🔵 Yangi yutuq!         │
│    "Movie Buff" ochildi │
│    1 soat oldin         │
│ ─────────────────────── │
│ ⚪ SardorM battle       │
│    g'olib bo'ldi!       │
│    3 soat oldin         │
│ ─────────────────────── │
│ ⚪ DiloromA do'stlik     │
│    so'rovi yubordi      │
│    Kecha                │
│    [Qabul] [Rad]        │
│ ─────────────────────── │
│                         │
│  (Pull to refresh)      │
└─────────────────────────┘
```

**Elementlar:**

**Header:**
- "Bildirishnomalar" title
- "Hammasini o'qildi" button

**Notification Item:**
- Unread indicator: 🔵 (blue dot) / ⚪ (read)
- Icon based on type:
  - friend_request: 👤
  - watch_party_invite: 📺
  - battle_invite: ⚔
  - achievement_unlocked: 🏅
- Message text (bold username + action)
- Timestamp: relative ("2 daqiqa oldin", "Kecha")
- Action buttons (agar kerak): Accept/Reject, Join

**Interaction:**
- Tap → tegishli ekranga navigatsiya
- Swipe left → delete (optional)
- Pull-to-refresh

---

### 21. WATCH PARTY CREATE SCREEN (Modal)

**Maqsad:** Watch Party yaratish

```
┌─────────────────────────────┐
│ ╳  Watch Party Yaratish     │
│─────────────────────────────│
│                             │
│  Film Tanlang:              │
│  ┌────────────────────────┐ │
│  │ 🔍 Film qidirish...    │ │
│  └────────────────────────┘ │
│  ┌────────────────────┐     │
│  │[Poster] Movie Name │     │
│  │         ⭐ 8.5     │     │
│  └────────────────────┘     │
│                             │
│  yoki                       │
│                             │
│  Video URL:                 │
│  ┌────────────────────────┐ │
│  │ https://...            │ │
│  └────────────────────────┘ │
│                             │
│  Do'stlarni Taklif:         │
│  ┌────────────────────────┐ │
│  │ 🔍 Do'st qidirish...  │ │
│  └────────────────────────┘ │
│  [✓ AhmadK] [✓ SardorM]   │
│  [  DiloromA] [  LazizbZ]  │
│                             │
│  [████ Yaratish █████████] │
│                             │
└─────────────────────────────┘
```

**Elementlar:**
- Close (╳) button
- Movie selection: search + select
- OR video URL input (any video URL)
- Friend invitation: multi-select checkboxes
- Selected friends: violet chips
- "Yaratish" button → WatchPartyScreen ga navigate

---

### 22. WATCH PARTY SCREEN (Modal)

**Maqsad:** Birga film ko'rish — real-time sinxron

```
┌─────────────────────────┐
│ [VIDEO PLAYER]          │
│                         │
│ Movie Title        [✕]  │
│ ⏪  ▶  ⏩    00:15/01:30│
│─────────────────────────│
│ 👥 3 kishi onlayn       │
│ [👤A][👤B][👤C]          │
│─────────────────────────│
│                         │
│ AhmadK: Bu joyini yaxshi│
│          ko'rdingmi? 😂 │
│                         │
│ SardorM: Ha, zo'r! 🔥   │
│                         │
│ Sen: ...                 │
│                         │
│─────────────────────────│
│ 😀😂😍🔥👏             │
│ ┌─────────────────┐ [↗] │
│ │ Xabar yozing... │     │
│ └─────────────────┘     │
└─────────────────────────┘
```

**Elementlar:**

**Video Section (top 40%):**
- expo-av player (synced across users)
- Owner controls: play/pause, seek ±10s
- Members: faqat ko'rish (controls disabled)
- Sync indicator: "Sinxronlanmoqda..." toast

**Members Bar:**
- Online count + avatar stack
- Tap → members list bottom sheet

**Chat Panel (bottom 60%):**
- Message list (FlatList, inverted)
- Each message: avatar + username + text + timestamp
- Auto-scroll to bottom on new message

**Emoji Reaction Bar:**
- 5-7 quick emoji buttons (😀😂😍🔥👏)
- Tap → floating emoji animation (rise + fade)

**Message Input:**
- Text input + send button
- Keyboard avoiding

**Owner Badge:**
- Owner has crown 👑 badge
- Special controls visible only to owner

---

### 23. BATTLE CREATE SCREEN (Modal)

**Maqsad:** Battle yaratish

```
┌─────────────────────────────┐
│ ╳  Battle Yaratish          │
│─────────────────────────────│
│                             │
│  Battle Turi:               │
│  [🆚 1v1]  [👥 Guruh]      │
│                             │
│  Davomiylik:                │
│  [ 3 kun ] [ 5 kun ] [7 kun]│
│                             │
│  Raqibni Tanlang:           │
│  ┌────────────────────────┐ │
│  │ 🔍 Do'st qidirish...  │ │
│  └────────────────────────┘ │
│                             │
│  👤 AhmadK    Gold 🥇  [✓] │
│  👤 SardorM   Silver 🥈 [ ]│
│                             │
│  Qoidalar:                  │
│  ┌────────────────────────┐ │
│  │ Kim ko'proq film       │ │
│  │ ko'rsa g'olib!         │ │
│  │ Minimal: 10 daqiqa     │ │
│  └────────────────────────┘ │
│                             │
│  [████ Boshlash ██████████] │
│                             │
└─────────────────────────────┘
```

**Elementlar:**
- Close button
- Battle type toggle: 1v1 / Group
- Duration selector: 3/5/7 kun chips
- Opponent selection: friend search + select
- Rules preview card
- "Boshlash" → battle invite yuboriladi

---

### 24. BATTLE SCREEN (Modal)

**Maqsad:** Aktiv battle holati va leaderboard

```
┌─────────────────────────────┐
│ ← Battle                    │
│─────────────────────────────│
│                             │
│  ┌─────────────────────────┐│
│  │  🆚  AKTIV BATTLE       ││
│  │  3 kun qoldi            ││
│  │                         ││
│  │  👤 Sen        👤 Ahmad ││
│  │  ████████░░   ██████░░░ ││
│  │  12 films     8 films   ││
│  │  18.5 soat    12 soat   ││
│  │                         ││
│  │  G'OLIB: Sen! 🎉        ││
│  └─────────────────────────┘│
│                             │
│  ── Mening Battlelarim ──── │
│  ┌─────────────────────┐   │
│  │ vs SardorM | 5 kun  │   │
│  │ ⏳ 2 kun qoldi       │   │
│  │ Sen: 8 | U: 11      │   │
│  └─────────────────────┘   │
│                             │
│  ── Takliflar ───────────── │
│  ┌─────────────────────┐   │
│  │ DiloromA → 3 kun    │   │
│  │ [✓ Qabul] [✗ Rad]  │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Elementlar:**

**Active Battle Card:**
- Status badge: PENDING / ACTIVE / COMPLETED
- Countdown: "X kun Y soat qoldi"
- VS layout: two avatars facing each other
- Progress bars (animated): films watched comparison
- Stats: films count, total hours
- Result (completed): "G'OLIB!" celebration yoki "Yutqazdingiz"

**My Battles List:**
- Battle cards list
- Each: opponent, duration, remaining time, current scores
- Tap → battle detail

**Invitations List:**
- Pending battle invitations
- Accept/Reject buttons
- Inviter info + battle duration

**Battle States:**
- Pending: "Kutilmoqda..." — opponent accept qilmagan
- Active: countdown + live scores
- Completed: winner announcement + final scores

---

## NAVIGATION FLOW DIAGRAM

```
                          ┌─────────┐
                          │  SPLASH │
                          └────┬────┘
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────┐         ┌──────────┐
              │ONBOARDING│         │   MAIN   │
              └────┬─────┘         │ NAVIGATOR│
                   ▼               └────┬─────┘
              ┌──────────┐              │
              │  LOGIN   │◄─────────────┤ (logout)
              └──┬───┬───┘              │
                 │   │                  │
        ┌────────┘   └────────┐         │
        ▼                     ▼         │
  ┌──────────┐         ┌──────────┐    │
  │ REGISTER │         │ FORGOT   │    │
  └────┬─────┘         │ PASSWORD │    │
       ▼               └──────────┘    │
  ┌──────────┐                         │
  │ VERIFY   │                         │
  │ EMAIL    │                         │
  └────┬─────┘                         │
       ▼                               │
  ┌──────────┐                         │
  │ PROFILE  │─────────────────────────┘
  │ SETUP    │
  └──────────┘

                    MAIN NAVIGATOR
    ┌──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│  HOME  ││ SEARCH ││FRIENDS ││PROFILE │
│  TAB   ││  TAB   ││  TAB   ││  TAB   │
└───┬────┘└───┬────┘└───┬────┘└───┬────┘
    │         │         │         │
    ▼         ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│ MOVIE  ││SEARCH  ││FRIEND  ││ STATS  │
│ DETAIL ││RESULTS ││PROFILE ││        │
└───┬────┘└────────┘└────────┘└────────┘
    │                         ┌────────┐
    ▼                         │ACHIEVE-│
┌────────┐                    │ MENTS  │
│ VIDEO  │                    └────────┘
│ PLAYER │                    ┌────────┐
└────────┘                    │SETTINGS│
                              └────────┘

              MODAL NAVIGATOR
    ┌──────────────┬───────────────┐
    ▼              ▼               ▼
┌────────┐   ┌────────┐    ┌──────────┐
│ WATCH  │   │ BATTLE │    │NOTIFICA- │
│ PARTY  │   │        │    │  TIONS   │
│ CREATE │   │ CREATE │    └──────────┘
└───┬────┘   └───┬────┘
    ▼            ▼
┌────────┐   ┌────────┐
│ WATCH  │   │ BATTLE │
│ PARTY  │   │ SCREEN │
└────────┘   └────────┘
```

---

## ANIMATION VA MICRO-INTERACTIONS

### Screen Transitions
- **Stack push:** slide from right (iOS style)
- **Modal:** slide from bottom
- **Tab switch:** instant (no animation)
- **Auth → Main:** fade transition

### Component Animations
- **Hero Banner:** smooth scroll + auto-timer reset
- **Movie Cards:** subtle scale on press (0.95)
- **Achievement Unlock:** bounce + glow animation
- **Battle Progress:** animated width transition
- **Emoji Float:** rise up + fade out (2s)
- **Skeleton:** shimmer left-to-right

### Loading States
- **Pull-to-refresh:** violet spinner (top)
- **Infinite scroll:** spinner at bottom
- **Button loading:** spinner replaces text
- **Image loading:** blur placeholder → sharp (expo-image)

---

## RESPONSIVE DESIGN

- **Small phones** (< 375px): 2 column grid, smaller cards
- **Standard** (375-414px): default layout
- **Large phones** (414px+): slightly more spacing
- **Tablets:** 3-4 column grids, wider content area
- **Landscape:** video player full screen, rest portrait preferred

---

## ACCESSIBILITY

- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Screen reader labels on all interactive elements
- Focus indicators on inputs
- Haptic feedback on important actions (achievement unlock, battle win)

---

## DESIGN DELIVERABLES CHECKLIST

- [ ] Splash Screen
- [ ] Onboarding (3-4 slides)
- [ ] Login Screen
- [ ] Register Screen
- [ ] Verify Email Screen
- [ ] Forgot Password Screen
- [ ] Profile Setup Screen
- [ ] Home Screen (with Hero Banner, Movie Rows)
- [ ] Movie Detail Screen
- [ ] Video Player Screen (controls overlay)
- [ ] Search Screen (empty + active)
- [ ] Search Results Screen
- [ ] Friends Screen (Friends tab + Requests tab)
- [ ] Friend Search Screen
- [ ] Friend Profile Screen
- [ ] Profile Screen
- [ ] Stats Screen
- [ ] Achievements Screen
- [ ] Settings Screen
- [ ] Notifications Screen
- [ ] Watch Party Create Screen
- [ ] Watch Party Screen (video + chat)
- [ ] Battle Create Screen
- [ ] Battle Screen (active + completed)
- [ ] Empty States (search, friends, notifications, etc.)
- [ ] Error States
- [ ] Loading/Skeleton States

**Jami: ~25 asosiy ekran + 10+ state variatsiyalari**

---

*CineSync Screenflow Design Prompt v1.0 | 2026-03-11*
