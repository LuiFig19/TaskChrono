import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { broadcast } from '@/lib/chatStore';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (req: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const { organizationId } = await getCurrentUserAndOrg();
  if (!organizationId) return ApiErrors.unauthorized();
  const body = (await req.json().catch(() => ({}))) as any;
  const messageId = String(body.messageId || '');
  if (!messageId) return ApiErrors.missing('messageId');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const userName = user?.name || user?.email || 'User';
  try {
    await prisma.chatLike.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId, userName },
    });
  } catch {
    // If schema not migrated, skip persistence but continue broadcasting
  }
  broadcast(
    organizationId,
    (await prisma.chatMessage.findUnique({ where: { id: messageId } }))!.channelId,
    'liked',
    { messageId, userId, userName },
  );
  return NextResponse.json({ ok: true });
});
