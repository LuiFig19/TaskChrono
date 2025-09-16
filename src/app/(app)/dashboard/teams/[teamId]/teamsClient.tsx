"use client"
import useSWR from 'swr'
import React, { useMemo, useState } from 'react'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

export default function TeamsClient({ teamId, initialTab }: { teamId: string; initialTab: string }) {
  const [tab, setTab] = useState(initialTab)
  const { data } = useSWR(`/api/teams/${teamId}`, fetcher)
  const team = data || { name: 'Team', description: '' }
  const { data: teamsData } = useSWR(`/api/teams`, fetcher)
  const { data: membersData } = useSWR(tab === 'people' ? `/api/teams/${teamId}/members` : null, fetcher)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <aside className="rounded-xl border border-slate-800 bg-slate-900 p-3 h-[70vh] md:sticky md:top-[calc(var(--nav-h,56px)+16px)]">
        <div className="flex items-center gap-2 mb-2">
          <input placeholder="Search teams" className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 text-sm" />
          <a href="/dashboard/teams/new" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+ New</a>
        </div>
        <div className="text-xs text-slate-400 mb-1">Teams</div>
        <div className="space-y-1 overflow-y-auto pr-1">
          {(teamsData?.teams || []).map((t: any) => (
            <a key={t.id} href={`/dashboard/teams/${t.id}?tab=${tab}`} className={`block px-3 py-2 rounded hover:bg-slate-800/60 ${t.id===teamId?'bg-slate-800/60':''}`}>{t.name}</a>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-sm">Invite</button>
          <button className="flex-1 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-sm">Settings</button>
        </div>
      </aside>
      <main className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            <p className="text-slate-300 text-sm">{team.description || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Invite</button>
            <button className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Settings</button>
          </div>
        </header>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {['overview','people','goals','notes','chat','analytics','settings'].map((t) => (
            <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border ${tab===t ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200' : 'border-slate-700 hover:bg-slate-800 text-slate-200'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </nav>

        <section className="mt-4">
          {tab === 'overview' && <Overview teamId={teamId} />}
          {tab === 'people' && <People teamId={teamId} members={(membersData?.members||[])} />}
          {tab === 'goals' && <Goals teamId={teamId} />}
          {tab === 'notes' && <Notes teamId={teamId} />}
          {tab === 'chat' && <Chat teamId={teamId} />}
          {tab === 'analytics' && <Analytics teamId={teamId} />}
          {tab === 'settings' && <Settings teamId={teamId} />}
        </section>
      </main>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="text-sm font-medium text-slate-200 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Overview({ teamId }: { teamId: string }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Goals Snapshot">
        <div className="text-slate-300 text-sm">% complete, due soon</div>
      </Card>
      <Card title="Workload Snapshot">
        <div className="text-slate-300 text-sm">Active tasks by assignee, overdue</div>
      </Card>
      <Card title="Time Snapshot">
        <div className="text-slate-300 text-sm">Hours this week vs last, active timers</div>
      </Card>
      <div className="md:col-span-3">
        <Card title="Recent Activity">
          <div className="text-slate-300 text-sm">Last 10 events</div>
        </Card>
      </div>
    </div>
  )
}

function People({ teamId, members }: { teamId: string; members: Array<{ id: string; name: string|null; email: string|null; role: string }> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Roster</div>
        <button className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Invite</button>
      </div>
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Projects</th>
              <th className="text-left px-3 py-2">Active this week</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr className="border-t border-slate-800">
                <td className="px-3 py-4 text-slate-400" colSpan={5}>No members yet.</td>
              </tr>
            ) : members.map((m) => (
              <tr key={m.id} className="border-t border-slate-800">
                <td className="px-3 py-2">
                  <div className="text-slate-200">{m.name || '—'}</div>
                  <div className="text-xs text-slate-400">{m.email || '—'}</div>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-700 text-slate-300">{m.role}</span>
                </td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2 text-right">
                  <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Goals({ teamId }: { teamId: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Objectives</div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">+ New Goal</button>
          <button className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">+ New Key Result</button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 p-3">
        <div className="text-slate-300 text-sm">Progress bars, click to open drawer</div>
      </div>
    </div>
  )
}

function Notes({ teamId }: { teamId: string }) {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-lg border border-slate-800 p-3">
        <div className="text-sm text-slate-300">Notes list</div>
      </div>
      <div className="rounded-lg border border-slate-800 p-3">
        <div className="text-sm text-slate-300">Markdown editor with history</div>
      </div>
    </div>
  )
}

function Chat({ teamId }: { teamId: string }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3">
      <div className="text-sm text-slate-300">Team channel coming soon</div>
    </div>
  )
}

function Analytics({ teamId }: { teamId: string }) {
  return (
    <div className="rounded-lg border border-slate-800 p-3">
      <div className="text-sm text-slate-300">Charts and exports</div>
    </div>
  )
}

function Settings({ teamId }: { teamId: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-800 p-3">
        <div className="text-sm text-slate-300">Team name/description</div>
      </div>
      <div className="rounded-lg border border-slate-800 p-3">
        <div className="text-sm text-slate-300">Danger zone and invite link</div>
      </div>
    </div>
  )
}


