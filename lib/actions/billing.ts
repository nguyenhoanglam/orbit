'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function createCheckoutSession(teamSlug: string): Promise<never> {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, stripe_customer_id')
    .eq('slug', teamSlug)
    .single()

  if (!team) redirect(`/${teamSlug}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  let customerId = team.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: team.name,
      metadata: { team_id: team.id, team_slug: teamSlug },
    })
    customerId = customer.id

    await supabase
      .from('teams')
      .update({ stripe_customer_id: customerId })
      .eq('id', team.id)
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    throw new Error('STRIPE_PRO_PRICE_ID is not configured')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/${teamSlug}/billing?success=true`,
    cancel_url: `${origin}/${teamSlug}/billing`,
    metadata: { team_id: team.id, team_slug: teamSlug },
    subscription_data: {
      metadata: { team_id: team.id, team_slug: teamSlug },
    },
  })

  if (!session.url) throw new Error('Stripe session URL is missing')
  redirect(session.url)
}

export async function createPortalSession(teamSlug: string): Promise<never> {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: team } = await supabase
    .from('teams')
    .select('stripe_customer_id')
    .eq('slug', teamSlug)
    .single()

  if (!team?.stripe_customer_id) redirect(`/${teamSlug}/billing`)

  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripe_customer_id,
    return_url: `${origin}/${teamSlug}/billing`,
  })

  redirect(session.url)
}
