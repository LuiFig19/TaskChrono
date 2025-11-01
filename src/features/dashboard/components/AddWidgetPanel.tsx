'use client';

import { Plan, WIDGET_LABELS, dispatchAddWidget, getAvailableWidgets } from '@/lib/widget-config';

export default function AddWidgetPanel({ plan, onClose }: { plan: Plan; onClose?: () => void }) {
  const availableWidgets = getAvailableWidgets(plan);

  return (
    <nav className="tc-pillmenu grid gap-2 text-sm text-slate-200 z-[100000]" role="menu">
      {availableWidgets.map((id) => (
        <button
          key={id}
          role="menuitem"
          className="h-9 px-4 inline-flex items-center justify-start gap-2 rounded-full border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-none transition-colors whitespace-nowrap min-w-[260px] text-left"
          onClick={() => {
            dispatchAddWidget(id);
            onClose?.();
          }}
        >
          <span className="text-slate-300">＋</span>
          <span>{WIDGET_LABELS[id]}</span>
        </button>
      ))}
    </nav>
  );
}

