"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import MonthGrid from '../MonthGrid'

type EventDto = { id: string; title: string; startsAt: string; description?: string | null }

export default function CalendarClient({ defaultWhen, monthStart, monthEnd, initialEvents }: { defaultWhen: string; monthStart: string; monthEnd: string; initialEvents: EventDto[] }) {
  const [events, setEvents] = useState<EventDto[]>(initialEvents)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState(defaultWhen)
  const [category, setCategory] = useState('meeting')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState(new Date(monthStart))

  const refresh = useCallback(async (startStr?: string, endStr?: string) => {
    const params = new URLSearchParams({ start: startStr || monthStart, end: endStr || monthEnd })
    const res = await fetch(`/api/calendar?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    const list = (json.events || []).map((e: any) => ({ id: e.id, title: e.title, startsAt: new Date(e.startsAt).toISOString(), description: e.description }))
    setEvents(list)
  }, [monthStart, monthEnd])

  // Keep the input tied to MonthGrid quick-set
  useEffect(() => {
    const input = document.getElementById('calendar-when') as HTMLInputElement | null
    if (input) {
      input.addEventListener('input', (e: any) => setWhen(e.target.value))
      return () => input.removeEventListener('input', (e: any) => setWhen(e.target.value))
    }
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !when) return
    setLoading(true)
    const optimistic: EventDto = { id: `tmp-${Math.random().toString(36).slice(2)}`, title: title.trim(), startsAt: new Date(when).toISOString(), description: JSON.stringify({ category, notes }) }
    setEvents((prev) => [optimistic, ...prev])
    try {
      const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: optimistic.title, startsAt: optimistic.startsAt, description: optimistic.description }) })
      if (!res.ok) throw new Error('create failed')
      await refresh()
      // notify other pages (e.g., dashboard widget) to refresh
      try { document.dispatchEvent(new CustomEvent('tc:calendar-changed', { detail: { action: 'created' } })) } catch {}
      setTitle(''); setNotes('')
    } catch {
      setEvents((prev) => prev.filter((e) => e.id !== optimistic.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-6 pb-6 dashboard-calendar-page">
      <h1 className="text-2xl font-semibold" style={{ margin: 0, padding: 0 }}>Calendar</h1>
      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div className="font-medium text-white">Monthly View</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  const prev = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
                  setCursor(prev)
                  const start = new Date(prev.getFullYear(), prev.getMonth(), 1)
                  const end = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  refresh(start.toISOString(), end.toISOString())
                }}
              >
                ←
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
                onClick={() => {
                  const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
                  setCursor(next)
                  const start = new Date(next.getFullYear(), next.getMonth(), 1)
                  const end = new Date(next.getFullYear(), next.getMonth() + 1, 1)
                  refresh(start.toISOString(), end.toISOString())
                }}
              >
                →
              </button>
            </div>
          </div>
          <MonthGrid
            events={events as any}
            baseDate={monthStart}
            onSelect={(val) => setWhen(val)}
          />
          <ul className="mt-4 grid gap-2 text-sm text-slate-300">
            {events.map(e => (
              <li key={e.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <div>
                  <div>{e.title}</div>
                  <div className="text-xs text-slate-400">{new Date(e.startsAt).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch(`/api/calendar/${e.id}`, { method: 'DELETE' })
                      setEvents((prev)=>prev.filter(x=>x.id!==e.id))
                      document.dispatchEvent(new CustomEvent('tc:calendar-changed', { detail: { action: 'deleted' } }))
                    } catch {}
                  }}
                  className="px-2 py-1 text-xs rounded bg-rose-600 hover:bg-rose-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="font-medium text-white">Event:</div>
          <form onSubmit={onCreate} className="mt-4 grid gap-2">
            <input name="title" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
            <input id="calendar-when" name="when" value={when} onChange={(e)=>setWhen(e.target.value)} type="datetime-local" placeholder="Date & Time" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
            <label htmlFor="category" className="text-sm text-slate-300">Category</label>
            <select id="category" name="category" value={category} onChange={(e)=>setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100">
              <option value="meeting">Meeting</option>
              <option value="release">Release</option>
              <option value="invoice">Invoice</option>
              <option value="review">Review</option>
              <option value="demo">Demo</option>
              <option value="deadline">Deadline</option>
              <option value="personal">Personal</option>
              <option value="urgent">Urgent</option>
              <option value="general">General</option>
            </select>
            <label htmlFor="notes" className="text-sm text-slate-300">Notes</label>
            <textarea id="notes" name="notes" rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" placeholder="Optional notes (e.g., Employee out)" />
            <button disabled={loading} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors w-fit">{loading ? 'Creating…' : 'Create'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}


