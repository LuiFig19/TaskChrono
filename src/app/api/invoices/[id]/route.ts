import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { organizationId } = await getCurrentUserAndOrg();
    if (!organizationId) return error;
    await prisma.invoice.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
);
