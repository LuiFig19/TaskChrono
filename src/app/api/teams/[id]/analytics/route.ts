import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: params.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'week'
  // Placeholder analytics
  return NextResponse.json({
    range,
    hoursByUser: [],
    tasksCompleted: [],
    overload: [],
  })
}


