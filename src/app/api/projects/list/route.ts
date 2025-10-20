export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { ensureUserOrg } from '@/lib/org'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { error, userId } = await requireApiAuth()
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


