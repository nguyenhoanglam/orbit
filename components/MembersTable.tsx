'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { updateMemberRole, removeMember } from '@/lib/actions/team'

interface Member {
  id: string
  role: string
  created_at: string
  profiles: {
    id: string
    display_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

interface MembersTableProps {
  members: Member[]
  teamSlug: string
  isAdmin: boolean
}

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  member: 'bg-muted text-muted-foreground',
  viewer: 'bg-muted text-muted-foreground',
}

function initials(name: string | null, email: string) {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function MembersTable({ members, teamSlug, isAdmin }: MembersTableProps) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {members.map((m) => {
        const p = m.profiles!
        return (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials(p.display_name, p.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{p.display_name ?? p.email}</p>
              {p.display_name && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
            </div>

            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />} className="h-7 gap-1 text-xs capitalize">
                  {m.role} <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(['admin', 'member', 'viewer'] as const).map((role) => (
                    <DropdownMenuItem key={role}>
                      <form action={async (fd) => { await updateMemberRole(fd) }} className="w-full">
                        <input type="hidden" name="memberId" value={m.id} />
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="teamSlug" value={teamSlug} />
                        <button type="submit" className="w-full text-left capitalize">{role}</button>
                      </form>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <form action={removeMember} className="w-full">
                      <input type="hidden" name="memberId" value={m.id} />
                      <input type="hidden" name="teamSlug" value={teamSlug} />
                      <button type="submit" className="w-full text-left">Remove</button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge className={`text-xs capitalize ${roleColors[m.role] ?? ''}`} variant="outline">
                {m.role}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
