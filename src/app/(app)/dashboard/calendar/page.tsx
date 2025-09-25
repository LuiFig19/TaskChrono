import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUserAndOrg, getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent, deleteCalendarEvent } from './actions'
import MonthGrid from './MonthGrid'
import CalendarClient from './ui/CalendarClient'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ d?: string; month?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const plan = await getUserPlanServer()
  const { organizationId } = await getCurrentUserAndOrg()
  const sp = await searchParams
  const monthParam = typeof sp?.month === 'string' ? sp.month : ''
  const defaultWhen = typeof (sp as any)?.d === 'string' ? (sp as any).d : ''
  // Compute month range; handle tokens like "prev"/"next" and invalid dates gracefully
  let base = new Date()
  if (monthParam) {
    if (monthParam === 'prev' || monthParam === 'next') {
      const offset = monthParam === 'prev' ? -1 : 1
      base = new Date(base.getFullYear(), base.getMonth() + offset, 1)
    } else {
      const parsed = new Date(monthParam)
      if (!isNaN(parsed.getTime())) base = parsed
    }
  }
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  const events = organizationId
    ? await prisma.calendarEvent.findMany({
        where: { organizationId, startsAt: { gte: start, lt: end } },
        orderBy: { startsAt: 'asc' },
      })
    : []

  return (
    <CalendarClient
      defaultWhen={defaultWhen}
      monthStart={start.toISOString()}
      monthEnd={end.toISOString()}
      initialEvents={events.map(e => ({ id: e.id, title: e.title, startsAt: e.startsAt.toISOString(), description: e.description }))}
    />
  )
}

