import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
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

export async function POST(req: Request) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id as string
  let format: 'json'|'xlsx'|'csv' = 'json'
  let filter: string | undefined
  let tag: string | undefined
  let sort: string | undefined
  try {
    const j = await req.json()
    format = (j?.format as any) || 'json'
    filter = j?.filter
    tag = j?.tag
    sort = j?.sort
  } catch {
    try {
      const form = await req.formData()
      const f = form.get('format') as string | null
      if (f === 'csv' || f === 'xlsx' || f === 'json') format = f
      filter = (form.get('filter') as string | null) || undefined
      tag = (form.get('tag') as string | null) || undefined
      sort = (form.get('sort') as string | null) || undefined
    } catch {}
  }
  let entries = await prisma.timeEntry.findMany({ where: { userId }, orderBy: { startedAt: 'desc' } })
  const timers = await prisma.timer.findMany({ where: { userId } })
  // Apply filters similar to client
  if (filter === 'active') entries = entries.filter(e => !e.endedAt)
  if (filter === 'paused') entries = entries.filter(e => !!e.endedAt && !timers.find(t=>t.id===e.timerId)?.finalizedAt)
  if (filter === 'ended') entries = entries.filter(e => !!timers.find(t=>t.id===e.timerId)?.finalizedAt)
  if (tag) {
    const tagTimers = new Set(timers.filter(t => (t.tags || []).includes(tag!)).map(t => t.id))
    entries = entries.filter(e => e.timerId && tagTimers.has(e.timerId))
  }
  if (sort === 'recent') entries.sort((a,b)=> new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  if (sort === 'oldest') entries.sort((a,b)=> new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
  if (sort === 'longest') entries.sort((a,b)=> (b.durationMin || 0) - (a.durationMin || 0))
  if (sort === 'shortest') entries.sort((a,b)=> (a.durationMin || 0) - (b.durationMin || 0))
  // Only ended entries in export
  entries = entries.filter(e => !!e.endedAt)
  if (format === 'json') {
    return NextResponse.json(entries)
  }
  if (format === 'csv') {
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
  // Generate real XLSX workbook
  const XLSX: any = await import('xlsx')
  const rows = entries.map((e) => ({
    name: e.name || 'Timer',
    startedAt: new Date(e.startedAt).toISOString(),
    endedAt: e.endedAt ? new Date(e.endedAt).toISOString() : '',
    durationMin: e.durationMin ?? 0,
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timers')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="timers.xlsx"',
      'Content-Length': String(buffer.byteLength),
    },
  })
}


