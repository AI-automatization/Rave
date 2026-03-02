import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@api/client';
import { tokenStorage } from '@utils/storage';
import { useWatchPartyStore } from '@store/watchParty.store';
import type { IWatchPartyRoom, SyncState, ChatMessage, EmojiEvent } from '@app-types/index';
// shared/ dan import — 3 platforma uchun yagona manba
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';

export { SERVER_EVENTS, CLIENT_EVENTS };

// ─── Socket singleton ─────────────────────────────────────────────────────────

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = tokenStorage.getAccessToken();
  // BUG-M002: token null bo'lsa server "Bearer null" ko'radi — to'xtatamiz
  if (!token) throw new Error('No access token — cannot connect socket');

  // BUG-M001: eski socket bo'lsa handlerlarni tozalab qayta ulaymiz
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    if (__DEV__) console.log('[Socket] Connected:', socket?.id);
    useWatchPartyStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    if (__DEV__) console.log('[Socket] Disconnected');
    useWatchPartyStore.getState().setConnected(false);
  });

  // ─── Watch Party event handlers ───────────────────────────────────────────

  const store = useWatchPartyStore.getState;

  socket.on(SERVER_EVENTS.ROOM_JOINED, ({ room, syncState }: { room: IWatchPartyRoom; syncState: SyncState }) => {
    store().setRoom(room);
    store().setSyncState(syncState);
  });

  socket.on(SERVER_EVENTS.ROOM_CLOSED, () => {
    store().reset();
  });

  socket.on(
    SERVER_EVENTS.VIDEO_PLAY,
    (syncState: SyncState) => store().setSyncState(syncState),
  );
  socket.on(
    SERVER_EVENTS.VIDEO_PAUSE,
    (syncState: SyncState) => store().setSyncState(syncState),
  );
  socket.on(
    SERVER_EVENTS.VIDEO_SEEK,
    (syncState: SyncState) => store().setSyncState(syncState),
  );
  socket.on(
    SERVER_EVENTS.VIDEO_SYNC,
    (syncState: SyncState) => store().setSyncState(syncState),
  );

  socket.on(
    SERVER_EVENTS.VIDEO_BUFFER,
    ({ userId, buffering }: { userId: string; buffering: boolean }) =>
      store().setBuffering(userId, buffering),
  );

  socket.on(SERVER_EVENTS.ROOM_MESSAGE, (msg: ChatMessage) => store().addMessage(msg));
  socket.on(SERVER_EVENTS.ROOM_EMOJI, (emoji: EmojiEvent) => store().addEmoji(emoji));

  socket.on(
    SERVER_EVENTS.ROOM_UPDATED,
    ({ room }: { room: IWatchPartyRoom }) => store().setRoom(room),
  );

  socket.on(
    SERVER_EVENTS.MEMBER_JOINED,
    ({ members }: { userId: string; members: string[] }) => store().updateMembers(members),
  );

  socket.on(
    SERVER_EVENTS.MEMBER_LEFT,
    ({ members }: { userId: string; members: string[] }) => store().updateMembers(members),
  );

  socket.on(
    SERVER_EVENTS.MEMBER_KICKED,
    ({ members }: { userId: string; members: string[] }) => store().updateMembers(members),
  );

  socket.on(
    SERVER_EVENTS.MEMBER_MUTED,
    ({ userId, mutedBy }: { userId: string; mutedBy: string; reason?: string }) => {
      if (__DEV__) console.log('[Socket] Member muted:', userId, 'by', mutedBy);
    },
  );

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// ─── Watch Party actions ──────────────────────────────────────────────────────

export const watchPartySocket = {
  joinRoom: (roomId: string) => socket?.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }),
  leaveRoom: () => socket?.emit(CLIENT_EVENTS.LEAVE_ROOM),
  play: (currentTime: number) => socket?.emit(CLIENT_EVENTS.PLAY, { currentTime }),
  pause: (currentTime: number) => socket?.emit(CLIENT_EVENTS.PAUSE, { currentTime }),
  seek: (currentTime: number) => socket?.emit(CLIENT_EVENTS.SEEK, { currentTime }),
  bufferStart: () => socket?.emit(CLIENT_EVENTS.BUFFER_START),
  bufferEnd: () => socket?.emit(CLIENT_EVENTS.BUFFER_END),
  sendMessage: (message: string) => socket?.emit(CLIENT_EVENTS.SEND_MESSAGE, { message }),
  sendEmoji: (emoji: string) => socket?.emit(CLIENT_EVENTS.SEND_EMOJI, { emoji }),
  kickMember: (targetUserId: string) =>
    socket?.emit(CLIENT_EVENTS.KICK_MEMBER, { targetUserId }),
  muteMember: (targetUserId: string, reason?: string) =>
    socket?.emit(CLIENT_EVENTS.MUTE_MEMBER, { targetUserId, reason }),
};
