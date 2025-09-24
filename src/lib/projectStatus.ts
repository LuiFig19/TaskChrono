import { prisma } from '@/lib/prisma'

// Recompute a project's status based on its tasks.
// - If user has manually set ON_HOLD, we do not override it here
// - If there is at least one task and not all are DONE => ACTIVE
// - If all tasks are DONE => COMPLETED
// - If there are zero tasks, we leave status as-is
export async function recomputeProjectStatus(projectId: string): Promise<void> {
	try {
		const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } })
		if (!project) return
		if (project.status === 'ON_HOLD') return
		const tasks = await prisma.task.findMany({ where: { projectId }, select: { status: true } })
		if (tasks.length === 0) return
		const allDone = tasks.every(t => t.status === 'DONE')
		const next = allDone ? 'COMPLETED' : 'ACTIVE'
		if (next !== project.status) {
			await prisma.project.update({ where: { id: projectId }, data: { status: next as any } })
		}
	} catch {}
}


