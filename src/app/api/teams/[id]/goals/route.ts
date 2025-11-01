import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
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
    const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } });
    if (!member) return ApiErrors.forbidden();
    const goals = await prisma.teamGoal.findMany({
      where: { teamId: id },
      orderBy: { updatedAt: 'desc' },
      include: {
        keyResults: true,
        updates: {
          select: { note: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    const mapped = goals.map((g: any) => ({
      id: g.id,
      teamId: g.teamId,
      ownerId: g.ownerId,
      title: g.title,
      description: g.description,
      startDate: g.startDate,
      dueDate: g.dueDate,
      status: g.status,
      progress: g.progress,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      keyResults: g.keyResults,
      // Derive starred state from most recent update note to avoid schema dependency
      starred: g.updates?.[0]?.note === 'STARRED' || false,
    }));
    return NextResponse.json({ goals: mapped });
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
      title?: string;
      description?: string;
      dueDate?: string;
    };
    const title = String(body.title || '').trim();
    if (!title) return ApiErrors.missing('title');
    const goal = await prisma.teamGoal.create({
      data: {
        teamId: id,
        ownerId: userId,
        title,
        description: body.description || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    // Log activity
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.teamActivity.create({
        data: {
          teamId: id,
          type: 'goal.created',
          actorId: userId,
          payload: {
            goalId: goal.id,
            title: goal.title,
            userName: user?.name || user?.email || 'User',
          } as any,
        },
      });
      broadcastActivity({
        type: 'goal.created',
        message: `${user?.name || 'User'} created goal ${goal.title}`,
        meta: { teamId: id, goalId: goal.id },
      });
    } catch {}
    return NextResponse.json({ id: goal.id });
  },
);

export const PUT = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const role = await getUserTeamRole(userId, id);
    if (!canManageMembers(role)) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as {
      goalId?: string;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'AT_RISK' | 'COMPLETE' | 'PAUSED';
      ownerId?: string;
    };
    const goalId = String(body.goalId || '');
    if (!goalId) return ApiErrors.missing('goalId');
    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.ownerId) updates.ownerId = body.ownerId;
    const updated = await prisma.teamGoal.update({ where: { id: goalId }, data: updates });
    // Log activity for status changes or assignments
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (body.status === 'COMPLETE') {
        await prisma.teamActivity.create({
          data: {
            teamId: id,
            type: 'goal.completed',
            actorId: userId,
            payload: {
              goalId,
              title: updated.title,
              userName: user?.name || user?.email || 'User',
            } as any,
          },
        });
        broadcastActivity({
          type: 'goal.completed',
          message: `${user?.name || 'User'} completed goal ${updated.title} 🎉`,
          meta: { teamId: id, goalId },
        });
      }
      if (body.ownerId) {
        const assignee = await prisma.user.findUnique({ where: { id: body.ownerId } });
        await prisma.teamActivity.create({
          data: {
            teamId: id,
            type: 'goal.assigned',
            actorId: userId,
            payload: {
              goalId,
              title: updated.title,
              assigneeId: body.ownerId,
              assigneeName: assignee?.name || assignee?.email || 'User',
              userName: user?.name || user?.email || 'User',
            } as any,
          },
        });
        broadcastActivity({
          type: 'goal.assigned',
          message: `${user?.name || 'User'} assigned ${updated.title} to ${assignee?.name || 'User'}`,
          meta: { teamId: id, goalId },
        });
      }
    } catch {}
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
    const { searchParams } = new URL(request.url);
    const goalId = String(searchParams.get('goalId') || '');
    if (!goalId) return ApiErrors.missing('goalId');
    await prisma.teamGoal.deleteMany({ where: { id: goalId, teamId: id } });
    return NextResponse.json({ ok: true });
  },
);
