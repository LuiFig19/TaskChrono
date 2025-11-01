import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/better-auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/route-helpers';
import { stripe } from '@/lib/stripe';

export const POST = withErrorHandling(async (req: Request) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      plan?: string;
      emails?: string;
    };
    const name = String(body?.name || '').trim();
    const plan = String(body?.plan || 'FREE').toUpperCase();
    const emailCsv = String(body?.emails || '').trim();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const userId = session.user.id;
    // Create organization and membership
    let org: { id: string; name: string } | null = null;
    try {
      org = (await prisma.organization.create({
        data: {
          name,
          planTier: plan as any,
          trialEndsAt: plan === 'FREE' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdById: userId,
          members: { create: { userId, role: 'OWNER' as any } },
        },
      })) as any;
    } catch {
      // If DB missing, just head to dashboard shell
      return NextResponse.json({ redirect: '/dashboard' });
    }

    if (!org) {
      return NextResponse.json({ error: 'Organization creation failed' }, { status: 500 });
    }

    // Parse invite emails and queue placeholder tasks (best-effort)
    const invites = emailCsv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /.+@.+\..+/.test(e));
    try {
      if (invites.length) {
        const project = await prisma.project.create({
          data: { name: 'Invites', organizationId: org.id },
        });
        await prisma.task.createMany({
          data: invites.map((e) => ({
            organizationId: org.id,
            projectId: project.id,
            title: `INVITE:${e}`,
          })),
          skipDuplicates: true,
        });
      }
    } catch {}

    if (plan === 'FREE' || plan === 'CUSTOM') {
      return NextResponse.json({ redirect: '/dashboard' });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    // Resolve price
    let priceId =
      plan === 'BUSINESS'
        ? process.env.STRIPE_PRICE_BUSINESS || ''
        : process.env.STRIPE_PRICE_ENTERPRISE || '';
    if (!priceId) {
      const productId =
        plan === 'BUSINESS'
          ? process.env.STRIPE_PRODUCT_BUSINESS || process.env.STRIPE_PRODUCT_ID_BUSINESS || ''
          : process.env.STRIPE_PRODUCT_ENTERPRISE || process.env.STRIPE_PRODUCT_ID_ENTERPRISE || '';
      if (productId) {
        try {
          const prices = await stripe!.prices.list({
            active: true,
            product: productId,
            limit: 100,
          });
          const monthly =
            prices.data.find((p: any) => p.recurring?.interval === 'month') || prices.data[0];
          if (monthly?.id) priceId = monthly.id;
        } catch {}
      }
    }
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price ID missing' }, { status: 500 });
    }

    const seats = 1;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Get user email for Stripe checkout
    const user = await prisma.user
      .findUnique({ where: { id: userId }, select: { email: true } })
      .catch(() => null);

    // Create a temporary activation token that survives the Stripe redirect
    const activationToken = Buffer.from(
      JSON.stringify({
        userId,
        orgId: org.id,
        exp: Date.now() + 3600000, // 1 hour
      }),
    ).toString('base64url');

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user?.email || undefined,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: seats }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/onboarding/activation?token=${activationToken}&plan=${plan}`,
      cancel_url: `${appUrl}/onboarding?plan=${plan}`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { organizationId: org.id, tier: plan, seats: String(seats), userId },
      },
      metadata: { organizationId: org.id, tier: plan, seats: String(seats), userId },
    });
    return NextResponse.json({ redirect: checkout.url || '/dashboard' });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to start onboarding' },
      { status: 500 },
    );
  }
});
