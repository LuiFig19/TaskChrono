import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { error, userId } = await requireApiAuth()
    if (error) return error
    const org = await prisma.organization.findUnique({ where: { id: params.id }, select: { id: true, name: true } })
    if (!org) return error

    // Brand color is stored per-user in UserPreference.dashboardWidgets under orgs[orgId].brandColor
    const pref = await prisma.userPreference.findUnique({ where: { userId: user.id as string } })
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


