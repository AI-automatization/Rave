// WeWatch — SyncProtocol: mesh-level sync message creation + drift correction
import type { SyncMessage } from './types';

const DRIFT_FORCE_SEEK_MS = 2000;
const DRIFT_RATE_THRESHOLD_MS = 300;

export class SyncProtocol {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /** Create a play sync message */
  createPlay(currentTime: number, scheduledAt?: number): SyncMessage {
    return { type: 'play', currentTime, scheduledAt, timestamp: Date.now(), fromUserId: this.userId };
  }

  /** Create a pause sync message */
  createPause(currentTime: number, scheduledAt?: number): SyncMessage {
    return { type: 'pause', currentTime, scheduledAt, timestamp: Date.now(), fromUserId: this.userId };
  }

  /** Create a seek sync message */
  createSeek(currentTime: number, scheduledAt?: number): SyncMessage {
    return { type: 'seek', currentTime, scheduledAt, timestamp: Date.now(), fromUserId: this.userId };
  }

  /** Create a heartbeat sync message (no scheduledAt) */
  createHeartbeat(currentTime: number): SyncMessage {
    return { type: 'heartbeat', currentTime, timestamp: Date.now(), fromUserId: this.userId };
  }

  /**
   * Calculate drift correction action from a heartbeat message.
   * Returns: 'seek' if large drift, 'rate' with direction if moderate, 'none' if acceptable.
   *
   * @param clockOffset ms offset of the owner's clock relative to ours (peerClock = ourClock + offset).
   *        Measured by MeshClient's NTP-style handshake. Defaults to 0 (Socket.io path uses server time).
   */
  calcDrift(
    ownerTime: number,
    ownerTimestamp: number,
    myPosition: number,
    clockOffset = 0,
  ): { action: 'seek'; target: number } | { action: 'rate'; rate: number } | { action: 'none' } {
    // ownerTimestamp is in the owner's clock; convert elapsed time into our clock via the offset.
    const expected = ownerTime + (Date.now() - ownerTimestamp + clockOffset) / 1000;
    const driftMs = Math.abs(myPosition - expected) * 1000;

    if (driftMs > DRIFT_FORCE_SEEK_MS) {
      return { action: 'seek', target: expected };
    }
    if (driftMs > DRIFT_RATE_THRESHOLD_MS) {
      return { action: 'rate', rate: myPosition > expected ? 0.95 : 1.05 };
    }
    return { action: 'none' };
  }
}
