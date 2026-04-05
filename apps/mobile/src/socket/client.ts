// CineSync Mobile — Socket.io Client
import { io, Socket } from 'socket.io-client';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { tokenStorage } from '@utils/storage';
import axios from 'axios';

export { SERVER_EVENTS, CLIENT_EVENTS };

let socket: Socket | null = null;

const WATCH_PARTY_URL = process.env.EXPO_PUBLIC_WATCH_PARTY_URL!;
const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL!;

/** Token yangilash — expired access token bo'lsa refresh qilish */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    const { data } = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = data.data;
    const userId = await tokenStorage.getUserId();

    await tokenStorage.saveTokens(accessToken, newRefreshToken, userId ?? '');

    // Auth store ni ham yangilash
    const { useAuthStore } = await import('@store/auth.store');
    useAuthStore.setState({ accessToken });

    return accessToken;
  } catch {
    return null;
  }
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  // Eski disconnected socket ni tozalash
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(WATCH_PARTY_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 20000,
  });

  // Invalid token → refresh va reconnect
  socket.on('connect_error', async (err: Error) => {
    if (err.message === 'Invalid token' || err.message === 'Authentication required') {
      if (__DEV__) console.log('[socket] Invalid token — refreshing...');

      const newToken = await refreshAccessToken();
      if (newToken && socket) {
        // Yangi token bilan qayta ulanish
        socket.auth = { token: newToken };
        socket.connect();
      } else {
        if (__DEV__) console.log('[socket] Token refresh failed — logout');
        const { useAuthStore } = await import('@store/auth.store');
        await useAuthStore.getState().logout();
      }
    }
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
