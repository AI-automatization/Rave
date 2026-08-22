// WeWatch — Free-tier VB queue (2026-08-22).
//
// VB is the sole extraction mechanism on the room-open path (roomEvents.handler.ts CHANGE_MEDIA,
// watchParty.controller.ts createRoom/playNext — see the 2026-08-10 "Single extraction mechanism"
// comments there), and Free is capped at MAX_CONCURRENT_FREE (virtualBrowser.service.ts) — so
// every room past that cap used to just get an immediate hard error ('virtual_browser_limit')
// with no way to actually watch anything until some other room's VB session ended and the owner
// happened to retry. This queue replaces that: a Free request past the cap waits here instead of
// failing, and starts automatically the moment a slot frees (setOnSlotFreed hook below).
//
// Pro is uncapped (see MAX_TOTAL_SAFETY_CEILING) and never enters this queue — callers only push
// 'free'-tier requests here.
import { Server as SocketServer } from 'socket.io';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { setOnSlotFreed } from '../services/virtualBrowser.service';
import { startVBForRoom } from './vbSession.helper';

interface QueuedVBRequest {
  roomId: string;
  ownerId: string;
  url: string;
  io: SocketServer;
  redis: Redis;
}

const queue: QueuedVBRequest[] = [];
// Guards against re-entrant drains — stopSession() can fire onSlotFreed for several rooms in
// quick succession (e.g. a bulk room-close), and each one triggers tryDrainQueue independently.
let draining = false;

function broadcastPositions(): void {
  queue.forEach((q, i) => {
    q.io.to(q.roomId).emit(SERVER_EVENTS.VB_QUEUED, { position: i + 1 });
  });
}

/** Adds (or, if already queued, replaces — a later request for the same room supersedes an
 * earlier one rather than duplicating it) a Free-tier VB request. Returns the 1-indexed position. */
export function enqueueVBRequest(req: QueuedVBRequest): number {
  const existingIdx = queue.findIndex((q) => q.roomId === req.roomId);
  if (existingIdx !== -1) queue.splice(existingIdx, 1);
  queue.push(req);
  broadcastPositions();
  return queue.length;
}

export function getQueuePosition(roomId: string): number | null {
  const idx = queue.findIndex((q) => q.roomId === roomId);
  return idx === -1 ? null : idx + 1;
}

/** Called when a room no longer wants its queued spot (left the room, started watching something
 * else some other way) — without this a stale entry would eventually start VB for a room nobody
 * is waiting on anymore. */
export function removeFromQueue(roomId: string): void {
  const idx = queue.findIndex((q) => q.roomId === roomId);
  if (idx === -1) return;
  queue.splice(idx, 1);
  broadcastPositions();
}

export function tryDrainQueue(): void {
  if (draining) return;
  draining = true;
  void (async () => {
    try {
      while (queue.length > 0) {
        const next = queue[0];
        try {
          await startVBForRoom(next.io, next.redis, next.roomId, next.ownerId, next.url, 'free');
          queue.shift();
          broadcastPositions();
        } catch (e) {
          if ((e as Error).message === 'virtual_browser_limit') {
            // Pool is genuinely still full — a burst of stopSession calls raced this drain and
            // another queued room already took the freed slot. Stop; the next onSlotFreed retries.
            break;
          }
          // Anything else (bad url, navigation blocked, etc.) — this request can't ever succeed,
          // drop it and keep draining the rest instead of blocking the whole queue on it.
          logger.warn('VB queue: request failed to start, dropping', { roomId: next.roomId, error: (e as Error).message });
          queue.shift();
          broadcastPositions();
        }
      }
    } finally {
      draining = false;
    }
  })();
}

setOnSlotFreed(tryDrainQueue);
