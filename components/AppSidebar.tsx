'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Settings,
  ChevronDown,
  Plus,
  Check,
  LogOut,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { logout } from '@/lib/actions/auth'

interface Team {
  id: string
  name: string
  slug: string
  logo_url: string | null
  role: 'admin' | 'member' | 'viewer'
}

interface Profile {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
}

interface Board {
  id: string
  name: string
  workspace_id: string
}

interface AppSidebarProps {
  teams: Team[]
  currentTeam: Team
  boards: Board[]
  profile: Profile
}

function initials(name: string | null, email: string) {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function AppSidebar({ teams, currentTeam, boards, profile }: AppSidebarProps) {
  const { teamSlug } = useParams<{ teamSlug: string }>()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Team switcher */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-1 items-center gap-2 rounded-md px-1 py-1 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default outline-none">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[10px]">{currentTeam.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-left">{currentTeam.name}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {teams.map((t) => (
              <DropdownMenuItem key={t.id} render={<Link href={`/${t.slug}`} />} className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[9px]">{t.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{t.name}</span>
                {t.slug === teamSlug && <Check className="h-3 w-3" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/onboarding" />} className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Create team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <NavItem href={`/${teamSlug}`} active={isActive(`/${teamSlug}`)}>
          <LayoutDashboard className="h-4 w-4" />
          Boards
        </NavItem>

        {boards.length > 0 && (
          <div className="mt-1">
            {boards.map((b) => (
              <NavItem
                key={b.id}
                href={`/${teamSlug}/boards/${b.id}`}
                active={pathname.startsWith(`/${teamSlug}/boards/${b.id}`)}
                indent
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span className="truncate">{b.name}</span>
              </NavItem>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2">
          <NavItem href={`/${teamSlug}/billing`} active={pathname.startsWith(`/${teamSlug}/billing`)}>
            <CreditCard className="h-4 w-4" />
            Billing
          </NavItem>
          <NavItem href={`/${teamSlug}/settings`} active={pathname.startsWith(`/${teamSlug}/settings`)}>
            <Settings className="h-4 w-4" />
            Settings
          </NavItem>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default outline-none">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-[11px]">{initials(profile.display_name, profile.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-xs font-medium">{profile.display_name ?? profile.email}</p>
              {profile.display_name && (
                <p className="truncate text-[11px] text-muted-foreground">{profile.email}</p>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action={logout} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 text-sm">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  active,
  indent,
  children,
}: {
  href: string
  active: boolean
  indent?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        indent && 'pl-5',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      {children}
    </Link>
  )
}


