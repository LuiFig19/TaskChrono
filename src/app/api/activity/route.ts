import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ items: [] })
  const { organizationId } = await ensureUserOrg()
  if (!organizationId) return NextResponse.json({ items: [] })
  try {
    const msgs = await prisma.chatMessage.findMany({
      where: { organizationId },
      orderBy: { ts: 'desc' },
      take: 20,
    })
    const items = msgs.map((m) => ({ id: m.id, ts: m.ts.getTime(), text: `${m.userName}: ${m.text}` }))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}


