import Link from 'next/link'

const FOOTER_LINKS = {
  Product: [
    { href: '/#features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/changelog', label: 'Changelog' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: 'https://github.com', label: 'GitHub' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/security', label: 'Security' },
  ],
}

export function FooterSection() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#09090B]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5E6AD2] shadow-[0_0_12px_rgba(94,106,210,0.4)]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2.5" fill="white" />
                  <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Orbit</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600">
              Project management for teams who move fast.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-600">
                {group}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row">
          <p className="text-xs text-zinc-700">© {new Date().getFullYear()} Orbit. All rights reserved.</p>
          <p className="text-xs text-zinc-700">
            Built with Next.js · Supabase · Stripe
          </p>
        </div>
      </div>
    </footer>
  )
}
