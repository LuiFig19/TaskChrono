import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const org = await prisma.organization.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    });
    if (!org) return ApiErrors.notFound('Organization');

    // Brand color is stored per-user in UserPreference.dashboardWidgets under orgs[orgId].brandColor
    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    let brandColor: string | null = null;
    try {
      const state = pref?.dashboardWidgets as any;
      if (state && typeof state === 'object') {
        const orgs = state.orgs || {};
        brandColor = orgs?.[org.id]?.brandColor || null;
      }
    } catch {}

    return NextResponse.json({ id: org.id, name: org.name, brandColor });
  },
);
