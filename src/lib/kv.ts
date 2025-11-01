import type { Redis } from '@upstash/redis';

type KV = {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  incr(key: string, ttlSeconds: number): Promise<number>;
};

let upstash: Redis | null = null;
let memory: Map<string, { v: any; exp: number | null }>;

function getMemory(): Map<string, { v: any; exp: number | null }> {
  const g = globalThis as any;
  if (!g.__tc_mem_kv) g.__tc_mem_kv = new Map();
  return (memory = g.__tc_mem_kv);
}

async function getRedis(): Promise<Redis | null> {
  if (upstash) return upstash;
  try {
    const { Redis } = await import('@upstash/redis');
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      upstash = new Redis({ url, token });
      return upstash;
    }
  } catch {}
  return null;
}

export async function getKV(): Promise<KV> {
  const redis = await getRedis();
  if (redis) {
    return {
      async get<T>(key: string) {
        const res = await redis.get<T | null>(key);
        return (res ?? null) as T | null;
      },
      async set<T>(key: string, value: T, ttlSeconds?: number) {
        if (ttlSeconds && ttlSeconds > 0) await redis.set(key, value, { ex: ttlSeconds });
        else await redis.set(key, value);
      },
      async incr(key: string, ttlSeconds: number) {
        const v = await redis.incr(key);
        if (v === 1 && ttlSeconds) await redis.expire(key, ttlSeconds);
        return v;
      },
    } as KV;
  }

  // Fallback memory KV (dev only)
  const mem = getMemory();
  return {
    async get<T>(key: string) {
      const e = mem.get(key);
      if (!e) return null;
      if (e.exp && e.exp < Date.now()) {
        mem.delete(key);
        return null;
      }
      return e.v as T;
    },
    async set<T>(key: string, value: T, ttlSeconds?: number) {
      mem.set(key, { v: value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
    },
    async incr(key: string, ttlSeconds: number) {
      const curr = (await this.get<number>(key)) ?? 0;
      const next = curr + 1;
      await this.set(key, next, ttlSeconds);
      return next;
    },
  } as KV;
}


