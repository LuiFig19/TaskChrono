"use client";
import * as React from 'react';

export default function OnboardingClient({ plan }: { plan: string }) {
  const [name, setName] = React.useState('');
  const [emails, setEmails] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Please enter an organization name'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emails, plan }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) { setError(data?.error || 'Failed to start onboarding'); setLoading(false); return; }
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      setError('Unexpected response');
    } catch (err: any) {
      setError('Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
      <label className="grid gap-1">
        <span className="text-sm text-slate-300">Organization name</span>
        <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e=>setName(e.target.value)} placeholder="Acme Inc" required />
      </label>
      <div className="grid gap-1">
        <span className="text-sm text-slate-300">Invite teammates (optional)</span>
        <input className="border border-slate-700 bg-slate-900 text-slate-100 rounded-md px-3 py-2" value={emails} onChange={e=>setEmails(e.target.value)} placeholder="name1@company.com, name2@company.com" />
        <span className="text-xs text-slate-400">We’ll send email invites after setup. You can manage roles in Settings.</span>
      </div>
      {error ? <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">{error}</div> : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">{loading ? 'Continuing…' : 'Continue'}</button>
        <a href="/get-started" className="text-slate-300 hover:text-white transition-colors">Choose a different plan</a>
      </div>
    </form>
  );
}


