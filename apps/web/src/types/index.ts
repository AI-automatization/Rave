// CineSync Web — TypeScript Types
// Re-export shared types and add web-specific extensions

export type {
  UserRole,
  UserRank,
  ContentType,
  ContentGenre,
  ICastMember,
  WatchPartyStatus,
  SyncState,
  BattleDuration,
  NotificationType,
  AchievementRarity,
  FriendshipStatus,
  JwtPayload,
  IUserPublic,
} from '@shared/types';

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
  IMovie as IMovieShared,
  IWatchPartyRoom as IWatchPartyRoomShared,
  IBattle as IBattleShared,
  IBattleParticipant as IBattleParticipantShared,
  IAchievement as IAchievementShared,
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

/** IMovie for the web — supports both shared field names and legacy web names */
export interface IMovie extends Omit<IMovieShared, 'createdAt' | 'updatedAt' | 'originalTitle' | 'type' | 'genre' | 'posterUrl' | 'backdropUrl' | 'videoUrl' | 'trailerUrl' | 'addedBy' | 'cast' | 'reviewCount'> {
  slug?: string;
  originalTitle?: string;
  type?: string;
  genre?: string[];
  genres?: string[];
  poster?: string;
  posterUrl?: string;
  backdrop?: string;
  backdropUrl?: string;
  videoUrl?: string;
  trailerUrl?: string;
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

/** VideoPlatform for web — extended with additional platforms */
export type VideoPlatform = 'youtube' | 'direct' | 'webview' | 'vimeo' | 'twitch' | 'dailymotion' | 'other';
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

/** IBattle for the web — dates as strings, participants populated */
export interface IBattle extends Omit<IBattleShared, 'creatorId' | 'startDate' | 'endDate' | 'winnerId' | 'createdAt' | 'updatedAt' | 'participants' | 'status'> {
  creatorId?: string;
  participants: IBattleParticipant[];
  status: BattleStatus;
  startDate: string;
  endDate: string;
  winnerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** IBattleParticipant for the web — user is populated */
export interface IBattleParticipant extends Omit<IBattleParticipantShared, 'userId' | 'joinedAt'> {
  user: IUser;
  userId?: string;
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

/** IFriendship for the web — requester/receiver are populated user objects */
export interface IFriendship {
  _id: string;
  requester: IUser;
  receiver: IUser;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt?: string;
}

export interface IChatMessage {
  id: string;
  user: Pick<IUser, '_id' | 'username' | 'avatar'>;
  text: string;
  timestamp: number;
}

/** IAchievement for the web — includes 'secret' rarity, icon as string (emoji) */
export interface IAchievement extends Omit<IAchievementShared, 'iconUrl' | 'condition' | 'rarity'> {
  icon: string;
  iconUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  condition?: Record<string, unknown>;
  unlockedAt?: string;
}
