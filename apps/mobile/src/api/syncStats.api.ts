import { adminClient } from '@api/client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface SyncStatsPayload {
  roomId: string;
  userId?: string;
  isOwner: boolean;
  sessionStart: number;
  sessionEnd: number;
  transport: { p2pMs: number; turnMs: number; socketMs: number };
  macroSeekCount: number;
  microAdjustCount: number;
  avgDriftMs: number;
  maxDriftMs: number;
  meshConnectFailed: boolean;
  syncErrors: string[];
}

function getAppVersion(): string {
  return (Constants.expoConfig?.version ?? '0.0.0') as string;
}

export const syncStatsApi = {
  async ingest(payload: Omit<SyncStatsPayload, 'sessionEnd'>): Promise<void> {
    try {
      await adminClient.post('/sync-stats/ingest', {
        ...payload,
        sessionEnd: Date.now(),
        platform: Platform.OS,
        appVersion: getAppVersion(),
      });
    } catch {
      // silent — never block room leave for telemetry
    }
  },
};
