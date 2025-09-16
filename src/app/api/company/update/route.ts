import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const form = await request.formData()
    const id = String(form.get('id') || '')
    const name = String(form.get('name') || '').trim()
    const color = String(form.get('brandColor') || '').trim()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (name) {
      await prisma.organization.update({ where: { id }, data: { name } })
    }

    if (color) {
      const userId = (session.user as any).id as string
      const pref = await prisma.userPreference.findUnique({ where: { userId } })
      let state: any = pref?.dashboardWidgets
      if (!state || Array.isArray(state)) state = { orgs: {} }
      if (!state.orgs) state.orgs = {}
      if (!state.orgs[id]) state.orgs[id] = {}
      state.orgs[id].brandColor = color
      await prisma.userPreference.upsert({ where: { userId }, update: { dashboardWidgets: state as any }, create: { userId, dashboardWidgets: state as any } })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


