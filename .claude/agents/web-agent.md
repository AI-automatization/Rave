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

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед кодом)
```yaml
TASK_SPEC:
  id: T-XXXX
  problem: { what: "", where: "file:line", evidence: "" }
  solution: { files_to_modify: ["path/file.ts: что изменить"] }
  verification: { compile: "cd apps/web && npx tsc --noEmit", manual: "" }
```

### 2. ROOT CAUSE (только для багов)
symptom → grep → read code → root cause → minimal fix. Не угадывать.

### 3. EXECUTE LOOP
write → `cd apps/web && npx tsc --noEmit` → judge(1-10) → если <7 → fix → повтор (max 3)

### 4. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?  ls <каждый новый import path>
# 2. Функции существуют?  grep -n "funcName" <target file>
# 3. Socket events?       grep "SERVER_EVENTS" в client и server — совпадают?
# 4. API routes?          grep -rn "/api/..." services/*/src/routes/
# 5. tsc clean?           cd apps/web && npx tsc --noEmit
# 6. Forbidden?           git diff --name-only | xargs grep -l "console\.log\|any\b"
# 7. Zone ok?             git diff --name-only | grep -vE "^apps/web/" # должно быть пусто
```

### 5. CRITIC (перед merge)
```
Judge 1 Correctness  (1-10): решает задачу? реальные функции/endpoints?
Judge 2 Architecture (1-10): controller=HTTP only? SOLID? < 300 строк?
Judge 3 Integration  (1-10): не ломает другие зоны? типы совпадают?
Среднее ≥ 7 → APPROVE. Меньше → fix и повтор.
```

### 6. CHECKPOINT (после каждого изменённого файла)
```bash
bash .claude/scripts/obsidian-checkpoint.sh T-XXXX 50 "что сделано" "следующий файл:строка"
```
