"use client"

import React, { useEffect, useRef, useState } from 'react'
import AddWidgetPanel, { type Plan } from './AddWidgetPanel'

export default function RadialActions({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)
  const [submenu, setSubmenu] = useState<null | 'widgets' | 'theme'>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setSubmenu(null)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function goTimers() { window.location.href = '/dashboard/timers' }
  function goFiles() { window.location.href = '/dashboard/files' }

  const baseBtn = 'h-10 px-4 inline-flex items-center justify-center gap-2 rounded-full font-medium leading-none shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors whitespace-nowrap'

  return (
    <div className="relative z-[100000]" ref={rootRef}>
      {/* Primary trigger button (slightly smaller) */}
      <button
        className={`${baseBtn} h-9 px-3 text-sm bg-sky-600 hover:bg-sky-700 text-white border border-sky-400`}
        title="Dashboard actions"
        onClick={() => { setOpen(v=>!v); if (open) setSubmenu(null) }}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M5 7a2 2 0 114 0 2 2 0 01-4 0zm5.5 0A3.5 3.5 0 107 10.5 3.5 3.5 0 0010.5 7zM15 17a2 2 0 114 0 2 2 0 01-4 0zm-6.5 0A3.5 3.5 0 1112 20.5 3.5 3.5 0 018.5 17zM15 2a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
        <span>Actions</span>
      </button>

      {/* Horizontal action row */}
      <div
        className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 flex flex-nowrap items-center gap-2 z-[100000] origin-left transition-transform transition-opacity duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {/* Widgets */}
        <div className="relative z-[100000]">
          <button
            className={`${baseBtn} bg-rose-600 hover:bg-rose-700 text-white border border-rose-400`}
            onClick={(e) => { e.stopPropagation(); setSubmenu(s=> s==='widgets'?null:'widgets') }}
            title="Add Widget"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            <span>Widgets</span>
          </button>
          <div className={`absolute left-0 top-full mt-2 grid gap-2 z-[100000] transform transition-all duration-200 ${submenu==='widgets' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <AddWidgetPanel plan={plan} onClose={() => { setSubmenu(null); setOpen(false) }} />
          </div>
        </div>

        {/* Theme */}
        <div className="relative z-[100000]">
          <button
            className={`${baseBtn} bg-amber-500 hover:bg-amber-600 text-slate-900 border border-amber-300`}
            onClick={(e) => { e.stopPropagation(); setSubmenu(s=> s==='theme'?null:'theme') }}
            title="Theme"
          >
            <span aria-hidden className="text-base">🎨</span>
            <span>Theme</span>
          </button>
          <div className={`absolute left-0 top-full mt-2 grid gap-2 z-[100000] transform transition-all duration-200 ${submenu==='theme' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <button className={`${baseBtn} h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600`} onClick={() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); setSubmenu(null); setOpen(false) }}>Dark</button>
            <button className={`${baseBtn} h-9 rounded-full bg-white hover:bg-slate-100 text-slate-900 border border-slate-300`} onClick={() => { document.documentElement.classList.remove('dark'); document.documentElement.classList.add('light'); setSubmenu(null); setOpen(false) }}>Light</button>
          </div>
        </div>

        {/* Start Timer */}
        <div className="relative z-[100000]">
          <button
            className={`${baseBtn} bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400`}
            onClick={(e) => { e.stopPropagation(); goTimers(); setOpen(false); setSubmenu(null) }}
            title="Timers"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <span>Start</span>
          </button>
        </div>

        {/* Upload File */}
        <div className="relative z-[100000]">
          <button
            className={`${baseBtn} bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-400`}
            onClick={(e) => { e.stopPropagation(); goFiles(); setOpen(false); setSubmenu(null) }}
            title="Files"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14h14v2H5v-2z"/></svg>
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>
  )
}
