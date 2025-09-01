import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id as string
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
  if (!membership?.organization) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })
  const org = membership.organization
  const body = await request.json().catch(() => ({})) as { tier: 'BUSINESS' | 'ENTERPRISE'; seats: number; successUrl?: string; cancelUrl?: string; trialDays?: number }
  const seats = Math.max(1, Math.min(1000, Number(body.seats || 1)))
  if (body.tier !== 'BUSINESS' && body.tier !== 'ENTERPRISE') return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  // Ensure or create Stripe customer associated with organization
  let customerId = (org as any).stripeCustomerId as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    })
    customerId = customer.id
    await prisma.organization.update({ where: { id: org.id }, data: { /* @ts-ignore */ stripeCustomerId: customerId } as any })
  }

  // Resolve a Stripe Price ID. Prefer STRIPE_PRICE_*, but allow STRIPE_PRODUCT_* fallback (grab default or first active recurring price)
  async function resolvePriceId(): Promise<string | null> {
    const direct = body.tier === 'BUSINESS' ? process.env.STRIPE_PRICE_BUSINESS : process.env.STRIPE_PRICE_ENTERPRISE
    if (direct) return direct
    const prodId = body.tier === 'BUSINESS' ? process.env.STRIPE_PRODUCT_BUSINESS : process.env.STRIPE_PRODUCT_ENTERPRISE
    if (!prodId) return null
    try {
      const product = await stripe.products.retrieve(prodId)
      const def = product.default_price
      if (typeof def === 'string' && def) return def
      const prices = await stripe.prices.list({ product: prodId, active: true, type: 'recurring', limit: 1 })
      return prices.data[0]?.id || null
    } catch {
      return null
    }
  }

  const priceId = await resolvePriceId()
  if (!priceId) return NextResponse.json({ error: 'Missing Stripe price (set STRIPE_PRICE_* or STRIPE_PRODUCT_*)' }, { status: 500 })

  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: seats }],
    allow_promotion_codes: true,
    success_url: body.successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?paid=1`,
    cancel_url: body.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=1`,
    subscription_data: {
      // If a trial is requested, apply it here so Checkout creates the subscription with a trial period
      trial_period_days: typeof body.trialDays === 'number' && body.trialDays > 0 ? Math.min(30, Math.max(1, Math.floor(body.trialDays))) : undefined,
      metadata: { organizationId: org.id, tier: body.tier, seats: String(seats) },
    },
    metadata: { organizationId: org.id, tier: body.tier, seats: String(seats) },
  })

  return NextResponse.json({ checkoutUrl: sessionCheckout.url })
}


