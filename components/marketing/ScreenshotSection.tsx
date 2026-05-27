import Image from 'next/image'

export function ScreenshotSection() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] py-24">
      {/* Violet glow under screenshot */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5E6AD2] opacity-[0.08] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#5E6AD2]">
            The product
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything your team needs,
            <br />
            <span className="text-zinc-400">nothing it doesn&apos;t.</span>
          </h2>
        </div>

        {/* Browser chrome frame */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-[#111113] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_80px_160px_-40px_rgba(0,0,0,0.8),0_0_80px_rgba(94,106,210,0.12)]">
          {/* Browser toolbar */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28CA41]" />
            </div>
            {/* URL bar */}
            <div className="flex h-6 flex-1 max-w-xs mx-auto items-center justify-center gap-1.5 rounded-md bg-white/[0.04] px-3 text-xs text-zinc-600">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M5 1a4 4 0 1 0 0 8A4 4 0 0 0 5 1z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
              </svg>
              app.orbit.so/my-team
            </div>
          </div>

          {/* Screenshot image */}
          <div className="overflow-hidden rounded-b-2xl">
            <Image
              src="/screenshots/dashboard.png"
              alt="Orbit dashboard — kanban board view"
              width={1280}
              height={720}
              className="w-full object-cover object-top"
              priority
            />
          </div>
        </div>

        {/* Reflection gradient */}
        <div className="pointer-events-none absolute inset-x-6 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-[#09090B] to-transparent" />
      </div>
    </section>
  )
}
