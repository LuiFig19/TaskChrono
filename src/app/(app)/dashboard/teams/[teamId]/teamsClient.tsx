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
      <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 h-[70vh] md:sticky md:top-[calc(var(--nav-h,56px)+16px)]">
        <div className="flex items-center gap-2 mb-3">
          <input placeholder="Search teams" className="w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100 text-sm" />
          <a href="/dashboard/teams/new" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+ New</a>
        </div>
        <div className="text-xs text-slate-400 mb-2">Teams</div>
        <div className="space-y-1 overflow-y-auto pr-1">
          {(teamsData?.teams || []).map((t: any) => (
            <a key={t.id} href={`/dashboard/teams/${t.id}?tab=${tab}`} className={`block px-3 py-2 rounded hover:bg-slate-800/60 ${t.id===teamId?'bg-slate-800/60':''}`}>{t.name}</a>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-sm">Invite</button>
          <button className="flex-1 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-sm">Settings</button>
        </div>
      </aside>
      <main className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="pl-4 pt-1">
            <h1 className="text-2xl font-semibold leading-tight">{team.name}</h1>
            <p className="text-slate-300 text-sm">{team.description || '—'}</p>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <button onClick={()=>setTab('team-settings')} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Invite</button>
            <button onClick={()=>setTab('team-settings')} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Settings</button>
          </div>
        </header>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {['overview','people','goals','notes','chat','team-settings'].map((t) => (
            <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-full border ${tab===t ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200' : 'border-slate-700 hover:bg-slate-800 text-slate-200'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </nav>

        <section className="mt-4">
          {tab === 'overview' && <Overview teamId={teamId} />}
          {tab === 'people' && <People teamId={teamId} members={(membersData?.members||[])} onInvite={()=>setTab('team-settings')} />}
          {tab === 'goals' && <Goals teamId={teamId} />}
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
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="text-sm font-medium text-slate-200 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Overview({ teamId }: { teamId: string }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <OverviewCards teamId={teamId} />
    </div>
  )
}

function OverviewCards({ teamId }: { teamId: string }) {
  const { data: goalsData } = useSWR(`/api/teams/${teamId}/goals`, fetcher)
  const { data: membersData } = useSWR(`/api/teams/${teamId}/members`, fetcher)
  const { data: chatData } = useSWR(`/api/teams/${teamId}/chat`, fetcher)
  const goals = (goalsData?.goals || []) as Array<{ id: string; status: string }>
  const total = goals.length
  const done = goals.filter(g=>g.status==='COMPLETE').length
  const pct = total ? Math.round((done/total)*100) : 0
  return (
    <>
      <Card title="Goals Snapshot">
        <div className="text-slate-300 text-sm">{done}/{total} complete ({pct}%)</div>
      </Card>
      <Card title="Workload Snapshot">
        <div className="text-slate-300 text-sm">Team members: {(membersData?.members||[]).length}</div>
      </Card>
      <Card title="Recent Chat">
        <div className="text-slate-300 text-sm">Last: {(chatData?.messages||[]).slice(-1)[0]?.text || '—'}</div>
      </Card>
      <div className="md:col-span-3">
        <Card title="Recent Activity">
          <div className="text-slate-300 text-sm">{(chatData?.messages||[]).slice(-5).reverse().map((m:any)=> (<div key={m.id} className="truncate">{m.userName}: {m.text}</div>))}</div>
        </Card>
      </div>
    </>
  )
}

function People({ teamId, members, onInvite }: { teamId: string; members: Array<{ id: string; name: string|null; email: string|null; role: string }>; onInvite: ()=>void }) {
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
        <div className="text-sm text-slate-300">Roster</div>
        <button onClick={onInvite} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Invite</button>
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
            {local.length === 0 ? (
              <tr className="border-t border-slate-800">
                <td className="px-3 py-4 text-slate-400" colSpan={5}>No members yet.</td>
              </tr>
            ) : local.map((m) => (
              <tr key={m.id} className="border-t border-slate-800">
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
            <div className="relative w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-4" role="dialog" aria-modal="true">
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

function Goals({ teamId }: { teamId: string }) {
  const { data, mutate } = useSWR(`/api/teams/${teamId}/goals`, fetcher)
  const goals = (data?.goals || []) as Array<{ id: string; title: string; description?: string }>
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
        <div className="text-sm text-slate-300">Objectives</div>
        <div className="flex gap-2">
          <button onClick={()=>setCreateOpen(true)} className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">+ New Goal</button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Description</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr className="border-t border-slate-800"><td colSpan={4} className="px-3 py-3 text-slate-400">No goals yet.</td></tr>
            ) : [...goals].sort((a,b)=> (a.status==='COMPLETE'?1:0) - (b.status==='COMPLETE'?1:0)).map(g => (
              <tr key={g.id} className={`border-t border-slate-800 ${g.status==='COMPLETE' ? 'opacity-90' : ''}`}>
                <td className="px-3 py-2 text-slate-200">{g.title}</td>
                <td className="px-3 py-2 text-slate-300">{g.description || '—'}</td>
                <td className="px-3 py-2">
                  {g.status==='COMPLETE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700/30 text-emerald-300 border border-emerald-700">Complete 🎉</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button onClick={()=>setDeleteId(g.id)} className="px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700" title="Delete">🗑️</button>
                  <button disabled={g.status==='COMPLETE'} onClick={async()=>{ await fetch(`/api/teams/${teamId}/goals`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goalId: g.id, status: 'COMPLETE' }) }); await mutate(); try { const confetti = (await import('canvas-confetti')).default; const run=()=>{ confetti({ spread:60, ticks:70, gravity:0.9, startVelocity:30, particleCount:60, origin:{x:0.2,y:0.2}}); confetti({ spread:60, ticks:70, gravity:0.9, startVelocity:30, particleCount:60, origin:{x:0.8,y:0.2}}); confetti({ spread:60, ticks:70, gravity:0.9, startVelocity:30, particleCount:40, origin:{x:Math.random(),y:0.1}})}; run(); setTimeout(run,200); setTimeout(run,400);} catch {} }} className={`px-2 py-1 rounded-md ${g.status==='COMPLETE' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} title="Mark Completed">Completed 🎉</button>
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
      <div className="rounded-lg border border-slate-800 p-3">
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
      <div className="rounded-lg border border-slate-800 p-3">
        {!activeId ? (
          <div className="text-sm text-slate-300">Select a note to view/edit</div>
        ) : (
          <NoteEditor
            key={activeId}
            teamId={teamId}
            noteId={activeId}
            title={(noteDetail?.title)||''}
            content={(noteDetail?.contentMd)||''}
            onSaved={async()=>{ await mutate(); await mutateDetail() }}
          />
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

function NoteEditor({ teamId, noteId, title, content, onSaved }: { teamId: string; noteId: string; title: string; content: string; onSaved: ()=>void }) {
  const [t, setT] = React.useState(title)
  const [md, setMd] = React.useState(content)
  const [busy, setBusy] = React.useState(false)
  const [emojiOpen, setEmojiOpen] = React.useState(false)
  React.useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setEmojiOpen(false)}; window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey)},[])
  async function save() {
    setBusy(true)
    try {
      await fetch(`/api/teams/${teamId}/notes/${noteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, contentMd: md }) })
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
    '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 💀 ☠️ 👻 👽 🤖 🎃 💩 🙈 🙉 🙊 💘 💝 💖 💗 💓 💞 💕 💌 💟'.split(/\s+/)
  ), [])
  return (
    <div className="grid gap-3">
      <input value={t} onChange={(e)=>setT(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
      <div className="relative flex items-center gap-2 text-sm">
        <button className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800" onClick={toggleBulleted}>• Bulleted</button>
        <button className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800" onClick={toggleNumbered}>1. Numbered</button>
        <button className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800" onClick={()=>insert('**','**')}>Bold</button>
        <button className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800" onClick={()=>insert('_','_')}>Italic</button>
        <div className="relative">
          <button className="px-2 py-1 rounded-md border border-slate-700 hover:bg-slate-800" onClick={()=>setEmojiOpen(v=>!v)}>Emoji 😃</button>
          {emojiOpen && (
            <div className="absolute z-10 mt-2 right-0 w-[300px] max-h-56 overflow-auto rounded-md border border-slate-700 bg-slate-900 p-2 grid grid-cols-8 gap-1" onMouseLeave={()=>setEmojiOpen(false)}>
              {emojis.map((e, idx)=> (
                <button key={idx} className="h-7 w-7 grid place-items-center rounded hover:bg-slate-800" onClick={()=>{ insert(e+' '); setEmojiOpen(false) }}>{e}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea id="tc-note-editor" value={md} onChange={(e)=>setMd(e.target.value)} rows={18} className="w-full min-h-[360px] px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 font-mono" />
      <div className="flex items-center justify-end gap-2">
        <button onClick={save} disabled={busy} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function Chat({ teamId }: { teamId: string }) {
  const { data, mutate } = useSWR(`/api/teams/${teamId}/chat`, fetcher)
  const [text, setText] = React.useState('')
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
      <div className="flex items-center gap-2">
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
        <div className="rounded-lg border border-slate-800 p-4">
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

        <div className="rounded-lg border border-slate-800 p-4">
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

      <div className="rounded-lg border border-slate-800 p-4">
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

      
    </div>
  )
}


