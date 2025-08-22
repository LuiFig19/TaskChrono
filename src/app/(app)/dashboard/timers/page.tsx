import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { stopTimer } from './actions'
import StartTimerButton from './StartTimerButton'

export default async function TimersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const { organizationId, userId } = await getCurrentUserAndOrg()
  const active = organizationId && userId ? await prisma.timeEntry.findFirst({ where: { organizationId, userId, endedAt: null } }) : null
  const entries = organizationId && userId ? await prisma.timeEntry.findMany({ where: { organizationId, userId }, orderBy: { startedAt: 'desc' } }) : []
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Timers</h1>
      <div className="mt-4 grid md:grid-cols-[1fr,380px] items-start gap-4">
        <div className="flex gap-2 flex-wrap">
          <StartTimerButton disabled={!!active} />
          <form action={stopTimer}>
            <button className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700" disabled={!active}>Stop Timer</button>
          </form>
          <a href="/api/timers/export" className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Export CSV</a>
          <form action="/api/pin/timer" method="post">
            <button type="submit" className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Pin Active Timer to Dashboard</button>
          </form>
        </div>
        <aside className="rounded-md border border-slate-800 bg-slate-900 p-3">
          <form action={async (formData: FormData) => { 'use server';
            const { organizationId, userId } = await getCurrentUserAndOrg()
            if (!organizationId || !userId) return
            const id = formData.get('entryId') as string
            const notes = (formData.get('notes') as string | null)?.slice(0,2000) || ''
            if (id) await prisma.timeEntry.update({ where: { id }, data: { notes } })
          }}>
            <label htmlFor="entryId" className="block text-sm text-slate-300 mb-1">Add/Update Notes for a Timer</label>
            <select id="entryId" name="entryId" className="w-full mb-2 rounded border border-slate-700 bg-slate-900 text-slate-200 px-2 py-1">
              {entries.map(e => (
                <option key={e.id} value={e.id}>{e.name} • {new Date(e.startedAt).toLocaleString()}</option>
              ))}
            </select>
            <textarea name="notes" rows={6} className="w-full rounded border border-slate-700 bg-slate-900 text-slate-200 px-2 py-1" placeholder="Notes..." />
            <div className="mt-2">
              <button className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Save Notes</button>
            </div>
          </form>
        </aside>
      </div>
      <div className="mt-6">
        {entries.length === 0 ? (
          <div className="text-slate-400">No entries yet.</div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Start</th>
                  <th className="text-left px-3 py-2">End</th>
                  <th className="text-left px-3 py-2">Duration (min)</th>
                  <th className="text-left px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900">
                    <td className="px-3 py-2">{e.name}</td>
                    <td className="px-3 py-2">{new Date(e.startedAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.endedAt ? new Date(e.endedAt).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">{e.durationMin}</td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={e.notes || ''}>{e.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


