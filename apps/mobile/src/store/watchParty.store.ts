// WeWatch Mobile — Watch Party Store (Zustand)
import { create } from 'zustand';
import { IWatchPartyRoom, SyncState, VideoItem } from '@app-types/index';

/** Snapshot of the quoted message. Room chat isn't persisted, so this travels with the reply. */
export interface ReplyTo {
  messageId: string;
  senderName: string;
  text: string;
}

// Single definition for both the store and ChatPanel — the two used to be declared separately and
// had already drifted (the panel knew about `replyTo`, the store didn't, so replies never survived
// the round trip). ChatPanel re-exports these so its existing importers keep working.
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: number;
  replyTo?: ReplyTo;
}

interface WatchPartyState {
  room: IWatchPartyRoom | null;
  syncState: SyncState | null;
  messages: ChatMessage[];
  activeMembers: string[];
  playlist: VideoItem[];
  /** WatchParty ekrani ochiq — OfflineBanner yashiriladi */
  isWatchPartyOpen: boolean;

  setRoom: (room: IWatchPartyRoom | null) => void;
  setSyncState: (state: SyncState) => void;
  addMessage: (message: ChatMessage) => void;
  setActiveMembers: (members: string[]) => void;
  addMember: (userId: string) => void;
  removeMember: (userId: string) => void;
  setPlaylist: (items: VideoItem[]) => void;
  clearParty: () => void;
  setWatchPartyOpen: (open: boolean) => void;
  /** Optimistic update xona mediasini almashtirish uchun */
  updateRoomMedia: (media: Partial<Pick<IWatchPartyRoom, 'videoUrl' | 'videoTitle' | 'videoPlatform'>>) => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  room: null,
  syncState: null,
  messages: [],
  activeMembers: [],
  playlist: [],
  isWatchPartyOpen: false,

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

  setPlaylist: (items) => set({ playlist: items }),

  clearParty: () =>
    set({ room: null, syncState: null, messages: [], activeMembers: [], playlist: [] }),

  setWatchPartyOpen: (open) => set({ isWatchPartyOpen: open }),

  updateRoomMedia: (media) =>
    set((state) => ({
      room: state.room ? { ...state.room, ...media } : null,
    })),
}));

// Selector shorthand
export const selectIsWatchPartyOpen = (s: WatchPartyState) => s.isWatchPartyOpen;
