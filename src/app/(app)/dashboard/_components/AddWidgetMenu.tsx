"use client"

import React from 'react'
import { Plan, WIDGET_LABELS, getAvailableWidgets, dispatchAddWidget } from '@/lib/widget-config'

export default function AddWidgetMenu({ plan }: { plan: Plan }) {
  const availableWidgets = getAvailableWidgets(plan)
  
  return (
    <details className="relative">
      <summary className="list-none select-none px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 shadow cursor-pointer">
        Add Widget
      </summary>
      <div className="absolute z-50 mt-2 w-72 rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
        <nav className="grid p-2 text-sm text-slate-200" role="menu">
          {availableWidgets.map((id) => (
            <button
              key={id}
              role="menuitem"
              className="text-left px-3 py-2 rounded hover:bg-slate-800"
              onClick={(e) => {
                dispatchAddWidget(id)
                const el = (e.currentTarget as HTMLElement).closest('details') as HTMLDetailsElement | null
                if (el) el.removeAttribute('open')
              }}
            >
              + {WIDGET_LABELS[id]}
            </button>
          ))}
        </nav>
      </div>
    </details>
  )
}
