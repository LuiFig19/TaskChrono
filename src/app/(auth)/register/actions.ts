"use server"
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function registerLocalAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const name = String(formData.get('name') || '').trim()

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create or update user
  let user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, name: name || user.name || null },
    })
  } else {
    user = await prisma.user.create({
      data: { email, name: name || null, passwordHash, role: 'ADMIN' as any },
    })
  }

  // Ensure an Enterprise organization exists and the user is a member/owner
  let membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: name ? `${name}'s Org` : 'Developer Org',
        planTier: 'ENTERPRISE' as any,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdById: user.id,
        members: { create: { userId: user.id, role: 'OWNER' as any } },
      },
    })
    membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: org.id },
      include: { organization: true },
    })
  } else if (membership.organization.planTier !== 'ENTERPRISE') {
    await prisma.organization.update({
      where: { id: membership.organization.id },
      data: { planTier: 'ENTERPRISE' as any },
    })
  }

  // Send the user to the login page to sign in with credentials
  redirect('/login?callbackUrl=/dashboard')
}



