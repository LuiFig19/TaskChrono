import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { broadcast } from '@/lib/chatStore';
import { ensureUserOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (req: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  const { organizationId } = await ensureUserOrg();
  if (!organizationId) return ApiErrors.unauthorized();
  const body = (await req.json().catch(() => ({}))) as any;
  const channelId = String(body.channelId || 'all');
  const text = String(body.text || '').trim();
  if (!text) return ApiErrors.missing('text');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const userName = user?.name || user?.email || 'User';
  const created = await prisma.chatMessage.create({
    data: { organizationId: organizationId as string, channelId, userId, userName, text },
  });
  const msg = {
    id: created.id,
    channelId,
    user: { id: userId, name: userName },
    text,
    ts: created.ts.getTime(),
    role:
      channelId === 'managers' ? 'Management' : channelId === 'employees' ? 'Employee' : 'Staff',
  };
  broadcast(organizationId as string, channelId, 'message', msg);
  try {
    broadcastActivity({
      type: 'chat.message',
      message: `${userName}: ${text}`,
      meta: { channelId },
    });
  } catch {}
  return NextResponse.json(msg);
});
