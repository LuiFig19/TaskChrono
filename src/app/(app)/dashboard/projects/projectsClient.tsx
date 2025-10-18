"use client"

import React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function ProjectsClient() {
  const [view, setView] = React.useState<'cards'|'kanban'|'gantt'>('cards')
  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-white">Project Manager</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent mt-1" />
          <p className="text-slate-400 text-sm mt-1">Create projects and manage tasks by status</p>
        </div>
        <CreateProjectForm />
      </header>

      <ProjectsToolbar view={view} setView={setView} />

      <div className="-mt-2 space-y-3">
        {view === 'cards' && <ProjectsList />}
        {view === 'kanban' && <ProjectsKanban />}
        {view === 'gantt' && <ProjectsGantt />}
      </div>
    </div>
  )
}

function CreateProjectForm() {
  const [budgetDisplay, setBudgetDisplay] = React.useState("")
  const [budgetNumber, setBudgetNumber] = React.useState<number>(0)
  const [limitOpen, setLimitOpen] = React.useState(false)
  const [limitMsg, setLimitMsg] = React.useState('')

  function formatUsd(input: string) {
    const cleaned = input.replace(/[^0-9.]/g, '')
    if (cleaned === '') return { display: '', value: 0 }
    const hasDecimal = cleaned.includes('.')
    const numeric = Number(cleaned)
    const display = numeric.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0,
    })
    return { display, value: numeric }
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const description = String(fd.get('description') || '').trim()
    const status = String(fd.get('status') || 'PLANNING') as any
    const budget = Number(fd.get('budget') || 0)
    const members = String(fd.get('members') || '').split(',').map(s=>s.trim()).filter(Boolean)
    if (!name || !status) return
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, status, budgetCents: Math.round(budget*100), members }) })
    if (!res.ok) {
      let msg = ''
      try {
        const j = await res.json(); msg = j?.error || ''
      } catch { msg = await res.text().catch(()=> '') }
      const text = String(msg || res.statusText || '')
      if (/free tier/i.test(text)) {
        setLimitMsg('You have reached the Free plan limit for projects. Upgrade your plan to add more projects.')
        setLimitOpen(true)
      } else {
        // fallback lightweight toast
        setLimitMsg(text || 'Failed to create project')
        setLimitOpen(true)
      }
      return
    }
    ;(document.getElementById('proj-name') as HTMLInputElement).value = ''
    ;(document.getElementById('proj-desc') as HTMLInputElement).value = ''
    setBudgetDisplay('')
    setBudgetNumber(0)
    await (window as any).refreshProjects?.()
  }
  return (
    <form onSubmit={onSubmit} className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-2 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <span aria-hidden>📁</span>
        <label className="sr-only" htmlFor="proj-name">Project name</label>
        <input id="proj-name" name="name" placeholder="New project name" className="rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200" required />
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden>📝</span>
        <label className="sr-only" htmlFor="proj-desc">Project description</label>
        <input id="proj-desc" name="description" placeholder="Description (optional)" className="rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 w-56" />
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden>⚑</span>
        <label className="sr-only" htmlFor="proj-status">Status</label>
        <select id="proj-status" name="status" className="rounded-md bg-slate-900 border border-slate-700 px-2 py-2 text-slate-200">
          {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s=> <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden>💰</span>
        <label className="sr-only" htmlFor="proj-budget">Budget</label>
        <input
          id="proj-budget"
          value={budgetDisplay}
          onChange={(e)=>{ const f = formatUsd(e.target.value); setBudgetDisplay(f.display); setBudgetNumber(f.value) }}
          inputMode="decimal"
          placeholder="Budget ($)"
          className="rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 w-40"
        />
        <input type="hidden" name="budget" value={budgetNumber} />
      </div>
      <button className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Create</button>
      {limitOpen && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>setLimitOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Upgrade to add more projects</div>
              <div className="text-sm text-slate-300 mt-1">{limitMsg || 'Free tier allows up to 5 projects.'}</div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setLimitOpen(false)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Close</button>
                <a href="/dashboard/settings?upgrade=1" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Upgrade Plan</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

function useProjectsData() {
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string; description?: string | null; taskCount: number; updatedAt: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'ALL'|'PLANNING'|'ACTIVE'|'ON_HOLD'|'COMPLETED'|'CANCELLED'>('ALL')
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState<'updated'|'created'>('updated')

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch { /* noop */ }
    finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshProjects = load
    }
    load()
    return () => {
      if (typeof window !== 'undefined' && (window as any).refreshProjects === load) {
        try { delete (window as any).refreshProjects } catch {}
      }
    }
  }, [load])

  async function rename(id: string) {
    const cur = projects.find(p => p.id === id)
    if (!cur) return
    const next = prompt('New project name', cur.name)
    if (next && next.trim() && next.trim() !== cur.name) {
      await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: next.trim() }) })
      load()
    }
  }
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  async function remove(id: string) { setDeleteId(id) }
  async function confirmDelete() {
    if (!deleteId) return
    await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    load()
  }

  const shown = projects
    .filter(p => filter==='ALL' ? true : (p as any).status === filter)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => sort==='updated' ? (new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()) : 0)

  return { projects, setProjects, loading, filter, setFilter, query, setQuery, sort, setSort, shown, rename, remove, deleteId, setDeleteId, confirmDelete }
}

function statusLabel(s: string | undefined) {
  return (s || 'ACTIVE').replace('_',' ')
}

function formatUsdCents(cents?: number) {
  if (!cents && cents !== 0) return '—'
  const n = Number(cents || 0) / 100
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function TrashButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} title="Delete" aria-label="Delete project" className="p-1.5 rounded border border-rose-700 text-rose-300 hover:bg-rose-900/30">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.25 4.5A1.5 1.5 0 019.75 3h4.5a1.5 1.5 0 011.5 1.5V6h3a.75.75 0 010 1.5h-1.06l-1.1 11.01A2.25 2.25 0 0114.35 21h-4.7a2.25 2.25 0 01-2.24-2.49L6.31 7.5H5.25A.75.75 0 015.25 6h3V4.5zm1.5 1.5h4.5V6h-4.5V6zM9 9.75a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zm4.5 0a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5z" clipRule="evenodd" /></svg>
    </button>
  )
}

function ProjectsList() {
  const { projects, loading, filter, setFilter, query, setQuery, sort, setSort, shown, rename, remove, deleteId, setDeleteId, confirmDelete } = useProjectsData()
  const [editing, setEditing] = React.useState<null | { id: string; name: string; status: string; budgetCents?: number }>(null)
  const [busy, setBusy] = React.useState(false)
  const [editName, setEditName] = React.useState('')
  const [editStatus, setEditStatus] = React.useState('PLANNING')
  const [editBudget, setEditBudget] = React.useState('')
  if (loading) return <div className="text-slate-400">Loading projects...</div>
  if (shown.length === 0) return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
      <div className="text-4xl mb-2">📂</div>
      <div className="text-slate-300">No projects yet</div>
      <div className="text-slate-500 text-sm mt-1">Create your first project using the form above</div>
    </div>
  )

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shown.map(p => (
        <a key={p.id} href={`/dashboard/projects/${p.id}`} data-proj-card className="group rounded-xl border border-slate-800 bg-slate-900 p-4 hover:bg-slate-900/80 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white truncate mr-2">{p.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={(e)=>{
                  e.preventDefault();
                  const cur = projects.find(x => x.id === p.id) as any
                  setEditing({ id: p.id, name: cur?.name || '', status: cur?.status || 'PLANNING', budgetCents: cur?.budgetCents })
                  setEditName(cur?.name || '')
                  setEditStatus(cur?.status || 'PLANNING')
                  setEditBudget(cur?.budgetCents ? String(Math.round(Number(cur.budgetCents)/100)) : '')
                }}
                className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
              >Edit</button>
              <TrashButton onClick={(e)=>{e.preventDefault(); remove(p.id)}} />
            </div>
          </div>
          <div className="text-slate-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">{(p as any).description || 'No description'}</div>
          <div className="mt-3 h-1.5 bg-slate-200 rounded overflow-hidden">
            {(() => {
              const pct = Math.min(100, Math.round(((p as any).doneCount || 0) / Math.max(1,(p as any).taskCount) * 100))
              // Compute a smooth hue from red (0) -> orange -> yellow -> green (120) as completion increases
              const hue = Math.round((pct / 100) * 120)
              const start = `hsl(${Math.max(0,hue-10)}, 90%, 50%)`
              const end = `hsl(${Math.min(120,hue+10)}, 90%, 45%)`
              const bg = `linear-gradient(90deg, ${start}, ${end})`
              return (
                <div
                  className="h-1.5 rounded"
                  aria-label="Project progress"
                  data-progress={pct}
                  style={{ width: `${pct}%`, backgroundImage: bg, boxShadow: `0 0 6px hsla(${hue}, 90%, 45%, 0.35)` }}
                />
              )
            })()}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Status: {statusLabel((p as any).status)}</span>
            <span className="truncate ml-2">Budget: {formatUsdCents((p as any).budgetCents)} · Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
          </div>
        </a>
      ))}
      {editing && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!busy && setEditing(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Edit Project</div>
              <div className="text-sm text-slate-400 mt-1">Update the project’s details.</div>
              <form
                onSubmit={async (e)=>{
                  e.preventDefault();
                  setBusy(true)
                  try {
                    const patch: any = { name: editName.trim(), status: editStatus }
                    const num = Number(editBudget.replace(/[^0-9.]/g,''))
                    if (!Number.isNaN(num)) patch.budgetCents = Math.round(num*100)
                    await fetch(`/api/projects/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
                    setEditing(null)
                    await (window as any).refreshProjects?.()
                  } finally {
                    setBusy(false)
                  }
                }}
                className="mt-4 grid gap-3"
              >
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-300">Name</span>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-300">Status</span>
                  <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} className="px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200">
                    {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s => (
                      <option key={s} value={s}>{s.replace('_',' ')}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-300">Budget ($)</span>
                  <input value={editBudget} onChange={e=>setEditBudget(e.target.value)} inputMode="decimal" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
                </label>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={()=>!busy && setEditing(null)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                  <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {deleteId && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>setDeleteId(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Delete project?</div>
              <div className="text-sm text-slate-300 mt-1">This will remove the project and its tasks. This action cannot be undone.</div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setDeleteId(null)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectsToolbar({ view, setView }: { view: 'cards'|'kanban'|'gantt'; setView: (v: 'cards'|'kanban'|'gantt') => void }) {
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('ALL')
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search projects" className="rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200" />
          <label className="sr-only" htmlFor="proj-filter-status">Filter status</label>
          <select id="proj-filter-status" title="Filter status" aria-label="Filter status" value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-md bg-slate-900 border border-slate-700 px-2 py-2 text-slate-200">
            {['ALL','PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s=> <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={()=>setView('cards')}
            className={`view-toggle ${view==='cards'
              ? 'is-active view-toggle--cards light:!bg-emerald-600 light:!text-white light:!border-emerald-700'
              : 'view-toggle--cards light:!text-emerald-600 light:!border-emerald-400'}`}
          >
            Cards
          </button>
          <button
            data-view-toggle="kanban"
            onClick={()=>setView('kanban')}
            className={`view-toggle view-toggle--kanban light:!bg-amber-500 light:!text-white light:!border-amber-600 ${view==='kanban' ? 'is-active' : ''}`}
          >
            Kanban
          </button>
          <button
            data-view-toggle="gantt"
            onClick={()=>setView('gantt')}
            className={`view-toggle view-toggle--gantt light:!bg-rose-500 light:!text-white light:!border-rose-600 ${view==='gantt' ? 'is-active' : ''}`}
          >
            Gantt
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectsKanban() {
  const { shown, loading, rename, remove } = useProjectsData()
  if (loading) return <div className="text-slate-400">Loading projects...</div>
  const columns = ['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED']
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
      {columns.map(col => (
        <div key={col} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          <div className="text-sm font-medium text-white mb-2">{col.replace('_',' ')}</div>
          <div className="grid gap-2">
            {shown.filter(p => (p as any).status === col).map(p => (
              <a key={p.id} href={`/dashboard/projects/${p.id}`} data-proj-card-kanban className="rounded-lg border border-slate-800 bg-slate-900 p-3 hover:bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <div className="text-slate-200 truncate mr-2">{p.name}</div>
                  <TrashButton onClick={(e)=>{ e.preventDefault(); remove(p.id) }} />
                </div>
                <div className="text-xs text-slate-500 mt-1">Budget: {formatUsdCents((p as any).budgetCents)}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectsGantt() {
  const { shown, loading } = useProjectsData()
  if (loading) return <div className="text-slate-400">Loading projects...</div>
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <div className="text-sm text-slate-300 mb-2">Simple Gantt (progress-based)</div>
      <div className="grid gap-2">
        {shown.map(p => {
          const done = Math.min(100, Math.round(((p as any).doneCount || 0) / Math.max(1,(p as any).taskCount) * 100))
          return (
            <div key={p.id} className="grid gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="truncate mr-2">{p.name}</span>
                <span>{done}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded">
                <div className="h-2 rounded bg-indigo-500" style={{ width: `${done}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


