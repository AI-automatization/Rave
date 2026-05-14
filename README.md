# CineSync

Social online cinema — watch movies together with friends, battles, achievements, and live sync.

## Architecture

Node.js microservices monorepo on Railway with MongoDB Atlas, Redis, and Elasticsearch.

| Service | Port | Description |
|---------|------|-------------|
| auth | 3001 | JWT auth, Google OAuth, Telegram OAuth |
| user | 3002 | Profiles, friends, achievements |
| content | 3003 | Movie catalog, YouTube proxy, Elasticsearch |
| watch-party | 3004 | Real-time sync via Socket.io |
| battle | 3005 | Watch battle gamification |
| notification | 3007 | Firebase FCM push |
| admin | 3008 | Admin panel API |
| admin-ui | 5173 | React + Vite admin dashboard |
| mobile | — | React Native + Expo |

## Prerequisites

- Node.js ≥ 20, npm ≥ 10
- Docker + Docker Compose
- MongoDB Atlas cluster
- Redis 7
- Elasticsearch 8

## Local Development

```bash
npm install
cp services/auth/.env.example services/auth/.env
# (repeat for each service)
npm run docker:dev        # MongoDB + Redis + Elasticsearch via Docker
npm run dev:auth          # start individual service
```

## Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Services are deployed to Railway. Environment variables are set in the Railway dashboard. See `DR-PLAN.md` for backup and disaster recovery.

## Environment Variables

Each service has its own `.env.example`. Required across all services:

- `MONGO_URI` — MongoDB Atlas connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — signing keys
- `SENTRY_DSN` — error monitoring (optional, disables Sentry if absent)

## Testing

```bash
npm run test:api     # Playwright API tests (all 7 services)
npm run test:smoke   # @smoke tagged tests only
npm run test:report  # open HTML report
```

## Backup

Daily MongoDB backup to S3/R2 via GitHub Actions (`.github/workflows/backup.yml`).  
Recovery procedure: see `DR-PLAN.md`.

## Docs

- `CLAUDE.md` — development conventions and task tracking
- `DR-PLAN.md` — disaster recovery plan
- `docs/Tasks.md` — open tasks
- `docs/Done.md` — completed tasks
