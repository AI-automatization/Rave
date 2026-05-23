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
  activeWatchParties: number;
}

// ── Users ─────────────────────────────────────────────────────

export interface AdminUser {
  _id: string;
  authId: string;
  email: string;
  username: string;
  avatar: string | null;
  role: 'user' | 'operator' | 'admin' | 'superadmin';
  isBlocked: boolean;
  blockReason?: string | null;
  blockedAt?: string | null;
  lastDevice?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  restrictions?: string[];
}

// ── Staff ─────────────────────────────────────────────────────

export type StaffRole = 'admin' | 'operator' | 'moderator' | 'superadmin';

export interface StaffMember {
  _id: string;
  authId: string;
  email: string;
  username: string;
  avatar: string | null;
  role: StaffRole;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
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
  method: string | null;
  url: string | null;
  statusCode: number | null;
  duration: number | null;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
}

// ── Watch Parties ─────────────────────────────────────────────

export interface AdminWatchParty {
  _id: string;
  inviteCode: string;
  name?: string | null;
  ownerId: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  movieId: string | null;
  videoUrl?: string | null;
  videoTitle?: string | null;
  videoThumbnail?: string | null;
  videoPlatform?: string | null;
  videoDuration?: number;
  currentTime: number;
  isPlaying: boolean;
  isPrivate: boolean;
  members: string[];
  maxMembers: number;
  lastActivityAt: string;
  createdAt: string;
  domain?: string | null;
  isSuspicious?: boolean;
  suspiciousReason?: string | null;
  isAdminBlocked?: boolean;
}

export interface AuditLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

// ── System Health ──────────────────────────────────────────────

export interface ServiceHealth {
  status: 'ok' | 'error';
  latency?: number;
}

export type SystemHealth = Record<string, ServiceHealth>;

// ── Analytics ─────────────────────────────────────────────────

export interface Analytics {
  newUsersToday: number;
  newUsersThisWeek: number;
  watchPartiesCreatedToday: number;
}

export type ActivityItemType = 'error' | 'admin_action' | 'report';

export interface ActivityFeedItem {
  id: string;
  type: ActivityItemType;
  title: string;
  detail: string;
  timestamp: string;
}

export interface ErrorTrendPoint {
  date: string;
  count: number;
}
