import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { organizationId, userId } = await getCurrentUserAndOrg()
  if (!organizationId) return NextResponse.json({ error: 'Missing org' }, { status: 400 })
  const body = await req.json()
  const updated = await prisma.teamDoc.update({
    where: { id: params.id },
    data: { title: body.title ?? undefined, content: body.content ?? undefined, updatedById: userId ?? undefined }
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.teamDoc.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}


