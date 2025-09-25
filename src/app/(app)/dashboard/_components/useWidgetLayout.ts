"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import throttle from 'lodash.throttle'

// Extend the minimal shape used throughout to support per-item controls like `static`/`isResizable`
export type RglItem = { i: string; x: number; y: number; w: number; h: number; static?: boolean; isResizable?: boolean; isDraggable?: boolean }

export function useWidgetLayout(defaultLayout: RglItem[], dashboard: string = 'main') {
  const [layout, setLayout] = useState<RglItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const key = useMemo(() => `layout:${dashboard}`, [dashboard])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/layout?dashboard=${encodeURIComponent(dashboard)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json() as { layout?: RglItem[] | null }
          if (alive) setLayout(Array.isArray(data.layout) && data.layout.length ? data.layout : (JSON.parse(localStorage.getItem(key) || 'null') || defaultLayout))
        } else {
          const ls = JSON.parse(localStorage.getItem(key) || 'null') as RglItem[] | null
          if (alive) setLayout(ls && ls.length ? ls : defaultLayout)
        }
      } catch {
        const ls = JSON.parse(localStorage.getItem(key) || 'null') as RglItem[] | null
        if (alive) setLayout(ls && ls.length ? ls : defaultLayout)
      } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [dashboard, key, defaultLayout])

  const put = useCallback(async (next: RglItem[]) => {
    try { await fetch(`/api/layout?dashboard=${encodeURIComponent(dashboard)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layout: next }) }) } catch {}
  }, [dashboard])

  const saveThrottled = useRef(throttle((next: RglItem[]) => { put(next) }, 800)).current

  const saveLayout = useCallback((next: RglItem[]) => {
    setLayout(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
    saveThrottled(next)
  }, [key, saveThrottled])

  const reset = useCallback(async () => {
    try { await fetch(`/api/layout?dashboard=${encodeURIComponent(dashboard)}`, { method: 'DELETE' }) } catch {}
    try { localStorage.removeItem(key) } catch {}
    setLayout(defaultLayout)
  }, [dashboard, defaultLayout, key])

  return { layout, setLayout, saveLayout, reset, loading }
}
