import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { createOrgInviteToken } from '@/lib/invites';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

// Invite to active organization by email.
// Creates or finds a placeholder user but does NOT auto-add membership.
// Returns a signed token that frontend can email via Gmail deep link.
export const POST = withErrorHandling(async (request: Request) => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;

  // Find inviter's active organization
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  const org = membership?.organization;
  if (!org) return ApiErrors.unauthorized();

  // Free plan: soft cap of 4 members
  if (org.planTier === 'FREE') {
    const count = await prisma.organizationMember.count({ where: { organizationId: org.id } });
    if (count >= 4) return ApiErrors.forbidden();
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  if (!email || !/.+@.+\..+/.test(email)) return ApiErrors.badRequest('Invalid email');

  // Ensure a user record exists (skeleton is fine)
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) user = await prisma.user.create({ data: { email } });

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const token = createOrgInviteToken({ orgId: org.id, email, exp });
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const acceptUrl = `${appUrl}/?invite=${encodeURIComponent(token)}`;

  return NextResponse.json({ ok: true, token, acceptUrl });
});
