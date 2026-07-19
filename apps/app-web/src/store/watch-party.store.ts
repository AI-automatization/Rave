'use client';

import { create } from 'zustand';
import type { IWatchPartyRoom, IChatMessage, IUser } from '@/types';

export interface WatchPartyMember {
  _id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

interface SyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  // Owner/server wall-clock (ms) at which currentTime was captured, already normalised to THIS
  // client's local clock (see use-watch-party clock-offset sync). Lets the player compensate for
  // network latency: elapsed = (Date.now() - serverTimestamp)/1000 is added on resume so a PLAY
  // that took 200ms to arrive lands at the real owner position, not a stale snapshot.
  serverTimestamp?: number;
}

interface Heartbeat {
  currentTime: number;
  timestamp: number;
  updatedBy: string;
}

interface WatchPartyState {
  room: IWatchPartyRoom | null;
  members: WatchPartyMember[];
  messages: IChatMessage[];
  syncState: SyncState;
  heartbeat: Heartbeat | null;
  isConnected: boolean;

  setRoom: (room: IWatchPartyRoom | null) => void;
  setMembers: (members: WatchPartyMember[]) => void;
  addMember: (member: WatchPartyMember) => void;
  updateMember: (userId: string, patch: Partial<Omit<WatchPartyMember, '_id'>>) => void;
  removeMember: (userId: string) => void;
  addMessage: (message: IChatMessage) => void;
  setSyncState: (state: Partial<SyncState>) => void;
  setHeartbeat: (hb: Heartbeat) => void;
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
  heartbeat: null,
  isConnected: false,

  setRoom: (room) => set({ room }),
  setMembers: (members) => set({ members: members ?? [] }),
  addMember: (member) =>
    set((s) => ({
      members: s.members.some((m) => m._id === member._id)
        ? s.members
        : [...s.members, member],
    })),
  updateMember: (userId, patch) =>
    set((s) => ({
      members: s.members.map((m) => (m._id === userId ? { ...m, ...patch } : m)),
    })),
  removeMember: (userId) =>
    set((s) => ({ members: s.members.filter((m) => m._id !== userId) })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setSyncState: (state) =>
    set((s) => ({ syncState: { ...s.syncState, ...state } })),
  setHeartbeat: (hb) => set({ heartbeat: hb }),
  setConnected: (connected) => set({ isConnected: connected }),
  reset: () =>
    set({
      room: null,
      members: [],
      messages: [],
      syncState: initialSyncState,
      heartbeat: null,
      isConnected: false,
    }),
}));
