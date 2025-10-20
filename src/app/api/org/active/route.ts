import { NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (error) return error
    const userId = session.user.id
    const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
    const org = membership?.organization
    if (!org) return error

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
