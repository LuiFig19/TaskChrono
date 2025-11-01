import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

type Body = {
  email?: string;
  tier?: 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM';
  userId?: string;
  organizationId?: string;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const POST = withErrorHandling(async (req: Request) => {
  const adminToken = req.headers.get('x-admin-token') || new URL(req.url).searchParams.get('token');
  if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body | null = null;
  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      body = {
        email: String(form.get('email') || ''),
        tier: (String(form.get('tier') || '') as Body['tier']) || undefined,
        userId: String(form.get('userId') || ''),
        organizationId: String(form.get('organizationId') || ''),
      };
    }
  } catch {}

  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const desiredTier = body.tier || 'ENTERPRISE';
  if (!['FREE', 'BUSINESS', 'ENTERPRISE', 'CUSTOM'].includes(desiredTier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Resolve target organization(s)
  let organizationIds: string[] = [];

  try {
    if (body.organizationId) {
      organizationIds = [body.organizationId];
    } else {
      let targetUserId = body.userId;
      if (!targetUserId && body.email) {
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        targetUserId = user.id;
      }

      if (!targetUserId) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

      const memberships = await prisma.organizationMember.findMany({
        where: { userId: targetUserId },
        select: { organizationId: true },
      });
      organizationIds = memberships.map((m) => m.organizationId);
    }

    if (!organizationIds.length) {
      return NextResponse.json({ error: 'No organizations found for target' }, { status: 404 });
    }

    const future = addDays(new Date(), 3650); // ~10 years
    const result = await prisma.organization.updateMany({
      where: { id: { in: organizationIds } },
      data: { planTier: desiredTier as any, trialEndsAt: future },
    });

    return NextResponse.json({ updated: result.count, organizationIds, tier: desiredTier });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update tier', detail: String(error?.message || error) },
      { status: 500 },
    );
  }
});
