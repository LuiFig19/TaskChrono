import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/realtime';
import { parseRequestBody } from '@/lib/request-utils';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  const { error } = await requireApiAuth();
  if (error) return error;
  const { organizationId, userId } = await getCurrentUserAndOrg();
  if (!organizationId || !userId) return ApiErrors.unauthorized();

  const body = await parseRequestBody<{ name?: string; notes?: string; timerId?: string }>(request);
  const requestedName = (body.name || '').trim().slice(0, 120);
  let timerId = body.timerId || null;

  if (!timerId) {
    const timer = await prisma.timer.create({
      data: {
        organizationId,
        userId,
        name: requestedName || 'Timer',
        notes: body.notes?.slice(0, 2000),
      },
    });
    timerId = timer.id;
    await prisma.timeEntry.create({
      data: {
        organizationId,
        userId,
        name: requestedName || 'Timer',
        timerId: timerId!,
        startedAt: new Date(),
        notes: body.notes?.slice(0, 2000),
      },
    });
  } else {
    const active = await prisma.timeEntry.findFirst({
      where: { organizationId, userId, timerId, endedAt: null },
    });
    if (!active) {
      const timer = await prisma.timer.findUnique({ where: { id: timerId } });
      const effectiveName = timer?.name || requestedName || 'Timer';
      await prisma.timeEntry.create({
        data: {
          organizationId,
          userId,
          name: effectiveName,
          timerId: timerId!,
          startedAt: new Date(),
        },
      });
    }
  }

  emitToUser(userId, 'timer:changed', { type: 'start', timerId });
  try {
    broadcastActivity({ type: 'timer.start', message: 'Timer started', meta: { timerId } });
  } catch {}
  return successResponse();
});
