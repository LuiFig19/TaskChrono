import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import InvoiceClient from './InvoicesClient'

function cents(n: number) { return (n/100).toFixed(2) }

export default async function InvoicesPage({ searchParams }: { searchParams?: { q?: string, status?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) redirect('/login')

  const q = (searchParams?.q || '').trim()
  const status = (searchParams?.status || '').toUpperCase()
  const where: any = { organizationId }
  if (q) {
    where.OR = [
      { clientName: { contains: q, mode: 'insensitive' } },
      { projectName: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (['DRAFT','SENT','PAID','OVERDUE'].includes(status)) where.status = status

  const [invoices, stats] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' } as any,
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _sum: { amountCents: true },
      _count: true,
    })
  ])

  const totalIssued = invoices.length
  const now = Date.now()
  const outstanding = invoices.filter((i:any) => i.status !== 'PAID').reduce((s:any,i:any)=>s+i.amountCents,0)
  const paid = invoices.filter((i:any)=>i.status==='PAID').length
  const overdue = invoices.filter((i:any)=> i.status!=='PAID' && i.dueAt && new Date(i.dueAt as any).getTime() < now).length

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <div className="mt-4 grid md:grid-cols-4 gap-3">
        <div className="rounded border border-slate-800 bg-slate-900 p-4"><div className="text-slate-400 text-sm">Total Issued</div><div className="text-white text-xl">{totalIssued}</div></div>
        <div className="rounded border border-slate-800 bg-slate-900 p-4"><div className="text-slate-400 text-sm">Outstanding</div><div className="text-white text-xl">${cents(outstanding)}</div></div>
        <div className="rounded border border-slate-800 bg-slate-900 p-4"><div className="text-slate-400 text-sm">Paid</div><div className="text-emerald-400 text-xl">{paid}</div></div>
        <div className="rounded border border-slate-800 bg-slate-900 p-4"><div className="text-slate-400 text-sm">Overdue</div><div className="text-rose-400 text-xl">{overdue}</div></div>
      </div>

      <InvoiceClient initialInvoices={invoices as any} />
    </div>
  )
}

// (client code moved to InvoicesClient.tsx)


