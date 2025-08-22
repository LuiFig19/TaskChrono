"use client"

import React, { useMemo } from 'react'

type EventDto = {
  id: string
  title: string
  startsAt: string
  description?: string | null
}

export default function MonthGrid({ events }: { events: EventDto[] }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

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

  const dayMeta = useMemo(() => {
    const map = new Map<string, { items: { title: string; time: string; category: string; notes: string; hex: string }[]; hex: string }>()
    for (const e of events) {
      const d = new Date(e.startsAt)
      const key = d.toDateString()
      let parsed: any = {}
      try { parsed = e.description ? JSON.parse(e.description) : {} } catch {}
      const category: string = String(parsed.category || 'general').toLowerCase()
      const notes: string = String(parsed.notes || '')
      const hex = catHex[category] || catHex.general
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const item = { title: e.title, time, category, notes, hex }
      const current = map.get(key)
      if (current) {
        current.items.push(item)
      } else {
        map.set(key, { items: [item], hex })
      }
    }
    return map
  }, [events])

  const start = new Date(year, month, 1)
  const startDay = start.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const boxes = Array.from({ length: startDay + daysInMonth })

  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`

  return (
    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
      {boxes.map((_, idx) => {
        if (idx < startDay) return <div key={`box-${idx}`} className="py-3 rounded bg-slate-900 border border-slate-800" />
        const day = idx - startDay + 1
        const d = new Date(year, month, day)
        const key = d.toDateString()
        const meta = dayMeta.get(key) || null
        const clsMap: Record<string, { bg: string; ring: string; dot: string }> = {
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
        return (
          <button
            key={`box-${idx}`}
            type="button"
            className={`relative group block py-3 rounded border border-slate-700 ${meta ? `text-white ring-1 ${clsMap[(meta.items[0]?.category || 'general') as keyof typeof clsMap]?.bg} ${clsMap[(meta.items[0]?.category || 'general') as keyof typeof clsMap]?.ring}` : 'bg-slate-800/60 text-slate-300'} focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 transition-colors duration-150`}
            aria-label={meta ? `${day}: ${meta.items.map((i) => `${i.title} ${i.time}`).join(', ')}` : String(day)}
            onClick={() => {
              const input = document.getElementById('calendar-when') as HTMLInputElement | null
              if (input) {
                input.value = toLocalInput(d)
                input.dispatchEvent(new Event('input', { bubbles: true }))
              }
            }}
          >
            {day}
            {meta && <span aria-hidden className={`pointer-events-none absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${clsMap[(meta.items[0]?.category || 'general') as keyof typeof clsMap]?.dot}`} />}
            {meta && (
              <div role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 shadow-xl whitespace-nowrap z-10">
                {meta.items.map((it, i) => (
                  <div key={`ln-${i}`}>{`${it.title} • ${it.time} • ${it.category}`}{it.notes ? ` — ${it.notes}` : ''}</div>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
