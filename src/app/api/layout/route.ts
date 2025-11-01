export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

function parseDashboard(url: URL): string {
  const k = url.searchParams.get('dashboard') || 'main';
  return k.trim() || 'main';
}

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const dashboard = parseDashboard(url);
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const row = await prisma.widgetLayout.findUnique({
    where: { userId_dashboard: { userId, dashboard } },
  });
  return NextResponse.json({ layout: (row?.layout as any) ?? null, dashboard }, { status: 200 });
});

export const PUT = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const dashboard = parseDashboard(url);
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) as { layout?: any[] };
  if (!Array.isArray(body.layout)) return error;
  await prisma.widgetLayout.upsert({
    where: { userId_dashboard: { userId, dashboard } },
    update: { layout: body.layout as any },
    create: { userId, dashboard, layout: body.layout as any },
  });
  return NextResponse.json({ ok: true }, { status: 200 });
});

export const DELETE = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const dashboard = parseDashboard(url);
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  await prisma.widgetLayout
    .delete({ where: { userId_dashboard: { userId, dashboard } } })
    .catch(() => null);
  return NextResponse.json({ ok: true }, { status: 200 });
});
