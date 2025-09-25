import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ id: null, name: null, brandColor: null }, { status: 401 })
    const userId = (session.user as any).id as string
    const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
    const org = membership?.organization
    if (!org) return NextResponse.json({ id: null, name: null, brandColor: null })

    const pref = await prisma.userPreference.findUnique({ where: { userId } })
    let brandColor: string | null = null
    try {
      const state = pref?.dashboardWidgets as any
      if (state && typeof state === 'object') {
        brandColor = state?.orgs?.[org.id]?.brandColor || null
      }
    } catch {}

    return NextResponse.json({ id: org.id, name: org.name, brandColor })
  } catch {
    return NextResponse.json({ id: null, name: null, brandColor: null }, { status: 500 })
  }
}
