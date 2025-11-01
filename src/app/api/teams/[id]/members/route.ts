import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { canManageMembers, getUserTeamRole } from '@/lib/team';

export const GET = withErrorHandling(
  async (_req: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    let m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } });
    if (!m) {
      const t = await prisma.team.findUnique({ where: { id } });
      if (t?.createdById === userId) {
        try {
          await prisma.teamMembership.create({
            data: { teamId: id, userId, role: 'ADMIN' as any },
          });
        } catch {}
        m = await prisma.teamMembership.findFirst({ where: { teamId: id, userId } });
      }
    }
    if (!m) return ApiErrors.forbidden();
    const list = await prisma.teamMembership.findMany({
      where: { teamId: id },
      include: { user: true, roleLabel: true },
      orderBy: { joinedAt: 'asc' },
    });
    return NextResponse.json({
      members: list.map((x) => ({
        id: x.userId,
        name: x.user.name,
        email: x.user.email,
        role: x.role,
        roleLabelId: x.roleLabelId || null,
        roleLabelName: x.roleLabel?.name || null,
      })),
    });
  },
);

export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!canManageMembers(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
    };
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!email) return ApiErrors.missing('email');
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) user = await prisma.user.create({ data: { email } });
    try {
      await prisma.teamMembership.create({
        data: { teamId: id, userId: user.id, role: (body.role || 'MEMBER') as any },
      });
    } catch {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  },
);

export const PATCH = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!canManageMembers(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      role?: 'ADMIN' | 'MANAGER' | 'MEMBER';
      roleLabelId?: string;
    };
    const targetId = String(body.userId || '').trim();
    const newRole = body.role
      ? (String(body.role || '')
          .trim()
          .toUpperCase() as any)
      : undefined;
    if (!targetId) return ApiErrors.missing('userId');
    await prisma.teamMembership.updateMany({
      where: { teamId: id, userId: targetId },
      data: { role: newRole as any, roleLabelId: body.roleLabelId ?? undefined },
    });
    return NextResponse.json({ ok: true });
  },
);

export const DELETE = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!canManageMembers(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const targetId = String(body.userId || '').trim();
    if (!targetId) return ApiErrors.missing('userId');
    await prisma.teamMembership.deleteMany({ where: { teamId: id, userId: targetId } });
    return NextResponse.json({ ok: true });
  },
);
