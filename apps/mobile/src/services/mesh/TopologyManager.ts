// WeWatch — TopologyManager: selects mesh topology based on peer count
// ≤4 → full mesh, 5+ → Socket.io only.
//
// NOTE: 'star' topology (owner-hub relay) is NOT implemented in MeshClient — it always
// builds a full mesh (every peer connects to every peer). A full mesh above a handful of
// mobile peers means n² WebRTC connections, which burns battery and fails more often behind
// CGNAT. Until a real star/hub relay exists in MeshClient, anything above FULL_MESH_LIMIT
// falls straight to socket_only instead of a half-implemented 'star' state.
export type Topology = 'full_mesh' | 'star' | 'socket_only';

const FULL_MESH_LIMIT = 4;

export class TopologyManager {
  private currentTopology: Topology = 'full_mesh';
  private onChange: ((topology: Topology) => void) | null = null;

  /** Subscribe to topology changes */
  setOnChange(cb: (topology: Topology) => void): void {
    this.onChange = cb;
  }

  /** Recalculate topology when peer count changes */
  update(peerCount: number): Topology {
    const next = TopologyManager.select(peerCount);
    if (next !== this.currentTopology) {
      this.currentTopology = next;
      this.onChange?.(next);
    }
    return next;
  }

  get topology(): Topology {
    return this.currentTopology;
  }

  /** Pure function: select topology for given peer count (including self) */
  static select(peerCount: number): Topology {
    if (peerCount <= FULL_MESH_LIMIT) return 'full_mesh';
    // 'star' is intentionally unreachable until MeshClient implements a real hub relay —
    // see file header note. Above the full-mesh limit we drop straight to socket_only.
    return 'socket_only';
  }
}
