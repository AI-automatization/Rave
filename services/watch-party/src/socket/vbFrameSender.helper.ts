import type { Server as SocketServer, Socket } from 'socket.io';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';

// How long a frame may stay unacknowledged before the next one goes anyway — covers a client that
// lost the ack (or a hidden tab whose rAF stopped), so the stream never wedges for good. Must stay
// well above one frame's delivery time on the slowest link: a 70 KB frame takes ~2s at 300 kbps,
// and a timeout shorter than that would send into a still-full buffer and rebuild the backlog.
const FRAME_ACK_TIMEOUT_MS = 8000;

interface Pacer { inFlight: boolean; pending: string | null }
const pacers = new WeakMap<Socket, Pacer>();

function sendPaced(socket: Socket, pacer: Pacer, frame: string): void {
  pacer.inFlight = true;
  socket.timeout(FRAME_ACK_TIMEOUT_MS).emit(SERVER_EVENTS.VB_FRAME, { data: frame }, () => {
    pacer.inFlight = false;
    const next = pacer.pending;
    pacer.pending = null;
    if (next !== null && socket.connected) sendPaced(socket, pacer, next);
  });
}

/**
 * Delivers one VB screencast frame to every socket in `target` — the owner's `user:<id>` room
 * while picking, or the whole watch-party room when the room watches the VB itself.
 *
 * volatile alone only drops a frame while THIS server's write is busy — on a slow phone link the
 * kernel/proxy buffers still queue several 30–70 KB frames, so what the owner sees runs seconds
 * behind their taps. A client that says `auth.vbFrameAck` in its handshake (app-web) acks each
 * frame once it has rendered it; it then gets at most one frame in flight and always the NEWEST
 * one next, so latency stays one frame deep at any bandwidth. Everyone else (mobile app, older web
 * builds) keeps the old volatile broadcast unchanged.
 */
export function emitVbFrame(io: SocketServer, target: string, frame: string): void {
  const nsp = io.of('/');
  const ids = nsp.adapter.rooms.get(target);
  if (!ids) return;
  for (const id of ids) {
    const socket = nsp.sockets.get(id);
    if (!socket) continue;
    if (socket.handshake.auth?.vbFrameAck !== true) {
      socket.volatile.emit(SERVER_EVENTS.VB_FRAME, { data: frame });
      continue;
    }
    let pacer = pacers.get(socket);
    if (!pacer) { pacer = { inFlight: false, pending: null }; pacers.set(socket, pacer); }
    if (pacer.inFlight) pacer.pending = frame; // keep only the newest
    else sendPaced(socket, pacer, frame);
  }
}
