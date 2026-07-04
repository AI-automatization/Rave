import { apiClient } from '@/lib/api-client';
import type { IUser, IFriendship } from '@/types';

interface UpdateProfilePayload {
  username?: string;
  bio?: string;
}

export interface DmMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Conversation {
  peerId: string;
  peer: Pick<IUser, '_id' | 'username' | 'avatar' | 'isOnline'>;
  lastMessage: DmMessage;
  unreadCount: number;
}

// All backend responses return data directly (not wrapped in { user: }, { friends: }, etc.)
export const userApi = {
  getProfile: () =>
    apiClient<IUser>('/api/user/me'),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient<IUser>('/api/user/me', { method: 'PUT', body: data }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient<{ avatarUrl: string }>('/api/user/me/avatar', {
      method: 'PATCH',
      body: formData,
    });
  },

  getFriends: () =>
    apiClient<IUser[]>('/api/user/me/friends'),

  getFriendRequests: () =>
    apiClient<IFriendship[]>('/api/user/me/friend-requests'),

  sendFriendRequest: (userId: string) =>
    apiClient(`/api/user/${userId}/friend-request`, { method: 'POST' }),

  acceptFriendRequest: (requestId: string) =>
    apiClient(`/api/user/friend-requests/${requestId}/accept`, { method: 'PUT' }),

  rejectFriendRequest: (requestId: string) =>
    apiClient(`/api/user/friend-requests/${requestId}/reject`, { method: 'PUT' }),

  searchUsers: (query: string) =>
    apiClient<IUser[]>(`/api/user/search?q=${encodeURIComponent(query)}`),

  getConversations: () =>
    apiClient<Conversation[]>('/api/user/dm/conversations'),

  getMessages: (peerId: string) =>
    apiClient<DmMessage[]>(`/api/user/dm/${peerId}`),

  sendDm: (peerId: string, text: string) =>
    apiClient<DmMessage>(`/api/user/dm/${peerId}`, { method: 'POST', body: { text } }),
};
