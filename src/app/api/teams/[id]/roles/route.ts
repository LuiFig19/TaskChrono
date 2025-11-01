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
    const roles = await prisma.teamRoleLabel.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ roles });
  },
);

export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!isAdmin(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = String(body.name || '').trim();
    if (!name) return ApiErrors.missing('name');
    const r = await prisma.teamRoleLabel.create({ data: { teamId: id, name } });
    return NextResponse.json({ id: r.id });
  },
);

export const DELETE = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!isAdmin(role)) return ApiErrors.forbidden();
    const { searchParams } = new URL(request.url);
    const roleId = String(searchParams.get('roleId') || '');
    if (!roleId) return ApiErrors.missing('roleId');
    await prisma.teamRoleLabel.deleteMany({ where: { id: roleId, teamId: id } });
    // Clear any member references to this label
    await prisma.teamMembership.updateMany({
      where: { teamId: id, roleLabelId: roleId },
      data: { roleLabelId: null },
    });
    return NextResponse.json({ ok: true });
  },
);
