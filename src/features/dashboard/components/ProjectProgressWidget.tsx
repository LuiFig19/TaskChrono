'use client';
import React, { useEffect, useState } from 'react';

type Project = { id: string; name: string };

export default function ProjectProgressWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressById, setProgressById] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/projects/list', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        const list: Project[] = Array.isArray(json.projects) ? json.projects : [];
        setProjects(list);
        setSelectedIds((prev) => {
          let next = prev.length
            ? [...prev]
            : typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem('tc_progress_ids') || '[]')
              : [];
          if (next.length === 0) next = list.slice(0, 3).map((p) => p.id);
          // ensure all ids still exist
          next = next.filter((id: string) => list.some((p) => p.id === id));
          if (next.length === 0 && list[0]) next = [list[0].id];
          return next;
        });
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  async function refreshProgress(id: string) {
    try {
      const res = await fetch(`/api/projects/progress?id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      const pct = Math.max(0, Math.min(100, Number(json.progress || 0)));
      setProgressById((cur) => ({ ...cur, [id]: pct }));
    } catch {}
  }

  useEffect(() => {
    const ids = selectedIds.filter(Boolean);
    if (ids.length === 0) return;
    ids.forEach((id) => refreshProgress(id));
    const i = setInterval(() => ids.forEach((id) => refreshProgress(id)), 5000);
    return () => clearInterval(i);
  }, [selectedIds.join(',')]);

  function setSelectedAt(index: number, value: string) {
    setSelectedIds((cur) => {
      const next = [...cur];
      next[index] = value;
      if (typeof window !== 'undefined')
        localStorage.setItem('tc_progress_ids', JSON.stringify(next));
      (async () => {
        try {
          await fetch('/api/user-prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progressIds: next }),
          });
        } catch {}
      })();
      return next;
    });
  }

  function addBar() {
    setSelectedIds((cur) => {
      const next = [...cur];
      const available =
        projects.map((p) => p.id).find((id) => !next.includes(id)) || projects[0]?.id || '';
      next.push(available);
      if (typeof window !== 'undefined')
        localStorage.setItem('tc_progress_ids', JSON.stringify(next));
      (async () => {
        try {
          await fetch('/api/user-prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progressIds: next }),
          });
        } catch {}
      })();
      return next;
    });
  }

  function removeBar(index: number) {
    setSelectedIds((cur) => {
      if (cur.length <= 1) return cur;
      const next = cur.filter((_, i) => i !== index);
      if (typeof window !== 'undefined')
        localStorage.setItem('tc_progress_ids', JSON.stringify(next));
      (async () => {
        try {
          await fetch('/api/user-prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progressIds: next }),
          });
        } catch {}
      })();
      return next;
    });
  }

  // Only allow the inner grid to scroll once more than 3 bars are present
  return (
    <div className="mt-2 text-sm h-full min-h-0 grid grid-rows-[minmax(0,1fr)_auto]">
      {/* Cards area — scrolls only when content exceeds space */}
      <div className="grid gap-3 md:grid-cols-3 content-start overflow-y-auto pr-2 tc-scroll min-h-0 pb-2">
        {selectedIds.map((selectedId, idx) => {
          const progress = progressById[selectedId] ?? 0;
          const pct = Math.max(0, Math.min(100, progress));
          const hue = Math.round((pct / 100) * 120); // 0=>red, 120=>green
          const fillColor = `hsl(${hue}, 85%, 55%)`;
          return (
            <div
              key={`ppw-${idx}`}
              className="rounded-md border border-slate-700 bg-slate-800/60 p-2"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <label htmlFor={`ppw-select-${idx}`} className="text-slate-300">
                  Project
                </label>
                <select
                  id={`ppw-select-${idx}`}
                  value={selectedId}
                  onChange={(e) => setSelectedAt(idx, e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-100 max-w-[70%]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {projects.length === 0 && (
                    <option value="" disabled>
                      No projects yet
                    </option>
                  )}
                </select>
                {selectedIds.length > 1 && (
                  <button
                    onClick={() => removeBar(idx)}
                    className="ml-auto px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                    aria-label="Hide progress"
                  >
                    Hide
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-slate-200 mb-1">
                <span>Progress</span>
                <span className="text-xs text-slate-300">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-900 overflow-hidden">
                <div
                  className="h-2 rounded transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: fillColor } as React.CSSProperties}
                  aria-label={`Project progress ${pct}%`}
                  data-progress={pct}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Footer area is fixed at the bottom and always fully visible */}
      <div className="pt-2 shrink-0 sticky bottom-0 bg-transparent">
        <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-2 h-10 flex items-center justify-center dark:border-slate-700 dark:bg-slate-900/40 light:border-[#D0D4DA] light:bg-transparent">
          <button
            data-progress-add
            onClick={addBar}
            className="px-3 py-1 rounded-full border bg-blue-600 text-white border-blue-500 hover:bg-blue-700
              dark:rounded-md dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white dark:border-blue-500"
          >
            + Add Progress Bar
          </button>
        </div>
      </div>
    </div>
  );
}
