import { Request, Response, NextFunction } from 'express';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      deviceInfo?: DeviceInfo;
    }
  }
}

export function deviceInfoMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent'] ?? 'unknown';
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';

  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    deviceType = 'mobile';
  }

  req.deviceInfo = { userAgent, ip, deviceType };
  next();
}
