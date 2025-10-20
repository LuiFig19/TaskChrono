export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET() {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  
  const pref = await prisma.userPreference.findUnique({ where: { userId } })
  const { organizationId } = await getCurrentUserAndOrg()
  const raw = pref?.dashboardWidgets as any
  let widgets: string[] | null = null
  let rglLayout: any[] | null = null
  let progressIds: string[] | null = null
  if (Array.isArray(raw)) {
    widgets = raw
  } else if (raw && typeof raw === 'object') {
    const orgKey = organizationId || 'default'
    widgets = raw?.orgs?.[orgKey]?.layout ?? null
    progressIds = raw?.orgs?.[orgKey]?.progressIds ?? null
    rglLayout = raw?.orgs?.[orgKey]?.rglLayout ?? null
  }
  return NextResponse.json({ widgets, layout: rglLayout, progressIds, orgId: organizationId || null })
}

export async function POST(request: Request) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  
  const body = await request.json().catch(() => ({})) as { order?: string[]; progressIds?: string[]; rglLayout?: any[] }
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
  if (Array.isArray(body.rglLayout)) state.orgs[orgKey].rglLayout = body.rglLayout
  await prisma.userPreference.upsert({
    where: { userId },
    update: { dashboardWidgets: state },
    create: { userId, dashboardWidgets: state },
  })
  return NextResponse.json({ ok: true })
}



