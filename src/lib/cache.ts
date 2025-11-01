import { getKV } from '@/lib/kv';

export async function withCache<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const kv = await getKV();
  const hit = await kv.get<T>(key);
  if (hit != null) return hit as T;
  const data = await loader();
  try {
    await kv.set(key, data, ttlSeconds);
  } catch {}
  return data;
}

export function makeKey(parts: Array<string | number | null | undefined>): string {
  return 'tc:' + parts.map((p) => (p == null ? '-' : String(p))).join(':');
}


