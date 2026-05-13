import { logger } from './logger';
import {
  axios, AxiosError,
  internalHeaders,
  authServiceUrl, userServiceUrl, contentServiceUrl, notificationServiceUrl,
  battleServiceUrl, watchPartyServiceUrl,
} from './serviceConfig';

// ─── Admin: User Service ───────────────────────────────────────────────────────

export async function adminListUsers(filters: {
  page?: number; limit?: number; role?: string; isBlocked?: boolean; search?: string;
}): Promise<{ users: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page)                          params.set('page',      String(filters.page));
  if (filters.limit)                         params.set('limit',     String(filters.limit));
  if (filters.role)                          params.set('role',      filters.role);
  if (filters.isBlocked !== undefined)       params.set('isBlocked', String(filters.isBlocked));
  if (filters.search)                        params.set('search',    filters.search);
  const res = await axios.get<{ data: { users: unknown[]; total: number } }>(
    `${userServiceUrl}/api/v1/users/internal/admin/users?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminGetUserStats(): Promise<{ totalUsers: number; activeUsers: number; newUsersThisWeek: number }> {
  const res = await axios.get<{ data: { totalUsers: number; activeUsers: number; newUsersThisWeek: number } }>(
    `${userServiceUrl}/api/v1/users/internal/admin/stats`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminBlockUser(userId: string, reason?: string): Promise<void> {
  await axios.post(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/block`, { reason }, { headers: internalHeaders, timeout: 5000 });
}

export async function adminUnblockUser(userId: string): Promise<void> {
  await axios.post(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/unblock`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminChangeUserRole(userId: string, role: string): Promise<void> {
  await axios.patch(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/role`, { role }, { headers: internalHeaders, timeout: 5000 });
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await axios.delete(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}`, { headers: internalHeaders, timeout: 5000 });
}

export async function adminSetUserRestrictions(userId: string, restrictions: string[]): Promise<void> {
  await axios.patch(
    `${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/restrictions`,
    { restrictions }, { headers: internalHeaders, timeout: 5000 },
  );
}

// ─── Admin: Content Service ────────────────────────────────────────────────────

export async function adminListMovies(filters: {
  page?: number; limit?: number; isPublished?: boolean; search?: string; genre?: string;
}): Promise<{ movies: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page)                        params.set('page',        String(filters.page));
  if (filters.limit)                       params.set('limit',       String(filters.limit));
  if (filters.isPublished !== undefined)   params.set('isPublished', String(filters.isPublished));
  if (filters.search)                      params.set('search',      filters.search);
  if (filters.genre)                       params.set('genre',       filters.genre);
  const res = await axios.get<{ data: { movies: unknown[]; total: number } }>(
    `${contentServiceUrl}/api/v1/content/internal/admin/movies?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminPublishMovie(movieId: string): Promise<void> {
  await axios.post(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}/publish`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminUnpublishMovie(movieId: string): Promise<void> {
  await axios.post(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}/unpublish`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminDeleteMovie(movieId: string): Promise<void> {
  await axios.delete(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}`, { headers: internalHeaders, timeout: 5000 });
}

export async function adminOperatorUpdateMovie(movieId: string, data: Record<string, unknown>): Promise<void> {
  await axios.patch(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}`, data, { headers: internalHeaders, timeout: 5000 });
}

export async function adminListDomains(filters: {
  page?: number; limit?: number; filter?: string; search?: string;
}): Promise<unknown> {
  const params = new URLSearchParams();
  if (filters.page)   params.set('page',   String(filters.page));
  if (filters.limit)  params.set('limit',  String(filters.limit));
  if (filters.filter) params.set('filter', filters.filter);
  if (filters.search) params.set('search', filters.search);
  const res = await axios.get(
    `${contentServiceUrl}/api/v1/content/internal/admin/domains?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return (res.data as { data: unknown; meta: unknown });
}

export async function adminBlockDomain(domain: string): Promise<void> {
  await axios.patch(
    `${contentServiceUrl}/api/v1/content/internal/admin/domains/${encodeURIComponent(domain)}/block`,
    {}, { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminUnblockDomain(domain: string): Promise<void> {
  await axios.patch(
    `${contentServiceUrl}/api/v1/content/internal/admin/domains/${encodeURIComponent(domain)}/unblock`,
    {}, { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminGetContentStats(): Promise<{
  genreDistribution: Array<{ genre: string; count: number }>;
  topMovies: Array<{ _id: string; title: string; viewCount: number }>;
  totalMovies: number;
  publishedMovies: number;
}> {
  try {
    const res = await axios.get<{ data: { genreDistribution: Array<{ genre: string; count: number }>; topMovies: Array<{ _id: string; title: string; viewCount: number }>; totalMovies: number; publishedMovies: number } }>(
      `${contentServiceUrl}/api/v1/content/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data;
  } catch {
    return { genreDistribution: [], topMovies: [], totalMovies: 0, publishedMovies: 0 };
  }
}

// ─── Admin: Battle Service ─────────────────────────────────────────────────────

export async function adminGetBattleStats(): Promise<{ createdToday: number; activeNow: number }> {
  try {
    const res = await axios.get<{ data: { createdToday: number; activeNow: number } }>(
      `${battleServiceUrl}/api/v1/battles/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? { createdToday: 0, activeNow: 0 };
  } catch {
    return { createdToday: 0, activeNow: 0 };
  }
}

export async function adminListBattles(filters: {
  page?: number; limit?: number; status?: string;
}): Promise<{ battles: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page)   params.set('page',   String(filters.page));
  if (filters.limit)  params.set('limit',  String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  const res = await axios.get<{ data: unknown[]; meta: { total: number } }>(
    `${battleServiceUrl}/api/v1/battles/internal/admin/list?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return { battles: res.data.data, total: res.data.meta.total };
}

export async function adminEndBattle(battleId: string): Promise<void> {
  await axios.post(`${battleServiceUrl}/api/v1/battles/internal/admin/${battleId}/end`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminCancelBattle(battleId: string): Promise<void> {
  await axios.post(`${battleServiceUrl}/api/v1/battles/internal/admin/${battleId}/cancel`, {}, { headers: internalHeaders, timeout: 5000 });
}

// ─── Admin: Watch Party Service ────────────────────────────────────────────────

export interface WatchPartyRoomDetails {
  _id: string;
  name: string;
  ownerId: string;
  members: string[];
  videoUrl: string | null;
  videoTitle: string | null;
  videoThumbnail: string | null;
  videoPlatform: string | null;
  currentTime: number;
  isPlaying: boolean;
  status: string;
  isPublic: boolean;
  createdAt: string;
}

export async function adminGetWatchPartyRoom(roomId: string): Promise<WatchPartyRoomDetails> {
  const res = await axios.get<{ data: WatchPartyRoomDetails }>(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/details`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminGetUser(userId: string): Promise<{ authId: string; username: string; avatar: string | null } | null> {
  try {
    const res = await axios.get<{ data: { authId: string; username: string; avatar: string | null } }>(
      `${userServiceUrl}/api/v1/users/internal/admin/users/${userId}`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function adminNotifyUsers(userIds: string[], title: string, body: string): Promise<void> {
  await axios.post(
    `${notificationServiceUrl}/api/v1/notifications/internal/admin/notify-users`,
    { userIds, title, body },
    { headers: internalHeaders, timeout: 10000 },
  );
}

export async function adminGetWatchPartyStats(): Promise<{ createdToday: number; activeNow: number }> {
  try {
    const res = await axios.get<{ data: { createdToday: number; activeNow: number } }>(
      `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? { createdToday: 0, activeNow: 0 };
  } catch {
    return { createdToday: 0, activeNow: 0 };
  }
}

export async function adminListWatchParties(filters: {
  page?: number; limit?: number; status?: string;
}): Promise<{ rooms: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page)   params.set('page',   String(filters.page));
  if (filters.limit)  params.set('limit',  String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  const res = await axios.get<{
    success: boolean; data: unknown[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    errors: null;
  }>(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/list?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return { rooms: res.data.data, total: res.data.meta?.total ?? 0 };
}

export async function adminCloseWatchParty(roomId: string, adminEmail?: string, closeReason?: string): Promise<void> {
  await axios.delete(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}`,
    { headers: internalHeaders, data: { adminEmail: adminEmail ?? 'admin', closeReason: closeReason ?? '' }, timeout: 5000 },
  );
}

export async function adminJoinWatchParty(roomId: string): Promise<{ room: unknown }> {
  const res = await axios.post<{ data: { room: unknown } }>(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/join`,
    {}, { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminControlWatchParty(
  roomId: string, action: 'play' | 'pause' | 'seek', currentTime?: number,
): Promise<void> {
  await axios.post(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/control`,
    { action, currentTime }, { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminKickWatchPartyMember(roomId: string, userId: string): Promise<void> {
  await axios.delete(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/members/${userId}`,
    { headers: internalHeaders, timeout: 5000 },
  );
}

// ─── Admin: Notification Broadcast ────────────────────────────────────────────

export async function adminBroadcastNotification(payload: {
  title: string; body: string; type?: string;
}): Promise<void> {
  await axios.post(
    `${notificationServiceUrl}/api/v1/notifications/internal/admin/broadcast`,
    payload, { headers: internalHeaders, timeout: 10000 },
  );
}

export async function adminSendNotificationToUser(payload: {
  userId: string; title: string; body: string; type?: string;
}): Promise<void> {
  await axios.post(
    `${notificationServiceUrl}/api/v1/notifications/internal/send`,
    { ...payload, type: payload.type ?? 'system' },
    { headers: internalHeaders, timeout: 10000 },
  );
}

// ─── Admin: Staff Management ───────────────────────────────────────────────────

export async function adminListStaff(): Promise<unknown[]> {
  try {
    const res = await axios.get<{ data: unknown[] }>(
      `${userServiceUrl}/api/v1/users/internal/admin/staff`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? [];
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[adminServiceClient] adminListStaff failed', { message: error.message });
    return [];
  }
}

export async function adminSendAppealDecisionEmail(
  userId: string,
  status: 'approved' | 'rejected',
  note?: string,
): Promise<void> {
  await axios.post(
    `${authServiceUrl}/api/v1/auth/internal/appeal-decision-email`,
    { userId, status, note },
    { headers: internalHeaders, timeout: 5000 },
  );
}
