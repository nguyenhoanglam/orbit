import { redirect } from 'next/navigation'
import { getCurrentUser, getUserTeams } from '@/lib/queries'

interface Props {
  children: React.ReactNode
  params: Promise<{ teamSlug: string }>
}

export default async function AppLayout({ children, params }: Props) {
  const { teamSlug } = await params

  const [profile, teams] = await Promise.all([getCurrentUser(), getUserTeams()])

  const currentTeam = teams.find((t) => t.slug === teamSlug)
  if (!currentTeam) redirect('/')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar is a Client Component — import dynamically to keep layout as Server Component */}
      <AppSidebarLoader
        teams={teams}
        currentTeam={currentTeam}
        profile={profile!}
        teamSlug={teamSlug}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

// Thin server-side wrapper that passes data to the client sidebar
import { AppSidebar } from '@/components/AppSidebar'
import { getTeamData } from '@/lib/queries'

async function AppSidebarLoader({
  teams,
  currentTeam,
  profile,
  teamSlug,
}: {
  teams: { id: string; name: string; slug: string; logo_url: string | null; role: 'admin' | 'member' | 'viewer' }[]
  currentTeam: { id: string; name: string; slug: string; logo_url: string | null; role: 'admin' | 'member' | 'viewer' }
  profile: { id: string; display_name: string | null; email: string; avatar_url: string | null }
  teamSlug: string
}) {
  const { boards } = await getTeamData(teamSlug)
  return <AppSidebar teams={teams} currentTeam={currentTeam} boards={boards} profile={profile} />
}
