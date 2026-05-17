import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestId = (): string | undefined =>
  requestContext.getStore()?.requestId;

export const runWithContext = <T>(
  ctx: RequestContext,
  fn: () => T,
): T => requestContext.run(ctx, fn);
