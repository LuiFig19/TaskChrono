import { NextResponse } from 'next/server';

import { getKV } from '@/lib/kv';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const result: any = { ok: true, db: false, kv: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.db = true;
  } catch {}
  try {
    const kv = await getKV();
    await kv.set('tc:health', '1', 5);
    const v = await kv.get('tc:health');
    result.kv = v === '1' || v === 1 || v === '1';
  } catch {}
  return NextResponse.json(result, { status: result.db && result.kv ? 200 : 503 });
});

import { NextResponse } from 'next/server';

import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  return NextResponse.json({ status: 'ok', app: 'taskchrono' });
});
