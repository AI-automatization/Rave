# CineSync Web — Design Guide
> Next.js 14 · Tailwind CSS · Dark Mode Only
> Bu fayl dizayn qiluvchi yoki yangi dasturchi uchun — barcha sahifa va komponentni bir xil ko'rinishda qilish uchun.

---

## 1. RANGLAR (Color Palette)

Barcha ranglar **hardcoded hex** bilan ishlatiladi (Tailwind custom token emas).

### Fon ranglari (qoradan yoruqqa)

| Nom | Hex | Ishlatish joyi |
|-----|-----|----------------|
| `bg-void` | `#060608` | Eng chuqur fon (root) |
| `bg-base` | `#0A0A0F` | Sahifa asosi, input foni |
| `bg-dark` | `#0d0d14` | Sidebar, nav foni |
| `bg-elevated` | `#111118` | Card, modal, panel |
| `bg-overlay` | `#16161F` | Hover overlay |
| `bg-surface` | `#1C1C28` | Secondary card |
| `bg-muted` | `#242433` | Divider, subtle element |

### Asosiy rang — Purple (Brand)

| Holat | Hex | Tailwind ekvivalenti |
|-------|-----|----------------------|
| Default | `#7C3AED` | `violet-600` |
| Hover | `#6D28D9` | `violet-700` |
| Background tint | `bg-[#7C3AED]/10` | 10% opacity |
| Background tint medium | `bg-[#7C3AED]/15` | 15% opacity |
| Border | `border-[#7C3AED]/30` | 30% opacity |
| Glow (small) | `shadow-[0_0_12px_rgba(124,58,237,0.4)]` | — |
| Glow (large) | `shadow-[0_0_30px_rgba(124,58,237,0.55)]` | — |

### Matn ranglari

| Daraja | Tailwind class | Ishlatish |
|--------|----------------|-----------|
| Asosiy matn | `text-white` | Sarlavhalar, muhim matn |
| Ikkinchi daraja | `text-zinc-300` | Label, qo'shimcha matn |
| Uchinchi daraja | `text-zinc-400` | Hint, description |
| Dim | `text-zinc-500` | Placeholder, disabled |
| Eng dim | `text-zinc-600` | Icon, meta |

### Status ranglari

| Status | Text | Background | Border |
|--------|------|------------|--------|
| Muvaffaqiyat (ochiq/online) | `text-emerald-400` | `bg-emerald-500/20` | `border-emerald-500/30` |
| Ogohlantirish (yopiq/pending) | `text-amber-400` | `bg-amber-500/20` | `border-amber-500/30` |
| Xato | `text-red-400` | `bg-red-500/10` | `border-red-500/30` |
| Ma'lumot | `text-blue-400` | `bg-blue-500/20` | `border-blue-500/30` |

### Achievement/Rank ranglari

| Darajа | Rang |
|--------|------|
| Bronze | `text-amber-500` |
| Silver | `text-zinc-400` |
| Gold | `text-amber-400` |
| Diamond / Legend | `text-[#7C3AED]` |

| Rarity | Border | Glow | Text |
|--------|--------|------|------|
| Common | `border-white/[0.08]` | — | `text-zinc-500` |
| Rare | `border-blue-500/30` | `shadow-[0_0_12px_rgba(59,130,246,0.12)]` | `text-blue-400` |
| Epic | `border-[#7C3AED]/40` | `shadow-[0_0_12px_rgba(124,58,237,0.15)]` | `text-[#7C3AED]` |
| Legendary | `border-amber-400/50` | `shadow-[0_0_16px_rgba(251,191,36,0.2)]` | `text-amber-400` |

---

## 2. TIPOGRAFIYA (Typography)

```
font-display → Bebas Neue (sarlavhalar, logo, katta raqamlar)
font-body    → DM Sans (barcha matn)
```

### Ishlatish

```tsx
// Katta sarlavha (page title)
<h1 className="text-3xl font-display text-white">BATTLE</h1>

// Orta sarlavha
<h2 className="text-base font-bold text-white">Faol kanallar</h2>

// Kichik sarlavha (section label)
<h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">ACTIVE</h3>

// Asosiy matn
<p className="text-sm text-zinc-400">Tavsif matni</p>

// Meta matn (vaqt, label)
<span className="text-xs text-zinc-600">2 soat oldin</span>

// Badge matn
<span className="text-[10px] font-semibold">LIVE</span>
```

---

## 3. CHEGARA RADIYUSI (Border Radius)

| Daraja | Class | Ishlatish |
|--------|-------|-----------|
| Kichik | `rounded-lg` (8px) | Icon button, badge, tag |
| O'rta | `rounded-xl` (12px) | Input, button, kichik card |
| Katta | `rounded-2xl` (16px) | Card, modal, panel |
| Doira | `rounded-full` | Avatar, dot indicator |

**Qoida:** Hamma narsada `rounded-xl` yoki `rounded-2xl`. Boshqa qiymatlar ishlatma.

---

## 4. CHEGARALAR (Borders)

```
Asosiy chegara:  border border-white/[0.06]   ← barcha card, panel
Kuchroq chegara: border border-white/[0.08]   ← modal
Input default:   border border-zinc-800        ← form element
Input hover:     hover:border-zinc-700
Input focus:     focus:border-[#7C3AED]/50
```

---

## 5. KOMPONENTLAR

### 5.1 Buttons

```tsx
// PRIMARY — asosiy harakat
<button className="h-10 px-5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold
  hover:bg-[#6D28D9] transition-all shadow-[0_0_16px_rgba(124,58,237,0.3)]
  hover:shadow-[0_0_30px_rgba(124,58,237,0.55)] active:scale-[0.98]">
  Bosish
</button>

// SECONDARY — ikkinchi darajali harakat
<button className="h-10 px-5 rounded-xl border border-white/10 text-slate-400 text-sm
  hover:text-white hover:border-white/20 transition-all">
  Bekor
</button>

// GHOST — minimal
<button className="h-8 px-3 rounded-xl border border-[#7C3AED]/30 text-[#7C3AED]
  text-xs font-semibold hover:bg-[#7C3AED]/10 transition-colors">
  Yangi +
</button>

// ICON BUTTON — faqat icon
<button className="w-7 h-7 rounded-lg text-zinc-600 hover:text-zinc-300
  hover:bg-white/[0.06] flex items-center justify-center transition-all">
  <FaTimes size={14} />
</button>

// DANGER — xavfli harakat (o'chirish va h.k.)
<button className="h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/20
  text-red-400 text-sm hover:bg-red-500/20 transition-colors">
  O'chirish
</button>

// LOADING STATE — istalgan buttonda
<button disabled className="... disabled:opacity-50">
  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
  Yuklanmoqda...
</button>
```

**Balandlik standartlari:**
- Kichik: `h-7` (28px)
- O'rta: `h-9` (36px)
- Asosiy: `h-10` (40px)
- Katta: `h-11` (44px) / `h-12` (48px)

---

### 5.2 Cards

```tsx
// ASOSIY CARD
<div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4">
  ...
</div>

// HOVER CARD (bosiladigan)
<div className="group bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden
  hover:border-[#7C3AED]/40 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/5">
  ...
</div>

// BANNER/HERO CARD (gradientli)
<div className="relative rounded-2xl overflow-hidden
  bg-gradient-to-br from-[#7C3AED]/30 via-[#111118] to-[#0a0a0f]
  border border-[#7C3AED]/20 p-8 md:p-12">
  ...
</div>

// MUTED CARD (ikkinchi darajali)
<div className="rounded-2xl bg-white/[0.04] border border-white/[0.04] p-4">
  ...
</div>
```

---

### 5.3 Inputs

```tsx
// ASOSIY INPUT
<input
  className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-white/[0.08]
    text-zinc-200 text-sm placeholder-zinc-600
    focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30
    transition-all"
  placeholder="Kiriting..."
/>

// KATTA INPUT (form sahifalarda)
<input
  className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800
    text-zinc-200 placeholder-zinc-600
    focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/50
    transition-all duration-200 hover:border-zinc-700"
/>

// ICON BILAN INPUT (left icon)
<div className="relative">
  <FaEnvelope size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
  <input className="... pl-9" />
</div>

// LABEL + INPUT to'plami
<div>
  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
    Maydon nomi
  </label>
  <input className="..." />
  {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
</div>
```

---

### 5.4 Modals

```tsx
// BACKDROP
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

// MODAL CONTAINER
<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
  <div className="w-full max-w-sm rounded-2xl bg-[#111118] border border-white/[0.08] p-6 space-y-5">

    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SomeIcon className="text-[#7C3AED]" />
        <h3 className="font-display text-xl text-white">Modal sarlavha</h3>
      </div>
      <button onClick={onClose} className="w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-300
        hover:bg-white/[0.06] flex items-center justify-center transition-all">
        <FaTimes size={14} />
      </button>
    </div>

    {/* Content */}
    ...

    {/* Footer buttons */}
    <div className="flex gap-2">
      <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors">
        Bekor
      </button>
      <button className="flex-1 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
        Tasdiqlash
      </button>
    </div>

  </div>
</div>

// Framer Motion bilan (animate)
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {open && (
    <>
      <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full max-w-sm rounded-2xl bg-[#111118] border border-white/[0.08] p-6">
          ...
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

### 5.5 Badges / Tags

```tsx
// STATUS BADGE — ochiq xona
<span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
  bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
  <FaGlobe size={8} /> Ochiq
</span>

// STATUS BADGE — yopiq xona
<span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
  bg-amber-500/20 border border-amber-500/30 text-amber-400">
  <FaLock size={8} /> Yopiq
</span>

// LIVE DOT
<div className="flex items-center gap-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
  <span className="text-[10px] text-white/70 font-medium">LIVE</span>
</div>

// GENERIC TAG
<span className="text-xs font-semibold px-2.5 py-1 rounded-lg
  bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED]">
  Epic
</span>
```

---

### 5.6 Filter Tabs (Toggle)

```tsx
// 2-3 variant tanlash uchun (radio button uslubi)
<div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-white/[0.06] w-fit">
  {tabs.map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setActive(key)}
      className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
        active === key
          ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

---

### 5.7 Loading States

```tsx
// SKELETON — card uchun
<div className="bg-[#111118] rounded-2xl overflow-hidden animate-pulse">
  <div className="aspect-video bg-white/[0.04]" />
  <div className="p-3 space-y-2">
    <div className="h-3 bg-white/[0.04] rounded w-3/4" />
    <div className="h-3 bg-white/[0.04] rounded w-1/2" />
  </div>
</div>

// SKELETON — square grid uchun
<div className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />

// SPINNER — button ichida
<div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
```

---

### 5.8 Empty State

```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
    <SomeIcon size={24} className="text-slate-600" />
  </div>
  <div>
    <p className="text-slate-300 font-medium">Hali hech narsa yo'q</p>
    <p className="text-sm text-slate-600 mt-1">Birinchi bo'lib qo'shing!</p>
  </div>
  <button className="h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold
    hover:bg-[#6D28D9] transition-all">
    Qo'shish
  </button>
</div>
```

---

### 5.9 Error Alert

```tsx
<div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3">
  Xato xabari bu yerda
</div>
```

---

### 5.10 Progress Bar

```tsx
// Oddiy progress bar (masalan achievement completion)
<div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
  <div
    className="h-full rounded-full bg-amber-400 transition-all duration-700"
    style={{ width: `${percent}%` }}
  />
</div>
<p className="text-xs text-zinc-600 text-right">{percent}% bajarildi</p>
```

---

### 5.11 Section Header

```tsx
// Page section sarlavhasi
<div className="flex items-center justify-between">
  <div>
    <h2 className="text-base font-bold text-white">Bo'lim nomi</h2>
    <p className="text-xs text-slate-500 mt-0.5">Qo'shimcha tavsif</p>
  </div>
  <button className="...">Harakat</button>
</div>

// Kichik section label (status marker bilan)
<div className="flex items-center gap-2 mb-3">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
    ACTIVE
  </h2>
</div>
```

---

### 5.12 User Avatar

```tsx
// Avatar (8x8 = 32px, yoki 10x10 = 40px)
<div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30
  flex items-center justify-center overflow-hidden">
  {user.avatar ? (
    <Image src={user.avatar} alt={user.username} width={32} height={32}
      className="object-cover w-full h-full" unoptimized />
  ) : (
    <span className="text-xs font-bold text-[#7C3AED]">
      {user.username[0].toUpperCase()}
    </span>
  )}
</div>
```

---

## 6. LAYOUT

### Sidebar (Desktop)

```
w-64 | bg-[#0d0d14] | border-r border-white/[0.06] | h-screen sticky top-0

Tuzilishi:
├── Logo: px-6 py-5, border-b
├── Nav: flex-1 overflow-y-auto py-4 px-3 space-y-0.5
│     active item: bg-[#7C3AED]/15 text-white + left indicator bar
│     inactive:    text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300
└── Bottom: border-t, notifications + settings + user card
```

### Mobile Bottom Nav

```
fixed bottom-0 | bg-[#0d0d14]/95 backdrop-blur-xl | border-t border-white/[0.06] | z-50
flex justify-around px-1 py-2
5 ta nav item: icon + label, active = text-[#7C3AED]
```

### Page Content

```tsx
// App sahifalarda asosiy container
<div className="space-y-6">    {/* yoki space-y-8 */}
  ...
</div>
```

---

## 7. GRID TIZIMI

```tsx
// Kartalar uchun responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Ko'p kartalar (kichik kartalar)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

// Achievement grid (kichik iconlar)
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">

// 2 ustun
<div className="grid grid-cols-2 gap-2">
```

---

## 8. ANIMATSIYALAR (Framer Motion)

```tsx
// Sahifa kirish animatsiyasi (login form kabi)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.45, ease: 'easeOut' }}
>

// Kichik element (card, button)
<motion.button
  layout
  initial={{ opacity: 0, scale: 0.85 }}
  animate={{ opacity: 1, scale: 1 }}
  whileHover={{ scale: 1.06 }}
  transition={{ duration: 0.18 }}
>

// Modal backdrop
initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}

// Modal panel
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.9 }}
transition={{ duration: 0.2 }}
```

---

## 9. IKONLAR

Kutubxona: **react-icons**

```tsx
import { FaPlay, FaLock, FaGlobe, FaUsers, FaPlus, FaTimes,
         FaCrown, FaVideo, FaHome, FaFilm, FaTrophy,
         FaChartBar, FaBell, FaCog, FaSignOutAlt,
         FaEnvelope, FaEye, FaEyeSlash, FaLink } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

// Oddiy ishlatish
<FaPlay size={14} className="text-[#7C3AED]" />

// Nav iconlar: size={17-20}
// Card/button iconlar: size={12-16}
// Empty state iconlar: size={24-32}
// Page header iconlar: size={22}
```

---

## 10. LOGO

```tsx
// Logo (katta)
<span className="text-2xl font-display tracking-[0.2em] text-white">
  CINE<span className="text-[#7C3AED]">SYNC</span>
</span>

// Logo icon (kichik, rounded)
<div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center
  shadow-[0_0_16px_rgba(124,58,237,0.5)]">
  <FaPlay size={11} className="text-white ml-0.5" />
</div>
```

---

## 11. MUHIM QOIDALAR

```
✅ Faqat dark mode — hech qachon light bg ishlatma
✅ Border radius: faqat rounded-lg, rounded-xl, rounded-2xl
✅ Animatsiya: Framer Motion (bare CSS transition emas murakkab animatsiyalar uchun)
✅ Image: next/image komponenti bilan
✅ Icon: react-icons (svg emas)
✅ Spacing: Tailwind gap/space/p/m (inline style emas)
✅ Hover: transition-all yoki transition-colors har doim
✅ Focus: focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40
✅ Disabled: disabled:opacity-50 disabled:cursor-not-allowed

❌ Inline style (faqat background-image radial-gradient uchun ruxsat)
❌ Raw hex rang Tailwind utility o'rniga (bg-[#...] to'g'ri)
❌ Light background yoki white surface
❌ Rounded-3xl yoki yumalocroq chegaralar
❌ Red/green/blue primary rang (#E50914 ishlatma — bu eski loyiha rangi)
   Hozirgi brand rang: #7C3AED (purple)
```

---

## 12. SAHIFALAR NAMUNASI

### Oddiy sahifa skeleti

```tsx
export default function SomePage() {
  return (
    <div className="space-y-6">

      {/* 1. Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SomeIcon size={22} className="text-[#7C3AED]" />
          <h1 className="text-3xl font-display text-white">SAHIFA NOMI</h1>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED]
          text-white text-sm font-semibold hover:bg-[#6D28D9] transition-all
          shadow-[0_0_16px_rgba(124,58,237,0.35)]">
          <FaPlus size={12} />
          Qo'shish
        </button>
      </div>

      {/* 2. Content */}
      {loading ? (
        /* Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-white/[0.06]
            flex items-center justify-center mb-5">
            <SomeIcon size={32} className="text-zinc-700" />
          </div>
          <p className="text-zinc-400 text-sm">Hali bo'sh</p>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <SomeCard key={item._id} item={item} />
          ))}
        </div>
      )}

    </div>
  );
}
```

---

*docs/WEB_DESIGN_GUIDE.md | CineSync | 2026-03-14*
