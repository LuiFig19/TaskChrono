"use client"

import React from 'react'

type Props = {
  isAdmin: boolean
  organizationId: string | null
  plan: string
}

type Member = { id: string; name: string | null; email: string | null; role: string }

export default function SettingsClient({ isAdmin, organizationId, plan }: Props) {
  const [open, setOpen] = React.useState<{ team: boolean; billing: boolean; integrations: boolean }>({ team: true, billing: true, integrations: true })
  const [email, setEmail] = React.useState('')
  const [members, setMembers] = React.useState<Member[]>([])
  const [loading, setLoading] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await fetch('/api/team', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!ignore) setMembers(data.members || [])
      } catch {}
    }
    load()
    return () => { ignore = true }
  }, [])

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  async function invite() {
    if (!email.trim()) return
    setLoading(true)
    try {
      // Optimistic add placeholder
      const optimistic: Member = { id: 'tmp-'+Math.random().toString(36).slice(2), name: null, email, role: 'MEMBER' }
      setMembers((m) => [optimistic, ...m])
      const res = await fetch('/api/team/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) throw new Error('invite failed')
      notify('Invitation sent')
      setEmail('')
    } catch {
      notify('Failed to invite')
    } finally {
      setLoading(false)
    }
  }

  async function removeByEmail(targetEmail: string) {
    setLoading(true)
    setMembers((m) => m.filter((x) => x.email !== targetEmail))
    try {
      const res = await fetch('/api/team/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: targetEmail }) })
      if (!res.ok) throw new Error('remove failed')
      notify('Member removed')
    } catch {
      notify('Failed to remove')
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(id: string, role: string) {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, role } : x)))
    try {
      await fetch('/api/team/role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) })
      notify('Role updated')
    } catch {
      notify('Failed to update role')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {toast && (
        <div className="fixed right-4 top-16 z-50 rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-sm text-slate-200 shadow-lg">{toast}</div>
      )}

      <div className="mt-6 grid gap-6">
        {/* Team */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">Team</div>
              <div className="text-sm text-slate-400">Invite and manage members</div>
            </div>
            <button onClick={() => setOpen((o) => ({ ...o, team: !o.team }))} className="px-2 py-1 text-sm rounded border border-slate-700 hover:bg-slate-800">
              {open.team ? 'Hide' : 'Show'}
            </button>
          </header>
          {open.team && (
            <div className="px-4 pb-4 grid gap-3">
              {!isAdmin && <div className="text-xs text-rose-400">You do not have permission to manage members.</div>}
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="email@company.com" className="border border-slate-700 bg-transparent px-3 py-2 rounded text-slate-200" />
                  <button disabled={loading} onClick={invite} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-60">Invite</button>
                  <button disabled={loading || !email} onClick={()=>removeByEmail(email)} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-60">Remove</button>
                </div>
              )}

              <div className="mt-2 divide-y divide-slate-800 rounded border border-slate-800 overflow-hidden">
                {members.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-400">No members found.</div>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="text-slate-200">{m.name || '—'}</div>
                        <div className="text-xs text-slate-400">{m.email || 'unknown'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`role-${m.id}`}>Role</label>
                        <select id={`role-${m.id}`} value={m.role} onChange={(e)=>updateRole(m.id, e.target.value)} className="rounded border border-slate-700 bg-slate-900 text-slate-200 px-2 py-1 text-sm">
                          {['OWNER','ADMIN','MEMBER'].map((r)=> <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button onClick={()=> m.email && removeByEmail(m.email)} className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Billing */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">Billing</div>
              <div className="text-sm text-slate-400">Manage subscription</div>
            </div>
            <button onClick={() => setOpen((o) => ({ ...o, billing: !o.billing }))} className="px-2 py-1 text-sm rounded border border-slate-700 hover:bg-slate-800">
              {open.billing ? 'Hide' : 'Show'}
            </button>
          </header>
          {open.billing && (
            <div className="px-4 pb-4 grid gap-2">
              <div className="text-sm text-slate-300">Plan: <span className="font-medium uppercase">{plan}</span></div>
              <div className="text-xs text-slate-400">Status: active</div>
              <div className="flex gap-2 mt-1">
                <button onClick={()=>{ if (typeof window !== 'undefined') window.location.href='/dashboard/subscription' }} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Manage Subscription</button>
                {plan === 'FREE' && (
                  <button onClick={()=>alert('Pricing modal coming soon')} className="px-3 py-2 rounded border border-indigo-600 text-indigo-300 hover:bg-slate-800">Upgrade Plan</button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Integrations */}
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">Integrations</div>
              <div className="text-sm text-slate-400">Slack, Google Calendar</div>
            </div>
            <button onClick={() => setOpen((o) => ({ ...o, integrations: !o.integrations }))} className="px-2 py-1 text-sm rounded border border-slate-700 hover:bg-slate-800">
              {open.integrations ? 'Hide' : 'Show'}
            </button>
          </header>
          {open.integrations && (
            <div className="px-4 pb-4 grid gap-4">
              <div className="rounded border border-slate-800 p-3">
                <div className="font-medium text-slate-200">Slack</div>
                <div className="text-sm text-slate-400">Connect your workspace</div>
                <button onClick={()=>window.location.href='/api/integrations/slack/connect'} className="mt-2 px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Connect to Slack</button>
              </div>
              <div className="rounded border border-slate-800 p-3">
                <div className="font-medium text-slate-200">Google Calendar</div>
                <div className="text-sm text-slate-400">Sync tasks to your calendar</div>
                <button onClick={()=>window.location.href='/api/integrations/google-calendar/connect'} className="mt-2 px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Connect Google Calendar</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}


