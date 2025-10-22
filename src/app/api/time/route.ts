export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { addTimerSubscriber, removeTimerSubscriber, broadcastTimer } from '@/lib/timerStore'
import { getCurrentUserAndOrg } from '@/lib/org'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { taskId, startedAt } = body

  const entry = await prisma.timeEntry.create({
    data: {
      organizationId: (await getCurrentUserAndOrg()).organizationId!,
      userId: session.user.id,
      taskId,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
    },
  })
  broadcastTimer(session.user.id, 'changed', { id: entry.id })
  return NextResponse.json(entry)
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const userId = session.user.id
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const sub = {
        id: crypto.randomUUID(),
        userId,
        write(line: string) { controller.enqueue(encoder.encode(line)) },
      }
      addTimerSubscriber(sub)
      const ping = setInterval(() => sub.write(`:\n\n`), 20000)
      ;(req as any).signal?.addEventListener?.('abort', () => { clearInterval(ping); removeTimerSubscriber(sub); controller.close() })
    }
  })
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
  })
}


