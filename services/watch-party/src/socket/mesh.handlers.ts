import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload, MeshSignalPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

export const registerMeshHandlers = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
): void => {
  const { userId } = authSocket.user;

  // MESH_JOIN — announce presence to room peers so they initiate RTCPeerConnection
  socket.on(CLIENT_EVENTS.MESH_JOIN, () => {
    if (!authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.MESH_PEER_JOINED, { userId });
    logger.info('Mesh peer joined', { userId, roomId: authSocket.roomId });
  });

  // MESH_LEAVE — notify room that this peer left the mesh
  socket.on(CLIENT_EVENTS.MESH_LEAVE, () => {
    if (!authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.MESH_PEER_LEFT, { userId });
    logger.info('Mesh peer left', { userId, roomId: authSocket.roomId });
  });

  // PEER_OFFER — relay SDP offer to target peer via personal room
  socket.on(CLIENT_EVENTS.PEER_OFFER, (data: Pick<MeshSignalPayload, 'toUserId' | 'sdp'>) => {
    if (!data.toUserId || !data.sdp) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.PEER_OFFER, {
      fromUserId: userId,
      toUserId: data.toUserId,
      type: 'offer',
      sdp: data.sdp,
    } satisfies MeshSignalPayload);
  });

  // PEER_ANSWER — relay SDP answer back to the offerer
  socket.on(CLIENT_EVENTS.PEER_ANSWER, (data: Pick<MeshSignalPayload, 'toUserId' | 'sdp'>) => {
    if (!data.toUserId || !data.sdp) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.PEER_ANSWER, {
      fromUserId: userId,
      toUserId: data.toUserId,
      type: 'answer',
      sdp: data.sdp,
    } satisfies MeshSignalPayload);
  });

  // PEER_ICE — relay ICE candidate to target peer
  socket.on(CLIENT_EVENTS.PEER_ICE, (data: Pick<MeshSignalPayload, 'toUserId' | 'candidate'>) => {
    if (!data.toUserId || !data.candidate) return;
    io.to(`user:${data.toUserId}`).emit(SERVER_EVENTS.PEER_ICE, {
      fromUserId: userId,
      toUserId: data.toUserId,
      type: 'ice',
      candidate: data.candidate,
    } satisfies MeshSignalPayload);
  });

  // Auto-notify peers on socket disconnect
  socket.on('disconnect', () => {
    if (!authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.MESH_PEER_LEFT, { userId });
  });
};
