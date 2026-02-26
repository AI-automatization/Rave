# CineSync Admin Dashboard

**Mas'ul:** Saidazim
**Tech:** React + Vite + TypeScript + TailwindCSS
**Port:** 5173

## Zona

```
apps/admin-ui/
├── src/
│   ├── pages/            → Dashboard, Users, Content, Settings
│   ├── components/       → Admin UI components
│   ├── api/              → Admin API client (port 3008)
│   ├── store/            → Zustand or Redux
│   └── types/            → Admin-specific types
├── public/
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Setup

```bash
cd apps/admin-ui
npm install
npm run dev        # → http://localhost:5173
```

## Qoidalar

- Faqat `admin` va `superadmin` role kirishi mumkin
- Admin Service (port 3008) ga ulanadi
- Dark mode only

## Status

Keyingi sprint — hozir backend ready bo'lgandan keyin start beriladi.

---

*CineSync Admin UI | Saidazim | React + Vite*
