"use client"

import React from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function ProjectsClient() {
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

      <ProjectsToolbar />

      <div className="-mt-2 space-y-3">
        <ProjectsList />
      </div>
    </div>
  )
}

function CreateProjectForm() {
  const [budgetDisplay, setBudgetDisplay] = React.useState("")
  const [budgetNumber, setBudgetNumber] = React.useState<number>(0)

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
      const msg = await res.text().catch(()=> '')
      alert(`Failed to create project: ${msg || res.statusText}`)
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
          {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s=> <option key={s} value={s}>{s}</option>)}
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
    </form>
  )
}

function ProjectsList() {
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
  async function remove(id: string) {
    if (!confirm('Delete this project and its tasks?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    load()
  }

  const shown = projects
    .filter(p => filter==='ALL' ? true : (p as any).status === filter)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => sort==='updated' ? (new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()) : 0)

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
        <a key={p.id} href={`/dashboard/projects/${p.id}`} className="group rounded-xl border border-slate-800 bg-slate-900 p-4 hover:bg-slate-900/80 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white truncate mr-2">{p.name}</div>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={(e)=>{e.preventDefault(); rename(p.id)}} className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800">Rename</button>
              <button onClick={(e)=>{e.preventDefault(); remove(p.id)}} className="px-2 py-1 rounded border border-rose-700 text-rose-300 hover:bg-rose-900/30">Delete</button>
            </div>
          </div>
          <div className="text-slate-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">{(p as any).description || 'No description'}</div>
          <div className="mt-3 h-1.5 bg-slate-800 rounded">
            <div
              className="h-1.5 rounded bg-indigo-500"
              aria-label="Project progress"
              data-progress={Math.min(100, Math.round(((p as any).doneCount || 0) / Math.max(1,(p as any).taskCount) * 100))}
              style={{ width: `${Math.min(100, Math.round(((p as any).doneCount || 0) / Math.max(1,(p as any).taskCount) * 100))}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>Status: {(p as any).status || 'ACTIVE'}</span>
            <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

function ProjectsToolbar() {
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('ALL')
  const [view, setView] = React.useState<'cards'|'kanban'|'gantt'>('cards')
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search projects" className="rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200" />
          <label className="sr-only" htmlFor="proj-filter-status">Filter status</label>
          <select id="proj-filter-status" title="Filter status" aria-label="Filter status" value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-md bg-slate-900 border border-slate-700 px-2 py-2 text-slate-200">
            {['ALL','PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={()=>setView('cards')} className={`px-2.5 py-1 rounded border ${view==='cards'?'border-indigo-500 text-indigo-300':'border-slate-700 text-slate-300'} hover:bg-slate-800`}>Cards</button>
          <a href="/dashboard/projects" className={`px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800`}>Kanban</a>
          <a href="/dashboard/projects" className={`px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800`}>Gantt</a>
        </div>
      </div>
    </div>
  )
}


