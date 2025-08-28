"use client"
import React, { useMemo, useState } from 'react'

type Invoice = {
  id: string
  clientName?: string | null
  projectName?: string | null
  issueDate?: string | Date
  issuedAt?: string | Date
  dueDate?: string | Date
  dueAt?: string | Date
  amountCents: number
  status: 'DRAFT'|'SENT'|'PAID'|'OVERDUE'|'VOID'
  notes?: string | null
  attachmentsJson?: string | null
  recurrence?: 'NONE'|'WEEKLY'|'MONTHLY'|'QUARTERLY'
}

function cents(n: number) { return (n/100).toFixed(2) }
function toLocalInput(d: Date) { const p = (n:number)=> (n<10?`0${n}`:`${n}`); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }

function InvoiceStatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    DRAFT: 'bg-amber-900/40 text-amber-200 border-amber-700',
    SENT: 'bg-sky-900/40 text-sky-200 border-sky-700',
    PAID: 'bg-emerald-900/40 text-emerald-200 border-emerald-700',
    OVERDUE: 'bg-rose-900/40 text-rose-200 border-rose-700',
    VOID: 'bg-slate-800 text-slate-300 border-slate-600',
  }
  return <span className={`px-2 py-0.5 rounded border text-xs ${map[status]||''}`}>{status}</span>
}

export default function InvoiceClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'ALL'|Invoice['status']>('ALL')
  const filtered = useMemo(()=>invoices.filter(i=>{
    const client = (i.clientName||'').toLowerCase()
    const project = (i.projectName||'').toLowerCase()
    const hit = !q || client.includes(q.toLowerCase()) || project.includes(q.toLowerCase())
    const hs = status==='ALL' || i.status===status
    return hit && hs
  }),[invoices,q,status])

  async function createInvoice(form: FormData) {
    const body = Object.fromEntries(form.entries()) as any
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const json = await res.json()
      setInvoices(v=>[json, ...v])
    }
  }
  async function updateStatus(id: string, status: Invoice['status']) {
    const res = await fetch(`/api/invoices/${id}/status`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) setInvoices(v=>v.map(i=> i.id===id ? { ...i, status } : i))
  }
  async function remove(id: string) {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    if (res.ok) setInvoices(v=>v.filter(i=>i.id!==id))
  }

  return (
    <div className="mt-6 grid lg:grid-cols-[360px_1fr] gap-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="font-medium text-white">New Invoice</div>
        <form onSubmit={async(e)=>{e.preventDefault(); await createInvoice(new FormData(e.currentTarget)); (e.currentTarget as HTMLFormElement).reset()}} className="mt-3 grid gap-2 text-sm">
          <label className="sr-only" htmlFor="clientName">Client</label>
          <input id="clientName" name="clientName" placeholder="Client" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" required />
          <label className="sr-only" htmlFor="projectName">Project</label>
          <input id="projectName" name="projectName" placeholder="Project" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" />
          <div className="grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor="issueDate">Issue Date</label>
            <input id="issueDate" name="issueDate" type="date" defaultValue={toLocalInput(new Date())} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" required />
            <label className="sr-only" htmlFor="dueDate">Due Date</label>
            <input id="dueDate" name="dueDate" type="date" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" required />
          </div>
          <label className="sr-only" htmlFor="amount">Amount</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="Amount (USD)" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" required />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-slate-300 text-xs" htmlFor="status">Status</label>
            <label className="text-slate-300 text-xs" htmlFor="recurrence">Recurrence</label>
            <select id="status" name="status" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <select id="recurrence" name="recurrence" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100">
              <option value="NONE">One-time</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </div>
          <label className="text-slate-300 text-xs" htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100" placeholder="Internal notes" />
          <button className="mt-2 px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Add Invoice</button>
        </form>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search client or project" aria-label="Search invoices" className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm" />
          <label className="sr-only" htmlFor="statusFilter">Filter status</label>
          <select id="statusFilter" value={status} onChange={(e)=>setStatus(e.target.value as any)} className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-slate-100 text-sm">
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-left px-3 py-2">Project</th>
                <th className="text-left px-3 py-2">Issued</th>
                <th className="text-left px-3 py-2">Due</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((i)=> {
                const issued = i.issueDate || i.issuedAt
                const due = i.dueDate || i.dueAt
                return (
                  <tr key={i.id} className="hover:bg-slate-900">
                    <td className="px-3 py-2">{i.clientName}</td>
                    <td className="px-3 py-2">{i.projectName || '-'}</td>
                    <td className="px-3 py-2">{issued ? new Date(issued as any).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">{due ? new Date(due as any).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-2">${cents(i.amountCents)}</td>
                    <td className="px-3 py-2"><InvoiceStatusPill status={i.status} /></td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={()=>updateStatus(i.id, i.status==='PAID' ? 'SENT' : 'PAID')} className="mr-2 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800">{i.status==='PAID'?'Mark Unpaid':'Mark Paid'}</button>
                      <button onClick={()=>remove(i.id)} className="px-2 py-1 rounded border border-rose-700 text-rose-300 hover:bg-rose-900/30">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

