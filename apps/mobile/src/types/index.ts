// WeWatch Mobile — Type Definitions
// Shared types dan re-export + mobile-specific types

export type {
  ApiResponse,
  PaginationMeta,
  IUser,
  IUserPublic,
  UserRole,
  UserRank,
  JwtPayload,
  IWatchPartyRoom,
  WatchPartyStatus,
  VideoPlatform,
  VideoItem,
  SyncState,
  INotification,
  NotificationType,
  IFriendship,
  FriendshipStatus,
  SyncMessage,
  MeshSignalPayload,
  VideoCandidate,
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
// User Stats
// ─────────────────────────────────────────────

export interface IUserStats {
  totalWatched: number;
  totalMinutes: number;
  totalPoints: number;
  rank: import('@shared/types/index').UserRank;
  rankProgress: number; // 0-100
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
  VerifyEmail: { email: string; password?: string; devOtp?: string };
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  VideoPlayer: { videoUrl: string; title: string };
  VideoExtract: undefined;
  SearchResults: { query: string };
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
  Settings: undefined;
  WatchHistory: undefined;
  PurchaseHistory: undefined;
  BindEmail: { mode?: 'bind' | 'change' } | undefined;
};

export type ModalStackParamList = {
  WatchParty: {
    roomId: string;
    videoReferer?: string;
    /** T-S189: videoUrl aniqlanmasdan (deteksiyasiz) yaratilgan xona — birinchi kirishda
     * CHANGE_MEDIA qayta yuborilishi kerak, server extraction+VB fallback ishga tushishi uchun.
     * Web'dagi ?verify=1 bilan bir xil maqsad. */
    needsVerify?: boolean;
  };
  WatchPartyCreate: undefined;
  WatchPartyJoin: { inviteCode?: string } | undefined;
  Notifications: undefined;
  SourcePicker: {
    mode: 'create' | 'change' | 'queue';
    roomId?: string;
  };
  MediaWebView: {
    sourceId: string;
    sourceName: string;
    defaultUrl: string;
    mode: 'create' | 'change' | 'queue';
    roomId?: string;
  };
  SupportChat: undefined;
  DMChat: { peerId: string; peerName: string };
  FriendProfile: { userId: string };
};

export interface IDMMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  // Reply — javob berilgan xabar snapshot'i (Telegram uslubi)
  replyToId?: string | null;
  replyToText?: string | null;
  replyToSender?: string | null;
  // Forward — boshqa suhbatdan uzatilgan bo'lsa, original muallif username'i
  forwardFrom?: string | null;
  // Pin — ikkala suhbatdosh ham ko'radi (shared state, faqat menga emas)
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDMConversation {
  peerId: string;
  peerUsername: string;
  peerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
}

// ─────────────────────────────────────────────
// Video Playback (replaces expo-av AVPlaybackStatus)
// ─────────────────────────────────────────────

export type PlaybackStatus =
  | {
      isLoaded: true;
      isPlaying: boolean;
      positionMillis: number;
      durationMillis?: number;
      isBuffering: boolean;
      didJustFinish?: boolean;
    }
  | {
      isLoaded: false;
      error?: string;
    };

export type RoomsStackParamList = {
  Rooms: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ChatsTab: undefined;
  CreateTab: undefined;
  FriendsTab: undefined;
  ProfileTab: undefined;
};

export type ChatsStackParamList = {
  Conversations: undefined;
  DMChat: { peerId: string; peerName: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProfileSetup: undefined;
  PrivacyPolicy: undefined;
  Modal: { screen: keyof ModalStackParamList; params?: ModalStackParamList[keyof ModalStackParamList] };
};
