// CineSync Mobile — Friends Store (Zustand)
import { create } from 'zustand';
import { IUserPublic } from '@app-types/index';

interface FriendRequest {
  _id: string;
  requester: IUserPublic;
  createdAt: Date;
}

interface FriendsState {
  friends: IUserPublic[];
  pendingRequests: FriendRequest[];
  onlineStatus: Record<string, boolean>;
  sentRequestIds: Set<string>;

  setFriends: (friends: IUserPublic[]) => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  setBulkOnlineStatus: (statuses: Record<string, boolean>) => void;
  addSentRequest: (userId: string) => void;
  removeFriend: (userId: string) => void;
  addFriend: (friend: IUserPublic) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  pendingRequests: [],
  onlineStatus: {},
  sentRequestIds: new Set<string>(),

  setFriends: (friends) => set({ friends }),
  setPendingRequests: (requests) => set({ pendingRequests: requests }),

  setOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      onlineStatus: { ...state.onlineStatus, [userId]: isOnline },
    })),

  setBulkOnlineStatus: (statuses) =>
    set((state) => ({
      onlineStatus: { ...state.onlineStatus, ...statuses },
    })),

  addSentRequest: (userId) =>
    set((state) => ({
      sentRequestIds: new Set(state.sentRequestIds).add(userId),
    })),

  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== userId),
    })),

  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),
}));
