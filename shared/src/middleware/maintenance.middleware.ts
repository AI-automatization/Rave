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
  // Always pass: health checks, internal service calls, admin routes, api docs
  if (
    req.path === '/health' ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/metrics') ||
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
