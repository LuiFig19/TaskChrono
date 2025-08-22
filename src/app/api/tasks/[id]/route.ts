import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({ where: { userId } })
  return membership?.organizationId ?? null
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await _req.json().catch(() => ({})) as { title?: string; description?: string | null; status?: string; priority?: number; dueDate?: string | null }
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      description: body.description === undefined ? undefined : body.description,
      status: body.status as any ?? undefined,
      priority: typeof body.priority === 'number' ? body.priority : undefined,
      dueDate: body.dueDate === undefined ? undefined : (body.dueDate ? new Date(body.dueDate) : null),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  await prisma.task.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}


