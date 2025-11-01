import { NextResponse } from 'next/server';

import { ApiErrors } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { stripe as stripeSdk } from '@/lib/stripe';

export const POST = withErrorHandling(async (request: Request) => {
  if (!stripeSdk) return ApiErrors.internal('Stripe not configured');
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return ApiErrors.badRequest('Missing webhook signature or secret');

  let event;
  const raw = await request.text();
  try {
    event = stripeSdk.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as any;
        const orgId = sess.metadata?.organizationId || sess.subscription_metadata?.organizationId;
        if (orgId) {
          const tier = (sess.metadata?.tier || 'BUSINESS') as 'BUSINESS' | 'ENTERPRISE';
          // If a trial is present on the created subscription, set trialEndsAt accordingly; otherwise set to now
          let trialEnd: Date | null = null;
          try {
            if (sess.subscription) {
              const subId =
                typeof sess.subscription === 'string' ? sess.subscription : sess.subscription.id;
              // @ts-ignore
              const sub = await stripeSdk.subscriptions.retrieve(subId);
              if (sub?.trial_end) trialEnd = new Date((sub.trial_end as number) * 1000);
            }
          } catch {}
          await prisma.organization.update({
            where: { id: orgId },
            data: { planTier: tier, trialEndsAt: trialEnd || new Date() },
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as any;
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          const tier = (sub.metadata?.tier || 'BUSINESS') as 'BUSINESS' | 'ENTERPRISE';
          // Persist seat quantity to metadata for visibility
          const quantity = Number(sub.items?.data?.[0]?.quantity || 1);
          await prisma.organization.update({ where: { id: orgId }, data: { planTier: tier } });
          // Optionally: store seat count in a future column; for now, no schema change
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const orgId = sub.metadata?.organizationId;
        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: { planTier: 'FREE' as any },
          });
        }
        break;
      }
    }
  } catch (e) {
    logger.error({ err: e }, 'Stripe webhook handler failed');
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ received: true });
});

export const dynamic = 'force-dynamic';
