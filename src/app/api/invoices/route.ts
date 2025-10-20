import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(req: Request) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await req.json() as any
  const amount = Math.round(parseFloat(String(body.amount||'0')) * 100)
  const created = await prisma.invoice.create({
    data: {
      organizationId,
      clientName: String(body.clientName||'').trim(),
      projectName: String(body.projectName||'').trim() || null,
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      amountCents: amount,
      status: (String(body.status||'DRAFT').toUpperCase() as any),
      recurrence: (String(body.recurrence||'NONE').toUpperCase() as any),
      notes: String(body.notes||'').trim() || null,
    },
  })
  return NextResponse.json(created)
}

