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
// Clock drift accumulates over a long watch-party session — re-run the NTP-style exchange
// periodically instead of trusting the one sample taken at DataChannel open.
const CLOCK_RESYNC_INTERVAL_MS = 5 * 60 * 1000;
// Give a failed connection one chance to recover via ICE restart before tearing it down.
const ICE_RESTART_DELAY_MS = 2000;

export class MeshClient {
  private peers = new Map<string, MeshPeer>();
  private userId: string;
  private roomId: string;
  private onEvent: MeshEventHandler;
  private destroyed = false;
  // Clock offset (ms) per peer: peerClock = ourClock + offset. Best (min-RTT) sample wins.
  private clockOffsets = new Map<string, number>();
  private bestRtt = new Map<string, number>();
  // Periodic re-sync timers per peer (setInterval while DataChannel is open).
  private clockResyncTimers = new Map<string, ReturnType<typeof setInterval>>();
  // Tracks which peers already used their one ICE-restart retry, and the pending retry timers.
  private iceRestartAttempted = new Set<string>();
  private iceRestartTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    for (const timer of this.clockResyncTimers.values()) clearInterval(timer);
    this.clockResyncTimers.clear();
    for (const timer of this.iceRestartTimers.values()) clearTimeout(timer);
    this.iceRestartTimers.clear();
    this.iceRestartAttempted.clear();
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
      // MESH DIAG (release-visible, remove after transport is verified): shows the real P2P
      // outcome in logcat, which react-native-webrtc does not log on its own.
      console.log(`[mesh-diag] peer ${peerId} connectionState=${state}`);
      if (state === 'connected') {
        peer.isConnected = true;
        // Connection recovered — a future failure gets its own fresh restart attempt.
        this.iceRestartAttempted.delete(peerId);
        this.onEvent({ type: 'connected', peerId });
        // MESH DIAG: log which candidate type actually won (host = same LAN, srflx = STUN
        // public-IP, relay = TURN). onicecandidate only fires during gathering and doesn't say
        // which pair was picked — getStats() on the nominated pair is the only way to know.
        void (async () => {
          try {
            const stats: Map<string, Record<string, unknown>> = await (pc as unknown as { getStats: () => Promise<Map<string, Record<string, unknown>>> }).getStats();
            const pair = [...stats.values()].find(
              (s) => s.type === 'candidate-pair' && (s.nominated === true || s.selected === true),
            );
            if (!pair) { console.log(`[mesh-diag] peer ${peerId}: no nominated candidate-pair in stats`); return; }
            const local = stats.get(pair.localCandidateId as string);
            const remote = stats.get(pair.remoteCandidateId as string);
            const usesRelay = local?.candidateType === 'relay' || remote?.candidateType === 'relay';
            console.log(
              `[mesh-diag] peer ${peerId} TRANSPORT: local=${local?.candidateType ?? '?'} remote=${remote?.candidateType ?? '?'}` +
              ` (relay = TURN was needed; host/srflx = direct/STUN, no TURN)`,
            );
            this.onEvent({ type: 'transport', peerId, transportType: usesRelay ? 'turn' : 'p2p' });
          } catch (e) {
            console.log(`[mesh-diag] peer ${peerId}: getStats failed`, e);
          }
        })();
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        peer.isConnected = false;
        this.onEvent({ type: 'disconnected', peerId });
        if (state === 'failed') {
          if (!this.iceRestartAttempted.has(peerId)) {
            this.scheduleIceRestart(peerId);
          } else {
            this.removePeer(peerId);
          }
        }
      }
    };

    // __DEV__ telemetry only — lets us see whether a mesh actually came up (host/srflx/relay)
    // without instrumenting every call site. getIceServers() already handles the real
    // TURN/STUN selection; this just observes the outcome.
    pcAny.oniceconnectionstatechange = () => {
      if (__DEV__) console.log(`[MeshClient] ICE state ${peerId}: ${pc.iceConnectionState}`);
    };

    return pc;
  }

  /** One-shot ICE restart retry, scheduled ~2s after a peer connection fails. */
  private scheduleIceRestart(peerId: string): void {
    this.iceRestartAttempted.add(peerId);
    const timer = setTimeout(() => {
      this.iceRestartTimers.delete(peerId);
      void this.attemptIceRestart(peerId);
    }, ICE_RESTART_DELAY_MS);
    this.iceRestartTimers.set(peerId, timer);
  }

  private async attemptIceRestart(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (this.destroyed || !peer) return;
    const pc = peer.connection as InstanceType<NonNullable<typeof RTCPeerConnection>>;
    // Already recovered on its own, or moved past 'failed' (e.g. closed) — nothing to do.
    if (pc.connectionState !== 'failed') return;
    try {
      if (__DEV__) console.log(`[MeshClient] ICE restart attempt: ${peerId}`);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      getSocket()?.emit(CLIENT_EVENTS.PEER_OFFER, {
        roomId: this.roomId,
        toUserId: peerId,
        sdp: { type: 'offer', sdp: offer.sdp ?? '' },
      });
    } catch (err) {
      if (__DEV__) console.log(`[MeshClient] ICE restart failed, removing peer: ${peerId}: ${err}`);
      this.removePeer(peerId);
    }
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
      // MESH DIAG (release-visible): DataChannel open == the mesh P2P overlay is live for this peer.
      console.log(`[mesh-diag] DataChannel OPEN → ${peerId} (mesh transport active)`);
      this.startClockSync(peerId);
      this.startPeriodicClockResync(peerId);
    };

    channel.onclose = () => {
      console.log(`[mesh-diag] DataChannel CLOSED → ${peerId}`);
      this.stopPeriodicClockResync(peerId);
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
    this.stopPeriodicClockResync(peerId);
    this.iceRestartAttempted.delete(peerId);
    const iceTimer = this.iceRestartTimers.get(peerId);
    if (iceTimer) {
      clearTimeout(iceTimer);
      this.iceRestartTimers.delete(peerId);
    }
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

  /** Re-run the clock sync burst every CLOCK_RESYNC_INTERVAL_MS while the channel stays open. */
  private startPeriodicClockResync(peerId: string): void {
    // Guard against a duplicate interval if onopen ever fires twice for the same peer.
    this.stopPeriodicClockResync(peerId);
    const timer = setInterval(() => {
      const peer = this.peers.get(peerId);
      if (this.destroyed || !peer || peer.dataChannel?.readyState !== 'open') {
        this.stopPeriodicClockResync(peerId);
        return;
      }
      this.startClockSync(peerId);
    }, CLOCK_RESYNC_INTERVAL_MS);
    this.clockResyncTimers.set(peerId, timer);
  }

  private stopPeriodicClockResync(peerId: string): void {
    const timer = this.clockResyncTimers.get(peerId);
    if (timer) {
      clearInterval(timer);
      this.clockResyncTimers.delete(peerId);
    }
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
