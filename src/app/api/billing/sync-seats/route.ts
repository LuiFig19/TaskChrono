import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Sync Stripe subscription quantity to match current org member count
export async function POST() {
  const { error, user } = await requireApiAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const userId = user.id as string
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  })
  if (!membership?.organization) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })
  const org = membership.organization as any

  // Count seats as active org members
  const seats = await prisma.organizationMember.count({ where: { organizationId: org.id } })
  if (seats < 1) return NextResponse.json({ error: 'No members found' }, { status: 400 })

  // Resolve Stripe customer
  let customerId: string | undefined = org.stripeCustomerId
  if (!customerId) {
    try {
      // Fallback: search by metadata if not stored
      const result = await stripe.customers.search({ query: `metadata['organizationId']:'${org.id}'` })
      customerId = result.data[0]?.id
    } catch {}
  }
  if (!customerId) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  // Find active subscription
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })
  const sub = subs.data[0]
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  const item = sub.items.data[0]
  if (!item) return NextResponse.json({ error: 'No subscription item' }, { status: 404 })

  // Update quantity to match seats; create prorations so Stripe bills deltas
  const updated = await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, quantity: seats }],
    proration_behavior: 'create_prorations',
    metadata: { organizationId: org.id, seats: String(seats) },
  })

  return NextResponse.json({ ok: true, subscriptionId: updated.id, seats })
}

export const dynamic = 'force-dynamic'


