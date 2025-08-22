"use server"
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function startTimer(formData: FormData) {
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return
  const now = new Date()
  const name = (formData.get('name') as string | null)?.slice(0, 120) || 'Timer'
  let timerId = formData.get('timerId') as string | null
  if (!timerId) {
    const timer = await prisma.timer.create({ data: { organizationId, userId, name } })
    timerId = timer.id
  }
  await prisma.timeEntry.create({ data: { organizationId, userId, startedAt: now, name, timerId } as any })
}

export async function stopTimer() {
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return
  const active = await prisma.timeEntry.findFirst({ where: { organizationId, userId, endedAt: null } })
  if (!active) return
  const end = new Date()
  const durationMin = Math.max(0, Math.round((end.getTime() - new Date(active.startedAt).getTime()) / 60000))
  await prisma.timeEntry.update({ where: { id: active.id }, data: { endedAt: end, durationMin } })
}



