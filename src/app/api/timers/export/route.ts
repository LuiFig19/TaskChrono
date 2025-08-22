import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  })
  const rows = [
    ['name', 'startedAt', 'endedAt', 'durationMin'].join(','),
    ...entries.map((e) => [
      e.name || 'Timer',
      new Date(e.startedAt).toISOString(),
      e.endedAt ? new Date(e.endedAt).toISOString() : '',
      String(e.durationMin ?? 0),
    ].map((v) => String(v).replace(/,/g, ' ')).join(',')),
  ]
  const csv = rows.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="timers.csv"',
    },
  })
}


