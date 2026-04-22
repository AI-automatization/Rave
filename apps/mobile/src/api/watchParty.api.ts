// CineSync Mobile — Watch Party API
import { watchPartyClient } from './client';
import { ApiResponse, IWatchPartyRoom, VideoItem } from '@app-types/index';

export const watchPartyApi = {
  async createRoom(data: {
    movieId?: string;
    videoUrl?: string;
    videoTitle?: string;
    videoPlatform?: string;
    name?: string;
    isPrivate?: boolean;
    maxMembers?: number;
    /** E67-3: WebView session cookies — faqat webview-session rejimida */
    cookies?: string;
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

  // T-E107: Playlist CRUD
  async addToPlaylist(roomId: string, data: { videoUrl: string; videoTitle: string; videoPlatform: string }): Promise<VideoItem[]> {
    const res = await watchPartyClient.post<ApiResponse<{ playlist: VideoItem[] }>>(`/watch-party/rooms/${roomId}/playlist`, data);
    return res.data.data?.playlist ?? [];
  },

  async removeFromPlaylist(roomId: string, index: number): Promise<VideoItem[]> {
    const res = await watchPartyClient.delete<ApiResponse<{ playlist: VideoItem[] }>>(`/watch-party/rooms/${roomId}/playlist/${index}`);
    return res.data.data?.playlist ?? [];
  },

  async playNext(roomId: string): Promise<void> {
    await watchPartyClient.post(`/watch-party/rooms/${roomId}/playlist/next`);
  },

  async getRecentRooms(): Promise<IWatchPartyRoom[]> {
    const res = await watchPartyClient.get<ApiResponse<IWatchPartyRoom[]>>('/watch-party/rooms/my/recent');
    return res.data.data ?? [];
  },

  async getPublicRooms(): Promise<IWatchPartyRoom[]> {
    const res = await watchPartyClient.get<ApiResponse<IWatchPartyRoom[]>>('/watch-party/rooms/public/active');
    return res.data.data ?? [];
  },
};
