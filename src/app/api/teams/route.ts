import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async () => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const memberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
  return NextResponse.json({
    teams: memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      description: m.team.description,
      memberCount: (m.team as any)._count?.members ?? 0,
      lastActivityAt: (m.team as any).activities?.[0]?.createdAt || (m.team as any).updatedAt,
    })),
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  // Accept JSON or form submissions
  let name = '';
  let description: string | null = null;
  const ctype = request.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
    };
    name = String(body.name || '').trim();
    description = body.description ? String(body.description) : null;
  } else {
    const fd = await request.formData().catch(() => null);
    if (fd) {
      name = String(fd.get('name') || '').trim();
      description = (fd.get('description') ? String(fd.get('description')) : '').trim() || null;
    }
  }
  if (!name) return error;
  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({ data: { name, description, createdById: userId } });
    await tx.teamMembership.create({ data: { teamId: t.id, userId, role: 'ADMIN' as any } });
    return t;
  });
  return NextResponse.json({ id: team.id });
});
