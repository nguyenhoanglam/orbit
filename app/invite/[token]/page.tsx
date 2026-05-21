import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  // Look up invite
  const { data: invite } = await supabase
    .from('team_invites')
    .select('id, team_id, email, role, expires_at, accepted_at, teams(slug)')
    .eq('token', token)
    .maybeSingle() as {
      data: {
        id: string
        team_id: string
        email: string
        role: string
        expires_at: string
        accepted_at: string | null
        teams: { slug: string } | null
      } | null
      error: unknown
    }

  if (!invite) {
    redirect('/login?error=invalid_invite')
  }

  if (invite.accepted_at) {
    redirect(`/${invite.teams?.slug ?? ''}`)
  }

  if (new Date(invite.expires_at) < new Date()) {
    redirect('/login?error=expired_invite')
  }

  // Accept invite: add member and mark accepted
  await supabase.from('team_members').upsert(
    { team_id: invite.team_id, user_id: user.id, role: invite.role as 'admin' | 'member' | 'viewer' },
    { onConflict: 'team_id,user_id', ignoreDuplicates: true }
  )

  await supabase
    .from('team_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  redirect(`/${invite.teams?.slug ?? ''}`)
}
