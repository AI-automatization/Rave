import type { Server as SocketServer } from 'socket.io';
import { logger } from '@shared/utils/logger';

/**
 * `io.in(room).fetchSockets()` that never rejects.
 *
 * With the Redis adapter, fetchSockets() asks every subscribed node and REJECTS after its request
 * timeout when one doesn't answer — e.g. an old instance still subscribed during a deploy overlap,
 * or a second dev server on the same Redis. Every caller awaited it bare (several inside
 * fire-and-forget async blocks), so one timeout was an unhandled rejection that killed the whole
 * service (local stack, 2026-10-25: "timeout reached while waiting for fetchSockets response").
 * watch-party runs as a single replica (server.ts), so this node's own sockets are the full answer.
 */
export async function fetchRoomSockets(io: SocketServer, room: string) {
  try {
    return await io.in(room).fetchSockets();
  } catch (e) {
    logger.warn('fetchSockets via adapter failed — using this node only', { room, error: (e as Error).message });
    return io.in(room).local.fetchSockets();
  }
}
