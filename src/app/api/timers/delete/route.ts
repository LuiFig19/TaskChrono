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

  const body = await parseRequestBody<{ entryId?: string }>(request);
  const entryId = getString(body, 'entryId');

  if (!entryId) return ApiErrors.missing('entryId');

  const e = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!e || e.userId !== userId) return ApiErrors.notFound('Time entry');

  await prisma.timeEntry.delete({ where: { id: entryId } });
  emitToUser(userId, 'timer:changed', { type: 'delete', entryId });
  return successResponse();
});
