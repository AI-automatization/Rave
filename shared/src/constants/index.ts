// ─────────────────────────────────────────────
// Points System
// ─────────────────────────────────────────────

export const POINTS = {
  MOVIE_WATCHED: 10,
  WATCH_PARTY: 15,
  BATTLE_WIN: 50,
  BATTLE_PARTICIPATE: 10,
  ACHIEVEMENT_BASE: 20,
  DAILY_STREAK: 5,
  FRIEND_ADDED: 5,
  REVIEW_WRITTEN: 8,
} as const;

// ─────────────────────────────────────────────
// Rank Thresholds
// ─────────────────────────────────────────────

export const RANKS = {
  Bronze: { min: 0, max: 499 },
  Silver: { min: 500, max: 1999 },
  Gold: { min: 2000, max: 4999 },
  Platinum: { min: 5000, max: 9999 },
  Diamond: { min: 10000, max: Infinity },
} as const;

// ─────────────────────────────────────────────
// Service Ports
// ─────────────────────────────────────────────

export const PORTS = {
  AUTH: 3001,
  USER: 3002,
  CONTENT: 3003,
  WATCH_PARTY: 3004,
  BATTLE: 3005,
  NOTIFICATION: 3007,
  ADMIN: 3008,
} as const;

// ─────────────────────────────────────────────
// Redis Keys
// ─────────────────────────────────────────────

export const REDIS_KEYS = {
  // Auth service
  loginAttempts: (email: string) => `auth:login_attempts:${email}`,
  passwordResetRate: (email: string) => `auth:pwd_reset_rate:${email}`,
  pendingReg: (email: string) => `auth:pending_reg:${email}`,
  oauthCode: (code: string) => `auth:oauth:code:${code}`,
  tgState: (state: string) => `auth:tg:state:${state}`,
  tgAuth: (state: string) => `auth:tg:auth:${state}`,
  userSession: (userId: string) => `auth:session:${userId}`,
  blockedUser: (userId: string) => `auth:blocked:${userId}`,
  emailBind: (userId: string) => `auth:email:bind:${userId}`,

  // User service
  heartbeat: (userId: string) => `user:heartbeat:${userId}`,
  rateLimitUser: (userId: string) => `ratelimit:user:${userId}`,

  // Content service
  movieCache: (movieId: string) => `content:movie:${movieId}`,
  movieViewCount: (movieId: string) => `content:viewcount:${movieId}`,
  trending: (limit: number) => `content:trending:${limit}`,
  topRated: (limit: number) => `content:toprated:${limit}`,

  // Watch party
  watchPartyRoom: (roomId: string) => `party:room:${roomId}`,
  bufferingUsers: (roomId: string) => `party:buffering:${roomId}`,
  reactionRate: (userId: string, roomId: string) => `party:reaction_rate:${userId}:${roomId}`,
  reactionBurst: (userId: string, roomId: string) => `party:reaction_burst:${userId}:${roomId}`,
  videoCandidates: (roomId: string) => `party:candidates:${roomId}`,
  // Source page a VB session captured candidates from — kept alongside videoCandidates (same
  // TTL) so vb-media-proxy can re-probe a fresh media URL if the one a candidate carries has
  // gone stale by the time it's actually used (some sites re-sign their CDN URL every ~10s as
  // anti-hotlink protection — see vbMediaProxy.controller.ts's refresh-on-failure logic).
  vbSourceUrl: (roomId: string) => `party:vb_source:${roomId}`,
  // Real prod finding 2026-08-12 (uzmovi.net): a captured 'url'-kind candidate can be bound to
  // the session cookie VB's own browser picked up loading the source page (a Set-Cookie during
  // navigation), not just a query-string token — a stateless proxy fetch with no Cookie header
  // gets redirected to the site's homepage instead of the actual media, indistinguishable at the
  // network layer from a hard IP-block (curl from a residential IP hits the same redirect with no
  // cookie jar). VB's context.cookies() has the real session; vbMediaProxy replays it here.
  vbSessionCookies: (roomId: string) => `party:vb_cookies:${roomId}`,
  createRoomRate: (ip: string) => `party:create_rate:${ip}`,
  joinRoomRate: (userId: string) => `party:join_rate:${userId}`,
  recentRooms: (userId: string) => `party:recent_rooms:${userId}`,
  publicRoomsCache: () => `party:public_rooms_cache`,
  vbMediaProxyRate: (ip: string) => `party:vb_media_proxy_rate:${ip}`,
  vbCaptureRate: (ip: string) => `party:vb_capture_rate:${ip}`,

} as const;

// ─────────────────────────────────────────────
// TTL Values (seconds)
// ─────────────────────────────────────────────

export const TTL = {
  ACCESS_TOKEN: 15 * 60,             // 15 minutes
  REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days
  HEARTBEAT: 3 * 60,                 // 3 minutes
  MOVIE_CACHE: 60 * 60,              // 1 hour
  LOGIN_BLOCK: 15 * 60,              // 15 minutes
  OTP: 10 * 60,                      // 10 minutes
  WATCH_PARTY_ROOM: 24 * 60 * 60,   // 24 hours
  BLOCKED_USER: 365 * 24 * 60 * 60, // 1 year (until manually unblocked)
} as const;

// ─────────────────────────────────────────────
// Limits
// ─────────────────────────────────────────────

export const LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_FRIENDS: 500,
  MAX_WATCH_PARTY_MEMBERS: 10,
  MAX_WATCH_PARTY_MEMBERS_FREE: 4, // pricing page's Free-tier room cap — Pro uses MAX_WATCH_PARTY_MEMBERS above
  MAX_BATTLE_PARTICIPANTS: 10,
  AVATAR_MAX_SIZE: 5 * 1024 * 1024,   // 5MB
  VIDEO_MAX_SIZE: 500 * 1024 * 1024,  // 500MB
  BIO_MAX_LENGTH: 200,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  MAX_WS_CONN_PER_MINUTE: 10,
  MAX_WS_MSG_PER_WINDOW: 10,
} as const;

// ─────────────────────────────────────────────
// Timing (milliseconds unless noted)
// ─────────────────────────────────────────────

export const TIMING = {
  BRUTE_FORCE_DELAY_MS: 500,          // base delay per failed attempt
  ROOM_INACTIVE_MINUTES: 10,          // close room after N minutes idle
  SYNC_DRIFT_WINDOW_MS: 500,          // tolerated sync drift before correction
  ES_MAX_RESULT_WINDOW: 10_000,       // Elasticsearch max_result_window
  WS_CONN_RATE_WINDOW_MS: 60_000,     // WebSocket connection rate window
  WS_MSG_RATE_WINDOW_MS: 5_000,       // WebSocket message rate window
} as const;

// ─────────────────────────────────────────────
// MongoDB Connection Options
// ─────────────────────────────────────────────

export const MONGO_OPTIONS = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
} as const;

// ─────────────────────────────────────────────
// Regex Patterns
// ─────────────────────────────────────────────

export const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  OBJECT_ID: /^[a-f\d]{24}$/i,
} as const;

// ─────────────────────────────────────────────
// Synthetic Telegram Email Placeholder
// ─────────────────────────────────────────────
// Telegram login has no email, so the backend stores a synthetic placeholder
// (`tg_<id>@telegram.wewatch.internal`, see services/auth telegramAuth.service)
// purely to satisfy the unique+required email column. The legacy
// `.cinesync.internal` domain (pre-rename) still exists for older accounts,
// so match both. Mirrors apps/mobile/src/utils/user.ts (kept in sync manually —
// mobile has its own copy since it doesn't import @shared).

export const PLACEHOLDER_EMAIL_DOMAINS = ['@telegram.wewatch.internal', '@telegram.cinesync.internal'] as const;

export const isPlaceholderEmail = (email: string): boolean =>
  PLACEHOLDER_EMAIL_DOMAINS.some((d) => email.endsWith(d));
