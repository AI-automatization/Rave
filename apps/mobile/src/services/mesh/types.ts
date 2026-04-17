// CineSync — Mesh WebRTC types
import type { SyncMessage, MeshSignalPayload } from '@app-types/index';

export type { SyncMessage, MeshSignalPayload };

export interface MeshConfig {
  iceServers: RTCIceServer[];
  dataChannelLabel: string;
}

export interface MeshPeer {
  userId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  isConnected: boolean;
}

export type MeshEventType = 'sync' | 'connected' | 'disconnected' | 'error';

export interface MeshEvent {
  type: MeshEventType;
  peerId?: string;
  syncMessage?: SyncMessage;
  error?: string;
}

export type MeshEventHandler = (event: MeshEvent) => void;
