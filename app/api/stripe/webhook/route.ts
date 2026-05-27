import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.metadata?.team_id) {
          await handleSubscriptionChange(
            supabase,
            session.subscription as string,
            session.metadata.team_id
          )
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const teamId = sub.metadata?.team_id
        if (teamId) await upsertSubscription(supabase, sub, teamId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const teamId = sub.metadata?.team_id
        if (teamId) {
          await supabase
            .from('subscriptions')
            .update({
              plan: 'lite',
              status: 'canceled',
              cancel_at_period_end: false,
              stripe_subscription_id: null,
              stripe_price_id: null,
            })
            .eq('team_id', teamId)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Handler error: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createServiceClient>,
  subscriptionId: string,
  teamId: string
) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  await upsertSubscription(supabase, sub, teamId)
}

async function upsertSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription,
  teamId: string
) {
  const status = sub.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  const item = sub.items.data[0]
  const priceId = item?.price.id ?? null
  const isProPrice = priceId === process.env.STRIPE_PRO_PRICE_ID
  const plan = isProPrice && (status === 'active' || status === 'trialing') ? 'pro' : 'lite'

  // current_period_start/end moved to SubscriptionItem in API 2026-04-22.dahlia
  const periodStart = item?.current_period_start
  const periodEnd = item?.current_period_end

  await supabase.from('subscriptions').upsert(
    {
      team_id: teamId,
      plan,
      status,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: 'team_id' }
  )
}
