import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAN_DISPLAY } from '@/lib/plans'

interface PricingSectionProps {
  /** When true, shows the section wrapper with heading — used on the landing page */
  showHeading?: boolean
}

export function PricingSection({ showHeading = true }: PricingSectionProps) {
  return (
    <section className="relative bg-[#09090B] py-24">
      {/* Subtle top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Accent glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5E6AD2] opacity-[0.05] blur-[140px]" />

      <div className="relative mx-auto max-w-4xl px-6">
        {showHeading && (
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#5E6AD2]">
              Pricing
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Simple, transparent pricing.
            </h2>
            <p className="mt-3 text-zinc-400">
              Start free. Upgrade when your team is ready.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Lite plan */}
          <div className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
            <div className="mb-6">
              <p className="text-sm font-semibold text-white">{PLAN_DISPLAY.lite.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">Free</span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">{PLAN_DISPLAY.lite.description}</p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PLAN_DISPLAY.lite.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              render={<Link href="/signup" />}
              variant="outline"
              className="w-full border-white/[0.1] bg-transparent text-white hover:bg-white/[0.06] hover:border-white/[0.2]"
            >
              Get started free
            </Button>
          </div>

          {/* Pro plan */}
          <div className="relative flex flex-col rounded-2xl border border-[#5E6AD2]/60 bg-[#5E6AD2]/[0.06] p-7 shadow-[0_0_0_1px_rgba(94,106,210,0.1),0_0_60px_rgba(94,106,210,0.12)]">
            {/* Recommended badge */}
            <div className="absolute -top-3 left-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#5E6AD2] px-2.5 py-0.5 text-xs font-medium text-white shadow-[0_0_12px_rgba(94,106,210,0.5)]">
                <Zap className="h-2.5 w-2.5" />
                Recommended
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-white">{PLAN_DISPLAY.pro.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">$12</span>
                <span className="text-sm text-zinc-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{PLAN_DISPLAY.pro.description}</p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PLAN_DISPLAY.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#818CF8]" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              render={<Link href="/signup" />}
              className="w-full bg-[#5E6AD2] text-white hover:bg-[#6E7AE2] shadow-[0_0_20px_rgba(94,106,210,0.4)]"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start with Pro
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          No credit card required to start. Payments are processed securely by Stripe.
        </p>
      </div>
    </section>
  )
}
