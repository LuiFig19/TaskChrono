import { makeKey } from '@/lib/cache';
import { getKV } from '@/lib/kv';
import { NextResponse } from 'next/server';

let ratelimiter: any | null = null;
let ratelimiterReady = false;

async function getUpstashLimiter(limit: number, windowSeconds: number) {
  if (ratelimiterReady && ratelimiter) return ratelimiter;
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      ratelimiterReady = true;
      ratelimiter = null;
      return null;
    }
    const redis = new Redis({ url, token });
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s` as any),
      analytics: true,
      prefix: 'tc:rl',
    });
    ratelimiterReady = true;
    return ratelimiter;
  } catch {
    ratelimiterReady = true;
    ratelimiter = null;
    return null;
  }
}

export type RateLimitResult = { allowed: boolean; headers?: Record<string, string> };

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const upstash = await getUpstashLimiter(limit, windowSeconds);
  if (upstash) {
    const res = await upstash.limit(identifier);
    return {
      allowed: !!res?.success,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, (res?.remaining as number) ?? 0)),
      },
    };
  }

  // Fallback to KV-based counter
  const kv = await getKV();
  const key = makeKey(['rl', identifier]);
  const count = await kv.incr(key, windowSeconds);
  const remaining = Math.max(0, limit - count);
  return {
    allowed: count <= limit,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
    },
  };
}

export function rateLimitIdentifierFromRequest(request: Request): string {
  // Use IP + path; fall back to user-agent
  const url = new URL(request.url);
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'ip:unknown';
  const ua = request.headers.get('user-agent') || 'ua:unknown';
  return `${ip}:${url.pathname}:${ua.slice(0, 64)}`;
}

export function tooManyResponse(): NextResponse {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}


