"use client"
import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { DropResult, DraggableProvided, DroppableProvided } from '@hello-pangea/dnd'
import ProjectProgressWidget from './ProjectProgressWidget'

const DragDropContext: any = dynamic(() => import('@hello-pangea/dnd').then((m) => m.DragDropContext), { ssr: false })
const Droppable: any = dynamic(() => import('@hello-pangea/dnd').then((m) => m.Droppable), { ssr: false })
const Draggable: any = dynamic(() => import('@hello-pangea/dnd').then((m) => m.Draggable), { ssr: false })

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

type Widget = {
  id: string
  title: string
  render: () => React.ReactNode
}

export default function DashboardGrid({ plan, pin }: { plan: Plan; pin?: string }) {
  const initial = useMemo(() => {
    // Ensure Calendar is first, then the rest in a sensible order
    const defaults = ['calendar', 'overview', 'activity', 'progress', 'completion']
    return Array.from(new Set(defaults))
  }, [plan])

  const [order, setOrder] = useState<string[]>(initial)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user-prefs', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.widgets)) {
            const arr = data.widgets as string[]
            const withCalendarFirst = ['calendar', ...arr.filter((x) => x !== 'calendar')]
            setOrder(withCalendarFirst)
          } else {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('tc_dash_order') : null
            if (mounted && stored) {
              const arr = JSON.parse(stored)
              const withCalendarFirst = ['calendar', ...arr.filter((x: string) => x !== 'calendar')]
              setOrder(withCalendarFirst)
            }
          }
        }
      } catch {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('tc_dash_order') : null
        if (mounted && stored) {
          const arr = JSON.parse(stored)
          const withCalendarFirst = ['calendar', ...arr.filter((x: string) => x !== 'calendar')]
          setOrder(withCalendarFirst)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('tc_dash_order', JSON.stringify(order))
    ;(async () => {
      try {
        await fetch('/api/user-prefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) })
      } catch {}
    })()
  }, [order])

  useEffect(() => {
    if (!pin) return
    if (!canUseWidget(pin)) return
    setOrder((cur) => (cur.includes(pin) ? cur : [...cur, pin]))
  }, [pin])

  // Calendar events for widget (current month)
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

  // Team Activity items (latest chat events across channels)
  type ActivityItem = { id: string; ts: number; text: string }
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([])
  useEffect(() => {
    let active = true
    const seen = new Set<string>()
    ;(async () => {
      try {
        const res = await fetch('/api/activity', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (active && Array.isArray(json.items)) {
            setActivityItems(json.items)
            for (const it of json.items) seen.add(it.id)
          }
        }
      } catch {}
      const channels = ['all', 'managers', 'employees']
      const sources = channels.map((c) => {
        const es = new EventSource(`/api/chat/stream?c=${c}`)
        es.addEventListener('message', (ev: MessageEvent) => {
          try {
            const m = JSON.parse(ev.data) as { id: string; ts: number; user?: { name?: string }; text: string }
            if (seen.has(m.id)) return
            seen.add(m.id)
            const item: ActivityItem = { id: m.id, ts: m.ts, text: `${m.user?.name || 'User'} in #${c}: ${m.text}` }
            setActivityItems((cur) => [item, ...cur].slice(0, 50))
          } catch {}
        })
        return es
      })
      // cleanup on unmount
      return () => sources.forEach((s) => s.close())
    })()
    return () => {
      active = false
    }
  }, [])

  const catHex: Record<string, string> = {
    meeting: '#007BFF',
    release: '#28A745',
    invoice: '#DC3545',
    review: '#6F42C1',
    demo: '#17A2B8',
    deadline: '#FD7E14',
    personal: '#20C997',
    urgent: '#C82333',
    general: '#4F46E5',
  }

  // Map categories to Tailwind classes to avoid inline styles
  const categoryClasses: Record<string, { bg: string; ring: string; dot: string }> = {
    meeting: { bg: 'bg-blue-500/20', ring: 'ring-blue-500/40', dot: 'bg-blue-500' },
    release: { bg: 'bg-green-500/20', ring: 'ring-green-500/40', dot: 'bg-green-500' },
    invoice: { bg: 'bg-red-500/20', ring: 'ring-red-500/40', dot: 'bg-red-500' },
    review: { bg: 'bg-purple-500/20', ring: 'ring-purple-500/40', dot: 'bg-purple-500' },
    demo: { bg: 'bg-cyan-500/20', ring: 'ring-cyan-500/40', dot: 'bg-cyan-500' },
    deadline: { bg: 'bg-orange-500/20', ring: 'ring-orange-500/40', dot: 'bg-orange-500' },
    personal: { bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/40', dot: 'bg-emerald-500' },
    urgent: { bg: 'bg-rose-600/20', ring: 'ring-rose-600/40', dot: 'bg-rose-600' },
    general: { bg: 'bg-indigo-600/20', ring: 'ring-indigo-600/40', dot: 'bg-indigo-600' },
  }

  const demo = false
  function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  async function startApiTimer() {
    try {
      const name = typeof window !== 'undefined' ? window.prompt('Name this timer:')?.trim() : 'Timer'
      if (!name) return
      await fetch('/api/timers/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    } catch {}
  }
  async function stopApiTimer() {
    try {
      await fetch('/api/timers/stop', { method: 'POST' })
    } catch {}
  }

  const widgets: Record<string, Widget> = {
    overview: {
      id: 'overview',
      title: 'Time Tracking Overview',
      render: () => (
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[{ label: 'Today' }, { label: 'This Week' }, { label: 'This Month' }].map((s, i) => (
            <div key={s.label} className="rounded-md border border-slate-700 p-3">
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-xl font-semibold text-white">{demo ? `${rand(0, i===0?8:80)}h ${rand(0,59)}m` : '0h 0m'}</div>
            </div>
          ))}
        </div>
      ),
    },
    activity: {
      id: 'activity',
      title: 'Team Activity Feed',
      render: () => (
        <div className="mt-4 text-sm text-slate-300">
          {activityItems.length === 0 ? (
            <div className="text-slate-400">No activity yet. Start a chat or create a task to get started.</div>
          ) : (
            <ul className="space-y-2">
              {activityItems.map((a) => (
                <li key={a.id} className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2 flex items-center justify-between">
                  <div className="truncate pr-3">{a.text}</div>
                  <div className="shrink-0 text-xs text-slate-400">{new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    progress: {
      id: 'progress',
      title: 'Project Progress',
      render: () => <ProjectProgressWidget />,
    },
    completion: {
      id: 'completion',
      title: 'Task Completion',
      render: () => (
        <div>
          <div className="mt-4 text-3xl text-white">{demo ? `${rand(20, 95)}%` : '0%'}</div>
          <div className="text-xs text-slate-400">Last 7 days</div>
        </div>
      ),
    },
    analytics: {
      id: 'analytics',
      title: 'Analytics',
      render: () => (
        <div className="mt-2 text-sm text-slate-400">Charts will appear here as you add data.</div>
      ),
    },
    calendar: {
      id: 'calendar',
      title: 'Calendar',
      render: () => (
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
              const dayEvents = calEvents.filter((e: any) => new Date(e.startsAt).toDateString() === dateStr)
              if (dayEvents.length === 0) return null
              const items = dayEvents.map((e: any) => {
                let parsed: any = {}
                try { parsed = e.description ? JSON.parse(e.description) : {} } catch {}
                const category: string = String(parsed.category || 'general').toLowerCase()
                const hex = catHex[category] || catHex.general
                const time = new Date(e.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                return { title: e.title, time, category, hex }
              })
              return { items, hex: items[0].hex }
            }
            return (
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1
                  const meta = getMeta(day)
                  const href = `/dashboard/calendar?d=${year}-${pad(month + 1)}-${pad(day)}T09:00`
                  const cat = meta ? String(meta.items[0].category || 'general').toLowerCase() : 'general'
                  const cls = categoryClasses[cat] || categoryClasses.general
                  return (
                    <a
                      key={`wday-${day}`}
                      href={href}
                      className={`relative group block py-2 rounded border border-slate-700 ${meta ? `text-white ring-1 ${cls.bg} ${cls.ring}` : 'bg-slate-800/60 text-slate-300'} transition-colors`}
                      aria-label={meta ? `${day}: ${meta.items.map((i:any) => `${i.title} ${i.time}`).join(', ')}` : String(day)}
                    >
                      {day}
                      {meta && <span aria-hidden className={`pointer-events-none absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${cls.dot}`} />}
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
      ),
    },
    inventory: {
      id: 'inventory',
      title: 'Inventory Tracking',
      render: () => (
        <div className="mt-3 text-sm text-slate-400">
          Track items at a glance. Manage stock in Inventory.
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ n: 'Widgets', q: 0 }, { n: 'Gadgets', q: 0 }].map((r) => (
              <div key={r.n} className="rounded border border-slate-700 p-3 bg-slate-800/60">
                <div className="text-slate-200">{r.n}</div>
                <div className="text-xs text-slate-400">Qty: {0}</div>
              </div>
            ))}
          </div>
          <a href="/dashboard/inventory" className="inline-block mt-3 px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800">Open Inventory</a>
        </div>
      ),
    },
    timer_active: {
      id: 'timer_active',
      title: 'Pinned Timer',
      render: () => (
        <div className="mt-3 text-sm text-slate-300">
          Control your current timer.
          <div className="mt-3 flex gap-2">
            <button onClick={startApiTimer} className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">Start</button>
            <button onClick={stopApiTimer} className="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700">Stop</button>
            <a href="/dashboard/timers" className="px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800">Open Timers</a>
          </div>
        </div>
      ),
    },
    // Additional timers can be controlled from the Timers page; this pinned widget provides global controls
  }

  // Revert to baseline background for all widgets
  const widgetBackgroundClass: Record<string, string> = {
    overview: 'bg-slate-900',
    activity: 'bg-slate-900',
    progress: 'bg-slate-900',
    completion: 'bg-slate-900',
    analytics: 'bg-slate-900',
    calendar: 'bg-slate-900',
    inventory: 'bg-slate-900',
    timer_active: 'bg-slate-900',
  }

  // Respect plan gating in the real app; the marketing demo uses a separate component without locks
  function canUseWidget(id: string): boolean {
    if (id === 'inventory') return plan === 'ENTERPRISE' || plan === 'CUSTOM'
    if (id === 'analytics') return plan !== 'FREE'
    return true
  }

  function onDragEnd(res: DropResult) {
    if (!res.destination) return
    const next = Array.from(order)
    const [removed] = next.splice(res.source.index, 1)
    next.splice(res.destination.index, 0, removed)
    setOrder(next)
  }

  function addWidget(id: string) {
    if (!widgets[id]) return
    if (!canUseWidget(id)) return
    setOrder((cur) => (cur.includes(id) ? cur : [...cur, id]))
  }

  function removeWidget(id: string) {
    if (id === 'activity') return
    setOrder((cur) => cur.filter((x) => x !== id))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Listen for top-bar add requests */}
      <WidgetAddListener onAdd={addWidget} />
      {/* Add widget menu moved to top action bar in DashboardPage to reduce clutter */}
      <Droppable droppableId="grid" direction="vertical">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="grid lg:grid-cols-3 gap-6">
            {order.map((id, idx) => (
              <Draggable draggableId={id} index={idx} key={id}>
                {(p: DraggableProvided) => (
                  <div
                    ref={p.innerRef as unknown as (element: HTMLElement | null) => void}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className={`rounded-xl border border-slate-800 ${widgetBackgroundClass[id] ?? 'bg-slate-900'} p-5 ${
                      id === 'progress' || id === 'calendar' ? 'lg:col-span-2' : ''
                    }`}
                  >
                    <div className="font-medium text-white flex items-center justify-between">
                      {widgets[id]?.title}
                      {id !== 'activity' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement | null
                              if (el) {
                                el.animate([
                                  { transform: 'scale(1)', opacity: 1 },
                                  { transform: 'scale(0.95)', opacity: 0 }],
                                  { duration: 150, easing: 'ease-out' }
                                ).onfinish = () => removeWidget(id)
                              } else {
                                removeWidget(id)
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-700/20 text-slate-300 hover:text-rose-400 transition-colors"
                            aria-label="Remove widget"
                            title="Remove"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                              <path fillRule="evenodd" d="M9.75 3a.75.75 0 00-.75.75V5H6a.75.75 0 000 1.5h12A.75.75 0 0018 5h-3V3.75a.75.75 0 00-.75-.75h-4.5zM7.5 7.25A.75.75 0 018.25 8v10a.75.75 0 01-1.5 0V8a.75.75 0 01.75-.75zM12 7.25a.75.75 0 01.75.75v10a.75.75 0 01-1.5 0V8a.75.75 0 01.75-.75zm4.5 0A.75.75 0 0117.25 8v10a.75.75 0 01-1.5 0V8a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div data-widget-id={id}>{widgets[id]?.render()}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

function WidgetAddListener({ onAdd }: { onAdd: (id: string) => void }) {
  // Subscribe once on mount, cleanup on unmount
  useEffect(() => {
    function handle(e: Event) {
      const detail = (e as CustomEvent).detail as { id?: string }
      if (detail?.id) onAdd(detail.id)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('tc:add-widget', handle as EventListener)
      return () => window.removeEventListener('tc:add-widget', handle as EventListener)
    }
  }, [onAdd])
  return null
}


