import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function forwardToPosthog(event: string, properties: Record<string, any>) {
  try {
    const token = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
    if (!token) return;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: token, event, properties }),
    });
  } catch {}
}

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 200 });

  const text = await request.text();
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(text, sig, secret);
  } catch (err) {
    logger.error({ err }, 'Stripe webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object;
        await forwardToPosthog('subscription_checkout_completed', {
          source: 'stripe',
          amount_total: (cs.amount_total || 0) / 100,
          currency: cs.currency,
          mode: cs.mode,
        });
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        await forwardToPosthog('invoice_payment_failed', {
          source: 'stripe',
          amount_due: (inv.amount_due || 0) / 100,
          currency: inv.currency,
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await forwardToPosthog('subscription_updated', {
          source: 'stripe',
          status: sub.status,
          current_period_end: sub.current_period_end,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await forwardToPosthog('subscription_canceled', {
          source: 'stripe',
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error({ err, type: event.type }, 'Stripe webhook handling error');
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}


