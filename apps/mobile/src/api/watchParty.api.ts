// CineSync Mobile — Watch Party API
import { watchPartyClient } from './client';
import { ApiResponse, IWatchPartyRoom } from '@app-types/index';

export const watchPartyApi = {
  async createRoom(data: {
    movieId?: string;
    videoUrl?: string;
    name?: string;
    isPrivate?: boolean;
    maxMembers?: number;
  }): Promise<IWatchPartyRoom> {
    const res = await watchPartyClient.post<ApiResponse<IWatchPartyRoom>>('/watch-party/rooms', data);
    return res.data.data!;
  },

  async getRooms(): Promise<IWatchPartyRoom[]> {
    const res = await watchPartyClient.get<ApiResponse<IWatchPartyRoom[]>>('/watch-party/rooms');
    return res.data.data ?? [];
  },

  async getRoomById(roomId: string): Promise<IWatchPartyRoom> {
    const res = await watchPartyClient.get<ApiResponse<IWatchPartyRoom>>(
      `/watch-party/rooms/${roomId}`,
    );
    return res.data.data!;
  },

  async joinByInviteCode(inviteCode: string): Promise<IWatchPartyRoom> {
    const res = await watchPartyClient.post<ApiResponse<IWatchPartyRoom>>(
      `/watch-party/join/${inviteCode}`,
    );
    return res.data.data!;
  },

  async joinRoomById(roomId: string): Promise<IWatchPartyRoom> {
    const room = await watchPartyApi.getRoomById(roomId);
    return watchPartyApi.joinByInviteCode(room.inviteCode);
  },

  async leaveRoom(roomId: string): Promise<void> {
    await watchPartyClient.post(`/watch-party/rooms/${roomId}/leave`);
  },

  async closeRoom(roomId: string): Promise<void> {
    await watchPartyClient.delete(`/watch-party/rooms/${roomId}`);
  },

  async inviteFriend(roomId: string, friendId: string, inviterName?: string): Promise<void> {
    await watchPartyClient.post(`/watch-party/rooms/${roomId}/invite`, {
      friendId,
      inviterName,
    });
  },
};
