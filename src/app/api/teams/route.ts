import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'Missing org' }, { status: 400 })
  const docs = await prisma.teamDoc.findMany({ where: { organizationId }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(docs)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId || !userId) return NextResponse.json({ error: 'Missing org/user' }, { status: 400 })
  const doc = await prisma.teamDoc.create({
    data: { organizationId, title: 'Untitled', content: '', createdById: userId }
  })
  return NextResponse.json(doc)
}


