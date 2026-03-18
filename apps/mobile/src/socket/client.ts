// CineSync Mobile — Socket.io Client
import { io, Socket } from 'socket.io-client';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';

export { SERVER_EVENTS, CLIENT_EVENTS };

let socket: Socket | null = null;

const WATCH_PARTY_URL = process.env.EXPO_PUBLIC_WATCH_PARTY_URL!;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WATCH_PARTY_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 20000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
