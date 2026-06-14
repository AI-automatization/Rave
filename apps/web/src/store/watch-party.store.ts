'use client';

import { create } from 'zustand';
import type { IWatchPartyRoom, IChatMessage, IUser } from '@/types';

interface WatchPartyMember {
  _id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

interface SyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface WatchPartyState {
  room: IWatchPartyRoom | null;
  members: WatchPartyMember[];
  messages: IChatMessage[];
  syncState: SyncState;
  isConnected: boolean;

  setRoom: (room: IWatchPartyRoom | null) => void;
  setMembers: (members: WatchPartyMember[]) => void;
  addMember: (member: WatchPartyMember) => void;
  removeMember: (userId: string) => void;
  addMessage: (message: IChatMessage) => void;
  setSyncState: (state: Partial<SyncState>) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialSyncState: SyncState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  room: null,
  members: [],
  messages: [],
  syncState: initialSyncState,
  isConnected: false,

  setRoom: (room) => set({ room }),
  setMembers: (members) => set({ members: members ?? [] }),
  addMember: (member) =>
    set((s) => ({
      members: s.members.some((m) => m._id === member._id)
        ? s.members
        : [...s.members, member],
    })),
  removeMember: (userId) =>
    set((s) => ({ members: s.members.filter((m) => m._id !== userId) })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setSyncState: (state) =>
    set((s) => ({ syncState: { ...s.syncState, ...state } })),
  setConnected: (connected) => set({ isConnected: connected }),
  reset: () =>
    set({
      room: null,
      members: [],
      messages: [],
      syncState: initialSyncState,
      isConnected: false,
    }),
}));
