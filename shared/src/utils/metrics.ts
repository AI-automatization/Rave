import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import type { Application, RequestHandler } from 'express';

let _registry: Registry | null = null;
export let httpRequestsTotal: Counter<string> | null = null;
export let httpRequestDuration: Histogram<string> | null = null;

export const initMetrics = (serviceName: string): Registry => {
  _registry = new Registry();
  _registry.setDefaultLabels({ service: serviceName });
  collectDefaultMetrics({ register: _registry });

  httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [_registry],
  });

  httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [_registry],
  });

  return _registry;
};

export const metricsMiddleware = (): RequestHandler => (req, res, next) => {
  if (!httpRequestsTotal || !httpRequestDuration) return next();
  const start = Date.now();
  res.on('finish', () => {
    const route = (req.route?.path as string | undefined) ?? req.path ?? 'unknown';
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestsTotal!.inc(labels);
    httpRequestDuration!.observe(labels, (Date.now() - start) / 1000);
  });
  next();
};

export const registerMetricsEndpoint = (app: Application): void => {
  app.get('/metrics', async (_req, res) => {
    if (!_registry) { res.status(503).end('metrics not initialized'); return; }
    try {
      res.set('Content-Type', _registry.contentType);
      res.end(await _registry.metrics());
    } catch {
      res.status(500).end();
    }
  });
};
