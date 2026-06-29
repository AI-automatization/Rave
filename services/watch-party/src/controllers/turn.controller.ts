import { Request, Response } from 'express';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { config } from '../config';

// Mesh/voice need ICE servers. We proxy Metered's TURN credentials so the
// secret key never ships in the mobile bundle. Result is cached in Redis to
// avoid hitting Metered on every room join.
const CACHE_KEY = 'turn:ice-servers';
const CACHE_TTL_SECONDS = 3600; // 1h — Metered creds are long-lived
const FETCH_TIMEOUT_MS = 5000;

// STUN-only fallback — mesh still connects on friendly NAT, just not symmetric/CGNAT.
const STUN_FALLBACK: unknown[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const createTurnController = (redis: Redis) => {
  // GET /turn/credentials — returns { iceServers } for WebRTC (mesh sync + voice)
  const getCredentials = async (_req: Request, res: Response): Promise<void> => {
    if (!config.meteredDomain || !config.meteredSecretKey) {
      res.json({ iceServers: STUN_FALLBACK });
      return;
    }

    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        res.json({ iceServers: JSON.parse(cached) });
        return;
      }

      const url = `https://${config.meteredDomain}/api/v1/turn/credentials?apiKey=${config.meteredSecretKey}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!resp.ok) throw new Error(`Metered responded ${resp.status}`);
      const iceServers = await resp.json();

      await redis.set(CACHE_KEY, JSON.stringify(iceServers), 'EX', CACHE_TTL_SECONDS);
      res.json({ iceServers });
    } catch (err) {
      logger.warn('TURN credentials fetch failed — falling back to STUN', { err: String(err) });
      res.json({ iceServers: STUN_FALLBACK });
    }
  };

  return { getCredentials };
};
