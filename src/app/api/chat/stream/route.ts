export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { ensureUserOrg } from '@/lib/org'
import { addSubscriber, removeSubscriber } from '@/lib/chatStore'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const { organizationId } = await ensureUserOrg()
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('c') || 'all'
  // warmup: send recent history
  let history: any[] = []
  try {
    history = await prisma.chatMessage.findMany({
      where: { organizationId, channelId },
      orderBy: { ts: 'asc' },
      take: 100,
    })
  } catch (e) {
    // If DB not reachable, keep streaming-only mode without history
  }
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const sub = {
        id: crypto.randomUUID(),
        orgId: organizationId,
        channelId,
        write(line: string) { controller.enqueue(encoder.encode(line)) },
      }
      addSubscriber(sub)
      // send backlog immediately
      for (const m of history) {
        const msg = { id: m.id, channelId, user: { id: m.userId, name: m.userName }, text: m.text, ts: m.ts.getTime() }
        sub.write(`event: message\ndata: ${JSON.stringify(msg)}\n\n`)
      }
      const ping = setInterval(()=> sub.write(`:\n\n`), 15000)
      const close = () => { clearInterval(ping); removeSubscriber(sub); controller.close() }
      ;(req as any).signal?.addEventListener?.('abort', close)
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

