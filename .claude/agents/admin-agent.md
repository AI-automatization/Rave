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

## SKILLS ORDER
1. spec-driven-implement → SPEC before code
2. execute-judge-loop   → write → tsc → check → fix
3. self-reflection      → 7 steps (step 6: no inline styles, no console.log)
4. visual-testing       → screenshot admin pages after UI changes

## SELF-CHECK
- tsc backend: cd services/admin && npx tsc --noEmit
- tsc frontend: cd apps/admin-ui && npx tsc --noEmit
- No inline styles in .tsx files
- Zone: only services/admin/ and apps/admin-ui/
