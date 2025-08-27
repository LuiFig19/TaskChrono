import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await req.formData()
  const id = String(form.get('id') || '')
  const name = String(form.get('name') || '').trim()
  if (!id || !name) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  await prisma.organization.update({ where: { id }, data: { name } })
  return NextResponse.redirect(new URL('/dashboard/company', req.url))
}


