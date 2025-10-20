import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

// Returns members of the active organization for the current user.
export async function GET() {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ members: [] }, { status: 401 })

  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ members: [] })

  const list = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: true },
  })

  // Stable order: owners/admins first, then by name/email
  const roleRank: Record<string, number> = { OWNER: 0, ADMIN: 1, MANAGER: 2, MEMBER: 3 }
  const members = list
    .map((m) => ({ id: m.id, name: m.user?.name || null, email: m.user?.email || null, role: m.role as string }))
    .sort((a, b) => {
      const rr = (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9)
      if (rr !== 0) return rr
      const an = (a.name || a.email || '').toLowerCase()
      const bn = (b.name || b.email || '').toLowerCase()
      return an.localeCompare(bn)
    })

  return NextResponse.json({ members })
}


