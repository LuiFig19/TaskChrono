import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await ensureUserOrg()
  if (!organizationId) return NextResponse.json({ projects: [] })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Compute progress using tasks completion ratio; fallback to milestones if no tasks
  const [totalTasks, doneTasks] = await Promise.all([
    prisma.task.count({ where: { organizationId, projectId: id } }),
    prisma.task.count({ where: { organizationId, projectId: id, status: 'DONE' } }),
  ])
  let progress = 0
  if (totalTasks > 0) progress = Math.round((doneTasks / totalTasks) * 100)
  else {
    const totals = await prisma.milestone.count({ where: { projectId: id } })
    const done = await prisma.milestone.count({ where: { projectId: id, status: 'DONE' } })
    progress = totals > 0 ? Math.round((done / totals) * 100) : 0
  }

  return NextResponse.json({ progress })
}


