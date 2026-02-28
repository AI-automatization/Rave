import { create } from 'zustand';
import type { IWatchPartyRoom, SyncState, ChatMessage, EmojiEvent } from '@types/index';

interface WatchPartyState {
  room: IWatchPartyRoom | null;
  syncState: SyncState | null;
  messages: ChatMessage[];
  emojis: EmojiEvent[];
  bufferingUserIds: Set<string>;
  isConnected: boolean;

  setRoom: (room: IWatchPartyRoom | null) => void;
  setSyncState: (sync: SyncState) => void;
  addMessage: (msg: ChatMessage) => void;
  addEmoji: (emoji: EmojiEvent) => void;
  setBuffering: (userId: string, buffering: boolean) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  room: null,
  syncState: null,
  messages: [],
  emojis: [],
  bufferingUserIds: new Set<string>(),
  isConnected: false,
};

export const useWatchPartyStore = create<WatchPartyState>()((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),

  setSyncState: (syncState) => set({ syncState }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-200), msg], // keep last 200
    })),

  addEmoji: (emoji) =>
    set((state) => ({
      emojis: [...state.emojis.slice(-50), emoji], // keep last 50
    })),

  setBuffering: (userId, buffering) =>
    set((state) => {
      const next = new Set(state.bufferingUserIds);
      buffering ? next.add(userId) : next.delete(userId);
      return { bufferingUserIds: next };
    }),

  setConnected: (isConnected) => set({ isConnected }),

  reset: () => set({ ...initialState, bufferingUserIds: new Set() }),
}));
