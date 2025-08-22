import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe as stripeSdk } from '@/lib/stripe'

export async function POST(request: Request) {
  if (!stripeSdk) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  const raw = await request.text()
  try {
    event = stripeSdk.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as any
        const orgId = sess.metadata?.organizationId || sess.subscription_metadata?.organizationId
        if (orgId) {
          // Mark plan based on price mapping
          const tier = (sess.metadata?.tier || 'BUSINESS') as 'BUSINESS'|'ENTERPRISE'
          await prisma.organization.update({ where: { id: orgId }, data: { planTier: tier, trialEndsAt: new Date() } })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as any
        const orgId = sub.metadata?.organizationId
        if (orgId) {
          const tier = (sub.metadata?.tier || 'BUSINESS') as 'BUSINESS'|'ENTERPRISE'
          await prisma.organization.update({ where: { id: orgId }, data: { planTier: tier } })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const orgId = sub.metadata?.organizationId
        if (orgId) {
          await prisma.organization.update({ where: { id: orgId }, data: { planTier: 'FREE' as any } })
        }
        break
      }
    }
  } catch (e) {
    return NextResponse.json({ ok: false })
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'


