import { NextResponse } from 'next/server';

import { requireApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { stripe } from '@/lib/stripe';

// Sync Stripe subscription quantity to match current org member count
export const POST = withErrorHandling(async () => {
  const { error, userId } = await requireApiAuth();
  if (error) return error;
  if (!stripe) return error;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!membership?.organization) return error;
  const org = membership.organization as any;

  // Count seats as active org members
  const seats = await prisma.organizationMember.count({ where: { organizationId: org.id } });
  if (seats < 1) return error;

  // Resolve Stripe customer
  let customerId: string | undefined = org.stripeCustomerId;
  if (!customerId) {
    try {
      // Fallback: search by metadata if not stored
      const result = await stripe.customers.search({
        query: `metadata['organizationId']:'${org.id}'`,
      });
      customerId = result.data[0]?.id;
    } catch {}
  }
  if (!customerId) return error;

  // Find active subscription
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });
  const sub = subs.data[0];
  if (!sub) return error;
  const item = sub.items.data[0];
  if (!item) return error;

  // Update quantity to match seats; create prorations so Stripe bills deltas
  const updated = await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, quantity: seats }],
    proration_behavior: 'create_prorations',
    metadata: { organizationId: org.id, seats: String(seats) },
  });

  return NextResponse.json({ ok: true, subscriptionId: updated.id, seats });
});

export const dynamic = 'force-dynamic';
