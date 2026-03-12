// CineSync Mobile — Watch Party Store (Zustand)
import { create } from 'zustand';
import { IWatchPartyRoom, SyncState } from '@app-types/index';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: number;
}

interface WatchPartyState {
  room: IWatchPartyRoom | null;
  syncState: SyncState | null;
  messages: ChatMessage[];
  activeMembers: string[];

  setRoom: (room: IWatchPartyRoom | null) => void;
  setSyncState: (state: SyncState) => void;
  addMessage: (message: ChatMessage) => void;
  setActiveMembers: (members: string[]) => void;
  addMember: (userId: string) => void;
  removeMember: (userId: string) => void;
  clearParty: () => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  room: null,
  syncState: null,
  messages: [],
  activeMembers: [],

  setRoom: (room) => set({ room }),
  setSyncState: (syncState) => set({ syncState }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    })),

  setActiveMembers: (members) => set({ activeMembers: members }),

  addMember: (userId) =>
    set((state) => ({
      activeMembers: state.activeMembers.includes(userId)
        ? state.activeMembers
        : [...state.activeMembers, userId],
    })),

  removeMember: (userId) =>
    set((state) => ({
      activeMembers: state.activeMembers.filter((id) => id !== userId),
    })),

  clearParty: () =>
    set({ room: null, syncState: null, messages: [], activeMembers: [] }),
}));
