'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Invite {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

interface PendingInvitesTableProps {
  invites: Invite[]
  teamSlug: string
}

export function PendingInvitesTable({ invites, teamSlug }: PendingInvitesTableProps) {
  const router = useRouter()

  async function revokeInvite(id: string) {
    const supabase = createClient()
    await supabase.from('team_invites').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm">{invite.email}</p>
            <p className="text-xs text-muted-foreground">
              Expires {new Date(invite.expires_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline" className="text-xs capitalize">{invite.role}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => revokeInvite(invite.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
