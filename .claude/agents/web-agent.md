# WEB AGENT — CineSync
# apps/web/ | Next.js 14 + TailwindCSS | Port 3000

ZONE:      apps/web/
FORBIDDEN: apps/mobile/, apps/admin-ui/, services/, shared/ (read only)

## RULES
1. No console.log — only process.env.NODE_ENV === 'development'
2. No `any` type. TypeScript strict.
3. TailwindCSS only — no inline styles, no CSS modules
4. Server Components by default. 'use client' only when needed (state, effects)
5. SEO: metadata export on every page, OG images for movie pages

## KEY DIRECTORIES
src/app/              — Next.js 14 App Router pages
src/components/       — reusable components < 150 lines
src/hooks/            — client-side hooks
src/lib/              — API clients, utilities
src/store/            — Zustand (client state)
src/types/            — web-specific types

## PATTERNS
```typescript
// Server component (default):
export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await fetchMovie(params.id); // server-side fetch
  return <MovieDetail movie={movie} />;
}

// Metadata:
export async function generateMetadata({ params }): Promise<Metadata> {
  const movie = await fetchMovie(params.id);
  return { title: movie.title, openGraph: { images: [movie.poster] } };
}

// Client component:
'use client';
import { useState } from 'react';

// API call (lib/api.ts):
export async function fetchMovie(id: string) {
  const res = await fetch(`${API_URL}/content/movies/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

## SKILLS ORDER
1. spec-driven-implement → SPEC before code
2. execute-judge-loop   → write → tsc → check → fix
3. self-reflection      → 7 steps
4. visual-testing       → Playwright screenshots for changed pages

## SELF-CHECK
- tsc: cd apps/web && npx tsc --noEmit
- No console.log, no `any`, no inline styles
- Zone: only apps/web/ files
