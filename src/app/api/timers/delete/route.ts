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
  
  const body = await parseRequestBody<{ entryId?: string }>(request)
  const entryId = getString(body, 'entryId')
  
  if (!entryId) return ApiErrors.missing('entryId')
  
  const e = await prisma.timeEntry.findUnique({ where: { id: entryId } })
  if (!e || e.userId !== userId) return ApiErrors.notFound('Time entry')
  
  await prisma.timeEntry.delete({ where: { id: entryId } })
  emitToUser(userId, 'timer:changed', { type: 'delete', entryId })
  return successResponse()
}
