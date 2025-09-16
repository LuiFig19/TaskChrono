import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const org = await prisma.organization.findUnique({ where: { id: params.id }, select: { id: true, name: true } })
    if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Brand color is stored per-user in UserPreference.dashboardWidgets under orgs[orgId].brandColor
    const pref = await prisma.userPreference.findUnique({ where: { userId: (session.user as any).id as string } })
    let brandColor: string | null = null
    try {
      const state = pref?.dashboardWidgets as any
      if (state && typeof state === 'object') {
        const orgs = state.orgs || {}
        brandColor = orgs?.[org.id]?.brandColor || null
      }
    } catch {}

    return NextResponse.json({ id: org.id, name: org.name, brandColor })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


