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
  username?: string;
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
// Watch Party
// ─────────────────────────────────────────────

export type WatchPartyStatus = 'waiting' | 'playing' | 'paused' | 'ended';
export type VideoPlatform = 'youtube' | 'vimeo' | 'twitch' | 'dailymotion' | 'direct' | 'webview' | 'other';

/**
 * Outcome of the background pre-resolve started when an item is queued (T-S173).
 *  pending   — probe in flight, or the item predates the feature
 *  ready     — extraction (or the headless VB probe) produced something playable
 *  needs_vb  — nothing playable found; playing it will fall back to the interactive
 *              virtual browser, where a human clicks through the page
 */
export type VideoResolveStatus = 'pending' | 'ready' | 'needs_vb';

export interface VideoItem {
  videoUrl: string;
  videoTitle: string | null;
  videoPlatform: VideoPlatform | null;
  addedBy: string;   // userId
  addedAt: Date;
  // Optional so documents written before T-S173 stay valid — absent means "never probed".
  resolveStatus?: VideoResolveStatus;
  resolvedAt?: Date | null;
}

export interface IWatchPartyRoom {
  _id: string;
  name?: string | null;
  movieId?: string | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
  videoThumbnail?: string | null;
  videoPlatform?: VideoPlatform | null;
  videoReferer?: string | null;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  // Google Meet-style "knock to enter" (2026-08-26) — only meaningful when isPrivate is true.
  // See joinRoom()/approveJoinRequest() in watchParty.service.ts.
  requireApproval?: boolean;
  pendingRequests?: { userId: string; requestedAt: Date }[];
  memberCount?: number;  // included in getRooms response
  playlist?: VideoItem[]; // T-E107
  // 2026-08-22, Pro "continue watching" — see watchParty.service.ts's closeRoomBySystem.
  lastFrame?: string | null;
  resumable?: boolean;
  resumeExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  serverTimestamp: number;
  updatedBy: string;
  scheduledAt?: number; // UTC ms — peers execute play/pause at this exact timestamp
}

// ─────────────────────────────────────────────
// WebRTC Mesh (Bosqich B — Rave Hybrid Sync)
// ─────────────────────────────────────────────

export type MeshSignalType = 'offer' | 'answer' | 'ice';

export interface MeshSignalPayload {
  fromUserId: string;
  toUserId: string;
  type: MeshSignalType;
  sdp?: { type: 'offer' | 'answer'; sdp: string };
  candidate?: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
}

export interface SyncMessage {
  type: 'play' | 'pause' | 'seek' | 'heartbeat';
  currentTime: number;
  scheduledAt?: number; // only for play/pause/seek
  timestamp: number;
  fromUserId: string;
}

// ─────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────

export type UserRestriction =
  | 'create_room'
  | 'change_username'
  | 'send_message'
  | 'join_room'
  | 'upload_avatar'
  | 'use_chat';

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'watch_party_invite'
  | 'friend_online'
  | 'friend_watching'
  | 'support_reply'
  | 'dm_message'
  | 'admin_warning'
  // Admin-broadcast types
  | 'announcement'
  | 'maintenance'
  | 'promo'
  | 'update'
  | 'system'
  | 'warning';

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

// One page can genuinely contain several plausible video URLs (real content vs a banner ad vs a
// "recommended" clip) — the anti-ad heuristics elsewhere (duration/size thresholds) only catch
// SHORT ads, not long ones, so sometimes the "found" video just isn't the right one. This lets the
// owner see what was found and pick, instead of the server silently guessing.
export interface VideoCandidate {
  url: string;
  type: 'mp4' | 'hls' | 'dash' | 'embed';
  /** Thumbnail — either the extractor's own og:image-derived poster, or (for VB-caught
   * candidates, which have no page metadata) a base64 JPEG data URI grabbed from VB's own CDP
   * screencast at the moment the candidate was caught. */
  poster?: string;
  duration?: number;
  source: 'extract' | 'vb';
  /** Source page's own <title> (VB) or the extractor's title guess. Only way any candidate ever
   * carries a real name — without it every VB-sourced room stayed on the generic default name. */
  title?: string;
  /** VB only — a real <video>/<audio> play/timeupdate event was observed on this exact URL (or a
   * capture-kind candidate captured while it was playing), not just "network response shaped like
   * media". Owner still confirms manually (picker stays); this only ranks the confirmed one first. */
  confirmed?: boolean;
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
