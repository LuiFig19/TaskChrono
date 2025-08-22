import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

async function getOrgId(userId: string) {
  const m = await prisma.organizationMember.findFirst({ where: { userId } })
  return m?.organizationId ?? null
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const organizationId = await getOrgId(userId)
  if (!organizationId) return NextResponse.json({ events: [] })

  const { searchParams } = new URL(req.url)
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const start = parseDate(startParam)
  const end = parseDate(endParam)
  const where: any = { organizationId }
  if (start && end) {
    where.OR = [
      { startsAt: { gte: start, lt: end } },
      { endsAt: { gt: start, lte: end } },
    ]
  }
  const events = await prisma.calendarEvent.findMany({ where, orderBy: { startsAt: 'asc' } })
  return NextResponse.json({ events })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const organizationId = await getOrgId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await req.json().catch(() => ({})) as any
  if (!body.title || !body.startsAt) return NextResponse.json({ error: 'Missing title or startsAt' }, { status: 400 })
  const created = await prisma.calendarEvent.create({
    data: {
      organizationId,
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      startsAt: new Date(body.startsAt),
      endsAt: body.endsAt ? new Date(body.endsAt) : new Date(new Date(body.startsAt).getTime() + 60 * 60 * 1000),
      allDay: !!body.allDay,
    },
    select: { id: true },
  })
  return NextResponse.json({ id: created.id })
}


