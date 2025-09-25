"use client"

import React, { useMemo } from 'react'

type EventDto = {
  id: string
  title: string
  startsAt: string
  description?: string | null
}

export default function MonthGrid({ events, baseDate, onSelect }: { events: EventDto[]; baseDate?: string; onSelect?: (localInputValue: string) => void }) {
  const base = baseDate ? new Date(baseDate) : new Date()
  const year = base.getFullYear()
  const month = base.getMonth()

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
    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs">
      {boxes.map((_, idx) => {
        if (idx < startDay) return <div key={`box-${idx}`} className="py-3 rounded bg-slate-900 border border-slate-800" />
        const day = idx - startDay + 1
        const d = new Date(year, month, day)
        const key = d.toDateString()
        const meta = dayMeta.get(key) || null
        const clsMap: Record<string, { bg: string; ring: string; dot: string }> = {
          // Brighter, more distinct palette that matches the dashboard widget
          meeting: { bg: 'bg-blue-500/30', ring: 'ring-blue-400/60', dot: 'bg-blue-500' },
          release: { bg: 'bg-lime-500/30', ring: 'ring-lime-400/60', dot: 'bg-lime-500' },
          invoice: { bg: 'bg-rose-500/30', ring: 'ring-rose-400/60', dot: 'bg-rose-500' },
          review: { bg: 'bg-violet-500/30', ring: 'ring-violet-400/60', dot: 'bg-violet-500' },
          demo: { bg: 'bg-teal-500/30', ring: 'ring-teal-400/60', dot: 'bg-teal-500' },
          deadline: { bg: 'bg-amber-500/30', ring: 'ring-amber-400/60', dot: 'bg-amber-500' },
          personal: { bg: 'bg-emerald-500/30', ring: 'ring-emerald-400/60', dot: 'bg-emerald-500' },
          urgent: { bg: 'bg-red-600/30', ring: 'ring-red-500/60', dot: 'bg-red-600' },
          general: { bg: 'bg-fuchsia-500/30', ring: 'ring-fuchsia-400/60', dot: 'bg-fuchsia-500' },
        }
        return (
          <button
            key={`box-${idx}`}
            type="button"
            className={`relative group block py-2.5 md:py-3 rounded border border-slate-700 ${meta ? `text-white ring-1 ${clsMap[(meta.items[0]?.category || 'general') as keyof typeof clsMap]?.bg} ${clsMap[(meta.items[0]?.category || 'general') as keyof typeof clsMap]?.ring}` : 'bg-slate-800/60 text-slate-300'} focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 transition-colors duration-150 cursor-pointer`}
            aria-label={meta ? `${day}: ${meta.items.map((i) => `${i.title} ${i.time}`).join(', ')}` : String(day)}
            onClick={() => {
              const val = toLocalInput(d)
              if (onSelect) {
                onSelect(val)
              } else {
                const input = document.getElementById('calendar-when') as HTMLInputElement | null
                if (input) {
                  input.value = val
                  input.dispatchEvent(new Event('input', { bubbles: true }))
                }
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
