export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  const { error, userId } = await requireApiAuth();
  if (error) return NextResponse.json({ projects: [] });
  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return NextResponse.json({ projects: [] });
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  return NextResponse.json({ projects });
});
