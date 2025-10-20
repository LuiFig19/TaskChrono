import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const { id } = await params
  try {
    await prisma.calendarEvent.delete({ where: { id } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
  return NextResponse.json({ ok: true })
}


