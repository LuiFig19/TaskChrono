import { NextResponse } from 'next/server'

// Force this route to always run at request time in the Node.js runtime
// so it is not evaluated during build and does not attempt any DB access then.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  // If there is no database configured at build or runtime, return an empty list.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ items: [] })
  }

  // Import heavy/server-only modules lazily to avoid build-time evaluation
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('@/lib/auth')
  const { ensureUserOrg } = await import('@/lib/org')
  const { prisma } = await import('@/lib/prisma')

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


