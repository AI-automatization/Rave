# CLAUDE_WEB.md — Next.js Web Client Engineer Guide
# Next.js 14 · TypeScript · TailwindCSS · Shadcn/ui · Socket.io · Framer Motion
# Claude CLI bu faylni Jafar tanlanganda o'qiydi

---

## 👋 ZONA

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (landing)/      → Landing sahifalar (SEO, public)
│   │   │   ├── page.tsx         → Home landing
│   │   │   ├── features/
│   │   │   ├── pricing/
│   │   │   └── layout.tsx
│   │   ├── (app)/          → Autentifikatsiya zarur sahifalar
│   │   │   ├── home/
│   │   │   ├── movies/[slug]/
│   │   │   ├── watch/[movieId]/
│   │   │   ├── party/[roomId]/
│   │   │   ├── friends/
│   │   │   ├── battle/
│   │   │   ├── profile/[username]/
│   │   │   ├── stats/
│   │   │   ├── achievements/
│   │   │   ├── settings/
│   │   │   ├── notifications/
│   │   │   └── layout.tsx
│   │   ├── (auth)/         → Login, Register
│   │   ├── sitemap.ts
│   │   └── layout.tsx      → Root layout
│   ├── components/
│   │   ├── ui/             → Shadcn/ui components
│   │   ├── movie/          → MovieCard, HeroBanner
│   │   ├── party/          → WatchPartyPlayer, ChatPanel
│   │   ├── battle/         → BattleCard, Leaderboard
│   │   └── common/         → Header, Footer, Sidebar
│   ├── hooks/
│   ├── lib/                → axios, socket, utils
│   ├── store/              → Zustand stores
│   └── types/
├── public/
│   ├── robots.txt
│   └── manifest.json
├── tailwind.config.ts
└── next.config.js
```

**🚫 TEGINMA:** `services/` (Saidazim), `apps/mobile/` (Emirhan), `apps/admin-ui/` (Saidazim)

---

## 🏗️ NEXT.JS ARXITEKTURA

### Server vs Client Components

```typescript
// ✅ Server Component (default) — SEO, SSR, data fetching
// app/(landing)/page.tsx
export const metadata: Metadata = {
  title: 'CineSync — Do\'stlar bilan birga film ko\'ring',
  description: 'Ijtimoiy kinoteatr platformasi...',
  openGraph: { images: ['/og-home.jpg'] },
};

export default async function LandingPage() {
  const trending = await fetchTrending(); // Server-side
  return <HeroSection movies={trending} />;
}

// ✅ Client Component — interaktiv UI
// components/movie/MovieCard.tsx
'use client';
export function MovieCard({ movie }: { movie: IMovie }) {
  const [isHovered, setIsHovered] = useState(false);
  return <div onMouseEnter={() => setIsHovered(true)}>...</div>;
}
```

### Dynamic Metadata (Film Sahifasi)

```typescript
// app/(app)/movies/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await fetchMovie(params.slug);
  return {
    title: `${movie.title} - Ko'rish | CineSync`,
    description: movie.description.slice(0, 160),
    openGraph: {
      title: movie.title,
      description: movie.description,
      images: [movie.backdrop || movie.poster],
      type: 'video.movie',
    },
  };
}
```

### JSON-LD Structured Data

```typescript
// Movie schema (SEO):
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Movie",
  "name": movie.title,
  "datePublished": movie.year,
  "director": { "@type": "Person", "name": movie.director },
  "genre": movie.genres,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": movie.rating,
    "bestRating": 10,
    "ratingCount": movie.reviewCount,
  },
})}
</script>
```

---

## 🎨 DESIGN SYSTEM — TAILWIND CONFIG

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'bg-void':     '#060608',
        'bg-base':     '#0A0A0F',
        'bg-elevated': '#111118',
        'bg-overlay':  '#16161F',
        'bg-surface':  '#1C1C28',
        'bg-muted':    '#242433',
        'primary':     '#E50914',
        'primary-hover':'#FF1A24',
        'accent':      '#FF6B35',
        'gold':        '#FFD700',
        'silver':      '#C0C0C0',
        'diamond':     '#88CCFF',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body:    ['DM Sans', 'Outfit', 'sans-serif'],
      },
    },
  },
};

// ❌ Raw hex ranglar TAQIQLANGAN → semantic token ishlatish
// ❌ className="bg-[#E50914]"
// ✅ className="bg-primary"
```

---

## 🎬 VIDEO PLAYER (HLS)

```typescript
// hls.js bilan HLS streaming:
'use client';
import Hls from 'hls.js';

function VideoPlayer({ src, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      return () => hls.destroy();
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src; // Safari native HLS
    }
  }, [src]);

  return <video ref={videoRef} className="w-full h-full" />;
}

// Keyboard shortcuts:
// Space: play/pause, ArrowLeft/Right: ±10s, F: fullscreen, M: mute
```

---

## 🔌 SOCKET.IO (Watch Party)

```typescript
// lib/socket.ts
'use client';
import { io } from 'socket.io-client';

export function createSocket(token: string) {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    auth: { token },
    transports: ['websocket'],
  });
}

// hooks/useWatchParty.ts
export function useWatchParty(roomId: string) {
  const socket = useSocket();
  const [syncState, setSyncState] = useState<SyncState>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('room:join', { roomId });

    socket.on('video:sync', setSyncState);
    socket.on('room:joined', (m) => setMembers(prev => [...prev, m]));
    socket.on('room:left', (id) => setMembers(prev => prev.filter(m => m.id !== id)));
    socket.on('room:message', (msg) => setMessages(prev => [...prev, msg]));

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('video:sync');
      // ...
    };
  }, [socket, roomId]);

  return { syncState, members, messages };
}
```

---

## 📊 SEO CHECKLIST (100% MAQSAD)

```
✓ Har sahifa — unique <title> va <meta description>
✓ Open Graph meta (title, description, image, type)
✓ Twitter Card meta
✓ Canonical URL
✓ robots.txt + sitemap.xml (dynamic)
✓ JSON-LD: WebSite, Organization, Movie, FAQPage, Person
✓ hreflang teglar (uz, ru, en)
✓ next/image — barcha rasmlar (WebP, lazy, sizes)
✓ next/font — layout shift yo'q
✓ Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
✓ generateStaticParams — film va profil sahifalari SSG
✓ ISR — trending filmlar (revalidate: 600)
```

---

## ⚡ PERFORMANCE

```typescript
// Dynamic import (og'ir komponentlar):
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  ssr: false,
  loading: () => <VideoSkeleton />,
});

// Image optimization:
import Image from 'next/image';
<Image src={posterUrl} alt={title} width={300} height={450} priority={isAboveFold} />

// Route prefetch:
<Link href={`/movies/${slug}`} prefetch>...</Link>

// ISR:
export const revalidate = 600; // 10 min
```

---

## 🌐 I18N (next-intl)

```
/uz/movies/...  → O'zbek
/ru/movies/...  → Русский
/en/movies/...  → English

// Har tilda alohida sitemap
// hreflang teglar avtomatik
```

---

## 🧪 TEST

```bash
# Unit:
cd apps/web && npm test

# E2E (Playwright):
cd apps/web && npx playwright test

# Lighthouse CI:
npx lhci autorun --config=lighthouserc.json
```

---

## 🚫 TAQIQLANGAN

```
❌ services/ papkasiga TEGINMA (Saidazim)
❌ apps/mobile/ papkasiga TEGINMA (Emirhan)
❌ any type
❌ console.log production da
❌ dangerouslySetInnerHTML
❌ Raw hex colors → Tailwind token
❌ <img> tag → next/image
❌ Inline styles → Tailwind class
❌ Socket event nomlarini o'zgartirish
❌ API response formatini o'zgartirish
```
# Development Rules

Tech stack:

- Next.js
- TailwindCSS
- DaisyUI

Restrictions:

- Do not write custom CSS
- Do not use Tailwind color utilities
- Use DaisyUI dynamic colors only

Design style:

- Minimalism
- Clean layout
- Accessible UI

Components:

- card
- button
- navbar
- alert

Responsive:

- Mobile first
- Tablet support
- Desktop support

---
# Development Rules

Tech stack:

- Next.js
- TailwindCSS
- DaisyUI

Restrictions:

- Do not write custom CSS
- Do not use Tailwind color utilities
- Use DaisyUI dynamic colors only

Design style:

- Minimalism
- Clean layout
- Accessible UI

Components:

- card
- button
- navbar
- alert

Responsive:

- Mobile first
- Tablet support
- Desktop support
check logs and write in .playwright-mcp 
*CLAUDE_WEB.md | CineSync | Jafar | v1.0*
