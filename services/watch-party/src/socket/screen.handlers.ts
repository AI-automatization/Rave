import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { WatchPartyService } from '../services/watchParty.service';
import { fetchRoomSockets } from './roomSockets.helper';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string;
}

interface SdpPayload { toUserId?: string; sdp?: { type: 'offer' | 'answer'; sdp: string } }
interface IcePayload { toUserId?: string; candidate?: Record<string, unknown> }

// Kill switch: SCREEN_SHARE_ENABLED=0 drops every screen:* event without touching anything else.
const enabled = (): boolean => process.env.SCREEN_SHARE_ENABLED !== '0';

// Desktop screen share signalling (Windows app). The room owner shares a window from their own PC
// (the local Virtual Browser) and every viewer gets it peer-to-peer over WebRTC. This server only
// relays offer/answer/ICE between two sockets of the same room — no media passes through it, no
// state is stored: a late joiner asks with SCREEN_REQUEST and the sharer (if any) answers with an
// offer. Separate from mesh:* (mobile's DataChannel clock sync) so neither can break the other.
export const registerScreenHandlers = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  const ownerId = async (): Promise<string | null> => {
    if (!authSocket.roomId) return null;
    if (authSocket.roomOwnerId !== undefined) return authSocket.roomOwnerId;
    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      authSocket.roomOwnerId = room.ownerId;
      return room.ownerId;
    } catch {
      return null;
    }
  };
  const isOwner = async (): Promise<boolean> => (await ownerId()) === userId;

  // Target must be in the same room — never relay to an arbitrary user id.
  const inRoom = async (toUserId: string): Promise<boolean> => {
    if (!authSocket.roomId) return false;
    const sockets = await fetchRoomSockets(io, authSocket.roomId);
    return sockets.some((s) => (s as unknown as AuthenticatedSocket).user?.userId === toUserId);
  };

  socket.on(CLIENT_EVENTS.SCREEN_START, async () => {
    if (!enabled() || !authSocket.roomId || !(await isOwner())) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.SCREEN_STARTED, { userId });
    logger.info('Screen share started', { userId, roomId: authSocket.roomId });
  });

  socket.on(CLIENT_EVENTS.SCREEN_STOP, () => {
    if (!enabled() || !authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.SCREEN_STOPPED, { userId });
  });

  // A viewer asks for the stream — only the owner can be sharing, so it goes to the owner only.
  socket.on(CLIENT_EVENTS.SCREEN_REQUEST, async () => {
    if (!enabled() || !authSocket.roomId) return;
    const owner = await ownerId();
    if (!owner || owner === userId) return;
    io.to(`user:${owner}`).emit(SERVER_EVENTS.SCREEN_REQUEST, { userId });
  });

  // Offers come only from the owner (the sharer); answers and ICE from either side.
  socket.on(CLIENT_EVENTS.SCREEN_OFFER, async (data: SdpPayload) => {
    if (!enabled() || !data?.toUserId || data.sdp?.type !== 'offer') return;
    if (!(await isOwner()) || !(await inRoom(data.toUserId))) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.SCREEN_OFFER, { fromUserId: userId, sdp: data.sdp });
  });

  socket.on(CLIENT_EVENTS.SCREEN_ANSWER, async (data: SdpPayload) => {
    if (!enabled() || !data?.toUserId || data.sdp?.type !== 'answer') return;
    if (!(await inRoom(data.toUserId))) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.SCREEN_ANSWER, { fromUserId: userId, sdp: data.sdp });
  });

  socket.on(CLIENT_EVENTS.SCREEN_ICE, async (data: IcePayload) => {
    if (!enabled() || !data?.toUserId || !data.candidate) return;
    if (!(await inRoom(data.toUserId))) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.SCREEN_ICE, { fromUserId: userId, candidate: data.candidate });
  });
};
