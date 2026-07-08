// WeWatch — SyncProtocol: mesh-level sync message creation + drift correction
import type { SyncMessage } from './types';

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
}
// NOTE: drift correction lives in useWatchPartyRoom (dual-mode macro/micro sync). An earlier
// calcDrift() here was never wired up and drifted out of sync with the real logic — removed.
