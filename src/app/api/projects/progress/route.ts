export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { error, userId } = await requireApiAuth()
  if (error) return error
  const { organizationId } = await ensureUserOrg()
  if (!organizationId) return NextResponse.json({ projects: [] })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return error

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


