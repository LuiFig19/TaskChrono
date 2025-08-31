"use client"
import React, { useEffect, useMemo, useState } from 'react'

type Status = {
  locked: boolean
  plan: 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'
  trialEndsAt: string
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
        const json = (await res.json()) as Status
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
    const unit = tier === 'BUSINESS' ? status.prices.BUSINESS : status.prices.ENTERPRISE
    return unit * Math.max(1, seats || 1)
  }, [status, seats, tier])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!status) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, seats: Math.max(1, seats), successUrl: typeof window !== 'undefined' ? window.location.origin + '/dashboard?paid=1' : undefined, cancelUrl: typeof window !== 'undefined' ? window.location.origin + '/dashboard?canceled=1' : undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { checkoutUrl?: string }
      if (data.checkoutUrl && typeof window !== 'undefined') {
        window.location.href = data.checkoutUrl
        return
      }
    } catch (err: any) {
      setError(err?.message || 'Payment failed')
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
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl">
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
                <input aria-label="Seats" title="Seats" type="number" min={1} value={seats} onChange={e=>setSeats(Math.max(1, Number(e.target.value||1)))} className="px-3 py-2 rounded-md bg-slate-950 border border-slate-700" />
              </label>
              <div className="grid gap-1 text-sm">
                <span>Monthly total</span>
                <div className="px-3 py-2 rounded-md bg-slate-950 border border-slate-700 font-mono">${(price/100).toFixed(2)}</div>
              </div>
            </div>

            <div className="text-xs text-slate-400">You will be redirected to Stripe Checkout to complete your payment securely.</div>

            {error && <div className="text-rose-400 text-sm">{error}</div>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">{loading ? 'Processing…' : 'Continue to Checkout'}</button>
              <button type="button" onClick={openPortal} disabled={loading} className="px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-200 disabled:opacity-50">Open Customer Portal</button>
            </div>
            <div className="text-xs text-slate-500">Payments are billed monthly. You can change seats at any time in Subscription settings.</div>
          </form>
        </div>
      </div>
    </div>
  )
}


