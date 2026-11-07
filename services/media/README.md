# media — content + watch-party in ONE process

Purpose: run `content` (extraction, HLS/video proxies, search) and `watch-party` (rooms, socket.io, virtual
browser, faststart remux) in one Railway container to cut RAM cost, with identical behaviour for web,
Android and iOS. The two original services are untouched as deployable units (rollback = keep deploying
them). Same pattern as `services/core` (see its README).

## How it works
- `src/server.ts` imports each service's compiled `createApp()` (`@cinesync/<svc>/dist/app`) and runs them as-is
  (own middleware chain, 404 and error handler each).
- `src/dispatch.ts` hands every request to exactly ONE app by path prefix. The code never looks at `Host`.
- One `http.Server`; watch-party attaches socket.io to it (`createApp(redis, { httpServer })`), default
  `/socket.io` path and unchanged event names.
- `src/bootstrap-env.ts` (first import) sets `MEDIA_EMBEDDED=1` so content's models use their own mongoose
  connection (`shared/src/utils/serviceConnection.ts`); watch-party keeps the default connection.
- Dockerfile keeps `tini` as PID 1 (PR #266) and reuses `services/watch-party/docker-entrypoint.sh`
  (PulseAudio bring-up only when `VB_STREAM_ENABLED=1`, then `exec node dist/server.js`).

## Route map
- `/api/v1/watch-party/**` -> watch-party (REST, vb-capture, vb-media-proxy, vb-stream, faststart, internal/*)
- `/socket.io/**` -> watch-party socket.io (engine.io answers on the http server before express)
- `/api/v1/content/**` (incl. `hls-proxy`, `proxy/stream`, `youtube/stream`, `hls-files`, internal/*), `/api/v1/youtube/**`,
  every unknown path (same 404 body) -> content
- `/health` -> aggregate: `{status, service:"media", checks:{mongo, mongoContent, redis, elasticsearch}}`;
  503 if mongo/mongoContent/redis is down; Elasticsearch stays advisory ("down" in prod, still 200)
- `/metrics`: 404 as in both services today
- `/api-docs*`: non-production only, served by content's Swagger

## Databases
- default connection -> watch-party models + shared `appsettings` ref (only watch-party reads it) + winston `api_logs` transport (plain `MONGO_URI`)
- `contentDb` -> content models

## Env vars (`<PREFIX>_<KEY>` first, then plain `<KEY>`; standalone services keep plain names)
Per module: `CONTENT_MONGO_URI`, `CONTENT_REDIS_URL`, `CONTENT_CORS_ORIGINS`, `CONTENT_ELASTICSEARCH_URL`;
`WATCH_PARTY_MONGO_URI`, `WATCH_PARTY_REDIS_URL`, `WATCH_PARTY_CORS_ORIGINS`.
Shared (one value): `PORT`, `NODE_ENV`, `LOG_LEVEL`, `SERVICE_NAME` (default `media`), `SENTRY_DSN`, `MONGO_URI`
(plain; set = watch-party DB, used by logger transport), `REDIS_URL`, `INTERNAL_SECRET`, `JWT_PUBLIC_KEY`
(same key everywhere), `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `ADMIN_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`.
Unique to one module, unchanged names: content `CLOUDINARY_*`, `YOUTUBE_*`, `VK_COOKIES_JSON`, `HLS_OUTPUT_DIR`, `FFMPEG_PATH`;
watch-party `METERED_*`, `VB_*`, `WATCH_PARTY_MEMBER_CAP`.
Service URLs: `CONTENT_SERVICE_URL` may point at `http://localhost:$PORT`. `WATCH_PARTY_SERVICE_URL` and
`VB_STREAM_PUBLIC_URL` MUST stay the PUBLIC hosts (they are put into URLs handed to clients).
Do not set `CORE_EMBEDDED` here.
Shadow mode: `MEDIA_BACKGROUND_JOBS=0` (see Cut-over).

## Concurrency / memory (one container now holds both Chromium pools)
Defaults are the historic per-service values, so behaviour is identical; tune per container size:
- `WATCH_PARTY_VB_MAX_CONCURRENT_FREE` (default 10) free VB sessions, then FIFO queue; Pro uncapped up to
  `WATCH_PARTY_VB_SAFETY_CEILING` (default 60). Each VB session = one Chromium (headless ~250-450 MB; headful + Xvfb more).
- `CONTENT_PLAYWRIGHT_MAX_CONCURRENT` (default 2; extractor semaphore default 3) Chromium for URL extraction, skipped (not queued) when full.
- ffmpeg faststart remux: 1 at a time (`MAX_CONCURRENT_REMUX`), HLS proxy segment cache 300 entries.
Rule of thumb: baseline Node ~260 MB idle (measured locally, dev build) + 2 x ~300 MB extraction Chromium + N x ~350 MB VB.
Peak with the defaults is the SUM of the two old containers' peaks; if the Railway plan cannot hold that, lower the two
VB variables (or `CONTENT_PLAYWRIGHT_MAX_CONCURRENT=1`) rather than letting the OOM killer pick.

## Process-wide behaviour
- One `initSentry('media')` / `initMetrics('media')`; one SIGTERM/SIGINT handler (socket.io+http close, mongo x2, redis x2,
  10 s hard timeout); watch-party's own listeners still stop Chromium sessions.
- `uncaughtException` / `unhandledRejection`: logged, process continues; >10 in 60 s exits for a Railway restart
  (standalone services would have crashed on a stray rejection).
- Background jobs (once): content urlVisit adult-domain cron (24 h), watch-party startup + 1-minute inactive-room sweep,
  blocked-domain seed, hourly faststart cache sweep.

## Cut-over (Railway, later step; not done here)
1. Deploy `media` with `MEDIA_BACKGROUND_JOBS=0` next to the old services (no room sweep, no cron, no seeding).
   Smoke-test through its own Railway domain. Keep `numReplicas = 1`.
2. Move the public domains (`content-production-4e08.up.railway.app`, `watch-part-production.up.railway.app`,
   `stream.wewatch.uz`) to the media service (or keep the old services as proxies), then unset `MEDIA_BACKGROUND_JOBS`
   and stop the old services (two live watch-party processes would both sweep rooms and hold separate in-memory VB state).
3. Active socket rooms drop on the switch (same as any watch-party redeploy); VB resume info lives in Redis.
Dev: build shared, content, watch-party, then `npm run build --workspace=@cinesync/media`;
`node services/media/dist/server.js` (needs `node_modules/@shared` -> `shared/dist`, see Dockerfile).
