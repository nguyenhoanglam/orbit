'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: 'https://github.com', label: 'GitHub' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#5E6AD2] shadow-[0_0_16px_rgba(94,106,210,0.5)] transition-shadow group-hover:shadow-[0_0_24px_rgba(94,106,210,0.7)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white" />
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Orbit</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/login" />}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            Log in
          </Button>
          <Button
            render={<Link href="/signup" />}
            size="sm"
            className="bg-white text-[#09090B] hover:bg-zinc-100 font-medium shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            Get started free
          </Button>
        </div>
      </nav>
    </header>
  )
}
