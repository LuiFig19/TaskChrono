"use client"
import React, { useEffect, useMemo, useState } from 'react'
import ProjectProgressWidget from './ProjectProgressWidget'
import ResponsiveGridLayout from './RGLResponsiveClient'
import { useWidgetLayout, type RglItem } from './useWidgetLayout'
import MonthGrid from '../calendar/MonthGrid'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  return `${h}h ${m}m`
}

function TimeOverviewWidget() {
  const { data } = useSWR('/api/timers/list', (u)=>fetch(u, { cache: 'no-store' }).then(r=>r.json()))
  const totals = useMemo(() => {
    const entries = (data?.entries ?? []) as { startedAt: string; endedAt: string | null; durationMin: number }[]
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const within = (d: Date, from: Date) => d >= from
    const sum = (from: Date) => entries.reduce((acc, e) => {
      const end = e.endedAt ? new Date(e.endedAt) : null
      const start = new Date(e.startedAt)
      if (!end) return acc
      if (within(end, from)) return acc + (e.durationMin || 0)
      return acc
    }, 0)
    return {
      today: sum(startOfDay),
      week: sum(startOfWeek),
      month: sum(startOfMonth),
    }
  }, [data])
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
      {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }].map((s:any) => (
        <div key={s.key} className="rounded-md border border-slate-700 p-3">
          <div className="text-xs text-slate-400">{s.label}</div>
          <div className="text-xl font-semibold text-white">{formatDuration((totals as any)?.[s.key] ?? 0)}</div>
        </div>
      ))}
    </div>
  )
}

function TaskCompletionWidget() {
  const [projectId, setProjectId] = useState<string | 'all'>('all')
  const { data } = useSWR('/api/tasks', (u)=>fetch(u, { cache: 'no-store' }).then(r=>r.json()))
  const options = (data?.projects ?? []) as { id: string; name: string; tasks: { status: string }[] }[]
  const { percent } = useMemo(() => {
    const list = projectId === 'all' ? options.flatMap(p=>p.tasks) : (options.find(p=>p.id===projectId)?.tasks ?? [])
    if (list.length === 0) return { percent: 0 }
    const done = list.filter(t => String(t.status).toUpperCase() === 'DONE').length
    return { percent: Math.round((done / list.length) * 100) }
  }, [options, projectId])
  return (
    <div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-slate-400">Project</label>
        <select aria-label="Select project" value={projectId} onChange={(e)=>setProjectId(e.target.value as any)} className="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-100">
          <option value="all">All</option>
          {options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="mt-3 text-3xl text-white">{percent}%</div>
      <div className="text-xs text-slate-400">Completion</div>
    </div>
  )
}

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

type Widget = { id: string; title: string; render: () => React.ReactNode }

export default function DashboardGrid({ plan, pin }: { plan: Plan; pin?: string }) {
  // Curated default coordinates to eliminate the top-right gap
  const curated: Record<string, RglItem> = {
    calendar:   { i: 'calendar',    x: 0,  y: 0,  w: 8, h: 8 },
    overview:   { i: 'overview',    x: 8,  y: 0,  w: 4, h: 4 },
    completion: { i: 'completion',  x: 8,  y: 4,  w: 4, h: 4 },
    activity:   { i: 'activity',    x: 0,  y: 8,  w: 4, h: 8 },
    progress:   { i: 'progress',    x: 4,  y: 8,  w: 8, h: 6 },
    analytics:  { i: 'analytics',   x: 0,  y: 14, w: 4, h: 4 },
    inventory:  { i: 'inventory',   x: 4,  y: 14, w: 4, h: 6 },
    timer_active:{ i: 'timer_active',x: 8,  y: 16, w: 4, h: 3 },
  }
  const initialOrder = useMemo(() => Object.keys(curated), [])
  const [order, setOrder] = useState<string[]>(initialOrder)
  const DEFAULT_LAYOUT = useMemo(() => order.map((id) => curated[id]).filter(Boolean), [order])

  const { layout, saveLayout, reset, loading } = useWidgetLayout(DEFAULT_LAYOUT, 'main')

  useEffect(() => { if (pin && !order.includes(pin)) setOrder((o)=> o.includes(pin) ? o : [...o, pin]) }, [pin, order])

  // Listen for Add Widget events and append the widget to the grid without navigation
  useEffect(() => {
    function onAdd(e: Event) {
      const id = (e as any)?.detail?.id as string | undefined
      if (!id) return
      setOrder(prev => prev.includes(id) ? prev : [...prev, id])
      // If current layout doesn't have a position for this widget, add one at the end
      const has = Array.isArray(layout) && (layout as any[]).some((l) => l.i === id)
      if (!has) {
        const pos = (curated as any)[id] || { i: id, x: 0, y: Infinity, w: 4, h: 4 }
        saveLayout([...(layout as any[] || []), pos] as any)
      }
    }
    document.addEventListener('tc:add-widget' as any, onAdd)
    return () => document.removeEventListener('tc:add-widget' as any, onAdd)
  }, [layout, saveLayout])

  // Fetch calendar events for the month so MonthGrid can render
  const [calEvents, setCalEvents] = useState<any[]>([])
  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    async function fetchMonth() {
      try {
        const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          setCalEvents(Array.isArray(json.events) ? json.events : [])
        }
      } catch {}
    }
    fetchMonth()
    function onChanged() { fetchMonth() }
    document.addEventListener('tc:calendar-changed' as any, onChanged)
    return () => document.removeEventListener('tc:calendar-changed' as any, onChanged)
  }, [])

  // Data for widgets
  const widgets: Record<string, Widget> = {
    overview: { id: 'overview', title: 'Time Tracking Overview', render: () => (
      <TimeOverviewWidget />
    ) },
    activity: { id: 'activity', title: 'Team Activity Feed', render: () => (
      <div className="mt-4 text-sm text-slate-300">No activity yet. Start a chat or create a task to get started.</div>
    ) },
    progress: { id: 'progress', title: 'Project Progress', render: () => <ProjectProgressWidget /> },
    completion: { id: 'completion', title: 'Task Completion', render: () => (
      <TaskCompletionWidget />
    ) },
    analytics: { id: 'analytics', title: 'Analytics', render: () => (<div className="mt-2 text-sm text-slate-400">Charts will appear here as you add data.</div>) },
    calendar: { id: 'calendar', title: 'Calendar', render: () => (
      <div className="mt-3 text-sm text-slate-400">
        <div className="flex items-center justify-between">
          <div>Quick view of this month. Create detailed events in Calendar.</div>
          <div className="flex gap-1">
            <a href="/dashboard/calendar?month=prev" className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-700 hover:bg-slate-800" aria-label="Previous month">⟵</a>
            <a href="/dashboard/calendar?month=next" className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-700 hover:bg-slate-800" aria-label="Next month">⟶</a>
          </div>
        </div>
        {(() => {
          const now = new Date()
          const year = now.getFullYear()
          const month = now.getMonth()
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
          const clsMap: Record<string, { bg: string; ring: string }> = {
            meeting: { bg: 'bg-blue-500/30', ring: 'ring-blue-400/60' },
            release: { bg: 'bg-lime-500/30', ring: 'ring-lime-400/60' },
            invoice: { bg: 'bg-rose-500/30', ring: 'ring-rose-400/60' },
            review: { bg: 'bg-violet-500/30', ring: 'ring-violet-400/60' },
            demo: { bg: 'bg-teal-500/30', ring: 'ring-teal-400/60' },
            deadline: { bg: 'bg-amber-500/30', ring: 'ring-amber-400/60' },
            personal: { bg: 'bg-emerald-500/30', ring: 'ring-emerald-400/60' },
            urgent: { bg: 'bg-red-600/30', ring: 'ring-red-500/60' },
            general: { bg: 'bg-fuchsia-500/30', ring: 'ring-fuchsia-400/60' },
          }
          const getMeta = (day: number) => {
            const dateStr = new Date(year, month, day).toDateString()
            const dayEvents = (calEvents || []).filter((e: any) => new Date(e.startsAt).toDateString() === dateStr)
            if (dayEvents.length === 0) return null
            const items = dayEvents.map((e: any) => {
              let parsed: any = {}
              try { parsed = e.description ? JSON.parse(e.description) : {} } catch {}
              const category: string = String(parsed.category || 'general').toLowerCase()
              const time = new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return { title: e.title, time, category }
            })
            // choose category of first event for color coding
            const primaryCategory = items[0]?.category || 'general'
            return { items, category: primaryCategory }
          }
          return (
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const meta = getMeta(day)
                const href = `/dashboard/calendar?d=${year}-${pad(month + 1)}-${pad(day)}T09:00`
                return (
                  <a
                    key={`wday-${day}`}
                    href={href}
                    className={`relative group block py-2 rounded border border-slate-700 ${meta ? `text-white ring-1 ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.bg} ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.ring}` : 'bg-slate-800/60 text-slate-300'} transition-colors`}
                    aria-label={meta ? `${day}: ${meta.items.map((i:any) => `${i.title} ${i.time}`).join(', ')}` : String(day)}
                  >
                    {day}
                    {meta && (
                      <div role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 shadow-xl whitespace-nowrap z-10">
                        {meta.items.map((it:any, i:number) => (
                          <div key={`wi-${i}`}>{`${it.title} • ${it.time} • ${it.category}`}</div>
                        ))}
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          )
        })()}
        <a href="/dashboard/calendar" className="inline-block mt-3 px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800">Open Calendar</a>
      </div>
    ) },
    inventory: { id: 'inventory', title: 'Inventory Tracking', render: () => (<div className="text-sm text-slate-400">Track items at a glance. Manage stock in Inventory.</div>) },
    timer_active: { id: 'timer_active', title: 'Pinned Timer', render: () => (
      <div className="mt-3 text-sm text-slate-300">Control your current timer.</div>
    ) },
  }

  const widgetBackgroundClass: Record<string, string> = {
    overview: 'bg-slate-900', activity: 'bg-slate-900', progress: 'bg-slate-900', completion: 'bg-slate-900', analytics: 'bg-slate-900', calendar: 'bg-slate-900', inventory: 'bg-slate-900', timer_active: 'bg-slate-900',
  }

  if (loading || !layout) return null

  return (
    <div>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout as any }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as any}
        rowHeight={40}
        margin={[16, 16] as any}
        isResizable
        isDraggable
        draggableHandle=".tc-widget-handle"
        onDragStop={(l) => saveLayout(l as any)}
        onResizeStop={(l) => saveLayout(l as any)}
      >
        {order.map((id) => (
          <div key={id} className={`rounded-xl border border-slate-800 ${widgetBackgroundClass[id] ?? 'bg-slate-900'} p-5`}>
            <div className="tc-widget-handle cursor-move select-none font-bold text-white flex items-center justify-between">
              {widgets[id]?.title}
            </div>
            <div data-widget-id={id}>{widgets[id]?.render()}</div>
          </div>
        ))}
      </ResponsiveGridLayout>
      {/* Expose reset via window event dispatched by the Reset button */}
      <ResetBridge onReset={reset} />
    </div>
  )
}

function ResetBridge({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    function handler() { onReset() }
    window.addEventListener('tc:reset-layout' as any, handler as EventListener)
    return () => window.removeEventListener('tc:reset-layout' as any, handler as EventListener)
  }, [onReset])
  return null
}


