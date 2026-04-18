// CineSync — SyncBroadcaster: dual-path sync (mesh DataChannel + Socket.io fallback)
// Chooses path based on TopologyManager topology and mesh connection state
import { AppState, type AppStateStatus } from 'react-native';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import { MeshClient } from './MeshClient';
import { SyncProtocol } from './SyncProtocol';
import { TopologyManager, type Topology } from './TopologyManager';
import type { MeshEvent, SyncMessage } from './types';

export interface SyncBroadcasterConfig {
  userId: string;
  roomId: string;
  isOwner: boolean;
  onSyncMessage: (msg: SyncMessage) => void;
  onTopologyChange?: (topology: Topology) => void;
  onPeerCountChange?: (count: number) => void;
}

export class SyncBroadcaster {
  private meshClient: MeshClient | null = null;
  private syncProtocol: SyncProtocol;
  private topologyManager: TopologyManager;
  private config: SyncBroadcasterConfig;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private destroyed = false;
  private peerCount = 1; // self

  constructor(config: SyncBroadcasterConfig) {
    this.config = config;
    this.syncProtocol = new SyncProtocol(config.userId);
    this.topologyManager = new TopologyManager();

    this.topologyManager.setOnChange((topology) => {
      config.onTopologyChange?.(topology);
      this.handleTopologyChange(topology);
    });
  }

  /** Start mesh + Socket.io listeners + AppState tracking */
  start(): void {
    if (this.destroyed) return;

    // Start mesh (unless socket_only)
    const topology = this.topologyManager.update(this.peerCount);
    if (topology !== 'socket_only') {
      this.startMesh();
    }

    // AppState listener: background → destroy mesh, foreground → reconnect
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
  }

  /** Send sync action to all peers via best available path */
  broadcastPlay(currentTime: number, scheduledAt?: number): void {
    const msg = this.syncProtocol.createPlay(currentTime, scheduledAt);
    this.send(msg);
  }

  broadcastPause(currentTime: number, scheduledAt?: number): void {
    const msg = this.syncProtocol.createPause(currentTime, scheduledAt);
    this.send(msg);
  }

  broadcastSeek(currentTime: number, scheduledAt?: number): void {
    const msg = this.syncProtocol.createSeek(currentTime, scheduledAt);
    this.send(msg);
  }

  broadcastHeartbeat(currentTime: number): void {
    const msg = this.syncProtocol.createHeartbeat(currentTime);
    this.send(msg);
  }

  /** Get current topology */
  get topology(): Topology {
    return this.topologyManager.topology;
  }

  /** Get connected peer count */
  get connectedPeers(): number {
    return this.meshClient?.connectedCount ?? 0;
  }

  /** Cleanup everything */
  destroy(): void {
    this.destroyed = true;
    this.destroyMesh();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }

  // ── Private ───────────────────────────────────────────────────────

  private send(msg: SyncMessage): void {
    const topology = this.topologyManager.topology;
    const meshAvailable = this.meshClient && this.meshClient.connectedCount > 0;

    if (topology === 'socket_only' || !meshAvailable) {
      // Socket.io only path
      this.sendViaSocket(msg);
    } else {
      // Mesh primary + Socket.io as backup for unconnected peers
      this.meshClient?.broadcast(msg);
      // If not all peers connected via mesh, also send via socket
      if (this.meshClient && this.meshClient.connectedCount < this.peerCount - 1) {
        this.sendViaSocket(msg);
      }
    }
  }

  private sendViaSocket(msg: SyncMessage): void {
    const socket = getSocket();
    if (!socket) return;

    switch (msg.type) {
      case 'play':
        socket.emit(CLIENT_EVENTS.PLAY, { roomId: this.config.roomId, currentTime: msg.currentTime });
        break;
      case 'pause':
        socket.emit(CLIENT_EVENTS.PAUSE, { roomId: this.config.roomId, currentTime: msg.currentTime });
        break;
      case 'seek':
        socket.emit(CLIENT_EVENTS.SEEK, { roomId: this.config.roomId, currentTime: msg.currentTime });
        break;
      case 'heartbeat':
        socket.emit(CLIENT_EVENTS.HEARTBEAT, { roomId: this.config.roomId, currentTime: msg.currentTime });
        break;
    }
  }

  private startMesh(): void {
    if (this.meshClient || this.destroyed) return;

    this.meshClient = new MeshClient(
      this.config.userId,
      this.config.roomId,
      this.handleMeshEvent,
    );
    this.meshClient.join();
  }

  private destroyMesh(): void {
    this.meshClient?.destroy();
    this.meshClient = null;
  }

  private handleMeshEvent = (event: MeshEvent): void => {
    if (this.destroyed) return;

    switch (event.type) {
      case 'sync':
        if (event.syncMessage) {
          this.config.onSyncMessage(event.syncMessage);
        }
        break;
      case 'connected':
        this.peerCount = (this.meshClient?.connectedCount ?? 0) + 1;
        this.topologyManager.update(this.peerCount);
        this.config.onPeerCountChange?.(this.peerCount);
        break;
      case 'disconnected':
        this.peerCount = Math.max(1, (this.meshClient?.connectedCount ?? 0) + 1);
        this.topologyManager.update(this.peerCount);
        this.config.onPeerCountChange?.(this.peerCount);
        break;
      case 'error':
        if (__DEV__) console.log('[SyncBroadcaster] mesh error:', event.error);
        break;
    }
  };

  private handleTopologyChange(topology: Topology): void {
    if (topology === 'socket_only') {
      // Too many peers — destroy mesh, rely on Socket.io
      this.destroyMesh();
    } else if (!this.meshClient && !this.destroyed) {
      // Peers dropped below threshold — restart mesh
      this.startMesh();
    }
  }

  private handleAppState = (state: AppStateStatus): void => {
    if (this.destroyed) return;

    if (state === 'background' || state === 'inactive') {
      // Background — destroy mesh connections (save battery/data)
      this.destroyMesh();
    } else if (state === 'active') {
      // Foreground — reconnect mesh if topology allows
      const topology = this.topologyManager.update(this.peerCount);
      if (topology !== 'socket_only') {
        this.startMesh();
      }
    }
  };
}
