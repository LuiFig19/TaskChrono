'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function NewTeamClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}) as any);
      if (!res.ok || !json?.id) {
        throw new Error(json?.error || 'Failed to create team');
      }
      router.push(`/dashboard/teams/${json.id}`);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm text-slate-300">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-slate-300">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100"
        />
      </label>
      {error && <div className="text-sm text-rose-400">{error}</div>}
      <button
        type="submit"
        disabled={busy}
        className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 w-max"
      >
        {busy ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}
