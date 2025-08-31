import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  const userId = (session.user as any).id as string
  const membership = await prisma.organizationMember.findFirst({ where: { userId }, include: { organization: true } })
  if (!membership?.organization) return NextResponse.json({ error: 'Missing organization' }, { status: 400 })
  const org = membership.organization as any
  const customerId = org.stripeCustomerId
  if (!customerId) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
  })
  return NextResponse.json({ url: portal.url })
}


