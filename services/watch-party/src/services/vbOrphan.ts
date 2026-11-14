// Orphaned Virtual-Browser session detection (pure logic, unit-tested in vbOrphan.test.ts).
//
// Prod 2026-11-09/10 (media RAM 0.6 GB -> 2.2 GB): three Chromium+ffmpeg sessions stayed in
// virtualBrowser's `sessions` map forever because the room that owned them went away without
// anyone calling stopSession():
//   - REST DELETE /rooms/:id (closeRoom) marked the room 'ended' but never stopped its VB;
//   - a room created over REST with a VB auto-start whose owner never opened a socket has no
//     disconnect/leave event to trigger cleanup, and closeInactiveRooms() deliberately skips
//     rooms that have a session, so neither the room nor the session was ever closed.
// A periodic sweep is the only backstop that covers every such path, current and future.

export const ORPHAN_EMPTY_GRACE_MS = 10 * 60 * 1000;

export interface OrphanInput {
  /** roomIds that currently hold a VB session. */
  sessionRoomIds: string[];
  /** Subset of sessionRoomIds whose room is still live in Mongo (waiting/playing/paused). */
  liveRoomIds: Set<string>;
  /** Does the room have at least one connected socket? */
  isOccupied: (roomId: string) => boolean;
  now: number;
  /** Mutable: roomId -> first time it was seen with a session and no sockets. Owned by the caller. */
  emptySince: Map<string, number>;
  graceMs?: number;
}

/**
 * Returns the roomIds whose VB session should be stopped:
 *  - the room is ended/deleted (nobody can ever use the session again), or
 *  - the room has had no connected socket for `graceMs` continuously.
 * Also prunes `emptySince` of rooms that no longer have a session.
 */
export function pickOrphanedSessions(input: OrphanInput): string[] {
  const { sessionRoomIds, liveRoomIds, isOccupied, now, emptySince } = input;
  const graceMs = input.graceMs ?? ORPHAN_EMPTY_GRACE_MS;
  const present = new Set(sessionRoomIds);
  for (const id of [...emptySince.keys()]) if (!present.has(id)) emptySince.delete(id);

  const orphans: string[] = [];
  for (const id of sessionRoomIds) {
    if (!liveRoomIds.has(id)) {
      orphans.push(id);
      emptySince.delete(id);
      continue;
    }
    if (isOccupied(id)) {
      emptySince.delete(id);
      continue;
    }
    const since = emptySince.get(id);
    if (since === undefined) {
      emptySince.set(id, now);
    } else if (now - since >= graceMs) {
      orphans.push(id);
      emptySince.delete(id);
    }
  }
  return orphans;
}
