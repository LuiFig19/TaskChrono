import { NextResponse } from 'next/server';

import { ApiErrors } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export type RouteHandler = (...args: any[]) => Promise<NextResponse | Response | void | null>;

/**
 * Wrap a route handler with a try/catch to ensure consistent error responses and logging.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (...args: any[]) => {
    try {
      // Execute the underlying handler
      const res = await handler(...args);
      if (res == null) {
        return ApiErrors.internal('Handler returned no response');
      }
      return res as NextResponse | Response;
    } catch (error: unknown) {
      const message = (error as any)?.message || 'Internal server error';
      logger.error({ err: error }, 'Route error');
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
