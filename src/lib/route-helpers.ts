import { NextResponse } from 'next/server';

import { ApiErrors } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { recordDuration, recordError, recordRequest } from '@/lib/metrics';

export type RouteHandler = (...args: any[]) => Promise<NextResponse | Response | void | null>;

/**
 * Wrap a route handler with a try/catch to ensure consistent error responses and logging.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (...args: any[]) => {
    const req = (args?.[0] as Request) || undefined;
    const url = req ? new URL(req.url) : undefined;
    const route = url?.pathname || 'unknown';
    const method = req?.method || 'GET';
    const t0 = Date.now();
    try {
      // Execute the underlying handler
      const res = await handler(...args);
      if (res == null) {
        return ApiErrors.internal('Handler returned no response');
      }
      const response = res as NextResponse | Response;
      const status = (response as any)?.status || 200;
      recordRequest({ route, method, status });
      const dt = Date.now() - t0;
      recordDuration(route, method, dt);
      if (dt > 1000) logger.warn({ route, method, status, durationMs: dt }, 'slow route');
      return response;
    } catch (error: unknown) {
      const message = (error as any)?.message || 'Internal server error';
      logger.error({ err: error }, 'Route error');
      try { Sentry.captureException(error as any); } catch {}
      recordError({ route, method, status: 500 });
      return ApiErrors.internal(message);
    }
  };
}

/**
 * Validate required HTTP header value or respond 400.
 */
export function requireHeader(request: Request, name: string): string | null {
  const value = request.headers.get(name);
  return value && value.trim() ? value : null;
}
