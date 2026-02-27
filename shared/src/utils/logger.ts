import fs from 'fs';
import winston, { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, colorize, printf } = format;

// logs/ papkasi avtomatik yaratiladi — Winston o'zi yaratmaydi
fs.mkdirSync('logs', { recursive: true });

// Sensitive field redaction
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'authorization', 'refreshToken', 'accessToken'];

const redactSensitive = format((info) => {
  const redact = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = redact(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return redact(info as unknown as Record<string, unknown>) as winston.Logform.TransformableInfo;
})();

const devFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${message as string}${metaStr}`;
  }),
);

const prodFormat = combine(
  redactSensitive,
  timestamp(),
  json(),
);

const isDev = process.env.NODE_ENV !== 'production';
// LOG_LEVEL env orqali boshqarish mumkin: error | warn | info | http | verbose | debug | silly
const LOG_LEVEL = process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info');

const loggerTransports: winston.transport[] = [
  new transports.Console({
    format: isDev ? devFormat : prodFormat,
  }),
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new transports.File({
    filename: 'logs/combined.log',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 30,
  }),
];

// MongoDB transport — production only (avoid circular dep in dev)
if (!isDev && process.env.MONGO_URI) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MongoDB } = require('winston-mongodb') as { MongoDB: new (opts: Record<string, unknown>) => winston.transport };
  loggerTransports.push(
    new MongoDB({
      db: process.env.MONGO_URI,
      collection: 'api_logs',
      level: 'info',
      options: { useUnifiedTopology: true },
      format: prodFormat,
    }),
  );
}

export const logger = createLogger({
  level: LOG_LEVEL,
  transports: loggerTransports,
  exitOnError: false,
});

// Morgan stream for HTTP request logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
