import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createCheckoutSession, createPortalSession } from '@/lib/actions/billing'
import { PLAN_DISPLAY, getLimits } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

interface Props {
  params: Promise<{ teamSlug: string }>
  searchParams: Promise<{ success?: string }>
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { teamSlug } = await params
  const { success } = await searchParams
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, stripe_customer_id')
    .eq('slug', teamSlug)
    .single()

  if (!team) redirect(`/${teamSlug}`)

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('team_id', team.id)
    .single()

  const currentPlan: Plan = (subscription?.plan ?? 'lite') as Plan
  const currentStatus = subscription?.status ?? 'active'
  const isActive = currentStatus === 'active' || currentStatus === 'trialing'

  const checkoutAction = createCheckoutSession.bind(null, teamSlug)
  const portalAction = createPortalSession.bind(null, teamSlug)

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details for {team.name}.
        </p>
      </div>

      {success === 'true' && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You&apos;re now on the Pro plan. Enjoy unlimited boards, members, and AI features!
        </div>
      )}

      {/* Current plan */}
      <div className="mb-8 rounded-xl border border-border p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium">Current plan</h2>
              <Badge variant={currentPlan === 'pro' ? 'default' : 'outline'} className="capitalize">
                {currentPlan}
              </Badge>
              {!isActive && currentPlan === 'pro' && (
                <Badge variant="outline" className="capitalize text-destructive border-destructive">
                  {currentStatus}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlan === 'pro'
                ? subscription?.cancel_at_period_end
                  ? `Your subscription ends on ${new Date(subscription.current_period_end!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : `Next billing date: ${new Date(subscription?.current_period_end ?? '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'You are on the free Lite plan.'}
            </p>
          </div>

          {currentPlan === 'pro' && team.stripe_customer_id && (
            <form action={portalAction}>
              <Button type="submit" variant="outline" size="sm">
                Manage subscription
              </Button>
            </form>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {([
            ['Max boards', getLimits(currentPlan).maxBoards ?? 'Unlimited'],
            ['Max members', getLimits(currentPlan).maxMembers ?? 'Unlimited'],
            ['AI features', getLimits(currentPlan).aiEnabled ? 'Enabled' : 'Not available'],
          ] as const).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan comparison */}
      <h2 className="mb-4 text-base font-medium">Plans</h2>
      <div className="grid grid-cols-2 gap-4">
        {(['lite', 'pro'] as const).map((plan) => {
          const display = PLAN_DISPLAY[plan]
          const isCurrent = currentPlan === plan && isActive

          return (
            <div
              key={plan}
              className={`relative rounded-xl border p-5 ${
                plan === 'pro' ? 'border-primary' : 'border-border'
              }`}
            >
              {plan === 'pro' && (
                <div className="absolute -top-2.5 left-4">
                  <Badge className="gap-1 text-xs">
                    <Zap className="h-3 w-3" />
                    Recommended
                  </Badge>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-semibold">{display.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {plan === 'pro' ? '$12' : 'Free'}
                  </span>
                  {plan === 'pro' && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{display.description}</p>
              </div>

              <ul className="mb-5 space-y-2">
                {display.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" disabled className="w-full">
                  Current plan
                </Button>
              ) : plan === 'pro' ? (
                <form action={checkoutAction}>
                  <Button type="submit" className="w-full gap-1.5">
                    <Zap className="h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </form>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  Downgrade to Lite
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        To downgrade or cancel your subscription, use the{' '}
        <span className="underline">Manage subscription</span> button above.
        Payments are processed securely by Stripe.
      </p>
    </div>
  )
}
