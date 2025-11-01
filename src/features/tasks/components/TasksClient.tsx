'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  dueDate?: string | null;
  createdAt: string;
  assigneeId?: string | null;
  teamId?: string | null;
};

type ProjectGroup = {
  id: string;
  name: string;
  tasks: Task[];
};

export default function TasksClient() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectGroup[]>([]);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState('');
  const [teamId, setTeamId] = useState<string | ''>('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [orderByProject, setOrderByProject] = useState<Record<string, string[]>>({});
  const [teamOptions, setTeamOptions] = useState<Array<{ id: string; name: string }>>([]);
  // Optional: pause refresh during transient UI interactions
  const [refreshPausedUntil, setRefreshPausedUntil] = useState<number>(0);

  // Row jump animation (per task id): 'up' | 'down'
  const [rowAnim, setRowAnim] = useState<Record<string, 'up' | 'down' | undefined>>({});

  // Unified edit modal for a task
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<string>('TODO');
  const [priorityDraft, setPriorityDraft] = useState<number>(3);
  const [dueDraft, setDueDraft] = useState<string>('');

  type Toast = { id: string; text: string };
  const [toasts, setToasts] = useState<Toast[]>([]);
  function notify(text: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const s = statusFilter;
    return projects
      .map((p) => {
        // filter
        let tasks = p.tasks.filter((t) => {
          const matchesQ =
            !q ||
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q);
          const matchesS = s === 'ALL' || t.status === s;
          return matchesQ && matchesS;
        });
        // stable local order using orderByProject
        const ord = orderByProject[p.id];
        if (ord && ord.length > 0) {
          const pos: Record<string, number> = {};
          ord.forEach((id, i) => {
            pos[id] = i;
          });
          tasks = tasks.slice().sort((a, b) => (pos[a.id] ?? 1e9) - (pos[b.id] ?? 1e9));
        }
        return { ...p, tasks };
      })
      .filter((p) => p.tasks.length > 0 || !q);
  }, [projects, query, statusFilter, orderByProject]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { projects: ProjectGroup[] };
      setProjects(data.projects ?? []);
      const mapping: Record<string, string[]> = {};
      for (const p of data.projects ?? []) {
        mapping[p.id] = p.tasks.map((t) => t.id);
      }
      // Preserve any local ordering we already have
      setOrderByProject((prev) => {
        const next = { ...mapping };
        for (const k of Object.keys(prev)) {
          if (prev[k] && prev[k].length > 0) next[k] = prev[k];
        }
        return next;
      });
    } catch (_err) {
      // Swallow transient network/server errors so UI remains responsive
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    fetchData();
    const id = setInterval(() => {
      if (Date.now() < refreshPausedUntil) return;
      fetchData();
    }, 4000);
    return () => clearInterval(id);
  }, [fetchData, refreshPausedUntil]);

  useEffect(() => {
    // load teams list for linking
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/teams', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled)
          setTeamOptions((json?.teams || []).map((t: any) => ({ id: t.id, name: t.name })));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectName.trim()) return;
    setSubmitting(true);
    // optimistic update
    const optimisticProjectName = projectName.trim();
    const optimisticId = 'tmp-' + Math.random().toString(36).slice(2);
    const optimisticTask: Task = {
      id: optimisticId,
      title: title.trim(),
      description: description || null,
      status: 'TODO',
      priority,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };
    setProjects((cur) => {
      const idx = cur.findIndex(
        (p) => p.name.toLowerCase() === optimisticProjectName.toLowerCase(),
      );
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], tasks: [optimisticTask, ...copy[idx].tasks] };
        return copy;
      }
      return [{ id: 'tmp', name: optimisticProjectName, tasks: [optimisticTask] }, ...cur];
    });
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          projectName: optimisticProjectName,
          priority,
          dueDate: dueDate || undefined,
          teamId: teamId || null,
        }),
      });
      setTitle('');
      setProjectName('');
      setDescription('');
      setPriority(3);
      setDueDate('');
      setTeamId('');
      fetchData();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    setProjects((cur) =>
      cur.map((pg) => ({
        ...pg,
        tasks: pg.tasks.map((t) => (t.id === id ? ({ ...t, ...patch } as Task) : t)),
      })),
    );
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      notify('Saved');
    } catch {}
  }
  async function deleteTask(id: string) {
    setProjects((cur) => cur.map((pg) => ({ ...pg, tasks: pg.tasks.filter((t) => t.id !== id) })));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      notify('Deleted');
    } catch {}
  }

  function beginEditTask(t: Task) {
    setEditTask(t);
    setTitleDraft(t.title);
    setDescDraft(t.description || '');
    setStatusDraft(t.status);
    setPriorityDraft(t.priority);
    setDueDraft(t.dueDate || '');
  }
  async function commitEditTask() {
    if (!editTask) return;
    const patch: Partial<Omit<Task, 'id' | 'createdAt'>> = {};
    if (titleDraft.trim() && titleDraft.trim() !== editTask.title) patch.title = titleDraft.trim();
    const descVal = descDraft.trim();
    if ((descVal || null) !== (editTask.description || null)) patch.description = descVal || null;
    if (statusDraft !== editTask.status) patch.status = statusDraft;
    if (priorityDraft !== editTask.priority) patch.priority = priorityDraft;
    if ((dueDraft || null) !== (editTask.dueDate || null)) patch.dueDate = dueDraft || null;
    setEditTask(null);
    if (Object.keys(patch).length > 0) {
      await updateTask(editTask.id, patch);
    }
  }

  function triggerJump(taskId: string, dir: 'up' | 'down') {
    setRowAnim((s) => ({ ...s, [taskId]: dir }));
    setTimeout(
      () =>
        setRowAnim((s) => {
          const n = { ...s };
          delete n[taskId];
          return n;
        }),
      320,
    );
  }

  function moveTask(projectId: string, taskId: string, dir: 'up' | 'down') {
    setOrderByProject((cur) => {
      const list =
        cur[projectId] || projects.find((p) => p.id === projectId)?.tasks.map((t) => t.id) || [];
      const idx = list.indexOf(taskId);
      if (idx < 0) return cur;
      const to = dir === 'up' ? Math.max(0, idx - 1) : Math.min(list.length - 1, idx + 1);
      if (to === idx) return cur;
      const next = { ...cur };
      const arr = Array.from(list);
      const [removed] = arr.splice(idx, 1);
      arr.splice(to, 0, removed);
      next[projectId] = arr;
      return next;
    });
    setProjects((cur) =>
      cur.map((p) => {
        if (p.id !== projectId) return p;
        const ids = orderByProject[projectId] || p.tasks.map((t) => t.id);
        const list = Array.from(ids);
        const i = list.indexOf(taskId);
        if (i === -1) return p;
        const j = dir === 'up' ? Math.max(0, i - 1) : Math.min(list.length - 1, i + 1);
        if (i === j) return p;
        const arr = Array.from(list);
        const [removed] = arr.splice(i, 1);
        arr.splice(j, 0, removed);
        const byId: Record<string, Task> = {};
        for (const t of p.tasks) byId[t.id] = t;
        triggerJump(taskId, dir);
        return { ...p, tasks: arr.map((id) => byId[id]).filter(Boolean) };
      }),
    );
  }

  function Project({ p }: { p: ProjectGroup }) {
    if (!mounted) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 no-global-hover">
          <button
            onClick={() => setCollapsed((c) => ({ ...c, [p.id]: !c[p.id] }))}
            className="w-full text-left px-4 py-2 flex items-center justify-between"
          >
            <div className="font-medium text-white">Project: {p.name}</div>
            <span className="text-xs text-slate-400">
              {collapsed[p.id] ? 'Expand' : 'Collapse'}
            </span>
          </button>
          {collapsed[p.id] ? null : (
            <ul className="dark:divide-y dark:divide-slate-800 light:space-y-2">
              {p.tasks.map((t) => (
                <li
                  key={t.id}
                  className={`px-3 py-3 flex items-start justify-between gap-3 rounded-lg border ${t.status === 'DONE' ? 'dark:bg-emerald-900/30 dark:border-emerald-800 light:bg-emerald-200 light:border-emerald-300' : t.status === 'BLOCKED' ? 'dark:bg-rose-900/30 dark:border-rose-800 light:bg-rose-200 light:border-rose-300' : t.status === 'IN_PROGRESS' ? 'dark:bg-amber-900/30 dark:border-amber-800 light:bg-amber-200 light:border-amber-300' : 'light:bg-white light:border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 break-words">
                      {t.title}
                      <button
                        aria-label="Edit task"
                        title="Edit task"
                        onClick={() => beginEditTask(t)}
                        className="ml-2 text-xs px-1 rounded border border-slate-700 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    </div>
                    {t.description ? (
                      <div className="text-xs text-slate-400 mt-1 break-words">{t.description}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      aria-label="Task status"
                      title="Press Edit to change status"
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-center select-none ${t.status === 'DONE' ? 'dark:border-emerald-800 dark:text-emerald-300 light:border-emerald-400 light:text-emerald-800' : t.status === 'BLOCKED' ? 'dark:border-rose-800 dark:text-rose-300 light:border-rose-400 light:text-rose-800' : t.status === 'IN_PROGRESS' ? 'dark:border-amber-800 dark:text-amber-300 light:border-amber-400 light:text-amber-800' : 'dark:border-slate-700 dark:text-slate-300 light:border-slate-300 light:text-slate-700'}`}
                    >
                      {t.status || 'TODO'}
                    </span>
                    <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-300">
                      P{t.priority}
                    </span>
                    {t.dueDate ? (
                      <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-300">
                        Due {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                    <button
                      onClick={() => deleteTask(t.id)}
                      title="Delete task"
                      aria-label="Delete task"
                      className="p-1.5 rounded border border-rose-700 hover:bg-rose-900/30"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-rose-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.5 3a1 1 0 00-.894.553L9.118 4.5H6a.75.75 0 000 1.5h12a.75.75 0 000-1.5h-3.118l-.488-.947A1 1 0 0013.5 3h-3zm-4 5.25a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0v-9.5zm5.25 0a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0v-9.5zm6.75 0a.75.75 0 00-1.5 0v9.5a.75.75 0 001.5 0v-9.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 no-global-hover">
        <button
          onClick={() => setCollapsed((c) => ({ ...c, [p.id]: !c[p.id] }))}
          className="w-full text-left px-4 py-2 flex items-center justify-between"
        >
          <div className="font-medium text-white">Project: {p.name}</div>
          <span className="text-xs text-slate-400">{collapsed[p.id] ? 'Expand' : 'Collapse'}</span>
        </button>
        {collapsed[p.id] ? null : (
          <ul className="dark:divide-y dark:divide-slate-800 light:space-y-2">
            {p.tasks.map((t, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === p.tasks.length - 1;
              const jumpCls =
                rowAnim[t.id] === 'up'
                  ? 'tc-jump-up'
                  : rowAnim[t.id] === 'down'
                    ? 'tc-jump-down'
                    : '';
              return (
                <li
                  key={t.id}
                  data-task-row
                  data-task-status={t.status}
                  className={`tc-task-row px-3 py-3 flex items-start justify-between gap-3 transition-colors rounded-lg border ${jumpCls} ${t.status === 'DONE' ? 'dark:bg-emerald-900/30 dark:border-emerald-800 light:bg-emerald-200 light:border-emerald-300' : t.status === 'BLOCKED' ? 'dark:bg-rose-900/30 dark:border-rose-800 light:bg-rose-200 light:border-rose-300' : t.status === 'IN_PROGRESS' ? 'dark:bg-amber-900/30 dark:border-amber-800 light:bg-amber-200 light:border-amber-300' : 'light:bg-white light:border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 break-words">
                      {t.title}
                      <button
                        aria-label="Edit task"
                        title="Edit task"
                        onClick={() => beginEditTask(t)}
                        className="ml-2 text-xs px-1 rounded border border-slate-700 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    </div>
                    {t.description ? (
                      <div className="text-xs text-slate-400 mt-1 break-words">{t.description}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {/* Move up/down arrows */}
                    <button
                      title="Move up"
                      aria-label="Move task up"
                      disabled={isFirst}
                      onClick={() => moveTask(p.id, t.id, 'up')}
                      className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 4a.75.75 0 01.53.22l5 5a.75.75 0 11-1.06 1.06L10 5.81 5.53 10.28a.75.75 0 11-1.06-1.06l5-5A.75.75 0 0110 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      title="Move down"
                      aria-label="Move task down"
                      disabled={isLast}
                      onClick={() => moveTask(p.id, t.id, 'down')}
                      className="p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 16a.75.75 0 01-.53-.22l-5-5a.75.75 0 111.06-1.06L10 14.19l4.47-4.47a.75.75 0 111.06 1.06l-5 5A.75.75 0 0110 16z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <span
                      aria-label="Task status"
                      title="Press Edit to change status"
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium select-none shadow-sm ${
                        t.status === 'DONE'
                          ? 'bg-emerald-600 text-white dark:bg-emerald-600'
                          : t.status === 'BLOCKED'
                            ? 'bg-rose-600 text-white dark:bg-rose-600'
                            : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-400 text-slate-900 dark:bg-amber-400'
                              : 'bg-slate-600 text-white dark:bg-slate-600'
                      }`}
                    >
                      {t.status || 'TODO'}
                    </span>
                    <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-300">
                      P{t.priority}
                    </span>
                    {t.dueDate ? (
                      <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-300">
                        Due {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    ) : null}
                    <button
                      onClick={() => deleteTask(t.id)}
                      title="Delete task"
                      aria-label="Delete task"
                      className="tc-widget-delete p-1.5 text-rose-500 hover:text-rose-400 focus:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.5 3a1 1 0 00-.894.553L9.118 4.5H6a.75.75 0 000 1.5h12a.75.75 0 000-1.5h-3.118l-.488-.947A1 1 0 0013.5 3h-3zm-4 5.25a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0v-9.5zm5.25 0a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0v-9.5zm6.75 0a.75.75 0 00-1.5 0v9.5a.75.75 0 001.5 0v-9.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 relative">
        {/* Toasts */}
        <div className="pointer-events-none fixed right-4 top-16 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm text-slate-200 shadow-lg"
            >
              {t.text}
            </div>
          ))}
        </div>
        {/* Left: controls */}
        <section>
          {/* Compact nav box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 mb-4 light:border-slate-200 light:bg-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">Tasks</h1>
                <a
                  href="/dashboard/projects"
                  className="text-sm px-2.5 py-1 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Projects
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="sr-only" htmlFor="task-search">
                  Search tasks
                </label>
                <input
                  id="task-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks"
                  className="rounded-md bg-transparent border border-slate-700 px-3 py-1.5 text-slate-200 w-40 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                />
                <label className="sr-only" htmlFor="status-filter">
                  Status filter
                </label>
                <select
                  id="status-filter"
                  title="Status filter"
                  aria-label="Status filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded border border-slate-700 bg-slate-900 text-slate-200 px-2 py-1.5 light:border-slate-300 light:bg-white light:text-black"
                >
                  <option value="ALL">All</option>
                  {['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form
            onSubmit={onAddTask}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 light:border-slate-200 light:bg-white"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs dark:text-slate-200 light:text-black">Task title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Redesign website"
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                  required
                />
              </div>
              <div>
                <label className="text-xs dark:text-slate-200 light:text-black">Project name</label>
                <input
                  list="tc_project_options"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Type to search or add a new project"
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                  required
                />
                <datalist id="tc_project_options">
                  {projects.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="text-xs dark:text-slate-200 light:text-black">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                placeholder="Optional details"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs dark:text-slate-200 light:text-black">Priority (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value) || 3)}
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                  title="Priority"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="text-xs dark:text-slate-200 light:text-black">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 placeholder:text-slate-400 light:bg-white light:text-black light:border-slate-300 light:placeholder:text-black/60"
                  title="Due date"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label htmlFor="link-to-team" className="text-xs dark:text-slate-200 light:text-black">
                  Link to team (optional)
                </label>
                <select
                  id="link-to-team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200 light:bg-white light:text-black light:border-slate-300"
                >
                  <option value="">No team</option>
                  {/* options fetched client-side */}
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={submitting}
                className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 border border-emerald-700/50"
              >
                Add Task
              </button>
              {loading ? <span className="text-xs text-slate-400">Loading...</span> : null}
            </div>
          </form>
        </section>

        {/* Right: live list */}
        <aside className="hidden lg:block">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 light:border-slate-200 light:bg-white">
            <div className="flex items-center justify-between">
              <div className="font-medium text-white">Live Tasks</div>
              <button
                onClick={fetchData}
                className="text-xs px-2 py-1 rounded border border-rose-700/50 bg-rose-600 text-white hover:bg-rose-500"
              >
                Refresh
              </button>
            </div>
            <div className="mt-3 space-y-3 max-h-[60vh] overflow-auto tc-scroll">
              {grouped.length === 0 ? (
                <div className="text-sm text-slate-400">No tasks yet. Add your first task.</div>
              ) : (
                grouped.map((p) => <Project key={p.id} p={p} />)
              )}
            </div>
          </div>
        </aside>

        {/* Mobile: list below */}
        <section className="lg:hidden">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 mt-4">
            <div className="font-medium text-white">Your Tasks</div>
            <div className="mt-3 space-y-3 max-h-[50vh] overflow-auto tc-scroll">
              {grouped.length === 0 ? (
                <div className="text-sm text-slate-400">No tasks yet.</div>
              ) : (
                grouped.map((p) => <Project key={'m-' + p.id} p={p} />)
              )}
            </div>
          </div>
        </section>
      </div>
      {editTask ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-xl transition-transform duration-200 ease-out transform">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="text-white font-medium">Edit Task</div>
              <button
                onClick={() => setEditTask(null)}
                className="text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-title" className="text-sm text-slate-400">
                    Title
                  </label>
                  <input
                    id="edit-title"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="edit-status" className="text-sm text-slate-400">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-slate-200"
                  >
                    {['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200"
                  placeholder="Add details"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-priority" className="text-sm text-slate-400">
                    Priority (1-5)
                  </label>
                  <input
                    id="edit-priority"
                    type="number"
                    min={1}
                    max={5}
                    value={priorityDraft}
                    onChange={(e) => setPriorityDraft(Number(e.target.value) || 3)}
                    className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="edit-due" className="text-sm text-slate-400">
                    Due date
                  </label>
                  <input
                    id="edit-due"
                    type="date"
                    value={dueDraft}
                    onChange={(e) => setDueDraft(e.target.value)}
                    className="mt-1 w-full rounded-md bg-transparent border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
              <button
                onClick={() => setEditTask(null)}
                className="px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={commitEditTask}
                className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
