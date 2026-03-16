// CineSync Mobile — User API
import { userClient } from './client';
import { ApiResponse, IUser, IUserPublic, IUserStats } from '@app-types/index';

export const userApi = {
  async getMe(): Promise<IUser> {
    const res = await userClient.get<ApiResponse<IUser>>('/users/me');
    if (!res.data.data) throw new Error('getMe response is empty');
    return res.data.data;
  },

  async updateProfile(data: Partial<Pick<IUser, 'username' | 'bio' | 'avatar' | 'favoriteGenres'>>): Promise<IUser> {
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

  async getMyAchievements(): Promise<Array<{ achievement: import('@app-types/index').IAchievement; unlockedAt: Date }>> {
    const res = await userClient.get<import('@app-types/index').ApiResponse<Array<{ achievement: import('@app-types/index').IAchievement; unlockedAt: Date }>>>('/users/me/achievements');
    return res.data.data ?? [];
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
};
