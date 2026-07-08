// WeWatch Mobile — User API
import { userClient, adminClient } from './client';
import { ApiResponse, IUser, IUserPublic, IUserStats } from '@app-types/index';

export interface UserSettings {
  language: string;
  notifications: { push: boolean; email: boolean };
  privacy: { showActivity: boolean; allowForward?: boolean };
}

export const userApi = {
  async getMe(): Promise<IUser> {
    const res = await userClient.get<ApiResponse<IUser>>('/users/me');
    if (!res.data.data) throw new Error('getMe response is empty');
    return res.data.data;
  },

  async updateProfile(data: Partial<Pick<IUser, 'username' | 'bio' | 'avatar'>>): Promise<IUser> {
    const res = await userClient.put<ApiResponse<IUser>>('/users/me', data);
    if (!res.data.data) throw new Error('updateProfile response is empty');
    return res.data.data;
  },

  async updateFcmToken(fcmToken: string): Promise<void> {
    await userClient.post('/users/me/fcm-token', { fcmToken });
  },

  async getPublicProfile(userId: string): Promise<IUserPublic> {
    const res = await userClient.get<ApiResponse<IUserPublic>>(`/users/${userId}/public`);
    if (!res.data.data) throw new Error('getPublicProfile response is empty');
    return res.data.data;
  },

  async getStats(userId?: string): Promise<IUserStats> {
    const url = userId ? `/users/${userId}/stats` : '/users/me/stats';
    const res = await userClient.get<ApiResponse<IUserStats>>(url);
    if (!res.data.data) throw new Error('getStats response is empty');
    return res.data.data;
  },

  async searchUsers(query: string): Promise<IUserPublic[]> {
    const res = await userClient.get<ApiResponse<IUserPublic[]>>('/users/search', {
      params: { q: query },
    });
    return res.data.data ?? [];
  },

  async getFriends(): Promise<IUserPublic[]> {
    const res = await userClient.get<ApiResponse<IUserPublic[]>>('/users/me/friends');
    return res.data.data ?? [];
  },

  async sendFriendRequest(userId: string): Promise<void> {
    await userClient.post(`/users/${userId}/friend-request`);
  },

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await userClient.put(`/users/friend-requests/${friendshipId}/accept`);
  },

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    await userClient.put(`/users/friend-requests/${friendshipId}/reject`);
  },

  async removeFriend(userId: string): Promise<void> {
    await userClient.delete(`/users/me/friends/${userId}`);
  },

  async getPendingRequests(): Promise<Array<{ _id: string; requester: IUserPublic; createdAt: Date }>> {
    const res = await userClient.get<ApiResponse<Array<{ _id: string; requester: IUserPublic; createdAt: Date }>>>(
      '/users/me/friend-requests',
    );
    return res.data.data ?? [];
  },

  async heartbeat(): Promise<void> {
    await userClient.post('/users/heartbeat');
  },

  async deleteAccount(): Promise<void> {
    await userClient.delete('/users/me');
  },

  async getSettings(): Promise<UserSettings> {
    const res = await userClient.get<ApiResponse<UserSettings>>('/users/me/settings');
    if (!res.data.data) throw new Error('getSettings response is empty');
    return res.data.data;
  },

  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const res = await userClient.patch<ApiResponse<UserSettings>>('/users/me/settings', data);
    if (!res.data.data) throw new Error('updateSettings response is empty');
    return res.data.data;
  },

  async removeFcmToken(): Promise<void> {
    await userClient.delete('/users/me/fcm-token');
  },

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const res = await userClient.patch<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.data.data) throw new Error('uploadAvatar response is empty');
    return res.data.data;
  },

  // Block user: remove friendship (if any) + file a harassment report.
  // The local blocked list is stored separately in blockedUsersStorage.
  async blockUser(userId: string): Promise<void> {
    await Promise.allSettled([
      userClient.delete(`/users/me/friends/${userId}`),
      adminClient.post(`/internal/moderation/users/${userId}/report`, { reason: 'harassment', comment: 'User blocked by reporter' }),
    ]);
  },
};

import { IDMMessage, IDMConversation } from '@app-types/index';

export const dmApi = {
  async getConversations(): Promise<IDMConversation[]> {
    const res = await userClient.get<ApiResponse<IDMConversation[]>>('/users/dm/conversations');
    return res.data.data ?? [];
  },

  async getHistory(peerId: string, before?: string): Promise<IDMMessage[]> {
    const res = await userClient.get<ApiResponse<IDMMessage[]>>(`/users/dm/${peerId}`, {
      params: before ? { before } : undefined,
    });
    return res.data.data ?? [];
  },

  async sendMessage(peerId: string, text: string, replyToId?: string): Promise<IDMMessage> {
    const res = await userClient.post<ApiResponse<IDMMessage>>(`/users/dm/${peerId}`, {
      text,
      ...(replyToId ? { replyToId } : {}),
    });
    if (!res.data.data) throw new Error('sendMessage response is empty');
    return res.data.data;
  },

  // Xabarni boshqa suhbatga forward qilish
  async forwardMessage(peerId: string, messageId: string): Promise<IDMMessage> {
    const res = await userClient.post<ApiResponse<IDMMessage>>(`/users/dm/${peerId}/forward`, { messageId });
    if (!res.data.data) throw new Error('forwardMessage response is empty');
    return res.data.data;
  },

  async markRead(peerId: string): Promise<void> {
    await userClient.patch(`/users/dm/${peerId}/read`);
  },
};
