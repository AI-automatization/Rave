// ─── Shared types (mirror of shared/src/types/index.ts) ──────────────────────

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
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface IUserSettings {
  language: string;
  theme: 'dark';
  notifications: {
    pushEnabled: boolean;
    friendRequest: boolean;
    watchPartyInvite: boolean;
    battleInvite: boolean;
    achievementUnlocked: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showWatchHistory: boolean;
  };
}

// ─── Content ─────────────────────────────────────────────────────────────────

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
  duration: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  trailerUrl: string;
  isPublished: boolean;
  viewCount: number;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWatchHistory {
  _id: string;
  userId: string;
  movieId: string;
  movie?: IMovie;
  currentTime: number;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IRating {
  _id: string;
  userId: string;
  movieId: string;
  rating: number;
  review: string;
  createdAt: string;
}

// ─── Watch Party ──────────────────────────────────────────────────────────────

export type WatchPartyStatus = 'waiting' | 'playing' | 'paused' | 'ended';

export interface IWatchPartyRoom {
  _id: string;
  movieId: string;
  movie?: IMovie;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  serverTimestamp: number;
  updatedBy: string;
}

export interface ChatMessage {
  userId: string;
  username: string;
  avatar: string | null;
  message: string;
  timestamp: string;
}

export interface EmojiEvent {
  userId: string;
  emoji: string;
  timestamp: string;
}

// ─── Battle ───────────────────────────────────────────────────────────────────

export type BattleStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type BattleDuration = 3 | 5 | 7;

export interface IBattleParticipant {
  userId: string;
  username?: string;
  avatar?: string | null;
  score: number;
  moviesWatched: number;
  minutesWatched: number;
  joinedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface IBattle {
  _id: string;
  title: string;
  creatorId: string;
  participants: IBattleParticipant[];
  duration: BattleDuration;
  status: BattleStatus;
  startDate: string;
  endDate: string;
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

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
  createdAt: string;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';

export interface IAchievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  iconUrl: string;
  rarity: AchievementRarity;
  points: number;
  unlockedAt?: string;
}

export interface IUserStats {
  totalPoints: number;
  level: number;
  rank: UserRank;
  nextMilestone: number;
  moviesWatched: number;
  minutesWatched: number;
  battlesWon: number;
  watchParties: number;
  achievementsUnlocked: number;
}

// ─── Friendship ───────────────────────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface IFriend extends IUserPublic {
  friendshipId: string;
  friendshipStatus: FriendshipStatus;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
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

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface RegisterResponse {
  userId: string;
}
