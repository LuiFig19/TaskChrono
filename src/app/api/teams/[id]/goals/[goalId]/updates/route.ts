import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string; goalId: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id, goalId } = await context.params;
    const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } });
    if (!member) return ApiErrors.forbidden();
    const body = (await request.json().catch(() => ({}))) as {
      note?: string;
      progress?: number;
      starred?: boolean;
    };
    const noteVal =
      typeof body.starred === 'boolean'
        ? body.starred
          ? 'STARRED'
          : 'UNSTARRED'
        : body.note || null;
    const update = await prisma.teamGoalUpdate.create({
      data: {
        goalId,
        authorId: userId,
        note: noteVal,
        progress: typeof body.progress === 'number' ? body.progress : null,
      },
    });
    if (typeof body.starred === 'boolean') {
      await prisma.teamGoal.update({ where: { id: goalId }, data: { starred: body.starred } });
    }
    try {
      const goal = await prisma.teamGoal.findUnique({ where: { id: goalId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const type =
        typeof body.starred === 'boolean'
          ? body.starred
            ? 'goal.starred'
            : 'goal.unstarred'
          : 'goal.updated';
      await prisma.teamActivity.create({
        data: {
          teamId: id,
          type,
          actorId: userId,
          payload: {
            goalId,
            title: goal?.title,
            userName: user?.name || user?.email || 'User',
          } as any,
        },
      });
      broadcastActivity({
        type,
        message: `${user?.name || 'User'} ${type === 'goal.starred' ? 'starred' : type === 'goal.unstarred' ? 'unstarred' : 'updated'} goal ${goal?.title}`,
        meta: { teamId: id, goalId },
      });
    } catch {}
    return NextResponse.json({ id: update.id });
  },
);
