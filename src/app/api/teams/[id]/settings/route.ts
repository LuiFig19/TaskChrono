import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { getUserTeamRole, isAdmin } from '@/lib/team';

export const GET = withErrorHandling(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } });
    if (!m) return ApiErrors.forbidden();
    const t = await prisma.team.findUnique({ where: { id } });
    if (!t) return ApiErrors.notFound('Team');
    return NextResponse.json({ id: t.id, name: t.name, description: t.description });
  },
);

export const PUT = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!isAdmin(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
    };
    const name = String(body.name || '').trim();
    const description = (body.description || null) as string | null;
    if (!name) return ApiErrors.missing('name');
    await prisma.team.update({ where: { id }, data: { name, description } });
    return NextResponse.json({ ok: true });
  },
);

export const DELETE = withErrorHandling(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!isAdmin(role)) return ApiErrors.forbidden();
    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
