// CineSync Mobile — Type Definitions
// Shared types dan re-export + mobile-specific types

export type {
  ApiResponse,
  PaginationMeta,
  IUser,
  IUserPublic,
  UserRole,
  UserRank,
  JwtPayload,
  IMovie,
  ICastMember,
  ContentType,
  ContentGenre,
  IWatchPartyRoom,
  WatchPartyStatus,
  SyncState,
  IBattle,
  IBattleParticipant,
  BattleStatus,
  BattleDuration,
  INotification,
  NotificationType,
  IAchievement,
  AchievementRarity,
  IFriendship,
  FriendshipStatus,
} from '@shared/types/index';

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: import('@shared/types/index').IUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenStorage {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
}

// ─────────────────────────────────────────────
// Watch History
// ─────────────────────────────────────────────

export interface IWatchProgress {
  movieId: string;
  progress: number; // seconds
  duration: number; // seconds
  isCompleted: boolean;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// User Stats
// ─────────────────────────────────────────────

export interface IUserStats {
  totalWatched: number;
  totalMinutes: number;
  totalPoints: number;
  rank: import('@shared/types/index').UserRank;
  rankProgress: number; // 0-100
  battlesWon: number;
  battlesTotal: number;
  achievementsCount: number;
  friendsCount: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity?: number[]; // 7 kun, minutes per day (Du..Ya)
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; devOtp?: string };
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  MovieDetail: { movieId: string };
  VideoPlayer: { movieId: string; videoUrl: string; title: string };
  VideoExtract: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query: string };
};

export type FriendsStackParamList = {
  Friends: undefined;
  FriendProfile: { userId: string };
  FriendSearch: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Stats: undefined;
  Achievements: undefined;
  Settings: undefined;
};

export type ModalStackParamList = {
  WatchParty: { roomId: string };
  WatchPartyCreate: undefined;
  Battle: { battleId?: string };
  BattleCreate: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  FriendsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProfileSetup: undefined;
  Modal: { screen: keyof ModalStackParamList; params?: ModalStackParamList[keyof ModalStackParamList] };
};
