import { Server as SocketServer, Socket } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string; // cached on JOIN_ROOM to skip MongoDB on every video event
}

// Module-level state shared across all socket instances in this process.
// bufferTimeouts: per-room pending resume timer — must be module-level so any socket can cancel it.
// roomUserPaused: owner explicitly paused (not democratic buffer pause); blocks resumeRoom VIDEO_PLAY.
const bufferTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const roomUserPaused = new Map<string, boolean>();

export const registerVideoEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  // Resolves owner check with fallback: if roomOwnerId is cached use it directly (fast path).
  // If undefined (socket emits before JOIN_ROOM response completes — Android timing race),
  // do a single MongoDB lookup, cache the result, then re-check.
  const resolveIsOwner = async (): Promise<boolean> => {
    if (!authSocket.roomId) return false;
    if (authSocket.roomOwnerId !== undefined) return authSocket.roomOwnerId === userId;
    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      authSocket.roomOwnerId = room.ownerId;
      return room.ownerId === userId;
    } catch {
      return false;
    }
  };

  // PLAY — owner only
  socket.on(CLIENT_EVENTS.PLAY, async (data: { currentTime: number }) => {
    if (!authSocket.roomId) {
      logger.warn('Video play: no roomId set', { userId });
      return;
    }
    if (!await resolveIsOwner()) {
      logger.warn('Video play rejected: not owner', { userId, ownerId: authSocket.roomOwnerId, roomId: authSocket.roomId });
      return;
    }
    const roomId = authSocket.roomId;
    roomUserPaused.delete(roomId); // owner resumed — allow future resumeRoom VIDEO_PLAY

    try {
      const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, true);
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState);
      logger.info('Video sync: play', { roomId, userId, currentTime: data.currentTime });
    } catch (error) {
      logger.error('Socket play error', { userId, error });
    }
  });

  // PAUSE — owner only
  socket.on(CLIENT_EVENTS.PAUSE, async (data: { currentTime: number }) => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;

    // Owner explicitly paused — cancel any pending buffer resume timer and mark as user-paused.
    // This prevents resumeRoom from auto-playing after the buffer resolves (the 2s auto-resume bug).
    roomUserPaused.set(roomId, true);
    const pendingResume = bufferTimeouts.get(roomId);
    if (pendingResume) { clearTimeout(pendingResume); bufferTimeouts.delete(roomId); }
    await watchPartyService.clearAllBuffering(roomId);

    try {
      const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, false);
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState);
      logger.info('Video sync: pause', { roomId, userId, currentTime: data.currentTime });
    } catch (error) {
      logger.error('Socket pause error', { userId, error });
    }
  });

  // SEEK — owner only
  socket.on(CLIENT_EVENTS.SEEK, async (data: { currentTime: number }) => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;

    try {
      // Read isPlaying from Redis (fast) rather than MongoDB
      const cached = await watchPartyService.getSyncState(roomId);
      const isPlaying = cached?.isPlaying ?? false;
      const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, isPlaying);
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_SEEK, syncState);
      logger.info('Video sync: seek', { roomId, userId, currentTime: data.currentTime });
    } catch (error) {
      logger.error('Socket seek error', { userId, error });
    }
  });

  // HEARTBEAT — owner position ping, no scheduledAt, no seekTo on peers
  socket.on(CLIENT_EVENTS.HEARTBEAT, async (data: { currentTime: number }) => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;

    try {
      // Persist current position so BUFFER_START/resumeRoom always have fresh currentTime
      await watchPartyService.updateCurrentTime(roomId, data.currentTime);

      const heartbeat = {
        currentTime: data.currentTime,
        timestamp: Date.now(),
        updatedBy: userId,
      };

      // Broadcast to all peers except sender — no scheduledAt, peers use drift correction only
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_HEARTBEAT, heartbeat);
    } catch (error) {
      logger.error('Socket heartbeat error', { userId, error });
    }
  });

  // BUFFER — democratic wait: pause all when first peer buffers, resume when all done
  const MAX_BUFFER_WAIT_MS = 30_000;

  const resumeRoom = async (roomId: string) => {
    await watchPartyService.clearAllBuffering(roomId);
    const existing = bufferTimeouts.get(roomId);
    if (existing) { clearTimeout(existing); bufferTimeouts.delete(roomId); }

    // If owner explicitly paused (not a democratic buffer pause), don't auto-resume.
    // roomUserPaused is set by the PAUSE handler and cleared by the PLAY handler.
    if (roomUserPaused.get(roomId)) {
      io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: false });
      logger.info('Buffer resolved but room is user-paused — skip auto-resume', { roomId });
      return;
    }

    // Use Redis syncState for currentTime — always fresher than MongoDB (heartbeat keeps it updated).
    // Compensate for elapsed time since last heartbeat so resume lands at the real owner position,
    // not a stale snapshot. Cap compensation at 10s to avoid overshooting on long pauses.
    const cached = await watchPartyService.getSyncState(roomId);
    const ownerId = cached?.updatedBy ?? (await watchPartyService.getRoom(roomId)).ownerId;
    const storedCurrentTime = cached?.currentTime ?? 0;
    const storedTimestamp = cached?.serverTimestamp ?? Date.now();
    const wasPlaying = cached?.isPlaying ?? false;
    const elapsedSecs = wasPlaying ? Math.min(10, (Date.now() - storedTimestamp) / 1000) : 0;
    const currentTime = storedCurrentTime + elapsedSecs;

    const syncState = await watchPartyService.syncState(roomId, ownerId, currentTime, true);
    io.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState);
    io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: false });
    logger.info('Buffer wait over — resumed room', { roomId, currentTime });
  };

  socket.on(CLIENT_EVENTS.BUFFER_START, async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      // Grace period: new joiners buffer while loading — don't pause everyone for them
      const isJoiner = await watchPartyService.isRecentJoiner(roomId, userId);
      if (isJoiner) {
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: true });
        return;
      }

      const count = await watchPartyService.markBuffering(roomId, userId);
      io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: true });

      if (count === 1) {
        // First buffer — pause everyone at the freshest known position (Redis, not MongoDB)
        const cached = await watchPartyService.getSyncState(roomId);
        const ownerId = cached?.updatedBy ?? (await watchPartyService.getRoom(roomId)).ownerId;
        const currentTime = cached?.currentTime ?? 0;

        const syncState = await watchPartyService.syncState(roomId, ownerId, currentTime, false);
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState);
        logger.info('Democratic buffer pause', { roomId, userId, currentTime });

        // Safety: force resume after 30s
        const timeout = setTimeout(() => resumeRoom(roomId), MAX_BUFFER_WAIT_MS);
        bufferTimeouts.set(roomId, timeout);
      }
    } catch (error) {
      logger.error('Socket buffer_start error', { userId, error });
    }
  });

  socket.on(CLIENT_EVENTS.BUFFER_END, async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      // Grace period joiner — was never added to buffering set, just clear the indicator
      const isJoiner = await watchPartyService.isRecentJoiner(roomId, userId);
      if (isJoiner) {
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: false });
        return;
      }

      const remaining = await watchPartyService.unmarkBuffering(roomId, userId);
      if (remaining === 0) {
        await resumeRoom(roomId);
      } else {
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, isBuffering: false });
        logger.info('Buffer wait: still waiting', { roomId, remaining });
      }
    } catch (error) {
      logger.error('Socket buffer_end error', { userId, error });
    }
  });

  // Cleanup on disconnect — remove from buffering set
  socket.on('disconnect', async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    try {
      const remaining = await watchPartyService.unmarkBuffering(roomId, userId);
      if (remaining === 0) {
        const existing = bufferTimeouts.get(roomId);
        if (existing) { clearTimeout(existing); bufferTimeouts.delete(roomId); }
        await watchPartyService.clearAllBuffering(roomId);
      }
    } catch { /* ignore disconnect cleanup errors */ }
  });
};
