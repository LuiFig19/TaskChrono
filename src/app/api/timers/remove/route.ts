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

  const body = await parseRequestBody<{ timerId?: string }>(request);
  const timerId = getString(body, 'timerId');

  if (!timerId) return ApiErrors.missing('timerId');

  const timer = await prisma.timer.findFirst({ where: { id: timerId } });
  if (!timer || timer.userId !== userId) return ApiErrors.notFound('Timer');

  await prisma.timeEntry.deleteMany({ where: { timerId } });
  try {
    await prisma.timer.delete({ where: { id: timerId } });
  } catch {}
  emitToUser(userId, 'timer:changed', { type: 'remove', timerId });
  return successResponse();
});
