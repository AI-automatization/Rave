'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | undefined;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'https://watch-part-production.up.railway.app', {
      auth: { token },
      transports: ['polling'],
      autoConnect: false,
    });
    currentToken = token;
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket(token);
  // If token changed since last connect, reconnect with new auth
  if (currentToken !== token) {
    currentToken = token;
    s.auth = { token };
    if (s.connected) {
      s.disconnect();
      s.connect();
      return s;
    }
  }
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  currentToken = undefined;
}
