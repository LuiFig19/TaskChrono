import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { taskId, startedAt } = body

  const entry = await prisma.timeEntry.create({
    data: {
      organizationId: 'todo', // replace with user's active org
      userId: session.user.id,
      taskId,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
    },
  })
  return NextResponse.json(entry)
}


