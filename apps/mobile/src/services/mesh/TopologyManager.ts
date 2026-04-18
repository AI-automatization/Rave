// CineSync — TopologyManager: selects mesh topology based on peer count
// ≤6 → full mesh, 7-15 → star (owner hub), 16+ → Socket.io only

export type Topology = 'full_mesh' | 'star' | 'socket_only';

const FULL_MESH_LIMIT = 6;
const STAR_LIMIT = 15;

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
    if (peerCount <= STAR_LIMIT) return 'star';
    return 'socket_only';
  }
}
