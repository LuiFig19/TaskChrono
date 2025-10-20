import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return error
  await prisma.invoice.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

