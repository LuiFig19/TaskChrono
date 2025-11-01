'use client';
import { useState } from 'react';

type Doc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export default function TeamsClient(props: {
  initialDocs?: Doc[];
  teamId?: string;
  initialTab?: string;
}) {
  const initialDocs = props.initialDocs ?? [];
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [activeId, setActiveId] = useState<string | null>(initialDocs[0]?.id ?? null);
  const active = docs.find((d) => d.id === activeId) || null;

  async function createDoc() {
    const res = await fetch('/api/teams', { method: 'POST' });
    const doc = await res.json();
    setDocs((d) => [doc, ...d]);
    setActiveId(doc.id);
  }

  async function saveDoc(partial: Partial<Doc>) {
    if (!active) return;
    const res = await fetch('/api/teams/' + active.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    const updated = await res.json();
    setDocs((d) => d.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function deleteDoc(id: string) {
    const ok = confirm('Delete this page?');
    if (!ok) return;
    await fetch('/api/teams/' + id, { method: 'DELETE' });
    setDocs((d) => d.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(docs[0]?.id ?? null);
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
      <aside className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-slate-200 text-sm">Pages</div>
          <button
            onClick={createDoc}
            className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            New
          </button>
        </div>
        <ul className="grid gap-1 text-sm">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${doc.id === activeId ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-200'}`}
              onClick={() => setActiveId(doc.id)}
            >
              <span className="truncate">{doc.title || 'Untitled'}</span>
              <button
                className="text-slate-400 hover:text-rose-400"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDoc(doc.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="rounded-xl border border-slate-800 bg-slate-900">
        {active ? (
          <div className="p-4 grid gap-3">
            <input
              className="w-full bg-transparent outline-none text-xl font-semibold border-b border-slate-800 focus:border-indigo-500 px-1 py-1"
              value={active.title}
              placeholder="Untitled"
              onChange={(e) =>
                setDocs((d) =>
                  d.map((x) => (x.id === active.id ? { ...x, title: e.target.value } : x)),
                )
              }
              onBlur={(e) => saveDoc({ title: e.target.value })}
            />
            <textarea
              className="min-h-[50vh] w-full bg-transparent outline-none text-slate-100 leading-7 px-1"
              value={active.content}
              placeholder="Write your team knowledge, SOPs, and docs here..."
              onChange={(e) =>
                setDocs((d) =>
                  d.map((x) => (x.id === active.id ? { ...x, content: e.target.value } : x)),
                )
              }
              onBlur={(e) => saveDoc({ content: e.target.value })}
            />
          </div>
        ) : (
          <div className="p-8 text-slate-300">
            No page selected. Create a new one to get started.
          </div>
        )}
      </section>
    </div>
  );
}
