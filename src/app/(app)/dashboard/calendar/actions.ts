"use server"
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'
import { revalidatePath } from 'next/cache'

export async function createCalendarEvent(formData: FormData) {
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return
  const title = String(formData.get('title') || '').trim()
  const when = String(formData.get('when') || '')
  const category = String(formData.get('category') || '').trim()
  const notes = String(formData.get('notes') || '').trim()
  if (!title || !when) return
  const startsAt = new Date(when)
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
  const description = JSON.stringify({ category, notes })
  await prisma.calendarEvent.create({ data: { organizationId, title, startsAt, endsAt, description } })
  revalidatePath('/dashboard/calendar')
}

export async function deleteCalendarEvent(formData: FormData) {
  const { organizationId } = await getCurrentUserAndOrg()
  const id = String(formData.get('id') || '')
  if (!organizationId || !id) return
  // Use deleteMany to avoid throwing if the record was already removed or does not exist
  await prisma.calendarEvent.deleteMany({ where: { id, organizationId } })
  revalidatePath('/dashboard/calendar')
}



