import { io, Socket } from 'socket.io-client';

// Direct URL to watch-party socket server.
// In production set VITE_WATCH_PARTY_URL; in dev falls back to localhost:3004.
const BASE_URL: string =
  (import.meta.env.VITE_WATCH_PARTY_URL as string | undefined) ?? 'http://localhost:3004';

export interface RoomMessage {
  userId: string;
  username?: string;
  message: string;
  timestamp: number;
  isAdmin?: boolean;
}

export interface VideoSyncState {
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
}

type MessageHandler  = (msg: RoomMessage) => void;
type SyncHandler     = (state: VideoSyncState) => void;
type MemberHandler   = (data: { userId: string }) => void;
type GenericHandler  = (data: Record<string, unknown>) => void;

let socket: Socket | null = null;
let pendingRoomId: string | null = null;

export const watchPartySocket = {
  connect(token: string): void {
    // Disconnect stale socket with a different token so auth is always fresh
    if (socket && !socket.connected) {
      socket.disconnect();
      socket = null;
    }
    if (socket?.connected) return;

    socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      path: '/socket.io',
    });

    socket.on('connect', () => {
      // Re-join pending room if reconnected mid-session
      if (pendingRoomId) {
        socket?.emit('admin:join', { roomId: pendingRoomId });
      }
    });
    socket.on('disconnect', (reason) => console.debug('[WP socket] disconnected', reason));
    socket.on('connect_error', (err) => console.debug('[WP socket] error', err.message));
  },

  joinRoom(roomId: string): void {
    pendingRoomId = roomId;
    if (socket?.connected) {
      socket.emit('admin:join', { roomId });
    }
    // If not yet connected the 'connect' handler above will emit once ready
  },

  leaveRoom(): void {
    pendingRoomId = null;
    socket?.emit('admin:leave');
  },

  sendMessage(message: string): void {
    socket?.emit('room:message', { message });
  },

  onJoined(handler: GenericHandler): void {
    socket?.on('room:joined', handler as (...args: unknown[]) => void);
  },

  onMessage(handler: MessageHandler): void {
    socket?.on('room:message', handler as (...args: unknown[]) => void);
  },

  onVideoPlay(handler: SyncHandler): void {
    socket?.on('video:play', handler as (...args: unknown[]) => void);
  },

  onVideoPause(handler: SyncHandler): void {
    socket?.on('video:pause', handler as (...args: unknown[]) => void);
  },

  onVideoSeek(handler: SyncHandler): void {
    socket?.on('video:seek', handler as (...args: unknown[]) => void);
  },

  onVideoSync(handler: SyncHandler): void {
    socket?.on('video:sync', handler as (...args: unknown[]) => void);
  },

  onMemberJoined(handler: MemberHandler): void {
    socket?.on('member:joined', handler as (...args: unknown[]) => void);
  },

  onMemberLeft(handler: MemberHandler): void {
    socket?.on('member:left', handler as (...args: unknown[]) => void);
  },

  onRoomClosed(handler: GenericHandler): void {
    socket?.on('room:closed', handler as (...args: unknown[]) => void);
  },

  /** Listen for room:updated broadcast (owner changes media, etc.) */
  onRoomUpdated(handler: GenericHandler): void {
    socket?.on('room:updated', handler as (...args: unknown[]) => void);
  },

  offAll(): void {
    socket?.removeAllListeners('room:joined');
    socket?.removeAllListeners('room:message');
    socket?.removeAllListeners('video:play');
    socket?.removeAllListeners('video:pause');
    socket?.removeAllListeners('video:seek');
    socket?.removeAllListeners('video:sync');
    socket?.removeAllListeners('member:joined');
    socket?.removeAllListeners('member:left');
    socket?.removeAllListeners('room:closed');
    socket?.removeAllListeners('room:updated');
  },

  /** Remove global list-level listeners (not room-scoped) */
  offGlobal(): void {
    socket?.removeAllListeners('room:closed');
    socket?.removeAllListeners('room:updated');
  },

  disconnect(): void {
    pendingRoomId = null;
    socket?.disconnect();
    socket = null;
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },
};
