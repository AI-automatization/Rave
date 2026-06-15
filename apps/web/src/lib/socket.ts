import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  // Fetch token and runtime config in parallel
  const [tokenRes, configRes] = await Promise.all([
    fetch('/api/auth/token', { credentials: 'include' }),
    fetch('/api/config'),
  ]);

  const tokenData = await tokenRes.json() as { data?: { token?: string } };
  const configData = await configRes.json() as { data?: { socketUrl?: string } };

  const token = tokenData.data?.token;
  if (!token) throw new Error('Not authenticated');

  const socketUrl = configData.data?.socketUrl ?? 'http://localhost:3004';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function getExistingSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
