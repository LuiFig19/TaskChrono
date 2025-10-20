import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { emitToUser } from '@/lib/realtime'

export async function POST(request: Request) {
  const { error } = await requireApiAuth()
  if (error) return error
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })
  const form = await request.formData().catch(()=>null)
  const entryId = form?.get('entryId') as string | null
  if (!entryId) return NextResponse.json({ ok: false })
  const e = await prisma.timeEntry.findUnique({ where: { id: entryId } })
  if (!e || e.userId !== userId) return NextResponse.json({ ok: false })
  await prisma.timeEntry.delete({ where: { id: entryId } })
  emitToUser(userId, 'timer:changed', { type: 'delete', entryId })
  return NextResponse.json({ ok: true })
}


