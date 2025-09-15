import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUserAndOrg, getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent, deleteCalendarEvent } from './actions'
import MonthGrid from './MonthGrid'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ d?: string; month?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const plan = await getUserPlanServer()
  const { organizationId } = await getCurrentUserAndOrg()
  const sp = await searchParams
  const monthParam = typeof sp?.month === 'string' ? sp.month : ''
  const defaultWhen = typeof (sp as any)?.d === 'string' ? (sp as any).d : ''
  // Compute current month range for server filtering (improves load and prevents cross-month confusion)
  const base = monthParam ? new Date(monthParam) : new Date()
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  const events = organizationId
    ? await prisma.calendarEvent.findMany({
        where: { organizationId, startsAt: { gte: start, lt: end } },
        orderBy: { startsAt: 'asc' },
      })
    : []

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-0 pb-6 -mt-10 md:-mt-14 -translate-y-10 md:-translate-y-14 dashboard-calendar-page" style={{marginTop: 0, paddingTop: 0}}>
      <h1 className="text-2xl font-semibold" style={{margin: 0, padding: 0}}>Calendar</h1>
      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white">Monthly View</div>
            <div className="flex items-center gap-3">
              <a 
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-600 bg-red-800 text-red-200 hover:bg-red-700 hover:border-red-500 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md" 
                href={`/dashboard/calendar?month=${new Date(start.getFullYear(), start.getMonth()-1, 1).toISOString()}`}
                title="Previous Month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <a 
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-green-600 bg-green-800 text-green-200 hover:bg-green-700 hover:border-green-500 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md" 
                href={`/dashboard/calendar?month=${new Date(start.getFullYear(), start.getMonth()+1, 1).toISOString()}`}
                title="Next Month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <MonthGrid events={events as any} baseDate={start.toISOString()} />
          <ul className="mt-4 grid gap-2 text-sm text-slate-300">
            {events.map(e => (
              <li key={e.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <div>
                  <div>{e.title}</div>
                  <div className="text-xs text-slate-400">{new Date(e.startsAt).toLocaleString()}</div>
                </div>
                <form action={deleteCalendarEvent}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-slate-300 hover:text-white transition-colors">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Event:</div>
          <form action={createCalendarEvent} className="mt-4 grid gap-2">
            <input name="title" placeholder="Title" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
            <input id="calendar-when" name="when" type="datetime-local" placeholder="Date & Time" defaultValue={defaultWhen} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
            <label htmlFor="category" className="text-sm text-slate-300">Category</label>
            <select id="category" name="category" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100">
              <option value="meeting">Meeting</option>
              <option value="release">Release</option>
              <option value="invoice">Invoice</option>
              <option value="review">Review</option>
              <option value="demo">Demo</option>
              <option value="deadline">Deadline</option>
              <option value="personal">Personal</option>
              <option value="urgent">Urgent</option>
              <option value="general">General</option>
            </select>
            <label htmlFor="notes" className="text-sm text-slate-300">Notes</label>
            <textarea id="notes" name="notes" rows={3} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" placeholder="Optional notes (e.g., Employee out)" />
            <button className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors w-fit">Create</button>
          </form>
        </div>
      </div>
    </div>
  )
}


