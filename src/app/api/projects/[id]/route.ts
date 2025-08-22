import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { name?: string; description?: string | null }
  const proj = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() || undefined,
      description: body.description === undefined ? undefined : (body.description?.trim() || null),
    },
  })
  return NextResponse.json({ ok: true, id: proj.id })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}


