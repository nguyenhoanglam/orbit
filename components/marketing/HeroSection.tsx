import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Background dot grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Violet glow orb — top center */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#5E6AD2] opacity-[0.12] blur-[120px]" />

      {/* Indigo glow orb — bottom left */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600 opacity-[0.08] blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-zinc-400 backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5E6AD2] shadow-[0_0_6px_#5E6AD2]" />
          AI-powered project management · Now in beta
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white">
          Ship work,
          <br />
          <span className="bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            not status updates.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Orbit is the project management tool built for teams who move fast.
          Drag-and-drop kanban, AI-assisted workflows, and real-time collaboration — all in one focused workspace.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            render={<Link href="/signup" />}
            size="lg"
            className="h-11 bg-[#5E6AD2] px-6 text-white hover:bg-[#6E7AE2] shadow-[0_0_24px_rgba(94,106,210,0.4)] hover:shadow-[0_0_32px_rgba(94,106,210,0.6)] transition-all"
          >
            Start for free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            render={<Link href="/pricing" />}
            variant="ghost"
            size="lg"
            className="h-11 border border-white/[0.08] px-6 text-zinc-300 hover:border-white/[0.15] hover:text-white hover:bg-white/[0.04]"
          >
            See pricing
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-600">
          {[
            ['500+', 'teams onboard'],
            ['99.9%', 'uptime SLA'],
            ['4.9/5', 'avg rating'],
          ].map(([stat, label]) => (
            <div key={stat} className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold text-zinc-300">{stat}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent" />
    </section>
  )
}
