import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ projects: [] })
  const { organizationId } = await ensureUserOrg()
  if (!organizationId) return NextResponse.json({ projects: [] })
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  })
  return NextResponse.json({ projects })
}


