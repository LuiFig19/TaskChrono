"use server"
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function createOrganizationAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const plan = String(formData.get('plan') || 'FREE') as 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM'
  const emailCsv = String(formData.get('emails') || '').trim()
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    const callbackPath = `/onboarding?plan=${encodeURIComponent(plan)}&name=${encodeURIComponent(name)}&emails=${encodeURIComponent(emailCsv)}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }
  if (!name) {
    throw new Error('Organization name is required')
  }

  // Ensure user exists
  const userId = session.user.id

  // Create organization and membership (best-effort; skip if DB unavailable)
  let org: { id: string; name: string } | null = null
  try {
    org = await prisma.organization.create({
      data: {
        name,
        planTier: plan,
        trialEndsAt: plan === 'FREE' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    }) as any
  } catch {
    // No database configured – continue to dashboard shell
    redirect('/dashboard')
  }

  // Parse invite emails and queue placeholder entries for future invites
  const invites = emailCsv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && /.+@.+\..+/.test(e))

  if (invites.length && org) {
    // For now, store as tasks tagged as INVITE to avoid new tables (upgrade later to Invite table + Resend emails)
    const project = await prisma.project.create({ data: { name: 'Invites', organizationId: org.id } })
    await prisma.task.createMany({
      data: invites.map((e) => ({ organizationId: org.id, projectId: project.id, title: `INVITE:${e}` })),
      skipDuplicates: true,
    })
  }

  // If plan is FREE (or CUSTOM for now), skip Stripe and go straight to dashboard
  if (plan === 'FREE' || plan === 'CUSTOM') {
    redirect(`/dashboard`)
  }

  // For paid tiers, create or reuse Stripe customer and redirect to Checkout with 14‑day trial
  if (!stripe || !org) {
    // Fallback: go to subscription page for manual upgrade if Stripe isn't configured
    redirect('/dashboard/subscription')
  }

  // Ensure Stripe customer exists for this organization
  let customerId = (org as any).stripeCustomerId as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({ name: org.name, metadata: { organizationId: org.id } })
    customerId = customer.id
    // Persist to DB if the column exists; ignore if schema is out-of-sync locally
    try {
      await prisma.organization.update({ where: { id: org.id }, data: { /* @ts-ignore */ stripeCustomerId: customerId } as any })
    } catch {
      // swallow – continue with in-memory customerId so checkout can proceed
    }
  }

  // Resolve the price id based on selected tier
  const priceId = plan === 'BUSINESS' ? (process.env.STRIPE_PRICE_BUSINESS || '') : (process.env.STRIPE_PRICE_ENTERPRISE || '')
  if (!priceId) {
    // If prices not configured, land on subscription page
    redirect('/dashboard/subscription')
  }

  // Seats default: owner + invited emails (adjustable in Checkout)
  const seats = Math.max(1, invites.length + 1)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: seats, adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 } }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/onboarding/activation?plan=${plan}`,
    cancel_url: `${appUrl}/onboarding?plan=${plan}`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { organizationId: org.id, tier: plan, seats: String(seats) },
    },
    metadata: { organizationId: org.id, tier: plan, seats: String(seats) },
  })

  redirect(sessionCheckout.url || '/dashboard')
}

export async function finalizeOrganizationAction(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id
  const name = String(formData.get('name') || '').trim()
  // Find the most recent organization for this owner
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  })
  const org = membership?.organization
  if (org) {
    const nextName = name || org.name
    if (nextName && nextName !== org.name) {
      await prisma.organization.update({ where: { id: org.id }, data: { name: nextName } })
    }
  }
  redirect('/dashboard')
}


