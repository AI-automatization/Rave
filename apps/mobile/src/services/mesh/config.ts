// WeWatch — Mesh WebRTC config
// Real ICE servers (TURN + STUN) come from getIceServers() in iceServers.ts, which fetches
// TURN credentials from the backend and caches them for the session. `iceServers` below is
// a sync STUN-only fallback for the one call site that can't await that fetch
// (MeshClient.createPeerConnection's .catch()) — it previously also carried a dead TURN
// hardcode pointing at a.relay.metered.ca with EXPO_PUBLIC_TURN_* env vars that don't exist
// anywhere in the project, which was misleading. Removed; STUN only.
import type { MeshConfig } from './types';

const DATA_CHANNEL_LABEL = 'cinesync-sync';

export const meshConfig: MeshConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  dataChannelLabel: DATA_CHANNEL_LABEL,
};
