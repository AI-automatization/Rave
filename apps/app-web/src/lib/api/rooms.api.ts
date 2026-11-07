import { apiClient } from '@/lib/api-client';
import type { IWatchPartyRoom } from '@/types';

interface CreateRoomPayload {
  name?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  videoPlatform?: string;
  /** Page a taken player iframe sat on (desktop "Take video") — the server opens the player with it. */
  videoReferer?: string;
  /** The film's own stream the desktop panel caught — the server checks it and plays it in the synced player. */
  videoStream?: { url: string; type: 'hls' | 'dash' | 'mp4' };
  isPrivate?: boolean;
}

export type EmbedCheckReason = 'ok' | 'xfo' | 'csp' | 'unreachable' | 'blocked' | 'private' | 'invalid';

export interface EmbedCheckResult {
  embeddable: boolean;
  finalUrl: string;
  reason: EmbedCheckReason;
}

// Backend returns rooms array directly in data (not wrapped as { rooms: [] })
// createRoom/joinRoom return the room object directly in data
export const roomsApi = {
  list: () =>
    apiClient<IWatchPartyRoom[]>('/api/rooms'),

  getById: (id: string) =>
    apiClient<IWatchPartyRoom>(`/api/rooms/${id}`),

  create: (data: CreateRoomPayload) =>
    apiClient<IWatchPartyRoom>('/api/rooms', { method: 'POST', body: data }),

  embedCheck: (url: string) =>
    apiClient<EmbedCheckResult>(`/api/rooms/embed-check?url=${encodeURIComponent(url)}`),

  joinByCode: (code: string, password?: string) =>
    apiClient<IWatchPartyRoom>(`/api/rooms/join/${code}`, {
      method: 'POST',
      ...(password ? { body: { password } } : {}),
    }),
};
