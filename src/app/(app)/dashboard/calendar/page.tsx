import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import CalendarClient from '@/features/calendar/components/CalendarClient';
import { auth } from '@/lib/better-auth';
import { getCurrentUserAndOrg } from '@/lib/org';
import { prisma } from '@/lib/prisma';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; month?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');
  const { organizationId } = await getCurrentUserAndOrg();
  const sp = await searchParams;
  const monthParam = typeof sp?.month === 'string' ? sp.month : '';
  const defaultWhen = typeof (sp as any)?.d === 'string' ? (sp as any).d : '';
  // Compute month range; handle tokens like "prev"/"next" and invalid dates gracefully
  let base = new Date();
  if (monthParam) {
    if (monthParam === 'prev' || monthParam === 'next') {
      const offset = monthParam === 'prev' ? -1 : 1;
      base = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    } else {
      const parsed = new Date(monthParam);
      if (!isNaN(parsed.getTime())) base = parsed;
    }
  }
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const events = organizationId
    ? await prisma.calendarEvent.findMany({
        where: { organizationId, startsAt: { gte: start, lt: end } },
        orderBy: { startsAt: 'asc' },
      })
    : [];

  return (
    <CalendarClient
      defaultWhen={defaultWhen}
      monthStart={start.toISOString()}
      monthEnd={end.toISOString()}
      initialEvents={events.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        description: e.description,
      }))}
    />
  );
}
