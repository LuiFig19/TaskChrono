"use server"
import { prisma } from '@/lib/prisma'
import { getCurrentUserAndOrg } from '@/lib/org'

export async function createInvoice(formData: FormData) {
  const { organizationId } = await getCurrentUserAndOrg()
  if (!organizationId) return
  const number = String(formData.get('number') || '').trim()
  const amount = Number(formData.get('amount') || 0)
  if (!number) return
  await prisma.invoice.create({
    data: { organizationId, number, amountCents: Math.max(0, Math.round(amount * 100)) },
  })
}



