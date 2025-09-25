"use client"
import React, { useEffect, useMemo, useState } from 'react'

type Status = {
  locked: boolean
  plan: 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'
  membersCount: number
  prices: { BUSINESS: number; ENTERPRISE: number }
}

export default function BillingGuard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState<'BUSINESS'|'ENTERPRISE'>('BUSINESS')
  const [seats, setSeats] = useState<number>(1)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/billing/status', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as Status
        if (!mounted) return
        setStatus(json)
        setSeats(Math.max(1, json.membersCount || 1))
        if (json.locked) setOpen(true)
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const price = useMemo(() => {
    if (!status) return 0
    const prices = status.prices || { BUSINESS: 500, ENTERPRISE: 1200 }
    const unit = tier === 'BUSINESS' ? prices.BUSINESS : prices.ENTERPRISE
    return unit * Math.max(1, seats)
  }, [status, tier, seats])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, seats }) })
      const data = await res.json() as { url?: string; error?: string }
      if (data?.url) {
        window.location.href = data.url
      } else if (data?.error) {
        setError(data.error)
      }
    } catch {
      setError('Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json() as { url?: string }
      if (data.url && typeof window !== 'undefined') window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="text-xl font-semibold">Activate your workspace</div>
            <div className="text-sm text-slate-400 mt-1">Your 14-day trial has ended. Enter card details to continue.</div>
          </div>
          <form onSubmit={onSubmit} className="p-6 grid gap-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm">
                <span>Plan</span>
                <select aria-label="Select plan" title="Select plan" value={tier} onChange={e=>setTier(e.target.value as any)} className="px-3 py-2 rounded-md bg-slate-950 border border-slate-700">
                  <option value="BUSINESS">Business</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Seats</span>
                <input type="number" min={1} value={seats} onChange={e=>setSeats(Math.max(1, Number(e.target.value)||1))} className="px-3 py-2 rounded-md bg-slate-950 border border-slate-700" />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Total</span>
                <div className="px-3 py-2 rounded-md bg-slate-900 border border-slate-800">${(price/100).toFixed(2)}</div>
              </label>
            </div>
            {error && <div className="text-rose-400 text-sm">{error}</div>}
            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60">{loading ? 'Processing…' : 'Checkout'}</button>
              <button type="button" onClick={openPortal} className="px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800">Open Billing Portal</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


