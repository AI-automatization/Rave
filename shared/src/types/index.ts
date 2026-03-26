import type { Request } from 'express';

// ─────────────────────────────────────────────
// API Response
// ─────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[] | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────

export type UserRole = 'user' | 'operator' | 'moderator' | 'admin' | 'superadmin';

export type UserRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface IUser {
  _id: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  favoriteGenres?: ContentGenre[];
  role: UserRole;
  rank: UserRank;
  totalPoints: number;
  isEmailVerified: boolean;
  isBlocked: boolean;
  blockReason?: string | null;
  blockedAt?: Date | string | null;
  lastDevice?: string | null;
  isOnline?: boolean;
  lastSeenAt?: Date | string | null;
  fcmTokens: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  _id: string;
  username: string;
  avatar: string | null;
  bio: string;
  rank: UserRank;
  totalPoints: number;
  isOnline: boolean;
}

// ─────────────────────────────────────────────
// JWT Payload
// ─────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface OptionalAuthRequest extends Request {
  user?: JwtPayload;
}

// ─────────────────────────────────────────────
// Movie / Content
// ─────────────────────────────────────────────

export type ContentType = 'movie' | 'series' | 'short';

export type ContentGenre =
  | 'action'
  | 'comedy'
  | 'drama'
  | 'horror'
  | 'thriller'
  | 'romance'
  | 'sci-fi'
  | 'animation'
  | 'documentary'
  | 'fantasy';

export interface ICastMember {
  name: string;
  photoUrl?: string;
}

export interface IMovie {
  _id: string;
  title: string;
  originalTitle: string;
  slug?: string;
  description: string;
  type: ContentType;
  genre: ContentGenre[];
  year: number;
  duration: number; // minutes
  rating: number; // 0-10
  reviewCount?: number;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string; // HLS m3u8
  trailerUrl: string;
  isPublished: boolean;
  viewCount: number;
  director?: string;
  cast?: ICastMember[];
  addedBy: string; // operator/admin userId
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Watch Party
// ─────────────────────────────────────────────

export type WatchPartyStatus = 'waiting' | 'playing' | 'paused' | 'ended';
export type VideoPlatform = 'youtube' | 'direct' | 'webview';

export interface IWatchPartyRoom {
  _id: string;
  name?: string | null;
  movieId?: string | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
  videoThumbnail?: string | null;
  videoPlatform?: VideoPlatform | null;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  memberCount?: number;  // included in getRooms response
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  serverTimestamp: number;
  updatedBy: string;
}

// ─────────────────────────────────────────────
// Battle
// ─────────────────────────────────────────────

export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';
export type BattleDuration = 3 | 5 | 7; // days

export interface IBattle {
  _id: string;
  title: string;
  creatorId: string;
  participants: IBattleParticipant[];
  duration: BattleDuration;
  status: BattleStatus;
  startDate: Date;
  endDate: Date;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBattleParticipant {
  userId: string;
  score: number;
  moviesWatched: number;
  minutesWatched: number;
  joinedAt: Date;
}

// ─────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'watch_party_invite'
  | 'battle_invite'
  | 'battle_result'
  | 'achievement_unlocked'
  | 'friend_online'
  | 'friend_watching';

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// Achievement
// ─────────────────────────────────────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';

export interface IAchievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  iconUrl: string;
  rarity: AchievementRarity;
  points: number;
  condition: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Video Extraction (shared between content service + mobile)
// ─────────────────────────────────────────────

/**
 * Type 1 — direct MP4/HLS (pirate sites: playerjs, lookmovie2, moviesapi)
 * Type 2 — embed API (YouTube, Twitch, VK, Rutube, Vimeo, Dailymotion)
 * Type 3 — auth/DRM WebView session (Cinerama, Megogo, Kinopoisk)
 */
export type VideoSourceType = 'type1' | 'type2' | 'type3';

export type ExtractionMethod =
  | 'playerjs'       // Playerjs JSON config in <script>
  | 'security-api'   // lookmovie2 /api/v1/security/movie-access
  | 'yt-dlp'         // yt-dlp binary extraction
  | 'playwright'     // headless browser network interception
  | 'webview-session'// can't extract — WebView IS the player
  | 'embed-api';     // official embed JS API (YouTube IFrame, Twitch Embed, etc.)

export interface EpisodeInfo {
  label: string;  // e.g. "S1E1 — Пилот"
  url: string;    // direct MP4 or HLS URL
  quality?: string; // e.g. "1080p"
}

/** Request body for POST /api/v1/content/extract */
export interface VideoExtractRequest {
  url: string;
  /** Netscape-format cookies from WebView (for auth-protected Type 3 sites) */
  cookies?: string;
  /** TMDB movie ID — enables moviesapi.club lookup */
  tmdbId?: string;
}

// ─────────────────────────────────────────────
// Friendship
// ─────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface IFriendship {
  _id: string;
  requesterId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}
