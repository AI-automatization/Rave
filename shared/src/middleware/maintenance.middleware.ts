import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { adminServiceUrl, axios } from '../utils/serviceConfig';

const CACHE_TTL_MS = 30_000;

let cached = false;
let lastFetched = 0;
let fetchInFlight = false;

async function refreshCache(): Promise<void> {
  if (fetchInFlight) return;
  fetchInFlight = true;
  try {
    const res = await axios.get<{ maintenanceMode?: boolean }>(
      `${adminServiceUrl}/api/v1/admin/app-config`,
      { timeout: 3000 },
    );
    cached = res.data?.maintenanceMode === true;
    lastFetched = Date.now();
  } catch (err) {
    // Fail open: if admin service unreachable, keep previous cached value
    logger.warn('[maintenance] failed to fetch status — keeping cached value', {
      error: (err as Error).message,
      cached,
    });
    lastFetched = Date.now(); // reset timer so we don't hammer the endpoint on every request
  } finally {
    fetchInFlight = false;
  }
}

export function maintenanceGuard(req: Request, res: Response, next: NextFunction): void {
  // Always pass: health checks, internal calls, api docs, and — critically — the
  // admin control plane. `/admin/app-config` is the very status endpoint this guard
  // polls to decide whether maintenance is on; if that 503s, every service fails
  // open and stays stuck on `true` while staff lose the ability to turn it off.
  // `/admin/settings` is the toggle UI's data source. Both must never be blocked,
  // otherwise enabling maintenance permanently locks the system out of itself.
  if (
    req.path === '/health' ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/metrics') ||
    req.path.includes('/admin/app-config') ||
    req.path.includes('/admin/settings') ||
    // Operator access: staff must be able to authenticate to reach the admin panel
    // and turn maintenance off. Blocking login/refresh locks them out entirely.
    // (Regular users still see the maintenance screen at app startup and every other
    // endpoint stays 503, so allowing auth alone changes nothing for them.)
    req.path.includes('/auth/login') ||
    req.path.includes('/auth/refresh') ||
    (req.headers['x-internal-secret'] as string | undefined)
  ) {
    next();
    return;
  }

  const now = Date.now();
  const stale = now - lastFetched > CACHE_TTL_MS;

  if (stale) {
    // Refresh async — don't block the current request
    void refreshCache();
  }

  if (cached) {
    res.status(503).json({
      success: false,
      message: 'Техническое обслуживание. Попробуйте позже.',
      code: 'MAINTENANCE_MODE',
    });
    return;
  }

  next();
}
