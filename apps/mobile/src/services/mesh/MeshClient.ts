// WeWatch — MeshClient: WebRTC peer connection manager
// Manages RTCPeerConnection lifecycle, DataChannel creation, and signalling
import { getSocket, CLIENT_EVENTS, SERVER_EVENTS } from '@socket/client';
import { meshConfig } from './config';
import { getIceServers } from './iceServers';
import type { MeshPeer, MeshEventHandler, SyncMessage, MeshSignalPayload } from './types';

// ─── WebRTC lazy imports ──────────────────────────────────────────────────────
// A static `import ... from 'react-native-webrtc'` initializes the native module
// (NativeEventEmitter) at bundle-eval time. In Expo Go that module doesn't exist →
// "Invariant Violation: native module doesn't exist" crashes the app on startup.
// Load lazily so importing MeshClient is safe; mesh simply stays disabled without it.
let RTCPeerConnection: typeof import('react-native-webrtc').RTCPeerConnection | null = null;
let RTCSessionDescription: typeof import('react-native-webrtc').RTCSessionDescription | null = null;
let RTCIceCandidate: typeof import('react-native-webrtc').RTCIceCandidate | null = null;
let webrtcAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webrtc = require('react-native-webrtc') as typeof import('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  webrtcAvailable = !!RTCPeerConnection;
} catch {
  webrtcAvailable = false;
}

// NTP-style clock sync exchanged over the DataChannel. Kept off the SyncMessage
// union so it never reaches sync consumers — handled internally by MeshClient.
interface ClockMsg {
  __clock: 'ping' | 'pong';
  t0: number;        // initiator send time (initiator clock)
  t1?: number;       // responder receive/send time (responder clock)
}

const CLOCK_PING_ROUNDS = 5;
const CLOCK_PING_INTERVAL_MS = 400;

export class MeshClient {
  private peers = new Map<string, MeshPeer>();
  private userId: string;
  private roomId: string;
  private onEvent: MeshEventHandler;
  private destroyed = false;
  // Clock offset (ms) per peer: peerClock = ourClock + offset. Best (min-RTT) sample wins.
  private clockOffsets = new Map<string, number>();
  private bestRtt = new Map<string, number>();

  constructor(userId: string, roomId: string, onEvent: MeshEventHandler) {
    this.userId = userId;
    this.roomId = roomId;
    this.onEvent = onEvent;
  }

  /** Whether react-native-webrtc native module is present (false in Expo Go). */
  static isSupported(): boolean {
    return webrtcAvailable;
  }

  /** Join mesh network — start listening for signals */
  join(): void {
    const socket = getSocket();
    if (!socket || this.destroyed) return;

    socket.on(SERVER_EVENTS.PEER_OFFER, this.handleOffer);
    socket.on(SERVER_EVENTS.PEER_ANSWER, this.handleAnswer);
    socket.on(SERVER_EVENTS.PEER_ICE, this.handleIce);
    socket.on(SERVER_EVENTS.MESH_PEER_JOINED, this.handlePeerJoined);
    socket.on(SERVER_EVENTS.MESH_PEER_LEFT, this.handlePeerLeft);

    socket.emit(CLIENT_EVENTS.MESH_JOIN, { roomId: this.roomId });
  }

  /** Send sync message to all connected peers via DataChannel */
  broadcast(message: SyncMessage): void {
    const json = JSON.stringify(message);
    for (const peer of this.peers.values()) {
      if (peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(json);
      }
    }
  }

  /** Get number of connected peers */
  get connectedCount(): number {
    let count = 0;
    for (const peer of this.peers.values()) {
      if (peer.isConnected) count++;
    }
    return count;
  }

  /** Destroy all connections and cleanup */
  destroy(): void {
    this.destroyed = true;
    const socket = getSocket();
    if (socket) {
      socket.off(SERVER_EVENTS.PEER_OFFER, this.handleOffer);
      socket.off(SERVER_EVENTS.PEER_ANSWER, this.handleAnswer);
      socket.off(SERVER_EVENTS.PEER_ICE, this.handleIce);
      socket.off(SERVER_EVENTS.MESH_PEER_JOINED, this.handlePeerJoined);
      socket.off(SERVER_EVENTS.MESH_PEER_LEFT, this.handlePeerLeft);
      socket.emit(CLIENT_EVENTS.MESH_LEAVE, { roomId: this.roomId });
    }
    for (const peer of this.peers.values()) {
      peer.dataChannel?.close();
      peer.connection.close();
    }
    this.peers.clear();
  }

  // ── Private: Peer connection management ──────────────────────────

  // react-native-webrtc RTCPeerConnection extends EventTarget — event callback
  // properties (onicecandidate, etc.) are NOT in the .d.ts, but addEventListener works at runtime.
  // We cast to avoid TS conflicts between react-native-webrtc and global WebRTC types.
  private async createPeerConnection(peerId: string): Promise<InstanceType<NonNullable<typeof RTCPeerConnection>>> {
    if (!RTCPeerConnection) throw new Error('WebRTC unavailable');
    // TURN creds from backend (cached); STUN fallback baked into getIceServers.
    const iceServers = await getIceServers().catch(() => meshConfig.iceServers);
    const pc = new RTCPeerConnection({ iceServers });
    const pcAny = pc as unknown as Record<string, unknown>;

    pcAny.onicecandidate = (event: { candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null } | null }) => {
      if (event.candidate && !this.destroyed) {
        getSocket()?.emit(CLIENT_EVENTS.PEER_ICE, {
          roomId: this.roomId,
          toUserId: peerId,
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    pcAny.onconnectionstatechange = () => {
      const peer = this.peers.get(peerId);
      if (!peer) return;
      const state = pc.connectionState;
      if (state === 'connected') {
        peer.isConnected = true;
        this.onEvent({ type: 'connected', peerId });
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        peer.isConnected = false;
        this.onEvent({ type: 'disconnected', peerId });
        if (state === 'failed') this.removePeer(peerId);
      }
    };

    return pc;
  }

  private setupDataChannel(peerId: string, channel: MeshPeer['dataChannel']): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.dataChannel = channel;

    channel.onmessage = (event: { data: string }) => {
      try {
        const parsed = JSON.parse(event.data) as SyncMessage | ClockMsg;
        if ((parsed as ClockMsg).__clock) {
          this.handleClockMessage(peerId, parsed as ClockMsg);
          return;
        }
        // Attach sender's clock offset so consumers can correct cross-device drift.
        this.onEvent({
          type: 'sync',
          peerId,
          syncMessage: parsed as SyncMessage,
          clockOffset: this.clockOffsets.get(peerId) ?? 0,
        });
      } catch { /* ignore malformed */ }
    };

    channel.onopen = () => {
      if (__DEV__) console.log(`[MeshClient] DataChannel open: ${peerId}`);
      this.startClockSync(peerId);
    };

    channel.onclose = () => {
      if (__DEV__) console.log(`[MeshClient] DataChannel closed: ${peerId}`);
    };
  }

  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.dataChannel?.close();
    peer.connection.close();
    this.peers.delete(peerId);
    this.clockOffsets.delete(peerId);
    this.bestRtt.delete(peerId);
  }

  // ── Clock sync (NTP-style over DataChannel) ──────────────────────────
  // Without this, drift math assumes both devices share a wall clock — they don't.
  // peerClock = ourClock + offset; we keep the offset from the lowest-RTT round.

  /** Get measured clock offset (ms) for a peer. peerClock = ourClock + offset. */
  getClockOffset(peerId: string): number {
    return this.clockOffsets.get(peerId) ?? 0;
  }

  private startClockSync(peerId: string): void {
    let round = 0;
    const tick = (): void => {
      const peer = this.peers.get(peerId);
      if (this.destroyed || !peer || peer.dataChannel?.readyState !== 'open') return;
      const ping: ClockMsg = { __clock: 'ping', t0: Date.now() };
      peer.dataChannel.send(JSON.stringify(ping));
      if (++round < CLOCK_PING_ROUNDS) setTimeout(tick, CLOCK_PING_INTERVAL_MS);
    };
    tick();
  }

  private handleClockMessage(peerId: string, msg: ClockMsg): void {
    const peer = this.peers.get(peerId);
    if (!peer || peer.dataChannel?.readyState !== 'open') return;

    if (msg.__clock === 'ping') {
      // Responder: echo t0, stamp our clock as t1.
      const pong: ClockMsg = { __clock: 'pong', t0: msg.t0, t1: Date.now() };
      peer.dataChannel.send(JSON.stringify(pong));
      return;
    }

    // Initiator received pong: t0=our send, t1=peer stamp, t2=our recv.
    const t2 = Date.now();
    const t1 = msg.t1 ?? t2;
    const rtt = t2 - msg.t0;
    const offset = t1 - (msg.t0 + t2) / 2; // peerClock - ourClock
    const prevRtt = this.bestRtt.get(peerId) ?? Infinity;
    if (rtt < prevRtt) {
      this.bestRtt.set(peerId, rtt);
      this.clockOffsets.set(peerId, offset);
      if (__DEV__) console.log(`[MeshClient] clock ${peerId}: offset=${offset.toFixed(0)}ms rtt=${rtt}ms`);
    }
  }

  // ── Private: Signalling handlers ─────────────────────────────────

  private handlePeerJoined = (data: { userId: string }): void => {
    if (this.destroyed || data.userId === this.userId) return;
    this.createOffer(data.userId);
  };

  private handlePeerLeft = (data: { userId: string }): void => {
    this.removePeer(data.userId);
    this.onEvent({ type: 'disconnected', peerId: data.userId });
  };

  private async createOffer(peerId: string): Promise<void> {
    try {
      const pc = await this.createPeerConnection(peerId);
      if (this.destroyed) { pc.close(); return; }
      const channel = pc.createDataChannel(meshConfig.dataChannelLabel);
      const peer: MeshPeer = { userId: peerId, connection: pc, dataChannel: null, isConnected: false };
      this.peers.set(peerId, peer);
      this.setupDataChannel(peerId, channel);

      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);

      getSocket()?.emit(CLIENT_EVENTS.PEER_OFFER, {
        roomId: this.roomId,
        toUserId: peerId,
        sdp: { type: 'offer', sdp: offer.sdp ?? '' },
      });
    } catch (err) {
      this.onEvent({ type: 'error', peerId, error: `Offer failed: ${err}` });
    }
  }

  private handleOffer = async (data: MeshSignalPayload): Promise<void> => {
    if (this.destroyed || !data.sdp || !RTCSessionDescription) return;
    try {
      const peerId = data.fromUserId;
      const pc = await this.createPeerConnection(peerId);
      if (this.destroyed) { pc.close(); return; }
      const peer: MeshPeer = { userId: peerId, connection: pc, dataChannel: null, isConnected: false };
      this.peers.set(peerId, peer);

      const pcAny = pc as unknown as Record<string, unknown>;
      pcAny.ondatachannel = (event: { channel: MeshPeer['dataChannel'] }) => {
        this.setupDataChannel(peerId, event.channel);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket()?.emit(CLIENT_EVENTS.PEER_ANSWER, {
        roomId: this.roomId,
        toUserId: peerId,
        sdp: { type: 'answer', sdp: answer.sdp ?? '' },
      });
    } catch (err) {
      this.onEvent({ type: 'error', peerId: data.fromUserId, error: `Answer failed: ${err}` });
    }
  };

  private handleAnswer = async (data: MeshSignalPayload): Promise<void> => {
    if (this.destroyed || !data.sdp || !RTCSessionDescription) return;
    const peer = this.peers.get(data.fromUserId);
    if (!peer) return;
    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (err) {
      this.onEvent({ type: 'error', peerId: data.fromUserId, error: `SetRemote failed: ${err}` });
    }
  };

  private handleIce = async (data: MeshSignalPayload): Promise<void> => {
    if (this.destroyed || !data.candidate || !RTCIceCandidate) return;
    const peer = this.peers.get(data.fromUserId);
    if (!peer) return;
    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
      if (__DEV__) console.log(`[MeshClient] ICE add failed: ${err}`);
    }
  };
}
