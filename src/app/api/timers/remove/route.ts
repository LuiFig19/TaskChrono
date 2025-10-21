import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { emitToUser } from '@/lib/realtime'
import { parseRequestBody, getString } from '@/lib/request-utils'
import { ApiErrors, successResponse } from '@/lib/api-response'

export async function POST(request: Request) {
  const { error } = await requireApiAuth()
  if (error) return error
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return ApiErrors.unauthorized()

  const body = await parseRequestBody<{ timerId?: string }>(request)
  const timerId = getString(body, 'timerId')
  
  if (!timerId) return ApiErrors.missing('timerId')

  const timer = await prisma.timer.findFirst({ where: { id: timerId } })
  if (!timer || timer.userId !== userId) return ApiErrors.notFound('Timer')

  await prisma.timeEntry.deleteMany({ where: { timerId } })
  try { await prisma.timer.delete({ where: { id: timerId } }) } catch {}
  emitToUser(userId, 'timer:changed', { type: 'remove', timerId })
  return successResponse()
}
