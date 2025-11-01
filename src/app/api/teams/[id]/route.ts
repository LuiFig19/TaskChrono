import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

async function requireMember(userId: string, teamId: string) {
  const m = await prisma.teamMembership.findFirst({ where: { userId, teamId } });
  return m;
}

export const GET = withErrorHandling(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    // Ensure creator is auto-added as ADMIN if missing
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return ApiErrors.notFound('Team');
    if (team.createdById === userId) {
      const m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } });
      if (!m) {
        try {
          await prisma.teamMembership.create({
            data: { teamId: id, userId, role: 'ADMIN' as any },
          });
        } catch {}
      }
    }
    const ok = await requireMember(userId, id);
    if (!ok) return ApiErrors.forbidden();
    return NextResponse.json({ id: team.id, name: team.name, description: team.description });
  },
);

export const DELETE = withErrorHandling(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    // Only admins can delete
    const membership = await prisma.teamMembership.findFirst({
      where: { teamId: id, userId },
      select: { role: true },
    });
    if (!membership || (membership.role as any) !== 'ADMIN') return ApiErrors.forbidden();
    await prisma.$transaction([
      prisma.teamMembership.deleteMany({ where: { teamId: id } }),
      prisma.teamGoal.deleteMany({ where: { teamId: id } }),
      prisma.teamNote.deleteMany({ where: { teamId: id } }),
      prisma.teamInvite.deleteMany({ where: { teamId: id } }),
      prisma.teamRoleLabel.deleteMany({ where: { teamId: id } }),
      prisma.teamActivity.deleteMany({ where: { teamId: id } }),
      prisma.team.delete({ where: { id } }),
    ] as any);
    return NextResponse.json({ ok: true });
  },
);
