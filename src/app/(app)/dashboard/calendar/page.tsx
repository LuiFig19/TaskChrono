import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUserAndOrg, getUserPlanServer } from '@/lib/org'
import LockedFeature from '../_components/locked'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent, deleteCalendarEvent } from './actions'
import MonthGrid from './MonthGrid'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const plan = await getUserPlanServer()
  const { organizationId } = await getCurrentUserAndOrg()
  const events = organizationId ? await prisma.calendarEvent.findMany({ where: { organizationId }, orderBy: { startsAt: 'asc' } }) : []
  const sp = await searchParams
  const defaultWhen = typeof sp?.d === 'string' ? sp.d : ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Monthly View</div>
          <MonthGrid events={events as any} />
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


