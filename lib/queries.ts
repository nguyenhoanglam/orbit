import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Fetch all teams for the current user */
export async function getUserTeams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('team_members')
    .select('role, teams(id, name, slug, logo_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }) as {
      data: Array<{
        role: string
        teams: { id: string; name: string; slug: string; logo_url: string | null } | null
      }> | null
      error: unknown
    }

  return (data ?? [])
    .filter((m) => m.teams !== null)
    .map((m) => ({ ...m.teams!, role: m.role as 'admin' | 'member' | 'viewer' }))
}

/** Fetch the current user profile */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return profile
}

/** Fetch team data + workspaces + boards for a given slug */
export async function getTeamData(teamSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, slug, logo_url')
    .eq('slug', teamSlug)
    .single()

  if (!team) redirect('/')

  // Verify membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect('/')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('team_id', team.id)
    .order('created_at', { ascending: true })

  const { data: boards } = await supabase
    .from('boards')
    .select('id, name, description, position, workspace_id')
    .eq('team_id', team.id)
    .order('position', { ascending: true })

  return {
    team,
    membership: { id: membership.id, role: membership.role as 'admin' | 'member' | 'viewer' },
    workspaces: workspaces ?? [],
    boards: boards ?? [],
  }
}

/** Get team members with profiles */
export async function getTeamMembers(teamId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('team_members')
    .select('id, role, created_at, profiles(id, display_name, email, avatar_url)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true }) as {
      data: Array<{
        id: string
        role: string
        created_at: string
        profiles: { id: string; display_name: string | null; email: string; avatar_url: string | null } | null
      }> | null
      error: unknown
    }

  return (data ?? []).filter((m) => m.profiles !== null)
}

/** Get pending invites for a team */
export async function getPendingInvites(teamId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('team_invites')
    .select('id, email, role, expires_at, created_at')
    .eq('team_id', teamId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return data ?? []
}
