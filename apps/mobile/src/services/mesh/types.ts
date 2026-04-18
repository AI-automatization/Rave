// CineSync — Mesh WebRTC types
// react-native-webrtc exports EventTarget-based classes; we use
// loose interface wrappers to avoid conflicts with global WebRTC types.
import type { SyncMessage, MeshSignalPayload } from '@app-types/index';

export type { SyncMessage, MeshSignalPayload };

export interface MeshConfig {
  iceServers: RTCIceServer[];
  dataChannelLabel: string;
}

/** Loose peer wrapper — avoids react-native-webrtc vs global type conflicts */
export interface MeshPeer {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataChannel: any;
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
