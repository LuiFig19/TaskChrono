"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { debounce } from '@/lib/utils'

type Entry = {
  id: string
  name: string
  startedAt: string
  endedAt: string | null
  durationMin: number
  timerId: string | null
}

type Timer = {
  id: string
  name: string
  tags: string[]
  finalizedAt?: string | null
  createdAt: string
}

type Props = {
  userId: string
  initialEntries: Entry[]
  initialTimers: Timer[]
}

function formatDuration(min: number): string {
  const totalSec = Math.max(0, Math.round((min || 0) * 60))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const parts: string[] = []
  if (h) parts.push(`${h}h`)
  if (m || (!h && !s)) parts.push(`${m}m`)
  if (s) parts.push(`${s}s`)
  return parts.join(' ')
}

export default function TimersClient({ userId, initialEntries, initialTimers }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [timers, setTimers] = useState<Timer[]>(initialTimers)
  const [filter, setFilter] = useState<'all'|'active'|'paused'|'ended'|'today'|'week'>('all')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [sort, setSort] = useState<'recent'|'oldest'|'longest'|'shortest'>('recent')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [tick, setTick] = useState(0)

  const socketRef = useRef<Socket | null>(null)
  const connectedRef = useRef(false)

  // Socket.IO client hookup (path '/ws') and auth room join
  useEffect(() => {
    // Ensure the server is bootstrapped
    fetch('/api/socket').catch(()=>{})
    const s = io('/', { path: '/ws', transports: ['websocket', 'polling'] })
    socketRef.current = s
    s.on('connect', () => {
      connectedRef.current = true
      s.emit('auth', userId)
    })
    const handler = () => refresh()
    s.on('timer:changed', handler)
    return () => {
      s.off('timer:changed', handler)
      s.disconnect()
    }
  }, [userId])

  useEffect(() => {
    setHydrated(true)
    const id = setInterval(() => setTick((t)=>t+1), 30000)
    return () => clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/timers/list', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json() as { entries: Entry[]; timers: Timer[] }
    setEntries(data.entries)
    setTimers(data.timers)
  }, [])

  // Keyboard shortcuts: Space pause/resume last active; N new timer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/input|textarea|select/i)) return
      if (e.code === 'Space') {
        e.preventDefault()
        const active = entries.filter(e => !e.endedAt).sort((a,b)=>new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime())[0]
        if (active) {
          pause(active.timerId)
        } else {
          const last = entries.filter(e => !!e.endedAt).sort((a,b)=>new Date(b.endedAt as string).getTime()-new Date(a.endedAt as string).getTime())[0]
          if (last) resume(last.timerId, last.name)
        }
        return
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [entries])

  // Derived views
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const t of timers) for (const tag of t.tags || []) set.add(tag)
    return Array.from(set).sort((a,b)=>a.localeCompare(b))
  }, [timers])

  type Row = { timerId: string; name: string; startedAt: string | null; endedAt: string | null; durationMin: number; status: 'active'|'paused'|'ended'; tags: string[] }
  const rows: Row[] = useMemo(() => {
    const byTimer: Row[] = []
    const map = new Map<string, { totalEnded: number; lastStart: string | null; lastEnd: string | null; activeStart: string | null }>()
    for (const t of timers) {
      map.set(t.id, { totalEnded: 0, lastStart: null, lastEnd: null, activeStart: null })
    }
    for (const e of entries) {
      const b = map.get(e.timerId || '')
      if (!b) continue
      if (e.endedAt) {
        b.totalEnded += e.durationMin || 0
        b.lastEnd = !b.lastEnd || new Date(e.endedAt) > new Date(b.lastEnd) ? e.endedAt : b.lastEnd
      } else {
        b.activeStart = !b.activeStart || new Date(e.startedAt) > new Date(b.activeStart) ? e.startedAt : b.activeStart
      }
      b.lastStart = !b.lastStart || new Date(e.startedAt) > new Date(b.lastStart) ? e.startedAt : b.lastStart
    }
    const now = hydrated ? Date.now() : 0
    for (const t of timers) {
      const b = map.get(t.id)!
      let status: Row['status'] = 'paused'
      if (t.finalizedAt) status = 'ended'
      else if (b.activeStart) status = 'active'
      // Compute display duration: sum of ended + live seconds
      let minutes = b.totalEnded
      if (status === 'active' && b.activeStart && now) {
        minutes += Math.max(0, Math.round((now - new Date(b.activeStart).getTime())/60000))
      }
      const shouldShow = !!(b.lastStart || b.activeStart || t.finalizedAt)
      if (!shouldShow) continue
      byTimer.push({
        timerId: t.id,
        name: t.name || 'Timer',
        startedAt: b.lastStart,
        endedAt: b.lastEnd,
        durationMin: minutes,
        status,
        tags: t.tags || [],
      })
    }
    return byTimer
  }, [entries, timers, hydrated, tick])

  const filteredRows = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
    const startOfWeek = new Date(now); const day = startOfWeek.getDay() || 7; startOfWeek.setDate(startOfWeek.getDate() - (day-1)); startOfWeek.setHours(0,0,0,0)
    let r = rows.slice()
    if (filter === 'active') r = r.filter(x => x.status === 'active')
    if (filter === 'paused') r = r.filter(x => x.status === 'paused')
    if (filter === 'ended') r = r.filter(x => x.status === 'ended')
    if (filter === 'today') r = r.filter(x => x.startedAt && new Date(x.startedAt) >= startOfDay)
    if (filter === 'week') r = r.filter(x => x.startedAt && new Date(x.startedAt) >= startOfWeek)
    if (tagFilter) r = r.filter(x => x.tags.includes(tagFilter))
    if (sort === 'recent') r.sort((a,b)=> new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
    if (sort === 'oldest') r.sort((a,b)=> new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime())
    if (sort === 'longest') r.sort((a,b)=> (b.durationMin||0) - (a.durationMin||0))
    if (sort === 'shortest') r.sort((a,b)=> (a.durationMin||0) - (b.durationMin||0))
    return r
  }, [rows, filter, tagFilter, sort])

  const totalEndedMin = useMemo(() => filteredRows.filter(r=>r.status==='ended').reduce((acc,r)=> acc + (r.durationMin||0), 0), [filteredRows])

  // Actions
  const pause = useCallback(async (timerId: string | null) => {
    if (!timerId) return
    // optimistic: close latest active entry for this timer
    setEntries(prev => {
      const copy = [...prev]
      let idx = -1
      for (let i = 0; i < copy.length; i++) {
        const e = copy[i]
        if (e.timerId === timerId && !e.endedAt) { idx = i; break }
      }
      if (idx >= 0) {
        const now = new Date()
        const cur = copy[idx]
        const started = new Date(cur.startedAt)
        const minutes = Math.max(0, Math.round((now.getTime() - started.getTime())/60000))
        copy[idx] = { ...cur, endedAt: now.toISOString(), durationMin: (cur.durationMin || 0) + minutes }
      }
      return copy
    })
    await fetch('/api/timers/stop', { method: 'POST', body: timerId ? new URLSearchParams({ timerId }) : undefined as any })
  }, [])

  const resume = useCallback(async (timerId: string | null, name: string) => {
    // optimistic: start a new active entry on this timer
    if (timerId) {
      setEntries(prev => [{ id: `tmp-${Math.random().toString(36).slice(2)}`, name: name || 'Timer', startedAt: new Date().toISOString(), endedAt: null, durationMin: 0, timerId }, ...prev])
    }
    await fetch('/api/timers/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timerId, name }) })
  }, [])

  const end = useCallback(async (timerId: string | null) => {
    if (!timerId) return
    // optimistic: finalize timer
    setTimers(prev => prev.map(t => t.id === timerId ? { ...t, finalizedAt: new Date().toISOString() } : t))
    await fetch('/api/timers/end', { method: 'POST', body: new URLSearchParams({ timerId }) })
  }, [])

  const removeTimer = useCallback(async (timerId: string) => {
    // optimistic: remove immediately
    setTimers(prev => prev.filter(t => t.id !== timerId))
    setEntries(prev => prev.filter(e => e.timerId !== timerId))
    const body = new URLSearchParams()
    body.set('timerId', timerId)
    await fetch('/api/timers/remove', { method: 'POST', body })
  }, [])

  const updateTags = useCallback(async (timerId: string, tags: string[]) => {
    await fetch('/api/timers/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timerId, tags }) })
  }, [])
  const debouncedUpdateTags = useMemo(() => debounce(updateTags, 400), [updateTags])

  // UI
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold">Timers</h1>
      <div className="mt-2 text-slate-300">Total Time Tracked: <span className="font-medium" suppressHydrationWarning>{formatDuration(totalEndedMin)}</span></div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button id="tc-add-timer" className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setOpen(true)}>+ Add Timer</button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Filter:</label>
          <select className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200" value={filter} onChange={e=>setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Tag:</label>
          <select className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200" value={tagFilter} onChange={e=>setTagFilter(e.target.value)}>
            <option value="">All</option>
            {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sort:</label>
          <select className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200" value={sort} onChange={e=>setSort(e.target.value as any)}>
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="longest">Longest</option>
            <option value="shortest">Shortest</option>
          </select>
        </div>
        <form method="post" action="/api/timers/export" className="ml-auto flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <input type="hidden" name="tag" value={tagFilter} />
          <input type="hidden" name="sort" value={sort} />
          <button name="format" value="csv" className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">CSV</button>
          <button name="format" value="xlsx" className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Excel</button>
          <button name="format" value="json" className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">JSON</button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Live</th>
              <th className="text-left px-3 py-2">Start</th>
              <th className="text-left px-3 py-2">End</th>
              <th className="text-left px-3 py-2">Duration</th>
              <th className="text-left px-3 py-2">Controls</th>
              <th className="text-left px-3 py-2">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredRows.map((row) => {
              const isActive = row.status === 'active'
              const isEnded = row.status === 'ended'
              return (
                <tr key={row.timerId} className="hover:bg-slate-900">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{isActive ? <span className="inline-flex items-center gap-1 text-emerald-400"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> running</span> : (isEnded ? <span className="text-slate-400">Ended</span> : <span className="text-amber-400">Paused</span>)}</td>
                  <td className="px-3 py-2">{row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">{row.endedAt ? new Date(row.endedAt).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2" suppressHydrationWarning>{formatDuration(row.durationMin)}</td>
                  <td className="px-3 py-2">
                    {isActive ? (
                      <>
                        <button className="px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]" onClick={() => pause(row.timerId)}>Pause</button>
                        <button className="ml-2 px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]" onClick={() => end(row.timerId)}>End</button>
                      </>
                    ) : (
                      !isEnded && <button className="px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]" onClick={() => resume(row.timerId, row.name)}>Start</button>
                    )}
                    <button className="ml-2 px-2 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 active:scale-[0.98]" onClick={() => setConfirmDeleteId(row.timerId)} title="Delete timer">🗑️</button>
                  </td>
                  <td className="px-3 py-2">
                    <TagBadges
                      value={timers.find(t => t.id === row.timerId)?.tags || []}
                      onChange={(next) => {
                        setTimers(prev => prev.map(tt => tt.id === row.timerId ? { ...tt, tags: next } : tt))
                        debouncedUpdateTags(row.timerId!, next)
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-8">
        <Analytics entries={entries} timers={timers} filter={filter} tagFilter={tagFilter} />
      </div>

      {open && (
        <div className="fixed inset-0 z-[100000]">
          <div className="absolute inset-0 bg-slate-950/90" onClick={()=>!busy && setOpen(false)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-2xl">
              <div className="text-white font-semibold">Create Timer</div>
              <div className="text-sm text-slate-400 mt-1">Name your timer to keep things organized.</div>
              <form
                onSubmit={async (e)=>{ e.preventDefault(); setBusy(true); try { const n = (name || '').trim(); await fetch('/api/timers/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) }); await refresh(); setOpen(false); setName('') } finally { setBusy(false) } }}
                className="mt-4 grid gap-3"
              >
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Timer name" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={()=>!busy && setOpen(false)} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Cancel</button>
                  <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-transform active:scale-[0.98]">{busy ? 'Starting…' : 'Start'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100001]">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setConfirmDeleteId(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5">
              <div className="text-white font-medium">Delete timer entry?</div>
              <div className="text-slate-400 text-sm mt-1">This action cannot be undone.</div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="px-3 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800" onClick={()=>setConfirmDeleteId(null)}>Cancel</button>
                <button className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700" onClick={async()=>{ const id = confirmDeleteId; setConfirmDeleteId(null); if (id) await removeTimer(id) }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TagBadges({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState<string[]>(value)
  useEffect(() => { setDraft(value) }, [value])
  const [inputOpen, setInputOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const commit = useCallback((next: string[]) => onChange(Array.from(new Set(next.map(t=>t.trim()).filter(Boolean)))), [onChange])
  return (
    <div className="flex items-center gap-1 flex-wrap max-w-[340px]">
      {draft.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-200 border border-slate-700">
          {tag}
          <button className="ml-1 text-slate-400 hover:text-white" onClick={() => { const next = draft.filter(t => t !== tag); setDraft(next); commit(next) }}>×</button>
        </span>
      ))}
      {inputOpen ? (
        <form onSubmit={(e)=>{ e.preventDefault(); const t = newTag.trim(); if (!t) return; const next = [...draft, t]; setDraft(next); commit(next); setNewTag(''); setInputOpen(false) }} className="inline-flex items-center gap-1">
          <input value={newTag} onChange={(e)=>setNewTag(e.target.value)} className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-200 w-28" placeholder="tag" autoFocus />
          <button className="px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" type="submit">Add</button>
        </form>
      ) : (
        <button className="px-2 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={()=>setInputOpen(true)}>+ Quick add</button>
      )}
    </div>
  )
}

function Analytics({ entries, timers, filter, tagFilter }: { entries: Entry[]; timers: Timer[]; filter: string; tagFilter: string }) {
  // Lazy-load Recharts only on client
  const [R, setR] = useState<any>(null)
  useEffect(() => {
    import('recharts').then(setR)
  }, [])
  // UI state must be declared before any early returns to keep hook order stable
  const [mode, setMode] = useState<'tags'|'projects'>('tags')
  // Filter entries for analytics (ended entries only)
  const filtered = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
    const startOfWeek = new Date(now); const day = startOfWeek.getDay() || 7; startOfWeek.setDate(startOfWeek.getDate() - (day-1)); startOfWeek.setHours(0,0,0,0)
    const tagMatch = (e: Entry) => {
      if (!tagFilter) return true
      const t = timers.find(t => t.id === e.timerId)
      return !!t && (t.tags || []).includes(tagFilter)
    }
    return entries.filter(e => {
      if (!e.endedAt) return false
      if (!tagMatch(e)) return false
      if (filter === 'today') return new Date(e.startedAt) >= startOfDay
      if (filter === 'week') return new Date(e.startedAt) >= startOfWeek
      if (filter === 'ended' || filter === 'paused' || filter === 'active' || filter === 'all') return true
      return true
    })
  }, [entries, timers, filter, tagFilter])

  // Breakdown by tag and by project (timer name)
  const breakdownByTag = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filtered) {
      const t = timers.find(t => t.id === e.timerId)
      for (const tag of t?.tags || []) map.set(tag, (map.get(tag) || 0) + (e.durationMin || 0))
    }
    return Array.from(map.entries()).map(([label, minutes]) => ({ label, minutes }))
  }, [filtered, timers])

  const breakdownByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filtered) {
      const t = timers.find(t => t.id === e.timerId)
      const label = (t?.name || e.name || 'Timer').trim() || 'Timer'
      map.set(label, (map.get(label) || 0) + (e.durationMin || 0))
    }
    return Array.from(map.entries()).map(([label, minutes]) => ({ label, minutes }))
  }, [filtered, timers])

  // Weekly stacked data (current week, by top categories)
  const weeklyStacked = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now); const day = startOfWeek.getDay() || 7; startOfWeek.setDate(startOfWeek.getDate() - (day-1)); startOfWeek.setHours(0,0,0,0)
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0,10)
      return { date: d, key }
    })
    const perDay = new Map<string, Map<string, number>>()
    const labelFor = (e: Entry) => {
      const t = timers.find(t => t.id === e.timerId)
      return (t?.name || e.name || 'Timer').trim() || 'Timer'
    }
    for (const e of filtered) {
      const d = new Date(e.startedAt)
      if (d < startOfWeek || d > endOfWeek) continue
      const dayKey = d.toISOString().slice(0,10)
      const label = labelFor(e)
      if (!perDay.has(dayKey)) perDay.set(dayKey, new Map())
      const m = perDay.get(dayKey)!
      m.set(label, (m.get(label) || 0) + (e.durationMin || 0))
    }
    // determine top 4 labels overall
    const labelTotals = new Map<string, number>()
    perDay.forEach((m)=> m.forEach((v,k)=> labelTotals.set(k, (labelTotals.get(k)||0)+v)))
    const top = Array.from(labelTotals.entries()).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k])=>k)
    const data = days.map(({ key, date }) => {
      const row: any = { day: date.toLocaleDateString(undefined, { weekday: 'short' }) }
      const m = perDay.get(key) || new Map()
      let other = 0
      m.forEach((v,k)=> { if (top.includes(k)) row[k] = v/60; else other += v/60 })
      if (other > 0) row['Other'] = other
      return row
    })
    const totalsPerDay = data.map(d => Object.keys(d).filter(k=>k!=='day').reduce((a,k)=>a+(d as any)[k],0))
    const totalWeek = totalsPerDay.reduce((a,b)=>a+b,0)
    // last week comparison
    const lastWeekStart = new Date(startOfWeek); lastWeekStart.setDate(lastWeekStart.getDate()-7)
    const lastWeekEnd = new Date(endOfWeek); lastWeekEnd.setDate(lastWeekEnd.getDate()-7)
    const lastWeekMinutes = entries.filter(e=> e.endedAt && new Date(e.startedAt)>=lastWeekStart && new Date(e.startedAt)<=lastWeekEnd).reduce((acc,e)=>acc+(e.durationMin||0),0)/60
    const most = Math.max(...totalsPerDay)
    const least = Math.min(...totalsPerDay)
    const mostIdx = totalsPerDay.indexOf(most)
    const leastIdx = totalsPerDay.indexOf(least)
    const mostLabel = days[mostIdx]?.date.toLocaleDateString(undefined,{ weekday:'short' }) || ''
    const leastLabel = days[leastIdx]?.date.toLocaleDateString(undefined,{ weekday:'short' }) || ''
    return { data, keys: [...top, 'Other'].filter(Boolean), totalWeek, lastWeekHours: lastWeekMinutes, most, least, mostLabel, leastLabel }
  }, [filtered, entries, timers])

  if (!R) return null
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } = R
  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#10b981', '#64748b']

  const breakdown = mode === 'tags' ? breakdownByTag : breakdownByProject
  const totalMinutes = breakdown.reduce((a,b)=>a+b.minutes,0)
  const top3 = [...breakdown].sort((a,b)=>b.minutes-a.minutes).slice(0,3)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Productivity Breakdown */}
      <div className="rounded-md border border-slate-800 p-3 bg-slate-950">
        <div className="flex items-center justify-between mb-2">
          <div className="text-slate-200">Productivity breakdown</div>
          <div className="text-xs text-slate-300 flex items-center gap-1">
            <button className={`px-2 py-1 rounded-md ${mode==='projects'?'bg-slate-800 text-white':'text-slate-300 border border-slate-700'}`} onClick={()=>setMode('projects')}>Projects</button>
            <button className={`px-2 py-1 rounded-md ${mode==='tags'?'bg-slate-800 text-white':'text-slate-300 border border-slate-700'}`} onClick={()=>setMode('tags')}>Tags</button>
          </div>
        </div>
        <div style={{ height: 260 }}>
          {breakdown.length === 0 ? (
            <div className="h-full grid place-items-center text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown.map((d,i)=>({ ...d, value: d.minutes }))} dataKey="value" nameKey="label" innerRadius={60} outerRadius={95}>
                  {breakdown.map((_: any, idx: number) => (<Cell key={idx} fill={colors[idx % colors.length]} stroke="#0f172a" strokeWidth={1} />))}
                </Pie>
                <Legend />
                <Tooltip
                  wrapperStyle={{ outline: 'none' }}
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid #475569', 
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  labelStyle={{ color: '#f8fafc', fontWeight: '600' }}
                  formatter={(v: any) => `${formatDuration(Number(v))} (${((Number(v)/totalMinutes)*100||0).toFixed(0)}%)`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 space-y-1 text-sm">
          {top3.map((t,i)=> (
            <div key={t.label} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} /> {t.label}</div>
              <div>{formatDuration(t.minutes)} ({((t.minutes/totalMinutes)*100||0).toFixed(0)}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Timeline */}
      <div className="rounded-md border border-slate-800 p-3 bg-slate-950">
        <div className="mb-2 text-slate-200">Weekly timeline</div>
        <div style={{ height: 260 }}>
          {weeklyStacked.data.length === 0 ? (
            <div className="h-full grid place-items-center text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStacked.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: '#cbd5e1' }} />
                <YAxis tick={{ fill: '#cbd5e1' }} unit="h" />
                <Legend />
                <Tooltip
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: '#111827', opacity: 0.35 }}
                  contentStyle={{ 
                    background: '#1e293b', 
                    border: '1px solid #475569', 
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  labelStyle={{ color: '#f8fafc', fontWeight: '600' }}
                  formatter={(v: any) => `${Number(v).toFixed(1)}h`}
                />
                {weeklyStacked.keys.map((k, idx) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={colors[idx % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 text-sm text-slate-300">
          You tracked <span className="text-white font-medium">{weeklyStacked.totalWeek.toFixed(1)}h</span> this week
          {Number.isFinite(weeklyStacked.lastWeekHours) && (
            <>,&nbsp;{(weeklyStacked.totalWeek-weeklyStacked.lastWeekHours>=0?'+':'')}{(weeklyStacked.totalWeek-weeklyStacked.lastWeekHours).toFixed(1)}h vs last week</>
          )}.
          <div className="mt-1">Best: {weeklyStacked.mostLabel} {weeklyStacked.most.toFixed(1)}h • Low: {weeklyStacked.leastLabel} {weeklyStacked.least.toFixed(1)}h</div>
        </div>
      </div>
    </div>
  )
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1))
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7)
}


