import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// NEXT_PUBLIC_* vars are inlined at Next.js build time — no runtime fetch needed.
// Railway must have NEXT_PUBLIC_SOCKET_URL set BEFORE the Docker build runs.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3004';

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  // Get JWT from our proxy route (cookie → body)
  const res = await fetch('/api/auth/token', { credentials: 'include' });
  const data = await res.json() as { data?: { token?: string } };
  const token = data.data?.token;

  if (!token) throw new Error('Not authenticated');

  socket = io(SOCKET_URL, {
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
