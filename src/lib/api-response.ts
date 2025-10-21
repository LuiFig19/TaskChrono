import { NextResponse } from 'next/server'

/**
 * Standard API response types
 */
export type ApiSuccess<T = Record<string, any>> = {
  ok: true
  data?: T
}

export type ApiError = {
  ok: false
  error: string
}

/**
 * Creates a standardized success response
 */
export function successResponse<T = Record<string, any>>(data?: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, ...(data ? { data } : {}) })
}

/**
 * Creates a standardized error response
 */
export function errorResponse(message: string, status: number = 400): NextResponse<ApiError> {
  return NextResponse.json({ ok: false, error: message }, { status })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse('Unauthorized', 401),
  forbidden: () => errorResponse('Forbidden', 403),
  notFound: (resource: string = 'Resource') => errorResponse(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request') => errorResponse(message, 400),
  conflict: (message: string = 'Resource already exists') => errorResponse(message, 409),
  internal: (message: string = 'Internal server error') => errorResponse(message, 500),
  missing: (field: string) => errorResponse(`Missing required field: ${field}`, 400),
}
