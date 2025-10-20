import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ ok: false })

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false })
  const entryId = form.get('entryId') as string
  const note = (form.get('note') as string | null)?.trim()
  const removeIndex = form.get('removeIndex') as string | null
  if (!entryId) return NextResponse.json({ ok: false })

  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.userId !== userId) return NextResponse.json({ ok: false })

  let lines = (entry.notes || '').split('\n').filter(Boolean)
  if (removeIndex !== null && removeIndex !== undefined && removeIndex !== '') {
    const idx = parseInt(removeIndex, 10)
    if (!Number.isNaN(idx)) {
      lines.splice(idx, 1)
    }
  } else if (note) {
    lines.push(note)
  }
  await prisma.timeEntry.update({ where: { id: entryId }, data: { notes: lines.join('\n') } })

  return NextResponse.json({ ok: true })
}


