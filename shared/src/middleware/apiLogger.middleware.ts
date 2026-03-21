import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/index';

// ── Paths to skip ────────────────────────────────────────────
const SKIP_PATHS = ['/health', '/api-docs', '/favicon.ico'];

function levelFromStatus(statusCode: number): 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

// ── Derive logs URI ──────────────────────────────────────────
// LOGS_MONGO_URI → explicit override
// MONGO_URI → replace database name with 'cinesync' (admin's DB)
function getLogsMongoUri(): string | null {
  if (process.env.LOGS_MONGO_URI) return process.env.LOGS_MONGO_URI;
  const uri = process.env.MONGO_URI;
  if (!uri) return null;
  // Replace /database_name with /cinesync (keeps query params intact)
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^/]+\/)([^/?]+)/, '$1cinesync');
}

// ── Lazy singleton connection ────────────────────────────────
let logsConn: mongoose.Connection | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ApiLogModel: mongoose.Model<any> | null = null;

const apiLogSchema = new mongoose.Schema(
  {
    service:    { type: String, required: true },
    method:     { type: String, default: '' },
    url:        { type: String, default: '' },
    statusCode: { type: Number, default: 0 },
    duration:   { type: Number, default: 0 },
    userId:     { type: String, default: null },
    ip:         { type: String, default: null },
    userAgent:  { type: String, default: null },
    level:      { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message:    { type: String, required: true },
    meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp:  { type: Date, default: Date.now },
  },
  {
    collection: 'api_logs',
    _id: true,
  },
);

apiLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
apiLogSchema.index({ service: 1, level: 1 });
apiLogSchema.index({ userId: 1 });
apiLogSchema.index({ level: 1, timestamp: -1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(): mongoose.Model<any> | null {
  if (ApiLogModel) return ApiLogModel;

  const uri = getLogsMongoUri();
  if (!uri) return null;

  try {
    logsConn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 });
    ApiLogModel = logsConn.model('ApiLog', apiLogSchema);
    return ApiLogModel;
  } catch {
    return null;
  }
}

// ── Middleware ───────────────────────────────────────────────

export function apiLogger(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SKIP_PATHS.some(p => req.path.startsWith(p))) {
      next();
      return;
    }

    const startedAt = Date.now();

    res.on('finish', () => {
      const model = getModel();
      if (!model) return; // No logs DB configured — silent skip

      const duration   = Date.now() - startedAt;
      const statusCode = res.statusCode;
      const level      = levelFromStatus(statusCode);
      const userId     = (req as AuthenticatedRequest).user?.userId ?? null;
      const ip         = req.ip ?? req.socket?.remoteAddress ?? null;
      const message    = `${req.method} ${req.path} ${statusCode} ${duration}ms`;

      // Fire-and-forget — never crash the service
      model.create({
        service: serviceName,
        method:  req.method,
        url:     req.originalUrl,
        statusCode,
        duration,
        userId,
        ip,
        userAgent: req.headers['user-agent'] ?? null,
        level,
        message,
        meta:      {},
        timestamp: new Date(startedAt),
      }).catch(() => { /* DB unavailable — silent */ });
    });

    next();
  };
}
