// WeWatch Web — TypeScript Types
// Re-export shared types and add web-specific extensions

export type {
  UserRole,
  UserRank,
  WatchPartyStatus,
  SyncState,
  NotificationType,
  FriendshipStatus,
  JwtPayload,
  IUserPublic,
  VideoPlatform,
} from '@shared/types';

// Import for local use within this file
import type { VideoPlatform } from '@shared/types';

// Web-only types (not in shared)
export type ContentType = 'movie' | 'series' | 'anime' | 'documentary';
export type ContentGenre = string;
export type BattleDuration = '1h' | '3h' | '6h' | '12h' | '24h' | '48h' | '7d';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';

export interface ICastMember {
  name: string;
  role?: string;
  avatar?: string;
}

// Import and re-export PaginationMeta; extend ApiResponse for web
import type { ApiResponse as ApiResponseShared, PaginationMeta } from '@shared/types';
export type { PaginationMeta } from '@shared/types';

/** ApiResponse for web — includes `pagination` alias for backward compatibility */
export interface ApiResponse<T = null> extends Omit<ApiResponseShared<T>, 'meta'> {
  meta?: PaginationMeta;
  pagination?: PaginationMeta;
}

import type {
  IUser as IUserShared,
  IWatchPartyRoom as IWatchPartyRoomShared,
} from '@shared/types';

// ─────────────────────────────────────────────
// Web-specific type extensions
// These override shared types with web-friendly adjustments
// (e.g., Date → string for serialized JSON responses)
// ─────────────────────────────────────────────

/** IUser for the web — dates come as strings from JSON, extra web fields */
export interface IUser extends Omit<IUserShared, 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'lastSeenAt' | 'avatar' | 'bio' | 'isEmailVerified' | 'isBlocked' | 'fcmTokens' | 'favoriteGenres'> {
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  isEmailVerified?: boolean;
  isBlocked?: boolean;
  fcmTokens?: string[];
  favoriteGenres?: string[];
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** IMovie for the web — standalone, dates as strings */
export interface IMovie {
  _id: string;
  title: string;
  slug?: string;
  originalTitle?: string;
  description?: string;
  type?: string;
  genre?: string[];
  genres?: string[];
  year?: number;
  duration?: number;
  poster?: string;
  posterUrl?: string;
  backdrop?: string;
  backdropUrl?: string;
  videoUrl?: string;
  trailerUrl?: string;
  rating?: number;
  reviewCount?: number;
  director?: string;
  cast?: string[];
  addedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

/** IWatchPartyRoom for the web — dates as strings */
export interface IWatchPartyRoom extends Omit<IWatchPartyRoomShared, 'createdAt' | 'updatedAt' | 'videoPlatform' | 'name' | 'movieId' | 'videoUrl' | 'videoTitle' | 'videoThumbnail'> {
  name: string | null;
  movieId: string | null;
  videoUrl: string | null;
  videoTitle: string | null;
  videoThumbnail: string | null;
  videoPlatform: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type VideoStatus = 'pending' | 'approved' | 'rejected';

/** BattleStatus for web — subset commonly used in web UI */
export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';

export interface IExternalVideo {
  _id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: VideoPlatform;
  submittedBy: string;
  status: VideoStatus;
  isPublic: boolean;
  viewCount: number;
  rating: number;
  ratingCount: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  platform: VideoPlatform;
}

/** IBattle for the web — standalone */
export interface IBattle {
  _id: string;
  title?: string;
  creatorId?: string;
  participants: IBattleParticipant[];
  status: BattleStatus;
  duration: BattleDuration;
  startDate: string;
  endDate: string;
  winnerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** IBattleParticipant for the web */
export interface IBattleParticipant {
  user: IUser;
  userId?: string;
  score?: number;
  joinedAt?: string;
}

/** INotification for the web — dates as strings, extra types */
export interface INotification {
  _id: string;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'battle_invite'
    | 'battle_result'
    | 'achievement_unlocked'
    | 'watch_party_invite'
    | 'friend_online'
    | 'friend_watching'
    | 'system';
  title: string;
  body: string;
  isRead: boolean;
  userId?: string;
  data?: Record<string, string>;
  createdAt: string;
}

/** IFriendship for the web — requester is always populated; receiver only populated for outgoing requests */
export interface IFriendship {
  _id: string;
  requesterId?: string;
  receiverId?: string;
  requester: IUser;
  receiver?: IUser;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt?: string;
}

/** Snapshot of a quoted room-chat message — room chat isn't persisted, so it travels with the reply. */
export interface IChatReplyTo {
  id: string;
  text: string;
  senderName: string;
}

export interface IChatMessage {
  id: string;
  user: Pick<IUser, '_id' | 'username' | 'avatar'>;
  text: string;
  timestamp: number;
  replyTo?: IChatReplyTo;
}

/** IAchievement for the web — standalone */
export interface IAchievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  iconUrl?: string;
  rarity: AchievementRarity;
  points?: number;
  condition?: Record<string, unknown>;
  unlockedAt?: string;
  createdAt?: string;
}
