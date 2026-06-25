---
name: remotion-audio
description: Add background music and SFX to Remotion videos. Covers royalty-free music sources, licensing rules, sox SFX generation, Instagram safe zones, and Remotion Audio component usage.
argument-hint: "remotion-audio"
---

# Remotion Audio Skill

## Royalty-Free Music — Qayerdan olish

### ✅ ISHLAYDI (curl/wget orqali to'g'ridan-to'g'ri)

| Manba | URL format | Litsenziya |
|-------|-----------|------------|
| **Kevin MacLeod (incompetech.com)** | `https://incompetech.com/music/royalty-free/mp3-royaltyfree/TRACK_NAME.mp3` | CC BY 4.0 (attribution kerak) |
| **Free Music Archive** | `https://files.freemusicarchive.org/storage-freemusicarchive-org/music/...` | Turli CC |
| **ccMixter** | Promo preview URL'lar | CC |

```bash
# Kevin MacLeod — ishlashi tekshirilgan track'lar
curl -L -o bg.mp3 "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electro%20Sketch.mp3"
curl -L -o bg.mp3 "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3"

# URL ishlaydimi tekshirish
curl -s -o /dev/null -w "%{http_code} %{size_download}" "URL" --max-time 10
# 200 + katta size → ishlaydi | 403/404 → ishlamaydi
```

### ❌ ISHLAMAYDI (CDN blok qiladi)
- **Pixabay** — `cdn.pixabay.com` → 403 Forbidden
- **Mixkit** — `assets.mixkit.co` → 403 Forbidden / AccessDenied XML
- **Bensound** — redirect + 403

---

## SFX — Sox bilan generatsiya (tabiiy ovoz)

### O'rnatish
```bash
brew install sox
```

### SFX reseptlar

```bash
# WHOOSH (o'tish animatsiyasi uchun) — yumshoq, brownnoise
sox -n whoosh.wav synth 0.55 brownnoise vol 0.35 fade 0.12 0.55 0.28 rate 44100
sox whoosh.wav whoosh_reverb.wav reverb 55 50 100
sox whoosh_reverb.wav whoosh.mp3

# POP (card pop-in uchun) — sine 300→80Hz
sox -n pop.wav synth 0.08 sine 300-80 vol 1.0 fade 0 0.08 0.03 rate 44100
sox pop.wav pop.mp3

# SWOOSH (kuchli o'tish) — brownnoise + pitch
sox -n swoosh.wav synth 0.5 brownnoise vol 0.7 pitch +300 fade 0.02 0.5 0.15
sox swoosh.wav swoosh.mp3
```

**Nima uchun sox ffmpeg sinusidan yaxshiroq:**
- `brownnoise` / `whitenoise` = tabiiy, organik ovoz
- `sine` faqat = sintetik, sun'iy eshitiladi
- `reverb` = bo'shliq hissi beradi

### Musiqani trim qilish (sox bilan)
```bash
# 30 sekundga qisqartirish + fade in/out
sox bg_full.mp3 bg.mp3 trim 0 30 fade 1.5 30 2
```

---

## Remotion — Audio qo'shish

### Fayl joylashuvi
```
marketing/instagram/public/audio/bg.mp3
marketing/instagram/public/audio/whoosh.mp3
marketing/instagram/public/audio/pop.mp3
```

### Komponent
```tsx
import { Audio, staticFile, Sequence } from 'remotion';

export const MyVideo: React.FC = () => {
  const FPS = 30;

  return (
    <AbsoluteFill>
      {/* Fon musiqasi — butun video davomida */}
      <Audio src={staticFile('audio/bg.mp3')} volume={0.28} />

      {/* Whoosh — har bir fazalar almashinuvida */}
      {[150, 330, 480, 720].map((at) => (
        <Sequence key={at} from={at - 14} durationInFrames={30}>
          <Audio src={staticFile('audio/whoosh.mp3')} volume={0.55} />
        </Sequence>
      ))}

      {/* Pop — card'lar uchun (stagger bilan) */}
      {[518, 538, 558, 578].map((at, i) => (
        <Sequence key={i} from={at} durationInFrames={20}>
          <Audio src={staticFile('audio/pop.mp3')} volume={0.45} />
        </Sequence>
      ))}

      {/* Fazalar */}
      <Sequence from={0} durationInFrames={150}><Phase1 /></Sequence>
      {/* ... */}
    </AbsoluteFill>
  );
};
```

### Muhim qoidalar
- `Audio` elementlari **fazalardan KEYIN** DOM'da bo'lishi kerak (aks holda faza bg'si ustini yopadi)
- Bu audio emas — vizual elementlar uchun ham amal qiladi: overlay'lar oxirida render qilinsin
- `volume`: bg = 0.25–0.30 | SFX = 0.45–0.60
- Whoosh timing: fazadan `14 frame OLDIN` boshlash — crossfade bilan sinxron

---

## Instagram Reels Safe Zone

```
┌─────────────────────┐ ← Top 100px: navigation (yozmang)
│  SAFE ZONE          │
│  (matn joyi)        │
│                     │
│                     │
│                     │
│  SAFE ZONE          │
└─────────────────────┘ ← Bottom 320px: like/comment/share tugmalari (yozmang)
                          Right 150px: action buttons (yozmang)
```

**Qoidalar:**
- `paddingBottom: 320` — pastki safe zone
- `paddingTop: 120` — yuqori safe zone  
- `paddingRight: 160` — o'ng safe zone (action buttons)
- Matnni `justifyContent: 'center'` bilan markazlash — eng xavfsiz variant
- `flex-end` ishlatayotganda `paddingBottom >= 380` bo'lsin

---

## Litsenziya qoidalari

| Holat | Kevin MacLeod (CC BY) | FMA (turli) | ffmpeg/sox generated |
|-------|----------------------|-------------|----------------------|
| Instagram / YouTube | ✅ Attribution kerak | Tekshiring | ✅ To'liq free |
| Tijoriy reklama | ✅ Attribution | Tekshiring | ✅ To'liq free |
| Attribution | "Music by Kevin MacLeod" | Track'ga qarab | Kerak emas |

**Kevin MacLeod attribution format:**
```
Music: "Track Name" by Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
```

---

## Tez workflow

```bash
# 1. SFX generatsiya
cd marketing/instagram/public/audio
sox -n whoosh.wav synth 0.55 brownnoise vol 0.35 fade 0.12 0.55 0.28 && sox whoosh.wav whoosh_reverb.wav reverb 55 50 100 && sox whoosh_reverb.wav whoosh.mp3
sox -n pop.wav synth 0.08 sine 300-80 vol 1.0 fade 0 0.08 0.03 && sox pop.wav pop.mp3

# 2. Musiqa yuklash
curl -L -o bg_full.mp3 "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electro%20Sketch.mp3"
sox bg_full.mp3 bg.mp3 trim 0 30 fade 1.5 30 2

# 3. Render
npx remotion render src/index.ts WeWatchReel out/reel.mp4 --codec=h264
```
