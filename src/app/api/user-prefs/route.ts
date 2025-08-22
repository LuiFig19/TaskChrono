import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ widgets: null }, { status: 401 })
  const userId = (session.user as unknown as { id: string }).id
  const pref = await prisma.userPreference.findUnique({ where: { userId } })
  const { organizationId } = await getCurrentUserAndOrg()
  const raw = pref?.dashboardWidgets as any
  let widgets: string[] | null = null
  let progressIds: string[] | null = null
  if (Array.isArray(raw)) {
    widgets = raw
  } else if (raw && typeof raw === 'object') {
    const orgKey = organizationId || 'default'
    widgets = raw?.orgs?.[orgKey]?.layout ?? null
    progressIds = raw?.orgs?.[orgKey]?.progressIds ?? null
  }
  return NextResponse.json({ widgets, progressIds, orgId: organizationId || null })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
  const userId = (session.user as unknown as { id: string }).id
  const body = await request.json().catch(() => ({})) as { order?: string[]; progressIds?: string[] }
  const { organizationId } = await getCurrentUserAndOrg()
  const orgKey = organizationId || 'default'
  const existing = await prisma.userPreference.findUnique({ where: { userId } })
  let state: any = existing?.dashboardWidgets
  if (!state || Array.isArray(state)) {
    state = { orgs: {} }
    if (Array.isArray(existing?.dashboardWidgets)) {
      state.orgs[orgKey] = { layout: existing?.dashboardWidgets }
    }
  }
  if (!state.orgs) state.orgs = {}
  if (!state.orgs[orgKey]) state.orgs[orgKey] = {}
  if (Array.isArray(body.order)) state.orgs[orgKey].layout = body.order
  if (Array.isArray(body.progressIds)) state.orgs[orgKey].progressIds = body.progressIds
  await prisma.userPreference.upsert({
    where: { userId },
    update: { dashboardWidgets: state },
    create: { userId, dashboardWidgets: state },
  })
  return NextResponse.json({ ok: true })
}



