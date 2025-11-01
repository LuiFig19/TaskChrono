import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const DELETE = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { organizationId } = await getCurrentUserAndOrg();
    if (!organizationId) return error;
    const { id } = await params;
    try {
      await prisma.calendarEvent.delete({ where: { id } });
    } catch {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  },
);
