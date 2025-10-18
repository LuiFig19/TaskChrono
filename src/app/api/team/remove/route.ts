import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await request.json().catch(() => ({})) as { email?: string }
  const email = String(body.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ ok: true })

  await prisma.organizationMember.deleteMany({ where: { organizationId, userId: user.id } })
  return NextResponse.json({ ok: true })
}


