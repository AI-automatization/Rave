import { Request } from 'express';

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

export type UserRole = 'user' | 'operator' | 'admin' | 'superadmin';

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

export interface IMovie {
  _id: string;
  title: string;
  originalTitle: string;
  description: string;
  type: ContentType;
  genre: ContentGenre[];
  year: number;
  duration: number; // minutes
  rating: number; // 0-10
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string; // HLS m3u8
  trailerUrl: string;
  isPublished: boolean;
  viewCount: number;
  addedBy: string; // operator/admin userId
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Watch Party
// ─────────────────────────────────────────────

export type WatchPartyStatus = 'waiting' | 'playing' | 'paused' | 'ended';

export interface IWatchPartyRoom {
  _id: string;
  movieId: string;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
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

export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled';
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
