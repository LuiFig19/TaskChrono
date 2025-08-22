"use client"

import React from 'react'

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

function canUseWidget(plan: Plan, id: string): boolean {
  if (id === 'inventory') return plan === 'ENTERPRISE' || plan === 'CUSTOM'
  if (id === 'analytics') return plan !== 'FREE'
  return true
}

const LABELS: Record<string, string> = {
  overview: 'Time Tracking Overview',
  activity: 'Team Activity Feed',
  progress: 'Project Progress',
  completion: 'Task Completion',
  analytics: 'Analytics',
  calendar: 'Calendar',
  inventory: 'Inventory Tracking',
  timer_active: 'Pinned Timer',
}

export default function AddWidgetMenu({ plan }: { plan: Plan }) {
  const ids = ['overview', 'activity', 'progress', 'completion', 'analytics', 'calendar', 'inventory', 'timer_active']
  return (
    <details className="relative">
      <summary className="list-none select-none px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 shadow cursor-pointer">
        Add Widget
      </summary>
      <div className="absolute z-50 mt-2 w-72 rounded-md border border-slate-700 bg-slate-900 shadow-2xl">
        <nav className="grid p-2 text-sm text-slate-200" role="menu">
          {ids.filter((id) => canUseWidget(plan, id)).map((id) => (
            <button
              key={id}
              role="menuitem"
              className="text-left px-3 py-2 rounded hover:bg-slate-800"
              onClick={(e) => {
                document.dispatchEvent(new CustomEvent('tc:add-widget', { detail: { id } }))
                const el = (e.currentTarget as HTMLElement).closest('details') as HTMLDetailsElement | null
                if (el) el.removeAttribute('open')
              }}
            >
              + {LABELS[id] ?? id}
            </button>
          ))}
        </nav>
      </div>
    </details>
  )
}


