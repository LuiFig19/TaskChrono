import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { recomputeProjectStatus } from '@/lib/projectStatus'

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({ where: { userId } })
  return membership?.organizationId ?? null
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const body = await _req.json().catch(() => ({})) as { title?: string; description?: string | null; status?: string; priority?: number; dueDate?: string | null; teamId?: string | null }
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      description: body.description === undefined ? undefined : body.description,
      status: body.status as any ?? undefined,
      priority: typeof body.priority === 'number' ? body.priority : undefined,
      dueDate: body.dueDate === undefined ? undefined : (body.dueDate ? new Date(body.dueDate) : null),
      teamId: body.teamId === undefined ? undefined : (body.teamId || null),
    },
  })
  try { await recomputeProjectStatus(updated.projectId) } catch {}
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, userId } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const existing = await prisma.task.findUnique({ where: { id: params.id }, select: { projectId: true } })
  await prisma.task.delete({ where: { id: params.id } })
  if (existing?.projectId) { try { await recomputeProjectStatus(existing.projectId) } catch {} }
  return NextResponse.json({ ok: true })
}


