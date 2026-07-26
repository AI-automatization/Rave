// WeWatch Mobile — Watch Party API
import axios from 'axios';
import { watchPartyClient } from './client';
import { ApiResponse, IWatchPartyRoom, VideoItem } from '@app-types/index';

/**
 * Thrown when the backend refuses a second room for the same owner (T-S108). Carries the room the
 * user already has open so the caller can send them there instead of showing a dead end.
 *
 * Resolved once here rather than in each of the four createRoom call sites (useCreateWatchParty,
 * useSourcePicker, useMediaDetection, useWatchPartyCreate) — they would otherwise each need the
 * same 409 branch.
 */
export class RoomAlreadyExistsError extends Error {
  constructor(public readonly existingRoom: IWatchPartyRoom) {
    super('ROOM_ALREADY_EXISTS');
    this.name = 'RoomAlreadyExistsError';
  }
}

export const watchPartyApi = {
  async createRoom(data: {
    videoUrl?: string;
    videoTitle?: string;
    videoThumbnail?: string;
    videoPlatform?: string;
    name?: string;
    isPrivate?: boolean;
    maxMembers?: number;
    /** Resume from this position in seconds */
    startTime?: number;
    /** Page URL used as Referer header for CDN hotlink protection */
    videoReferer?: string;
    /** E67-3: WebView session cookies — faqat webview-session rejimida */
    cookies?: string;
  }): Promise<IWatchPartyRoom> {
    try {
      const res = await watchPartyClient.post<ApiResponse<IWatchPartyRoom>>('/watch-party/rooms', data);
      return res.data.data!;
    } catch (err) {
      const body = axios.isAxiosError(err) ? (err.response?.data as { code?: string; roomId?: string } | undefined) : undefined;
      if (err && axios.isAxiosError(err) && err.response?.status === 409 && body?.code === 'ROOM_ALREADY_EXISTS' && body.roomId) {
        // Fetch the room so callers get the same shape they would from a successful create and
        // can navigate immediately. If THAT fails, fall through to the original error rather than
        // inventing a room object.
        const existing = await this.getRoomById(body.roomId).catch(() => null);
        if (existing) throw new RoomAlreadyExistsError(existing);
      }
      throw err;
    }
  },

  async getRooms(): Promise<IWatchPartyRoom[]> {
    const res = await watchPartyClient.get<ApiResponse<IWatchPartyRoom[]>>('/watch-party/rooms');
    return res.data.data ?? [];
  },

  // ICE servers for WebRTC (mesh sync + voice). Backend proxies Metered TURN —
  // returns { iceServers } directly (not ApiResponse-wrapped). STUN-only if TURN unset.
  async getTurnCredentials(): Promise<RTCIceServer[]> {
    const res = await watchPartyClient.get<{ iceServers: RTCIceServer[] }>(
      '/watch-party/turn/credentials',
    );
    return res.data.iceServers ?? [];
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
