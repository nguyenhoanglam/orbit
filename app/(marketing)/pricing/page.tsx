import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PricingSection } from '@/components/marketing/PricingSection'

export const metadata = {
  title: 'Pricing — Orbit',
  description: 'Simple, transparent pricing for every team size.',
}

const COMPARISON_FEATURES = [
  { feature: 'Kanban boards', lite: '3 boards', pro: 'Unlimited' },
  { feature: 'Team members', lite: '5 members', pro: 'Unlimited' },
  { feature: 'Drag & drop reordering', lite: true, pro: true },
  { feature: 'Task management', lite: true, pro: true },
  { feature: 'Labels & priorities', lite: true, pro: true },
  { feature: 'Member invites', lite: true, pro: true },
  { feature: 'AI task description generation', lite: false, pro: true },
  { feature: 'AI task breakdown', lite: false, pro: true },
  { feature: 'Priority support', lite: false, pro: true },
  { feature: 'Custom roles', lite: false, pro: true },
]

const FAQ = [
  {
    q: 'Can I try Pro before paying?',
    a: 'Yes — the Lite plan is free forever and you can upgrade at any time. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards via Stripe. Enterprise customers can arrange invoicing.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel from the Billing page inside the app. You keep access until the end of your billing period.',
  },
  {
    q: 'What counts as a "board"?',
    a: 'Each kanban board you create counts toward your limit. On Lite you can have up to 3 active boards per team.',
  },
  {
    q: 'Is there a team/enterprise plan?',
    a: 'Not yet — but reach out at hello@orbit.so and we\'ll work something out for larger teams.',
  },
]

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-zinc-300">{value}</span>
  }
  if (value) {
    return <Check className="mx-auto h-4 w-4 text-[#818CF8]" />
  }
  return <Minus className="mx-auto h-4 w-4 text-zinc-700" />
}

export default function PricingPage() {
  return (
    <div className="bg-[#09090B]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[#5E6AD2]/10 to-transparent" />
        <div className="relative mx-auto max-w-2xl px-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#5E6AD2]">
            Pricing
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, transparent
            <br />
            <span className="text-zinc-400">pricing for any team.</span>
          </h1>
          <p className="mt-4 text-zinc-400">
            Start free. No credit card required. Upgrade when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <PricingSection showHeading={false} />

      {/* Comparison table */}
      <section className="relative py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-10 text-center text-xl font-semibold text-white">
            Full feature comparison
          </h2>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-white/[0.08] bg-white/[0.02] px-6 py-3">
              <div className="text-xs font-medium uppercase tracking-widest text-zinc-600">Feature</div>
              <div className="text-center text-xs font-medium uppercase tracking-widest text-zinc-600">Lite</div>
              <div className="text-center text-xs font-medium uppercase tracking-widest text-[#5E6AD2]">Pro</div>
            </div>

            {/* Rows */}
            {COMPARISON_FEATURES.map(({ feature, lite, pro }, i) => (
              <div
                key={feature}
                className={`grid grid-cols-3 items-center px-6 py-4 ${
                  i !== COMPARISON_FEATURES.length - 1 ? 'border-b border-white/[0.05]' : ''
                } hover:bg-white/[0.02]`}
              >
                <span className="text-sm text-zinc-400">{feature}</span>
                <div className="text-center">
                  <Cell value={lite} />
                </div>
                <div className="text-center">
                  <Cell value={pro} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-10 text-center text-xl font-semibold text-white">
            Frequently asked questions
          </h2>

          <div className="space-y-1">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer select-none items-center justify-between gap-4 py-4 text-sm font-medium text-white">
                  {q}
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-zinc-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5E6AD2] opacity-[0.06] blur-[120px]" />
        <div className="relative mx-auto max-w-xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to get in orbit?
          </h2>
          <p className="mt-3 text-zinc-400">
            Join hundreds of teams already shipping faster with Orbit.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              render={<Link href="/signup" />}
              size="lg"
              className="h-11 bg-[#5E6AD2] px-8 text-white hover:bg-[#6E7AE2] shadow-[0_0_24px_rgba(94,106,210,0.4)]"
            >
              Start for free
            </Button>
            <Button
              render={<Link href="/login" />}
              variant="ghost"
              size="lg"
              className="h-11 border border-white/[0.08] px-8 text-zinc-300 hover:border-white/[0.15] hover:text-white hover:bg-white/[0.04]"
            >
              Log in
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
