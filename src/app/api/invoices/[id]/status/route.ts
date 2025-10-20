import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return error
  const body = await req.json() as any
  const status = String(body.status||'').toUpperCase()
  await prisma.invoice.update({ where: { id: params.id }, data: { status: status as any } })
  return NextResponse.json({ ok: true })
}

