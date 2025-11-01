import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { ApiErrors } from '@/lib/api-response';
import { auth } from '@/lib/better-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { stripe } from '@/lib/stripe';

export const POST = withErrorHandling(async (request: Request) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!membership?.organization) return ApiErrors.unauthorized();
  const org = membership.organization;
  // Accept JSON or form submissions
  let body = {} as {
    tier: 'BUSINESS' | 'ENTERPRISE';
    seats: number;
    successUrl?: string;
    cancelUrl?: string;
    trialDays?: number;
  };
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await request.json().catch(() => ({}));
  } else {
    try {
      const form = await request.formData();
      body = {
        tier: String(form.get('tier') || 'BUSINESS').toUpperCase() as any,
        seats: Number(form.get('seats') || 1),
        successUrl: form.get('successUrl') ? String(form.get('successUrl')) : undefined,
        cancelUrl: form.get('cancelUrl') ? String(form.get('cancelUrl')) : undefined,
        trialDays: form.get('trialDays') ? Number(form.get('trialDays')) : undefined,
      };
    } catch {}
  }
  // Seat quantity defaults to current org member count if not provided
  const memberCount = await prisma.organizationMember.count({ where: { organizationId: org.id } });
  const seats = Math.max(1, Math.min(1000, Number(body.seats || memberCount || 1)));
  if (body.tier !== 'BUSINESS' && body.tier !== 'ENTERPRISE')
    return ApiErrors.badRequest('Invalid tier');

  if (!stripe) return ApiErrors.internal('Stripe not configured');

  // Ensure or create Stripe customer associated with organization
  let customerId = (org as any).stripeCustomerId as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    try {
      await prisma.organization.update({
        where: { id: org.id },
        data: { /* @ts-ignore */ stripeCustomerId: customerId } as any,
      });
    } catch {
      // schema may be out of sync locally; proceed without persisting
    }
  }

  // Resolve a Stripe Price ID. Prefer STRIPE_PRICE_*, but allow STRIPE_PRODUCT_* fallback (grab default or first active recurring price)
  async function resolvePriceId(): Promise<string | null> {
    const direct =
      body.tier === 'BUSINESS'
        ? process.env.STRIPE_PRICE_BUSINESS
        : process.env.STRIPE_PRICE_ENTERPRISE;
    if (direct) return direct;
    const prodId =
      body.tier === 'BUSINESS'
        ? process.env.STRIPE_PRODUCT_BUSINESS
        : process.env.STRIPE_PRODUCT_ENTERPRISE;
    if (!prodId) return null;
    try {
      const product = await stripe.products.retrieve(prodId);
      const def = product.default_price;
      if (typeof def === 'string' && def) return def;
      const prices = await stripe.prices.list({
        product: prodId,
        active: true,
        type: 'recurring',
        limit: 1,
      });
      return prices.data[0]?.id || null;
    } catch {
      return null;
    }
  }

  const priceId = await resolvePriceId();
  if (!priceId) return NextResponse.json({ error: 'Missing price' }, { status: 400 });

  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: seats,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 },
      },
    ],
    allow_promotion_codes: true,
    success_url:
      body.successUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?paid=1`,
    cancel_url:
      body.cancelUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=1`,
    subscription_data: {
      // If a trial is requested, apply it here so Checkout creates the subscription with a trial period
      trial_period_days:
        typeof body.trialDays === 'number' && body.trialDays > 0
          ? Math.min(30, Math.max(1, Math.floor(body.trialDays)))
          : undefined,
      metadata: { organizationId: org.id, tier: body.tier, seats: String(seats) },
    },
    metadata: { organizationId: org.id, tier: body.tier, seats: String(seats) },
  });

  return NextResponse.json({ checkoutUrl: sessionCheckout.url });
});
