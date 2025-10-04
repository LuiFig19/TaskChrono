import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastActivity } from '@/lib/activity'
import { recomputeProjectStatus } from '@/lib/projectStatus'

async function getActiveOrganizationId(userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  })
  return membership?.organizationId ?? null
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as unknown as { id: string }).id
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ projects: [] })
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')

  const projects = await prisma.project.findMany({
    where: { organizationId },
    ...(projectId ? { where: { organizationId, id: projectId } } as any : {}),
    orderBy: { updatedAt: 'desc' },
    include: {
      tasks: { orderBy: { createdAt: 'desc' }, select: { id: true, title: true, description: true, status: true, priority: true, dueDate: true, createdAt: true, assigneeId: true, teamId: true } },
    },
  })

  const payload = projects.map((p) => ({
    id: p.id,
    name: p.name,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      assigneeId: t.assigneeId,
      teamId: (t as any).teamId || null,
    })),
  }))

  return NextResponse.json({ projects: payload })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as unknown as { id: string }).id
  const organizationId = await getActiveOrganizationId(userId)
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await request.json().catch(() => ({})) as {
    title?: string
    description?: string
    projectName?: string
    priority?: number
    dueDate?: string
    teamId?: string | null
  }
  const { title, projectName, description, priority, dueDate, teamId } = body
  if (!title || !projectName) return NextResponse.json({ error: 'Missing title or projectName' }, { status: 400 })

  let project = await prisma.project.findFirst({ where: { organizationId, name: projectName } })
  if (!project) {
    project = await prisma.project.create({ data: { organizationId, name: projectName } })
  }

  const task = await prisma.task.create({
    data: {
      organizationId,
      projectId: project.id,
      title,
      description: description ?? null,
      priority: typeof priority === 'number' && priority >= 1 && priority <= 5 ? priority : 3,
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: userId,
      teamId: teamId || null,
    },
  })
  // If project was PLANNING or COMPLETED, adding a task should make it ACTIVE
  try { await recomputeProjectStatus(project.id) } catch {}
  try { broadcastActivity({ type: 'task.created', message: `Task added: ${task.title}`, meta: { projectId: project.id, taskId: task.id } }) } catch {}
  return NextResponse.json({ ok: true, taskId: task.id })
}


