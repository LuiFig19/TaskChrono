export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { makeKey, withCache } from '@/lib/cache';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitIdentifierFromRequest, tooManyResponse } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return NextResponse.json({ projects: [] });
  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return NextResponse.json({ projects: [] });
  // Basic rate limit per IP+path
  const rl = await rateLimit(rateLimitIdentifierFromRequest(request), 60, 60);
  if (!rl.allowed) return tooManyResponse();

  const key = makeKey(['proj:list', organizationId]);
  const projects = await withCache(key, 30, async () =>
    prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    }),
  );
  const res = NextResponse.json({ projects });
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.headers.set(k, v));
  return res;
});
