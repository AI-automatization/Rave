// CineSync — Mesh WebRTC config (ICE servers)
import type { MeshConfig } from './types';

const DATA_CHANNEL_LABEL = 'cinesync-sync';

export const meshConfig: MeshConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Metered.ca free tier TURN (50GB/month)
    // Replace with env vars in production
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: process.env.EXPO_PUBLIC_TURN_USERNAME ?? '',
      credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL ?? '',
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: process.env.EXPO_PUBLIC_TURN_USERNAME ?? '',
      credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL ?? '',
    },
  ],
  dataChannelLabel: DATA_CHANNEL_LABEL,
};
