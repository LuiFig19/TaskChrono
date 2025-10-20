import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

function fmt(type: string, payload: any): string {
  const u = payload?.userName || 'User'
  const title = payload?.title || payload?.text || ''
  switch (type) {
    case 'goal.created':
      return `${u} added a new Goal! 🎉 ${title ? `— ${title}` : ''}`
    case 'goal.completed':
      return `${u} completed a Goal 🎉 ${title ? `— ${title}` : ''}`
    case 'goal.assigned':
      return `${u} assigned Goal ${title || ''} → ${payload?.assigneeName || 'User'} 📌`
    case 'goal.updated':
      return `${u} updated a Goal ✏️ ${title ? `— ${title}` : ''}`
    case 'goal.starred':
      return `${u} favorited a Goal ⭐ ${title ? `— ${title}` : ''}`
    case 'goal.unstarred':
      return `${u} unfavorited a Goal ☆ ${title ? `— ${title}` : ''}`
    case 'note.created':
      return `${u} created a Note 📝`
    case 'note.updated':
      return `${u} updated a Note ✏️`
    case 'note.deleted':
      return `${u} deleted a Note 🗑️`
    case 'chat':
    case 'chat.message':
      return `${u}: ${payload?.text || ''}`
    default:
      return `${u} did something`
  }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ events: [] }, { status: 401 })
  const userId = user.id as string
  const { id } = await context.params
  const member = await prisma.teamMembership.findFirst({ where: { userId, teamId: id } })
  if (!member) return NextResponse.json({ events: [] }, { status: 403 })
  const list = await prisma.teamActivity.findMany({
    where: {
      teamId: id,
      NOT: {
        OR: [
          { type: 'chat' },
          { type: 'chat.message' },
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  const events = list.map(a => ({ id: a.id, text: fmt(a.type, a.payload as any), ts: a.createdAt }))
  return NextResponse.json({ events })
}


