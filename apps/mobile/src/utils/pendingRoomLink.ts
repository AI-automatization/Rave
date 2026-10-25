// WeWatch Mobile — room link parsing + "pending link" holder.
// A room/join link opened while signed out is parked here until the user has joined as a guest
// (or logged in) and the Main/Modal stack is mounted; AppNavigator then consumes it once.

export type RoomLink =
  | { kind: 'join'; inviteCode: string }
  | { kind: 'room'; roomId: string; inviteCode?: string };

/** wewatch://join/CODE and https://app.wewatch.uz/room/:id[?code=X]. Other URLs → null. */
export function parseRoomLink(url: string): RoomLink | null {
  const join = url.match(/wewatch:\/\/join\/([A-Fa-f0-9]{6})/i);
  if (join) return { kind: 'join', inviteCode: join[1].toUpperCase() };

  const room = url.match(/\/room\/([^/?#]+)/i);
  if (!room) return null;
  let roomId: string;
  try {
    roomId = decodeURIComponent(room[1]);
  } catch {
    roomId = room[1];
  }
  let code: string | null = null;
  try {
    code = new URL(url).searchParams.get('code');
  } catch {
    // malformed URL — roomId-only link
  }
  return code ? { kind: 'room', roomId, inviteCode: code.toUpperCase() } : { kind: 'room', roomId };
}

let pending: RoomLink | null = null;
const listeners = new Set<() => void>();

export const pendingRoomLink = {
  get: (): RoomLink | null => pending,
  set(link: RoomLink | null): void {
    pending = link;
    listeners.forEach((l) => l());
  },
  /** Returns the pending link and clears it (handle-once). */
  take(): RoomLink | null {
    const l = pending;
    pending = null;
    return l;
  },
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
