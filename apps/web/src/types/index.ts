// CineSync Web — TypeScript Types
// shared/types bilan sinxron (Saidazim bilan kelishib o'zgartiriladi)

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface IMovie {
  _id: string;
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop?: string;
  genres: string[];
  year: number;
  duration: number;
  rating: number;
  reviewCount: number;
  director?: string;
  cast?: string[];
  videoUrl?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  rank: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';
  totalPoints: number;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface IFriendship {
  _id: string;
  requester: IUser;
  receiver: IUser;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface IWatchPartyRoom {
  _id: string;
  movie: IMovie;
  owner: IUser;
  members: IUser[];
  inviteCode: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  currentTime: number;
  isPlaying: boolean;
  maxMembers: number;
  createdAt: string;
}

export interface IBattle {
  _id: string;
  participants: IBattleParticipant[];
  duration: 3 | 5 | 7;
  status: 'pending' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  winnerId?: string;
}

export interface IBattleParticipant {
  user: IUser;
  score: number;
  moviesWatched: number;
  minutesWatched: number;
}

export interface INotification {
  _id: string;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'battle_invite'
    | 'battle_result'
    | 'achievement_unlocked'
    | 'watch_party_invite'
    | 'system';
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

export interface IChatMessage {
  id: string;
  user: Pick<IUser, '_id' | 'username' | 'avatar'>;
  text: string;
  timestamp: number;
}

export interface IAchievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string;
}
