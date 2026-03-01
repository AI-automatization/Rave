import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParams = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

// ─── Home Stack ───────────────────────────────────────────────────────────────

export type HomeStackParams = {
  Home: undefined;
  MovieDetail: { movieId: string };
  VideoPlayer: { movieId: string; title: string; videoUrl: string; startTime?: number };
};

// ─── Search Stack ─────────────────────────────────────────────────────────────

export type SearchStackParams = {
  Search: undefined;
  SearchResults: { query: string };
  MovieDetail: { movieId: string };
};

// ─── Friends Stack ────────────────────────────────────────────────────────────

export type FriendsStackParams = {
  Friends: undefined;
  FriendProfile: { userId: string };
  FriendSearch: undefined;
};

// ─── Profile Stack ────────────────────────────────────────────────────────────

export type ProfileStackParams = {
  Profile: undefined;
  Stats: undefined;
  Achievements: undefined;
  Settings: undefined;
};

// ─── Main Tabs ────────────────────────────────────────────────────────────────

export type MainTabsParams = {
  HomeTab: NavigatorScreenParams<HomeStackParams>;
  SearchTab: NavigatorScreenParams<SearchStackParams>;
  FriendsTab: NavigatorScreenParams<FriendsStackParams>;
  ProfileTab: NavigatorScreenParams<ProfileStackParams>;
};

// ─── Modal Stack (root) ───────────────────────────────────────────────────────

export type RootStackParams = {
  Auth: NavigatorScreenParams<AuthStackParams>;
  Main: NavigatorScreenParams<MainTabsParams>;
  WatchParty: { roomId: string };
  WatchPartyCreate: { movieId: string };
  Battle: { battleId: string };
  BattleCreate: undefined;
  Notifications: undefined;
};
