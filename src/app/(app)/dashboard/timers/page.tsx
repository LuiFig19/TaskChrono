import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import TimersClient from '@/features/timers/components/TimersClient';
import { auth } from '@/lib/better-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';

export default async function TimersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');
  const { organizationId, userId } = await getCurrentUserAndOrg();
  const entries =
    organizationId && userId
      ? await prisma.timeEntry.findMany({
          where: { organizationId, userId },
          orderBy: { startedAt: 'desc' },
        })
      : [];
  const timers =
    organizationId && userId
      ? await prisma.timer.findMany({
          where: { organizationId, userId },
          orderBy: { createdAt: 'desc' },
        })
      : [];
  return (
    <TimersClient
      userId={userId || ''}
      initialEntries={entries.map((e) => ({
        id: e.id,
        name: e.name,
        startedAt: e.startedAt.toISOString(),
        endedAt: e.endedAt ? e.endedAt.toISOString() : null,
        durationMin: e.durationMin ?? 0,
        timerId: e.timerId || null,
      }))}
      initialTimers={timers.map((t) => ({
        id: t.id,
        name: t.name,
        tags: t.tags || [],
        createdAt: t.createdAt.toISOString(),
        finalizedAt: t.finalizedAt ? t.finalizedAt.toISOString() : null,
      }))}
    />
  );
}
