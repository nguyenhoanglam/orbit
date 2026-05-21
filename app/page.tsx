import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user has a team
  const { data: members } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)

  const teamId = (members as Array<{ team_id: string }> | null)?.[0]?.team_id

  if (!teamId) redirect('/onboarding')

  const { data: teams } = await supabase
    .from('teams')
    .select('slug')
    .eq('id', teamId)
    .limit(1)

  const teamSlug = (teams as Array<{ slug: string }> | null)?.[0]?.slug

  if (!teamSlug) redirect('/onboarding')

  redirect(`/${teamSlug}`)
}
