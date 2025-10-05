"use client"
import useSWR from 'swr'
import React, { useMemo, useRef, useState } from 'react'
import NotesEditor, { NotesEditorHandle } from '@/components/teams/NotesEditor'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

function timeAgo(input?: string | Date | null) {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7); if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30); if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365); return `${years}y ago`
}

export default function TeamsClient({ teamId, initialTab }: { teamId: string; initialTab: string }) {
  const [tab, setTab] = useState(initialTab)
  const { data } = useSWR(`/api/teams/${teamId}`, fetcher)
  const team = data || { name: 'Team', description: '' }
  const { data: teamsData } = useSWR(`/api/teams`, fetcher)
  const { data: membersData } = useSWR(tab === 'people' ? `/api/teams/${teamId}/members` : null, fetcher)

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <aside className="rounded-2xl shadow-lg shadow-black/20 bg-slate-900/60 p-4 h-[70vh] md:sticky md:top-[calc(var(--nav-h,56px)+16px)]">
        <div className="flex items-center gap-2 mb-3">
          <input placeholder="Search teams" className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 text-sm" />
          <a href="/dashboard/teams/new" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+ New</a>
        </div>
        <div className="text-xs text-slate-400 mb-2">Teams</div>
        <div className="space-y-1 overflow-y-auto pr-1">
          {(teamsData?.teams || []).map((t: any) => (
            <a key={t.id} href={`/dashboard/teams/${t.id}?tab=${tab}`} title={t.name} className={`block px-3 py-2 rounded-md ${t.id===teamId?'bg-slate-800':'hover:bg-slate-800/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate max-w-[170px] text-slate-200 text-sm">{t.name}</span>
                <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">{t.memberCount ?? 0}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">Active {timeAgo(t.lastActivityAt)}</div>
            </a>
          ))}
        </div>
      </aside>
      <main className="rounded-2xl shadow-lg shadow-black/20 bg-slate-900/60 p-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="pl-4 pt-1">
            <h1 className="text-2xl font-semibold leading-tight truncate max-w-[60vw] md:max-w-[40rem]" title={team.name}>{team.name}</h1>
            <p className="text-slate-300/90 text-sm mt-0.5 truncate max-w-[60vw] md:max-w-[40rem]" title={team.description || undefined}>{team.description || '—'}</p>
          </div>
          <div className="flex items-center gap-2 pr-3">
            <button data-cta="invite-header" onClick={()=>setTab('team-settings')} className="px-3 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-black/20">Invite</button>
          </div>
        </header>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm pl-4">
          {['overview','people','goals','linked-tasks','notes','chat','team-settings'].map((t) => (
            <button key={t} data-tab={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border ${tab===t ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200' : 'border-slate-700 hover:bg-slate-800 text-slate-200'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </nav>

        <section className="mt-4">
          {tab === 'overview' && <Overview teamId={teamId} />}
          {tab === 'people' && <People teamId={teamId} members={(membersData?.members||[])} onInvite={()=>setTab('team-settings')} />}
          {tab === 'goals' && <Goals teamId={teamId} />}
          {tab === 'linked-tasks' && <LinkedTasks teamId={teamId} />}
          {tab === 'notes' && <Notes teamId={teamId} />}
          {tab === 'chat' && <Chat teamId={teamId} />}
          {tab === 'team-settings' && <TeamSettings teamId={teamId} />}
        </section>
      </main>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/60 p-3 h-full flex flex-col mx-2 md:mx-3">
      <div className="text-sm font-medium text-slate-200 mb-2 shrink-0">{title}</div>
      {children}
    </div>
  )
}

function Overview({ teamId }: { teamId: string }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2 md:px-3 pb-1"
      style={{ gridAutoRows: '172px' } as React.CSSProperties}
    >
      <OverviewCards teamId={teamId} />
    </div>
  )
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/50 p-4 animate-pulse">
          <div className="h-4 w-28 bg-slate-700/60 rounded mb-3" />
          <div className="h-3 w-40 bg-slate-800/60 rounded" />
        </div>
      ))}
    </>
  )
}

function OverviewCards({ teamId }: { teamId: string }) {
  const { data: goalsData } = useSWR(`/api/teams/${teamId}/goals`, fetcher)
  const { data: membersData } = useSWR(`/api/teams/${teamId}/members`, fetcher)
  const { data: chatData } = useSWR(`/api/teams/${teamId}/chat`, fetcher)
  const { data: activityData } = useSWR(`/api/teams/${teamId}/activity`, fetcher)
  const { data: tasksData } = useSWR(`/api/tasks`, fetcher)
  const goals = (goalsData?.goals || []) as Array<{ id: string; status: string; dueDate?: string|null }>
  const total = goals.length
  const done = goals.filter(g=>g.status==='COMPLETE').length
  const now = new Date()
  const activeGoals = goals.filter(g => g.status !== 'COMPLETE')
  const overdueGoals = activeGoals.filter(g => g.dueDate && new Date(g.dueDate as any) < now).length
  const pct = total ? Math.round((done/total)*100) : 0
  const memberIds = new Set(((membersData?.members||[]) as any[]).map((m:any)=>m.id))
  const allTasks = ((tasksData?.projects||[]) as any[]).flatMap((p:any)=> p.tasks || [])
  // Count only tasks explicitly linked to this team
  const teamTasks = allTasks.filter((t:any)=> t.teamId === teamId)
  const openTasks = teamTasks.filter((t:any)=> t.status !== 'DONE').length
  const overdueTasks = teamTasks.filter((t:any)=> t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length
  const loadingGoals = goalsData === undefined
  const loadingChat = chatData === undefined
  const InlineSkeleton = ({ lines = 2 }: { lines?: number }) => (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 rounded ${i===0?'w-32':'w-40'} bg-slate-700/50`} />
      ))}
    </div>
  )
  return (
    <>
      <Card title="Goals">
        {loadingGoals ? (
          <InlineSkeleton />
        ) : total > 0 ? (
          <>
            <div className="text-3xl font-semibold text-indigo-400">{pct}%</div>
            <div className="text-slate-300 text-sm">{done} of {total} complete</div>
          </>
        ) : (
          <div className="text-slate-400 text-sm">No goals yet — <a href="#" className="text-indigo-300 underline" onClick={(e)=>{e.preventDefault(); const el=document.querySelector('[data-tab=\"goals\"]') as HTMLElement|null; el?.click()}}>create one</a>.</div>
        )}
      </Card>
      <Card title="Workload">
        <div className="grid grid-cols-1 gap-2">
            <div className="flex items-end gap-6">
              <div>
                <div className="text-3xl font-semibold text-emerald-400">{(membersData?.members||[]).length}</div>
                <div className="text-slate-300 text-sm">Members</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-400">{Number.isFinite(openTasks) ? openTasks : 0}</div>
                <div className="text-slate-300 text-sm">Open tasks</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-rose-400">{Number.isFinite(overdueTasks) ? overdueTasks : 0}</div>
                <div className="text-slate-300 text-sm">Overdue</div>
              </div>
            </div>
            <div className="text-slate-300 text-sm">
            <div className="font-medium mb-1 text-amber-300">Important goals</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {goals.filter((g:any)=>g.starred).slice(0,3).map((g:any)=> (
                  <li key={g.id} className="truncate text-amber-200">{g.title}</li>
                ))}
                {goals.filter((g:any)=>g.starred).length === 0 && (
                  <li className="list-none text-slate-400">No starred goals yet</li>
                )}
              </ul>
            </div>
        </div>
      </Card>
      <Card title="Recent Chat">
        {loadingChat ? (
          <InlineSkeleton />
        ) : ((chatData?.messages||[]).length > 0) ? (
          <div className="text-sm space-y-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 tc-scroll">
            {(chatData?.messages||[]).slice(-3).reverse().map((m:any)=> (
              <div key={m.id} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 truncate"><span className="text-slate-400">{m.userName}:</span> {m.text}</div>
                  <div className="text-[11px] text-slate-500">{timeAgo(m.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No messages yet — <a href="#" className="text-indigo-300 underline" onClick={(e)=>{e.preventDefault(); const el=document.querySelector('[data-tab=\"chat\"]') as HTMLElement|null; el?.click()}}>start chatting</a>.</div>
        )}
      </Card>
      <div className="md:col-span-3">
        <Card title="Recent Activity">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 space-y-1.5 tc-scroll">
            {(activityData?.events||[]).length ? (
              (activityData!.events as any[]).map((ev:any)=> (
                <div key={ev.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 truncate">{ev.text}</div>
                    <div className="text-[11px] text-slate-500">{timeAgo(ev.ts)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No recent activity</div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

function LinkedTasks({ teamId }: { teamId: string }) {
  const { data } = useSWR(`/api/tasks`, fetcher)
  const tasks = React.useMemo(() => {
    const all = ((data?.projects||[]) as any[]).flatMap((p:any)=> p.tasks || [])
    return all.filter((t:any)=> t.teamId === teamId)
  }, [data, teamId])
  return (
    <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 overflow-hidden mx-2 md:mx-3">
      <table className="w-full text-sm">
        <thead className="bg-slate-950/70 text-slate-300">
          <tr>
            <th className="text-left px-3 py-2">Title</th>
            <th className="text-left px-3 py-2">Description</th>
            <th className="text-left px-3 py-2">Due date</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr className="border-t border-slate-800/60"><td colSpan={4} className="px-3 py-3 text-slate-400">No linked tasks yet.</td></tr>
          ) : tasks.map((t:any)=> (
            <tr key={t.id} className="border-t border-slate-800/60">
              <td className="px-3 py-2 text-slate-200">{t.title}</td>
              <td className="px-3 py-2 text-slate-300">{t.description || '—'}</td>
              <td className="px-3 py-2 text-slate-300">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
              <td className="px-3 py-2">
                {t.status==='DONE' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/30 text-emerald-300 border border-emerald-700">Done</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{t.status || 'TODO'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function People({ teamId, members, onInvite }: { teamId: string; members: Array<{ id: string; name: string|null; email: string|null; role: string; roleLabelId?: string|null }>; onInvite: ()=>void }) {
  const [local, setLocal] = React.useState(members)
  React.useEffect(()=>setLocal(members), [members])
  const { data: rolesData } = useSWR(`/api/teams/${teamId}/roles`, fetcher)
  const [pickerFor, setPickerFor] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!pickerFor) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerFor(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickerFor])
  async function chooseRole(userId: string, roleLabelId: string | null) {
    setLocal(prev => prev.map(m => m.id===userId ? { ...m } : m))
    await fetch(`/api/teams/${teamId}/members`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, roleLabelId }) })
    setPickerFor(null)
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300 pl-4">Roster</div>
        {/* invite button intentionally removed on People tab */}
        <div className="mr-4 md:mr-6" />
      </div>
      <div className="rounded-2xl shadow-lg shadow-black/20 overflow-hidden bg-slate-950/40 mt-1 mx-2 md:mx-3">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/70 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Projects</th>
              <th className="text-left px-3 py-2">Active this week</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {local.length === 0 ? (
              <tr className="border-t border-slate-800/60">
                <td className="px-3 py-4 text-slate-400" colSpan={5}>No members yet.</td>
              </tr>
            ) : local.map((m) => (
              <tr key={m.id} className="border-t border-slate-800/60">
                <td className="px-3 py-2">
                  <div className="text-slate-200">{m.name || '—'}</div>
                  <div className="text-xs text-slate-400">{m.email || '—'}</div>
                </td>
                <td className="px-3 py-2">
                  <button onClick={()=>setPickerFor(m.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer">
                    {(rolesData?.roles||[]).find((r: any)=>r.id===m.roleLabelId)?.name || m.role || 'Role'}
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${m.roleLabelId ? 'bg-indigo-500' : 'bg-slate-500'}`} title={m.roleLabelId ? 'Custom role' : 'Base role'} />
                  </button>
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
      {pickerFor && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/60" onClick={()=>setPickerFor(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="relative w-full max-w-sm rounded-2xl shadow-lg shadow-black/20 bg-slate-900 p-4" role="dialog" aria-modal="true">
              <button aria-label="Close" onClick={()=>setPickerFor(null)} className="absolute right-2 top-2 h-8 w-8 grid place-items-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800">×</button>
              <div className="text-slate-200 font-medium mb-2 pr-10">Select role</div>
              <div className="grid gap-2">
                {(rolesData?.roles||[]).map((r: any)=>(
                  <button key={r.id} onClick={()=>chooseRole(pickerFor!, r.id)} className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 text-left">{r.name}</button>
                ))}
                <button onClick={()=>chooseRole(pickerFor!, null)} className="px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 text-left">Clear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// RoleBadges removed; replaced by modal picker sourced from Team Settings roles

function AssignDropdown({ teamId, currentOwnerId, onAssign }: { teamId: string; currentOwnerId: string|null; onAssign: (userId: string|null) => void }) {
  const { data } = useSWR(`/api/teams/${teamId}/members`, fetcher)
  const { data: teamInfo } = useSWR(`/api/teams/${teamId}`, fetcher)
  const members = React.useMemo(() => {
    const list = (data?.members || []) as Array<{ id: string; name: string|null; email: string|null }>
    return list
  }, [data?.members])
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative inline-block">
      <button onClick={()=>setOpen(o=>!o)} className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-200" title="Assign">Assign</button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-slate-800 bg-slate-900 p-1 shadow-lg">
          <button onClick={()=>{ onAssign(null); setOpen(false) }} className={`w-full text-left px-2 py-1 rounded hover:bg-slate-800 ${currentOwnerId===null?'text-indigo-300':'text-slate-200'}`}>Unassigned</button>
          {members.map(m => (
            <button key={m.id} onClick={()=>{ onAssign(m.id); setOpen(false) }} className={`w-full text-left px-2 py-1 rounded hover:bg-slate-800 ${currentOwnerId===m.id?'text-indigo-300':'text-slate-200'}`}>{m.name || m.email || 'User'}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function Goals({ teamId }: { teamId: string }) {
  const { data, mutate } = useSWR(`/api/teams/${teamId}/goals`, fetcher)
  const goals = (data?.goals || []) as Array<{ id: string; title: string; description?: string; status?: string; ownerId?: string | null; starred?: boolean; dueDate?: string|null }>
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createBusy, setCreateBusy] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)

  async function submitCreate() {
    const t = title.trim()
    if (!t) return
    setCreateBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, description: desc.trim()||null }) })
      setTitle(''); setDesc('')
      setCreateOpen(false)
      await mutate()
    } finally { setCreateBusy(false) }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleteBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/goals?goalId=${encodeURIComponent(deleteId)}`, { method: 'DELETE' })
      setDeleteId(null)
      await mutate()
    } finally { setDeleteBusy(false) }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300 pl-4">Objectives</div>
        <div className="flex gap-2 mr-4 md:mr-6">
          <button onClick={()=>setCreateOpen(true)} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">+ New Goal</button>
        </div>
      </div>
      <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 overflow-hidden mx-2 md:mx-3">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-slate-950/70 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2 w-[480px]">Description</th>
              <th className="text-left px-3 py-2">Due date</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2 w-[280px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr className="border-t border-slate-800/60"><td colSpan={4} className="px-3 py-3 text-slate-400">No goals yet.</td></tr>
            ) : [...goals]
              .sort((a,b)=> ((b.starred?1:0) - (a.starred?1:0)) || ((a.status==='COMPLETE'?1:0) - (b.status==='COMPLETE'?1:0)))
              .map(g => (
              <tr key={g.id} className={`border-t border-slate-800/60 ${g.status==='COMPLETE' ? 'opacity-90' : ''}`}>
                <td className="px-3 py-2 text-slate-200 align-top">{g.title}</td>
                <td className="px-3 py-2 align-top w-[480px]">
                  <div className="max-h-16 overflow-y-auto overflow-x-hidden px-2 text-slate-300 break-words whitespace-pre-wrap tc-scroll">{g.description || '—'}</div>
                </td>
                <td className="px-3 py-2 text-slate-300 align-top">{g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-2 align-top">
                  {g.status==='COMPLETE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/30 text-emerald-300 border border-emerald-700">Complete 🎉</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Active</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top min-w-[280px]">
                  <div className="inline-flex flex-wrap gap-2 justify-end w-full">
                    <AssignDropdown teamId={teamId} currentOwnerId={g.ownerId || null} onAssign={async(userId)=>{ await fetch(`/api/teams/${teamId}/goals`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goalId: g.id, ownerId: userId }) }); await mutate() }} />
                    <button onClick={async()=>{ const next = !(g.starred||false); await fetch(`/api/teams/${teamId}/goals/${g.id}/updates`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ starred: next }) }); await mutate(); }} className={`px-2 py-1 rounded-md border ${g.starred?'border-amber-500 text-amber-400 bg-amber-500/10':'border-slate-700 text-slate-300'} hover:bg-slate-800`} title="Favorite">★</button>
                    <button onClick={()=>setDeleteId(g.id)} className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700" title="Delete">🗑️</button>
                    <button disabled={g.status==='COMPLETE'} onClick={async()=>{ await fetch(`/api/teams/${teamId}/goals`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goalId: g.id, status: 'COMPLETE' }) }); await mutate(); }} className={`px-2 py-1 rounded-md ${g.status==='COMPLETE' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} title="Mark Completed">Completed 🎉</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!createBusy && setCreateOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Create Goal</div>
              <div className="text-sm text-slate-400 mt-1">Give your goal a clear, concise name.</div>
              <div className="mt-4 grid gap-3">
                <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Goal title" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
                <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Description" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" rows={3} />
                <label className="grid gap-1">
                  <span className="text-sm text-slate-300">Due date</span>
                  <input type="date" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" onChange={(e:any)=> (e.currentTarget.dataset.v = e.currentTarget.value)} data-v="" />
                </label>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={()=>!createBusy && setCreateOpen(false)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                  <button type="button" disabled={createBusy} onClick={async()=>{
                    const picker = document.querySelector('input[type="date"][data-v]') as HTMLInputElement | null
                    const dueVal = picker?.dataset.v || picker?.value || ''
                    const t = title.trim(); if (!t) return
                    setCreateBusy(true)
                    try {
                      await fetch(`/api/teams/${teamId}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, description: desc.trim()||null, dueDate: dueVal || null }) })
                      setTitle(''); setDesc(''); setCreateOpen(false); await mutate()
                    } finally { setCreateBusy(false) }
                  }} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-transform active:scale-[0.98]">{createBusy ? 'Creating…' : 'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!deleteBusy && setDeleteId(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Delete goal?</div>
              <div className="text-sm text-slate-400 mt-1">This action cannot be undone.</div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>!deleteBusy && setDeleteId(null)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                <button type="button" disabled={deleteBusy} onClick={confirmDelete} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-transform active:scale-[0.98]">{deleteBusy ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Notes({ teamId }: { teamId: string }) {
  const { data, mutate } = useSWR(`/api/teams/${teamId}/notes`, fetcher)
  const notes = (data?.notes || []) as Array<{ id: string; title: string }>
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const { data: noteDetail, mutate: mutateDetail } = useSWR(activeId ? `/api/teams/${teamId}/notes/${activeId}` : null, fetcher)
  React.useEffect(() => {
    if (!activeId && notes.length > 0) setActiveId(notes[0].id)
  }, [notes, activeId])
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createBusy, setCreateBusy] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)

  async function submitCreate() {
    const t = title.trim() || 'Untitled'
    setCreateBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) })
      setTitle('')
      setCreateOpen(false)
      await mutate()
    } finally { setCreateBusy(false) }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleteBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/notes?noteId=${encodeURIComponent(deleteId)}`, { method: 'DELETE' })
      setDeleteId(null)
      await mutate()
    } finally { setDeleteBusy(false) }
  }
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 p-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-300">Notes</div>
          <button onClick={()=>setCreateOpen(true)} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm">+ New</button>
        </div>
        <div className="space-y-1">
          {notes.length === 0 ? <div className="text-slate-400 text-sm">No notes yet.</div> : notes.map(n => (
            <div key={n.id} className={`flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800/60 ${activeId===n.id?'bg-slate-800/60':''}`}>
              <button className="truncate text-left" onClick={()=> setActiveId(n.id)} title="Open note">{n.title}</button>
              <button onClick={()=>setDeleteId(n.id)} className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs">Delete</button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 p-3 mt-1">
        {!activeId ? (
          <div className="text-sm text-slate-300">Select a note to view/edit</div>
        ) : (
          <div className="grid gap-3">
            <NotesEditorWrapper
              key={activeId}
              teamId={teamId}
              noteId={activeId}
              initialMarkdown={(noteDetail?.contentMd)||''}
              onSaved={async()=>{ await mutate(); await mutateDetail() }}
            />
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!createBusy && setCreateOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Create Note</div>
              <div className="text-sm text-slate-400 mt-1">Add a quick title; you can edit details later.</div>
              <div className="mt-4 grid gap-3">
                <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Note title" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={()=>!createBusy && setCreateOpen(false)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                  <button type="button" disabled={createBusy} onClick={submitCreate} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-transform active:scale-[0.98]">{createBusy ? 'Creating…' : 'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!deleteBusy && setDeleteId(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Delete note?</div>
              <div className="text-sm text-slate-400 mt-1">This action cannot be undone.</div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>!deleteBusy && setDeleteId(null)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                <button type="button" disabled={deleteBusy} onClick={confirmDelete} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-transform active:scale-[0.98]">{deleteBusy ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesEditorWrapper({ teamId, noteId, initialMarkdown, onSaved }: { teamId: string; noteId: string; initialMarkdown: string; onSaved: ()=>void }) {
  const editorRef = useRef<NotesEditorHandle | null>(null)
  const [t, setT] = React.useState('')
  const [md, setMd] = React.useState(initialMarkdown)
  const [busy, setBusy] = React.useState(false)
  const [emojiOpen, setEmojiOpen] = React.useState(false)
  React.useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setEmojiOpen(false)}; window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey)},[])
  async function save() {
    setBusy(true)
    try {
      const content = editorRef.current?.getMarkdown() || md
      await fetch(`/api/teams/${teamId}/notes/${noteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, contentMd: content }) })
      onSaved()
    } finally { setBusy(false) }
  }
  function getTa() { return document.getElementById('tc-note-editor') as HTMLTextAreaElement | null }
  function replaceSelection(nextSel: string, cursorOffset?: number) {
    const ta = getTa(); if (!ta) return
    const start = ta.selectionStart || 0
    const end = ta.selectionEnd || 0
    const before = md.slice(0, start)
    const after = md.slice(end)
    const next = `${before}${nextSel}${after}`
    setMd(next)
    const caret = (before + nextSel).length + (cursorOffset || 0)
    setTimeout(()=>{ const t = getTa(); if (t) { t.focus(); t.selectionStart = t.selectionEnd = caret } }, 0)
  }
  function insert(prefix: string, surround?: string) {
    const ta = getTa(); if (!ta) return
    const start = ta.selectionStart || 0
    const end = ta.selectionEnd || 0
    const sel = md.slice(start, end)
    // Toggle if already wrapped
    if (surround && sel.startsWith(prefix) && sel.endsWith(surround)) {
      const unwrapped = sel.slice(prefix.length, sel.length - surround.length)
      replaceSelection(unwrapped)
      return
    }
    const mid = surround ? `${prefix}${sel}${surround}` : `${prefix}${sel}`
    replaceSelection(mid)
  }
  function toggleBulleted() {
    const ta = getTa(); if (!ta) return
    const start = ta.selectionStart || 0
    const end = ta.selectionEnd || 0
    const before = md.slice(0, start)
    const sel = md.slice(start, end)
    const after = md.slice(end)
    const lines = sel.split(/\n/)
    const allBulleted = lines.every(l => /^\s*-\s/.test(l))
    const nextLines = lines.map((l,i)=> allBulleted ? l.replace(/^\s*-\s?/,'') : (l.replace(/^\s*/,'') ? `- ${l.replace(/^\s*/,'')}` : '- '))
    const nextSel = nextLines.join('\n')
    const next = `${before}${nextSel}${after}`
    setMd(next)
    setTimeout(()=>{ const t = getTa(); if (t) { t.focus(); t.selectionStart = start; t.selectionEnd = start + nextSel.length } }, 0)
  }
  function toggleNumbered() {
    const ta = getTa(); if (!ta) return
    const start = ta.selectionStart || 0
    const end = ta.selectionEnd || 0
    const before = md.slice(0, start)
    const sel = md.slice(start, end)
    const after = md.slice(end)
    const lines = sel.split(/\n/)
    const numberedRe = /^\s*\d+\.\s/
    const allNumbered = lines.every(l => numberedRe.test(l))
    const nextLines = allNumbered
      ? lines.map(l => l.replace(numberedRe, ''))
      : lines.map((l,i)=> `${i+1}. ${l.replace(/^\s*/,'')}`)
    const nextSel = nextLines.join('\n')
    const next = `${before}${nextSel}${after}`
    setMd(next)
    setTimeout(()=>{ const t = getTa(); if (t) { t.focus(); t.selectionStart = start; t.selectionEnd = start + nextSel.length } }, 0)
  }
  const emojis = React.useMemo(() => (
    '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 💀 ☠️ 👻 👽 🤖 🎃 💩 🙈 🙉 🙊 💘 💝 💖 💗 💓 💞 💕 💌 💟 👍 👎 🙌 👏 🔥 ✅ ❌ ⭐ 🌟 ✨ ⚡ 🎉 🥳 ❤️ 🧡 💛 💚 💙 💜 🤍 🤎 🖤'.split(/\s+/)
  ), [])
  return (
    <div className="grid gap-3">
      <input aria-label="Note title" value={t} onChange={(e)=>setT(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
      <div className="relative flex items-center gap-2 text-sm">
        {/* Toolbar is provided within NotesEditor, including Emoji button anchored to itself */}
      </div>
      <NotesEditor ref={editorRef as any} initialMarkdown={md} />
      <div className="flex items-center justify-end gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function Chat({ teamId }: { teamId: string }) {
  const { data, mutate } = useSWR(`/api/teams/${teamId}/chat`, fetcher)
  const [text, setText] = React.useState('')
  const [emojiOpen, setEmojiOpen] = React.useState(false)
  const emojis = React.useMemo(()=> '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 👍 👎 🙌 👏 🔥 ✅ ❌ ⭐ 🎉 ❤️'.split(/\s+/), [])
  React.useEffect(()=>{ const id = setInterval(()=>mutate(), 4000); return ()=>clearInterval(id) }, [mutate])
  async function send() {
    const t = text.trim(); if (!t) return
    setText('')
    await fetch(`/api/teams/${teamId}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t }) })
    await mutate()
  }
  return (
    <div className="rounded-lg border border-slate-800 p-3 grid gap-3">
      <div className="h-[360px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 flex flex-col gap-2">
        {(data?.messages||[]).map((m:any)=> (
          <div key={m.id} className="text-sm text-slate-200"><span className="text-slate-400">{m.userName||'User'}:</span> {m.text}</div>
        ))}
        {!(data?.messages||[]).length && <div className="text-slate-500 text-sm">No messages yet.</div>}
      </div>
      <div className="flex items-center gap-2 relative">
        <button aria-label="Emoji" className="h-10 w-10 grid place-items-center rounded-md border border-slate-700 hover:bg-slate-800" onClick={()=>setEmojiOpen(v=>!v)}>😊</button>
        {emojiOpen && (
          <div className="absolute bottom-12 left-0 z-[1000] w-[320px] max-h-[260px] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
            <div className="grid grid-cols-8 gap-1 text-lg">
              {emojis.map((e,i)=> (
                <button key={i} className="h-8 w-8 grid place-items-center rounded hover:bg-slate-800" onClick={()=>{ setText(t=>t + e); setEmojiOpen(false) }}>{e}</button>
              ))}
            </div>
          </div>
        )}
        <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Message" className="flex-1 px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
        <button onClick={send} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Send</button>
      </div>
    </div>
  )
}

function Analytics({ teamId }: { teamId: string }) {
  const { data } = useSWR(`/api/teams/${teamId}/analytics?range=week`, fetcher)
  return (
    <div className="rounded-lg border border-slate-800 p-3">
      <div className="text-sm text-slate-300">Charts and exports</div>
      <pre className="mt-2 text-xs text-slate-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

function TeamSettings({ teamId }: { teamId: string }) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const { data: team } = useSWR(`/api/teams/${teamId}/settings`, fetcher)
  const { data: eligible } = useSWR(`/api/teams/${teamId}/eligible`, fetcher)
  const { data: membersData, mutate: mutateMembers } = useSWR(`/api/teams/${teamId}/members`, fetcher)
  const { data: rolesData, mutate: mutateRoles } = useSWR(`/api/teams/${teamId}/roles`, fetcher)
  const [newRole, setNewRole] = React.useState('')
  React.useEffect(()=>{ if (team?.name !== undefined) setName(team.name || ''); if (team?.description !== undefined) setDescription(team.description || '') }, [team?.name, team?.description])
  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/teams/${teamId}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), description: description || null }) })
    } finally { setSaving(false) }
  }
  async function addUser(userId: string) {
    await fetch(`/api/teams/${teamId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    await mutateMembers()
  }
  async function removeUser(userId: string) {
    await fetch(`/api/teams/${teamId}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
    await mutateMembers()
  }
  const members: Array<{ id: string; name: string|null; email: string|null; role: string }> = (membersData?.members || [])
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 p-4">
          <div className="text-sm font-medium text-slate-200 mb-3">Team Settings</div>
          <div className="grid gap-3 max-w-xl">
          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Team name</span>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Description</span>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
          </label>
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</button>
          </div>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 p-4">
          <div className="text-sm font-medium text-slate-200 mb-3">Roles</div>
          <div className="flex items-center gap-2 mb-3">
            <input value={newRole} onChange={(e)=>setNewRole(e.target.value)} placeholder="New role name" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
            <button onClick={async()=>{ const n = newRole.trim(); if (!n) return; await fetch(`/api/teams/${teamId}/roles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) }); setNewRole(''); await mutateRoles() }} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Add role</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(rolesData?.roles||[]).map((r: any) => (
              <span key={r.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                {r.name}
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <button onClick={async()=>{ await fetch(`/api/teams/${teamId}/roles?roleId=${r.id}`, { method: 'DELETE' }); await mutateRoles() }} className="text-slate-400 hover:text-white">×</button>
              </span>
            ))}
            {!(rolesData?.roles||[]).length && <div className="text-slate-400 text-sm">No custom roles yet.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-lg shadow-black/20 bg-slate-950/40 p-4">
        <div className="text-sm font-medium text-slate-200 mb-3">Team members</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Current</div>
            <div className="rounded border border-slate-800 divide-y divide-slate-800">
              {members.length === 0 ? <div className="px-3 py-2 text-slate-400">No members yet.</div> : members.map(m => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-slate-200">{m.name || m.email || 'Member'}</div>
                    <div className="text-xs text-slate-400">{m.email || ''}</div>
                  </div>
                  <button onClick={()=>removeUser(m.id)} className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800 text-xs">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Eligible to add (organization members not in team)</div>
            <div className="rounded border border-slate-800 divide-y divide-slate-800">
              {!(eligible?.users||[]).length ? <div className="px-3 py-2 text-slate-400">No eligible users.</div> : (eligible.users as any[]).map(u => (
                <div key={u.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="text-slate-200">{u.name || u.email || 'User'}</div>
                    <div className="text-xs text-slate-400">{u.email || ''}</div>
                  </div>
                  <button onClick={()=>addUser(u.id)} className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800 text-xs">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-lg shadow-black/20 bg-rose-950/40 p-4 border border-rose-900/60">
        <div className="text-sm font-medium text-rose-300 mb-2">Danger zone</div>
        <div className="text-sm text-rose-200/80 mb-3">Deleting a team will remove its goals, notes, invites, and memberships. This cannot be undone.</div>
        <button
          onClick={async()=>{
            const ok = confirm('Delete this team and all its data?')
            if (!ok) return
            await fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
            window.location.href = '/dashboard/teams'
          }}
          className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700"
        >Delete team</button>
      </div>
    </div>
  )
}


