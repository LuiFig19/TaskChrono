import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';

export const GET = withErrorHandling(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { error, userId } = await requireApiAuth();
    if (error) return error;
    const { id } = await context.params;
    const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } });
    if (!member) return ApiErrors.forbidden();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';
    // Determine date window
    const now = new Date();
    let start = new Date(now);
    if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - (day - 1));
      start.setHours(0, 0, 0, 0);
    }
    // Team members
    const memberships = await prisma.teamMembership.findMany({
      where: { teamId: id },
      include: { user: true },
    });
    const userIds = memberships.map((m) => m.userId);
    if (userIds.length === 0) return NextResponse.json({ range, byUser: [], byDay: [] });
    // Pull entries for members
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        endedAt: { not: null },
        startedAt: { gte: start },
      },
      select: { userId: true, startedAt: true, durationMin: true },
    });
    // Aggregate by user (hours)
    const byUserMap = new Map<string, number>();
    for (const e of entries) {
      byUserMap.set(e.userId, (byUserMap.get(e.userId) || 0) + (e.durationMin || 0));
    }
    const byUser = memberships
      .map((m) => ({
        userId: m.userId,
        name: m.user?.name || m.user?.email || 'Member',
        hours: (byUserMap.get(m.userId) || 0) / 60,
      }))
      .filter((x) => x.hours > 0 || entries.length === 0);
    // Aggregate by day (hours)
    const days: { key: string; label: string }[] = [];
    if (range === 'month') {
      const month = start.getMonth();
      const year = start.getFullYear();
      const d = new Date(year, month, 1);
      while (d.getMonth() === month) {
        days.push({ key: d.toISOString().slice(0, 10), label: String(d.getDate()) });
        d.setDate(d.getDate() + 1);
      }
    } else {
      const base = new Date(start);
      for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        days.push({
          key: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        });
      }
    }
    const dayTotalsMap = new Map<string, number>();
    for (const e of entries) {
      const key = new Date(e.startedAt).toISOString().slice(0, 10);
      dayTotalsMap.set(key, (dayTotalsMap.get(key) || 0) + (e.durationMin || 0));
    }
    const byDay = days.map((d) => ({ day: d.label, hours: (dayTotalsMap.get(d.key) || 0) / 60 }));
    return NextResponse.json({ range, byUser, byDay });
  },
);
