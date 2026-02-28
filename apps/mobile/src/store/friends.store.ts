import { create } from 'zustand';
import type { IFriend } from '@types/index';

interface FriendsState {
  friends: IFriend[];
  onlineIds: Set<string>;
  pendingRequests: IFriend[];

  setFriends: (friends: IFriend[]) => void;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  addPendingRequest: (friend: IFriend) => void;
  removePendingRequest: (userId: string) => void;
  acceptRequest: (userId: string) => void;
}

export const useFriendsStore = create<FriendsState>()((set) => ({
  friends: [],
  onlineIds: new Set(),
  pendingRequests: [],

  setFriends: (friends) => set({ friends }),

  setOnline: (userId) =>
    set((state) => ({ onlineIds: new Set([...state.onlineIds, userId]) })),

  setOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineIds);
      next.delete(userId);
      return { onlineIds: next };
    }),

  addPendingRequest: (friend) =>
    set((state) => ({ pendingRequests: [...state.pendingRequests, friend] })),

  removePendingRequest: (userId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((f) => f._id !== userId),
    })),

  acceptRequest: (userId) =>
    set((state) => {
      const request = state.pendingRequests.find((f) => f._id === userId);
      const pending = state.pendingRequests.filter((f) => f._id !== userId);
      if (!request) return { pendingRequests: pending };
      return {
        pendingRequests: pending,
        friends: [...state.friends, { ...request, friendshipStatus: 'accepted' as const }],
      };
    }),
}));
