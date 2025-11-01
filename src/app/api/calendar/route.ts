import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { makeKey, withCache } from '@/lib/cache';
import { ensureUserOrg, getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitIdentifierFromRequest, tooManyResponse } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return error;
  const url = new URL(request.url);
  const startStr = url.searchParams.get('start');
  const endStr = url.searchParams.get('end');
  const start = startStr
    ? new Date(startStr)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endStr
    ? new Date(endStr)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const rl = await rateLimit(rateLimitIdentifierFromRequest(request), 60, 60);
  if (!rl.allowed) return tooManyResponse();
  const key = makeKey(['cal', organizationId, start.toISOString(), end.toISOString()]);
  const events = await withCache(key, 30, async () =>
    prisma.calendarEvent.findMany({
      where: { organizationId, startsAt: { gte: start, lt: end } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, title: true, startsAt: true, description: true },
    }),
  );
  const res = NextResponse.json({ events });
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.headers.set(k, v));
  return res;
});

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  // Ensure the user has an organization in production too (prevents the
  // "optimistic then disappears" behavior when membership is missing)
  const { organizationId } = await ensureUserOrg();
  if (!organizationId) return error;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    startsAt?: string;
    endsAt?: string | null;
    description?: string | null;
  };
  const title = String(body.title || '').trim();
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (!title || !startsAt) return error;
  const defaultEnd = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const evt = await prisma.calendarEvent.create({
    data: {
      organizationId,
      title,
      description: body.description || null,
      startsAt,
      endsAt: body.endsAt ? new Date(body.endsAt) : defaultEnd,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: evt.id });
});
