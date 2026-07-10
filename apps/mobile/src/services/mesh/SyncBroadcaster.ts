// WeWatch — SyncBroadcaster: fast mesh overlay for sync (DataChannel).
// The authoritative Socket.io path is owned by useWatchParty (emit*); this broadcaster only
// delivers the low-latency mesh copy when a mesh is up. Members dedupe via meshFresh().
import { AppState, type AppStateStatus } from 'react-native';
import { MeshClient } from './MeshClient';
import { SyncProtocol } from './SyncProtocol';
import { TopologyManager, type Topology } from './TopologyManager';
import type { MeshEvent, MeshTransportType, SyncMessage } from './types';

export interface SyncBroadcasterConfig {
  userId: string;
  roomId: string;
  isOwner: boolean;
  /** clockOffset (ms) is the sender peer's clock offset vs ours; undefined on Socket.io path */
  onSyncMessage: (msg: SyncMessage, clockOffset?: number) => void;
  onTopologyChange?: (topology: Topology) => void;
  onPeerCountChange?: (count: number) => void;
  /** Fires once a peer's mesh connection settles — tells the UI whether sync is going direct
   * P2P or through the TURN relay. Does not fire again on disconnect; the consumer falls back
   * to treating sync as 'socket' once mesh goes quiet (see useWatchParty's meshFresh). */
  onTransportChange?: (transport: MeshTransportType) => void;
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
    // Socket.io is intentionally NOT sent from here. useWatchParty's emit* already sends
    // every action over the socket directly — that is the authoritative path: the server
    // updates Redis (late-join seed + admin monitoring) and relays VIDEO_* to all members.
    // This broadcaster only adds the faster mesh overlay on top; members dedupe the slower
    // socket copy via meshFresh(). Emitting socket here too caused a double emit
    // (2× syncState → 2× Redis/Mongo writes and double seeks on members).
    const meshAvailable = this.meshClient && this.meshClient.connectedCount > 0;
    if (meshAvailable && this.topologyManager.topology !== 'socket_only') {
      this.meshClient!.broadcast(msg);
    }
  }

  private startMesh(): void {
    if (this.meshClient || this.destroyed) return;
    // No react-native-webrtc (e.g. Expo Go) → stay on Socket.io path only.
    if (!MeshClient.isSupported()) return;

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
          this.config.onSyncMessage(event.syncMessage, event.clockOffset);
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
      case 'transport':
        if (event.transportType) this.config.onTransportChange?.(event.transportType);
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
