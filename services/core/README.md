# core — auth + user + notification + admin + payment in ONE process

Purpose: run five small Express services in one Railway container (about 200 MB instead of 5 x ~90-150 MB)
with identical behaviour. The five original services are untouched as deployable units
(rollback = keep deploying them). `content` and `watch-party` are NOT part of core.

## How it works
- `src/server.ts` imports each service's compiled `createApp()` (`@cinesync/<svc>/dist/app`) and
  runs them as-is. Each app keeps its own middleware chain, 404 and error handler.
- `src/dispatch.ts` hands every request to exactly ONE app by path prefix (not `app.use()` in
  sequence, which would let the first app's 404 swallow the others). The code never looks at `Host`.
- One `http.Server`, one `listen(PORT)`, socket.io (admin support socket) attached to it.
- `src/bootstrap-env.ts` (first import) sets `CORE_EMBEDDED=1`, so admin/payment bind their models to
  their own mongoose connections (`shared/src/utils/serviceConnection.ts`).

## Route map
- `/api/v1/auth/**` -> auth (incl. `/google/callback`, `/telegram/webhook`, `/internal/*`)
- `/api/v1/users/**`, `/uploads/**` -> user (static avatars)
- `/api/v1/notifications/**` -> notification (incl. `/telegram/webhook`, `/waitlist`, `/campaigns`, `/internal/*`)
- `/api/v1/payment/**` -> payment (incl. `/webhooks/tezcode-billing`, raw body kept for HMAC)
- `/api-docs`, `/api-docs.json` -> auth's Swagger (non-production only; every service had one)
- `/health` -> core aggregate (same JSON shape: `{status, service:"core", checks:{mongo, mongoAdmin, mongoPayment, redis}}`; 503 if any is down)
- `/socket.io/**` (namespace `/support`) -> admin support socket, same path as before
- everything else -> admin: `/api/v1/admin|operator|errors|sentry/**` plus the routers admin mounts directly
  on `/api/v1` (`analytics/ingest`, `sync-stats/ingest`, `admin/analytics/**`, `admin/sync-stats/**`,
  `support/**`, `internal/support/**`, `internal/moderation/**`, `moderation/**`) and the 404 for unknown paths.
- `/metrics`: 404 in every standalone service today (registered after the 404 handler); unchanged in core.

Route conflicts checked: prefixes `auth`, `users`, `notifications`, `payment` do not overlap with any
admin router path (listed above); no conflict found. Old per-service `/health` paths all map to the aggregate.

## Databases (must stay as today)
- default mongoose connection (`MONGO_URI`, db `cinesync`): auth, user, notification, shared `appsettings` ref, winston log transport
- admin models -> `ADMIN_MONGO_URI` (db `cinesync_admin`), own connection
- payment models -> `PAYMENT_MONGO_URI` (db `cinesync_payment`), own connection
- `User` model: auth registers it as `AuthUser`, user as `User`, both on collection `users`.

## Env vars
Each module reads `<PREFIX>_<KEY>` first, then plain `<KEY>` (`shared/src/utils/scopedEnv.ts`), so the
standalone services (plain names only) behave exactly as before.

Shared / global: `PORT`, `NODE_ENV`, `LOG_LEVEL`, `SERVICE_NAME` (default `core`), `SENTRY_DSN`, `MONGO_URI`,
`ADMIN_MONGO_URI`, `PAYMENT_MONGO_URI`, `LOGS_MONGO_URI`, `REDIS_URL`, `INTERNAL_SECRET`, `JWT_PRIVATE_KEY`,
`JWT_PUBLIC_KEY` (ONE value, see risks), `JWT_EXPIRES_IN`, `SUPERADMIN_EMAIL`, `ADMIN_INIT_SECRET`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `EMAIL_FROM`, `APP_SCHEME`, `WEB_BASE_URL`, `CLIENT_URL`.
Service URLs (point the in-process modules at the core itself, e.g. `http://localhost:$PORT`):
`AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `ADMIN_SERVICE_URL`, `PAYMENT_SERVICE_URL`;
keep real URLs for `CONTENT_SERVICE_URL`, `WATCH_PARTY_SERVICE_URL`.
Per module (these differed between services in prod):
- auth: `AUTH_ADMIN_URL`, `AUTH_SMTP_PASS`, `AUTH_TELEGRAM_BOT_TOKEN`, `AUTH_TELEGRAM_BOT_USERNAME`, `AUTH_TELEGRAM_WEBHOOK_SECRET`; plus `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`
- user: `USER_CORS_ORIGINS`; plus `UPLOAD_PATH`, `DM_ENCRYPTION_KEY`
- notification: `NOTIFICATION_CORS_ORIGINS`, `NOTIFICATION_SMTP_PASS`, `NOTIFICATION_TELEGRAM_BOT_TOKEN`, `NOTIFICATION_TELEGRAM_BOT_USERNAME`, `NOTIFICATION_TELEGRAM_WEBHOOK_SECRET`, `NOTIFICATION_TELEGRAM_WEBHOOK_URL` (or plain `TELEGRAM_WEBHOOK_URL`); plus `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `SWARM_GROUP_CHAT_ID`
- admin: `ADMIN_URL` (admin UI origins); plus `MOBILE_ERROR_KEY`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, `MAINTENANCE_FORCE_OFF`
- payment: `PAYMENT_CORS_ORIGINS`, `BILLING_URL`, `BILLING_API_KEY`, `BILLING_HMAC_SECRET`, `BILLING_PRODUCT_CODE`, `BILLING_PRO_PLAN_SLUG`, `APP_WEB_BASE_URL`
Do NOT copy admin's `USER_MONGO_URI` / `CONTENT_MONGO_URI` (unused by code).

## Process-wide behaviour
- One `initSentry('core')` / `initMetrics('core')`; one SIGTERM/SIGINT handler (http close, Bull queue close,
  mongo x3, redis x3, 10 s hard timeout).
- `uncaughtException` / `unhandledRejection`: logged, process continues (as the user service did); >10 in 60 s exits for a Railway restart.
- Background jobs start once: reengagement Bull queue, Telegram `registerWebhook`, payment 24 h reconcile interval.

## Cut-over (Railway, later step; not done here)
Shadow mode: set `CORE_BACKGROUND_JOBS=0` while the old services still run (no Telegram setWebhook, no reengagement cron, no billing reconcile). Flip to unset/1 at cut-over.
Domains are bound per Railway service. Either (a) move the five public domains (`auth-production-47a8`, `user-...`,
`notification-...`, `admin-...`, `payment-...` and `pay.wewatch.uz`) to the core service, or (b) keep the old
services as thin proxies for a while. Google OAuth callback and Telegram webhook URLs keep working as long as the
same host+path reaches core. Remove the five old services only after traffic is on core.
Dev: `npm run build --workspace=@cinesync/shared` then each service, then `npm run build --workspace=@cinesync/core`;
`node services/core/dist/server.js` (needs `node_modules/@shared` -> `shared/dist`, see Dockerfile).
