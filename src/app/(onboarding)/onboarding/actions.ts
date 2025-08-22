"use server"
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function createOrganizationAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }
  const name = String(formData.get('name') || '').trim()
  const plan = String(formData.get('plan') || 'FREE') as 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'
  const emailCsv = String(formData.get('emails') || '').trim()
  if (!name) {
    throw new Error('Organization name is required')
  }

  // Ensure user exists
  const userId = session.user.id

  // Create organization and membership
  const org = await prisma.organization.create({
    data: {
      name,
      planTier: plan,
      createdById: userId,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
  })

  // Parse invite emails and queue placeholder entries for future invites
  const invites = emailCsv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && /.+@.+\..+/.test(e))

  if (invites.length) {
    // For now, store as tasks tagged as INVITE to avoid new tables (upgrade later to Invite table + Resend emails)
    const project = await prisma.project.create({ data: { name: 'Invites', organizationId: org.id } })
    await prisma.task.createMany({
      data: invites.map((e) => ({ organizationId: org.id, projectId: project.id, title: `INVITE:${e}` })),
      skipDuplicates: true,
    })
  }

  // After successful setup, go to dashboard
  redirect(`/dashboard`)
}


