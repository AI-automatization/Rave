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

export const roomsApi = {
  list: () =>
    apiClient<{ rooms: IWatchPartyRoom[] }>('/api/rooms'),

  getById: (id: string) =>
    apiClient<{ room: IWatchPartyRoom }>(`/api/rooms/${id}`),

  create: (data: CreateRoomPayload) =>
    apiClient<{ room: IWatchPartyRoom }>('/api/rooms', { method: 'POST', body: data }),

  joinByCode: (code: string) =>
    apiClient<{ room: IWatchPartyRoom }>(`/api/rooms/join/${code}`, { method: 'POST' }),
};
