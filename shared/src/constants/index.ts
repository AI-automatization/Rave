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
  loginAttempts: (email: string) => `login_attempts:${email}`,
  heartbeat: (userId: string) => `heartbeat:${userId}`,
  movieCache: (movieId: string) => `movie:${movieId}`,
  watchPartyRoom: (roomId: string) => `watch_party:${roomId}`,
  battleLeaderboard: (battleId: string) => `battle:leaderboard:${battleId}`,
  userSession: (userId: string) => `session:${userId}`,
  rateLimitUser: (userId: string) => `rate:user:${userId}`,
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
} as const;

// ─────────────────────────────────────────────
// Limits
// ─────────────────────────────────────────────

export const LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_FRIENDS: 500,
  MAX_WATCH_PARTY_MEMBERS: 10,
  MAX_BATTLE_PARTICIPANTS: 10,
  AVATAR_MAX_SIZE: 5 * 1024 * 1024,   // 5MB
  VIDEO_MAX_SIZE: 500 * 1024 * 1024,  // 500MB
  BIO_MAX_LENGTH: 200,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
} as const;

// ─────────────────────────────────────────────
// Regex Patterns
// ─────────────────────────────────────────────

export const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  OBJECT_ID: /^[a-f\d]{24}$/i,
} as const;
