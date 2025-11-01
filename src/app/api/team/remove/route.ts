import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;

  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return error;

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  if (!email) return error;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });

  await prisma.organizationMember.deleteMany({ where: { organizationId, userId: user.id } });
  return NextResponse.json({ ok: true });
});
