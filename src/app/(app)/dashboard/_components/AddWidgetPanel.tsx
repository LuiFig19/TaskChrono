"use client"

import React from 'react'

export type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'

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

export default function AddWidgetPanel({ plan, onClose }: { plan: Plan; onClose?: () => void }) {
  const ids = ['overview', 'activity', 'progress', 'completion', 'analytics', 'calendar', 'inventory', 'timer_active']
  return (
    <nav className="tc-pillmenu grid gap-2 text-sm text-slate-200 z-[100000]" role="menu">
      {ids.filter((id) => canUseWidget(plan, id)).map((id) => (
        <button
          key={id}
          role="menuitem"
          className="h-9 px-4 inline-flex items-center justify-start gap-2 rounded-full border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-none transition-colors whitespace-nowrap min-w-[260px] text-left"
          onClick={() => {
            document.dispatchEvent(new CustomEvent('tc:add-widget', { detail: { id } }))
            onClose?.()
          }}
        >
          <span className="text-slate-300">＋</span>
          <span>{LABELS[id] ?? id}</span>
        </button>
      ))}
    </nav>
  )
}
