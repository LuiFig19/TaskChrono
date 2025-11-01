import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors, successResponse } from '@/lib/api-response';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/realtime';
import { getString, parseRequestBody } from '@/lib/request-utils';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  const { error } = await requireApiAuth();
  if (error) return error;
  const { organizationId, userId } = await getCurrentUserAndOrg();
  if (!organizationId || !userId) return ApiErrors.unauthorized();

  const end = new Date();
  const body = await parseRequestBody<{ timerId?: string; entryId?: string }>(request);
  const timerId = getString(body, 'timerId');
  const entryId = getString(body, 'entryId');

  // If entryId provided, close that exact entry
  if (entryId) {
    const e = await prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (e && e.userId === userId && e.endedAt == null) {
      const durationMin = Math.max(
        0,
        Math.round((end.getTime() - new Date(e.startedAt).getTime()) / 60000),
      );
      await prisma.timeEntry.update({ where: { id: e.id }, data: { endedAt: end, durationMin } });
      emitToUser(userId, 'timer:changed', { type: 'stop', entryId: e.id, timerId: e.timerId });
      return successResponse();
    }
    return successResponse();
  }

  const where = timerId
    ? { organizationId, userId, endedAt: null, timerId }
    : { organizationId, userId, endedAt: null };
  const active = await prisma.timeEntry.findFirst({ where, orderBy: { startedAt: 'desc' } });
  if (!active) return successResponse();

  const durationMin = Math.max(
    0,
    Math.round((end.getTime() - new Date(active.startedAt).getTime()) / 60000),
  );
  await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: end, durationMin } });
  emitToUser(userId, 'timer:changed', { type: 'stop', entryId: active.id, timerId });
  try {
    broadcastActivity({
      type: 'timer.stop',
      message: 'Timer paused',
      meta: { timerId, entryId: active.id },
    });
  } catch {}
  return successResponse();
});
