import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const POST = withErrorHandling(async (request: Request) => {
  try {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const form = await request.formData();
    const id = String(form.get('id') || '');
    const name = String(form.get('name') || '').trim();
    const color = String(form.get('brandColor') || '').trim();
    if (!id) return error;

    if (name) {
      await prisma.organization.update({ where: { id }, data: { name } });
    }

    if (color) {
      const pref = await prisma.userPreference.findUnique({ where: { userId } });
      let state: any = pref?.dashboardWidgets;
      if (!state || Array.isArray(state)) state = { orgs: {} };
      if (!state.orgs) state.orgs = {};
      if (!state.orgs[id]) state.orgs[id] = {};
      state.orgs[id].brandColor = color;
      await prisma.userPreference.upsert({
        where: { userId },
        update: { dashboardWidgets: state as any },
        create: { userId, dashboardWidgets: state as any },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});
