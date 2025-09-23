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
  const [orgName, setOrgName] = React.useState('')
  const [brandColor, setBrandColor] = React.useState<string>('#c7d2fe')
  const [wheelOpen, setWheelOpen] = React.useState(false)
  const [orgPickerOpen, setOrgPickerOpen] = React.useState(false)
  const [orgs, setOrgs] = React.useState<Array<{ id: string; name: string; role: string }>>([])

  React.useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [teamRes, orgRes, listRes] = await Promise.all([
          fetch('/api/team', { cache: 'no-store' }),
          organizationId ? fetch(`/api/org/${organizationId}`, { cache: 'no-store' }) : Promise.resolve(null as any),
          fetch('/api/org/list', { cache: 'no-store' })
        ])
        if (teamRes?.ok) {
          const data = await teamRes.json(); if (!ignore) setMembers(data.members || [])
        }
        if (orgRes?.ok) {
          const org = await orgRes.json(); if (!ignore) { setOrgName(org.name || ''); if (org.brandColor) setBrandColor(org.brandColor) }
        }
        if (listRes?.ok) { const data = await listRes.json(); if (!ignore) setOrgs(data.orgs || []) }
      } catch {}
    }
    load()
    return () => { ignore = true }
  }, [])

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2200) }

  async function saveOrgName() {
    if (!organizationId || !orgName.trim()) return
    try {
      const res = await fetch('/api/company/update', { method: 'POST', body: (()=>{ const f=new FormData(); f.set('id', organizationId); f.set('name', orgName.trim()); f.set('brandColor', brandColor); return f })() })
      if (!res.ok) throw new Error('update failed')
      notify('Company settings saved')
    } catch { notify('Failed to save company settings') }
  }

  // Instant broadcast to header
  React.useEffect(() => { window.dispatchEvent(new CustomEvent('tc:brand-color', { detail: { color: brandColor } })) }, [brandColor])
  React.useEffect(() => { window.dispatchEvent(new CustomEvent('tc:brand-name', { detail: { name: orgName } })) }, [orgName])

  async function invite() {
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/team/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) throw new Error('invite failed')
      const data = await res.json().catch(()=>null)
      // Open Gmail compose with prefilled message
      const subject = encodeURIComponent('You\'re invited to TaskChrono')
      const body = encodeURIComponent(`You have been invited to join our TaskChrono workspace. Click Continue to accept: ${data?.acceptUrl || ''}`)
      const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`
      try { window.open(gmail, '_blank', 'noopener,noreferrer') } catch {}
      notify('Compose email opened in Gmail')
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
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="block text-sm text-slate-300">Company Name</label>
            <input value={orgName} onChange={(e)=>setOrgName(e.target.value)} placeholder="Acme Inc" className="mt-1 w-full px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setWheelOpen(true)} className="h-10 px-4 rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">Pick Color</button>
            <div className="h-8 w-8 rounded-full border border-slate-600" aria-label="Selected color" title={brandColor} style={{ background: brandColor }} />
            <button onClick={saveOrgName} className="h-10 shrink-0 px-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
          </div>
        </div>
        {toast && <div className="mt-2 text-xs text-emerald-400">{toast}</div>}
      </div>

      {wheelOpen && (
        <ColorWheelModal
          initialColor={brandColor}
          onClose={()=>setWheelOpen(false)}
          onChange={(hex)=> setBrandColor(hex)}
        />
      )}

      {/* Team */}
      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60">
        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">Team</div>
            <div className="text-sm text-slate-400">Invite and manage members</div>
          </div>
          <button onClick={() => setOpen((o) => ({ ...o, team: !o.team }))} className="px-2 py-1 text-sm rounded border border-rose-600/30 text-rose-300 hover:bg-rose-900/20">
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

      {/* Switch workspace */}
      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60">
        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">Workspaces</div>
            <div className="text-sm text-slate-400">Switch between organizations you belong to</div>
          </div>
          <button onClick={() => setOrgPickerOpen(true)} className="px-2 py-1 text-sm rounded border border-rose-600/30 text-rose-300 hover:bg-rose-900/20">Switch</button>
        </header>
      </section>

      {orgPickerOpen && (
        <OrgPickerModal
          orgs={orgs}
          onClose={()=>setOrgPickerOpen(false)}
          onChoose={async (id)=>{ try { await fetch('/api/org/set-active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId: id }) }); window.location.reload() } catch {} }}
        />
      )}

      {/* Billing */}
      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60">
        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">Billing</div>
            <div className="text-sm text-slate-400">Manage subscription</div>
          </div>
          <button onClick={() => setOpen((o) => ({ ...o, billing: !o.billing }))} className="px-2 py-1 text-sm rounded border border-rose-600/30 text-rose-300 hover:bg-rose-900/20">
            {open.billing ? 'Hide' : 'Show'}
          </button>
        </header>
        {open.billing && (
          <div className="px-4 pb-4 grid gap-2">
            <div className="text-sm text-slate-300">Plan: <span className="font-medium uppercase">{plan}</span></div>
            <div className="text-xs text-slate-400">Status: active</div>
            <div className="flex gap-2 mt-1">
              <button onClick={()=>{ if (typeof window !== 'undefined') window.location.href='/dashboard/subscription' }} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500">Manage Subscription</button>
              {plan === 'FREE' && (
                <button onClick={()=>{ if (typeof window !== 'undefined') window.location.href='/dashboard/subscription?upgrade=1' }} className="px-3 py-2 rounded border border-indigo-600 text-indigo-300 hover:bg-slate-800">Upgrade Plan</button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Integrations */}
      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60">
        <header className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">Integrations</div>
            <div className="text-sm text-slate-400">Slack, Google Calendar</div>
          </div>
          <button onClick={() => setOpen((o) => ({ ...o, integrations: !o.integrations }))} className="px-2 py-1 text-sm rounded border border-rose-600/30 text-rose-300 hover:bg-rose-900/20">
            {open.integrations ? 'Hide' : 'Show'}
          </button>
        </header>
        {open.integrations && (
          <div className="px-4 pb-4 grid gap-4">
            <div className="rounded border border-slate-800 p-3">
              <div className="font-medium text-slate-200">Slack</div>
              <div className="text-sm text-slate-400">Connect your workspace</div>
              <button onClick={()=>window.location.href='/api/integrations/slack/connect'} className="mt-2 px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white border border-rose-500">Connect to Slack</button>
            </div>
            <div className="rounded border border-slate-800 p-3">
              <div className="font-medium text-slate-200">Google Calendar</div>
              <div className="text-sm text-slate-400">Sync tasks to your calendar</div>
              <button onClick={()=>window.location.href='/api/integrations/google-calendar/connect'} className="mt-2 px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white border border-rose-500">Connect Google Calendar</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// Simple animated color wheel modal with many hues
function hslToHex(h: number, s: number, l: number) {
  h = Math.max(0, Math.min(360, h)); s = Math.max(0, Math.min(100, s)); l = Math.max(0, Math.min(100, l));
  s/=100; l/=100; const k=(n:number)=>(n+h/30)%12; const a=s*Math.min(l,1-l);
  const f=(n:number)=> l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
  const toHex = (x:number)=> Math.round(x*255).toString(16).padStart(2,'0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  let h = hex.trim().replace(/^#/,'').toLowerCase()
  if (h.length === 3) h = h.split('').map(c=>c+c).join('')
  if (!/^([0-9a-f]{6})$/.test(h)) return null
  const r = parseInt(h.slice(0,2),16)/255
  const g = parseInt(h.slice(2,4),16)/255
  const b = parseInt(h.slice(4,6),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let hh = 0, s = 0, l = (max+min)/2
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    switch(max){
      case r: hh = (g-b)/d + (g < b ? 6 : 0); break
      case g: hh = (b-r)/d + 2; break
      case b: hh = (r-g)/d + 4; break
    }
    hh /= 6
  }
  return { h: Math.round(hh*360), s: Math.round(s*100), l: Math.round(l*100) }
}

function ColorWheelModal({ initialColor, onClose, onChange }: { initialColor: string; onClose: () => void; onChange: (hex: string) => void }) {
  const start = React.useMemo(()=> hexToHsl(initialColor) || { h: 210, s: 90, l: 60 }, [initialColor])
  const [hue, setHue] = React.useState(start.h)
  const [sat, setSat] = React.useState(start.s)
  const [light, setLight] = React.useState(start.l)
  const hex = React.useMemo(()=> hslToHex(hue, sat, light), [hue, sat, light])
  const [hexInput, setHexInput] = React.useState(hex)

  // Push live changes to parent
  React.useEffect(()=> { onChange(hex); setHexInput(hex) }, [hex])

  function onHexTyped(v: string) {
    setHexInput(v)
    let txt = v.trim()
    if (txt.startsWith('#')) txt = txt.slice(1)
    if (txt.length === 3) txt = txt.split('').map(c=>c+c).join('')
    if (/^[0-9a-fA-F]{6}$/.test(txt)) {
      const hsl = hexToHsl('#'+txt)
      if (hsl) { setHue(hsl.h); setSat(hsl.s); setLight(hsl.l); onChange('#'+txt.toLowerCase()) }
    }
  }

  return (
    <div className="fixed inset-0 z-[100000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-slate-200 font-medium">Pick a color</div>
            <div className="h-6 w-6 rounded-full border border-slate-600" style={{ background: hex }} />
          </div>
          <div className="mt-4 grid gap-3">
            <label className="sr-only" htmlFor="cw-hue">Hue</label>
            <input id="cw-hue" type="range" min={0} max={360} value={hue} onChange={e=>setHue(Number(e.target.value))} className="w-full" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-14">Saturation</label>
              <input aria-label="Saturation" type="range" min={0} max={100} value={sat} onChange={e=>setSat(Number(e.target.value))} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-14">Lightness</label>
              <input aria-label="Lightness" type="range" min={0} max={100} value={light} onChange={e=>setLight(Number(e.target.value))} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-14">HEX</label>
              <input aria-label="HEX" value={hexInput} onChange={e=>onHexTyped(e.target.value)} placeholder="#RRGGBB" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 font-mono" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}


function OrgPickerModal({ orgs, onClose, onChoose }: { orgs: Array<{ id: string; name: string; role: string }>; onClose: () => void; onChoose: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-[100000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
          <div className="text-slate-200 font-medium">Switch workspace</div>
          <div className="mt-3 grid gap-2 max-h-[360px] overflow-y-auto">
            {orgs.map((o) => (
              <button key={o.id} onClick={()=>onChoose(o.id)} className="text-left px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-200">{o.name}</div>
                  <div className="text-xs text-slate-400">Role: {o.role}</div>
                </div>
                <span className="text-xs text-indigo-300">Switch →</span>
              </button>
            ))}
            {orgs.length === 0 && (
              <div className="text-sm text-slate-400">You only belong to your current workspace.</div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}


