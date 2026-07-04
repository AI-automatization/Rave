import { apiClient } from '@/lib/api-client';
import type { IWatchPartyRoom } from '@/types';

interface CreateRoomPayload {
  name?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  videoPlatform?: string;
  isPrivate?: boolean;
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

  joinByCode: (code: string) =>
    apiClient<IWatchPartyRoom>(`/api/rooms/join/${code}`, { method: 'POST' }),
};
