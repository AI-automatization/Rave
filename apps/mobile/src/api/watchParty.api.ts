import { watchPartyClient } from './client';
import type { ApiResponse, IWatchPartyRoom } from '@types/index';

export const watchPartyApi = {
  createRoom: async (movieId: string, isPrivate = false, maxMembers = 10) => {
    const { data } = await watchPartyClient.post<ApiResponse<IWatchPartyRoom>>(
      '/watch-party/rooms',
      { movieId, isPrivate, maxMembers },
    );
    return data;
  },

  getRoom: async (roomId: string) => {
    const { data } = await watchPartyClient.get<ApiResponse<IWatchPartyRoom>>(
      `/watch-party/rooms/${roomId}`,
    );
    return data;
  },

  joinByInviteCode: async (inviteCode: string) => {
    const { data } = await watchPartyClient.post<ApiResponse<IWatchPartyRoom>>(
      `/watch-party/rooms/join/${inviteCode}`,
    );
    return data;
  },

  leaveRoom: async (roomId: string) => {
    await watchPartyClient.delete(`/watch-party/rooms/${roomId}/leave`);
  },
};
