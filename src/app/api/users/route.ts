import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!membership?.organization) return error;
  const org = membership.organization;

  // Enforce FREE tier member cap: up to 4 members
  if (org.planTier === 'FREE') {
    const count = await prisma.organizationMember.count({ where: { organizationId: org.id } });
    if (count >= 4) return error;
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  };
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  if (!email) return error;

  // Find or create user skeleton
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }
  try {
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: user.id, role: body.role || ('MEMBER' as any) },
    });
  } catch {
    return NextResponse.json({ error: 'User already a member' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
});
