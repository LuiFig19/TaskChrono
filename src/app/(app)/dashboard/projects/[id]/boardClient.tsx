'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useEffect, useMemo, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority: number;
};

export default function BoardClient({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const columns: Array<Task['status']> = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

  async function load() {
    const res = await fetch(`/api/tasks?projectId=${projectId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const project = (data.projects || []).find((p: any) => p.id === projectId);
    setTasks(project ? project.tasks : []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function onDragEnd(res: DropResult) {
    if (!res.destination) return;
    const id = res.draggableId.replace('task:', '');
    const toCol = res.destination.droppableId as Task['status'];
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, status: toCol } : t)));
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: toCol }),
    });
  }

  const grouped = useMemo(() => {
    const g: Record<Task['status'], Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [], BLOCKED: [] };
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Kanban</h1>
        <button
          onClick={load}
          className="px-2 py-1 rounded border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => (
              <Droppable droppableId={col} type="TASK" key={col}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 min-h-[300px]"
                  >
                    <div className="font-medium text-white mb-2">{col.replace('_', ' ')}</div>
                    <div className="space-y-2">
                      {grouped[col].map((t, idx) => (
                        <Draggable key={t.id} draggableId={`task:${t.id}`} index={idx}>
                          {(p) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              className="rounded-lg border border-slate-700 bg-slate-900 p-3 max-w-full overflow-hidden"
                            >
                              <div className="text-slate-200 text-sm break-words whitespace-pre-wrap">
                                {t.title}
                              </div>
                              {t.description ? (
                                <div className="text-xs text-slate-400 mt-1 break-words whitespace-pre-wrap">
                                  {t.description}
                                </div>
                              ) : null}
                              <div className="text-xs text-slate-500 mt-1">P{t.priority}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
