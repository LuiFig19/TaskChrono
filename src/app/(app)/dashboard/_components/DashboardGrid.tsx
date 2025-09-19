"use client"
import React, { useEffect, useMemo, useState } from 'react'
import ProjectProgressWidget from './ProjectProgressWidget'
import ResponsiveGridLayout from './RGLResponsiveClient'
import { useWidgetLayout, type RglItem } from './useWidgetLayout'
import MonthGrid from '../calendar/MonthGrid'

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
    ;(async () => {
      try {
        const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          setCalEvents(Array.isArray(json.events) ? json.events : [])
        }
      } catch {}
    })()
  }, [])

  // Data for widgets
  const widgets: Record<string, Widget> = {
    overview: { id: 'overview', title: 'Time Tracking Overview', render: () => (
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[{ label: 'Today' }, { label: 'This Week' }, { label: 'This Month' }].map((s) => (
          <div key={s.label} className="rounded-md border border-slate-700 p-3">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-xl font-semibold text-white">0h 0m</div>
          </div>
        ))}
      </div>
    ) },
    activity: { id: 'activity', title: 'Team Activity Feed', render: () => (
      <div className="mt-4 text-sm text-slate-300">No activity yet. Start a chat or create a task to get started.</div>
    ) },
    progress: { id: 'progress', title: 'Project Progress', render: () => <ProjectProgressWidget /> },
    completion: { id: 'completion', title: 'Task Completion', render: () => (
      <div>
        <div className="mt-4 text-3xl text-white">0%</div>
        <div className="text-xs text-slate-400">Last 7 days</div>
      </div>
    ) },
    analytics: { id: 'analytics', title: 'Analytics', render: () => (<div className="mt-2 text-sm text-slate-400">Charts will appear here as you add data.</div>) },
    calendar: { id: 'calendar', title: 'Calendar', render: () => (
      <div className="mt-3 text-sm text-slate-400">
        Quick view of this month. Create detailed events in Calendar.
        {(() => {
          const now = new Date()
          const year = now.getFullYear()
          const month = now.getMonth()
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
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
            return { items, hex: '#4F46E5' }
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
                    className={`relative group block py-2 rounded border border-slate-700 ${meta ? 'text-white ring-1 bg-indigo-500/20 ring-indigo-400/40' : 'bg-slate-800/60 text-slate-300'} transition-colors`}
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


