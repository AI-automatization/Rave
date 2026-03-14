export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[] | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Auth ──────────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'superadmin' | 'operator';
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  activeBattles: number;
  activeWatchParties: number;
}

// ── Users ─────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  email: string;
  username: string;
  avatar: string | null;
  role: 'user' | 'operator' | 'admin' | 'superadmin';
  isBlocked: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ── Movies ────────────────────────────────────────────────────

export interface AdminMovie {
  _id: string;
  title: string;
  originalTitle: string;
  type: 'movie' | 'series' | 'short';
  genre: string[];
  year: number;
  duration: number;
  rating: number;
  posterUrl: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

// ── Feedback ──────────────────────────────────────────────────

export interface Feedback {
  _id: string;
  userId: string;
  type: 'bug' | 'feature' | 'general';
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

// ── Logs ─────────────────────────────────────────────────────

export interface ApiLog {
  _id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  service: string;
  timestamp: string;
  meta: Record<string, unknown>;
}

// ── Analytics ─────────────────────────────────────────────────

export interface Analytics {
  newUsersToday: number;
  newUsersThisWeek: number;
  watchPartiesCreatedToday: number;
  battlesCreatedToday: number;
  topMovies: Array<{ _id: string; title: string; viewCount: number }>;
  genreDistribution: Array<{ genre: string; count: number }>;
}
