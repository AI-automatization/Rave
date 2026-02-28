import { userClient } from './client';
import type {
  ApiResponse,
  IUser,
  IUserPublic,
  IUserSettings,
  IFriend,
  IUserStats,
  IAchievement,
} from '@types/index';

export const userApi = {
  getMe: async () => {
    const { data } = await userClient.get<ApiResponse<IUser>>('/user/me');
    return data;
  },

  updateProfile: async (payload: Partial<Pick<IUser, 'username' | 'bio'>>) => {
    const { data } = await userClient.patch<ApiResponse<IUser>>('/user/me', payload);
    return data;
  },

  uploadAvatar: async (formData: FormData) => {
    const { data } = await userClient.patch<ApiResponse<IUser>>('/user/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getProfile: async (userId: string) => {
    const { data } = await userClient.get<ApiResponse<IUserPublic>>(`/user/${userId}`);
    return data;
  },

  getSettings: async () => {
    const { data } = await userClient.get<ApiResponse<IUserSettings>>('/user/me/settings');
    return data;
  },

  updateSettings: async (payload: Partial<IUserSettings>) => {
    const { data } = await userClient.patch<ApiResponse<IUserSettings>>(
      '/user/me/settings',
      payload,
    );
    return data;
  },

  addFcmToken: async (token: string) => {
    await userClient.post('/user/me/fcm-token', { token });
  },

  removeFcmToken: async (token: string) => {
    await userClient.delete('/user/me/fcm-token', { data: { token } });
  },

  heartbeat: async () => {
    await userClient.post('/user/heartbeat');
  },

  getFriends: async () => {
    const { data } = await userClient.get<ApiResponse<IFriend[]>>('/user/me/friends');
    return data;
  },

  sendFriendRequest: async (receiverId: string) => {
    const { data } = await userClient.post<ApiResponse<null>>(`/user/friends/${receiverId}`);
    return data;
  },

  acceptFriendRequest: async (requesterId: string) => {
    const { data } = await userClient.patch<ApiResponse<null>>(
      `/user/friends/${requesterId}/accept`,
    );
    return data;
  },

  removeFriend: async (friendId: string) => {
    await userClient.delete(`/user/friends/${friendId}`);
  },

  getMyAchievements: async () => {
    const { data } = await userClient.get<ApiResponse<IAchievement[]>>('/achievements/me');
    return data;
  },

  getMyStats: async () => {
    const { data } = await userClient.get<ApiResponse<IUserStats>>('/achievements/me/stats');
    return data;
  },
};
