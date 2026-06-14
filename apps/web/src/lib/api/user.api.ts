import { apiClient } from '@/lib/api-client';
import type { IUser, IFriendship } from '@/types';

interface UpdateProfilePayload {
  username?: string;
  bio?: string;
}

interface DmMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
}

interface Conversation {
  peerId: string;
  peer: Pick<IUser, '_id' | 'username' | 'avatar' | 'isOnline'>;
  lastMessage: DmMessage;
  unreadCount: number;
}

export const userApi = {
  getProfile: () =>
    apiClient<{ user: IUser }>('/api/user/me'),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient<{ user: IUser }>('/api/user/me', { method: 'PUT', body: data }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient<{ user: IUser }>('/api/user/me/avatar', {
      method: 'PATCH',
      body: formData,
    });
  },

  getFriends: () =>
    apiClient<{ friends: IFriendship[] }>('/api/user/me/friends'),

  getFriendRequests: () =>
    apiClient<{ requests: IFriendship[] }>('/api/user/me/friend-requests'),

  sendFriendRequest: (userId: string) =>
    apiClient(`/api/user/${userId}/friend-request`, { method: 'POST' }),

  acceptFriendRequest: (requestId: string) =>
    apiClient(`/api/user/friend-requests/${requestId}/accept`, { method: 'PUT' }),

  rejectFriendRequest: (requestId: string) =>
    apiClient(`/api/user/friend-requests/${requestId}/reject`, { method: 'PUT' }),

  searchUsers: (query: string) =>
    apiClient<{ users: IUser[] }>(`/api/user/search?q=${encodeURIComponent(query)}`),

  getConversations: () =>
    apiClient<{ conversations: Conversation[] }>('/api/user/dm/conversations'),

  getMessages: (peerId: string) =>
    apiClient<{ messages: DmMessage[] }>(`/api/user/dm/${peerId}`),

  sendDm: (peerId: string, text: string) =>
    apiClient<{ message: DmMessage }>(`/api/user/dm/${peerId}`, { method: 'POST', body: { text } }),
};
