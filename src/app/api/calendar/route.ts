import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg, ensureUserOrg } from '@/lib/org'

export async function GET(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ events: [] }, { status: 200 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ events: [] }, { status: 200 })
  const url = new URL(request.url)
  const startStr = url.searchParams.get('start')
  const endStr = url.searchParams.get('end')
  const start = startStr ? new Date(startStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = endStr ? new Date(endStr) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  const events = await prisma.calendarEvent.findMany({
    where: { organizationId, startsAt: { gte: start, lt: end } },
    orderBy: { startsAt: 'asc' },
    select: { id: true, title: true, startsAt: true, description: true },
  })
  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Ensure the user has an organization in production too (prevents the
  // "optimistic then disappears" behavior when membership is missing)
  const { organizationId } = await ensureUserOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await request.json().catch(() => ({})) as { title?: string; startsAt?: string; endsAt?: string | null; description?: string | null }
  const title = String(body.title || '').trim()
  const startsAt = body.startsAt ? new Date(body.startsAt) : null
  if (!title || !startsAt) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const defaultEnd = new Date(startsAt.getTime() + 60 * 60 * 1000)
  const evt = await prisma.calendarEvent.create({
    data: {
      organizationId,
      title,
      description: body.description || null,
      startsAt,
      endsAt: body.endsAt ? new Date(body.endsAt) : defaultEnd,
    },
    select: { id: true },
  })
  return NextResponse.json({ id: evt.id })
}


