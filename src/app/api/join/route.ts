import { NextResponse } from 'next/server';

import { broadcastActivity } from '@/lib/activity';
import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { verifyOrgInviteToken } from '@/lib/invites';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const payload = verifyOrgInviteToken(token);
  if (!payload) return ApiErrors.badRequest('Invalid or expired invitation token');
  const { error, userId } = await requireApiAuth();
  // If not signed in, instruct client to show signup popup
  if (error) {
    return NextResponse.json({
      ok: true,
      needsAuth: true,
      orgId: payload.orgId,
      email: payload.email,
    });
  }
  // Create membership if missing, do not delete other memberships
  try {
    await prisma.organizationMember.create({
      data: { organizationId: payload.orgId, userId, role: 'MEMBER' as any },
    });
  } catch {}

  // Set this org as active for the user so they land in the right workspace
  try {
    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    let state: any = pref?.dashboardWidgets;
    if (!state || Array.isArray(state)) state = { orgs: {} };
    state.activeOrgId = payload.orgId;
    await prisma.userPreference.upsert({
      where: { userId },
      update: { dashboardWidgets: state as any },
      create: { userId, dashboardWidgets: state as any },
    });
  } catch {}

  // Broadcast activity for dashboards listening globally
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    broadcastActivity({
      type: 'org.member.joined',
      message: `${user?.name || user?.email || 'A user'} has joined this dashboard 🎉`,
    });
  } catch {}
  return NextResponse.json({ ok: true, needsAuth: false, orgId: payload.orgId });
});
