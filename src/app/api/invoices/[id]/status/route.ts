import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await req.json() as any
  const status = String(body.status||'').toUpperCase()
  await prisma.invoice.update({ where: { id: params.id }, data: { status: status as any } })
  return NextResponse.json({ ok: true })
}

