import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { organizationId } = await getCurrentUserAndOrg();
    if (!organizationId) return error;
    const body = (await req.json()) as any;
    const status = String(body.status || '').toUpperCase();
    await prisma.invoice.update({ where: { id: params.id }, data: { status: status as any } });
    return NextResponse.json({ ok: true });
  },
);
