'use client';
/**
 * DashboardGrid
 * Renders the main dashboard with draggable widgets and persists layout.
 */
import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import SortableItem, { useDndHandle } from '../dnd/SortableItem';
import { track } from '@/lib/analytics';
import { useWidgetDnd } from '../dnd/useWidgetDnd';
import Chart from './Chart';
import ProjectProgressWidget from './ProjectProgressWidget';
import ResponsiveGridLayout from './RGLResponsiveClient';
import { useWidgetLayout, type RglItem } from './useWidgetLayout';
// duplicate import removed
// Lazy-load recharts client-side with a state guard to avoid "Loading..." stalls
let R: typeof import('recharts') | null = null;
if (typeof window !== 'undefined' && !R) {
  import('recharts')
    .then((m) => {
      R = m as any;
    })
    .catch(() => {});
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h}h ${m}m`;
}

function TimeOverviewWidget() {
  const { data } = useSWR('/api/timers/list', (u) =>
    fetch(u, { cache: 'no-store', credentials: 'include' }).then((r) => r.json()),
  );
  const totals = useMemo(() => {
    const entries = (data?.entries ?? []) as {
      startedAt: string;
      endedAt: string | null;
      durationMin: number;
    }[];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const within = (d: Date, from: Date) => d >= from;
    const sum = (from: Date) =>
      entries.reduce((acc, e) => {
        const end = e.endedAt ? new Date(e.endedAt) : null;
        const start = new Date(e.startedAt);
        if (!end) return acc;
        if (within(end, from)) return acc + (e.durationMin || 0);
        return acc;
      }, 0);
    return {
      today: sum(startOfDay),
      week: sum(startOfWeek),
      month: sum(startOfMonth),
    };
  }, [data]);
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
      {[
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
      ].map((s: any) => (
        <div
          key={s.key}
          className="rounded-md border border-slate-700 p-3 dark:border-slate-700 dark:bg-slate-800/50 light:border-[#E0E6ED] light:bg-white light:shadow-sm"
        >
          <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
            {s.label}
          </div>
          <div className="text-xl font-semibold text-white dark:text-white light:text-[#202124]">
            {formatDuration((totals as any)?.[s.key] ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeedWidget() {
  const [events, setEvents] = useState<{ ts: number; type: string; message: string }[]>([]);
  useEffect(() => {
    let esActivity: EventSource | null = null;
    let esChat: EventSource | null = null;
    let esTime: EventSource | null = null;

    function connectActivity() {
      try {
        esActivity && esActivity.close();
      } catch {}
      esActivity = new EventSource('/api/activity');
      esActivity.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (!data?.type || data.type === 'connected') return;
          setEvents((prev) =>
            [
              { ts: data.ts || Date.now(), type: data.type, message: data.message || data.type },
              ...prev,
            ].slice(0, 25),
          );
        } catch {}
      };
      esActivity.addEventListener('error', () => {
        try {
          esActivity && esActivity.close();
        } catch {}
        setTimeout(connectActivity, 2000);
      });
    }

    function connectChat() {
      try {
        esChat && esChat.close();
      } catch {}
      esChat = new EventSource('/api/chat/stream?c=all');
      esChat.addEventListener('message', (e) => {
        try {
          const m = JSON.parse(e.data);
          setEvents((prev) =>
            [
              {
                ts: m.ts || Date.now(),
                type: 'chat.message',
                message: `${m.user?.name || 'User'}: ${m.text}`,
              },
              ...prev,
            ].slice(0, 25),
          );
        } catch {}
      });
      esChat.addEventListener('error', () => {
        try {
          esChat && esChat.close();
        } catch {}
        setTimeout(connectChat, 2000);
      });
    }

    function connectTime() {
      try {
        esTime && esTime.close();
      } catch {}
      esTime = new EventSource('/api/time');
      esTime.addEventListener('changed', () => {
        setEvents((prev) =>
          [{ ts: Date.now(), type: 'timer.changed', message: 'Timer updated' }, ...prev].slice(
            0,
            25,
          ),
        );
      });
      esTime.addEventListener('error', () => {
        try {
          esTime && esTime.close();
        } catch {}
        setTimeout(connectTime, 2000);
      });
    }

    connectActivity();
    connectChat();
    connectTime();
    return () => {
      try {
        esActivity && esActivity.close();
      } catch {}
      try {
        esChat && esChat.close();
      } catch {}
      try {
        esTime && esTime.close();
      } catch {}
    };
  }, []);
  return (
    <div className="mt-3 text-sm text-slate-300 dark:text-slate-300 light:text-[#4A4A4A] space-y-2">
      {events.length === 0 ? (
        <div className="text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
          No activity yet. Start a chat or create a task to get started.
        </div>
      ) : (
        <ul className="space-y-1 overflow-auto pr-1 max-h-[360px] tc-scroll">
          {events.map((ev, idx) => (
            <li
              key={`ev-${idx}`}
              className="rounded border border-slate-800 bg-slate-950/50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50 light:border-[#E0E6ED] light:bg-white light:shadow-sm"
            >
              <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
                {new Date(ev.ts).toLocaleTimeString()}
              </div>
              <div className="text-slate-200 dark:text-slate-200 light:text-[#202124]">
                {ev.message}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskCompletionWidget() {
  const { data } = useSWR('/api/tasks', (u) =>
    fetch(u, { cache: 'no-store', credentials: 'include' }).then((r) => r.json()),
  );
  const [projectId, setProjectId] = useState<string | 'all'>('all');
  const options = (data?.projects ?? []) as {
    id: string;
    name: string;
    tasks: { status: string }[];
  }[];
  const { percent } = useMemo(() => {
    const list =
      projectId === 'all'
        ? options.flatMap((p) => p.tasks)
        : (options.find((p) => p.id === projectId)?.tasks ?? []);
    if (list.length === 0) return { percent: 0 };
    const done = list.filter((t) => String(t.status).toUpperCase() === 'DONE').length;
    return { percent: Math.round((done / list.length) * 100) };
  }, [options, projectId]);
  return (
    <div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
          Project
        </label>
        <select
          aria-label="Select project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value as any)}
          className="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 light:border-[#E0E6ED] light:bg-white light:text-[#202124]"
        >
          <option value="all">All</option>
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 text-3xl text-white dark:text-white light:text-[#202124] font-bold">
        {percent}%
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
        Completion
      </div>
    </div>
  );
}

function InventorySummaryWidget() {
  const [summary, setSummary] = useState<{
    totalItems: number;
    inventoryValueCents: number;
    lowStockCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/inventory?includeTotals=1&page=1&pageSize=1', {
          cache: 'no-store',
          credentials: 'include',
        });
        const json = await res.json();
        if (!cancelled) setSummary(json?.meta?.summary || null);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
  }, []);
  const usd = (c: number) => `$${((c || 0) / 100).toFixed(2)}`;
  return (
    <div className="mt-3">
      {loading ? (
        <div className="h-24 grid place-items-center text-slate-500 dark:text-slate-500 light:text-[#6B7280]">
          Loading...
        </div>
      ) : summary ? (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md border border-slate-700 p-3 dark:border-slate-700 dark:bg-slate-800/50 light:border-[#E0E6ED] light:bg-white light:shadow-sm">
            <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
              Total Items
            </div>
            <div className="text-xl font-semibold text-white dark:text-white light:text-[#202124]">
              {summary.totalItems}
            </div>
          </div>
          <div className="rounded-md border border-slate-700 p-3 dark:border-slate-700 dark:bg-slate-800/50 light:border-[#E0E6ED] light:bg-white light:shadow-sm">
            <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
              Inventory Value
            </div>
            <div className="text-xl font-semibold text-white dark:text-white light:text-[#202124]">
              {usd(summary.inventoryValueCents)}
            </div>
          </div>
          <div className="rounded-md border border-slate-700 p-3 dark:border-slate-700 dark:bg-slate-800/50 light:border-[#E0E6ED] light:bg-white light:shadow-sm">
            <div className="text-xs text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
              Low Stock
            </div>
            <div className="text-xl font-semibold text-white dark:text-white light:text-[#202124]">
              {summary.lowStockCount}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 dark:text-slate-400 light:text-[#6B7280]">
          No inventory yet. Open Inventory to add items.
        </div>
      )}
      <a
        href="/dashboard/inventory"
        data-inventory-cta
        className="inline-block mt-3 px-3 py-1.5 border transition-all duration-200
          rounded-full bg-blue-600 hover:bg-blue-700 text-white border-blue-500
          dark:rounded-md dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-blue-500"
      >
        Open Inventory
      </a>
    </div>
  );
}

type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM';

type Widget = { id: string; title: string; render: () => React.ReactNode };

export default function DashboardGrid({ plan, pin }: { plan: Plan; pin?: string }) {
  // Curated default coordinates to eliminate the top-right gap
  const curated: Record<string, RglItem> = {
    calendar: { i: 'calendar', x: 0, y: 0, w: 8, h: 8 },
    overview: { i: 'overview', x: 8, y: 0, w: 4, h: 4 },
    completion: { i: 'completion', x: 8, y: 4, w: 4, h: 4 },
    activity: { i: 'activity', x: 0, y: 8, w: 4, h: 8 },
    progress: { i: 'progress', x: 4, y: 8, w: 8, h: 6 },
    analytics: { i: 'analytics', x: 0, y: 14, w: 4, h: 4 },
    inventory: { i: 'inventory', x: 4, y: 14, w: 4, h: 6 },
    timer_active: { i: 'timer_active', x: 8, y: 16, w: 4, h: 3 },
  };
  const initialOrder = useMemo(() => Object.keys(curated), []);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const DEFAULT_LAYOUT = useMemo(() => order.map((id) => curated[id]).filter(Boolean), [order]);

  const { layout, setLayout, saveLayout, reset, loading } = useWidgetLayout(DEFAULT_LAYOUT, 'main');
  useEffect(() => {
    try { track('dashboard_viewed', { widgets: order.length }); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DnD Kit integration: define a stable swap callback and init DnD hooks
  const swapSlots = React.useCallback(
    (a: string, b: string) => {
      if (!Array.isArray(layout)) return;
      const l = (layout as RglItem[]).slice();
      const ia = l.findIndex((it) => it.i === a);
      const ib = l.findIndex((it) => it.i === b);
      if (ia === -1 || ib === -1) return;
      const aPos = { x: l[ia].x, y: l[ia].y, w: l[ia].w, h: l[ia].h };
      l[ia] = { ...l[ia], x: l[ib].x, y: l[ib].y, w: l[ib].w, h: l[ib].h };
      l[ib] = { ...l[ib], x: aPos.x, y: aPos.y, w: aPos.w, h: aPos.h };
      setLayout(l);
      try {
        saveLayout(l as any);
      } catch {}
    },
    [layout, saveLayout, setLayout],
  );

  const { Dnd, SortableContainer } = useWidgetDnd(order, swapSlots, (next) => setOrder(next));

  useEffect(() => {
    if (pin && !order.includes(pin)) setOrder((o) => (o.includes(pin) ? o : [...o, pin]));
  }, [pin, order]);

  // Listen for Add Widget events and append the widget to the grid without navigation
  useEffect(() => {
    function onAdd(e: Event) {
      const id = (e as any)?.detail?.id as string | undefined;
      if (!id) return;
      setOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
      // If current layout doesn't have a position for this widget, add one at the end
      const has = Array.isArray(layout) && (layout as any[]).some((l) => l.i === id);
      if (!has) {
        const pos = (curated as any)[id] || { i: id, x: 0, y: Infinity, w: 4, h: 4 };
        saveLayout([...((layout as any[]) || []), pos] as any);
      }
    }
    document.addEventListener('tc:add-widget' as any, onAdd);
    return () => document.removeEventListener('tc:add-widget' as any, onAdd);
  }, [layout, saveLayout]);

  // Calendar widget month + events
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [calBase, setCalBase] = useState<Date>(new Date());
  useEffect(() => {
    async function fetchMonth(base: Date) {
      try {
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
        const res = await fetch(
          `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`,
          { cache: 'no-store', credentials: 'include' },
        );
        if (res.ok) {
          const json = await res.json();
          setCalEvents(Array.isArray(json.events) ? json.events : []);
        }
      } catch {}
    }
    fetchMonth(calBase);
    function onChanged() {
      fetchMonth(calBase);
    }
    document.addEventListener('tc:calendar-changed' as any, onChanged);
    return () => document.removeEventListener('tc:calendar-changed' as any, onChanged);
  }, [calBase]);

  // Data for widgets
  const widgets: Record<string, Widget> = {
    overview: {
      id: 'overview',
      title: 'Time Tracking Overview',
      render: () => <TimeOverviewWidget />,
    },
    activity: { id: 'activity', title: 'Team Activity Feed', render: () => <ActivityFeedWidget /> },
    progress: {
      id: 'progress',
      title: 'Project Progress',
      render: () => <ProjectProgressWidget />,
    },
    completion: {
      id: 'completion',
      title: 'Task Completion',
      render: () => <TaskCompletionWidget />,
    },
    analytics: { id: 'analytics', title: 'Analytics', render: () => <Chart /> },
    calendar: {
      id: 'calendar',
      title: 'Calendar',
      render: () => (
        <div className="mt-3 text-sm text-slate-400">
          <div className="flex items-start justify-between">
            <div className="pt-0.5">
              <div className="text-xs text-slate-400">
                {calBase.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </div>
              <div>Quick view of this month. Create detailed events in Calendar.</div>
            </div>
            {/* Month navigation moved to widget header; no arrows here */}
          </div>
          {(() => {
            const year = calBase.getFullYear();
            const month = calBase.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const clsMap: Record<string, { bg: string; ring: string }> = {
              meeting: { bg: 'bg-blue-500/30', ring: 'ring-blue-400/60' },
              release: { bg: 'bg-lime-500/30', ring: 'ring-lime-400/60' },
              invoice: { bg: 'bg-rose-500/30', ring: 'ring-rose-400/60' },
              review: { bg: 'bg-violet-500/30', ring: 'ring-violet-400/60' },
              demo: { bg: 'bg-teal-500/30', ring: 'ring-teal-400/60' },
              deadline: { bg: 'bg-amber-500/30', ring: 'ring-amber-400/60' },
              personal: { bg: 'bg-emerald-500/30', ring: 'ring-emerald-400/60' },
              urgent: { bg: 'bg-red-600/30', ring: 'ring-red-500/60' },
              general: { bg: 'bg-fuchsia-500/30', ring: 'ring-fuchsia-400/60' },
            };
            const getMeta = (day: number) => {
              const dateStr = new Date(year, month, day).toDateString();
              const dayEvents = (calEvents || []).filter(
                (e: any) => new Date(e.startsAt).toDateString() === dateStr,
              );
              if (dayEvents.length === 0) return null;
              const items = dayEvents.map((e: any) => {
                let parsed: any = {};
                try {
                  parsed = e.description ? JSON.parse(e.description) : {};
                } catch {}
                const category: string = String(parsed.category || 'general').toLowerCase();
                const time = new Date(e.startsAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return { title: e.title, time, category };
              });
              // choose category of first event for color coding
              const primaryCategory = items[0]?.category || 'general';
              return { items, category: primaryCategory };
            };
            return (
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const meta = getMeta(day);
                  const href = `/dashboard/calendar?d=${year}-${pad(month + 1)}-${pad(day)}T09:00`;
                  return (
                    <a
                      key={`wday-${day}`}
                      href={href}
                      className={`relative group block py-2 rounded-lg border transition-colors ${meta ? `ring-1 ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.bg} ${clsMap[(meta.category || 'general') as keyof typeof clsMap]?.ring} dark:text-white light:text-[#202124]` : 'border-slate-700 bg-slate-800/60 text-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 light:border-[#E0E6ED] light:bg-white light:text-[#4A4A4A] light:hover:bg-[#F1F3F6]'}`}
                      aria-label={
                        meta
                          ? `${day}: ${meta.items.map((i: any) => `${i.title} ${i.time}`).join(', ')}`
                          : String(day)
                      }
                    >
                      {day}
                      {meta && (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 shadow-xl whitespace-nowrap z-10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 light:bg-white light:border-[#E0E6ED] light:text-[#202124] light:shadow-lg"
                        >
                          {meta.items.map((it: any, i: number) => (
                            <div key={`wi-${i}`}>{`${it.title} • ${it.time} • ${it.category}`}</div>
                          ))}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            );
          })()}
          <a
            href="/dashboard/calendar"
            data-calendar-cta
            className="inline-block mt-3 px-3 py-1 rounded-full border font-medium transition-all
              bg-blue-600 text-white border-blue-500 hover:bg-blue-700
              dark:rounded-full dark:text-white"
          >
            Open Calendar
          </a>
        </div>
      ),
    },
    inventory: {
      id: 'inventory',
      title: 'Inventory Tracking',
      render: () => <InventorySummaryWidget />,
    },
    timer_active: {
      id: 'timer_active',
      title: 'Pinned Timer',
      render: () => <PinnedTimerWidget />,
    },
  };

  const widgetBackgroundClass: Record<string, string> = {
    overview: 'bg-slate-900',
    activity: 'bg-slate-900',
    progress: 'bg-slate-900',
    completion: 'bg-slate-900',
    analytics: 'bg-slate-900',
    calendar: 'bg-slate-900',
    inventory: 'bg-slate-900',
    timer_active: 'bg-slate-900',
  };

  if (loading || !layout) return null;

  return (
    <div>
      <Dnd>
        <SortableContainer>
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout as any }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as any}
            rowHeight={40}
            margin={[16, 16] as any}
            isResizable
            isDraggable
            draggableHandle=".tc-widget-handle"
            draggableCancel=".tc-no-drag"
            onResizeStop={(l: any) => saveLayout(l as any)}
          >
            {order.map((id) => (
              <SortableItem key={id} id={id}>
                <WidgetTile
                  id={id}
                  title={widgets[id]?.title}
                  render={widgets[id]?.render}
                  calBase={calBase}
                  setCalBase={setCalBase}
                  remove={() => setOrder((o) => o.filter((x) => x !== id))}
                />
              </SortableItem>
            ))}
          </ResponsiveGridLayout>
        </SortableContainer>
      </Dnd>
      {/* Expose reset via window event dispatched by the Reset button */}
      <ResetBridge onReset={reset} />
    </div>
  );
}

function WidgetTile({
  id,
  title,
  render,
  calBase,
  setCalBase,
  remove,
}: {
  id: string;
  title: string | undefined;
  render: (() => React.ReactNode) | undefined;
  calBase: Date;
  setCalBase: (d: Date) => void;
  remove: () => void;
}) {
  const { handleProps } = useDndHandle();
  return (
    <div
      className={`h-full rounded-xl border border-slate-800 p-5 flex flex-col overflow-hidden dark:border-slate-800 light:border-[#E0E6ED] light:bg-white light:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:light:shadow-[0_4px_6px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] transition-shadow duration-200`}
    >
      <div
        className="tc-widget-handle cursor-move select-none font-bold text-white dark:text-white light:text-[#202124] flex items-center justify-between"
        {...handleProps}
      >
        <span className="flex-1">{title}</span>
        {id === 'calendar' && (
          <div className="flex gap-1 tc-no-drag">
            <button
              type="button"
              onClick={() => setCalBase(new Date(calBase.getFullYear(), calBase.getMonth() - 1, 1))}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-700 hover:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 light:border-[#E0E6ED] light:hover:bg-[#F1F3F6] transition-colors"
              aria-label="Previous month"
            >
              ⟵
            </button>
            <button
              type="button"
              onClick={() => setCalBase(new Date(calBase.getFullYear(), calBase.getMonth() + 1, 1))}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-700 hover:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 light:border-[#E0E6ED] light:hover:bg-[#F1F3F6] transition-colors"
              aria-label="Next month"
            >
              ⟶
            </button>
          </div>
        )}
        {id !== 'calendar' && (
          <button
            title="Remove widget"
            aria-label="Remove widget"
            className="tc-widget-delete ml-2"
            onClick={remove}
          >
            🗑
          </button>
        )}
      </div>
      <div
        data-widget-id={id}
        className={`flex-1 min-h-0 ${id === 'calendar' ? 'overflow-visible' : id === 'progress' ? 'overflow-hidden' : id === 'analytics' ? 'overflow-hidden' : id === 'activity' ? 'overflow-hidden' : 'overflow-auto tc-scroll'}`}
      >
        {render?.()}
      </div>
    </div>
  );
}

function ResetBridge({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    function handler() {
      onReset();
    }
    window.addEventListener('tc:reset-layout' as any, handler as EventListener);
    return () => window.removeEventListener('tc:reset-layout' as any, handler as EventListener);
  }, [onReset]);
  return null;
}

function PinnedTimerWidget() {
  return (
    <div className="mt-2 text-sm text-slate-300 dark:text-slate-300 light:text-[#4A4A4A]">
      <div className="flex items-center justify-between">
        <div>Quick access to your active timer.</div>
        <a
          href="/dashboard/timers"
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 light:border-[#E0E6ED] light:bg-white light:text-[#202124]"
        >
          Open Timers
        </a>
      </div>
    </div>
  );
}
