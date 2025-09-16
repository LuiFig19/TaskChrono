import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string; goalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: params.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(()=>({})) as { note?: string; progress?: number }
  const update = await prisma.teamGoalUpdate.create({ data: { goalId: params.goalId, authorId: userId, note: body.note || null, progress: typeof body.progress === 'number' ? body.progress : null } })
  return NextResponse.json({ id: update.id })
}


