// CineSync — MeshClient: WebRTC peer connection manager
// Manages RTCPeerConnection lifecycle, DataChannel creation, and signalling
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
} from 'react-native-webrtc';
import { getSocket, CLIENT_EVENTS, SERVER_EVENTS } from '@socket/client';
import { meshConfig } from './config';
import type { MeshPeer, MeshEventHandler, SyncMessage, MeshSignalPayload } from './types';

export class MeshClient {
  private peers = new Map<string, MeshPeer>();
  private userId: string;
  private roomId: string;
  private onEvent: MeshEventHandler;
  private destroyed = false;

  constructor(userId: string, roomId: string, onEvent: MeshEventHandler) {
    this.userId = userId;
    this.roomId = roomId;
    this.onEvent = onEvent;
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

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: meshConfig.iceServers });

    pc.onicecandidate = (event: { candidate: RTCIceCandidate | null }) => {
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

    pc.onconnectionstatechange = () => {
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

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.dataChannel = channel;

    channel.onmessage = (event: { data: string }) => {
      try {
        const msg = JSON.parse(event.data) as SyncMessage;
        this.onEvent({ type: 'sync', peerId, syncMessage: msg });
      } catch { /* ignore malformed */ }
    };

    channel.onopen = () => {
      if (__DEV__) console.log(`[MeshClient] DataChannel open: ${peerId}`);
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
  }

  // ── Private: Signalling handlers ─────────────────────────────────

  private handlePeerJoined = (data: { userId: string }): void => {
    if (this.destroyed || data.userId === this.userId) return;
    // New peer joined — create offer (initiator)
    this.createOffer(data.userId);
  };

  private handlePeerLeft = (data: { userId: string }): void => {
    this.removePeer(data.userId);
    this.onEvent({ type: 'disconnected', peerId: data.userId });
  };

  private async createOffer(peerId: string): Promise<void> {
    try {
      const pc = this.createPeerConnection(peerId);
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
    if (this.destroyed || !data.sdp) return;
    try {
      const peerId = data.fromUserId;
      const pc = this.createPeerConnection(peerId);
      const peer: MeshPeer = { userId: peerId, connection: pc, dataChannel: null, isConnected: false };
      this.peers.set(peerId, peer);

      pc.ondatachannel = (event: { channel: RTCDataChannel }) => {
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
    if (this.destroyed || !data.sdp) return;
    const peer = this.peers.get(data.fromUserId);
    if (!peer) return;
    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (err) {
      this.onEvent({ type: 'error', peerId: data.fromUserId, error: `SetRemote failed: ${err}` });
    }
  };

  private handleIce = async (data: MeshSignalPayload): Promise<void> => {
    if (this.destroyed || !data.candidate) return;
    const peer = this.peers.get(data.fromUserId);
    if (!peer) return;
    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
      if (__DEV__) console.log(`[MeshClient] ICE add failed: ${err}`);
    }
  };
}
