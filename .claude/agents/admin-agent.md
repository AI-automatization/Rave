# ADMIN AGENT — CineSync
# services/admin/ :3008 + apps/admin-ui/ | Backend API + React Dashboard

ZONE:      services/admin/, apps/admin-ui/
FORBIDDEN: apps/mobile/, apps/web/, shared/ (read only), services/auth/, services/user/, services/content/, services/watch-party/, services/battle/, services/notification/

## RULES
1. Backend: controller = HTTP only. Logic → adminService
2. Frontend: TailwindCSS only — no inline styles
3. No console.log anywhere. Backend: Winston. Frontend: no logs in prod.
4. No `any` type. TypeScript strict.
5. Admin routes: requireRole('admin') middleware on all endpoints

## BACKEND KEY FILES
services/admin/src/controllers/admin.controller.ts  — users, movies, errors, stats
services/admin/src/services/admin.service.ts         — business logic (449 lines — split if adding)
services/admin/src/models/                           — ErrorLog model
services/admin/src/routes/admin.routes.ts

## FRONTEND KEY FILES
apps/admin-ui/src/pages/          — Dashboard, Users, Movies, Errors, Login pages
apps/admin-ui/src/components/     — Sidebar, Header, EventDrawer, charts
apps/admin-ui/src/api/            — API calls to backend
apps/admin-ui/src/store/          — Zustand/Redux state

## OPEN TASKS (T-S067..T-S071)
T-S067 P0: Sidebar (lucide icons, badge, groups, active state) + Header (breadcrumb, search, avatar)
T-S068 P0: /users/:id page (avatar, email, role, history, block, contact)
T-S069 P0: ErrorsPage EventDrawer — user info + contact button
T-S070 P1: Dashboard — real-time activity feed + error trend chart
T-S071 P2: Global search Cmd+K modal (users, errors, movies)

## PATTERNS
```typescript
// Backend — admin middleware:
router.get('/users', verifyToken, requireRole('admin'), adminController.getUsers);

// Frontend — Tailwind component:
<div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface hover:bg-overlay">
  <Icon className="w-5 h-5 text-primary" />
  <span className="text-sm font-medium">{label}</span>
</div>

// Design tokens:
// primary: #7B72F8, bg: #0A0A0F, surface: #111118, overlay: #16161F

// lucide-react icons (install if needed):
import { Users, Film, AlertCircle, LayoutDashboard, Search } from 'lucide-react';
```

## SKILL EXECUTION — ОБЯЗАТЕЛЬНЫЙ ПОРЯДОК

### 1. SPEC (перед любым кодом)
```yaml
TASK_SPEC:
  id: T-SXXX
  problem:
    what: [точное описание]
    where: [file:line]
  solution:
    files_to_modify:
      - apps/admin-ui/src/...: [что изменить]
      - services/admin/src/...: [что изменить]
  verification:
    compile_be: "cd services/admin && npx tsc --noEmit"
    compile_fe: "cd apps/admin-ui && npx tsc --noEmit"
```

### 2. EXECUTE LOOP
```
write → tsc (backend + frontend) → judge 1-10 → если < 7 → fix → повтор
```

### 3. SELF-REFLECTION (все 7 перед сабмитом)
```bash
# 1. Импорты существуют?
ls apps/admin-ui/src/api/errors.api.ts   # для каждого нового импорта

# 2. Функции существуют?
grep -n "functionName" services/admin/src/services/

# 3. API routes существуют?
grep -rn "GET /api" services/admin/src/routes/

# 4. tsc clean?
cd services/admin && npx tsc --noEmit
cd apps/admin-ui && npx tsc --noEmit

# 5. Нет inline styles?
git diff --name-only | xargs grep -l 'style={{' 2>/dev/null

# 6. Нет console.log?
git diff --name-only | xargs grep -l 'console\.log' 2>/dev/null

# 7. Зона соблюдена?
git diff --name-only | grep -vE "^(services/admin|apps/admin-ui)/"   # пусто
```

### 4. CRITIC (перед merge)
```
Judge 1 Correctness  (1-10): все endpoints работают? данные рендерятся?
Judge 2 Architecture (1-10): controller = HTTP only? Tailwind only? < 300 строк?
Judge 3 Integration  (1-10): backend API format совпадает с frontend ожиданиями?
Среднее ≥ 7 → APPROVE.
```

### 5. CHECKPOINT (после каждого файла)
```bash
bash .claude/scripts/obsidian-checkpoint.sh T-SXXX 50 "что сделано" "следующий файл"
```

### 6. VISUAL (после UI изменений)
```bash
# Запустить admin-ui dev server, сделать скриншоты:
# http://localhost:5173/  → screenshots/admin-dashboard.png
# http://localhost:5173/users → screenshots/admin-users.png
```
