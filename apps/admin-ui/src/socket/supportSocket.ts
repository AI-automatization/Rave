import { io, Socket } from 'socket.io-client';
import type { SupportMessage } from '../api/support.api';

const BASE_URL = (import.meta.env.VITE_ADMIN_API_URL as string ?? '').replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

export const supportSocket = {
  connect(token: string): void {
    if (socket?.connected) return;
    socket = io(`${BASE_URL}/support`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
  },

  joinConv(convId: string): void {
    socket?.emit('support:join', convId);
  },

  leaveConv(convId: string): void {
    socket?.emit('support:leave', convId);
  },

  onMessage(handler: (msg: SupportMessage) => void): void {
    socket?.on('support:message', handler);
  },

  offMessage(handler: (msg: SupportMessage) => void): void {
    socket?.off('support:message', handler);
  },

  disconnect(): void {
    socket?.disconnect();
    socket = null;
  },
};
