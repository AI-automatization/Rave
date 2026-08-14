import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Dedupe concurrent getSocket() callers (e.g. useDmRealtime + a send/read-until emit firing
// on the same mount) so they await one connection instead of racing to create two `io()`
// instances — same pattern as api-client.ts's refreshPromise.
let connectPromise: Promise<Socket> | null = null;

// NEXT_PUBLIC_* vars are inlined at Next.js build time — no runtime fetch needed.
// Railway must have NEXT_PUBLIC_SOCKET_URL set BEFORE the Docker build runs.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3004';

async function fetchToken(): Promise<string | null> {
  const res = await fetch('/api/auth/token', { credentials: 'include' });
  const data = await res.json() as { data?: { token?: string } };
  return data.data?.token ?? null;
}

// access_token is a short-lived (15min) JWT — /api/auth/token just echoes whatever cookie is
// currently there, no expiry check. Unlike normal REST calls (api-client.ts refreshes on 401
// and retries automatically), a socket that connects with an already-expired token gets
// rejected by watchParty.socket.ts's jwt.verify() and never recovers on its own: reconnection
// keeps resending the same stale token, so chat/sync/VB all silently stay dead for the rest of
// the tab's life. Mirrors api-client.ts's refresh flow, just triggered by connect_error instead
// of a 401 status.
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const token = await fetchToken();
      if (!token) throw new Error('Not authenticated');

      const s = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        // Real bug (live 2026-08-14): `reconnectionAttempts: 5` at a 2s base delay exhausts in
        // roughly 15-20s (socket.io-client's default backoff caps each delay at 5s). A real
        // network drop — phone losing signal, laptop sleep/wake, wifi switching — routinely
        // outlasts that window; once exhausted, socket.io-client fires 'reconnect_failed' and
        // stops trying FOREVER, even after the network genuinely comes back. The connection dot
        // (use-socket.ts) stayed red permanently, and nothing in the room recovered without a
        // full page reload. Unbounded attempts (still capped at reconnectionDelayMax, default
        // 5s, so this never hammers the server) means it just keeps trying for as long as the
        // tab is open — the correct behavior for a background connection like this one.
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
      });

      let refreshedOnce = false;
      s.on('connect_error', () => {
        if (refreshedOnce) return;
        refreshedOnce = true;
        void (async () => {
          if (!(await refreshAccessToken())) return;
          const freshToken = await fetchToken();
          if (!freshToken) return;
          s.auth = { token: freshToken };
          s.connect();
        })();
      });

      socket = s;
      return s;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
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
